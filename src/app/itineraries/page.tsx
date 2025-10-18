"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  Edit,
  Copy,
  Eye,
  Navigation,
  Car,
  PersonStanding,
  Bike,
  Loader2,
} from "lucide-react";
import { itineraryApi } from "@/lib/itinerary-api";
import type { Itinerary } from "@/types/itinerary";

export default function ItinerariesPage() {
  // Prevent scroll restoration from jumping to top
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      setIsLoading(true);
      const data = await itineraryApi.getAll();
      setItineraries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load itineraries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this itinerary?")) return;

    try {
      await itineraryApi.delete(id);
      setItineraries(itineraries.filter((it) => it._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete itinerary");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await itineraryApi.duplicate(id);
      setItineraries([duplicated, ...itineraries]);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate itinerary");
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "driving":
        return <Car className="w-4 h-4" />;
      case "walking":
        return <PersonStanding className="w-4 h-4" />;
      case "cycling":
        return <Bike className="w-4 h-4" />;
      default:
        return <Navigation className="w-4 h-4" />;
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>My Itineraries</h1>
              <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>Plan and manage your travel routes</p>
            </div>
            <Link
              href="/itineraries/new"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Itinerary
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="border px-4 py-3 rounded-xl mb-6" style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            borderColor: "rgba(239, 68, 68, 0.3)", 
            color: "#dc2626" 
          }}>
            {error}
          </div>
        )}

        {itineraries.length === 0 ? (
          <div className="rounded-2xl shadow-sm p-12 text-center" style={{ background: "var(--surface)" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--muted-foreground)", opacity: 0.1 }}>
              <MapPin className="w-10 h-10" style={{ color: "var(--muted-foreground)" }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>No itineraries yet</h3>
            <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>Create your first itinerary to start planning your trip</p>
            <Link
              href="/itineraries/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Itinerary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary._id}
                className="rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                style={{ background: "var(--surface)" }}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold line-clamp-2">{itinerary.title}</h3>
                    {getTransportIcon(itinerary.transportMode)}
                  </div>
                  <p className="text-blue-100 text-sm line-clamp-2">
                    {itinerary.description || "No description"}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
                      {new Date(itinerary.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Distance & Duration */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <MapPin className="w-4 h-4" />
                      <span>{formatDistance(itinerary.totalDistance)}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(itinerary.estimatedDuration)}</span>
                    </div>
                  </div>

                  {/* Waypoints Count */}
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {itinerary.waypoints.length} waypoint{itinerary.waypoints.length !== 1 ? "s" : ""}
                  </div>

                  {/* Tags */}
                  {itinerary.tags && itinerary.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {itinerary.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            background: "var(--surface)", 
                            color: "var(--muted-foreground)",
                            border: "1px solid var(--border)"
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6 flex items-center gap-2">
                  <Link
                    href={`/itineraries/${itinerary._id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => handleDuplicate(itinerary._id)}
                    className="p-2 rounded-lg hover:opacity-80 transition-colors"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  </button>
                  <button
                    onClick={() => handleDelete(itinerary._id)}
                    className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
