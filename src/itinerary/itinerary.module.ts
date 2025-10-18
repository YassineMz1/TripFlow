import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';
import { OpenRouteService } from './services/openrouteservice.service';
import { Itinerary, ItinerarySchema } from './schemas/itinerary.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Itinerary.name, schema: ItinerarySchema },
    ]),
  ],
  controllers: [ItineraryController],
  providers: [ItineraryService, OpenRouteService],
  exports: [ItineraryService, OpenRouteService],
})
export class ItineraryModule {}
