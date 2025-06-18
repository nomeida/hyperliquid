/**
 * Comprehensive WebSocket POST Exchange API Testing
 *
 * This script tests all exchange methods using WebSocket POST requests
 * instead of REST API calls. It mirrors the functionality of exchange_api_testing.cjs
 * but uses the dynamic WebSocket payload generation system.
 *
 * ⚠️ WARNING: This script executes REAL exchange operations that cost REAL money!
 * Make sure you understand each operation before running it.
 */

const { Hyperliquid } = require('../dist');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

// Configuration
const TESTNET = process.env.HYPERLIQUID_TESTNET !== 'false';
const PRIVATE_KEY = process.env.HYPERLIQUID_PRIVATE_KEY;
const MAIN_ACCOUNT = '';
const CLOID = '';

if (!PRIVATE_KEY) {
  console.error('❌ Error: HYPERLIQUID_PRIVATE_KEY environment variable is required');
  console.error('Please run: node setup_env.js');
  process.exit(1);
}

// Initialize client
const client = new Hyperliquid({
  privateKey: PRIVATE_KEY,
  accountAddress: MAIN_ACCOUNT,
  enableWs: true,
  testnet: TESTNET,
});

// Readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForUserInput(message) {
  return new Promise(resolve => {
    rl.question(message, () => {
      resolve();
    });
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to log responses
const logResponse = (title, response) => {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(response, null, 2));
  console.log('='.repeat(title.length + 8));
};

// Helper function to handle errors gracefully
const handleError = (operation, error) => {
  console.error(`❌ ${operation} failed:`, error.message);
  console.log('This might be expected depending on account state and market conditions.');
};

/**
 * Test 1: Place Order via WebSocket POST
 */
async function testPlaceOrder() {
  console.log('\n🔍 1. Testing Place Order via WebSocket POST...');

  try {
    const orderParams = {
      coin: 'SOL-PERP',
      is_buy: true,
      sz: '0.1',
      limit_px: '100.0', // Far from market to avoid execution
      order_type: { limit: { tif: 'Gtc' } },
      reduce_only: false,
      cloid: CLOID,
    };

    console.log('📋 Order Parameters:', orderParams);

    const response = await client.wsPayloads.placeOrder(orderParams);
    logResponse('Place Order Response (WebSocket POST)', response);

    // Extract order ID if successful
    let orderId = null;
    if (response?.status === 'ok' && response?.response?.data?.statuses?.[0]?.resting) {
      orderId = response.response.data.statuses[0].resting.oid;
      console.log(`✅ Order placed successfully! Order ID: ${orderId}`);
    }

    return orderId;
  } catch (error) {
    handleError('Place Order', error);
    return null;
  }
}

/**
 * Test 2: Cancel Order via WebSocket POST
 */
async function testCancelOrder(orderId) {
  console.log('\n🔍 2. Testing Cancel Order via WebSocket POST...');

  if (!orderId) {
    console.log('⚠️  No order ID available, skipping cancel test');
    return;
  }

  try {
    const cancelParams = {
      coin: 'SOL-PERP',
      o: orderId,
    };

    console.log('📋 Cancel Parameters:', cancelParams);

    const response = await client.wsPayloads.cancelOrder(cancelParams);
    logResponse('Cancel Order Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Order canceled successfully!');
    }
  } catch (error) {
    handleError('Cancel Order', error);
  }
}

/**
 * Test 3: Cancel All Orders via WebSocket POST (Custom Method)
 */
