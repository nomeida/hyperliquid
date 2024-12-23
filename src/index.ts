import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import { RateLimiter } from './utils/rateLimiter';
import { HttpApi } from './utils/helpers';
import * as CONSTANTS from './types/constants';

import {
  CustomOperations
} from './rest/custom';

export class Hyperliquid {
  public info: InfoAPI;
  public exchange: ExchangeAPI;
  public ws: WebSocketClient;
  public subscriptions: WebSocketSubscriptions;
  private rateLimiter: RateLimiter;
  private assetToIndexMap: Map<string, number>;
  private refreshInterval: NodeJS.Timeout | null = null;
  private refreshIntervalMs: number = 60000;
  private initializationPromise: Promise<void> | null = null;
  private exchangeToInternalNameMap: Map<string, string>;
  private httpApi: HttpApi;
  public custom: CustomOperations;

  constructor(privateKey: string, testnet: boolean = false) {
    const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;

    this.refreshIntervalMs = 60000;
    
    this.rateLimiter = new RateLimiter(); // 1200 tokens per minute
    this.assetToIndexMap = new Map();

    this.assetToIndexMap = new Map();
    this.exchangeToInternalNameMap = new Map();
    this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, this.rateLimiter);
    
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}` as `0x${string}`;

    
    
    this.initializationPromise = this.initialize();

    this.info = new InfoAPI(baseURL, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
    this.exchange = new ExchangeAPI(baseURL, formattedPrivateKey, this.info, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
    
    this.custom = new CustomOperations(this.exchange, this.info, formattedPrivateKey, this.exchangeToInternalNameMap, this.assetToIndexMap, this.initializationPromise);

    this.ws = new WebSocketClient(testnet);
    this.subscriptions = new WebSocketSubscriptions(this.ws);
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
      
      // Handle perpetual assets
      perpMeta[0].universe.forEach((asset: { name: string }, index: number) => {
        const internalName = `${asset.name}-PERP`;
        this.assetToIndexMap.set(internalName, index);
        this.exchangeToInternalNameMap.set(asset.name, internalName);
      });

      // Handle spot assets
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

  // New method to convert exchange name to internal name
  public getInternalName(exchangeName: string): string | undefined {
    return this.exchangeToInternalNameMap.get(exchangeName);
  }

  // New method to convert internal name to exchange name
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
    }, this.refreshIntervalMs); // Refresh every minute
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

  async connect(): Promise<void> {
    await this.ws.connect();
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