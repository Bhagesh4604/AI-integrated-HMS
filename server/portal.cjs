const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const { sendSms } = require('./sms.cjs');

// Helper to generate a unique room URL (for Jitsi Meet for example)
const generateRoomUrl = (appointmentId) => {
    const roomName = `HMSConsultation-${appointmentId}-${Date.now()}`;
    return `https://meet.jit.si/${roomName}`;
};



// Get prescriptions for a specific patient
router.get('/my-prescriptions/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const sql = `
        SELECT p.id, p.prescriptionDate, p.medicationName, p.dosage, p.status, CONCAT(e.firstName, ' ', e.lastName) as doctorName
        FROM prescriptions p
        JOIN employees e ON p.doctorId = e.id
        WHERE p.patientId = ? ORDER BY p.prescriptionDate DESC
    `;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        res.json(results);
    });
});

// Get appointments for a specific patient
router.get('/my-appointments/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `
        SELECT a.*, CONCAT(e.firstName, ' ', e.lastName) as doctorName
        FROM appointments a
        JOIN employees e ON a.doctorId = e.id
        WHERE a.patientId = ? ORDER BY a.appointmentDate DESC
    `;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        res.json(results);
    });
});

// Get medical records for a specific patient
router.get('/my-records/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `
        SELECT mr.*, CONCAT(e.firstName, ' ', e.lastName) as doctorName
        FROM medical_records mr
        JOIN employees e ON mr.doctorId = e.id
        WHERE mr.patientId = ? ORDER BY mr.recordDate DESC
    `;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        res.json(results);
    });
});

// Get billing for a specific patient
router.get('/my-billing/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `SELECT * FROM accounts_receivable WHERE patientId = ? ORDER BY dueDate DESC`;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        res.json(results);
    });
});

// Get lab results for a specific patient
router.get('/my-lab-results/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `
        SELECT lt.*, CONCAT(e.firstName, ' ', e.lastName) as doctorName
        FROM lab_tests lt
        LEFT JOIN employees e ON lt.doctorId = e.id
        WHERE lt.patientId = ? ORDER BY lt.testDate DESC
    `;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        res.json(results);
    });
});

// Cancel an appointment
router.put('/my-appointments/:appointmentId/cancel', (req, res) => {
    const { appointmentId } = req.params;
    const sql = "UPDATE appointments SET status = 'canceled' WHERE id = ? AND status = 'scheduled'";
    executeQuery(sql, [appointmentId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error.' });
        if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'Appointment could not be canceled. It may have already passed or been canceled.' });
        res.json({ success: true, message: 'Appointment canceled successfully.' });
    });
});

// Book an appointment
router.post('/book-appointment', async (req, res) => {
    const { patientId, doctorId, appointmentDate, notes, consultationType } = req.body;
    
    try {
        // 1. Insert the appointment
        const result = await new Promise((resolve, reject) => {
            const sql = "INSERT INTO appointments (patientId, doctorId, appointmentDate, notes, status, consultationType) VALUES (?, ?, ?, ?, 'scheduled', ?)";
            executeQuery(sql, [patientId, doctorId, appointmentDate, notes, consultationType], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        const appointmentId = result.insertId;

        // 2. Get details for SMS notification
        const details = await new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    p.phone, 
                    p.firstName as patientFirstName,
                    CONCAT(e.firstName, ' ', e.lastName) as doctorName
                FROM appointments a
                JOIN patients p ON a.patientId = p.id
                JOIN employees e ON a.doctorId = e.id
                WHERE a.id = ?
            `;
            executeQuery(sql, [appointmentId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });

        if (details && details.phone) {
            const apptDate = new Date(appointmentDate);
            const formattedDate = apptDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            let message = `Hi ${details.patientFirstName}, your appointment with Dr. ${details.doctorName} is confirmed for ${formattedDate} at ${formattedTime}.`;

            // 3. Handle virtual consultation specific logic
            if (consultationType === 'virtual') {
                const roomUrl = generateRoomUrl(appointmentId);
                const startTime = new Date(appointmentDate).toISOString();
                const endTime = new Date(new Date(appointmentDate).getTime() + 30 * 60 * 1000).toISOString(); // 30 min duration

                await new Promise((resolve, reject) => {
                    const insertSql = 'INSERT INTO virtual_consultation_rooms (appointmentId, roomUrl, startTime, endTime, status) VALUES (?, ?, ?, ?, ?)';
                    executeQuery(insertSql, [appointmentId, roomUrl, startTime, endTime, 'scheduled'], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });

                message += ` Join here: ${roomUrl}`;
            }

            // 4. Send the SMS
            await sendSms(details.phone, message);
            console.log(`SMS notification sent to ${details.phone}`);
        } else {
            console.error(`Could not find details for appointment ID ${appointmentId} to send SMS.`);
        }

        res.json({ success: true, message: 'Appointment booked successfully!', id: appointmentId });

    } catch (err) {
        console.error("Error booking appointment:", err);
        res.status(500).json({ success: false, message: 'Failed to book appointment.' });
    }
});

module.exports = router;
