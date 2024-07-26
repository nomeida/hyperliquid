import { Meta, MetaAndAssetCtxs, ClearinghouseState, UserFunding, UserNonFundingLedgerUpdates, FundingHistory } from '../../types';
import { HttpApi } from '../../utils/helpers';
export declare class PerpetualsInfoAPI {
    private httpApi;
    private exchangeToInternalNameMap;
    private initializationPromise;
    constructor(httpApi: HttpApi, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>);
    ensureInitialized(): Promise<void>;
    private convertSymbol;
    private convertSymbolsInObject;
    private convertToNumber;
    getMeta(raw_response?: boolean): Promise<Meta>;
    getMetaAndAssetCtxs(raw_response?: boolean): Promise<MetaAndAssetCtxs>;
    getClearinghouseState(user: string, raw_response?: boolean): Promise<ClearinghouseState>;
    getUserFunding(user: string, startTime: number, endTime?: number, raw_response?: boolean): Promise<UserFunding>;
    getUserNonFundingLedgerUpdates(user: string, startTime: number, endTime?: number, raw_response?: boolean): Promise<UserNonFundingLedgerUpdates>;
    getFundingHistory(coin: string, startTime: number, endTime?: number, raw_response?: boolean): Promise<FundingHistory>;
}
