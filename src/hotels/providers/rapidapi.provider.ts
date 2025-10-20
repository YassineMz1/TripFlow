import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RapidApiProvider {
  private logger = new Logger(RapidApiProvider.name);
  // Support multiple env var names: RAPIDAPI_HOST (generic) or HOTELS_RAPIDAPI_HOST (specific to this project)
  private host = process.env.RAPIDAPI_HOST || process.env.HOTELS_RAPIDAPI_HOST || process.env.HOTELS_RAPIDAPI_HOST?.trim();
  private key = process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY?.trim();
  private path = process.env.RAPIDAPI_PATH || '/properties/v2/list';

  async searchHotels(query: any) {
    if (!this.host || !this.key) {
      this.logger.debug('RapidAPI credentials not provided, skipping RapidAPI provider');
      return null;
    }

    const url = `https://${this.host}${this.path}`;

    try {
      // Many RapidAPI hotel endpoints accept either GET with query params or POST with a JSON body.
      // We'll try GET first; if host requires POST you can switch RAPIDAPI_METHOD=POST in env.
      const method = (process.env.RAPIDAPI_METHOD || 'GET').toUpperCase();

      const headers = {
        'X-RapidAPI-Host': this.host,
        'X-RapidAPI-Key': this.key,
        'Content-Type': 'application/json',
      };

      if (method === 'GET') {
        const res = await axios.get(url, { params: query, headers, timeout: 10000 });
        return res.data;
      }

      const res = await axios.post(url, query, { headers, timeout: 10000 });
      return res.data;
    } catch (err) {
      this.logger.error('RapidAPI hotel search error', err);
      return null;
    }
  }

  async getHotelById(hotelId: string) {
    // Some RapidAPI hosts expose a property-by-id endpoint; keep this simple and return null.
    return null;
  }

  isConfigured() {
    return !!this.host && !!this.key;
  }
}
