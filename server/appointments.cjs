const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const { sendSms } = require('./sms.cjs');

// GET all appointments (for Admin)
router.get('/all', (req, res) => {
    const sql = `
        SELECT a.id, a.appointmentDate, a.status, a.notes, a.consultationType,
               CONCAT(p.firstName, ' ', p.lastName) as patientName,
               p.patientId as patientId,
               CONCAT(e.firstName, ' ', e.lastName) as doctorName,
               d.name as departmentName
        FROM appointments a
        JOIN patients p ON a.patientId = p.id
        JOIN employees e ON a.doctorId = e.id
        LEFT JOIN departments d ON e.departmentId = d.id
        ORDER BY a.appointmentDate DESC
    `;
    executeQuery(sql, [], (err, results) => {
        if (err) {
            console.error("Error fetching all appointments:", err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(results);
    });
});

// GET all appointments for a specific doctor
router.get('/doctor/:doctorId', (req, res) => {
    const { doctorId } = req.params;
    const sql = `
        SELECT a.id, a.appointmentDate, a.status, a.notes, a.consultationType,
               CONCAT(p.firstName, ' ', p.lastName) as patientName,
               p.patientId as patientId,
               d.name as departmentName
        FROM appointments a
        JOIN patients p ON a.patientId = p.id
        JOIN employees e ON a.doctorId = e.id
        LEFT JOIN departments d ON e.departmentId = d.id
        WHERE a.doctorId = ?
        ORDER BY a.appointmentDate DESC
    `;
    executeQuery(sql, [doctorId], (err, results) => {
        if (err) {
            console.error("Error fetching doctor appointments:", err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(results);
    });
});

// GET virtual appointments for a specific doctor
router.get('/doctor/:doctorId/virtual', async (req, res) => {
    const { doctorId } = req.params;
    try {
        const sql = `
            SELECT a.id, a.appointmentDate, a.status, a.notes, a.consultationType,
                   CONCAT(p.firstName, ' ', p.lastName) as patientName,
                   p.patientId as patientId,
                   vcr.roomUrl
            FROM appointments a
            JOIN patients p ON a.patientId = p.id
            LEFT JOIN virtual_consultation_rooms vcr ON a.id = vcr.appointmentId
            WHERE a.doctorId = ? AND a.consultationType = 'virtual'
            ORDER BY a.appointmentDate DESC
        `;
        const results = await new Promise((resolve, reject) => {
            executeQuery(sql, [doctorId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
        res.json(results);
    } catch (error) {
        console.error("Error fetching virtual doctor appointments:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET today's appointments for the dashboard agenda
router.get('/today', (req, res) => {
    const sql = `
        SELECT a.id, a.appointmentDate, a.status, a.notes,
               CONCAT(p.firstName, ' ', p.lastName) as patientName
        FROM appointments a
        JOIN patients p ON a.patientId = p.id
        WHERE DATE(a.appointmentDate) = CURDATE()
        ORDER BY a.appointmentDate ASC
    `;
    executeQuery(sql, [], (err, results) => {
        if (err) {
            console.error("Error fetching today's appointments:", err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(results);
    });
});


router.post('/book-by-doctor', (req, res) => {
    const { patientId, doctorId, appointmentDate, notes, consultationType } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
        return res.status(400).json({ success: false, message: 'Patient, doctor, and date are required.' });
    }

    if (new Date(appointmentDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past.' });
    }

    const sql = "INSERT INTO appointments (patientId, doctorId, appointmentDate, notes, status, consultationType) VALUES (?, ?, ?, ?, 'scheduled', ?)";
    
    executeQuery(sql, [patientId, doctorId, appointmentDate, notes, consultationType], (err, result) => {
        if (err) {
            console.error("Error booking appointment by doctor:", err);
            return res.status(500).json({ success: false, message: 'Database error while booking appointment.' });
        }

        // Send SMS confirmation
        const getPatientPhoneSql = "SELECT phone FROM patients WHERE id = ?";
        executeQuery(getPatientPhoneSql, [patientId], (err, patientResults) => {
            if (err || patientResults.length === 0) {
                console.error('Could not find patient to send SMS.');
                // Still return success for the appointment booking
                return res.status(201).json({ success: true, message: 'Appointment booked, but failed to send SMS.', id: result.insertId });
            }

            const patientPhone = patientResults[0].phone;
            const message = `Your appointment with Dr. ${doctorId} on ${new Date(appointmentDate).toLocaleString()} has been successfully booked.`;
            
            sendSms(patientPhone, message)
                .then(smsResult => console.log('SMS sent for new appointment:', smsResult.sid))
                .catch(smsError => console.error('SMS sending failed:', smsError));

            res.status(201).json({ success: true, message: 'Appointment booked successfully!', id: result.insertId });
        });
    });
});

module.exports = router;
