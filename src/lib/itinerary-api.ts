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
  origin: Location | Waypoint;
  destination: Location | Waypoint;
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
    // Try to parse the error as JSON to get a structured message
    try {
      const errorData = JSON.parse(text);
      const errorMessage = errorData?.message || errorData?.error || text;
      // Log a compact, safe debug object (avoid circular/large init)
      const safeStringify = (obj: any) => {
        try {
          const seen = new Set();
          return JSON.stringify(obj, (k, v) => {
            if (typeof v === 'object' && v !== null) {
              if (seen.has(v)) return '[Circular]';
              seen.add(v);
            }
            if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
            return v;
          }, 2);
        } catch (_) {
          try { return String(obj); } catch { return '[unserializable]'; }
        }
      };

      console.error(`Directions API error: ${safeStringify({ path, status: res.status, responseSnippet: (text || '').slice(0,200), errorData })}`);
      throw new Error(errorMessage || `Request failed ${res.status}`);
    } catch (parseErr) {
      // If parsing failed, log a safe debug object with limited init info
      const safeInit: any = {
        method: init?.method,
      };
      if (typeof init?.body === 'string') {
        safeInit.bodySnippet = init.body.slice(0, 200);
        safeInit.bodyLength = init.body.length;
      }

      const safeStringify2 = (obj: any) => {
        try {
          const seen = new Set();
          return JSON.stringify(obj, (k, v) => {
            if (typeof v === 'object' && v !== null) {
              if (seen.has(v)) return '[Circular]';
              seen.add(v);
            }
            if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
            return v;
          }, 2);
        } catch (_) {
          try { return String(obj); } catch { return '[unserializable]'; }
        }
      };

      console.error(`Directions API error (non-JSON): ${safeStringify2({ path, status: res.status, responseSnippet: (text || '').slice(0,200), init: safeInit, parseError: (parseErr as any)?.message || String(parseErr) })}`);

      throw new Error(text || `Request failed ${res.status}`);
    }
  }

  return res.json();
}

// API pour les itinéraires
export const itineraryApi = {
  // Créer un nouvel itinéraire (auth or public)
  create: (data: CreateItineraryDto) => {
    const token = localStorage.getItem("access_token");

    // Backend expects Waypoint-like objects for origin/destination/waypoints
    const toBackendWaypoint = (item: Location | Waypoint, fallbackName = "") => {
      // If already looks like a Waypoint (has name and location object with lat/lng), normalize it
      const maybeWaypoint = item as Waypoint & { location?: any };

      let name = (maybeWaypoint && maybeWaypoint.name) || fallbackName || "";
      let address = (maybeWaypoint && (maybeWaypoint as any).address) || "";
      let placeId = (maybeWaypoint && (maybeWaypoint as any).placeId) || undefined;
      let stopDuration = (maybeWaypoint && (maybeWaypoint as any).stopDuration) || (maybeWaypoint && maybeWaypoint.duration) || undefined;
      let notes = (maybeWaypoint && maybeWaypoint.notes) || undefined;

      // location: can be GeoJSON Point { type: 'Point', coordinates: [lng, lat] }
      let location: { lat: number; lng: number } | undefined;
      if (maybeWaypoint && (maybeWaypoint as any).location) {
        const loc = (maybeWaypoint as any).location;
        if (Array.isArray(loc.coordinates)) {
          // GeoJSON
          location = { lat: loc.coordinates[1], lng: loc.coordinates[0] };
        } else if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          location = { lat: loc.lat, lng: loc.lng };
        }
      } else {
        // Input might be a raw Location (GeoJSON)
        const loc = item as Location;
        if (loc && Array.isArray((loc as any).coordinates)) {
          location = { lat: loc.coordinates[1], lng: loc.coordinates[0] };
        }
      }

      // Ensure at least a location exists; the backend may attempt geocoding if missing, but prefer to send coordinates when available
      return {
        name,
        address,
        location,
        placeId,
        stopDuration,
        notes,
      };
    };

    const payload: any = {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      transportMode: data.transportMode,
      isPublic: data.isPublic,
      tags: data.tags,
      origin: toBackendWaypoint(data.origin, 'Origin'),
      destination: toBackendWaypoint(data.destination, 'Destination'),
      waypoints: data.waypoints ? data.waypoints.map((w) => toBackendWaypoint(w, w.name || 'Waypoint')) : undefined,
    };

    // Debug: log whether token is present
    // eslint-disable-next-line no-console
    console.debug('itineraryApi.create — token present:', !!token, 'isPublic:', !!payload.isPublic);

    // If the client is not authenticated and tries to create a private itinerary, block it
    if (!token && !payload.isPublic) {
      throw new Error('Not authenticated: cannot create a private itinerary. Please log in to save private itineraries.');
    }

    if (token) {
      return authenticatedRequest<Itinerary>("/itinerary", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    // No token, but isPublic === true -> allow public create
    return authenticatedRequest<Itinerary>("/itinerary/public/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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
    // Backend controller exposes GET /itinerary/findone/:id
    authenticatedRequest<Itinerary>(`/itinerary/findone/${id}`),

  // Mettre à jour un itinéraire
  update: (id: string, data: UpdateItineraryDto) =>
    // Backend controller expects PUT /itinerary/update/:id
    authenticatedRequest<Itinerary>(`/itinerary/update/${id}`, {
      method: "PUT",
      // Transform update payload similarly to create: convert any Location Points to backend waypoint shape
      body: JSON.stringify((() => {
        const toBackendWaypoint = (item: any) => {
          if (!item) return item;
          if (item.location && typeof item.location.lat === 'number' && typeof item.location.lng === 'number') {
            return item;
          }
          if (item.location && Array.isArray(item.location.coordinates)) {
            return { ...item, location: { lat: item.location.coordinates[1], lng: item.location.coordinates[0] } };
          }
          if (item && Array.isArray(item.coordinates)) {
            return { name: item.name || '', address: '', location: { lat: item.coordinates[1], lng: item.coordinates[0] } };
          }
          return item;
        };

        const out: any = { ...data };
        if ((data as any).origin) out.origin = toBackendWaypoint((data as any).origin);
        if ((data as any).destination) out.destination = toBackendWaypoint((data as any).destination);
        if ((data as any).waypoints) out.waypoints = (data as any).waypoints.map((w: any) => toBackendWaypoint(w));
        return out;
      })()),
    }),

  // Supprimer un itinéraire
  delete: (id: string) =>
    // Backend controller exposes DELETE /itinerary/delete/:id
    authenticatedRequest<{ message: string }>(`/itinerary/delete/${id}`, {
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
