import React, { useState, useEffect, useCallback } from 'react';
import MapView from '../components/ems/MapView';
import apiUrl from '@/config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import AddAmbulanceForm from '../components/ems/AddAmbulanceForm';

const TripHistoryView = ({ trips, isLoading, error }) => {
  console.log('[TripHistoryView] Rendering with props:', { trips, isLoading, error });

  if (isLoading) {
    return <div className="text-center p-8">Loading trip history...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (trips.length === 0) {
    return <div className="text-center p-8">No completed trips found.</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Trip History</h2>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trip ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ambulance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Completed</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {trips.map((trip) => (
              <tr key={trip.trip_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trip.trip_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trip.vehicle_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(trip.updated_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {trip.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FleetManagementDashboard = () => {
  const navigate = useNavigate();
  const [newAlerts, setNewAlerts] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [fleetStatus, setFleetStatus] = useState([]);
  const [ambulanceLocations, setAmbulanceLocations] = useState({}); // New state for ambulance locations
  const [destinations, setDestinations] = useState({}); // New state for trip destinations
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
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

  // New state for Patient Search in Manual Alert
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');

  const [showAddAmbulanceModal, setShowAddAmbulanceModal] = useState(false);

  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);
    if (query.length < 3) { // Only search if query is at least 3 characters
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
    setPatientSearchResults([]); // Clear results after selection
  };

  // New state for Trip History
  const [view, setView] = useState('live'); // 'live' or 'history'
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState('');

  const handleToggleView = () => {
    const newView = view === 'live' ? 'history' : 'live';
    console.log(`[handleToggleView] Switching view to: ${newView}`);
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
    console.log('[fetchTripHistory] Fetching trip history...');
    setLoadingHistory(true);
    setErrorHistory('');
    try {
      const response = await fetch(apiUrl('/api/ems/trips/history'));
      const data = await response.json();
      console.log('[fetchTripHistory] Received data:', data);
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
                timestamp: new Date().toISOString(), // Note: This timestamp is from the fetch time
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
        // No longer need to fetch fleet status here, WebSocket will handle it
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
          patient_id: selectedPatient ? selectedPatient.id : null, // Include patient_id
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowManualAlertModal(false);
        setManualLat('');
        setManualLon('');
        setManualPatientName('');
        setManualNotes('');
        setPatientSearchQuery(''); // Clear search
        setPatientSearchResults([]); // Clear results
        setSelectedPatient(null); // Clear selected patient
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
      // UI update will be handled by WebSocket
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

  const handleWebSocketMessage = useCallback((message) => {
    console.log('Fleet Dashboard received WebSocket message:', message);
    const { type, payload } = message;

    switch (type) {
      case 'NEW_ALERT':
        console.log('NEW_ALERT received, payload:', payload);
        setNewAlerts(prevAlerts => [payload, ...prevAlerts]);
        break;
      case 'TRIP_ASSIGNED':
        console.log('TRIP_ASSIGNED received, payload:', payload);
        const { trip, ambulance, lastLocation } = payload;
        // Remove from new alerts
        setNewAlerts(prevAlerts => prevAlerts.filter(alert => alert.trip_id !== trip.trip_id));
        // Add to active trips, preventing duplicates
        setActiveTrips(prevTrips => {
          if (prevTrips.some(t => t.trip_id === trip.trip_id)) {
            return prevTrips;
          }
          return [trip, ...prevTrips];
        });
        // Update fleet status
        setFleetStatus(prevFleet => 
          prevFleet.map(amb => 
            amb.ambulance_id === ambulance.ambulance_id ? ambulance : amb
          )
        );
        // Set initial location if available
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
        // Set destination for the trip
        setDestinations(prevDestinations => ({
          ...prevDestinations,
          [ambulance.ambulance_id]: {
            lat: trip.scene_location_lat,
            lng: trip.scene_location_lon,
          },
        }));
        break;
      case 'TRIP_ETA_UPDATE':
        console.log('TRIP_ETA_UPDATE received, payload:', payload);
        setActiveTrips(prevTrips =>
          prevTrips.map(t =>
            t.trip_id === payload.trip_id ? { ...t, eta_minutes: payload.eta_minutes } : t
          )
        );
        break;
      case 'AMBULANCE_LOCATION_UPDATE':
        console.log('AMBULANCE_LOCATION_UPDATE received, payload:', payload);
        setAmbulanceLocations(prevLocations => ({
          ...prevLocations,
          [payload.ambulance_id]: {
            ...prevLocations[payload.ambulance_id], // Preserve existing data like vehicle_name
            lat: payload.latitude,
            lng: payload.longitude,
            timestamp: payload.timestamp,
          },
        }));
        break;
      case 'TRIP_STATUS_UPDATE':
        console.log('TRIP_STATUS_UPDATE received, payload:', payload);
        // This handles status changes like 'En_Route_To_Scene', 'At_Scene', 'At_Hospital'
        setActiveTrips(prevTrips =>
          prevTrips.map(t => (t.trip_id === payload.trip.trip_id ? payload.trip : t))
        );
        break;
      case 'TRIP_COMPLETED':
        console.log('TRIP_COMPLETED received, payload:', payload);
        // Remove from active trips
        setActiveTrips(prevTrips => prevTrips.filter(t => t.trip_id !== payload.trip_id));
        // Update fleet status
        setFleetStatus(prevFleet => 
          prevFleet.map(amb => 
            amb.ambulance_id === payload.ambulance.ambulance_id ? payload.ambulance : amb
          )
        );
        // Remove destination for the completed trip's ambulance
        setDestinations(prevDestinations => {
          const newDestinations = { ...prevDestinations };
          delete newDestinations[payload.ambulance.ambulance_id];
          return newDestinations;
        });
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fleet Management</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddAmbulanceModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + Add Ambulance
          </button>
          <button
            onClick={handleToggleView}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {view === 'live' ? 'View Trip History' : 'View Live Dashboard'}
          </button>
          <button 
            onClick={() => {
              console.log('Manual Alert button clicked');
              setShowManualAlertModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Manual Alert
          </button>
        </div>
      </header>

      {view === 'live' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Alerts & Trips */}
          <aside className="w-1/4 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Alerts & Trips</h2>
            <div className="space-y-4">
              {/* New Alerts Section */}
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
                <h3 className="font-medium text-red-800 dark:text-red-200">New Alerts ({newAlerts.length})</h3>
                {loadingAlerts ? (
                  <p className="text-sm text-red-700 dark:text-red-300">Loading alerts...</p>
                ) : errorAlerts ? (
                  <p className="text-sm text-red-700 dark:text-red-300">{errorAlerts}</p>
                ) : newAlerts.length > 0 ? (
                  newAlerts.map(alert => (
                    <div key={alert.trip_id} className="mt-2 p-2 border border-red-300 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-800">
                      <p className="font-semibold">Trip ID: {alert.trip_id}</p>
                      <p className="text-sm">Status: {alert.status}</p>
                      <p className="text-sm">Location: {alert.scene_location_lat}, {alert.scene_location_lon}</p>
                      <p className="text-sm">Time: {new Date(alert.alert_timestamp).toLocaleString()}</p>
                      <button 
                        onClick={() => handleAssignClick(alert)}
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-red-700 dark:text-red-300">No new alerts.</p>
                )}
              </div>
                          {/* Active Trips Section */}
                          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-md">
                            <h3 className="font-medium text-blue-800 dark:text-blue-200">Active Trips ({activeTrips.length})</h3>
                            {activeTrips.length > 0 ? (
                              activeTrips.map(trip => (
                                <div key={trip.trip_id} className="mt-2 p-2 border border-blue-300 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-800">
                                  <p className="font-semibold">Trip ID: {trip.trip_id}</p>
                                  <p className="text-sm">Status: {trip.status}</p>
                                  <p className="text-sm font-bold">{trip.eta_minutes ? `ETA: ${trip.eta_minutes} mins` : 'ETA: Calculating...'}</p>
                                  <button
                                    onClick={() => handleCompleteTrip(trip.trip_id)}
                                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                    disabled={completingTripId === trip.trip_id}
                                  >
                                    {completingTripId === trip.trip_id ? 'Completing...' : 'Complete Trip'}
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-blue-700 dark:text-blue-300">No active trips.</p>
                            )}
                          </div>          </div>
        </aside>

          {/* Center Panel: Live Map */}
          <main className="flex-1 p-4">
            <h2 className="sr-only">Live Map</h2>
            <div className={`h-full w-full`}>
              {!showManualAlertModal && <MapView ambulanceLocations={ambulanceLocations} destinations={destinations} />}
            </div>
          </main>

          {/* Right Panel: Fleet Status */}
          <aside className="w-1/4 bg-white dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Fleet Status</h2>
            <div className="space-y-4">
              {/* Ambulance Status Cards */}
              {fleetStatus.length > 0 ? (
              fleetStatus.map(ambulance => {
                // Find the active trip for this ambulance, if any
                const tripForAmbulance = activeTrips.find(t => t.assigned_ambulance_id === ambulance.ambulance_id);
                
                // Construct a more detailed status message if the ambulance is on a trip
                const displayStatus = tripForAmbulance
                  ? `${ambulance.current_status.replace('_', ' ')} (${tripForAmbulance.status.replace('_', ' ')})`
                  : ambulance.current_status.replace('_', ' ');

                console.log(`[Fleet Status Render] Ambulance ID: ${ambulance.ambulance_id}, Trip: ${tripForAmbulance ? tripForAmbulance.trip_id : 'None'}, Display Status: ${displayStatus}`);

                return (
                  <div key={ambulance.ambulance_id} className={`p-3 rounded-md ${
                    ambulance.current_status === 'Available' ? 'bg-green-100 dark:bg-green-900' :
                    ambulance.current_status === 'On_Trip' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <h3 className={`font-medium ${
                      ambulance.current_status === 'Available' ? 'text-green-800 dark:text-green-200' :
                      ambulance.current_status === 'On_Trip' ? 'text-yellow-800 dark:text-yellow-200' :
                      'text-gray-800 dark:text-gray-200'
                    }`}>{ambulance.vehicle_name}</h3>
                    <p className={`text-sm ${
                      ambulance.current_status === 'Available' ? 'text-green-700 dark:text-green-300' :
                      ambulance.current_status === 'On_Trip' ? 'text-yellow-700 dark:text-yellow-300' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>Status: {displayStatus}</p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAmbulance(ambulance.ambulance_id)}
                      >
                        Delete
                      </Button>
                      <select
                        value={ambulance.current_status}
                        onChange={(e) => handleUpdateAmbulanceStatus(ambulance.ambulance_id, e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="Available">Available</option>
                        <option value="On_Trip">On Trip</option>
                        <option value="Not_Available">Not Available</option>
                      </select>
                    </div>
                  </div>
                );
              })
            ) : (
                <p className="text-sm text-gray-500">No fleet data available.</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <TripHistoryView trips={tripHistory} isLoading={loadingHistory} error={errorHistory} />
      )}

      {/* Assign Ambulance Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ambulance to Trip {selectedAlert?.trip_id}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <label htmlFor="ambulance-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Available Ambulance:
            </label>
            <select
              id="ambulance-select"
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={selectedAmbulanceId}
              onChange={(e) => setSelectedAmbulanceId(e.target.value)}
            >
              <option value="">-- Choose an Ambulance --</option>
              {availableAmbulances.map(amb => (
                <option key={amb.ambulance_id} value={amb.ambulance_id}>
                  {amb.vehicle_name} ({amb.license_plate}) - {amb.firstName ? `${amb.firstName} ${amb.lastName}` : 'No paramedic assigned'}
                </option>
              ))}
            </select>
            {assignError && <p className="text-red-500 text-sm mt-2">{assignError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssignTrip} disabled={assigningTrip || !selectedAmbulanceId}>
              {assigningTrip ? 'Assigning...' : 'Assign Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Alert Modal */}
      <Dialog open={showManualAlertModal} onOpenChange={setShowManualAlertModal}>
        <DialogContent className="z-[100]">
          <DialogHeader>
            <DialogTitle>Create Manual Emergency Alert</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {/* Patient Search */}
            <div>
              <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Patient (Optional):
              </label>
              <input
                type="text"
                id="patient-search"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={patientSearchQuery}
                onChange={(e) => handlePatientSearch(e.target.value)}
                placeholder="Search by name or patient ID"
              />
              {searchingPatients && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
              {patientSearchError && <p className="text-sm text-red-500 mt-1">{patientSearchError}</p>}
              {patientSearchResults.length > 0 && (
                <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 w-full rounded-md mt-1 max-h-48 overflow-y-auto">
                  {patientSearchResults.map(patient => (
                    <li
                      key={patient.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </li>
                  ))}
                </ul>
              )}
              {selectedPatient && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Selected Patient: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                  <button onClick={() => setSelectedPatient(null)} className="ml-2 text-red-500 hover:text-red-700">
                    (Clear)
                  </button>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="manual-lat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latitude:
              </label>
              <input
                type="number"
                id="manual-lat"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="e.g., 20.5937"
                step="any"
                required
              />
            </div>
            <div>
              <label htmlFor="manual-lon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Longitude:
              </label>
              <input
                type="number"
                id="manual-lon"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                placeholder="e.g., 78.9629"
                step="any"
                required
              />
            </div>
            <div>
              <label htmlFor="manual-patient-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient Name (Optional, if no patient selected):
              </label>
              <input
                type="text"
                id="manual-patient-name"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={manualPatientName}
                onChange={(e) => setManualPatientName(e.target.value)}
                placeholder="e.g., John Doe"
                disabled={!!selectedPatient} // Disable if patient is selected
              />
            </div>
            <div>
              <label htmlFor="manual-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional):
              </label>
              <textarea
                id="manual-notes"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="e.g., Unconscious, difficulty breathing"
                rows={3}
              />
            </div>
            {manualAlertError && <p className="text-red-500 text-sm mt-2">{manualAlertError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualAlertModal(false)}>Cancel</Button>
            <Button onClick={handleCreateManualAlert} disabled={creatingManualAlert || !manualLat || !manualLon}>
              {creatingManualAlert ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddAmbulanceForm
        open={showAddAmbulanceModal}
        onOpenChange={setShowAddAmbulanceModal}
        onAmbulanceAdded={fetchFleetStatus}
      />
    </div>
  );
};

export default FleetManagementDashboard;