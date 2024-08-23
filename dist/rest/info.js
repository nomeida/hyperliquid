"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoAPI = void 0;
const general_1 = require("./info/general");
const spot_1 = require("./info/spot");
const perpetuals_1 = require("./info/perpetuals");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../types/constants");
class InfoAPI {
    constructor(baseURL, rateLimiter, symbolConversion) {
        this.httpApi = new helpers_1.HttpApi(baseURL, constants_1.ENDPOINTS.INFO, rateLimiter);
        this.symbolConversion = symbolConversion;
        this.generalAPI = new general_1.GeneralInfoAPI(this.httpApi, this.symbolConversion);
        this.spot = new spot_1.SpotInfoAPI(this.httpApi, this.symbolConversion);
        this.perpetuals = new perpetuals_1.PerpetualsInfoAPI(this.httpApi, this.symbolConversion);
    }
    async getAssetIndex(assetName) {
        return await this.symbolConversion.getAssetIndex(assetName);
    }
    async getInternalName(exchangeName) {
        return await this.symbolConversion.convertSymbol(exchangeName);
    }
    async getAllAssets() {
        return await this.symbolConversion.getAllAssets();
    }
    async getAllMids(rawResponse = false) {
        return this.generalAPI.getAllMids(rawResponse);
    }
    async getUserOpenOrders(user, rawResponse = false) {
        return this.generalAPI.getUserOpenOrders(user, rawResponse);
    }
    async getFrontendOpenOrders(user, rawResponse = false) {
        return this.generalAPI.getFrontendOpenOrders(user, rawResponse);
    }
    async getUserFills(user, rawResponse = false) {
        return this.generalAPI.getUserFills(user, rawResponse);
    }
    async getUserFillsByTime(user, startTime, endTime, rawResponse = false) {
        return this.generalAPI.getUserFillsByTime(user, startTime, endTime, rawResponse);
    }
    async getUserRateLimit(user, rawResponse = false) {
        return this.generalAPI.getUserRateLimit(user, rawResponse);
    }
    async getOrderStatus(user, oid, rawResponse = false) {
        return this.generalAPI.getOrderStatus(user, oid, rawResponse);
    }
    async getL2Book(coin, rawResponse = false) {
        return this.generalAPI.getL2Book(coin, rawResponse);
    }
    async getCandleSnapshot(coin, interval, startTime, endTime, rawResponse = false) {
        return this.generalAPI.getCandleSnapshot(coin, interval, startTime, endTime, rawResponse);
    }
}
exports.InfoAPI = InfoAPI;
//# sourceMappingURL=info.js.map