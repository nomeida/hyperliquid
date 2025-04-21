import { WebSocketClient } from './connection';
import {
  AllMids,
  WsTrade,
  WsBook,
  WsBbo,
  WsOrder,
  WsUserEvent,
  Notification,
  WebData2,
  Candle,
  WsUserFills,
  WsUserFundings,
  WsUserNonFundingLedgerUpdates,
  WsUserActiveAssetData,
  WsActiveSpotAssetCtx,
  WsActiveAssetCtx,
  WsTwapHistoryResponse,
  WsTwapSliceFill,
} from '../types/index';
import { SymbolConversion } from '../utils/symbolConversion';

export class WebSocketSubscriptions {
  private ws: WebSocketClient;
  private symbolConversion: SymbolConversion;
  private activeSubscriptions: Map<string, Set<Function>> = new Map();
  private subscriptionDetails: Map<string, { type: string; params: any }> = new Map();

  constructor(ws: WebSocketClient, symbolConversion: SymbolConversion) {
    this.ws = ws;
    this.symbolConversion = symbolConversion;

    // Listen for reconnect events to resubscribe
    this.ws.on('reconnect', () => {
      this.resubscribeAll();
    });
  }

  private getSubscriptionKey(type: string, params: any = {}): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  private addSubscriptionCallback(key: string, callback: Function): void {
    if (!this.activeSubscriptions.has(key)) {
      this.activeSubscriptions.set(key, new Set());
    }
    this.activeSubscriptions.get(key)?.add(callback);
  }

