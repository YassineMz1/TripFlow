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
    if (!form.totalBudget || !form.travelDays) {
      alert("Please fill in both Total Budget and Number of Days.");
      return;
    }
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

  return (
    <main className="min-h-screen py-12 px-4 flex items-center justify-center bg-white dark:bg-[#10131a]" style={{ background: 'var(--background)' }}>
  <div className="w-full max-w-2xl bg-[#f8fafc] dark:bg-[#181c24] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-0" style={{ color: 'var(--foreground)' }}>
        {/* Gradient header with icon */}
        <div className="rounded-t-2xl bg-gradient-to-r from-[#6BD3FF] to-[#2EA7D9] px-8 py-6 flex items-center gap-3 justify-center">
          <span className="text-4xl">💳</span>
          <span className="text-2xl font-bold text-white drop-shadow">Budget Optimizer</span>
        </div>

        {/* Form */}
  <div className="px-8 py-8 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Total Budget (€)</label>
            <input
              name="totalBudget"
              type="number"
              placeholder="Total Budget (€)"
              value={form.totalBudget}
              onChange={handleChange}
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-[#23283a] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Number of Days</label>
            <input
              name="travelDays"
              type="number"
              placeholder="Number of Days"
              value={form.travelDays}
              onChange={handleChange}
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-[#23283a] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Destination Type</label>
            <select
              name="destinationType"
              value={form.destinationType}
              onChange={handleChange}
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-[#23283a] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <option value="beach">🏖️ Beach</option>
              <option value="adventure">⛰️ Adventure</option>
              <option value="culture">🏛️ Culture</option>
              <option value="nature">🌿 Nature</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-[#23283a] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
              <option value="GBP">Pound (£)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-[#6BD3FF] to-[#2EA7D9] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:from-[#5BC2E7] hover:to-[#1E8AC7] transition dark:from-blue-700 dark:to-indigo-900"
        >
          {loading ? "Calculating..." : "Generate Plan"}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">📊 Results</h2>

            {/* Overall Budget */}
            <div className="bg-gray-100 dark:bg-[#23283a] p-6 rounded-2xl mb-6 shadow-inner">
              <p className="text-lg text-gray-900 dark:text-gray-100"><strong>Total Budget:</strong> {round(result.totalBudget)} {result.currency}</p>
              <p className="text-lg text-gray-900 dark:text-gray-100"><strong>Daily Budget:</strong> {round(result.convertedDailyBudget)} {result.currency}</p>

              {/* Allocation bars */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Allocation</h3>
                {Object.entries(result.allocation || {}).map(([k, v]) => (
                  <div key={k} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{k}</span>
                      <span className="text-gray-700 dark:text-gray-300">{round(v as number)} {result.currency}</span>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 h-3 rounded-full">
                      <div
                        className="bg-blue-500 dark:bg-blue-700 h-3 rounded-full"
                        style={{ width: `${((v as number) / result.convertedDailyBudget) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {result.suggestions?.map((s: any, i: number) => (
                <div key={i} className="bg-white dark:bg-[#181c24] p-4 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition">
                  <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{s.name}</h4>

                  {s.weather && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <p>🌡 Temperature: {s.weather.temperature}°C</p>
                      <p>☁ Condition: {s.weather.condition}</p>
                      <p>💨 Wind: {s.weather.windSpeed} km/h</p>
                      <p>💧 Humidity: {s.weather.humidity}%</p>
                      <p>🌧 Chance of rain: {s.weather.precipitation}%</p>
                    </div>
                  )}

                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Daily Budget: {round(result.convertedDailyBudget)} {result.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
