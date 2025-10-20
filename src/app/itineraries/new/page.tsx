"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  MapPin,
  Navigation,
  Calendar,
  Car,
  PersonStanding,
  Bike,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
import { itineraryApi } from "@/lib/itinerary-api";
import { getToken, decodeJwt } from "@/lib/auth";
import type { Location, Waypoint, TransportMode } from "@/types/itinerary";

export default function NewItineraryPage() {
  // Prevent scroll restoration from jumping to top
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>("driving");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Prefill from sessionStorage if present (when user clicks View -> New)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = sessionStorage.getItem('prefillItinerary');
        if (!raw) return;
        const it = JSON.parse(raw);
        if (!it) return;

        // Debug log the incoming prefill so user can paste it if something doesn't match
        // eslint-disable-next-line no-console
        console.log('prefillItinerary parsed:', it);

        // Helper: robust location extractor
        const extractLocation = (obj: any) => {
          if (!obj) return null;
          // Case: already in form shape { type: 'Point', coordinates: [lng, lat], name?, address? }
          if (obj.type === 'Point' && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
            return { type: 'Point', coordinates: obj.coordinates, name: obj.name || obj.address || '' , address: obj.address || obj.name || '' };
          }
          // Case: nested under location: { location: { type: 'Point', coordinates: [...] }, name }
          if (obj.location && obj.location.type === 'Point' && Array.isArray(obj.location.coordinates)) {
            return { type: 'Point', coordinates: obj.location.coordinates, name: obj.name || obj.location.name || obj.address || '' , address: obj.location.address || obj.address || obj.name || '' };
          }
          // Case: origin.location.coordinates (legacy): { origin: { location: { coordinates: [lng,lat] } } }
          if (obj.coordinates && Array.isArray(obj.coordinates) && typeof obj.coordinates[0] === 'number') {
            return { type: 'Point', coordinates: obj.coordinates, name: obj.name || '', address: obj.address || '' };
          }
          // Case: lat/lng properties
          const lat = obj.lat ?? obj.latitude ?? obj.latit ?? null;
          const lng = obj.lng ?? obj.lon ?? obj.longitude ?? obj.long ?? null;
          if (typeof lat === 'number' && typeof lng === 'number') {
            return { type: 'Point', coordinates: [lng, lat], name: obj.name || '', address: obj.address || '' };
          }
          // Not found
          return null;
        };

        // Title/description/dates
        setTitle(it.title || it.name || '');
        setDescription(it.description || it.summary || '');
        setStartDate(it.startDate ? String(it.startDate).split('T')[0] : (it.start?.split ? String(it.start).split('T')[0] : ''));
        setEndDate(it.endDate ? String(it.endDate).split('T')[0] : (it.end?.split ? String(it.end).split('T')[0] : ''));

        // Origin/destination
        const o = extractLocation(it.origin || it.startLocation || it.from || it.start_point || it.origin_location);
        const d = extractLocation(it.destination || it.endLocation || it.to || it.end_point || it.destination_location);
        if (o) setOrigin(o as any);
        if (d) setDestination(d as any);

        // Waypoints normalization
        const wps: any[] = [];
        if (Array.isArray(it.waypoints) && it.waypoints.length > 0) {
          for (let i = 0; i < it.waypoints.length; i++) {
            const wp = it.waypoints[i];
            const loc = extractLocation(wp.location || wp || wp.point || wp.loc || wp.location?.coordinates ? wp.location : wp);
            if (loc) {
              wps.push({ name: wp.name || wp.title || `Waypoint ${i + 1}`, location: loc, order: typeof wp.order === 'number' ? wp.order : i });
            }
          }
        }
        // Some backends store stops under `stops` or `stages`
        if (wps.length === 0 && Array.isArray(it.stops)) {
          for (let i = 0; i < it.stops.length; i++) {
            const s = it.stops[i];
            const loc = extractLocation(s.location || s);
            if (loc) wps.push({ name: s.name || `Waypoint ${i + 1}`, location: loc, order: typeof s.order === 'number' ? s.order : i });
          }
        }
        if (wps.length > 0) setWaypoints(wps as any);

        // Transport mode / public / tags
        setTransportMode(it.transportMode || it.mode || 'driving');
        setIsPublic(Boolean(it.isPublic || it.public));
        setTags(Array.isArray(it.tags) ? it.tags : (Array.isArray(it.categories) ? it.categories : []));

        // remove after reading
        sessionStorage.removeItem('prefillItinerary');
      }
    } catch (e) {
      console.error('Failed to prefill itinerary:', e);
    }
  }, []);

  // Try to detect route geometry from a few common formats and set it for the MapView
  useEffect(() => {
    try {
      // If route already set or no origin/destination, skip
      if (route || (!origin && !destination)) return;

      // If the prefill object included a route in window (rare), try to read it
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = sessionStorage.getItem('prefillItineraryRoute');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
              setRoute(parsed);
              sessionStorage.removeItem('prefillItineraryRoute');
              return;
            }
          } catch {}
        }
      }

      // Otherwise, some backends put the route inside origin/destination objects or waypoints
      // If any of the objects contains a `geometry` or `route` property that is a LineString, use it
      const candidates: any[] = [];
      if (origin && (origin as any).geometry) candidates.push((origin as any).geometry);
      if (destination && (destination as any).geometry) candidates.push((destination as any).geometry);
      for (const wp of waypoints) {
        if ((wp as any).geometry) candidates.push((wp as any).geometry);
        if ((wp as any).route) candidates.push((wp as any).route);
      }

      // Also try to sniff at tags like polyline strings on window.__prefill (fallback)
      // decode polyline if found (Google/OSRM style)
      const tryDecodePolyline = (polyline: string) => {
        try {
          // Small polyline decoder (handles Google encoded polyline)
          const coords: number[][] = [];
          let index = 0, lat = 0, lng = 0;
          while (index < polyline.length) {
            let b, shift = 0, result = 0;
            do {
              b = polyline.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
              b = polyline.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            coords.push([lng / 1e5, lat / 1e5]);
          }
          return { type: 'LineString', coordinates: coords };
        } catch (e) {
          return null;
        }
      };

      for (const c of candidates) {
        if (!c) continue;
        if (c.type === 'LineString' && Array.isArray(c.coordinates)) {
          setRoute(c);
          return;
        }
        if (typeof c === 'string' && c.length > 20) {
          const decoded = tryDecodePolyline(c);
          if (decoded) {
            setRoute(decoded);
            return;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [origin, destination, waypoints]);

  // Route calculation
  const [route, setRoute] = useState<any>(null);

  const handleOriginSelect = (location: { name: string; coordinates: [number, number] }) => {
    setOrigin({
      type: "Point",
      coordinates: location.coordinates,
      name: location.name || "Origin",
      address: location.name || "Origin Address"
    });
  };

  const handleDestinationSelect = (location: { name: string; coordinates: [number, number] }) => {
    setDestination({
      type: "Point",
      coordinates: location.coordinates,
      name: location.name || "Destination",
      address: location.name || "Destination Address"
    });
  };

  const addWaypoint = () => {
    setWaypoints([
      ...waypoints,
      {
        name: `Waypoint ${waypoints.length + 1}`,
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
        order: waypoints.length,
      },
    ]);
  };

  const updateWaypoint = (
    index: number,
    location: { name: string; coordinates: [number, number] }
  ) => {
    const updated = [...waypoints];
    updated[index] = {
      ...updated[index],
      name: location.name,
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
    };
    setWaypoints(updated);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    try {
      const waypointCoords = waypoints.map((wp) => wp.location.coordinates);
      const routeData = await itineraryApi.calculateRoute(
        origin.coordinates,
        destination.coordinates,
        waypointCoords,
        transportMode
      );
      setRoute(routeData.geometry);
    } catch (err: any) {
      console.error("Failed to calculate route:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate || !endDate || !origin || !destination) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get userId from JWT if available
      let userId = undefined;
      const token = getToken && getToken();
      if (token) {
        const payload = decodeJwt(token);
        userId = payload?.userId || payload?.sub;
      }

      // Build payload only with defined fields
      const payload: any = {
        title,
        description,
        startDate,
        endDate,
        waypoints,
        transportMode,
        isPublic,
        tags,
        ...(userId ? { userId } : {}),
      };
      if (origin) payload.origin = origin;
      if (destination) payload.destination = destination;

  const itinerary = await itineraryApi.create(payload);
  // After creating, navigate to the itineraries list
  router.push(`/itineraries`);
    } catch (err: any) {
      // Log full error object for debugging
      console.error("Directions API error:", err);
      setError(err.message || JSON.stringify(err) || "Failed to create itinerary");
    } finally {
      setIsLoading(false);  
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/itineraries"
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>Create New Itinerary</h1>
              <p className="text-base" style={{ color: "var(--muted-foreground)" }}>Plan your travel route</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Itinerary
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="border px-4 py-3 rounded-2xl mb-6" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form Section */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Basic Info */}
            <div className="rounded-2xl shadow-lg p-6 space-y-4" style={{ background: "var(--surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Basic Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Paris City Tour"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your itinerary..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none bg-[var(--input-bg)] text-[var(--foreground)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="mb-4 flex flex-col items-start">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="min-w-[120px] max-w-[180px] px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
                    required
                  />
                </div>
                <div className="mb-4 flex flex-col items-start">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="min-w-[120px] max-w-[180px] px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transport Mode */}
            <div className="rounded-2xl shadow-lg p-6 space-y-4" style={{ background: "var(--surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Transport Mode</h2>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: "driving", icon: Car, label: "Driving" }, { value: "walking", icon: PersonStanding, label: "Walking" }, { value: "cycling", icon: Bike, label: "Cycling" }].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTransportMode(value as TransportMode)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-[var(--foreground)] ${
                      transportMode === value
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-gray-300 bg-[var(--surface)] hover:border-blue-400 hover:bg-[var(--hover)]"
                    }`}
                    style={{ minWidth: 0 }}
                  >
                    <Icon className={`w-6 h-6 ${transportMode === value ? "text-white" : "text-[var(--foreground)]"}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="rounded-2xl shadow-lg p-6 space-y-4" style={{ background: "var(--surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Route</h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Origin *
                </label>
                <LocationSearch
                  onSelect={handleOriginSelect}
                  placeholder="Where are you starting from?"
                />
              </div>

              {/* Waypoints */}
              {waypoints.map((waypoint, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      Waypoint {index + 1}
                    </label>
                    <button
                      onClick={() => removeWaypoint(index)}
                      className="p-1 text-red-600 hover:bg-red-500/10 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <LocationSearch
                    onSelect={(loc) => updateWaypoint(index, loc)}
                    placeholder="Add a stop..."
                  />
                </div>
              ))}

              <button
                onClick={addWaypoint}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl text-[var(--muted-foreground)] border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Waypoint
              </button>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination *
                </label>
                <LocationSearch
                  onSelect={handleDestinationSelect}
                  placeholder="Where are you going?"
                />
              </div>

              {origin && destination && (
                <button
                  onClick={calculateRoute}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Calculate Route
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-2xl shadow-lg p-6 space-y-4" style={{ background: "var(--surface)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Tags</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="rounded-2xl shadow-lg p-6" style={{ background: "var(--surface)" }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
                />
                <div>
                  <div className="font-semibold" style={{ color: "var(--foreground)" }}>Make this itinerary public</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Others can view and duplicate your itinerary
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Map Preview</h2>
              </div>
              <MapView
                origin={origin || undefined}
                destination={destination || undefined}
                waypoints={waypoints}
                route={route}
                height="600px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
