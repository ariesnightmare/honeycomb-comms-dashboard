'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/',           label: 'This Week' },
  { href: '/todo',       label: 'To-Do' },
  { href: '/calendar',   label: 'Calendar' },
  { href: '/campaigns',  label: 'Campaigns' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🍯</span>
            <span className="font-semibold text-stone-100 text-sm hidden sm:block">
              Honeycomb Comms
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-stone-800 text-stone-100'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
