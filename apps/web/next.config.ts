import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@coffer/contracts'],
  devIndicators: false,
};

export default nextConfig;
