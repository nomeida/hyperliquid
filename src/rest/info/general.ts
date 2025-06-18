// src/rest/info/general.ts

import {
  AllMids,
  UserOpenOrders,
  FrontendOpenOrders,
  UserFills,
  UserRateLimit,
  OrderStatus,
  L2Book,
  CandleSnapshot,
  HistoricalOrder,
  TwapSliceFill,
  SubAccount,
  VaultDetails,
  VaultEquity,
  UserRole,
  Delegation,
  DelegatorSummary,
  DelegatorHistoryEntry,
  DelegatorReward,
  ValidatorSummary,
  VaultSummary,
  UserFees,
  PortfolioPeriods,
  PreTransferCheck,
  Referral,
  ExtraAgent,
  LegalCheck,
  TwapHistory,
  MultiSigSigners,
  BuilderFeeApproval,
  UserOrderHistory,
} from '../../types';
import { HttpApi } from '../../utils/helpers';
import { SymbolConversion } from '../../utils/symbolConversion';
import { InfoType } from '../../types/constants';
import { Hyperliquid } from '../../index';

export class GeneralInfoAPI {
  private parent: Hyperliquid;

  constructor(
    private httpApi: HttpApi,
    private symbolConversion: SymbolConversion,
    parent: Hyperliquid
  ) {
    this.parent = parent;
  }

  async getAllMids(rawResponse: boolean = false): Promise<AllMids> {
    const response = await this.httpApi.makeRequest<AllMids>({ type: InfoType.ALL_MIDS });

    if (rawResponse) {
      return response;
    } else {
      const convertedResponse: any = {};
      for (const [key, value] of Object.entries(response)) {
        const convertedKey = await this.symbolConversion.convertSymbol(key);
        const convertedValue = parseFloat(value as string);
        convertedResponse[convertedKey] = convertedValue;
      }
      return convertedResponse;
    }
  }

