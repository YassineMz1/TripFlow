/** @type {import('next').NextConfig} */
const runtimeCaching = [
  // Navigation handler: try network first, then fall back to cached app shell (/) when offline
  {
    urlPattern: /\/[^?]*$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-shell-v1',
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 50 },
    },
  },
  {
    urlPattern: /^\/_next\//i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'nextjs-static-v1',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^\/icons\//i,
    handler: 'CacheFirst',
    options: { cacheName: 'icons-v1', expiration: { maxEntries: 50 } },
  },
  {
    urlPattern: /\/api\//i,
    handler: 'NetworkFirst',
    options: { cacheName: 'api-v1' },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg)$/i,
    handler: 'CacheFirst',
    options: { cacheName: 'images-v1', expiration: { maxEntries: 200 } },
  },
];

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Precache only the main app shell pages we want available offline
  additionalManifestEntries: [
    { url: '/', revision: null },
    { url: '/hotels', revision: null },
    { url: '/profile', revision: null },
  ],
  buildExcludes: [/marker-icon.*\\.png$/i],
  runtimeCaching,
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    'http://localhost:3001',
  ],
};

module.exports = withPWA(nextConfig);