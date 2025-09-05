import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import {
  WebSocketPayloadManager,
  createWebSocketPayloadManager,
} from './websocket/payload-manager';
import { RateLimiter } from './utils/rateLimiter';
import * as CONSTANTS from './types/constants';
import { CustomOperations } from './rest/custom';
import { ethers } from 'ethers';
import { SymbolConversion } from './utils/symbolConversion';
import { AuthenticationError } from './utils/errors';
import { environment } from './utils/environment';

export interface HyperliquidConfig {
  enableWs?: boolean;
  privateKey?: string;
  testnet?: boolean;
  walletAddress?: string;
  vaultAddress?: string;
  maxReconnectAttempts?: number;
  disableAssetMapRefresh?: boolean;
  assetMapRefreshIntervalMs?: number;
}

export class Hyperliquid {
  public info: InfoAPI;
  public exchange: ExchangeAPI = {} as ExchangeAPI;
  public ws: WebSocketClient;
  public subscriptions: WebSocketSubscriptions;
  public wsPayloads: WebSocketPayloadManager = {} as WebSocketPayloadManager;
  public custom: CustomOperations;
  public symbolConversion: SymbolConversion;

  private rateLimiter: RateLimiter;
  private isValidPrivateKey: boolean = false;
  private walletAddress: string | null = null;
  private _initialized: boolean = false;
  private _initializing: Promise<void> | null = null;
  private _privateKey?: string;
  private _walletAddress?: string;
  private vaultAddress?: string | null = null;
  private enableWs: boolean;
  private baseUrl: string;
  private testnet: boolean;

  constructor(params: HyperliquidConfig = {}) {
    const {
      enableWs = true,
      privateKey,
      testnet = false,
      walletAddress,
      vaultAddress,
      maxReconnectAttempts,
      disableAssetMapRefresh = false,
      assetMapRefreshIntervalMs = 60000,
    } = params;

    // Browser-specific security warnings
    if (environment.isBrowser) {
      if (privateKey) {
        console.warn(
          'Warning: Storing private keys in browser environments is not recommended. Consider using a Web3 wallet provider instead.'
        );
      }
      if (!window.isSecureContext) {
        console.warn('Warning: Running in an insecure context. Some features may be limited.');
      }
    }

    this.testnet = testnet;
    this.baseUrl = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;
    this.enableWs = enableWs;
    this.rateLimiter = new RateLimiter();
    this.symbolConversion = new SymbolConversion(
      this.baseUrl,
      this.rateLimiter,
      disableAssetMapRefresh,
      assetMapRefreshIntervalMs
    );
    this.walletAddress = walletAddress || null;
    this.vaultAddress = vaultAddress || null;

    // Initialize REST API clients
    this.info = new InfoAPI(this.baseUrl, this.rateLimiter, this.symbolConversion, this);

    // Initialize custom operations
    this.custom = new CustomOperations(this);

    // Initialize WebSocket client if enabled
    if (enableWs) {
      if (!environment.hasNativeWebSocket() && environment.isNode) {
        console.warn(
          'Native WebSocket support is not available in this Node.js version. Attempting to use ws package...'
        );
      }

      // Create WebSocket client - it will attempt to use ws package if native WebSocket is not available
      this.ws = new WebSocketClient(testnet, maxReconnectAttempts);
      this.subscriptions = new WebSocketSubscriptions(this.ws, this.symbolConversion);

      // Only disable WebSocket if the client fails to initialize
      if (!environment.supportsWebSocket()) {
        console.warn(
          'WebSocket support is not available. Please install the ws package to enable WebSocket features:\n\nnpm install ws\n'
        );
        this.enableWs = false;
      }
    } else {
      // Initialize with dummy objects if WebSocket is disabled
      this.ws = {} as WebSocketClient;
      this.subscriptions = {} as WebSocketSubscriptions;
      this.wsPayloads = {} as WebSocketPayloadManager;
    }

    // Set up authentication if private key is provided
    if (privateKey) {
      this.initializeWithPrivateKey(privateKey, testnet);
    } else if (walletAddress) {
      this._walletAddress = walletAddress;
      this.walletAddress = walletAddress;
    }
  }

  public async connect(): Promise<void> {
    if (!this._initialized) {
      if (!this._initializing) {
        this._initializing = this.initialize();
      }
      await this._initializing;
    }
  }

  private async initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      // Note: SymbolConversion will be initialized lazily when first needed
      // This prevents unnecessary API calls for users who don't need symbol conversion

