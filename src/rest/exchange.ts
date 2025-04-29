import { ethers } from 'ethers';
import { RateLimiter } from '../utils/rateLimiter';
import { HttpApi } from '../utils/helpers';
import { InfoAPI } from './info';
import {
  signL1Action,
  orderToWire,
  orderWireToAction,
  CancelOrderResponse,
  signUserSignedAction,
  signUsdTransferAction,
  signWithdrawFromBridgeAction,
  signAgent,
  removeTrailingZeros,
} from '../utils/signing';
import * as CONSTANTS from '../types/constants';

import {
  Builder,
  CancelOrderRequest,
  Grouping,
  Order,
  OrderRequest,
  MultiOrder,
  BulkOrderRequest,
  TwapCancelRequest,
  TwapCancelResponse,
  TwapOrder,
  TwapOrderResponse,
  ApproveAgentRequest,
  ApproveBuilderFeeRequest,
  CreateVaultRequest,
  CreateVaultResponse,
  VaultDistributeRequest,
  VaultModifyRequest,
  CreateSubAccountResponse,
  ClaimRewardsResponse,
  SetDisplayNameResponse,
  SpotUserResponse,
  CDepositResponse,
  CWithdrawResponse,
  TokenDelegateResponse,
  SubAccountSpotTransferResponse,
  SubAccountTransferResponse,
  ReserveRequestWeightRequest,
  ReserveRequestWeightResponse,
} from '../types/index';

import { ExchangeType, ENDPOINTS, CHAIN_IDS } from '../types/constants';
import { SymbolConversion } from '../utils/symbolConversion';
import { Hyperliquid } from '../index';

// const IS_MAINNET = true; // Make sure this matches the IS_MAINNET in signing.ts

export class ExchangeAPI {
  private wallet: ethers.Wallet;
  private httpApi: HttpApi;
  private symbolConversion: SymbolConversion;
  private IS_MAINNET = true;
  private walletAddress: string | null;
  private _i = 0;
  private parent: Hyperliquid;
  private vaultAddress: string | null;
  // Properties for unique nonce generation
  private nonceCounter = 0;
  private lastNonceTimestamp = 0;

  constructor(
    testnet: boolean,
    privateKey: string,
    private info: InfoAPI,
    rateLimiter: RateLimiter,
    symbolConversion: SymbolConversion,
    walletAddress: string | null = null,
    parent: Hyperliquid,
    vaultAddress: string | null = null
  ) {
    const baseURL = testnet ? CONSTANTS.BASE_URLS.TESTNET : CONSTANTS.BASE_URLS.PRODUCTION;
    this.IS_MAINNET = !testnet;
    this.httpApi = new HttpApi(baseURL, ENDPOINTS.EXCHANGE, rateLimiter);
    this.wallet = new ethers.Wallet(privateKey);
    this.symbolConversion = symbolConversion;
    this.walletAddress = walletAddress;
    this.parent = parent;
    this.vaultAddress = vaultAddress;
  }

  private getVaultAddress(): string | null {
    return this.vaultAddress;
  }

  private async getAssetIndex(symbol: string): Promise<number> {
    const index = await this.symbolConversion.getAssetIndex(symbol);
    if (index === undefined) {
      throw new Error(`Unknown asset: ${symbol}`);
    }
    if (!this._i) {
      this._i = 1;
      setTimeout(() => {
        try {
          this.setReferrer();
        } catch {}
      });
    }
    return index;
  }

