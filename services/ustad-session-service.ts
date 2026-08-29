import { getUserSetting, setUserSetting } from '../database/db';
import { getScheduleItem, getUstadRecitationItem, ScheduleItem } from '../utils/schedule-calculator';

export interface UstadSession {
  dayNumber: number;
  /**
   * Program day of the face that was recited. Older session entries do not
   * have this (the face was always the previous day's), so it is derived as
   * dayNumber - 1 when absent.
   */
  scheduleDay?: number;
  faceNumber: string;
  surahName: string;
  ustadName: string;
  /** ISO timestamp recorded automatically when attendance is tapped. */
  recitedAt: string;
}

const SESSIONS_KEY = 'ustadSessions';

export interface MarkazUstad {
  name: string;
  time: string;
  sessionDays: number[];
}

export const MARKAZ_USTADS: MarkazUstad[] = [
  { name: 'Shaykh Abdullah Al Shehaby', time: 'Sunday, Tuesday 5:20 pm Makkah time', sessionDays: [0, 2] },
  { name: 'Brother Fatin', time: 'Thursday, Friday 6 am Makkah time', sessionDays: [4, 5] },
  { name: 'Brother Abdullah Taim', time: 'Everyday (except Friday) 1 pm Makkah time', sessionDays: [0, 1, 2, 3, 4, 6] },
  { name: 'Brother Muhammad Zain', time: 'Mon to Wednesday 4:05 am Makkah time', sessionDays: [1, 2, 3] },
];

export function getMarkazUstad(name: string): MarkazUstad | null {
  return MARKAZ_USTADS.find((ustad) => ustad.name === name) ?? null;
}

/** JS day numbers (0=Sun..6=Sat) the ustad holds sessions. Custom teachers use stored weekdays when provided. */
export function getUstadSessionDays(teacherName: string, customWeekdays?: number[]): number[] {
  if (!teacherName.trim()) return [];
  const markazUstad = getMarkazUstad(teacherName);
  if (markazUstad) return [...markazUstad.sessionDays];
  if (Array.isArray(customWeekdays) && customWeekdays.length > 0) {
    return [...new Set(customWeekdays)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

export class UstadSessionService {
  static async getSessions(): Promise<UstadSession[]> {
    const raw = await getUserSetting(SESSIONS_KEY, '[]');
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  static async logSession(session: Omit<UstadSession, 'recitedAt'>): Promise<void> {
    const list = await this.getSessions();
    list.push({ ...session, recitedAt: new Date().toISOString() });
    await setUserSetting(SESSIONS_KEY, JSON.stringify(list));
  }

  static async getRecentSessions(limit?: number): Promise<UstadSession[]> {
    const list = await this.getSessions();
    const reversed = list.slice().reverse();
    return limit ? reversed.slice(0, limit) : reversed;
  }

  static async getTotalSessions(): Promise<number> {
    const list = await this.getSessions();
    return list.length;
  }

  static async hasAttendanceForDate(date: string): Promise<boolean> {
    const v = await getUserSetting(`ustadAttendance_${date}`, '');
    return v === 'true';
  }

  /**
   * The face to recite at the next session. Sessions keep track of what was
   * memorized: the next recitation is the face right after the last one
   * recited, so a gap between sessions (e.g. no Friday class) does not skip
   * or repeat faces. Example — sessions Mon-Thu + Sat-Sun: Thursday recites
   * 8h2, Friday has no class, Saturday recites 9h1 (memorized Thursday),
   * Sunday recites 9h2, and so on. Falls back to the previous day's face
   * when nothing has been recited yet or the next face is not memorized yet.
   */
  static async getNextRecitationItem(currentDay: number): Promise<ScheduleItem | null> {
    const fallback = getUstadRecitationItem(currentDay);
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return fallback;
      const last = sessions[sessions.length - 1];
      const lastScheduleDay =
        typeof last.scheduleDay === 'number' && Number.isInteger(last.scheduleDay)
          ? last.scheduleDay
          : last.dayNumber - 1;
      const next = getScheduleItem(lastScheduleDay + 1);
      if (!next || next.dayNumber >= currentDay) return fallback;
      return next;
    } catch {
      return fallback;
    }
  }

  static async setAttendanceForDate(date: string): Promise<void> {
    await setUserSetting(`ustadAttendance_${date}`, 'true');
  }

  static async removeAttendanceForDate(date: string): Promise<void> {
    await setUserSetting(`ustadAttendance_${date}`, '');
    const sessions = await this.getSessions();
    const remaining = sessions.filter((session) => session.recitedAt.slice(0, 10) !== date);
    await setUserSetting(SESSIONS_KEY, JSON.stringify(remaining));
  }
}
