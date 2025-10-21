"use client";
import React, { useState, useEffect, useRef } from "react";
import { searchHotels, bookHotel, fetchRandomHotels, Hotel } from "@/lib/hotels-api";

export default function HotelsPage() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
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
      const withPhotos = (results ?? []).filter((h: Hotel) => {
        if (!h) return false;
        const img = (h as any).images ?? (h as any).photos ?? (h as any).image;
        if (!img) return false;
        if (Array.isArray(img)) return img.length > 0;
        return String(img).trim().length > 0;
      });
      setHotels(withPhotos);
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch hotels";
      setError(msg);
      console.error("searchHotels error:", err);
    } finally {
      setLoading(false);
    }
  };

    function Modal({ selected, onClose, onBook, booking, booked }: {
      selected: Hotel;
      onClose: () => void;
      onBook: (hotel: Hotel) => Promise<void> | void;
      booking: string | null;
      booked: string | null;
    }) {
      const images: string[] = Array.isArray((selected as any).images) ? (selected as any).images : ((selected as any).image ? [(selected as any).image] : []);
      const [index, setIndex] = useState(0);
      const overlayRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        overlayRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, images.length - 1));
          if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', onKey);
        return () => {
          window.removeEventListener('keydown', onKey);
          document.body.style.overflow = prev;
        };
      }, [images.length, onClose]);

      const setActive = (i: number) => setIndex(i);

      const priceText = (() => {
        try {
          if (selected && typeof selected.price === 'object' && selected.price !== null) {
            const amt = (selected.price as any).amount ?? (selected.price as any).value ?? '';
            const cur = (selected.price as any).currency ?? (selected as any).currency ?? '';
            return `${amt}${cur ? ` ${cur}` : ''}`;
          }
          return `${selected.price ?? ''}${selected.currency ? ` ${selected.currency}` : ''}`;
        } catch (e) { return String((selected as any).price ?? ''); }
      })();

      return (
        <div ref={overlayRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-6xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-3" onClick={onClose}>
            <div className="md:col-span-2" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full h-72 md:h-96 bg-black">
                {images[index] ? (
                  <img src={images[index]} alt={`${selected.name} photo ${index+1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center">✕</button>
                <div className="absolute left-4 bottom-4">
                  <h3 className="text-white text-xl md:text-2xl font-bold drop-shadow">{selected.name}</h3>
                  <div className="text-sm text-white/90 mt-1">{(selected as any).address}{(selected as any).city ? ` · ${(selected as any).city}` : ''}</div>
                </div>
              </div>
              {images.length > 1 && (
                <div className="px-4 py-3 flex gap-2 overflow-x-auto">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setActive(i)} className={`flex-none rounded-lg overflow-hidden border-2 ${i === index ? 'border-blue-500' : 'border-transparent'}`}>
                      <img src={src} alt={`${selected.name} thumb ${i+1}`} className="w-28 h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[var(--muted-foreground)]">{(selected as any).category ?? 'Hotel'}</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{priceText}</div>
                </div>
              </div>
              {(selected as any).description && <div className="text-sm text-[var(--muted-foreground)]">{(selected as any).description}</div>}
              <div className="mt-auto">
                <button className="w-full bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700" onClick={() => onBook(selected)} disabled={booking === selected.id}>
                  {booked === selected.id ? 'Booked!' : booking === selected.id ? 'Booking...' : 'Book'}
                </button>
                <button className="w-full mt-3 bg-gray-100 px-4 py-3 rounded-xl" onClick={onClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  const quickSearch = async (cityValue: string) => {
    setLoading(true);
    setError(null);
    setHotels([]);
    setBooked(null);
    try {
      const results = await searchHotels({ city: cityValue, checkIn, checkOut, guests });
      setRawResponse(results);
      const withPhotos = (results ?? []).filter((h: Hotel) => {
        if (!h) return false;
        const img = (h as any).images ?? (h as any).photos ?? (h as any).image;
        if (!img) return false;
        if (Array.isArray(img)) return img.length > 0;
        return String(img).trim().length > 0;
      });
      setHotels(withPhotos);
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

  const openHotel = (hotel: Hotel) => setSelectedHotel(hotel);
  const closeModal = () => setSelectedHotel(null);

  // On mount, perform a random search if the user hasn't submitted a search yet
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const results = await fetchRandomHotels();
        if (!mounted) return;
        const withPhotos = (results ?? []).filter((h: Hotel) => {
          if (!h) return false;
          const img = (h as any).images ?? (h as any).photos ?? (h as any).image;
          if (!img) return false;
          if (Array.isArray(img)) return img.length > 0;
          return String(img).trim().length > 0;
        });
        setHotels(withPhotos);
      } catch (err) {
        // silently ignore random search failures (user can search manually)
        console.warn('Random hotels fetch failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
            const imgSrc = Array.isArray((hotel as any).images) ? (hotel as any).images[0] : (hotel as any).image;
            return (
              <div key={hotel.id} className="overflow-hidden rounded-2xl shadow-lg bg-[var(--surface)] cursor-pointer" onClick={() => openHotel(hotel)}>
                <div className="relative w-full h-56 md:h-72 lg:h-80">
                  {imgSrc ? (
                    <img src={imgSrc} alt={hotel.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
                  <div className="absolute left-4 bottom-4 right-4">
                    <h3 className="text-white text-lg md:text-xl font-semibold drop-shadow-lg truncate">{hotel.name}</h3>
                    {hotel.city && <div className="text-sm text-white/90 mt-1 truncate">{hotel.city}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedHotel && (
          <Modal selected={selectedHotel} onClose={closeModal} onBook={handleBook} booking={booking} booked={booked} />
        )}
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

                        
                 