import { withApiBase } from "./env";

// Module-level fetch with timeout helper used across API calls
const DEFAULT_TIMEOUT = 15000; // ms
async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`Request to ${String(input)} timed out after ${timeout}ms`);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  // provider/backend may return a primitive price or an object { amount, currency }
  price: number | { amount?: number | string; currency?: string } | null;
  currency: string;
  image?: string;
  description?: string;
};

export type SearchHotelsParams = {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export async function searchHotels(params: SearchHotelsParams): Promise<Hotel[]> {
  const backendUrl = withApiBase("/hotels/search");
  const fallbackUrl = "/api/hotels/search"; // local Next dev route

  // helper to call an endpoint and return response or throw network error
  // fetch with timeout helper
  const DEFAULT_TIMEOUT = 15000; // ms
  async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { ...(init || {}), signal: controller.signal });
      return res;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error(`Request to ${String(input)} timed out after ${timeout}ms`);
      throw err;
    } finally {
      clearTimeout(id);
    }
  }

  async function tryFetch(url: string, body: any) {
    try {
      const r = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
        credentials: "include",
      });
      return r;
    } catch (err: any) {
      // network-level error
      throw new Error(`Network error while fetching ${url}: ${err?.message || String(err)}`);
    }
  }

  let res: Response | null = null;
  let backendErr: string | null = null;

  // Try the configured backend first (if an API base is configured)
  if (backendUrl) {
    try {
      // Map frontend params to backend DTO expected by the NestJS controller
      const backendBody = {
        city: params.city,
        // backend expects lowercase keys: checkin/checkout and adults
        checkin: params.checkIn ?? (params as any).checkin,
        checkout: params.checkOut ?? (params as any).checkout,
        adults: params.guests ?? (params as any).adults,
      };

      const r = await tryFetch(backendUrl, backendBody);
      if (r.ok) {
        const json = await r.json().catch(() => null);
        return normalizeHotelsResponse(json);
      }
      const text = await r.text().catch(() => "");
      backendErr = `Backend ${r.status} ${r.statusText}${text ? ` - ${text}` : ""}`;
      console.warn(`searchHotels: backend failed: ${backendErr}`);
    } catch (err: any) {
      backendErr = err?.message || String(err);
      console.warn(`searchHotels: backend network error: ${backendErr}`);
    }
  } else {
    backendErr = "NEXT_PUBLIC_API_BASE_URL not configured";
    console.warn("searchHotels: no API base configured, will try local fallback");
  }

  // Try local Next.js dev API as a fallback (useful in development)
  try {
    const fb = await tryFetch(fallbackUrl, params);
    if (!fb.ok) {
      const text = await fb.text().catch(() => "");
      throw new Error(`Failed to fetch hotels: ${fb.status} ${fb.statusText}${text ? ` - ${text}` : ""}`);
    }
    const raw = await fb.json().catch(() => null);
    return normalizeHotelsResponse(raw);
  } catch (fbErr: any) {
    // both attempts failed — include details from backend attempt when available
    const finalMsg = fbErr?.message || String(fbErr);
    const combined = backendErr ? `${backendErr}; fallback: ${finalMsg}` : finalMsg;
    throw new Error(`Failed to fetch hotels: ${combined}`);
  }
}

