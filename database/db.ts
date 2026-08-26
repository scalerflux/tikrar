import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateString } from '../utils/schedule-calculator';

export interface DailyProgressRow {
  dayNumber: number;
  phaseYesterday: number;
  phaseListening: number;
  phaseTafseer: number;
  phaseRecording: number;
  phaseConnection: number;
  phaseRevision: number;
  isComplete: number;
  /** Local calendar date ("YYYY-MM-DD", device timezone) of completion. */
  completedDate: string;
  updatedAt: string;
}

export interface CompletedDay {
  dayNumber: number;
  completedDate: string;
}

const SCHEMA_VERSION = 1;

let dbInstance: SQLite.SQLiteDatabase | null = null;
let useAsyncStorageFallback = false;

export async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (useAsyncStorageFallback) return null;
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabaseAsync('tikrar.db');
    await initDatabase(dbInstance);
    return dbInstance;
  } catch (error) {
    console.warn('SQLite init failed, falling back to AsyncStorage:', error);
    dbInstance = null;
    useAsyncStorageFallback = true;
    return null;
  }
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_progress (
      dayNumber INTEGER PRIMARY KEY,
      phaseYesterday INTEGER DEFAULT 0,
      phaseListening INTEGER DEFAULT 0,
      phaseTafseer INTEGER DEFAULT 0,
      phaseRecording INTEGER DEFAULT 0,
      phaseConnection INTEGER DEFAULT 0,
      phaseRevision INTEGER DEFAULT 0,
      isComplete INTEGER DEFAULT 0,
      completedDate TEXT,
      updatedAt TEXT NOT NULL
    );
  `);
  await migrateDatabase(db);
}

async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = versionRow?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(daily_progress)');
  const hasCompletedDate = columns.some((c) => c.name === 'completedDate');
  if (!hasCompletedDate) {
    await db.execAsync('ALTER TABLE daily_progress ADD COLUMN completedDate TEXT');
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export async function getUserSetting(key: string, defaultValue: string = ''): Promise<string> {
  const db = await getDb();
  if (db) {
    try {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM user_settings WHERE key = ?', [key]);
      if (row) return row.value;
      useAsyncStorageFallback = true;
    } catch (e) {
      console.warn('getUserSetting sqlite error:', e);
      useAsyncStorageFallback = true;
    }
  }

  // Fallback to AsyncStorage (only in fallback mode)
  if (useAsyncStorageFallback) {
    try {
      const val = await AsyncStorage.getItem(`setting_${key}`);
      return val !== null ? val : defaultValue;
    } catch (e) {
      console.warn('getUserSetting asyncstorage error:', e);
    }
  }
  return defaultValue;
}

export async function setUserSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (db) {
    try {
      await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', [key, value]);
      return;
    } catch (e) {
      console.warn('setUserSetting sqlite error:', e);
      useAsyncStorageFallback = true;
    }
  }

  if (useAsyncStorageFallback) {
    try {
      await AsyncStorage.setItem(`setting_${key}`, value);
    } catch (e) {
      console.warn('setUserSetting asyncstorage error:', e);
    }
  }
}

export async function getDailyProgress(dayNumber: number): Promise<DailyProgressRow> {
  const defaultRow: DailyProgressRow = {
    dayNumber,
    phaseYesterday: 0,
    phaseListening: 0,
    phaseTafseer: 0,
    phaseRecording: 0,
    phaseConnection: 0,
    phaseRevision: 0,
    isComplete: 0,
    completedDate: '',
    updatedAt: new Date().toISOString()
  };

  const db = await getDb();
  if (db) {
    try {
      const row = await db.getFirstAsync<DailyProgressRow>('SELECT * FROM daily_progress WHERE dayNumber = ?', [dayNumber]);
      if (row) return row;
      useAsyncStorageFallback = true;
    } catch (e) {
      console.warn('getDailyProgress sqlite error:', e);
      useAsyncStorageFallback = true;
    }
  }

  // Fallback to AsyncStorage (only in fallback mode)
  if (useAsyncStorageFallback) {
    try {
      const json = await AsyncStorage.getItem(`progress_${dayNumber}`);
      if (json) {
        const parsed = JSON.parse(json) as DailyProgressRow;
        return { ...defaultRow, ...parsed };
      }
    } catch (e) {
      console.warn('getDailyProgress asyncstorage error:', e);
    }
  }

  return defaultRow;
}

export async function saveDailyProgress(progress: Partial<DailyProgressRow> & { dayNumber: number }): Promise<DailyProgressRow> {
  const existing = await getDailyProgress(progress.dayNumber);
  const isComplete = progress.isComplete !== undefined ? progress.isComplete : existing.isComplete;
  const completedDate =
    isComplete === 1 && existing.isComplete !== 1
      ? progress.completedDate ?? localDateString()
      : progress.completedDate !== undefined
        ? progress.completedDate
        : existing.completedDate;

  const updated: DailyProgressRow = {
    ...existing,
    ...progress,
    isComplete,
    completedDate,
    updatedAt: new Date().toISOString()
  };

  const db = await getDb();
  if (db) {
    try {
      await db.runAsync(`
        INSERT OR REPLACE INTO daily_progress (
          dayNumber, phaseYesterday, phaseListening, phaseTafseer, phaseRecording, phaseConnection, phaseRevision, isComplete, completedDate, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        updated.dayNumber,
        updated.phaseYesterday,
        updated.phaseListening,
        updated.phaseTafseer,
        updated.phaseRecording,
        updated.phaseConnection,
        updated.phaseRevision,
        updated.isComplete,
        updated.completedDate,
        updated.updatedAt
      ]);
      return updated;
    } catch (e) {
      console.warn('saveDailyProgress sqlite error:', e);
      useAsyncStorageFallback = true;
    }
  }

  if (useAsyncStorageFallback) {
    try {
      await AsyncStorage.setItem(`progress_${updated.dayNumber}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('saveDailyProgress asyncstorage error:', e);
    }
  }

  return updated;
}

export async function getAllCompletedDays(): Promise<number[]> {
  const rows = await getAllCompletedDaysWithDates();
  return rows.map((r) => r.dayNumber);
}

export async function getAllCompletedDaysWithDates(): Promise<CompletedDay[]> {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db.getAllAsync<{ dayNumber: number; completedDate: string | null }>(
        'SELECT dayNumber, completedDate FROM daily_progress WHERE isComplete = 1'
      );
      if (rows.length > 0) {
        return rows.map((r) => ({ dayNumber: r.dayNumber, completedDate: r.completedDate ?? '' }));
      }
      useAsyncStorageFallback = true;
    } catch (e) {
      console.warn('getAllCompletedDays sqlite error:', e);
      useAsyncStorageFallback = true;
    }
  }

  if (useAsyncStorageFallback) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter((k) => k.startsWith('progress_'));
      const completed: CompletedDay[] = [];
      for (const key of progressKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          const obj: DailyProgressRow = JSON.parse(val);
          if (obj.isComplete === 1) {
            completed.push({ dayNumber: obj.dayNumber, completedDate: obj.completedDate ?? '' });
          }
        }
      }
      return completed;
    } catch (e) {
      console.warn('getAllCompletedDays asyncstorage error:', e);
    }
  }
  return [];
}
