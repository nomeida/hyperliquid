# Hyperliquid API SDK

This is an unofficial SDK for the Hyperliquid API.

## Installation

```bash
npm install hyperliquid
```

## Usage

```typescript
import { Hyperliquid } from 'hyperliquid';

const sdk = new Hyperliquid('private_key_here');

// Use the SDK methods
const allMids = await sdk.info.getAllMids();
console.log(allMids);
```

## Documentation

need to work on the documentation

## License

MIT