// Convert many provider-specific hotel shapes into our canonical frontend Hotel[]
function normalizeHotelsResponse(raw: any): Hotel[] {
  if (!raw) return [];

  // Some providers or our backend may wrap results
  let list = raw;
  if (raw.data && Array.isArray(raw.data)) list = raw.data;
  else if (raw.hotels && Array.isArray(raw.hotels)) list = raw.hotels;
  else if (raw.results && Array.isArray(raw.results)) list = raw.results;
  else if (Array.isArray(raw)) list = raw;

  if (!Array.isArray(list)) return [];

  return list.map((h: any) => {
    const id = h.id ?? h.hotelId ?? h.property_id ?? h.propertyId ?? `${h.name ?? 'hotel'}-${Math.random().toString(36).slice(2,8)}`;
    const name = h.name ?? h.title ?? h.hotelName ?? h.property_name ?? '';
    const address = h.address ?? h.location?.address ?? (h.address_lines ? h.address_lines.join(', ') : '') ?? '';
    const city = h.city ?? h.location?.city ?? h.address_locality ?? '';
    const country = h.country ?? h.location?.country ?? h.countryCode ?? '';

    // prefer arrays of images if present
    const image = h.images?.[0] ?? h.image ?? h.thumbnail ?? h.photo ?? '';
    const description = h.description ?? h.summary ?? h.long_description ?? '';

    // If backend already returned priceAmount/priceCurrency/priceString, use those
    let price: any = null;
    let currency = '';
    if (h.priceAmount !== undefined || h.priceCurrency !== undefined || h.priceString !== undefined) {
      price = h.priceAmount ?? (h.price && (h.price.amount ?? h.price.value)) ?? null;
      currency = h.priceCurrency ?? (h.price && (h.price.currency ?? h.currency)) ?? (h.currency ?? '');
    } else {
      price = h.price ?? h.rate ?? h.total ?? null;
      currency = h.currency ?? h.price?.currency ?? h.rate?.currency ?? h.currencyCode ?? h.ccy ?? '';
      if (price && typeof price === 'object') {
        // leave object
      } else if (typeof price === 'number' || typeof price === 'string') {
        // primitive
      } else {
        const amt = h.price?.amount ?? h.total?.amount ?? h.rate?.amount ?? h.price_amount ?? null;
        if (amt !== null && amt !== undefined) price = amt;
      }
      if (!currency) currency = h.currency_code ?? h.price_currency ?? '';
    }

    return {
      id: String(id),
      name: String(name),
      address: String(address),
      city: String(city),
      country: String(country),
      price: (price && typeof price === 'object') ? price : (price !== null ? Number(price) : null),
      currency: String(currency),
      image: image || undefined,
      description: description || undefined,
    } as Hotel;
  });
}

export async function bookHotel(hotelId: string, data: { checkIn: string; checkOut: string; guests: number }) {
  // Backend expects POST /hotels/book with a JSON body containing hotelId and booking data
  const url = withApiBase(`/hotels/book`);
  let res: Response;
  try {
    // Map frontend booking shape to backend BookHotelDto expected fields:
    // frontend: checkIn/checkOut/guests -> backend: checkin/checkout/adults
    const body = {
      hotelId,
      checkin: (data as any).checkIn ?? (data as any).checkin,
      checkout: (data as any).checkOut ?? (data as any).checkout,
      adults: (data as any).guests ?? 1,
      rooms: (data as any).rooms ?? 1,
    };

    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
  } catch (err: any) {
    throw new Error(`Network error while booking hotel: ${err?.message || String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to book hotel: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
}

export async function fetchRandomHotels(limit: number = 0, photosOnly: boolean = true): Promise<Hotel[]> {
  // Use backend /hotels/all endpoint; limit=0 requests "no limit" (server will apply HARD_CAP).
  const q = `?limit=${encodeURIComponent(String(limit))}${photosOnly ? `&photosOnly=${encodeURIComponent(String(photosOnly))}` : ''}`;
  const backendUrl = withApiBase(`/hotels/all${q}`);
  // Local Next dev fallback: /api/hotels/all is not present, use /api/hotels/search instead
  const fallbackUrl = `/api/hotels/search`;

  async function tryFetch(url: string) {
    try {
      const r = await fetchWithTimeout(url, { method: 'GET', credentials: 'include' });
      return r;
    } catch (err: any) {
      throw new Error(`Network error while fetching ${url}: ${err?.message || String(err)}`);
    }
  }

  let backendErr: string | null = null;
  if (backendUrl) {
    try {
      const r = await tryFetch(backendUrl);
      if (r.ok) {
        const json = await r.json().catch(() => null);
        return normalizeHotelsResponse(json);
      }
      const text = await r.text().catch(() => '');
      backendErr = `Backend ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`;
      console.warn('fetchRandomHotels: backend failed:', backendErr);
    } catch (err: any) {
      backendErr = err?.message || String(err);
      console.warn('fetchRandomHotels: backend network error:', backendErr);
    }
  }

  try {
    const fb = await tryFetch(fallbackUrl);
    if (!fb.ok) {
      const text = await fb.text().catch(() => '');
      throw new Error(`Failed to fetch random hotels: ${fb.status} ${fb.statusText}${text ? ` - ${text}` : ''}`);
    }
    const raw = await fb.json().catch(() => null);
    return normalizeHotelsResponse(raw);
  } catch (fbErr: any) {
    const finalMsg = fbErr?.message || String(fbErr);
    const combined = backendErr ? `${backendErr}; fallback: ${finalMsg}` : finalMsg;
    throw new Error(`Failed to fetch random hotels: ${combined}`);
  }
}
