/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow local network access during development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://192.168.1.167:3000',
    // Add any other local IPs that need access
  ],
};

module.exports = nextConfig;
