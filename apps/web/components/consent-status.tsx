import type { ConsentStatus } from '@coffer/contracts';

type ConsentStatusPillProps = {
  status: ConsentStatus;
};

const TONES: Record<ConsentStatus, { label: string; tone: string }> = {
  processing: { label: 'Syncing', tone: 'bg-caution/10 text-caution' },
  active: { label: 'Connected', tone: 'bg-inflow/10 text-inflow' },
  reauth_required: { label: 'Needs reauthorising', tone: 'bg-caution/10 text-caution' },
  revoked: { label: 'Disconnected', tone: 'bg-surface-muted text-ink-faint' },
};

export const ConsentStatusPill = ({ status }: ConsentStatusPillProps) => {
  const { label, tone } = TONES[status];

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
};
