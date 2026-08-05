export interface FaceRange {
  start: number;
  end: number;
}

export const MAX_FACE_PAGE = 604;
export const MAX_PROGRAM_DAY = 1206;

const FACE_REGEX = /^(\d+)(?:\s+(h1|h2))?$/;

/**
 * Parse a face string into a comparable ordinal.
 *
 * Ordinal model: each half-page of the Mus-haf maps to a unique ordinal
 * `page * 2 - 1 + (half === 'h2' ? 1 : 0)`. The bare "1" and "2" forms used
 * for days 1-2 of the schedule (whole-page faces per the source PDF) map to
 * ordinals 1 and 3 respectively.
 */
export function parseFace(face: string): number {
  const match = face.trim().toLowerCase().match(FACE_REGEX);
  if (!match) {
    throw new Error(`Invalid face number: "${face}"`);
  }
  const page = parseInt(match[1], 10);
  const half = match[2] as 'h1' | 'h2' | undefined;
  if (page === 1 && !half) return 1;
  if (page === 2 && !half) return 3;
  if (!half || page < 1 || page > MAX_FACE_PAGE) {
    throw new Error(`Invalid face number: "${face}"`);
  }
  return page * 2 - 1 + (half === 'h2' ? 1 : 0);
}

export function formatFace(ordinal: number): string {
  if (ordinal === 1) return '1';
  if (ordinal === 3) return '2';
  const page = Math.floor((ordinal + 1) / 2);
  const half = ordinal % 2 === 1 ? 'h1' : 'h2';
  return `${page} ${half}`;
}

/**
 * Parse a range string ("11 h1 → 23 h1", "1 → 2") into { start, end } ordinals.
 * A single bare face (e.g. "3 h1") is accepted and treated as start === end.
 */
export function parseFaceRange(range: string): FaceRange {
  const parts = range.split('→');
  if (parts.length === 1) {
    const ordinal = parseFace(parts[0]);
    return { start: ordinal, end: ordinal };
  }
  if (parts.length !== 2) {
    throw new Error(`Invalid face range: "${range}"`);
  }
  return {
    start: parseFace(parts[0]),
    end: parseFace(parts[1]),
  };
}

/**
 * The face ordinal covered by a program day. Days 1 and 2 are whole-page
 * faces ("1" and "2"); every later day advances exactly one half-page.
 */
export function faceOrdinalForDay(dayNumber: number): number {
  if (dayNumber < 1 || dayNumber > MAX_PROGRAM_DAY) {
    throw new Error(`Day ${dayNumber} out of range 1..${MAX_PROGRAM_DAY}`);
  }
  if (dayNumber <= 1) return 1;
  if (dayNumber === 2) return 3;
  return dayNumber + 2;
}

export function expectedFaceNumber(dayNumber: number): string {
  return formatFace(faceOrdinalForDay(dayNumber));
}

export function isValidFace(face: string): boolean {
  try {
    parseFace(face);
    return true;
  } catch {
    return false;
  }
}
