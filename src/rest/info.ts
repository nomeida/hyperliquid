import { RateLimiter } from '../utils/rateLimiter';
import { GeneralInfoAPI } from './info/general';
import { SpotInfoAPI } from './info/spot';
import { PerpetualsInfoAPI } from './info/perpetuals';
import { HttpApi } from '../utils/helpers';
import { SymbolConversion } from '../utils/symbolConversion';
import { Hyperliquid } from '../index';

import {
  AllMids,
  Meta,
  UserOpenOrders,
  FrontendOpenOrders,
  UserFills,
  UserRateLimit,
  OrderStatus,
  L2Book,
  CandleSnapshot,
  VaultEquity,
  HistoricalOrder,
  TwapSliceFill,
  SubAccount,
  VaultDetails,
  DelegatorReward,
  DelegatorHistoryEntry,
  DelegatorSummary,
  Delegation,
  UserRole,
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
} from '../types/index';

import { InfoType, ENDPOINTS } from '../types/constants';

export class InfoAPI {
  public spot: SpotInfoAPI;
  public perpetuals: PerpetualsInfoAPI;
  private httpApi: HttpApi;
  private generalAPI: GeneralInfoAPI;
  private symbolConversion: SymbolConversion;
  private parent: Hyperliquid;

  constructor(
    baseURL: string,
    rateLimiter: RateLimiter,
    symbolConversion: SymbolConversion,
    parent: Hyperliquid
  ) {
    this.httpApi = new HttpApi(baseURL, ENDPOINTS.INFO, rateLimiter);
    this.symbolConversion = symbolConversion;
    this.parent = parent;

    this.generalAPI = new GeneralInfoAPI(this.httpApi, this.symbolConversion, this.parent);
    this.spot = new SpotInfoAPI(this.httpApi, this.symbolConversion);
    this.perpetuals = new PerpetualsInfoAPI(this.httpApi, this.symbolConversion, this.parent);
  }

  async getAssetIndex(assetName: string): Promise<number | undefined> {
    await this.parent.ensureInitialized();
    return await this.symbolConversion.getAssetIndex(assetName);
  }

  async getInternalName(exchangeName: string): Promise<string | undefined> {
    await this.parent.ensureInitialized();
    return await this.symbolConversion.convertSymbol(exchangeName);
  }

  async getAllAssets(): Promise<{ perp: string[]; spot: string[] }> {
    await this.parent.ensureInitialized();
    return await this.symbolConversion.getAllAssets();
  }

