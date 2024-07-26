"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperliquidAPIError = void 0;
exports.handleApiError = handleApiError;
var HyperliquidAPIError = /** @class */ (function (_super) {
    __extends(HyperliquidAPIError, _super);
    function HyperliquidAPIError(code, message) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.name = 'HyperliquidAPIError';
        return _this;
    }
    return HyperliquidAPIError;
}(Error));
exports.HyperliquidAPIError = HyperliquidAPIError;
function handleApiError(error) {
    if (error.response) {
        //The request was made and the server responded with a status code
        //that falls out of the range of 2xx
        throw new HyperliquidAPIError(error.response.data.code || 'UNKNOWN_ERROR', error.response.data.message || 'An unknown error occurred');
    }
    else if (error.request) {
        //The request was made but no response was received
        throw new HyperliquidAPIError('NETWORK_ERROR', 'No response received from the server');
    }
    else {
        //Something happened in setting up the request that triggered an Error
        throw new HyperliquidAPIError('REQUEST_SETUP_ERROR', error.message);
    }
}
