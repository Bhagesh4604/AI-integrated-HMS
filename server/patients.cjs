const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const { uploadToBlob } = require('./azureStorage.cjs');

// Use memory storage to get buffer for Azure upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/:id/upload-photo', upload.single('profilePhoto'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
        const profileImageUrl = await uploadToBlob(req.file.buffer, req.file.originalname);
        const sql = 'UPDATE patients SET profileImageUrl = ? WHERE id = ?';
        executeQuery(sql, [profileImageUrl, id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to update profile picture.' });
            }
            res.json({ success: true, message: 'Profile picture updated!', profileImageUrl: profileImageUrl });
        });
    } catch (error) {
        console.error("Upload to Azure failed:", error);
        // Fallback or error
        return res.status(500).json({ success: false, message: 'Failed to upload image to storage.' });
    }
});

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM patients ORDER BY id DESC';
    executeQuery(sql, [], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error' });
        res.json(results);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM patients WHERE id = ?';
    executeQuery(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Internal server error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json(results[0]);
    });
});

router.post('/add', (req, res) => {
    const { firstName, lastName, dateOfBirth, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone } = req.body;
    const patientId = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sql = `INSERT INTO patients (patientId, firstName, lastName, dateOfBirth, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [patientId, firstName, lastName, dateOfBirth || null, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone, 'active'];
    executeQuery(sql, params, (err, result) => {
        if (err) {
            console.error("Error adding patient:", err);
            return res.status(500).json({ success: false, message: 'Failed to add patient' });
        }
        res.json({ success: true, message: 'Patient added successfully!' });
    });
});

// --- FIX: Updated this route to include the 'status' field ---
router.put('/:id', (req, res) => {
    console.log('--- UPDATE PATIENT REQUEST ---');
    const { id } = req.params;
    const { firstName, lastName, phone, address, status, email, bloodGroup, dateOfBirth, emergencyContact, emergencyPhone, gender } = req.body;
    console.log('Request Body:', req.body);

    const sql = 'UPDATE patients SET firstName = ?, lastName = ?, phone = ?, address = ?, status = ?, email = ?, bloodGroup = ?, dateOfBirth = ?, emergencyContact = ?, emergencyPhone = ?, gender = ? WHERE id = ?';
    const params = [firstName, lastName, phone, address, status, email, bloodGroup, dateOfBirth || null, emergencyContact, emergencyPhone, gender, id];
    console.log('SQL Query:', sql);
    console.log('SQL Params:', params);

    executeQuery(sql, params, (err, result) => {
        if (err) {
            console.error("Error updating patient:", err);
            return res.status(500).json({ success: false, message: 'Failed to update patient' });
        }
        console.log('Update Result:', result);
        res.json({ success: true, message: 'Patient details updated successfully!' });
    });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM patients WHERE id = ?';
    executeQuery(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to delete patient' });
        res.json({ success: true, message: 'Patient deleted successfully!' });
    });
});

router.get('/:patientId/full-history', async (req, res) => {
    const { patientId } = req.params;

    if (!patientId) {
        return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    try {
        const { medicareChain, Block } = require('./blockchainService.cjs');

        // Fetch basic patient details using patientId (varchar)
        const patientDetails = await new Promise((resolve, reject) => {
            executeQuery('SELECT id, firstName, lastName, patientId, dateOfBirth, gender, bloodGroup, phone, email, address, emergencyContact, emergencyPhone, status, profileImageUrl FROM patients WHERE patientId = ?', [patientId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });

        // --- BLOCKCHAIN LOGGING ---
        // In a real app, req.user.id would be the doctor's ID from auth middleware
        const doctorId = "DR-SESSION-USER"; // Placeholder pending auth integration
        const logBlock = new Block(Date.now(), new Date().toISOString(), {
            patientId: patientId,
            doctorId: doctorId,
            action: "VIEW_FULL_HISTORY"
        });
        medicareChain.addBlock(logBlock);
        console.log(`[Blockchain] Access logged for patient ${patientId} by ${doctorId}`);
        // --------------------------

        if (!patientDetails) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const patientDbId = patientDetails.id; // Get the integer ID for subsequent queries

        // Fetch appointments
        const appointments = await new Promise((resolve, reject) => {
            const sql = `
                SELECT a.appointmentDate as date, a.notes, a.status, CONCAT(e.firstName, ' ', e.lastName) as doctorName, d.name as departmentName
                FROM appointments a
                JOIN employees e ON a.doctorId = e.id
                LEFT JOIN departments d ON e.departmentId = d.id
                WHERE a.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                console.log('Appointments:', results);
                resolve(results.map(item => ({ type: 'appointment', date: item.date, details: item })));
            });
        });

        // Fetch medical records
        const medicalRecords = await new Promise((resolve, reject) => {
            const sql = `
                SELECT mr.recordDate as date, mr.diagnosis, mr.treatment, CONCAT(e.firstName, ' ', e.lastName) as doctorName
                FROM medical_records mr
                JOIN employees e ON mr.doctorId = e.id
                WHERE mr.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                console.log('Medical Records:', results);
                resolve(results.map(item => ({ type: 'medical_record', date: item.date, details: item })));
            });
        });

        // Fetch lab tests
        const labTests = await new Promise((resolve, reject) => {
            const sql = `
                SELECT lt.testDate as date, lt.testName, lt.status, lt.result_text, CONCAT(e.firstName, ' ', e.lastName) as doctorName
                FROM lab_tests lt
                LEFT JOIN employees e ON lt.doctorId = e.id
                WHERE lt.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                console.log('Lab Tests:', results);
                resolve(results.map(item => ({ type: 'lab_test', date: item.date, details: item })));
            });
        });

        // Fetch prescriptions
        const prescriptions = await new Promise((resolve, reject) => {
            const sql = `
                SELECT p.prescriptionDate as date, p.medicationName, p.dosage, CONCAT(e.firstName, ' ', e.lastName) as doctorName
                FROM prescriptions p
                LEFT JOIN employees e ON p.doctorId = e.id
                WHERE p.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                console.log('Prescriptions:', results);
                resolve(results.map(item => ({ type: 'prescription', date: item.date, details: item })));
            });
        });

        // Fetch surgery records
        const surgeryRecords = await new Promise((resolve, reject) => {
            const sql = `
                SELECT sr.surgeryDate as date, sr.surgeryType, sr.notes, sr.status, CONCAT(e.firstName, ' ', e.lastName) as surgeonName
                FROM surgery_records sr
                JOIN employees e ON sr.surgeonId = e.id
                WHERE sr.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                resolve(results.map(item => ({ type: 'surgery', date: item.date, details: item })));
            });
        });

        // Fetch billing history (accounts receivable)
        const billingHistory = await new Promise((resolve, reject) => {
            const sql = `
                SELECT date, invoiceNumber, amount, paymentStatus, description FROM (
                    SELECT dueDate as date, invoiceNumber, amount, paymentStatus, description
                    FROM accounts_receivable
                    WHERE patientId = ?
                    UNION ALL
                    SELECT billDate as date, billNumber as invoiceNumber, totalAmount as amount, status as paymentStatus, notes as description
                    FROM patient_bills
                    WHERE patientId = ?
                ) as combined_bills
            `;
            executeQuery(sql, [patientDbId, patientDbId], (err, results) => {
                if (err) return reject(err);
                resolve(results.map(item => ({ type: 'bill', date: item.date, details: item })));
            });
        });

        // Fetch admissions history
        const admissions = await new Promise((resolve, reject) => {
            const sql = `
                SELECT ad.admissionDate as date, ad.dischargeDate, w.name as wardName, b.bedNumber, ad.notes
                FROM admissions ad
                LEFT JOIN wards w ON ad.wardId = w.id
                LEFT JOIN beds b ON ad.bedId = b.id
                WHERE ad.patientId = ?
            `;
            executeQuery(sql, [patientDbId], (err, results) => {
                if (err) return reject(err);
                resolve(results.map(item => ({ type: 'admission', date: item.date, details: item })));
            });
        });

        // Combine all history events and sort chronologically
        const fullHistory = [
            ...appointments,
            ...medicalRecords,
            ...labTests,
            ...prescriptions,
            ...surgeryRecords,
            ...billingHistory,
            ...admissions
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        res.json({ success: true, patient: patientDetails, history: fullHistory });

    } catch (error) {
        console.error('Error fetching patient full history:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