  private removeSubscriptionCallback(key: string, callback: Function): void {
    const callbacks = this.activeSubscriptions.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.activeSubscriptions.delete(key);
      }
    }
  }

  private async subscribe(subscription: { type: string; [key: string]: any }): Promise<void> {
    // Check if we can add another subscription
    if (!this.ws.incrementSubscriptionCount()) {
      throw new Error('Maximum subscription limit reached (1000 subscriptions per IP)');
    }

    try {
      await this.ws.sendMessage({ method: 'subscribe', subscription: subscription });

      // Store subscription details for resubscription
      const subscriptionKey = this.getSubscriptionKey(subscription.type, subscription);
      this.subscriptionDetails.set(subscriptionKey, {
        type: subscription.type,
        params: subscription,
      });
    } catch (error) {
      // If subscription fails, decrement the count
      this.ws.decrementSubscriptionCount();
      throw error;
    }
  }

  private async unsubscribe(subscription: { type: string; [key: string]: any }): Promise<void> {
    const convertedSubscription = await this.symbolConversion.convertSymbolsInObject(subscription);
    await this.ws.sendMessage({ method: 'unsubscribe', subscription: convertedSubscription });
    // Decrement subscription count when unsubscribing
    this.ws.decrementSubscriptionCount();

    // Remove subscription details
    const subscriptionKey = this.getSubscriptionKey(subscription.type, subscription);
    this.subscriptionDetails.delete(subscriptionKey);
  }

  private handleMessage(
    message: any,
    callback: (data: any) => void,
    channel: string,
    additionalChecks: (data: any) => boolean = () => true
  ) {
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

  async subscribeToAllMids(callback: (data: AllMids) => void): Promise<void> {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const subscriptionKey = this.getSubscriptionKey('allMids');

    // Remove existing subscription if any
    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromAllMids();
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'allMids') {
        if (message.data.mids) {
          const convertedData: AllMids = {};
          for (const [key, value] of Object.entries(message.data.mids)) {
            const convertedKey = await this.symbolConversion.convertSymbol(key);
            const convertedValue = this.symbolConversion.convertToNumber(value);
            convertedData[convertedKey] = convertedValue;
          }
          callback(convertedData);
        }
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'allMids' });
  }

  async subscribeToNotification(
    user: string,
    callback: (data: Notification & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('notification', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromNotification(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'notification') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'notification', user: user });
  }

  async subscribeToWebData2(user: string, callback: (data: WebData2) => void): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('webData2', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromWebData2(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'webData2') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'webData2', user: user });
  }

  async subscribeToCandle(
    coin: string,
    interval: string,
    callback: (data: Candle) => void
  ): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('candle', { coin: convertedCoin, interval });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromCandle(coin, interval);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (
        message.channel === 'candle' &&
        message.data.s === convertedCoin &&
        message.data.i === interval
      ) {
        message = await this.symbolConversion.convertSymbolsInObject(message, ['s']);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'candle', coin: convertedCoin, interval: interval });
  }

  async subscribeToL2Book(
    coin: string,
    callback: (data: WsBook & { coin: string }) => void
  ): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('l2Book', { coin: convertedCoin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromL2Book(coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'l2Book' && message.data.coin === convertedCoin) {
        message = await this.symbolConversion.convertSymbolsInObject(message, ['coin']);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'l2Book', coin: convertedCoin });
  }

  async subscribeToTrades(coin: string, callback: (data: any) => void): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('trades', { coin: convertedCoin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromTrades(coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'trades' && message.data[0].coin === convertedCoin) {
        message = await this.symbolConversion.convertSymbolsInObject(message, ['coin']);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'trades', coin: convertedCoin });
  }

  async subscribeToOrderUpdates(
    user: string,
    callback: (data: WsOrder[] & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('orderUpdates', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromOrderUpdates(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'orderUpdates') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'orderUpdates', user: user });
  }

  async subscribeToUserEvents(
    user: string,
    callback: (data: WsUserEvent & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userEvents', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserEvents(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userEvents') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userEvents', user: user });
  }

  async subscribeToUserFills(
    user: string,
    callback: (data: WsUserFills & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userFills', { user });

    // Remove existing subscription if any
    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserFills(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userFills') {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    // Store the message handler with the callback for cleanup
    (callback as any).__messageHandler = messageHandler;

    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userFills', user });
  }

  async subscribeToUserFundings(
    user: string,
    callback: (data: WsUserFundings & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userFundings', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserFundings(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userFundings') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userFundings', user: user });
  }

  async subscribeToUserNonFundingLedgerUpdates(
    user: string,
    callback: (data: WsUserNonFundingLedgerUpdates & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userNonFundingLedgerUpdates', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserNonFundingLedgerUpdates(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userNonFundingLedgerUpdates') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userNonFundingLedgerUpdates', user: user });
  }

  async subscribeToUserActiveAssetData(
    user: string,
    coin: string,
    callback: (data: WsUserActiveAssetData & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('activeAssetData', { user, coin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserActiveAssetData(user, coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'activeAssetData') {
        message = await this.symbolConversion.convertSymbolsInObject(message);
        callback(message.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'activeAssetData', user: user, coin: coin });
  }

  /**
   * Send a POST request via WebSocket
   * @param requestType - The type of request ('info' or 'action')
   * @param payload - The payload to send with the request
   * @param timeout - Optional timeout in milliseconds (default: 30000)
   * @returns A promise that resolves with the response data
   */
  async postRequest(
    requestType: 'info' | 'action',
    payload: any,
    timeout: number = 30000
  ): Promise<any> {
    // Ensure WebSocket is connected
    if (!this.ws.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    // Generate a unique request ID
    const id = Date.now() + Math.floor(Math.random() * 1000);

    console.log(`Preparing WebSocket POST request (ID: ${id}):`, JSON.stringify(payload));

    // For WebSocket POST requests, we need to use the exchange format (e.g., 'BTC' instead of 'BTC-PERP')
    // We need to ensure all coin references are in the exchange format
    let convertedPayload = { ...payload };

    // Helper function to convert a coin to exchange format
    const convertCoinToExchangeFormat = (coin: string): string => {
      if (coin && coin.includes('-')) {
        const parts = coin.split('-');
        return parts[0]; // Return just the base symbol (e.g., 'BTC' from 'BTC-PERP')
      }
      return coin;
    };

    // Process coin field if it exists
    if (convertedPayload.coin) {
      convertedPayload.coin = convertCoinToExchangeFormat(convertedPayload.coin);
    }

    // Process arrays of coins if they exist
    if (Array.isArray(convertedPayload.coins)) {
      convertedPayload.coins = convertedPayload.coins.map(convertCoinToExchangeFormat);
    }

    // For nested objects like in order requests
    if (convertedPayload.orders) {
      convertedPayload.orders = convertedPayload.orders.map((order: any) => {
        if (order.coin) {
          return { ...order, coin: convertCoinToExchangeFormat(order.coin) };
        }
        return order;
      });
    }

    // For cancels which might have coin field
    if (convertedPayload.cancels) {
      convertedPayload.cancels = convertedPayload.cancels.map((cancel: any) => {
        if (cancel.coin) {
          return { ...cancel, coin: convertCoinToExchangeFormat(cancel.coin) };
        }
        return cancel;
      });
    }

    // Create the request object according to Hyperliquid API format
    const request = {
      method: 'post',
      id: id,
      request: {
        type: requestType,
        payload: convertedPayload,
      },
    };

    console.log(`Sending WebSocket POST request (ID: ${id}):`, JSON.stringify(request));

    // Send the request
    this.ws.sendMessage(request);

    // Wait for and process the response
    return new Promise((resolve, reject) => {
      let receivedMessages = 0;

      const responseHandler = (message: any) => {
        // Skip if not an object
        if (typeof message !== 'object' || message === null) {
          return;
        }

        receivedMessages++;

        // For debugging - log every 10th message to avoid flooding the console
        if (receivedMessages % 10 === 0) {
          console.log(
            `Received ${receivedMessages} WebSocket messages while waiting for response to request ${id}`
          );
        }

        // Check if this is a post response
        if (message.channel === 'post') {
          console.log(`Received post response:`, JSON.stringify(message));

          // Check if this is a response to our request
          if (message.data && message.data.id === id) {
            console.log(`Found matching response for request ID ${id}`);

            // Clean up the event listener
            this.ws.removeListener('message', responseHandler);

            // Handle error responses
            if (message.data.response && message.data.response.type === 'error') {
              reject(new Error(message.data.response.payload));
              return;
            }

            try {
              // Extract and convert the response payload
              let responseData;

              if (message.data.response && message.data.response.payload) {
                responseData = message.data.response.payload;
              } else if (message.data.response) {
                responseData = message.data.response;
              } else {
                responseData = message.data;
              }

              // For the response, we want to convert exchange format back to our internal format
              // This means adding the '-PERP' suffix to coin symbols
              const processResponse = (data: any): any => {
                if (!data || typeof data !== 'object') {
                  return data;
                }

                if (Array.isArray(data)) {
                  return data.map(item => processResponse(item));
                }

                const result: any = {};

                for (const [key, value] of Object.entries(data)) {
                  if (key === 'coin' && typeof value === 'string') {
                    // Convert coin to internal format (add -PERP suffix if not present)
                    result[key] = value.includes('-') ? value : `${value}-PERP`;
                  } else if (typeof value === 'object' && value !== null) {
                    // Recursively process nested objects
                    result[key] = processResponse(value);
                  } else {
                    // Keep other values as is
                    result[key] = value;
                  }
                }

                return result;
              };

              const processedResponse = processResponse(responseData);
              resolve(processedResponse);
            } catch (error) {
              console.error('Error processing response:', error);
              reject(error);
            }
          }
        }
      };

      // Register the response handler
      this.ws.on('message', responseHandler);

      // Set a timeout to prevent hanging requests
      setTimeout(() => {
        this.ws.removeListener('message', responseHandler);
        console.log(
          `Request ${id} timed out after ${timeout}ms. Received ${receivedMessages} messages.`
        );
        reject(new Error(`WebSocket request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  async unsubscribeFromAllMids(): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('allMids');
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'allMids' });
  }

  async unsubscribeFromNotification(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('notification', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'notification', user: user });
  }

  async unsubscribeFromWebData2(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('webData2', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'webData2', user: user });
  }

  async unsubscribeFromCandle(coin: string, interval: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('candle', { coin: convertedCoin, interval });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'candle', coin: convertedCoin, interval: interval });
  }

  async unsubscribeFromL2Book(coin: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('l2Book', { coin: convertedCoin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'l2Book', coin: convertedCoin });
  }

  async unsubscribeFromTrades(coin: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('trades', { coin: convertedCoin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'trades', coin: convertedCoin });
  }

  async unsubscribeFromOrderUpdates(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('orderUpdates', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'orderUpdates', user: user });
  }

  async unsubscribeFromUserEvents(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userEvents', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userEvents', user: user });
  }

  async unsubscribeFromUserFills(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userFills', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userFills', user });
  }

  async unsubscribeFromUserFundings(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userFundings', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userFundings', user: user });
  }

  async unsubscribeFromUserNonFundingLedgerUpdates(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userNonFundingLedgerUpdates', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userNonFundingLedgerUpdates', user: user });
  }

  async unsubscribeFromUserActiveAssetData(user: string, coin: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('activeAssetData', { user, coin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'activeAssetData', user: user, coin: coin });
  }

  async subscribeToActiveAssetCtx(
    coin: string,
    callback: (data: WsActiveAssetCtx) => void
  ): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('activeAssetCtx', { coin: convertedCoin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromActiveAssetCtx(coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'activeAssetCtx' && message.data.coin === convertedCoin) {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'activeAssetCtx', coin: convertedCoin });
  }

  async subscribeToActiveSpotAssetCtx(
    coin: string,
    callback: (data: WsActiveSpotAssetCtx) => void
  ): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('activeSpotAssetCtx', { coin: convertedCoin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromActiveSpotAssetCtx(coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'activeSpotAssetCtx' && message.data.coin === convertedCoin) {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'activeSpotAssetCtx', coin: convertedCoin });
  }

  async subscribeToUserTwapSliceFills(
    user: string,
    callback: (data: WsTwapSliceFill & { user: string }) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userTwapSliceFills', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserTwapSliceFills(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userTwapSliceFills') {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userTwapSliceFills', user });
  }

  async subscribeToBbo(coin: string, callback: (data: WsBbo) => void): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('bbo', { coin: convertedCoin });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromBbo(coin);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'bbo' && message.data.coin === convertedCoin) {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'bbo', coin: convertedCoin });
  }

  async subscribeToUserTwapHistory(
    user: string,
    callback: (data: WsTwapHistoryResponse) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userTwapHistory', { user });

    if (this.activeSubscriptions.has(subscriptionKey)) {
      await this.unsubscribeFromUserTwapHistory(user);
    }

    this.addSubscriptionCallback(subscriptionKey, callback);

    const messageHandler = async (message: any) => {
      if (message.channel === 'userTwapHistory') {
        const convertedMessage = await this.symbolConversion.convertSymbolsInObject(message);
        callback(convertedMessage.data);
      }
    };

    (callback as any).__messageHandler = messageHandler;
    this.ws.on('message', messageHandler);
    await this.subscribe({ type: 'userTwapHistory', user });
  }

  async unsubscribeFromActiveAssetCtx(coin: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('activeAssetCtx', { coin: convertedCoin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'activeAssetCtx', coin: convertedCoin });
  }

  async unsubscribeFromActiveSpotAssetCtx(coin: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('activeSpotAssetCtx', { coin: convertedCoin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'activeSpotAssetCtx', coin: convertedCoin });
  }

  async unsubscribeFromUserTwapSliceFills(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userTwapSliceFills', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userTwapSliceFills', user });
  }

  async unsubscribeFromBbo(coin: string): Promise<void> {
    const convertedCoin = await this.symbolConversion.convertSymbol(coin, 'reverse');
    const subscriptionKey = this.getSubscriptionKey('bbo', { coin: convertedCoin });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'bbo', coin: convertedCoin });
  }

  async unsubscribeFromUserTwapHistory(user: string): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey('userTwapHistory', { user });
    const callbacks = this.activeSubscriptions.get(subscriptionKey);

    if (callbacks) {
      for (const callback of callbacks) {
        const messageHandler = (callback as any).__messageHandler;
        if (messageHandler) {
          this.ws.removeListener('message', messageHandler);
          delete (callback as any).__messageHandler;
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    await this.unsubscribe({ type: 'userTwapHistory', user });
  }

  /**
   * Resubscribes to all active subscriptions after a WebSocket reconnection
   */
  async resubscribeAll(): Promise<void> {
    console.log('Resubscribing to all active subscriptions after reconnection...');

    // Reset the subscription count since we're starting fresh after reconnection
    // The count will be incremented for each subscription as we resubscribe

    // Create a copy of the subscription details to avoid modification during iteration
    const subscriptionsToRestore = new Map(this.subscriptionDetails);

    // Clear the current subscription details as we'll rebuild it
    this.subscriptionDetails.clear();

    // Resubscribe to each subscription
    for (const [, details] of subscriptionsToRestore.entries()) {
      try {
        console.log(`Resubscribing to ${details.type}`);
        await this.subscribe(details.params);
      } catch (error) {
        console.error(`Failed to resubscribe to ${details.type}:`, error);
      }
    }

    console.log('Resubscription complete');
  }
}
