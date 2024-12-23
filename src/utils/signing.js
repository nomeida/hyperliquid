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
exports.orderTypeToWire = orderTypeToWire;
exports.signL1Action = signL1Action;
exports.signUserSignedAction = signUserSignedAction;
exports.signUsdTransferAction = signUsdTransferAction;
exports.signWithdrawFromBridgeAction = signWithdrawFromBridgeAction;
exports.signAgent = signAgent;
exports.floatToWire = floatToWire;
exports.floatToIntForHashing = floatToIntForHashing;
exports.floatToUsdInt = floatToUsdInt;
exports.getTimestampMs = getTimestampMs;
exports.orderRequestToOrderWire = orderRequestToOrderWire;
exports.cancelOrderToAction = cancelOrderToAction;
exports.orderWiresToOrderAction = orderWiresToOrderAction;
var msgpack_1 = require("@msgpack/msgpack");
var ethers_1 = require("ethers");
var IS_MAINNET = true; // switch this to false to sign for testnet
var phantomDomain = {
    name: "Exchange",
    version: "1",
    chainId: 1337,
    verifyingContract: "0x0000000000000000000000000000000000000000"
};
var agentTypes = {
    Agent: [
        { name: "source", type: "string" },
        { name: "connectionId", type: "bytes32" },
    ],
};
function orderTypeToWire(orderType) {
    if (orderType.limit) {
        return { limit: orderType.limit };
    }
    else if (orderType.trigger) {
        return {
            trigger: {
                triggerPx: parseFloat(floatToWire(orderType.trigger.triggerPx)),
                isMarket: orderType.trigger.isMarket,
                tpsl: orderType.trigger.tpsl
            }
        };
    }
    throw new Error("Invalid order type");
}
function addressToBytes(address) {
    return ethers_1.ethers.getBytes(address);
}
function actionHash(action, vaultAddress, nonce) {
    var msgPackBytes = (0, msgpack_1.encode)(action);
    // console.log("action hash", Buffer.from(msgPackBytes).toString("base64"));
    var additionalBytesLength = vaultAddress === null ? 9 : 29;
    var data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
    data.set(msgPackBytes);
    var view = new DataView(data.buffer);
    view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);
    if (vaultAddress === null) {
        view.setUint8(msgPackBytes.length + 8, 0);
    }
    else {
        view.setUint8(msgPackBytes.length + 8, 1);
        data.set(addressToBytes(vaultAddress), msgPackBytes.length + 9);
    }
    return ethers_1.ethers.keccak256(data);
}
function constructPhantomAgent(hash, isMainnet) {
    return { source: isMainnet ? "a" : "b", connectionId: hash };
}
function signL1Action(wallet, action, activePool, nonce) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, phantomAgent, data;
        return __generator(this, function (_a) {
            hash = actionHash(action, activePool, nonce);
            phantomAgent = constructPhantomAgent(hash, IS_MAINNET);
            data = {
                domain: phantomDomain,
                types: agentTypes,
                primaryType: "Agent",
                message: phantomAgent,
            };
            return [2 /*return*/, signInner(wallet, data)];
        });
    });
}
function signUserSignedAction(wallet, action, payloadTypes, primaryType) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        var _a;
        return __generator(this, function (_b) {
            action.signatureChainId = "0x66eee";
            action.hyperliquidChain = IS_MAINNET ? "Mainnet" : "Testnet";
            data = {
                domain: {
                    name: "HyperliquidSignTransaction",
                    version: "1",
                    chainId: 421614,
                    verifyingContract: "0x0000000000000000000000000000000000000000"
                },
                types: (_a = {},
                    _a[primaryType] = payloadTypes,
                    _a),
                primaryType: primaryType,
                message: action,
            };
            return [2 /*return*/, signInner(wallet, data)];
        });
    });
}
function signUsdTransferAction(wallet, action) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, signUserSignedAction(wallet, action, [
                    { name: "hyperliquidChain", type: "string" },
                    { name: "destination", type: "string" },
                    { name: "amount", type: "string" },
                    { name: "time", type: "uint64" },
                ], "HyperliquidTransaction:UsdSend")];
        });
    });
}
function signWithdrawFromBridgeAction(wallet, action) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, signUserSignedAction(wallet, action, [
                    { name: "hyperliquidChain", type: "string" },
                    { name: "destination", type: "string" },
                    { name: "amount", type: "string" },
                    { name: "time", type: "uint64" },
                ], "HyperliquidTransaction:Withdraw")];
        });
    });
}
function signAgent(wallet, action) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, signUserSignedAction(wallet, action, [
                    { name: "hyperliquidChain", type: "string" },
                    { name: "agentAddress", type: "address" },
                    { name: "agentName", type: "string" },
                    { name: "nonce", type: "uint64" },
                ], "HyperliquidTransaction:ApproveAgent")];
        });
    });
}
function signInner(wallet, data) {
    return __awaiter(this, void 0, void 0, function () {
        var signature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wallet.signTypedData(data.domain, data.types, data.message)];
                case 1:
                    signature = _a.sent();
                    return [2 /*return*/, splitSig(signature)];
            }
        });
    });
}
function splitSig(sig) {
    var _a = ethers_1.ethers.Signature.from(sig), r = _a.r, s = _a.s, v = _a.v;
    return { r: r, s: s, v: v };
}
function floatToWire(x) {
    var rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error("floatToWire causes rounding: ".concat(x));
    }
    var normalized = rounded.replace(/\.?0+$/, '');
    if (normalized === '-0')
        normalized = '0';
    return normalized;
}
function floatToIntForHashing(x) {
    return floatToInt(x, 8);
}
function floatToUsdInt(x) {
    return floatToInt(x, 6);
}
function floatToInt(x, power) {
    var withDecimals = x * Math.pow(10, power);
    if (Math.abs(Math.round(withDecimals) - withDecimals) >= 1e-3) {
        throw new Error("floatToInt causes rounding: ".concat(x));
    }
    return Math.round(withDecimals);
}
function getTimestampMs() {
    return Date.now();
}
function orderRequestToOrderWire(order, asset) {
    var orderWire = {
        a: asset,
        b: order.is_buy,
        p: floatToWire(order.limit_px),
        s: floatToWire(order.sz),
        r: order.reduce_only,
        t: orderTypeToWire(order.order_type)
    };
    if (order.cloid !== undefined) {
        orderWire.c = order.cloid;
    }
    return orderWire;
}
function cancelOrderToAction(cancelRequest) {
    return {
        type: 'cancel',
        cancels: [cancelRequest],
    };
}
function orderWiresToOrderAction(orderWires) {
    return {
        type: "order",
        orders: orderWires,
        grouping: "na",
    };
}
