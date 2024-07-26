import { RateLimiter } from '../utils/rateLimiter';
import { GeneralInfoAPI } from './info/general';
import { SpotInfoAPI } from './info/spot';
import { PerpetualsInfoAPI } from './info/perpetuals';
import { HttpApi } from '../utils/helpers';

import { 
    AllMids, 
    Meta, 
    UserOpenOrders, 
    FrontendOpenOrders, 
    UserFills, 
    UserRateLimit, 
    OrderStatus, 
    L2Book, 
    CandleSnapshot 
} from '../types/index';

import * as CONSTANTS from '../types/constants';

export class InfoAPI {
    public spot: SpotInfoAPI;
    public perpetuals: PerpetualsInfoAPI;
    private httpApi: HttpApi;
    private generalAPI: GeneralInfoAPI;
    private assetToIndexMap: Map<string, number>;
    private exchangeToInternalNameMap: Map<string, string>;
    private initializationPromise: Promise<void>;

    constructor(baseURL: string, rateLimiter: RateLimiter, assetToIndexMap: Map<string, number>, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>) {
        this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
        
        this.generalAPI = new GeneralInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.spot = new SpotInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.perpetuals = new PerpetualsInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
    }

    async ensureInitialized() {
        await this.initializationPromise;
    }

    getAssetIndex(assetName: string): number | undefined {
        return this.assetToIndexMap.get(assetName);
    }

    getInternalName(exchangeName: string): string | undefined {
        return this.exchangeToInternalNameMap.get(exchangeName);
    }

    getAllAssets(): string[] {
        return Array.from(this.assetToIndexMap.keys());
    }

    async getAllMids(raw_response: boolean = false): Promise<AllMids> {
        return this.generalAPI.getAllMids(raw_response);
    }

    async getUserOpenOrders(user: string, raw_response: boolean = false): Promise<UserOpenOrders> {
        return this.generalAPI.getUserOpenOrders(user, raw_response);
    }

    async getFrontendOpenOrders(user: string, raw_response: boolean = false): Promise<FrontendOpenOrders> {
        return this.generalAPI.getFrontendOpenOrders(user, raw_response);
    }

    async getUserFills(user: string, raw_response: boolean = false): Promise<UserFills> {
        return this.generalAPI.getUserFills(user, raw_response);
    }

    async getUserFillsByTime(user: string, startTime: number, endTime: number, raw_response: boolean = false): Promise<UserFills> {
        return this.generalAPI.getUserFillsByTime(user, startTime, endTime, raw_response);
    }

    async getUserRateLimit(user: string, raw_response: boolean = false): Promise<UserRateLimit> {
        return this.generalAPI.getUserRateLimit(user, raw_response);
    }

    async getOrderStatus(user: string, oid: number | string, raw_response: boolean = false): Promise<OrderStatus> {
        return this.generalAPI.getOrderStatus(user, oid, raw_response);
    }

    async getL2Book(coin: string, raw_response: boolean = false): Promise<L2Book> {
        return this.generalAPI.getL2Book(coin, raw_response);
    }

    async getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, raw_response: boolean = false): Promise<CandleSnapshot> {
        return this.generalAPI.getCandleSnapshot(coin, interval, startTime, endTime, raw_response);
    }

    
}