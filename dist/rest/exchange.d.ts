import { RateLimiter } from '../utils/rateLimiter';
import { InfoAPI } from './info';
import { CancelOrderResponse } from '../utils/signing';
import { CancelOrderRequest, OrderRequest } from '../types/index';
import { SymbolConversion } from '../utils/symbolConversion';
import { TurnkeySigner } from '@alchemy/aa-signers';
export declare class ExchangeAPI {
    private info;
    private turnkeySigner;
    private httpApi;
    private symbolConversion;
    private IS_MAINNET;
    private walletAddress;
    private turnkeySignerAddress;
    constructor(testnet: boolean, turnkeySigner: TurnkeySigner, info: InfoAPI, rateLimiter: RateLimiter, symbolConversion: SymbolConversion, walletAddress?: string | null);
    private getAssetIndex;
    placeOrder(orderRequest: OrderRequest): Promise<any>;
    cancelOrder(cancelRequests: CancelOrderRequest | CancelOrderRequest[]): Promise<CancelOrderResponse>;
    cancelOrderByCloid(symbol: string, cloid: string): Promise<any>;
    modifyOrder(oid: number, orderRequest: OrderRequest): Promise<any>;
    batchModifyOrders(modifies: Array<{
        oid: number;
        order: OrderRequest;
    }>): Promise<any>;
    updateLeverage(symbol: string, leverageMode: string, leverage: number): Promise<any>;
    updateIsolatedMargin(symbol: string, isBuy: boolean, ntli: number): Promise<any>;
    usdTransfer(destination: string, amount: number): Promise<any>;
    spotTransfer(destination: string, token: string, amount: string): Promise<any>;
    initiateWithdrawal(destination: string, amount: number): Promise<any>;
    transferBetweenSpotAndPerp(usdc: number, toPerp: boolean): Promise<any>;
    scheduleCancel(time: number | null): Promise<any>;
    vaultTransfer(vaultAddress: string, isDeposit: boolean, usd: number): Promise<any>;
    setReferrer(code: string): Promise<any>;
}
