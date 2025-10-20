import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema()
export class Booking {
  @Prop({ required: true })
  bookingId: string;

  @Prop({ required: true })
  hotelId: string;

  @Prop()
  userId?: string;

  @Prop({ required: true })
  checkin: string;

  @Prop({ required: true })
  checkout: string;

  @Prop({ required: true })
  adults: number;

  @Prop({ required: true })
  rooms: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 'CONFIRMED' })
  status: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
