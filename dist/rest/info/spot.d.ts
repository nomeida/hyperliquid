import { SpotMeta, SpotClearinghouseState, SpotMetaAndAssetCtxs } from '../../types';
import { HttpApi } from '../../utils/helpers';
export declare class SpotInfoAPI {
    private httpApi;
    private exchangeToInternalNameMap;
    private initializationPromise;
    constructor(httpApi: HttpApi, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>);
    private convertSymbol;
    private convertSymbolsInObject;
    private convertToNumber;
    getSpotMeta(raw_response?: boolean): Promise<SpotMeta>;
    getSpotClearinghouseState(user: string, raw_response?: boolean): Promise<SpotClearinghouseState>;
    getSpotMetaAndAssetCtxs(raw_response?: boolean): Promise<SpotMetaAndAssetCtxs>;
}
