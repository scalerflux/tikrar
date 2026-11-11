import {
  getSchedule,
  getScheduleItem,
  getStartDayAfterPriorFace,
  getAyahListForFace,
  getPortionKey,
  getDisplaySurahName,
  setScheduleDirection,
  getScheduleDirection,
  normalizeScheduleDirection,
  TOTAL_PROGRAM_DAYS,
} from '../utils/schedule-calculator';
import { SURAH_LIST } from '../data/surah-metadata';

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
    expect(getScheduleItem(1)!.faceNumber).toBe('604');
    setScheduleDirection('forward');
    expect(getScheduleItem(1)!.faceNumber).toBe('1');
  });
});

describe('backward schedule', () => {
  const backward = getSchedule('backward');
  const forward = getSchedule('forward');
  const ayahsOf = (item: (typeof backward)[number]) => getAyahListForFace(getPortionKey(item));
  const lastSurah = (item: (typeof backward)[number]) => {
    const ayahs = ayahsOf(item);
    return ayahs[ayahs.length - 1].surah;
  };

  it('has the same 1,206 days as the forward program', () => {
    expect(backward).toHaveLength(TOTAL_PROGRAM_DAYS);
    expect(backward.map((d) => d.dayNumber)).toEqual(forward.map((d) => d.dayNumber));
  });

  it('covers every ayah of the Quran', () => {
    const seen = new Map<string, number>();
    for (const item of backward) {
      for (const a of ayahsOf(item)) {
        const key = `${a.surah}:${a.ayah}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
    }
    const total = SURAH_LIST.reduce((sum, s) => sum + s.totalVerses, 0);
    expect(seen.size).toBe(total);
    // Page 48 is the single long ayah 2:282, so both of its halves hold it.
    // That is the same in the forward program.
    const repeated = [...seen].filter(([, count]) => count !== 1).map(([key]) => key);
    expect(repeated).toEqual(['2:282']);
  });

  it('starts with An-Nas and ends with Al-Fatihah', () => {
    expect(ayahsOf(backward[0]).map((a) => a.surah)).toEqual([114, 114, 114, 114, 114, 114]);
    expect(getDisplaySurahName(backward[0])).toBe('An-Nas');
    expect(backward[TOTAL_PROGRAM_DAYS - 1].faceNumber).toBe('1');
    expect(backward[TOTAL_PROGRAM_DAYS - 1].surahName).toBe('Al-Fatihah');
  });

  it('never cuts a short surah in two', () => {
    // Every surah that fits on one page, counting down from An-Nas.
    const wholeDays = backward.filter((d) => d.portionKey && !/h[12]$/.test(d.faceNumber));
    expect(wholeDays.length).toBeGreaterThan(10);
    const covered = new Set<number>();
    for (const day of wholeDays) {
      const bySurah = new Map<number, number>();
      for (const a of ayahsOf(day)) bySurah.set(a.surah, (bySurah.get(a.surah) ?? 0) + 1);
      for (const [surah, count] of bySurah) {
        expect(count).toBe(SURAH_LIST[surah - 1].totalVerses);
        covered.add(surah);
      }
    }
    // They are the first days of the program and form one unbroken run.
    expect(wholeDays.map((d) => d.dayNumber)).toEqual(wholeDays.map((_, i) => i + 1));
    const lowest = Math.min(...covered);
    for (let n = lowest; n <= 114; n++) expect(covered.has(n)).toBe(true);
    for (const n of [114, 113, 112, 103, 101, 97, 93]) expect(covered.has(n)).toBe(true);
  });

  it('never moves to a later surah', () => {
    for (let i = 1; i < backward.length; i++) {
      expect(lastSurah(backward[i])).toBeLessThanOrEqual(lastSurah(backward[i - 1]));
    }
  });

  it('keeps the same workload shape as the forward program', () => {
    for (let i = 0; i < TOTAL_PROGRAM_DAYS; i++) {
      expect(backward[i].tourNumber).toBe(forward[i].tourNumber);
      expect(Boolean(backward[i].connectionRange)).toBe(Boolean(forward[i].connectionRange));
      expect(Boolean(backward[i].revisionRange)).toBe(Boolean(forward[i].revisionRange));
    }
  });

  it('only asks to connect and revise days already memorized', () => {
    for (const item of backward) {
      for (const days of [item.connectionDays, item.revisionDays]) {
        if (!days) continue;
        expect(days[0]).toBeGreaterThanOrEqual(1);
        expect(days[0]).toBeLessThanOrEqual(days[1]);
        expect(days[1]).toBeLessThan(item.dayNumber);
      }
    }
    expect(backward[0].connectionRange).toBe('');
    expect(backward[2].connectionDays).toEqual([1, 1]);
    expect(backward[3].connectionDays).toEqual([1, 2]);
  });
});

describe('getStartDayAfterPriorFace by direction', () => {
  it('continues after the entered face going backward', () => {
    const backward = getSchedule('backward');
    const day = backward.find((d) => d.faceNumber === '582 h1')!.dayNumber;
    expect(getStartDayAfterPriorFace(582, 'h1', 'backward')).toBe(day + 1);
    const h1 = backward.find((d) => d.faceNumber === '590 h1')!.dayNumber;
    const h2 = backward.find((d) => d.faceNumber === '590 h2')!.dayNumber;
    expect(getStartDayAfterPriorFace(590, null, 'backward')).toBe(Math.max(h1, h2) + 1);
  });

  it('treats a whole-surah day as covering each page it touches', () => {
    // Page 604 holds Al-Ikhlas, Al-Falaq and An-Nas: three whole-surah days.
    expect(getStartDayAfterPriorFace(604, null, 'backward')).toBe(4);
  });

  it('returns null when the last backward face is already memorized', () => {
    expect(getStartDayAfterPriorFace(1, null, 'backward')).toBeNull();
  });
});

describe('getDisplaySurahName', () => {
  it('keeps ordinary surah names', () => {
    expect(getDisplaySurahName(getScheduleItem(1, 'forward')!)).toBe('Al-Fatihah');
  });
  it('names the surahs inside a "Group of Surahs" face', () => {
    const last = getScheduleItem(1206, 'forward')!;
    expect(last.surahName).toBe('Group of Surahs');
    expect(getDisplaySurahName(last)).toBe('Al-Falaq 5 · An-Nas');
  });
  it('names whole-surah days going backward', () => {
    expect(getDisplaySurahName(getScheduleItem(2, 'backward')!)).toBe('Al-Falaq');
    expect(getDisplaySurahName(getScheduleItem(4, 'backward')!)).toBe('An-Nasr · Al-Masad');
  });
});
