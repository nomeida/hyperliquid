import { Meta, MetaAndAssetCtxs, ClearinghouseState, UserFunding, UserNonFundingLedgerUpdates, FundingHistory } from '../../types';
import { HttpApi } from '../../utils/helpers';
import * as CONSTANTS from '../../types/constants';

export class PerpetualsInfoAPI {
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

    async getMeta(raw_response: boolean = false): Promise<Meta> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.META });
        return raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "PERP");
    }

    async getMetaAndAssetCtxs(raw_response: boolean = false): Promise<MetaAndAssetCtxs> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.PERPS_META_AND_ASSET_CTXS });
        return raw_response ? response : this.convertSymbolsInObject(response, ["name", "coin", "symbol"], "PERP");
    }

    async getClearinghouseState(user: string, raw_response: boolean = false): Promise<ClearinghouseState> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ type: CONSTANTS.INFO_TYPES.PERPS_CLEARINGHOUSE_STATE, user: user });
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getUserFunding(user: string, startTime: number, endTime?: number, raw_response: boolean = false): Promise<UserFunding> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ 
                type: CONSTANTS.INFO_TYPES.USER_FUNDING, 
                user: user,
                startTime: startTime,
                endTime: endTime
            }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getUserNonFundingLedgerUpdates(user: string, startTime: number, endTime?: number, raw_response: boolean = false): Promise<UserNonFundingLedgerUpdates> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ 
                type: CONSTANTS.INFO_TYPES.USER_NON_FUNDING_LEDGER_UPDATES, 
                user: user,
                startTime: startTime,
                endTime: endTime
            }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }

    async getFundingHistory(coin: string, startTime: number, endTime?: number, raw_response: boolean = false): Promise<FundingHistory> {
        if (!raw_response) await this.ensureInitialized();
        const response = await this.httpApi.makeRequest({ 
                type: CONSTANTS.INFO_TYPES.FUNDING_HISTORY, 
                coin: this.convertSymbol(coin, "reverse"), 
                startTime: startTime, 
                endTime: endTime 
            }, 20);
        return raw_response ? response : this.convertSymbolsInObject(response);
    }
}