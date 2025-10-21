import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../user/jwt-auth-guard/jwt-auth.guard';
import { HotelsService } from './hotels.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { BookHotelDto } from './dto/book-hotel.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get('search')
  async search(@Query() query: SearchHotelsDto) {
    // coerce photosOnly query param (it may arrive as string)
    const parseBoolean = (v: any) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      if (typeof v === 'string') return /^(true|1|yes)$/i.test(v.trim());
      return false;
    };

    const payload: any = { ...(query as any) };
    if ((query as any).photosOnly !== undefined) payload.photosOnly = parseBoolean((query as any).photosOnly);

    return this.hotelsService.search(payload);
  }

  // Accept POST requests from frontends that send the search payload in the body
  @Post('search')
  async searchPost(@Body() body: any) {
    // POST body likely already uses booleans, but normalize just in case
    if (body && body.photosOnly !== undefined) {
      const v = body.photosOnly;
      if (typeof v === 'string') body.photosOnly = /^(true|1|yes)$/i.test(v.trim());
      else body.photosOnly = !!v;
    }
    return this.hotelsService.search(body);
  }

  @Get('diagnose')
  async diagnose() {
    return this.hotelsService.diagnose();
  }

  @Get('random')
  async random(@Query('count') count?: string, @Query('photosOnly') photosOnly?: string) {
    const payload: any = { count: count ? Number(count) : undefined, photosOnly };
    return this.hotelsService.randomHotels(payload);
  }

  @Get('all')
  async all(@Query('limit') limit?: string, @Query('photosOnly') photosOnly?: string) {
    const payload: any = { limit: limit ? Number(limit) : undefined, photosOnly };
    return this.hotelsService.getAllHotels(payload);
  }

  @Get('provider-debug')
  async providerDebug(@Query() query: any) {
    return this.hotelsService.providerDebug(query);
  }

  @Get('provider-signatures')
  async providerSignatures(@Query() query: any) {
    return this.hotelsService.providerSignatures(query);
  }

  // Simple deterministic test endpoint for frontend/dev: returns a list of hotels
  // Uses the same normalization pipeline as `search` but with a safe default query
 

  @Post('book')
  @UseGuards(JwtAuthGuard)
  async book(@Request() req, @Body() body: BookHotelDto) {
    const userId = req.user.userId || req.user.sub;
    return this.hotelsService.book(body, userId);
  }

  @Get('bookings/:userId')
  async bookings(@Param('userId') userId: string) {
    return this.hotelsService.getBookingsForUser(userId);
  }
}
