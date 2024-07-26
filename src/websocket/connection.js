"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
var ws_1 = require("ws");
var events_1 = require("events");
var CONSTANTS = require("../types/constants");
var WebSocketClient = /** @class */ (function (_super) {
    __extends(WebSocketClient, _super);
    function WebSocketClient(testnet) {
        if (testnet === void 0) { testnet = false; }
        var _this = _super.call(this) || this;
        _this.ws = null;
        _this.pingInterval = null;
        _this.reconnectAttempts = 0;
        _this.maxReconnectAttempts = 5;
        _this.reconnectDelay = 5000;
        _this.url = testnet ? CONSTANTS.WSS_URLS.TESTNET : CONSTANTS.WSS_URLS.PRODUCTION;
        return _this;
    }
    WebSocketClient.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.ws = new ws_1.default(_this.url);
            _this.ws.on('open', function () {
                console.log('WebSocket connected');
                _this.reconnectAttempts = 0;
                _this.startPingInterval();
                resolve();
            });
            _this.ws.on('message', function (data) {
                var message = JSON.parse(data.toString());
                _this.emit('message', message);
            });
            _this.ws.on('error', function (error) {
                console.error('WebSocket error:', error);
                reject(error);
            });
            _this.ws.on('close', function () {
                console.log('WebSocket disconnected');
                _this.stopPingInterval();
                _this.reconnect();
            });
        });
    };
    WebSocketClient.prototype.reconnect = function () {
        var _this = this;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log("Attempting to reconnect (".concat(this.reconnectAttempts, "/").concat(this.maxReconnectAttempts, ")..."));
            setTimeout(function () { return _this.connect(); }, this.reconnectDelay);
        }
        else {
            console.error('Max reconnection attempts reached. Please reconnect manually.');
        }
    };
    WebSocketClient.prototype.startPingInterval = function () {
        var _this = this;
        this.pingInterval = setInterval(function () {
            _this.sendMessage({ method: 'ping' });
        }, 30000); // Send ping every 30 seconds
    };
    WebSocketClient.prototype.stopPingInterval = function () {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    };
    WebSocketClient.prototype.sendMessage = function (message) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(message));
    };
    WebSocketClient.prototype.close = function () {
        if (this.ws) {
            this.ws.close();
        }
        this.stopPingInterval();
    };
    return WebSocketClient;
}(events_1.EventEmitter));
exports.WebSocketClient = WebSocketClient;
