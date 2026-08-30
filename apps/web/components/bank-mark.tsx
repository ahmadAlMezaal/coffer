import type { Institution } from '@coffer/contracts';

type BankMarkProps = {
  institution: Institution;
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: 'h-6 w-6 text-[0.5rem] rounded-md',
  md: 'h-8 w-8 text-[0.625rem] rounded-lg',
  lg: 'h-11 w-11 text-sm rounded-xl',
};

const monogram = (name: string | null): string => {
  if (name === null || name.trim() === '') {
    return 'B';
  }

  const words = name
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/);

  if (words.length === 1) {
    return (words[0] ?? '').slice(0, 2).toUpperCase();
  }

  return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
};

export const BankMark = ({ institution, size = 'md' }: BankMarkProps) => {
  const label = institution.name ?? 'Linked bank';
  const box = `${SIZES[size]} flex shrink-0 items-center justify-center overflow-hidden`;

  if (institution.logo !== null) {
    return (
      <span className={`${box} border-hairline bg-surface border`}>
        <img
          src={`data:image/png;base64,${institution.logo}`}
          alt={label}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
    );
  }

  return (
    <span
      className={`${box} font-display font-bold text-white`}
      style={{ backgroundColor: institution.colour ?? 'var(--color-plum)' }}
      aria-label={label}
      role="img"
    >
      {monogram(institution.name)}
    </span>
  );
};
