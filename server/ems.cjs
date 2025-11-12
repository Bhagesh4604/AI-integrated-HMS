const express = require('express');
const router = express.Router();
const { pool, executeQuery } = require('./db.cjs');
const WebSocket = require('ws');
const fetch = require('node-fetch'); // Import node-fetch

// Helper function to broadcast to all clients
const broadcast = (wss, data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
  
      client.send(JSON.stringify(data));
    }
  });
};

// Helper function to send push notifications
const sendPushNotification = async (firebaseAdmin, employeeId, title, body, data = {}) => {
  if (!firebaseAdmin) {
    console.warn("Firebase Admin SDK not initialized. Cannot send push notification.");
    return;
  }

  try {
    const sql = 'SELECT device_token FROM paramedicdevicetokens WHERE employee_id = ?';
    const results = await new Promise((resolve, reject) => {
      executeQuery(sql, [employeeId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    if (results.length === 0) {
      console.log(`No device token found for employeeId: ${employeeId}. Cannot send push notification.`);
      return;
    }

    const deviceToken = results[0].device_token;

    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Required for Capacitor/Firebase to open app
      },
      token: deviceToken,
    };

    const response = await firebaseAdmin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};


// Get New Emergency Alerts
router.get('/alerts/new', (req, res) => {
  const sql = `SELECT * FROM emergencytrips WHERE status = 'New_Alert' ORDER BY alert_timestamp DESC`;
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching new alerts:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch new alerts.' });
    }
    res.json({ success: true, alerts: results });
  });
});

// Get Available Ambulances for Clock-in
router.get('/ambulances/available', (req, res) => {
  const sql = `
    SELECT
      a.ambulance_id,
      a.vehicle_name,
      a.license_plate
    FROM ambulances a
    WHERE a.ambulance_id NOT IN (
      SELECT DISTINCT ac.ambulance_id
      FROM ambulancecrews ac
      WHERE ac.shift_end_time IS NULL
    )
  `;
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching available ambulances:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch available ambulances.' });
    }
    res.json({ success: true, ambulances: results });
  });
});

// Get All Ambulances Status
router.get('/ambulances/status', (req, res) => {
  const sql = `SELECT ambulance_id, vehicle_name, license_plate, current_status FROM ambulances ORDER BY vehicle_name`;
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching ambulance statuses:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch ambulance statuses.' });
    }
    res.json({ success: true, fleetStatus: results });
  });
});

// Get last known location of all available ambulances with active crews
router.get('/ambulances/locations', (req, res) => {
  const sql = `
    SELECT alh.ambulance_id, alh.latitude, alh.longitude, alh.timestamp, a.vehicle_name
    FROM ambulancelocationhistory alh
    INNER JOIN (
        SELECT ambulance_id, MAX(timestamp) as max_timestamp
        FROM ambulancelocationhistory
        GROUP BY ambulance_id
    ) as latest ON alh.ambulance_id = latest.ambulance_id AND alh.timestamp = latest.max_timestamp
    JOIN ambulances a ON alh.ambulance_id = a.ambulance_id
    WHERE a.current_status = 'Available'
    AND a.ambulance_id IN (
      SELECT DISTINCT ac.ambulance_id
      FROM ambulancecrews ac
      WHERE ac.shift_end_time IS NULL
    )
  `;
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching ambulance locations:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch ambulance locations.' });
    }
    res.json({ success: true, locations: results });
  });
});

// Add a new ambulance
router.post('/ambulances', (req, res) => {
  const { vehicle_name, license_plate } = req.body;
  if (!vehicle_name || !license_plate) {
    return res.status(400).json({ success: false, message: 'Vehicle name and license plate are required.' });
  }

  const sql = `INSERT INTO ambulances (vehicle_name, license_plate, current_status) VALUES (?, ?, 'Available')`;
  executeQuery(sql, [vehicle_name, license_plate], (err, result) => {
    if (err) {
      console.error("Database error adding ambulance:", err);
      return res.status(500).json({ success: false, message: 'Failed to add ambulance.' });
    }
    res.json({ success: true, message: 'ambulance added successfully.', ambulance_id: result.insertId });
  });
});

