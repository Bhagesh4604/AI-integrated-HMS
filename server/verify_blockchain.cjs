const { medicareChain, Block } = require('../server/blockchainService.cjs');
const { executeQuery } = require('../server/db.cjs');

console.log("1. Waiting for Blockchain to load from DB...");

// Poll for chain initialization
const waitForChain = setInterval(() => {
    if (medicareChain.chain && medicareChain.chain.length > 0) {
        clearInterval(waitForChain);
        runTest();
    }
}, 500);

function runTest() {
    console.log("   Chain loaded. Height:", medicareChain.chain.length);

    const testData = { patient: "Test Patient", action: "VERIFY_PERSISTENCE_" + Date.now() };
    console.log("2. Adding new block with data:", testData);

    // Ensure we have a valid previous hash
    const latestBlock = medicareChain.getLatestBlock();
    if (!latestBlock) {
        console.error("Critical Error: Latest block is undefined even after load.");
        process.exit(1);
    }

    const newBlock = new Block(
        medicareChain.chain.length,
        Date.now(),
        testData,
        latestBlock.hash
    );

    medicareChain.addBlock(newBlock);

    console.log("3. Waiting 3 seconds for async DB save...");

    setTimeout(() => {
        checkDB(newBlock, testData);
    }, 3000);
}

function checkDB(newBlock, testData) {
    console.log("4. Checking Database for the new block...");
    const query = "SELECT * FROM blockchain_ledger WHERE `index` = ?";
    executeQuery(query, [newBlock.index], (err, results) => {
        if (err) {
            console.error("❌ DB Query Failed:", err);
            // Don't exit yet, maybe connection issue, detailed log
            process.exit(1);
        }

        if (results && results.length > 0) {
            const row = results[0];
            console.log("✅ Block found in DB!");
            console.log("   DB Data:", row.data);

            // Verify content
            let dbDataStr = "";
            try {
                dbDataStr = typeof row.data === 'string' ? row.data : JSON.stringify(row.data);
            } catch (e) {
                dbDataStr = String(row.data);
            }

            // We look for the action string
            if (dbDataStr.includes(testData.action)) {
                console.log("✅ Data integrity verified.");
                process.exit(0);
            } else {
                console.error("❌ Data mismatch.");
                process.exit(1);
            }
        } else {
            console.error("❌ Block NOT found in DB.");
            process.exit(1);
        }
    });
}
