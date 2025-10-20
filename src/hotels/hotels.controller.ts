import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { BookHotelDto } from './dto/book-hotel.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get('search')
  async search(@Query() query: SearchHotelsDto) {
    return this.hotelsService.search(query as any);
  }

  // Accept POST requests from frontends that send the search payload in the body
  @Post('search')
  async searchPost(@Body() body: any) {
    return this.hotelsService.search(body);
  }

  @Get('diagnose')
  async diagnose() {
    return this.hotelsService.diagnose();
  }

  @Get('rapidapi-debug')
  async rapidapiDebug(@Query() query: any) {
    return this.hotelsService.rapidapiDebug(query);
  }

  @Post('book')
  async book(@Body() body: BookHotelDto) {
    return this.hotelsService.book(body);
  }

  @Get('bookings/:userId')
  async bookings(@Param('userId') userId: string) {
    return this.hotelsService.getBookingsForUser(userId);
  }
}
