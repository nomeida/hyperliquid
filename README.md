# Hyperliquid API SDK

This SDK is meant to make it easier to interact with the Hyperliquid API.

All info on the Hyperliquid API can be found here: [HyperLiquid API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs)

## Installation

```bash
npm install hyperliquid
```

## Usage

```typescript
import { HyperliquidSDK } from 'hyperliquid';

const sdk = new HyperliquidSDK('private_key_here');

// Use the SDK methods
const allMids = await sdk.info.getAllMids();
console.log(allMids);
```
*Note:* You don't have to provide your private key, but it is required if you want to 
use the exchange API to place, cancel or modify orders or access your accounts assets.

## Symbol Naming Convention

Instead of using native symbols (which can be confusing, like @1, @4, @5 for spot and only the coin name for perps), we've implemented a more intuitive naming system:

- For perpetuals: `<coin>-PERP` (e.g., BTC-PERP, ETH-PERP)
- For spot: `<coin>-SPOT` (e.g., PURR-SPOT, BTC-SPOT)

This convention makes it easier to distinguish between spot and perpetual markets.

## Examples

### General Info Methods

```typescript
// Get all mids
const allMids = await sdk.info.getAllMids();
console.log(allMids);

// Get user open orders
const userOpenOrders = await sdk.info.getUserOpenOrders('user_address_here');
console.log(userOpenOrders);

// Get L2 order book
const l2Book = await sdk.info.getL2Book('BTC-PERP');
console.log(l2Book);
```

### Spot Info Methods

```typescript
// Get spot metadata
const spotMeta = await sdk.info.spot.getSpotMeta();
console.log(spotMeta);

// Get spot clearinghouse state
const spotClearinghouseState = await sdk.info.spot.getSpotClearinghouseState('user_address_here');
console.log(spotClearinghouseState);
```

### Perpetuals Info Methods

```typescript
// Get perpetuals metadata
const perpsMeta = await sdk.info.perpetuals.getMeta();
console.log(perpsMeta);

// Get user's perpetuals account summary
const clearinghouseState = await sdk.info.perpetuals.getClearinghouseState('user_address_here');
console.log(clearinghouseState);
```

### Custom Methods

```typescript
// Cancel all orders
const cancelAllResult = await sdk.custom.cancelAllOrders();
console.log(cancelAllResult);

// Cancel all orders for a specific symbol
const cancelAllBTCResult = await sdk.custom.cancelAllOrders('BTC-PERP');
console.log(cancelAllBTCResult);

// Get all tradable assets
const allAssets = sdk.custom.getAllAssets();
console.log(allAssets);
```

### Exchange API Methods

```typescript
// Place an order
const placeOrderResult = await sdk.exchange.placeOrder({
  coin: 'BTC-PERP',
  is_buy: true,
  sz: 1,
  limit_px: 30000,
  order_type: { limit: { tif: 'Gtc' } },
  reduce_only: false
});
console.log(placeOrderResult);

// Cancel an order
const cancelOrderResult = await sdk.exchange.cancelOrder({
  coin: 'BTC-PERP',
  o: 123456 // order ID
});
console.log(cancelOrderResult);

// Transfer between perpetual and spot accounts
const transferResult = await sdk.exchange.transferBetweenSpotAndPerp(100, true); // Transfer 100 USDC from spot to perp
console.log(transferResult);
```

## Documentation

For more detailed documentation on all available methods and their parameters, please refer to the [official Hyperliquid API documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/).

## License

MIT