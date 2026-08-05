import { SURAH_LIST } from '../data/surah-metadata';
import pageAyahMap from '../data/page-ayah-map.json';
import { faceOrdinalForDay, formatFace, isValidFace, parseFace, parseFaceRange } from './face';

export interface ScheduleItem {
  dayNumber: number;
  faceNumber: string;
  surahName: string;
  tourNumber: number;
  revisionRange: string;
  connectionRange: string;
}

export interface ScheduleValidationError {
  dayNumber: number;
  field: string;
  message: string;
}

export const TOTAL_DAYS = 1206;
export const GROUP_OF_SURAHS_PAGE = 596;

// The source PDF spells a few surah names differently from surah-metadata.ts.
const SURAH_ALIASES: Record<string, string> = {
  'At-Taubah': 'At-Tawbah',
  'Al-Lail': 'Al-Layl',
  'Al-Mujadilah': 'Al-Mujadila',
};

function normalizeSurahName(name: string): string {
  const aliased = SURAH_ALIASES[name] ?? name;
  return aliased.toLowerCase().replace(/[^a-z]/g, '');
}

function facePage(faceNumber: string): number {
  return parseInt(faceNumber.trim().split(' ')[0], 10);
}

interface PageAyahInfo {
  s: number;
  sa: number;
  e: number;
  ea: number;
  n: number;
}

/**
 * The surahs whose ayahs fall inside the given face, using the same
 * page->ayah enumeration and h1/h2 split as getAyahRangeForFace. This is
 * the app's own ground truth for what a face contains.
 */
function surahsForFace(faceNumber: string): string[] {
  const match = faceNumber.trim().toLowerCase().match(/^(\d+)(?:\s+(h1|h2))?$/);
  if (!match) return [];
  const page = parseInt(match[1], 10);
  const info = (pageAyahMap as Record<string, PageAyahInfo>)[String(page)];
  if (!info) return [];

  const surahOfAyah: number[] = [];
  for (let s = info.s; s <= info.e; s++) {
    const totalVerses = SURAH_LIST[s - 1]?.totalVerses ?? 0;
    const fromAyah = s === info.s ? info.sa : 1;
    const toAyah = s === info.e ? info.ea : totalVerses;
    for (let a = fromAyah; a <= toAyah; a++) {
      surahOfAyah.push(s);
    }
  }
  if (surahOfAyah.length === 0) return [];

  const half = match[2] as 'h1' | 'h2' | undefined;
  const selected = half ? (half === 'h1' ? surahOfAyah.slice(0, Math.ceil(surahOfAyah.length / 2)) : surahOfAyah.slice(Math.ceil(surahOfAyah.length / 2))) : surahOfAyah;
  const names = new Set<string>();
  for (const n of selected) {
    const name = SURAH_LIST[n - 1]?.transliteration;
    if (name) names.add(name);
  }
  return [...names];
}

export function validateScheduleData(items: ScheduleItem[]): ScheduleValidationError[] {
  const errors: ScheduleValidationError[] = [];

  const push = (dayNumber: number, field: string, message: string) => {
    errors.push({ dayNumber, field, message });
  };

  const seenDays = new Set<number>();
  for (const item of items) {
    if (item.dayNumber < 1 || item.dayNumber > TOTAL_DAYS) {
      push(item.dayNumber, 'dayNumber', `Day ${item.dayNumber} out of range 1..${TOTAL_DAYS}`);
    } else if (seenDays.has(item.dayNumber)) {
      push(item.dayNumber, 'dayNumber', `Duplicate day ${item.dayNumber}`);
    }
    seenDays.add(item.dayNumber);
  }
  for (let expected = 1; expected <= TOTAL_DAYS; expected++) {
    if (!seenDays.has(expected)) {
      push(expected, 'dayNumber', `Missing day ${expected}`);
    }
  }

  let prevConnStart: number | null = null;
  let prevConnEnd: number | null = null;
  let prevTour = -1;

  for (const item of items) {
    const day = item.dayNumber;

    if (!isValidFace(item.faceNumber)) {
      push(day, 'faceNumber', `Invalid face "${item.faceNumber}"`);
    } else {
      const ordinal = parseFace(item.faceNumber);
      const expectedOrdinal = faceOrdinalForDay(day);
      if (ordinal !== expectedOrdinal) {
        push(
          day,
          'faceNumber',
          `Face "${item.faceNumber}" (ordinal ${ordinal}) does not match expected face ${formatFace(expectedOrdinal)} (ordinal ${expectedOrdinal}) for day ${day}`
        );
      }
    }

    if (typeof item.tourNumber !== 'number' || item.tourNumber < 0) {
      push(day, 'tourNumber', `Invalid tour number ${item.tourNumber}`);
    } else if (item.tourNumber < prevTour) {
      push(day, 'tourNumber', `Tour decreased from ${prevTour} to ${item.tourNumber}`);
    }
    prevTour = item.tourNumber;

    if (!item.surahName || item.surahName.trim().length === 0) {
      push(day, 'surahName', 'Surah name is empty');
    } else if (facePage(item.faceNumber) >= GROUP_OF_SURAHS_PAGE) {
      if (item.surahName !== 'Group of Surahs') {
        push(day, 'surahName', `Expected "Group of Surahs" for page ${facePage(item.faceNumber)}, got "${item.surahName}"`);
      }
    } else {
      const valid = surahsForFace(item.faceNumber);
      const norm = normalizeSurahName(item.surahName);
      const known = SURAH_LIST.some((s) => normalizeSurahName(s.transliteration) === norm);
      if (!known) {
        push(day, 'surahName', `Unknown surah name "${item.surahName}"`);
      } else if (valid.length > 0 && !valid.some((v) => normalizeSurahName(v) === norm)) {
        push(
          day,
          'surahName',
          `Surah "${item.surahName}" does not match any surah of face "${item.faceNumber}"`
        );
      }
    }

    for (const field of ['revisionRange', 'connectionRange'] as const) {
      const range = item[field];
      if (!range || range.trim().length === 0) continue;
      let parsed;
      try {
        parsed = parseFaceRange(range);
      } catch {
        push(day, field, `Unparsable range "${range}"`);
        continue;
      }
      if (parsed.start > parsed.end) {
        push(day, field, `Range "${range}" has start (${formatFace(parsed.start)}) after end (${formatFace(parsed.end)})`);
      }
      const faceOrdinal = isValidFace(item.faceNumber) ? parseFace(item.faceNumber) : null;
      if (faceOrdinal !== null && parsed.end > faceOrdinal) {
        push(
          day,
          field,
          `Range "${range}" references face ${formatFace(parsed.end)} beyond the face memorized so far (${item.faceNumber})`
        );
      }
      if (field === 'connectionRange') {
        if (prevConnStart !== null && parsed.start < prevConnStart) {
          push(day, field, `Connection start decreased from ${formatFace(prevConnStart)} to ${formatFace(parsed.start)}`);
        }
        if (prevConnEnd !== null && parsed.end < prevConnEnd) {
          push(day, field, `Connection end decreased from ${formatFace(prevConnEnd)} to ${formatFace(parsed.end)}`);
        }
        prevConnStart = parsed.start;
        prevConnEnd = parsed.end;
      }
    }
  }

  return errors;
}
