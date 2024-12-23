import { WebSocketClient } from './connection';
import { 
    AllMids, WsTrade, WsBook, WsOrder, WsUserEvent, Notification, 
    WebData2, Candle, WsUserFills, WsUserFundings, WsUserNonFundingLedgerUpdates 
} from '../types/index';

export class WebSocketSubscriptions {
private ws: WebSocketClient;

constructor(ws: WebSocketClient) {
    this.ws = ws;
}

private subscribe(subscription: any): void {
    this.ws.sendMessage({ method: 'subscribe', subscription });
}

private unsubscribe(subscription: any): void {
    this.ws.sendMessage({ method: 'unsubscribe', subscription });
}

subscribeToAllMids(callback: (data: AllMids) => void): void {
    this.subscribe({ type: 'allMids' });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'allMids') {
        callback(message.data);
    }
    });
}

subscribeToNotification(user: string, callback: (data: Notification) => void): void {
    this.subscribe({ type: 'notification', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'notification' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToWebData2(user: string, callback: (data: WebData2) => void): void {
    this.subscribe({ type: 'webData2', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'webData2' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToCandle(coin: string, interval: string, callback: (data: Candle[]) => void): void {
    this.subscribe({ type: 'candle', coin, interval });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'candle' && message.data.coin === coin && message.data.interval === interval) {
        callback(message.data);
    }
    });
}

subscribeToL2Book(coin: string, callback: (data: WsBook) => void): void {
    this.subscribe({ type: 'l2Book', coin });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'l2Book' && message.data.coin === coin) {
        callback(message.data);
    }
    });
}

subscribeToTrades(coin: string, callback: (data: WsTrade[]) => void): void {
    this.subscribe({ type: 'trades', coin });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'trades' && message.data.coin === coin) {
        callback(message.data);
    }
    });
}

subscribeToOrderUpdates(user: string, callback: (data: WsOrder[]) => void): void {
    this.subscribe({ type: 'orderUpdates', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'orderUpdates' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToUserEvents(user: string, callback: (data: WsUserEvent) => void): void {
    this.subscribe({ type: 'userEvents', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'userEvents' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToUserFills(user: string, callback: (data: WsUserFills) => void): void {
    this.subscribe({ type: 'userFills', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'userFills' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToUserFundings(user: string, callback: (data: WsUserFundings) => void): void {
    this.subscribe({ type: 'userFundings', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'userFundings' && message.data.user === user) {
        callback(message.data);
    }
    });
}

subscribeToUserNonFundingLedgerUpdates(user: string, callback: (data: WsUserNonFundingLedgerUpdates) => void): void {
    this.subscribe({ type: 'userNonFundingLedgerUpdates', user });
    this.ws.on('message', (message: any) => {
    if (message.channel === 'userNonFundingLedgerUpdates' && message.data.user === user) {
        callback(message.data);
    }
    });
}

// Method to handle post requests via WebSocket
postRequest(requestType: 'info' | 'action', payload: any): Promise<any> {
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

    const responseHandler = (message: any) => {
        if (message.channel === 'post' && message.data.id === id) {
        this.ws.removeListener('message', responseHandler);
        if (message.data.response.type === 'error') {
            reject(new Error(message.data.response.payload));
        } else {
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
unsubscribeFromAllMids(): void {
    this.unsubscribe({ type: 'allMids' });
}

unsubscribeFromNotification(user: string): void {
    this.unsubscribe({ type: 'notification', user });
}

unsubscribeFromWebData2(user: string): void {
    this.unsubscribe({ type: 'webData2', user });
}

unsubscribeFromCandle(coin: string, interval: string): void {
    this.unsubscribe({ type: 'candle', coin, interval });
}

unsubscribeFromL2Book(coin: string): void {
    this.unsubscribe({ type: 'l2Book', coin });
}

unsubscribeFromTrades(coin: string): void {
    this.unsubscribe({ type: 'trades', coin });
}

unsubscribeFromOrderUpdates(user: string): void {
    this.unsubscribe({ type: 'orderUpdates', user });
}

unsubscribeFromUserEvents(user: string): void {
    this.unsubscribe({ type: 'userEvents', user });
}

unsubscribeFromUserFills(user: string): void {
    this.unsubscribe({ type: 'userFills', user });
}

unsubscribeFromUserFundings(user: string): void {
    this.unsubscribe({ type: 'userFundings', user });
}

unsubscribeFromUserNonFundingLedgerUpdates(user: string): void {
    this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user });
}
}