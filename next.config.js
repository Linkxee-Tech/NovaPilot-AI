/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
  images: {
    domains: ['example.com'], // Replace with your image domain(s)
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    API_URL: process.env.API_URL,
    OTHER_VARIABLE: process.env.OTHER_VARIABLE,
  },
};

module.exports = nextConfig;