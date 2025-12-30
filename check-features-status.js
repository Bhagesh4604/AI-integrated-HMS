/**
 * Quick Status Check Script
 * Run: node check-features-status.js
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:8080';

console.log('🔍 Checking Feature Status...\n');
console.log('='.repeat(50));

// Check 1: Live Alerts Endpoint
function checkLiveAlerts() {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/ems/live-alerts`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success !== undefined) {
            console.log('✅ Live Alerts Endpoint: WORKING');
            console.log(`   Found ${json.alerts?.length || 0} active alerts`);
            resolve(true);
          } else {
            console.log('❌ Live Alerts Endpoint: INVALID RESPONSE');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Live Alerts Endpoint: PARSE ERROR');
          resolve(false);
        }
      });
    });
    req.on('error', () => {
      console.log('❌ Live Alerts Endpoint: NOT REACHABLE');
      console.log('   Make sure server is running: npm run server');
      resolve(false);
    });
    req.setTimeout(3000, () => {
      console.log('❌ Live Alerts Endpoint: TIMEOUT');
      resolve(false);
    });
  });
}

// Check 2: Server Status
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/health`, (res) => {
      console.log('✅ Backend Server: RUNNING');
      resolve(true);
    });
    req.on('error', () => {
      // Health endpoint might not exist, try a basic endpoint
      const req2 = http.get(`${API_BASE}/api/ems/live-alerts`, (res) => {
        console.log('✅ Backend Server: RUNNING (via EMS endpoint)');
        resolve(true);
      });
      req2.on('error', () => {
        console.log('❌ Backend Server: NOT RUNNING');
        console.log('   Start with: npm run server');
        resolve(false);
      });
    });
  });
}

// Check 3: Database (indirect check via endpoint)
async function checkDatabase() {
  const result = await checkLiveAlerts();
  if (result) {
    console.log('✅ Database Connection: LIKELY OK (endpoint works)');
    console.log('   ⚠️  Run SQL to verify: SHOW TABLES LIKE \'ai_triage_logs\';');
  } else {
    console.log('❓ Database Connection: UNKNOWN (endpoint check failed)');
  }
}

// Main check
async function runChecks() {
  console.log('\n1️⃣  Checking Backend Server...');
  await checkServer();
  
  console.log('\n2️⃣  Checking Live Alerts Endpoint...');
  await checkLiveAlerts();
  
  console.log('\n3️⃣  Checking Database...');
  await checkDatabase();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Next Steps:');
  console.log('   1. Ensure database migration ran: node server/migrations/run_ai_triage_migration.cjs');
  console.log('   2. Check frontend: Open http://localhost:5173/staff-dashboard');
  console.log('   3. Create test alert: See QUICK_TEST.md');
  console.log('   4. Test image upload: See TESTING_GUIDE.md');
  console.log('\n');
}

runChecks();

