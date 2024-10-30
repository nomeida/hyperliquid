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
const helpers_1 = require("../utils/helpers");
const signing_1 = require("../utils/signing");
const CONSTANTS = __importStar(require("../types/constants"));
const constants_1 = require("../types/constants");
// const IS_MAINNET = true; // Make sure this matches the IS_MAINNET in signing.ts
class ExchangeAPI {
    constructor(testnet, turnkeySigner, info, rateLimiter, symbolConversion, walletAddress = null) {
        this.info = info;
        this.IS_MAINNET = true;
        this.turnkeySignerAddress = "";
        const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;
        this.IS_MAINNET = !testnet;
        this.httpApi = new helpers_1.HttpApi(baseURL, constants_1.ENDPOINTS.EXCHANGE, rateLimiter);
        this.turnkeySigner = turnkeySigner;
        this.symbolConversion = symbolConversion;
        this.walletAddress = walletAddress;
        (async () => {
            this.turnkeySignerAddress = await turnkeySigner.getAddress();
        })();
    }
    async getAssetIndex(symbol) {
        const index = await this.symbolConversion.getAssetIndex(symbol);
        if (index === undefined) {
            throw new Error(`Unknown asset: ${symbol}`);
        }
        return index;
    }
    async placeOrder(orderRequest) {
        try {
            const assetIndex = await this.getAssetIndex(orderRequest.coin);
            const orderWire = (0, signing_1.orderRequestToOrderWire)(orderRequest, assetIndex);
            const action = (0, signing_1.orderWiresToOrderAction)([orderWire]);
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, orderRequest.vaultAddress || null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.CANCEL,
                cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o }))
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.CANCEL_BY_CLOID,
                cancels: [{ asset: assetIndex, cloid }]
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.MODIFY,
                oid,
                order: orderWire
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.BATCH_MODIFY,
                modifies: modifies.map((m, index) => {
                    return {
                        oid: m.oid,
                        order: (0, signing_1.orderRequestToOrderWire)(m.order, assetIndices[index])
                    };
                })
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.UPDATE_LEVERAGE,
                asset: assetIndex,
                isCross: leverageMode === "cross",
                leverage: leverage
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.UPDATE_ISOLATED_MARGIN,
                asset: assetIndex,
                isBuy,
                ntli
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.USD_SEND,
                hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination: destination,
                amount: amount.toString(),
                time: Date.now()
            };
            const signature = await (0, signing_1.signUsdTransferAction)(this.turnkeySigner, action, this.IS_MAINNET);
            const payload = { action, nonce: action.time, signature };
            return this.httpApi.makeRequest(payload, 1, this.walletAddress || this.turnkeySignerAddress);
        }
        catch (error) {
            throw error;
        }
    }
    //Transfer SPOT assets i.e PURR to another wallet (doesn't touch bridge, so no fees)
    async spotTransfer(destination, token, amount) {
        try {
            const action = {
                type: constants_1.ExchangeType.SPOT_SEND,
                hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination,
                token,
                amount,
                time: Date.now()
            };
            const signature = await (0, signing_1.signUserSignedAction)(this.turnkeySigner, action, [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'token', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' }
            ], 'HyperliquidTransaction:SpotSend', this.IS_MAINNET);
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
                type: constants_1.ExchangeType.WITHDRAW,
                hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
                signatureChainId: '0xa4b1',
                destination: destination,
                amount: amount.toString(),
                time: Date.now()
            };
            const signature = await (0, signing_1.signWithdrawFromBridgeAction)(this.turnkeySigner, action, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.SPOT_USER,
                classTransfer: {
                    usdc: usdc * 1e6,
                    toPerp: toPerp
                }
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
            const action = { type: constants_1.ExchangeType.SCHEDULE_CANCEL, time };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.VAULT_TRANSFER,
                vaultAddress,
                isDeposit,
                usd
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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
                type: constants_1.ExchangeType.SET_REFERRER,
                code
            };
            const nonce = Date.now();
            const signature = await (0, signing_1.signL1Action)(this.turnkeySigner, action, null, nonce, this.IS_MAINNET);
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