import { InfoAPI } from './info';
import { ExchangeAPI } from './exchange';
import { OrderResponse } from '../types/index';
import { CancelOrderResponse } from '../utils/signing';
import { SymbolConversion } from '../utils/symbolConversion';
import { TurnkeySigner } from '@alchemy/aa-signers';
export declare class CustomOperations {
    private exchange;
    private infoApi;
    private turnkeySigner;
    private symbolConversion;
    private walletAddress;
    private turnkeySignerAddress;
    constructor(exchange: ExchangeAPI, infoApi: InfoAPI, turnkeySigner: TurnkeySigner, symbolConversion: SymbolConversion, walletAddress?: string | null);
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
