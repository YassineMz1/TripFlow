"use client";
import { useState } from "react";

export default function BudgetControl() {
  const [form, setForm] = useState({
    totalBudget: "",
    travelDays: "",
    destinationType: "beach",
    currency: "EUR",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/budget-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: Number(form.totalBudget),
          travelDays: Number(form.travelDays),
          destinationType: form.destinationType,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const round = (num: number) => Math.round(num);

  // Generate booking.com search URL dynamically
  const generateBookingUrl = (destination: string) => {
    const today = new Date();
    const checkIn = today.toISOString().split("T")[0];

    const checkOutDate = new Date(today);
    checkOutDate.setDate(today.getDate() + Number(form.travelDays || 3));
    const checkOut = checkOutDate.toISOString().split("T")[0];

    const guests = 2;
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      destination
    )}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&selected_currency=${
      form.currency
    }`;
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-6">
      <div className="max-w-4xl mx-auto bg-[var(--surface)] shadow-lg rounded-3xl p-8 border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-center mb-8">💳 Budget Optimizer</h1>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-1">Total Budget (€)</label>
            <input
              name="totalBudget"
              type="number"
              placeholder="Total Budget (€)"
              value={form.totalBudget}
              onChange={handleChange}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Number of Days</label>
            <input
              name="travelDays"
              type="number"
              placeholder="Number of Days"
              value={form.travelDays}
              onChange={handleChange}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Destination Type</label>
            <select
              name="destinationType"
              value={form.destinationType}
              onChange={handleChange}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none [&>option]:bg-[var(--surface)] [&>option]:text-[var(--foreground)]"
              style={{ colorScheme: 'light dark' }}
            >
              <option value="beach" className="bg-[var(--surface)] text-[var(--foreground)]">🏖️ Beach</option>
              <option value="adventure" className="bg-[var(--surface)] text-[var(--foreground)]">⛰️ Adventure</option>
              <option value="culture" className="bg-[var(--surface)] text-[var(--foreground)]">🏛️ Culture</option>
              <option value="nature" className="bg-[var(--surface)] text-[var(--foreground)]">🌿 Nature</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none [&>option]:bg-[var(--surface)] [&>option]:text-[var(--foreground)]"
              style={{ colorScheme: 'light dark' }}
            >
              <option value="EUR" className="bg-[var(--surface)] text-[var(--foreground)]">Euro (€)</option>
              <option value="USD" className="bg-[var(--surface)] text-[var(--foreground)]">Dollar ($)</option>
              <option value="GBP" className="bg-[var(--surface)] text-[var(--foreground)]">Pound (£)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
        >
          {loading ? "Calculating..." : "Generate Plan"}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">📊 Results</h2>

            {/* Overall Budget */}
            <div className="bg-[var(--surface-muted)] p-6 rounded-2xl mb-6 shadow-inner border border-[var(--border)]">
              <p className="text-lg">
                <strong>Total Budget:</strong> {round(result.totalBudget)} {result.currency}
              </p>
              <p className="text-lg">
                <strong>Daily Budget:</strong> {round(result.dailyBudget)} {result.currency}
              </p>

              {/* Allocation bars */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Allocation</h3>
                {Object.entries(result.allocation || {}).map(([k, v]) => (
                  <div key={k} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{k}</span>
                      <span>{round(v as number)} {result.currency}</span>
                    </div>
                    <div className="w-full bg-[var(--surface)] border border-[var(--border)] h-3 rounded-full">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${result.dailyBudget ? Math.min(100, Math.round(((v as number) / result.dailyBudget) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <h3 className="text-xl font-bold mb-4">Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {result.suggestions?.map((s: any, i: number) => {
                const bookingLink = generateBookingUrl(s.name);
                return (
                  <div
                    key={i}
                    className="bg-[var(--surface)] p-4 rounded-xl shadow-md border border-[var(--border)] flex flex-col justify-between hover:shadow-lg transition"
                  >
                    <h4 className="font-bold text-lg mb-2">{s.name}</h4>

                    {s.weather && (
                      <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                        <p>🌡 Temperature: {s.weather.temperature}°C</p>
                        <p>☁ Condition: {s.weather.condition}</p>
                        <p>💨 Wind Speed: {s.weather.windspeed} km/h</p>
                        <p>🌬 Wind Direction: {s.weather.winddirection}°</p>
                        <p>💧 Humidity: {s.weather.humidity ?? "N/A"}%</p>
                        <p>🌧 Precipitation: {s.weather.precipitation ?? "N/A"} mm</p>
                      </div>
                    )}

                    <div className="mt-3 text-sm text-[var(--muted-foreground)]">
                      Daily Budget: {round(result.dailyBudget)} {result.currency}
                    </div>

                    {/* Booking.com Button */}
                    <a
                      href={bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block bg-blue-500 text-white text-center py-2 rounded-xl hover:bg-blue-600 transition font-semibold"
                    >
                      🔗 Find Hotels on Booking.com
                    </a>

                    {/* Google Flights Button */}
                    <a
                      href={result.flightUrl} // link from backend
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block bg-orange-500 text-white text-center py-2 rounded-xl hover:bg-orange-600 transition font-semibold"
                    >
                      ✈️ Search Flights on Google Flights
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}