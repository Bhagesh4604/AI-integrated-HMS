import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiUrl from '@/config/api';
import useWebSocket from '../hooks/useWebSocket';
import MapView from '../components/ems/MapView'; // Import the MapView component
import { Sparkles } from 'lucide-react';

// Define a hardcoded location for the hospital
const HOSPITAL_LOCATION = { lat: 12.9716, lng: 77.5946 }; // Example: Bangalore

const ERDashboard = () => {
  const navigate = useNavigate();
  const [transportingTrips, setTransportingTrips] = useState([]);
  const [ambulanceLocations, setAmbulanceLocations] = useState({});
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [errorTrips, setErrorTrips] = useState('');
  const [tripAcuity, setTripAcuity] = useState({});
  const [generatingAcuity, setGeneratingAcuity] = useState({});

  const generateAcuityAssessment = async (trip) => {
    if (!trip.latest_vitals || generatingAcuity[trip.trip_id] || tripAcuity[trip.trip_id]) {
      return; // Don't generate if no vitals, already generating, or already have one
    }

    setGeneratingAcuity(prev => ({ ...prev, [trip.trip_id]: true }));

    const { heart_rate, blood_pressure_systolic, blood_pressure_diastolic, notes } = trip.latest_vitals;
    const systemPrompt = "You are an expert ER triage AI. Your role is to provide a brief, clear pre-arrival acuity assessment based on paramedic field data. Use professional medical terminology. Be concise. Structure your response with 'Assessment:', 'Acuity:', and 'Suggested Prep:'. Acuity should be one of: Low, Moderate, High, Critical.";
    const userQuery = `
      Incoming patient.
      Vitals:
      - Heart Rate: ${heart_rate || 'N/A'} bpm
      - Blood Pressure: ${blood_pressure_systolic || 'N/A'} / ${blood_pressure_diastolic || 'N/A'} mmHg
      Paramedic Notes: "${notes || 'No notes provided.'}"

      Provide a pre-arrival acuity assessment.
    `;

    try {
      const response = await fetch(apiUrl('/api/ai/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
          ]
        }),
      });
      if (!response.ok) throw new Error('AI service request failed');
      const result = await response.json();
      setTripAcuity(prev => ({ ...prev, [trip.trip_id]: result.reply || "Could not generate assessment." }));
    } catch (error) {
      console.error("AI Acuity Assessment error:", error);
      setTripAcuity(prev => ({ ...prev, [trip.trip_id]: "Error generating assessment." }));
    } finally {
      setGeneratingAcuity(prev => ({ ...prev, [trip.trip_id]: false }));
    }
  };

  const fetchTransportingTrips = async () => {
    setLoadingTrips(true);
    setErrorTrips('');
    try {
      const response = await fetch(apiUrl('/api/ems/trips/transporting'));
      const data = await response.json();
      if (data.success) {
        setTransportingTrips(data.trips);
        const newLocations = {};
        data.trips.forEach(trip => {
          if (trip.last_latitude && trip.last_longitude) {
            newLocations[trip.assigned_ambulance_id] = {
              lat: trip.last_latitude,
              lng: trip.last_longitude,
              timestamp: new Date().toISOString(),
              vehicle_name: trip.vehicle_name,
            };
          }
          generateAcuityAssessment(trip); // Generate assessment on initial load
        });
        setAmbulanceLocations(newLocations);
      } else {
        setErrorTrips(data.message || 'Failed to fetch transporting trips.');
      }
    } catch (error) {
      console.error('Error fetching transporting trips:', error);
      setErrorTrips('Failed to connect to the server to fetch transporting trips.');
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleWebSocketMessage = useCallback((message) => {
    console.log('ER Dashboard received WebSocket message:', message);
    const { type, payload } = message;

    switch (type) {
      case 'NEW_VITALS':
        const updatedTripWithVitals = transportingTrips.find(t => t.trip_id === payload.trip_id);
        if (updatedTripWithVitals) {
          const newTripState = { ...updatedTripWithVitals, latest_vitals: payload };
          setTransportingTrips(prevTrips =>
            prevTrips.map(trip =>
              trip.trip_id === payload.trip_id ? newTripState : trip
            )
          );
          generateAcuityAssessment(newTripState); // Generate assessment when new vitals arrive
        }
        break;
      case 'TRIP_ETA_UPDATE':
        setTransportingTrips(prevTrips =>
          prevTrips.map(trip =>
            trip.trip_id === payload.trip_id
              ? { ...trip, eta_minutes: payload.eta_minutes }
              : trip
          )
        );
        break;
      case 'TRIP_STATUS_UPDATE':
        const { trip, lastLocation } = payload;
        if (trip.status === 'Transporting') {
          setTransportingTrips(prevTrips => {
            if (prevTrips.some(t => t.trip_id === trip.trip_id)) {
              return prevTrips.map(t => t.trip_id === trip.trip_id ? trip : t);
            }
            return [...prevTrips, trip];
          });
          if (lastLocation) {
            setAmbulanceLocations(prevLocations => ({
              ...prevLocations,
              [trip.assigned_ambulance_id]: {
                lat: lastLocation.latitude,
                lng: lastLocation.longitude,
                timestamp: new Date().toISOString(),
                vehicle_name: trip.vehicle_name,
              },
            }));
          }
          generateAcuityAssessment(trip); // Generate assessment for new transporting trip
        } else {
          setTransportingTrips(prevTrips =>
            prevTrips.filter(t => t.trip_id !== trip.trip_id)
          );
        }
        break;
      case 'AMBULANCE_LOCATION_UPDATE':
        setAmbulanceLocations(prevLocations => ({
          ...prevLocations,
          [payload.ambulance_id]: {
            ...prevLocations[payload.ambulance_id],
            lat: payload.latitude,
            lng: payload.longitude,
            timestamp: payload.timestamp,
          },
        }));
        break;
      default:
        break;
    }
  }, [transportingTrips, generatingAcuity, tripAcuity]);

  useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchTransportingTrips();
  }, []);

  const hospitalDestinations = transportingTrips.reduce((acc, trip) => {
    if (trip.assigned_ambulance_id) {
      acc[trip.assigned_ambulance_id] = HOSPITAL_LOCATION;
    }
    return acc;
  }, {});

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ER Pre-Arrival Dashboard</h1>
      </div>

      <div className="w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
        <MapView ambulanceLocations={ambulanceLocations} destinations={hospitalDestinations} />
      </div>

      {loadingTrips ? (
        <div className="text-center text-lg">Loading incoming trips...</div>
      ) : errorTrips ? (
        <div className="text-center text-lg text-red-500">Error: {errorTrips}</div>
      ) : transportingTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transportingTrips.map(trip => (
            <div key={trip.trip_id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col">
              <h2 className="text-2xl font-semibold mb-3">Trip ID: {trip.trip_id}</h2>
              <p className="text-lg mb-1"><strong>Status:</strong> {trip.status}</p>
              <p className="text-lg mb-1"><strong>Assigned Ambulance:</strong> {trip.vehicle_name} ({trip.license_plate})</p>
              <p className="text-lg mb-3 font-bold text-blue-400">{trip.eta_minutes ? `ETA: ${trip.eta_minutes} mins` : 'ETA: Calculating...'}</p>

              <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Latest Vitals</h3>
                {trip.latest_vitals ? (
                  <>
                    <p className="text-base"><strong>Heart Rate:</strong> {trip.latest_vitals.heart_rate || 'N/A'} bpm</p>
                    <p className="text-base"><strong>Blood Pressure:</strong> {trip.latest_vitals.blood_pressure_systolic || 'N/A'}/{trip.latest_vitals.blood_pressure_diastolic || 'N/A'} mmHg</p>
                    <p className="text-base"><strong>Notes:</strong> {trip.latest_vitals.notes || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Last updated: {new Date(trip.latest_vitals.timestamp).toLocaleTimeString()}</p>
                  </>
                ) : (
                  <p className="text-base">No vitals received yet.</p>
                )}
              </div>

              <div className="mt-4 p-3 border border-purple-200 dark:border-purple-700 rounded-md bg-purple-50 dark:bg-purple-900/20 flex-grow">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-purple-800 dark:text-purple-300">
                  <Sparkles size={20} /> AI Acuity Assessment
                </h3>
                {generatingAcuity[trip.trip_id] && <p className="text-base animate-pulse">Generating assessment...</p>}
                {tripAcuity[trip.trip_id] && (
                  <div className="text-base whitespace-pre-wrap font-mono">
                    {tripAcuity[trip.trip_id]}
                  </div>
                )}
                {!generatingAcuity[trip.trip_id] && !tripAcuity[trip.trip_id] && <p className="text-base text-gray-500">Waiting for vitals to generate assessment.</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-lg text-gray-600 dark:text-gray-400">
          No transporting emergency trips currently.
        </div>
      )}
    </div>
  );
};

export default ERDashboard;
