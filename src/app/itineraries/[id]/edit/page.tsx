"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
} from "lucide-react";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";
import MapView from "@/components/MapView";
import { itineraryApi } from "@/lib/itinerary-api";
import type { Location, Waypoint, TransportMode, Itinerary } from "@/types/itinerary";

export default function EditItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  // Route calculation
  const [route, setRoute] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadItinerary();
    }
  }, [id]);

  const loadItinerary = async () => {
    try {
      setIsLoading(true);
      const data = await itineraryApi.getById(id);
      
      // Populate form
      setTitle(data.title);
      setDescription(data.description || "");
      setStartDate(data.startDate.split("T")[0]);
      setEndDate(data.endDate.split("T")[0]);
      setOrigin(data.origin);
      setDestination(data.destination);
      setWaypoints(data.waypoints);
      setTransportMode(data.transportMode);
      setIsPublic(data.isPublic);
      setTags(data.tags || []);

      // Calculate route
      if (data.origin && data.destination) {
        const waypointCoords = data.waypoints.map((wp) => wp.location.coordinates);
        const routeData = await itineraryApi.calculateRoute(
          data.origin.coordinates,
          data.destination.coordinates,
          waypointCoords,
          data.transportMode
        );
        setRoute(routeData.geometry);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load itinerary");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOriginSelect = (location: { name: string; coordinates: [number, number] }) => {
    setOrigin({
      type: "Point",
      coordinates: location.coordinates,
    });
  };

  const handleDestinationSelect = (location: { name: string; coordinates: [number, number] }) => {
    setDestination({
      type: "Point",
      coordinates: location.coordinates,
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
    const updated = waypoints.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((wp, i) => {
      wp.order = i;
    });
    setWaypoints(updated);
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

    setIsSaving(true);
    setError(null);

    try {
      await itineraryApi.update(id, {
        title,
        description,
        startDate,
        endDate,
        origin,
        destination,
        waypoints,
        transportMode,
        isPublic,
        tags,
      });

      router.push(`/itineraries/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update itinerary");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/itineraries/${id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Itinerary</h1>
                <p className="text-sm text-gray-600">Update your travel route</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Paris City Tour"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your itinerary..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transport Mode */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Transport Mode</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "driving", icon: Car, label: "Driving" },
                  { value: "walking", icon: PersonStanding, label: "Walking" },
                  { value: "cycling", icon: Bike, label: "Cycling" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTransportMode(value as TransportMode)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      transportMode === value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Route</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Origin *
                </label>
                <LocationSearch
                  onSelect={handleOriginSelect}
                  placeholder="Where are you starting from?"
                  value={origin ? `${origin.coordinates[1]}, ${origin.coordinates[0]}` : ""}
                />
              </div>

              {/* Waypoints */}
              {waypoints.map((waypoint, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Waypoint {index + 1}
                    </label>
                    <button
                      onClick={() => removeWaypoint(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <LocationSearch
                    onSelect={(loc) => updateWaypoint(index, loc)}
                    placeholder="Add a stop..."
                    value={waypoint.name}
                  />
                </div>
              ))}

              <button
                onClick={addWaypoint}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Waypoint
              </button>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination *
                </label>
                <LocationSearch
                  onSelect={handleDestinationSelect}
                  placeholder="Where are you going?"
                  value={destination ? `${destination.coordinates[1]}, ${destination.coordinates[0]}` : ""}
                />
              </div>

              {origin && destination && (
                <button
                  onClick={calculateRoute}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Recalculate Route
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Tags</h2>
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
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
                />
                <div>
                  <div className="font-semibold text-gray-900">Make this itinerary public</div>
                  <div className="text-sm text-gray-600">
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
