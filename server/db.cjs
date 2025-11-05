const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  timezone: 'UTC'
});

// In a real application, you would use a migration tool for schema changes.
// For this project, we will add the table creation here.
const alterPatientsAuthTable = `
ALTER TABLE patients_auth
ADD COLUMN IF NOT EXISTS verificationToken VARCHAR(255),
ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT false;
`;

connection.query(alterPatientsAuthTable, (err) => {
  if (err) {
    console.error('Error altering patients_auth table:', err);
  }
});

const createPasswordResetsTable = `
CREATE TABLE IF NOT EXISTS password_resets (
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires BIGINT NOT NULL,
  PRIMARY KEY (email)
);
`;

connection.query(createPasswordResetsTable, (err) => {
  if (err) {
    console.error('Error creating password_resets table:', err);
  }
});



// Create a dedicated function to execute queries
const executeQuery = (query, params, callback) => {
  connection.query(query, params, callback);
};

module.exports = { executeQuery };

