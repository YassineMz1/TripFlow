/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    'http://192.168.1.20:3000',
    'http://192.168.1.20:3001',
    'http://localhost:3000',
    'http://localhost:3001',

  ],
}

module.exports = nextConfig