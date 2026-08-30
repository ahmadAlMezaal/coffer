'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { AccountsIcon, ChevronIcon, CofferMark, HomeIcon } from '@/components/icons';
import { DRAWER_COOKIE } from '@/lib/drawer';
import type { ComponentType } from 'react';
import type { UserResponse } from '@coffer/contracts';

type SidebarProps = {
  user: UserResponse | null;
  initiallyExpanded: boolean;
};

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/accounts', label: 'Accounts', Icon: AccountsIcon },
];

const initials = (email: string): string => {
  const [name] = email.split('@');

  if (!name) {
    return 'C';
  }

  const parts = name.split(/[._-]/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

export const Sidebar = ({ user, initiallyExpanded }: SidebarProps) => {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = () => {
    setExpanded((open) => {
      document.cookie = `${DRAWER_COOKIE}=${open ? 'collapsed' : 'expanded'};path=/;max-age=31536000;samesite=lax`;

      return !open;
    });
  };

  return (
    <aside
      data-expanded={expanded}
      className={`border-hairline bg-surface sticky top-0 flex h-screen shrink-0 flex-col border-r transition-[width] duration-200 ease-out ${
        expanded ? 'w-[15rem]' : 'w-[4.5rem]'
      }`}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <span className="text-plum">
          <CofferMark />
        </span>
        {expanded ? (
          <span className="font-display text-ink truncate text-lg font-extrabold tracking-tight">
            Coffer
          </span>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={expanded ? undefined : item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-surface-muted text-ink'
                  : 'text-ink-muted hover:bg-surface-muted/60 hover:text-ink'
              } ${expanded ? '' : 'justify-center px-0'}`}
            >
              <item.Icon />
              {expanded ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-hairline border-t p-3">
        <div
          className={`flex items-center gap-3 rounded-lg px-2 py-2 ${expanded ? '' : 'justify-center px-0'}`}
        >
          <span className="bg-plum font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            {user === null ? '?' : initials(user.email)}
          </span>
          {expanded ? (
            <span className="min-w-0">
              <span className="text-ink block truncate text-sm font-semibold">
                {user === null ? 'Not signed in' : user.email}
              </span>
              <span className="text-ink-faint block truncate text-xs">
                {user === null ? 'The API is not answering' : 'Account owner'}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse the menu' : 'Expand the menu'}
        className="border-hairline bg-surface text-ink-muted hover:text-ink hover:border-ink-faint absolute top-[3.25rem] -right-3 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
      >
        <ChevronIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
    </aside>
  );
};
