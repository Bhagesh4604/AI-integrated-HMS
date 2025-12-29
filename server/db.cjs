const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 5,
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST,
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER,
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME,
  timezone: 'UTC',
  ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
  } : undefined
});

// Create a dedicated function to execute queries
const executeQuery = (query, params, callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('--- DATABASE CONNECTION ERROR ---');
      console.error(err);
      console.error('--- END DATABASE CONNECTION ERROR ---');
      // Ensure callback is called and we don't proceed
      return callback(err, null, null);
    }
    
    connection.query(query, params, (err, results, fields) => {
      // Always release the connection back to the pool
      connection.release();

      if (err) {
        // Log the full error for better debugging
        console.error('--- DATABASE QUERY ERROR ---');
        console.error('Query:', query);
        console.error('Params:', params);
        console.error('Error:', err);
        console.error('Stack:', new Error().stack);
        console.error('--- END DATABASE QUERY ERROR ---');
      }
      
      // Pass the original arguments to the callback
      callback(err, results, fields);
    });
  });
};

module.exports = { executeQuery, pool };

