import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@coffer/contracts'],
};

export default nextConfig;
