export type Tif = 'Alo' | 'Ioc' | 'Gtc';
export type TriggerType = 'tp' | 'sl';
export type LimitOrder = { tif: Tif };
export type TriggerOrder = { triggerPx: string | number; isMarket: boolean; tpsl: TriggerType };
export type Grouping = 'na' | 'normalTpsl' | 'positionTpsl';
export type OrderType = { limit?: LimitOrder; trigger?: TriggerOrder };
export type Cloid = string;
export type OidOrCloid = number | Cloid;

export interface OrderRequest {
  coin: string;
  is_buy: boolean;
  sz: number | string;
  limit_px: number | string;
  order_type: OrderType;
  reduce_only: boolean;
  cloid?: string;
  grouping?: Grouping;
  builder?: Builder;
}

interface BaseOrder {
  vaultAddress?: string;
  grouping?: Grouping;
  builder?: Builder;
}

export interface Order extends BaseOrder {
  coin: string;
  is_buy: boolean;
  sz: number | string;
  limit_px: number | string;
  order_type: OrderType;
  reduce_only: boolean;
  cloid?: Cloid;
  orders?: undefined;
}

export interface MultiOrder extends BaseOrder {
  orders: OrderRequest[];
}

export type BulkOrderRequest = MultiOrder;

export interface Builder {
  address: string;
  fee: number;
}

export interface AllMids {
  [coin: string]: string;
}

export type Meta = {
  universe: {
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated?: boolean;
  }[];
};

export interface ClearinghouseState {
  assetPositions: {
    position: {
      coin: string;
      cumFunding: {
        allTime: string;
        sinceChange: string;
        sinceOpen: string;
      };
      entryPx: string;
      leverage: {
        rawUsd: string;
        type: string;
        value: number;
      };
      liquidationPx: string;
      marginUsed: string;
      maxLeverage: number;
      positionValue: string;
      returnOnEquity: string;
      szi: string;
      unrealizedPnl: string;
    };
    type: string;
  }[];
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  time: number;
  withdrawable: string;
}

export type UserFills = {
  closedPnl: string;
  coin: string;
  crossed: boolean;
  dir: string;
  hash: string;
  oid: number;
  px: string;
  side: string;
  startPosition: string;
  sz: string;
  time: number;
}[];

export interface OrderResponse {
  status: string;
  response: {
    type: string;
    data: {
      statuses: Array<{
        resting?: { oid: number };
        filled?: {
          oid: number;
          totalSz: string;
          avgPx: string;
        };
      }>;
    };
  };
}

export interface Leverage {
  type: 'cross' | 'isolated';
  value: number;
  rawUsd?: string;
}

export interface WsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
}

export interface WsBook {
  coin: string;
  levels: [Array<WsLevel>, Array<WsLevel>];
  time: number;
}

export interface WsBbo {
  coin: string;
  time: number;
  bbo: [WsLevel | null, WsLevel | null];
}

export interface WsLevel {
  px: string;
  sz: string;
  n: number;
}

export interface WsOrder {
  order: {
    coin: string;
    side: string;
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    origSz: string;
  };
  status: string;
  statusTimestamp: number;
  user: string;
}

export type WsUserEvent = (WsFill[] | WsUserFunding | WsLiquidation | WsNonUserCancel[]) & {
  user: string;
};

export interface WsFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
}

export interface WsUserFunding {
  time: number;
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
}

export interface WsLiquidation {
  lid: number;
  liquidator: string;
  liquidated_user: string;
  liquidated_ntl_pos: string;
  liquidated_account_value: string;
}

export interface WsNonUserCancel {
  coin: string;
  oid: number;
}

export interface SpotClearinghouseState {
  balances: {
    coin: string;
    hold: string;
    total: string;
  }[];
}