  async getAllMids(rawResponse: boolean = false): Promise<AllMids> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getAllMids(rawResponse);
  }

  async getUserOpenOrders(user: string, rawResponse: boolean = false): Promise<UserOpenOrders> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserOpenOrders(user, rawResponse);
  }

  async getFrontendOpenOrders(
    user: string,
    rawResponse: boolean = false
  ): Promise<FrontendOpenOrders> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getFrontendOpenOrders(user, rawResponse);
  }

  async getUserFills(user: string, rawResponse: boolean = false): Promise<UserFills> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserFills(user, rawResponse);
  }

  async getUserFillsByTime(
    user: string,
    startTime: number,
    endTime: number,
    rawResponse: boolean = false
  ): Promise<UserFills> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserFillsByTime(user, startTime, endTime, rawResponse);
  }

  async getUserRateLimit(user: string, rawResponse: boolean = false): Promise<UserRateLimit> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserRateLimit(user, rawResponse);
  }

  async getOrderStatus(
    user: string,
    oid: number | string,
    rawResponse: boolean = false
  ): Promise<OrderStatus> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getOrderStatus(user, oid, rawResponse);
  }

  async getL2Book(
    coin: string,
    rawResponse: boolean = false,
    nSigFigs: number = 5,
    mantissa?: number
  ): Promise<L2Book> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getL2Book(coin, rawResponse, nSigFigs, mantissa);
  }

  async getCandleSnapshot(
    coin: string,
    interval: string,
    startTime: number,
    endTime: number,
    rawResponse: boolean = false
  ): Promise<CandleSnapshot> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getCandleSnapshot(coin, interval, startTime, endTime, rawResponse);
  }

  async getMaxBuilderFee(
    user: string,
    builder: string,
    rawResponse: boolean = false
  ): Promise<number> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getMaxBuilderFee(user, builder, rawResponse);
  }

  async getHistoricalOrders(
    user: string,
    rawResponse: boolean = false
  ): Promise<HistoricalOrder[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getHistoricalOrders(user, rawResponse);
  }

  async getUserTwapSliceFills(
    user: string,
    rawResponse: boolean = false
  ): Promise<TwapSliceFill[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserTwapSliceFills(user, rawResponse);
  }

  async getSubAccounts(user: string, rawResponse: boolean = false): Promise<SubAccount[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getSubAccounts(user, rawResponse);
  }

  async getVaultDetails(
    vaultAddress: string,
    user?: string,
    rawResponse: boolean = false
  ): Promise<VaultDetails> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getVaultDetails(vaultAddress, user, rawResponse);
  }

  async getUserVaultEquities(user: string, rawResponse: boolean = false): Promise<VaultEquity[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserVaultEquities(user, rawResponse);
  }

  async getUserRole(user: string, rawResponse: boolean = false): Promise<UserRole> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserRole(user, rawResponse);
  }

  async getDelegations(user: string, rawResponse: boolean = false): Promise<Delegation[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getDelegations(user, rawResponse);
  }

  async getDelegatorSummary(user: string, rawResponse: boolean = false): Promise<DelegatorSummary> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getDelegatorSummary(user, rawResponse);
  }

  async getDelegatorHistory(
    user: string,
    rawResponse: boolean = false
  ): Promise<DelegatorHistoryEntry[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getDelegatorHistory(user, rawResponse);
  }

  async getDelegatorRewards(
    user: string,
    rawResponse: boolean = false
  ): Promise<DelegatorReward[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getDelegatorRewards(user, rawResponse);
  }

  async validatorSummaries(rawResponse: boolean = false): Promise<ValidatorSummary[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.validatorSummaries(rawResponse);
  }

  async vaultSummaries(rawResponse: boolean = false): Promise<VaultSummary[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.vaultSummaries(rawResponse);
  }

  async userFees(user: string, rawResponse: boolean = false): Promise<UserFees> {
    await this.parent.ensureInitialized();
    return this.generalAPI.userFees(user, rawResponse);
  }

  async portfolio(user: string, rawResponse: boolean = false): Promise<PortfolioPeriods> {
    await this.parent.ensureInitialized();
    return this.generalAPI.portfolio(user, rawResponse);
  }

  async preTransferCheck(
    user: string,
    source: string,
    rawResponse: boolean = false
  ): Promise<PreTransferCheck> {
    await this.parent.ensureInitialized();
    return this.generalAPI.preTransferCheck(user, source, rawResponse);
  }

  async referral(user: string, rawResponse: boolean = false): Promise<Referral> {
    await this.parent.ensureInitialized();
    return this.generalAPI.referral(user, rawResponse);
  }

  async extraAgents(user: string, rawResponse: boolean = false): Promise<ExtraAgent[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.extraAgents(user, rawResponse);
  }

  async isVip(user: string, rawResponse: boolean = false): Promise<boolean> {
    await this.parent.ensureInitialized();
    return this.generalAPI.isVip(user, rawResponse);
  }

  async legalCheck(user: string, rawResponse: boolean = false): Promise<LegalCheck> {
    await this.parent.ensureInitialized();
    return this.generalAPI.legalCheck(user, rawResponse);
  }

  async userTwapSliceFillsByTime(
    user: string,
    startTime: number,
    endTime?: number,
    aggregateByTime?: boolean,
    rawResponse: boolean = false
  ): Promise<TwapSliceFill[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.userTwapSliceFillsByTime(
      user,
      startTime,
      endTime,
      aggregateByTime,
      rawResponse
    );
  }

  async twapHistory(user: string, rawResponse: boolean = false): Promise<TwapHistory[]> {
    await this.parent.ensureInitialized();
    return this.generalAPI.twapHistory(user, rawResponse);
  }

  async userToMultiSigSigners(
    user: string,
    rawResponse: boolean = false
  ): Promise<MultiSigSigners | null> {
    await this.parent.ensureInitialized();
    return this.generalAPI.userToMultiSigSigners(user, rawResponse);
  }

  async getBuilderFeeApproval(
    user: string,
    builderAddress: string,
    rawResponse: boolean = false
  ): Promise<BuilderFeeApproval> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getBuilderFeeApproval(user, builderAddress, rawResponse);
  }

  async getUserOrderHistory(
    user: string,
    startTime: number,
    endTime?: number,
    rawResponse: boolean = false
  ): Promise<UserOrderHistory> {
    await this.parent.ensureInitialized();
    return this.generalAPI.getUserOrderHistory(user, startTime, endTime, rawResponse);
  }
}
