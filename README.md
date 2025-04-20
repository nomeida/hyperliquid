# Hyperliquid API SDK

Typescript SDK to more easily interact with Hyperliquid's API

All info on the Hyperliquid API can be found here: [HyperLiquid API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs)

## Features

- Complete API coverage for both REST and WebSocket endpoints
- TypeScript support with comprehensive type definitions
- Browser and Node.js compatibility
- Automatic handling of trailing zeros in price and size fields
- Rate limiting support
- Comprehensive error handling

## Installation

Choose your preferred installation method:

### Package Managers

```bash
# npm
npm i --save hyperliquid

# yarn
yarn add hyperliquid

# pnpm
pnpm add hyperliquid

# bun
bun i hyperliquid
```

### Node.js Version Requirements for WebSocket Functionality

This SDK uses native WebSocket implementation which requires Node.js version 22 or higher. If you're using an earlier version of Node.js, you'll need to install the `ws` package to use the WebSocket functionality:

```bash
npm install ws
```

### Direct Web Usage

```html
<!-- Global bundle (UMD) - Use this with script tags -->
<script src="https://unpkg.com/hyperliquid/dist/browser.global.js"></script>

<!-- ESM bundle - Use this with ES modules -->
<script type="module">
  import { Hyperliquid } from "https://unpkg.com/hyperliquid/dist/browser.js";
</script>

```

The SDK provides two browser bundles:
- `browser.global.js`: UMD bundle that exposes the SDK globally as `HyperliquidSDK`. Use this with regular `<script>` tags.
- `browser.js`: ESM bundle for use with ES modules (import/export syntax).

For Browser usage, see [Browser Usage Guide](/BROWSER.md).

## Usage

**API Agent Wallet Usage:** If you are using API Agent wallets everything works as normal but you need to add your actual account's wallet address in the Hyperliquid object field 'walletAddress'.

If you don't do this you will be unable to use some of the SDK methods successfully. If you are using
your own Private Key then it's not necessary as the SDK can derive your wallet address from the Private key.
```typescript
const { Hyperliquid } = require('hyperliquid');

const sdk = new Hyperliquid({
  enableWs: true, // boolean (OPTIONAL) - Enable/disable WebSocket functionality, defaults to true
  privateKey: <private_key - string>,
  testnet: <testnet - boolean (OPTIONAL)>,
  walletAddress: <walletAddress - string (Required if you are using an API Agent Wallet, otherwise not necessary)>,
  vaultAddress: <vaultAddress - string (OPTIONAL)>,
  maxReconnectAttempts: <number (OPTIONAL)> // Default is 5, controls WebSocket reconnection attempts
});

// Use the SDK methods
sdk.info.getAllMids().then(allMids => {
  console.log(allMids);
});
```
**Note:** You don't have to provide your private key, but it is required if you want to
use the exchange API to place, cancel or modify orders or access your accounts assets.
WebSocket functionality is enabled by default but can be disabled by setting `enableWs: false` in the constructor options.

## Key Features

### Rate Limiting

The SDK implements Hyperliquid's token bucket rate limiting system:
- 100 tokens maximum capacity
- 10 tokens per second refill rate
- Automatic handling of rate limits with proper backoff

The SDK will automatically wait when rate limits are reached, ensuring your API calls succeed without overwhelming the server.

### WebSocket Management

The SDK provides robust WebSocket connection handling:
- Automatic reconnection with exponential backoff
- Ping/pong heartbeat mechanism to detect stale connections
- Subscription limit tracking (maximum 1000 subscriptions per IP)
- Proper cleanup of subscriptions when no longer needed

### Secure Nonce Generation

For authenticated requests, the SDK uses a secure nonce generation system:
- Monotonically increasing timestamps
- Handles multiple requests in the same millisecond
- Ensures compliance with Hyperliquid's nonce requirements

## Symbol Naming Convention

