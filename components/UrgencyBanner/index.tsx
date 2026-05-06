'use client';

import type { Urgency } from '@/types/commsTask';
import { cn } from '@/lib/utils';

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; dot: string }> = {
  High:   { label: 'HIGH',   color: 'text-red-400',    dot: 'bg-red-400' },
  Medium: { label: 'MED',    color: 'text-orange-400', dot: 'bg-orange-400' },
  Low:    { label: 'LOW',    color: 'text-stone-400',  dot: 'bg-stone-400' },
};

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const cfg = URGENCY_CONFIG[urgency];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-bold', cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