export type FrontendOpenOrders = {
  coin: string;
  isPositionTpsl: boolean;
  isTrigger: boolean;
  limitPx: string;
  oid: number;
  orderType: string;
  origSz: string;
  reduceOnly: boolean;
  side: string;
  sz: string;
  timestamp: number;
  triggerCondition: string;
  triggerPx: string;
}[];

export interface UserRateLimit {
  [key: string]: any;
}

export interface OrderStatus {
  [key: string]: any;
}

export interface L2Book {
  levels: [
    {
      px: string;
      sz: string;
      n: number;
    }[],
    {
      px: string;
      sz: string;
      n: number;
    }[],
  ];
}

export type CandleSnapshot = {
  T: number;
  c: string;
  h: string;
  i: string;
  l: string;
  n: number;
  o: string;
  s: string;
  t: number;
  v: string;
}[];

export type AssetCtx = {
  dayBaseVlm: string;
  dayNtlVlm: string;
  funding: string;
  impactPxs: [string, string];
  markPx: string;
  midPx: string;
  openInterest: string;
  oraclePx: string;
  premium: string;
  prevDayPx: string;
};

export type MetaAndAssetCtxs = [Meta, AssetCtx[]];

export interface UserFundingDelta {
  coin: string;
  fundingRate: string;
  szi: string;
  type: 'funding';
  usdc: string;
}

export interface UserFundingEntry {
  delta: UserFundingDelta;
  hash: string;
  time: number;
}

export type UserFunding = UserFundingEntry[];

export interface UserNonFundingLedgerDelta {
  coin: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'liquidation';
  usdc: string;
}

export interface UserNonFundingLedgerEntry {
  delta: UserNonFundingLedgerDelta;
  hash: string;
  time: number;
}

export type UserNonFundingLedgerUpdates = UserNonFundingLedgerEntry[];

export interface FundingHistoryEntry {
  coin: string;
  fundingRate: string;
  premium: string;
  time: number;
}

export type FundingHistory = FundingHistoryEntry[];

export interface SpotToken {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
}

export interface SpotMarket {
  name: string;
  tokens: [number, number]; // Indices of base and quote tokens
  index: number;
  isCanonical: boolean;
}

export type SpotMeta = {
  tokens: SpotToken[];
  universe: SpotMarket[];
};

export type SpotAssetCtx = {
  circulatingSupply: string;
  coin: string;
  dayBaseVlm: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string;
  prevDayPx: string;
  totalSupply: string;
};

export type SpotMetaAndAssetCtxs = [SpotMeta, SpotAssetCtx[]];

export interface UserOpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: string;
  sz: string;
  timestamp: number;
}

export type UserOpenOrders = UserOpenOrder[];

export interface OrderWire {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: OrderType;
  c?: string;
}

export interface CancelOrderRequest {
  coin: string;
  o: number;
}

export type CancelOrderRequests = {
  a: number;
  o: number;
}[];

export interface CancelByCloidRequest {
  coin: string;
  cloid: Cloid;
}

export interface ModifyRequest {
  oid: OidOrCloid;
  order: OrderRequest;
}

export interface ModifyWire {
  oid: number;
  order: OrderWire;
}

export interface ScheduleCancelAction {
  type: 'scheduleCancel';
  time?: number | null;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export interface Notification {
  notification: string;
  user: string;
}

// As flexible as possible
export interface WebData2 {
  [key: string]: any;
}

export interface Candle {
  t: number; // open time
  T: number; // close time
  s: string; // symbol
  i: string; // interval
  o: string; // open
  c: string; // close
  h: string; // high
  l: string; // low
  v: string; // volume
  n: number; // number of trades
  coin: string;
  interval: string;
}

export interface WsUserFill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
}

export type WsUserFills = {
  isSnapshot: boolean;
  fills: WsUserFill[];
  user: string;
};

export interface WsUserFunding {
  time: number;
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
}

export type WsUserFundings = {
  isSnapshot: boolean;
  fundings: WsUserFunding[];
  user: string;
};

export interface WsUserNonFundingLedgerUpdate {
  time: number;
  coin: string;
  usdc: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'liquidation';
}

