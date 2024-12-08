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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolConversion = void 0;
const helpers_1 = require("./helpers");
const CONSTANTS = __importStar(require("../types/constants"));
class SymbolConversion {
    constructor(baseURL, rateLimiter) {
        this.assetToIndexMap = new Map();
        this.exchangeToInternalNameMap = new Map();
        this.refreshIntervalMs = 60000;
        this.refreshInterval = null;
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
        this.initializationPromise = this.initialize();
    }
    async initialize() {
        await this.refreshAssetMaps();
        this.startPeriodicRefresh();
    }
    async refreshAssetMaps() {
        try {
            const [perpMeta, spotMeta] = await Promise.all([
                this.httpApi.makeRequest({ "type": CONSTANTS.InfoType.PERPS_META_AND_ASSET_CTXS }),
                this.httpApi.makeRequest({ "type": CONSTANTS.InfoType.SPOT_META_AND_ASSET_CTXS })
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
                    const index = universeItem.index;
                    this.assetToIndexMap.set(internalName, 10000 + index);
                    this.exchangeToInternalNameMap.set(exchangeName, internalName);
                }
            });
        }
        catch (error) {
            console.error('Failed to refresh asset maps:', error);
        }
    }
    startPeriodicRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshAssetMaps();
        }, this.refreshIntervalMs);
    }
    stopPeriodicRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    async ensureInitialized() {
        await this.initializationPromise;
    }
    async getInternalName(exchangeName) {
        await this.ensureInitialized();
        return this.exchangeToInternalNameMap.get(exchangeName);
    }
    async getExchangeName(internalName) {
        await this.ensureInitialized();
        for (const [exchangeName, name] of this.exchangeToInternalNameMap.entries()) {
            if (name === internalName) {
                return exchangeName;
            }
        }
        return undefined;
    }
    async getAssetIndex(assetSymbol) {
        await this.ensureInitialized();
        return this.assetToIndexMap.get(assetSymbol);
    }
    async getAllAssets() {
        await this.ensureInitialized();
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
    async convertSymbol(symbol, mode = "", symbolMode = "") {
        await this.ensureInitialized();
        let rSymbol;
        if (mode === "reverse") {
            for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
                if (value === symbol) {
                    return key;
                }
            }
            rSymbol = symbol;
        }
        else {
            rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
        }
        if (symbolMode === "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {
                rSymbol = symbol + "-SPOT";
            }
        }
        else if (symbolMode === "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }
        return rSymbol;
    }
    async convertSymbolsInObject(obj, symbolsFields = ["coin", "symbol"], symbolMode = "") {
        await this.ensureInitialized();
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);
        }
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode)));
        }
        const convertedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = await this.convertSymbol(value, "", symbolMode);
            }
            else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            }
            else {
                convertedObj[key] = await this.convertSymbolsInObject(value, symbolsFields, symbolMode);
            }
        }
        return convertedObj;
    }
    convertToNumber(value) {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            }
            else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    }
    async convertResponse(response, symbolsFields = ["coin", "symbol"], symbolMode = "") {
        return this.convertSymbolsInObject(response, symbolsFields, symbolMode);
    }
}
exports.SymbolConversion = SymbolConversion;
//# sourceMappingURL=symbolConversion.js.map