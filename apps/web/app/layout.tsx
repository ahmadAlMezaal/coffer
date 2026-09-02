import { Inter, Manrope } from 'next/font/google';
import { cookies } from 'next/headers';

import { ConnectingProvider } from '@/components/connecting-context';
import { Sidebar } from '@/components/sidebar';
import { DRAWER_COOKIE, isDrawerExpanded } from '@/lib/drawer';
import { readUser } from '@/lib/services/dashboard.service';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  title: 'Coffer',
  description: 'Linked bank accounts, balances, transactions and the stats derived from them.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const [user, store] = await Promise.all([readUser(), cookies()]);
  const expanded = isDrawerExpanded(store.get(DRAWER_COOKIE)?.value);

  return (
    <html lang="en-GB" className={`${inter.variable} ${manrope.variable}`}>
      <body
        suppressHydrationWarning
        className="bg-ground text-ink min-h-screen font-sans antialiased"
      >
        <ConnectingProvider>
          <div className="flex min-h-screen">
            <Sidebar user={user} initiallyExpanded={expanded} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </ConnectingProvider>
      </body>
    </html>
  );
};

export default RootLayout;
