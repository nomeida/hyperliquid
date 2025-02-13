# Browser Usage Guide

The Hyperliquid SDK supports browser environments and can be used in several ways:

## Direct Script Include

```html
<script src="https://unpkg.com/hyperliquid/dist/browser.global.js"></script>
<script>
    const sdk = new HyperliquidSDK.Hyperliquid({
        testnet: true,
        enableWs: true
    });
</script>
```

## ES Module Import

```javascript
import { Hyperliquid } from 'hyperliquid';

const sdk = new Hyperliquid({
    testnet: true,
    enableWs: true
});
```

Note: See /examples/browser-test.html for a complete example of how to use the SDK in a browser with all methods supported. P.s. Try running it in a local server to just test the SDK/API in general

## Features and Limitations

### Supported Features
- REST API calls
- WebSocket real-time updates
- Wallet integration via ethers.js
- Asset conversion and management
- Real-time market data subscriptions

### Browser-Specific Considerations

1. **WebSocket Support**
   - WebSocket functionality is automatically enabled in supported browsers
   - Falls back gracefully if WebSocket is not supported

2. **Private Key Handling**
   - Never store private keys in browser storage
   - Consider using Web3 wallet providers for key management
   - Use environment variables for server-side private keys

3. **CORS**
   - All API endpoints support CORS
   - No additional configuration needed for browser usage

4. **Performance**
   - Rate limiting is handled automatically
   - WebSocket connections are managed with automatic reconnection
   - Memory usage is optimized for browser environments

## Example Usage

```javascript
async function init() {
    const sdk = new Hyperliquid({
        testnet: true,
        enableWs: true
    });

    // Connect to the API
    await sdk.connect();

    // Get market data
    const assets = await sdk.info.getAllAssets();
    console.log('Available assets:', assets);

    // Subscribe to real-time updates
    sdk.subscriptions.subscribeToAllMids((data) => {
        console.log('Price update:', data);
    });

    // Clean up when done
    // sdk.disconnect();
}
```

## Error Handling

```javascript
try {
    await sdk.connect();
} catch (error) {
    if (error.message.includes('WebSocket')) {
        console.error('WebSocket connection failed:', error);
    } else if (error.message.includes('network')) {
        console.error('Network error:', error);
    } else {
        console.error('Unknown error:', error);
    }
}
```

## Best Practices

1. Always call `connect()` before using the SDK
2. Handle WebSocket reconnection events
3. Implement proper error handling
4. Clean up resources using `disconnect()` when done
5. Don't store sensitive data in browser storage
6. Use appropriate security measures for private keys 