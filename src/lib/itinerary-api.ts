import { withApiBase } from "./env";

// Types pour les itinéraires
export interface Location {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
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

export interface CreateItineraryDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  origin: Location;
  destination: Location;
  waypoints?: Waypoint[];
  transportMode?: "driving" | "walking" | "cycling";
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateItineraryDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  origin?: Location;
  destination?: Location;
  waypoints?: Waypoint[];
  transportMode?: "driving" | "walking" | "cycling";
  isPublic?: boolean;
  tags?: string[];
}

export interface RouteResponse {
  distance: number;
  duration: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

// Helper pour les requêtes authentifiées
async function authenticatedRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("access_token");
  
  const res = await fetch(withApiBase(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Try to parse the error as JSON to get more details
    try {
      const errorData = JSON.parse(text);
      const errorMessage = errorData.message || errorData.error || text;
      throw new Error(errorMessage);
  } catch (err) {
    // Log full error response for debugging
    console.error('Directions API error:', {
      path,
      init,
      status: res?.status,
      response: text,
      error: err
    });
    throw new Error(text || `Request failed ${res?.status}`);
    }
  }

  return res.json();
}

// API pour les itinéraires
export const itineraryApi = {
  // Créer un nouvel itinéraire (auth or public)
  create: (data: CreateItineraryDto) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      return authenticatedRequest<Itinerary>("/itinerary", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } else {
      // Fallback: create public itinerary (must exist in backend)
      return authenticatedRequest<Itinerary>("/itinerary/public/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
  },

  // Récupérer tous les itinéraires de l'utilisateur ou publics si non authentifié
  getAll: () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      return authenticatedRequest<Itinerary[]>("/itinerary");
    } else {
      return authenticatedRequest<Itinerary[]>("/itinerary/public/all");
    }
  },

  // Récupérer un itinéraire par ID
  getById: (id: string) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}`),

  // Mettre à jour un itinéraire
  update: (id: string, data: UpdateItineraryDto) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Supprimer un itinéraire
  delete: (id: string) =>
    authenticatedRequest<{ message: string }>(`/itinerary/${id}`, {
      method: "DELETE",
    }),

  // Ajouter un waypoint
  addWaypoint: (id: string, waypoint: Omit<Waypoint, "order">) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/waypoints`, {
      method: "POST",
      body: JSON.stringify(waypoint),
    }),

  // Mettre à jour un waypoint
  updateWaypoint: (id: string, waypointIndex: number, waypoint: Partial<Waypoint>) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/waypoints/${waypointIndex}`, {
      method: "PATCH",
      body: JSON.stringify(waypoint),
    }),

  // Supprimer un waypoint
  deleteWaypoint: (id: string, waypointIndex: number) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/waypoints/${waypointIndex}`, {
      method: "DELETE",
    }),

  // Réorganiser les waypoints
  reorderWaypoints: (id: string, waypointIds: number[]) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/waypoints/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order: waypointIds }),
    }),

  // Calculer la route
  calculateRoute: (
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
    mode?: "driving" | "walking" | "cycling"
  ) => {
    // Validate coordinates
    const validateCoordinate = (coord: [number, number], name: string) => {
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(`${name} coordinates must be numbers`);
      }
      if (lat < -90 || lat > 90) {
        throw new Error(`${name} latitude must be between -90 and 90, got ${lat}`);
      }
      if (lng < -180 || lng > 180) {
        throw new Error(`${name} longitude must be between -180 and 180, got ${lng}`);
      }
    };

    validateCoordinate(origin, "Origin");
    validateCoordinate(destination, "Destination");
    
    if (waypoints) {
      waypoints.forEach((waypoint, index) => {
        validateCoordinate(waypoint, `Waypoint ${index + 1}`);
      });
    }

    return authenticatedRequest<RouteResponse>("/itinerary/calculate-route", {
      method: "POST",
      body: JSON.stringify({ origin, destination, waypoints, mode }),
    });
  },

  // Optimiser l'ordre des waypoints
  optimizeRoute: (id: string) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/optimize`, {
      method: "POST",
    }),

  // Rechercher des itinéraires publics
  searchPublic: (query: string, tags?: string[]) =>
    authenticatedRequest<Itinerary[]>(
      `/itinerary/search?q=${encodeURIComponent(query)}${tags ? `&tags=${tags.join(",")}` : ""}`
    ),

  // Dupliquer un itinéraire
  duplicate: (id: string) =>
    authenticatedRequest<Itinerary>(`/itinerary/${id}/duplicate`, {
      method: "POST",
    }),
};