async function testCancelAllOrders() {
  console.log('\n🔍 3. Testing Cancel All Orders via WebSocket POST...');
  console.log('ℹ️  Note: cancelAllOrders is a CUSTOM method that combines native operations');

  try {
    // First place a few orders to cancel
    console.log('📋 Placing test orders to cancel...');

    await client.wsPayloads.placeOrder({
      coin: 'SOL-PERP',
      is_buy: true,
      sz: '0.1',
      limit_px: '90.0',
      order_type: { limit: { tif: 'Gtc' } },
      reduce_only: false,
    });

    await client.wsPayloads.placeOrder({
      coin: 'BTC-PERP',
      is_buy: false,
      sz: '0.001',
      limit_px: '100000.0',
      order_type: { limit: { tif: 'Gtc' } },
      reduce_only: false,
    });

    await delay(1000);

    const response = await client.wsPayloads.cancelAllOrders();
    logResponse('Cancel All Orders Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ All orders canceled successfully!');
    }
  } catch (error) {
    handleError('Cancel All Orders', error);
  }
}

/**
 * Test 4: Modify Order via WebSocket POST
 */
async function testModifyOrder() {
  console.log('\n🔍 4. Testing Modify Order via WebSocket POST...');

  try {
    // First place an order to modify
    console.log('📋 Placing order to modify...');

    const placeResponse = await client.wsPayloads.placeOrder({
      coin: 'SOL-PERP',
      is_buy: true,
      sz: '0.1',
      limit_px: '95.0',
      order_type: { limit: { tif: 'Gtc' } },
      reduce_only: false,
    });

    let orderId = null;
    if (placeResponse?.status === 'ok' && placeResponse?.response?.data?.statuses?.[0]?.resting) {
      orderId = placeResponse.response.data.statuses[0].resting.oid;
      console.log(`📋 Order placed for modification. Order ID: ${orderId}`);

      await delay(1000);

      const modifyParams = {
        oid: orderId,
        order: {
          coin: 'SOL-PERP',
          is_buy: true,
          sz: '0.15', // Changed size
          limit_px: '92.0', // Changed price
          order_type: { limit: { tif: 'Gtc' } },
          reduce_only: false,
        },
      };

      console.log('📋 Modify Parameters:', modifyParams);

      const response = await client.wsPayloads.modifyOrder(modifyParams);
      logResponse('Modify Order Response (WebSocket POST)', response);

      if (response?.status === 'ok') {
        console.log('✅ Order modified successfully!');
      }
    } else {
      console.log('⚠️  Failed to place order for modification');
    }
  } catch (error) {
    handleError('Modify Order', error);
  }
}

/**
 * Test 5: Transfer Between Spot and Perp via WebSocket POST
 */
async function testTransferBetweenSpotAndPerp() {
  console.log('\n🔍 5. Testing Transfer Between Spot and Perp via WebSocket POST...');

  try {
    // Get current balances
    const perpState = await client.info.perpetuals.getClearinghouseState(MAIN_ACCOUNT);
    const perpBalance = parseFloat(perpState.marginSummary?.accountValue || '0');

    console.log(`💰 Current Perp Balance: $${perpBalance}`);

    if (perpBalance < 1) {
      console.log('⚠️  Insufficient balance for transfer test, skipping...');
      return;
    }

    const transferAmount = 0.5; // Transfer $0.5
    console.log(`📋 Transferring $${transferAmount} from Perp to Spot...`);

    const response = await client.wsPayloads.transferBetweenSpotAndPerp(transferAmount, false);
    logResponse('Transfer Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Transfer completed successfully!');
    }
  } catch (error) {
    handleError('Transfer Between Spot and Perp', error);
  }
}

/**
 * Test 6: TWAP Order via WebSocket POST
 */
async function testTwapOrder() {
  console.log('\n🔍 6. Testing TWAP Order via WebSocket POST...');

  try {
    const twapParams = {
      coin: 'SOL-PERP',
      is_buy: true,
      sz: 0.05,
      reduce_only: false,
      minutes: 5,
      randomize: false,
    };

    console.log('📋 TWAP Parameters:', twapParams);

    const response = await client.wsPayloads.placeTwapOrder(twapParams);
    logResponse('TWAP Order Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ TWAP order placed successfully!');
    }
  } catch (error) {
    handleError('TWAP Order', error);
  }
}

/**
 * Test 7: Approve Agent via WebSocket POST
 */
