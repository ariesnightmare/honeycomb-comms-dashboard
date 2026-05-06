'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '@/types/campaign';
import type { CommsTask } from '@/types/commsTask';

interface DashboardData {
  campaigns: Campaign[];
  tasks: CommsTask[];
  lastSyncedAt: string;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch('/api/campaigns', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const raw = await res.json() as DashboardData;

  // Deserialise date strings into Date objects
  return {
    ...raw,
    tasks: raw.tasks.map((t) => ({
      ...t,
      dueDate:           new Date(t.dueDate as unknown as string),
      scheduledSendDate: new Date(t.scheduledSendDate as unknown as string),
      completedAt:       t.completedAt ? new Date(t.completedAt as unknown as string) : undefined,
    })),
    campaigns: raw.campaigns.map((c) => ({
      ...c,
      launch_date:        c.launch_date     ? new Date(c.launch_date as unknown as string) : null,
      close_date:         c.close_date      ? new Date(c.close_date as unknown as string) : null,
      n72_hours_timestamp:c.n72_hours_timestamp ? new Date(c.n72_hours_timestamp as unknown as string) : null,
      n04_50pct_date:     c.n04_50pct_date  ? new Date(c.n04_50pct_date as unknown as string) : null,
      n05_min_met_date:   c.n05_min_met_date? new Date(c.n05_min_met_date as unknown as string) : null,
    })),
  };
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: false,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  return { ...query, refresh };
}
