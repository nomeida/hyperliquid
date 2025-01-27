
/*
 * @Author: Nw1996
 * @Date: 2025-01-27 09:08:46
 * @LastEditors: Nw1996
 * @LastEditTime: 2025-01-27 11:45:45
 * @Description: 
 * @FilePath: /hyperliquid/examples/ws_test.cjs
 */
const { Hyperliquid } = require("../dist/index");

const private_key = "";
const user_address = ""
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
        console.log('===subscribeToAllMids===', data[0]);
    });
    hlsdk.subscriptions.subscribeToUserFills(data1.apiKey, (data) => {
        console.log('===subscribeToUserFills===', data.fills[0]);
    });
    hlsdk.subscriptions.subscribeToOrderUpdates(data1.apiKey, (data => {
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
        // reconnect
        hlsdk.ws.on('reconnect', () => {
            subInfos()
        })

        
    } catch (error) {
        console.error('Error:', error);
    }
}
testWs()