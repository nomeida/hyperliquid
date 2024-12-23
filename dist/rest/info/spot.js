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
exports.SpotInfoAPI = void 0;
const CONSTANTS = __importStar(require("../../types/constants"));
class SpotInfoAPI {
    constructor(httpApi, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = httpApi;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    convertSymbol(symbol, mode = "", symbolMode = "") {
        let rSymbol;
        if (mode == "reverse") {
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
        if (symbolMode == "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {
                rSymbol = symbol + "-SPOT";
            }
        }
        else if (symbolMode == "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }
        return rSymbol;
    }
    convertSymbolsInObject(obj, symbolsFields = ["coin", "symbol"], symbolMode = "") {
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode));
        }
        const convertedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = this.convertSymbol(value, "", symbolMode);
            }
            else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            }
            else {
                convertedObj[key] = this.convertSymbolsInObject(value, symbolsFields, symbolMode);
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
    async getSpotMeta(raw_response = false) {
        if (!raw_response) {
            await this.initializationPromise;
        }
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_META });
        return raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "SPOT");
    }
    async getSpotClearinghouseState(user, raw_response = false) {
        if (!raw_response) {
            await this.initializationPromise;
        }
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_CLEARINGHOUSE_STATE, user: user });
        return raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "SPOT");
    }
    async getSpotMetaAndAssetCtxs(raw_response = false) {
        if (!raw_response) {
            await this.initializationPromise;
        }
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_META_AND_ASSET_CTXS });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
}
exports.SpotInfoAPI = SpotInfoAPI;
//# sourceMappingURL=spot.js.map