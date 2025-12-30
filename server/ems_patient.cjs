const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const WebSocket = require('ws');
const { AzureOpenAI } = require("openai");
const { Jimp } = require('jimp');

// Helper function to broadcast to all clients
const broadcast = (wss, data) => {
  if (!wss || !wss.clients) {
    console.error("WebSocket server or clients not available for broadcast.");
    return;
  }
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error sending WebSocket message to a client:", error);
      }
    }
  });
};


// --- Helper Functions ---

/**
 * Calculate the distance between two coordinates in kilometers using the Haversine formula.
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Auto-dispatch logic to find and assign the nearest available ambulance.
 */
async function autoDispatchTrip(trip_id, scene_location, wss) {
  try {
    // 1. Find all available ambulances with active crews and last known location
    const availableAmbulancesSql = `
      SELECT
        a.ambulance_id,
        a.vehicle_name,
        (SELECT alh.latitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = a.ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as last_latitude,
        (SELECT alh.longitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = a.ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as last_longitude
      FROM ambulances a
      WHERE a.current_status = 'Available'
      AND a.ambulance_id IN (
        SELECT DISTINCT ac.ambulance_id
        FROM ambulancecrews ac
        WHERE ac.shift_end_time IS NULL
      );
    `;
    const availableAmbulances = await new Promise((resolve, reject) => {
      executeQuery(availableAmbulancesSql, [], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (availableAmbulances.length === 0) {
      console.log('[Auto-Dispatch] No available ambulances found.');
      return;
    }

    // 2. Calculate distance for each ambulance
    const ambulancesWithDistance = availableAmbulances
      .filter(amb => amb.last_latitude && amb.last_longitude) // Only consider ambulances with a known location
      .map(amb => {
        const distance = getDistance(
          scene_location.lat, scene_location.lon,
          amb.last_latitude, amb.last_longitude
        );
        return { ...amb, distance };
      });

    if (ambulancesWithDistance.length === 0) {
      console.log('[Auto-Dispatch] No available ambulances with known locations.');
      return;
    }

    // 3. Find the closest ambulance
    const closestAmbulance = ambulancesWithDistance.reduce((prev, curr) => {
      return prev.distance < curr.distance ? prev : curr;
    });

    // 4. Assign the trip
    const assignment_timestamp = new Date();
    const assignSql = `
      UPDATE emergencytrips
      SET status = 'Assigned', assigned_ambulance_id = ?, assignment_timestamp = ?
      WHERE trip_id = ?;
    `;
    await new Promise((resolve, reject) => {
      executeQuery(assignSql, [closestAmbulance.ambulance_id, assignment_timestamp, trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 5. Update ambulance status
    const updateAmbulanceSql = `UPDATE ambulances SET current_status = 'On_Trip' WHERE ambulance_id = ?`;
    await new Promise((resolve, reject) => {
      executeQuery(updateAmbulanceSql, [closestAmbulance.ambulance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 6. Insert initial location into history
    const insertLocationSql = `INSERT INTO ambulancelocationhistory (ambulance_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`;
    await new Promise((resolve, reject) => {
      executeQuery(insertLocationSql, [closestAmbulance.ambulance_id, closestAmbulance.last_latitude, closestAmbulance.last_longitude, new Date()], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // 7. Broadcast WebSocket updates
    const tripUpdate = { trip_id, status: 'Assigned', assigned_ambulance_id: closestAmbulance.ambulance_id };
    const ambulanceUpdate = { ambulance_id: closestAmbulance.ambulance_id, status: 'On_Trip' };

    broadcast(wss, { type: 'TRIP_ASSIGNED', payload: { trip: tripUpdate, ambulance: ambulanceUpdate } });
    broadcast(wss, { type: 'FLEET_STATUS_UPDATE', payload: [ambulanceUpdate] });

  } catch (error) {
    console.error('[Auto-Dispatch] Error:', error);
  }
}


// --- API Endpoints ---

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for image uploads
const uploadDir = path.join(__dirname, '../uploads/accidents');
// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'accident-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Initialize Azure OpenAI Client
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2024-05-01-preview",
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_ID // "gpt-4o"
});

router.post('/book-ambulance', upload.single('accidentImage'), async (req, res) => {
  // Extract text fields manually if using FormData, multer handles parsing
  const { patient_id, latitude, longitude, notes } = req.body;
  const accidentImage = req.file ? `/uploads/accidents/${req.file.filename}` : null;

  if (!patient_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'Patient ID, latitude, and longitude are required.' });
  }

  try {
    // Get patient details to use for the trip
    const patientSql = 'SELECT firstName, lastName FROM patients WHERE id = ?';
    const patient = await new Promise((resolve, reject) => {
      executeQuery(patientSql, [patient_id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // --- AI Verification Logic ---
    let verification_status = 'Pending';
    let verification_reason = 'Analysis in progress...';

    if (req.file) {
      console.log(`[AI Verification] Image received: ${req.file.path}`);

      try {
        const imagePath = req.file.path;

        // Resize image for AI (Fix 413 Payload Too Large)
        console.log('[AI Verification] Resizing image...');
        // Note: Check if Jimp import is correct. Assuming v0.x based on common usage, but v1 has breaking changes.
        // If "const { Jimp } = require('jimp')" is used, it might be the class.
        // Let's assume standard behavior or fix if it errors.

        const image = await Jimp.read(imagePath);

        // Resize to max width 500px, auto height
        if (image.bitmap.width > 500) {
          image.resize({ w: 500 });
        }

        // Compress quality to 50%
        const resizedBuffer = await image.getBuffer("image/jpeg", { quality: 50 });
        const base64Image = resizedBuffer.toString('base64');
        console.log(`[AI Verification] Base64 Image Length: ${base64Image.length} characters`);
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log('[AI Verification] Image resized. Sending request to Azure OpenAI...');

        const response = await client.chat.completions.create({
          messages: [
            { role: "system", content: "You are an AI assistant helping emergency services verify accident reports. Analyze the image to determine if it depicts a real vehicle accident, fire, or medical emergency. Result should be strictly JSON format: { \"is_real\": boolean, \"reason\": \"short explanation\" }." },
            {
              role: "user", content: [
                { type: "text", text: "Is this a valid accident scene?" },
                { type: "image_url", imageUrl: { url: dataUrl, detail: "low" } }
              ]
            }
          ],
          model: process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o",
          response_format: { type: "json_object" },
          max_tokens: 150
        });

        console.log('[AI Verification] Response received.');
        const result = JSON.parse(response.choices[0].message.content);
        verification_status = result.is_real ? 'Verified' : 'Suspected Fake';
        verification_reason = result.reason;
        console.log(`[AI Verification] Result: ${verification_status} - ${verification_reason}`);

      } catch (aiError) {
        console.error("AI Verification Failed:", aiError);
        verification_status = 'Error';
        verification_reason = 'AI service unavailable: ' + aiError.message;
      }
    } else {
      console.log('[AI Verification] No image file provided.');
      verification_status = 'No Image';
      verification_reason = 'No image provided for verification.';
    }
    // -----------------------------

    const trip_id = `ER-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const alert_timestamp = new Date();
    const newTrip = {
      trip_id,
      status: 'New_Alert',
      alert_source: 'Patient_App',
      scene_location_lat: latitude,
      scene_location_lon: longitude,
      patient_name: `${patient.firstName} ${patient.lastName}`,
      notes: notes + (accidentImage ? ` [IMAGE_ATTACHED: ${accidentImage}]` : ''), // Append image info to notes for compat
      patient_id: patient_id, // Keep as string if DB expects it
      booked_by_patient_id: patient_id,
      alert_timestamp,
      trip_image_url: accidentImage,
      verification_status,
      verification_reason
    };

    // Ensure latitude/longitude are numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const sql = `INSERT INTO emergencytrips (trip_id, status, alert_source, scene_location_lat, scene_location_lon, patient_name, notes, patient_id, booked_by_patient_id, alert_timestamp, trip_image_url, verification_status, verification_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await new Promise((resolve, reject) => {
      // Use newTrip.notes which might include the image tag
      executeQuery(sql, [trip_id, 'New_Alert', 'Patient_App', lat, lon, newTrip.patient_name, newTrip.notes, patient_id, patient_id, alert_timestamp, accidentImage, verification_status, verification_reason], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    // Broadcast WebSocket message for the new alert
    broadcast(req.wss, { type: 'NEW_ALERT', payload: newTrip });

    res.status(201).json({ success: true, message: 'Ambulance booked successfully! Help is on the way.', trip_id: trip_id, verification: { status: verification_status, reason: verification_reason } });

    // Trigger auto-dispatch asynchronously
    autoDispatchTrip(trip_id, { lat: lat, lon: lon }, req.wss);

  } catch (error) {
    console.error("Database error booking ambulance:", error);
    res.status(500).json({ success: false, message: 'Failed to book ambulance.' });
  }
});

// IoT Alert Endpoint (Automated Crash Detection)
router.post('/receive-iot-alert', async (req, res) => {
  const { latitude, longitude, speed, status, deviceId } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'Location data required.' });
  }

  try {
    const trip_id = `IOT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const alert_timestamp = new Date();

    // Construct automated notes
    let notes = `[CRASH DETECTED] Speed: ${speed}km/h. Device: ${deviceId}.`;
    if (status === 'Unconscious' || status === 'Critical') {
      notes += ` [SEVERE] Driver Status: ${status.toUpperCase()} - IMMEDIATE DISPATCH REQ.`;
    }

    // Use a placeholder or registered patient ID for the car owner
    // For this demo, we'll assign it to a "Unknown/IoT" profile or reuse an existing one if needed.
    // Assuming patient_id 1 is the demo user "John Doe", lets attribute it to him for the demo flow so he sees it on his tracking app?
    // Or better, leave patient details generic.
    const patient_name = "Unknown Driver (IoT)";
    const patient_id = 1; // Demo ID for now to allow tracking on frontend if logged in as user 1

    const newTrip = {
      trip_id,
      status: 'New_Alert',
      alert_source: 'IoT_Sensor',
      scene_location_lat: latitude,
      scene_location_lon: longitude,
      patient_name,
      notes,
      patient_id,
      booked_by_patient_id: patient_id,
      alert_timestamp
    };

    const sql = `INSERT INTO emergencytrips (trip_id, status, alert_source, scene_location_lat, scene_location_lon, patient_name, notes, patient_id, booked_by_patient_id, alert_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await new Promise((resolve, reject) => {
      executeQuery(sql, [trip_id, 'New_Alert', 'IoT_Sensor', latitude, longitude, patient_name, notes, patient_id, patient_id, alert_timestamp], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    broadcast(req.wss, { type: 'NEW_ALERT', payload: newTrip });

    res.status(201).json({ success: true, message: 'IoT Crash Alert Received.', trip_id });

    // Trigger Auto-Dispatch immediately for critical status
    if (status === 'Unconscious' || status === 'Critical') {
      autoDispatchTrip(trip_id, { lat: latitude, lon: longitude }, req.wss);
    }

  } catch (error) {
    console.error("IoT Alert Error:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/my-trip-status', async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ success: false, message: 'Patient ID is required.' });
  }

  try {
    const sql = `
            SELECT 
                et.trip_id,
                et.status,
                et.trip_image_url,
                et.assignment_timestamp,
                et.completion_timestamp,
                et.eta_minutes,
                a.vehicle_name,
                u.firstName as paramedic_firstName,
                u.lastName as paramedic_lastName,
                u.phone as paramedic_phone,
                (SELECT alh.latitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = et.assigned_ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as ambulance_latitude,
                (SELECT alh.longitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = et.assigned_ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as ambulance_longitude
            FROM emergencytrips et
            LEFT JOIN ambulances a ON et.assigned_ambulance_id = a.ambulance_id
            LEFT JOIN (
                SELECT ac1.*
                FROM ambulancecrews ac1
                INNER JOIN (
                    SELECT ambulance_id, MAX(shift_start_time) as max_start
                    FROM ambulancecrews
                    WHERE shift_end_time IS NULL
                    GROUP BY ambulance_id
                ) ac2 ON ac1.ambulance_id = ac2.ambulance_id AND ac1.shift_start_time = ac2.max_start
            ) ac ON et.assigned_ambulance_id = ac.ambulance_id
            LEFT JOIN employees u ON ac.user_id = u.id
            WHERE et.booked_by_patient_id = ? AND et.status NOT IN ('Completed', 'Cancelled')
            ORDER BY et.alert_timestamp DESC
            LIMIT 1;
        `;

    const trip = await new Promise((resolve, reject) => {
      executeQuery(sql, [patientId], (err, result) => {
        if (err) return reject(err);
        resolve(result[0] || null);
      });
    });

    res.json({ success: true, trip: trip });

  } catch (error) {
    console.error("Database error fetching patient's trip status:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip status.' });
  }
});

router.post('/cancel-trip', async (req, res) => {
  const { trip_id } = req.body;
  if (!trip_id) {
    return res.status(400).json({ success: false, message: 'Trip ID is required.' });
  }

  try {
    // Get the assigned ambulance_id before updating the trip
    const getTripSql = `SELECT assigned_ambulance_id FROM emergencytrips WHERE trip_id = ?`;
    const trip = await new Promise((resolve, reject) => {
      executeQuery(getTripSql, [trip_id], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return reject(new Error('Trip not found.'));
        resolve(result[0]);
      });
    });
    const { assigned_ambulance_id } = trip;

    // Update trip status to 'Cancelled'
    const updateTripSql = `UPDATE emergencytrips SET status = 'Cancelled' WHERE trip_id = ?`;
    await new Promise((resolve, reject) => {
      executeQuery(updateTripSql, [trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // If an ambulance was assigned, update its status to 'Available'
    if (assigned_ambulance_id) {
      const updateAmbulanceSql = `UPDATE ambulances SET current_status = 'Available', current_trip_id = NULL WHERE ambulance_id = ?`;
      await new Promise((resolve, reject) => {
        executeQuery(updateAmbulanceSql, [assigned_ambulance_id], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }

    res.json({ success: true, message: 'Trip cancelled successfully.' });

  } catch (error) {
    console.error("Database error cancelling trip:", error);
    res.status(500).json({ success: false, message: 'Failed to cancel trip.' });
  }
});


module.exports = router;
