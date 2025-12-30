import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiUrl from '@/config/api';

interface EmergencyAlert {
  trip_id: string;
  patient_name?: string;
  eta_minutes?: number;
  ai_notes?: string;
  recommended_specialist?: string;
  alert_timestamp: string;
  scene_location_lat?: number;
  scene_location_lon?: number;
  notes?: string;
}

export default function EmergencyAlertWidget() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(apiUrl('/api/ems/live-alerts'));
        const data = await response.json();

        if (data.success && Array.isArray(data.alerts) && data.alerts.length > 0) {
          // Get the most recent alert
          const latestAlert = data.alerts[0];

          // Check if this specific alert ID has been dismissed
          const dismissedAlerts = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');

          if (!dismissedAlerts.includes(latestAlert.trip_id)) {
            // Only update if it's a new alert or different from current
            setAlert(prev => {
              if (prev?.trip_id !== latestAlert.trip_id) {
                setIsDismissed(false); // Reset dismissal only for NEW alerts
                return latestAlert;
              }
              return prev;
            });
          }
        } else {
          // Empty array means no alerts
          setAlert(null);
        }
      } catch (error) {
        console.error('Failed to fetch live alerts:', error);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll every 2 seconds
    const interval = setInterval(fetchAlerts, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (alert?.trip_id) {
      setIsDismissed(true);
      const dismissedAlerts = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');
      if (!dismissedAlerts.includes(alert.trip_id)) {
        dismissedAlerts.push(alert.trip_id);
        localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts));
      }
    }
  };

  const handleViewDetails = () => {
    if (alert?.trip_id) {
      // Navigate to fleet management dashboard with trip ID
      // Using React Router navigate to maintain session (no full page reload)
      try {
        navigate(`/fleet-management?trip=${alert.trip_id}`, {
          replace: false,
          state: { fromAlert: true, tripId: alert.trip_id }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback: open in new tab if navigation fails
        window.open(`/fleet-management?trip=${alert.trip_id}`, '_blank');
      }
    }
  };

  // Don't render anything if no alert or dismissed
  if (!alert || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="w-full z-40 px-4 pt-4 pb-2 mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-2xl shadow-2xl border-4 border-red-400 overflow-hidden relative">
            {/* Pulsing border effect */}
            <div className="absolute inset-0 border-4 border-red-500 rounded-2xl animate-pulse opacity-75"></div>

            <div className="relative p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 bg-red-600/50 rounded-full">
                    <AlertTriangle size={28} className="text-white animate-pulse" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider whitespace-nowrap">
                    CRITICAL TRAUMA ALERT
                  </h2>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-red-800/80 rounded-full transition-colors flex-shrink-0"
                  aria-label="Dismiss alert"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Alert Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Patient Name */}
                {alert.patient_name && (
                  <div className="flex items-center gap-3 bg-red-800/40 p-3 rounded-lg">
                    <User size={20} className="flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-red-200 uppercase">Patient</span>
                      <p className="font-bold text-lg">{alert.patient_name}</p>
                    </div>
                  </div>
                )}

                {/* ETA */}
                {alert.eta_minutes && (
                  <div className="flex items-center gap-3 bg-red-800/40 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-600/50 rounded-full flex items-center justify-center">
                      <span className="text-lg font-black">{alert.eta_minutes}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-red-200 uppercase">ETA</span>
                      <p className="font-bold text-lg">Minutes</p>
                    </div>
                  </div>
                )}

                {/* Injury Prediction - Full Width */}
                {alert.ai_notes && (
                  <div className="md:col-span-2 bg-red-900/50 p-4 rounded-lg border border-red-600/30">
                    <span className="text-xs font-semibold text-red-200 uppercase block mb-1">Injury Prediction</span>
                    <p className="text-base md:text-lg leading-relaxed">{alert.ai_notes}</p>
                  </div>
                )}

                {/* Specialist Paged */}
                {alert.recommended_specialist && (
                  <div className="md:col-span-2 flex items-center gap-3 bg-red-800/40 p-3 rounded-lg">
                    <span className="text-xs font-semibold text-red-200 uppercase whitespace-nowrap">Specialist Paged:</span>
                    <span className="text-base md:text-lg font-bold bg-white/20 px-3 py-1 rounded-md">
                      {alert.recommended_specialist}
                    </span>
                  </div>
                )}

                {/* Additional Notes */}
                {alert.notes && (
                  <div className="md:col-span-2 mt-2 p-3 bg-red-900/30 rounded-lg border border-red-700/30">
                    <span className="text-xs font-semibold text-red-200 uppercase block mb-1">Notes</span>
                    <p className="text-sm text-red-100">{alert.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-red-600/30">
                <button
                  onClick={handleViewDetails}
                  className="flex-1 bg-white text-red-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>View Patient Details</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleDismiss}
                  className="sm:w-auto px-6 py-3 bg-red-800/80 text-white font-bold rounded-xl hover:bg-red-900 active:scale-95 transition-all border border-red-600/50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

