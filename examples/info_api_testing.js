const { Hyperliquid } = require('../dist/index');
const readline = require('readline');

const private_key = "";
const user_address = "";

const raw_mode = true;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function waitForInput(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, () => {
            resolve();
        });
    });
}

async function testInfoAPI(sdk) {
    console.log("Testing InfoAPI methods:");
    
    console.log("getAllMids:");
    console.log(await sdk.info.getAllMids(raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserOpenOrders:");
    console.log(await sdk.info.getUserOpenOrders(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getFrontendOpenOrders:");
    console.log(await sdk.info.getFrontendOpenOrders(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserFills:");
    console.log(await sdk.info.getUserFills(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserFillsByTime:");
    console.log(await sdk.info.getUserFillsByTime(user_address, Date.now() - 1506400000, Date.now(), raw_mode)); // Last 24 hours
    await waitForInput("Press Enter to continue...");

    console.log("getUserRateLimit:");
    console.log(await sdk.info.getUserRateLimit(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getOrderStatus:");
    console.log(await sdk.info.getOrderStatus(user_address, 1000, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getL2Book:");
    const book = await sdk.info.getL2Book("BTC-PERP", raw_mode)
    console.log(book)
    console.log(book.levels)
    await waitForInput("Press Enter to continue...");

    console.log("getCandleSnapshot:");
    console.log(await sdk.info.getCandleSnapshot("BTC-PERP", "1h", Date.now() - 86400000, Date.now(), raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getMaxBuilderFee:");
    console.log(await sdk.info.getMaxBuilderFee(user_address, "", raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getHistoricalOrders:");
    console.log(await sdk.info.getHistoricalOrders(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserTwapSliceFills:");
    console.log(await sdk.info.getUserTwapSliceFills(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getSubAccounts:");
    console.log(await sdk.info.getSubAccounts(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getVaultDetails:");
    const vaultAddress = ""; // Replace with actual vault address
    console.log(await sdk.info.getVaultDetails(vaultAddress, user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserVaultEquities:");
    console.log(await sdk.info.getUserVaultEquities(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");
}

async function testSpotInfoAPI(sdk) {
    console.log("\nTesting SpotInfoAPI methods:");
    
    console.log("getSpotMeta:");
    console.log(await sdk.info.spot.getSpotMeta(raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getSpotClearinghouseState:");
    console.log(await sdk.info.spot.getSpotClearinghouseState(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getSpotMetaAndAssetCtxs:");
    console.log(await sdk.info.spot.getSpotMetaAndAssetCtxs(raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getTokenDetails:");
    console.log(await sdk.info.spot.getTokenDetails("", raw_mode)); //using PURR as example
    await waitForInput("Press Enter to continue...");

    console.log("getSpotDeployState:");
    console.log(await sdk.info.spot.getSpotDeployState(user_address, raw_mode));
    await waitForInput("Press Enter to continue...");
}

async function testPerpetualsInfoAPI(sdk) {
    console.log("\nTesting PerpetualsInfoAPI methods:");
    
    console.log("getMeta:");
    console.log(await sdk.info.perpetuals.getMeta(raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getMetaAndAssetCtxs:");
    console.log(await sdk.info.perpetuals.getMetaAndAssetCtxs(raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getClearinghouseState:");
    const perpsClearing = await sdk.info.perpetuals.getClearinghouseState(user_address, raw_mode);
    console.log(perpsClearing);
    console.log(perpsClearing.assetPositions)
    await waitForInput("Press Enter to continue...");

    console.log("getUserFunding:");
    console.log(await sdk.info.perpetuals.getUserFunding(user_address, Date.now() - 86400000, Date.now(), raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getUserNonFundingLedgerUpdates:");
    console.log(await sdk.info.perpetuals.getUserNonFundingLedgerUpdates(user_address, Date.now() - 86400000, Date.now(), raw_mode));
    await waitForInput("Press Enter to continue...");

    // await sdk.connect() // Need to connect/initialize SDK symbols map before using internal symbol mappings

    console.log("getFundingHistory:");
    console.log(await sdk.info.perpetuals.getFundingHistory("BTC-PERP", Date.now() - 86400000, Date.now(), raw_mode));
    await waitForInput("Press Enter to continue...");

    console.log("getPredictedFundings:");
    console.log(await sdk.info.perpetuals.getPredictedFundings(raw_mode));
    await waitForInput("Press Enter to continue...");
}

async function main() {
    const sdk = new Hyperliquid(private_key);

    try {
        await testInfoAPI(sdk);
        await testSpotInfoAPI(sdk);
        await testPerpetualsInfoAPI(sdk);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        rl.close();
    }
}

main();