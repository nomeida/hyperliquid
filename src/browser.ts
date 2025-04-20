// Browser-specific entry point
import { Hyperliquid } from './index';
import { environment } from './utils/environment';

// Ensure we're in a browser environment
if (!environment.isBrowser) {
  console.warn('This entry point is intended for browser use only.');
}

// Re-export main class and types
export { Hyperliquid };
export * from './types';

// Add browser-specific utilities
export const utils = {
  isBrowserSupported(): boolean {
    return environment.supportsWebSocket() && environment.supportsCrypto();
  },

  isSecureContext(): boolean {
    return window.isSecureContext;
  },

  checkCompatibility(): {
    supported: boolean;
    features: {
      webSocket: boolean;
      crypto: boolean;
      secureContext: boolean;
    };
  } {
    const features = {
      webSocket: environment.supportsWebSocket(),
      crypto: environment.supportsCrypto(),
      secureContext: window.isSecureContext,
    };

    return {
      supported: features.webSocket && features.crypto,
      features,
    };
  },
};
