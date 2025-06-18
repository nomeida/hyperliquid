import { SpotMeta, SpotClearinghouseState, SpotMetaAndAssetCtxs } from '../../types';
import { HttpApi } from '../../utils/helpers';
import { InfoType } from '../../types/constants';
import { SymbolConversion } from '../../utils/symbolConversion';

export class SpotInfoAPI {
  private httpApi: HttpApi;
  private symbolConversion: SymbolConversion;

  constructor(httpApi: HttpApi, symbolConversion: SymbolConversion) {
    this.httpApi = httpApi;
    this.symbolConversion = symbolConversion;
  }

  async getSpotMeta(rawResponse: boolean = false): Promise<SpotMeta> {
    const response = await this.httpApi.makeRequest({ type: InfoType.SPOT_META });
    return rawResponse
      ? (response as SpotMeta)
      : ((await this.symbolConversion.convertResponse(
          response,
          ['name', 'coin', 'symbol'],
          'SPOT'
        )) as SpotMeta);
  }

  async getSpotClearinghouseState(
    user: string,
    rawResponse: boolean = false
  ): Promise<SpotClearinghouseState> {
    const response = await this.httpApi.makeRequest({
      type: InfoType.SPOT_CLEARINGHOUSE_STATE,
      user: user,
    });
    return rawResponse
      ? (response as SpotClearinghouseState)
      : ((await this.symbolConversion.convertResponse(
          response,
          ['name', 'coin', 'symbol'],
          'SPOT'
        )) as SpotClearinghouseState);
  }

  async getSpotMetaAndAssetCtxs(rawResponse: boolean = false): Promise<SpotMetaAndAssetCtxs> {
    const response = await this.httpApi.makeRequest({ type: InfoType.SPOT_META_AND_ASSET_CTXS });
    return rawResponse
      ? (response as SpotMetaAndAssetCtxs)
      : ((await this.symbolConversion.convertResponse(response)) as SpotMetaAndAssetCtxs);
  }

  async getTokenDetails(tokenId: string, rawResponse: boolean = false): Promise<any> {
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.TOKEN_DETAILS,
        tokenId: tokenId,
      },
      20
    );

    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getSpotDeployState(user: string, rawResponse: boolean = false): Promise<any> {
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.SPOT_DEPLOY_STATE,
        user: user,
      },
      20
    );

    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }
}
