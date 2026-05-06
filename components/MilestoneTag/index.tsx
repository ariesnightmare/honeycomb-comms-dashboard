'use client';

import type { MilestoneTier } from '@/types/milestone';
import { cn } from '@/lib/utils';

const MILESTONE_CONFIG: Record<MilestoneTier, { label: string; color: string }> = {
  Launch:       { label: 'Launch',        color: 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30' },
  StrongStart:  { label: 'Strong Start',  color: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
  MidCampaign:  { label: 'Mid-Campaign',  color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  Closing:      { label: 'Closing',       color: 'bg-red-600/20 text-red-300 border-red-600/30' },
  TargetReached:{ label: 'Target Reached',color: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30' },
};

interface MilestoneTagProps {
  milestone: MilestoneTier;
  size?: 'sm' | 'md';
}

export function MilestoneTag({ milestone, size = 'md' }: MilestoneTagProps) {
  const cfg = MILESTONE_CONFIG[milestone];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-semibold tracking-wide uppercase',
        cfg.color,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      )}
    >
      {cfg.label}
    </span>
  );
}
