import axios, { AxiosInstance } from 'axios';
import { handleApiError } from './errors';
import { RateLimiter } from './rateLimiter';

export class HttpApi {
  private client: AxiosInstance;
  private endpoint: string;
  private rateLimiter: RateLimiter;

  constructor(baseUrl: string, endpoint: string = '/', rateLimiter: RateLimiter) {
    this.endpoint = endpoint;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.rateLimiter = rateLimiter;
  }

  async makeRequest<T>(
    payload: any,
    weight: number = 2,
    endpoint: string = this.endpoint
  ): Promise<T> {
    try {
      await this.rateLimiter.waitForToken(weight);

      const response = await this.client.post(endpoint, payload);

      // Check if response data is null or undefined before returning
      if (response.data === null || response.data === undefined) {
        throw new Error('Received null or undefined response data');
      }

      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
}
