import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Coffer',
  description: 'Linked bank accounts, balances, transactions and the stats derived from them.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en-GB">
    <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
  </html>
);

export default RootLayout;
