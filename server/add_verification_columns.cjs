const { executeQuery } = require('./db.cjs');

const addColumnsSql = `
  ALTER TABLE emergencytrips
  ADD COLUMN verification_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN verification_reason TEXT DEFAULT NULL;
`;

console.log('Adding verification columns to emergencytrips table...');

executeQuery(addColumnsSql, [], (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Verification columns already exist.');
        } else {
            console.error('Error adding columns:', err);
        }
    } else {
        console.log('Successfully added verification_status and verification_reason columns.');
    }
    process.exit();
});
