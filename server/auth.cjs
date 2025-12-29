const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const bcrypt = require('bcryptjs');

// Unified Staff Login
router.post('/staff/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
  }

  const sql = 'SELECT * FROM employees WHERE email = ?';

  executeQuery(sql, [email], (err, results) => {
    if (err) {
      console.error("LOGIN ERROR: Database query failed.");
      console.error("SQL Code:", err.code);
      console.error("SQL Message:", err.sqlMessage);
      console.error("Full Error:", err);
      return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = results[0];

    if (user.role !== role) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.password) {
      console.error(`Login attempt for user ${email} failed: No password is set in the database.`);
      return res.status(401).json({ success: false, message: 'Invalid credentials. Account not fully configured.' });
    }

    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        console.error("Bcrypt comparison error:", bcryptErr);
        return res.status(500).json({ success: false, message: 'Error checking password' });
      }

      if (isMatch) {
        delete user.password;

        // If the user is a paramedic, fetch their assigned ambulance_id
        if (user.role === 'ROLE_PARAMEDIC') {
          const ambulanceSql = 'SELECT ambulance_id FROM ambulancecrews WHERE user_id = ?';
          executeQuery(ambulanceSql, [user.id], (ambErr, ambResults) => {
            if (ambErr) {
              console.error("Database error fetching ambulance_id for paramedic:", ambErr);
              // Continue without ambulance_id if there's an error, or return an error if critical
              return res.json({ success: true, message: 'Login successful (paramedic, ambulance_id not found).', user: user });
            }
            if (ambResults.length > 0) {
              user.ambulance_id = ambResults[0].ambulance_id;
            } else {
              console.warn(`Paramedic ${user.id} logged in but no ambulance_id found.`);
            }
            res.json({ success: true, message: 'Login successful!', user: user });
          });
        } else {
          res.json({ success: true, message: 'Login successful!', user: user });
        }
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    });
  });
});

module.exports = router;
