"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotInfoAPI = void 0;
const constants_1 = require("../../types/constants");
class SpotInfoAPI {
    constructor(httpApi, symbolConversion) {
        this.httpApi = httpApi;
        this.symbolConversion = symbolConversion;
    }
    async getSpotMeta(rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.SPOT_META });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response, ["name", "coin", "symbol"], "SPOT");
    }
    async getSpotClearinghouseState(user, rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.SPOT_CLEARINGHOUSE_STATE, user: user });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response, ["name", "coin", "symbol"], "SPOT");
    }
    async getSpotMetaAndAssetCtxs(rawResponse = false) {
        const response = await this.httpApi.makeRequest({ type: constants_1.InfoType.SPOT_META_AND_ASSET_CTXS });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
}
exports.SpotInfoAPI = SpotInfoAPI;
//# sourceMappingURL=spot.js.map