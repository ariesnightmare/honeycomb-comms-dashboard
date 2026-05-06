'use client';

import { useState } from 'react';
import type { CommsTask, TaskStatus } from '@/types/commsTask';
import { ChannelBadge } from '@/components/ChannelBadge';
import { MilestoneTag } from '@/components/MilestoneTag';
import { UrgencyBadge } from '@/components/UrgencyBanner';
import { formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { Lock, CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react';

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  Pending:   'InProgress',
  InProgress:'Sent',
  Sent:      'Sent',
  Blocked:   'Blocked',
  Expired:   'Expired',
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  Pending:   <Clock size={14} className="text-stone-400" />,
  InProgress:<Clock size={14} className="text-amber-400 animate-pulse" />,
  Sent:      <CheckCircle2 size={14} className="text-emerald-400" />,
  Blocked:   <Lock size={14} className="text-red-400" />,
  Expired:   <AlertCircle size={14} className="text-stone-500" />,
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  Pending:   'Pending',
  InProgress:'In Progress',
  Sent:      'Sent',
  Blocked:   'Blocked',
  Expired:   'Expired',
};

interface CommsTaskCardProps {
  task: CommsTask;
  dateWindow?: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future';
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function CommsTaskCard({ task, dateWindow, onStatusChange }: CommsTaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [expanded, setExpanded] = useState(false);

  const isActionable = status === 'Pending' || status === 'InProgress';
  const isExpiredOrBlocked = status === 'Expired' || status === 'Blocked';

  function handleStatusClick() {
    if (!isActionable) return;
    const next = STATUS_CYCLE[status];
    setStatus(next);
    onStatusChange?.(task.id, next);
    // Optimistic API update
    fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(console.error);
  }

  const borderColor =
    dateWindow === 'overdue' ? 'border-red-500/70' :
    dateWindow === 'today'   ? 'border-amber-500/50' :
    'border-stone-700';

  const bgOpacity = isExpiredOrBlocked ? 'opacity-50' : '';

  return (
    <div className={cn('rounded-lg border bg-stone-800 p-3 space-y-2', borderColor, bgOpacity)}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-100 truncate">{task.campaignName}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {task.taskType === 'Roundup' ? 'Roundup' : 'Standalone'}
            {task.newsletterEdition ? ` · ${task.newsletterEdition}` : ''}
            {task.newsletterSection ? ` — ${task.newsletterSection}` : ''}
          </p>
        </div>
        <UrgencyBadge urgency={task.urgency} />
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ChannelBadge channel={task.channel} size="sm" />
        <MilestoneTag milestone={task.milestone} size="sm" />
      </div>

      {/* Dates row */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>
          Due: <span className={cn('font-medium', dateWindow === 'overdue' ? 'text-red-400' : 'text-stone-300')}>
            {formatDisplayDate(task.dueDate)}
          </span>
        </span>
        <span>Send: {formatDisplayDate(task.scheduledSendDate)}</span>
      </div>

      {/* Status + expand */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-700">
        <button
          onClick={handleStatusClick}
          disabled={!isActionable}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1 transition-colors',
            isActionable
              ? 'hover:bg-stone-700 cursor-pointer text-stone-300'
              : 'cursor-default text-stone-500'
          )}
        >
          {STATUS_ICONS[status]}
          {STATUS_LABELS[status]}
          {isActionable && (
            <span className="text-stone-500 ml-1">→ {STATUS_LABELS[STATUS_CYCLE[status]]}</span>
          )}
        </button>

        {(task.blockedReason || task.notes) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <ChevronDown
              size={14}
              className={cn('transition-transform', expanded ? 'rotate-180' : '')}
            />
          </button>
        )}
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div className="text-xs text-stone-400 bg-stone-900 rounded p-2 space-y-1">
          {task.blockedReason && (
            <p><span className="text-red-400 font-medium">Blocked:</span> {task.blockedReason}</p>
          )}
          {task.notes && <p>{task.notes}</p>}
        </div>
      )}
    </div>
  );
}
