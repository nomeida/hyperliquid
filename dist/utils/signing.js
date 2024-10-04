"use strict";
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
const msgpack_1 = require("@msgpack/msgpack");
const ethers_1 = require("ethers");
const phantomDomain = {
    name: 'Exchange',
    version: '1',
    chainId: 1337,
    verifyingContract: '0x0000000000000000000000000000000000000000',
};
const agentTypes = {
    Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
    ],
};
function orderTypeToWire(orderType) {
    if (orderType.limit) {
        return { limit: orderType.limit };
    }
    else if (orderType.trigger) {
        return {
            trigger: {
                triggerPx: floatToWire(Number(orderType.trigger.triggerPx)),
                isMarket: orderType.trigger.isMarket,
                tpsl: orderType.trigger.tpsl,
            },
        };
    }
    throw new Error('Invalid order type');
}
function addressToBytes(address) {
    return (0, ethers_1.getBytes)(address);
}
function actionHash(action, vaultAddress, nonce) {
    const msgPackBytes = (0, msgpack_1.encode)(action);
    const additionalBytesLength = vaultAddress === null ? 9 : 29;
    const data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
    data.set(msgPackBytes);
    const view = new DataView(data.buffer);
    view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);
    if (vaultAddress === null) {
        view.setUint8(msgPackBytes.length + 8, 0);
    }
    else {
        view.setUint8(msgPackBytes.length + 8, 1);
        data.set(addressToBytes(vaultAddress), msgPackBytes.length + 9);
    }
    return (0, ethers_1.keccak256)(data);
}
function constructPhantomAgent(hash, isMainnet) {
    return { source: isMainnet ? 'a' : 'b', connectionId: hash };
}
async function signL1Action(wallet, action, activePool, nonce, isMainnet) {
    const hash = actionHash(action, activePool, nonce);
    const phantomAgent = constructPhantomAgent(hash, isMainnet);
    const data = {
        domain: phantomDomain,
        types: agentTypes,
        primaryType: 'Agent',
        message: phantomAgent,
    };
    return signInner(wallet, data);
}
async function signUserSignedAction(wallet, action, payloadTypes, primaryType, isMainnet) {
    action.signatureChainId = '0x66eee';
    action.hyperliquidChain = isMainnet ? 'Mainnet' : 'Testnet';
    const data = {
        domain: {
            name: 'HyperliquidSignTransaction',
            version: '1',
            chainId: 421614,
            verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        types: {
            [primaryType]: payloadTypes,
        },
        primaryType: primaryType,
        message: action,
    };
    return signInner(wallet, data);
}
async function signUsdTransferAction(wallet, action, isMainnet) {
    return signUserSignedAction(wallet, action, [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'time', type: 'uint64' },
    ], 'HyperliquidTransaction:UsdSend', isMainnet);
}
async function signWithdrawFromBridgeAction(wallet, action, isMainnet) {
    return signUserSignedAction(wallet, action, [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'time', type: 'uint64' },
    ], 'HyperliquidTransaction:Withdraw', isMainnet);
}
async function signAgent(wallet, action, isMainnet) {
    return signUserSignedAction(wallet, action, [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'agentAddress', type: 'address' },
        { name: 'agentName', type: 'string' },
        { name: 'nonce', type: 'uint64' },
    ], 'HyperliquidTransaction:ApproveAgent', isMainnet);
}
async function signInner(wallet, data) {
    const signature = await wallet.signTypedData(data.domain, data.types, data.message);
    return splitSig(signature);
}
function splitSig(sig) {
    const { r, s, v } = ethers_1.ethers.Signature.from(sig);
    return { r, s, v };
}
function floatToWire(x) {
    const rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error(`floatToWire causes rounding: ${x}`);
    }
    let normalized = rounded.replace(/\.?0+$/, '');
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
    const withDecimals = x * Math.pow(10, power);
    if (Math.abs(Math.round(withDecimals) - withDecimals) >= 1e-3) {
        throw new Error(`floatToInt causes rounding: ${x}`);
    }
    return Math.round(withDecimals);
}
function getTimestampMs() {
    return Date.now();
}
function orderRequestToOrderWire(order, asset) {
    const orderWire = {
        a: asset,
        b: order.is_buy,
        p: floatToWire(order.limit_px),
        s: floatToWire(order.sz),
        r: order.reduce_only,
        t: orderTypeToWire(order.order_type),
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
        type: 'order',
        orders: orderWires,
        grouping: 'na',
    };
}
//# sourceMappingURL=signing.js.map