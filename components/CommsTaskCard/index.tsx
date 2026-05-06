'use client';

import { useState } from 'react';
import type { CommsTask, TaskStatus } from '@/types/commsTask';
import { ChannelBadge } from '@/components/ChannelBadge';
import { MilestoneTag } from '@/components/MilestoneTag';
import { UrgencyBadge } from '@/components/UrgencyBanner';
import { formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { Lock, CheckCircle2, Clock, AlertCircle, ChevronDown, RotateCcw } from 'lucide-react';

function updateTaskStatus(taskId: string, status: TaskStatus) {
  fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).catch(console.error);
}

interface CommsTaskCardProps {
  task: CommsTask;
  dateWindow?: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future';
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function CommsTaskCard({ task, dateWindow, onStatusChange }: CommsTaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [expanded, setExpanded] = useState(false);

  const isSent            = status === 'Sent';
  const isExpiredOrBlocked = status === 'Expired' || status === 'Blocked';

  function markSent() {
    setStatus('Sent');
    onStatusChange?.(task.id, 'Sent');
    updateTaskStatus(task.id, 'Sent');
  }

  function markPending() {
    setStatus('Pending');
    onStatusChange?.(task.id, 'Pending');
    updateTaskStatus(task.id, 'Pending');
  }

  const borderColor =
    isSent            ? 'border-emerald-800/50' :
    dateWindow === 'overdue' ? 'border-red-500/70' :
    dateWindow === 'today'   ? 'border-amber-500/50' :
    'border-stone-700';

  return (
    <div className={cn(
      'rounded-lg border bg-stone-800 p-3 space-y-2 transition-opacity',
      borderColor,
      isExpiredOrBlocked ? 'opacity-50' : '',
      isSent ? 'opacity-60' : '',
    )}>
      {/* Top row — checkbox + campaign name */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {!isExpiredOrBlocked && (
          <button
            onClick={isSent ? markPending : markSent}
            title={isSent ? 'Mark as not sent' : 'Mark as sent'}
            className={cn(
              'mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
              isSent
                ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600'
                : 'border-stone-500 hover:border-emerald-400 bg-transparent'
            )}
          >
            {isSent && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium truncate', isSent ? 'line-through text-stone-400' : 'text-stone-100')}>
            {task.campaignName}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {task.taskType === 'Roundup' ? 'Roundup' : 'Standalone'}
            {task.newsletterEdition ? ` · ${task.newsletterEdition}` : ''}
            {task.newsletterSection ? ` — ${task.newsletterSection}` : ''}
          </p>
        </div>

        <UrgencyBadge urgency={task.urgency} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pl-8">
        <ChannelBadge channel={task.channel} size="sm" />
        <MilestoneTag milestone={task.milestone} size="sm" />
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-stone-400 pl-8">
        <span>
          Due: <span className={cn('font-medium', dateWindow === 'overdue' ? 'text-red-400' : 'text-stone-300')}>
            {formatDisplayDate(task.dueDate)}
          </span>
        </span>
        <span>Send: {formatDisplayDate(task.scheduledSendDate)}</span>
      </div>

      {/* Status label + notes toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-700 pl-8">
        <span className="text-xs text-stone-500 flex items-center gap-1">
          {status === 'Sent'    && <><CheckCircle2 size={12} className="text-emerald-400" /> Sent</>}
          {status === 'Pending' && <><Clock size={12} /> Pending</>}
          {status === 'Blocked' && <><Lock size={12} className="text-red-400" /> Blocked</>}
          {status === 'Expired' && <><AlertCircle size={12} /> Expired</>}
          {status === 'InProgress' && <><Clock size={12} className="text-amber-400" /> In Progress</>}
        </span>

        {(task.blockedReason || task.notes) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <ChevronDown size={14} className={cn('transition-transform', expanded ? 'rotate-180' : '')} />
          </button>
        )}
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div className="text-xs text-stone-400 bg-stone-900 rounded p-2 space-y-1 ml-8">
          {task.blockedReason && (
            <p><span className="text-red-400 font-medium">Blocked:</span> {task.blockedReason}</p>
          )}
          {task.notes && <p>{task.notes}</p>}
        </div>
      )}
    </div>
  );
}
