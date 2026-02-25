/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Define environment variables here
    API_URL: process.env.API_URL,
  },
  images: {
    domains: ['example.com'], // Add your domains for images
  },
};

module.exports = nextConfig;