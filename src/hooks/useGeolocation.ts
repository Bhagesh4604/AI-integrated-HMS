import { useState, useEffect, useRef } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface GeolocationHook {
  position: Position | null;
  error: string | null;
  startTracking: (callback: (pos: Position) => void) => Promise<void>;
  stopTracking: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const useGeolocation = (): GeolocationHook => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<string | number | null>(null);
  const intervalId = useRef<NodeJS.Timeout | null>(null); // For mock location interval
  const positionCallbackRef = useRef<(pos: Position) => void>();

  // Check for mock location query parameter
  const useMockLocation = new URLSearchParams(window.location.search).get('mock_location') === 'true';

  const requestPermissions = async (): Promise<boolean> => {
    if (useMockLocation) return true; // No permissions needed for mock location
    try {
      const permissionStatus = await Geolocation.requestPermissions();
      if (permissionStatus.location === 'granted' || permissionStatus.location === 'prompt') {
        return true;
      } else {
        setError('Geolocation permission denied.');
        return false;
      }
    } catch (err) {
      // Fallback for Web: "Not implemented on web" error is common. 
      // We return true to allow the browser's native prompt to trigger when we call watchPosition.
      console.warn('Geolocation.requestPermissions failed (likely web environment), proceeding with native API:', err);
      return true;
    }
  };

  const startTracking = async (callback: (pos: Position) => void) => {
    positionCallbackRef.current = callback;
    setError(null);

    if (useMockLocation) {
      // ... (Mock location logic remains expected, but I will strip it from this replace block to keep it clean if possible, OR I must include it if I replace the whole function. 
      // To be safe and minimal, I will include the whole function content as I am replacing many things).
      console.log("USING MOCK GEOLOCATION FOR DEVELOPMENT");
      const mockPosition: Position = {
        timestamp: Date.now(),
        coords: {
          latitude: 12.94336,
          longitude: 77.594624,
          accuracy: 1,
          altitudeAccuracy: 1,
          altitude: 0,
          speed: 10,
          heading: 0,
        },
      };
      setPosition(mockPosition);
      if (positionCallbackRef.current) {
        positionCallbackRef.current(mockPosition);
      }

      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = setInterval(() => {
        setPosition(prevPosition => {
          if (!prevPosition) return null;
          const newCoords = {
            ...prevPosition.coords,
            latitude: prevPosition.coords.latitude + 0.0005,
            longitude: prevPosition.coords.longitude + 0.0005,
          };
          const newPos = { ...prevPosition, timestamp: Date.now(), coords: newCoords };
          if (positionCallbackRef.current) {
            positionCallbackRef.current(newPos);
          }
          console.log("Mock location updated:", newPos.coords);
          return newPos;
        });
      }, 5000);
      return;
    }

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      if (watchId.current !== null) {
        if (typeof watchId.current === 'string') {
          await Geolocation.clearWatch({ id: watchId.current });
        } else {
          navigator.geolocation.clearWatch(watchId.current);
        }
      }

      // Try Capacitor first
      try {
        watchId.current = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          },
          (newPosition, err) => {
            if (err) {
              // Convert Capacitor error to string if needed, or handle
              throw err; // Re-throw to be caught by outer catch if immediate, but this is a callback. 
              // Actually, if clearWatch fails or watchPosition fails immediately it throws. 
              // If callback has error, we handle it here.
              const message = (err instanceof Error) ? err.message : String(err);
              setError('Error watching position: ' + message);
              return;
            }
            if (newPosition) {
              setPosition(newPosition);
              if (positionCallbackRef.current) {
                positionCallbackRef.current(newPosition);
              }
            }
          }
        );
      } catch (capError: any) {
        // If "Not implemented", use Native Web API
        if (capError.message && capError.message.includes('Not implemented')) {
          console.log("Switching to Navigator Geolocation...");
          if ('geolocation' in navigator) {
            watchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                const nativePos: Position = {
                  timestamp: pos.timestamp,
                  coords: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude,
                    altitudeAccuracy: pos.coords.altitudeAccuracy,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                  }
                };
                setPosition(nativePos);
                if (positionCallbackRef.current) positionCallbackRef.current(nativePos);
              },
              (err) => setError(err.message),
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
          } else {
            setError("Geolocation is not supported by this browser.");
          }
        } else {
          throw capError;
        }
      }

    } catch (err) {
      const message = (err instanceof Error) ? err.message : String(err);
      setError('Error starting geolocation watch: ' + message);
    }
  };

  const stopTracking = async () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
      console.log('Mock geolocation tracking stopped.');
    }
    if (watchId.current !== null) {
      try {
        if (typeof watchId.current === 'string') {
          await Geolocation.clearWatch({ id: watchId.current });
        } else {
          navigator.geolocation.clearWatch(watchId.current);
        }
        watchId.current = null;
        console.log('Geolocation tracking stopped.');
      } catch (err) {
        console.warn('Could not clear geolocation watch:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return { position, error, startTracking, stopTracking, requestPermissions };
};

export default useGeolocation;
