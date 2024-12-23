// src/rest/info/general.ts

import { 
    AllMids, 
    Meta, 
    UserOpenOrders, 
    FrontendOpenOrders, 
    UserFills, 
    UserRateLimit, 
    OrderStatus, 
    L2Book, 
    CandleSnapshot 
} from '../../types';
import { HttpApi } from '../../utils/helpers';
import * as CONSTANTS from '../../types/constants';

export class GeneralInfoAPI {
    private httpApi: HttpApi;
    private exchangeToInternalNameMap: Map<string, string>;
    private initializationPromise: Promise<void>;

    constructor(httpApi: HttpApi, exchangeToInternalNameMap: Map<string, string>, initializationPromise: Promise<void>) {
        this.httpApi = httpApi;
        this.exchangeToInternalNameMap = exchangeToInternalNameMap;
        this.initializationPromise = initializationPromise;
    }

    async ensureInitialized() {
        await this.initializationPromise;
    }

    private convertSymbol(symbol: string, mode: string = "", symbolMode: string = ""): string {
        let rSymbol;
        if (mode=="reverse") {
            for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
                if (value === symbol) {
                    return key;
                }
            }
            rSymbol = symbol;
        } else {
            rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
        }


        if (symbolMode == "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {

                rSymbol = symbol + "-SPOT";
            }
        } else if (symbolMode == "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }

        return rSymbol;
    }

    private convertSymbolsInObject(obj: any, symbolsFields: Array<string> = ["coin", "symbol"], symbolMode: string = ""): any {

        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);   
        }
    
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode));
        }
    
        const convertedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = this.convertSymbol(value as string, "", symbolMode);

            } else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            } else {
                convertedObj[key] = this.convertSymbolsInObject(value, symbolsFields, symbolMode);
            }
        }
        return convertedObj;
    }
    private convertToNumber(value: any): any {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            } else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    }

    async getAllMids(raw_response: boolean = false): Promise<AllMids> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ALL_MIDS });

        if (raw_response) {
            return response;
        } else {
            const convertedResponse: any = {};
            for (const [key, value] of Object.entries(response)) {
                const convertedKey = this.convertSymbol(key);
                const convertedValue = parseFloat(value as string);
                convertedResponse[convertedKey] = convertedValue;
            }
            return convertedResponse;
        }
    }

    async getUserOpenOrders(user: string, raw_response: boolean = false): Promise<UserOpenOrders> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.OPEN_ORDERS, user: user });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getFrontendOpenOrders(user: string, raw_response: boolean = false): Promise<FrontendOpenOrders> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.FRONTEND_OPEN_ORDERS, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getUserFills(user: string, raw_response: boolean = false): Promise<UserFills> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_FILLS, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getUserFillsByTime(user: string, startTime: number, endTime?: number, raw_response: boolean = false): Promise<UserFills> {
        if (!raw_response) await this.ensureInitialized();

        let params: { user: string; startTime: number; type: string; endTime?: number } = {
            user: user,
            startTime: Math.round(startTime),
            type: CONSTANTS.INFO_TYPES.USER_FILLS_BY_TIME
        };
        
        if (endTime) {
            params.endTime = Math.round(endTime)
        }

        const response = await this.httpApi.makeRequest(params, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getUserRateLimit(user: string, raw_response: boolean = false): Promise<UserRateLimit> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.USER_RATE_LIMIT, user: user }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getOrderStatus(user: string, oid: number | string, raw_response: boolean = false): Promise<OrderStatus> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.ORDER_STATUS, user: user, oid: oid });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getL2Book(coin: string, raw_response: boolean = false): Promise<L2Book> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.L2_BOOK, coin: this.convertSymbol(coin, "reverse") });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getCandleSnapshot(coin: string, interval: string, startTime: number, endTime: number, raw_response: boolean = false): Promise<CandleSnapshot> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ 
            type: CONSTANTS.INFO_TYPES.CANDLE_SNAPSHOT, 
            req: { coin: this.convertSymbol(coin, "reverse"), interval: interval, startTime: startTime, endTime: endTime } 
        });

        return raw_response ? response : this.convertSymbolsInObject(response, ["s"]);
    }
}