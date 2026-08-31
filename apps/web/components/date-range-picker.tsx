'use client';

import { useEffect, useRef, useState } from 'react';

import { CalendarIcon } from '@/components/icons';
import { dateRangeLabel } from '@/lib/format';

type DateRangePickerProps = {
  from: string | undefined;
  to: string | undefined;
  onChange: (range: { from?: string; to?: string }) => void;
};

type Cell = {
  iso: string;
  day: number;
  outside: boolean;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const startOfGrid = (year: number, month: number): Date => {
  const first = new Date(Date.UTC(year, month, 1));
  const weekday = (first.getUTCDay() + 6) % 7;

  return new Date(Date.UTC(year, month, 1 - weekday));
};

const buildMonth = (year: number, month: number): Cell[] => {
  const start = startOfGrid(year, month);

  return Array.from({ length: 42 }, (_, index) => {
    const at = new Date(start.getTime() + index * 86_400_000);

    return {
      iso: at.toISOString().slice(0, 10),
      day: at.getUTCDate(),
      outside: at.getUTCMonth() !== month,
    };
  });
};

const shiftMonths = (at: Date, by: number): Date =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + by, 1));

const monthStartIso = (at: Date): string =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1)).toISOString().slice(0, 10);

const monthTitle = (at: Date): string =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(at);

const PRESETS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 12 months', days: 365 },
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const DateRangePicker = ({ from, to, onChange }: DateRangePickerProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(() => new Date(`${to ?? todayIso()}T00:00:00.000Z`));
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const latest = todayIso();

  useEffect(() => {
    if (!open) {
      return;
    }

    const dismiss = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
        setPendingStart(null);
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setPendingStart(null);
      }
    };

    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const pick = (iso: string) => {
    if (iso > latest) {
      return;
    }

    if (pendingStart === null) {
      setPendingStart(iso);

      return;
    }

    const ordered = iso < pendingStart ? [iso, pendingStart] : [pendingStart, iso];

    setPendingStart(null);
    setOpen(false);
    onChange({ from: ordered[0], to: ordered[1] });
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const since = new Date(today.getTime() - days * 86_400_000);

    setOpen(false);
    setPendingStart(null);
    onChange({ from: since.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) });
  };

  const clear = () => {
    setPendingStart(null);
    setOpen(false);
    onChange({});
  };

  const selectedFrom = pendingStart ?? from;
  const selectedTo = pendingStart === null ? to : undefined;

  const inRange = (iso: string): boolean =>
    selectedFrom !== undefined &&
    selectedTo !== undefined &&
    iso > selectedFrom &&
    iso < selectedTo;

  const isEdge = (iso: string): boolean => iso === selectedFrom || iso === selectedTo;

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((shown) => !shown)}
        aria-expanded={open}
        className="border-hairline bg-surface text-ink hover:border-ink-faint flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      >
        <CalendarIcon className="text-ink-muted h-4 w-4" />
        {dateRangeLabel(from, to)}
      </button>

      {open ? (
        <div className="border-hairline bg-surface absolute right-0 z-20 mt-2 w-[19rem] rounded-xl border p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAnchor(shiftMonths(anchor, -1))}
              aria-label="Previous month"
              className="text-ink-muted hover:text-ink hover:bg-surface-muted h-7 w-7 rounded-md text-sm"
            >
              ‹
            </button>
            <span className="text-ink text-sm font-semibold">{monthTitle(anchor)}</span>
            <button
              type="button"
              onClick={() => setAnchor(shiftMonths(anchor, 1))}
              disabled={monthStartIso(shiftMonths(anchor, 1)) > latest}
              aria-label="Next month"
              className="text-ink-muted hover:text-ink hover:bg-surface-muted h-7 w-7 rounded-md text-sm disabled:pointer-events-none disabled:opacity-30"
            >
              ›
            </button>
          </div>

          <div className="text-ink-faint mb-1 grid grid-cols-7 gap-0.5 text-center text-[0.625rem] font-semibold">
            {WEEKDAYS.map((weekday, index) => (
              <span key={`${weekday}${index}`}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {buildMonth(anchor.getUTCFullYear(), anchor.getUTCMonth()).map((cell) => (
              <button
                key={cell.iso}
                type="button"
                onClick={() => pick(cell.iso)}
                disabled={cell.iso > latest}
                className={`h-8 rounded-md text-xs tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-25 ${
                  isEdge(cell.iso) ? 'bg-plum font-semibold text-white' : ''
                } ${inRange(cell.iso) ? 'bg-surface-muted text-ink' : ''} ${
                  isEdge(cell.iso) || inRange(cell.iso) ? '' : 'hover:bg-surface-muted'
                } ${cell.outside ? 'text-ink-faint' : 'text-ink'}`}
              >
                {cell.day}
              </button>
            ))}
          </div>

          <div className="border-hairline mt-3 flex flex-wrap gap-1.5 border-t pt-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className="bg-surface-muted text-ink-muted hover:text-ink rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              className="text-ink-faint hover:text-ink ml-auto px-1 text-xs font-medium"
            >
              Clear
            </button>
          </div>

          <p className="text-ink-faint mt-2 text-[0.6875rem]">
            {pendingStart === null
              ? 'Pick the first day. Dates after today are not available.'
              : 'Now pick the last day'}
          </p>
        </div>
      ) : null}
    </div>
  );
};
