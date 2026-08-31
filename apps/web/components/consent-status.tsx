import type { ConsentStatus } from '@coffer/contracts';

type ConsentStatusPillProps = {
  status: ConsentStatus;
};

const TONES: Record<ConsentStatus, { label: string; tone: string; dot: string }> = {
  processing: {
    label: 'Connecting',
    tone: 'bg-plum text-white',
    dot: 'bg-white animate-pulse',
  },
  active: { label: 'Connected', tone: 'bg-inflow/10 text-inflow', dot: 'bg-inflow' },
  reauth_required: {
    label: 'Needs your approval',
    tone: 'bg-caution/10 text-caution',
    dot: 'bg-caution',
  },
  revoked: { label: 'Disconnected', tone: 'bg-surface-muted text-ink-faint', dot: 'bg-ink-faint' },
};

export const ConsentStatusPill = ({ status }: ConsentStatusPillProps) => {
  const { label, tone, dot } = TONES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};
