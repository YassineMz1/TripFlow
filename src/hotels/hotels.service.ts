import { Injectable, Logger, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { OpenStreetMapProvider } from './providers/openstreetmap.provider';
import { BookHotelDto } from './dto/book-hotel.dto';
import { Booking, BookingDocument } from './schemas/booking.schema';

@Injectable()
export class HotelsService {
    private logger = new Logger(HotelsService.name);
    private bookings: any[] = [];

    // Instantiate OpenStreetMap provider directly (no API key required)
    private readonly osm = new OpenStreetMapProvider();

    // Helper: robust boolean parsing
    private parseBoolean(v: any) {
        if (v === undefined || v === null) return false;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        if (typeof v === 'string') return /^(true|1|yes)$/i.test(v.trim());
        return false;
    }

    // Normalize provider results into frontend shape
    private async normalizeProviderRes(providerRes: any[]) {
        return await Promise.all(providerRes.map(async (item: any) => {
            const images = item.photos || item.images || [];
            return {
                id: item.id,
                name: item.name,
                rating: item.rating,
                price: item.price || null,
                priceAmount: item.priceAmount ?? 0,
                priceCurrency: item.priceCurrency ?? 'USD',
                priceString: item.priceString ?? '0 USD',
                images:images || [],
                raw: item.raw || item,
                city: item.city || (item.raw && item.raw.city) || undefined,
            };
        }));
    }

    constructor(@InjectModel(Booking.name) private bookingModel?: Model<BookingDocument>) { }

    // Diagnostic helper: report which providers are configured and available
    async diagnose() {
        const osmConfigured = typeof this.osm?.isConfigured === 'function' ? this.osm.isConfigured() : false;
        return {
            providers: {
                openstreetmap: osmConfigured,
            },
        };
    }

        // Call provider debug endpoint and return the raw response (for debugging only)
            async providerDebug(query: any) {
                try {
                    // Use OpenStreetMap provider
                    if (this.osm && typeof this.osm.searchHotels === 'function' && this.osm.isConfigured()) {
                        const res = await this.osm.searchHotels(query);
                        return { ok: true, data: res, provider: 'openstreetmap' };
                    }

                    return { ok: false, error: 'OpenStreetMap provider not configured' };
                } catch (err) {
                    return { ok: false, error: err };
                }
            }

            // Return the computed signature headers (no outbound network calls) for inspection
            async providerSignatures(query: any) {
                return { ok: false, error: 'OpenStreetMap provider does not support signature debug (not applicable)' };
            }

    async search(query: any) {
        // Normalize common frontend date formats to YYYY-MM-DD for provider APIs
        const normalizeDate = (d: any) => {
            if (!d) return d;
            if (typeof d !== 'string') return d;
            // dd/mm/yyyy -> yyyy-mm-dd
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
                const parts = d.split('/');
                const dd = parts[0].padStart(2, '0');
                const mm = parts[1].padStart(2, '0');
                const yyyy = parts[2];
                return `${yyyy}-${mm}-${dd}`;
            }
            // already ISO-like
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
            // fallback: try Date parse
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
            return d;
        };

        const normalizedQuery = {
            ...query,
            checkin: normalizeDate(query?.checkin),
            checkout: normalizeDate(query?.checkout),
        };

        // Use OpenStreetMap provider
        if (!this.osm || !this.osm.isConfigured || !this.osm.isConfigured()) {
            this.logger.error('OpenStreetMap provider not configured');
            return [{ id: 'error-provider', name: 'Provider not configured', priceAmount: 0, priceCurrency: 'USD', priceString: '0 USD', images: [], raw: { error: 'OpenStreetMap provider not configured' } }];
        }

        const providerRes = await this.osm.searchHotels({ city: normalizedQuery?.city || normalizedQuery?.q || normalizedQuery?.where, near: normalizedQuery?.near } as any);
        if (!providerRes || !Array.isArray(providerRes) || providerRes.length === 0) {
            this.logger.error('OpenStreetMap provider failed or returned no hotels');
            return [{ id: 'error-provider', name: 'Provider error or no hotels found', priceAmount: 0, priceCurrency: 'USD', priceString: '0 USD', images: [], raw: { error: 'OpenStreetMap provider failed or returned no hotels' } }];
        }

        // Normalize and filter
        const mapped = await this.normalizeProviderRes(providerRes as any[]);
        const photosOnly = this.parseBoolean(normalizedQuery?.photosOnly);
        const results = photosOnly ? mapped.filter((r) => Array.isArray(r.images) && r.images.length > 0) : mapped;

        return results;
    }

    // Return a sample list of random hotels (no search) — tries multiple known cities to collect candidates
    async randomHotels(options?: { count?: number; photosOnly?: any }) {
        const count = Math.max(1, Math.min(50, Number(options?.count || 8)));
        const photosOnly = this.parseBoolean(options?.photosOnly);

        // Sample city list to pick from — can be expanded
        const sampleCities = ['Paris', 'Barcelona', 'London', 'Rome', 'Berlin', 'Amsterdam', 'Lisbon', 'Prague', 'Vienna', 'Madrid'];

        // Shuffle cities for randomness
        const shuffled = sampleCities.sort(() => 0.5 - Math.random());

        // We'll gather a limited candidate list per city, then pick one from each city in round-robin
        const nCities = shuffled.length;
        const perCityLimit = Math.max(2, Math.ceil(count / nCities) + 2);

        const cityCandidates: any[][] = [];

        for (const city of shuffled) {
            try {
                const providerRes = await this.osm.searchHotels({ city } as any);
                if (!providerRes || !Array.isArray(providerRes) || providerRes.length === 0) {
                    cityCandidates.push([]);
                    continue;
                }
                let normalized = await this.normalizeProviderRes(providerRes as any[]);
                // annotate with city name to ensure UI can show it
                normalized.forEach((n) => { if (!n.city) n.city = city; });
                if (photosOnly) normalized = normalized.filter((r) => Array.isArray(r.images) && r.images.length > 0);
                // Shuffle and limit per city to keep selection diverse and fast
                normalized = normalized.sort(() => 0.5 - Math.random()).slice(0, perCityLimit);
                cityCandidates.push(normalized);
            } catch (e) {
                this.logger.debug(`randomHotels: failed for ${city}: ${String(e)}`);
                cityCandidates.push([]);
            }
        }

        const collected: any[] = [];
        // Round-robin selection across city candidate lists
        let index = 0;
        while (collected.length < count) {
            let addedThisRound = false;
            for (let ci = 0; ci < cityCandidates.length && collected.length < count; ci++) {
                const bucket = cityCandidates[ci];
                if (bucket && bucket.length > index) {
                    collected.push(bucket[index]);
                    addedThisRound = true;
                }
            }
            if (!addedThisRound) break; // no more candidates at this index
            index++;
        }

        return collected.slice(0, count);
    }

    // Aggregate hotels across sample cities and return deduplicated list (useful to populate an "all hotels" view)
    async getAllHotels(options?: { limit?: number; photosOnly?: any }) {
        // If client sends limit=0, treat as "no limit" but apply a safe hard cap to avoid huge/slow requests.
        const requested = options?.limit === undefined ? 50 : Number(options.limit);
        const HARD_CAP = 1000;
        const limit = requested === 0 ? HARD_CAP : Math.max(1, Math.min(HARD_CAP, requested));
        const photosOnly = this.parseBoolean(options?.photosOnly);

        const sampleCities = ['Paris', 'Barcelona', 'London', 'Rome', 'Berlin', 'Amsterdam', 'Lisbon', 'Prague', 'Vienna', 'Madrid'];
        const collected: any[] = [];
        const seen = new Set<string>();

        for (const city of sampleCities) {
            try {
                const providerRes = await this.osm.searchHotels({ city } as any);
                if (!providerRes || !Array.isArray(providerRes) || providerRes.length === 0) continue;
                let normalized = await this.normalizeProviderRes(providerRes as any[]);
                normalized.forEach((n) => { if (!n.city) n.city = city; });
                if (photosOnly) normalized = normalized.filter((r) => Array.isArray(r.images) && r.images.length > 0);
                for (const h of normalized) {
                    if (seen.has(h.id)) continue;
                    seen.add(h.id);
                    collected.push(h);
                    if (collected.length >= limit) break;
                }
                // continue scanning remaining cities until we reach limit (no early break) — this gives a fuller set
                if (collected.length >= limit) break;
            } catch (e) {
                this.logger.debug(`getAllHotels: failed for ${city}: ${String(e)}`);
                // Common Overpass responses include 429 (rate limited) or 504 (timeout). Continue to next city.
            }
        }

        return collected.slice(0, limit);
    }

    async book(bookDto: BookHotelDto, userId?: string) {
        // Accept booking payload and persist it. userId is set server-side from authenticated request.
        const booking: any = {
            bookingId: `bkg-${Date.now()}`,
            hotelId: bookDto.hotelId,
            checkin: bookDto.checkin,
            checkout: bookDto.checkout,
            adults: bookDto.adults,
            rooms: bookDto.rooms,
            userId: userId || bookDto.userId || null,
            createdAt: new Date(),
            status: 'CONFIRMED',
        };

        // Persist to MongoDB if model is available, otherwise fallback to in-memory
        if (this.bookingModel) {
            // If userId is a string, convert to ObjectId
            if (booking.userId && typeof booking.userId === 'string') {
                booking.userId = new (require('mongoose').Types.ObjectId)(booking.userId);
            }
            const created = await this.bookingModel.create(booking as any);
            return created.toObject();
        }

        this.bookings.push(booking);
        return booking;
    }

    async getBookingsForUser(userId: string) {
        if (this.bookingModel) {
            return this.bookingModel.find({ userId }).lean();
        }
        return this.bookings.filter((b) => b.userId === userId);
    }
}
