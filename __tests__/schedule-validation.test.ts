import { validateScheduleData } from '../utils/schedule-validation';
import scheduleData from '../data/schedule-data.json';

describe('validateScheduleData (full dataset)', () => {
  it('passes the complete schedule with no errors', () => {
    const errors = validateScheduleData(scheduleData as never);
    expect(errors).toEqual([]);
  });
});

describe('validateScheduleData (negative cases)', () => {
  // Day 10 is face "6 h1" (ordinal 11); a valid connection range ends at
  // ordinal 10 ("5 h2") and revision ends at the day's own face.
  const baseRow = {
    dayNumber: 10,
    faceNumber: '6 h1',
    tourNumber: 1,
    connectionRange: '5 h1 → 5 h2',
    revisionRange: '5 h2 → 6 h1',
    surahName: 'Al-Baqarah',
  };

  const scheduleWith = (rows: Array<Record<string, unknown>>) => rows as never;

  it('flags gaps in dayNumber', () => {
    const errors = validateScheduleData(scheduleWith([baseRow, { ...baseRow, dayNumber: 12 }]));
    expect(errors.some((e) => e.field === 'dayNumber' && e.message.includes('Missing day'))).toBe(true);
  });

  it('flags duplicate dayNumbers', () => {
    const errors = validateScheduleData(scheduleWith([baseRow, baseRow]));
    expect(errors.some((e) => e.field === 'dayNumber' && e.message.includes('Duplicate'))).toBe(true);
  });

  it('flags connection ranges that reference faces beyond the one memorized', () => {
    const errors = validateScheduleData(
      scheduleWith([{ ...baseRow, connectionRange: '30 h1 → 31 h2' }])
    );
    expect(errors.some((e) => e.field === 'connectionRange' && e.message.includes('beyond the face'))).toBe(true);
  });

  it('flags ranges whose start is after the end', () => {
    const errors = validateScheduleData(
      scheduleWith([{ ...baseRow, connectionRange: '6 h1 → 5 h2' }])
    );
    expect(errors.some((e) => e.field === 'connectionRange' && e.message.includes('after end'))).toBe(true);
  });

  it('flags non-monotonic connection starts', () => {
    const rows = [
      { ...baseRow, dayNumber: 10 },
      { ...baseRow, dayNumber: 11, connectionRange: '4 h2 → 5 h2' },
    ];
    const errors = validateScheduleData(scheduleWith(rows));
    expect(errors.some((e) => e.field === 'connectionRange' && e.message.includes('Connection start decreased'))).toBe(true);
  });

  it('flags unparsable ranges', () => {
    const errors = validateScheduleData(scheduleWith([{ ...baseRow, connectionRange: 'x → y' }]));
    expect(errors.some((e) => e.field === 'connectionRange' && e.message.includes('Unparsable'))).toBe(true);
  });

  it('flags surah names that do not match the face', () => {
    const errors = validateScheduleData(scheduleWith([{ ...baseRow, surahName: 'An-Nisa' }]));
    expect(errors.some((e) => e.field === 'surahName' && e.message.includes('does not match'))).toBe(true);
  });

  it('flags unknown surah names but accepts documented aliases', () => {
    const unknown = validateScheduleData(scheduleWith([{ ...baseRow, surahName: 'NotASurah' }]));
    expect(unknown.some((e) => e.field === 'surahName' && e.message.includes('Unknown'))).toBe(true);

    const aliasCases = [
      { faceNumber: '187 h1', names: ['At-Taubah', 'At-Tawbah'] },
      { faceNumber: '542 h1', names: ['Al-Mujadilah', 'Al-Mujadila'] },
      { faceNumber: '595 h2', names: ['Al-Lail', 'Al-Layl'] },
    ];
    for (const c of aliasCases) {
      for (const name of c.names) {
        const errors = validateScheduleData(scheduleWith([{ ...baseRow, faceNumber: c.faceNumber, surahName: name }]));
        expect(errors.some((e) => e.field === 'surahName')).toBe(false);
      }
    }
  });

  it('requires "Group of Surahs" from page 596 on', () => {
    const good = validateScheduleData(scheduleWith([{ ...baseRow, faceNumber: '596 h1', surahName: 'Group of Surahs' }]));
    expect(good.some((e) => e.field === 'surahName')).toBe(false);

    const bad = validateScheduleData(scheduleWith([{ ...baseRow, faceNumber: '596 h1', surahName: 'Al-Fajr' }]));
    expect(bad.some((e) => e.field === 'surahName')).toBe(true);
  });
});
