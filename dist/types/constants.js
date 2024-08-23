"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBSOCKET = exports.ExchangeType = exports.InfoType = exports.ENDPOINTS = exports.WSS_URLS = exports.BASE_URLS = void 0;
exports.BASE_URLS = {
    PRODUCTION: 'https://api.hyperliquid.xyz',
    TESTNET: 'https://api.hyperliquid-testnet.xyz'
};
exports.WSS_URLS = {
    PRODUCTION: 'wss://api.hyperliquid.xyz/ws',
    TESTNET: 'wss://api.hyperliquid-testnet.xyz/ws'
};
exports.ENDPOINTS = {
    INFO: '/info',
    EXCHANGE: '/exchange'
};
var InfoType;
(function (InfoType) {
    InfoType["ALL_MIDS"] = "allMids";
    InfoType["META"] = "meta";
    InfoType["OPEN_ORDERS"] = "openOrders";
    InfoType["FRONTEND_OPEN_ORDERS"] = "frontendOpenOrders";
    InfoType["USER_FILLS"] = "userFills";
    InfoType["USER_FILLS_BY_TIME"] = "userFillsByTime";
    InfoType["USER_RATE_LIMIT"] = "userRateLimit";
    InfoType["ORDER_STATUS"] = "orderStatus";
    InfoType["L2_BOOK"] = "l2Book";
    InfoType["CANDLE_SNAPSHOT"] = "candleSnapshot";
    InfoType["PERPS_META_AND_ASSET_CTXS"] = "metaAndAssetCtxs";
    InfoType["PERPS_CLEARINGHOUSE_STATE"] = "clearinghouseState";
    InfoType["USER_FUNDING"] = "userFunding";
    InfoType["USER_NON_FUNDING_LEDGER_UPDATES"] = "userNonFundingLedgerUpdates";
    InfoType["FUNDING_HISTORY"] = "fundingHistory";
    InfoType["SPOT_META"] = "spotMeta";
    InfoType["SPOT_CLEARINGHOUSE_STATE"] = "spotClearinghouseState";
    InfoType["SPOT_META_AND_ASSET_CTXS"] = "spotMetaAndAssetCtxs";
})(InfoType || (exports.InfoType = InfoType = {}));
var ExchangeType;
(function (ExchangeType) {
    ExchangeType["ORDER"] = "order";
    ExchangeType["CANCEL"] = "cancel";
    ExchangeType["CANCEL_BY_CLOID"] = "cancelByCloid";
    ExchangeType["SCHEDULE_CANCEL"] = "scheduleCancel";
    ExchangeType["MODIFY"] = "modify";
    ExchangeType["BATCH_MODIFY"] = "batchModify";
    ExchangeType["UPDATE_LEVERAGE"] = "updateLeverage";
    ExchangeType["UPDATE_ISOLATED_MARGIN"] = "updateIsolatedMargin";
    ExchangeType["USD_SEND"] = "usdSend";
    ExchangeType["SPOT_SEND"] = "spotSend";
    ExchangeType["WITHDRAW"] = "withdraw3";
    ExchangeType["SPOT_USER"] = "spotUser";
    ExchangeType["VAULT_TRANSFER"] = "vaultTransfer";
    ExchangeType["SET_REFERRER"] = "setReferrer";
})(ExchangeType || (exports.ExchangeType = ExchangeType = {}));
exports.WEBSOCKET = {
    MAINNET_URL: 'wss://api.hyperliquid.xyz/ws',
    TESTNET_URL: 'wss://api.hyperliquid-testnet.xyz/ws'
};
//# sourceMappingURL=constants.js.map