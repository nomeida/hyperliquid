export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor() {
    this.capacity = 100; // 100 tokens maximum as per API docs
    this.refillRate = 10; // 10 tokens per second as per API docs
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  private refillTokens() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000; // convert to seconds

    // Calculate new tokens based on elapsed time and refill rate
    const newTokens = elapsedSeconds * this.refillRate;

    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  async waitForToken(weight: number = 1): Promise<void> {
    this.refillTokens();

    if (this.tokens >= weight) {
      this.tokens -= weight;
      return;
    }

    // Calculate wait time needed for enough tokens to be available
    const tokensNeeded = weight - this.tokens;
    const waitTimeMs = (tokensNeeded / this.refillRate) * 1000;

    return new Promise(resolve => setTimeout(resolve, waitTimeMs)).then(() => {
      this.refillTokens();
      return this.waitForToken(weight); // recursively check again after waiting
    });
  }
}
