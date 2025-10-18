export interface Location {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  name?: string;
  address?: string;
}

export interface Waypoint {
  name: string;
  location: Location;
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
  notes?: string;
  order: number;
}

export interface Itinerary {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  origin: Location;
  destination: Location;
  waypoints: Waypoint[];
  totalDistance?: number;
  estimatedDuration?: number;
  transportMode: "driving" | "walking" | "cycling";
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TransportMode = "driving" | "walking" | "cycling";

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}