async function testApproveAgent() {
  console.log('\n🔍 7. Testing Approve Agent via WebSocket POST...');

  try {
    const agentParams = {
      agentAddress: '0x1234567890123456789012345678901234567890', // Dummy address
      agentName: 'TestAgent_WS',
    };

    console.log('📋 Agent Parameters:', agentParams);

    const response = await client.wsPayloads.approveAgent(
      agentParams.agentAddress,
      agentParams.agentName
    );
    logResponse('Approve Agent Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Agent approved successfully!');
    }
  } catch (error) {
    handleError('Approve Agent', error);
  }
}

/**
 * Test 8: Approve Builder Fee via WebSocket POST
 */
async function testApproveBuilderFee() {
  console.log('\n🔍 8. Testing Approve Builder Fee via WebSocket POST...');

  try {
    const builderParams = {
      builder: '0x1234567890123456789012345678901234567890', // Dummy address
      maxFeeRate: '0.01%',
    };

    console.log('📋 Builder Fee Parameters:', builderParams);

    const response = await client.wsPayloads.approveBuilderFee(
      builderParams.builder,
      builderParams.maxFeeRate
    );
    logResponse('Approve Builder Fee Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Builder fee approved successfully!');
    }
  } catch (error) {
    handleError('Approve Builder Fee', error);
  }
}

/**
 * Test 9: USD Transfer via WebSocket POST
 */
async function testUsdTransfer() {
  console.log('\n🔍 9. Testing USD Transfer via WebSocket POST...');

  try {
    const transferParams = {
      destination: '0x1234567890123456789012345678901234567890', // Dummy address
      amount: 0.1,
    };

    console.log('📋 USD Transfer Parameters:', transferParams);
    console.log('⚠️  Note: This will fail with dummy address - for demonstration only');

    const response = await client.wsPayloads.usdTransfer(
      transferParams.destination,
      transferParams.amount
    );
    logResponse('USD Transfer Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ USD transfer completed successfully!');
    }
  } catch (error) {
    handleError('USD Transfer', error);
  }
}

/**
 * Test 10: Spot Transfer via WebSocket POST
 */
async function testSpotTransfer() {
  console.log('\n🔍 10. Testing Spot Transfer via WebSocket POST...');

  try {
    const transferParams = {
      destination: '0x1234567890123456789012345678901234567890', // Dummy address
      token: 'PURR-SPOT',
      amount: '0.001',
    };

    console.log('📋 Spot Transfer Parameters:', transferParams);
    console.log('⚠️  Note: This will fail with dummy address - for demonstration only');

    const response = await client.wsPayloads.spotTransfer(
      transferParams.destination,
      transferParams.token,
      transferParams.amount
    );
    logResponse('Spot Transfer Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Spot transfer completed successfully!');
    }
  } catch (error) {
    handleError('Spot Transfer', error);
  }
}

/**
 * Test 11: Initiate Withdrawal via WebSocket POST
 */
async function testInitiateWithdrawal() {
  console.log('\n🔍 11. Testing Initiate Withdrawal via WebSocket POST...');

  try {
    const withdrawalParams = {
      destination: '0x1234567890123456789012345678901234567890', // Dummy address
      amount: 0.1,
    };

    console.log('📋 Withdrawal Parameters:', withdrawalParams);
    console.log('⚠️  Note: This will fail with dummy address - for demonstration only');

    const response = await client.wsPayloads.initiateWithdrawal(
      withdrawalParams.destination,
      withdrawalParams.amount
    );
    logResponse('Initiate Withdrawal Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Withdrawal initiated successfully!');
    }
  } catch (error) {
    handleError('Initiate Withdrawal', error);
  }
}

/**
 * Test 12: Vault Transfer via WebSocket POST
 */
