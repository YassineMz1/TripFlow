
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { useMapEvent } from "react-leaflet";
// @ts-ignore
import type { Map as LeafletMap } from "leaflet";

import "../lib/fixLeafletIcons";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";

function MapClickHandler({ onMapClick }: { onMapClick: (lng: number, lat: number) => void }) {
  useMapEvent("click", (event) => {
    const { lat, lng } = event.latlng;
    onMapClick(lng, lat);
  });
  return null;
}

interface Location {
  coordinates: [number, number];
}

interface Waypoint {
  name: string;
  location: Location;
  order: number;
}

interface MapViewProps {
  origin?: Location;
  destination?: Location;
  waypoints?: Waypoint[];
  route?: {
    type: "LineString";
    coordinates: [number, number][];
  };
  onMapClick?: (lng: number, lat: number) => void;
  height?: string;
}


export default function MapView({
  origin,
  destination,
  waypoints = [],
  route,
  onMapClick,
  height = "500px",
}: MapViewProps) {

  const mapRef = useRef(null);

  // Ajuster la vue pour inclure tous les points

  // Helper to fit bounds on map
  function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
      if (points.length > 0) {
        map.fitBounds(points.map(([lng, lat]) => [lat, lng]), { padding: [50, 50] });
      }
    }, [points, map]);
    return null;
  }

  const handleMapClick = (event: any) => {
    // Leaflet click event
    if (onMapClick) {
      const { lat, lng } = event.latlng;
      onMapClick(lng, lat);
    }
  };

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <MapContainer
        center={origin ? [origin.coordinates[1], origin.coordinates[0]] : [48.8566, 2.3522]}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
        whenReady={() => {}}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* Fit bounds to all points */}
        <FitBounds
          points={[
            ...(origin ? [origin.coordinates] : []),
            ...(destination ? [destination.coordinates] : []),
            ...waypoints.map((wp) => wp.location.coordinates),
          ]}
        />
        {/* Map click handler using useMapEvent */}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
    
        {/* Route Line */}
        {route && Array.isArray(route.coordinates) && route.coordinates.length > 0 && (
          <Polyline
            positions={route.coordinates.map(([lng, lat]) => [lat, lng])}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
          />
        )}
        {/* Origin Marker */}
        {origin && (
          <Marker position={[origin.coordinates[1], origin.coordinates[0]]}>
            <div className="relative">
              <div className="absolute -inset-2 bg-green-500 rounded-full opacity-25 animate-ping" />
              <div className="relative bg-green-500 text-white p-2 rounded-full shadow-lg">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
          </Marker>
        )}
        {/* Waypoint Markers */}
        {waypoints.map((waypoint, index) => (
          <Marker key={index} position={[waypoint.location.coordinates[1], waypoint.location.coordinates[0]]}>
            <div className="relative group">
              <div className="bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg font-semibold text-sm">
                {waypoint.order + 1}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {waypoint.name}
              </div>
            </div>
          </Marker>
        ))}
        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.coordinates[1], destination.coordinates[0]]}>
            <div className="relative">
              <div className="absolute -inset-2 bg-red-500 rounded-full opacity-25 animate-ping" />
              <div className="relative bg-red-500 text-white p-2 rounded-full shadow-lg">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
