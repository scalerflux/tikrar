jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    throw new Error('no sqlite in tests');
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeMissedDays } from '../services/negligence-service';
import { UstadSessionService } from '../services/ustad-session-service';
import { getScheduleItem, getStartDayAfterPriorFace } from '../utils/schedule-calculator';

describe('getStartDayAfterPriorFace (onboarding prior portion)', () => {
  it('continues from 9 h2 when the user memorized the first half of page 9', () => {
    const startDay = getStartDayAfterPriorFace(9, 'h1');
    expect(startDay).toBe(16);
    expect(getScheduleItem(startDay!)!.faceNumber).toBe('9 h2');
  });

  it('continues from 10 h1 when the user memorized the full page 9 or its second half', () => {
    expect(getStartDayAfterPriorFace(9, null)).toBe(17);
    expect(getStartDayAfterPriorFace(9, 'h2')).toBe(17);
    expect(getScheduleItem(17)!.faceNumber).toBe('10 h1');
  });

  it('keeps the legacy behaviour for whole pages 1 and 2', () => {
    expect(getStartDayAfterPriorFace(1, null)).toBe(2);
    expect(getStartDayAfterPriorFace(2, null)).toBe(3);
  });

  it('treats a half of a whole-page (days 1-2) face as done and moves on', () => {
    expect(getStartDayAfterPriorFace(1, 'h1')).toBe(2);
    expect(getStartDayAfterPriorFace(2, 'h2')).toBe(3);
  });

  it('returns null when the user already memorized the whole Mus-haf', () => {
    expect(getStartDayAfterPriorFace(604, null)).toBeNull();
    expect(getStartDayAfterPriorFace(604, 'h2')).toBeNull();
    expect(getStartDayAfterPriorFace(604, 'h1')).toBe(1206);
    expect(getStartDayAfterPriorFace(0, null)).toBeNull();
    expect(getStartDayAfterPriorFace(605, null)).toBeNull();
  });
});

describe('computeMissedDays (excuse prompt detection)', () => {
  const TODAY = '2026-08-27';
  const YESTERDAY = '2026-08-26';

  it('flags yesterday when the user opened the app but missed the confirm button', () => {
    const missed = computeMissedDays(YESTERDAY, TODAY, [], [], 5);
    expect(missed).toEqual([{ date: YESTERDAY, dayNumber: 5 }]);
  });

  it('does not prompt when nothing was missed', () => {
    expect(computeMissedDays(TODAY, TODAY, [], [], 5)).toEqual([]);
    expect(computeMissedDays('', TODAY, [], [], 5)).toEqual([]);
    expect(computeMissedDays(YESTERDAY, TODAY, [YESTERDAY], [], 5)).toEqual([]);
    expect(computeMissedDays(YESTERDAY, TODAY, [], [YESTERDAY], 5)).toEqual([]);
  });

  it('flags every unexcused, uncompleted day since the last open', () => {
    const missed = computeMissedDays('2026-08-24', TODAY, ['2026-08-25'], [], 5);
    expect(missed.map((m) => m.date)).toEqual(['2026-08-24', '2026-08-26']);
  });

  it('does not flag days already covered by an excuse in a multi-day gap', () => {
    const missed = computeMissedDays('2026-08-24', TODAY, [], ['2026-08-24'], 5);
    expect(missed.map((m) => m.date)).toEqual(['2026-08-25', '2026-08-26']);
  });
});

describe('UstadSessionService.getNextRecitationItem (recitation tracking)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (AsyncStorage.clear as jest.Mock)?.();
  });

  it('falls back to the previous day\'s face when nothing was recited yet', async () => {
    const item = await UstadSessionService.getNextRecitationItem(33);
    expect(item?.dayNumber).toBe(32);
  });

  it('shows the face after the last recited one, so a skipped session day does not skip faces', async () => {
    // Thursday: recited 8h2 (face of program day 32) while completing day 33.
    await UstadSessionService.logSession({
      dayNumber: 33,
      scheduleDay: 32,
      faceNumber: getScheduleItem(32)!.faceNumber,
      surahName: getScheduleItem(32)!.surahName,
      ustadName: 'Test',
    });

    // Saturday (currentDay 35, after the no-session Friday): shows 9h1 = day 33's face.
    const item = await UstadSessionService.getNextRecitationItem(35);
    expect(item?.dayNumber).toBe(33);
    expect(item?.faceNumber).toBe(getScheduleItem(33)!.faceNumber);
  });

  it('keeps daily sessions in lockstep with the previous day\'s face (legacy entries)', async () => {
    // Legacy entry without scheduleDay: face was dayNumber - 1.
    await UstadSessionService.logSession({
      dayNumber: 33,
      faceNumber: getScheduleItem(32)!.faceNumber,
      surahName: getScheduleItem(32)!.surahName,
      ustadName: 'Test',
    });

    const item = await UstadSessionService.getNextRecitationItem(34);
    expect(item?.dayNumber).toBe(33);
  });

  it('falls back when the next face is not memorized yet', async () => {
    await UstadSessionService.logSession({
      dayNumber: 34,
      scheduleDay: 33,
      faceNumber: getScheduleItem(33)!.faceNumber,
      surahName: getScheduleItem(33)!.surahName,
      ustadName: 'Test',
    });

    // Next face would be day 35's, but the user is only on day 35 now.
    const item = await UstadSessionService.getNextRecitationItem(35);
    expect(item?.dayNumber).toBe(34);
  });
});
