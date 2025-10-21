import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

export type OSMHotel = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  price?: number | null;
  provider: 'openstreetmap';
};

@Injectable()
export class OpenStreetMapProvider {
  private readonly logger = new Logger(OpenStreetMapProvider.name);

  isConfigured(): boolean {
    // No API key required for Nominatim / Overpass, but respect env override if set
    return true;
  }

  private async nominatimSearch(q: string) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
    const res = await this.fetchWithTimeout(url, { headers: { 'User-Agent': 'Tripflow/1.0 (dev contact)' } }, 5000);
    if (!res || !res.ok) throw new Error(`Nominatim geocode failed: ${res ? res.status : 'no-response'}`);
    const j = await res.json();
    return j[0];
  }

  private async getWikidataImage(wikidataId: string): Promise<string | undefined> {
    try {
      const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikidataId)}.json`;
      const res = await this.fetchWithTimeout(url, { headers: { 'User-Agent': 'Tripflow/1.0 (dev contact)' } }, 4000);
      if (!res || !res.ok) return undefined;
      const j = await res.json();
      const ent = j.entities && j.entities[wikidataId];
      const claims = ent && ent.claims;
      const p18 = claims && claims.P18; // image property
      if (p18 && p18.length > 0) {
        const filename = p18[0].mainsnak.datavalue.value as string;
        // Use FilePath special page to get direct image URL
        return `https://commons.wikimedia.org/w/index.php?title=Special:FilePath&file=${encodeURIComponent(filename)}`;
      }
    } catch (e) {
      this.logger.debug('Wikidata image fetch failed', String(e));
    }
    return undefined;
  }

  // Query Overpass with bbox (south,west,north,east)
  private async overpassHotels(south: number, west: number, north: number, east: number) {
    const query = `[out:json][timeout:25];(node["tourism"="hotel"](${south},${west},${north},${east});way["tourism"="hotel"](${south},${west},${north},${east});relation["tourism"="hotel"](${south},${west},${north},${east}););out center tags;`;
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.openstreetmap.fr/api/interpreter',
    ];

    const maxAttemptsPerEndpoint = 2;

    for (const endpoint of endpoints) {
      for (let attempt = 0; attempt < maxAttemptsPerEndpoint; attempt++) {
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Tripflow/1.0 (dev contact)' }, body: `data=${encodeURIComponent(query)}` });
          if (!res.ok) {
            // If server indicates rate limiting (429) or gateway timeout (504), try next endpoint / retry
            throw new Error(`Overpass query failed: ${res.status}`);
          }
          const j = await res.json();
          return j.elements || [];
        } catch (err) {
          this.logger.debug(`Overpass attempt ${attempt + 1} for ${endpoint} failed: ${String(err)}`);
          // backoff before retrying
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      }
    }

    throw new Error('Overpass query failed: all endpoints exhausted');
  }

  async searchHotels(query: { city?: string; name?: string; near?: { lat: number; lng: number } } | string): Promise<OSMHotel[]> {
    const q = typeof query === 'string' ? { city: query } : (query as any || {});

    // Determine bbox either from city name or use a small bbox around near
    let south: number, west: number, north: number, east: number;
    if (q.city) {
      const geo = await this.nominatimSearch(q.city);
      if (!geo || !geo.boundingbox) {
        this.logger.warn(`Nominatim returned no bbox for ${q.city}`);
        return [];
      }
      // boundingbox = [south, north, west, east] as strings
      south = parseFloat(geo.boundingbox[0]);
      north = parseFloat(geo.boundingbox[1]);
      west = parseFloat(geo.boundingbox[2]);
      east = parseFloat(geo.boundingbox[3]);
    } else if (q.near) {
      const lat = q.near.lat;
      const lon = q.near.lng;
      const delta = 0.05; // ~5km
      south = lat - delta;
      north = lat + delta;
      west = lon - delta;
      east = lon + delta;
    } else {
      throw new Error('OpenStreetMap provider: need city or near coords');
    }

    const elems = await this.overpassHotels(south, west, north, east);
    if (!elems || elems.length === 0) return [];

    const hotels: OSMHotel[] = await Promise.all(elems.map(async (el: any) => {
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags['operator'] || `hotel-${el.id}`;
      const lat = el.lat || (el.center && el.center.lat) || undefined;
      const lon = el.lon || (el.center && el.center.lon) || undefined;
      const addressParts: string[] = [];
      if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
      if (tags['addr:street']) addressParts.push(tags['addr:street']);
      if (tags['addr:city']) addressParts.push(tags['addr:city']);
      if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
      const address = addressParts.join(', ') || undefined;

      const photos: string[] = [];
      if (tags.image) photos.push(tags.image);
      if (tags.wikidata) {
        const img = await this.getWikidataImage(tags.wikidata);
        if (img) photos.push(img);
      }

      return {
        id: `${el.type}/${el.id}`,
        name,
        address,
        city: tags['addr:city'] || q.city,
        country: tags['addr:country'] || undefined,
        latitude: lat,
        longitude: lon,
        photos,
        price: null,
        provider: 'openstreetmap',
      } as OSMHotel;
    }));

    return hotels;
  }

  // Simple fetch with timeout (returns null on abort/error)
  private async fetchWithTimeout(url: string, opts: any = {}, timeoutMs = 5000): Promise<any> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      this.logger.debug(`fetchWithTimeout failed for ${url}: ${String(e)}`);
      return null;
    }
  }
}
