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
  /**
   * Exact ayahs of the day when they are not a plain face, written as
   * "ayahs:<surah>:<ayah>-<surah>:<ayah>". Only set on the backward schedule,
   * where short surahs are kept whole. Read it through getPortionKey().
   */
  portionKey?: string;
}

/** The key to resolve a day's ayahs with (audio, translation, titles). */
export function getPortionKey(item: Pick<ScheduleItem, 'faceNumber' | 'portionKey'>): string {
  return item.portionKey ?? item.faceNumber;
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

type Ayah = { surah: number; ayah: number; page: number };

function portionKeyFor(ayahs: Ayah[]): string {
  const first = ayahs[0];
  const last = ayahs[ayahs.length - 1];
  return `ayahs:${first.surah}:${first.ayah}-${last.surah}:${last.ayah}`;
}

/** How much of a Mus-haf page each surah takes, by share of the page's ayahs. */
function surahSizesInPages(): Map<number, number> {
  const sizes = new Map<number, number>();
  const pages = pageAyahMap as Record<string, PageAyahInfo>;
  for (const info of Object.values(pages)) {
    const ayahs = enumeratePageAyahs(info);
    if (ayahs.length === 0) continue;
    for (const a of ayahs) {
      sizes.set(a.surah, (sizes.get(a.surah) ?? 0) + 1 / ayahs.length);
    }
  }
  return sizes;
}

/** A surah counts as short when it fits on a single Mus-haf page. */
const SHORT_SURAH_MAX_PAGES = 1;

/**
 * Split `sizes` (in order) into `groups` contiguous runs so that the largest
 * run is as small as possible. Returns the run lengths.
 */
function balancedPartition(sizes: number[], groups: number): number[] {
  const n = sizes.length;
  const k = Math.max(1, Math.min(groups, n));
  const prefix = [0];
  for (const x of sizes) prefix.push(prefix[prefix.length - 1] + x);
  const best: number[][] = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity));
  const cut: number[][] = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0));
  best[0][0] = 0;
  for (let g = 1; g <= k; g++) {
    for (let i = g; i <= n; i++) {
      for (let j = g - 1; j < i; j++) {
        const worst = Math.max(best[g - 1][j], prefix[i] - prefix[j]);
        if (worst < best[g][i]) {
          best[g][i] = worst;
          cut[g][i] = j;
        }
      }
    }
  }
  const lengths: number[] = [];
  let i = n;
  for (let g = k; g >= 1; g--) {
    const j = cut[g][i];
    lengths.unshift(i - j);
    i = j;
  }
  return lengths;
}

/**
 * The backward schedule covers the same Quran over the same 1,206 days, from
 * An-Nas back to Al-Fatihah.
 *
 *  - The short surahs at the end (every surah from 114 downward that fits on
 *    one page) are never cut: each of those days is one or more whole
 *    surahs, spread evenly over the days those pages take in the forward plan.
 *  - Everything before them uses the normal half-page faces. A face belongs
 *    to the surah of its LAST ayah, so each surah opens on the face where it
 *    begins. Surahs run in descending order, each one front to back.
 *
 * Tour numbers and the size of the connection and revision windows come from
 * the same program day of the forward schedule, so the daily workload matches
 * the original program.
 */
