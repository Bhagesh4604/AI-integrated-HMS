const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const admin = require('firebase-admin'); // Import firebase-admin

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccountString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii');
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized from Base64 variable.");
  } catch (e) {
    console.error("🔴 Firebase Admin SDK initialization from Base64 failed:", e);
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized from individual environment variables.");
  } catch(e) {
    console.error("🔴 Firebase Admin SDK initialization from individual env vars failed:", e);
  }
} else {
  console.warn("⚠️ Firebase credentials not found in environment variables. Push notifications will be disabled.");
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