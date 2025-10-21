import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { OpenStreetMapProvider } from './providers/openstreetmap.provider';

@Module({
  imports: [ConfigModule, MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }])],
  controllers: [HotelsController],
  providers: [HotelsService, OpenStreetMapProvider],
  exports: [HotelsService],
})
export class HotelsModule {}
