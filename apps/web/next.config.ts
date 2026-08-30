import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@coffer/contracts', '@coffer/provider'],
};

export default nextConfig;
