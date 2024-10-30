import { InfoAPI } from './rest/info';
import { ExchangeAPI } from './rest/exchange';
import { WebSocketClient } from './websocket/connection';
import { WebSocketSubscriptions } from './websocket/subscriptions';
import { CustomOperations } from './rest/custom';
import { TurnkeySigner } from "@alchemy/aa-signers";
export declare class Hyperliquid {
    info: InfoAPI;
    exchange: ExchangeAPI;
    ws: WebSocketClient;
    subscriptions: WebSocketSubscriptions;
    custom: CustomOperations;
    private rateLimiter;
    private symbolConversion;
    private isValidPrivateKey;
    private walletAddress;
    constructor(turnkeySigner?: TurnkeySigner | null, testnet?: boolean, walletAddress?: string | null);
    private createAuthenticatedProxy;
    private initializeWithTurnkey;
    isAuthenticated(): boolean;
    connect(): Promise<void>;
    disconnect(): void;
}
export * from './types';
export * from './utils/signing';
