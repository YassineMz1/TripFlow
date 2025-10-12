This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. **Backend API** - This frontend requires a backend API to be running. 
   - Default backend URL: `http://localhost:3000`
   - Configure in `.env.local` (see Configuration section below)
   - Make sure your backend has CORS enabled for `http://localhost:3001` (Next.js dev port)

2. **Node.js** - Version 18 or higher recommended

### Running the Frontend

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.
(Note: Port 3001 is used if 3000 is taken by the backend)

## Configuration

Create a `.env.local` file in the root directory:

```env
# Backend API URL - update this to match your backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# If backend is on different port:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Troubleshooting

### "Failed to fetch" error on profile page

This means the backend API is not running or not accessible. To fix:

1. **Start your backend server** on the configured port (default: 3000)
2. **Check CORS settings** - Backend must allow requests from `http://localhost:3001`
3. **Verify API_BASE_URL** in `.env.local` matches your backend URL
4. **Check backend endpoints** are responding:
   - `GET /user/getProfileByUserId/:id`
   - `PUT /user/updateProfile/:id`
   - `GET /user/auth/google`

### Backend CORS Configuration Example

Your backend should include CORS headers like:
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
