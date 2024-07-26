import { InfoAPI } from './info';
import { ExchangeAPI } from './exchange';
import { CancelOrderResponse } from '../utils/signing';
export declare class CustomOperations {
    private exchange;
    private infoApi;
    private wallet;
    private exchangeToInternalNameMap;
    private assetToIndexMap;
    private initializationPromise;
    constructor(exchange: ExchangeAPI, infoApi: InfoAPI, privateKey: string, exchangeToInternalNameMap: Map<string, string>, assetToIndexMap: Map<string, number>, initializationPromise: Promise<void>);
    private ensureInitialized;
    cancelAllOrders(symbol?: string): Promise<CancelOrderResponse>;
    getAllAssets(): {
        perp: string[];
        spot: string[];
    };
}
