"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor() {
        this.capacity = 1200; // 1200 tokens per minute
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
    }
    refillTokens() {
        const now = Date.now();
        const elapsedMinutes = (now - this.lastRefill) / (1000 * 60); // convert to minutes
        if (elapsedMinutes >= 1) {
            this.tokens = this.capacity;
            this.lastRefill = now;
        }
    }
    async waitForToken(weight = 1) {
        this.refillTokens();
        if (this.tokens >= weight) {
            this.tokens -= weight;
            return;
        }
        const waitTime = (60 - (Date.now() - this.lastRefill) / 1000) * 1000; // wait until next refill
        return new Promise(resolve => setTimeout(resolve, waitTime)).then(() => {
            this.refillTokens();
            return this.waitForToken(weight); // recursively check again after refill
        });
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map