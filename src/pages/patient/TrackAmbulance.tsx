import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiUrl from '../../config/api';
import useWebSocket from '../../hooks/useWebSocket'; // Import the WebSocket hook
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, User, Clock, ArrowLeft, XCircle } from 'lucide-react';
import ParamedicMapView from '../../components/ems/ParamedicMapView'; // Reusing the map view

const TrackAmbulance = ({ user }) => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [eta, setEta] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);

  const handleWebSocketMessage = useCallback((message) => {
    const { type, payload } = message;

    if (payload.trip_id && payload.trip_id !== tripId) {
      // This update is not for the current trip
      return;
    }

    switch (type) {
      case 'TRIP_STATUS_UPDATE':
        setTrip(prevTrip => ({ ...prevTrip, ...payload.trip }));
        break;
      case 'AMBULANCE_LOCATION_UPDATE':
        if (trip && payload.ambulance_id === trip.assigned_ambulance_id) {
          setAmbulanceLocation({ latitude: payload.latitude, longitude: payload.longitude });
        }
        break;
      case 'TRIP_ETA_UPDATE':
        setEta(payload.eta_minutes);
        break;
      case 'TRIP_COMPLETED':
        // The trip is over, navigate away after a short delay
        setTimeout(() => navigate('/patient-dashboard'), 3000);
        break;
      default:
        break;
    }
  }, [tripId, trip]);

  useWebSocket(handleWebSocketMessage);

  const fetchTripStatus = async () => {
    if (!user || !user.id) return;
    try {
      const response = await fetch(apiUrl(`/api/ems/patient/my-trip-status?patientId=${user.id}`));
      const data = await response.json();
      if (data.success && data.trip) {
        setTrip(data.trip);
        setEta(data.trip.eta_minutes);
        if (data.trip.ambulance_latitude && data.trip.ambulance_longitude) {
          setAmbulanceLocation({
            latitude: data.trip.ambulance_latitude,
            longitude: data.trip.ambulance_longitude,
          });
        }
        if (!data.trip && !cancellationSuccess) {
          setError('Could not find an active trip. It may have been completed or cancelled.');
        }
      } else {
        if (!cancellationSuccess) {
          setError(data.message || 'Failed to fetch trip status.');
        }
      }
    } catch (err) {
      if (!cancellationSuccess) {
        setError('Failed to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!trip) return;
    setIsCancelling(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/ems/patient/cancel-trip'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: trip.trip_id }),
      });
      const data = await response.json();
      if (data.success) {
        setCancellationSuccess(true);
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Failed to cancel the trip.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchTripStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-2">Loading trip details...</p>
      </div>
    );
  }

  if (cancellationSuccess) {
    return (
      <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Booking Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Alert variant="success">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your ambulance booking has been successfully cancelled.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500">You will be redirected to your dashboard shortly.</p>
            <Button onClick={() => navigate('/patient-dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'New_Alert':
        return 'We have received your request and are assigning the nearest paramedic.';
      case 'Assigned':
        return 'A paramedic has been assigned and is on their way!';
      case 'En_Route_To_Scene':
        return 'Your paramedic is en route to your location.';
      case 'At_Scene':
        return 'The paramedic has arrived at the scene.';
      case 'Transporting':
        return 'You are being transported to the hospital.';
      default:
        return 'Your trip is in progress.';
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
      <div className="w-full rounded-lg overflow-hidden shadow-md mb-4 h-[50vh]">
        {ambulanceLocation ? (
          <ParamedicMapView paramedicLocation={ambulanceLocation} sceneLocation={null} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <p>Waiting for ambulance location...</p>
          </div>
        )}
      </div>
      <Card className="w-full max-w-full flex-shrink-0 flex-grow">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4"
            onClick={() => navigate('/patient-dashboard')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <CardTitle className="text-2xl font-bold text-center">Track Your Ambulance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trip ? (
            <>
              <Alert variant="success">
                <Clock className="h-4 w-4" />
                <AlertTitle className="font-semibold">{trip.status.replace('_', ' ')}</AlertTitle>
                <AlertDescription>
                  {getStatusMessage(trip.status)}
                </AlertDescription>
                <p className="font-bold mt-2">ETA: {eta ? `${eta} minutes` : 'Calculating...'}</p>
              </Alert>

              {trip.paramedic_firstName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Paramedic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>{trip.paramedic_firstName} {trip.paramedic_lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      <a href={`tel:${trip.paramedic_phone}`} className="text-blue-500 hover:underline">
                        {trip.paramedic_phone}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleCancelTrip}
                disabled={isCancelling}
                variant="destructive"
                className="w-full"
              >
                {isCancelling ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</>
                ) : (
                  <><XCircle className="mr-2 h-4 w-4" /> Cancel Booking</>
                )}
              </Button>
            </>
          ) : (
            <p className="text-center">No active trip found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackAmbulance;