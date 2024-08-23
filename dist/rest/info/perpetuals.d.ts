import { Meta, MetaAndAssetCtxs, ClearinghouseState, UserFunding, UserNonFundingLedgerUpdates, FundingHistory } from '../../types';
import { HttpApi } from '../../utils/helpers';
import { SymbolConversion } from '../../utils/symbolConversion';
export declare class PerpetualsInfoAPI {
    private httpApi;
    private symbolConversion;
    constructor(httpApi: HttpApi, symbolConversion: SymbolConversion);
    getMeta(rawResponse?: boolean): Promise<Meta>;
    getMetaAndAssetCtxs(rawResponse?: boolean): Promise<MetaAndAssetCtxs>;
    getClearinghouseState(user: string, rawResponse?: boolean): Promise<ClearinghouseState>;
    getUserFunding(user: string, startTime: number, endTime?: number, rawResponse?: boolean): Promise<UserFunding>;
    getUserNonFundingLedgerUpdates(user: string, startTime: number, endTime?: number, rawResponse?: boolean): Promise<UserNonFundingLedgerUpdates>;
    getFundingHistory(coin: string, startTime: number, endTime?: number, rawResponse?: boolean): Promise<FundingHistory>;
}
