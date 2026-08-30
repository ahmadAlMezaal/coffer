type CategoryChipProps = {
  category: string | null;
};

const PALETTE = [
  'bg-[#efe7f6] text-[#4b2470]',
  'bg-[#e3f0ea] text-[#0f5c40]',
  'bg-[#fdeae4] text-[#8f3618]',
  'bg-[#e6eefb] text-[#1d4576]',
  'bg-[#fbf0d9] text-[#7a5410]',
  'bg-[#fbe6ef] text-[#8b2a56]',
  'bg-[#e4f1f5] text-[#12545f]',
  'bg-[#eceadf] text-[#4f4a33]',
];

const toneFor = (category: string): string => {
  const sum = [...category].reduce((running, letter) => running + letter.charCodeAt(0), 0);

  return PALETTE[sum % PALETTE.length] ?? PALETTE[0] ?? '';
};

export const CategoryChip = ({ category }: CategoryChipProps) => {
  if (category === null) {
    return <span className="text-ink-faint text-xs">Uncategorised</span>;
  }

  return (
    <span
      className={`inline-flex max-w-[11rem] items-center truncate rounded-full px-2.5 py-1 text-xs font-medium ${toneFor(category)}`}
    >
      {category}
    </span>
  );
};
