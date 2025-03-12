// test_exchange_api.ts

const { Hyperliquid } = require("../dist/index");
const readline = require("readline");
require("dotenv").config();

const cloid = "0x1234567890abcdef1234567890abcdef"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForUserInput(message) {
  return new Promise((resolve) => {
    rl.question(message, () => {
      resolve();
    });
  });
}

async function testCustomExchangeAPI() {
  // Initialize the SDK (replace with your actual private key and other necessary parameters)
  const private_key = process.env.priv_key;
  const user_address = ""
  const testnet = false// false for mainnet, true for testnet
  const vaultAddress = null // or your vault address
  const sdk = new Hyperliquid({
    privateKey: private_key,
    testnet: testnet,
    walletAddress: user_address,
    vaultAddress: vaultAddress
  }); 

  try {
    await sdk.initialize();
    console.log("Testing CustomOperations methods:");

    // 1. Get All Assets
    console.log("\n1. Getting All Assets...");
    const assets = await sdk.custom.getAllAssets();
    console.log("Available assets:", assets);
    await waitForUserInput("Press Enter to continue to Market Open...");

    // 2. Market Open (place a market order)
    console.log("\n2. Market Open (Buy)...");
    const marketOpenResponse = await sdk.custom.marketOpen(
      "SOL-PERP",  // symbol
      true,        // isBuy
      0.1,         // size
    );
    console.log("Market Open Response:", marketOpenResponse);
    await waitForUserInput("Press Enter to continue to Market Close...");

    // 3. Market Close (close a specific position)
    console.log("\n3. Market Close...");
    try {
      const marketCloseResponse = await sdk.custom.marketClose(
        "SOL-PERP",  // symbol
      );
      console.log("Market Close Response:", marketCloseResponse);
    } catch (error) {
      console.log("Market Close Error (may occur if no position exists):", error.message);
      
      // If no position exists, open a new one to close
      console.log("Creating a new position to close...");
      await sdk.custom.marketOpen("SOL-PERP", true, 0.1);
      const marketCloseResponse = await sdk.custom.marketClose("SOL-PERP");
      console.log("Market Close Response (after creating position):", marketCloseResponse);
    }
    await waitForUserInput("Press Enter to continue to Close All Positions...");

    // 4. Close All Positions
    console.log("\n4. Close All Positions...");
    try {
      // First create some positions if needed
      await sdk.custom.marketOpen("SOL-PERP", true, 0.1);
      await sdk.custom.marketOpen("ETH-PERP", false, 0.01);
      
      const closeAllResponse = await sdk.custom.closeAllPositions(0.05); // 5% slippage
      console.log("Close All Positions Response:", closeAllResponse);
    } catch (error) {
      console.log("Close All Positions Error:", error.message);
    }
    await waitForUserInput("Press Enter to continue to Cancel All Orders...");

    // 5. Cancel All Orders
    console.log("\n5. Cancelling All Orders...");
    // Place some orders first
    await sdk.exchange.placeOrder({
      coin: "SOL-PERP",
      is_buy: true,
      sz: 0.1,
      limit_px: 100.0, // Far from market price to avoid execution
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: cloid
    });
    
    await sdk.exchange.placeOrder({
      coin: "BTC-PERP",
      is_buy: false,
      sz: 0.001,
      limit_px: 100000.0, // Far from market price to avoid execution
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: cloid
    });
    
    const cancelResponse = await sdk.custom.cancelAllOrders();
    console.log("Cancel All Orders Response:", cancelResponse);
    
    // 6. Cancel All Orders for a specific symbol
    console.log("\n6. Cancelling All Orders for a specific symbol...");
    // Place an order first
    await sdk.exchange.placeOrder({
      coin: "ETH-PERP",
      is_buy: true,
      sz: 0.01,
      limit_px: 1000.0, // Far from market price to avoid execution
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: cloid
    });
    
    const cancelSymbolResponse = await sdk.custom.cancelAllOrders("ETH-PERP");
    console.log("Cancel Symbol Orders Response:", cancelSymbolResponse);
    
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

async function testExchangeAPI() {
  // Initialize the SDK (replace with your actual private key and other necessary parameters)
  const private_key = process.env.priv_key;
  const user_address = ""
  const testnet = false// false for mainnet, true for testnet
  const vaultAddress = null // or your vault address
  const sdk = new Hyperliquid({
    privateKey: private_key,
    testnet: testnet,
    walletAddress: user_address,
    vaultAddress: vaultAddress
  }); 
  try {
    console.log("Testing ExchangeAPI endpoints:");


    await waitForUserInput("Press Enter to continue to Place Order...");

    // 1. Place Order
    const orderRequest = {
      coin: "SOL-PERP",
      is_buy: true,
      sz: 0.30,
      limit_px: 127.500000000,
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: cloid
    };

    // If you want to place multiple orders, you need to call placeOrder separately for each order
    // const secondOrderRequest = {
    //   coin: "SOL-PERP",
    //   is_buy: false,
    //   sz: 0.2,
    //   limit_px: 125.15,
    //   order_type: { limit: { tif: "Gtc" } },
    //   reduce_only: false,
    //   cloid: cloid
    // };

    await sdk.initialize();
    const state = await sdk.info.perpetuals.getClearinghouseState(user_address);
    console.log('Account Value:', state.marginSummary.accountValue);

    // const approveFeeResponse = await sdk.exchange.approveBuilderFee({
    //   builder: "0xd272c0adCc36f5bAEF44BCcEa23A61E9cc6B8EF3",
    //   maxFeeRate: "0.01%",
    // });
    // console.log(approveFeeResponse);
    

    console.log("\n1. Place Order:");
    const placeOrderResponse = await sdk.exchange.placeOrder(orderRequest);
    console.log(JSON.stringify(placeOrderResponse));
    await waitForUserInput("Press Enter to continue to Cancel Order...");

    // 2. Cancel Order
    const cancelRequest = {
      coin: "SOL-PERP",
      o: placeOrderResponse.response.data.statuses[0].resting.oid, // assuming this is where the order ID is
    };
    console.log("\n2. Cancel Order:");
    const cancelOrderResponse = await sdk.exchange.cancelOrder(cancelRequest);
    console.log(JSON.stringify(cancelOrderResponse));
    await waitForUserInput(
      "Press Enter to continue to Cancel Order by CLOID..."
    );

    // 3. Cancel Order by CLOID
    console.log("\n3. Cancel Order by CLOID:");
    const placeOrderResponse2 = await sdk.exchange.placeOrder(orderRequest);
    console.log(JSON.stringify(placeOrderResponse2));
    const cancelByCloidResponse = await sdk.exchange.cancelOrderByCloid(
      "SOL-PERP",
      cloid
    );
    console.log(JSON.stringify(cancelByCloidResponse));
    await waitForUserInput("Press Enter to continue to Modify Order...");

    // 4. Modify Order
    console.log("\n4. Modify Order:");
    const modifyOrderResponse = await sdk.exchange.modifyOrder(
      placeOrderResponse.response.data.statuses[0].resting.oid,
      {
        ...orderRequest,
        limit_px: 121.49,
      }
    );
    console.log(modifyOrderResponse);
    await waitForUserInput("Press Enter to continue to Batch Modify Orders...");

    // 5. Batch Modify Orders
    console.log("\n5. Batch Modify Orders:");
    const batchModifyResponse = await sdk.exchange.batchModifyOrders([
      {
        oid: placeOrderResponse.response.data.statuses[0].resting.oid,
        order: { ...orderRequest, limit_px: 155.3 },
      },
    ]);
    console.log(batchModifyResponse);
    console.log(batchModifyResponse.response.data.statuses);
    await waitForUserInput("Press Enter to continue to Update Leverage...");

    // 6. Update Leverage
    console.log("\n6. Update Leverage:");
    const updateLeverageResponse = await sdk.exchange.updateLeverage(
      "SOL-PERP",
      "isolated",
      15
    );
    console.log(updateLeverageResponse);
    await waitForUserInput(
      "Press Enter to continue to Update Isolated Margin..."
    );

    // 7. Update Isolated Margin
    console.log("\n7. Update Isolated Margin:");
    const updateMarginResponse = await sdk.exchange.updateIsolatedMargin(
      "BTC-PERP",
      true,
      100
    );
    console.log(updateMarginResponse);
    await waitForUserInput("Press Enter to continue to USD Transfer...");

    // 8. USD Transfer
    console.log("\n8. USD Transfer:");
    const usdTransferResponse = await sdk.exchange.usdTransfer(
      "",
      12
    );
    console.log(usdTransferResponse);
    await waitForUserInput("Press Enter to continue to Spot Transfer...");

    // 9. Spot Transfer --
    console.log("\n9. Spot Transfer:");
    const spotTransferResponse = await sdk.exchange.spotTransfer(
      "",
      "PURR-SPOT",
      "0.001"
    );
    console.log(spotTransferResponse);
    await waitForUserInput("Press Enter to continue to Initiate Withdrawal...");

    // 10. Initiate Withdrawal --
    console.log("\n10. Initiate Withdrawal:");
    const withdrawalResponse = await sdk.exchange.initiateWithdrawal(
      "",
      15.14
    );
    console.log(withdrawalResponse);
    await waitForUserInput(
      "Press Enter to continue to Transfer Between Spot and Perp..."
    );

    // 11. Transfer Between Spot and Perp
    console.log("\n11. Transfer Between Spot and Perp:");

    const transferResponse = await sdk.exchange.transferBetweenSpotAndPerp(0.1, true);
    console.log(transferResponse);
    await waitForUserInput("Press Enter to continue to Schedule Cancel...");

    // 12. Schedule Cancel
    console.log("\n12. Schedule Cancel:");
    const scheduleCancelResponse = await sdk.exchange.scheduleCancel(
      Date.now() + 3600000
    ); // Cancel in 1 hour
    console.log(scheduleCancelResponse);
    await waitForUserInput("Press Enter to continue to Vault Transfer...");

    // 13. Vault Transfer
    console.log("\n13. Vault Transfer:");
    const vaultTransferResponse = await sdk.exchange.vaultTransfer(
      "",
      true,
      4
    );
    console.log(vaultTransferResponse);
    await waitForUserInput("Press Enter to continue to Set Referrer...");

    // 14. Set Referrer
    console.log("\n14. Set Referrer:");
    const setReferrerResponse = await sdk.exchange.setReferrer(
      "referrer_code_here"
    );
    console.log(setReferrerResponse);

    await waitForUserInput("Press Enter to continue to Place TWAP order...");

    // 15. Place TWAP order 
    console.log("\n15. Place TWAP order:");
    const twapOrderResponse = await sdk.exchange.placeTwapOrder({
      coin: "BTC-PERP",
      is_buy: true,
      sz: 0.001,
      reduce_only: false,
      minutes: 10,
      randomize: false
    });
    console.log(twapOrderResponse);

    await waitForUserInput("Press Enter to continue to Cancel TWAP order...");

    // 16. Cancel TWAP order
    console.log("\n16. Cancel TWAP order:");
    const cancelTwapOrderResponse = await sdk.exchange.cancelTwapOrder(twapOrderResponse.response.data.status.running.twapId);
    console.log(cancelTwapOrderResponse);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }

  // 17. Approve Agent
  console.log("\n17. Approve Agent:");
  const approveAgentResponse = await sdk.exchange.approveAgent({
    agentAddress : "0x1234567890123456789012345678901234567890", //Replace this with a valid agentAddress, can generate one from the Hyperliquid UI
    agentName    : "testAgent1" // Optional, just a name so you can identify the agent wallet, max 1 unnammed api agent and 2-3 named ones allowed
  });
  console.log(approveAgentResponse);

  await waitForUserInput("Press Enter to continue to Approve Builder Fee...");

  // 18. Approve Builder Fee
  console.log("\n18. Approve Builder Fee:");
  const approveBuilderFeeResponse = await sdk.exchange.approveBuilderFee({
    maxFeeRate : "0.001%", // 0.001% fee rate
    builder    : "0x1234567890123456789012345678901234567890"
  });
  console.log(approveBuilderFeeResponse);

  await waitForUserInput("Press Enter to continue to Modify User EVM...");

  // 19. Modify User EVM
  console.log("\n19. Modify User EVM:");
  const modifyUserEvmResponse = await sdk.exchange.modifyUserEvm(true);
  console.log(modifyUserEvmResponse);

  await waitForUserInput("Press Enter to continue to Deposit to Staking...");
}

testCustomExchangeAPI();
// testExchangeAPI();
