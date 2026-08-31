import type { ConsentSummary } from '@coffer/contracts';

type ConnectingBannerProps = {
  consents: ConsentSummary[];
};

const names = (consents: ConsentSummary[]): string => {
  const labels = consents.map((consent) => consent.institution.name ?? 'your bank');

  if (labels.length <= 1) {
    return labels[0] ?? 'your bank';
  }

  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

export const ConnectingBanner = ({ consents }: ConnectingBannerProps) => {
  const connecting = consents.filter((consent) => consent.status === 'processing');

  if (connecting.length === 0) {
    return null;
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className="bg-plum overflow-hidden rounded-[0.875rem] text-white"
    >
      <div className="flex flex-wrap items-center gap-4 p-5">
        <span
          aria-hidden="true"
          className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white"
        />
        <div className="min-w-0">
          <p className="font-display text-base font-bold">Connecting {names(connecting)}</p>
          <p className="mt-0.5 text-sm text-white/70">
            Your balances arrive first, then your transactions. This usually takes under a minute
            and the page updates on its own, so there is no need to refresh.
          </p>
        </div>
      </div>

      <div className="h-1 w-full bg-white/15">
        <div className="animate-connecting bg-inflow h-full w-1/3 rounded-r-full" />
      </div>
    </section>
  );
};
