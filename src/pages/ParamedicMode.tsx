import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiUrl from '@/config/api';
import useGeolocation from '../hooks/useGeolocation';
import ParamedicMapView from '../components/ems/ParamedicMapView';
import usePushNotifications from '../hooks/usePushNotifications';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { Heart, Activity, FileText, CheckCircle, AlertTriangle, MapPin, Navigation, Building, Flag, Clock, Ambulance, History, XCircle, Sparkles, X, Mic, MicOff, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---

interface User {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface Trip {
  trip_id: string;
  status: string;
  patient_firstName: string;
  patient_lastName: string;
  patient_dateOfBirth?: string;
  scene_location_lat: number;
  scene_location_lon: number;
  alert_timestamp: string;
  notes?: string;
}

interface Shift {
  ambulance_id: string;
  vehicle_name: string;
  status: string;
}

interface AmbulanceData {
  ambulance_id: string;
  vehicle_name: string;
}

interface HandoverReportModalProps {
  report: string;
  isLoading: boolean;
  onClose: () => void;
}

interface TripHistoryViewProps {
  trips: Trip[];
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

interface ParamedicModeProps {
  user: User;
}

interface VitalsResponse {
  success: boolean;
  vitals: any[];
}

// --- Components ---

const HandoverReportModal: React.FC<HandoverReportModalProps> = ({ report, isLoading, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 font-sans p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="glass-panel w-full max-w-2xl text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20"
      >
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-purple-400" size={24} /> AI Handover Report</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6 bg-black/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Sparkles className="animate-spin text-purple-500" size={48} />
              <p className="text-purple-300 animate-pulse text-lg">Consulting Medical AI...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200 bg-black/40 p-4 rounded-xl border border-white/5">{report}</pre>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">Close Report</button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const TripHistoryView: React.FC<TripHistoryViewProps> = ({ trips, onBack, isLoading, error }) => {
  if (isLoading) return <div className="p-8 text-center text-white">Loading trip history...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Mission History</h2>
        <button onClick={onBack} className="px-5 py-2 glass-card hover:bg-white/10 rounded-xl transition-all">Back to Dashboard</button>
      </div>
      <div className="grid gap-4 max-w-4xl mx-auto">
        {trips.length > 0 ? (
          trips.map(trip => (
            <motion.div
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              key={trip.trip_id} className="glass-card p-5 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trip ID: {trip.trip_id}</p>
                  <h3 className="text-lg font-bold text-white">{trip.patient_firstName} {trip.patient_lastName || ''}</h3>
                  <p className="text-gray-400 text-sm mt-1">{new Date(trip.alert_timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${trip.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {trip.status}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 glass-panel rounded-2xl">No trip history found.</div>
        )}
      </div>
    </div>
  );
};

// Icon component needed for the standby screen
const RadioTower = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.9 19.1C3.3 17.4 2.5 15.2 2.5 13 2.5 7.8 6.8 3.5 12 3.5c2.2 0 4.4.9 6.1 2.5" />
    <path d="M7.8 16.2c-1-1.1-1.5-2.6-1.5-4.2 0-3.2 2.6-5.8 5.8-5.8 1.6 0 3 .6 4.1 1.7" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 14v8" />
    <path d="M8 22h8" />
  </svg>
);

const ParamedicMode: React.FC<ParamedicModeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [myTrip, setMyTrip] = useState<Trip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [errorTrip, setErrorTrip] = useState('');

  // Shift Management
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [errorShift, setErrorShift] = useState('');
  const [availableAmbulances, setAvailableAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);

  // Core State
  const [view, setView] = useState('dashboard');
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState('');
  const [activeTab, setActiveTab] = useState('status');

  // Vitals & Voice
  const [heartRate, setHeartRate] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingVitals, setSubmittingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState('');
  const [vitalsSuccess, setVitalsSuccess] = useState('');

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    commandMode: false,
    onResult: (text: string) => processVoiceCommand(text)
  });

  // Status State
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  // AI Handover
  const [handoverReport, setHandoverReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const { position, error: geoError, startTracking, stopTracking } = useGeolocation();
  const { error: pushError } = usePushNotifications(user?.id);

  // --- Voice Processing Logic ---
  const processVoiceCommand = (text: string) => {
    // Simple regex for pattern matching vitals
    // Example: "Heart rate 80", "BP 120 80", "Blood pressure 120 over 80"

    // Heart Rate
    const hrMatch = text.match(/(?:heart rate|pulse)\s+(\d+)/i);
    if (hrMatch) setHeartRate(hrMatch[1]);

    // Blood Pressure (Format: "120 over 80" or "120 80")
    const bpMatch = text.match(/(?:bp|blood pressure)\s+(\d+)\s+(?:over|by|\s)?\s*(\d+)/i);
    if (bpMatch) {
      setBpSystolic(bpMatch[1]);
      setBpDiastolic(bpMatch[2]);
    }

    // Append to notes if not a specific vital command, or just append everything for context
    if (!text.includes('heart rate') && !text.includes('blood pressure')) {
      setNotes(prev => (prev ? prev + ' ' + text : text));
    }
  };

  // --- API Functions (Same as before, cleaned up) ---
  const fetchTripHistory = async () => {
    if (!user || !user.id) return;
    setLoadingHistory(true); setErrorHistory('');
    try {
      const res = await fetch(apiUrl(`/api/ems/paramedic/trip-history?paramedicId=${user.id}`));
      const data = await res.json();
      if (data.success) setTripHistory(data.trips); else setErrorHistory(data.message);
    } catch (e) { setErrorHistory('Connection failed'); } finally { setLoadingHistory(false); }
  };

  const handleViewHistory = () => { fetchTripHistory(); setView('history'); };

  const handleClockIn = async () => {
    if (!selectedAmbulanceId) return setErrorShift('Select an ambulance');
    setIsClockingIn(true);
    try {
      const res = await fetch(apiUrl('/api/ems/crews/clock-in'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ambulance_id: selectedAmbulanceId })
      });
      const data = await res.json();
      if (data.success) fetchMyShift(); else setErrorShift(data.message);
    } catch (e) { setErrorShift('Connection failed'); } finally { setIsClockingIn(false); }
  };

  const handleClockOut = async () => {
    setIsClockingOut(true);
    try {
      const res = await fetch(apiUrl('/api/ems/crews/clock-out'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if ((await res.json()).success) setActiveShift(null);
    } catch (e) { setErrorShift('Connection failed'); } finally { setIsClockingOut(false); }
  };

  const fetchMyShift = async () => {
    if (!user?.id) return;
    setLoadingShift(true);
    try {
      const res = await fetch(apiUrl(`/api/ems/crews/my-shift?paramedicId=${user.id}`));
      const data = await res.json();
      if (data.success) {
        setActiveShift(data.shift);
        if (data.shift) fetchMyTrip();
        else { setLoadingTrip(false); setMyTrip(null); fetchAvailableAmbulances(); }
      }
    } catch (e) { setErrorShift('Connection failed'); } finally { setLoadingShift(false); }
  };

  const fetchAvailableAmbulances = async () => {
    try { setAvailableAmbulances((await (await fetch(apiUrl('/api/ems/ambulances/available'))).json()).ambulances || []); } catch (e) { }
  };

  const fetchMyTrip = async () => {
    setLoadingTrip(true);
    try {
      const data = await (await fetch(apiUrl(`/api/ems/paramedic/my-trip?paramedicId=${user.id}`))).json();
      setMyTrip(data.success ? data.trip : null);
    } catch (e) { setErrorTrip('Connection failed'); } finally { setLoadingTrip(false); }
  };

  const sendLocationUpdate = async (pos: GeolocationPosition) => {
    if (!myTrip || !activeShift) return;
    try {
      await fetch(apiUrl('/api/ems/ambulance/location'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulance_id: activeShift.ambulance_id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, timestamp: new Date(pos.timestamp).toISOString() })
      });
    } catch (e) { }
  };

  const handleSubmitVitals = async () => {
    if (!myTrip) return;
    setSubmittingVitals(true);
    try {
      const res = await fetch(apiUrl('/api/ems/vitals'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: myTrip.trip_id, heart_rate: heartRate ? parseInt(heartRate) : null, blood_pressure_systolic: bpSystolic ? parseInt(bpSystolic) : null, blood_pressure_diastolic: bpDiastolic ? parseInt(bpDiastolic) : null, notes })
      });
      if ((await res.json()).success) {
        setVitalsSuccess('Vitals Logged'); setTimeout(() => setVitalsSuccess(''), 3000);
        setHeartRate(''); setBpSystolic(''); setBpDiastolic(''); setNotes('');
      } else setVitalsError('Failed');
    } catch (e) { setVitalsError('Error'); } finally { setSubmittingVitals(false); }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!myTrip) return;
    setUpdatingStatus(true);
    try {
      const endpoint = newStatus === 'Completed' ? '/api/ems/trips/complete' : '/api/ems/trips/status';
      const body = newStatus === 'Completed' ? { trip_id: myTrip.trip_id } : { trip_id: myTrip.trip_id, new_status: newStatus };
      const res = await fetch(apiUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if ((await res.json()).success) {
        setStatusSuccess(`Status: ${newStatus}`); setTimeout(() => setStatusSuccess(''), 3000);
        newStatus === 'Completed' ? setMyTrip(null) : fetchMyTrip();
      } else setStatusError('Failed');
    } catch (e) { setStatusError('Error'); } finally { setUpdatingStatus(false); }
  };

  const handleGenerateReport = async () => {
    if (!myTrip) return;
    setIsGeneratingReport(true); setShowHandoverModal(true); setHandoverReport('');
    try {
      const vitalsData: VitalsResponse = await (await fetch(apiUrl(`/api/ems/trips/${myTrip.trip_id}/vitals`))).json();
      const allVitals = vitalsData.success ? vitalsData.vitals : [];
      const systemPrompt = "You are a paramedic assistant AI. Generate a concise SBAR handover report.";
      const userQuery = `Generate SBAR for Patient: ${myTrip.patient_firstName}. Vitals: ${JSON.stringify(allVitals)}. Notes: ${myTrip.notes}`;
      const aiRes = await fetch(apiUrl('/api/ai/ask'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }] }) });
      setHandoverReport((await aiRes.json()).reply || "Failed to generate.");
    } catch (e) { setHandoverReport("Error generating report."); } finally { setIsGeneratingReport(false); }
  };

  // --- Effects ---
  useEffect(() => { if (user?.id && user.role === 'ROLE_PARAMEDIC') fetchMyShift(); }, [user]);
  useEffect(() => { if (activeShift) fetchMyTrip(); }, [activeShift]);
  useEffect(() => {
    if (activeShift && myTrip && ['Assigned', 'En_Route_To_Scene', 'Transporting'].includes(myTrip.status)) startTracking(sendLocationUpdate);
    else stopTracking();
    return () => stopTracking();
  }, [myTrip?.status, activeShift]);

  // --- RENDER ---
  if (loadingShift) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Shift Data...</div>;

  if (!activeShift) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-900/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-600/20 rounded-full border border-blue-500/50">
            <Ambulance size={48} className="text-blue-400" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center mb-2">EMS Command</h2>
        <p className="text-gray-400 text-center mb-8">Select your vehicle to begin shift.</p>

        <div className="space-y-4">
          <select
            className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedAmbulanceId} onChange={(e) => setSelectedAmbulanceId(e.target.value)}
          >
            <option value="">-- Select Ambulance --</option>
            {availableAmbulances.map(amb => <option key={amb.ambulance_id} value={amb.ambulance_id}>{amb.vehicle_name}</option>)}
          </select>
          <button onClick={handleClockIn} disabled={isClockingIn || !selectedAmbulanceId} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
            {isClockingIn ? <Sparkles className="animate-spin" /> : <Clock />} {isClockingIn ? 'Initializing...' : 'Start Shift'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (view === 'history') return <TripHistoryView trips={tripHistory} onBack={() => setView('dashboard')} isLoading={loadingHistory} error={errorHistory} />;

  const paramedicLocation = position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
  const sceneLocation = myTrip ? { latitude: myTrip.scene_location_lat, longitude: myTrip.scene_location_lon } : null;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans flex flex-col">
      {showHandoverModal && <HandoverReportModal report={handoverReport} isLoading={isGeneratingReport} onClose={() => setShowHandoverModal(false)} />}

      {/* Header */}
      <header className="flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter">EMS<span className="text-blue-500">HERO</span></h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-1"><Ambulance size={12} /> {activeShift.vehicle_name}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="text-green-400">Shift Active</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleViewHistory} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><History size={20} /></button>
          <button onClick={handleClockOut} className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors"><XCircle size={20} /></button>
        </div>
      </header>

      {myTrip ? (
        <div className="flex-1 flex flex-col gap-4">
          {/* Map Preview */}
          <div className="h-64 rounded-3xl overflow-hidden glass-card border border-white/10 relative shadow-inner">
            <ParamedicMapView paramedicLocation={paramedicLocation} sceneLocation={sceneLocation} />
            <div className="absolute top-4 left-4 glass-panel px-3 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg z-[400]">
              Mission #{myTrip.trip_id}
            </div>
          </div>

          {/* Mission Control */}
          <div className="flex-1 glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {myTrip.patient_firstName} {myTrip.patient_lastName}
                  </h2>
                  <p className="text-blue-400 font-medium mt-1">{myTrip.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  {myTrip.patient_dateOfBirth && <p className="text-sm text-gray-500">DOB: {new Date(myTrip.patient_dateOfBirth).toLocaleDateString()}</p>}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-black/20 gap-2 overflow-x-auto">
              {['status', 'vitals', 'handover', 'nav'].map(tab => (
                <button
                  key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {activeTab === 'status' && (
                <div className="grid grid-cols-2 gap-4 h-full content-start">
                  {[
                    { id: 'At_Scene', label: 'At Scene', icon: MapPin, color: 'bg-blue-500' },
                    { id: 'Transporting', label: 'Transport', icon: Navigation, color: 'bg-yellow-500' },
                    { id: 'At_Hospital', label: 'Arrived', icon: Building, color: 'bg-green-500' },
                    { id: 'Completed', label: 'Complete', icon: Flag, color: 'bg-gray-600' }
                  ].map(item => (
                    <button key={item.id} onClick={() => handleUpdateStatus(item.id)} disabled={myTrip.status === item.id || updatingStatus}
                      className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${item.id === myTrip.status ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''} ${item.color}`}
                    >
                      <item.icon size={32} className="mb-2" />
                      <span className="font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-6">
                  {/* Voice Control Banner */}
                  <motion.div
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${isListening ? 'bg-red-500/20 border-red-500/50' : 'bg-blue-500/10 border-blue-500/30'}`}
                    onClick={isListening ? stopListening : startListening}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`}>
                        {isListening ? <MicOff /> : <Mic />}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{isListening ? 'Listening...' : 'Voice Record'}</p>
                        <p className="text-xs text-gray-400">{isListening ? 'Speak vitals (e.g. "HR 80")' : 'Tap to start recording'}</p>
                      </div>
                    </div>
                    {isListening && <div className="flex gap-1 h-6 items-end">
                      {[1, 2, 3, 4, 5].map(i => <motion.div key={i} animate={{ height: [5, 20, 5] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-1 bg-red-400 rounded-full" />)}
                    </div>}
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <label className="text-gray-400 text-xs uppercase font-bold mb-2 block">Heart Rate</label>
                      <div className="flex items-center gap-2">
                        <Heart className="text-red-500 animate-pulse" />
                        <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="bg-transparent text-3xl font-black w-full focus:outline-none" placeholder="--" />
                        <span className="text-gray-500 text-sm">BPM</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <label className="text-gray-400 text-xs uppercase font-bold mb-2 block">Blood Pressure</label>
                      <div className="flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        <div className="flex items-baseline gap-1">
                          <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className="bg-transparent text-3xl font-black w-16 focus:outline-none text-right" placeholder="120" />
                          <span className="text-gray-400 text-xl">/</span>
                          <input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className="bg-transparent text-3xl font-black w-16 focus:outline-none" placeholder="80" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <label className="text-gray-400 text-xs uppercase font-bold mb-2 block">Field Notes (Voice Transcript)</label>
                    <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none resize-none" placeholder="Speak to add notes automatically..."></textarea>
                  </div>

                  <button onClick={handleSubmitVitals} disabled={submittingVitals} className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle /> {submittingVitals ? 'Syncing...' : 'Log Vitals'}
                  </button>
                </div>
              )}

              {activeTab === 'handover' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="p-6 bg-purple-500/20 rounded-full border border-purple-500/50">
                    <Sparkles size={48} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Handover Generator</h3>
                    <p className="text-gray-400 mt-2 max-w-xs mx-auto">Instantly generate a professional SBAR report for the ER team using collected vitals.</p>
                  </div>
                  <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-900/50 transition-all hover:scale-105 active:scale-95">
                    {isGeneratingReport ? 'Generating Report...' : 'Generate SBAR Report'}
                  </button>
                </div>
              )}

              {activeTab === 'nav' && (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="p-6 bg-yellow-500/20 rounded-full border border-yellow-500/50 mb-4">
                    <Navigation size={48} className="text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold">Navigation Assistant</h3>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${paramedicLocation?.latitude},${paramedicLocation?.longitude}&destination=${sceneLocation?.latitude},${sceneLocation?.longitude}&travelmode=driving`, '_blank')}
                    disabled={!paramedicLocation || !sceneLocation}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <MapPin /> Open Google Maps
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-3xl border border-white/10 p-8 text-center bg-gradient-to-b from-transparent to-blue-900/10">
          <div className="p-8 bg-black/40 rounded-full mb-6 relative">
            <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <RadioTower size={48} className="text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold">Standby Mode</h2>
          <p className="text-gray-400 mt-2">Monitoring dispatcher frequency...</p>
        </div>
      )}
    </div>
  );
};
export default ParamedicMode;
