// src/rest/custom.ts

import { ethers } from 'ethers';
import { InfoAPI } from './info';
import { ExchangeAPI } from './exchange';
import { UserOpenOrders } from '../types';
import {
    CancelOrderResponse
} from '../utils/signing';

import {
    CancelOrderRequest
} from '../types/index';

export class CustomOperations {
private exchange: ExchangeAPI;
private infoApi: InfoAPI;
private wallet: ethers.Wallet;
private exchangeToInternalNameMap: Map<string, string>;
private assetToIndexMap: Map<string, number>;
private initializationPromise: Promise<void>;

constructor(exchange: ExchangeAPI, infoApi: InfoAPI, privateKey: string, exchangeToInternalNameMap: Map<string, string>, assetToIndexMap: Map<string, number>, initializationPromise: Promise<void>) {
    this.exchange = exchange;
    this.infoApi = infoApi  
    this.wallet = new ethers.Wallet(privateKey);
    this.exchangeToInternalNameMap = exchangeToInternalNameMap;
    this.initializationPromise = initializationPromise;
    this.assetToIndexMap = assetToIndexMap;
}

private async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
}

async cancelAllOrders(symbol?: string): Promise<CancelOrderResponse> {
    try {
        await this.ensureInitialized();

        const openOrders: UserOpenOrders = await this.infoApi.getUserOpenOrders(this.wallet.address);

        let ordersToCancel: UserOpenOrders;
        
        openOrders.forEach(order => {
            const internalName = this.exchangeToInternalNameMap.get(order.coin);
            if (internalName) {
                order.coin = internalName;
            }
        })

        if (symbol) {
            ordersToCancel = openOrders.filter(order => order.coin === symbol);
        } else {
            ordersToCancel = openOrders;
        }

        if (ordersToCancel.length === 0) {
            throw new Error('No orders to cancel');
        }

        const cancelRequests: CancelOrderRequest[] = ordersToCancel.map(order => ({
            coin: order.coin,
            o: order.oid
        }));

        return this.exchange.cancelOrder(cancelRequests);
    } catch (error) {
        throw error;
    }
}
    //Get a list of all SPOT and PERP assets that are tradable
    getAllAssets(): { perp: string[], spot: string[] } {
        const perp: string[] = [];
        const spot: string[] = [];

        for (const [asset, index] of this.assetToIndexMap.entries()) {
        if (asset.endsWith('-PERP')) {
            perp.push(asset);
        } else if (asset.endsWith('-SPOT')) {
            spot.push(asset);
        }
        }

        return { perp, spot };
    }
}