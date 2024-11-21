import { RateLimiter } from './rateLimiter';
export declare class HttpApi {
    private client;
    private endpoint;
    private rateLimiter;
    constructor(baseUrl: string, endpoint: string | undefined, rateLimiter: RateLimiter);
    makeRequest(payload: any, weight?: number, endpoint?: string): Promise<any>;
}
//# sourceMappingURL=helpers.d.ts.map