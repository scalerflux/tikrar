import scheduleData from '../data/schedule-data.json';
import pageAyahMap from '../data/page-ayah-map.json';
import { SURAH_LIST } from '../data/surah-metadata';

export interface ScheduleItem {
  dayNumber: number;
  faceNumber: string;
  surahName: string;
  tourNumber: number;
  revisionRange: string;
  connectionRange: string;
}

export const TOTAL_PROGRAM_DAYS = 1206;

export function getScheduleItem(dayNumber: number): ScheduleItem | null {
  if (dayNumber < 1 || dayNumber > TOTAL_PROGRAM_DAYS) {
    return null;
  }
  const item = scheduleData.find((d: any) => d.dayNumber === dayNumber);
  return item ? (item as ScheduleItem) : null;
}

export function getUstadRecitationItem(dayNumber: number): ScheduleItem | null {
  return dayNumber > 1 ? getScheduleItem(dayNumber - 1) : null;
}

/**
 * Local calendar date ("YYYY-MM-DD") of the given Date, computed in the
 * device timezone. Never derived from UTC components, so it cannot drift
 * for users behind UTC.
 */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a "YYYY-MM-DD" local date into a Date at local midnight. Using
 * `new Date('YYYY-MM-DD')` would parse as UTC and shift the day for
 * users behind UTC.
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days between two "YYYY-MM-DD" local dates (b - a). */
export function daysBetweenDates(a: string, b: string): number {
  const diff = parseLocalDateString(b).getTime() - parseLocalDateString(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function datesBetweenExclusive(start: string, end: string): string[] {
  const result: string[] = [];
  const cursor = parseLocalDateString(start);
  const endDate = parseLocalDateString(end);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < endDate) {
    result.push(localDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/**
 * The program day currently due. COMPLETION-DRIVEN: the next day is the
 * first day not yet completed, regardless of how much calendar time has
 * passed. A user who missed a week is still on day (completed + 1) and can
 * catch up. A brand-new user with zero completions lands on day 1.
 * The start date is only a log of when work began; it does not decide
 * which face is due.
 */
export function calculateCurrentDay(completedDays: number[]): number {
  const completed = new Set(
    (Array.isArray(completedDays) ? completedDays : []).filter(
      (day): day is number => Number.isInteger(day) && day >= 1 && day <= TOTAL_PROGRAM_DAYS
    )
  );

  for (let day = 1; day <= TOTAL_PROGRAM_DAYS; day++) {
    if (!completed.has(day)) return day;
  }

  return TOTAL_PROGRAM_DAYS;
}

export function isValidLocalDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

/**
 * Streak over CALENDAR DATES ("YYYY-MM-DD", device local timezone).
 * The current streak survives while the most recent completion is today
 * or yesterday; anything older resets it to 0. A Set gives O(n) lookups
 * and de-duplicates repeat completions.
 */
export function calculateStreak(completedDates: string[]): StreakInfo {
  const raw = Array.isArray(completedDates) ? completedDates : [];
  const dates = raw.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
  const sorted = [...new Set(dates)].sort();
  const totalCompleted = sorted.length;
  if (totalCompleted === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
  }

  let longestStreak = 0;
  let run = 0;
  let lastRun = 0;
  let prev: string | null = null;

  for (const date of sorted) {
    run = prev !== null && daysBetweenDates(prev, date) === 1 ? run + 1 : 1;
    if (run > longestStreak) {
      longestStreak = run;
    }
    lastRun = run;
    prev = date;
  }

  const today = localDateString();
  const daysSinceLastCompletion = daysBetweenDates(prev!, today);
  const currentStreak = daysSinceLastCompletion <= 1 ? lastRun : 0;

  return { currentStreak, longestStreak, totalCompleted };
}

export function getSurahPageNumber(faceNumber: string): number {
  if (!faceNumber) return 1;
  const parts = faceNumber.split(' ');
  const page = parseInt(parts[0], 10);
  return isNaN(page) ? 1 : page;
}

function normalizeFaceKey(face: string): string {
  return face.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * The program day a user should continue from when they have already
 * memorized up to `page` (optionally only half of it). The entered face is
 * considered memorized, so the returned day is the schedule day of the NEXT
 * new face:
 *  - half 'h1' → the day of "N h2" (first half already memorized)
 *  - half 'h2' → the first face of page N+1
 *  - no half   → the first face of page N+1 (whole page memorized)
 * Everything before that day is marked complete, so phase 1 (yesterday's
 * repetition), ustad recitation, connection and revision all resolve from
 * the existing schedule data. Returns null when the Mush-haf is finished
 * (page 604 entered).
 */
export function getStartDayAfterPriorFace(page: number, half: 'h1' | 'h2' | null): number | null {
  if (!Number.isInteger(page) || page < 1 || page > 604) return null;
  const items = scheduleData as ScheduleItem[];

  if (half === 'h1') {
    const secondHalf = items.find((d) => normalizeFaceKey(d.faceNumber) === `${page} h2`);
    if (secondHalf) return secondHalf.dayNumber;
  }

  const nextPage = items.find((d) => getSurahPageNumber(d.faceNumber) === page + 1);
  if (nextPage) return nextPage.dayNumber;

  return null;
}

interface PageAyahInfo {
  s: number;
  sa: number;
  e: number;
  ea: number;
  n: number;
}

export interface AyahRange {
  page: number;
  half: 'h1' | 'h2' | null;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  totalAyahs: number;
}

function enumeratePageAyahs(info: PageAyahInfo): { surah: number; ayah: number }[] {
  const result: { surah: number; ayah: number }[] = [];
  for (let s = info.s; s <= info.e; s++) {
    const totalVerses = SURAH_LIST[s - 1]?.totalVerses ?? 0;
    const fromAyah = s === info.s ? info.sa : 1;
    const toAyah = s === info.e ? info.ea : totalVerses;
    for (let a = fromAyah; a <= toAyah; a++) {
      result.push({ surah: s, ayah: a });
    }
  }
  return result;
}

export function getAyahListForFace(faceNumber: string): { surah: number; ayah: number; page: number }[] {
  if (!faceNumber) return [];
  const match = faceNumber.trim().match(/^(\d+)\s*(h1|h2)?$/i);
  if (!match) return [];
  const page = parseInt(match[1], 10);
  const half = match[2] ? (match[2].toLowerCase() as 'h1' | 'h2') : null;
  const info = (pageAyahMap as Record<string, PageAyahInfo>)[String(page)];
  if (!info) return [];

  const ayahs = enumeratePageAyahs(info).map(a => ({ ...a, page }));
  if (ayahs.length === 0) return [];

  if (!half || ayahs.length === 1) {
    return ayahs;
  }

  const mid = Math.ceil(ayahs.length / 2);
  const selected = half === 'h1' ? ayahs.slice(0, mid) : ayahs.slice(mid);
  return selected.length > 0 ? selected : ayahs;
}

export function getAyahRangeForFace(faceNumber: string): AyahRange | null {
  const list = getAyahListForFace(faceNumber);
  if (list.length === 0) return null;

  const match = faceNumber.trim().match(/^(\d+)\s*(h1|h2)?$/i);
  const page = match ? parseInt(match[1], 10) : list[0].page;
  const half = match && match[2] ? (match[2].toLowerCase() as 'h1' | 'h2') : null;

  return {
    page,
    half,
    surahNumber: list[0].surah,
    startAyah: list[0].ayah,
    endAyah: list[list.length - 1].ayah,
    totalAyahs: list.length,
  };
}