export type WsUserNonFundingLedgerUpdates = {
  isSnapshot: boolean;
  updates: WsUserNonFundingLedgerUpdate[];
  user: string;
};

export type WsUserActiveAssetData = {
  isSnapshot: boolean;
  user: string;
  coin: string;
  leverage: Leverage;
  maxTradeSzs: [number, number];
  availableToTrade: [number, number];
};

export interface TwapOrder {
  coin: string;
  is_buy: boolean;
  sz: number;
  reduce_only: boolean;
  minutes: number;
  randomize: boolean;
}

export interface TwapCancelRequest {
  coin: string;
  twap_id: number;
}

export interface TwapOrderResponse {
  status: string;
  response: {
    type: string;
    data: {
      status: {
        running: {
          twapId: number;
        };
      };
    };
  };
}

export interface TwapCancelResponse {
  status: string;
  response: {
    type: string;
    data: {
      status: string;
    };
  };
}

export interface PredictedFunding {
  fundingRate: string;
  nextFundingTime: number;
}

export interface VenueFunding {
  [venue: string]: PredictedFunding;
}

export interface PredictedFundings {
  [coin: string]: VenueFunding[];
}

export interface TokenDetails {
  name: string;
  maxSupply: string;
  totalSupply: string;
  circulatingSupply: string;
  szDecimals: number;
  weiDecimals: number;
  midPx: string;
  markPx: string;
  prevDayPx: string;
  genesis: {
    userBalances: [string, string][];
    existingTokenBalances: [number, string][];
  };
  deployer: string;
  deployGas: string;
  deployTime: string;
  seededUsdc: string;
  nonCirculatingUserBalances: string[];
  futureEmissions: string;
}

export interface SpotDeployState {
  states: {
    token: number;
    spec: {
      name: string;
      szDecimals: number;
      weiDecimals: number;
    };
    fullName: string;
    spots: number[];
    maxSupply: number;
    hyperliquidityGenesisBalance: string;
    totalGenesisBalanceWei: string;
    userGenesisBalances: [string, string][];
    existingTokenGenesisBalances: [number, string][];
  }[];
  gasAuction: {
    startTimeSeconds: number;
    durationSeconds: number;
    startGas: string;
    currentGas: string | null;
    endGas: string;
  };
}

export interface SubAccount {
  name: string;
  subAccountUser: string;
  master: string;
  clearinghouseState: ClearinghouseState;
  spotState: {
    balances: {
      coin: string;
      token: number;
      total: string;
      hold: string;
      entryNtl: string;
    }[];
  };
}

export interface PortfolioPeriodData {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm: string;
}

export interface VaultFollower {
  user: string;
  vaultEquity: string;
  pnl: string;
  allTimePnl: string;
  daysFollowing: number;
  vaultEntryTime: number;
  lockupUntil: number;
}

export interface VaultDetails {
  name: string;
  vaultAddress: string;
  leader: string;
  description: string;
  portfolio: [string, PortfolioPeriodData][];
  apr: number;
  followerState: any;
  leaderFraction: number;
  leaderCommission: number;
  followers: VaultFollower[];
  maxDistributable: number;
  maxWithdrawable: number;
  isClosed: boolean;
  relationship: {
    type: string;
    data: {
      childAddresses: string[];
    };
  };
  allowDeposits: boolean;
  alwaysCloseOnWithdraw: boolean;
}

export interface VaultEquity {
  vaultAddress: string;
  equity: string;
}

