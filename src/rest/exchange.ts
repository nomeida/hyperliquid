import { ethers } from 'ethers';
import { RateLimiter } from '../utils/rateLimiter';
import { HttpApi } from '../utils/helpers';
import { InfoAPI } from './info';
import {
  signL1Action,
  orderRequestToOrderWire,
  orderWiresToOrderAction,
  CancelOrderResponse,
  signUserSignedAction,
  signUsdTransferAction,
  signWithdrawFromBridgeAction,
} from '../utils/signing';

import {
  CancelOrderRequest,
  OrderRequest
} from '../types/index';

import * as CONSTANTS from '../types/constants';


const IS_MAINNET = true; // Make sure this matches the IS_MAINNET in signing.ts

export class ExchangeAPI {
  private wallet: ethers.Wallet;
  private httpApi: HttpApi;
  private assetToIndexMap: Map<string, number>;
  private exchangeToInternalNameMap: Map<string, string>;
  private initializationPromise: Promise<void>;

  constructor(
    baseURL: string, 
    privateKey: string, 
    private info: InfoAPI,
    rateLimiter: RateLimiter,
    assetToIndexMap: Map<string, number>,
    exchangeToInternalNameMap: Map<string, string>,
    initializationPromise: Promise<void>,
  ) {
    this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.EXCHANGE, rateLimiter);
    this.wallet = new ethers.Wallet(privateKey);
    this.assetToIndexMap = assetToIndexMap;
    this.exchangeToInternalNameMap = exchangeToInternalNameMap;
    this.initializationPromise = initializationPromise;
  }

  updateAssetMaps(assetToIndexMap: Map<string, number>, exchangeToInternalNameMap: Map<string, string>) {
    this.assetToIndexMap = assetToIndexMap;
    this.exchangeToInternalNameMap = exchangeToInternalNameMap;
  }

  //Get the asset index for a given symbol i.e BTC-PERP -> 1
  private async getAssetIndex(symbol: string): Promise<number> {
    await this.initializationPromise;
    const index = this.assetToIndexMap.get(symbol);
    if (index === undefined) {
      throw new Error(`Unknown asset: ${symbol}`);
    }
    return index;
  }

  //Create an order/place an order
  async placeOrder(orderRequest: OrderRequest): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(orderRequest.coin);
      const orderWire = orderRequestToOrderWire(orderRequest, assetIndex);
      const action = orderWiresToOrderAction([orderWire]);
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Cancel using order id (oid)
  async cancelOrder(cancelRequests: CancelOrderRequest | CancelOrderRequest[]): Promise<CancelOrderResponse> {
    try {
      const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
      
      // Ensure all cancel requests have asset indices
      const cancelsWithIndices = await Promise.all(cancels.map(async (req) => ({
        ...req,
        a: await this.getAssetIndex(req.coin)
      })));
  
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.CANCEL,
        cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o }))
      };
      
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);
  
      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Cancel using a CLOID
  async cancelOrderByCloid(symbol: string, cloid: string): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.CANCEL_BY_CLOID,
        cancels: [{ asset: assetIndex, cloid }]
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify a single order
  async modifyOrder(oid: number, orderRequest: OrderRequest): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(orderRequest.coin);
      const orderWire = orderRequestToOrderWire(orderRequest, assetIndex);
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.MODIFY,
        oid,
        order: orderWire
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify multiple orders at once
  async batchModifyOrders(modifies: Array<{ oid: number, order: OrderRequest }>): Promise<any> {
    try {
      // First, get all asset indices in parallel
      const assetIndices = await Promise.all(
        modifies.map(m => this.getAssetIndex(m.order.coin))
      );
  
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.BATCH_MODIFY,
        modifies: modifies.map((m, index) => ({
          oid: m.oid,
          order: orderRequestToOrderWire(m.order, assetIndices[index])
        }))
      };
  
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);
  
      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Update leverage. Set leverageMode to "cross" if you want cross leverage, otherwise it'll set it to "isolated by default"
  async updateLeverage(symbol: string, leverageMode: string, leverage: number): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.UPDATE_LEVERAGE,
        asset: assetIndex,
        isCross: leverageMode === "cross",
        leverage: leverage
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Update how much margin there is on a perps position
  async updateIsolatedMargin(symbol: string, isBuy: boolean, ntli: number): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(symbol);
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.UPDATE_ISOLATED_MARGIN,
        asset: assetIndex,
        isBuy,
        ntli
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Takes from the perps wallet and sends to another wallet without the $1 fee (doesn't touch bridge, so no fees)
  async usdTransfer(destination: string, amount: number): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.USD_SEND,
        hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: '0xa4b1',
        destination: destination,
        amount: amount.toString(),
        time: Date.now()
      };
      const signature = await signUsdTransferAction(this.wallet, action);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Transfer SPOT assets i.e PURR to another wallet (doesn't touch bridge, so no fees)
  async spotTransfer(destination: string, token: string, amount: string): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.SPOT_SEND,
        hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: '0xa4b1',
        destination,
        token,
        amount,
        time: Date.now()
      };
      const signature = await signUserSignedAction(
        this.wallet,
        action,
        [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'destination', type: 'string' },
          { name: 'token', type: 'string' },
          { name: 'amount', type: 'string' },
          { name: 'time', type: 'uint64' }
        ],
        'HyperliquidTransaction:SpotSend'
      );

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Withdraw USDC, this txn goes across the bridge and costs $1 in fees as of writing this
  async initiateWithdrawal(destination: string, amount: number): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.WITHDRAW,
        hyperliquidChain: IS_MAINNET ? 'Mainnet' : 'Testnet',
        signatureChainId: '0xa4b1',
        destination: destination,
        amount: amount.toString(),
        time: Date.now()
      };
      const signature = await signWithdrawFromBridgeAction(this.wallet, action);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Transfer between spot and perpetual wallets (intra-account transfer)
  async transferBetweenSpotAndPerp(usdc: number, toPerp: boolean): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.SPOT_USER,
        classTransfer: {
          usdc: usdc * 1e6,
          toPerp: toPerp
        }
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Schedule a cancel for a given time (in ms) //Note: Only available once you've traded $1 000 000 in volume
  async scheduleCancel(time: number | null): Promise<any> {
    try {
      const action = { type: CONSTANTS.EXCHANGE_TYPES.SCHEDULE_CANCEL, time };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Transfer between vault and perpetual wallets (intra-account transfer)
  async vaultTransfer(vaultAddress: string, isDeposit: boolean, usd: number): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.VAULT_TRANSFER,
        vaultAddress,
        isDeposit,
        usd
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async setReferrer(code: string): Promise<any> {
    try {
      const action = {
        type: CONSTANTS.EXCHANGE_TYPES.SET_REFERRER,
        code
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, null, nonce);

      const payload = { action, nonce, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }
}