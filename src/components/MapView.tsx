
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from "react-leaflet";
import { useMapEvent } from "react-leaflet";
import L from 'leaflet';
import "../lib/fixLeafletIcons";
import "leaflet/dist/leaflet.css";

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

  // helpers to create colored div icons
  const createCircleIcon = (bg: string, fg = '#fff', size = 36, inner = '') => {
    const html = `
      <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:${fg};font-weight:700;box-shadow:0 3px 8px rgba(0,0,0,0.25);">
        ${inner}
      </div>
    `;
    return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -size] });
  };

  const originIcon = createCircleIcon('#10b981', '#fff', 40, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>');
  const destinationIcon = createCircleIcon('#ef4444', '#fff', 40, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>');

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

  // helper to validate coordinate arrays
  const isValidCoord = (c: any): c is [number, number] => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number';

  // compute safe center: prefer origin, then destination, then default
  const center: [number, number] = (() => {
    if (origin && isValidCoord(origin.coordinates)) return [origin.coordinates[1], origin.coordinates[0]];
    if (destination && isValidCoord(destination.coordinates)) return [destination.coordinates[1], destination.coordinates[0]];
    // fallback to Paris
    return [48.8566, 2.3522];
  })();

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <MapContainer
        center={center}
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
            ...(origin && isValidCoord(origin.coordinates) ? [origin.coordinates] : []),
            ...(destination && isValidCoord(destination.coordinates) ? [destination.coordinates] : []),
            ...waypoints.map((wp) => wp.location && isValidCoord(wp.location.coordinates) ? wp.location.coordinates : null).filter(Boolean) as [number, number][],
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
        {origin && isValidCoord(origin.coordinates) && (
          <Marker position={[origin.coordinates[1], origin.coordinates[0]]} icon={originIcon}>
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
              Origin
            </Tooltip>
          </Marker>
        )}
        {/* Waypoint Markers */}
        {waypoints.map((waypoint, index) => (
          isValidCoord(waypoint.location?.coordinates) ? (
            <Marker
              key={index}
              position={[waypoint.location.coordinates[1], waypoint.location.coordinates[0]]}
              icon={createCircleIcon('#3b82f6', '#fff', 34, String(waypoint.order + 1))}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={1}>
                {waypoint.name}
              </Tooltip>
            </Marker>
          ) : null
        ))}
        {/* Destination Marker */}
        {destination && isValidCoord(destination.coordinates) && (
          <Marker position={[destination.coordinates[1], destination.coordinates[0]]} icon={destinationIcon}>
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
              Destination
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
