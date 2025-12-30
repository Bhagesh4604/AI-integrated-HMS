const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Azure Notification Hubs Setup
const { NotificationHubsClient } = require("@azure/notification-hubs");

let notificationHubService = null;

if (process.env.AZURE_NH_CONNECTION_STRING && process.env.AZURE_NH_HUB_NAME) {
  try {
    notificationHubService = new NotificationHubsClient(
      process.env.AZURE_NH_CONNECTION_STRING,
      process.env.AZURE_NH_HUB_NAME
    );
    console.log("✅ Azure Notification Hubs client initialized.");
  } catch (e) {
    console.error("🔴 Azure Notification Hubs initialization failed:", e);
  }
} else {
  console.warn("⚠️ Azure Notification Hub (AZURE_NH_CONNECTION_STRING, AZURE_NH_HUB_NAME) configuration missing. Push notifications disabled.");
}


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Make wss available to other modules
app.set('wss', wss);
app.set('notificationHubService', notificationHubService);

wss.on('connection', (ws) => {
  console.log('✅ Client connected to WebSocket');

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', (code, reason) => {
    console.log(`❌ Client disconnected from WebSocket. Code: ${code}, Reason: ${reason}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Keep-Alive Heartbeat
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
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

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));
// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

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
app.use('/api/ems/patient', require('./ems_patient.cjs')); // New Patient-facing EMS routes (Must come before generic EMS)
app.use('/api/ems', require('./ems.cjs')); // New EMS routes
app.use('/api/speech', require('./speechToken.cjs')); // Azure Speech Token
app.use('/api/agent', require('./agentService.cjs')); // NEW AI AGENT
app.use('/api/health', require('./healthCheck.cjs')); // Health Check logic

// === Phase 3: Blockchain & Analytics ===
const { medicareChain, Block } = require('./blockchainService.cjs');
const { predictWaitTime } = require('./analyticsService.cjs');

// Blockchain API
app.get('/api/blockchain/history/:patientId', (req, res) => {
  const { patientId } = req.params;
  // Filter chain for blocks relevant to this patient (in a real chain, you'd index this)
  const patientHistory = medicareChain.chain.filter(block =>
    block.data && block.data.patientId === patientId
  );
  res.json({ success: true, chain: patientHistory });
});

app.post('/api/blockchain/log', (req, res) => {
  const { patientId, doctorId, action } = req.body;
  if (!patientId || !doctorId) return res.status(400).json({ error: "Missing data" });

  const newBlock = new Block(
    Date.now(),
    new Date().toISOString(),
    { patientId, doctorId, action: action || "ACCESS_RECORD" }
  );
  medicareChain.addBlock(newBlock);
  res.json({ success: true, message: "Transaction logged to blockchain" });
});

// Predictive Analytics API
app.get('/api/analytics/predict-wait-time', (req, res) => {
  const waitTime = predictWaitTime();
  res.json({ success: true, waitTimeMinutes: waitTime });
});

const { translateText } = require('./translationService.cjs');

// Translation API
app.post('/api/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ success: false, message: 'Text and targetLanguage required' });
  }
  const translatedText = await translateText(text, targetLanguage);
  res.json({ success: true, translation: translatedText });
});

console.log("✅ '/api/beds' route registered successfully.");

// --- CHANGE 2: Listen on '0.0.0.0' for Render ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});