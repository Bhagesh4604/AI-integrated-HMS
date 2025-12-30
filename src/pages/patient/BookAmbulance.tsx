import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useGeolocation from '../../hooks/useGeolocation';
import apiUrl from '../../config/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MapPin, Edit, ArrowLeft, Camera, Upload } from 'lucide-react';
import ParamedicMapView from '../../components/ems/ParamedicMapView';

const BookAmbulance = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const { position, error: geoError, startTracking } = useGeolocation();
  const [notes, setNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, locating, manual, booking, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [tripId, setTripId] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [accidentImage, setAccidentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveTrip = async () => {
      if (!user || !user.id) return;
      try {
        const response = await fetch(apiUrl(`/api/ems/patient/my-trip-status?patientId=${user.id}`));
        const data = await response.json();
        if (data.success && data.trip) {
          navigate(`/patient/track-ambulance/${data.trip.trip_id}`);
        } else {
          fetchAvailableAmbulances();
        }
      } catch (error) {
        console.error("Error checking for active trip:", error);
        fetchAvailableAmbulances();
      }
    };
    checkActiveTrip();
  }, [user, navigate]);

  const fetchAvailableAmbulances = async () => {
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances/locations'));
      const data = await response.json();
      if (data.success) {
        setAvailableAmbulances(data.locations);
      }
    } catch (error) {
      console.error("Error fetching available ambulances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    setBookingStatus('locating');
    startTracking((pos) => console.log("Tracking", pos));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAccidentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookNow = async () => {
    let lat, lon;

    if (bookingStatus === 'locating' && position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } else if (bookingStatus === 'manual' && manualAddress) {
      setBookingStatus('booking');
      setErrorMessage('');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          lat = data[0].lat;
          lon = data[0].lon;
        } else {
          setBookingStatus('error');
          setErrorMessage('Could not find the specified address. Please try again.');
          return;
        }
      } catch (error) {
        setBookingStatus('error');
        setErrorMessage('Failed to geocode the address.');
        return;
      }
    } else {
      setErrorMessage('Please provide a location or address.');
      return;
    }

    setBookingStatus('booking');
    setErrorMessage('');
    try {
      // Use FormData for image upload
      const formData = new FormData();
      formData.append('patient_id', user.id);
      formData.append('latitude', lat.toString());
      formData.append('longitude', lon.toString());
      formData.append('notes', notes);
      if (accidentImage) {
        formData.append('accidentImage', accidentImage);
      }

      const response = await fetch(apiUrl('/api/ems/patient/book-ambulance'), {
        method: 'POST',
        body: formData, // No Content-Type header needed for FormData
      });
      const data = await response.json();
      if (data.success) {
        setBookingStatus('success');
        setTripId(data.trip_id);
        setTimeout(() => {
          navigate(`/patient/track-ambulance/${data.trip_id}`);
        }, 2000);
      } else {
        setBookingStatus('error');
        setErrorMessage(data.message || 'Failed to book ambulance.');
      }
    } catch (error) {
      setBookingStatus('error');
      setErrorMessage('Failed to connect to the server.');
    }
  };

  const renderContent = () => {
    switch (bookingStatus) {
      case 'idle':
        return (
          <div className="space-y-4">
            <Button onClick={handleGetLocation} className="w-full" size="lg">
              <MapPin className="mr-2 h-4 w-4" /> Use My Current Location
            </Button>
            <Button onClick={() => setBookingStatus('manual')} className="w-full" size="lg" variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Enter Address Manually
            </Button>
          </div>
        );
      case 'locating':
        if (geoError) {
          return (
            <Alert variant="destructive">
              <AlertTitle>Geolocation Error</AlertTitle>
              <AlertDescription>{geoError}</AlertDescription>
            </Alert>
          );
        }
        if (position) {
          return renderBookingForm('Your current location will be used.');
        }
        return (
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2">Getting your location...</p>
          </div>
        );
      case 'manual':
        return renderBookingForm('Please enter the address for pickup.');
      case 'booking':
        return (
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2">Finding the nearest ambulance...</p>
          </div>
        );
      case 'success':
        return (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
            <AlertTitle>Booking Successful!</AlertTitle>
            <AlertDescription>
              Help is on the way. Redirecting you to the tracking page...
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="destructive">
            <AlertTitle>Booking Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const renderBookingForm = (locationMessage: string) => (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Location</AlertTitle>
        <AlertDescription>{locationMessage}</AlertDescription>
      </Alert>
      {bookingStatus === 'manual' && (
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address
          </label>
          <Input
            id="address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="e.g., 123 Main St, Anytown, USA"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Accident Photo (Optional)
        </label>
        <div className="flex gap-4 items-start">
          <input
            type="file"
            accept="image/*"
            id="accident-photo"
            className="hidden"
            onChange={handleImageChange}
          />
          <label
            htmlFor="accident-photo"
            className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Camera className="w-8 h-8 text-gray-400 mb-1" />
            <span className="text-[10px] text-gray-500 font-bold uppercase">Upload</span>
          </label>

          {imagePreview && (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-green-500 shadow-md">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes for the Paramedic (Optional):
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Patient is on the 2nd floor, difficulty breathing."
        />
      </div>
      <Button onClick={handleBookNow} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" size="lg" disabled={bookingStatus === 'booking'}>
        <Upload className="mr-2 h-4 w-4" /> Book & Upload SOS
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 animate-pulse">Checking ambulance status...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      {/* GLOBAL ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-gray-50 to-cyan-50 dark:from-blue-900/10 dark:via-black dark:to-cyan-900/10 opacity-70 animate-gradient-xy"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl flex flex-col gap-6"
      >
        <div className="w-full h-[33vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          <ParamedicMapView ambulances={availableAmbulances} />
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl">
          <div className="p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-6 left-6 z-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
              onClick={() => navigate('/patient-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 inline-flex items-center gap-2">
                Call an Ambulance
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Emergency Service • 24/7 Availability</p>
            </div>

            <div className="max-w-xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookAmbulance;