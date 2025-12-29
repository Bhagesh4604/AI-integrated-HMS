const { executeQuery, pool } = require('../db.cjs');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'create_blockchain_table.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('Running migration...');
executeQuery(sql, [], (err, results) => {
    if (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } else {
        console.log('Migration successful: blockchain_ledger table created (or already exists).');
        process.exit(0);
    }
});
