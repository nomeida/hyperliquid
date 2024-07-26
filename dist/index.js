"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hyperliquid = void 0;
const info_1 = require("./rest/info");
const exchange_1 = require("./rest/exchange");
const connection_1 = require("./websocket/connection");
const subscriptions_1 = require("./websocket/subscriptions");
const rateLimiter_1 = require("./utils/rateLimiter");
const helpers_1 = require("./utils/helpers");
const CONSTANTS = __importStar(require("./types/constants"));
const custom_1 = require("./rest/custom");
class Hyperliquid {
    constructor(privateKey, testnet = false) {
        this.refreshInterval = null;
        this.refreshIntervalMs = 60000;
        this.initializationPromise = null;
        const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;
        this.refreshIntervalMs = 60000;
        this.rateLimiter = new rateLimiter_1.RateLimiter(); // 1200 tokens per minute
        this.assetToIndexMap = new Map();
        this.assetToIndexMap = new Map();
        this.exchangeToInternalNameMap = new Map();
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, this.rateLimiter);
        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.initializationPromise = this.initialize();
        this.info = new info_1.InfoAPI(baseURL, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
        this.exchange = new exchange_1.ExchangeAPI(baseURL, formattedPrivateKey, this.info, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
        this.custom = new custom_1.CustomOperations(this.exchange, this.info, formattedPrivateKey, this.exchangeToInternalNameMap, this.assetToIndexMap, this.initializationPromise);
        this.ws = new connection_1.WebSocketClient(testnet);
        this.subscriptions = new subscriptions_1.WebSocketSubscriptions(this.ws);
    }
    async refreshAssetToIndexMap() {
        try {
            const [perpMeta, spotMeta] = await Promise.all([
                (async () => {
                    const result = await this.httpApi.makeRequest({
                        "type": CONSTANTS.INFO_TYPES.PERPS_META_AND_ASSET_CTXS
                    });
                    return result;
                })(),
                (async () => {
                    const result = await this.httpApi.makeRequest({
                        "type": CONSTANTS.INFO_TYPES.SPOT_META_AND_ASSET_CTXS
                    });
                    return result;
                })()
            ]);
            this.assetToIndexMap.clear();
            this.exchangeToInternalNameMap.clear();
            // Handle perpetual assets
            perpMeta[0].universe.forEach((asset, index) => {
                const internalName = `${asset.name}-PERP`;
                this.assetToIndexMap.set(internalName, index);
                this.exchangeToInternalNameMap.set(asset.name, internalName);
            });
            // Handle spot assets
            spotMeta[0].tokens.forEach((token) => {
                const universeItem = spotMeta[0].universe.find((item) => item.tokens[0] === token.index);
                if (universeItem) {
                    const internalName = `${token.name}-SPOT`;
                    const exchangeName = universeItem.name;
                    const index = spotMeta[0].universe.indexOf(universeItem);
                    this.assetToIndexMap.set(internalName, 10000 + index);
                    this.exchangeToInternalNameMap.set(exchangeName, internalName);
                }
            });
        }
        catch (error) {
            console.error('Failed to refresh asset maps:', error);
        }
        finally {
        }
    }
    // New method to convert exchange name to internal name
    getInternalName(exchangeName) {
        return this.exchangeToInternalNameMap.get(exchangeName);
    }
    // New method to convert internal name to exchange name
    getExchangeName(internalName) {
        for (const [exchangeName, name] of this.exchangeToInternalNameMap.entries()) {
            if (name === internalName) {
                return exchangeName;
            }
        }
        return undefined;
    }
    async initialize() {
        await this.refreshAssetToIndexMap();
        this.startPeriodicRefresh();
    }
    async ensureInitialized() {
        if (!this.initializationPromise) {
            this.initializationPromise = this.initialize();
        }
        return this.initializationPromise;
    }
    startPeriodicRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshAssetToIndexMap();
        }, this.refreshIntervalMs); // Refresh every minute
    }
    getAssetIndex(assetSymbol) {
        return this.assetToIndexMap.get(assetSymbol);
    }
    getAllAssets() {
        const perp = [];
        const spot = [];
        for (const [asset, index] of this.assetToIndexMap.entries()) {
            if (asset.endsWith('-PERP')) {
                perp.push(asset);
            }
            else if (asset.endsWith('-SPOT')) {
                spot.push(asset);
            }
        }
        return { perp, spot };
    }
    async connect() {
        await this.ws.connect();
    }
    disconnect() {
        this.ws.close();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}
exports.Hyperliquid = Hyperliquid;
__exportStar(require("./types"), exports);
__exportStar(require("./utils/signing"), exports);
//# sourceMappingURL=index.js.map