import scheduleData from '../data/schedule-data.json';
import pageAyahMap from '../data/page-ayah-map.json';
import { SURAH_LIST } from '../data/surah-metadata';
import { parseFaceRange } from './face';

export interface ScheduleItem {
  dayNumber: number;
  faceNumber: string;
  surahName: string;
  tourNumber: number;
  revisionRange: string;
  connectionRange: string;
  /**
   * Program days (inclusive) whose faces make up the connection / revision
   * portion. Only set on the backward schedule, where a portion is contiguous
   * in memorization order but not in Mus-haf page order.
   */
  connectionDays?: [number, number];
  revisionDays?: [number, number];
}

export const TOTAL_PROGRAM_DAYS = 1206;

/**
 * Where the program begins.
 *  - 'forward':  Al-Fatihah first, following the Mus-haf page order.
 *  - 'backward': An-Nas first. Surahs run from 114 down to 1, but every surah
 *    is still memorized from its own beginning to its end.
 */
export type ScheduleDirection = 'forward' | 'backward';

export const SCHEDULE_DIRECTION_KEY = 'scheduleDirection';

let activeDirection: ScheduleDirection = 'forward';

export function normalizeScheduleDirection(value: unknown): ScheduleDirection {
  return value === 'backward' ? 'backward' : 'forward';
}

export function setScheduleDirection(direction: ScheduleDirection): void {
  activeDirection = normalizeScheduleDirection(direction);
}

export function getScheduleDirection(): ScheduleDirection {
  return activeDirection;
}

const FORWARD_SCHEDULE = scheduleData as ScheduleItem[];
let backwardSchedule: ScheduleItem[] | null = null;

/** Program day whose face holds the given face ordinal (see utils/face). */
function dayForFaceOrdinal(ordinal: number): number {
  if (ordinal <= 2) return 1;
  if (ordinal <= 4) return 2;
  return ordinal - 2;
}

function clampDay(day: number): number {
  return Math.max(1, Math.min(TOTAL_PROGRAM_DAYS, day));
}

/** Forward range ("5 h1 → 17 h1") as the inclusive program days it spans. */
function rangeToDays(range: string): [number, number] | null {
  if (!range || !range.trim() || range.trim() === '-') return null;
  try {
    const { start, end } = parseFaceRange(range);
    const a = clampDay(dayForFaceOrdinal(start));
    const b = clampDay(dayForFaceOrdinal(end));
    return a <= b ? [a, b] : [b, a];
  } catch {
    return null;
  }
}

/**
 * The backward schedule reuses the same 1,206 faces in a different order.
 * A face belongs to the surah of its LAST ayah, so each surah opens on the
 * face where it begins. Faces are then ordered by surah descending and, within
 * a surah, in normal Mus-haf order. The tour numbers and the size of the
 * connection and revision windows are taken from the same program day of the
 * forward schedule, so the daily workload matches the original program.
 */
function buildBackwardSchedule(): ScheduleItem[] {
  const keyed = FORWARD_SCHEDULE.map((item, index) => {
    const ayahs = getAyahListForFace(item.faceNumber);
    const surah = ayahs.length > 0 ? ayahs[ayahs.length - 1].surah : 0;
    return { item, index, surah };
  });
  keyed.sort((a, b) => (b.surah - a.surah) || (a.index - b.index));

  const faces = keyed.map((k) => k.item);
  const describe = (days: [number, number] | null): string => {
    if (!days) return '';
    const first = faces[days[0] - 1].faceNumber;
    const last = faces[days[1] - 1].faceNumber;
    return days[0] === days[1] ? first : `${first} → ${last}`;
  };

  return faces.map((face, i) => {
    const template = FORWARD_SCHEDULE[i];
    const connectionDays = rangeToDays(template.connectionRange);
    const revisionDays = rangeToDays(template.revisionRange);
    const result: ScheduleItem = {
      dayNumber: i + 1,
      faceNumber: face.faceNumber,
      surahName: face.surahName,
      tourNumber: template.tourNumber,
      revisionRange: describe(revisionDays),
      connectionRange: describe(connectionDays),
    };
    if (connectionDays) result.connectionDays = connectionDays;
    if (revisionDays) result.revisionDays = revisionDays;
    return result;
  });
}

/** The full 1,206-day schedule for a direction (defaults to the active one). */
export function getSchedule(direction: ScheduleDirection = activeDirection): ScheduleItem[] {
  if (direction !== 'backward') return FORWARD_SCHEDULE;
  if (!backwardSchedule) backwardSchedule = buildBackwardSchedule();
  return backwardSchedule;
}

export function getScheduleItem(
  dayNumber: number,
  direction: ScheduleDirection = activeDirection
): ScheduleItem | null {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_PROGRAM_DAYS) {
    return null;
  }
  const schedule = getSchedule(direction);
  const byIndex = schedule[dayNumber - 1];
  if (byIndex && byIndex.dayNumber === dayNumber) return byIndex;
  return schedule.find((d) => d.dayNumber === dayNumber) ?? null;
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
 * considered memorized, so the returned day is the one right after it in the
 * chosen direction's schedule:
 *  - half 'h1' or 'h2' → the day after that half-page
 *  - no half           → the day after the whole page (its later half)
 * Everything before that day is marked complete, so phase 1 (yesterday's
 * repetition), ustad recitation, connection and revision all resolve from
 * the schedule. Going forward that means "memorized from Al-Fatihah up to
 * this page"; going backward it means "memorized from An-Nas back to this
 * page". Returns null when nothing is left to memorize.
 */
export function getStartDayAfterPriorFace(
  page: number,
  half: 'h1' | 'h2' | null,
  direction: ScheduleDirection = activeDirection
): number | null {
  if (!Number.isInteger(page) || page < 1 || page > 604) return null;

  let lastDay = 0;
  for (const item of getSchedule(direction)) {
    if (getSurahPageNumber(item.faceNumber) !== page) continue;
    const key = normalizeFaceKey(item.faceNumber);
    const isWholePage = !/h[12]$/.test(key);
    if (half && !isWholePage && !key.endsWith(half)) continue;
    if (item.dayNumber > lastDay) lastDay = item.dayNumber;
  }
  if (lastDay === 0) return null;

  const startDay = lastDay + 1;
  return startDay > TOTAL_PROGRAM_DAYS ? null : startDay;
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

/**
 * A readable title for a schedule day. The source data labels the short
 * surahs at the end of the Mus-haf as "Group of Surahs", so those faces are
 * named after the surahs they actually contain.
 */
export function getDisplaySurahName(item: Pick<ScheduleItem, 'surahName' | 'faceNumber'>): string {
  if (item.surahName !== 'Group of Surahs') return item.surahName;
  const numbers = [...new Set(getAyahListForFace(item.faceNumber).map((a) => a.surah))];
  const names = numbers
    .map((n) => SURAH_LIST[n - 1]?.transliteration)
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return item.surahName;
  if (names.length <= 2) return names.join(' · ');
  return `${names[0]} to ${names[names.length - 1]}`;
}
