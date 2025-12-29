import React, { useState, useEffect, useCallback } from 'react';
import MapView from '../components/ems/MapView';
import apiUrl from '@/config/api';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import { Sparkles, Map, List, Plus, AlertTriangle, Truck, Clock, CheckCircle, Trash2, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// --- Reusable Components ---

const Modal = ({ children, onClose, width = "max-w-2xl" }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] font-sans p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className={`glass-panel rounded-3xl p-8 w-full ${width} border border-white/10 shadow-2xl relative overflow-hidden text-gray-900 dark:text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10">{children}</div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const TripHistoryView = ({ trips, isLoading, error }) => {
  if (isLoading) return <div className="text-center p-8 text-gray-400">Loading trip history...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (trips.length === 0) return <div className="text-center p-8 text-gray-400">No completed trips found.</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Trip History</h2>
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <table className="w-full">
          <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trip ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ambulance</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Completed</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {trips.map((trip) => (
              <motion.tr
                key={trip.trip_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{trip.trip_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{trip.vehicle_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(trip.updated_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    {trip.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FleetManagementDashboard = () => {
  // ... [Logic remains same, copying state and effects] ...
  const navigate = useNavigate();
  const [newAlerts, setNewAlerts] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [fleetStatus, setFleetStatus] = useState<any[]>([]);
  const [ambulanceLocations, setAmbulanceLocations] = useState({});
  const [destinations, setDestinations] = useState({});
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [assigningTrip, setAssigningTrip] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [showManualAlertModal, setShowManualAlertModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [creatingManualAlert, setCreatingManualAlert] = useState(false);
  const [manualAlertError, setManualAlertError] = useState('');

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');

  const [showAddAmbulanceModal, setShowAddAmbulanceModal] = useState(false);
  const [newAmbulanceName, setNewAmbulanceName] = useState('');
  const [newAmbulanceLicense, setNewAmbulanceLicense] = useState('');
  const [addingAmbulance, setAddingAmbulance] = useState(false);
  const [addAmbulanceError, setAddAmbulanceError] = useState('');

  // AI Summary State
  const [alertSummaries, setAlertSummaries] = useState({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState({});

  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);
    if (query.length < 3) {
      setPatientSearchResults([]);
      return;
    }
    setSearchingPatients(true);
    setPatientSearchError('');
    try {
      const response = await fetch(apiUrl(`/api/ems/patients/search?query=${query}`));
      const data = await response.json();
      if (data.success) {
        setPatientSearchResults(data.patients);
      } else {
        setPatientSearchError(data.message || 'Failed to search patients.');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientSearchError('Failed to connect to the server to search patients.');
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearchQuery(`${patient.firstName} ${patient.lastName} (${patient.patientId})`);
    setPatientSearchResults([]);
  };

  const [view, setView] = useState('live');
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState('');

  const handleToggleView = () => {
    const newView = view === 'live' ? 'history' : 'live';
    setView(newView);
    if (newView === 'history') {
      fetchTripHistory();
    }
  };

  const fetchNewAlerts = async () => {
    setLoadingAlerts(true);
    setErrorAlerts('');
    try {
      const response = await fetch(apiUrl('/api/ems/alerts/new'));
      const data = await response.json();
      if (data.success) {
        setNewAlerts(data.alerts);
      } else {
        setErrorAlerts(data.message || 'Failed to fetch new alerts.');
      }
    } catch (error) {
      console.error('Error fetching new alerts:', error);
      setErrorAlerts('Failed to connect to the server to fetch new alerts.');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchTripHistory = async () => {
    setLoadingHistory(true);
    setErrorHistory('');
    try {
      const response = await fetch(apiUrl('/api/ems/trips/history'));
      const data = await response.json();
      if (data.success) {
        setTripHistory(data.trips);
      } else {
        setErrorHistory(data.message || 'Failed to fetch trip history.');
      }
    } catch (error) {
      console.error('Error fetching trip history:', error);
      setErrorHistory('Failed to connect to the server to fetch trip history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFleetStatus = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances/status'));
      const data = await response.json();
      if (data.success) {
        setFleetStatus(data.fleetStatus);
      } else {
        console.error('Failed to fetch fleet status:', data.message);
      }
    } catch (error) {
      console.error('Error fetching fleet status:', error);
    }
  };

  const fetchActiveTrips = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/trips/active'));
      const data = await response.json();
      if (data.success) {
        setActiveTrips(data.trips);
        const newDestinations = {};
        const newLocations = {};
        data.trips.forEach(trip => {
          if (trip.assigned_ambulance_id) {
            newDestinations[trip.assigned_ambulance_id] = {
              lat: trip.scene_location_lat,
              lng: trip.scene_location_lon,
            };
            if (trip.last_latitude && trip.last_longitude) {
              newLocations[trip.assigned_ambulance_id] = {
                lat: trip.last_latitude,
                lng: trip.last_longitude,
                timestamp: new Date().toISOString(),
                vehicle_name: trip.vehicle_name,
              };
            }
          }
        });
        setDestinations(newDestinations);
        setAmbulanceLocations(prev => ({ ...prev, ...newLocations }));
      } else {
        console.error('Failed to fetch active trips:', data.message);
      }
    } catch (error) {
      console.error('Error fetching active trips:', error);
    }
  };

  const fetchAllAmbulanceLocations = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances/locations'));
      const data = await response.json();
      if (data.success) {
        const newLocations = {};
        data.locations.forEach(location => {
          newLocations[location.ambulance_id] = {
            lat: location.latitude,
            lng: location.longitude,
            timestamp: location.timestamp,
            vehicle_name: location.vehicle_name,
          };
        });
        setAmbulanceLocations(prev => ({ ...prev, ...newLocations }));
      } else {
        console.error('Failed to fetch all ambulance locations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching all ambulance locations:', error);
    }
  };

  const fetchAvailableAmbulances = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances/available'));
      const data = await response.json();
      if (data.success) {
        setAvailableAmbulances(data.ambulances);
      } else {
        console.error('Failed to fetch available ambulances:', data.message);
      }
    } catch (error) {
      console.error('Error fetching available ambulances:', error);
    }
  };

  const handleAssignClick = (alert) => {
    setSelectedAlert(alert);
    fetchAvailableAmbulances();
    setShowAssignModal(true);
  };

  const handleAssignTrip = async () => {
    if (!selectedAlert || !selectedAmbulanceId) {
      setAssignError('Please select an ambulance.');
      return;
    }

    setAssigningTrip(true);
    setAssignError('');
    try {
      const response = await fetch(apiUrl('/api/ems/trips/assign'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: selectedAlert.trip_id, ambulance_id: selectedAmbulanceId }),
      });
      const data = await response.json();
      if (data.success) {
        setShowAssignModal(false);
        setSelectedAlert(null);
        setSelectedAmbulanceId('');
      } else {
        setAssignError(data.message || 'Failed to assign trip.');
      }
    } catch (error) {
      console.error('Error assigning trip:', error);
      setAssignError('Failed to connect to the server to assign trip.');
    } finally {
      setAssigningTrip(false);
    }
  };

  const handleCreateManualAlert = async () => {
    if (!manualLat || !manualLon) {
      setManualAlertError('Latitude and Longitude are required.');
      return;
    }

    setCreatingManualAlert(true);
    setManualAlertError('');
    try {
      const response = await fetch(apiUrl('/api/ems/alerts/manual'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_location_lat: parseFloat(manualLat),
          scene_location_lon: parseFloat(manualLon),
          patient_name: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : manualPatientName,
          notes: manualNotes,
          patient_id: selectedPatient ? selectedPatient.id : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowManualAlertModal(false);
        setManualLat('');
        setManualLon('');
        setManualPatientName('');
        setManualNotes('');
        setPatientSearchQuery('');
        setPatientSearchResults([]);
        setSelectedPatient(null);
      } else {
        setManualAlertError(data.message || 'Failed to create manual alert.');
      }
    } catch (error) {
      console.error('Error creating manual alert:', error);
      setManualAlertError('Failed to connect to the server to create manual alert.');
    } finally {
      setCreatingManualAlert(false);
    }
  };

  const handleGenerateSummary = async (alert) => {
    if (!alert || isGeneratingSummary[alert.trip_id] || alertSummaries[alert.trip_id]) return;

    setIsGeneratingSummary(prev => ({ ...prev, [alert.trip_id]: true }));

    const systemPrompt = "You are an expert EMS dispatcher AI. Your role is to provide a quick 'Potential Incident Profile' based on limited initial alert data. Be concise. Structure your response with 'Likely Scenario:', 'Suggested Questions:', and 'Initial Recommendation:'.";
    const userQuery = `
      New alert received.
      - Location (Lat/Lon): ${alert.scene_location_lat}, ${alert.scene_location_lon}
      - Time: ${new Date(alert.alert_timestamp).toLocaleString()}
      - Initial Notes: "${alert.notes || 'No initial notes provided.'}"

      Provide a Potential Incident Profile.
    `;

    try {
      const response = await fetch(apiUrl('/api/ai/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }]
        }),
      });
      if (!response.ok) throw new Error('AI service request failed');
      const result = await response.json();
      setAlertSummaries(prev => ({ ...prev, [alert.trip_id]: result.reply || "Could not generate summary." }));
    } catch (error) {
      console.error("AI Summary error:", error);
      setAlertSummaries(prev => ({ ...prev, [alert.trip_id]: "Error generating summary." }));
    } finally {
      setIsGeneratingSummary(prev => ({ ...prev, [alert.trip_id]: false }));
    }
  };

  const [completingTripId, setCompletingTripId] = useState(null);

  const handleCompleteTrip = async (tripId) => {
    setCompletingTripId(tripId);
    try {
      const response = await fetch(apiUrl('/api/ems/trips/complete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to complete trip:', data.message);
      }
    } catch (error) {
      console.error('Error completing trip:', error);
    } finally {
      setCompletingTripId(null);
    }
  };

  const handleDeleteAmbulance = async (ambulanceId) => {
    if (!window.confirm('Are you sure you want to delete this ambulance?')) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/ems/ambulances/${ambulanceId}`), {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchFleetStatus();
      } else {
        console.error('Failed to delete ambulance:', data.message);
      }
    } catch (error) {
      console.error('Error deleting ambulance:', error);
    }
  };

  const handleUpdateAmbulanceStatus = async (ambulanceId, status) => {
    try {
      const response = await fetch(apiUrl(`/api/ems/ambulances/${ambulanceId}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchFleetStatus();
      } else {
        console.error('Failed to update ambulance status:', data.message);
      }
    } catch (error) {
      console.error('Error updating ambulance status:', error);
    }
  };

  const handleAddAmbulance = async () => {
    if (!newAmbulanceName || !newAmbulanceLicense) {
      setAddAmbulanceError('Vehicle Name and License Plate are required.');
      return;
    }
    setAddingAmbulance(true);
    setAddAmbulanceError('');

    try {
      const response = await fetch(apiUrl('/api/ems/ambulances'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_name: newAmbulanceName, license_plate: newAmbulanceLicense }),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddAmbulanceModal(false);
        setNewAmbulanceName('');
        setNewAmbulanceLicense('');
        fetchFleetStatus();
        fetchAvailableAmbulances(); // Also refresh available list
      } else {
        setAddAmbulanceError(data.message || 'Failed to add ambulance.');
      }
    } catch (error) {
      console.error('Error adding ambulance:', error);
      setAddAmbulanceError('Failed to connect to server.');
    } finally {
      setAddingAmbulance(false);
    }
  };

  const handleWebSocketMessage = useCallback((message) => {
    const { type, payload } = message;

    switch (type) {
      case 'NEW_ALERT':
        setNewAlerts(prevAlerts => [payload, ...prevAlerts]);
        break;
      case 'TRIP_ASSIGNED':
        const { trip, ambulance, lastLocation } = payload;
        setNewAlerts(prevAlerts => prevAlerts.filter(alert => alert.trip_id !== trip.trip_id));
        setActiveTrips(prevTrips => {
          if (prevTrips.some(t => t.trip_id === trip.trip_id)) return prevTrips;
          return [trip, ...prevTrips];
        });
        setFleetStatus(prevFleet =>
          prevFleet.map(amb =>
            amb.ambulance_id === ambulance.ambulance_id ? ambulance : amb
          )
        );
        if (lastLocation) {
          setAmbulanceLocations(prevLocations => ({
            ...prevLocations,
            [ambulance.ambulance_id]: {
              lat: lastLocation.latitude,
              lng: lastLocation.longitude,
              timestamp: new Date().toISOString(),
              vehicle_name: ambulance.vehicle_name,
            },
          }));
        }
        setDestinations(prevDestinations => ({
          ...prevDestinations,
          [ambulance.ambulance_id]: {
            lat: trip.scene_location_lat,
            lng: trip.scene_location_lon,
          },
        }));
        break;
      case 'TRIP_ETA_UPDATE':
        setActiveTrips(prevTrips =>
          prevTrips.map(t =>
            t.trip_id === payload.trip_id ? { ...t, eta_minutes: payload.eta_minutes } : t
          )
        );
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
      case 'TRIP_STATUS_UPDATE':
        setActiveTrips(prevTrips =>
          prevTrips.map(t => (t.trip_id === payload.trip.trip_id ? payload.trip : t))
        );
        break;
      case 'TRIP_COMPLETED':
        setActiveTrips(prevTrips => prevTrips.filter(t => t.trip_id !== payload.trip_id));
        setFleetStatus(prevFleet =>
          prevFleet.map(amb =>
            amb.ambulance_id === payload.ambulance.ambulance_id ? payload.ambulance : amb
          )
        );
        setDestinations(prevDestinations => {
          const newDestinations = { ...prevDestinations };
          delete newDestinations[payload.ambulance.ambulance_id];
          return newDestinations;
        });
        break;
      default:
        break;
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchNewAlerts();
    fetchFleetStatus();
    fetchActiveTrips();
    fetchAllAmbulanceLocations();
  }, []);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50 dark:bg-black/90">
      <header className="glass-panel z-20 px-6 py-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
            Fleet Command
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddAmbulanceModal(true)}
            className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl font-bold hover:bg-green-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Ambulance
          </button>
          <button
            onClick={handleToggleView}
            className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center gap-2"
          >
            {view === 'live' ? <List size={18} /> : <Map size={18} />} {view === 'live' ? 'View History' : 'Live Map'}
          </button>
          <button
            onClick={() => setShowManualAlertModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <AlertTriangle size={18} /> Manual Alert
          </button>
        </div>
      </header>

      {view === 'live' ? (
        <div className="flex flex-1 overflow-hidden relative">

          {/* Left Sidebar - Alerts */}
          <AnimatePresence mode="popLayout">
            <motion.aside
              initial={{ width: 320, opacity: 1, x: 0 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -320 }}
              className="glass-panel border-r border-white/10 flex flex-col z-10"
            >
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
                {/* New Alerts Section */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-older flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> New Alerts ({newAlerts.length})
                  </h2>
                  {loadingAlerts ? (
                    <p className="text-sm text-gray-400 animate-pulse">Scanning for alerts...</p>
                  ) : errorAlerts ? (
                    <p className="text-sm text-red-500">{errorAlerts}</p>
                  ) : newAlerts.length > 0 ? (
                    newAlerts.map(alert => (
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={alert.trip_id} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-uppercase">TRIP #{alert.trip_id}</span>
                          <span className="text-xs text-gray-500">{new Date(alert.alert_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-3 line-clamp-2">{alert.notes || 'No initial details provided.'}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAssignClick(alert)}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                          >
                            Assign Unit
                          </button>
                          <button
                            onClick={() => handleGenerateSummary(alert)}
                            disabled={isGeneratingSummary[alert.trip_id] || alertSummaries[alert.trip_id]}
                            className="px-3 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            <Sparkles size={12} /> AI Insight
                          </button>
                        </div>
                        {isGeneratingSummary[alert.trip_id] && <p className="text-xs text-purple-500 mt-2 animate-pulse">Analyzing...</p>}
                        {alertSummaries[alert.trip_id] && (
                          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/10 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
                            {alertSummaries[alert.trip_id]}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                      <CheckCircle className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-xs text-gray-500">All Clear</p>
                    </div>
                  )}
                </div>

                {/* Active Trips Section */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-older flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Active Missions ({activeTrips.length})
                  </h2>
                  {activeTrips.length > 0 ? (
                    activeTrips.map(trip => (
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={trip.trip_id} className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">Trip #{trip.trip_id}</span>
                          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{trip.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <Clock size={12} />
                          <span>ETA: <span className="text-gray-900 dark:text-white font-bold">{trip.eta_minutes ? `${trip.eta_minutes}m` : '...'}</span></span>
                        </div>
                        <button
                          onClick={() => handleCompleteTrip(trip.trip_id)}
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all flex items-center justify-center gap-2"
                          disabled={completingTripId === trip.trip_id}
                        >
                          {completingTripId === trip.trip_id ? 'Finalizing...' : 'Complete Mission'}
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic px-2">No active missions.</p>
                  )}
                </div>
              </div>
            </motion.aside>
          </AnimatePresence>

          <main className="flex-1 relative bg-gray-900 overflow-hidden">
            <div className={`absolute inset-0`}>
              {!showManualAlertModal && <MapView ambulanceLocations={ambulanceLocations} destinations={destinations} />}
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-[400] flex gap-2">
              {/* Placeholder for map style toggles if needed */}
            </div>
          </main>

          {/* Right Sidebar - Fleet Status */}
          <motion.aside
            initial={{ width: 300, opacity: 1, x: 0 }}
            animate={{ width: 300, opacity: 1, x: 0 }}
            className="glass-panel border-l border-white/10 flex flex-col z-10"
          >
            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-older mb-4">Fleet Status</h2>
              <div className="space-y-3">
                {fleetStatus.length > 0 ? (
                  fleetStatus.map(ambulance => {
                    const tripForAmbulance = activeTrips.find(t => t.assigned_ambulance_id === ambulance.ambulance_id);
                    const isActive = ambulance.current_status === 'Available';
                    const isBusy = ambulance.current_status === 'On_Trip';

                    return (
                      <motion.div key={ambulance.ambulance_id} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/10 text-green-500' : isBusy ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                              <Truck size={16} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{ambulance.vehicle_name}</h3>
                              <p className="text-xs text-gray-500">{ambulance.license_plate}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteAmbulance(ambulance.ambulance_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : isBusy ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                          <select
                            value={ambulance.current_status}
                            onChange={(e) => handleUpdateAmbulanceStatus(ambulance.ambulance_id, e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                          >
                            <option value="Available" className="dark:bg-gray-900">Available</option>
                            <option value="On_Trip" className="dark:bg-gray-900">On Trip</option>
                            <option value="Not_Available" className="dark:bg-gray-900">Not Available</option>
                          </select>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No fleet data.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      ) : (
        <TripHistoryView trips={tripHistory} isLoading={loadingHistory} error={errorHistory} />
      )}

      {showAssignModal && (
        <Modal onClose={() => setShowAssignModal(false)} width="max-w-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Assign Unit to Trip #{selectedAlert?.trip_id}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Unit</label>
              <select
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                value={selectedAmbulanceId}
                onChange={(e) => setSelectedAmbulanceId(e.target.value)}
              >
                <option value="" className="dark:bg-gray-900">-- Choose Ambulance --</option>
                {availableAmbulances.map(amb => (
                  <option key={amb.ambulance_id} value={amb.ambulance_id} className="dark:bg-gray-900">
                    {amb.vehicle_name} • {amb.firstName ? `${amb.firstName} ${amb.lastName}` : 'No Crew'}
                  </option>
                ))}
              </select>
            </div>
            {assignError && <p className="text-red-500 text-sm font-medium bg-red-500/10 p-2 rounded-lg">{assignError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg font-bold transition-colors">Cancel</button>
              <button onClick={handleAssignTrip} disabled={assigningTrip || !selectedAmbulanceId} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {assigningTrip ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showManualAlertModal && (
        <Modal onClose={() => setShowManualAlertModal(false)} width="max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manual Emergency Alert</h2>
              <p className="text-sm text-gray-500">Create a new alert manually from dispatch.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Patient Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder="Name or ID..."
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {searchingPatients && <span className="absolute right-3 top-3.5 text-xs text-gray-400">Searching...</span>}
              </div>
              {patientSearchResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl max-h-40 overflow-y-auto absolute w-full z-50">
                  {patientSearchResults.map(p => (
                    <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-bold">{p.firstName} {p.lastName}</span> <span className="text-gray-400 ml-2">#{p.patientId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="20.5937"
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="78.9629"
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Patient Name (if not searched)</label>
              <input
                type="text"
                value={manualPatientName}
                onChange={(e) => setManualPatientName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={!!selectedPatient}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Situation Notes</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Describe the emergency..."
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 h-24 resize-none"
              />
            </div>

            {manualAlertError && <p className="text-red-500 text-sm font-medium">{manualAlertError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <button onClick={() => setShowManualAlertModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg font-bold transition-colors">Cancel</button>
              <button onClick={handleCreateManualAlert} disabled={creatingManualAlert} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">
                {creatingManualAlert ? 'Broadcasting...' : 'Broadcast Alert'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddAmbulanceModal && (
        <Modal onClose={() => setShowAddAmbulanceModal(false)} width="max-w-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Ambulance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle Name / ID</label>
              <input
                type="text"
                value={newAmbulanceName}
                onChange={(e) => setNewAmbulanceName(e.target.value)}
                placeholder="e.g. ALPHA-1"
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">License Plate</label>
              <input
                type="text"
                value={newAmbulanceLicense}
                onChange={(e) => setNewAmbulanceLicense(e.target.value)}
                placeholder="e.g. KA-01-EA-1234"
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {addAmbulanceError && <p className="text-red-500 text-sm font-medium">{addAmbulanceError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <button onClick={() => setShowAddAmbulanceModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg font-bold transition-colors">Cancel</button>
              <button onClick={handleAddAmbulance} disabled={addingAmbulance} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-500/30 transition-colors">
                {addingAmbulance ? 'Adding...' : 'Add Ambulance'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FleetManagementDashboard;