Instead of using native symbols (which can be confusing, like @1, @4, @5 for spot and only the coin name for perps), we've implemented a more intuitive naming system:

- For perpetuals: `<coin>-PERP` (e.g., BTC-PERP, ETH-PERP)
- For spot: `<coin>-SPOT` (e.g., PURR-SPOT, BTC-SPOT)

This convention makes it easier to distinguish between spot and perpetual markets.

## Examples

### Exchange API Methods

```typescript
// Place an order
sdk.exchange.placeOrder({
  coin: 'BTC-PERP',
  is_buy: true,
  sz: 1,
  limit_px: 30000,
  order_type: { limit: { tif: 'Gtc' } },
  reduce_only: false,
  vaultAddress: '0x...' // optional
}).then(placeOrderResult => {
  console.log(placeOrderResult);
}).catch(error => {
  console.error('Error placing order:', error);
});

// Reserve additional actions for rate limits
// This costs 0.0005 USDC per request instead of trading to increase rate limits
sdk.exchange.reserveRequestWeight(1).then(result => {
  console.log('Reserved additional actions:', result);
}).catch(error => {
  console.error('Error reserving actions:', error);
});

// Multiple orders can be passed as an array or order objects
// The grouping, vaultAddress and builder properties are optional
// Grouping determines how multiple orders are treated by the exchange endpoint in terms
// of transaction priority, execution and dependency. Defaults to 'na' if not specified.
sdk.exchange.placeOrder({
  orders: [{
    coin: 'BTC-PERP',
    is_buy: true,
    sz: 1,
    limit_px: 30000,
    order_type: { limit: { tif: 'Gtc' } },
    reduce_only: false
  }],
  vaultAddress: '0x...',
  grouping: 'normalTpsl',
  builder: {
    address: '0x...',
    fee: 999,
  }
}).then(placeOrderResult => {
  console.log(placeOrderResult);
}).catch(error => {
  console.error('Error placing order:', error);
});

// Cancel an order
sdk.exchange.cancelOrder({
  coin: 'BTC-PERP',
  o: 123456 // order ID
}).then(cancelOrderResult => {
  console.log(cancelOrderResult);
}).catch(error => {
  console.error('Error cancelling order:', error);
});

// Transfer between perpetual and spot accounts
sdk.exchange.transferBetweenSpotAndPerp(100, true) // Transfer 100 USDC from spot to perp
  .then(transferResult => {
    console.log(transferResult);
  }).catch(error => {
    console.error('Error transferring funds:', error);
  });
```
All methods supported can be found here: [Hyperliquid Exchange Endpoint API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)

### General Info Methods

```typescript
// Get all mids
sdk.info.getAllMids().then(allMids => {
  console.log(allMids);
}).catch(error => {
  console.error('Error getting all mids:', error);
});

// Get user open orders
sdk.info.getUserOpenOrders('user_address_here').then(userOpenOrders => {
  console.log(userOpenOrders);
}).catch(error => {
  console.error('Error getting user open orders:', error);
});

// Get L2 order book
sdk.info.getL2Book('BTC-PERP').then(l2Book => {
  console.log(l2Book);
}).catch(error => {
  console.error('Error getting L2 book:', error);
});
```

All methods supported can be found here: [Hyperliquid Info Endpoint API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)

### WebSocket Methods

#### WebSocket Subscriptions

```typescript
const { Hyperliquid } = require('hyperliquid');

async function testWebSocketSubscriptions() {
    // Create a new Hyperliquid instance
    // You can pass a privateKey in the options if you need authenticated access
    const sdk = new Hyperliquid({ enableWs: true });

    try {
        // Connect to the WebSocket
        await sdk.connect();
        console.log('Connected to WebSocket');

        // Subscribe to get latest prices for all coins
        sdk.subscriptions.subscribeToAllMids((data) => {
            console.log('Received trades data:', data);
        });

        // Get updates anytime the user gets new fills
        sdk.subscriptions.subscribeToUserFills("<wallet_address_here>", (data) => {
            console.log('Received user fills data:', data);
        });

        // Get updates on 1 minute ETH-PERP candles
        sdk.subscriptions.subscribeToCandle("BTC-PERP", "1m", (data) => {
            console.log('Received candle data:', data);
        });

        // Keep the script running
        await new Promise(() => {});
    } catch (error) {
        console.error('Error:', error);
    }
}

testWebSocketSubscriptions();
```

