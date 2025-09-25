import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*', // proxies frontend /api calls to backend
      },
    ];
  },
};

export default nextConfig;
