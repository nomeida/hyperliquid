/**
 * Dynamic payload generator for WebSocket POST requests
 *
 * This module provides a unified way to generate signed payloads for all exchange methods
 * without hardcoding each method in the exchange.ts file. It dynamically creates payloads
 * based on method configurations and handles signing automatically.
 */

import { ethers } from 'ethers';
import { ExchangeType, CHAIN_IDS } from '../types/constants';
import {
  signL1Action,
  signUserSignedAction,
  signAgent,
  signUsdTransferAction,
  orderToWire,
  removeTrailingZeros,
} from '../utils/signing';

export interface PayloadMethodConfig {
  /** Exchange method type */
  type: ExchangeType;
  /** Signing method to use */
  signingMethod: 'l1Action' | 'userSignedAction' | 'agent' | 'usdTransfer';
  /** For userSignedAction: the types array for EIP-712 signing */
  signatureTypes?: Array<{ name: string; type: string }>;
  /** For userSignedAction: the primary type name */
  primaryType?: string;
  /** Whether this method requires asset index conversion */
  requiresAssetIndex?: boolean;
  /** Whether this method requires vault address */
  requiresVaultAddress?: boolean;
  /** Custom payload transformer function */
  payloadTransformer?: (params: any, context: PayloadGenerationContext) => any | Promise<any>;
  /** Whether to include hyperliquidChain and signatureChainId */
  includeChainInfo?: boolean;
}

export interface PayloadGenerationContext {
  isMainnet: boolean;
  generateNonce: () => number;
  getAssetIndex: (coin: string) => Promise<number>;
  getVaultAddress: () => string | null;
  wallet: ethers.Wallet;
}

/**
 * Configuration for all exchange methods
 */
