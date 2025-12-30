const { executeQuery } = require('./db.cjs');

const addColumnSql = `
  ALTER TABLE emergencytrips
  ADD COLUMN trip_image_url VARCHAR(255) DEFAULT NULL;
`;

console.log('Adding trip_image_url column to emergencytrips table...');

executeQuery(addColumnSql, [], (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column trip_image_url already exists.');
        } else {
            console.error('Error adding column:', err);
        }
    } else {
        console.log('Successfully added trip_image_url column.');
    }
    process.exit();
});
