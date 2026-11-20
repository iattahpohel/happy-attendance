/**
 * Mọi khái niệm "ngày làm việc" đều tính theo múi giờ công ty (APP_TZ).
 * Cột @db.Date được lưu dưới dạng Date ở 00:00 UTC đại diện cho ngày địa phương.
 */
export const APP_TZ = process.env.APP_TZ || 'Asia/Ho_Chi_Minh';

export interface LocalParts {
  dateStr: string; // YYYY-MM-DD
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = CN
  minutesOfDay: number;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function localParts(date: Date = new Date(), tz: string = APP_TZ): LocalParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const hour = Number(p.hour);
  const minute = Number(p.minute);
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`,
    year,
    month,
    day,
    hour,
    minute,
    weekday: WEEKDAYS[p.weekday],
    minutesOfDay: hour * 60 + minute,
  };
}

export function todayStr(): string {
  return localParts().dateStr;
}

/** "2026-11-20" -> Date(2026-11-20T00:00:00Z) để ghi vào cột @db.Date */
export function dateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Date của cột @db.Date -> "YYYY-MM-DD" */
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthRange(year: number, month: number) {
  const last = daysInMonth(year, month);
  return {
    start: dateOnly(ymd(year, month, 1)),
    end: dateOnly(ymd(year, month, last)),
    days: last,
  };
}

export function eachDayOfMonth(year: number, month: number): string[] {
  const n = daysInMonth(year, month);
  return Array.from({ length: n }, (_, i) => ymd(year, month, i + 1));
}

export function weekdayOf(dateStr: string): number {
  return dateOnly(dateStr).getUTCDay();
}

export function addDays(dateStr: string, days: number): string {
  const d = dateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

export function prevMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Chuyển "ngày + giờ địa phương" sang Date UTC thực tế */
export function zonedToUtc(dateStr: string, hhmm: string, tz: string = APP_TZ): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const lp = localParts(new Date(asUtc), tz);
  const localAsUtc = Date.UTC(lp.year, lp.month - 1, lp.day, lp.hour, lp.minute);
  return new Date(asUtc - (localAsUtc - asUtc));
}
