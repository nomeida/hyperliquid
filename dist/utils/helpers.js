"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpApi = void 0;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("./errors");
class HttpApi {
    constructor(baseUrl, endpoint = "/", rateLimiter) {
        this.endpoint = endpoint;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.rateLimiter = rateLimiter;
    }
    async makeRequest(payload, weight = 2, endpoint = this.endpoint) {
        try {
            await this.rateLimiter.waitForToken(weight);
            const response = await this.client.post(endpoint, payload);
            return response.data;
        }
        catch (error) {
            (0, errors_1.handleApiError)(error);
        }
    }
}
exports.HttpApi = HttpApi;
//# sourceMappingURL=helpers.js.map