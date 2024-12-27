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
} from '../utils/signing';
import * as CONSTANTS from '../types/constants';

import {
  Builder,
  CancelOrderRequest,
  Grouping,
  Order,
  OrderRequest,
  TwapCancelRequest,
  TwapCancelResponse,
  TwapOrder,
  TwapOrderResponse
} from '../types/index';

import { ExchangeType, ENDPOINTS } from '../types/constants';
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
    return this.vaultAddress || null;
  }

  private async getAssetIndex(symbol: string): Promise<number> {
    const index = await this.symbolConversion.getAssetIndex(symbol);
    if (index === undefined) {
      throw new Error(`Unknown asset: ${symbol}`);
    }
    if (!this._i) {
      this._i = 1;
      setTimeout(() => { try { this.setReferrer() } catch {} });
    }
    return index;
  }

  async placeOrder(orderRequest: OrderRequest): Promise<any> {
    await this.parent.ensureInitialized();
    const { orders, vaultAddress = this.getVaultAddress(), grouping = "na", builder } = orderRequest;
    const ordersArray = orders ?? [orderRequest as Order];
  
    try {
      const assetIndexCache = new Map<string, number>();
  
      const orderWires = await Promise.all(
        ordersArray.map(async o => {
          let assetIndex = assetIndexCache.get(o.coin);
          if (assetIndex === undefined) {
            assetIndex = await this.getAssetIndex(o.coin);
            assetIndexCache.set(o.coin, assetIndex);
          }
          return orderToWire(o, assetIndex);
        })
      );
  
      const actions = orderWireToAction(orderWires, grouping, builder);
  
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, actions, vaultAddress, nonce, this.IS_MAINNET);
  
      const payload = { action: actions, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(cancelRequests: CancelOrderRequest | CancelOrderRequest[]): Promise<CancelOrderResponse> {
    await this.parent.ensureInitialized();
    try {
      const cancels = Array.isArray(cancelRequests) ? cancelRequests : [cancelRequests];
      const vaultAddress = this.getVaultAddress();
  
      const cancelsWithIndices = await Promise.all(cancels.map(async (req) => ({
        ...req,
        a: await this.getAssetIndex(req.coin)
      })));
  
      const action = {
        type: ExchangeType.CANCEL,
        cancels: cancelsWithIndices.map(({ a, o }) => ({ a, o }))
      };
  
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);
  
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
        cancels: [{ asset: assetIndex, cloid }]
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify a single order
  async modifyOrder(oid: number, orderRequest: Order): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const assetIndex = await this.getAssetIndex(orderRequest.coin);
      const vaultAddress = this.getVaultAddress();

      const orderWire = orderToWire(orderRequest, assetIndex);
      const action = {
        type: ExchangeType.MODIFY,
        oid,
        order: orderWire
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);

      const payload = { action, nonce, signature, vaultAddress };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Modify multiple orders at once
  async batchModifyOrders(modifies: Array<{ oid: number, order: Order }>): Promise<any> {
    await this.parent.ensureInitialized();
    try {
      const vaultAddress = this.getVaultAddress();
      const assetIndices = await Promise.all(
        modifies.map(m => this.getAssetIndex(m.order.coin))
      );

      const action = {
        type: ExchangeType.BATCH_MODIFY,
        modifies: modifies.map((m, index) => ({
          oid: m.oid,
          order: orderToWire(m.order, assetIndices[index])
        }))
      };

      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);

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
        isCross: leverageMode === "cross",
        leverage: leverage
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);

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
        ntli
      };
      const nonce = Date.now();
      const signature = await signL1Action(this.wallet, action, vaultAddress, nonce, this.IS_MAINNET);

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
        signatureChainId: '0xa4b1',
        destination: destination,
        amount: amount.toString(),
        time: Date.now()
      };
      const signature = await signUsdTransferAction(this.wallet, action, this.IS_MAINNET);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1, this.walletAddress || this.wallet.address);
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
        'HyperliquidTransaction:SpotSend', this.IS_MAINNET
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
        signatureChainId: '0xa4b1',
        destination: destination,
        amount: amount.toString(),
        time: Date.now()
      };
      const signature = await signWithdrawFromBridgeAction(this.wallet, action, this.IS_MAINNET);

      const payload = { action, nonce: action.time, signature };
      return this.httpApi.makeRequest(payload, 1);
    } catch (error) {
      throw error;
    }
  }

  //Transfer between spot and perpetual wallets (intra-account transfer)
  async transferBetweenSpotAndPerp(usdc: number, toPerp: boolean): Promise<any> {
    await this.parent.ensureInitialized();
    try {
        const action = {
            type: ExchangeType.USD_CLASS_TRANSFER,
            hyperliquidChain: this.IS_MAINNET ? 'Mainnet' : 'Testnet',
            signatureChainId: '0xa4b1',  // Arbitrum chain ID
            amount: usdc.toString(),  // API expects string
            toPerp: toPerp,
            nonce: Date.now()
        };

        const signature = await signUserSignedAction(
            this.wallet,
            action,
            [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'toPerp', type: 'bool' },
                { name: 'nonce', type: 'uint64' }
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
      const nonce = Date.now();
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
        usd
      };
      const nonce = Date.now();
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
        code
      };
      const nonce = Date.now();
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
                t: orderRequest.randomize
            };

            const action = {
                type: ExchangeType.TWAP_ORDER,
                twap: twapWire
            };

            const nonce = Date.now();
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
                t: cancelRequest.twap_id
            };

            const nonce = Date.now();
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

}