export interface HistoricalOrder {
  order: {
    coin: string;
    side: string;
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: any[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: string;
    origSz: string;
    tif: string;
    cloid: string | null;
  };
  status: 'filled' | 'open' | 'canceled' | 'triggered' | 'rejected' | 'marginCanceled';
  statusTimestamp: number;
}

export interface TwapSliceFill {
  fill: {
    closedPnl: string;
    coin: string;
    crossed: boolean;
    dir: string;
    hash: string;
    oid: number;
    px: string;
    side: string;
    startPosition: string;
    sz: string;
    time: number;
    fee: string;
    feeToken: string;
    tid: number;
  };
  twapId: number;
}

export interface ApproveAgentRequest {
  agentAddress: string;
  agentName?: string;
}

export interface ApproveBuilderFeeRequest {
  maxFeeRate: string;
  builder: string;
}

export interface Delegation {
  validator: string;
  amount: string;
  lockedUntilTimestamp: number;
}

export interface DelegatorSummary {
  delegated: string;
  undelegated: string;
  totalPendingWithdrawal: string;
  nPendingWithdrawals: number;
}

export interface DelegatorHistoryEntry {
  time: number;
  hash: string;
  delta: {
    delegate: {
      validator: string;
      amount: string;
      isUndelegate: boolean;
    };
  };
}

export interface DelegatorReward {
  time: number;
  source: string;
  totalAmount: string;
}

export type PerpsAtOpenInterestCap = string[];

export type UserRole = 'missing' | 'user' | 'agent' | 'vault' | 'subAccount';

export interface WsActiveAssetCtx {
  coin: string;
  ctx: {
    dayNtlVlm: string;
    prevDayPx: string;
    markPx: string;
    midPx?: string;
    funding?: number;
    openInterest?: number;
    oraclePx?: number;
    circulatingSupply?: number;
  };
}

export interface WsActiveSpotAssetCtx {
  coin: string;
  ctx: {
    dayNtlVlm: string;
    prevDayPx: string;
    markPx: string;
    midPx?: string;
    circulatingSupply: string;
  };
}

export interface WsTwapState {
  coin: string;
  user: string;
  side: string;
  sz: number;
  executedSz: number;
  executedNtl: number;
  minutes: number;
  reduceOnly: boolean;
  randomize: boolean;
  timestamp: number;
}

export type WsTwapStatus = 'activated' | 'terminated' | 'finished' | 'error';

export interface WsTwapHistory {
  state: WsTwapState;
  status: {
    status: WsTwapStatus;
    description: string;
  };
  time: number;
}

export interface WsTwapHistoryResponse {
  isSnapshot: boolean;
  user: string;
  history: WsTwapHistory[];
}

export interface WsTwapSliceFill {
  isSnapshot?: boolean;
  user: string;
  twapSliceFills: Array<{
    fill: {
      closedPnl: string;
      coin: string;
      crossed: boolean;
      dir: string;
      hash: string;
      oid: number;
      px: string;
      side: string;
      startPosition: string;
      sz: string;
      time: number;
      fee: string;
      feeToken: string;
      tid: number;
    };
    twapId: number;
  }>;
}

export interface ValidatorStats {
  uptimeFraction: string;
  predictedApr: string;
  nSamples: number;
}

export interface ValidatorSummary {
  validator: string;
  signer: string;
  name: string;
  description: string;
  nRecentBlocks: number;
  stake: number;
  isJailed: boolean;
  unjailableAfter: number | null;
  isActive: boolean;
  commission: string;
  stats: [['day', ValidatorStats], ['week', ValidatorStats], ['month', ValidatorStats]];
}

export interface VaultRelationship {
  type: 'normal' | 'child' | 'parent';
  data?: {
    childAddresses: string[];
  };
}

export interface VaultSummary {
  name: string;
  vaultAddress: string;
  leader: string;
  tvl: string;
  isClosed: boolean;
  relationship: VaultRelationship;
  createTimeMillis: number;
}

export interface TxDetails {
  action: {
    type: string;
    [key: string]: unknown;
  };
  block: number;
  error: string | null;
  hash: string;
  time: number;
  user: string;
}

export interface BlockDetails {
  blockTime: number;
  hash: string;
  height: number;
  numTxs: number;
  proposer: string;
  txs: TxDetails[];
}

export interface BlockDetailsResponse {
  type: 'blockDetails';
  blockDetails: BlockDetails;
}

export interface TxDetailsResponse {
  type: 'txDetails';
  tx: TxDetails;
}

export interface UserDetailsResponse {
  type: 'userDetails';
  txs: TxDetails[];
}

export interface UserFees {
  dailyUserVlm: {
    date: string;
    userCross: string;
    userAdd: string;
    exchange: string;
  }[];
  feeSchedule: {
    cross: string;
    add: string;
    tiers: {
      vip: {
        ntlCutoff: string;
        cross: string;
        add: string;
      }[];
      mm: {
        makerFractionCutoff: string;
        add: string;
      }[];
    };
    referralDiscount: string;
  };
  userCrossRate: string;
  userAddRate: string;
  activeReferralDiscount: string;
  trial: unknown | null;
  feeTrialReward: string;
  nextTrialAvailableTimestamp: unknown | null;
}

export interface Portfolio {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm: string;
}

export type PortfolioPeriods = [
  ['day', Portfolio],
  ['week', Portfolio],
  ['month', Portfolio],
  ['allTime', Portfolio],
  ['perpDay', Portfolio],
  ['perpWeek', Portfolio],
  ['perpMonth', Portfolio],
  ['perpAllTime', Portfolio],
];

export interface PreTransferCheck {
  fee: string;
  isSanctioned: boolean;
  userExists: boolean;
}

export interface Referral {
  referredBy: {
    referrer: string;
    code: string;
  } | null;
  cumVlm: string;
  unclaimedRewards: string;
  claimedRewards: string;
  builderRewards: string;
  referrerState: {
    stage: 'ready' | 'needToCreateCode' | 'needToTrade';
    data?: {
      code?: string;
      referralStates?: {
        cumVlm: string;
        cumRewardedFeesSinceReferred: string;
        cumFeesRewardedToReferrer: string;
        timeJoined: number;
        user: string;
      }[];
      required?: string;
    };
  };
  rewardHistory: {
    earned: string;
    vlm: string;
    referralVlm: string;
    time: number;
  }[];
}

export interface ExtraAgent {
  address: string;
  name: string;
  validUntil: number;
}

export interface LegalCheck {
  ipAllowed: boolean;
  acceptedTerms: boolean;
  userAllowed: boolean;
}

export interface TwapState {
  coin: string;
  executedNtl: string;
  executedSz: string;
  minutes: number;
  randomize: boolean;
  reduceOnly: boolean;
  side: 'B' | 'A';
  sz: string;
  timestamp: number;
  user: string;
}

export interface TwapStatus {
  status: 'finished' | 'activated' | 'terminated' | 'error';
  description?: string;
}

export interface TwapHistory {
  time: number;
  state: TwapState;
  status: TwapStatus;
}

export interface MultiSigSigners {
  authorizedUsers: string[];
  threshold: number;
}

// Vault-related types
export interface CreateVaultRequest {
  name: string;
  description: string;
  initialUsd: number;
}

export interface CreateVaultResponse {
  status: string;
  response: {
    type: string;
    data: string; // Vault address
  };
}

export interface VaultDistributeRequest {
  vaultAddress: string;
  usd: number;
}

export interface VaultModifyRequest {
  vaultAddress: string;
  allowDeposits: boolean | null;
  alwaysCloseOnWithdraw: boolean | null;
}

// Response types
export interface ClaimRewardsResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface CreateSubAccountResponse {
  status: string;
  response: {
    type: string;
    data: string; // Sub-account address
  };
}

export interface SetDisplayNameResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface SpotUserResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface CDepositResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface CWithdrawResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface TokenDelegateResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface SubAccountSpotTransferResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface SubAccountTransferResponse {
  status: string;
  response: {
    type: string;
  };
}

export interface ReserveRequestWeightRequest {
  weight: number;
}

export interface ReserveRequestWeightResponse {
  status: string;
  response: {
    type: string;
  };
}
