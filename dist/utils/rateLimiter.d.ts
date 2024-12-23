export declare class RateLimiter {
    private tokens;
    private lastRefill;
    private readonly capacity;
    constructor();
    private refillTokens;
    waitForToken(weight?: number): Promise<void>;
}
