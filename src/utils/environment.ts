export const environment = {
  isBrowser: typeof window !== 'undefined' && typeof window.document !== 'undefined',
  isNode:
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null,
  isWebWorker:
    typeof self === 'object' &&
    self.constructor &&
    self.constructor.name === 'DedicatedWorkerGlobalScope',
  isServiceWorker:
    typeof self === 'object' &&
    self.constructor &&
    self.constructor.name === 'ServiceWorkerGlobalScope',

  // Helper methods
  hasNativeWebSocket(): boolean {
    if (this.isBrowser || this.isWebWorker) {
      return 'WebSocket' in (this.isBrowser ? window : self);
    }

    if (this.isNode) {
      // Node.js v23+ has native WebSocket support
      const nodeVersion = process.versions.node;
      const major = parseInt(nodeVersion.split('.')[0], 10);
      return major >= 23;
    }

    return false;
  },

  supportsWebSocket(): boolean {
    // First check for native support
    if (this.hasNativeWebSocket()) {
      return true;
    }

    // For Node.js without native support, try to load ws package
    if (this.isNode) {
      try {
        // Dynamic require to avoid bundling ws package in browser builds
        const WebSocket = (globalThis as any).require?.('ws');
        return typeof WebSocket === 'function';
      } catch {
        return false;
      }
    }

    return false;
  },

  supportsLocalStorage(): boolean {
    try {
      return this.isBrowser && 'localStorage' in window && window.localStorage !== null;
    } catch {
      return false;
    }
  },

  supportsCrypto(): boolean {
    return (
      (this.isBrowser && 'crypto' in window) ||
      (this.isWebWorker && 'crypto' in self) ||
      (this.isNode && 'crypto' in globalThis)
    );
  },

  // Helper to get the appropriate global object
  getGlobalObject(): any {
    if (this.isBrowser) return window;
    if (this.isWebWorker || this.isServiceWorker) return self;
    if (this.isNode) return global;
    return globalThis;
  },
};
