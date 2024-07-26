"use strict";
// src/rest/custom.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomOperations = void 0;
const ethers_1 = require("ethers");
class CustomOperations {
    constructor(exchange, infoApi, privateKey, exchangeToInternalNameMap, assetToIndexMap, initializationPromise) {
        this.exchange = exchange;
        this.infoApi = infoApi;
        this.wallet = new ethers_1.ethers.Wallet(privateKey);
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
        this.assetToIndexMap = assetToIndexMap;
    }
    async ensureInitialized() {
        await this.initializationPromise;
    }
    async cancelAllOrders(symbol) {
        try {
            await this.ensureInitialized();
            const openOrders = await this.infoApi.getUserOpenOrders(this.wallet.address);
            let ordersToCancel;
            openOrders.forEach(order => {
                const internalName = this.exchangeToInternalNameMap.get(order.coin);
                if (internalName) {
                    order.coin = internalName;
                }
            });
            if (symbol) {
                ordersToCancel = openOrders.filter(order => order.coin === symbol);
            }
            else {
                ordersToCancel = openOrders;
            }
            if (ordersToCancel.length === 0) {
                throw new Error('No orders to cancel');
            }
            const cancelRequests = ordersToCancel.map(order => ({
                coin: order.coin,
                o: order.oid
            }));
            return this.exchange.cancelOrder(cancelRequests);
        }
        catch (error) {
            throw error;
        }
    }
    //Get a list of all SPOT and PERP assets that are tradable
    getAllAssets() {
        const perp = [];
        const spot = [];
        for (const [asset, index] of this.assetToIndexMap.entries()) {
            if (asset.endsWith('-PERP')) {
                perp.push(asset);
            }
            else if (asset.endsWith('-SPOT')) {
                spot.push(asset);
            }
        }
        return { perp, spot };
    }
}
exports.CustomOperations = CustomOperations;
//# sourceMappingURL=custom.js.map