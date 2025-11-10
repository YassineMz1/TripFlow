/** @type {import('next').NextConfig} */
const runtimeCaching = [
  // Navigation handler: ALWAYS try cache first for navigation, then network
  {
    urlPattern: ({request}: any) => request.mode === 'navigate',
    handler: 'CacheFirst',
    options: {
      cacheName: 'pages-cache-v1',
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
    },
  },
  {
    urlPattern: /^\/_next\/static\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'nextjs-static-v1',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^\/_next\/image\?/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'nextjs-images-v1',
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
    options: { 
      cacheName: 'api-v1',
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    handler: 'CacheFirst',
    options: { cacheName: 'images-v1', expiration: { maxEntries: 200 } },
  },
];

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Precache the core app shell pages (no offline.html needed)
  additionalManifestEntries: [
    { url: '/', revision: null },
    { url: '/hotels', revision: null },
    { url: '/profile', revision: null },
    { url: '/explore', revision: null },
    { url: '/translateVoice', revision: null },
    { url: '/budget-control', revision: null },
  ],
  buildExcludes: [/marker-icon.*\\.png$/i, /sw-register\\.js$/],
  runtimeCaching,
  // Let next-pwa generate sw.js (don't manually edit public/sw.js)
  publicExcludes: ['!sw-register.js'],
  // Add fallback document for offline navigation
  fallbacks: {
    document: '/',
  },
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