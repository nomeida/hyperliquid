"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSubscriptions = void 0;
class WebSocketSubscriptions {
    constructor(ws) {
        this.ws = ws;
    }
    subscribe(subscription) {
        this.ws.sendMessage({ method: 'subscribe', subscription });
    }
    unsubscribe(subscription) {
        this.ws.sendMessage({ method: 'unsubscribe', subscription });
    }
    subscribeToAllMids(callback) {
        this.subscribe({ type: 'allMids' });
        this.ws.on('message', (message) => {
            if (message.channel === 'allMids') {
                callback(message.data);
            }
        });
    }
    subscribeToNotification(user, callback) {
        this.subscribe({ type: 'notification', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'notification' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToWebData2(user, callback) {
        this.subscribe({ type: 'webData2', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'webData2' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToCandle(coin, interval, callback) {
        this.subscribe({ type: 'candle', coin, interval });
        this.ws.on('message', (message) => {
            if (message.channel === 'candle' && message.data.coin === coin && message.data.interval === interval) {
                callback(message.data);
            }
        });
    }
    subscribeToL2Book(coin, callback) {
        this.subscribe({ type: 'l2Book', coin });
        this.ws.on('message', (message) => {
            if (message.channel === 'l2Book' && message.data.coin === coin) {
                callback(message.data);
            }
        });
    }
    subscribeToTrades(coin, callback) {
        this.subscribe({ type: 'trades', coin });
        this.ws.on('message', (message) => {
            if (message.channel === 'trades' && message.data.coin === coin) {
                callback(message.data);
            }
        });
    }
    subscribeToOrderUpdates(user, callback) {
        this.subscribe({ type: 'orderUpdates', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'orderUpdates' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToUserEvents(user, callback) {
        this.subscribe({ type: 'userEvents', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userEvents' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToUserFills(user, callback) {
        this.subscribe({ type: 'userFills', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFills' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToUserFundings(user, callback) {
        this.subscribe({ type: 'userFundings', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userFundings' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    subscribeToUserNonFundingLedgerUpdates(user, callback) {
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user });
        this.ws.on('message', (message) => {
            if (message.channel === 'userNonFundingLedgerUpdates' && message.data.user === user) {
                callback(message.data);
            }
        });
    }
    // Method to handle post requests via WebSocket
    postRequest(requestType, payload) {
        return new Promise((resolve, reject) => {
            const id = Date.now();
            this.ws.sendMessage({
                method: 'post',
                id,
                request: {
                    type: requestType,
                    payload
                }
            });
            const responseHandler = (message) => {
                if (message.channel === 'post' && message.data.id === id) {
                    this.ws.removeListener('message', responseHandler);
                    if (message.data.response.type === 'error') {
                        reject(new Error(message.data.response.payload));
                    }
                    else {
                        resolve(message.data.response.payload);
                    }
                }
            };
            this.ws.on('message', responseHandler);
            // Set a timeout for the request
            setTimeout(() => {
                this.ws.removeListener('message', responseHandler);
                reject(new Error('Request timeout'));
            }, 30000); // 30 seconds timeout
        });
    }
    // Unsubscribe methods
    unsubscribeFromAllMids() {
        this.unsubscribe({ type: 'allMids' });
    }
    unsubscribeFromNotification(user) {
        this.unsubscribe({ type: 'notification', user });
    }
    unsubscribeFromWebData2(user) {
        this.unsubscribe({ type: 'webData2', user });
    }
    unsubscribeFromCandle(coin, interval) {
        this.unsubscribe({ type: 'candle', coin, interval });
    }
    unsubscribeFromL2Book(coin) {
        this.unsubscribe({ type: 'l2Book', coin });
    }
    unsubscribeFromTrades(coin) {
        this.unsubscribe({ type: 'trades', coin });
    }
    unsubscribeFromOrderUpdates(user) {
        this.unsubscribe({ type: 'orderUpdates', user });
    }
    unsubscribeFromUserEvents(user) {
        this.unsubscribe({ type: 'userEvents', user });
    }
    unsubscribeFromUserFills(user) {
        this.unsubscribe({ type: 'userFills', user });
    }
    unsubscribeFromUserFundings(user) {
        this.unsubscribe({ type: 'userFundings', user });
    }
    unsubscribeFromUserNonFundingLedgerUpdates(user) {
        this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user });
    }
}
exports.WebSocketSubscriptions = WebSocketSubscriptions;
//# sourceMappingURL=subscriptions.js.map