export class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly capacity: number;

    constructor() {
        this.capacity = 1200; // 1200 tokens per minute
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
    }

    private refillTokens() {
        const now = Date.now();
        const elapsedMinutes = (now - this.lastRefill) / (1000 * 60); // convert to minutes
        if (elapsedMinutes >= 1) {
            this.tokens = this.capacity;
            this.lastRefill = now;
        }
    }

    async waitForToken(weight: number = 1): Promise<void> {
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