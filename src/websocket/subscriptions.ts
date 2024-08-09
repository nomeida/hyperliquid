import { WebSocketClient } from './connection';
import { 
    AllMids, WsTrade, WsBook, WsOrder, WsUserEvent, Notification, 
    WebData2, Candle, WsUserFills, WsUserFundings, WsUserNonFundingLedgerUpdates 
} from '../types/index';

export class WebSocketSubscriptions {
    private ws: WebSocketClient;
    private exchangeToInternalNameMap: Map<string, string>;
    private initializationPromise: Promise<void>;

    constructor(ws: WebSocketClient, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>) {
        this.ws = ws;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }

    private async ensureInitialized() {
        await this.initializationPromise;
    }

    private convertSymbol(symbol: string, mode: string = "", symbolMode: string = ""): string {
        let rSymbol;
        if (mode === "reverse") {
            for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
                if (value === symbol) {
                    return key;
                }
            }
            rSymbol = symbol;
        } else {
            rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
        }

        if (symbolMode === "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {
                rSymbol = symbol + "-SPOT";
            }
        } else if (symbolMode === "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }

        return rSymbol;
    }

    private convertSymbolsInObject(obj: any, symbolsFields: Array<string> = ["coin", "symbol"], symbolMode: string = ""): any {
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);   
        }
    
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode));
        }
    
        const convertedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = this.convertSymbol(value as string, symbolMode);
            } else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            } else {
                convertedObj[key] = this.convertSymbolsInObject(value, symbolsFields, symbolMode);
            }
        }
        return convertedObj;
    }

    private convertToNumber(value: any): any {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            } else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    }

    private subscribe(subscription: { type: string; [key: string]: any }): void {

        this.ws.sendMessage({ method: 'subscribe', subscription: subscription });
    }

    private unsubscribe(subscription: { type: string; [key: string]: any }): void {
        const convertedSubscription = this.convertSymbolsInObject(subscription);
        this.ws.sendMessage({ method: 'unsubscribe', subscription: convertedSubscription });
    }

    private handleMessage(message: any, callback: (data: any) => void, channel: string, additionalChecks: (data: any) => boolean = () => true) {
        if (typeof message !== 'object' || message === null) {
            console.warn('Received invalid message format:', message);
            return;
        }

        let data = message.data || message;
        if (data.channel === channel && additionalChecks(data)) {
            const convertedData = this.convertSymbolsInObject(data);
            callback(convertedData);
        }
    }

    async subscribeToAllMids(callback: (data: AllMids) => void): Promise<void> {
        await this.ensureInitialized();
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.subscribe({ type: 'allMids' });

        this.ws.on('message', (message: any) => {
            if (message.channel === 'allMids') {
                if (message.data.mids) {
                    const convertedData: AllMids = {};
                    for (const [key, value] of Object.entries(message.data.mids)) {
                        const convertedKey = this.convertSymbol(key);
                        const convertedValue = this.convertToNumber(value);
                        convertedData[convertedKey] = convertedValue;
                    }
                    callback(convertedData);
                }
            }
        });
    }

    async subscribeToNotification(user: string, callback: (data: Notification & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'notification', user: user });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'notification') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToWebData2(user: string, callback: (data: WebData2) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'webData2', user: user });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'webData2') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToCandle(coin: string, interval: string, callback: (data: Candle[] & { coin: string; interval: string }) => void): Promise<void> {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'candle', coin: convertedCoin, interval: interval });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'candle' && message.data.s === convertedCoin && message.data.i === interval) {
                message = this.convertSymbolsInObject(message, ["s"])
                callback(message)
            }
        });
    }

    async subscribeToL2Book(coin: string, callback: (data: WsBook & { coin: string }) => void): Promise<void> {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'l2Book', coin: convertedCoin });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'l2Book' && message.data.coin === convertedCoin) {
                message = this.convertSymbolsInObject(message, ["coin"])
                callback(message)
            }
        });
    }

    async subscribeToTrades(coin: string, callback: (data: any) => void): Promise<void> {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'trades', coin: convertedCoin });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'trades' && message.data[0].coin === convertedCoin) {
                message = this.convertSymbolsInObject(message, ["coin"])
                callback(message)
            }
        });
    }

    async subscribeToOrderUpdates(user: string, callback: (data: WsOrder[] & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'orderUpdates', user: user });
        this.ws.on('message', (message: any) => {

            if (message.channel === 'orderUpdates') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToUserEvents(user: string, callback: (data: WsUserEvent & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'userEvents', user: user });
        this.ws.on('message', (message: any) => {

            if (message.channel === 'userEvents') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToUserFills(user: string, callback: (data: WsUserFills & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'userFills', user: user });
        this.ws.on('message', (message: any) => {

            if (message.channel === 'userFills') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToUserFundings(user: string, callback: (data: WsUserFundings & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'userFundings', user: user });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'userFundings') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async subscribeToUserNonFundingLedgerUpdates(user: string, callback: (data: WsUserNonFundingLedgerUpdates & { user: string }) => void): Promise<void> {
        await this.ensureInitialized();
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
        this.ws.on('message', (message: any) => {
            if (message.channel === 'userNonFundingLedgerUpdates') {
                message = this.convertSymbolsInObject(message)
                callback(message)
            }
        });
    }

    async postRequest(requestType: 'info' | 'action', payload: any): Promise<any> {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            const id = Date.now();
            const convertedPayload = this.convertSymbolsInObject(payload);
            this.ws.sendMessage({
                method: 'post',
                id: id,
                request: {
                    type: requestType,
                    payload: convertedPayload
                }
            });

            const responseHandler = (message: any) => {
                if (typeof message === 'object' && message !== null) {
                    const data = message.data || message;
                    if (data.channel === 'post' && data.id === id) {
                        this.ws.removeListener('message', responseHandler);
                        if (data.response && data.response.type === 'error') {
                            reject(new Error(data.response.payload));
                        } else {
                            const convertedResponse = this.convertSymbolsInObject(data.response ? data.response.payload : data);
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
        await this.ensureInitialized();
        this.unsubscribe({ type: 'candle', coin: coin, interval: interval });
    }

    async unsubscribeFromL2Book(coin: string): Promise<void> {
        await this.ensureInitialized();
        this.unsubscribe({ type: 'l2Book', coin: coin });
    }

    async unsubscribeFromTrades(coin: string): Promise<void> {
        await this.ensureInitialized();
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