import { NextResponse } from 'next/server';

/**
 * POST /api/hotels/book
 * Accepts { hotelId, checkIn, checkOut, guests }
 * If RapidAPI booking endpoint configured via env vars, forward the request.
 * Otherwise, return a mock booking confirmation.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { hotelId, checkIn, checkOut, guests } = body || {};

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
    const RAPIDAPI_BOOK_PATH = process.env.RAPIDAPI_BOOK_PATH; // optional
    const RAPIDAPI_METHOD = (process.env.RAPIDAPI_METHOD || 'POST').toUpperCase();

    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST || !RAPIDAPI_BOOK_PATH) {
      // Return a mock booking response
      const bookingId = `mock_${Math.random().toString(36).slice(2, 9)}`;
      return NextResponse.json({ success: true, bookingId, hotelId, checkIn, checkOut, guests });
    }

    const url = `https://${RAPIDAPI_HOST}${RAPIDAPI_BOOK_PATH}`;
    const opts: any = {
      method: RAPIDAPI_METHOD,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      body: JSON.stringify({ hotelId, checkIn, checkOut, guests }),
    };

    const r = await fetch(url, opts);
    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json({ error: 'Upstream booking error', status: r.status, body: text }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { raw: text };
    }

    // Try to return a consistent shape
    return NextResponse.json({ success: true, providerResponse: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: 'Booking route error', message: String(err) }, { status: 500 });
  }
}
