"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSubscriptions = void 0;
var WebSocketSubscriptions = /** @class */ (function () {
    function WebSocketSubscriptions(ws) {
        this.ws = ws;
    }
    WebSocketSubscriptions.prototype.subscribe = function (subscription) {
        this.ws.sendMessage({ method: 'subscribe', subscription: subscription });
    };
    WebSocketSubscriptions.prototype.unsubscribe = function (subscription) {
        this.ws.sendMessage({ method: 'unsubscribe', subscription: subscription });
    };
    WebSocketSubscriptions.prototype.subscribeToAllMids = function (callback) {
        this.subscribe({ type: 'allMids' });
        this.ws.on('message', function (message) {
            if (message.channel === 'allMids') {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToNotification = function (user, callback) {
        this.subscribe({ type: 'notification', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'notification' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToWebData2 = function (user, callback) {
        this.subscribe({ type: 'webData2', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'webData2' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToCandle = function (coin, interval, callback) {
        this.subscribe({ type: 'candle', coin: coin, interval: interval });
        this.ws.on('message', function (message) {
            if (message.channel === 'candle' && message.data.coin === coin && message.data.interval === interval) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToL2Book = function (coin, callback) {
        this.subscribe({ type: 'l2Book', coin: coin });
        this.ws.on('message', function (message) {
            if (message.channel === 'l2Book' && message.data.coin === coin) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToTrades = function (coin, callback) {
        this.subscribe({ type: 'trades', coin: coin });
        this.ws.on('message', function (message) {
            if (message.channel === 'trades' && message.data.coin === coin) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToOrderUpdates = function (user, callback) {
        this.subscribe({ type: 'orderUpdates', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'orderUpdates' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToUserEvents = function (user, callback) {
        this.subscribe({ type: 'userEvents', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'userEvents' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToUserFills = function (user, callback) {
        this.subscribe({ type: 'userFills', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'userFills' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToUserFundings = function (user, callback) {
        this.subscribe({ type: 'userFundings', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'userFundings' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    WebSocketSubscriptions.prototype.subscribeToUserNonFundingLedgerUpdates = function (user, callback) {
        this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
        this.ws.on('message', function (message) {
            if (message.channel === 'userNonFundingLedgerUpdates' && message.data.user === user) {
                callback(message.data);
            }
        });
    };
    // Method to handle post requests via WebSocket
    WebSocketSubscriptions.prototype.postRequest = function (requestType, payload) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var id = Date.now();
            _this.ws.sendMessage({
                method: 'post',
                id: id,
                request: {
                    type: requestType,
                    payload: payload
                }
            });
            var responseHandler = function (message) {
                if (message.channel === 'post' && message.data.id === id) {
                    _this.ws.removeListener('message', responseHandler);
                    if (message.data.response.type === 'error') {
                        reject(new Error(message.data.response.payload));
                    }
                    else {
                        resolve(message.data.response.payload);
                    }
                }
            };
            _this.ws.on('message', responseHandler);
            // Set a timeout for the request
            setTimeout(function () {
                _this.ws.removeListener('message', responseHandler);
                reject(new Error('Request timeout'));
            }, 30000); // 30 seconds timeout
        });
    };
    // Unsubscribe methods
    WebSocketSubscriptions.prototype.unsubscribeFromAllMids = function () {
        this.unsubscribe({ type: 'allMids' });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromNotification = function (user) {
        this.unsubscribe({ type: 'notification', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromWebData2 = function (user) {
        this.unsubscribe({ type: 'webData2', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromCandle = function (coin, interval) {
        this.unsubscribe({ type: 'candle', coin: coin, interval: interval });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromL2Book = function (coin) {
        this.unsubscribe({ type: 'l2Book', coin: coin });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromTrades = function (coin) {
        this.unsubscribe({ type: 'trades', coin: coin });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromOrderUpdates = function (user) {
        this.unsubscribe({ type: 'orderUpdates', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromUserEvents = function (user) {
        this.unsubscribe({ type: 'userEvents', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromUserFills = function (user) {
        this.unsubscribe({ type: 'userFills', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromUserFundings = function (user) {
        this.unsubscribe({ type: 'userFundings', user: user });
    };
    WebSocketSubscriptions.prototype.unsubscribeFromUserNonFundingLedgerUpdates = function (user) {
        this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user: user });
    };
    return WebSocketSubscriptions;
}());
exports.WebSocketSubscriptions = WebSocketSubscriptions;
