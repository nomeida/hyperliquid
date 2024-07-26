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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.Hyperliquid = void 0;
var info_1 = require("./rest/info");
var exchange_1 = require("./rest/exchange");
var connection_1 = require("./websocket/connection");
var subscriptions_1 = require("./websocket/subscriptions");
var rateLimiter_1 = require("./utils/rateLimiter");
var helpers_1 = require("./utils/helpers");
var CONSTANTS = require("./types/constants");
var custom_1 = require("./rest/custom");
var Hyperliquid = /** @class */ (function () {
    function Hyperliquid(privateKey, testnet) {
        if (testnet === void 0) { testnet = false; }
        this.refreshInterval = null;
        this.refreshIntervalMs = 60000;
        this.initializationPromise = null;
        var baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;
        this.refreshIntervalMs = 60000;
        this.rateLimiter = new rateLimiter_1.RateLimiter(); // 1200 tokens per minute
        this.assetToIndexMap = new Map();
        this.assetToIndexMap = new Map();
        this.exchangeToInternalNameMap = new Map();
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, this.rateLimiter);
        var formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : "0x".concat(privateKey);
        this.initializationPromise = this.initialize();
        this.info = new info_1.InfoAPI(baseURL, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
        this.exchange = new exchange_1.ExchangeAPI(baseURL, formattedPrivateKey, this.info, this.rateLimiter, this.assetToIndexMap, this.exchangeToInternalNameMap, this.initializationPromise);
        this.custom = new custom_1.CustomOperations(this.exchange, this.info, formattedPrivateKey, this.exchangeToInternalNameMap, this.assetToIndexMap, this.initializationPromise);
        this.ws = new connection_1.WebSocketClient(testnet);
        this.subscriptions = new subscriptions_1.WebSocketSubscriptions(this.ws);
    }
    Hyperliquid.prototype.refreshAssetToIndexMap = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, perpMeta, spotMeta_1, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, Promise.all([
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.httpApi.makeRequest({
                                                    "type": CONSTANTS.INFO_TYPES.PERPS_META_AND_ASSET_CTXS
                                                })];
                                            case 1:
                                                result = _a.sent();
                                                return [2 /*return*/, result];
                                        }
                                    });
                                }); })(),
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.httpApi.makeRequest({
                                                    "type": CONSTANTS.INFO_TYPES.SPOT_META_AND_ASSET_CTXS
                                                })];
                                            case 1:
                                                result = _a.sent();
                                                return [2 /*return*/, result];
                                        }
                                    });
                                }); })()
                            ])];
                    case 1:
                        _a = _b.sent(), perpMeta = _a[0], spotMeta_1 = _a[1];
                        this.assetToIndexMap.clear();
                        this.exchangeToInternalNameMap.clear();
                        // Handle perpetual assets
                        perpMeta[0].universe.forEach(function (asset, index) {
                            var internalName = "".concat(asset.name, "-PERP");
                            _this.assetToIndexMap.set(internalName, index);
                            _this.exchangeToInternalNameMap.set(asset.name, internalName);
                        });
                        // Handle spot assets
                        spotMeta_1[0].tokens.forEach(function (token) {
                            var universeItem = spotMeta_1[0].universe.find(function (item) { return item.tokens[0] === token.index; });
                            if (universeItem) {
                                var internalName = "".concat(token.name, "-SPOT");
                                var exchangeName = universeItem.name;
                                var index = spotMeta_1[0].universe.indexOf(universeItem);
                                _this.assetToIndexMap.set(internalName, 10000 + index);
                                _this.exchangeToInternalNameMap.set(exchangeName, internalName);
                            }
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Failed to refresh asset maps:', error_1);
                        return [3 /*break*/, 4];
                    case 3: return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // New method to convert exchange name to internal name
    Hyperliquid.prototype.getInternalName = function (exchangeName) {
        return this.exchangeToInternalNameMap.get(exchangeName);
    };
    // New method to convert internal name to exchange name
    Hyperliquid.prototype.getExchangeName = function (internalName) {
        for (var _i = 0, _a = this.exchangeToInternalNameMap.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], exchangeName = _b[0], name_1 = _b[1];
            if (name_1 === internalName) {
                return exchangeName;
            }
        }
        return undefined;
    };
    Hyperliquid.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.refreshAssetToIndexMap()];
                    case 1:
                        _a.sent();
                        this.startPeriodicRefresh();
                        return [2 /*return*/];
                }
            });
        });
    };
    Hyperliquid.prototype.ensureInitialized = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.initializationPromise) {
                    this.initializationPromise = this.initialize();
                }
                return [2 /*return*/, this.initializationPromise];
            });
        });
    };
    Hyperliquid.prototype.startPeriodicRefresh = function () {
        var _this = this;
        this.refreshInterval = setInterval(function () {
            _this.refreshAssetToIndexMap();
        }, this.refreshIntervalMs); // Refresh every minute
    };
    Hyperliquid.prototype.getAssetIndex = function (assetSymbol) {
        return this.assetToIndexMap.get(assetSymbol);
    };
    Hyperliquid.prototype.getAllAssets = function () {
        var perp = [];
        var spot = [];
        for (var _i = 0, _a = this.assetToIndexMap.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], asset = _b[0], index = _b[1];
            if (asset.endsWith('-PERP')) {
                perp.push(asset);
            }
            else if (asset.endsWith('-SPOT')) {
                spot.push(asset);
            }
        }
        return { perp: perp, spot: spot };
    };
    Hyperliquid.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ws.connect()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Hyperliquid.prototype.disconnect = function () {
        this.ws.close();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    };
    return Hyperliquid;
}());
exports.Hyperliquid = Hyperliquid;
__exportStar(require("./types"), exports);
__exportStar(require("./utils/signing"), exports);
