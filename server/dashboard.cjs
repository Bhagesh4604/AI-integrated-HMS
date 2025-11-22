const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');

router.get('/stats', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const queries = [
        "SELECT COUNT(*) as value FROM patients",
        "SELECT COUNT(*) as value FROM employees WHERE status = 'active'",
        "SELECT COUNT(*) as value FROM beds WHERE status = 'available'",
        `
            SELECT SUM(total) as value FROM (
                SELECT COALESCE(SUM(amount), 0) as total FROM accounts_receivable WHERE paymentStatus = 'paid' AND DATE(dueDate) = '${today}'
                UNION ALL
                SELECT COALESCE(SUM(totalAmount), 0) as total FROM patient_bills WHERE status = 'paid' AND DATE(billDate) = '${today}'
            ) as combined_today
        `,
    ];

    const promises = queries.map(sql => {
        return new Promise((resolve, reject) => {
            executeQuery(sql, [], (err, results) => {
                if (err) return reject(err);
                // Ensure value is not null, default to 0
                resolve(results[0].value || 0);
            });
        });
    });

    Promise.all(promises)
        .then(results => {
            console.log("Dashboard stats results:", results);
            const [totalPatients, activeStaff, availableBeds, totalRevenue] = results;
            res.json({
                totalPatients: totalPatients,
                activeStaff: activeStaff,
                availableBeds: availableBeds,
                revenue: totalRevenue
            });
        })
        .catch(err => {
            console.error("Dashboard stat query error:", err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

// NEW: Endpoint to get today's agenda (appointments)
router.get('/agenda', (req, res) => {
    const sql = `
        SELECT a.id, a.appointmentDate, a.notes, a.status,
               CONCAT(p.firstName, ' ', p.lastName) as patientName
        FROM appointments a
        JOIN patients p ON a.patientId = p.id
        WHERE DATE(a.appointmentDate) = CURDATE()
        ORDER BY a.appointmentDate ASC
    `;
    executeQuery(sql, [], (err, results) => {
        if (err) {
            console.error("Dashboard agenda query error:", err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        console.log("Dashboard agenda results:", results);
        res.json(results);
    });
});


module.exports = router;
