import { HttpApi } from './helpers';
import * as CONSTANTS from '../types/constants';
import { MetaAndAssetCtxs, SpotMetaAndAssetCtxs } from '../types';

export class SymbolConversion {
    private assetToIndexMap: Map<string, number> = new Map();
    private exchangeToInternalNameMap: Map<string, string> = new Map();
    private httpApi: HttpApi;
    private refreshIntervalMs: number = 60000;
    private refreshInterval: any = null;
    private initialized: boolean = false;

    constructor(baseURL: string, rateLimiter: any) {
        this.httpApi = new HttpApi(baseURL, CONSTANTS.ENDPOINTS.INFO, rateLimiter);
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        try {
            await this.refreshAssetMaps();
            this.startPeriodicRefresh();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize SymbolConversion:', error);
            throw error;
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('SymbolConversion must be initialized before use. Call initialize() first.');
        }
    }

    async getInternalName(exchangeName: string): Promise<string | undefined> {
        this.ensureInitialized();
        return this.exchangeToInternalNameMap.get(exchangeName);
    }

    private startPeriodicRefresh(): void {
        if (this.refreshInterval !== null) {
            clearInterval(this.refreshInterval);
        }
        
        // Use standard setInterval that works in both Node.js and browser
        this.refreshInterval = setInterval(() => {
            this.refreshAssetMaps().catch(console.error);
        }, this.refreshIntervalMs);
    }

    private async refreshAssetMaps(): Promise<void> {
        try {
            const [perpMeta, spotMeta] = await Promise.all([
                this.httpApi.makeRequest<MetaAndAssetCtxs>({ "type": CONSTANTS.InfoType.PERPS_META_AND_ASSET_CTXS }),
                this.httpApi.makeRequest<SpotMetaAndAssetCtxs>({ "type": CONSTANTS.InfoType.SPOT_META_AND_ASSET_CTXS })
            ]);

            this.assetToIndexMap.clear();
            this.exchangeToInternalNameMap.clear();
            
            // Handle perpetual assets
            perpMeta[0].universe.forEach((asset: { name: string }, index: number) => {
                const internalName = `${asset.name}-PERP`;
                this.assetToIndexMap.set(internalName, index);
                this.exchangeToInternalNameMap.set(asset.name, internalName);
            });

            // Handle spot assets
            spotMeta[0].tokens.forEach((token: any) => {
                const universeItem = spotMeta[0].universe.find((item: any) => item.tokens[0] === token.index);
                if (universeItem) {
                    const internalName = `${token.name}-SPOT`;
                    const exchangeName = universeItem.name;
                    const index = universeItem.index;
                    this.assetToIndexMap.set(internalName, 10000 + index);
                    this.exchangeToInternalNameMap.set(exchangeName, internalName);
                }
            });
        } catch (error) {
            console.error('Failed to refresh asset maps:', error);
        }
    }

    public async getExchangeName(internalName: string): Promise<string | undefined> {
        await this.ensureInitialized();
        for (const [exchangeName, name] of this.exchangeToInternalNameMap.entries()) {
            if (name === internalName) {
                return exchangeName;
            }
        }
        return undefined;
    }

    public async getAssetIndex(assetSymbol: string): Promise<number | undefined> {
        await this.ensureInitialized();
        return this.assetToIndexMap.get(assetSymbol);
    }

    public async getAllAssets(): Promise<{ perp: string[], spot: string[] }> {
        await this.ensureInitialized();
        const perp: string[] = [];
        const spot: string[] = [];

        for (const [asset, index] of this.assetToIndexMap.entries()) {
            if (asset.endsWith('-PERP')) {
                perp.push(asset);
            } else if (asset.endsWith('-SPOT')) {
                spot.push(asset);
            }
        }

        return { perp, spot };
    }

    async convertSymbol(symbol: string, mode: string = "", symbolMode: string = ""): Promise<string> {
        await this.ensureInitialized();
        let rSymbol: string;
        if (mode === "reverse") {
            for (const [key, value] of this.exchangeToInternalNameMap.entries()) {
                if (value === symbol) {
                    return key;
                }
            }
            rSymbol = symbol;
        } else {
            rSymbol = this.exchangeToInternalNameMap.get(symbol) || symbol;
        }

        if (symbolMode === "SPOT") {
            if (!rSymbol.endsWith("-SPOT")) {
                rSymbol = symbol + "-SPOT";
            }
        } else if (symbolMode === "PERP") {
            if (!rSymbol.endsWith("-PERP")) {
                rSymbol = symbol + "-PERP";
            }
        }

        return rSymbol;
    }

    async convertSymbolsInObject(obj: any, symbolsFields: Array<string> = ["coin", "symbol"], symbolMode: string = ""): Promise<any> {
        await this.ensureInitialized();
        if (typeof obj !== 'object' || obj === null) {
            return this.convertToNumber(obj);   
        }
    
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.convertSymbolsInObject(item, symbolsFields, symbolMode)));
        }
    
        const convertedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (symbolsFields.includes(key)) {
                convertedObj[key] = await this.convertSymbol(value as string, "", symbolMode);
            } else if (key === 'side') {
                convertedObj[key] = value === 'A' ? 'sell' : value === 'B' ? 'buy' : value;
            } else {
                convertedObj[key] = await this.convertSymbolsInObject(value, symbolsFields, symbolMode);
            }
        }
        return convertedObj;
    }

    convertToNumber(value: any): any {
        if (typeof value === 'string') {
            if (/^-?\d+$/.test(value)) {
                return parseInt(value, 10);
            } else if (/^-?\d*\.\d+$/.test(value)) {
                return parseFloat(value);
            }
        }
        return value;
    }

    async convertResponse(
        response: any,
        symbolsFields: string[] = ["coin", "symbol"],
        symbolMode: string = ""
    ): Promise<any> {
        return this.convertSymbolsInObject(response, symbolsFields, symbolMode);
    }
}