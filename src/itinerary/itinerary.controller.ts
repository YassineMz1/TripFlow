import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { OpenRouteService } from './services/openrouteservice.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { SearchPlacesDto, GeocodeDto, ReverseGeocodeDto } from './dto/search-places.dto';
import { JwtAuthGuard } from '../user/jwt-auth-guard/jwt-auth.guard';

@Controller('itinerary')
export class ItineraryController {
  constructor(
    private readonly itineraryService: ItineraryService,
    private readonly openRouteService: OpenRouteService,
  ) { }

  // ==================== ITINERARY CRUD ====================

  /**
   * Créer un nouvel itinéraire
   * POST /itinerary
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req,
    @Body(ValidationPipe) createItineraryDto: CreateItineraryDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.itineraryService.create(userId, createItineraryDto);
  }

  @Post('public/create')
  async createPublic(@Body(ValidationPipe) createItineraryDto: CreateItineraryDto) {
    return this.itineraryService.createPublic(createItineraryDto);
  }
  /**
   * Récupérer les itinéraires publics
   * GET /itinerary/public/all
   * IMPORTANT: Must be before /itinerary/:id to avoid route conflict
   */


  @Get('public/all')
  async findPublicItineraries(@Query('tags') tags?: string) {
    const filters = {
      tags: tags ? tags.split(',') : undefined,
    };
    return this.itineraryService.findPublicItineraries(filters);
  }

  /**
   * Obtenir les statistiques de l'utilisateur
   * GET /itinerary/stats/user
   * IMPORTANT: Must be before /itinerary/:id to avoid route conflict
   */
  @Get('stats/user')
  @UseGuards(JwtAuthGuard)
  async getUserStats(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.itineraryService.getUserStats(userId);
  }

  /**
   * Récupérer tous les itinéraires de l'utilisateur connecté
   * GET /itinerary
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('tags') tags?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    const filters = {
      status,
      tags: tags ? tags.split(',') : undefined,
    };
    return this.itineraryService.findAll(userId, filters);
  }

  /**
   * Récupérer un itinéraire par ID
   * GET /itinerary/:id
   */
  @Get('findone/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.sub;
    return this.itineraryService.findOne(id, userId);
  }

