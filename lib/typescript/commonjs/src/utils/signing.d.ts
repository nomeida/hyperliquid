import { HDNodeWallet, type Wallet } from 'ethers';
import type { OrderType, Signature, OrderRequest, CancelOrderRequest, OrderWire, Grouping } from '../types';
export declare function orderTypeToWire(orderType: OrderType): OrderType;
export declare function signL1Action(wallet: Wallet | HDNodeWallet, action: unknown, activePool: string | null, nonce: number, isMainnet: boolean): Promise<Signature>;
export declare function signUserSignedAction(wallet: Wallet, action: any, payloadTypes: Array<{
    name: string;
    type: string;
}>, primaryType: string, isMainnet: boolean): Promise<Signature>;
export declare function signUsdTransferAction(wallet: Wallet, action: any, isMainnet: boolean): Promise<Signature>;
export declare function signWithdrawFromBridgeAction(wallet: Wallet, action: any, isMainnet: boolean): Promise<Signature>;
export declare function signAgent(wallet: Wallet, action: any, isMainnet: boolean): Promise<Signature>;
export declare function floatToWire(x: number): string;
export declare function floatToIntForHashing(x: number): number;
export declare function floatToUsdInt(x: number): number;
export declare function getTimestampMs(): number;
export declare function orderRequestToOrderWires(order: OrderRequest, asset: number): OrderWire[];
export interface CancelOrderResponse {
    status: string;
    response: {
        type: string;
        data: {
            statuses: string[];
        };
    };
}
export declare function cancelOrderToAction(cancelRequest: CancelOrderRequest): any;
export declare function orderWiresToOrderAction(orderWires: OrderWire[], grouping: Grouping): any;
//# sourceMappingURL=signing.d.ts.map