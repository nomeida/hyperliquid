import { WebSocketClient } from './connection';
import type { AllMids, WsBook, WsOrder, WsUserEvent, Notification, WebData2, Candle, WsUserFills, WsUserFundings, WsUserNonFundingLedgerUpdates, WsActiveAssetData, WsActiveAssetCtx, WsUserHistoricalOrders } from '../types/index';
import { SymbolConversion } from '../utils/symbolConversion';
export declare class WebSocketSubscriptions {
    private ws;
    private symbolConversion;
    constructor(ws: WebSocketClient, symbolConversion: SymbolConversion);
    private subscribe;
    private unsubscribe;
    subscribeToAllMids(callback: (data: AllMids) => void): Promise<void>;
    subscribeToNotification(user: string, callback: (data: Notification & {
        user: string;
    }) => void): Promise<void>;
    subscribeToWebData2(user: string, callback: (data: WebData2) => void): Promise<void>;
    subscribeToCandle(coin: string, interval: string, callback: (data: Candle[] & {
        coin: string;
        interval: string;
    }) => void): Promise<void>;
    subscribeToL2Book(coin: string, callback: (data: WsBook & {
        coin: string;
    }) => void): Promise<void>;
    subscribeToTrades(coin: string, callback: (data: any) => void): Promise<void>;
    subscribeToOrderUpdates(user: string, callback: (data: WsOrder[] & {
        user: string;
    }) => void): Promise<void>;
    subscribeToUserEvents(user: string, callback: (data: WsUserEvent & {
        user: string;
    }) => void): Promise<void>;
    subscribeToUserFills(user: string, callback: (data: WsUserFills & {
        user: string;
    }) => void): Promise<void>;
    subscribeToUserFundings(user: string, callback: (data: WsUserFundings & {
        user: string;
    }) => void): Promise<void>;
    subscribeToUserHistoricalOrders(user: string, callback: (data: WsUserHistoricalOrders & {
        user: string;
    }) => void): Promise<void>;
    subscribeToUserNonFundingLedgerUpdates(user: string, callback: (data: WsUserNonFundingLedgerUpdates & {
        user: string;
    }) => void): Promise<void>;
    subscribeToActiveAssetData(user: string, coin: string, callback: (data: WsActiveAssetData & {
        user: string;
    }) => void): Promise<void>;
    subscribeActiveAssetCtx(user: string, coin: string, callback: (data: WsActiveAssetCtx) => void): Promise<void>;
    postRequest(requestType: 'info' | 'action', payload: any): Promise<any>;
    unsubscribeFromAllMids(): Promise<void>;
    unsubscribeFromNotification(user: string): Promise<void>;
    unsubscribeFromWebData2(user: string): Promise<void>;
    unsubscribeFromCandle(coin: string, interval: string): Promise<void>;
    unsubscribeFromL2Book(coin: string): Promise<void>;
    unsubscribeFromTrades(coin: string): Promise<void>;
    unsubscribeFromOrderUpdates(user: string): Promise<void>;
    unsubscribeFromUserEvents(user: string): Promise<void>;
    unsubscribeFromUserFills(user: string): Promise<void>;
    unsubscribeFromUserFundings(user: string): Promise<void>;
    unsubscribeFromUserNonFundingLedgerUpdates(user: string): Promise<void>;
    unsubscribeFromActiveAssetData(user: string, coin: string): Promise<void>;
    unsubscribeFromActiveAssetCtx(user: string, coin: string): Promise<void>;
    unsubscribeFromUserHistoricalOrders(user: string): Promise<void>;
    unsubscribeFromAll(): Promise<void>;
}
//# sourceMappingURL=subscriptions.d.ts.map