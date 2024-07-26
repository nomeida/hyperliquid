import { ethers } from "ethers";
import { OrderType, Signature, OrderRequest, CancelOrderRequest, OrderWire } from '../types/index';
export declare function orderTypeToWire(orderType: OrderType): OrderType;
export declare function signL1Action(wallet: ethers.Wallet, action: unknown, activePool: string | null, nonce: number): Promise<Signature>;
export declare function signUserSignedAction(wallet: ethers.Wallet, action: any, payloadTypes: Array<{
    name: string;
    type: string;
}>, primaryType: string): Promise<Signature>;
export declare function signUsdTransferAction(wallet: ethers.Wallet, action: any): Promise<Signature>;
export declare function signWithdrawFromBridgeAction(wallet: ethers.Wallet, action: any): Promise<Signature>;
export declare function signAgent(wallet: ethers.Wallet, action: any): Promise<Signature>;
export declare function floatToWire(x: number): string;
export declare function floatToIntForHashing(x: number): number;
export declare function floatToUsdInt(x: number): number;
export declare function getTimestampMs(): number;
export declare function orderRequestToOrderWire(order: OrderRequest, asset: number): OrderWire;
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
export declare function orderWiresToOrderAction(orderWires: OrderWire[]): any;
