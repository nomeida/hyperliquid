import { WebSocketClient } from './connection';
import { 
    AllMids, WsTrade, WsBook, WsOrder, WsUserEvent, Notification, 
    WebData2, Candle, WsUserFills, WsUserFundings, WsUserNonFundingLedgerUpdates 
} from '../types/index';
import { SymbolConversion } from '../utils/symbolConversion';

export class WebSocketSubscriptions {
    private ws: WebSocketClient;
    private symbolConversion: SymbolConversion;

    constructor(ws: WebSocketClient, symbolConversion: SymbolConversion) {
        this.ws = ws;
        this.symbolConversion = symbolConversion;
    }

    private async subscribe(subscription: { type: string; [key: string]: any }): Promise<void> {
        await this.ws.sendMessage({ method: 'subscribe', subscription: subscription });
    }

    private async unsubscribe(subscription: { type: string; [key: string]: any }): Promise<void> {
        const convertedSubscription = await this.symbolConversion.convertSymbolsInObject(subscription);
        await this.ws.sendMessage({ method: 'unsubscribe', subscription: convertedSubscription });
    }

    private handleMessage(message: any, callback: (data: any) => void, channel: string, additionalChecks: (data: any) => boolean = () => true) {
        if (typeof message !== 'object' || message === null) {
            console.warn('Received invalid message format:', message);
            return;
        }

        let data = message.data || message;
        if (data.channel === channel && additionalChecks(data)) {
            const convertedData = this.symbolConversion.convertSymbolsInObject(data);
            callback(convertedData);
        }
    }

    async subscribeToAllMids(callback: (data: AllMids) => void): Promise<void> {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.subscribe({ type: 'allMids' });

        this.ws.on('message', async (message: any) => {
            if (message.channel === 'allMids') {
                if (message.data.mids) {
                    const convertedData: AllMids = {};
                    for (const [key, value] of Object.entries(message.data.mids)) {
                        const convertedKey = await this.symbolConversion.convertSymbol(key);
                        const convertedValue = this.symbolConversion.convertToNumber(value);
                        convertedData[convertedKey] = convertedValue;
                    }
                    callback(convertedData);
                }
            }
        });
    }

    async subscribeToNotification(user: string, callback: (data: Notification & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'notification', user: user });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'notification') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToWebData2(user: string, callback: (data: WebData2) => void): Promise<void> {
        this.subscribe({ type: 'webData2', user: user });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'webData2') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToCandle(coin: string, interval: string, callback: (data: Candle[] & { coin: string; interval: string }) => void): Promise<void> {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'candle', coin: convertedCoin, interval: interval });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'candle' && message.data.s === convertedCoin && message.data.i === interval) {
                message = await this.symbolConversion.convertSymbolsInObject(message, ["s"])
                callback(message.data)
            }
        });
    }

    async subscribeToL2Book(coin: string, callback: (data: WsBook & { coin: string }) => void): Promise<void> {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'l2Book', coin: convertedCoin });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'l2Book' && message.data.coin === convertedCoin) {
                message = await this.symbolConversion.convertSymbolsInObject(message, ["coin"])
                callback(message.data)
            }
        });
    }

    async subscribeToTrades(coin: string, callback: (data: any) => void): Promise<void> {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'trades', coin: convertedCoin });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'trades' && message.data[0].coin === convertedCoin) {
                message = await this.symbolConversion.convertSymbolsInObject(message, ["coin"])
                callback(message.data)
            }
        });
    }

    async subscribeToOrderUpdates(user: string, callback: (data: WsOrder[] & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'orderUpdates', user: user });
        this.ws.on('message', async (message: any) => {

            if (message.channel === 'orderUpdates') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToUserEvents(user: string, callback: (data: WsUserEvent & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'userEvents', user: user });
        this.ws.on('message', async (message: any) => {

            if (message.channel === 'userEvents') {
                message = await  this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToUserFills(user: string, callback: (data: WsUserFills & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'userFills', user: user });
        this.ws.on('message', async (message: any) => {

            if (message.channel === 'userFills') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToUserFundings(user: string, callback: (data: WsUserFundings & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'userFundings', user: user });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'userFundings') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async subscribeToUserNonFundingLedgerUpdates(user: string, callback: (data: WsUserNonFundingLedgerUpdates & { user: string }) => void): Promise<void> {
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
        this.ws.on('message', async (message: any) => {
            if (message.channel === 'userNonFundingLedgerUpdates') {
                message = await this.symbolConversion.convertSymbolsInObject(message)
                callback(message.data)
            }
        });
    }

    async postRequest(requestType: 'info' | 'action', payload: any): Promise<any> {
        const id = Date.now();
        const convertedPayload = await this.symbolConversion.convertSymbolsInObject(payload);
        
        await this.ws.sendMessage({
            method: 'post',
            id: id,
            request: {
                type: requestType,
                payload: convertedPayload
            }
        });

        return new Promise((resolve, reject) => {
            const responseHandler = (message: any) => {
                if (typeof message === 'object' && message !== null) {
                    const data = message.data || message;
                    if (data.channel === 'post' && data.id === id) {
                        this.ws.removeListener('message', responseHandler);
                        if (data.response && data.response.type === 'error') {
                            reject(new Error(data.response.payload));
                        } else {
                            const convertedResponse = this.symbolConversion.convertSymbolsInObject(data.response ? data.response.payload : data);
                            resolve(convertedResponse);
                        }
                    }
                }
            };

            this.ws.on('message', responseHandler);

            setTimeout(() => {
                this.ws.removeListener('message', responseHandler);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    async unsubscribeFromAllMids(): Promise<void> {
        this.unsubscribe({ type: 'allMids' });
    }

    async unsubscribeFromNotification(user: string): Promise<void> {
        this.unsubscribe({ type: 'notification', user: user });
    }

    async unsubscribeFromWebData2(user: string): Promise<void> {
        this.unsubscribe({ type: 'webData2', user: user });
    }

    async unsubscribeFromCandle(coin: string, interval: string): Promise<void> {
        this.unsubscribe({ type: 'candle', coin: coin, interval: interval });
    }

    async unsubscribeFromL2Book(coin: string): Promise<void> {
        this.unsubscribe({ type: 'l2Book', coin: coin });
    }

    async unsubscribeFromTrades(coin: string): Promise<void> {
        this.unsubscribe({ type: 'trades', coin: coin });
    }

    async unsubscribeFromOrderUpdates(user: string): Promise<void> {
        this.unsubscribe({ type: 'orderUpdates', user: user });
    }

    async unsubscribeFromUserEvents(user: string): Promise<void> {
        this.unsubscribe({ type: 'userEvents', user: user });
    }

    async unsubscribeFromUserFills(user: string): Promise<void> {
        this.unsubscribe({ type: 'userFills', user: user });
    }

    async unsubscribeFromUserFundings(user: string): Promise<void> {
        this.unsubscribe({ type: 'userFundings', user: user });
    }

    async unsubscribeFromUserNonFundingLedgerUpdates(user: string): Promise<void> {
        this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user: user });
    }
}