"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = exports.HyperliquidAPIError = void 0;
exports.handleApiError = handleApiError;
class HyperliquidAPIError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'HyperliquidAPIError';
    }
}
exports.HyperliquidAPIError = HyperliquidAPIError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
function handleApiError(error) {
    if (error.response) {
        //The request was made and the server responded with a status code
        //that falls out of the range of 2xx
        throw new HyperliquidAPIError(error.response.data.code || error.response.status || 'UNKNOWN_ERROR', error.response.data.message || error.response.data || 'An unknown error occurred');
    }
    else if (error.request) {
        //The request was made but no response was received
        throw new HyperliquidAPIError('NETWORK_ERROR', 'No response received from the server');
    }
    else {
        //Something happened in setting up the request that triggered an Error
        throw new HyperliquidAPIError('REQUEST_SETUP_ERROR', error.message);
    }
}
//# sourceMappingURL=errors.js.map