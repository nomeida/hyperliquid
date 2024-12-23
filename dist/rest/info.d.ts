import { RateLimiter } from '../utils/rateLimiter';
import { SpotInfoAPI } from './info/spot';
import { PerpetualsInfoAPI } from './info/perpetuals';
import { AllMids, UserOpenOrders, FrontendOpenOrders, UserFills, UserRateLimit, OrderStatus, L2Book, CandleSnapshot } from '../types/index';
export declare class InfoAPI {
    spot: SpotInfoAPI;
    perpetuals: PerpetualsInfoAPI;
    private httpApi;
    private generalAPI;
    private assetToIndexMap;
    private exchangeToInternalNameMap;
    private initializationPromise;
    constructor(baseURL: string, rateLimiter: RateLimiter, assetToIndexMap: Map<string, number>, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>);
    ensureInitialized(): Promise<void>;
    getAssetIndex(assetName: string): number | undefined;
    getInternalName(exchangeName: string): string | undefined;
    getAllAssets(): string[];
    getAllMids(raw_response?: boolean): Promise<AllMids>;
    getUserOpenOrders(user: string, raw_response?: boolean): Promise<UserOpenOrders>;
    getFrontendOpenOrders(user: string, raw_response?: boolean): Promise<FrontendOpenOrders>;
    getUserFills(user: string, raw_response?: boolean): Promise<UserFills>;
    getUserFillsByTime(user: string, startTime: number, endTime: number, raw_response?: boolean): Promise<UserFills>;
    getUserRateLimit(user: string, raw_response?: boolean): Promise<UserRateLimit>;
    getOrderStatus(user: string, oid: number | string, raw_response?: boolean): Promise<OrderStatus>;
    getL2Book(coin: string, raw_response?: boolean): Promise<L2Book>;
    getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, raw_response?: boolean): Promise<CandleSnapshot>;
}
