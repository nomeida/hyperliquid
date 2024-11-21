export declare const BASE_URLS: {
    PRODUCTION: string;
    TESTNET: string;
};
export declare const WSS_URLS: {
    PRODUCTION: string;
    TESTNET: string;
};
export declare const ENDPOINTS: {
    INFO: string;
    EXCHANGE: string;
};
export declare enum InfoType {
    ALL_MIDS = "allMids",
    META = "meta",
    OPEN_ORDERS = "openOrders",
    FRONTEND_OPEN_ORDERS = "frontendOpenOrders",
    USER_FILLS = "userFills",
    USER_FILLS_BY_TIME = "userFillsByTime",
    USER_RATE_LIMIT = "userRateLimit",
    ORDER_STATUS = "orderStatus",
    L2_BOOK = "l2Book",
    CANDLE_SNAPSHOT = "candleSnapshot",
    PERPS_META_AND_ASSET_CTXS = "metaAndAssetCtxs",
    PERPS_CLEARINGHOUSE_STATE = "clearinghouseState",
    USER_FUNDING = "userFunding",
    USER_NON_FUNDING_LEDGER_UPDATES = "userNonFundingLedgerUpdates",
    FUNDING_HISTORY = "fundingHistory",
    SPOT_META = "spotMeta",
    SPOT_CLEARINGHOUSE_STATE = "spotClearinghouseState",
    SPOT_META_AND_ASSET_CTXS = "spotMetaAndAssetCtxs"
}
export declare enum ExchangeType {
    ORDER = "order",
    CANCEL = "cancel",
    CANCEL_BY_CLOID = "cancelByCloid",
    SCHEDULE_CANCEL = "scheduleCancel",
    MODIFY = "modify",
    BATCH_MODIFY = "batchModify",
    UPDATE_LEVERAGE = "updateLeverage",
    UPDATE_ISOLATED_MARGIN = "updateIsolatedMargin",
    USD_SEND = "usdSend",
    SPOT_SEND = "spotSend",
    WITHDRAW = "withdraw3",
    SPOT_USER = "spotUser",
    VAULT_TRANSFER = "vaultTransfer",
    SET_REFERRER = "setReferrer",
    USD_CLASS_TRANSFER = "usdClassTransfer"
}
export declare const WEBSOCKET: {
    MAINNET_URL: string;
    TESTNET_URL: string;
};
//# sourceMappingURL=constants.d.ts.map