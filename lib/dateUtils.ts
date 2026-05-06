/**
 * Business day utilities. 72-hour windows for compliance deadlines
 * use business days only — weekends and US federal holidays excluded.
 */

// US Federal holidays as MM-DD strings (applies annually)
const RECURRING_HOLIDAYS: string[] = [
  '01-01', // New Year's Day
  '07-04', // Independence Day
  '11-11', // Veterans Day
  '12-25', // Christmas Day
];

// Year-specific floating holidays (expand as needed)
// Format: 'YYYY-MM-DD'
const FLOATING_HOLIDAYS: string[] = [
  // 2026
  '2026-01-19', // MLK Day (3rd Monday Jan)
  '2026-02-16', // Presidents' Day (3rd Monday Feb)
  '2026-05-25', // Memorial Day (last Monday May)
  '2026-07-03', // July 4th observed (Friday)
  '2026-09-07', // Labor Day (1st Monday Sep)
  '2026-11-26', // Thanksgiving (4th Thursday Nov)
  '2026-11-27', // Day after Thanksgiving
  '2026-12-25', // Christmas
  // 2025
  '2025-01-20', // MLK Day
  '2025-02-17', // Presidents' Day
  '2025-05-26', // Memorial Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-11-28', // Day after Thanksgiving
  '2025-12-25', // Christmas
];

function isFederalHoliday(date: Date): boolean {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const yyyy_mm_dd = formatDateISO(date);

  if (RECURRING_HOLIDAYS.includes(mmdd)) return true;
  if (FLOATING_HOLIDAYS.includes(yyyy_mm_dd)) return true;
  return false;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0=Sunday, 6=Saturday
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isFederalHoliday(date);
}

/** Add N business days to a date. Returns the new date. */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) added++;
  }
  return result;
}

/** Count business days between two dates (exclusive of start, inclusive of end). */
export function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (isBusinessDay(cursor)) count++;
  }
  return count;
}

/** Get the next occurrence of a given weekday (0=Sun…6=Sat). */
export function nextWeekday(from: Date, weekday: number): Date {
  const result = new Date(from);
  const current = result.getDay();
  const diff = (weekday - current + 7) % 7 || 7; // always go forward
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Next Monday on or after `from`. */
export function nextMonday(from: Date): Date {
  return nextWeekday(from, 1);
}

/** Next Thursday on or after `from`. */
export function nextThursday(from: Date): Date {
  return nextWeekday(from, 4);
}

/** Next Friday on or after `from`. */
export function nextFriday(from: Date): Date {
  return nextWeekday(from, 5);
}

/** Return YYYY-MM-DD string for a date. */
export function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Parse a YYYY-MM-DD string into a local Date (midnight). */
export function parseDateISO(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Returns true if two dates fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** Calendar days between start and end (positive = end is in the future). */
export function calendarDaysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay   = new Date(end.getFullYear(),   end.getMonth(),   end.getDate());
  return Math.round((endDay.getTime() - startDay.getTime()) / msPerDay);
}

/** Returns today at midnight local time. */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format date for display: "Mon May 6, 2026" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format time for display: "9:00 AM" */
export function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Determine which "window" a date falls in relative to today. */
export function getDateWindow(date: Date, todayDate: Date = today()): 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future' {
  const diff = calendarDaysBetween(todayDate, date);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 6) return 'this_week';
  return 'future';
}
