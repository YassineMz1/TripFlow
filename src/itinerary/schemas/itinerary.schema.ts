import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

@Schema({ timestamps: true })
export class Waypoint {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, type: { lat: Number, lng: Number } })
  location: {
    lat: number;
    lng: number;
  };

  @Prop()
  placeId?: string;

  @Prop()
  stopDuration?: number; // durée d'arrêt en minutes

  @Prop()
  notes?: string;
}

const WaypointSchema = SchemaFactory.createForClass(Waypoint);

@Schema({ timestamps: true })
export class Itinerary {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: WaypointSchema })
  origin: Waypoint;

  @Prop({ required: true, type: WaypointSchema })
  destination: Waypoint;

  @Prop({ type: [WaypointSchema], default: [] })
  waypoints: Waypoint[];

  @Prop({ type: Object })
  routeData?: {
    distance: {
      text: string;
      value: number; // en mètres
    };
    duration: {
      text: string;
      value: number; // en secondes
    };
    polyline: string;
    bounds?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };

  @Prop({ enum: ['driving', 'walking', 'bicycling', 'transit'], default: 'driving' })
  travelMode: string;

  @Prop({ default: false })
  optimizeWaypoints: boolean;

  @Prop({ type: [String], default: [] })
  avoidances?: string[]; // tolls, highways, ferries

  @Prop({ type: Date })
  plannedDate?: Date;

  @Prop({ enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'], default: 'draft' })
  status: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: false })
  isPublic: boolean;
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