export const EXCHANGE_METHOD_CONFIGS: Record<string, PayloadMethodConfig> = {
  // Order management
  placeOrder: {
    type: ExchangeType.ORDER,
    signingMethod: 'l1Action',
    requiresAssetIndex: true,
    requiresVaultAddress: true,
    payloadTransformer: async (params, context) => {
      const { orders, grouping = 'na' } = params;
      const wireOrders = await Promise.all(
        orders.map(async (order: any) => {
          const normalizedOrder = { ...order };
          if (typeof normalizedOrder.limit_px === 'string') {
            normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
          }
          if (typeof normalizedOrder.sz === 'string') {
            normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
          }
          const assetIndex = await context.getAssetIndex(normalizedOrder.coin);
          return orderToWire(normalizedOrder, assetIndex);
        })
      );
      return {
        type: ExchangeType.ORDER,
        orders: wireOrders,
        grouping,
      };
    },
  },

  cancelOrder: {
    type: ExchangeType.CANCEL,
    signingMethod: 'l1Action',
    requiresAssetIndex: true,
    requiresVaultAddress: true,
    payloadTransformer: async (params, context) => {
      const cancels = Array.isArray(params.cancels) ? params.cancels : [params];
      const cancelsWithIndices = await Promise.all(
        cancels.map(async (cancel: any) => {
          if (cancel.coin) {
            const assetIndex = await context.getAssetIndex(cancel.coin);
            return { a: assetIndex, o: cancel.o };
          }
          return cancel;
        })
      );
      return {
        type: ExchangeType.CANCEL,
        cancels: cancelsWithIndices,
      };
    },
  },

  modifyOrder: {
    type: ExchangeType.MODIFY,
    signingMethod: 'l1Action',
    requiresAssetIndex: true,
    requiresVaultAddress: true,
    payloadTransformer: async (params, context) => {
      const { oid, order } = params;
      const normalizedOrder = { ...order };
      if (typeof normalizedOrder.limit_px === 'string') {
        normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
      }
      if (typeof normalizedOrder.sz === 'string') {
        normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
      }
      const assetIndex = await context.getAssetIndex(normalizedOrder.coin);
      return {
        type: ExchangeType.MODIFY,
        oid,
        order: orderToWire(normalizedOrder, assetIndex),
      };
    },
  },

  // Transfer methods
  transferBetweenSpotAndPerp: {
    type: ExchangeType.USD_CLASS_TRANSFER,
    signingMethod: 'userSignedAction',
    includeChainInfo: true,
    signatureTypes: [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'toPerp', type: 'bool' },
      { name: 'nonce', type: 'uint64' },
    ],
    primaryType: 'HyperliquidTransaction:UsdClassTransfer',
    payloadTransformer: (params, context) => ({
      type: ExchangeType.USD_CLASS_TRANSFER,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      amount: params.amount.toString(),
      toPerp: params.toPerp,
      nonce: context.generateNonce(),
    }),
  },

  usdTransfer: {
    type: ExchangeType.USD_SEND,
    signingMethod: 'usdTransfer',
    includeChainInfo: true,
    payloadTransformer: (params, context) => ({
      type: ExchangeType.USD_SEND,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      destination: params.destination,
      amount: params.amount.toString(),
      time: Date.now(),
    }),
  },

  spotTransfer: {
    type: ExchangeType.SPOT_SEND,
    signingMethod: 'usdTransfer',
    includeChainInfo: true,
    payloadTransformer: (params, context) => ({
      type: ExchangeType.SPOT_SEND,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      destination: params.destination,
      token: params.token,
      amount: params.amount,
      time: Date.now(),
    }),
  },

  // Vault operations
  vaultTransfer: {
    type: ExchangeType.VAULT_TRANSFER,
    signingMethod: 'l1Action',
    payloadTransformer: params => ({
      type: ExchangeType.VAULT_TRANSFER,
      vaultAddress: params.vaultAddress,
      isDeposit: params.isDeposit,
      usd: params.usd,
    }),
  },

  // Agent operations
  approveAgent: {
    type: ExchangeType.APPROVE_AGENT,
    signingMethod: 'agent',
    includeChainInfo: true,
    payloadTransformer: (params, context) => ({
      type: ExchangeType.APPROVE_AGENT,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      agentAddress: params.agentAddress,
      agentName: params.agentName,
      nonce: context.generateNonce(),
    }),
  },

  approveBuilderFee: {
    type: ExchangeType.APPROVE_BUILDER_FEE,
    signingMethod: 'userSignedAction',
    includeChainInfo: true,
    signatureTypes: [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'maxFeeRate', type: 'string' },
      { name: 'builder', type: 'address' },
      { name: 'nonce', type: 'uint64' },
    ],
    primaryType: 'HyperliquidTransaction:ApproveBuilderFee',
    payloadTransformer: (params, context) => ({
      type: ExchangeType.APPROVE_BUILDER_FEE,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      maxFeeRate: params.maxFeeRate.endsWith('%') ? params.maxFeeRate : `${params.maxFeeRate}%`,
      builder: params.builder.toLowerCase(),
      nonce: Date.now(),
    }),
  },

  // Withdrawal
  initiateWithdrawal: {
    type: ExchangeType.WITHDRAW,
    signingMethod: 'usdTransfer',
    includeChainInfo: true,
    payloadTransformer: (params, context) => ({
      type: ExchangeType.WITHDRAW,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      amount: params.amount.toString(),
      time: Date.now(),
      destination: params.destination,
    }),
  },

  // TWAP orders
  placeTwapOrder: {
    type: ExchangeType.TWAP_ORDER,
    signingMethod: 'l1Action',
    requiresAssetIndex: true,
    requiresVaultAddress: true,
    payloadTransformer: async (params, context) => {
      const assetIndex = await context.getAssetIndex(params.coin);
      return {
        type: ExchangeType.TWAP_ORDER,
        twap: {
          a: assetIndex,
          b: params.is_buy,
          s: params.sz.toString(),
          r: params.reduce_only,
          m: params.minutes,
          t: params.randomize,
        },
      };
    },
  },

  // Schedule cancel
  scheduleCancel: {
    type: ExchangeType.SCHEDULE_CANCEL,
    signingMethod: 'l1Action',
    payloadTransformer: params => ({
      type: ExchangeType.SCHEDULE_CANCEL,
      time: params.time,
    }),
  },

  // Staking operations
  cDeposit: {
    type: ExchangeType.C_DEPOSIT,
    signingMethod: 'userSignedAction',
    includeChainInfo: true,
    signatureTypes: [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'wei', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
    primaryType: 'HyperliquidTransaction:CDeposit',
    payloadTransformer: (params, context) => ({
      type: ExchangeType.C_DEPOSIT,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      wei: params.wei.toString(),
      nonce: context.generateNonce(),
    }),
  },

  cWithdraw: {
    type: ExchangeType.C_WITHDRAW,
    signingMethod: 'userSignedAction',
    includeChainInfo: true,
    signatureTypes: [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'wei', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
    primaryType: 'HyperliquidTransaction:CWithdraw',
    payloadTransformer: (params, context) => ({
      type: ExchangeType.C_WITHDRAW,
      hyperliquidChain: context.isMainnet ? 'Mainnet' : 'Testnet',
      signatureChainId: context.isMainnet ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
      wei: params.wei.toString(),
      nonce: context.generateNonce(),
    }),
  },
};

/**
 * Dynamic payload generator class
 */
export class PayloadGenerator {
  constructor(private context: PayloadGenerationContext) {}

  /**
   * Generate a signed payload for any exchange method
   * @param methodName The name of the exchange method
   * @param params The parameters for the method
   * @returns A signed payload ready for WebSocket POST
   */
  async generatePayload(methodName: string, params: any): Promise<any> {
    const config = EXCHANGE_METHOD_CONFIGS[methodName];
    if (!config) {
      throw new Error(`Unknown exchange method: ${methodName}`);
    }

    try {
      // Transform the parameters into the action object
      let action: any;
      if (config.payloadTransformer) {
        action = await config.payloadTransformer(params, this.context);
      } else {
        action = { type: config.type, ...params };
      }

      // Generate nonce
      const nonce = this.context.generateNonce();

      // Get vault address if required
      const vaultAddress = config.requiresVaultAddress ? this.context.getVaultAddress() : null;

      // Sign the action based on the signing method
      let signature: any;
      switch (config.signingMethod) {
        case 'l1Action':
          signature = await signL1Action(
            this.context.wallet,
            action,
            vaultAddress,
            nonce,
            this.context.isMainnet
          );
          break;

        case 'userSignedAction':
          if (!config.signatureTypes || !config.primaryType) {
            throw new Error(`Missing signature configuration for method: ${methodName}`);
          }
          signature = await signUserSignedAction(
            this.context.wallet,
            action,
            config.signatureTypes,
            config.primaryType,
            this.context.isMainnet
          );
          break;

        case 'agent':
          signature = await signAgent(this.context.wallet, action, this.context.isMainnet);
          break;

        case 'usdTransfer':
          signature = await signUsdTransferAction(
            this.context.wallet,
            action,
            this.context.isMainnet
          );
          break;

        default:
          throw new Error(`Unknown signing method: ${config.signingMethod}`);
      }

      // Build the final payload
      const payload: any = {
        action,
        nonce: action.nonce || nonce,
        signature,
      };

      if (vaultAddress) {
        payload.vaultAddress = vaultAddress;
      }

      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate payload for ${methodName}: ${errorMessage}`);
    }
  }

  /**
   * Get available exchange methods
   */
  getAvailableMethods(): string[] {
    return Object.keys(EXCHANGE_METHOD_CONFIGS);
  }

  /**
   * Check if a method is supported
   */
  isMethodSupported(methodName: string): boolean {
    return methodName in EXCHANGE_METHOD_CONFIGS;
  }
}
