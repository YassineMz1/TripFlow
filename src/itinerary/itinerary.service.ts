import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Itinerary, ItineraryDocument } from './schemas/itinerary.schema';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { OpenRouteService } from './services/openrouteservice.service';

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
    private openRouteService: OpenRouteService,
  ) {}

  /**
   * Créer un nouvel itinéraire avec calcul de route
   */
  async create(userId: string, createItineraryDto: CreateItineraryDto): Promise<Itinerary> {
    // Ensure origin and destination contain coordinates. If missing, try to geocode the addresses.
    try {
      if (!createItineraryDto.origin?.location) {
        if (createItineraryDto.origin?.address) {
          const geo = await this.openRouteService.geocode(createItineraryDto.origin.address);
          (createItineraryDto as any).origin = { ...(createItineraryDto as any).origin, location: geo.location };
        }
      }

      if (!createItineraryDto.destination?.location) {
        if (createItineraryDto.destination?.address) {
          const geo = await this.openRouteService.geocode(createItineraryDto.destination.address);
          (createItineraryDto as any).destination = { ...(createItineraryDto as any).destination, location: geo.location };
        }
      }
    } catch (err) {
      // Geocoding failed; allow downstream validation to respond with a helpful message
      this.logger?.error?.('Geocoding failed while creating itinerary:', err);
    }

    // If coordinates are still missing, the schema will reject the document — return a clear 400 instead
    if (!createItineraryDto.origin?.location || !createItineraryDto.destination?.location) {
      throw new BadRequestException('origin.location and destination.location are required. Provide coordinates or a valid address to geocode.');
    }

    // Normalize date fields: plannedDate may be provided as a string
    try {
      const maybePlanned = (createItineraryDto as any).plannedDate || (createItineraryDto as any).startDate;
      if (maybePlanned) {
        const d = new Date(maybePlanned as any);
        if (!isNaN(d.getTime())) {
          (createItineraryDto as any).plannedDate = d;
        } else {
          // drop invalid date to avoid Mongoose CastError
          delete (createItineraryDto as any).plannedDate;
        }
      }
    } catch (e) {
      // ignore; we'll validate later
      this.logger.warn('Failed to normalize plannedDate', (e as any)?.message || e);
    }

    // Calculate the route now that locations are present
    const routeData = await this.calculateRoute(createItineraryDto);

    // Ensure the server-set userId overrides any client-supplied userId
    const safePayload: any = { ...createItineraryDto };
    delete safePayload.userId;
    safePayload.userId = new Types.ObjectId(userId);
    safePayload.routeData = routeData;

    const itinerary = new this.itineraryModel(safePayload);

    try {
      return await itinerary.save();
    } catch (err) {
      this.logger.error('Failed to save itinerary:', err?.message || err);
      // Convert common Mongoose validation/cast errors to BadRequest
      throw new BadRequestException(err?.message || 'Failed to save itinerary');
    }
  }

  async createPublic(createItineraryDto: CreateItineraryDto): Promise<Itinerary> {
  // Try to geocode origin/destination if coordinates missing
  try {
    if (!createItineraryDto.origin?.location && createItineraryDto.origin?.address) {
      const geo = await this.openRouteService.geocode(createItineraryDto.origin.address);
      (createItineraryDto as any).origin = { ...(createItineraryDto as any).origin, location: geo.location };
    }
    if (!createItineraryDto.destination?.location && createItineraryDto.destination?.address) {
      const geo = await this.openRouteService.geocode(createItineraryDto.destination.address);
      (createItineraryDto as any).destination = { ...(createItineraryDto as any).destination, location: geo.location };
    }
  } catch (err) {
    this.logger?.error?.('Geocoding failed while creating public itinerary:', err);
  }

  if (!createItineraryDto.origin?.location || !createItineraryDto.destination?.location) {
    throw new BadRequestException('origin.location and destination.location are required. Provide coordinates or a valid address to geocode.');
  }
  // Normalize plannedDate similarly
  try {
    const maybePlanned = (createItineraryDto as any).plannedDate || (createItineraryDto as any).startDate;
    if (maybePlanned) {
      const d = new Date(maybePlanned as any);
      if (!isNaN(d.getTime())) {
        (createItineraryDto as any).plannedDate = d;
      } else {
        delete (createItineraryDto as any).plannedDate;
      }
    }
  } catch (e) {
    this.logger.warn('Failed to normalize plannedDate for public itinerary', (e as any)?.message || e);
  }

  // Ensure public itineraries are not attributed to any user even if client supplied a userId
  const safePayload: any = { ...createItineraryDto };
  if (safePayload.userId) delete safePayload.userId;
  safePayload.isPublic = true;

  const itinerary = new this.itineraryModel(safePayload);
  try {
    return await itinerary.save();
  } catch (err) {
    this.logger.error('Failed to save public itinerary:', err?.message || err);
    throw new BadRequestException(err?.message || 'Failed to save itinerary');
  }
}
  /**
   * Récupérer tous les itinéraires d'un utilisateur
   */
  async findAll(userId: string, filters?: { status?: string; tags?: string[] }): Promise<Itinerary[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    return this.itineraryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Récupérer un itinéraire par ID
   */
  async findOne(id: string, userId: string): Promise<Itinerary> {
    const itinerary = await this.itineraryModel.findById(id).exec();

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`);
    }

    // Vérifier que l'utilisateur est propriétaire ou que l'itinéraire est public
    if (itinerary.userId.toString() !== userId && !itinerary.isPublic) {
      throw new ForbiddenException('You do not have access to this itinerary');
    }

    return itinerary;
  }

  /**
   * Mettre à jour un itinéraire
   */
  async update(id: string, userId: string, updateItineraryDto: UpdateItineraryDto): Promise<Itinerary> {
    const itinerary = await this.itineraryModel.findById(id).exec();

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`);
    }

    if (itinerary.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own itineraries');
    }

    // Si les waypoints ou le mode de transport changent, recalculer la route
    const shouldRecalculate = 
      (updateItineraryDto as any).origin || 
      (updateItineraryDto as any).destination || 
      (updateItineraryDto as any).waypoints || 
      (updateItineraryDto as any).travelMode ||
      (updateItineraryDto as any).optimizeWaypoints !== undefined ||
      (updateItineraryDto as any).avoidances;

    if (shouldRecalculate) {
      const routeData = await this.calculateRoute({
        ...itinerary.toObject(),
        ...updateItineraryDto,
      } as any);
      (updateItineraryDto as any)['routeData'] = routeData;
    }

    Object.assign(itinerary, updateItineraryDto);
    return itinerary.save();
  }

  /**
   * Supprimer un itinéraire
   */
  async remove(id: string, userId: string): Promise<void> {
    const itinerary = await this.itineraryModel.findById(id).exec();

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`);
    }

    if (itinerary.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own itineraries');
    }

    await this.itineraryModel.findByIdAndDelete(id).exec();
  }

  /**
   * Recalculer la route d'un itinéraire existant
   */
  async recalculateRoute(id: string, userId: string): Promise<Itinerary> {
    const itinerary = await this.findOne(id, userId);

    if (itinerary.userId.toString() !== userId) {
      throw new ForbiddenException('You can only recalculate your own itineraries');
    }

    const routeData = await this.calculateRoute(itinerary as any);
    itinerary.routeData = routeData;

    return this.itineraryModel.findByIdAndUpdate(
      id,
      { routeData },
      { new: true }
    ).exec();
  }

  /**
   * Récupérer les itinéraires publics
   */
  async findPublicItineraries(filters?: { tags?: string[] }): Promise<Itinerary[]> {
    const query: any = { isPublic: true };

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    return this.itineraryModel.find(query).sort({ createdAt: -1 }).limit(50).exec();
  }

  /**
   * Calculer la route via Mapbox
   */
  private async calculateRoute(itinerary: CreateItineraryDto | Itinerary) {
    try {
      const waypoints = itinerary.waypoints?.map(wp => wp.location) || [];
      const directions = await this.openRouteService.getDirections({
        origin: itinerary.origin.location,
        destination: itinerary.destination.location,
        waypoints,
        travelMode: itinerary.travelMode as any || 'driving-car',
      });
      return {
        distance: directions.distance,
        duration: directions.duration,
        polyline: typeof directions.geometry === 'string' ? directions.geometry : JSON.stringify(directions.geometry),
        steps: directions.steps,
      };
    } catch (error) {
      // Si ORS échoue, retourner null (l'itinéraire sera sauvegardé sans données de route)
      console.error('Failed to calculate route:', error);
      return null;
    }
  }

  /**
   * Obtenir des statistiques sur les itinéraires d'un utilisateur
   */
  async getUserStats(userId: string) {
    const itineraries = await this.itineraryModel.find({ 
      userId: new Types.ObjectId(userId) 
    }).exec();

    const totalDistance = itineraries.reduce((sum, it) => 
      sum + (it.routeData?.distance?.value || 0), 0
    );

    const totalDuration = itineraries.reduce((sum, it) => 
      sum + (it.routeData?.duration?.value || 0), 0
    );

    const statusCounts = itineraries.reduce((acc, it) => {
      acc[it.status] = (acc[it.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItineraries: itineraries.length,
      totalDistance: totalDistance / 1000, // en km
      totalDuration: totalDuration / 3600, // en heures
      statusCounts,
      completedItineraries: statusCounts['completed'] || 0,
    };
  }
}
