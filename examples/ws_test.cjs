
/*
 * @Author: Nw1996
 * @Date: 2025-01-27 09:08:46
 * @LastEditors: Nw1996
 * @LastEditTime: 2025-01-27 12:05:11
 * @Description: 
 * @FilePath: /hyperliquid/examples/ws_test.cjs
 */
const { Hyperliquid } = require("../dist/index.cjs");

const private_key = "";
const user_address = "0x2711ce5de8b2Ddc8079622079A2fa1457dA78306"
const testnet = true// false for mainnet, true for testnet
const vaultAddress = null // or your vault address
const hlsdk = new Hyperliquid({
    privateKey: private_key,
    testnet: testnet,
    walletAddress: user_address,
    vaultAddress: vaultAddress,
    maxReconnectAttempts: 100
});
function subInfos() {
    hlsdk.subscriptions.subscribeToAllMids((data) => {
        console.log('===subscribeToAllMids===>HYPE-SPOT', data['HYPE-SPOT']);
    });
    hlsdk.subscriptions.subscribeToUserFills(user_address, (data) => {
        console.log('===subscribeToUserFills===', data.fills[0]);
    });
    hlsdk.subscriptions.subscribeToOrderUpdates(user_address, (data => {
        data.map(async v => {
            console.log('===subscribeToOrderUpdates===', v)
        })
    }))
}
async function testWs() {
    try {
        await hlsdk.connect();
        console.log('Connected to WebSocket');
        subInfos()
        setTimeout(() => {
            console.log('User CancleConnected to WebSocket');
            hlsdk.disconnect()
        }, 5*1000);
        // reconnect
        hlsdk.ws.on('reconnect', () => {
            subInfos()
        })

        
    } catch (error) {
        console.error('Error:', error);
    }
}
testWs()
// output
// WebSocket connected
// Connected to WebSocket
// ===subscribeToUserFills=== undefined
// ===subscribeToAllMids===>HYPE-SPOT 145.305
// ===subscribeToAllMids===>HYPE-SPOT 145.305
// ===subscribeToAllMids===>HYPE-SPOT 145.305
// User CancleConnected to WebSocket
// WebSocket disconnected
// Attempting to reconnect (1/100) in 1000ms...
// WebSocket connected
// ===subscribeToUserFills=== undefined
// ===subscribeToAllMids===>HYPE-SPOT 145.305
// ===subscribeToAllMids===>HYPE-SPOT 145.305
// ===subscribeToAllMids===>HYPE-SPOT 145.305