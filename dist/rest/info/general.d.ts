import { AllMids, UserOpenOrders, FrontendOpenOrders, UserFills, UserRateLimit, OrderStatus, L2Book, CandleSnapshot } from '../../types';
import { HttpApi } from '../../utils/helpers';
import { SymbolConversion } from '../../utils/symbolConversion';
export declare class GeneralInfoAPI {
    private httpApi;
    private symbolConversion;
    constructor(httpApi: HttpApi, symbolConversion: SymbolConversion);
    getAllMids(rawResponse?: boolean): Promise<AllMids>;
    getUserOpenOrders(user: string, rawResponse?: boolean): Promise<UserOpenOrders>;
    getFrontendOpenOrders(user: string, rawResponse?: boolean): Promise<FrontendOpenOrders>;
    getUserFills(user: string, rawResponse?: boolean): Promise<UserFills>;
    getUserFillsByTime(user: string, startTime: number, endTime?: number, rawResponse?: boolean): Promise<UserFills>;
    getUserRateLimit(user: string, rawResponse?: boolean): Promise<UserRateLimit>;
    getOrderStatus(user: string, oid: number | string, rawResponse?: boolean): Promise<OrderStatus>;
    getL2Book(coin: string, rawResponse?: boolean): Promise<L2Book>;
    getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, rawResponse?: boolean): Promise<CandleSnapshot>;
}
