"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSubscriptions = void 0;
class WebSocketSubscriptions {
    constructor(ws, symbolConversion) {
        this.ws = ws;
        this.symbolConversion = symbolConversion;
    }
    async subscribe(subscription) {
        await this.ws.sendMessage({ method: 'subscribe', subscription: subscription });
    }
    async unsubscribe(subscription) {
        const convertedSubscription = await this.symbolConversion.convertSymbolsInObject(subscription);
        await this.ws.sendMessage({ method: 'unsubscribe', subscription: convertedSubscription });
    }
    handleMessage(message, callback, channel, additionalChecks = () => true) {
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
    async subscribeToAllMids(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.subscribe({ type: 'allMids' });
        this.ws.on('message', async (message) => {
            if (message.channel === 'allMids') {
                if (message.data.mids) {
                    const convertedData = {};
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
    async subscribeToNotification(user, callback) {
        this.subscribe({ type: 'notification', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'notification') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToWebData2(user, callback) {
        this.subscribe({ type: 'webData2', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'webData2') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToCandle(coin, interval, callback) {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'candle', coin: convertedCoin, interval: interval });
        this.ws.on('message', (message) => {
            if (message.channel === 'candle' && message.data.s === convertedCoin && message.data.i === interval) {
                message = this.symbolConversion.convertSymbolsInObject(message, ["s"]);
                callback(message);
            }
        });
    }
    async subscribeToL2Book(coin, callback) {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'l2Book', coin: convertedCoin });
        this.ws.on('message', (message) => {
            if (message.channel === 'l2Book' && message.data.coin === convertedCoin) {
                message = this.symbolConversion.convertSymbolsInObject(message, ["coin"]);
                callback(message);
            }
        });
    }
    async subscribeToTrades(coin, callback) {
        const convertedCoin = await this.symbolConversion.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'trades', coin: convertedCoin });
        this.ws.on('message', (message) => {
            if (message.channel === 'trades' && message.data[0].coin === convertedCoin) {
                message = this.symbolConversion.convertSymbolsInObject(message, ["coin"]);
                callback(message);
            }
        });
    }
    async subscribeToOrderUpdates(user, callback) {
        this.subscribe({ type: 'orderUpdates', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'orderUpdates') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserEvents(user, callback) {
        this.subscribe({ type: 'userEvents', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userEvents') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserFills(user, callback) {
        this.subscribe({ type: 'userFills', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFills') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserFundings(user, callback) {
        this.subscribe({ type: 'userFundings', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFundings') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserNonFundingLedgerUpdates(user, callback) {
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userNonFundingLedgerUpdates') {
                message = this.symbolConversion.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async postRequest(requestType, payload) {
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
            const responseHandler = (message) => {
                if (typeof message === 'object' && message !== null) {
                    const data = message.data || message;
                    if (data.channel === 'post' && data.id === id) {
                        this.ws.removeListener('message', responseHandler);
                        if (data.response && data.response.type === 'error') {
                            reject(new Error(data.response.payload));
                        }
                        else {
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
    async unsubscribeFromAllMids() {
        this.unsubscribe({ type: 'allMids' });
    }
    async unsubscribeFromNotification(user) {
        this.unsubscribe({ type: 'notification', user: user });
    }
    async unsubscribeFromWebData2(user) {
        this.unsubscribe({ type: 'webData2', user: user });
    }
    async unsubscribeFromCandle(coin, interval) {
        this.unsubscribe({ type: 'candle', coin: coin, interval: interval });
    }
    async unsubscribeFromL2Book(coin) {
        this.unsubscribe({ type: 'l2Book', coin: coin });
    }
    async unsubscribeFromTrades(coin) {
        this.unsubscribe({ type: 'trades', coin: coin });
    }
    async unsubscribeFromOrderUpdates(user) {
        this.unsubscribe({ type: 'orderUpdates', user: user });
    }
    async unsubscribeFromUserEvents(user) {
        this.unsubscribe({ type: 'userEvents', user: user });
    }
    async unsubscribeFromUserFills(user) {
        this.unsubscribe({ type: 'userFills', user: user });
    }
    async unsubscribeFromUserFundings(user) {
        this.unsubscribe({ type: 'userFundings', user: user });
    }
    async unsubscribeFromUserNonFundingLedgerUpdates(user) {
        this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user: user });
    }
}
exports.WebSocketSubscriptions = WebSocketSubscriptions;
//# sourceMappingURL=subscriptions.js.map