#### WebSocket POST Requests

You can also use WebSocket to send POST requests instead of using HTTP. This is useful for high-frequency trading or when you need to minimize latency.

```typescript
const { Hyperliquid } = require('hyperliquid');

async function testWebSocketPostRequests() {
    // Create a new Hyperliquid instance
    const sdk = new Hyperliquid({
        enableWs: true,
        // Include privateKey for authorized requests
        privateKey: 'your_private_key' // Optional, only needed for authorized requests
    });

    try {
        // Connect to the WebSocket
        await sdk.connect();
        console.log('Connected to WebSocket');

        // Wait a moment to ensure connection is fully established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Example 1: Unauthorized POST request (info endpoint)
        const l2BookResponse = await sdk.subscriptions.postRequest('info', {
            type: 'l2Book',
            coin: 'BTC'
        });
        console.log('L2 Book Response:', l2BookResponse);

        // Example 2: Authorized POST request (exchange endpoint)
        // Only works if privateKey is provided
        if (sdk.isAuthenticated()) {
            // Generate order payload
            const orderPayload = await sdk.exchange.getOrderPayload({
                coin: 'BTC',
                is_buy: true,
                sz: '0.001',
                limit_px: '50000', // Far from market price for safety
                order_type: { limit: { tif: 'Gtc' } },
                reduce_only: false
            });

            // Send the order via WebSocket
            const orderResponse = await sdk.subscriptions.postRequest('action', orderPayload);
            console.log('Place Order Response:', orderResponse);

            // Cancel all orders
            const cancelAllPayload = await sdk.exchange.getCancelAllPayload();
            const cancelAllResponse = await sdk.subscriptions.postRequest('action', cancelAllPayload);
            console.log('Cancel All Orders Response:', cancelAllResponse);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Disconnect WebSocket when done
        sdk.disconnect();
    }
}

testWebSocketPostRequests();
```

**Notes:**
- The WebSocket connection must be fully established before sending POST requests. It's recommended to add a short delay after connecting before sending the first request.
- For authorized requests, the SDK will use the wallet address as the vault address if no vault address is explicitly provided. If you're using a specific vault, make sure to provide the vault address when initializing the SDK.

## Automatic Handling of Trailing Zeros

The Hyperliquid API requires that price (`p`) and size (`s`) fields do not contain trailing zeros. For example:
- `12345.0` should be `12345`
- `0.123450` should be `0.12345`

This SDK automatically handles this requirement for you in all relevant methods. When you use methods like `placeOrder`, `modifyOrder`, or `batchModifyOrders`, the SDK will automatically remove trailing zeros from price and size values.

You can also use string values for price and size fields, which will be properly formatted:

```typescript
// Both of these will work correctly
await sdk.exchange.placeOrder({
  coin: "BTC-PERP",
  is_buy: true,
  sz: "1.0000",  // Will be automatically converted to "1"
  limit_px: "50000.00",  // Will be automatically converted to "50000"
  reduce_only: false,
  order_type: { limit: { tif: 'Gtc' } }
});

await sdk.exchange.placeOrder({
  coin: "BTC-PERP",
  is_buy: true,
  sz: 1,  // Numeric values also work
  limit_px: 50000,
  reduce_only: false,
  order_type: { limit: { tif: 'Gtc' } }
});
```

If you're using the low-level `signL1Action` function directly, the SDK will also automatically normalize the action object to remove trailing zeros.

### Spot Info Methods

