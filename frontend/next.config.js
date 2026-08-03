const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Ne jamais servir depuis le cache les appels API : les données
  // (entreprises, rendez-vous, paiements…) doivent toujours être fraîches.
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'god-rogwebservice-cache' },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = withPWA(nextConfig);
