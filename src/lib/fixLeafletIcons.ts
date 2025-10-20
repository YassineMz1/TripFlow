import L from "leaflet";
// Import the images from the leaflet package so Next.js can serve them
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x as unknown as string,
  iconUrl: markerIcon as unknown as string,
  shadowUrl: markerShadow as unknown as string,
});

// Ensure this module is imported on the client before any Leaflet maps render
// Example: import '@/lib/fixLeafletIcons' at top of your MapView.client.tsx
