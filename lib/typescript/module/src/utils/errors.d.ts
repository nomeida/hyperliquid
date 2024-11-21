export declare class HyperliquidAPIError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare function handleApiError(error: any): never;
//# sourceMappingURL=errors.d.ts.map