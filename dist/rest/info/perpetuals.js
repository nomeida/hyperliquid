"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerpetualsInfoAPI = void 0;
const constants_1 = require("../../types/constants");
class PerpetualsInfoAPI {
    constructor(httpApi, symbolConversion) {
        this.httpApi = httpApi;
        this.symbolConversion = symbolConversion;
    }
    async getMeta(rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.META });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response, ["name", "coin", "symbol"], "PERP");
    }
    async getMetaAndAssetCtxs(rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.PERPS_META_AND_ASSET_CTXS });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response, ["name", "coin", "symbol"], "PERP");
    }
    async getClearinghouseState(user, rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.PERPS_CLEARINGHOUSE_STATE, user: user });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
    async getUserFunding(user, startTime, endTime, rawResponse = false) {
        const response = await this.httpApi.makeRequest({
            type: constants_1.InfoType.USER_FUNDING,
            user: user,
            startTime: startTime,
            endTime: endTime
        }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
    async getUserNonFundingLedgerUpdates(user, startTime, endTime, rawResponse = false) {
        const response = await this.httpApi.makeRequest({
            type: constants_1.InfoType.USER_NON_FUNDING_LEDGER_UPDATES,
            user: user,
            startTime: startTime,
            endTime: endTime
        }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
    async getFundingHistory(coin, startTime, endTime, rawResponse = false) {
        const response = await this.httpApi.makeRequest({
            type: constants_1.InfoType.FUNDING_HISTORY,
            coin: await this.symbolConversion.convertSymbol(coin, "reverse"),
            startTime: startTime,
            endTime: endTime
        }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
}
exports.PerpetualsInfoAPI = PerpetualsInfoAPI;
//# sourceMappingURL=perpetuals.js.map