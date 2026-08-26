import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceUtcOffsetHour } from '../utils/timezone';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIF_ENABLED_KEY = 'setting_notif_enabled';
const NOTIF_TIME_KEY = 'setting_notif_time'; // format: "HH:MM" (24h)
const SESSION_NOTIF_ENABLED_KEY = 'setting_session_notif_enabled';
const SESSION_NOTIF_TIME_KEY = 'setting_session_notif_time'; // "HH:MM" 24h local
// Source data of the Makkah-based session reminder, kept so it can be
// re-scheduled automatically when the device timezone offset changes (DST).
const SESSION_SRC_MAKKAH_TIME_KEY = 'setting_session_src_makkah_time';
const SESSION_SRC_MAKKAH_DAYS_KEY = 'setting_session_src_makkah_days';
const SESSION_TZ_OFFSET_KEY = 'setting_session_tz_offset';

/** Parse "5:20 pm" / "17:20" / "1 pm" into { hour, minute } 24h. */
function parseSessionTime(t: string): { hour: number; minute: number } | null {
  const s = t.trim().toLowerCase();
  let m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3];
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return { hour: h, minute: min };
  }
  m = s.match(/(\d{1,2})\s*(am|pm)/);
  if (m) {
    let h = parseInt(m[1], 10);
    if (m[2] === 'pm' && h !== 12) h += 12;
    if (m[2] === 'am' && h === 12) h = 0;
    return { hour: h, minute: 0 };
  }
  return null;
}

/** Extract the first time found in the ustad timing string. */
export function extractSessionTime(timing: string): string | null {
  const m = timing.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})/i);
  return m ? m[1] : null;
}

export interface LocalSessionSchedule {
  time: string;
  weekdays: number[];
}

