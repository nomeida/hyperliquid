import { HttpApi } from './helpers';
import * as CONSTANTS from '../types/constants';
import { MetaAndAssetCtxs, SpotMetaAndAssetCtxs } from '../types';

export class SymbolConversion {
  private assetToIndexMap: Map<string, number> = new Map();
  private exchangeToInternalNameMap: Map<string, string> = new Map();
  private httpApi: HttpApi;
  private refreshIntervalMs: number;
  private refreshInterval: any = null;
  private initialized: boolean = false;
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 5;
  private baseRetryDelayMs: number = 1000;
  private disableAssetMapRefresh: boolean;

  constructor(
    baseURL: string,
    rateLimiter: any,
    disableAssetMapRefresh: boolean = false,
    refreshIntervalMs: number = 60000
  ) {
    this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
    this.disableAssetMapRefresh = disableAssetMapRefresh;
    this.refreshIntervalMs = refreshIntervalMs;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.refreshAssetMaps();

      // Only start periodic refresh if not disabled
      if (!this.disableAssetMapRefresh) {
        this.startPeriodicRefresh();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SymbolConversion:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getInternalName(exchangeName: string): Promise<string | undefined> {
    await this.ensureInitialized();
    return this.exchangeToInternalNameMap.get(exchangeName);
  }

  private startPeriodicRefresh(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
    }

    // Use standard setInterval that works in both Node.js and browser
    this.refreshInterval = setInterval(() => {
      this.refreshAssetMaps().catch(error => {
        console.error('Failed to refresh asset maps:', error);
        // Increment consecutive failures counter
        this.consecutiveFailures++;

        // If we've reached the maximum number of consecutive failures, stop refreshing
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          console.warn(
            `Maximum consecutive failures (${this.maxConsecutiveFailures}) reached. Stopping automatic refresh.`
          );
          this.stopPeriodicRefresh();
        }
      });
    }, this.refreshIntervalMs);
  }

  // Check if max failures has been reached and stop refresh if needed
  private checkMaxFailures(): void {
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      console.warn(
        `Maximum consecutive failures (${this.maxConsecutiveFailures}) reached. Stopping automatic refresh.`
      );
      this.stopPeriodicRefresh();
    }
  }

  public stopPeriodicRefresh(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  public enablePeriodicRefresh(): void {
    if (!this.disableAssetMapRefresh && this.initialized) {
      this.startPeriodicRefresh();
    }
  }

  public disablePeriodicRefresh(): void {
    this.stopPeriodicRefresh();
  }

  public isRefreshEnabled(): boolean {
    return !this.disableAssetMapRefresh && this.refreshInterval !== null;
  }

  public getRefreshInterval(): number {
    return this.refreshIntervalMs;
  }

  public setRefreshInterval(intervalMs: number): void {
    this.refreshIntervalMs = intervalMs;
    if (this.refreshInterval !== null) {
      // Restart with new interval
      this.stopPeriodicRefresh();
      this.startPeriodicRefresh();
    }
  }

  private async refreshAssetMaps(): Promise<void> {
    try {
      const [perpMeta, spotMeta] = await Promise.all([
        this.httpApi.makeRequest<MetaAndAssetCtxs>(
          {
            type: CONSTANTS.InfoType.PERPS_META_AND_ASSET_CTXS,
          },
          20
        ), // Correct weight according to Hyperliquid documentation
        this.httpApi.makeRequest<SpotMetaAndAssetCtxs>(
          {
            type: CONSTANTS.InfoType.SPOT_META_AND_ASSET_CTXS,
          },
          20
        ), // Correct weight according to Hyperliquid documentation
      ]);

      // Verify responses are valid before proceeding
      if (
        !perpMeta ||
        !perpMeta[0] ||
        !perpMeta[0].universe ||
        !Array.isArray(perpMeta[0].universe)
      ) {
        throw new Error('Invalid perpetual metadata response');
      }

      if (
        !spotMeta ||
        !spotMeta[0] ||
        !spotMeta[0].tokens ||
        !Array.isArray(spotMeta[0].tokens) ||
        !spotMeta[0].universe ||
        !Array.isArray(spotMeta[0].universe)
      ) {
        throw new Error('Invalid spot metadata response');
      }

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
        const universeItem = spotMeta[0].universe.find(
          (item: any) => item.tokens[0] === token.index
        );
        if (universeItem) {
          const internalName = `${token.name}-SPOT`;
          const exchangeName = universeItem.name;
          const index = universeItem.index;
          this.assetToIndexMap.set(internalName, 10000 + index);
          this.exchangeToInternalNameMap.set(exchangeName, internalName);
        }
      });

      // Reset consecutive failures counter on success
      this.consecutiveFailures = 0;
    } catch (error) {
      // Increment consecutive failures counter
      this.consecutiveFailures++;

      // Check if we've reached the maximum number of consecutive failures
      this.checkMaxFailures();

      // Propagate the error to be handled by the caller
      throw error;
    }
  }

  public async getExchangeName(internalName: string): Promise<string | undefined> {
    await this.ensureInitialized();
    for (const [exchangeName, name] of this.exchangeToInternalNameMap.entries()) {
      if (name === internalName) {
        return exchangeName;
      }
    }
    return undefined;
  }

  public async getAssetIndex(assetSymbol: string): Promise<number | undefined> {
    await this.ensureInitialized();
    return this.assetToIndexMap.get(assetSymbol);
  }

  public async getAllAssets(): Promise<{ perp: string[]; spot: string[] }> {
    await this.ensureInitialized();
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

  async convertSymbol(symbol: string, mode: string = '', symbolMode: string = ''): Promise<string> {
    await this.ensureInitialized();
    let rSymbol: string;
    if (mode === 'reverse') {
      for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
        if (value === symbol) {
          return key;
        }
      }
      rSymbol = symbol;
    } else {
      rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
    }

    if (symbolMode === 'SPOT') {
      if (!rSymbol.endsWith('-SPOT')) {
        rSymbol = symbol + '-SPOT';
      }
    } else if (symbolMode === 'PERP') {
      if (!rSymbol.endsWith('-PERP')) {
        rSymbol = symbol + '-PERP';
      }
    }

    return rSymbol;
  }

  async convertSymbolsInObject(
    obj: any,
    symbolsFields: Array<string> = ['coin', 'symbol'],
    symbolMode: string = ''
  ): Promise<any> {
    await this.ensureInitialized();
    if (typeof obj !== 'object' || obj === null) {
      return this.convertToNumber(obj);
    }

    if (Array.isArray(obj)) {
      return Promise.all(
        obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode))
      );
    }

    const convertedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (symbolsFields.includes(key)) {
        convertedObj[key] = await this.convertSymbol(value as string, '', symbolMode);
      } else if (key === 'side') {
        convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
      } else {
        convertedObj[key] = await this.convertSymbolsInObject(value, symbolsFields, symbolMode);
      }
    }
    return convertedObj;
  }

  convertToNumber(value: any): any {
    if (typeof value === 'string') {
      if (/^-?\d+$/.test(value)) {
        return parseInt(value, 10);
      } else if (/^-?\d*\.\d+$/.test(value)) {
        return parseFloat(value);
      }
    }
    return value;
  }

  async convertResponse(
    response: any,
    symbolsFields: string[] = ['coin', 'symbol'],
    symbolMode: string = ''
  ): Promise<any> {
    return this.convertSymbolsInObject(response, symbolsFields, symbolMode);
  }
}
