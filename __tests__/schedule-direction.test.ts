import {
  getSchedule,
  getScheduleItem,
  getStartDayAfterPriorFace,
  getAyahListForFace,
  setScheduleDirection,
  getScheduleDirection,
  normalizeScheduleDirection,
  TOTAL_PROGRAM_DAYS,
} from '../utils/schedule-calculator';

afterEach(() => setScheduleDirection('forward'));

describe('schedule direction', () => {
  it('defaults to forward and normalizes unknown values', () => {
    expect(getScheduleDirection()).toBe('forward');
    expect(normalizeScheduleDirection('backward')).toBe('backward');
    expect(normalizeScheduleDirection('nonsense')).toBe('forward');
    expect(normalizeScheduleDirection(undefined)).toBe('forward');
  });

  it('leaves the forward schedule untouched', () => {
    expect(getScheduleItem(1)!.faceNumber).toBe('1');
    expect(getScheduleItem(1)!.surahName).toBe('Al-Fatihah');
    expect(getScheduleItem(1206)!.faceNumber).toBe('604 h2');
  });

  it('follows the active direction when none is passed', () => {
    setScheduleDirection('backward');
    expect(getScheduleItem(1)!.faceNumber).toBe('604 h2');
    setScheduleDirection('forward');
    expect(getScheduleItem(1)!.faceNumber).toBe('1');
  });
});

describe('backward schedule', () => {
  const backward = getSchedule('backward');
  const forward = getSchedule('forward');

  it('uses every face exactly once', () => {
    expect(backward).toHaveLength(TOTAL_PROGRAM_DAYS);
    expect(backward.map((d) => d.dayNumber)).toEqual(forward.map((d) => d.dayNumber));
    expect([...backward.map((d) => d.faceNumber)].sort()).toEqual([...forward.map((d) => d.faceNumber)].sort());
  });

  it('starts at the end of the Mus-haf and ends with Al-Fatihah', () => {
    expect(backward[0].faceNumber).toBe('604 h2');
    const firstAyahs = getAyahListForFace(backward[0].faceNumber);
    expect(firstAyahs[firstAyahs.length - 1].surah).toBe(114);
    expect(backward[TOTAL_PROGRAM_DAYS - 1].faceNumber).toBe('1');
    expect(backward[TOTAL_PROGRAM_DAYS - 1].surahName).toBe('Al-Fatihah');
  });

  it('never moves to a later surah, and reads each surah front to back', () => {
    const lastSurah = (face: string) => {
      const ayahs = getAyahListForFace(face);
      return ayahs[ayahs.length - 1].surah;
    };
    const forwardIndex = new Map(forward.map((d, i) => [d.faceNumber, i]));
    for (let i = 1; i < backward.length; i++) {
      const prev = lastSurah(backward[i - 1].faceNumber);
      const cur = lastSurah(backward[i].faceNumber);
      expect(cur).toBeLessThanOrEqual(prev);
      if (cur === prev) {
        expect(forwardIndex.get(backward[i].faceNumber)!).toBeGreaterThan(forwardIndex.get(backward[i - 1].faceNumber)!);
      }
    }
  });

  it('keeps the same workload shape as the forward program', () => {
    for (let i = 0; i < TOTAL_PROGRAM_DAYS; i++) {
      expect(backward[i].tourNumber).toBe(forward[i].tourNumber);
      expect(Boolean(backward[i].connectionRange)).toBe(Boolean(forward[i].connectionRange));
      expect(Boolean(backward[i].revisionRange)).toBe(Boolean(forward[i].revisionRange));
    }
  });

  it('only asks to connect and revise faces already memorized', () => {
    for (const item of backward) {
      for (const days of [item.connectionDays, item.revisionDays]) {
        if (!days) continue;
        expect(days[0]).toBeGreaterThanOrEqual(1);
        expect(days[0]).toBeLessThanOrEqual(days[1]);
        expect(days[1]).toBeLessThan(item.dayNumber);
      }
    }
    expect(backward[0].connectionRange).toBe('');
    expect(backward[2].connectionRange).toBe(backward[0].faceNumber);
    expect(backward[3].connectionRange).toBe(`${backward[0].faceNumber} → ${backward[1].faceNumber}`);
  });
});

describe('getStartDayAfterPriorFace by direction', () => {
  it('continues after the entered face going backward', () => {
    const backward = getSchedule('backward');
    expect(getStartDayAfterPriorFace(604, 'h2', 'backward')).toBe(2);
    const day = backward.find((d) => d.faceNumber === '582 h1')!.dayNumber;
    expect(getStartDayAfterPriorFace(582, 'h1', 'backward')).toBe(day + 1);
    const h1 = backward.find((d) => d.faceNumber === '590 h1')!.dayNumber;
    const h2 = backward.find((d) => d.faceNumber === '590 h2')!.dayNumber;
    expect(getStartDayAfterPriorFace(590, null, 'backward')).toBe(Math.max(h1, h2) + 1);
  });

  it('returns null when the last backward face is already memorized', () => {
    expect(getStartDayAfterPriorFace(1, null, 'backward')).toBeNull();
  });
});

describe('getDisplaySurahName', () => {
  const { getDisplaySurahName } = require('../utils/schedule-calculator');
  it('keeps ordinary surah names', () => {
    expect(getDisplaySurahName(getScheduleItem(1, 'forward')!)).toBe('Al-Fatihah');
  });
  it('names the surahs inside a "Group of Surahs" face', () => {
    const last = getScheduleItem(1206, 'forward')!;
    expect(last.surahName).toBe('Group of Surahs');
    const name = getDisplaySurahName(last);
    expect(name).not.toBe('Group of Surahs');
    expect(name).toContain('An-Nas');
  });
  it('marks a surah that is only partly inside the face with its ayahs', () => {
    expect(getDisplaySurahName(getScheduleItem(1, 'backward')!)).toBe('Al-Falaq 5 · An-Nas');
    expect(getDisplaySurahName(getScheduleItem(2, 'backward')!)).toBe('Al-Ikhlas · Al-Falaq 1-4');
  });
});