      // Connect WebSocket if enabled and available
      if (this.enableWs && this.ws && typeof this.ws.connect === 'function') {
        try {
          await this.ws.connect();
        } catch (wsError: unknown) {
          const errorMessage = wsError instanceof Error ? wsError.message : String(wsError);
          console.warn('Failed to establish WebSocket connection:', errorMessage);
          if (errorMessage.includes('Please install the ws package')) {
            console.warn('To enable WebSocket support, please run: npm install ws');
            this.enableWs = false;
          }
          // Don't throw here - we want to continue initialization even if WebSocket fails
        }
      } else if (this.enableWs) {
        // WebSocket was requested but not available
        console.warn('WebSocket was enabled but is not available in this environment');
        this.enableWs = false;
      }

      this._initialized = true;
      this._initializing = null;
    } catch (error) {
      this._initializing = null;
      throw error;
    }
  }

  public async ensureInitialized(): Promise<void> {
    await this.connect();
  }

  private initializePrivateKey(privateKey: string, testnet: boolean): void {
    try {
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      new ethers.Wallet(formattedPrivateKey); // Validate the private key

      this.exchange = new ExchangeAPI(
        testnet,
        formattedPrivateKey,
        this.info,
        this.rateLimiter,
        this.symbolConversion,
        this.walletAddress,
        this,
        this.vaultAddress
      );

      this.custom = new CustomOperations(
        this.exchange,
        this.info,
        formattedPrivateKey,
        this.symbolConversion,
        this.walletAddress
      );

      this.isValidPrivateKey = true;
    } catch (error) {
      console.warn('Invalid private key provided. Some functionalities will be limited.');
      this.isValidPrivateKey = false;
    }
  }

  private createAuthenticatedProxy<T extends object>(Class: new (...args: any[]) => T): T {
    return new Proxy({} as T, {
      get: (target, prop) => {
        if (!this.isValidPrivateKey) {
          throw new AuthenticationError(
            'Invalid or missing private key. This method requires authentication.'
          );
        }
        return target[prop as keyof T];
      },
    });
  }

  private initializeWithPrivateKey(privateKey: string, testnet: boolean = false): void {
    try {
      const formattedPrivateKey = privateKey.startsWith('0x')
        ? privateKey
        : (`0x${privateKey}` as `0x${string}`);
      const wallet = new ethers.Wallet(formattedPrivateKey); // Validate the private key

      this.exchange = new ExchangeAPI(
        testnet,
        formattedPrivateKey,
        this.info,
        this.rateLimiter,
        this.symbolConversion,
        this.walletAddress,
        this,
        this.vaultAddress
      );
      this.custom = new CustomOperations(
        this.exchange,
        this.info,
        formattedPrivateKey,
        this.symbolConversion,
        this.walletAddress
      );

      // Initialize WebSocket payload manager if WebSocket is enabled
      if (this.enableWs && this.subscriptions) {
        this.wsPayloads = createWebSocketPayloadManager({
          wallet,
          isMainnet: !testnet,
          symbolConversion: this.symbolConversion,
          subscriptions: this.subscriptions,
          vaultAddress: this.vaultAddress,
          generateNonce: () => Date.now(),
          customOperations: this.custom,
        });
      }

      this.isValidPrivateKey = true;
    } catch (error) {
      console.warn('Invalid private key provided. Some functionalities will be limited.');
      this.isValidPrivateKey = false;
    }
  }

  // Modify existing methods to check initialization
  public isAuthenticated(): boolean {
    // Don't call ensureInitialized() here as it can cause issues during construction
    // The authentication state is set during construction and doesn't require async initialization
    return this.isValidPrivateKey;
  }

  public isWebSocketConnected(): boolean {
    return this.enableWs && this.ws && typeof this.ws.isConnected === 'function'
      ? this.ws.isConnected()
      : false;
  }

  public isWebSocketEnabled(): boolean {
    return this.enableWs && this.ws && typeof this.ws.connect === 'function';
  }

  disconnect(): void {
    // Stop the asset map refresh interval
    this.symbolConversion.stopPeriodicRefresh();

    // Close WebSocket connection if enabled
    if (this.enableWs && this.ws && typeof this.ws.close === 'function') {
      this.ws.close(true); // Pass true to indicate manual disconnect
    }

    // Reset initialization state
    this._initialized = false;
    this._initializing = null;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  // Asset map refresh control methods
  public enableAssetMapRefresh(): void {
    this.symbolConversion.enablePeriodicRefresh();
  }

  public disableAssetMapRefresh(): void {
    this.symbolConversion.disablePeriodicRefresh();
  }

  public isAssetMapRefreshEnabled(): boolean {
    return this.symbolConversion.isRefreshEnabled();
  }

  public getAssetMapRefreshInterval(): number {
    return this.symbolConversion.getRefreshInterval();
  }

  public setAssetMapRefreshInterval(intervalMs: number): void {
    this.symbolConversion.setRefreshInterval(intervalMs);
  }

  public async refreshAssetMapsNow(): Promise<void> {
    await this.symbolConversion.initialize();
  }
}

export * from './types';
export * from './utils/signing';
export * from './types/constants';
