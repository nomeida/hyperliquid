"use strict";
// src/rest/info/general.ts
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
exports.GeneralInfoAPI = void 0;
var CONSTANTS = require("../../types/constants");
var GeneralInfoAPI = /** @class */ (function () {
    function GeneralInfoAPI(httpApi, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = httpApi;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    GeneralInfoAPI.prototype.ensureInitialized = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initializationPromise];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.convertSymbol = function (symbol, mode, symbolMode) {
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
    GeneralInfoAPI.prototype.convertSymbolsInObject = function (obj, symbolsFields, symbolMode) {
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
    GeneralInfoAPI.prototype.convertToNumber = function (value) {
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
    GeneralInfoAPI.prototype.getAllMids = function () {
        return __awaiter(this, arguments, void 0, function (raw_response) {
            var response, convertedResponse, _i, _a, _b, key, value, convertedKey, convertedValue;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ALL_MIDS })];
                    case 3:
                        response = _c.sent();
                        if (raw_response) {
                            return [2 /*return*/, response];
                        }
                        else {
                            convertedResponse = {};
                            for (_i = 0, _a = Object.entries(response); _i < _a.length; _i++) {
                                _b = _a[_i], key = _b[0], value = _b[1];
                                convertedKey = this.convertSymbol(key);
                                convertedValue = parseFloat(value);
                                convertedResponse[convertedKey] = convertedValue;
                            }
                            return [2 /*return*/, convertedResponse];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getUserOpenOrders = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.OPEN_ORDERS, user: user })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getFrontendOpenOrders = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.FRONTEND_OPEN_ORDERS, user: user }, 20)];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getUserFills = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_FILLS, user: user }, 20)];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getUserFillsByTime = function (user_1, startTime_1, endTime_1) {
        return __awaiter(this, arguments, void 0, function (user, startTime, endTime, raw_response) {
            var params, response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        params = {
                            user: user,
                            startTime: Math.round(startTime),
                            type: CONSTANTS.INFO_TYPES.USER_FILLS_BY_TIME
                        };
                        if (endTime) {
                            params.endTime = Math.round(endTime);
                        }
                        return [4 /*yield*/, this.httpApi.makeRequest(params, 20)];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getUserRateLimit = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_RATE_LIMIT, user: user }, 20)];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getOrderStatus = function (user_1, oid_1) {
        return __awaiter(this, arguments, void 0, function (user, oid, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ORDER_STATUS, user: user, oid: oid })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getL2Book = function (coin_1) {
        return __awaiter(this, arguments, void 0, function (coin, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.L2_BOOK, coin: this.convertSymbol(coin, "reverse") })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response)];
                }
            });
        });
    };
    GeneralInfoAPI.prototype.getCandleSnapshot = function (coin_1, interval_1, startTime_1, endTime_1) {
        return __awaiter(this, arguments, void 0, function (coin, interval, startTime, endTime, raw_response) {
            var response;
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!raw_response) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.httpApi.makeRequest({
                            type: CONSTANTS.INFO_TYPES.CANDLE_SNAPSHOT,
                            req: { coin: this.convertSymbol(coin, "reverse"), interval: interval, startTime: startTime, endTime: endTime }
                        })];
                    case 3:
                        response = _a.sent();
                        return [2 /*return*/, raw_response ? response : this.convertSymbolsInObject(response, ["s"])];
                }
            });
        });
    };
    return GeneralInfoAPI;
}());
exports.GeneralInfoAPI = GeneralInfoAPI;
