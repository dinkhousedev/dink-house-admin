/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow local network access during development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://192.168.1.167:3000',
    // Add any other local IPs that need access
  ],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
