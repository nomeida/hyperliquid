# Hyperliquid API SDK

Typescript SDK to more easily interact with Hyperliquid's API

All info on the Hyperliquid API can be found here: [HyperLiquid API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs)

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
  vaultAddress: <vaultAddress - string (OPTIONAL)>
});

// Use the SDK methods
sdk.info.getAllMids().then(allMids => {
  console.log(allMids);
});
```
**Note:** You don't have to provide your private key, but it is required if you want to
use the exchange API to place, cancel or modify orders or access your accounts assets.
WebSocket functionality is enabled by default but can be disabled by setting `enableWs: false` in the constructor options.



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

```typescript
const { Hyperliquid } = require('hyperliquid');

async function testWebSocket() {
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

testWebSocket();
```


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


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nomeida/hyperliquid&type=Date)](https://star-history.com/#nomeida/hyperliquid&Date)



## Documentation

For more detailed documentation on all available methods and their parameters, please refer to the [official Hyperliquid API documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/).

## Initialization

In most cases the SDK will automatically initialize itself when required. However, in some cases you may need to explicitly initialize the SDK. You can use this method to initialize the SDK: 

```typescript
await sdk.connect();
```

p.s. You only need to worry about this if the SDK throws you an error telling you that it needs to be initialized.

## Disclaimer
If you don't have an existing referral and use this SDK then your referral will be set by the SDK. This gives you a 4% discount on fees and gives me a percentage of the fees you pay so that I can keep working on and maintaining the SDK. You get a 4% fee discount & an easy-to-use SDK and in return I get some compensation for maintaining it, win-win

*p.s. All referral commissions from this SDK will go towards buying HYPE and other HL-related coins, so it will function as an extension of the assistance fund essentially*


## License

MIT
