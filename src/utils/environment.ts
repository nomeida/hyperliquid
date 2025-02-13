export const environment = {
    isBrowser: typeof window !== 'undefined' && typeof window.document !== 'undefined',
    isNode: typeof process !== 'undefined' && process.versions != null && process.versions.node != null,
    isWebWorker: typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope',
    isServiceWorker: typeof self === 'object' && self.constructor && self.constructor.name === 'ServiceWorkerGlobalScope',
    
    // Helper methods
    supportsWebSocket(): boolean {
        return (
            (this.isBrowser && 'WebSocket' in window) ||
            (this.isWebWorker && 'WebSocket' in self) ||
            (this.isNode && typeof global !== 'undefined' && 'WebSocket' in global)
        );
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
    }
}; 