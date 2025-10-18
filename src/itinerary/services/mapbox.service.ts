import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MapboxService {
  private readonly logger = new Logger(MapboxService.name);
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mapbox.com';

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN');
    if (!this.accessToken) {
      this.logger.error('⚠️ MAPBOX_ACCESS_TOKEN not configured. Map features will not work.');
    } else {
      this.logger.log(`✅ Mapbox configured with token: ${this.accessToken.substring(0, 20)}...`);
    }
  }

  /**
   * Calcule un itinéraire entre origine et destination avec waypoints optionnels
   * Utilise Mapbox Directions API
   */
  async getDirections(params: {
    origin: string | { lat: number; lng: number } | number[];
    destination: string | { lat: number; lng: number } | number[];
    waypoints?: Array<string | { lat: number; lng: number } | number[]>;
    travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    optimizeWaypoints?: boolean;
    avoid?: string[];
  }) {
    if (!this.accessToken) {
      throw new BadRequestException('Mapbox access token not configured');
    }

    try {
      const { origin, destination, waypoints = [], travelMode = 'driving', optimizeWaypoints = false } = params;

      // Log des paramètres reçus
      this.logger.debug('Calculating route with params:', { origin, destination, waypoints, travelMode });

      // Convertir les coordonnées en format Mapbox (lng,lat)
      const originCoords = this.formatCoordinates(origin);
      const destCoords = this.formatCoordinates(destination);
      const waypointCoords = waypoints.map(wp => this.formatCoordinates(wp));

      // Construire la liste de coordonnées
      const coordinates = [originCoords, ...waypointCoords, destCoords].join(';');

      // Mapper le mode de transport
      const profile = this.mapTravelMode(travelMode);

      // URL de l'API Mapbox Directions
      const url = `${this.baseUrl}/directions/v5/mapbox/${profile}/${coordinates}`;

      this.logger.debug('Mapbox URL:', url);
      this.logger.debug('Access token present:', !!this.accessToken);

      if (!this.accessToken || this.accessToken.trim() === '') {
        throw new BadRequestException('Mapbox access token is not configured or is empty');
      }

      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          geometries: 'geojson',
          overview: 'full',
          steps: true,
          alternatives: false,
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        this.logger.error('No route found in Mapbox response:', response.data);
        throw new BadRequestException('No route found');
      }

      const route = response.data.routes[0];

      return {
        distance: {
          text: `${(route.distance / 1000).toFixed(2)} km`,
          value: route.distance, // en mètres
        },
        duration: {
          text: this.formatDuration(route.duration),
          value: route.duration, // en secondes
        },
        polyline: JSON.stringify(route.geometry), // GeoJSON
        bounds: this.calculateBounds(route.geometry.coordinates),
        steps: route.legs[0]?.steps || [],
        waypointOrder: response.data.waypoints?.map((wp, idx) => idx) || [],
      };
    } catch (error) {
      if (error.response) {
        this.logger.error('Mapbox API error:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        });
        throw new BadRequestException(`Mapbox error: ${error.response.data?.message || error.response.data?.code || 'Unknown error'}`);
      }
      this.logger.error('Error getting directions:', error.message);
      throw new BadRequestException(`Failed to get directions: ${error.message}`);
    }
  }

  /**
   * Recherche de lieux par texte
   * Utilise Mapbox Geocoding API
   */
  async searchPlaces(params: {
    query: string;
    location?: { lat: number; lng: number };
    radius?: number;
  }) {
    if (!this.accessToken) {
      throw new BadRequestException('Mapbox access token not configured');
    }

    try {
      const { query, location } = params;

      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          proximity: location ? `${location.lng},${location.lat}` : undefined,
          types: 'poi,address,place',
          limit: 10,
        },
      });

      return response.data.features.map(place => ({
        placeId: place.id,
        name: place.text,
        address: place.place_name,
        location: {
          lat: place.center[1],
          lng: place.center[0],
        },
        types: place.place_type,
        category: place.properties?.category,
      }));
    } catch (error) {
      this.logger.error('Error searching places:', error.response?.data || error.message);
      throw new BadRequestException('Failed to search places');
    }
  }

  /**
   * Géocodage: convertir une adresse en coordonnées
   */
  async geocode(address: string) {
    if (!this.accessToken) {
      throw new BadRequestException('Mapbox access token not configured');
    }

    try {
      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          limit: 1,
        },
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new BadRequestException('Address not found');
      }

      const result = response.data.features[0];
      return {
        address: result.place_name,
        location: {
          lat: result.center[1],
          lng: result.center[0],
        },
        placeId: result.id,
        types: result.place_type,
      };
    } catch (error) {
      this.logger.error('Error geocoding address:', error.response?.data || error.message);
      throw new BadRequestException('Failed to geocode address');
    }
  }

  /**
   * Géocodage inverse: convertir des coordonnées en adresse
   */
  async reverseGeocode(lat: number, lng: number) {
    if (!this.accessToken) {
      throw new BadRequestException('Mapbox access token not configured');
    }

    try {
      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          limit: 1,
        },
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new BadRequestException('Location not found');
      }

      const result = response.data.features[0];
      return {
        address: result.place_name,
        location: {
          lat: result.center[1],
          lng: result.center[0],
        },
        placeId: result.id,
        types: result.place_type,
      };
    } catch (error) {
      this.logger.error('Error reverse geocoding:', error.response?.data || error.message);
      throw new BadRequestException('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Obtenir les détails d'un lieu par son Place ID
   */
  async getPlaceDetails(placeId: string) {
    if (!this.accessToken) {
      throw new BadRequestException('Mapbox access token not configured');
    }

    try {
      // Mapbox n'a pas d'API de détails de lieu comme Google
      // On utilise le geocoding avec l'ID
      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${placeId}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
        },
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new BadRequestException('Place not found');
      }

      const place = response.data.features[0];
      return {
        placeId: place.id,
        name: place.text,
        address: place.place_name,
        location: {
          lat: place.center[1],
          lng: place.center[0],
        },
        types: place.place_type,
        category: place.properties?.category,
        context: place.context,
      };
    } catch (error) {
      this.logger.error('Error getting place details:', error.response?.data || error.message);
      throw new BadRequestException('Failed to get place details');
    }
  }

  /**
   * Formater les coordonnées pour Mapbox (lng,lat)
   */
  private formatCoordinates(location: string | { lat: number; lng: number } | number[]): string {
    if (typeof location === 'string') {
      // Si c'est une adresse, on devrait la géocoder d'abord
      // Pour simplifier, on suppose que c'est déjà des coordonnées
      return location;
    }
    
    // Handle array format [lng, lat] or [lat, lng]
    if (Array.isArray(location)) {
      if (location.length !== 2) {
        throw new BadRequestException('Array coordinates must have exactly 2 elements');
      }
      // Detect format: if first element is > 90, it's likely [lng, lat]
      const [first, second] = location;
      if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
        // Likely [lat, lng] format - convert to Mapbox [lng, lat]
        return `${second},${first}`;
      }
      // Assume [lng, lat] format (Mapbox standard)
      return `${first},${second}`;
    }
    
    // Handle object format { lat, lng }
    const lat = location.lat;
    const lng = location.lng;
    
    // Validation : lat doit être entre -90 et 90, lng entre -180 et 180
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      this.logger.warn(`Invalid coordinates detected: lat=${lat}, lng=${lng}. Attempting to swap...`);
      // Si lat > 90, c'est probablement une longitude
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        this.logger.warn('Coordinates appear to be swapped. Swapping lat and lng.');
        return `${lat},${lng}`; // Inverser
      }
      throw new BadRequestException(`Invalid coordinates: lat must be between -90 and 90, lng between -180 and 180`);
    }
    
    // Mapbox format is [lng, lat]
    return `${lng},${lat}`;
  }

  /**
   * Mapper le mode de transport vers les profils Mapbox
   */
  private mapTravelMode(mode: string): string {
    const modeMap: Record<string, string> = {
      driving: 'driving',
      walking: 'walking',
      bicycling: 'cycling',
      transit: 'driving', // Mapbox n'a pas de mode transit, on utilise driving
    };
    return modeMap[mode] || 'driving';
  }

  /**
   * Formater la durée en texte lisible
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Calculer les bounds à partir des coordonnées
   */
  private calculateBounds(coordinates: number[][]): {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  } {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coordinates.forEach(([lng, lat]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    return {
      northeast: { lat: maxLat, lng: maxLng },
      southwest: { lat: minLat, lng: minLng },
    };
  }
}
