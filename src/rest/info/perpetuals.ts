import {
  Meta,
  MetaAndAssetCtxs,
  ClearinghouseState,
  UserFunding,
  UserNonFundingLedgerUpdates,
  FundingHistory,
  PredictedFundings,
  PerpsAtOpenInterestCap,
  PerpDexLimits,
} from '../../types';
import { HttpApi } from '../../utils/helpers';
import { InfoType } from '../../types/constants';
import { SymbolConversion } from '../../utils/symbolConversion';
import { Hyperliquid } from '../../index';

export class PerpetualsInfoAPI {
  private httpApi: HttpApi;
  private symbolConversion: SymbolConversion;
  private parent: Hyperliquid;

  constructor(httpApi: HttpApi, symbolConversion: SymbolConversion, parent: Hyperliquid) {
    this.httpApi = httpApi;
    this.symbolConversion = symbolConversion;
    this.parent = parent;
  }

  async getMeta(rawResponse: boolean = false): Promise<Meta> {
    const response = await this.httpApi.makeRequest({ type: InfoType.META });
    return rawResponse
      ? (response as Meta)
      : ((await this.symbolConversion.convertResponse(
          response,
          ['name', 'coin', 'symbol'],
          'PERP'
        )) as Meta);
  }

  async getMetaAndAssetCtxs(rawResponse: boolean = false): Promise<MetaAndAssetCtxs> {
    const response = await this.httpApi.makeRequest({ type: InfoType.PERPS_META_AND_ASSET_CTXS });
    return rawResponse
      ? (response as MetaAndAssetCtxs)
      : ((await this.symbolConversion.convertResponse(
          response,
          ['name', 'coin', 'symbol'],
          'PERP'
        )) as MetaAndAssetCtxs);
  }

  async getClearinghouseState(
    user: string,
    rawResponse: boolean = false
  ): Promise<ClearinghouseState> {
    const response = await this.httpApi.makeRequest({
      type: InfoType.PERPS_CLEARINGHOUSE_STATE,
      user: user,
    });
    return rawResponse
      ? (response as ClearinghouseState)
      : ((await this.symbolConversion.convertResponse(response)) as ClearinghouseState);
  }

  async getUserFunding(
    user: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<UserFunding> {
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.USER_FUNDING,
        user: user,
        startTime: startTime,
        endTime: endTime,
      },
      20
    );
    return rawResponse
      ? (response as UserFunding)
      : ((await this.symbolConversion.convertResponse(response)) as UserFunding);
  }

  async getUserNonFundingLedgerUpdates(
    user: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<UserNonFundingLedgerUpdates> {
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.USER_NON_FUNDING_LEDGER_UPDATES,
        user: user,
        startTime: startTime,
        endTime: endTime,
      },
      20
    );
    return rawResponse
      ? (response as UserNonFundingLedgerUpdates)
      : ((await this.symbolConversion.convertResponse(response)) as UserNonFundingLedgerUpdates);
  }

  async getFundingHistory(
    coin: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<FundingHistory> {
    await this.parent.ensureInitialized();
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.FUNDING_HISTORY,
        coin: await this.symbolConversion.convertSymbol(coin, 'reverse'),
        startTime: startTime,
        endTime: endTime,
      },
      20
    );
    return rawResponse
      ? (response as FundingHistory)
      : ((await this.symbolConversion.convertResponse(response)) as FundingHistory);
  }

  async getPredictedFundings(rawResponse: boolean = false): Promise<PredictedFundings> {
    const response = await this.httpApi.makeRequest(
      {
        type: InfoType.PREDICTED_FUNDINGS,
      },
      20
    );

    return rawResponse
      ? (response as PredictedFundings)
      : ((await this.symbolConversion.convertResponse(response)) as PredictedFundings);
  }

  async getPerpsAtOpenInterestCap(rawResponse: boolean = false): Promise<PerpsAtOpenInterestCap> {
    const response = (await this.httpApi.makeRequest({
      type: InfoType.PERPS_AT_OPEN_INTEREST_CAP,
    })) as string[];

    if (rawResponse) {
      return response;
    }

    // Convert each symbol in the array
    const convertedResponse = await Promise.all(
      response.map((symbol: string) => this.symbolConversion.convertSymbol(symbol, '', 'PERP'))
    );

    return convertedResponse;
  }

  async getPerpDexLimits(dex: string, rawResponse: boolean = false): Promise<PerpDexLimits> {
    const response = await this.httpApi.makeRequest({
      type: InfoType.PERP_DEX_LIMITS,
      dex: dex,
    });

    if (rawResponse) {
      return response as PerpDexLimits;
    }

    // Convert coin symbols in coinToOiCap array if needed
    const responseData = response as PerpDexLimits;
    const convertedResponse: PerpDexLimits = {
      totalOiCap: responseData.totalOiCap,
      oiSzCapPerPerp: responseData.oiSzCapPerPerp,
      maxTransferNtl: responseData.maxTransferNtl,
      coinToOiCap: responseData.coinToOiCap,
    };

    if (convertedResponse.coinToOiCap) {
      convertedResponse.coinToOiCap = await Promise.all(
        convertedResponse.coinToOiCap.map(async ([coin, cap]) => [
          await this.symbolConversion.convertSymbol(coin, '', 'PERP'),
          cap,
        ])
      );
    }

    return convertedResponse;
  }
}
