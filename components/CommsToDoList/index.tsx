'use client';

import { useState } from 'react';
import type { CommsTask, Channel, TaskStatus } from '@/types/commsTask';
import { CommsTaskCard } from '@/components/CommsTaskCard';
import { ChannelBadge } from '@/components/ChannelBadge';
import { getDateWindow } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const CHANNELS: Channel[] = [
  'SocialMedia',
  'Email',
  'InvestorNewsletter',
  'PushNotification',
  'SMS',
];

const CHANNEL_LABELS: Record<Channel, string> = {
  SocialMedia:        '📱 Social Media',
  Email:              '📧 Email',
  InvestorNewsletter: '📰 Investor Newsletter',
  PushNotification:   '🔔 Push Notifications',
  SMS:                '💬 SMS',
};

type StatusFilter = 'all' | TaskStatus;
type UrgencyFilter = 'all' | 'High' | 'Medium' | 'Low';

interface CommsToDoListProps {
  tasks: CommsTask[];
}

export function CommsToDoList({ tasks }: CommsToDoListProps) {
  const [activeChannel, setActiveChannel] = useState<Channel>('SocialMedia');
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [campaignFilter, setCampaignFilter] = useState('');

  const channelTasks = tasks
    .filter((t) => t.channel === activeChannel)
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t) => urgencyFilter === 'all' || t.urgency === urgencyFilter)
    .filter((t) =>
      campaignFilter === '' ||
      t.campaignName.toLowerCase().includes(campaignFilter.toLowerCase())
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="space-y-4">
      {/* Channel tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-700 pb-3">
        {CHANNELS.map((ch) => {
          const count = tasks.filter((t) => t.channel === ch && t.status !== 'Sent' && t.status !== 'Expired').length;
          return (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeChannel === ch
                  ? 'bg-stone-700 text-stone-100'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              )}
            >
              {CHANNEL_LABELS[ch]}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-amber-600 text-amber-100 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Filter by campaign…"
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Sent">Sent</option>
          <option value="Blocked">Blocked</option>
        </select>

        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
          className="bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All urgencies</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {(statusFilter !== 'all' || urgencyFilter !== 'all' || campaignFilter) && (
          <button
            onClick={() => { setStatusFilter('all'); setUrgencyFilter('all'); setCampaignFilter(''); }}
            className="text-xs text-stone-400 hover:text-stone-200 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {channelTasks.length === 0 ? (
        <div className="rounded-lg border border-stone-700 bg-stone-900 p-8 text-center">
          <p className="text-stone-500 text-sm">No tasks match the current filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">{channelTasks.length} task{channelTasks.length !== 1 ? 's' : ''}</p>
          {channelTasks.map((t) => (
            <CommsTaskCard
              key={t.id}
              task={t}
              dateWindow={getDateWindow(t.dueDate)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
