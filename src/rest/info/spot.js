"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotInfoAPI = void 0;
var CONSTANTS = require("../../types/constants");
var SpotInfoAPI = /** @class */ (function () {
    function SpotInfoAPI(httpApi, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = httpApi;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    SpotInfoAPI.prototype.convertSymbol = function (symbol, mode, symbolMode) {
        if (mode === void 0) { mode = ""; }
        if (symbolMode === void 0) { symbolMode = ""; }
        var rSymbol;
        if (mode == "reverse") {
            for (var _i = 0, _a = this.exchangeToInternalNameMap.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
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
    };
    SpotInfoAPI.prototype.convertSymbolsInObject = function (obj, symbolsFields, symbolMode) {
        var _this = this;
        if (symbolsFields === void 0) { symbolsFields = ["coin", "symbol"]; }
        if (symbolMode === void 0) { symbolMode = ""; }
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(function (item) { return _this.convertSymbolsInObject(item, symbolsFields, symbolMode); });
        }
        var convertedObj = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
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
    };
    SpotInfoAPI.prototype.convertToNumber = function (value) {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            }
            else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    };
    SpotInfoAPI.prototype.getSpotMeta = function () {
        return __awaiter(this, arguments, void 0, function (raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initializationPromise];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_META })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "SPOT")];
                }
            });
        });
    };
    SpotInfoAPI.prototype.getSpotClearinghouseState = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initializationPromise];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_CLEARINGHOUSE_STATE, user: user })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "SPOT")];
                }
            });
        });
    };
    SpotInfoAPI.prototype.getSpotMetaAndAssetCtxs = function () {
        return __awaiter(this, arguments, void 0, function (raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initializationPromise];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.SPOT_META_AND_ASSET_CTXS })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    return SpotInfoAPI;
}());
exports.SpotInfoAPI = SpotInfoAPI;
