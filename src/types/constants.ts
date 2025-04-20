export const BASE_URLS = {
  PRODUCTION: 'https://api.hyperliquid.xyz',
  TESTNET: 'https://api.hyperliquid-testnet.xyz',
};

export const WSS_URLS = {
  PRODUCTION: 'wss://api.hyperliquid.xyz/ws',
  TESTNET: 'wss://api.hyperliquid-testnet.xyz/ws',
};

export const CHAIN_IDS = {
  ARBITRUM_MAINNET: '0xa4b1', // 42161
  ARBITRUM_TESTNET: '0x66eee', // 421614 - testnet//Arbitrum Sepolia
};

export const ENDPOINTS = {
  INFO: '/info',
  EXCHANGE: '/exchange',
};

export enum InfoType {
  ALL_MIDS = 'allMids',
  META = 'meta',
  OPEN_ORDERS = 'openOrders',
  FRONTEND_OPEN_ORDERS = 'frontendOpenOrders',
  USER_FILLS = 'userFills',
  USER_FILLS_BY_TIME = 'userFillsByTime',
  USER_RATE_LIMIT = 'userRateLimit',
  ORDER_STATUS = 'orderStatus',
  L2_BOOK = 'l2Book',
  CANDLE_SNAPSHOT = 'candleSnapshot',
  PERPS_META_AND_ASSET_CTXS = 'metaAndAssetCtxs',
  PERPS_CLEARINGHOUSE_STATE = 'clearinghouseState',
  USER_FUNDING = 'userFunding',
  USER_NON_FUNDING_LEDGER_UPDATES = 'userNonFundingLedgerUpdates',
  FUNDING_HISTORY = 'fundingHistory',
  SPOT_META = 'spotMeta',
  SPOT_CLEARINGHOUSE_STATE = 'spotClearinghouseState',
  SPOT_META_AND_ASSET_CTXS = 'spotMetaAndAssetCtxs',
  PREDICTED_FUNDINGS = 'predictedFundings',
  SPOT_DEPLOY_STATE = 'spotDeployState',
  TOKEN_DETAILS = 'tokenDetails',
  MAX_BUILDER_FEE = 'maxBuilderFee',
  HISTORICAL_ORDERS = 'historicalOrders',
  USER_TWAP_SLICE_FILLS = 'userTwapSliceFills',
  SUB_ACCOUNTS = 'subAccounts',
  VAULT_DETAILS = 'vaultDetails',
  USER_VAULT_EQUITIES = 'userVaultEquities',
  USER_ROLE = 'userRole',
  DELEGATIONS = 'delegations',
  DELEGATOR_SUMMARY = 'delegatorSummary',
  PERPS_AT_OPEN_INTEREST_CAP = 'perpsAtOpenInterestCap',
  DELEGATOR_HISTORY = 'delegatorHistory',
  DELEGATOR_REWARDS = 'delegatorRewards',
  VALIDATOR_SUMMARIES = 'validatorSummaries',
  VAULT_SUMMARIES = 'vaultSummaries',
  BLOCK_DETAILS = 'blockDetails',
  TX_DETAILS = 'txDetails',
  USER_DETAILS = 'userDetails',
  USER_FEES = 'userFees',
  PORTFOLIO = 'portfolio',
  PRE_TRANSFER_CHECK = 'preTransferCheck',
  REFERRAL = 'referral',
  EXTRA_AGENTS = 'extraAgents',
  IS_VIP = 'isVip',
  LEGAL_CHECK = 'legalCheck',
  USER_TWAP_SLICE_FILLS_BY_TIME = 'userTwapSliceFillsByTime',
  TWAP_HISTORY = 'twapHistory',
  USER_TO_MULTI_SIG_SIGNERS = 'userToMultiSigSigners',
}

export enum ExchangeType {
  ORDER = 'order',
  CANCEL = 'cancel',
  CANCEL_BY_CLOID = 'cancelByCloid',
  SCHEDULE_CANCEL = 'scheduleCancel',
  MODIFY = 'modify',
  BATCH_MODIFY = 'batchModify',
  UPDATE_LEVERAGE = 'updateLeverage',
  UPDATE_ISOLATED_MARGIN = 'updateIsolatedMargin',
  USD_SEND = 'usdSend',
  SPOT_SEND = 'spotSend',
  WITHDRAW = 'withdraw3',
  SPOT_USER = 'spotUser',
  VAULT_TRANSFER = 'vaultTransfer',
  CREATE_VAULT = 'createVault',
  VAULT_DISTRIBUTE = 'vaultDistribute',
  VAULT_MODIFY = 'vaultModify',
  SET_REFERRER = 'setReferrer',
  USD_CLASS_TRANSFER = 'usdClassTransfer',
  TWAP_ORDER = 'twapOrder',
  TWAP_CANCEL = 'twapCancel',
  APPROVE_AGENT = 'approveAgent',
  APPROVE_BUILDER_FEE = 'approveBuilderFee',
  EVM_USER_MODIFY = 'evmUserModify',
  CLAIM_REWARDS = 'claimRewards',
  CREATE_SUB_ACCOUNT = 'createSubAccount',
  SET_DISPLAY_NAME = 'setDisplayName',
  C_DEPOSIT = 'cDeposit',
  C_WITHDRAW = 'cWithdraw',
  TOKEN_DELEGATE = 'tokenDelegate',
  SUB_ACCOUNT_SPOT_TRANSFER = 'subAccountSpotTransfer',
  SUB_ACCOUNT_TRANSFER = 'subAccountTransfer',
  RESERVE_REQUEST_WEIGHT = 'reserveRequestWeight',
}

export const WEBSOCKET = {
  MAINNET_URL: 'wss://api.hyperliquid.xyz/ws',
  TESTNET_URL: 'wss://api.hyperliquid-testnet.xyz/ws',
};

export const SDK_CODE = 'PLACEHOLDER';
