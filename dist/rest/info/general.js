"use strict";
// src/rest/info/general.ts
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
exports.GeneralInfoAPI = void 0;
const CONSTANTS = __importStar(require("../../types/constants"));
class GeneralInfoAPI {
    constructor(httpApi, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = httpApi;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    async ensureInitialized() {
        await this.initializationPromise;
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
    async getAllMids(raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ALL_MIDS });
        if (raw_response) {
            return response;
        }
        else {
            const convertedResponse = {};
            for (const [key, value] of Object.entries(response)) {
                const convertedKey = this.convertSymbol(key);
                const convertedValue = parseFloat(value);
                convertedResponse[convertedKey] = convertedValue;
            }
            return convertedResponse;
        }
    }
    async getUserOpenOrders(user, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.OPEN_ORDERS, user: user });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getFrontendOpenOrders(user, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.FRONTEND_OPEN_ORDERS, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getUserFills(user, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_FILLS, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getUserFillsByTime(user, startTime, endTime, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        let params = {
            user: user,
            startTime: Math.round(startTime),
            type: CONSTANTS.INFO_TYPES.USER_FILLS_BY_TIME
        };
        if (endTime) {
            params.endTime = Math.round(endTime);
        }
        const response = await this.httpApi.makeRequest(params, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getUserRateLimit(user, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_RATE_LIMIT, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getOrderStatus(user, oid, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ORDER_STATUS, user: user, oid: oid });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getL2Book(coin, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.L2_BOOK, coin: this.convertSymbol(coin, "reverse") });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
    async getCandleSnapshot(coin, interval, startTime, endTime, raw_response = false) {
        if (!raw_response)
            await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({
            type: CONSTANTS.INFO_TYPES.CANDLE_SNAPSHOT,
            req: { coin: this.convertSymbol(coin, "reverse"), interval: interval, startTime: startTime, endTime: endTime }
        });
        return raw_response ? response : this.convertSymbolsInObject(response, ["s"]);
    }
}
exports.GeneralInfoAPI = GeneralInfoAPI;
//# sourceMappingURL=general.js.map