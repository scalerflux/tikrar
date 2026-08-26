jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => `notif-${Math.random().toString(36).slice(2)}`),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => {}),
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly' },
  AndroidImportance: { HIGH: 4 },
}));

import { convertMakkahSessionToLocal, NotificationService } from '../services/notification-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

describe('convertMakkahSessionToLocal', () => {
  it('converts the session time without changing the weekday', () => {
    expect(convertMakkahSessionToLocal('5:20 pm Makkah time', [0, 2], 5)).toEqual({
      time: '19:20',
      weekdays: [0, 2],
    });
  });

  it('moves the weekday when conversion crosses midnight', () => {
    expect(convertMakkahSessionToLocal('4:05 am Makkah time', [1, 2, 3], -5)).toEqual({
      time: '20:05',
      weekdays: [0, 1, 2],
    });
  });

  it('rejects malformed or impossible session times', () => {
    expect(convertMakkahSessionToLocal('after Maghrib', [0], 5)).toBeNull();
    expect(convertMakkahSessionToLocal('25:00', [0], 5)).toBeNull();
  });
});

describe('NotificationService queue: rapid changes keep latest schedule', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (AsyncStorage.clear as jest.Mock)?.();
    // reset internal queues by awaiting any pending work
    await new Promise((r) => setTimeout(r, 0));
  });

  it('serialises rapid daily reminder changes and ends on the last time', async () => {
    const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
    // add artificial delay to first schedule to simulate in-flight work
    scheduleMock.mockImplementationOnce(() => new Promise<string>((res) => setTimeout(() => res('id-first'), 30)));

    const p1 = NotificationService.scheduleDailyReminder(5, 0);
    const p2 = NotificationService.scheduleDailyReminder(6, 30);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(scheduleMock).toHaveBeenCalledTimes(2);
    // last call should be the second time
    const lastCall = scheduleMock.mock.calls[scheduleMock.mock.calls.length - 1];
    expect(lastCall[0].trigger.hour).toBe(6);
    expect(lastCall[0].trigger.minute).toBe(30);
    const stored = await AsyncStorage.getItem('setting_notif_time');
    expect(stored).toBe('06:30');
  });

  it('serialises rapid session reminder changes and ends on the last session', async () => {
    const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
    scheduleMock.mockImplementationOnce(() => new Promise<string>((res) => setTimeout(() => res('id-s1'), 25)));

    const p1 = NotificationService.scheduleSessionReminder('5:00 pm', [1, 2]);
    const p2 = NotificationService.scheduleSessionReminder('6:15 pm', [3, 4]);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    // at least two session notifications for the second call (2 weekdays) plus first call's
    expect(scheduleMock.mock.calls.length).toBeGreaterThanOrEqual(4);
    const stored = await AsyncStorage.getItem('setting_session_notif_time');
    // 6:15 pm minus 15 min = 18:00
    expect(stored).toBe('18:00');
  });
});
