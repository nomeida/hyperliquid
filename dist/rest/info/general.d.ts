import { AllMids, UserOpenOrders, FrontendOpenOrders, UserFills, UserRateLimit, OrderStatus, L2Book, CandleSnapshot } from '../../types';
import { HttpApi } from '../../utils/helpers';
export declare class GeneralInfoAPI {
    private httpApi;
    private exchangeToInternalNameMap;
    private initializationPromise;
    constructor(httpApi: HttpApi, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>);
    ensureInitialized(): Promise<void>;
    private convertSymbol;
    private convertSymbolsInObject;
    private convertToNumber;
    getAllMids(raw_response?: boolean): Promise<AllMids>;
    getUserOpenOrders(user: string, raw_response?: boolean): Promise<UserOpenOrders>;
    getFrontendOpenOrders(user: string, raw_response?: boolean): Promise<FrontendOpenOrders>;
    getUserFills(user: string, raw_response?: boolean): Promise<UserFills>;
    getUserFillsByTime(user: string, startTime: number, endTime?: number, raw_response?: boolean): Promise<UserFills>;
    getUserRateLimit(user: string, raw_response?: boolean): Promise<UserRateLimit>;
    getOrderStatus(user: string, oid: number | string, raw_response?: boolean): Promise<OrderStatus>;
    getL2Book(coin: string, raw_response?: boolean): Promise<L2Book>;
    getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, raw_response?: boolean): Promise<CandleSnapshot>;
}
