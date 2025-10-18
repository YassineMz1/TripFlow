"use client";

import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  PersonStanding,
  Bike,
  Navigation,
  Eye,
  Copy,
  Trash2,
} from "lucide-react";
import type { Itinerary } from "@/types/itinerary";

interface ItineraryCardProps {
  itinerary: Itinerary;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ItineraryCard({
  itinerary,
  onDuplicate,
  onDelete,
}: ItineraryCardProps) {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
            {new Date(itinerary.endDate).toLocaleDateString()}
          </span>
        </div>

        {/* Distance & Duration */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{formatDistance(itinerary.totalDistance)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(itinerary.estimatedDuration)}</span>
          </div>
        </div>

        {/* Waypoints Count */}
        <div className="text-sm text-gray-600">
          {itinerary.waypoints.length} waypoint{itinerary.waypoints.length !== 1 ? "s" : ""}
        </div>

        {/* Tags */}
        {itinerary.tags && itinerary.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {itinerary.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
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
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(itinerary._id)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(itinerary._id)}
            className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
