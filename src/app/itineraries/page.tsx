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

  const handleViewInNew = (itinerary: Itinerary) => {
    try {
      // Build a compact, predictable prefill object to avoid shape mismatches
      const compactPrefill: any = {
        title: itinerary.title,
        description: itinerary.description,
        startDate: (itinerary as any).startDate || (itinerary as any).start || undefined,
        endDate: (itinerary as any).endDate || (itinerary as any).end || undefined,
        origin: (itinerary as any).origin || (itinerary as any).startLocation || undefined,
        destination: (itinerary as any).destination || (itinerary as any).endLocation || undefined,
        waypoints: (itinerary as any).waypoints || (itinerary as any).stops || undefined,
        // route may be stored under different keys depending on backend
        route: (itinerary as any).route || (itinerary as any).geometry || (itinerary as any).polyline || undefined,
        transportMode: itinerary.transportMode,
        isPublic: itinerary.isPublic,
        tags: itinerary.tags,
      };

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('prefillItinerary', JSON.stringify(compactPrefill));
        // Helpful debug log so you can copy-paste the exact stored value from browser console
        // (will appear in the console where the user clicked View)
        // eslint-disable-next-line no-console
        console.log('prefillItinerary stored:', compactPrefill);
      }
      router.push('/itineraries/new');
    } catch (e) {
      console.error('Failed to navigate with prefill:', e);
      router.push('/itineraries/new');
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
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ 
        background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-extrabold">My Itineraries</h1>
              </div>
              <p className="text-white/90 text-lg">Plan and manage your travel routes</p>
            </div>
            <Link
              href="/itineraries/new"
              className="flex items-center gap-2 bg-white text-[#29D1FF] px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all hover:scale-105 shadow-2xl"
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
          <div className="rounded-2xl px-6 py-4 mb-6 backdrop-blur-sm" style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1.5px solid rgba(239, 68, 68, 0.3)", 
            color: "#dc2626" 
          }}>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {itineraries.length === 0 ? (
          <div className="rounded-3xl shadow-xl p-16 text-center backdrop-blur-sm" style={{ 
            background: "rgba(var(--surface-rgb), 0.6)",
            border: "1px solid var(--border)"
          }}>
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: "linear-gradient(135deg, rgba(41, 209, 255, 0.1), rgba(46, 167, 217, 0.1))",
                border: "2px solid rgba(41, 209, 255, 0.2)"
              }}
            >
              <MapPin className="w-12 h-12" style={{ color: "#29D1FF" }} />
            </div>
            <h3 className="text-2xl font-extrabold mb-3" style={{ color: "var(--foreground)" }}>No itineraries yet</h3>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "var(--muted-foreground)" }}>
              Create your first itinerary to start planning your perfect trip
            </p>
            <Link
              href="/itineraries/new"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                boxShadow: "0 10px 30px rgba(41, 209, 255, 0.3)"
              }}
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
                className="group rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden hover:scale-[1.02]"
                style={{ background: "var(--surface)" }}
              >
                {/* Card Header with gradient */}
                <div 
                  className="relative p-6 text-white overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #29D1FF, #2EA7D9)" }}
                >
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}
                  />
                  
                  <div className="relative flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold line-clamp-2 flex-1">{itinerary.title}</h3>
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center ml-2">
                      {getTransportIcon(itinerary.transportMode)}
                    </div>
                  </div>
                  <p className="relative text-white/90 text-sm line-clamp-2">
                    {itinerary.description || "No description"}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#29D1FF]/10 to-[#2EA7D9]/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4" style={{ color: "#29D1FF" }} />
                    </div>
                    <span>
                      {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
                      {new Date(itinerary.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Distance & Duration */}
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#29D1FF]/10 to-[#2EA7D9]/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4" style={{ color: "#29D1FF" }} />
                      </div>
                      <span>{formatDistance(itinerary.totalDistance)}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#29D1FF]/10 to-[#2EA7D9]/10 flex items-center justify-center">
                        <Clock className="w-4 h-4" style={{ color: "#29D1FF" }} />
                      </div>
                      <span>{formatDuration(itinerary.estimatedDuration)}</span>
                    </div>
                  </div>

                  {/* Waypoints Count */}
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#29D1FF]/10 to-[#2EA7D9]/10 flex items-center justify-center">
                      <Navigation className="w-4 h-4" style={{ color: "#29D1FF" }} />
                    </div>
                    <span>
                      {itinerary.waypoints.length} waypoint{itinerary.waypoints.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Tags */}
                  {itinerary.tags && itinerary.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {itinerary.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs font-semibold rounded-full"
                          style={{ 
                            background: "linear-gradient(135deg, rgba(41, 209, 255, 0.1), rgba(46, 167, 217, 0.1))",
                            color: "#29D1FF",
                            border: "1px solid rgba(41, 209, 255, 0.2)"
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
                  <button
                    onClick={() => handleViewInNew(itinerary)}
                    className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #29D1FF, #2EA7D9)",
                      boxShadow: "0 4px 12px rgba(41, 209, 255, 0.3)"
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDuplicate(itinerary._id)}
                    className="p-3 rounded-xl transition-all hover:scale-110"
                    style={{ 
                      border: "1.5px solid var(--border)", 
                      background: "rgba(var(--surface-rgb), 0.5)",
                      backdropFilter: "blur(10px)"
                    }}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  </button>
                  <button
                    onClick={() => handleDelete(itinerary._id)}
                    className="p-3 rounded-xl transition-all hover:scale-110"
                    style={{
                      border: "1.5px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)"
                    }}
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
