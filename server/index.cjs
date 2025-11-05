const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Make wss available to other modules
app.set('wss', wss);

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = 8080;

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.107:5173']
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./auth.cjs'));
app.use('/api/auth/patient', require('./auth_patient.cjs'));
app.use('/api/auth/staff', require('./auth_staff.cjs'));
app.use('/api/dashboard', require('./dashboard.cjs'));
app.use('/api/patients', require('./patients.cjs'));

app.use('/api/immunizations', require('./immunizations.cjs'));
app.use('/api/medications', require('./medications.cjs'));
app.use('/api/portal', require('./portal.cjs'));
app.use('/api/employees', require('./employees.cjs'));
app.use('/api/pharmacy', require('./pharmacy.cjs'));
app.use('/api/accounting', require('./accounting.cjs'));
app.use('/api/billing', require('./billing.cjs')); // Add this line
app.use('/api/laboratory', require('./laboratory.cjs'));
app.use('/api/medical-records', require('./medicalRecords.cjs'));
app.use('/api/surgical', require('./surgical.cjs'));
app.use('/api/payroll', require('./payroll.cjs'));
app.use('/api/vendors', require('./vendors.cjs'));
app.use('/api/inventory', require('./inventory.cjs'));
app.use('/api/sms', require('./sms.cjs').router);
app.use('/api/portal', require('./portal.cjs'));
app.use('/api/appointments', require('./appointments.cjs'));
app.use('/api/virtual-consultations', require('./virtualConsultations.cjs')); // Add this line
app.use('/api/messaging', require('./messaging.cjs')); // Add this line
app.use('/api/schedules', require('./schedules.cjs'));
app.use('/api/ai', require('./aiService.cjs'));
app.use('/api/analytics', require('./analytics.cjs'));
app.use('/api/triage', require('./triage.cjs'));
app.use('/api/beds', require('./beds.cjs'));
console.log("✅ '/api/beds' route registered successfully.");

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});