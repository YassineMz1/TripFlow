import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Mock provider removed per user request
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { RapidApiProvider } from './providers/rapidapi.provider';
import { Booking, BookingSchema } from './schemas/booking.schema';

@Module({
  imports: [ConfigModule, MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }])],
  controllers: [HotelsController],
  providers: [HotelsService, RapidApiProvider],
  exports: [HotelsService],
})
export class HotelsModule {}
