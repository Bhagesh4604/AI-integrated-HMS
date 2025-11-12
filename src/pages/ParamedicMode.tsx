import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiUrl from '@/config/api';
import useGeolocation from '../hooks/useGeolocation';
import ParamedicMapView from '../components/ems/ParamedicMapView';
import usePushNotifications from '../hooks/usePushNotifications';
import { Heart, Droplet, FileText, CheckCircle, AlertTriangle, MapPin, Navigation, Building, Flag, Clock, Ambulance, History, XCircle } from 'lucide-react';

const TripHistoryView = ({ trips, onBack, isLoading, error }) => {
  if (isLoading) {
    return <div className="p-4 text-center">Loading trip history...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Trip History</h2>
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
          Back
        </button>
      </div>
      <div className="space-y-3">
        {trips.length > 0 ? (
          trips.map(trip => (
            <div key={trip.trip_id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3">
              <p className="font-semibold">{trip.trip_id}</p>
              <p className="text-sm"><strong>Status:</strong> {trip.status}</p>
              <p className="text-sm"><strong>Date:</strong> {new Date(trip.alert_timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p className="text-sm"><strong>Patient:</strong> {trip.patient_firstName} {trip.patient_lastName || 'N/A'}</p>
            </div>
          ))
        ) : (
          <p>No trip history found.</p>
        )}
      </div>
    </div>
  );
};

const ParamedicMode = ({ user }) => {
  const navigate = useNavigate();
  const [myTrip, setMyTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [errorTrip, setErrorTrip] = useState('');

  // Shift Management state
  const [activeShift, setActiveShift] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [errorShift, setErrorShift] = useState('');
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);

  // Trip History state
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'history'
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState('');

  // Vitals state
  const [heartRate, setHeartRate] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingVitals, setSubmittingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState('');
  const [vitalsSuccess, setVitalsSuccess] = useState('');

  // Status state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState('status');

  const { position, error: geoError, startTracking, stopTracking } = useGeolocation();
  const { error: pushError } = usePushNotifications(user?.id);

  const fetchTripHistory = async () => {
    if (!user || !user.id) return;
    setLoadingHistory(true);
    setErrorHistory('');
    try {
      const response = await fetch(apiUrl(`/api/ems/paramedic/trip-history?paramedicId=${user.id}`));
      const data = await response.json();
      if (data.success) {
        setTripHistory(data.trips);
      } else {
        setErrorHistory(data.message || 'Failed to fetch trip history.');
      }
    } catch (error) {
      setErrorHistory('Failed to connect to the server.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistory = () => {
    fetchTripHistory();
    setView('history');
  };

  const handleClockIn = async () => {
    if (!selectedAmbulanceId) {
      setErrorShift('Please select an ambulance.');
      return;
    }
    setIsClockingIn(true);
    setErrorShift('');
    try {
      const response = await fetch(apiUrl('/api/ems/crews/clock-in'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ambulance_id: selectedAmbulanceId }),
      });
      const data = await response.json();
      if (data.success) {
        fetchMyShift();
      } else {
        setErrorShift(data.message || 'Failed to clock in.');
      }
    } catch (error) {
      setErrorShift('Failed to connect to the server.');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setIsClockingOut(true);
    setErrorShift('');
    try {
      const response = await fetch(apiUrl('/api/ems/crews/clock-out'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveShift(null);
      } else {
        setErrorShift(data.message || 'Failed to clock out.');
      }
    } catch (error) {
      setErrorShift('Failed to connect to the server.');
    } finally {
      setIsClockingOut(false);
    }
  };

  const fetchMyShift = async () => {
    if (!user || !user.id) return;
    setLoadingShift(true);
    setErrorShift('');
    try {
      const response = await fetch(apiUrl(`/api/ems/crews/my-shift?paramedicId=${user.id}`));
      const data = await response.json();
      if (data.success) {
        setActiveShift(data.shift);
        if (data.shift) {
          fetchMyTrip();
        } else {
          setLoadingTrip(false);
          setMyTrip(null);
          fetchAvailableAmbulances();
        }
      } else {
        setErrorShift(data.message || 'Failed to fetch shift status.');
      }
    } catch (error) {
      setErrorShift('Failed to connect to the server.');
    } finally {
      setLoadingShift(false);
    }
  };

  const fetchAvailableAmbulances = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances/available'));
      const data = await response.json();
      if (data.success) {
        setAvailableAmbulances(data.ambulances);
      }
    } catch (error) {
      console.error('Error fetching available ambulances:', error);
    }
  };

  const sendLocationUpdate = async (pos) => {
    if (!myTrip || !user.id || !activeShift) return;
    const ambulanceId = activeShift.ambulance_id;
    try {
      await fetch(apiUrl('/api/ems/ambulance/location'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance_id: ambulanceId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date(pos.timestamp).toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send location update:', error);
    }
  };

  const fetchMyTrip = async () => {
    if (!user || !user.id) return;
    setLoadingTrip(true);
    setErrorTrip('');
    try {
      const response = await fetch(apiUrl(`/api/ems/paramedic/my-trip?paramedicId=${user.id}`));
      const data = await response.json();
      setMyTrip(data.success ? data.trip : null);
      if (!data.success && data.trip !== null) {
        setErrorTrip(data.message || 'Failed to fetch assigned trip.');
      }
    } catch (error) {
      setErrorTrip('Failed to connect to the server.');
    } finally {
      setLoadingTrip(false);
    }
  };

  const handleSubmitVitals = async () => {
    if (!myTrip) return;
    setSubmittingVitals(true);
    setVitalsError('');
    setVitalsSuccess('');
    try {
      const response = await fetch(apiUrl('/api/ems/vitals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: myTrip.trip_id,
          heart_rate: heartRate ? parseInt(heartRate) : null,
          blood_pressure_systolic: bpSystolic ? parseInt(bpSystolic) : null,
          blood_pressure_diastolic: bpDiastolic ? parseInt(bpDiastolic) : null,
          notes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVitalsSuccess('Vitals submitted successfully!');
        setTimeout(() => setVitalsSuccess(''), 3000);
        setHeartRate(''); setBpSystolic(''); setBpDiastolic(''); setNotes('');
      } else {
        setVitalsError(data.message || 'Failed to submit vitals.');
      }
    } catch (error) {
      setVitalsError('Failed to connect to the server.');
    } finally {
      setSubmittingVitals(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!myTrip) return;
    setUpdatingStatus(true);
    setStatusError('');
    setStatusSuccess('');
    try {
      let response;
      if (newStatus === 'Completed') {
        response = await fetch(apiUrl('/api/ems/trips/complete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip_id: myTrip.trip_id }),
        });
      } else {
        response = await fetch(apiUrl('/api/ems/trips/status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip_id: myTrip.trip_id, new_status: newStatus }),
        });
      }

      const data = await response.json();
      if (data.success) {
        setStatusSuccess(`Trip status updated to ${newStatus}!`);
        setTimeout(() => setStatusSuccess(''), 3000);
        if (newStatus === 'Completed') {
          setMyTrip(null);
        } else {
          fetchMyTrip();
        }
      } else {
        setStatusError(data.message || 'Failed to update status.');
      }
    } catch (error) {
      setStatusError('Failed to connect to the server.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (user && user.id && user.role === 'ROLE_PARAMEDIC') {
      fetchMyShift();
    }
  }, [user]);

  useEffect(() => {
    if (activeShift) {
      fetchMyTrip();
    }
  }, [activeShift]);

  useEffect(() => {
    const isTrackingNeeded = activeShift && myTrip && ['Assigned', 'En_Route_To_Scene', 'Transporting'].includes(myTrip.status);
    if (isTrackingNeeded) {
      startTracking(sendLocationUpdate);
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [myTrip?.status, user?.id, activeShift]);

  if (loadingShift) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!activeShift) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Start Shift</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ambulance-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Ambulance:
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
                    {amb.vehicle_name} ({amb.license_plate})
                  </option>
                ))}
              </select>
            </div>
            {errorShift && <p className="text-red-500 text-sm">{errorShift}</p>}
            <button
              onClick={handleClockIn}
              disabled={isClockingIn || !selectedAmbulanceId}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              <Clock size={20} /> {isClockingIn ? 'Clocking In...' : 'Clock In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <TripHistoryView
        trips={tripHistory}
        onBack={() => setView('dashboard')}
        isLoading={loadingHistory}
        error={errorHistory}
      />
    );
  }

  if (loadingTrip) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const paramedicLocation = position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
  const sceneLocation = myTrip ? { latitude: myTrip.scene_location_lat, longitude: myTrip.scene_location_lon } : null;

  const renderStatusButton = (status, label, icon, color) => (
    <button
      onClick={() => handleUpdateStatus(status)}
      disabled={updatingStatus || (myTrip && myTrip.status === status)}
      className={`flex-1 flex flex-col items-center justify-center p-3 text-white rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
    >
      {icon}
      <span className="mt-1 font-semibold text-xs">{label}</span>
    </button>
  );

  const TabButton = ({ tabName, label, activeTab, setActiveTab }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 py-2 text-sm font-medium ${activeTab === tabName ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-2 md:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      {geoError && <div className="p-3 mb-4 bg-red-200 text-red-800 rounded-md text-sm">Geolocation Error: {geoError}</div>}
      {pushError && <div className="p-3 mb-4 bg-red-200 text-red-800 rounded-md text-sm">Push Notification Error: {pushError}</div>}
      
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs">
          <p className="flex items-center gap-1"><Clock size={12} /> {new Date(activeShift.shift_start_time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</p>
          <p className="flex items-center gap-1"><Ambulance size={12} /> <strong>{activeShift.vehicle_name}</strong></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleViewHistory} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"><History size={18} /></button>
                    <button
                      onClick={handleClockOut}
                      disabled={isClockingOut || !!myTrip}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-gray-500"
                    >
                      <XCircle size={18} />
                    </button>
        </div>
      </div>
      {errorShift && <p className="text-red-500 text-sm mb-4">{errorShift}</p>}

      {myTrip ? (
        <>
          <div className="w-full rounded-lg overflow-hidden shadow-md mb-4 h-[50vh]">
            <ParamedicMapView paramedicLocation={paramedicLocation} sceneLocation={sceneLocation} />
          </div>

          <div className="flex-grow bg-white dark:bg-gray-800 shadow-md rounded-lg p-3">
            <h2 className="text-lg font-bold mb-2">Trip: {myTrip.trip_id}</h2>
            <p className="text-sm"><strong>Status:</strong> <span className="font-semibold text-blue-400">{myTrip.status.replace('_', ' ')}</span></p>
            
            {myTrip.patient_firstName && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-bold mb-1">Patient Details</h3>
                <p className="text-sm"><strong>Name:</strong> {myTrip.patient_firstName} {myTrip.patient_lastName}</p>
                {myTrip.patient_dateOfBirth && <p className="text-sm"><strong>DOB:</strong> {new Date(myTrip.patient_dateOfBirth).toLocaleDateString()}</p>}
              </div>
            )}

            <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
              <TabButton tabName="status" label="Status" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tabName="vitals" label="Vitals" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tabName="nav" label="Navigate" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="p-3">
              {activeTab === 'status' && (
                <div>
                  <h3 className="text-md font-bold mb-3 text-center">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {renderStatusButton('At_Scene', 'At Scene', <MapPin size={20} />, 'bg-blue-500 hover:bg-blue-600')}
                    {renderStatusButton('Transporting', 'Transport', <Navigation size={20} />, 'bg-yellow-500 hover:bg-yellow-600')}
                    {renderStatusButton('At_Hospital', 'At Hospital', <Building size={20} />, 'bg-green-500 hover:bg-green-600')}
                    {renderStatusButton('Completed', 'Complete', <Flag size={20} />, 'bg-gray-500 hover:bg-gray-600')}
                  </div>
                  {statusError && <p className="text-red-500 text-xs mt-2">{statusError}</p>}
                  {statusSuccess && <p className="text-green-500 text-xs mt-2">{statusSuccess}</p>}
                </div>
              )}
              {activeTab === 'vitals' && (
                <div>
                  <h3 className="text-md font-bold mb-3 text-center">Patient Vitals</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-1">
                      <label htmlFor="heartRate" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Heart Rate</label>
                      <input type="number" id="heartRate" className="mt-1 w-full p-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      <label htmlFor="bpSystolic" className="block text-xs font-medium text-gray-500 dark:text-gray-400">BP Sys</label>
                      <input type="number" id="bpSystolic" className="mt-1 w-full p-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                       <label htmlFor="bpDiastolic" className="block text-xs font-medium text-gray-500 dark:text-gray-400">BP Dia</label>
                       <input type="number" id="bpDiastolic" className="mt-1 w-full p-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="notes" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
                      <textarea id="notes" rows={2} className="mt-1 w-full p-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                    </div>
                  </div>
                  {vitalsError && <p className="text-red-500 text-xs mt-2">{vitalsError}</p>}
                  {vitalsSuccess && <p className="text-green-500 text-xs mt-2">{vitalsSuccess}</p>}
                  <button onClick={handleSubmitVitals} disabled={submittingVitals} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> {submittingVitals ? 'Sending...' : 'Send Vitals'}
                  </button>
                </div>
              )}
              {activeTab === 'nav' && (
                 <button
                    onClick={() => {
                      if (paramedicLocation && sceneLocation) {
                        const origin = `${paramedicLocation.latitude},${paramedicLocation.longitude}`;
                        const destination = `${sceneLocation.latitude},${sceneLocation.longitude}`;
                        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
                        window.open(url, '_blank');
                      }
                    }}
                    disabled={!paramedicLocation || !sceneLocation}
                    className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
                  >
                    <Navigation size={20} /> Get Directions in Google Maps
                  </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No Active Trip</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Waiting for dispatch...</p>
          {errorTrip && <p className="text-red-500 text-sm mt-4">Error: {errorTrip}</p>}
        </div>
      )}
    </div>
  );
};

export default ParamedicMode;
