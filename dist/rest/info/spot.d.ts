import { SpotMeta, SpotClearinghouseState, SpotMetaAndAssetCtxs } from '../../types';
import { HttpApi } from '../../utils/helpers';
import { SymbolConversion } from '../../utils/symbolConversion';
export declare class SpotInfoAPI {
    private httpApi;
    private symbolConversion;
    constructor(httpApi: HttpApi, symbolConversion: SymbolConversion);
    getSpotMeta(rawResponse?: boolean): Promise<SpotMeta>;
    getSpotClearinghouseState(user: string, rawResponse?: boolean): Promise<SpotClearinghouseState>;
    getSpotMetaAndAssetCtxs(rawResponse?: boolean): Promise<SpotMetaAndAssetCtxs>;
}
