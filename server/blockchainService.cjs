const SHA256 = require("crypto-js/sha256");
const { executeQuery } = require('./db.cjs');

class Block {
    constructor(index, timestamp, data, previousHash = '', hash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = hash || this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.loadChain();
    }

    // Load chain from Database
    loadChain() {
        const query = "SELECT * FROM blockchain_ledger ORDER BY `index` ASC";
        executeQuery(query, [], (err, results) => {
            if (err) {
                console.error("❌ Failed to load blockchain ledger:", err);
                return;
            }

            if (results.length === 0) {
                console.log("⚠️ Blockchain empty. creating Genesis Record...");
                this.createGenesisBlock();
            } else {
                this.chain = results.map(row => {
                    // Start with basic block reconstruction
                    let blockData = row.data;

                    // Try parsing if it's a string, otherwise use as is
                    try {
                        if (typeof blockData === 'string') {
                            blockData = JSON.parse(blockData);
                        }
                    } catch (e) {
                        // Keep as string if parse fails
                    }

                    return new Block(
                        row.index,
                        row.timestamp,
                        blockData,
                        row.previousHash,
                        row.hash
                    );
                });
                console.log(`✅ Blockchain loaded. Height: ${this.chain.length}`);
            }
        });
    }

    createGenesisBlock() {
        const genesisBlock = new Block(0, Date.now(), "Genesis Block", "0");
        this.saveBlockToDB(genesisBlock);
        this.chain.push(genesisBlock);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();

        // Optimistic update
        this.chain.push(newBlock);

        // Async save
        this.saveBlockToDB(newBlock);
    }

    saveBlockToDB(block) {
        const query = "INSERT INTO blockchain_ledger (`index`, `timestamp`, `data`, `previousHash`, `hash`) VALUES (?, ?, ?, ?, ?)";
        const params = [
            block.index,
            block.timestamp,
            JSON.stringify(block.data),
            block.previousHash,
            block.hash
        ];

        executeQuery(query, params, (err, result) => {
            if (err) {
                console.error(`❌ Failed to save Block #${block.index} to DB:`, err);
            } else {
                console.log(`🔗 Block #${block.index} minted & saved to Ledger.`);
            }
        });
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.error(`Invalid Hash at Block #${i}`);
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`Invalid Previous Hash at Block #${i}`);
                return false;
            }
        }
        return true;
    }
}

// Singleton instance
const medicareChain = new Blockchain();

module.exports = { medicareChain, Block };
