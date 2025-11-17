const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const admin = require('firebase-admin'); // Import firebase-admin

// Initialize Firebase Admin SDK
// You need to provide your Firebase service account key or server key
// For simplicity, we'll use a server key from .env for now.
// In a production environment, a service account key file is recommended.
if (process.env.FCM_SERVER_KEY) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log("✅ Firebase Admin SDK initialized.");
} else {
  console.warn("⚠️ FCM_SERVER_KEY not found in .env. Push notifications will not be sent.");
}


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Make wss available to other modules
app.set('wss', wss);
app.set('firebaseAdmin', admin); // Make firebaseAdmin available to other modules

wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');

  ws.on('close', (code, reason) => {
    console.log(`❌ Client disconnected from WebSocket. Code: ${code}, Reason: ${reason}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// --- CHANGE 1: Use Render's environment variable for PORT ---
const PORT = process.env.PORT || 8080;

const allowedOrigins = ['https://localhost', 'http://localhost', 'capacitor://localhost', 'http://localhost:8100', 'https://shreemedicare1.onrender.com', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Middleware to attach wss to each request
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./auth.cjs'));
app.use('/api/auth/patient', require('./auth_patient.cjs'));
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
app.use('/api/ems', require('./ems.cjs')); // New EMS routes
app.use('/api/ems/patient', require('./ems_patient.cjs')); // New Patient-facing EMS routes
console.log("✅ '/api/beds' route registered successfully.");

// --- CHANGE 2: Listen on '0.0.0.0' for Render ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});