export function convertMakkahSessionToLocal(
  timing: string,
  makkahWeekdays: number[],
  targetUtcOffset: number
): LocalSessionSchedule | null {
  const time = extractSessionTime(timing);
  const parsed = time ? parseSessionTime(time) : null;
  if (!parsed || parsed.hour > 23 || parsed.minute > 59) return null;

  const shiftMinutes = Math.round((targetUtcOffset - 3) * 60);
  const localTotal = parsed.hour * 60 + parsed.minute + shiftMinutes;
  const dayShift = Math.floor(localTotal / 1440);
  const normalized = ((localTotal % 1440) + 1440) % 1440;
  const localHour = Math.floor(normalized / 60);
  const localMinute = normalized % 60;
  const weekdays = [...new Set(makkahWeekdays)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .map((day) => (day + dayShift + 7) % 7);

  return {
    time: `${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`,
    weekdays: [...new Set(weekdays)],
  };
}

export class NotificationService {
  // Serial chains so rapid changes each run to completion in order and the
  // latest request is never dropped or overwritten by an older in-flight one.
  private static dailyQueue: Promise<unknown> = Promise.resolve();
  private static sessionQueue: Promise<unknown> = Promise.resolve();

  /**
   * Request notification permission from user.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  }

  /**
   * Schedule daily recurring notification at a specific time.
   */
  static scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
    const run = this.dailyQueue.then(() => this.scheduleDailyReminderInternal(hour, minute));
    this.dailyQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private static async scheduleDailyReminderInternal(hour: number, minute: number): Promise<boolean> {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      return false;
    }
    let newIdentifier: string | null = null;
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tikrar_daily', {
          name: 'Daily Tikrar Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4A843',
        });
      }

      const scheduled = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Time for Tikrar Daily Portion',
          body: "Open your Mus-haf and complete today's 6 memorization phases.",
          sound: true,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: Platform.OS === 'android' ? 'tikrar_daily' : undefined,
        },
      });
      newIdentifier = scheduled;
      await this.cancelNotificationsByType('daily_reminder', new Set([newIdentifier]));

      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      await AsyncStorage.setItem(NOTIF_TIME_KEY, timeStr);

      return true;
    } catch (e) {
      if (newIdentifier) {
        try { await Notifications.cancelScheduledNotificationAsync(newIdentifier); } catch {}
      }
      console.warn('Error scheduling daily reminder:', e);
      return false;
    }
  }

  /**
   * Cancel the daily reminder.
   */
  private static async cancelNotificationsByType(type: string, keep = new Set<string>()): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (!keep.has(notification.identifier) && (notification.content?.data as { type?: string } | undefined)?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  static async cancelDailyReminder(): Promise<void> {
    try {
      await this.cancelNotificationsByType('daily_reminder');
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    } catch (e) {
      console.warn('Error canceling notifications:', e);
    }
  }

  /**
   * Send an immediate test notification to verify on device.
   */
  static async sendTestNotification(): Promise<boolean> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tikrar_daily', {
          name: 'Daily Tikrar Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4A843',
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Tikrar Test Reminder',
          body: 'MashaAllah! Notifications are working properly on your device.',
          sound: true,
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });

      return true;
    } catch (e) {
      console.warn('Error sending test notification:', e);
      return false;
    }
  }

  /**
   * Get current notification settings.
   */
  static async getNotificationSettings(): Promise<{ enabled: boolean; time: string }> {
    try {
      const enabledVal = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
      const timeVal = await AsyncStorage.getItem(NOTIF_TIME_KEY);
      return {
        enabled: enabledVal === 'true',
        time: timeVal || '06:00',
      };
    } catch (e) {
      return { enabled: false, time: '06:00' };
    }
  }

  /**
   * Schedule a daily notification 15 minutes before the ustad session time.
   */
  static scheduleSessionReminder(timing: string, sessionDays: number[] = [0, 1, 2, 3, 4, 5, 6]): Promise<boolean> {
    const run = this.sessionQueue.then(() => this.scheduleSessionReminderInternal(timing, sessionDays));
    this.sessionQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private static async scheduleSessionReminderInternal(timing: string, sessionDays: number[]): Promise<boolean> {
    const newIdentifiers: string[] = [];
    try {
      const timeStr = extractSessionTime(timing);
      if (!timeStr) return false;
      const parsed = parseSessionTime(timeStr);
      if (!parsed) return false;

      let minute = parsed.minute - 15;
      let hour = parsed.hour;
      if (minute < 0) {
        minute += 60;
        hour = (hour + 23) % 24;
      }

      const granted = await this.requestPermissions();
      if (!granted) return false;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tikrar_session', {
          name: 'Ustad Session Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4A843',
        });
      }

      const validDays = [...new Set(sessionDays)].filter((day) => day >= 0 && day <= 6);
      if (validDays.length === 0) return false;
      for (const day of validDays) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎓 Ustad session in 15 minutes',
            body: 'Prepare your portion and be ready to recite to your ustad.',
            sound: true,
            data: { type: 'session_reminder', weekday: day },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1,
            hour,
            minute,
            channelId: Platform.OS === 'android' ? 'tikrar_session' : undefined,
          },
        });
        newIdentifiers.push(identifier);
      }
      await this.cancelNotificationsByType('session_reminder', new Set(newIdentifiers));

      await AsyncStorage.setItem(SESSION_NOTIF_ENABLED_KEY, 'true');
      const saved = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      await AsyncStorage.setItem(SESSION_NOTIF_TIME_KEY, saved);
      return true;
    } catch (e) {
      for (const identifier of newIdentifiers) {
        try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch {}
      }
      console.warn('Error scheduling session reminder:', e);
      return false;
    }
  }

  /**
   * Makkah-time helper: converts then schedules, and persists the source so
   * a DST / travel timezone shift can be detected and auto-fixed on next app open.
   */
  static async scheduleSessionReminderMakkah(timing: string, makkahWeekdays: number[]): Promise<boolean> {
    const deviceOffset = getDeviceUtcOffsetHour();
    const local = convertMakkahSessionToLocal(timing, makkahWeekdays, deviceOffset);
    if (!local) return false;
    const ok = await this.scheduleSessionReminder(local.time, local.weekdays);
    if (ok) {
      await AsyncStorage.setItem(SESSION_SRC_MAKKAH_TIME_KEY, timing);
      await AsyncStorage.setItem(SESSION_SRC_MAKKAH_DAYS_KEY, JSON.stringify(makkahWeekdays));
      await AsyncStorage.setItem(SESSION_TZ_OFFSET_KEY, String(deviceOffset));
    }
    return ok;
  }

  /** Re-schedule if the device UTC offset changed since last Makkah schedule (DST/travel). */
  static async resyncSessionReminderIfTimezoneChanged(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(SESSION_NOTIF_ENABLED_KEY);
      if (enabled !== 'true') return false;
      const srcTime = await AsyncStorage.getItem(SESSION_SRC_MAKKAH_TIME_KEY);
      if (!srcTime) return false;
      const rawDays = await AsyncStorage.getItem(SESSION_SRC_MAKKAH_DAYS_KEY);
      const storedOffset = await AsyncStorage.getItem(SESSION_TZ_OFFSET_KEY);
      const current = String(getDeviceUtcOffsetHour());
      if (storedOffset === current) return false;
      const days: number[] = rawDays ? (JSON.parse(rawDays) as number[]) : [];
      return await this.scheduleSessionReminderMakkah(srcTime, days);
    } catch {
      return false;
    }
  }

  /**
   * Cancel only the session reminder, keeping the daily reminder intact.
   */
  static async cancelSessionReminder(): Promise<void> {
    try {
      await this.cancelNotificationsByType('session_reminder');
      await AsyncStorage.setItem(SESSION_NOTIF_ENABLED_KEY, 'false');
      await AsyncStorage.removeItem(SESSION_SRC_MAKKAH_TIME_KEY);
      await AsyncStorage.removeItem(SESSION_SRC_MAKKAH_DAYS_KEY);
      await AsyncStorage.removeItem(SESSION_TZ_OFFSET_KEY);
    } catch (e) {
      console.warn('Error canceling session reminder:', e);
    }
  }

  static async getSessionReminderSettings(): Promise<{ enabled: boolean; time: string }> {
    try {
      const enabledVal = await AsyncStorage.getItem(SESSION_NOTIF_ENABLED_KEY);
      const timeVal = await AsyncStorage.getItem(SESSION_NOTIF_TIME_KEY);
      return { enabled: enabledVal === 'true', time: timeVal || '' };
    } catch {
      return { enabled: false, time: '' };
    }
  }
}
