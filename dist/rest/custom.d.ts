import { InfoAPI } from './info';
import { ExchangeAPI } from './exchange';
import { OrderResponse } from '../types/index';
import { CancelOrderResponse } from '../utils/signing';
import { SymbolConversion } from '../utils/symbolConversion';
export declare class CustomOperations {
    private exchange;
    private infoApi;
    private wallet;
    private symbolConversion;
    private walletAddress;
    constructor(exchange: ExchangeAPI, infoApi: InfoAPI, privateKey: string, symbolConversion: SymbolConversion, walletAddress?: string | null);
    cancelAllOrders(symbol?: string): Promise<CancelOrderResponse>;
    getAllAssets(): Promise<{
        perp: string[];
        spot: string[];
    }>;
    private DEFAULT_SLIPPAGE;
    private getSlippagePrice;
    marketOpen(symbol: string, isBuy: boolean, size: number, px?: number, slippage?: number, cloid?: string): Promise<OrderResponse>;
    marketClose(symbol: string, size?: number, px?: number, slippage?: number, cloid?: string): Promise<OrderResponse>;
    closeAllPositions(slippage?: number): Promise<OrderResponse[]>;
}