// Delete an ambulance
router.delete('/ambulances/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ambulance ID is required.' });
  }

  const sql = `DELETE FROM ambulances WHERE ambulance_id = ?`;
  executeQuery(sql, [id], (err, result) => {
    if (err) {
      console.error("Database error deleting ambulance:", err);
      return res.status(500).json({ success: false, message: 'Failed to delete ambulance.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ambulance not found.' });
    }
    res.json({ success: true, message: 'ambulance deleted successfully.' });
  });
});

// Update ambulance status
router.put('/ambulances/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ success: false, message: 'ambulance ID and status are required.' });
  }

  const validStatuses = ['Available', 'On_Trip', 'Not_Available'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const sql = `UPDATE ambulances SET current_status = ? WHERE ambulance_id = ?`;
  executeQuery(sql, [status, id], (err, result) => {
    if (err) {
      console.error("Database error updating ambulance status:", err);
      return res.status(500).json({ success: false, message: 'Failed to update ambulance status.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ambulance not found.' });
    }
    res.json({ success: true, message: 'ambulance status updated successfully.' });
  });
});

// Get Active Trips
router.get('/trips/active', (req, res) => {
  const sql = `
    SELECT 
      et.*, 
      a.vehicle_name, 
      a.license_plate,
      (SELECT alh.latitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = et.assigned_ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as last_latitude,
      (SELECT alh.longitude FROM ambulancelocationhistory alh WHERE alh.ambulance_id = et.assigned_ambulance_id ORDER BY alh.timestamp DESC LIMIT 1) as last_longitude
    FROM emergencytrips et
    LEFT JOIN ambulances a ON et.assigned_ambulance_id = a.ambulance_id
    WHERE et.status IN ('Assigned', 'En_Route_To_Scene', 'At_Scene', 'Transporting')
    ORDER BY et.alert_timestamp DESC
  `;
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching active trips:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch active trips.' });
    }
    res.json({ success: true, trips: results });
  });
});

