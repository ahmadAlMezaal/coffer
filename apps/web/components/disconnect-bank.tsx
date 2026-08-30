'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { revokeConsent } from '@/app/actions';
import { UnlinkIcon } from '@/components/icons';

type DisconnectBankProps = {
  consentId: string;
  institutionName: string;
};

export const DisconnectBank = ({ consentId, institutionName }: DisconnectBankProps) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = async () => {
    setBusy(true);
    setError(null);

    try {
      await revokeConsent(consentId);
      router.refresh();
    } catch {
      setError('Disconnecting failed. Check the API is running, then try again.');
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border-hairline text-ink-muted hover:border-outflow/40 hover:text-outflow flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        <UnlinkIcon className="h-3.5 w-3.5" />
        Disconnect
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-ink-muted text-xs">Disconnect {institutionName}?</span>
        <button
          type="button"
          onClick={disconnect}
          disabled={busy}
          className="bg-outflow rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {busy ? 'Disconnecting' : 'Yes, disconnect'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="border-hairline text-ink-muted hover:text-ink rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
        >
          Keep it
        </button>
      </div>
      {error === null ? null : <p className="text-outflow text-xs">{error}</p>}
    </div>
  );
};
