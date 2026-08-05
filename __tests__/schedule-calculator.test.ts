import { calculateCurrentDay, calculateStreak, localDateString, parseLocalDateString, daysBetweenDates } from '../utils/schedule-calculator';

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

describe('calculateCurrentDay', () => {
  it('returns day 1 when nothing is completed', () => {
    expect(calculateCurrentDay([])).toBe(1);
  });

  it('advances one day per completed day', () => {
    expect(calculateCurrentDay([1])).toBe(2);
    expect(calculateCurrentDay([1, 2])).toBe(3);
  });

  it('is completion-driven: a missed week does not advance the day', () => {
    expect(calculateCurrentDay([1, 2, 3])).toBe(4);
    expect(calculateCurrentDay([1, 2, 3, 11, 12, 13])).toBe(7);
  });

  it('clamps to the last day of the program', () => {
    const allDays = Array.from({ length: 1206 }, (_, i) => i + 1);
    expect(calculateCurrentDay(allDays)).toBe(1206);
  });

  it('handles unordered and duplicate input', () => {
    expect(calculateCurrentDay([3, 1, 1, 2])).toBe(4);
  });

  it('handles sparse completions (out-of-order completion is possible)', () => {
    expect(calculateCurrentDay([1, 3])).toBe(3);
  });
});

describe('localDateString / parseLocalDateString', () => {
  it('round-trips a date through local timezone', () => {
    const d = new Date(2024, 0, 5, 12, 30);
    const s = localDateString(d);
    expect(s).toBe('2024-01-05');
    const back = parseLocalDateString(s);
    expect(back.getFullYear()).toBe(2024);
    expect(back.getMonth()).toBe(0);
    expect(back.getDate()).toBe(5);
  });

  it('does not shift dates across UTC boundaries (tz-safe)', () => {
    const lateEvening = new Date(2024, 6, 15, 23, 45);
    expect(localDateString(lateEvening)).toBe('2024-07-15');
    const earlyMorning = new Date(2024, 6, 15, 0, 5);
    expect(localDateString(earlyMorning)).toBe('2024-07-15');
  });

  it('parses single-digit month/day', () => {
    const d = parseLocalDateString('2024-03-05');
    expect(d.getDate()).toBe(5);
    expect(d.getMonth()).toBe(2);
  });
});

describe('daysBetweenDates', () => {
  it('counts days across month boundaries', () => {
    expect(daysBetweenDates('2024-07-31', '2024-08-01')).toBe(1);
    expect(daysBetweenDates('2024-01-31', '2024-02-01')).toBe(1);
    expect(daysBetweenDates('2023-12-31', '2024-01-01')).toBe(1);
  });

  it('is negative when end precedes start', () => {
    expect(daysBetweenDates('2024-08-01', '2024-07-31')).toBe(-1);
  });
});

describe('calculateStreak', () => {
  it('returns zeros for no completions', () => {
    expect(calculateStreak([])).toEqual({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  });

  it('counts a single completion today', () => {
    expect(calculateStreak([dateOffset(0)])).toEqual({ currentStreak: 1, longestStreak: 1, totalCompleted: 1 });
  });

  it('keeps the streak alive for a completion yesterday', () => {
    expect(calculateStreak([dateOffset(-1)])).toEqual({ currentStreak: 1, longestStreak: 1, totalCompleted: 1 });
  });

  it('breaks the streak when the last completion is older than yesterday', () => {
    const result = calculateStreak([dateOffset(-2)]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.totalCompleted).toBe(1);
  });

  it('counts a run ending yesterday plus a run ending today', () => {
    const dates = [dateOffset(0), dateOffset(-1), dateOffset(-2), dateOffset(-4), dateOffset(-5)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalCompleted).toBe(5);
  });

  it('finds the longest streak from a mid-history run', () => {
    const dates = [dateOffset(-2), dateOffset(-10), dateOffset(-11), dateOffset(-12), dateOffset(-13)];
    const result = calculateStreak(dates);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(4);
    expect(result.totalCompleted).toBe(5);
  });

  it('deduplicates repeated dates', () => {
    const result = calculateStreak([dateOffset(0), dateOffset(0), dateOffset(-1)]);
    expect(result.totalCompleted).toBe(2);
    expect(result.currentStreak).toBe(2);
  });

  it('ignores invalid date strings', () => {
    const result = calculateStreak([dateOffset(0), 'not-a-date', '']);
    expect(result.totalCompleted).toBe(1);
  });
});
