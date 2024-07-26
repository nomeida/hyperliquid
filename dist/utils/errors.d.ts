export declare class HyperliquidAPIError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare function handleApiError(error: any): never;
