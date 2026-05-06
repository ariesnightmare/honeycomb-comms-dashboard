'use client';

import type { CommsTask } from '@/types/commsTask';
import type { Campaign } from '@/types/campaign';
import { calendarDaysBetween, today } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface SummaryBarProps {
  campaigns: Campaign[];
  tasks: CommsTask[];
  lastSyncedAt: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function SummaryBar({ campaigns, tasks, lastSyncedAt, onRefresh, isRefreshing }: SummaryBarProps) {
  const now = today();

  const dueToday    = tasks.filter((t) => calendarDaysBetween(now, t.dueDate) === 0 && t.status !== 'Sent' && t.status !== 'Expired').length;
  const dueThisWeek = tasks.filter((t) => {
    const diff = calendarDaysBetween(now, t.dueDate);
    return diff >= 0 && diff <= 6 && t.status !== 'Sent' && t.status !== 'Expired';
  }).length;
  const blocked     = tasks.filter((t) => t.status === 'Blocked').length;
  const live        = campaigns.filter((c) => !c.hs_is_closed).length;

  const syncDate = new Date(lastSyncedAt);
  const syncLabel = syncDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  }) + ' at ' + syncDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <Stat label="due today"    value={dueToday}    accent="text-amber-400" />
        <Stat label="due this week" value={dueThisWeek} accent="text-stone-200" />
        <Stat label="campaigns live" value={live}      accent="text-emerald-400" />
        {blocked > 0 && <Stat label="blocked" value={blocked} accent="text-red-400" />}
      </div>

      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span>Last synced: {syncLabel}</span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'px-3 py-1.5 rounded border text-xs font-medium transition-colors',
            isRefreshing
              ? 'border-stone-700 text-stone-600 cursor-not-allowed'
              : 'border-amber-600/50 text-amber-400 hover:border-amber-500 hover:bg-amber-950/30 cursor-pointer'
          )}
        >
          {isRefreshing ? 'Syncing…' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <span>
      <span className={cn('font-bold text-base', accent)}>{value}</span>
      <span className="text-stone-400 ml-1">{label}</span>
    </span>
  );
}
