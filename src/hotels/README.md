Hotels module

Endpoints:
- GET /hotels/search?city=PARIS&checkin=2025-10-20&checkout=2025-10-22&adults=2
- POST /hotels/search  { city, checkin, checkout, adults, rooms }
- POST /hotels/book  { hotelId, checkin, checkout, adults, rooms, userId? }
- GET /hotels/bookings/:userId

Providers supported (choose/configure via env):
- RapidAPI (recommended for broader global coverage): set RAPIDAPI_HOST and RAPIDAPI_KEY and optionally RAPIDAPI_PATH and RAPIDAPI_METHOD

Quick start
1) Install dependencies

```powershell
npm install
npm install axios
```

2) Start backend in dev:

```powershell
npm run start:dev
```

3) Set env variables for providers as needed (e.g., in .env):

```
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
RAPIDAPI_HOST=example-rapidapi-host.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_PATH=/properties/v2/list
RAPIDAPI_METHOD=GET
```

<!-- Mock provider removed. -->

Notes
- The RapidAPI provider is a simple adapter that will work with many RapidAPI hotel endpoints; check the target host's API docs for required parameters. You may need to adjust `RAPIDAPI_PATH` or send a POST body depending on the host.
- Bookings are persisted to MongoDB if available (uses the app's configured mongoose connection); otherwise booking data is stored in-memory as a fallback.

If you want me to wire a specific provider (e.g., Hotelbeds, Expedia/Expedia RapidAPI, or direct Hotelbeds contract) I can implement the exact request/response mapping if you provide the host and sample API contract or I can integrate with Amadeus more fully.
