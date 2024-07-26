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
exports.InfoAPI = void 0;
var general_1 = require("./info/general");
var spot_1 = require("./info/spot");
var perpetuals_1 = require("./info/perpetuals");
var helpers_1 = require("../utils/helpers");
var CONSTANTS = require("../types/constants");
var InfoAPI = /** @class */ (function () {
    function InfoAPI(baseURL, rateLimiter, assetToIndexMap, exchangeToInternalNameMap, initializationPromise) {
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
        this.generalAPI = new general_1.GeneralInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.spot = new spot_1.SpotInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
        this.perpetuals = new perpetuals_1.PerpetualsInfoAPI(this.httpApi, this.exchangeToInternalNameMap, this.initializationPromise);
    }
    InfoAPI.prototype.ensureInitialized = function () {
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
    InfoAPI.prototype.getAssetIndex = function (assetName) {
        return this.assetToIndexMap.get(assetName);
    };
    InfoAPI.prototype.getInternalName = function (exchangeName) {
        return this.exchangeToInternalNameMap.get(exchangeName);
    };
    InfoAPI.prototype.getAllAssets = function () {
        return Array.from(this.assetToIndexMap.keys());
    };
    InfoAPI.prototype.getAllMids = function () {
        return __awaiter(this, arguments, void 0, function (raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getAllMids(raw_response)];
            });
        });
    };
    InfoAPI.prototype.getUserOpenOrders = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getUserOpenOrders(user, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getFrontendOpenOrders = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getFrontendOpenOrders(user, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getUserFills = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getUserFills(user, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getUserFillsByTime = function (user_1, startTime_1, endTime_1) {
        return __awaiter(this, arguments, void 0, function (user, startTime, endTime, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getUserFillsByTime(user, startTime, endTime, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getUserRateLimit = function (user_1) {
        return __awaiter(this, arguments, void 0, function (user, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getUserRateLimit(user, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getOrderStatus = function (user_1, oid_1) {
        return __awaiter(this, arguments, void 0, function (user, oid, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getOrderStatus(user, oid, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getL2Book = function (coin_1) {
        return __awaiter(this, arguments, void 0, function (coin, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getL2Book(coin, raw_response)];
            });
        });
    };
    InfoAPI.prototype.getCandleSnapshot = function (coin_1, interval_1, startTime_1, endTime_1) {
        return __awaiter(this, arguments, void 0, function (coin, interval, startTime, endTime, raw_response) {
            if (raw_response === void 0) { raw_response = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generalAPI.getCandleSnapshot(coin, interval, startTime, endTime, raw_response)];
            });
        });
    };
    return InfoAPI;
}());
exports.InfoAPI = InfoAPI;
