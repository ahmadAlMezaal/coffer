'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

import { requestLinkToken, submitPublicToken } from '@/app/actions';

type ConnectBankProps = {
  label: string;
};

export const ConnectBank = ({ label }: ConnectBankProps) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback(
    async (publicToken: string | null) => {
      if (publicToken === null) {
        return;
      }

      setBusy(true);

      try {
        await submitPublicToken(publicToken);
        router.refresh();
      } catch {
        setError('Linking failed. Check the API is running and try again.');
      } finally {
        setBusy(false);
        setToken(null);
      }
    },
    [router],
  );

  const { open, ready } = usePlaidLink({ token, onSuccess });

  useEffect(() => {
    if (token && ready) {
      open();
    }
  }, [token, ready, open]);

  const begin = async () => {
    setBusy(true);
    setError(null);

    try {
      setToken(await requestLinkToken());
    } catch {
      setError('Could not start Plaid Link. Check your Plaid keys in .env.');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={begin}
        disabled={busy}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {busy ? 'Working…' : label}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};
