"use strict";
// src/rest/custom.ts
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
exports.CustomOperations = void 0;
var ethers_1 = require("ethers");
var CustomOperations = /** @class */ (function () {
    function CustomOperations(exchange, infoApi, privateKey, exchangeToInternalNameMap, assetToIndexMap, initializationPromise) {
        this.exchange = exchange;
        this.infoApi = infoApi;
        this.wallet = new ethers_1.ethers.Wallet(privateKey);
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
        this.assetToIndexMap = assetToIndexMap;
    }
    CustomOperations.prototype.ensureInitialized = function () {
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
    CustomOperations.prototype.cancelAllOrders = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var openOrders, ordersToCancel, cancelRequests, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.infoApi.getUserOpenOrders(this.wallet.address)];
                    case 2:
                        openOrders = _a.sent();
                        ordersToCancel = void 0;
                        openOrders.forEach(function (order) {
                            var internalName = _this.exchangeToInternalNameMap.get(order.coin);
                            if (internalName) {
                                order.coin = internalName;
                            }
                        });
                        if (symbol) {
                            ordersToCancel = openOrders.filter(function (order) { return order.coin === symbol; });
                        }
                        else {
                            ordersToCancel = openOrders;
                        }
                        if (ordersToCancel.length === 0) {
                            throw new Error('No orders to cancel');
                        }
                        cancelRequests = ordersToCancel.map(function (order) { return ({
                            coin: order.coin,
                            o: order.oid
                        }); });
                        return [2 /*return*/, this.exchange.cancelOrder(cancelRequests)];
                    case 3:
                        error_1 = _a.sent();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Get a list of all SPOT and PERP assets that are tradable
    CustomOperations.prototype.getAllAssets = function () {
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
    return CustomOperations;
}());
exports.CustomOperations = CustomOperations;
