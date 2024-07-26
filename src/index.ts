import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import { RateLimiter } from './utils/rateLimiter';
import { HttpApi } from './utils/helpers';
import * as CONSTANTS from './types/constants';
import { CustomOperations } from './rest/custom';
import { ethers } from 'ethers';

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class Hyperliquid {
  public info: InfoAPI;
  public exchange: ExchangeAPI;
  public ws: WebSocketClient;
  public subscriptions: WebSocketSubscriptions;
  public custom: CustomOperations;

  private rateLimiter: RateLimiter;
  private assetToIndexMap: Map<string, number>;
  private refreshInterval: NodeJS.Timeout | null = null;
  private refreshIntervalMs: number = 60000;
  private initializationPromise: Promise<void>;
  private exchangeToInternalNameMap: Map<string, string>;
  private httpApi: HttpApi;
  private isValidPrivateKey: boolean = false;

  constructor(privateKey: string | null = null, testnet: boolean = false) {
    const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;

    this.refreshIntervalMs = 60000;
    this.rateLimiter = new RateLimiter();
    this.assetToIndexMap = new Map();
    this.exchangeToInternalNameMap = new Map();
    this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, this.rateLimiter);

    this.initializationPromise = this.initialize();

    this.info = new InfoAPI(baseURL, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
    this.ws = new WebSocketClient(testnet);
    this.subscriptions = new WebSocketSubscriptions(this.ws);

    //Create proxy objects for exchange and custom
    this.exchange = this.createAuthenticatedProxy(ExchangeAPI);
    this.custom = this.createAuthenticatedProxy(CustomOperations);

    if (privateKey) {
      this.initializeWithPrivateKey(privateKey, baseURL);
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

  private initializeWithPrivateKey(privateKey: string, baseURL: string): void {
    try {
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}` as `0x${string}`;
      new ethers.Wallet(formattedPrivateKey); //Validate the private key
      
      this.exchange = new ExchangeAPI(baseURL, formattedPrivateKey, this.info, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
      this.custom = new CustomOperations(this.exchange, this.info, formattedPrivateKey, this.exchangeToInternalNameMap, this.assetToIndexMap, this.initializationPromise);
      this.isValidPrivateKey = true;
    } catch (error) {
      console.warn("Invalid private key provided. Some functionalities will be limited.");
      this.isValidPrivateKey = false;
    }
  }

  private async refreshAssetToIndexMap(): Promise<void> {
    try {
      const [perpMeta, spotMeta] = await Promise.all([
        (async () => {
          const result = await this.httpApi.makeRequest({
            "type": CONSTANTS.INFO_TYPES.PERPS_META_AND_ASSET_CTXS
          });
          return result;
        })(),
        (async () => {
          const result = await this.httpApi.makeRequest({
            "type": CONSTANTS.INFO_TYPES.SPOT_META_AND_ASSET_CTXS
          });
          return result;
        })()
      ]);

      this.assetToIndexMap.clear();
      this.exchangeToInternalNameMap.clear();
      
      //Handle perpetual assets
      perpMeta[0].universe.forEach((asset: { name: string }, index: number) => {
        const internalName = `${asset.name}-PERP`;
        this.assetToIndexMap.set(internalName, index);
        this.exchangeToInternalNameMap.set(asset.name, internalName);
      });

      //Handle spot assets
      spotMeta[0].tokens.forEach((token: any) => {
        const universeItem = spotMeta[0].universe.find((item: any) => item.tokens[0] === token.index);
        if (universeItem) {
          const internalName = `${token.name}-SPOT`;
          const exchangeName = universeItem.name;
          const index = spotMeta[0].universe.indexOf(universeItem);
          this.assetToIndexMap.set(internalName, 10000 + index);
          this.exchangeToInternalNameMap.set(exchangeName, internalName);
        }
      });


    } catch (error) {
      console.error('Failed to refresh asset maps:', error);
    } finally {      

    }
  }

  public getInternalName(exchangeName: string): string | undefined {
    return this.exchangeToInternalNameMap.get(exchangeName);
  }

  public getExchangeName(internalName: string): string | undefined {
    for (const [exchangeName, name] of this.exchangeToInternalNameMap.entries()) {
      if (name === internalName) {
        return exchangeName;
      }
    }
    return undefined;
  }

  private async initialize(): Promise<void> {
    await this.refreshAssetToIndexMap();
    this.startPeriodicRefresh();
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize();
    }
    return this.initializationPromise;
  }

  private startPeriodicRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshAssetToIndexMap();
    }, this.refreshIntervalMs); //Refresh every minute
  }

  public getAssetIndex(assetSymbol: string): number | undefined {
    return this.assetToIndexMap.get(assetSymbol);
  }

  public getAllAssets(): { perp: string[], spot: string[] } {
    const perp: string[] = [];
    const spot: string[] = [];

    for (const [asset, index] of this.assetToIndexMap.entries()) {
      if (asset.endsWith('-PERP')) {
        perp.push(asset);
      } else if (asset.endsWith('-SPOT')) {
        spot.push(asset);
      }
    }

    return { perp, spot };
  }

  public isAuthenticated(): boolean {
    return this.isValidPrivateKey;
  }

  async connect(): Promise<void> {
    await this.ws.connect();
    if (!this.isValidPrivateKey) {
      console.warn("Not authenticated. Some WebSocket functionalities may be limited.");
    }
  }

  disconnect(): void {
    this.ws.close();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export * from './types';
export * from './utils/signing';