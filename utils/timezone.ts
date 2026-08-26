/**
 * Live UTC offset helpers.
 *
 * Static per-country offset tables go stale whenever a country shifts for
 * daylight saving time, which silently moves scheduled reminders away from
 * the real session moment. Notifications always fire in DEVICE local time,
 * so the only offset that matters for scheduling is the one the device is
 * using right now. Reading it live at schedule time keeps Makkah-session
 * conversions correct across DST transitions (and travel).
 */

/** Current device UTC offset in hours (e.g. 3 for UTC+3, -5 for UTC-5). */
export function getDeviceUtcOffsetHour(date: Date = new Date()): number {
  return -date.getTimezoneOffset() / 60;
}
