'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

import { requestLinkToken, submitPublicToken } from '@/app/actions';
import { PlusIcon } from '@/components/icons';

type ConnectBankProps = {
  label: string;
  variant?: 'button' | 'card';
};

export const ConnectBank = ({ label, variant = 'button' }: ConnectBankProps) => {
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
        setError('Linking failed. Check the API is running, then try again.');
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
      setError('Plaid Link would not start. Check your Plaid keys in .env.');
      setBusy(false);
    }
  };

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={begin}
        disabled={busy}
        className="border-hairline text-ink-muted hover:border-plum hover:text-plum flex flex-col items-center justify-center gap-1.5 rounded-[0.875rem] border border-dashed p-5 transition-colors disabled:opacity-50"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <PlusIcon className="h-4 w-4" />
          {busy ? 'Working' : label}
        </span>
        <span className="text-ink-faint text-xs">
          {error ?? 'Add another bank through Plaid Link'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={begin}
        disabled={busy}
        className="bg-plum hover:bg-ink flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
        {busy ? 'Working' : label}
      </button>
      {error === null ? null : <p className="text-outflow text-xs">{error}</p>}
    </div>
  );
};
