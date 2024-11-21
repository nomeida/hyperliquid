import { EventEmitter } from 'events';
export declare class WebSocketClient extends EventEmitter {
    private ws;
    private url;
    private pingInterval;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private initialReconnectDelay;
    private maxReconnectDelay;
    constructor(testnet?: boolean);
    connect(): Promise<void>;
    private reconnect;
    private startPingInterval;
    private stopPingInterval;
    sendMessage(message: any): void;
    close(): void;
}
//# sourceMappingURL=connection.d.ts.map