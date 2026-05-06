'use client';

import { useState } from 'react';
import type { CommsTask } from '@/types/commsTask';
import { channelDotColor } from '@/components/ChannelBadge';
import { ChannelBadge } from '@/components/ChannelBadge';
import { MilestoneTag } from '@/components/MilestoneTag';
import { isSameDay, formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

interface MonthCalendarProps {
  tasks: CommsTask[];
}

export function MonthCalendar({ tasks }: MonthCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function goToToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDay(null);
  }

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);

  // Build grid: blanks + days
  const cells: Array<{ date: Date | null; tasks: CommsTask[] }> = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ date: null, tasks: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const dayTasks = tasks.filter((t) => isSameDay(t.scheduledSendDate, date));
    cells.push({ date, tasks: dayTasks });
  }

  const selectedTasks = selectedDay
    ? tasks.filter((t) => isSameDay(t.scheduledSendDate, selectedDay))
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-stone-700 transition-colors text-stone-400 hover:text-stone-200">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-stone-100 w-40 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-stone-700 transition-colors text-stone-400 hover:text-stone-200">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(['SocialMedia','Email','InvestorNewsletter','PushNotification','SMS'] as const).map((ch) => (
          <div key={ch} className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', channelDotColor(ch))} />
            <ChannelBadge channel={ch} size="sm" showIcon={false} />
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-stone-700 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone-700">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-stone-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.date && isSameDay(cell.date, now);
            const isSelected = cell.date && selectedDay && isSameDay(cell.date, selectedDay);
            const isCurrentMonth = cell.date !== null;

            return (
              <div
                key={idx}
                onClick={() => cell.date && setSelectedDay(isSelected ? null : cell.date)}
                className={cn(
                  'min-h-[72px] p-1.5 border-b border-r border-stone-800 transition-colors',
                  isCurrentMonth ? 'cursor-pointer hover:bg-stone-800' : 'bg-stone-900',
                  isSelected ? 'bg-stone-700' : '',
                  idx % 7 === 6 ? 'border-r-0' : '',
                )}
              >
                {cell.date && (
                  <>
                    <span
                      className={cn(
                        'text-xs font-medium inline-flex h-5 w-5 items-center justify-center rounded-full',
                        isToday ? 'bg-amber-500 text-stone-900' : 'text-stone-400'
                      )}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* Task dots */}
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {cell.tasks.slice(0, 6).map((t, i) => (
                        <span
                          key={i}
                          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', channelDotColor(t.channel))}
                          title={`${t.campaignName} — ${t.channel}`}
                        />
                      ))}
                      {cell.tasks.length > 6 && (
                        <span className="text-[9px] text-stone-500">+{cell.tasks.length - 6}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDay && selectedTasks.length > 0 && (
        <div className="rounded-lg border border-stone-700 bg-stone-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-100 text-sm">
              {formatDisplayDate(selectedDay)} — {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-stone-500 hover:text-stone-300"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {selectedTasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2 text-sm py-2 border-b border-stone-800 last:border-0">
                <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', channelDotColor(t.channel))} />
                <div className="min-w-0">
                  <p className="text-stone-200 font-medium truncate">{t.campaignName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ChannelBadge channel={t.channel} size="sm" />
                    <MilestoneTag milestone={t.milestone} size="sm" />
                    <span className="text-xs text-stone-500">{t.taskType}</span>
                  </div>
                  {t.notes && <p className="text-xs text-stone-500 mt-1">{t.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDay && selectedTasks.length === 0 && (
        <div className="rounded-lg border border-stone-700 bg-stone-900 p-4 text-center">
          <p className="text-stone-500 text-sm">No tasks scheduled for {formatDisplayDate(selectedDay)}</p>
        </div>
      )}
    </div>
  );
}