```typescript
//Get spot metadata
sdk.info.spot.getSpotMeta().then(spotMeta => {
  console.log(spotMeta);
}).catch(error => {
  console.error('Error getting spot metadata:', error);
});

// Get spot clearinghouse state
sdk.info.spot.getSpotClearinghouseState('user_address_here').then(spotClearinghouseState => {
  console.log(spotClearinghouseState);
}).catch(error => {
  console.error('Error getting spot clearinghouse state:', error);
});
```
All methods supported can be found here: [Hyperliquid Spot Info Endpoint API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/spot)

### Perpetuals Info Methods

```typescript
// Get perpetuals metadata
sdk.info.perpetuals.getMeta().then(perpsMeta => {
  console.log(perpsMeta);
}).catch(error => {
  console.error('Error getting perpetuals metadata:', error);
});

// Get user's perpetuals account summary
sdk.info.perpetuals.getClearinghouseState('user_address_here').then(clearinghouseState => {
  console.log(clearinghouseState);
}).catch(error => {
  console.error('Error getting clearinghouse state:', error);
});
```
All methods supported can be found here: [Hyperliquid Perpetuals Info Endpoint API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals)

### Custom Methods

```typescript
// Cancel all orders
sdk.custom.cancelAllOrders().then(cancelAllResult => {
  console.log(cancelAllResult);
}).catch(error => {
  console.error('Error cancelling all orders:', error);
});

// Cancel all orders for a specific symbol
sdk.custom.cancelAllOrders('BTC-PERP').then(cancelAllBTCResult => {
  console.log(cancelAllBTCResult);
}).catch(error => {
  console.error('Error cancelling all BTC-PERP orders:', error);
});

// Get all tradable assets
const allAssets = sdk.custom.getAllAssets();
console.log(allAssets);
```
All Custom methods are listed above. These are custom methods that are not part of the official Hyperliquid API. As more are added we will add examples for them here.

## WebSocket Subscription Limits

The Hyperliquid API imposes a limit of 1000 WebSocket subscriptions per IP address. The SDK automatically tracks and manages these subscriptions to prevent exceeding this limit. If you attempt to create more than 1000 subscriptions, the SDK will throw an error.

To manage your subscriptions effectively:
- Unsubscribe from feeds you no longer need
- Reuse existing subscriptions where possible
- Monitor your subscription count with `sdk.ws.getSubscriptionCount()`

## Initialization

In most cases the SDK will automatically initialize itself when required. However, in some cases you may need to explicitly initialize the SDK. You can use this method to initialize the SDK:

```typescript
await sdk.connect();
```

p.s. You only need to worry about this if the SDK throws you an error telling you that it needs to be initialized.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nomeida/hyperliquid&type=Date)](https://star-history.com/#nomeida/hyperliquid&Date)

## Documentation

For more detailed documentation on all available methods and their parameters, please refer to the [official Hyperliquid API documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/).

## Disclaimer
If you don't have an existing referral and use this SDK then your referral will be set by the SDK. This gives you a 4% discount on fees and gives me a percentage of the fees you pay so that I can keep working on and maintaining the SDK. You get a 4% fee discount & an easy-to-use SDK and in return I get some compensation for maintaining it, win-win

*p.s. All referral commissions from this SDK will go towards buying HYPE and other HL-related coins, so it will function as an extension of the assistance fund essentially*

## Reporting Issues

If you encounter any issues with the SDK, please use the bug report template when creating a new issue on GitHub. This helps us gather all the necessary information to diagnose and fix the problem efficiently.

To report a bug:
1. Go to the [Issues tab](https://github.com/nomeida/hyperliquid/issues)
2. Click "New Issue"
3. Select the "Bug Report" template
4. Fill in all the requested information, including:
   - Description of the issue
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Any relevant logs or screenshots

Using the bug report template ensures we have all the necessary information to address your issue quickly and effectively.

## License

MIT
