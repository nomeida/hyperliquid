/**
 * WebSocket Payload Manager
 *
 * This module provides a high-level interface for generating and sending
 * exchange method payloads via WebSocket POST requests. It integrates with
 * the dynamic payload generator and WebSocket subscriptions.
 */

import { ethers } from 'ethers';
import { PayloadGenerator, PayloadGenerationContext } from './payload-generator';
import { WebSocketSubscriptions } from './subscriptions';
import { CustomOperations } from '../rest/custom';
import { SymbolConversion } from '../utils/symbolConversion';

export interface PayloadManagerConfig {
  wallet: ethers.Wallet;
  isMainnet: boolean;
  symbolConversion: SymbolConversion;
  subscriptions: WebSocketSubscriptions;
  vaultAddress?: string | null;
  generateNonce: () => number;
  customOperations: CustomOperations;
}

/**
 * WebSocket Payload Manager
 * Provides a unified interface for all exchange operations via WebSocket POST
 */
export class WebSocketPayloadManager {
  private payloadGenerator: PayloadGenerator;
  private subscriptions: WebSocketSubscriptions;
  private symbolConversion: SymbolConversion;
  private vaultAddress: string | null;
  private customOperations: CustomOperations;

  constructor(config: PayloadManagerConfig) {
    this.subscriptions = config.subscriptions;
    this.symbolConversion = config.symbolConversion;
    this.vaultAddress = config.vaultAddress || null;
    this.customOperations = config.customOperations;

    // Create payload generation context
    const context: PayloadGenerationContext = {
      isMainnet: config.isMainnet,
      generateNonce: config.generateNonce,
      getAssetIndex: this.getAssetIndex.bind(this),
      getVaultAddress: () => this.vaultAddress,
      wallet: config.wallet,
    };

    this.payloadGenerator = new PayloadGenerator(context);
  }

  /**
   * Get asset index for a coin symbol
   */
  private async getAssetIndex(coin: string): Promise<number> {
    const index = await this.symbolConversion.getAssetIndex(coin);
    if (index === undefined) {
      throw new Error(`Asset index not found for coin: ${coin}`);
    }
    return index;
  }

