import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiUrl from '@/config/api';
import useWebSocket from '../hooks/useWebSocket';
import MapView from '../components/ems/MapView';
import { Sparkles, HeartPulse, Gauge, Siren, ChevronDown, Activity, MapPin, Camera, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// --- Helper Functions & Components ---

const getAcuityInfo = (acuityText) => {
  if (!acuityText) return { level: 'N/A', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  const text = acuityText.toLowerCase();
  if (text.includes('critical')) return { level: 'CRITICAL', color: 'bg-black/80 text-red-500 border-red-500/50 shadow-lg shadow-red-900/50' };
  if (text.includes('high')) return { level: 'HIGH', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
  if (text.includes('moderate')) return { level: 'MODERATE', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
  if (text.includes('low')) return { level: 'LOW', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
  return { level: 'N/A', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
};

const TripCard = ({ trip, acuity, isGeneratingAcuity }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const acuityInfo = useMemo(() => getAcuityInfo(acuity), [acuity]);

  const VitalStat = ({ icon, value, unit, label, color }) => (
    <div className={`flex flex-col p-3 rounded-xl bg-${color}-500/5 border border-${color}-500/10`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-gray-900 dark:text-white">{value || '--'}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`glass-card rounded-3xl overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-blue-500/30 shadow-2xl shadow-blue-900/10' : 'border-white/10 hover:border-white/20'}`}
    >
      <div className="p-6 cursor-pointer relative" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Background Glow for ID */}
        <div className="absolute right-0 top-0 p-6 opacity-5 font-black text-6xl text-gray-500 select-none">
          #{trip.trip_id}
        </div>

        <div className="flex items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            {/* ETA Circle */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
              <div className="w-20 h-20 bg-gray-900/5 dark:bg-black/40 border border-blue-500/20 rounded-full flex flex-col items-center justify-center relative backdrop-blur-md">
                <span className="text-2xl font-black text-blue-500">{trip.eta_minutes ?? '--'}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">MIN</span>
              </div>
            </div>

            {/* Patient Info */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {trip.patient_name || (trip.patient_firstName ? `${trip.patient_firstName} ${trip.patient_lastName}` : 'Unknown Patient')}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${acuityInfo.color}`}>
                  {acuityInfo.level}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Siren size={14} className="text-red-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{trip.vehicle_name}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                <span className="font-mono text-xs opacity-70">TRIP-{trip.trip_id}</span>
              </div>
            </div>
          </div>

          <motion.button
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-white hover:bg-blue-500 transition-colors"
          >
            <ChevronDown size={20} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-white/5 p-6 bg-gray-50/50 dark:bg-black/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Vitals Column */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Activity size={14} /> Live Vitals
                  </h4>
                  {trip.latest_vitals ? (
                    <div className="grid grid-cols-2 gap-3">
                      <VitalStat icon={<HeartPulse size={16} className="text-pink-500" />} value={trip.latest_vitals.heart_rate} unit="bpm" label="Heart Rate" color="pink" />
                      <VitalStat icon={<Gauge size={16} className="text-teal-500" />} value={`${trip.latest_vitals.blood_pressure_systolic}/${trip.latest_vitals.blood_pressure_diastolic}`} unit="mmHg" label="BP" color="teal" />
                      <div className="col-span-2 p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Notes</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{trip.latest_vitals.notes || 'No notes provided'}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-center">
                      <Activity className="mx-auto text-gray-400 mb-2 opacity-50" />
                      <p className="text-xs text-gray-500">Waiting for vitals transmission...</p>
                    </div>
                  )}
                </div>

                {/* AI Assessment & Photo Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-500" /> AI Triage & Scene
                    </h4>
                    {isGeneratingAcuity && <span className="text-xs text-purple-500 animate-pulse font-bold">Analyzing...</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Triage Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 min-h-[140px] relative overflow-hidden">
                      {acuity ? (
                        <div className="relative z-10 text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                          {acuity}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <p className="text-sm">Awaiting sufficient data for analysis.</p>
                        </div>
                      )}
                      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full pointer-events-none"></div>
                    </div>

                    {/* Scene Photo Card */}
                    {trip.trip_image_url ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-white/10 h-[140px] bg-black/50">
                        <img
                          src={apiUrl(trip.trip_image_url)}
                          alt="Scene"
                          className="w-full h-full object-contain bg-black/50 opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => window.open(apiUrl(trip.trip_image_url), '_blank')}
                        />
                        <div className="absolute top-2 right-2">
                          {trip.verification_status === 'Verified' && (
                            <span className="px-2 py-1 rounded-full bg-green-500/80 text-white text-[10px] font-bold backdrop-blur-sm border border-green-400/30 flex items-center gap-1">
                              <ShieldCheck size={10} /> Verified
                            </span>
                          )}
                          {trip.verification_status === 'Suspected Fake' && (
                            <span className="px-2 py-1 rounded-full bg-red-500/80 text-white text-[10px] font-bold backdrop-blur-sm border border-red-400/30 flex items-center gap-1">
                              <AlertTriangle size={10} /> Suspected Fake
                            </span>
                          )}
                          {trip.verification_status === 'Error' && (
                            <span className="px-2 py-1 rounded-full bg-gray-600/80 text-white text-[10px] font-bold backdrop-blur-sm border border-gray-400/30 flex items-center gap-1">
                              <AlertTriangle size={10} /> AI Unavailable
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                          <span className="text-xs font-bold text-white flex items-center gap-1"><Camera size={12} /> Accident Scene</span>
                          {trip.verification_reason && (
                            <p className="text-[10px] text-gray-300 leading-tight mt-1 truncate">{trip.verification_reason}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-white/5 h-[140px] flex flex-col items-center justify-center text-gray-500">
                        <Camera size={24} className="opacity-20 mb-2" />
                        <span className="text-xs">No scene photo</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// Define a hardcoded location for the hospital
const HOSPITAL_LOCATION = { lat: 12.9716, lng: 77.5946 }; // Example: Bangalore

const ERDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [transportingTrips, setTransportingTrips] = useState([]);
  const [ambulanceLocations, setAmbulanceLocations] = useState({});
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [errorTrips, setErrorTrips] = useState('');
  const [tripAcuity, setTripAcuity] = useState({});
  const [generatingAcuity, setGeneratingAcuity] = useState({});

  const generateAcuityAssessment = async (trip) => {
    if (!trip.latest_vitals || generatingAcuity[trip.trip_id] || tripAcuity[trip.trip_id]) {
      return;
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
          generateAcuityAssessment(trip);
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
          generateAcuityAssessment(newTripState);
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
          generateAcuityAssessment(trip);
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

  const sortedTrips = useMemo(() => {
    return [...transportingTrips].sort((a, b) => {
      const etaA = a.eta_minutes ?? Infinity;
      const etaB = b.eta_minutes ?? Infinity;
      return etaA - etaB;
    });
  }, [transportingTrips]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-black/90 font-sans">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400">ER Live Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Real-time incoming patient tracking & triage.</p>
        </div>
        <div className="bg-white/10 p-2 rounded-full border border-white/10 hidden md:block">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Map Section - Takes up remaining space */}
        <div className="lg:w-2/3 h-full glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative order-2 lg:order-1">
          <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 border border-white/10 pointer-events-none">
            <MapPin size={12} className="text-blue-400" /> Incoming Units Map
          </div>
          <MapView ambulanceLocations={ambulanceLocations} destinations={hospitalDestinations} />
        </div>

        {/* Incoming List Section - Scrollable Sidebar */}
        <div className="lg:w-1/3 h-full overflow-y-auto pr-2 order-1 lg:order-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Incoming Transports</h2>
            <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-lg text-xs font-bold border border-red-500/20">{sortedTrips.length} Active</span>
          </div>

          {loadingTrips ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400 font-medium">Scanning...</p>
            </div>
          ) : errorTrips ? (
            <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-500 font-bold">Connection Error</p>
              <p className="text-sm text-red-400">{errorTrips}</p>
            </div>
          ) : sortedTrips.length > 0 ? (
            <div className="space-y-4 pb-20">
              <AnimatePresence>
                {sortedTrips.map(trip => (
                  <TripCard
                    key={trip.trip_id}
                    trip={trip}
                    acuity={tripAcuity[trip.trip_id]}
                    isGeneratingAcuity={generatingAcuity[trip.trip_id]}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-gray-400 glass-panel rounded-3xl border border-dashed border-gray-200 dark:border-white/5">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Siren className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-500">ER Status: Clear</h3>
              <p className="mt-2 text-sm text-gray-400">No incoming emergency transports detected.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ERDashboard;
