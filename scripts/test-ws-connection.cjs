'use strict';

const { Hyperliquid } = require('../dist/index.js');

const TRADE_COIN = process.env.HL_TEST_TRADE_COIN || 'BTC-PERP';
const MIN_SUBSCRIPTION_MS = parseInt(process.env.HL_TEST_MIN_RUNTIME_MS || '5000', 10);
const MAX_WAIT_MS = parseInt(process.env.HL_TEST_TIMEOUT_MS || '15000', 10);
const SAMPLE_TRADES_COUNT = parseInt(process.env.HL_TEST_SAMPLE_COUNT || '3', 10);
const LOG_FULL_PAYLOAD =
  process.env.HL_TEST_LOG_FULL === '1' || process.env.HL_TEST_LOG_FULL === 'true';
const USE_TESTNET = process.env.HL_TEST_TESTNET === '1' || process.env.HL_TEST_TESTNET === 'true';

const formatSampleTrades = trades => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return '[]';
  }

  const sample = trades.slice(0, SAMPLE_TRADES_COUNT);
  return JSON.stringify(sample, null, 2);
};

async function runSubscriptionTest(sdk) {
  const receivedPayloads = [];
  const startTime = Date.now();

  let resolvePromise;
  let rejectPromise;
  let settled = false;
  let minTimer;
  let maxTimer;

  const settle = error => {
    if (settled) {
      return;
    }
    settled = true;
    clearTimeout(minTimer);
    clearTimeout(maxTimer);
    if (error) {
      rejectPromise(error);
    } else {
      resolvePromise(receivedPayloads);
    }
  };

  const subscriptionPromise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const onTrades = data => {
    receivedPayloads.push(data);

    const payloadSize = Array.isArray(data) ? data.length : 0;
    if (receivedPayloads.length === 1) {
      console.log(`Received first trades payload for ${TRADE_COIN} with ${payloadSize} entries.`);
    } else {
      console.log(
        `Received additional trades payload (#${receivedPayloads.length}) with ${payloadSize} entries.`
      );
    }

    if (payloadSize > 0) {
      if (LOG_FULL_PAYLOAD) {
        console.log('Payload:', JSON.stringify(data, null, 2));
      } else {
        console.log(
          `Sample trades (${Math.min(payloadSize, SAMPLE_TRADES_COUNT)}/${payloadSize} entries):\n${formatSampleTrades(
            data
          )}`
        );
      }
    } else {
      console.log('Payload did not contain trades array or array was empty.');
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= MIN_SUBSCRIPTION_MS) {
      settle();
    }
  };

  try {
    await sdk.subscriptions.subscribeToTrades(TRADE_COIN, onTrades);
    console.log(`Subscribed to trades for ${TRADE_COIN}. Waiting for updates...`);
  } catch (error) {
    settle(error);
  }

  minTimer = setTimeout(() => {
    if (receivedPayloads.length > 0) {
      settle();
    }
  }, MIN_SUBSCRIPTION_MS);

  maxTimer = setTimeout(() => {
    settle(
      new Error(
        `No trade updates received for ${TRADE_COIN} within ${MAX_WAIT_MS / 1000} seconds (CJS test).`
      )
    );
  }, MAX_WAIT_MS);

  return subscriptionPromise.finally(async () => {
    clearTimeout(minTimer);
    clearTimeout(maxTimer);
    try {
      await sdk.subscriptions.unsubscribeFromTrades(TRADE_COIN);
      console.log(`Unsubscribed from trades for ${TRADE_COIN}.`);
    } catch (error) {
      console.warn(
        `CJS test: failed to unsubscribe from trades for ${TRADE_COIN}:`,
        error?.message ?? error
      );
    }
  });
}

async function main() {
  const sdk = new Hyperliquid({ enableWs: true, testnet: USE_TESTNET });

  try {
    const connectTimeout = setTimeout(() => {
      console.error('Timed out while waiting for WebSocket connection (CJS test).');
      sdk.disconnect();
      process.exitCode = 1;
    }, MAX_WAIT_MS);

    await sdk.connect();
    clearTimeout(connectTimeout);

    if (!sdk.isWebSocketConnected()) {
      throw new Error('WebSocket did not report connected state in CJS test.');
    }

    console.log('CJS test: WebSocket connected successfully.');
    console.log(`CJS test: Subscribing on ${USE_TESTNET ? 'testnet' : 'mainnet'}.`);

    const payloads = await runSubscriptionTest(sdk);
    console.log(
      `CJS test: collected ${payloads.length} trades payload(s) for ${TRADE_COIN} over at least ${MIN_SUBSCRIPTION_MS}ms.`
    );
  } catch (error) {
    console.error('CJS test failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      sdk.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}

main().catch(error => {
  console.error('Unexpected CJS test failure:', error);
  process.exitCode = 1;
});
