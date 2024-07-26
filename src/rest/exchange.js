"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.ExchangeAPI = void 0;
var ethers_1 = require("ethers");
var helpers_1 = require("../utils/helpers");
var signing_1 = require("../utils/signing");
var CONSTANTS = require("../types/constants");
var IS_MAINNET = true; // Make sure this matches the IS_MAINNET in signing.ts
var ExchangeAPI = /** @class */ (function () {
    function ExchangeAPI(baseURL, privateKey, info, rateLimiter, assetToIndexMap, exchangeToInternalNameMap, initializationPromise) {
        this.info = info;
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.EXCHANGE, rateLimiter);
        this.wallet = new ethers_1.ethers.Wallet(privateKey);
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    ExchangeAPI.prototype.updateAssetMaps = function (assetToIndexMap, exchangeToInternalNameMap) {
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
    };
    //Get the asset index for a given symbol i.e BTC-PERP -> 1
    ExchangeAPI.prototype.getAssetIndex = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initializationPromise];
                    case 1:
                        _a.sent();
                        index = this.assetToIndexMap.get(symbol);
                        if (index === undefined) {
                            throw new Error("Unknown asset: ".concat(symbol));
                        }
                        return [2 /*return*/, index];
                }
            });
        });
    };
    //Create an order/place an order
    ExchangeAPI.prototype.placeOrder = function (orderRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndex, orderWire, action, nonce, signature, payload, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAssetIndex(orderRequest.coin)];
                    case 1:
                        assetIndex = _a.sent();
                        orderWire = (0, signing_1.orderRequestToOrderWire)(orderRequest, assetIndex);
                        action = (0, signing_1.orderWiresToOrderAction)([orderWire]);
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_1 = _a.sent();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Cancel using order id (oid)
    ExchangeAPI.prototype.cancelOrder = function (cancelRequests) {
        return __awaiter(this, void 0, void 0, function () {
            var cancels, cancelsWithIndices, action, nonce, signature, payload, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
                        return [4 /*yield*/, Promise.all(cancels.map(function (req) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                var _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _a = [__assign({}, req)];
                                            _b = {};
                                            return [4 /*yield*/, this.getAssetIndex(req.coin)];
                                        case 1: return [2 /*return*/, (__assign.apply(void 0, _a.concat([(_b.a = _c.sent(), _b)])))];
                                    }
                                });
                            }); }))];
                    case 1:
                        cancelsWithIndices = _a.sent();
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.CANCEL,
                            cancels: cancelsWithIndices.map(function (_a) {
                                var a = _a.a, o = _a.o;
                                return ({ a: a, o: o });
                            })
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_2 = _a.sent();
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Cancel using a CLOID
    ExchangeAPI.prototype.cancelOrderByCloid = function (symbol, cloid) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndex, action, nonce, signature, payload, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAssetIndex(symbol)];
                    case 1:
                        assetIndex = _a.sent();
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.CANCEL_BY_CLOID,
                            cancels: [{ asset: assetIndex, cloid: cloid }]
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_3 = _a.sent();
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Modify a single order
    ExchangeAPI.prototype.modifyOrder = function (oid, orderRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndex, orderWire, action, nonce, signature, payload, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAssetIndex(orderRequest.coin)];
                    case 1:
                        assetIndex = _a.sent();
                        orderWire = (0, signing_1.orderRequestToOrderWire)(orderRequest, assetIndex);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.MODIFY,
                            oid: oid,
                            order: orderWire
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_4 = _a.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Modify multiple orders at once
    ExchangeAPI.prototype.batchModifyOrders = function (modifies) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndices_1, action, nonce, signature, payload, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.all(modifies.map(function (m) { return _this.getAssetIndex(m.order.coin); }))];
                    case 1:
                        assetIndices_1 = _a.sent();
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.BATCH_MODIFY,
                            modifies: modifies.map(function (m, index) { return ({
                                oid: m.oid,
                                order: (0, signing_1.orderRequestToOrderWire)(m.order, assetIndices_1[index])
                            }); })
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_5 = _a.sent();
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Update leverage. Set leverageMode to "cross" if you want cross leverage, otherwise it'll set it to "isolated by default"
    ExchangeAPI.prototype.updateLeverage = function (symbol, leverageMode, leverage) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndex, action, nonce, signature, payload, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAssetIndex(symbol)];
                    case 1:
                        assetIndex = _a.sent();
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.UPDATE_LEVERAGE,
                            asset: assetIndex,
                            isCross: leverageMode === "cross",
                            leverage: leverage
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_6 = _a.sent();
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Update how much margin there is on a perps position
    ExchangeAPI.prototype.updateIsolatedMargin = function (symbol, isBuy, ntli) {
        return __awaiter(this, void 0, void 0, function () {
            var assetIndex, action, nonce, signature, payload, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAssetIndex(symbol)];
                    case 1:
                        assetIndex = _a.sent();
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.UPDATE_ISOLATED_MARGIN,
                            asset: assetIndex,
                            isBuy: isBuy,
                            ntli: ntli
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 2:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 3:
                        error_7 = _a.sent();
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //Takes from the perps wallet and sends to another wallet without the $1 fee (doesn't touch bridge, so no fees)
    ExchangeAPI.prototype.usdTransfer = function (destination, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var action, signature, payload, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.USD_SEND,
                            hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                            signatureChainId: '0xa4b1',
                            destination: destination,
                            amount: amount.toString(),
                            time: Date.now()
                        };
                        return [4 /*yield*/, (0, signing_1.signUsdTransferAction)(this.wallet, action)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: action.time, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_8 = _a.sent();
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //Transfer SPOT assets i.e PURR to another wallet (doesn't touch bridge, so no fees)
    ExchangeAPI.prototype.spotTransfer = function (destination, token, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var action, signature, payload, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.SPOT_SEND,
                            hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                            signatureChainId: '0xa4b1',
                            destination: destination,
                            token: token,
                            amount: amount,
                            time: Date.now()
                        };
                        return [4 /*yield*/, (0, signing_1.signUserSignedAction)(this.wallet, action, [
                                { name: 'hyperliquidChain', type: 'string' },
                                { name: 'destination', type: 'string' },
                                { name: 'token', type: 'string' },
                                { name: 'amount', type: 'string' },
                                { name: 'time', type: 'uint64' }
                            ], 'HyperliquidTransaction:SpotSend')];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: action.time, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_9 = _a.sent();
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //Withdraw USDC, this txn goes across the bridge and costs $1 in fees as of writing this
    ExchangeAPI.prototype.initiateWithdrawal = function (destination, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var action, signature, payload, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.WITHDRAW,
                            hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                            signatureChainId: '0xa4b1',
                            destination: destination,
                            amount: amount.toString(),
                            time: Date.now()
                        };
                        return [4 /*yield*/, (0, signing_1.signWithdrawFromBridgeAction)(this.wallet, action)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: action.time, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_10 = _a.sent();
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //Transfer between spot and perpetual wallets (intra-account transfer)
    ExchangeAPI.prototype.transferBetweenSpotAndPerp = function (usdc, toPerp) {
        return __awaiter(this, void 0, void 0, function () {
            var action, nonce, signature, payload, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.SPOT_USER,
                            classTransfer: {
                                usdc: usdc * 1e6,
                                toPerp: toPerp
                            }
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_11 = _a.sent();
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //Schedule a cancel for a given time (in ms) //Note: Only available once you've traded $1 000 000 in volume
    ExchangeAPI.prototype.scheduleCancel = function (time) {
        return __awaiter(this, void 0, void 0, function () {
            var action, nonce, signature, payload, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = { type: CONSTANTS.EXCHANGE_TYPES.SCHEDULE_CANCEL, time: time };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_12 = _a.sent();
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //Transfer between vault and perpetual wallets (intra-account transfer)
    ExchangeAPI.prototype.vaultTransfer = function (vaultAddress, isDeposit, usd) {
        return __awaiter(this, void 0, void 0, function () {
            var action, nonce, signature, payload, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.VAULT_TRANSFER,
                            vaultAddress: vaultAddress,
                            isDeposit: isDeposit,
                            usd: usd
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_13 = _a.sent();
                        throw error_13;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ExchangeAPI.prototype.setReferrer = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var action, nonce, signature, payload, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        action = {
                            type: CONSTANTS.EXCHANGE_TYPES.SET_REFERRER,
                            code: code
                        };
                        nonce = Date.now();
                        return [4 /*yield*/, (0, signing_1.signL1Action)(this.wallet, action, null, nonce)];
                    case 1:
                        signature = _a.sent();
                        payload = { action: action, nonce: nonce, signature: signature };
                        return [2 /*return*/, this.httpApi.makeRequest(payload, 1)];
                    case 2:
                        error_14 = _a.sent();
                        throw error_14;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ExchangeAPI;
}());
exports.ExchangeAPI = ExchangeAPI;
