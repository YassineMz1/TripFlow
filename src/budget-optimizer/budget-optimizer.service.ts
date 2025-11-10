import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class BudgetOptimizerService {
  async optimizeBudget(
    totalBudget: number,
    travelDays: number,
    destinationType: string,
    currency: string,
  ) {
    const dailyBudget = totalBudget / travelDays;

    const allocation = {
      hotel: Math.round(dailyBudget * 0.4),
      transport: Math.round(dailyBudget * 0.2),
      food: Math.round(dailyBudget * 0.25),
      activities: Math.round(dailyBudget * 0.15),
    };

    const destinations: Record<string, string[]> = {
      beach: ['Barcelona', 'Nice', 'Lisbon', 'Bali', 'Phuket'],
      adventure: ['Chamonix', 'Queenstown', 'Banff', 'Interlaken', 'Patagonia'],
      culture: ['Rome', 'Kyoto', 'Paris', 'Istanbul', 'Athens'],
      nature: ['Reykjavik', 'Banff', 'Zurich', 'Lake Tahoe', 'Yellowstone'],
    };

    const selectedCities = destinations[destinationType] || ['Barcelona', 'Rome'];
    const topCity = selectedCities[0]; // You can randomize this later

    // Generate check-in and check-out dates
    const today = new Date();
    const checkin = today.toISOString().split('T')[0];
    const checkoutDate = new Date(today);
    checkoutDate.setDate(today.getDate() + travelDays);
    const checkout = checkoutDate.toISOString().split('T')[0];

    // ✅ Booking.com search URL
    const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      topCity,
    )}&checkin=${checkin}&checkout=${checkout}&selected_currency=${currency}&group_adults=1`;

    // ✅ Google Flights search URL (simpler and always works)
    // Example: https://www.google.com/flights?hl=en#flt=TUN.BCN.2025-11-10*TUN.BCN.2025-11-15
    const originCity = 'Tunis'; // You could make this dynamic later
    const googleFlightsUrl = `https://www.google.com/flights?hl=en#flt=${encodeURIComponent(
      originCity,
    )}.${encodeURIComponent(topCity)}.${checkin}*${encodeURIComponent(
      originCity,
    )}.${encodeURIComponent(topCity)}.${checkout}`;

    // Fetch weather data (optional)
    const weatherData = await Promise.all(
      selectedCities.map(async (city) => {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
          const geoData = await geoRes.json();

          if (!geoData.results?.length) return { name: city, weather: null };

          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const weatherJson = await weatherRes.json();

          return {
            name: city,
            weather: weatherJson.current_weather || null,
          };
        } catch {
          return { name: city, weather: null };
        }
      }),
    );

    return {
      totalBudget,
      travelDays,
      dailyBudget: Math.round(dailyBudget),
      allocation,
      topDestination: topCity,
      bookingUrl,
      flightUrl: googleFlightsUrl, // ✈️ Added Google Flights link
      suggestions: weatherData,
      currency,
    };
  }
}