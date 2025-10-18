import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Itinerary, ItineraryDocument } from './schemas/itinerary.schema';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { OpenRouteService } from './services/openrouteservice.service';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
    private openRouteService: OpenRouteService,
  ) {}

  /**
   * Créer un nouvel itinéraire avec calcul de route
   */
  async create(userId: string, createItineraryDto: CreateItineraryDto): Promise<Itinerary> {
    // Calculer la route via Mapbox
    const routeData = await this.calculateRoute(createItineraryDto);

    const itinerary = new this.itineraryModel({
      ...createItineraryDto,
      userId: new Types.ObjectId(userId),
      routeData,
    });

    return itinerary.save();
  }

  async createPublic(createItineraryDto: CreateItineraryDto): Promise<Itinerary> {
  const itinerary = new this.itineraryModel({
    ...createItineraryDto,
    isPublic: true,
    
  });
  return itinerary.save();
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
