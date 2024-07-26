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
exports.InfoAPI = void 0;
const general_1 = require("./info/general");
const spot_1 = require("./info/spot");
const perpetuals_1 = require("./info/perpetuals");
const helpers_1 = require("../utils/helpers");
const CONSTANTS = __importStar(require("../types/constants"));
class InfoAPI {
    constructor(baseURL, rateLimiter, assetToIndexMap, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
        this.generalAPI = new general_1.GeneralInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.spot = new spot_1.SpotInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.perpetuals = new perpetuals_1.PerpetualsInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
    }
    async ensureInitialized() {
        await this.initializationPromise;
    }
    getAssetIndex(assetName) {
        return this.assetToIndexMap.get(assetName);
    }
    getInternalName(exchangeName) {
        return this.exchangeToInternalNameMap.get(exchangeName);
    }
    getAllAssets() {
        return Array.from(this.assetToIndexMap.keys());
    }
    async getAllMids(raw_response = false) {
        return this.generalAPI.getAllMids(raw_response);
    }
    async getUserOpenOrders(user, raw_response = false) {
        return this.generalAPI.getUserOpenOrders(user, raw_response);
    }
    async getFrontendOpenOrders(user, raw_response = false) {
        return this.generalAPI.getFrontendOpenOrders(user, raw_response);
    }
    async getUserFills(user, raw_response = false) {
        return this.generalAPI.getUserFills(user, raw_response);
    }
    async getUserFillsByTime(user, startTime, endTime, raw_response = false) {
        return this.generalAPI.getUserFillsByTime(user, startTime, endTime, raw_response);
    }
    async getUserRateLimit(user, raw_response = false) {
        return this.generalAPI.getUserRateLimit(user, raw_response);
    }
    async getOrderStatus(user, oid, raw_response = false) {
        return this.generalAPI.getOrderStatus(user, oid, raw_response);
    }
    async getL2Book(coin, raw_response = false) {
        return this.generalAPI.getL2Book(coin, raw_response);
    }
    async getCandleSnapshot(coin, interval, startTime, endTime, raw_response = false) {
        return this.generalAPI.getCandleSnapshot(coin, interval, startTime, endTime, raw_response);
    }
}
exports.InfoAPI = InfoAPI;
//# sourceMappingURL=info.js.map