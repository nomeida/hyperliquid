import * as CONSTANTS from '../types/constants';
import { environment } from '../utils/environment';

export class WebSocketClient {
  private ws: WebSocket | any = null; // 'any' to support both native WebSocket and ws package
  private url: string;
  private pingInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private initialReconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private WebSocketImpl: typeof WebSocket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private subscriptionCount: number = 0;
  private lastPongReceived: number = 0;
  private manualDisconnect: boolean = false; // Flag to track if disconnect was manually initiated
  private readonly MAX_SUBSCRIPTIONS: number = 1000; // Maximum subscriptions per IP as per API docs

  constructor(testnet: boolean = false, maxReconnectAttempts: number = 5) {
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.url = testnet ? CONSTANTS.WSS_URLS.TESTNET : CONSTANTS.WSS_URLS.PRODUCTION;

    // Determine which WebSocket implementation to use
    if (environment.hasNativeWebSocket()) {
      this.WebSocketImpl = WebSocket;
    } else if (environment.isNode) {
      try {
        // Try to load ws package
        this.WebSocketImpl = (globalThis as any).require('ws');
      } catch (error) {
        this.WebSocketImpl = null;
      }
    }
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === (this.WebSocketImpl?.OPEN ?? WebSocket.OPEN);
  }

  connect(): Promise<void> {
    // Reset the manualDisconnect flag when connecting
    this.manualDisconnect = false;

    // If already connected, return immediately
    if (this.isConnected()) {
      return Promise.resolve();
    }

    // If connection is in progress, return existing promise
    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        if (!this.WebSocketImpl) {
          if (environment.isNode) {
            throw new Error(
              'This SDK requires Node.js version 22 or higher as earlier versions do not have support for the NodeJS native websockets.'
            );
          } else {
            throw new Error('WebSocket support is not available in this environment.');
          }
        }

        this.ws = new this.WebSocketImpl(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          this.lastPongReceived = Date.now();
          this.startPingInterval();
          this.emit('open');
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data);

            // Debug log for post responses
            if (message.channel === 'post') {
              console.log('Received WebSocket post response:', JSON.stringify(message));
            }

            // Handle pong responses
            if (message.channel === 'pong') {
              this.lastPongReceived = Date.now();
            }

            this.emit('message', message);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
            console.error('Raw message data:', event.data);
          }
        };

        this.ws.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          this.emit('error', event);
          if (!this.connected) {
            this.connecting = false;
            reject(event);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.connected = false;
          this.connecting = false;
          this.stopPingInterval();
          this.emit('close');

          // Only attempt to reconnect if not manually disconnected
          if (!this.manualDisconnect) {
            this.reconnect();
          } else {
            console.log('Manual disconnect detected, not attempting to reconnect');
            this.emit('manualDisconnect');
          }
        };
      } catch (error) {
        this.connecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectDelay
      );
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
      );
      const timer = setTimeout(() => {
        this.connect()
          .then(() => {
            this.emit('reconnect', true);
          })
          .catch(err => {
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
      if (this.isConnected()) {
        // Send ping message
        this.sendMessage({ method: 'ping' });

        // Check if we've received a pong recently (within 30 seconds)
        const now = Date.now();
        if (now - this.lastPongReceived > 30000) {
          console.warn('No pong received in the last 30 seconds, reconnecting...');
          this.close();
          // Only attempt to reconnect if not manually disconnected
          if (!this.manualDisconnect) {
            this.connect().catch(err => {
              console.error('Failed to reconnect after ping timeout:', err);
            });
          }
        }
      }
    }, 15000) as unknown as number;
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendMessage(message: any): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  close(manualDisconnect: boolean = false): void {
    this.manualDisconnect = manualDisconnect;
    if (this.ws) {
      this.connected = false;
      this.connecting = false;
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

  // Track subscription count
  incrementSubscriptionCount(): boolean {
    if (this.subscriptionCount >= this.MAX_SUBSCRIPTIONS) {
      console.error(`Maximum subscription limit (${this.MAX_SUBSCRIPTIONS}) reached`);
      return false;
    }
    this.subscriptionCount++;
    return true;
  }

  decrementSubscriptionCount(): void {
    if (this.subscriptionCount > 0) {
      this.subscriptionCount--;
    }
  }

  getSubscriptionCount(): number {
    return this.subscriptionCount;
  }
}
