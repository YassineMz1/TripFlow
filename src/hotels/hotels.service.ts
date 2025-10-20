import { Injectable, Logger, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RapidApiProvider } from './providers/rapidapi.provider';
import { BookHotelDto } from './dto/book-hotel.dto';
import { Booking, BookingDocument } from './schemas/booking.schema';

@Injectable()
export class HotelsService {
    private logger = new Logger(HotelsService.name);
    private bookings: any[] = []; // in-memory bookings store

    constructor(
        private rapidapi: RapidApiProvider,
        @InjectModel(Booking.name) private bookingModel?: Model<BookingDocument>,
    ) { }

    // Diagnostic helper: report which providers are configured and available
    async diagnose() {
        const rapidConfigured = typeof this.rapidapi.isConfigured === 'function' ? this.rapidapi.isConfigured() : false;
        return {
            providers: {
                rapidapi: rapidConfigured,
            },
        };
    }

        // Call RapidAPI provider debug endpoint and return the raw response (for debugging only)
        async rapidapiDebug(query: any) {
            if (typeof this.rapidapi.searchHotels !== 'function') {
                return { ok: false, error: 'RapidAPI search not available' };
            }
            try {
                const res = await this.rapidapi.searchHotels(query);
                return { ok: true, data: res };
            } catch (err) {
                return { ok: false, error: err };
            }
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

        // Call RapidAPI directly and return its results; if it fails, return an informative object
        const rapidRes = await this.rapidapi.searchHotels(normalizedQuery);
        let results: any[] = [];
        if (rapidRes) {
            if (Array.isArray(rapidRes)) {
                results = rapidRes;
            } else if (rapidRes?.data) {
                results = rapidRes.data;
            } else {
                results = rapidRes?.hotels || rapidRes?.results || rapidRes?.items || [];
            }
        } else {
            this.logger.error('RapidAPI provider failed or returned null');
            // Return empty array with diagnostic info in raw field so frontend can show an error
            return [{ id: 'error-rapidapi', name: 'RapidAPI error', priceAmount: 0, priceCurrency: 'USD', priceString: '0 USD', images: [], raw: { error: 'RapidAPI provider failed or returned null' } }];
        }

        // Final normalization: always provide a string price and amount/currency fields so frontends can safely render
        return results.map((item) => {
            const priceObj = item.price || {};
            // Attempt to pull amount from several common shapes
            const amount = priceObj.amount ?? priceObj.total ?? priceObj.value ?? priceObj.price ?? 0;
            const currency = priceObj.currency ?? priceObj.currencyCode ?? 'USD';
            const priceAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
            const priceCurrency = currency;
            const priceString = `${priceAmount} ${priceCurrency}`;

            return {
                id: item.id,
                name: item.name,
                rating: item.rating,
                price: priceObj,
                priceAmount,
                priceCurrency,
                priceString,
                images: item.images || [],
                raw: item.raw || item,
            };
        });
    }

    async book(bookDto: BookHotelDto) {
    const hotel = (await this.rapidapi.getHotelById ? this.rapidapi.getHotelById(bookDto.hotelId) : null);
        if (!hotel) throw new Error('Hotel not found');

        const booking = {
            bookingId: `bkg-${Date.now()}`,
            hotelId: bookDto.hotelId,
            checkin: bookDto.checkin,
            checkout: bookDto.checkout,
            adults: bookDto.adults,
            rooms: bookDto.rooms,
            userId: bookDto.userId || null,
            createdAt: new Date(),
            status: 'CONFIRMED',
        };

        // Persist to MongoDB if model is available, otherwise fallback to in-memory
        if (this.bookingModel) {
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
