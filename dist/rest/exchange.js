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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeAPI = void 0;
const ethers_1 = require("ethers");
const helpers_1 = require("../utils/helpers");
const signing_1 = require("../utils/signing");
const CONSTANTS = __importStar(require("../types/constants"));
const IS_MAINNET = true; // Make sure this matches the IS_MAINNET in signing.ts
class ExchangeAPI {
    constructor(baseURL, privateKey, info, rateLimiter, assetToIndexMap, exchangeToInternalNameMap, initializationPromise) {
        this.info = info;
        this.httpApi = new helpers_1.HttpApi(baseURL, CONSTANTS.ENDPOINTS.EXCHANGE, rateLimiter);
        this.wallet = new ethers_1.ethers.Wallet(privateKey);
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    updateAssetMaps(assetToIndexMap, exchangeToInternalNameMap) {
        this.assetToIndexMap = assetToIndexMap;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
    }
    //Get the asset index for a given symbol i.e BTC-PERP -> 1
    async getAssetIndex(symbol) {
        await this.initializationPromise;
        const index = this.assetToIndexMap.get(symbol);
        if (index === undefined) {
            throw new Error(`Unknown asset: ${symbol}`);
        }
        return index;
    }
    //Create an order/place an order
    async placeOrder(orderRequest) {
        try {
            const assetIndex = await this.getAssetIndex(orderRequest.coin);
            const orderWire = (0, signing_1.orderRequestToOrderWire)(orderRequest, assetIndex);
            const action = (0, signing_1.orderWiresToOrderAction)([orderWire]);
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Cancel using order id (oid)
    async cancelOrder(cancelRequests) {
        try {
            const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
            // Ensure all cancel requests have asset indices
            const cancelsWithIndices = await Promise.all(cancels.map(async (req) => ({
                ...req,
                a: await this.getAssetIndex(req.coin)
            })));
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.CANCEL,
                cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o }))
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Cancel using a CLOID
    async cancelOrderByCloid(symbol, cloid) {
        try {
            const assetIndex = await this.getAssetIndex(symbol);
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.CANCEL_BY_CLOID,
                cancels: [{ asset: assetIndex, cloid }]
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Modify a single order
    async modifyOrder(oid, orderRequest) {
        try {
            const assetIndex = await this.getAssetIndex(orderRequest.coin);
            const orderWire = (0, signing_1.orderRequestToOrderWire)(orderRequest, assetIndex);
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.MODIFY,
                oid,
                order: orderWire
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Modify multiple orders at once
    async batchModifyOrders(modifies) {
        try {
            // First, get all asset indices in parallel
            const assetIndices = await Promise.all(modifies.map(m => this.getAssetIndex(m.order.coin)));
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.BATCH_MODIFY,
                modifies: modifies.map((m, index) => ({
                    oid: m.oid,
                    order: (0, signing_1.orderRequestToOrderWire)(m.order, assetIndices[index])
                }))
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Update leverage. Set leverageMode to "cross" if you want cross leverage, otherwise it'll set it to "isolated by default"
    async updateLeverage(symbol, leverageMode, leverage) {
        try {
            const assetIndex = await this.getAssetIndex(symbol);
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.UPDATE_LEVERAGE,
                asset: assetIndex,
                isCross: leverageMode === "cross",
                leverage: leverage
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Update how much margin there is on a perps position
    async updateIsolatedMargin(symbol, isBuy, ntli) {
        try {
            const assetIndex = await this.getAssetIndex(symbol);
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.UPDATE_ISOLATED_MARGIN,
                asset: assetIndex,
                isBuy,
                ntli
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Takes from the perps wallet and sends to another wallet without the $1 fee (doesn't touch bridge, so no fees)
    async usdTransfer(destination, amount) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.USD_SEND,
                hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination: destination,
                amount: amount.toString(),
                time: Date.now()
            };
            const signature = await (0, signing_1.signUsdTransferAction)(this.wallet, action);
            const payload = { action, nonce: action.time, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Transfer SPOT assets i.e PURR to another wallet (doesn't touch bridge, so no fees)
    async spotTransfer(destination, token, amount) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.SPOT_SEND,
                hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination,
                token,
                amount,
                time: Date.now()
            };
            const signature = await (0, signing_1.signUserSignedAction)(this.wallet, action, [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'token', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' }
            ], 'HyperliquidTransaction:SpotSend');
            const payload = { action, nonce: action.time, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Withdraw USDC, this txn goes across the bridge and costs $1 in fees as of writing this
    async initiateWithdrawal(destination, amount) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.WITHDRAW,
                hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination: destination,
                amount: amount.toString(),
                time: Date.now()
            };
            const signature = await (0, signing_1.signWithdrawFromBridgeAction)(this.wallet, action);
            const payload = { action, nonce: action.time, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Transfer between spot and perpetual wallets (intra-account transfer)
    async transferBetweenSpotAndPerp(usdc, toPerp) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.SPOT_USER,
                classTransfer: {
                    usdc: usdc * 1e6,
                    toPerp: toPerp
                }
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Schedule a cancel for a given time (in ms) //Note: Only available once you've traded $1 000 000 in volume
    async scheduleCancel(time) {
        try {
            const action = { type: CONSTANTS.EXCHANGE_TYPES.SCHEDULE_CANCEL, time };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    //Transfer between vault and perpetual wallets (intra-account transfer)
    async vaultTransfer(vaultAddress, isDeposit, usd) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.VAULT_TRANSFER,
                vaultAddress,
                isDeposit,
                usd
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
    async setReferrer(code) {
        try {
            const action = {
                type: CONSTANTS.EXCHANGE_TYPES.SET_REFERRER,
                code
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.wallet, action, null, nonce);
            const payload = { action, nonce, signature };
            return this.httpApi.makeRequest(payload, 1);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.ExchangeAPI = ExchangeAPI;
//# sourceMappingURL=exchange.js.map