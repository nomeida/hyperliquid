// test_exchange_api.ts

const { Hyperliquid } = require("../dist/index");
const readline = require("readline");
require("dotenv").config();

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
  const private_key = process.env.private_key;
  const user_address = process.env.user_address;
  const testnet = process.env.mainnet ? false : true;// false for mainnet, true for testnet
  const sdk = new Hyperliquid(private_key, testnet); 

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
  const private_key = process.env.private_key;
  const user_address = process.env.user_address;
  const testnet = process.env.mainnet ? false : true; // false for mainnet, true for testnet
  const sdk = new Hyperliquid(private_key, testnet); 
  try {
    console.log("Testing ExchangeAPI endpoints:");

    // 1. Place Order
    const orderRequest = {
      coin: "BTC-PERP",
      is_buy: true,
      sz: 0.001,
      limit_px: 59000,
      order_type: { limit: { tif: "Gtc" } },
      reduce_only: false,
      cloid: process.env.cloid,
    };

    console.log("\n1. Place Order:");
    const placeOrderResponse = await sdk.exchange.placeOrder(orderRequest);
    console.log(JSON.stringify(placeOrderResponse));
    await waitForUserInput("Press Enter to continue to Cancel Order...");

    // 2. Cancel Order
    const cancelRequest = {
      coin: "BTC-PERP",
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
      "BTC-PERP",
      process.env.cloid
    );
    console.log(JSON.stringify(cancelByCloidResponse));
    await waitForUserInput("Press Enter to continue to Modify Order...");

    // 4. Modify Order
    console.log("\n4. Modify Order:");
    // const placeOrderResponse = await sdk.exchange.placeOrder(orderRequest);
    // console.log(JSON.stringify(placeOrderResponse));
    const modifyOrderResponse = await sdk.exchange.modifyOrder(
      placeOrderResponse.response.data.statuses[0].resting.oid,
      {
        ...orderRequest,
        limit_px: 40000,
      }
    );
    console.log(modifyOrderResponse);
    await waitForUserInput("Press Enter to continue to Batch Modify Orders...");

    // 5. Batch Modify Orders
    console.log("\n5. Batch Modify Orders:");
    const batchModifyResponse = await sdk.exchange.batchModifyOrders([
      {
        oid: placeOrderResponse.response.data.statuses[0].resting.oid,
        order: { ...orderRequest, limit_px: 32000 },
      },
    ]);
    console.log(batchModifyResponse);
    console.log(batchModifyResponse.response.data.statuses);
    await waitForUserInput("Press Enter to continue to Update Leverage...");

    // 6. Update Leverage
    console.log("\n6. Update Leverage:");
    const updateLeverageResponse = await sdk.exchange.updateLeverage(
      "BTC-PERP",
      "cross",
      20
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
      "0x0C18ce20fA086ED8A1744367CeAa0605FF2A19aD",
      12
    );
    console.log(usdTransferResponse);
    await waitForUserInput("Press Enter to continue to Spot Transfer...");

    // 9. Spot Transfer --
    console.log("\n9. Spot Transfer:");
    const spotTransferResponse = await sdk.exchange.spotTransfer(
      "0x1F65dDE3EbEbfcb77aFD1c1059402a7227e190bB",
      "PURR-SPOT",
      "0.001"
    );
    console.log(spotTransferResponse);
    await waitForUserInput("Press Enter to continue to Initiate Withdrawal...");

    // 10. Initiate Withdrawal --
    console.log("\n10. Initiate Withdrawal:");
    const withdrawalResponse = await sdk.exchange.initiateWithdrawal(
      "0x1F65dDE3EbEbfcb77aFD1c1059402a7227e190bB",
      15.14
    );
    console.log(withdrawalResponse);
    await waitForUserInput(
      "Press Enter to continue to Transfer Between Spot and Perp..."
    );

    // 11. Transfer Between Spot and Perp
    console.log("\n11. Transfer Between Spot and Perp:");
    const transferResponse = await sdk.exchange.transferBetweenSpotAndPerp(
      15,
      false
    );
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
      "0x1962905b0a2d0ce7907ae1a0d17f3e4a1f63dfb7",
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
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

// testCustomExchangeAPI();
testExchangeAPI();
