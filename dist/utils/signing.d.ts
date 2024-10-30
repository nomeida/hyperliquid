import type { OrderType, Signature, OrderRequest, CancelOrderRequest, OrderWire } from '../types';
import { TurnkeySigner } from '@alchemy/aa-signers';
export declare function orderTypeToWire(orderType: OrderType): OrderType;
export declare function signL1Action(turnkeySigner: TurnkeySigner, action: unknown, activePool: string | null, nonce: number, isMainnet: boolean): Promise<Signature>;
export declare function signUserSignedAction(turnkeySigner: TurnkeySigner, action: any, payloadTypes: Array<{
    name: string;
    type: string;
}>, primaryType: string, isMainnet: boolean): Promise<Signature>;
export declare function signUsdTransferAction(turnkeySigner: TurnkeySigner, action: any, isMainnet: boolean): Promise<Signature>;
export declare function signWithdrawFromBridgeAction(turnkeySigner: TurnkeySigner, action: any, isMainnet: boolean): Promise<Signature>;
export declare function signAgent(turnkeySigner: TurnkeySigner, action: any, isMainnet: boolean): Promise<Signature>;
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
