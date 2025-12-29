import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

// --- Custom Icons ---

// 3D-style Ambulance Pin
const ambulanceIconHtml = `
  <div class="relative w-12 h-12 group">
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-500/30 rounded-full blur-md animate-pulse"></div>
    <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-t from-blue-500 to-transparent opacity-50"></div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-auto h-auto transform transition-transform duration-300 group-hover:-translate-y-2">
       <div class="bg-blue-600 border-2 border-white/50 w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 opacity-80"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white w-6 h-6 relative z-10"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
       </div>
    </div>
  </div>
`;

const ambulanceIcon = new L.DivIcon({
  html: ambulanceIconHtml,
  className: 'bg-transparent',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

// Destination Icon
const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

interface AmbulanceLocation extends Location {
  timestamp: string;
  vehicle_name?: string;
}

interface MapViewProps {
  ambulanceLocations?: { [key: string]: AmbulanceLocation };
  destinations?: { [key: string]: Location };
}

import Routing from './Routing';

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ ambulanceLocations = {}, destinations = {} }) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 6;
  const [is3DMode, setIs3DMode] = useState(true);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gray-900 rounded-3xl transition-all duration-700 ${is3DMode ? 'perspective-[2000px]' : ''}`}>

      {/* Toggle 3D Button */}
      <button
        onClick={() => setIs3DMode(!is3DMode)}
        className="absolute top-4 right-4 z-[400] bg-black/50 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
      >
        {is3DMode ? 'Disable 3D View' : 'Enable 3D View'}
      </button>

      <div className={`h-[120%] w-[120%] -ml-[10%] -mt-[10%] transition-transform duration-700 ease-out ${is3DMode ? 'rotate-x-[45deg] scale-110' : ''}`}>
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full w-full bg-gray-200" zoomControl={false} scrollWheelZoom={true}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite View">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Render Ambulances */}
          {Object.entries(ambulanceLocations).map(([ambulanceId, location]) => {
            const destination = destinations[ambulanceId];
            return (
              <React.Fragment key={ambulanceId}>
                <Marker position={[location.lat, location.lng]} icon={ambulanceIcon}>
                  <Popup className="glass-popup">
                    <div className="text-gray-900 font-bold p-1">
                      <div className="text-sm uppercase text-blue-600">{location.vehicle_name || `UNIT-${ambulanceId}`}</div>
                      <div className="text-xs text-gray-500 mt-1">Live Update: {new Date(location.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </Popup>
                </Marker>

                {destination && (
                  <>
                    <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                      <Popup>
                        <strong>Destination</strong>
                      </Popup>
                    </Marker>
                    <Routing start={location} end={destination} />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Optional: subtle vignette for 3D depth, but less aggressive than dark mode */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]"></div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)]"></div>

    </div>
  );
};

export default MapView;
