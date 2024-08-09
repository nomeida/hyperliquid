"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSubscriptions = void 0;
class WebSocketSubscriptions {
    constructor(ws, exchangeToInternalNameMap, initializationPromise) {
        this.ws = ws;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }
    async ensureInitialized() {
        await this.initializationPromise;
    }
    convertSymbol(symbol, mode = "", symbolMode = "") {
        let rSymbol;
        if (mode === "reverse") {
            for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
                if (value === symbol) {
                    return key;
                }
            }
            rSymbol = symbol;
        }
        else {
            rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
        }
        if (symbolMode === "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {
                rSymbol = symbol + "-SPOT";
            }
        }
        else if (symbolMode === "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }
        return rSymbol;
    }
    convertSymbolsInObject(obj, symbolsFields = ["coin", "symbol"], symbolMode = "") {
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode));
        }
        const convertedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = this.convertSymbol(value, symbolMode);
            }
            else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            }
            else {
                convertedObj[key] = this.convertSymbolsInObject(value, symbolsFields, symbolMode);
            }
        }
        return convertedObj;
    }
    convertToNumber(value) {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            }
            else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    }
    subscribe(subscription) {
        this.ws.sendMessage({ method: 'subscribe', subscription: subscription });
    }
    unsubscribe(subscription) {
        const convertedSubscription = this.convertSymbolsInObject(subscription);
        this.ws.sendMessage({ method: 'unsubscribe', subscription: convertedSubscription });
    }
    handleMessage(message, callback, channel, additionalChecks = () => true) {
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
    async subscribeToAllMids(callback) {
        await this.ensureInitialized();
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.subscribe({ type: 'allMids' });
        this.ws.on('message', (message) => {
            if (message.channel === 'allMids') {
                if (message.data.mids) {
                    const convertedData = {};
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
    async subscribeToNotification(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'notification', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'notification') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToWebData2(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'webData2', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'webData2') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToCandle(coin, interval, callback) {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'candle', coin: convertedCoin, interval: interval });
        this.ws.on('message', (message) => {
            if (message.channel === 'candle' && message.data.s === convertedCoin && message.data.i === interval) {
                message = this.convertSymbolsInObject(message, ["s"]);
                callback(message);
            }
        });
    }
    async subscribeToL2Book(coin, callback) {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'l2Book', coin: convertedCoin });
        this.ws.on('message', (message) => {
            if (message.channel === 'l2Book' && message.data.coin === convertedCoin) {
                message = this.convertSymbolsInObject(message, ["coin"]);
                callback(message);
            }
        });
    }
    async subscribeToTrades(coin, callback) {
        await this.ensureInitialized();
        const convertedCoin = this.convertSymbol(coin, "reverse");
        this.subscribe({ type: 'trades', coin: convertedCoin });
        this.ws.on('message', (message) => {
            if (message.channel === 'trades' && message.data[0].coin === convertedCoin) {
                message = this.convertSymbolsInObject(message, ["coin"]);
                callback(message);
            }
        });
    }
    async subscribeToOrderUpdates(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'orderUpdates', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'orderUpdates') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserEvents(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'userEvents', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userEvents') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserFills(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'userFills', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFills') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserFundings(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'userFundings', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFundings') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async subscribeToUserNonFundingLedgerUpdates(user, callback) {
        await this.ensureInitialized();
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userNonFundingLedgerUpdates') {
                message = this.convertSymbolsInObject(message);
                callback(message);
            }
        });
    }
    async postRequest(requestType, payload) {
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
            const responseHandler = (message) => {
                if (typeof message === 'object' && message !== null) {
                    const data = message.data || message;
                    if (data.channel === 'post' && data.id === id) {
                        this.ws.removeListener('message', responseHandler);
                        if (data.response && data.response.type === 'error') {
                            reject(new Error(data.response.payload));
                        }
                        else {
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
        await this.ensureInitialized();
        this.unsubscribe({ type: 'candle', coin: coin, interval: interval });
    }
    async unsubscribeFromL2Book(coin) {
        await this.ensureInitialized();
        this.unsubscribe({ type: 'l2Book', coin: coin });
    }
    async unsubscribeFromTrades(coin) {
        await this.ensureInitialized();
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