// Assign Trip to Ambulance
router.post('/trips/assign', async (req, res) => {
  const { trip_id, ambulance_id } = req.body;

  if (!trip_id || !ambulance_id) {
    return res.status(400).json({ success: false, message: 'Trip ID and ambulance ID are required.' });
  }

  let connection;
  try {
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    const updateTripSql = `UPDATE emergencytrips SET status = 'Assigned', assigned_ambulance_id = ? WHERE trip_id = ? AND status = 'New_Alert'`;
    const tripUpdateResult = await new Promise((resolve, reject) => {
      connection.query(updateTripSql, [ambulance_id, trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (tripUpdateResult.affectedRows === 0) {
      await new Promise(resolve => connection.rollback(() => resolve()));
      return res.status(400).json({ success: false, message: 'Trip not found or already assigned.' });
    }

    const updateambulanceSql = `UPDATE ambulances SET current_status = 'On_Trip', current_trip_id = ? WHERE ambulance_id = ? AND current_status = 'Available'`;
    const ambulanceUpdateResult = await new Promise((resolve, reject) => {
      connection.query(updateambulanceSql, [trip_id, ambulance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (ambulanceUpdateResult.affectedRows === 0) {
      await new Promise(resolve => connection.rollback(() => resolve()));
      return res.status(400).json({ success: false, message: 'ambulance not found or not available.' });
    }

    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Fetch the updated ambulance to broadcast
    const getambulanceSql = `SELECT * FROM ambulances WHERE ambulance_id = ?`;
    const updatedAmbulance = await new Promise((resolve, reject) => {
      connection.query(getambulanceSql, [ambulance_id], (err, result) => {
        if (err || result.length === 0) return reject(err || new Error('ambulance not found after update.'));
        resolve(result[0]);
      });
    });

    // Fetch the last known location of the assigned ambulance
    const getLastLocationSql = `SELECT latitude, longitude FROM ambulancelocationhistory WHERE ambulance_id = ? ORDER BY timestamp DESC LIMIT 1`;
    const lastLocation = await new Promise((resolve, reject) => {
      executeQuery(getLastLocationSql, [ambulance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0] || null); // Return null if no location found
      });
    });

    // Fetch the full trip details to include in the payload
    const getTripSql = `SELECT * FROM emergencytrips WHERE trip_id = ?`;
    const tripDetails = await new Promise((resolve, reject) => {
      executeQuery(getTripSql, [trip_id], (err, result) => {
        if (err || result.length === 0) return reject(err || new Error('Trip not found after assignment.'));
        resolve(result[0]);
      });
    });

    // Broadcast WebSocket message
    broadcast(req.wss, { type: 'TRIP_ASSIGNED', payload: { trip: tripDetails, ambulance: updatedAmbulance, lastLocation } });

    // --- Send Push Notification to assigned paramedic ---
    const getParamedicSql = `SELECT ac.user_id FROM ambulancecrews ac WHERE ac.ambulance_id = ?`;
    const paramedics = await new Promise((resolve, reject) => {
      executeQuery(getParamedicSql, [ambulance_id], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    if (paramedics.length > 0) {
      const paramedicUserId = paramedics[0].user_id;
      sendPushNotification(
        req.app.get('firebaseAdmin'), // Get the firebaseAdmin instance from app locals
        paramedicUserId,
        'New Trip Assigned!',
        `You have been assigned to trip ${trip_id}. Tap to view details.`,
        { trip_id: trip_id }
      );
    }

    // Non-blocking ETA calculation
    try {
      if (lastLocation && tripDetails) {
        const url = `https://router.project-osrm.org/route/v1/driving/${lastLocation.longitude},${lastLocation.latitude};${tripDetails.scene_location_lon},${tripDetails.scene_location_lat}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length) {
          const etaMinutes = Math.round(data.routes[0].duration / 60);
          tripDetails.eta_minutes = etaMinutes; // Add to broadcast payload
          const updateEtaSql = `UPDATE emergencytrips SET eta_minutes = ? WHERE trip_id = ?`;
          executeQuery(updateEtaSql, [etaMinutes, trip_id], (err) => {
            if (err) console.error(`[Non-blocking] Error updating ETA for trip ${trip_id}:`, err);
            // else console.log(`[Non-blocking] Successfully updated ETA for trip ${trip_id} to ${etaMinutes} minutes.`);
          });
        }
      }
    } catch (etaErr) {
      console.error(`[Non-blocking] Failed to calculate initial ETA for trip ${trip_id}:`, etaErr);
    }

    // Broadcast WebSocket message
    broadcast(req.wss, { type: 'TRIP_ASSIGNED', payload: { trip: tripDetails, ambulance: updatedambulance, lastLocation } });

    res.json({ success: true, message: 'Trip assigned successfully!' });

  } catch (err) {
    if (connection) {
      await new Promise(resolve => connection.rollback(() => resolve()));
    }
    console.error('Error assigning trip:', err);
    res.status(500).json({ success: false, message: 'Failed to assign trip.' });
  } finally {
    if (connection) connection.release();
  }
});

// Manually Create New Emergency Alert
router.post('/alerts/manual', async (req, res) => {
  const { scene_location_lat, scene_location_lon, patient_name, notes, patient_id } = req.body;

  if (scene_location_lat === undefined || scene_location_lon === undefined) {
    return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
  }

  const trip_id = `ER-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const alert_timestamp = new Date();
  const newAlert = {
    trip_id,
    status: 'New_Alert',
    alert_source: 'Manual_Entry',
    scene_location_lat,
    scene_location_lon,
    patient_name,
    notes,
    patient_id, // Include patient_id
    alert_timestamp
  };

  const sql = `INSERT INTO emergencytrips (trip_id, status, alert_source, scene_location_lat, scene_location_lon, patient_name, notes, patient_id, alert_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  executeQuery(sql, [trip_id, 'New_Alert', 'Manual_Entry', scene_location_lat, scene_location_lon, patient_name, notes, patient_id, alert_timestamp], (err, results) => {
    if (err) {
      console.error("Database error creating manual alert:", err);
      return res.status(500).json({ success: false, message: 'Failed to create manual alert.' });
    }
    
    // Broadcast WebSocket message
    broadcast(req.wss, { type: 'NEW_ALERT', payload: newAlert });

    res.json({ success: true, message: 'Manual alert created successfully!', trip_id: trip_id });
  });
});

// Get Paramedic's Assigned Trip
router.get('/paramedic/my-trip', (req, res) => {
  const { paramedicId } = req.query;

  if (!paramedicId) {
    return res.status(400).json({ success: false, message: 'Paramedic ID is required.' });
  }

  const sql = `
    SELECT
      et.*,
      a.vehicle_name,
      a.license_plate,
      p.firstName AS patient_firstName,
      p.lastName AS patient_lastName,
      p.dateOfBirth AS patient_dateOfBirth,
      p.gender AS patient_gender,
      p.bloodGroup AS patient_bloodGroup,
      p.phone AS patient_phone,
      p.email AS patient_email
    FROM emergencytrips et
    JOIN ambulances a ON et.assigned_ambulance_id = a.ambulance_id
    JOIN ambulancecrews ac ON a.ambulance_id = ac.ambulance_id
    LEFT JOIN patients p ON et.patient_id = p.id
    WHERE ac.user_id = ? AND et.status IN ('Assigned', 'En_Route_To_Scene', 'At_Scene', 'Transporting', 'At_Hospital')
    ORDER BY et.alert_timestamp DESC
    LIMIT 1;
  `;

  executeQuery(sql, [paramedicId], (err, results) => {
    if (err) {
      console.error("Database error fetching paramedic's trip:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch paramedic trip.' });
    }

    if (results.length > 0) {
      res.json({ success: true, trip: results[0] });
    } else {
      res.json({ success: true, trip: null, message: 'No active trip found for this paramedic.' });
    }
  });
});

// Submit Patient Vitals
router.post('/vitals', (req, res) => {
  const { trip_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, notes } = req.body;

  if (!trip_id) {
    return res.status(400).json({ success: false, message: 'Trip ID is required.' });
  }

  const timestamp = new Date();
  const newVitals = { trip_id, timestamp, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, notes };
  const sql = `INSERT INTO tripvitals (trip_id, timestamp, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, notes) VALUES (?, ?, ?, ?, ?, ?)`;
  
  executeQuery(sql, [trip_id, timestamp, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, notes], (err, results) => {
    if (err) {
      console.error("Database error submitting vitals:", err);
      return res.status(500).json({ success: false, message: 'Failed to submit vitals.' });
section    }
    
    // Broadcast WebSocket message
    const payload = { ...newVitals, vitals_id: results.insertId };
    // console.log('[WebSocket Broadcast] Broadcasting NEW_VITALS:', payload);
    broadcast(req.wss, { type: 'NEW_VITALS', payload });

    res.json({ success: true, message: 'Vitals submitted successfully!', vitals_id: results.insertId });
  });
});
// Update Emergency Trip Status
router.post('/trips/status', async (req, res) => {
  const { trip_id, new_status } = req.body;

  if (!trip_id || !new_status) {
    return res.status(400).json({ success: false, message: 'Trip ID and new status are required.' });
  }

  const validStatuses = ['En_Route_To_Scene', 'At_Scene', 'Transporting', 'At_Hospital', 'Completed'];
  if (!validStatuses.includes(new_status)) {
    return res.status(400).json({ success: false, message: 'Invalid trip status provided.' });
  }

  // The 'Completed' status has its own dedicated endpoint (/trips/complete) which also handles ambulance status.
  // This prevents a trip from being marked 'Completed' without the ambulance being correctly updated.
  if (new_status === 'Completed') {
    return res.status(400).json({ success: false, message: "Please use the '/api/ems/trips/complete' endpoint to complete a trip." });
  }

  try {
    const updateSql = `UPDATE emergencytrips SET status = ? WHERE trip_id = ?`;
    const updateResult = await new Promise((resolve, reject) => {
      executeQuery(updateSql, [new_status, trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found or status already updated.' });
    }

    // Fetch the updated trip details to broadcast
    const getTripSql = `
      SELECT et.*, a.vehicle_name, a.license_plate
      FROM emergencytrips et
      LEFT JOIN ambulances a ON et.assigned_ambulance_id = a.ambulance_id
      WHERE et.trip_id = ?
    `;
    const trips = await new Promise((resolve, reject) => {
      executeQuery(getTripSql, [trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (trips.length === 0) {
      // This case should ideally not be reached if the update was successful
      return res.status(404).json({ success: false, message: 'Trip disappeared after update.' });
    }
    const updatedTrip = trips[0];

    // Also fetch the last known location to send with the update
    const getLastLocationSql = `SELECT latitude, longitude FROM ambulancelocationhistory WHERE ambulance_id = ? ORDER BY timestamp DESC LIMIT 1`;
    const lastLocation = await new Promise((resolve, reject) => {
      executeQuery(getLastLocationSql, [updatedTrip.assigned_ambulance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0] || null);
      });
    });

    // Broadcast WebSocket message with the updated trip and location
    broadcast(req.wss, { type: 'TRIP_STATUS_UPDATE', payload: { trip: updatedTrip, lastLocation: lastLocation } });

    res.json({ success: true, message: `Trip status updated to ${new_status}!` });

  } catch (err) {
    console.error("Database error updating trip status:", err);
    res.status(500).json({ success: false, message: 'Failed to update trip status.' });
  }
});

// Complete a Trip and Make Ambulance Available
router.post('/trips/complete', async (req, res) => {
  const { trip_id } = req.body;

  if (!trip_id) {
    return res.status(400).json({ success: false, message: 'Trip ID is required.' });
  }

  let connection;
  try {
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Get the assigned ambulance_id before updating the trip
    const getTripSql = `SELECT assigned_ambulance_id FROM emergencytrips WHERE trip_id = ?`;
    const trip = await new Promise((resolve, reject) => {
      connection.query(getTripSql, [trip_id], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return reject(new Error('Trip not found.'));
        resolve(result[0]);
      });
    });
    const { assigned_ambulance_id } = trip;

    // Update trip status to 'Completed'
    const updateTripSql = `UPDATE emergencytrips SET status = 'Completed' WHERE trip_id = ?`;
all    await new Promise((resolve, reject) => {
      connection.query(updateTripSql, [trip_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Update ambulance status to 'Available'
    const updateambulanceSql = `UPDATE ambulances SET current_status = 'Available', current_trip_id = NULL WHERE ambulance_id = ?`;
    await new Promise((resolve, reject) => {
      connection.query(updateambulanceSql, [assigned_ambulance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    await new Promise((resolve, reject) => {
warning      connection.commit(err => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Fetch the updated ambulance to broadcast
    const getambulanceSql = `SELECT * FROM ambulances WHERE ambulance_id = ?`;
    const updatedAmbulance = await new Promise((resolve, reject) => {
      connection.query(getambulanceSql, [assigned_ambulance_id], (err, result) => {
        if (err || result.length === 0) return reject(err || new Error('ambulance not found after update.'));
        resolve(result[0]);
      });
    });

    // Broadcast WebSocket message
    broadcast(req.wss, { type: 'TRIP_COMPLETED', payload: { trip_id, ambulance: updatedambulance } });

    res.json({ success: true, message: 'Trip completed successfully!' });

  } catch (err) {
    if (connection) {
      await new Promise(resolve => connection.rollback(() => resolve()));
    }
    console.error('Error completing trip:', err);
    res.status(500).json({ success: false, message: 'Failed to complete trip.' });
section  } finally {
    if (connection) connection.release();
  }
});


// Get Transporting Trips for ER Dashboard
router.get('/trips/transporting', (req, res) => {
  const sql = `
    SELECT
      et.*,
      a.vehicle_name,
      a.license_plate,
      (
        SELECT
          JSON_OBJECT(
            'vitals_id', tv.vitals_id,
            'timestamp', tv.timestamp,
            'heart_rate', tv.heart_rate,
            'blood_pressure_systolic', tv.blood_pressure_systolic,
            'blood_pressure_diastolic', tv.blood_pressure_diastolic,
s            'notes', tv.notes
          )
        FROM
          tripvitals tv
        WHERE
          tv.trip_id = et.trip_id
        ORDER BY
          tv.timestamp DESC
        LIMIT 1
      ) AS latest_vitals
    FROM
      emergencytrips et
    JOIN
      ambulances a ON et.assigned_ambulance_id = a.ambulance_id
    WHERE
      et.status = 'Transporting'
    ORDER BY
      et.alert_timestamp DESC;
  `;

  executeQuery(sql, [], (err, results) => {
    if (err) {
section      console.error("Database error fetching transporting trips:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch transporting trips.' });
    }
    const trips = results.map(trip => ({
      ...trip,
      latest_vitals: trip.latest_vitals ? JSON.parse(trip.latest_vitals) : null
    }));
    res.json({ success: true, trips: trips });
  });
});

// Receive Ambulance Location Updates
router.post('/ambulance/location', (req, res) => {
  const { ambulance_id, latitude, longitude, timestamp } = req.body;

  if (!ambulance_id || latitude === undefined || longitude === undefined || !timestamp) {
    return res.status(400).json({ success: false, message: 'ambulance ID, latitude, longitude, and timestamp are required.' });
  }

  // Store this location data in a database table (e.g., mbulanceLocationHistory)
  const insertLocationSql = `INSERT INTO ambulancelocationhistory (ambulance_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`;
  executeQuery(insertLocationSql, [ambulance_id, latitude, longitude, timestamp], (err, results) => {
    if (err) {
      console.error("Database error storing ambulance location:", err);
      // Continue processing even if storing fails, as broadcasting is more critical for real-time
    }
    // Broadcast the location update to all clients
    broadcast(req.wss, { type: 'AMBULANCE_LOCATION_UPDATE', payload: { ambulance_id, latitude, longitude, timestamp } });

    // --- Non-blocking ETA recalculation ---
    (async () => {
      try {
        // 1. Find the active trip for this ambulance
        const getTripSql = `SELECT trip_id, scene_location_lat, scene_location_lon FROM emergencytrips WHERE assigned_ambulance_id = ? AND status IN ('Assigned', 'En_Route_To_Scene', 'Transporting')`;
        const trips = await new Promise((resolve, reject) => {
          executeQuery(getTripSql, [ambulance_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        if (trips.length > 0) {
source          const trip = trips[0];
          const { trip_id, scene_location_lat, scene_location_lon } = trip;

          // 2. Fetch new ETA from OSRM
          const url = `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${scene_location_lon},${scene_location_lat}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.routes && data.routes.length) {
            const etaMinutes = Math.round(data.routes[0].duration / 60);

            // 3. Update ETA in the database
            const updateEtaSql = `UPDATE emergencytrips SET eta_minutes = ? WHERE trip_id = ?`;
            executeQuery(updateEtaSql, [etaMinutes, trip_id], (err) => {
              if (err) console.error(`[Non-blocking] Error updating ETA for trip ${trip_id}:`, err);
s              // else console.log(`[Non-blocking] Successfully updated ETA for trip ${trip_id} to ${etaMinutes} minutes.`);
            });

            // 4. Broadcast ETA update
            broadcast(req.wss, { type: 'TRIP_ETA_UPDATE', payload: { trip_id, eta_minutes: etaMinutes } });
          }
        }
      } catch (etaErr) {
        console.error(`[Non-blocking] Failed to recalculate ETA for ambulance ${ambulance_id}:`, etaErr);
      }
    })();

    res.json({ success: true, message: 'Location update received.' });
  });
});

// Register Paramedic Device for Push Notifications
router.post('/paramedic/register-device', (req, res) => {
  const { employeeId, deviceToken } = req.body;

  if (!employeeId || !deviceToken) {
    return res.status(400).json({ success: false, message: 'Employee ID and device token are required.' });
  }

  // Check if token already exists for this employee or as a standalone token
  const checkSql = 'SELECT * FROM paramedicdevicetokens WHERE employee_id = ? OR device_token = ?';
  executeQuery(checkSql, [employeeId, deviceToken], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Database error checking device token:", checkErr);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }

    if (checkResults.length > 0) {
      // If token exists for this employee, update it. If token exists for another employee, update it.
      // This logic assumes a device token should be unique and associated with one employee at a time.
      const updateSql = 'UPDATE paramedicdevicetokens SET device_token = ?, employee_id = ? WHERE id = ?';
      const existingEntry = checkResults[0];
      executeQuery(updateSql, [deviceToken, employeeId, existingEntry.id], (updateErr) => {
        if (updateErr) {
          console.error("Database error updating device token:", updateErr);
          return res.status(500).json({ success: false, message: 'Failed to update device token.' });
        }
        res.json({ success: true, message: 'Device token updated successfully.' });
      });
    } else {
      // Insert new token
      const insertSql = 'INSERT INTO paramedicdevicetokens (employee_id, device_token) VALUES (?, ?)';
E      executeQuery(insertSql, [employeeId, deviceToken], (insertErr) => {
        if (insertErr) {
          console.error("Database error inserting device token:", insertErr);
          return res.status(500).json({ success: false, message: 'Failed to register device token.' });
        }
        res.json({ success: true, message: 'Device token registered successfully.' });
s      });
    }
  });
});

// Get Trip History
router.get('/trips/history', (req, res) => {
  const sql = `
    SELECT et.trip_id, et.status, et.scene_location_lat, et.scene_location_lon, et.alert_timestamp, et.updated_at, a.vehicle_name
section    FROM emergencytrips et
    LEFT JOIN ambulances a ON et.assigned_ambulance_id = a.ambulance_id
    WHERE et.status = 'Completed'
    ORDER BY et.updated_at DESC
    LIMIT 100; -- Add a limit to prevent fetching too much data at once
  `;
  
  executeQuery(sql, [], (err, results) => {
    if (err) {
      console.error("Database error fetching trip history:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch trip history.' });
    }
    res.json({ success: true, trips: results });
  });
});

// Search Patients
router.get('/patients/search', (req, res) => {
source  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required.' });
  }

  const sql = `
    SELECT id, patientId, firstName, lastName, dateOfBirth, bloodGroup, phone, email
    FROM patients
    WHERE firstName LIKE ? OR lastName LIKE ? OR patientId LIKE ?
    LIMIT 10;
  `;
  const searchTerm = `%${query}%`;

  executeQuery(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error("Database error searching patients:", err);
      return res.status(500).json({ success: false, message: 'Failed to search patients.' });
    }
    res.json({ success: true, patients: results });
  });
});

// --- Shift Management Endpoints ---

// Get a paramedic's current active shift
router.get('/crews/my-shift', (req, res) => {
  const { paramedicId } = req.query;
  if (!paramedicId) {
    return res.status(400).json({ success: false, message: 'Paramedic ID is required.' });
  }

  const sql = `
    SELECT ac.shift_id, ac.ambulance_id, ac.shift_start_time, a.vehicle_name
    FROM ambulancecrews ac
    JOIN ambulances a ON ac.ambulance_id = a.ambulance_id
    WHERE ac.user_id = ? AND ac.shift_end_time IS NULL
    LIMIT 1;
  `;

  executeQuery(sql, [paramedicId], (err, results) => {
    if (err) {
      console.error("Database error fetching paramedic's shift:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch shift.' });
    }
    res.json({ success: true, shift: results[0] || null });
  });
});

// Clock in for a shift
router.post('/crews/clock-in', async (req, res) => {
  const { user_id, ambulance_id } = req.body;
  if (!user_id || !ambulance_id) {
    return res.status(400).json({ success: false, message: 'User ID and ambulance ID are required.' });
E  }

  try {
    // Check if user already has an active shift
    const checkSql = `SELECT shift_id FROM ambulancecrews WHERE user_id = ? AND shift_end_time IS NULL`;
    const activeShifts = await new Promise((resolve, reject) => {
      executeQuery(checkSql, [user_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (activeShifts.length > 0) {
s      return res.status(409).json({ success: false, message: 'User already has an active shift.' });
    }

    // Create new shift using UTC_TIMESTAMP()
    const insertSql = `INSERT INTO ambulancecrews (user_id, ambulance_id, shift_start_time) VALUES (?, ?, UTC_TIMESTAMP())`;
    const insertResult = await new Promise((resolve, reject) => {
      executeQuery(insertSql, [user_id, ambulance_id], (err, result) => {
        if (err) return reject(err);
s        resolve(result);
      });
    });

    res.json({ success: true, message: 'Clocked in successfully.', shift_id: insertResult.insertId });

  } catch (err) {
    console.error("Database error during clock-in:", err);
    res.status(500).json({ success: false, message: 'Failed to clock in.' });
  }
});

// Clock out from a shift
router.post('/crews/clock-out', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    // Find active shift and update it
    const updateSql = `UPDATE ambulancecrews SET shift_end_time = NOW() WHERE user_id = ? AND shift_end_time IS NULL`;
    const updateResult = await new Promise((resolve, reject) => {
      executeQuery(updateSql, [user_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No active shift found to clock out from.' });
    }

    res.json({ success: true, message: 'Clocked out successfully.' });

  } catch (err) {
    console.error("Database error during clock-out:", err);
    res.status(500).json({ success: false, message: 'Failed to clock out.' });
  }
});

// Get a paramedic's trip history
router.get('/paramedic/trip-history', (req, res) => {
  const { paramedicId } = req.query;
  if (!paramedicId) {
    return res.status(400).json({ success: false, message: 'Paramedic ID is required.' });
s  }

  const sql = `
    SELECT et.*
    FROM emergencytrips et
    WHERE et.assigned_ambulance_id IN (
      SELECT DISTINCT ac.ambulance_id
      FROM ambulancecrews ac
      WHERE ac.user_id = ?
    )
    ORDER BY et.alert_timestamp DESC;
  `;

  executeQuery(sql, [paramedicId], (err, results) => {
source    if (err) {
      console.error("Database error fetching paramedic trip history:", err);
      return res.status(500).json({ success: false, message: 'Failed to fetch trip history.' });
  s }
    res.json({ success: true, trips: results });
  });
});


module.exports = router;