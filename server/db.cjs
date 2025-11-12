const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  timezone: 'UTC'
});

// Create a dedicated function to execute queries
const executeQuery = (query, params, callback) => {
  pool.query(query, params, (err, results, fields) => {
    if (err) {
      // Log the full error for better debugging
      console.error('--- DATABASE ERROR ---');
      console.error('Query:', query);
      console.error('Params:', params);
      console.error('Error:', err);
      console.error('--- END DATABASE ERROR ---');
    }
    // Pass the original arguments to the callback
    callback(err, results, fields);
  });
};

module.exports = { executeQuery, pool };

