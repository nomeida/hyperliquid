import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import { RateLimiter } from './utils/rateLimiter';
import * as CONSTANTS from './types/constants';
import { CustomOperations } from './rest/custom';
import { ethers } from 'ethers';
import { SymbolConversion } from './utils/symbolConversion';
import { AuthenticationError } from './utils/errors';



export class Hyperliquid {
  public info: InfoAPI;
  public exchange: ExchangeAPI;
  public ws: WebSocketClient;
  public subscriptions: WebSocketSubscriptions;
  public custom: CustomOperations;

  private rateLimiter: RateLimiter;
  private symbolConversion: SymbolConversion;
  private isValidPrivateKey: boolean = false;
  private walletAddress: string | null = null;
  private _initialized: boolean = false;
  private _privateKey?: string;
  private _walletAddress?: string;

  constructor(privateKey?: string, testnet: boolean = false, walletAddress?: string) {
      const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;

      this.rateLimiter = new RateLimiter();
      this.symbolConversion = new SymbolConversion(baseURL, this.rateLimiter);
      this.walletAddress = walletAddress || null;

      // Pass 'this' to InfoAPI
      this.info = new InfoAPI(baseURL, this.rateLimiter, this.symbolConversion, this);
      this.ws = new WebSocketClient(testnet);
      this.subscriptions = new WebSocketSubscriptions(this.ws, this.symbolConversion);
      
      // Create proxy objects for exchange and custom
      this.exchange = this.createAuthenticatedProxy(ExchangeAPI);
      this.custom = this.createAuthenticatedProxy(CustomOperations);

      if (privateKey) {
          this._privateKey = privateKey;
          this._walletAddress = walletAddress;
      }
  }

  public async ensureInitialized(): Promise<void> {
      if (!this._initialized) {
          await this.initialize();
          this._initialized = true;
      }
  }

  private async initialize(): Promise<void> {
      if (this._initialized) return;
      
      try {
          // Initialize symbol conversion first
          await this.symbolConversion.initialize();
          
          // Now it's safe to initialize other components
          await this.ws.connect();
          
          this._initialized = true;
      } catch (error) {
          console.error('Failed to initialize Hyperliquid:', error);
          throw error;
      }
  }

  private createAuthenticatedProxy<T extends object>(Class: new (...args: any[]) => T): T {
    return new Proxy({} as T, {
      get: (target, prop) => {
        if (!this.isValidPrivateKey) {
          throw new AuthenticationError('Invalid or missing private key. This method requires authentication.');
        }
        return target[prop as keyof T];
      }
    });
  }

  private initializeWithPrivateKey(privateKey: string, testnet: boolean = false): void {
    try {
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}` as `0x${string}`;
      new ethers.Wallet(formattedPrivateKey); // Validate the private key
      
      this.exchange = new ExchangeAPI(
          testnet, 
          formattedPrivateKey, 
          this.info, 
          this.rateLimiter, 
          this.symbolConversion, 
          this.walletAddress,
          this
      );
      this.custom = new CustomOperations(this.exchange, this.info, formattedPrivateKey, this.symbolConversion, this.walletAddress);
      this.isValidPrivateKey = true;
    } catch (error) {
      console.warn("Invalid private key provided. Some functionalities will be limited.");
      this.isValidPrivateKey = false;
    }
  }

  // Modify existing methods to check initialization
  public isAuthenticated(): boolean {
    this.ensureInitialized();
    return this.isValidPrivateKey;
}

async connect(): Promise<void> {
    await this.initialize();
    if (!this.isValidPrivateKey) {
        console.warn("Not authenticated. Some WebSocket functionalities may be limited.");
    }
}

disconnect(): void {
    this.ensureInitialized();
    this.ws.close();
}

}

export * from './types';
export * from './utils/signing';
