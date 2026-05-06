'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CampaignCard } from '@/components/CampaignCard';
import { SummaryBar } from '@/components/SummaryBar';
import type { Campaign } from '@/types/campaign';
import type { CommsTask } from '@/types/commsTask';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { MilestoneTag } from '@/components/MilestoneTag';
import type { MilestoneTier } from '@/types/milestone';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatDisplayDate } from '@/lib/dateUtils';

type SortField = 'name' | 'pct_of_minimum' | 'days_until_close' | 'total_raised';
type SortDir = 'asc' | 'desc';

function currentMilestone(campaign: Campaign): MilestoneTier {
  if (campaign.pct_of_minimum >= 100) return 'TargetReached';
  if (campaign.is_closing_soon) return 'Closing';
  if (campaign.pct_of_minimum >= 50) return 'MidCampaign';
  if (campaign.strong_start_achieved) return 'StrongStart';
  return 'Launch';
}

function FundingBar({ pct }: { pct: number }) {
  const w = Math.min(pct, 100);
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="h-1.5 w-24 rounded-full bg-stone-700">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export default function CampaignsPage() {
  const { data, isLoading, isError, error, refresh, isFetching } = useDashboardData();
  const [search, setSearch] = useState('');
  const [editionFilter, setEditionFilter] = useState<'all' | 'MainStreet' | 'Climate'>('all');
  const [sortField, setSortField] = useState<SortField>('pct_of_minimum');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  const tasksByCampaign = (id: string, status?: string): CommsTask[] =>
    data.tasks.filter((t) => t.campaignId === id && (!status || t.status === status));

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const filtered = data.campaigns
    .filter((c) => !c.hs_is_closed)
    .filter((c) =>
      search === '' || c.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) =>
      editionFilter === 'all' || c.newsletter_edition === editionFilter
    )
    .sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      switch (sortField) {
        case 'name':            aVal = a.name; bVal = b.name; break;
        case 'pct_of_minimum':  aVal = a.pct_of_minimum; bVal = b.pct_of_minimum; break;
        case 'total_raised':    aVal = a.total_raised; bVal = b.total_raised; break;
        case 'days_until_close':
          aVal = a.days_until_close ?? 9999;
          bVal = b.days_until_close ?? 9999;
          break;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  return (
    <div className="space-y-5">
      <SummaryBar
        campaigns={data.campaigns}
        tasks={data.tasks}
        lastSyncedAt={data.lastSyncedAt}
        onRefresh={refresh}
        isRefreshing={isFetching}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-stone-100">Live Campaigns</h1>
          <span className="text-sm text-stone-500">({filtered.length})</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <select
            value={editionFilter}
            onChange={(e) => setEditionFilter(e.target.value as typeof editionFilter)}
            className="bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All editions</option>
            <option value="MainStreet">Main Street</option>
            <option value="Climate">Climate</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-stone-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-700 bg-stone-900">
                <Th label="Campaign" field="name" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <Th label="Edition" />
                <Th label="Raised / Min" field="total_raised" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <Th label="% of Min" field="pct_of_minimum" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <Th label="Close" field="days_until_close" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <Th label="Milestone" />
                <Th label="Tasks" />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const pending = tasksByCampaign(c.id, 'Pending').length + tasksByCampaign(c.id, 'InProgress').length;
                const sent    = tasksByCampaign(c.id, 'Sent').length;
                const milestone = currentMilestone(c);

                return (
                  <tr key={c.id} className="border-b border-stone-800 hover:bg-stone-800/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-stone-100 max-w-[200px]">{c.name}</div>
                      {!c.has_close_date && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                          <AlertTriangle size={10} /> No close date
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.newsletter_edition === 'Climate'
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}>
                        {c.newsletter_edition}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-stone-300">
                      <div>{formatCurrency(c.total_raised)}</div>
                      <div className="text-xs text-stone-500">of {formatCurrency(c.min_funding_amount)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <FundingBar pct={c.pct_of_minimum} />
                        <span className="text-stone-300 text-xs font-medium">{formatPercent(c.pct_of_minimum)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {c.close_date ? (
                        <div className={c.is_closing_soon ? 'text-red-400 font-medium' : 'text-stone-400'}>
                          <div className="text-xs">{c.days_until_close === 0 ? 'Today' : c.days_until_close !== null ? `${c.days_until_close}d` : '—'}</div>
                          <div className="text-xs text-stone-500">{c.close_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </div>
                      ) : (
                        <span className="text-stone-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <MilestoneTag milestone={milestone} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="text-amber-400 font-semibold">{pending}</span>
                      <span className="text-stone-500"> pend · </span>
                      <span className="text-emerald-400 font-semibold">{sent}</span>
                      <span className="text-stone-500"> sent</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <a
                        href={`https://app.hubspot.com/contacts/deals/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-500 hover:text-stone-300 transition-colors"
                        title="Open in HubSpot"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-stone-500 text-sm">
              No campaigns match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({
  label, field, sort, dir, onSort,
}: {
  label: string;
  field?: SortField;
  sort?: SortField;
  dir?: SortDir;
  onSort?: (f: SortField) => void;
}) {
  const isActive = field && sort === field;
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-medium text-stone-400 whitespace-nowrap ${field ? 'cursor-pointer hover:text-stone-200' : ''}`}
      onClick={() => field && onSort?.(field)}
    >
      {label}
      {isActive && <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}
