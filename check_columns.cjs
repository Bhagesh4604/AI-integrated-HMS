const { executeQuery } = require('./server/db.cjs');

const sql = `SHOW COLUMNS FROM emergencytrips`;

executeQuery(sql, [], (err, results) => {
    if (err) {
        console.error(err);
    } else {
        console.log(results.map(col => col.Field));
    }
    process.exit();
});
