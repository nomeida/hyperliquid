import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import { CustomOperations } from './rest/custom';
export declare class Hyperliquid {
    info: InfoAPI;
    exchange: ExchangeAPI;
    ws: WebSocketClient;
    subscriptions: WebSocketSubscriptions;
    private rateLimiter;
    private assetToIndexMap;
    private refreshInterval;
    private refreshIntervalMs;
    private initializationPromise;
    private exchangeToInternalNameMap;
    private httpApi;
    custom: CustomOperations;
    constructor(privateKey: string, testnet?: boolean);
    private refreshAssetToIndexMap;
    getInternalName(exchangeName: string): string | undefined;
    getExchangeName(internalName: string): string | undefined;
    private initialize;
    ensureInitialized(): Promise<void>;
    private startPeriodicRefresh;
    getAssetIndex(assetSymbol: string): number | undefined;
    getAllAssets(): {
        perp: string[];
        spot: string[];
    };
    connect(): Promise<void>;
    disconnect(): void;
}
export * from './types';
export * from './utils/signing';
