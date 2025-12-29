const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');

// Helper to broadcast to WebSocket clients (will be passed from index.js)
const broadcastToDoctors = (wss, type, payload) => {
    if (!wss) return;
    wss.clients.forEach(client => {
        // In a real app, filtering by role 'doctor' or 'nurse' would happen here
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type, payload }));
        }
    });
};

// 1. Sync Vitals (Receive data from 'Watch')
router.post('/vitals/sync', (req, res) => {
    const { patient_id, heart_rate, spo2, device_id } = req.body;

    if (!patient_id || !heart_rate) {
        return res.status(400).json({ success: false, message: 'Missing vital data' });
    }

    // Basic Risk Calculation (Mock AI)
    let risk_score = 0;
    if (heart_rate > 100) risk_score += 20;
    if (heart_rate > 120) risk_score += 30; // Tachycardia
    if (heart_rate < 50) risk_score += 30;  // Bradycardia
    if (spo2 && spo2 < 95) risk_score += 20;

    const sql = `INSERT INTO patient_vitals_log (patient_id, device_id, heart_rate, spo2, risk_score) VALUES (?, ?, ?, ?, ?)`;

    executeQuery(sql, [patient_id, device_id || null, heart_rate, spo2 || null, risk_score], (err, result) => {
        if (err) {
            console.error("Error syncing vitals:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // CHECK FOR ALERTS
        if (risk_score >= 50) {
            const alertType = heart_rate > 120 ? 'Tachycardia' : (heart_rate < 50 ? 'Bradycardia' : 'Pre_Event_Warning');
            const severity = risk_score > 80 ? 'Critical' : 'High';
            const message = `High Risk Detected: HR ${heart_rate} bpm, SpO2 ${spo2}%`;

            const alertSql = `INSERT INTO cardiac_risk_alerts (patient_id, alert_type, severity, message) VALUES (?, ?, ?, ?)`;
            executeQuery(alertSql, [patient_id, alertType, severity, message], (alertErr, alertRes) => {
                if (!alertErr) {
                    // Broadcast to Doctors Real-time
                    broadcastToDoctors(req.wss, 'CARDIAC_ALERT', {
                        alert_id: alertRes.insertId,
                        patient_id,
                        heart_rate,
                        risk_score,
                        message,
                        timestamp: new Date()
                    });
                }
            });
        }

        // Broadcast live feed to doctors monitoring this patient
        broadcastToDoctors(req.wss, 'LIVE_VITALS_FEED', {
            patient_id,
            heart_rate,
            spo2,
            risk_score,
            timestamp: new Date()
        });

        res.json({ success: true, message: 'Vitals synced' });
    });
});

// 2. Get Patient Vitals History (Last 24h)
router.get('/vitals/history/:patientId', (req, res) => {
    const { patientId } = req.params;
    const sql = `
    SELECT * FROM patient_vitals_log 
    WHERE patient_id = ? 
    AND timestamp >= NOW() - INTERVAL 1 DAY
    ORDER BY timestamp ASC
  `;
    executeQuery(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching history' });
        res.json({ success: true, history: results });
    });
});

// 3. Get Active Cardiac Alerts (For Doctor Dashboard)
router.get('/alerts/active', (req, res) => {
    const sql = `
    SELECT a.*, p.firstName, p.lastName, p.patientId as mrn 
    FROM cardiac_risk_alerts a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.is_resolved = 0
    ORDER BY a.severity = 'Critical' DESC, a.timestamp DESC
  `;
    executeQuery(sql, [], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching alerts' });
        res.json({ success: true, alerts: results });
    });
});

// 4. Resolve Alert
router.post('/alerts/resolve', (req, res) => {
    const { alert_id } = req.body;
    const sql = `UPDATE cardiac_risk_alerts SET is_resolved = 1, resolved_at = NOW() WHERE alert_id = ?`;
    executeQuery(sql, [alert_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error resolving alert' });
        res.json({ success: true, message: 'Alert resolved' });
    });
});

// 5. Get Monitored Patients (High Risk List)
router.get('/patients/monitored', (req, res) => {
    // Logic: Get patients who have had vitals logged in the last hour
    const sql = `
    SELECT DISTINCT p.id, p.firstName, p.lastName, p.patientId, p.profileImageUrl,
    (SELECT heart_rate FROM patient_vitals_log WHERE patient_id = p.id ORDER BY timestamp DESC LIMIT 1) as current_hr,
    (SELECT risk_score FROM patient_vitals_log WHERE patient_id = p.id ORDER BY timestamp DESC LIMIT 1) as current_risk
    FROM patients p
    JOIN patient_vitals_log vl ON p.id = vl.patient_id
    WHERE vl.timestamp >= NOW() - INTERVAL 1 HOUR
    ORDER BY current_risk DESC
  `;
    executeQuery(sql, [], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching monitored patients' });
        res.json({ success: true, patients: results });
    });
});

module.exports = router;
