import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpenRouteService {
  private readonly logger = new Logger(OpenRouteService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openrouteservice.org';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ORS_API_KEY');
    if (!this.apiKey) {
      this.logger.error('⚠️ ORS_API_KEY not configured. Routing features will not work.');
    } else {
      this.logger.log(`✅ OpenRouteService configured with key: ${this.apiKey.substring(0, 10)}...`);
    }
  }

  async getDirections(params: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    waypoints?: Array<{ lat: number; lng: number }>;
    travelMode?: 'driving-car' | 'cycling-regular' | 'foot-walking';
  }) {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OpenRouteService API key not configured');
    }
    try {
      const { origin, destination, waypoints = [], travelMode = 'driving-car' } = params;
      const coordinates = [
        [origin.lng, origin.lat],
        ...waypoints.map(wp => [wp.lng, wp.lat]),
        [destination.lng, destination.lat],
      ];
      const url = `${this.baseUrl}/v2/directions/${travelMode}`;
      const response = await axios.post(url, {
        coordinates,
      }, {
        headers: { Authorization: this.apiKey },
      });
      if (!response.data.routes || response.data.routes.length === 0) {
        this.logger.error('No route found in ORS response:', response.data);
        throw new BadRequestException('No route found');
      }
      const route = response.data.routes[0];
      return {
        distance: {
          text: `${(route.summary.distance / 1000).toFixed(2)} km`,
          value: route.summary.distance,
        },
        duration: {
          text: `${Math.round(route.summary.duration / 60)} min`,
          value: route.summary.duration,
        },
        geometry: route.geometry,
        steps: route.segments[0]?.steps || [],
      };
    } catch (error: any) {
      const data = error?.response?.data;
      this.logger.error('ORS API error:', data || error.message);
      // If ORS returned an HTTP status, propagate it as an HttpException
      if (error.response && typeof error.response.status === 'number') {
        const status = error.response.status;
        const msg = data?.message ?? data ?? error.message;
        // Map common ORS statuses to proper Nest exceptions so the frontend receives accurate HTTP codes
        if (status === 401) {
          this.logger.error(`ORS returned 401 Unauthorized. Please check ORS_API_KEY and account status.`);
          throw new ServiceUnavailableException('Routing service unavailable (invalid ORS API key)');
        }
        if (status === 403) {
          this.logger.error(`ORS returned 403 Forbidden. Check ORS_API_KEY permissions.`);
          throw new ServiceUnavailableException('Routing service forbidden (check ORS API key permissions)');
        }
        if (status === 429) {
          throw new HttpException(msg, 429);
        }
        if (status === 503) {
          throw new ServiceUnavailableException(msg);
        }
        // For all other statuses, throw a generic HttpException preserving status
        throw new HttpException(msg, status);
      }
      throw new BadRequestException('Failed to get directions');
    }
  }

  async geocode(query: string) {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OpenRouteService API key not configured');
    }
    try {
      const url = `${this.baseUrl}/geocode/search`;
      const response = await axios.get(url, {
        params: {
          api_key: this.apiKey,
          text: query,
          size: 1,
        },
      });
      if (!response.data.features || response.data.features.length === 0) {
        throw new BadRequestException('Address not found');
      }
      const result = response.data.features[0];
      return {
        address: result.properties.label,
        location: {
          lat: result.geometry.coordinates[1],
          lng: result.geometry.coordinates[0],
        },
      };
    } catch (error: any) {
      const data = error?.response?.data;
      this.logger.error('ORS geocode error:', data || error.message);
      if (error.response && typeof error.response.status === 'number') {
        const status = error.response.status;
        const msg = data?.message ?? data ?? error.message;
        if (status === 401) throw new UnauthorizedException(msg);
        if (status === 403) throw new ForbiddenException(msg);
  if (status === 429) throw new HttpException(msg, 429);
        if (status === 503) throw new ServiceUnavailableException(msg);
        throw new HttpException(msg, status);
      }
      throw new BadRequestException('Failed to geocode address');
    }
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }) {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OpenRouteService API key not configured');
    }
    try {
      const url = `${this.baseUrl}/geocode/search`;
      const params: any = {
        api_key: this.apiKey,
        text: query,
        size: 10,
      };
      if (location) {
        // ensure focus object exists
        params.focus = { point: { lat: location.lat, lon: location.lng } };
      }
      const response = await axios.get(url, { params });
      return response.data.features.map(place => ({
        placeId: place.properties.id,
        name: place.properties.name,
        address: place.properties.label,
        location: {
          lat: place.geometry.coordinates[1],
          lng: place.geometry.coordinates[0],
        },
        category: place.properties.category,
      }));
    } catch (error: any) {
      const data = error?.response?.data;
      this.logger.error('ORS search error:', data || error.message);
      if (error.response && typeof error.response.status === 'number') {
        const status = error.response.status;
        const msg = data?.message ?? data ?? error.message;
        if (status === 401) throw new UnauthorizedException(msg);
        if (status === 403) throw new ForbiddenException(msg);
  if (status === 429) throw new HttpException(msg, 429);
        if (status === 503) throw new ServiceUnavailableException(msg);
        throw new HttpException(msg, status);
      }
      throw new BadRequestException('Failed to search places');
    }
  }
}
