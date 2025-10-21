import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

export type AmadeusHotel = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  price?: number | null;
  provider: 'amadeus';
};

@Injectable()
export class AmadeusProvider {
  private readonly logger = new Logger(AmadeusProvider.name);

  isConfigured(): boolean {
    return !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET && process.env.AMADEUS_BASE_URL);
  }

  private async getAccessToken(): Promise<string> {
    const base = process.env.AMADEUS_BASE_URL!.replace(/\/$/, '');
    const url = `${base}/v1/security/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID!,
      client_secret: process.env.AMADEUS_CLIENT_SECRET!,
    });

    const res = await fetch(url, { method: 'POST', body });
    if (!res.ok) {
      const t = await res.text();
      this.logger.error('Amadeus token fetch failed', t);
      throw new Error(`Amadeus token fetch failed: ${res.status} ${t}`);
    }

    const j = await res.json();
    return j.access_token;
  }

  // Simple hotel search via Amadeus Hotel Search / Hotel Offers API (test sandbox)
  async searchHotels(query: { city?: string; name?: string; near?: { lat: number; lng: number } } | string): Promise<AmadeusHotel[]> {
    if (!this.isConfigured()) throw new Error('Amadeus provider not configured');

    const token = await this.getAccessToken();
    const base = process.env.AMADEUS_BASE_URL!.replace(/\/$/, '');

    // We'll call the Hotel Offers Search endpoint. Amadeus expects either cityCode or latitude/longitude.
    // Resolve query into parameters
    let params: any = {};
    if (typeof query === 'string') {
      params.city = query;
    } else {
      if (query.city) params.city = query.city;
      if ((query as any).near) params.near = (query as any).near;
    }

    // Try to resolve a cityCode via Amadeus reference-data endpoint if we have a city name
    let cityCode: string | undefined;
    if (params.city) {
      try {
        const locUrl = `${base}/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(params.city)}&page[limit]=5`;
        const locRes = await fetch(locUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
        if (locRes.ok) {
          const lj = await locRes.json();
          const data = lj.data || [];
          if (data.length > 0) {
            // Prefer entries with iataCode
            const best = data.find((d: any) => d.type === 'CITY' && d.iataCode) || data[0];
            cityCode = best.iataCode || best.detailedName || undefined;
            this.logger.log(`Amadeus resolved city '${params.city}' -> ${cityCode}`);
          } else {
            this.logger.warn(`Amadeus location lookup returned no results for '${params.city}'`);
          }
        } else {
          const t = await locRes.text();
          this.logger.warn('Amadeus location lookup failed', t);
        }
      } catch (e) {
        this.logger.warn('Amadeus location lookup error', String(e));
      }
    }

    // Ensure we include check-in/out dates (required by Amadeus hotel-offers)
    const toISODate = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const checkInDate = (query as any)?.checkin || toISODate(today);
    const checkOutDate = (query as any)?.checkout || toISODate(tomorrow);

    let searchUrl = `${base}/v2/shopping/hotel-offers?lang=en&currency=EUR&adults=2&radius=10`;
    searchUrl += `&checkInDate=${encodeURIComponent(checkInDate)}&checkOutDate=${encodeURIComponent(checkOutDate)}`;
    if (cityCode) {
      searchUrl += `&cityCode=${encodeURIComponent(cityCode)}`;
    } else if (params.near) {
      searchUrl += `&latitude=${params.near.lat}&longitude=${params.near.lng}`;
    } else if (params.city) {
      // fallback: try keyword search via 'cityCode' param using a slug of the city
      searchUrl += `&cityCode=${encodeURIComponent(params.city.slice(0, 3).toUpperCase())}`;
    }

    this.logger.log(`Amadeus hotel-offers request URL: ${searchUrl}`);
    const res = await fetch(searchUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const t = await res.text();
      // try to parse JSON body for nicer logging
      let parsed: any = t;
      try { parsed = JSON.parse(t); } catch (e) { /* keep raw text */ }
      this.logger.warn('Amadeus search failed', parsed);
      throw new Error(`Amadeus search failed: ${res.status} ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
    }

    const j = await res.json();
    const offers = j.data || [];
    const hotels: AmadeusHotel[] = offers.map((o: any) => ({
      id: String(o.hotel?.hotelId || o.hotel?.chainCode || o.hotel?.name || o.vendor || ''),
      name: o.hotel?.name || o.name || '',
      address: o.hotel?.address?.lines ? o.hotel.address.lines.join(', ') : undefined,
      city: o.hotel?.city?.name || undefined,
      country: o.hotel?.countryCode || undefined,
      latitude: o.hotel?.geoCode?.latitude || undefined,
      longitude: o.hotel?.geoCode?.longitude || undefined,
      photos: (o.hotel?.media || []).map((m: any) => m.uri).filter(Boolean).slice(0, 5),
      price: o.offers && o.offers[0] && o.offers[0].price ? Number(o.offers[0].price.total) : null,
      provider: 'amadeus',
    }));

    return hotels;
  }
}
