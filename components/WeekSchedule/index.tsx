'use client';

import type { CommsTask } from '@/types/commsTask';
import { CommsTaskCard } from '@/components/CommsTaskCard';
import { getDateWindow, formatDisplayDate, today, calendarDaysBetween } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface WeekScheduleProps {
  tasks: CommsTask[];
}

function getThisWeekTasks(tasks: CommsTask[]) {
  const now = today();
  return tasks.filter((t) => {
    const diff = calendarDaysBetween(now, t.dueDate);
    return diff >= 0 && diff <= 6;
  });
}

function groupByDay(tasks: CommsTask[], label: string, filterFn: (t: CommsTask) => boolean) {
  return {
    label,
    tasks: tasks.filter(filterFn).sort((a, b) => {
      const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }),
  };
}

export function WeekSchedule({ tasks }: WeekScheduleProps) {
  const now = today();

  const overdue   = tasks.filter((t) => calendarDaysBetween(now, t.dueDate) < 0);
  const todayTasks     = tasks.filter((t) => calendarDaysBetween(now, t.dueDate) === 0);
  const tomorrowTasks  = tasks.filter((t) => calendarDaysBetween(now, t.dueDate) === 1);
  const restOfWeek     = tasks.filter((t) => {
    const diff = calendarDaysBetween(now, t.dueDate);
    return diff >= 2 && diff <= 6;
  });

  const columns = [
    { label: `Today — ${formatDisplayDate(now)}`, tasks: todayTasks, window: 'today' as const, accent: 'border-amber-500/50' },
    { label: 'Tomorrow', tasks: tomorrowTasks, window: 'tomorrow' as const, accent: 'border-stone-600' },
    { label: 'Rest of Week', tasks: restOfWeek, window: 'this_week' as const, accent: 'border-stone-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Overdue banner */}
      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-3">
          <p className="text-sm font-semibold text-red-400 mb-2">
            ⚠ {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {overdue.map((t) => (
              <CommsTaskCard key={t.id} task={t} dateWindow="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.label} className={cn('rounded-lg border bg-stone-900 p-3', col.accent)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-200">{col.label}</h3>
              <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
                {col.tasks.length}
              </span>
            </div>
            {col.tasks.length === 0 ? (
              <p className="text-xs text-stone-600 py-4 text-center">No tasks</p>
            ) : (
              <div className="space-y-2">
                {col.tasks.map((t) => (
                  <CommsTaskCard key={t.id} task={t} dateWindow={col.window} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
