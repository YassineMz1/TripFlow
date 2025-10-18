"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Car,
  PersonStanding,
  Bike,
  Loader2,
  Share2,
  Download,
  Zap,
} from "lucide-react";
import MapView from "@/components/MapView";
import { itineraryApi } from "@/lib/itinerary-api";
import type { Itinerary } from "@/types/itinerary";

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadItinerary();
    }
  }, [id]);

  const loadItinerary = async () => {
    try {
      setIsLoading(true);
      const data = await itineraryApi.getById(id);
      setItinerary(data);

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this itinerary?")) return;

    try {
      await itineraryApi.delete(id);
      router.push("/itineraries");
    } catch (err: any) {
      alert(err.message || "Failed to delete itinerary");
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await itineraryApi.duplicate(id);
      router.push(`/itineraries/${duplicated._id}`);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate itinerary");
    }
  };

  const handleOptimize = async () => {
    try {
      const optimized = await itineraryApi.optimizeRoute(id);
      setItinerary(optimized);
      // Recalculate route
      if (optimized.origin && optimized.destination) {
        const waypointCoords = optimized.waypoints.map((wp) => wp.location.coordinates);
        const routeData = await itineraryApi.calculateRoute(
          optimized.origin.coordinates,
          optimized.destination.coordinates,
          waypointCoords,
          optimized.transportMode
        );
        setRoute(routeData.geometry);
      }
    } catch (err: any) {
      alert(err.message || "Failed to optimize route");
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "driving":
        return <Car className="w-5 h-5" />;
      case "walking":
        return <PersonStanding className="w-5 h-5" />;
      case "cycling":
        return <Bike className="w-5 h-5" />;
      default:
        return <Navigation className="w-5 h-5" />;
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "N/A";
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Itinerary not found"}</p>
          <Link href="/itineraries" className="text-blue-600 hover:underline">
            Back to Itineraries
          </Link>
        </div>
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
                href="/itineraries"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
                  {new Date(itinerary.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOptimize}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Optimize Route"
              >
                <Zap className="w-4 h-4" />
                Optimize
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <Link
                href={`/itineraries/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>

              {itinerary.description && (
                <p className="text-gray-600">{itinerary.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  {getTransportIcon(itinerary.transportMode)}
                  <span className="capitalize">{itinerary.transportMode}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  <span>{formatDistance(itinerary.totalDistance)}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span>{formatDuration(itinerary.estimatedDuration)}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {Math.ceil(
                      (new Date(itinerary.endDate).getTime() -
                        new Date(itinerary.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
              </div>

              {itinerary.tags && itinerary.tags.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {itinerary.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Route Points */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Route</h2>

              <div className="space-y-3">
                {/* Origin */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500 text-white p-2 rounded-full">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Origin</div>
                    <div className="text-sm text-gray-600">
                      {itinerary.origin.coordinates[1].toFixed(4)},{" "}
                      {itinerary.origin.coordinates[0].toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Waypoints */}
                {itinerary.waypoints.map((waypoint, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-semibold">
                      {waypoint.order + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{waypoint.name}</div>
                      {waypoint.notes && (
                        <div className="text-sm text-gray-600 mt-1">{waypoint.notes}</div>
                      )}
                      {waypoint.duration && (
                        <div className="text-xs text-gray-500 mt-1">
                          Stop duration: {formatDuration(waypoint.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Destination */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-red-500 text-white p-2 rounded-full">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Destination</div>
                    <div className="text-sm text-gray-600">
                      {itinerary.destination.coordinates[1].toFixed(4)},{" "}
                      {itinerary.destination.coordinates[0].toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Map View</h2>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <MapView
                origin={itinerary.origin}
                destination={itinerary.destination}
                waypoints={itinerary.waypoints}
                route={route}
                height="700px"
                interactive={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
