const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');
const WebSocket = require('ws');

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

router.post('/book-ambulance', async (req, res) => {
  const { patient_id, latitude, longitude, notes } = req.body;

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

    const trip_id = `ER-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const alert_timestamp = new Date();
    const newTrip = {
      trip_id,
      status: 'New_Alert',
      alert_source: 'Patient_App',
      scene_location_lat: latitude,
      scene_location_lon: longitude,
      patient_name: `${patient.firstName} ${patient.lastName}`,
      notes,
      patient_id: patient_id,
      booked_by_patient_id: patient_id,
      alert_timestamp
    };

    const sql = `INSERT INTO emergencytrips (trip_id, status, alert_source, scene_location_lat, scene_location_lon, patient_name, notes, patient_id, booked_by_patient_id, alert_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await new Promise((resolve, reject) => {
      executeQuery(sql, [trip_id, 'New_Alert', 'Patient_App', latitude, longitude, newTrip.patient_name, notes, patient_id, patient_id, alert_timestamp], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    // Broadcast WebSocket message for the new alert
    broadcast(req.wss, { type: 'NEW_ALERT', payload: newTrip });

    res.status(201).json({ success: true, message: 'Ambulance booked successfully! Help is on the way.', trip_id: trip_id });

    // Trigger auto-dispatch asynchronously
    autoDispatchTrip(trip_id, { lat: latitude, lon: longitude }, req.wss);

  } catch (error) {
    console.error("Database error booking ambulance:", error);
    res.status(500).json({ success: false, message: 'Failed to book ambulance.' });
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
