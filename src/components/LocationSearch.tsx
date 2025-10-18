"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface LocationResult {
  id: string;
  name: string;
  coordinates: [number, number];
}

interface LocationSearchProps {
  onSelect: (location: { name: string; coordinates: [number, number] }) => void;
  placeholder?: string;
  value?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || "";

export default function LocationSearch({
  onSelect,
  placeholder = "Search for a location...",
  value = "",
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search locations using Mapbox Geocoding API
  // Search locations using OpenRouteService Geocoding API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim() || !ORS_API_KEY) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(searchQuery)}&size=5`
      );
      const data = await response.json();
      // Map results to LocationResult format
      const mappedResults = (data.features || []).map((feature: any) => ({
        id: feature.properties.id || feature.properties.place_id || feature.properties.name || feature.properties.label,
        name: feature.properties.label || feature.properties.name,
        coordinates: feature.geometry.coordinates,
      }));
      setResults(mappedResults);
      setIsOpen(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  const handleSelect = (result: LocationResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onSelect({
      name: result.name,
      coordinates: result.coordinates,
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{result.name}</span>
            </button>
          ))}
        </div>
      )}

      {!ORS_API_KEY && (
        <p className="mt-2 text-xs text-red-500">
          OpenRouteService API key required for location search
        </p>
      )}
    </div>
  );
}
