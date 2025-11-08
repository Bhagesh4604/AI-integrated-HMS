const express = require('express');
const router = express.Router();
const { pool, executeQuery } = require('./db.cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Patient Registration
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, contact } = req.body;

    // Simple regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // E.164 phone number format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(contact)) {
        return res.status(400).json({ success: false, message: 'Invalid contact number format. Please use the format +911234567890.' });
    }

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) return reject(err);
                resolve(conn);
            });
        });

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        const patientId = `PAT${Math.floor(1000 + Math.random() * 9000)}`;
        const patientSql = `INSERT INTO patients (patientId, firstName, lastName, email, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`;
        const patientResult = await new Promise((resolve, reject) => {
            connection.query(patientSql, [patientId, firstName, lastName, email, contact], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        const newPatientId = patientResult.insertId;
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const hash = await bcrypt.hash(password, 10);

        const authSql = 'INSERT INTO patients_auth (patientId, email, password, verificationToken, isVerified) VALUES (?, ?, ?, ?, ?)';
        await new Promise((resolve, reject) => {
            connection.query(authSql, [newPatientId, email, hash, verificationToken, false], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        // TODO: Replace with a real SMS service (e.g., Twilio, Vonage)
        console.log(`Sending SMS to ${contact}: Welcome to Shree Medicare! Your registration was successful.`);

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        console.log('Verification link:', verificationLink);

        res.json({ success: true, message: 'Patient registered successfully! A verification link has been logged to the server console.' });

    } catch (err) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'A patient with this email already exists.' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Failed to register patient.' });

    } finally {
        if (connection) connection.release();
    }
});


const { sendPasswordResetEmail } = require('./email.cjs');

// Patient Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM patients_auth WHERE email = ?';

    executeQuery(sql, [email], (err, results) => {
        if (err) {
            console.error("DB Error on patient login:", err);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = results[0];

        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
        }

        if (!user.password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Account not fully configured.' });
        }

        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) {
                console.error("Bcrypt compare error:", compareErr);
                return res.status(500).json({ success: false, message: 'Error checking password.' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }

            const patientDetailsSql = 'SELECT * FROM patients WHERE id = ?';
            executeQuery(patientDetailsSql, [user.patientId], (patientErr, patientResults) => {
                if (patientErr || patientResults.length === 0) {
                    return res.status(500).json({ success: false, message: 'Could not retrieve patient details after login.' });
                }
                
                res.json({
                    success: true,
                    message: 'Login successful!',
                    patient: patientResults[0]
                });
            });
        });
    });
});

// Forgot Password
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    const sql = 'SELECT * FROM patients_auth WHERE email = ?';
    executeQuery(sql, [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'No user with that email address exists.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        const insertTokenSql = 'INSERT INTO password_resets (email, token, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires = ?';
        executeQuery(insertTokenSql, [email, token, expires, token, expires], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to store password reset token.' });
            }

            sendPasswordResetEmail(email, token).then(() => {
                res.json({ success: true, message: 'A password reset link has been sent to your email.' });
            }).catch(err => {
                console.error('Failed to send password reset email:', err);
                res.status(500).json({ success: false, message: 'Failed to send password reset email.' });
            });
        });
    });
});

const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Reset Password
router.post('/reset-password', (req, res) => {
    const { token, password } = req.body;

    const sql = 'SELECT * FROM password_resets WHERE token = ? AND expires > ?';
    executeQuery(sql, [token, Date.now()], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
        }

        const email = results[0].email;

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ success: false, message: 'Error hashing password.' });

            const updatePasswordSql = 'UPDATE patients_auth SET password = ? WHERE email = ?';
            executeQuery(updatePasswordSql, [hash, email], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to update password.' });
                }

                const deleteTokenSql = 'DELETE FROM password_resets WHERE email = ?';
                executeQuery(deleteTokenSql, [email], (err, result) => {
                    // Ignore error
                });

                res.json({ success: true, message: 'Password has been reset successfully!' });
            });
        });
    });
});

// Google Login
router.post('/google-login', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture } = payload;

        const patientSql = 'SELECT * FROM patients WHERE email = ?';
        executeQuery(patientSql, [email], async (err, results) => {
            if (err) {
                console.error("DB Error on Google login:", err);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            let patient = results[0];

            if (!patient) {
                const patientId = `PAT${Math.floor(1000 + Math.random() * 9000)}`;
                const insertPatientSql = 'INSERT INTO patients (patientId, firstName, lastName, email, profileImageUrl, status) VALUES (?, ?, ?, ?, ?, ?)';
                const insertResult = await new Promise((resolve, reject) => {
                    executeQuery(insertPatientSql, [patientId, given_name, family_name, email, picture, 'active'], (insertErr, result) => {
                        if (insertErr) return reject(insertErr);
                        resolve(result);
                    });
                });

                const newPatientId = insertResult.insertId;

                const authSql = 'INSERT INTO patients_auth (patientId, email) VALUES (?, ?)';
                await new Promise((resolve, reject) => {
                    executeQuery(authSql, [newPatientId, email], (authErr, authResult) => {
                        if (authErr) return reject(authErr);
                        resolve(authResult);
                    });
                });

                const newPatientResults = await new Promise((resolve, reject) => {
                    executeQuery(patientSql, [email], (fetchErr, fetchResults) => {
                        if (fetchErr) return reject(fetchErr);
                        resolve(fetchResults);
                    });
                });
                patient = newPatientResults[0];
            }

            res.json({ success: true, message: 'Google login successful!', patient: patient });
        });

    } catch (error) {
        console.error('Google ID token verification failed:', error);
        res.status(401).json({ success: false, message: 'Google login failed. Invalid token.' });
    }
});

// Verify Email
router.get('/verify-email', (req, res) => {
    const { token } = req.query;

    const sql = 'SELECT * FROM patients_auth WHERE verificationToken = ?';
    executeQuery(sql, [token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid verification token.' });
        }

        const patientAuth = results[0];

        const updateSql = 'UPDATE patients_auth SET isVerified = ?, verificationToken = NULL WHERE id = ?';
        executeQuery(updateSql, [true, patientAuth.id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to verify email.' });
            }

            res.json({ success: true, message: 'Email has been verified successfully!' });
        });
    });
});

module.exports = router;
