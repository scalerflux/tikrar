import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getDb, DailyProgressRow } from '../database/db';
import { isValidLocalDateString, TOTAL_PROGRAM_DAYS } from '../utils/schedule-calculator';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  settings: Record<string, string>;
  progress: DailyProgressRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProgressRow(value: unknown): DailyProgressRow | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<DailyProgressRow>;
  if (!Number.isInteger(row.dayNumber) || row.dayNumber! < 1 || row.dayNumber! > TOTAL_PROGRAM_DAYS) return null;

  const phaseKeys = [
    'phaseYesterday',
    'phaseListening',
    'phaseTafseer',
    'phaseRecording',
    'phaseConnection',
    'phaseRevision',
    'isComplete',
  ] as const;
  if (phaseKeys.some((key) => row[key] !== undefined && row[key] !== 0 && row[key] !== 1)) return null;
  if (row.completedDate && !isValidLocalDateString(row.completedDate)) return null;

  return {
    dayNumber: row.dayNumber!,
    phaseYesterday: row.phaseYesterday ?? 0,
    phaseListening: row.phaseListening ?? 0,
    phaseTafseer: row.phaseTafseer ?? 0,
    phaseRecording: row.phaseRecording ?? 0,
    phaseConnection: row.phaseConnection ?? 0,
    phaseRevision: row.phaseRevision ?? 0,
    isComplete: row.isComplete ?? 0,
    completedDate: row.completedDate ?? '',
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export class BackupService {
  static async exportData(): Promise<string> {
    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {},
      progress: [],
    };

    const db = await getDb();
    if (db) {
      try {
        const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM user_settings');
        for (const r of settingsRows) payload.settings[r.key] = r.value;
        const progressRows = await db.getAllAsync<DailyProgressRow>('SELECT * FROM daily_progress');
        payload.progress = progressRows;
      } catch (e) {
        console.warn('Backup export sqlite error:', e);
      }
    }

    // Notification settings live directly in AsyncStorage even when SQLite is
    // active, so always merge them in. SQLite values win on conflict; the
    // fallback below only fills keys that SQLite does not have.
    try {
      const keys = await AsyncStorage.getAllKeys();
      const settingKeys = keys.filter((k) => k.startsWith('setting_'));
      for (const k of settingKeys) {
        const v = await AsyncStorage.getItem(k);
        if (v !== null && payload.settings[k.replace('setting_', '')] === undefined) {
          payload.settings[k.replace('setting_', '')] = v;
        }
      }
      if (payload.progress.length === 0) {
        const progressKeys = keys.filter((k) => k.startsWith('progress_'));
        for (const k of progressKeys) {
          const v = await AsyncStorage.getItem(k);
          if (v) {
            try {
              const row = JSON.parse(v) as DailyProgressRow;
              payload.progress.push(row);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Backup export asyncstorage error:', e);
    }

    return JSON.stringify(payload, null, 2);
  }

  static async importData(jsonString: string): Promise<{ imported: number; settings: number }> {
    let parsed: BackupPayload;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON');
    }
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.progress) ||
      (parsed.settings !== undefined && !isRecord(parsed.settings))
    ) {
      throw new Error('Invalid backup format');
    }

    const db = await getDb();
    let imported = 0;
    let settingsCount = 0;

    if (db) {
      try {
        for (const [k, v] of Object.entries(parsed.settings || {})) {
          await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', [k, String(v)]);
          await AsyncStorage.setItem(`setting_${k}`, String(v));
          settingsCount++;
        }
        for (const rawRow of parsed.progress) {
          const row = normalizeProgressRow(rawRow);
          if (!row) continue;
          await db.runAsync(
            `INSERT OR REPLACE INTO daily_progress (dayNumber, phaseYesterday, phaseListening, phaseTafseer, phaseRecording, phaseConnection, phaseRevision, isComplete, completedDate, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.dayNumber,
              row.phaseYesterday ?? 0,
              row.phaseListening ?? 0,
              row.phaseTafseer ?? 0,
              row.phaseRecording ?? 0,
              row.phaseConnection ?? 0,
              row.phaseRevision ?? 0,
              row.isComplete ?? 0,
              row.completedDate ?? '',
              row.updatedAt ?? new Date().toISOString(),
            ]
          );
          await AsyncStorage.setItem(`progress_${row.dayNumber}`, JSON.stringify(row));
          imported++;
        }
      } catch (e) {
        console.warn('Backup import sqlite error:', e);
        throw e;
      }
    } else {
      for (const [k, v] of Object.entries(parsed.settings || {})) {
        await AsyncStorage.setItem(`setting_${k}`, String(v));
        settingsCount++;
      }
      for (const rawRow of parsed.progress) {
        const row = normalizeProgressRow(rawRow);
        if (!row) continue;
        await AsyncStorage.setItem(`progress_${row.dayNumber}`, JSON.stringify(row));
        imported++;
      }
    }

    return { imported, settings: settingsCount };
  }

  static async shareExport(): Promise<void> {
    const json = await this.exportData();
    const fileName = `tikrar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (Platform.OS === 'web') {
      throw new Error('Sharing not supported on web, copy the JSON instead');
    }

    let fileUri: string | null = null;

    // 1) Legacy FileSystem API (expo-file-system < 18 and legacy compat)
    try {
      const FS: any = FileSystem as any;
      const dir: string | null = FS.cacheDirectory || FS.documentDirectory || null;
      if (dir && typeof FS.writeAsStringAsync === 'function') {
        fileUri = `${dir}${fileName}`;
        await FS.writeAsStringAsync(fileUri, json);
      }
    } catch {}

    // 2) New FileSystem API (expo-file-system >= 18: File + Paths)
    if (!fileUri) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const FSNew: any = require('expo-file-system');
        const Paths = FSNew.Paths;
        const FileCtor = FSNew.File;
        const base = Paths?.cache || Paths?.document || null;
        if (base && FileCtor) {
          const file = new FileCtor(base, fileName);
          if (typeof file.write === 'function') {
            await file.write(json);
            fileUri = file.uri;
          } else if (typeof file.writeAsStringAsync === 'function') {
            await file.writeAsStringAsync(json);
            fileUri = file.uri;
          }
        }
      } catch {}
    }

    // 3) Explicit legacy import path
    if (!fileUri) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const LegacyFS: any = require('expo-file-system/legacy');
        const dir: string | null = LegacyFS.cacheDirectory || LegacyFS.documentDirectory || null;
        if (dir && typeof LegacyFS.writeAsStringAsync === 'function') {
          fileUri = `${dir}${fileName}`;
          await LegacyFS.writeAsStringAsync(fileUri, json);
        }
      } catch {}
    }

    if (!fileUri) throw new Error('No cache directory — your device blocked file creation. Use Export Backup (JSON) and copy the text instead.');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Tikrar Backup' });
    } else {
      throw new Error(`Backup saved to ${fileUri} but sharing is not available on this device. Access it via Files app.`);
    }
  }

  static async clearAllData(): Promise<void> {
    const db = await getDb();
    if (db) {
      try {
        await db.execAsync('DELETE FROM daily_progress; DELETE FROM user_settings;');
      } catch (e) {
        console.warn('Clear sqlite error:', e);
      }
    }
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toRemove = keys.filter((k) => k.startsWith('setting_') || k.startsWith('progress_') || k.startsWith('hilali_'));
      if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
    } catch (e) {
      console.warn('Clear asyncstorage error:', e);
    }
  }
}
