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
  pool.query(query, params, callback);
};

module.exports = { executeQuery, pool };

