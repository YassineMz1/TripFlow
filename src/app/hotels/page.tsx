"use client";
import { useState } from "react";
import { searchHotels, bookHotel, Hotel } from "@/lib/hotels-api";

export default function HotelsPage() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHotels([]);
    setBooked(null);
    try {
      const results = await searchHotels({ city, checkIn, checkOut, guests });
      setRawResponse(results);
      setHotels(results);
    } catch (err: any) {
      // Provide detailed message; preserve original error for logs
      const msg = err?.message || "Failed to fetch hotels";
      setError(msg);
      console.error("searchHotels error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Direct programmatic search helper used by Quick sample button (avoids relying on form dispatch)
  const quickSearch = async (cityValue: string) => {
    setLoading(true);
    setError(null);
    setHotels([]);
    setBooked(null);
    try {
      const results = await searchHotels({ city: cityValue, checkIn, checkOut, guests });
      setRawResponse(results);
      setHotels(results);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch hotels';
      setError(msg);
      console.error('quickSearch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (hotel: Hotel) => {
    setBooking(hotel.id);
    setError(null);
    try {
      await bookHotel(hotel.id, { checkIn, checkOut, guests });
      setBooked(hotel.id);
    } catch (err: any) {
      setError(err.message || "Booking failed");
    } finally {
      setBooking(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] pt-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--foreground)" }}>Find Hotels</h1>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-[var(--surface)] p-6 rounded-2xl shadow">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
            required
          />
          <input
            type="date"
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
            required
          />
          <input
            type="date"
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
            required
          />
          <input
            type="number"
            min={1}
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-[var(--input-bg)] text-[var(--foreground)]"
            required
          />
          <button
            type="submit"
            className="md:col-span-4 mt-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {error && (
          <div className="mb-4 text-red-600">
            <div className="font-semibold">{error.split('\n')[0]}</div>
            <div className="text-sm text-red-400 mt-1">If this persists, check your API base URL and backend status.</div>
            <div className="mt-2 flex gap-2">
              <button
                className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold"
                onClick={() => {
                  setError(null);
                  // retry last search
                  (document.querySelector('form') as HTMLFormElement | null)?.dispatchEvent(new Event('submit', { cancelable: true }));
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hotels.map((hotel) => {
            // Normalize price display — some providers return { amount, currency } while others return a number and a separate currency field
            let priceText = "";
            try {
              if (hotel && typeof hotel.price === "object" && hotel.price !== null) {
                const amt = (hotel.price as any).amount ?? (hotel.price as any).value ?? "";
                const cur = (hotel.price as any).currency ?? hotel.currency ?? "";
                priceText = `${amt}${cur ? ` ${cur}` : ""}`;
              } else {
                const amt = hotel.price ?? "";
                const cur = hotel.currency ?? "";
                priceText = `${amt}${cur ? ` ${cur}` : ""}`;
              }
            } catch (e) {
              priceText = String((hotel as any).price ?? "");
            }

            return (
              <div key={hotel.id} className="rounded-2xl shadow bg-[var(--surface)] p-6 flex flex-col">
                {hotel.image && (
                  <img src={hotel.image} alt={hotel.name} className="rounded-xl mb-4 w-full h-40 object-cover" />
                )}
                <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{hotel.name}</h2>
                <div className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>
                  {hotel.address}, {hotel.city}, {hotel.country}
                </div>
                <div className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>{priceText}</div>
                {hotel.description && (
                  <div className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>{hotel.description}</div>
                )}
                <button
                  className={`mt-auto bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors ${booking === hotel.id ? 'opacity-60' : ''}`}
                  onClick={() => handleBook(hotel)}
                  disabled={booking === hotel.id || booked === hotel.id}
                >
                  {booked === hotel.id ? "Booked!" : booking === hotel.id ? "Booking..." : "Book"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-6 mb-6 flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-black font-semibold"
            onClick={() => {
              // quick sample search — call search directly so we can see results immediately
              const inDate = new Date().toISOString().slice(0,10);
              const outDate = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10);
              setCity('Paris');
              setCheckIn(inDate);
              setCheckOut(outDate);
              quickSearch('Paris');
            }}
          >
            Quick sample search (Paris)
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-black font-semibold"
            onClick={() => setShowRaw((s) => !s)}
          >
            {showRaw ? 'Hide' : 'Show'} raw response
          </button>
        </div>
        {showRaw && (
          <pre className="mt-6 p-4 bg-black text-white rounded max-w-3xl overflow-auto" style={{whiteSpace: 'pre-wrap'}}>
            {JSON.stringify(rawResponse ?? { message: 'no response yet' }, null, 2)}
          </pre>
        )}
        {hotels.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-12">No hotels found. Try searching for a different city.</div>
        )}
      </div>
    </main>
  );
}
