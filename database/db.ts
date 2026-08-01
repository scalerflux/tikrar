import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyProgressRow {
  dayNumber: number;
  phaseYesterday: number;
  phaseListening: number;
  phaseTafseer: number;
  phaseRecording: number;
  phaseConnection: number;
  phaseRevision: number;
  isComplete: number;
  updatedAt: string;
}

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
    useAsyncStorageFallback = true;
    return null;
  }
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
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
        updatedAt TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.warn('Init database error:', e);
  }
}

export async function getUserSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const db = await getDb();
    if (db) {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM user_settings WHERE key = ?', [key]);
      return row ? row.value : defaultValue;
    }
  } catch (e) {
    console.warn('getUserSetting sqlite error:', e);
  }

  // Fallback to AsyncStorage
  try {
    const val = await AsyncStorage.getItem(`setting_${key}`);
    return val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export async function setUserSetting(key: string, value: string): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', [key, value]);
    }
  } catch (e) {
    console.warn('setUserSetting sqlite error:', e);
  }

  try {
    await AsyncStorage.setItem(`setting_${key}`, value);
  } catch (e) {
    // ignore
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
    updatedAt: new Date().toISOString()
  };

  try {
    const db = await getDb();
    if (db) {
      const row = await db.getFirstAsync<DailyProgressRow>('SELECT * FROM daily_progress WHERE dayNumber = ?', [dayNumber]);
      if (row) return row;
    }
  } catch (e) {
    console.warn('getDailyProgress sqlite error:', e);
  }

  // Fallback to AsyncStorage
  try {
    const json = await AsyncStorage.getItem(`progress_${dayNumber}`);
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    // ignore
  }

  return defaultRow;
}

export async function saveDailyProgress(progress: Partial<DailyProgressRow> & { dayNumber: number }): Promise<DailyProgressRow> {
  const existing = await getDailyProgress(progress.dayNumber);
  const updated: DailyProgressRow = {
    ...existing,
    ...progress,
    updatedAt: new Date().toISOString()
  };

  try {
    const db = await getDb();
    if (db) {
      await db.runAsync(`
        INSERT OR REPLACE INTO daily_progress (
          dayNumber, phaseYesterday, phaseListening, phaseTafseer, phaseRecording, phaseConnection, phaseRevision, isComplete, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        updated.dayNumber,
        updated.phaseYesterday,
        updated.phaseListening,
        updated.phaseTafseer,
        updated.phaseRecording,
        updated.phaseConnection,
        updated.phaseRevision,
        updated.isComplete,
        updated.updatedAt
      ]);
    }
  } catch (e) {
    console.warn('saveDailyProgress sqlite error:', e);
  }

  try {
    await AsyncStorage.setItem(`progress_${updated.dayNumber}`, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }

  return updated;
}

export async function getAllCompletedDays(): Promise<number[]> {
  try {
    const db = await getDb();
    if (db) {
      const rows = await db.getAllAsync<{ dayNumber: number }>('SELECT dayNumber FROM daily_progress WHERE isComplete = 1');
      return rows.map(r => r.dayNumber);
    }
  } catch (e) {
    console.warn('getAllCompletedDays sqlite error:', e);
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter(k => k.startsWith('progress_'));
    const completed: number[] = [];
    for (const key of progressKeys) {
      const val = await AsyncStorage.getItem(key);
      if (val) {
        const obj: DailyProgressRow = JSON.parse(val);
        if (obj.isComplete === 1) {
          completed.push(obj.dayNumber);
        }
      }
    }
    return completed;
  } catch (e) {
    return [];
  }
}