  /**
   * Execute any exchange method via WebSocket POST
   * @param methodName The exchange method name
   * @param params The method parameters
   * @param timeout Optional timeout in milliseconds
   * @returns The response from the WebSocket POST request
   */
  async executeMethod(methodName: string, params: any, timeout: number = 30000): Promise<any> {
    try {
      // Generate the signed payload
      const payload = await this.payloadGenerator.generatePayload(methodName, params);

      // Send via WebSocket POST
      const response = await this.subscriptions.postRequest('action', payload, timeout);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute ${methodName}: ${errorMessage}`);
    }
  }

  // ==================== ORDER MANAGEMENT ====================

  /**
   * Place an order via WebSocket POST
   */
  async placeOrder(orderParams: {
    coin: string;
    is_buy: boolean;
    sz: string | number;
    limit_px: string | number;
    order_type: any;
    reduce_only: boolean;
    cloid?: string;
  }): Promise<any> {
    const orders = [orderParams];
    return this.executeMethod('placeOrder', { orders });
  }

  /**
   * Place multiple orders via WebSocket POST
   */
  async placeOrders(orders: any[], grouping: string = 'na'): Promise<any> {
    return this.executeMethod('placeOrder', { orders, grouping });
  }

  /**
   * Cancel an order via WebSocket POST
   */
  async cancelOrder(cancelParams: { coin: string; o: number | string }): Promise<any> {
    return this.executeMethod('cancelOrder', { cancels: [cancelParams] });
  }

  /**
   * Cancel multiple orders via WebSocket POST
   */
  async cancelOrders(cancels: any[]): Promise<any> {
    return this.executeMethod('cancelOrder', { cancels });
  }

  /**
   * Cancel all orders via WebSocket POST
   * This is a custom composite operation that uses native methods
   */
  async cancelAllOrders(): Promise<any> {
    // Use the custom operations to get the cancel all orders implementation
    // This will internally use native methods like getting open orders and canceling them
    return this.customOperations.cancelAllOrders();
  }

  /**
   * Modify an order via WebSocket POST
   */
  async modifyOrder(modifyParams: { oid: number | string; order: any }): Promise<any> {
    return this.executeMethod('modifyOrder', modifyParams);
  }

  // ==================== TRANSFER OPERATIONS ====================

  /**
   * Transfer between spot and perp wallets via WebSocket POST
   */
  async transferBetweenSpotAndPerp(amount: number, toPerp: boolean): Promise<any> {
    return this.executeMethod('transferBetweenSpotAndPerp', { amount, toPerp });
  }

  /**
   * Transfer USDC to another address via WebSocket POST
   */
  async usdTransfer(destination: string, amount: number): Promise<any> {
    return this.executeMethod('usdTransfer', { destination, amount });
  }

  /**
   * Transfer spot tokens to another address via WebSocket POST
   */
  async spotTransfer(destination: string, token: string, amount: string): Promise<any> {
    return this.executeMethod('spotTransfer', { destination, token, amount });
  }

  // ==================== VAULT OPERATIONS ====================

  /**
   * Transfer to/from vault via WebSocket POST
   */
  async vaultTransfer(vaultAddress: string, isDeposit: boolean, usd: number): Promise<any> {
    return this.executeMethod('vaultTransfer', { vaultAddress, isDeposit, usd });
  }

  // ==================== AGENT OPERATIONS ====================

  /**
   * Approve an agent via WebSocket POST
   */
  async approveAgent(agentAddress: string, agentName: string): Promise<any> {
    return this.executeMethod('approveAgent', { agentAddress, agentName });
  }

  /**
   * Approve builder fee via WebSocket POST
   */
  async approveBuilderFee(builder: string, maxFeeRate: string): Promise<any> {
    return this.executeMethod('approveBuilderFee', { builder, maxFeeRate });
  }

  // ==================== WITHDRAWAL ====================

  /**
   * Initiate withdrawal via WebSocket POST
   */
  async initiateWithdrawal(destination: string, amount: number): Promise<any> {
    return this.executeMethod('initiateWithdrawal', { destination, amount });
  }

  // ==================== TWAP ORDERS ====================

  /**
   * Place TWAP order via WebSocket POST
   */
  async placeTwapOrder(twapParams: {
    coin: string;
    is_buy: boolean;
    sz: number;
    reduce_only: boolean;
    minutes: number;
    randomize: boolean;
  }): Promise<any> {
    return this.executeMethod('placeTwapOrder', twapParams);
  }

  // ==================== SCHEDULE OPERATIONS ====================

  /**
   * Schedule cancel via WebSocket POST
   */
  async scheduleCancel(time: number | null): Promise<any> {
    return this.executeMethod('scheduleCancel', { time });
  }

  // ==================== STAKING OPERATIONS ====================

  /**
   * Deposit into staking via WebSocket POST
   */
  async cDeposit(wei: bigint): Promise<any> {
    return this.executeMethod('cDeposit', { wei });
  }

  /**
   * Withdraw from staking via WebSocket POST
   */
  async cWithdraw(wei: bigint): Promise<any> {
    return this.executeMethod('cWithdraw', { wei });
  }

  // ==================== CUSTOM MARKET OPERATIONS ====================

  /**
   * Market buy/sell via WebSocket POST
   * This is a custom composite operation that uses native methods
   */
  async marketOpen(
    symbol: string,
    isBuy: boolean,
    size: number,
    px?: number,
    slippage: number = 0.05,
    cloid?: string
  ): Promise<any> {
    return this.customOperations.marketOpen(symbol, isBuy, size, px, slippage, cloid);
  }

  /**
   * Market close position via WebSocket POST
   * This is a custom composite operation that uses native methods
   */
  async marketClose(
    symbol: string,
    size?: number,
    px?: number,
    slippage: number = 0.05,
    cloid?: string
  ): Promise<any> {
    return this.customOperations.marketClose(symbol, size, px, slippage, cloid);
  }

  /**
   * Close all positions via WebSocket POST
   * This is a custom composite operation that uses native methods
   */
  async closeAllPositions(slippage: number = 0.05): Promise<any> {
    return this.customOperations.closeAllPositions(slippage);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get all available exchange methods
   */
  getAvailableMethods(): string[] {
    return this.payloadGenerator.getAvailableMethods();
  }

  /**
   * Check if a method is supported
   */
  isMethodSupported(methodName: string): boolean {
    return this.payloadGenerator.isMethodSupported(methodName);
  }

  /**
   * Execute a custom method with raw parameters
   * Useful for methods not yet wrapped in convenience functions
   */
  async executeCustomMethod(methodName: string, params: any, timeout?: number): Promise<any> {
    return this.executeMethod(methodName, params, timeout);
  }

  /**
   * Generate payload without executing (for testing/debugging)
   */
  async generatePayload(methodName: string, params: any): Promise<any> {
    return this.payloadGenerator.generatePayload(methodName, params);
  }

  /**
   * Update vault address
   */
  setVaultAddress(vaultAddress: string | null): void {
    this.vaultAddress = vaultAddress;
  }

  /**
   * Get current vault address
   */
  getVaultAddress(): string | null {
    return this.vaultAddress;
  }
}

/**
 * Factory function to create a WebSocket Payload Manager
 */
export function createWebSocketPayloadManager(
  config: PayloadManagerConfig
): WebSocketPayloadManager {
  return new WebSocketPayloadManager(config);
}