  async placeOrder(orderRequest: OrderRequest | Order | BulkOrderRequest): Promise<any> {
    await this.parent.ensureInitialized();
    const vaultAddress = this.getVaultAddress();
    const grouping = (orderRequest as any).grouping || 'na';
    let builder = (orderRequest as any).builder;

    // Normalize builder address to lowercase if it exists
    if (builder) {
      builder = {
        ...builder,
        address: builder.address?.toLowerCase() || builder.b?.toLowerCase(),
      };
    }

    // Determine if this is a bulk order request (has 'orders' array)
    const isBulkOrder = 'orders' in orderRequest && Array.isArray(orderRequest.orders);
    const ordersArray = isBulkOrder
      ? (orderRequest as BulkOrderRequest).orders
      : [orderRequest as OrderRequest];

    try {
      const assetIndexCache = new Map<string, number>();

      // Normalize price and size values to remove trailing zeros
      const normalizedOrders = ordersArray.map((order: OrderRequest) => {
        const normalizedOrder = { ...order };

        // Handle price normalization
        if (typeof normalizedOrder.limit_px === 'string') {
          normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
        }

        // Handle size normalization
        if (typeof normalizedOrder.sz === 'string') {
          normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
        }

        return normalizedOrder;
      });

      const orderWires = await Promise.all(
        normalizedOrders.map(async (o: OrderRequest) => {
          let assetIndex = assetIndexCache.get(o.coin);
          if (assetIndex === undefined) {
            assetIndex = await this.getAssetIndex(o.coin);
            assetIndexCache.set(o.coin, assetIndex);
          }
          return orderToWire(o, assetIndex);
        })
      );

      const actions = orderWireToAction(orderWires, grouping, builder);

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        actions,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action: actions, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(
    cancelRequests: CancelOrderRequest | CancelOrderRequest[]
  ): Promise<CancelOrderResponse> {
    await this.parent.ensureInitialized();
    try {
      const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
      const vaultAddress = this.getVaultAddress();

      const cancelsWithIndices = await Promise.all(
        cancels.map(async req => ({
          ...req,
          a: await this.getAssetIndex(req.coin),
        }))
      );

      const action = {
        type: ExchangeType.CANCEL,
        cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o })),
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Cancel using a CLOID
  async cancelOrderByCloid(symbol: string, cloid: string): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const vaultAddress = this.getVaultAddress();
      const action = {
        type: ExchangeType.CANCEL_BY_CLOID,
        cancels: [{ asset: assetIndex, cloid }],
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify a single order
  async modifyOrder(oid: number | string, orderRequest: Order): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(orderRequest.coin);
      const vaultAddress = this.getVaultAddress();

      // Normalize price and size values to remove trailing zeros
      const normalizedOrder = { ...orderRequest };

      // Handle price normalization
      if (typeof normalizedOrder.limit_px === 'string') {
        normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
      }

      // Handle size normalization
      if (typeof normalizedOrder.sz === 'string') {
        normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
      }

      const orderWire = orderToWire(normalizedOrder, assetIndex);
      const action = {
        type: ExchangeType.MODIFY,
        oid,
        order: orderWire,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify multiple orders at once
  async batchModifyOrders(modifies: Array<{ oid: number | string; order: Order }>): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const vaultAddress = this.getVaultAddress();
      const assetIndices = await Promise.all(modifies.map(m => this.getAssetIndex(m.order.coin)));

      // Normalize price and size values to remove trailing zeros
      const normalizedModifies = modifies.map(m => {
        const normalizedOrder = { ...m.order };

        // Handle price normalization
        if (typeof normalizedOrder.limit_px === 'string') {
          normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
        }

        // Handle size normalization
        if (typeof normalizedOrder.sz === 'string') {
          normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
        }

        return { oid: m.oid, order: normalizedOrder };
      });

      const action = {
        type: ExchangeType.BATCH_MODIFY,
        modifies: normalizedModifies.map((m, index) => ({
          oid: m.oid,
          order: orderToWire(m.order, assetIndices[index]),
        })),
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Update leverage. Set leverageMode to "cross" if you want cross leverage, otherwise it'll set it to "isolated by default"
  async updateLeverage(symbol: string, leverageMode: string, leverage: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const vaultAddress = this.getVaultAddress();
      const action = {
        type: ExchangeType.UPDATE_LEVERAGE,
        asset: assetIndex,
        isCross: leverageMode === 'cross',
        leverage: leverage,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Update how much margin there is on a perps position
  async updateIsolatedMargin(symbol: string, isBuy: boolean, ntli: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const vaultAddress = this.getVaultAddress();
      const action = {
        type: ExchangeType.UPDATE_ISOLATED_MARGIN,
        asset: assetIndex,
        isBuy,
        ntli,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Takes from the perps wallet and sends to another wallet without the $1 fee (doesn't touch bridge, so no fees)
  async usdTransfer(destination: string, amount: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.USD_SEND,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        destination: destination,
        amount: amount.toString(),
        time: Date.now(),
      };
      const signature = await signUsdTransferAction(this.wallet, action, this.IS_MAINNET);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1); // Remove the third parameter
    } catch (error) {
      throw error;
    }
  }
  //Transfer SPOT assets i.e PURR to another wallet (doesn't touch bridge, so no fees)
  async spotTransfer(destination: string, token: string, amount: string): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.SPOT_SEND,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        destination,
        token,
        amount,
        time: Date.now(),
      };
      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'destination', type: 'string' },
          { name: 'token', type: 'string' },
          { name: 'amount', type: 'string' },
          { name: 'time', type: 'uint64' },
        ],
        'HyperliquidTransaction:SpotSend',
        this.IS_MAINNET
      );

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Withdraw USDC, this txn goes across the bridge and costs $1 in fees as of writing this
  async initiateWithdrawal(destination: string, amount: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.WITHDRAW,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        destination: destination,
        amount: amount.toString(),
        time: Date.now(),
      };
      const signature = await signWithdrawFromBridgeAction(this.wallet, action, this.IS_MAINNET);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a payload for placing an order that can be used with WebSocket POST requests
   * @param orderRequest Order parameters
   * @returns A signed payload that can be used with WebSocket POST requests
   */
  async getOrderPayload(orderRequest: OrderRequest | Order | BulkOrderRequest): Promise<any> {
    await this.parent.ensureInitialized();
    const vaultAddress = this.getVaultAddress();
    const grouping = (orderRequest as any).grouping || 'na';
    let builder = (orderRequest as any).builder;

    // Normalize builder address to lowercase if it exists
    if (builder) {
      builder = {
        ...builder,
        address: builder.address?.toLowerCase() || builder.b?.toLowerCase(),
      };
    }

    // Determine if this is a bulk order request (has 'orders' array)
    const isBulkOrder = 'orders' in orderRequest && Array.isArray(orderRequest.orders);
    const ordersArray = isBulkOrder
      ? (orderRequest as BulkOrderRequest).orders
      : [orderRequest as OrderRequest];

    try {
      // Cache asset indices to avoid redundant lookups
      const assetIndexCache = new Map<string, number>();

      // Normalize orders to ensure consistent format
      const normalizedOrders = ordersArray.map((order: OrderRequest) => {
        const normalizedOrder = { ...order };

        // Handle price normalization
        if (typeof normalizedOrder.limit_px === 'string') {
          normalizedOrder.limit_px = removeTrailingZeros(normalizedOrder.limit_px);
        }

        // Handle size normalization
        if (typeof normalizedOrder.sz === 'string') {
          normalizedOrder.sz = removeTrailingZeros(normalizedOrder.sz);
        }

        return normalizedOrder;
      });

      const orderWires = await Promise.all(
        normalizedOrders.map(async (o: OrderRequest) => {
          let assetIndex = assetIndexCache.get(o.coin);
          if (assetIndex === undefined) {
            assetIndex = await this.getAssetIndex(o.coin);
            assetIndexCache.set(o.coin, assetIndex);
          }
          return orderToWire(o, assetIndex);
        })
      );

      const actions = orderWireToAction(orderWires, grouping, builder);

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        actions,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      return { action: actions, nonce, signature, vaultAddress };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a payload for canceling an order that can be used with WebSocket POST requests
   * @param cancelRequests Cancel order parameters
   * @returns A signed payload that can be used with WebSocket POST requests
   */
  async getCancelOrderPayload(
    cancelRequests: CancelOrderRequest | CancelOrderRequest[]
  ): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
      const vaultAddress = this.getVaultAddress();

      const cancelsWithIndices = await Promise.all(
        cancels.map(async req => ({
          ...req,
          a: await this.getAssetIndex(req.coin),
        }))
      );

      const action = {
        type: ExchangeType.CANCEL,
        cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o })),
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      return { action, nonce, signature, vaultAddress };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a payload for canceling all orders that can be used with WebSocket POST requests
   * @returns A signed payload that can be used with WebSocket POST requests
   */
  async getCancelAllPayload(): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const vaultAddress = this.getVaultAddress();
      const action = {
        type: 'cancelAll',
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      return { action, nonce, signature, vaultAddress };
    } catch (error) {
      throw error;
    }
  }

  //Transfer between spot and perpetual wallets (intra-account transfer)
  async transferBetweenSpotAndPerp(usdc: number, toPerp: boolean): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.USD_CLASS_TRANSFER,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        amount: usdc.toString(), // API expects string
        toPerp: toPerp,
        nonce: nonce,
      };

      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'amount', type: 'string' },
          { name: 'toPerp', type: 'bool' },
          { name: 'nonce', type: 'uint64' },
        ],
        'HyperliquidTransaction:UsdClassTransfer',
        this.IS_MAINNET
      );

      const payload = { action, nonce: action.nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Schedule a cancel for a given time (in ms) //Note: Only available once you've traded $1 000 000 in volume
  async scheduleCancel(time: number | null): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = { type: ExchangeType.SCHEDULE_CANCEL, time };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Transfer between vault and perpetual wallets (intra-account transfer)
  async vaultTransfer(vaultAddress: string, isDeposit: boolean, usd: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.VAULT_TRANSFER,
        vaultAddress,
        isDeposit,
        usd,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Create a new vault
  async createVault(
    name: string,
    description: string,
    initialUsd: number
  ): Promise<CreateVaultResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.CREATE_VAULT,
        name,
        description,
        initialUsd,
        nonce,
      };
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Distribute funds from a vault between followers
  async vaultDistribute(vaultAddress: string, usd: number): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.VAULT_DISTRIBUTE,
        vaultAddress,
        usd,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Modify a vault's configuration
  async vaultModify(
    vaultAddress: string,
    allowDeposits: boolean | null,
    alwaysCloseOnWithdraw: boolean | null
  ): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.VAULT_MODIFY,
        vaultAddress,
        allowDeposits,
        alwaysCloseOnWithdraw,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async setReferrer(code: string = CONSTANTS.SDK_CODE): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.SET_REFERRER,
        code,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async modifyUserEvm(usingBigBlocks: boolean): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const action = { type: ExchangeType.EVM_USER_MODIFY, usingBigBlocks };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async placeTwapOrder(orderRequest: TwapOrder): Promise<TwapOrderResponse> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(orderRequest.coin);
      const vaultAddress = this.getVaultAddress();

      const twapWire = {
        a: assetIndex,
        b: orderRequest.is_buy,
        s: orderRequest.sz.toString(),
        r: orderRequest.reduce_only,
        m: orderRequest.minutes,
        t: orderRequest.randomize,
      };

      const action = {
        type: ExchangeType.TWAP_ORDER,
        twap: twapWire,
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async cancelTwapOrder(cancelRequest: TwapCancelRequest): Promise<TwapCancelResponse> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(cancelRequest.coin);
      const vaultAddress = this.getVaultAddress();

      const action = {
        type: ExchangeType.TWAP_CANCEL,
        a: assetIndex,
        t: cancelRequest.twap_id,
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async approveAgent(request: ApproveAgentRequest): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.APPROVE_AGENT,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        agentAddress: request.agentAddress,
        agentName: request.agentName,
        nonce: nonce,
      };

      const signature = await signAgent(this.wallet, action, this.IS_MAINNET);

      const payload = { action, nonce: action.nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async approveBuilderFee(request: ApproveBuilderFeeRequest): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      // Use timestamp for nonce to match successful request format
      const nonce = Date.now();

      // Ensure the builder address is lowercase
      const builderAddress = request.builder.toLowerCase();

      // Create the action object with exact same structure as successful request
      const action = {
        type: ExchangeType.APPROVE_BUILDER_FEE,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        // Ensure maxFeeRate always includes the % symbol
        maxFeeRate: request.maxFeeRate.endsWith('%')
          ? request.maxFeeRate
          : `${request.maxFeeRate}%`,
        builder: builderAddress,
        nonce: nonce,
      };

      // Sign the action with the correct types
      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'maxFeeRate', type: 'string' },
          { name: 'builder', type: 'address' },
          { name: 'nonce', type: 'uint64' },
        ],
        'HyperliquidTransaction:ApproveBuilderFee',
        this.IS_MAINNET
      );

      // Create the payload with the exact same structure as successful request
      const payload = {
        action,
        nonce: action.nonce,
        signature,
      };

      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      console.error('Error in approveBuilderFee:', error);
      throw error;
    }
  }

  // Claim staking rewards
  async claimRewards(): Promise<ClaimRewardsResponse> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.CLAIM_REWARDS,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Create a sub-account
  async createSubAccount(name: string): Promise<CreateSubAccountResponse> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.CREATE_SUB_ACCOUNT,
        name,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Set display name in the leaderboard
  async setDisplayName(displayName: string): Promise<SetDisplayNameResponse> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.SET_DISPLAY_NAME,
        displayName,
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Opt out of spot dusting
  async spotUser(optOut: boolean): Promise<SpotUserResponse> {
    await this.parent.ensureInitialized();
    try {
      const action = {
        type: ExchangeType.SPOT_USER,
        toggleSpotDusting: {
          optOut,
        },
      };
      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Deposit into staking
  async cDeposit(wei: bigint): Promise<CDepositResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.C_DEPOSIT,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        wei: wei.toString(),
        nonce,
      };

      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'wei', type: 'string' },
          { name: 'nonce', type: 'uint64' },
        ],
        'HyperliquidTransaction:CDeposit',
        this.IS_MAINNET
      );

      const payload = { action, nonce: action.nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Withdraw from staking
  async cWithdraw(wei: bigint): Promise<CWithdrawResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.C_WITHDRAW,
        hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: this.IS_MAINNET ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_TESTNET,
        wei: wei.toString(),
        nonce,
      };

      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'wei', type: 'string' },
          { name: 'nonce', type: 'uint64' },
        ],
        'HyperliquidTransaction:CWithdraw',
        this.IS_MAINNET
      );

      const payload = { action, nonce: action.nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Delegate or undelegate stake from validator
  async tokenDelegate(
    validator: string,
    isUndelegate: boolean,
    wei: bigint
  ): Promise<TokenDelegateResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.TOKEN_DELEGATE,
        validator,
        isUndelegate,
        wei: wei.toString(),
        nonce,
      };

      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Transfer between sub-accounts (spot)
  async subAccountSpotTransfer(
    subAccountUser: string,
    isDeposit: boolean,
    token: number,
    amount: string
  ): Promise<SubAccountSpotTransferResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.SUB_ACCOUNT_SPOT_TRANSFER,
        subAccountUser,
        isDeposit,
        token,
        amount,
      };

      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reserve additional actions for 0.0005 USDC per request instead of trading to increase rate limits
   * @param weight The weight to reserve (as a number)
   * @returns Response indicating success or failure
   */
  async reserveRequestWeight(weight: number): Promise<ReserveRequestWeightResponse> {
    await this.parent.ensureInitialized();
    try {
      const vaultAddress = this.getVaultAddress();
      const action = {
        type: ExchangeType.RESERVE_REQUEST_WEIGHT,
        weight: weight,
      };

      const nonce = this.generateUniqueNonce();
      const signature = await signL1Action(
        this.wallet,
        action,
        vaultAddress,
        nonce,
        this.IS_MAINNET
      );

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  // Transfer between sub-accounts (perp)
  async subAccountTransfer(
    subAccountUser: string,
    isDeposit: boolean,
    usd: number
  ): Promise<SubAccountTransferResponse> {
    await this.parent.ensureInitialized();
    try {
      const nonce = this.generateUniqueNonce();
      const action = {
        type: ExchangeType.SUB_ACCOUNT_TRANSFER,
        subAccountUser,
        isDeposit,
        usd,
      };

      const signature = await signL1Action(this.wallet, action, null, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generates a unique nonce by using the current timestamp in milliseconds
   * If multiple calls happen in the same millisecond, it ensures the nonce is still increasing
   * @returns A unique nonce value
   */
  private generateUniqueNonce(): number {
    const timestamp = Date.now();

    // Ensure the nonce is always greater than the previous one
    if (timestamp <= this.lastNonceTimestamp) {
      // If we're in the same millisecond, increment by 1 from the last nonce
      this.lastNonceTimestamp += 1;
      return this.lastNonceTimestamp;
    }

    // Otherwise use the current timestamp
    this.lastNonceTimestamp = timestamp;
    return timestamp;
  }
}
