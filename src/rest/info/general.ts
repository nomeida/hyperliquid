// src/rest/info/general.ts

import { 
    AllMids, 
    UserOpenOrders, 
    FrontendOpenOrders, 
    UserFills, 
    UserRateLimit, 
    OrderStatus, 
    L2Book, 
    CandleSnapshot,
    HistoricalOrder,
    TwapSliceFill,
    SubAccount,
    VaultDetails,
    VaultEquity
} from '../../types/index.ts';
import { HttpApi } from '../../utils/helpers.ts';
import { SymbolConversion } from '../../utils/symbolConversion.ts';
import { InfoType } from '../../types/constants.ts';
import { Hyperliquid } from '../../index.ts';

export class GeneralInfoAPI {
    private parent: Hyperliquid;

    constructor(
        private httpApi: HttpApi, 
        private symbolConversion: SymbolConversion,
        parent: Hyperliquid
    ) {
        this.parent = parent;
    }

    async getAllMids(rawResponse: boolean = false): Promise<AllMids> {
        const response = await this.httpApi.makeRequest({ type: InfoType.ALL_MIDS });

        if (rawResponse) {
            return response;
        } else {
            const convertedResponse: any = {};
            for (const [key, value] of Object.entries(response)) {
                const convertedKey = await this.symbolConversion.convertSymbol(key);
                const convertedValue = parseFloat(value as string);
                convertedResponse[convertedKey] = convertedValue;
            }
            return convertedResponse;
        }
    }

    async getUserOpenOrders(user: string, rawResponse: boolean = false): Promise<UserOpenOrders> {
        await this.parent.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: InfoType.OPEN_ORDERS, user: user });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getFrontendOpenOrders(user: string, rawResponse: boolean = false): Promise<FrontendOpenOrders> {
        const response = await this.httpApi.makeRequest({ type: InfoType.FRONTEND_OPEN_ORDERS, user: user }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getUserFills(user: string, rawResponse: boolean = false): Promise<UserFills> {
        const response = await this.httpApi.makeRequest({ type: InfoType.USER_FILLS, user: user }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getUserFillsByTime(user: string, startTime: number, endTime?: number, rawResponse: boolean = false): Promise<UserFills> {
        let params: { user: string; startTime: number; type: string; endTime?: number } = {
            user: user,
            startTime: Math.round(startTime),
            type: InfoType.USER_FILLS_BY_TIME
        };
        
        if (endTime) {
            params.endTime = Math.round(endTime)
        }

        const response = await this.httpApi.makeRequest(params, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getUserRateLimit(user: string, rawResponse: boolean = false): Promise<UserRateLimit> {
        const response = await this.httpApi.makeRequest({ type: InfoType.USER_RATE_LIMIT, user: user }, 20);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getOrderStatus(user: string, oid: number | string, rawResponse: boolean = false): Promise<OrderStatus> {
        const response = await this.httpApi.makeRequest({ type: InfoType.ORDER_STATUS, user: user, oid: oid });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getL2Book(coin: string, rawResponse: boolean = false): Promise<L2Book> {
        const response = await this.httpApi.makeRequest({ type: InfoType.L2_BOOK, coin: await this.symbolConversion.convertSymbol(coin, "reverse") });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, rawResponse: boolean = false): Promise<CandleSnapshot> {
        const response = await this.httpApi.makeRequest({ 
            type: InfoType.CANDLE_SNAPSHOT, 
            req: { coin: await this.symbolConversion.convertSymbol(coin, "reverse"), interval: interval, startTime: startTime, endTime: endTime } 
        });

        return rawResponse ? response : await this.symbolConversion.convertResponse(response, ["s"]);
    }

    // Add these methods to src/rest/info/general.ts

    async getMaxBuilderFee(user: string, builder: string, rawResponse: boolean = false): Promise<number> {
        const response = await this.httpApi.makeRequest({
            type: InfoType.MAX_BUILDER_FEE,
            user,
            builder
        });
        return rawResponse ? response : this.symbolConversion.convertToNumber(response);
    }

    async getHistoricalOrders(user: string, rawResponse: boolean = false): Promise<HistoricalOrder[]> {
        const response = await this.httpApi.makeRequest({
            type: InfoType.HISTORICAL_ORDERS,
            user
        });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getUserTwapSliceFills(user: string, rawResponse: boolean = false): Promise<TwapSliceFill[]> {
        const response = await this.httpApi.makeRequest({
            type: InfoType.USER_TWAP_SLICE_FILLS,
            user
        });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getSubAccounts(user: string, rawResponse: boolean = false): Promise<SubAccount[]> {
        const response = await this.httpApi.makeRequest({
            type: InfoType.SUB_ACCOUNTS,
            user
        });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getVaultDetails(vaultAddress: string, user?: string, rawResponse: boolean = false): Promise<VaultDetails> {
        const params: any = {
            type: InfoType.VAULT_DETAILS,
            vaultAddress
        };
        
        if (user) {
            params.user = user;
        }
        
        const response = await this.httpApi.makeRequest(params);
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }

    async getUserVaultEquities(user: string, rawResponse: boolean = false): Promise<VaultEquity[]> {
        const response = await this.httpApi.makeRequest({
            type: InfoType.USER_VAULT_EQUITIES,
            user
        });
        return rawResponse ? response : await this.symbolConversion.convertResponse(response);
    }
}
