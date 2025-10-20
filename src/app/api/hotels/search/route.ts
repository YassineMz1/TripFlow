import { NextResponse } from "next/server";

type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  price: number | { amount?: number | string; currency?: string } | null;
  currency: string;
  image?: string;
  description?: string;
};

const SAMPLE_HOTELS: Hotel[] = [
  {
    id: "h-nyc-001",
    name: "Skyline Central Hotel",
    address: "123 Main St",
    city: "Sample City",
    country: "Wonderland",
    price: 129,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e2f4a7d1b1?auto=format&fit=crop&w=800&q=60",
    description: "Comfortable downtown hotel with a rooftop view.",
  },
  {
    id: "h-nyc-002",
    name: "Harborview Suites",
    address: "88 Harbor Rd",
    city: "Sample City",
    country: "Wonderland",
    price: 189,
    currency: "USD",
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=60",
    description: "Modern suites near the water and transport links.",
  },
];

/**
 * Helper: normalize many provider shapes into the frontend canonical shape.
 * We intentionally keep this logic server-side so the frontend receives a clean shape.
 */
function normalizeHotelsResponse(raw: any): Hotel[] {
  if (!raw) return [];

  let list = raw;
  if (raw.data && Array.isArray(raw.data)) list = raw.data;
  else if (raw.hotels && Array.isArray(raw.hotels)) list = raw.hotels;
  else if (raw.results && Array.isArray(raw.results)) list = raw.results;
  else if (Array.isArray(raw)) list = raw;

  if (!Array.isArray(list)) return [];

  return list.map((h: any) => {
    const id = String(h.id ?? h.hotelId ?? h.property_id ?? h.propertyId ?? h.location?.id ?? `${h.name ?? 'hotel'}-${Math.random().toString(36).slice(2,8)}`);
    const name = String(h.name ?? h.title ?? h.hotelName ?? h.property_name ?? "");
    const address = String(h.address ?? h.location?.address ?? (h.address_lines ? h.address_lines.join(', ') : '') ?? "");
    const city = String(h.city ?? h.location?.city ?? h.address_locality ?? "");
    const country = String(h.country ?? h.location?.country ?? h.countryCode ?? "");
    const image = h.image ?? h.images?.[0] ?? h.thumbnail ?? h.photo ?? "";
    const description = h.description ?? h.summary ?? h.long_description ?? "";

    let price: any = null;
    let currency: string = h.currency ?? h.currencyCode ?? h.ccy ?? "";

    if (h.price && typeof h.price === 'object') {
      price = h.price.amount ?? h.price.value ?? h.price;
      currency = currency || h.price.currency || "";
      // keep original object if it contains more info
      price = h.price;
    } else if (h.rate && typeof h.rate === 'object') {
      price = h.rate.amount ?? h.rate;
      currency = currency || h.rate.currency || "";
    } else if (typeof h.price === 'number' || typeof h.price === 'string') {
      price = h.price;
    } else if (typeof h.total === 'number' || typeof h.total === 'string') {
      price = h.total;
    } else {
      const amt = h.price?.amount ?? h.total?.amount ?? h.rate?.amount ?? h.price_amount ?? null;
      if (amt !== null && amt !== undefined) price = amt;
    }

    return {
      id,
      name,
      address,
      city,
      country,
      price,
      currency: String(currency || ""),
      image: image || undefined,
      description: description || undefined,
    } as Hotel;
  });
}

/**
 * POST /api/hotels/search
 * - If RAPIDAPI_* env vars are configured, forward the query to the provider
 * - Otherwise, return a small SAMPLE_HOTELS mock (helpful for local dev)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { city, checkIn, checkOut, guests } = body || {};

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
    const RAPIDAPI_SEARCH_PATH = process.env.RAPIDAPI_SEARCH_PATH; // e.g. /v1/hotels/search
    const RAPIDAPI_METHOD = (process.env.RAPIDAPI_METHOD || 'GET').toUpperCase();

    // If provider not configured, fall back to local mock
    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST || !RAPIDAPI_SEARCH_PATH) {
      // support a simple city filter like the previous mock
      const results = city
        ? SAMPLE_HOTELS.filter((h) => h.city.toLowerCase().includes(String(city).toLowerCase()))
        : SAMPLE_HOTELS;
      return NextResponse.json(results);
    }

    // Build provider URL — many RapidAPI providers want the Host header and accept query params
    const url = `https://${RAPIDAPI_HOST}${RAPIDAPI_SEARCH_PATH}`;

    // Construct query or body depending on method
    let fetchUrl = url;
    let fetchOptions: any = {
      method: RAPIDAPI_METHOD,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    };

    if (RAPIDAPI_METHOD === 'GET') {
      const qp = new URLSearchParams();
      if (city) qp.set('city', String(city));
      if (checkIn) qp.set('checkIn', String(checkIn));
      if (checkOut) qp.set('checkOut', String(checkOut));
      if (guests !== undefined && guests !== null) qp.set('guests', String(guests));
      fetchUrl = `${url}?${qp.toString()}`;
    } else {
      fetchOptions.body = JSON.stringify({ city, checkIn, checkOut, guests });
    }

    const r = await fetch(fetchUrl, fetchOptions);
    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json({ error: 'Upstream provider error', status: r.status, body: text }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Some providers return text — just pass through as single item
      parsed = text;
    }

    const normalized = normalizeHotelsResponse(parsed);
    return NextResponse.json(normalized);
  } catch (err: any) {
    return NextResponse.json({ error: 'Hotels search error', message: String(err) }, { status: 500 });
  }
}

export async function GET() {
  // keep a simple GET for quick browser testing
  return NextResponse.json(SAMPLE_HOTELS);
}
