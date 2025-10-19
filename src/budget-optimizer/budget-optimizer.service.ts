import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class BudgetOptimizerService {
  async optimizeBudget(totalBudget: number, travelDays: number, destinationType: string, currency: string) {
    // Basic calculations
    const dailyBudget = totalBudget / travelDays;

    const allocation = {
  hotel: Math.round(dailyBudget * 0.4),
  transport: Math.round(dailyBudget * 0.2),
  food: Math.round(dailyBudget * 0.25),
  activities: Math.round(dailyBudget * 0.15),
};

const roundedDailyBudget = Math.round(dailyBudget);


    // Destination suggestions by type
    const destinations: Record<string, string[]> = {
  beach: [
    'Barcelona', 'Nice', 'Lisbon', 'Bali', 'Phuket', 'Maldives', 'Miami', 
    'Cancun', 'Gold Coast', 'Santorini', 'Ibiza', 'Maui'
  ],
  adventure: [
    'Chamonix', 'Queenstown', 'Banff', 'Interlaken', 'Patagonia', 'Nepal',
    'Costa Rica', 'Iceland', 'Dolomites', 'Himalayas', 'New Zealand Alps'
  ],
  culture: [
    'Rome', 'Kyoto', 'Paris', 'Istanbul', 'Athens', 'Cairo', 'Beijing',
    'Prague', 'Budapest', 'Marrakech', 'Mexico City', 'Seoul'
  ],
  nature: [
    'Reykjavik', 'Banff', 'Zurich', 'Lake Tahoe', 'Yellowstone', 'Amazon Rainforest',
    'Patagonia', 'Norwegian Fjords', 'Canadian Rockies', 'Seychelles', 'New Zealand'
  ],
};


    const selected = destinations[destinationType] || ['Barcelona', 'Rome'];

    // Fetch weather for each suggested city
    const weatherData = await Promise.all(
      selected.map(async (city) => {
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
          );
          const geoData = await geoRes.json();

          if (!geoData.results || geoData.results.length === 0) {
            return { name: city, weather: null };
          }

          const { latitude, longitude } = geoData.results[0];

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
          );
          const weatherJson = await weatherRes.json();

          const weather = weatherJson.current_weather
            ? {
                temperature: weatherJson.current_weather.temperature,
                condition: weatherJson.current_weather.weathercode,
              }
            : null;

          return { name: city, weather };
        } catch (err) {
          console.error(`Error fetching weather for ${city}:`, err);
          return { name: city, weather: null };
        }
      }),
    );

    return {
      totalBudget,
      travelDays,
      roundedDailyBudget,
      allocation,
      suggestions: weatherData,
      currency,
      convertedDailyBudget: dailyBudget,
    };
  }
}
