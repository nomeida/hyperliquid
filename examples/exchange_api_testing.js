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
  const private_key = "";
  const user_address = ""
  const testnet = true// false for mainnet, true for testnet
  const vaultAddress = null // or your vault address
  const sdk = new Hyperliquid(private_key, testnet, user_address, vaultAddress); 

  try {
    const cancelResponse = await sdk.custom.cancelAllOrders();
    console.log(cancelResponse);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

async function testExchangeAPI() {
  // Initialize the SDK (replace with your actual private key and other necessary parameters)
  const private_key = "";
  const user_address = ""
  const testnet = true// false for mainnet, true for testnet
  const vaultAddress = null // or your vault address
  const sdk = new Hyperliquid(private_key, testnet, user_address, vaultAddress); 
  try {
    console.log("Testing ExchangeAPI endpoints:");

    // 1. Place Order
    const orderRequest = {
      coin: "SOL-PERP",
      is_buy: true,
      sz: 15,
      limit_px: 180,
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: cloid,
    };

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
    // const placeOrderResponse = await sdk.exchange.placeOrder(orderRequest);
    // console.log(JSON.stringify(placeOrderResponse));
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
        limit_px: 170,
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
}

// testCustomExchangeAPI();
testExchangeAPI();
