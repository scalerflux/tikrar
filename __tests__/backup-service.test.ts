jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    throw new Error('SQLite unavailable in test');
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupService } from '../services/backup-service';

describe('BackupService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('exports fallback settings and progress from AsyncStorage', async () => {
    await AsyncStorage.setItem('setting_notif_enabled', 'true');
    await AsyncStorage.setItem('setting_reciter', 'shuraym');
    await AsyncStorage.setItem('progress_3', JSON.stringify({
      dayNumber: 3,
      phaseYesterday: 1,
      isComplete: 1,
      completedDate: '2026-08-26',
      updatedAt: '2026-08-26T10:00:00.000Z',
    }));

    const backup = JSON.parse(await BackupService.exportData());

    expect(backup.version).toBe(1);
    expect(backup.settings).toMatchObject({ notif_enabled: 'true', reciter: 'shuraym' });
    expect(backup.progress).toHaveLength(1);
    expect(backup.progress[0]).toMatchObject({ dayNumber: 3, isComplete: 1 });
  });

  it('rejects a backup whose settings field is not an object', async () => {
    await expect(
      BackupService.importData(JSON.stringify({ version: 1, settings: 'not-settings', progress: [] }))
    ).rejects.toThrow('Invalid backup format');
  });
});
