import remindersData from '../data/reminders.json';
import { TOTAL_PROGRAM_DAYS } from './schedule-calculator';

export interface DailyReminder {
  id: number;
  category: string;
  text: string;
  source: string | null;
  attribution: string | null;
}

interface RemindersFile {
  poolSize: number;
  totalProgramDays: number;
  translationNote: string;
  sourceNote: string;
  reminders: DailyReminder[];
}

const REMINDERS = remindersData as RemindersFile;

/**
 * The reminder due for a program day. The pool cycles through the whole
 * journey, so every day of the 1,206-day program gets one and each quote
 * reappears every `poolSize` days until khatm.
 */
export function getReminderForDay(dayNumber: number): DailyReminder | null {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_PROGRAM_DAYS) {
    return null;
  }
  const pool = REMINDERS.reminders;
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const item = pool[(dayNumber - 1) % pool.length] as DailyReminder;
  return item ?? null;
}
