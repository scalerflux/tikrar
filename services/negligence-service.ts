import { getUserSetting, setUserSetting } from '../database/db';
import { datesBetweenExclusive } from '../utils/schedule-calculator';

export interface Excuse {
  id: string;
  date: string;
  dayNumber: number;
  reason: string;
  createdAt: string;
}

const NEGLIGENCE_KEY = 'negligenceCount';
const EXCUSES_KEY = 'excuses';
const LAST_CONFIRMED_DAY_KEY = 'lastConfirmedDay';
const LAST_CONFIRMED_DATE_KEY = 'lastConfirmedDate';
const LAST_APP_OPEN_KEY = 'lastAppOpenDate';

export interface MissedDay {
  date: string;
  dayNumber: number;
}

/**
 * Pure missed-day detection. A calendar date is "missed" when it falls in
 * the window [lastOpen, today] (inclusive of lastOpen) and is neither
 * completed nor covered by an excuse. Used by the Today screen to decide
 * when to show the excuse prompt, so the rules live in one testable place.
 */
export function computeMissedDays(
  lastOpen: string,
  today: string,
  completedDates: string[],
  excusedDates: string[],
  currentDay: number
): MissedDay[] {
  if (!lastOpen || lastOpen >= today) return [];

  const completed = new Set(completedDates.filter((d) => typeof d === 'string' && d.length > 0));
  const excused = new Set(excusedDates);

  const missed: MissedDay[] = [];
  const candidates = [lastOpen, ...datesBetweenExclusive(lastOpen, today)];
  for (const date of candidates) {
    if (!completed.has(date) && !excused.has(date)) {
      missed.push({ date, dayNumber: currentDay });
    }
  }
  return missed;
}

export class NegligenceService {
  static async getCount(): Promise<number> {
    const v = await getUserSetting(NEGLIGENCE_KEY, '0');
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }

  static async setCount(n: number): Promise<void> {
    await setUserSetting(NEGLIGENCE_KEY, String(Math.max(0, n)));
  }

  static async increment(): Promise<number> {
    const c = await this.getCount();
    const next = c + 1;
    await this.setCount(next);
    return next;
  }

  static async getExcuses(): Promise<Excuse[]> {
    const raw = await getUserSetting(EXCUSES_KEY, '[]');
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  static async addExcuse(date: string, dayNumber: number, reason: string): Promise<void> {
    const list = await this.getExcuses();
    const entry: Excuse = {
      id: `${date}_${dayNumber}_${Date.now()}`,
      date,
      dayNumber,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };
    list.push(entry);
    await setUserSetting(EXCUSES_KEY, JSON.stringify(list));
  }

  static async hasExcuseForDate(date: string): Promise<boolean> {
    const list = await this.getExcuses();
    return list.some((e) => e.date === date);
  }

  static async getLastConfirmed(): Promise<{ dayNumber: number; date: string } | null> {
    const d = await getUserSetting(LAST_CONFIRMED_DAY_KEY, '');
    const date = await getUserSetting(LAST_CONFIRMED_DATE_KEY, '');
    if (!d || !date) return null;
    const n = parseInt(d, 10);
    if (isNaN(n)) return null;
    return { dayNumber: n, date };
  }

  static async setLastConfirmed(dayNumber: number, date: string): Promise<void> {
    await setUserSetting(LAST_CONFIRMED_DAY_KEY, String(dayNumber));
    await setUserSetting(LAST_CONFIRMED_DATE_KEY, date);
  }

  static async getLastAppOpen(): Promise<string> {
    return getUserSetting(LAST_APP_OPEN_KEY, '');
  }

  static async setLastAppOpen(date: string): Promise<void> {
    await setUserSetting(LAST_APP_OPEN_KEY, date);
  }
}
