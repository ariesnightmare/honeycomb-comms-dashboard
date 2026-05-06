'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { MonthCalendar } from '@/components/MonthCalendar';
import { SummaryBar } from '@/components/SummaryBar';
import { Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const { data, isLoading, isError, error, refresh, isFetching } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-amber-400" />
        <span className="ml-2 text-stone-400">Loading…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950/30 p-6 text-center">
        <p className="text-red-400 font-semibold">Error loading data</p>
        <p className="text-stone-400 text-sm mt-1">{String(error)}</p>
        <button onClick={refresh} className="mt-3 text-sm text-amber-400 underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SummaryBar
        campaigns={data.campaigns}
        tasks={data.tasks}
        lastSyncedAt={data.lastSyncedAt}
        onRefresh={refresh}
        isRefreshing={isFetching}
      />

      <div>
        <h1 className="text-xl font-bold text-stone-100 mb-4">Monthly Calendar</h1>
        <MonthCalendar tasks={data.tasks} />
      </div>
    </div>
  );
}
