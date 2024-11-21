import { HttpApi } from '../../utils/helpers';
import { SymbolConversion } from '../../utils/symbolConversion';
import type { AllMids, CandleSnapshot, FrontendOpenOrders, L2Book, OrderStatus, UserFills, UserOpenOrders, UserRateLimit } from '../../types';
export declare class GeneralInfoAPI {
    private httpApi;
    private symbolConversion;
    constructor(httpApi: HttpApi, symbolConversion: SymbolConversion);
    getAllMids(rawResponse?: boolean): Promise<AllMids>;
    getUserOpenOrders(user: string, rawResponse?: boolean): Promise<UserOpenOrders>;
    getFrontendOpenOrders(user: string, rawResponse?: boolean): Promise<FrontendOpenOrders>;
    getUserFills(user: string, rawResponse?: boolean): Promise<UserFills[]>;
    getUserFillsByTime(user: string, startTime: number, endTime?: number, rawResponse?: boolean): Promise<UserFills[]>;
    getUserRateLimit(user: string, rawResponse?: boolean): Promise<UserRateLimit>;
    getOrderStatus(user: string, oid: number | string, rawResponse?: boolean): Promise<OrderStatus>;
    getL2Book(coin: string, rawResponse?: boolean): Promise<L2Book>;
    getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, rawResponse?: boolean): Promise<CandleSnapshot[]>;
}
//# sourceMappingURL=general.d.ts.map