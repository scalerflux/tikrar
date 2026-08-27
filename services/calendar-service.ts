import * as Calendar from 'expo-calendar';
import { getUserSetting, setUserSetting } from '../database/db';

const CALENDAR_NAME = 'Tikrar Ustad Sessions';
const CALENDAR_ID_KEY = 'calendarTikrarId';
const EVENT_IDS_KEY = 'calendarEventIds';
const SESSION_LENGTH_MINUTES = 60;

export interface UstadSessionSchedule {
  teacherName: string;
  /** 12h clock string like "5:30 pm". */
  time12h: string;
  /** JS weekday indexes (0=Sun..6=Sat). */
  weekdays: number[];
}

function parseTime12h(t: string): { hour: number; minute: number } | null {
  const m = t.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { hour: h, minute: min };
}

/** Next date falling on the given JS weekday (0=Sun), at the given local hour/minute. */
function nextOccurrence(weekday: number, hour: number, minute: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= now.getTime()) delta = 7;
  return new Date(d.getTime() + delta * 24 * 60 * 60 * 1000);
}

async function ensurePermission(): Promise<boolean> {
  const res = await Calendar.requestCalendarPermissionsAsync();
  return res.granted;
}

async function getOrCreateCalendar(): Promise<string | null> {
  const stored = await getUserSetting(CALENDAR_ID_KEY, '');
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const found = stored ? calendars.find((c) => c.id === stored) : undefined;
    if (found && found.allowsModifications) return found.id;
    const byName = calendars.find((c) => c.name === CALENDAR_NAME && c.allowsModifications);
    if (byName) {
      await setUserSetting(CALENDAR_ID_KEY, byName.id);
      return byName.id;
    }
    const writable = calendars.find((c) => c.allowsModifications);
    const calendarId = await Calendar.createCalendarAsync({
      title: CALENDAR_NAME,
      name: CALENDAR_NAME,
      color: '#D4A843',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: writable?.source?.id,
      source: writable?.source,
      accessLevel: Calendar.CalendarAccessLevel.OWNER as any,
      ownerAccount: writable?.ownerAccount ?? 'local',
      isVisible: true,
      isPrimary: false,
    });
    await setUserSetting(CALENDAR_ID_KEY, calendarId);
    return calendarId;
  } catch {
    return null;
  }
}

async function deleteStoredEvents(): Promise<void> {
  try {
    const raw = await getUserSetting(EVENT_IDS_KEY, '[]');
    const ids = JSON.parse(raw) as string[];
    for (const id of ids) {
      try {
        await Calendar.deleteEventAsync(id, { futureEvents: true });
      } catch {}
    }
  } catch {}
  await setUserSetting(EVENT_IDS_KEY, '[]');
}

/**
 * Best-effort sync of the weekly ustad sessions into a dedicated device calendar.
 * Replaces previously synced sessions with the current schedule.
 */
export class CalendarService {
  static async syncUstadSessions(schedule: UstadSessionSchedule): Promise<{ ok: boolean; reason?: string; created: number }> {
    try {
      const ok = await ensurePermission();
      if (!ok) return { ok: false, reason: 'permission', created: 0 };
      await deleteStoredEvents();
      if (!schedule.weekdays.length) return { ok: true, created: 0 };
      const t = parseTime12h(schedule.time12h);
      if (!t) return { ok: false, reason: 'time', created: 0 };
      const calendarId = await getOrCreateCalendar();
      if (!calendarId) return { ok: false, reason: 'calendar', created: 0 };

      // expo-calendar: Sunday=1..Saturday=7
      const expoDay = (jsDay: number): number => jsDay + 1;
      const ids: string[] = [];
      for (const jsDay of schedule.weekdays) {
        const start = nextOccurrence(jsDay, t.hour, t.minute);
        const end = new Date(start.getTime() + SESSION_LENGTH_MINUTES * 60 * 1000);
        try {
          const id = await Calendar.createEventAsync(calendarId, {
            title: `Quran Session \u2022 ${schedule.teacherName}`,
            startDate: start,
            endDate: end,
            allDay: false,
            alarms: [{ relativeOffset: 15, method: Calendar.AlarmMethod.ALERT }],
            recurrenceRule: {
              frequency: Calendar.Frequency.WEEKLY,
              interval: 1,
              daysOfTheWeek: [{ dayOfTheWeek: expoDay(jsDay) }],
            },
          } as any);
          ids.push(id);
        } catch {}
      }
      await setUserSetting(EVENT_IDS_KEY, JSON.stringify(ids));
      return { ok: true, created: ids.length };
    } catch {
      return { ok: false, reason: 'error', created: 0 };
    }
  }

  static async removeUstadSessions(): Promise<void> {
    try {
      const ok = await ensurePermission();
      if (ok) await deleteStoredEvents();
    } catch {}
  }
}