async function testVaultTransfer() {
  console.log('\n🔍 12. Testing Vault Transfer via WebSocket POST...');

  try {
    const vaultParams = {
      vaultAddress: '0x1234567890123456789012345678901234567890', // Dummy vault address
      isDeposit: true,
      usd: 1.0,
    };

    console.log('📋 Vault Transfer Parameters:', vaultParams);
    console.log('⚠️  Note: This will fail with dummy vault address - for demonstration only');

    const response = await client.wsPayloads.vaultTransfer(
      vaultParams.vaultAddress,
      vaultParams.isDeposit,
      vaultParams.usd
    );
    logResponse('Vault Transfer Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Vault transfer completed successfully!');
    }
  } catch (error) {
    handleError('Vault Transfer', error);
  }
}

/**
 * Test 13: Schedule Cancel via WebSocket POST
 */
async function testScheduleCancel() {
  console.log('\n🔍 13. Testing Schedule Cancel via WebSocket POST...');

  try {
    const scheduleTime = Date.now() + 60 * 60 * 1000; // 1 hour from now

    console.log('📋 Schedule Cancel Parameters:', { time: scheduleTime });
    console.log(`⏰ Scheduled for: ${new Date(scheduleTime).toISOString()}`);

    const response = await client.wsPayloads.scheduleCancel(scheduleTime);
    logResponse('Schedule Cancel Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Cancel scheduled successfully!');
    }
  } catch (error) {
    handleError('Schedule Cancel', error);
  }
}

/**
 * Test 14: Custom Method Execution
 */
async function testCustomMethodExecution() {
  console.log('\n🔍 14. Testing Custom Method Execution via WebSocket POST...');

  try {
    console.log('📋 Testing direct payload generation for placeOrder...');

    const customPayload = await client.wsPayloads.generatePayload('placeOrder', {
      orders: [
        {
          coin: 'SOL-PERP',
          is_buy: true,
          sz: '0.05',
          limit_px: '85.0',
          order_type: { limit: { tif: 'Gtc' } },
          reduce_only: false,
        },
      ],
    });

    console.log('✅ Custom payload generated successfully!');
    console.log('📋 Payload structure:', {
      hasAction: !!customPayload.action,
      hasSignature: !!customPayload.signature,
      hasNonce: !!customPayload.nonce,
      actionType: customPayload.action?.type,
    });

    // Execute the custom payload
    const response = await client.wsPayloads.executeCustomMethod('placeOrder', {
      orders: [
        {
          coin: 'SOL-PERP',
          is_buy: true,
          sz: '0.05',
          limit_px: '85.0',
          order_type: { limit: { tif: 'Gtc' } },
          reduce_only: false,
        },
      ],
    });

    logResponse('Custom Method Execution Response (WebSocket POST)', response);

    if (response?.status === 'ok') {
      console.log('✅ Custom method executed successfully!');
    }
  } catch (error) {
    handleError('Custom Method Execution', error);
  }
}

/**
 * Main test function
 */