function buildBackwardSchedule(): ScheduleItem[] {
  const keyed = FORWARD_SCHEDULE.map((item, index) => {
    const ayahs = getAyahListForFace(item.faceNumber);
    const surah = ayahs.length > 0 ? ayahs[ayahs.length - 1].surah : 0;
    return { item, index, surah, ayahs };
  });

  // First surah (counting down from 114) that is too long to keep whole.
  const sizes = surahSizesInPages();
  let firstShort = SURAH_LIST.length + 1;
  for (let n = SURAH_LIST.length; n >= 1; n--) {
    if ((sizes.get(n) ?? Infinity) > SHORT_SURAH_MAX_PAGES) break;
    firstShort = n;
  }

  const zoneFaces = keyed.filter((k) => k.surah >= firstShort);
  const faceDays = keyed
    .filter((k) => k.surah < firstShort)
    .sort((a, b) => (b.surah - a.surah) || (a.index - b.index));

  type Day = { faceNumber: string; surahName: string; portionKey?: string };
  const days: Day[] = [];

  // Whole-surah days, last surah first.
  const shortSurahs: number[] = [];
  for (let n = SURAH_LIST.length; n >= firstShort; n--) shortSurahs.push(n);
  if (shortSurahs.length > 0 && zoneFaces.length > 0) {
    const lengths = balancedPartition(shortSurahs.map((n) => sizes.get(n) ?? 0), zoneFaces.length);
    let cursor = 0;
    for (const length of lengths) {
      const group = shortSurahs.slice(cursor, cursor + length).sort((a, b) => a - b);
      cursor += length;
      const first = group[0];
      const last = group[group.length - 1];
      const key = `ayahs:${first}:1-${last}:${SURAH_LIST[last - 1].totalVerses}`;
      const pages = [...new Set(getAyahListForFace(key).map((a) => a.page))];
      const pageLabel = pages.length > 1 ? `${pages[0]}-${pages[pages.length - 1]}` : String(pages[0]);
      days.push({ faceNumber: pageLabel, surahName: 'Group of Surahs', portionKey: key });
    }
  }

  // A face can start in the last long surah and end in the first short one.
  // Its opening ayahs would otherwise be left out, so they join the face
  // before it, which completes that surah.
  const leftovers = new Map<number, Ayah[]>();
  for (const face of zoneFaces) {
    const orphaned = face.ayahs.filter((a) => a.surah < firstShort);
    if (orphaned.length > 0) leftovers.set(face.index - 1, orphaned);
  }

  for (const face of faceDays) {
    const extra = leftovers.get(face.index);
    days.push({
      faceNumber: face.item.faceNumber,
      surahName: face.item.surahName,
      portionKey: extra ? portionKeyFor([...face.ayahs, ...extra]) : undefined,
    });
  }

  const describe = (range: [number, number] | null): string => {
    if (!range) return '';
    // A whole-surah day is clearer by name; a half-page day by its face.
    const label = (day: Day) =>
      day.portionKey && !/h[12]$/.test(day.faceNumber) ? getDisplaySurahName(day) : day.faceNumber;
    const first = label(days[range[0] - 1]);
    const last = label(days[range[1] - 1]);
    return range[0] === range[1] ? first : `${first} → ${last}`;
  };

  return days.map((day, i) => {
    const template = FORWARD_SCHEDULE[i];
    const connectionDays = rangeToDays(template.connectionRange);
    const revisionDays = rangeToDays(template.revisionRange);
    const result: ScheduleItem = {
      dayNumber: i + 1,
      faceNumber: day.faceNumber,
      surahName: day.surahName,
      tourNumber: template.tourNumber,
      revisionRange: describe(revisionDays),
      connectionRange: describe(connectionDays),
    };
    if (connectionDays) result.connectionDays = connectionDays;
    if (revisionDays) result.revisionDays = revisionDays;
    if (day.portionKey) result.portionKey = day.portionKey;
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

export const DEFAULT_FAJR_MINUTES = 5 * 60;

/** Minutes after midnight for a saved "HH:MM" Fajr time (05:00 when invalid). */
export function parseFajrMinutes(value: string | null | undefined): number {
  const match = typeof value === 'string' ? value.match(/^(\d{2}):(\d{2})$/) : null;
  if (!match) return DEFAULT_FAJR_MINUTES;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : DEFAULT_FAJR_MINUTES;
}

/**
 * The program day a moment belongs to. The daily portion runs from the adhan
 * of Fajr to the adhan of Fajr of the next day (precondition 14), so the
 * hours between midnight and Fajr still belong to the previous calendar date.
 */
export function programDateString(fajrMinutes: number = DEFAULT_FAJR_MINUTES, now: Date = new Date()): string {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (minutesNow >= fajrMinutes) return localDateString(now);
  const previous = new Date(now);
  previous.setDate(previous.getDate() - 1);
  return localDateString(previous);
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
export function calculateStreak(completedDates: string[], today: string = localDateString()): StreakInfo {
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
    const key = normalizeFaceKey(item.faceNumber);
    const isWholePage = !/h[12]$/.test(key);
    if (isWholePage && item.portionKey) {
      // Whole-surah day: it counts for every page its surahs touch.
      if (!getAyahListForFace(item.portionKey).some((a) => a.page === page)) continue;
    } else if (getSurahPageNumber(item.faceNumber) !== page) {
      continue;
    }
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

let pageList: { page: number; info: PageAyahInfo }[] | null = null;

/** Ayahs for an explicit "ayahs:S:A-S:A" portion, each tagged with its page. */
function getAyahListForRange(key: string): { surah: number; ayah: number; page: number }[] {
  const m = key.match(/^ayahs:(\d+):(\d+)-(\d+):(\d+)$/);
  if (!m) return [];
  const [fromSurah, fromAyah, toSurah, toAyah] = m.slice(1).map(Number);
  if (!pageList) {
    pageList = Object.entries(pageAyahMap as Record<string, PageAyahInfo>)
      .map(([page, info]) => ({ page: Number(page), info }))
      .sort((a, b) => a.page - b.page);
  }
  const before = (s1: number, a1: number, s2: number, a2: number) => s1 < s2 || (s1 === s2 && a1 < a2);
  const result: { surah: number; ayah: number; page: number }[] = [];
  for (const { page, info } of pageList) {
    if (before(info.e, info.ea, fromSurah, fromAyah)) continue;
    if (before(toSurah, toAyah, info.s, info.sa)) break;
    for (const a of enumeratePageAyahs(info)) {
      if (before(a.surah, a.ayah, fromSurah, fromAyah) || before(toSurah, toAyah, a.surah, a.ayah)) continue;
      result.push({ ...a, page });
    }
  }
  return result;
}

export function getAyahListForFace(faceNumber: string): { surah: number; ayah: number; page: number }[] {
  if (!faceNumber) return [];
  if (faceNumber.startsWith('ayahs:')) return getAyahListForRange(faceNumber);
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
 * named after the surahs they actually contain. A half-page can cut a surah
 * in two, so a surah that is only partly inside the face carries its ayah
 * range ("Al-Falaq 5 · An-Nas") instead of looking like the whole surah.
 */
export function getDisplaySurahName(item: Pick<ScheduleItem, 'surahName' | 'faceNumber' | 'portionKey'>): string {
  if (item.surahName !== 'Group of Surahs') return item.surahName;

  const bySurah = new Map<number, number[]>();
  for (const a of getAyahListForFace(getPortionKey(item))) {
    const list = bySurah.get(a.surah) ?? [];
    list.push(a.ayah);
    bySurah.set(a.surah, list);
  }

  const parts: string[] = [];
  for (const [surah, ayahs] of bySurah) {
    const meta = SURAH_LIST[surah - 1];
    if (!meta) continue;
    if (ayahs.length >= meta.totalVerses) {
      parts.push(meta.transliteration);
      continue;
    }
    const first = ayahs[0];
    const last = ayahs[ayahs.length - 1];
    parts.push(first === last ? `${meta.transliteration} ${first}` : `${meta.transliteration} ${first}-${last}`);
  }

  if (parts.length === 0) return item.surahName;
  if (parts.length <= 2) return parts.join(' · ');
  return `${parts[0]} to ${parts[parts.length - 1]}`;
}
