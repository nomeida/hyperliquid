import * as CONSTANTS from '../types/constants';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private pingInterval: number | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 5000;
    private initialReconnectDelay: number = 1000;
    private maxReconnectDelay: number = 30000;
    private eventHandlers: Map<string, Set<Function>> = new Map();

    constructor(testnet: boolean = false, maxReconnectAttempts:number=5) {
        this.maxReconnectAttempts = maxReconnectAttempts;
        this.url = testnet ? CONSTANTS.WSS_URLS.TESTNET : CONSTANTS.WSS_URLS.PRODUCTION;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.startPingInterval();
                    this.emit('open');
                    resolve();
                };

                this.ws.onmessage = (event: MessageEvent) => {
                    const message = JSON.parse(event.data);
                    this.emit('message', message);
                };

                this.ws.onerror = (event: Event) => {
                    console.error('WebSocket error:', event);
                    this.emit('error', event);
                    reject(event);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.stopPingInterval();
                    this.emit('close');
                    this.reconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private reconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(
                this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
                this.maxReconnectDelay
            );
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
            const timer = setTimeout(() => {
                this.connect().then(() => {
                    this.emit('reconnect', true);
                }).catch(err => {
                    console.error('Reconnection failed:', err);
                    this.emit('error', err);
                    this.reconnect();
                });
            }, delay);
            // Only call unref if available (Node.js environment)
            if (typeof timer.unref === 'function') {
                timer.unref();
            }
        } else {
            console.error('Max reconnection attempts reached. Please reconnect manually.');
            this.emit('maxReconnectAttemptsReached');
        }
    }

    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            this.sendMessage({ method: 'ping' });
        }, 15000) as unknown as number;
    }

    private stopPingInterval(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    sendMessage(message: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(message));
    }

    close(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.stopPingInterval();
    }

    on(event: string, handler: Function): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)?.add(handler);
    }

    removeListener(event: string, handler: Function): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    removeAllListeners(event?: string): void {
        if (event) {
            this.eventHandlers.delete(event);
        } else {
            this.eventHandlers.clear();
        }
    }

    private emit(event: string, ...args: any[]): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }
}