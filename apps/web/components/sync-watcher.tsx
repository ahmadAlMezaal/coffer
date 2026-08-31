'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const POLL_MS = 4_000;

export const SyncWatcher = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), POLL_MS);

    return () => clearInterval(timer);
  }, [router]);

  return null;
};