  async getUserOpenOrders(user: string, rawResponse: boolean = false): Promise<UserOpenOrders> {
    await this.parent.ensureInitialized();
    const response = await this.httpApi.makeRequest<UserOpenOrders>({
      type: InfoType.OPEN_ORDERS,
      user: user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getFrontendOpenOrders(
    user: string,
    rawResponse: boolean = false
  ): Promise<FrontendOpenOrders> {
    const response = await this.httpApi.makeRequest<FrontendOpenOrders>(
      { type: InfoType.FRONTEND_OPEN_ORDERS, user: user },
      20
    );
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserFills(user: string, rawResponse: boolean = false): Promise<UserFills> {
    const response = await this.httpApi.makeRequest<UserFills>(
      { type: InfoType.USER_FILLS, user: user },
      20
    );
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserFillsByTime(
    user: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<UserFills> {
    let params: { user: string; startTime: number; type: string; endTime?: number } = {
      user: user,
      startTime: Math.round(startTime),
      type: InfoType.USER_FILLS_BY_TIME,
    };

    if (endTime) {
      params.endTime = Math.round(endTime);
    }

    const response = await this.httpApi.makeRequest<UserFills>(params, 20);
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserRateLimit(user: string, rawResponse: boolean = false): Promise<UserRateLimit> {
    const response = await this.httpApi.makeRequest<UserRateLimit>(
      { type: InfoType.USER_RATE_LIMIT, user: user },
      20
    );
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getOrderStatus(
    user: string,
    oid: number | string,
    rawResponse: boolean = false
  ): Promise<OrderStatus> {
    const response = await this.httpApi.makeRequest<OrderStatus>({
      type: InfoType.ORDER_STATUS,
      user: user,
      oid: oid,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getL2Book(
    coin: string,
    rawResponse: boolean = false,
    nSigFigs: number = 5,
    mantissa?: number
  ): Promise<L2Book> {
    const response = await this.httpApi.makeRequest<L2Book>({
      type: InfoType.L2_BOOK,
      coin: await this.symbolConversion.convertSymbol(coin, 'reverse'),
      nSigFigs,
      mantissa,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getCandleSnapshot(
    coin: string,
    interval: string,
    startTime: number,
    endTime: number,
    rawResponse: boolean = false
  ): Promise<CandleSnapshot> {
    const response = await this.httpApi.makeRequest<CandleSnapshot>({
      type: InfoType.CANDLE_SNAPSHOT,
      req: {
        coin: await this.symbolConversion.convertSymbol(coin, 'reverse'),
        interval: interval,
        startTime: startTime,
        endTime: endTime,
      },
    });

    return rawResponse ? response : await this.symbolConversion.convertResponse(response, ['s']);
  }

  // Add these methods to src/rest/info/general.ts

  async getMaxBuilderFee(
    user: string,
    builder: string,
    rawResponse: boolean = false
  ): Promise<number> {
    const response = await this.httpApi.makeRequest<number>({
      type: InfoType.MAX_BUILDER_FEE,
      user,
      builder,
    });
    return rawResponse ? response : this.symbolConversion.convertToNumber(response);
  }

  async getHistoricalOrders(
    user: string,
    rawResponse: boolean = false
  ): Promise<HistoricalOrder[]> {
    const response = await this.httpApi.makeRequest<HistoricalOrder[]>({
      type: InfoType.HISTORICAL_ORDERS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserTwapSliceFills(
    user: string,
    rawResponse: boolean = false
  ): Promise<TwapSliceFill[]> {
    const response = await this.httpApi.makeRequest<TwapSliceFill[]>({
      type: InfoType.USER_TWAP_SLICE_FILLS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getSubAccounts(user: string, rawResponse: boolean = false): Promise<SubAccount[]> {
    const response = await this.httpApi.makeRequest<SubAccount[]>({
      type: InfoType.SUB_ACCOUNTS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getVaultDetails(
    vaultAddress: string,
    user?: string,
    rawResponse: boolean = false
  ): Promise<VaultDetails> {
    const params: any = {
      type: InfoType.VAULT_DETAILS,
      vaultAddress,
    };

    if (user) {
      params.user = user;
    }

    const response = await this.httpApi.makeRequest<VaultDetails>(params);
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserVaultEquities(user: string, rawResponse: boolean = false): Promise<VaultEquity[]> {
    const response = await this.httpApi.makeRequest<VaultEquity[]>({
      type: InfoType.USER_VAULT_EQUITIES,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserRole(user: string, rawResponse: boolean = false): Promise<UserRole> {
    const response = await this.httpApi.makeRequest<UserRole>({
      type: InfoType.USER_ROLE,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getDelegations(user: string, rawResponse: boolean = false): Promise<Delegation[]> {
    const response = await this.httpApi.makeRequest<Delegation[]>({
      type: InfoType.DELEGATIONS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getDelegatorSummary(user: string, rawResponse: boolean = false): Promise<DelegatorSummary> {
    const response = await this.httpApi.makeRequest<DelegatorSummary>({
      type: InfoType.DELEGATOR_SUMMARY,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getDelegatorHistory(
    user: string,
    rawResponse: boolean = false
  ): Promise<DelegatorHistoryEntry[]> {
    const response = await this.httpApi.makeRequest<DelegatorHistoryEntry[]>({
      type: InfoType.DELEGATOR_HISTORY,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getDelegatorRewards(
    user: string,
    rawResponse: boolean = false
  ): Promise<DelegatorReward[]> {
    const response = await this.httpApi.makeRequest<DelegatorReward[]>({
      type: InfoType.DELEGATOR_REWARDS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async validatorSummaries(rawResponse: boolean = false): Promise<ValidatorSummary[]> {
    const response = await this.httpApi.makeRequest<ValidatorSummary[]>({
      type: InfoType.VALIDATOR_SUMMARIES,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async vaultSummaries(rawResponse: boolean = false): Promise<VaultSummary[]> {
    const response = await this.httpApi.makeRequest<VaultSummary[]>({
      type: InfoType.VAULT_SUMMARIES,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async userFees(user: string, rawResponse: boolean = false): Promise<UserFees> {
    const response = await this.httpApi.makeRequest<UserFees>({
      type: InfoType.USER_FEES,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async portfolio(user: string, rawResponse: boolean = false): Promise<PortfolioPeriods> {
    const response = await this.httpApi.makeRequest<PortfolioPeriods>({
      type: InfoType.PORTFOLIO,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async preTransferCheck(
    user: string,
    source: string,
    rawResponse: boolean = false
  ): Promise<PreTransferCheck> {
    const response = await this.httpApi.makeRequest<PreTransferCheck>({
      type: InfoType.PRE_TRANSFER_CHECK,
      user,
      source,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async referral(user: string, rawResponse: boolean = false): Promise<Referral> {
    const response = await this.httpApi.makeRequest<Referral>({
      type: InfoType.REFERRAL,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async extraAgents(user: string, rawResponse: boolean = false): Promise<ExtraAgent[]> {
    const response = await this.httpApi.makeRequest<ExtraAgent[]>({
      type: InfoType.EXTRA_AGENTS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async isVip(user: string, rawResponse: boolean = false): Promise<boolean> {
    const response = await this.httpApi.makeRequest<boolean>({
      type: InfoType.IS_VIP,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async legalCheck(user: string, rawResponse: boolean = false): Promise<LegalCheck> {
    const response = await this.httpApi.makeRequest<LegalCheck>({
      type: InfoType.LEGAL_CHECK,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async userTwapSliceFillsByTime(
    user: string,
    startTime: number,
    endTime?: number,
    aggregateByTime?: boolean,
    rawResponse: boolean = false
  ): Promise<TwapSliceFill[]> {
    const params: any = {
      type: InfoType.USER_TWAP_SLICE_FILLS_BY_TIME,
      user,
      startTime,
    };

    if (endTime !== undefined) params.endTime = endTime;
    if (aggregateByTime !== undefined) params.aggregateByTime = aggregateByTime;

    const response = await this.httpApi.makeRequest<TwapSliceFill[]>(params);
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async twapHistory(user: string, rawResponse: boolean = false): Promise<TwapHistory[]> {
    const response = await this.httpApi.makeRequest<TwapHistory[]>({
      type: InfoType.TWAP_HISTORY,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async userToMultiSigSigners(
    user: string,
    rawResponse: boolean = false
  ): Promise<MultiSigSigners | null> {
    const response = await this.httpApi.makeRequest<MultiSigSigners | null>({
      type: InfoType.USER_TO_MULTI_SIG_SIGNERS,
      user,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getBuilderFeeApproval(
    user: string,
    builderAddress: string,
    rawResponse: boolean = false
  ): Promise<BuilderFeeApproval> {
    const response = await this.httpApi.makeRequest<BuilderFeeApproval>({
      type: InfoType.BUILDER_FEE_APPROVAL,
      user,
      builderAddress,
    });
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }

  async getUserOrderHistory(
    user: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<UserOrderHistory> {
    const params: any = {
      type: InfoType.USER_ORDER_HISTORY,
      user,
      startTime: Math.round(startTime),
    };

    if (endTime !== undefined) {
      params.endTime = Math.round(endTime);
    }

    const response = await this.httpApi.makeRequest<UserOrderHistory>(params, 20);
    return rawResponse ? response : await this.symbolConversion.convertResponse(response);
  }
}