  /**
   * Mettre à jour un itinéraire
   * PUT /itinerary/:id
   */
  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body(ValidationPipe) updateItineraryDto: UpdateItineraryDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.itineraryService.update(id, userId, updateItineraryDto);
  }

  /**
   * Supprimer un itinéraire
   * DELETE /itinerary/:id
   */
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.sub;
    await this.itineraryService.remove(id, userId);
    return { message: 'Itinerary deleted successfully' };
  }

  /**
   * Recalculer la route d'un itinéraire
   * POST /itinerary/:id/recalculate
   */
  @Post(':id/recalculate')
  @UseGuards(JwtAuthGuard)
  async recalculateRoute(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId || req.user.sub;
    return this.itineraryService.recalculateRoute(id, userId);
  }

  // ==================== GOOGLE MAPS API ====================

  /**
   * Rechercher des lieux
   * POST /itinerary/places/search
   * Note: Endpoint public pour la recherche
   */
  @Post('places/search')
  // @UseGuards(JwtAuthGuard) // Commenté pour permettre l'accès public
  async searchPlaces(@Body(ValidationPipe) searchDto: SearchPlacesDto) {
    return this.openRouteService.searchPlaces(
      searchDto.query,
      searchDto.latitude && searchDto.longitude
        ? { lat: searchDto.latitude, lng: searchDto.longitude }
        : undefined
    );
  }

  /**
   * Géocoder une adresse (adresse → coordonnées)
   * POST /itinerary/geocode
   * Note: Endpoint public pour le géocodage
   */
  @Post('geocode')
  // @UseGuards(JwtAuthGuard) // Commenté pour permettre l'accès public
  async geocode(@Body(ValidationPipe) geocodeDto: GeocodeDto) {
    return this.openRouteService.geocode(geocodeDto.address);
  }

  /**
   * Géocodage inverse (coordonnées → adresse)
   * POST /itinerary/reverse-geocode
   * Note: Endpoint public pour le géocodage inverse
   */
  @Post('reverse-geocode')
  // @UseGuards(JwtAuthGuard) // Commenté pour permettre l'accès public
  async reverseGeocode(@Body(ValidationPipe) reverseGeocodeDto: ReverseGeocodeDto) {
    // OpenRouteService does not support reverse geocoding in the free tier, so return a message
    return { message: 'Reverse geocoding is not supported by OpenRouteService free API.' };
  }

  /**
   * Obtenir les détails d'un lieu par Place ID
   * GET /itinerary/places/:placeId
   */
  @Get('places/:placeId')
  @UseGuards(JwtAuthGuard)
  async getPlaceDetails(@Param('placeId') placeId: string) {
    // OpenRouteService does not support place details by ID in the free tier, so return a message
    return { message: 'Place details by ID are not supported by OpenRouteService free API.' };
  }

  /**
   * Calculer un itinéraire (sans sauvegarde)
   * POST /itinerary/calculate-route
   * Note: Endpoint public pour permettre le calcul sans authentification
   * Accepts coordinates in multiple formats: {lat, lng}, [lat, lng], or [lng, lat]
   */
  @Post('calculate-route')
  // @UseGuards(JwtAuthGuard) // Commenté pour permettre l'accès public
  async calculateRoute(@Body() routeParams: {
    origin: string | { lat: number; lng: number } | number[];
    destination: string | { lat: number; lng: number } | number[];
    waypoints?: Array<string | { lat: number; lng: number } | number[]>;
    travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    // Some frontends send `mode` instead of `travelMode` and values like 'cycling'
    mode?: string;
    optimizeWaypoints?: boolean;
    avoid?: string[];
  }) {
    console.log('📍 Received route params:', JSON.stringify(routeParams, null, 2));

    function normalizeCoordinate(coord: string | { lat: number; lng: number } | number[]): { lat: number; lng: number } {
      if (typeof coord === 'string') {
        throw new Error('String coordinates are not supported for this route calculation');
      }
      if (Array.isArray(coord)) {
        // Heuristic to decide whether array is [lng, lat] (common) or [lat, lng]
        const a0 = Number(coord[0]);
        const a1 = Number(coord[1]);
        if (Number.isNaN(a0) || Number.isNaN(a1)) {
          throw new Error('Coordinate array must contain numbers');
        }
        // If the first number falls outside latitude range, it must be longitude -> [lng, lat]
        if (a0 < -90 || a0 > 90) {
          return { lat: a1, lng: a0 };
        }
        // If the second number falls outside latitude range, assume [lat, lng]
        if (a1 < -90 || a1 > 90) {
          return { lat: a0, lng: a1 };
        }
        // Ambiguous: prefer [lng, lat] because ORS expects [lng, lat] coordinates in arrays
        return { lat: a1, lng: a0 };
      }
      return coord;
    }

    // Map frontend travel modes to ORS travel profiles
    function mapTravelMode(modeInput?: string) {
      if (!modeInput) return 'driving-car';
      const m = String(modeInput).toLowerCase();
      if (m === 'driving' || m === 'car') return 'driving-car';
      if (m === 'walking' || m === 'foot') return 'foot-walking';
      if (m === 'cycling' || m === 'bicycling' || m === 'bike') return 'cycling-regular';
      // ORS doesn't have a transit profile on free tier; fallback to driving
      if (m === 'transit' || m === 'public' || m === 'train' || m === 'bus') return 'driving-car';
      // default
      return 'driving-car';
    }

    const origin = normalizeCoordinate(routeParams.origin);
    const destination = normalizeCoordinate(routeParams.destination);
    const waypoints = (routeParams.waypoints || []).map(normalizeCoordinate);
    const requested = routeParams.mode || routeParams.travelMode;
    const travelMode = mapTravelMode(requested);
    this.itineraryService?.['logger']?.log?.(`Using travelMode=${travelMode} (requested='${requested}')`);

    return this.openRouteService.getDirections({
      origin,
      destination,
      waypoints,
      travelMode: travelMode as any,
    });
  }
}