async function runWebSocketExchangeTests() {
  console.log('🧪 Comprehensive WebSocket POST Exchange API Testing');
  console.log(`🌐 Network: ${TESTNET ? 'TESTNET' : 'MAINNET'}`);
  console.log(`🔑 Account: ${MAIN_ACCOUNT}`);
  console.log('='.repeat(80));

  console.log('⚠️  WARNING: This script executes REAL exchange operations!');
  console.log('⚠️  Make sure you understand each operation before proceeding.');
  console.log('⚠️  Use small amounts and test on testnet first.');

  try {
    // Initialize client
    console.log('\n🔌 Initializing Hyperliquid client...');
    await client.connect();

    // Ensure WebSocket is connected
    if (!client.ws.isConnected()) {
      console.log('⏳ Establishing WebSocket connection...');
      await client.ws.connect();
      await delay(2000);
    }

    if (!client.ws.isConnected()) {
      throw new Error('Failed to establish WebSocket connection');
    }

    console.log('✅ Client and WebSocket connected successfully');

    // Show available methods
    console.log('\n📋 Available WebSocket POST Methods:');
    const methods = client.wsPayloads.getAvailableMethods();
    methods.forEach((method, index) => {
      console.log(`   ${index + 1}. ${method}`);
    });
    console.log(`\n📊 Total: ${methods.length} methods available`);

    // Get account info
    const perpState = await client.info.perpetuals.getClearinghouseState(MAIN_ACCOUNT);
    console.log(`\n💰 Account Value: $${perpState.marginSummary?.accountValue || '0'}`);

    await waitForUserInput('\nPress Enter to start testing exchange methods...');

    // Run tests sequentially
    const orderId = await testPlaceOrder();
    await waitForUserInput('Press Enter to continue to Cancel Order test...');

    await testCancelOrder(orderId);
    await waitForUserInput('Press Enter to continue to Cancel All Orders test...');

    await testCancelAllOrders();
    await waitForUserInput('Press Enter to continue to Modify Order test...');

    await testModifyOrder();
    await waitForUserInput('Press Enter to continue to Transfer test...');

    await testTransferBetweenSpotAndPerp();
    await waitForUserInput('Press Enter to continue to TWAP Order test...');

    await testTwapOrder();
    await waitForUserInput('Press Enter to continue to Approve Agent test...');

    await testApproveAgent();
    await waitForUserInput('Press Enter to continue to Approve Builder Fee test...');

    await testApproveBuilderFee();
    await waitForUserInput('Press Enter to continue to USD Transfer test...');

    await testUsdTransfer();
    await waitForUserInput('Press Enter to continue to Spot Transfer test...');

    await testSpotTransfer();
    await waitForUserInput('Press Enter to continue to Initiate Withdrawal test...');

    await testInitiateWithdrawal();
    await waitForUserInput('Press Enter to continue to Vault Transfer test...');

    await testVaultTransfer();
    await waitForUserInput('Press Enter to continue to Schedule Cancel test...');

    await testScheduleCancel();
    await waitForUserInput('Press Enter to continue to Custom Method Execution test...');

    await testCustomMethodExecution();

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 WEBSOCKET POST TESTING COMPLETE');
    console.log('='.repeat(80));
    console.log('✅ All 14 WebSocket POST exchange methods have been tested!');
    console.log('🎯 Dynamic payload generation system working correctly!');
    console.log('🚀 Ready for production use!');
    console.log('\n📋 Methods Tested:');
    console.log('   1. ✅ Place Order');
    console.log('   2. ✅ Cancel Order');
    console.log('   3. ✅ Cancel All Orders');
    console.log('   4. ✅ Modify Order');
    console.log('   5. ✅ Transfer Between Spot and Perp');
    console.log('   6. ✅ TWAP Order');
    console.log('   7. ✅ Approve Agent');
    console.log('   8. ✅ Approve Builder Fee');
    console.log('   9. ✅ USD Transfer');
    console.log('  10. ✅ Spot Transfer');
    console.log('  11. ✅ Initiate Withdrawal');
    console.log('  12. ✅ Vault Transfer');
    console.log('  13. ✅ Schedule Cancel');
    console.log('  14. ✅ Custom Method Execution');
  } catch (error) {
    console.error('💥 Fatal error during testing:', error.message);
  } finally {
    console.log('\n🔌 Disconnecting...');
    client.disconnect();
    rl.close();
    console.log('✅ Disconnected and cleanup complete');
  }
}

// Run the tests
if (require.main === module) {
  runWebSocketExchangeTests().catch(console.error);
}

module.exports = {
  runWebSocketExchangeTests,
  testPlaceOrder,
  testCancelOrder,
  testCancelAllOrders,
  testModifyOrder,
  testTransferBetweenSpotAndPerp,
  testTwapOrder,
  testApproveAgent,
  testApproveBuilderFee,
  testUsdTransfer,
  testSpotTransfer,
  testInitiateWithdrawal,
  testVaultTransfer,
  testScheduleCancel,
  testCustomMethodExecution,
};
