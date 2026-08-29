import { getUserSetting, setUserSetting } from '../database/db';
import { localDateString } from '../utils/schedule-calculator';

export interface VoiceRecording {
  uri: string;
  createdAt: string;
}

const RECORDINGS_PREFIX = 'recordings_';

/**
 * Persists the daily voice recordings (up to 3 per day) so each take is
 * kept and playable separately, instead of every new recording overwriting
 * the previous one. Metadata is stored in user settings; the audio file
 * itself is copied out of the cache into the app's documents directory so
 * it survives cache cleanups and app restarts.
 */
export class RecordingService {
  static recordingsKey(date: string): string {
    return `${RECORDINGS_PREFIX}${date}`;
  }

  static async getRecordings(date: string): Promise<VoiceRecording[]> {
    const raw = await getUserSetting(this.recordingsKey(date), '[]');
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((r): r is VoiceRecording => !!r && typeof r.uri === 'string' && r.uri.length > 0)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch {
      return [];
    }
  }

  /**
   * Copy a freshly recorded file to a stable location and register it for
   * the given local date. If the copy fails (e.g. no documents directory),
   * the original cache URI is still registered so the take is usable for
   * the session.
   */
  static async addRecording(date: string, sourceUri: string): Promise<VoiceRecording> {
    const stableUri = await this.copyToDocuments(sourceUri, date);
    const recording: VoiceRecording = {
      uri: stableUri,
      createdAt: new Date().toISOString(),
    };
    const list = await this.getRecordings(date);
    list.push(recording);
    await setUserSetting(this.recordingsKey(date), JSON.stringify(list));
    return recording;
  }

  static async removeRecording(date: string, uri: string): Promise<VoiceRecording[]> {
    const list = await this.getRecordings(date);
    const remaining = list.filter((r) => r.uri !== uri);
    await setUserSetting(this.recordingsKey(date), JSON.stringify(remaining));
    if (uri.includes('tikrar-rec-')) {
      // Only delete files this service created; never touch external/URIs.
      await this.deleteFile(uri);
    }
    return remaining;
  }

  static async deleteAllForDate(date: string): Promise<void> {
    const list = await this.getRecordings(date);
    for (const r of list) {
      if (r.uri.includes('tikrar-rec-')) {
        await this.deleteFile(r.uri);
      }
    }
    await setUserSetting(this.recordingsKey(date), JSON.stringify([]));
  }

  private static async copyToDocuments(sourceUri: string, date: string): Promise<string> {
    const fileName = `tikrar-rec-${date}-${Date.now()}.m4a`;

    // 1) Legacy FileSystem API (stable copyAsync semantics)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const LegacyFS: any = require('expo-file-system/legacy');
      const dir: string | null = LegacyFS.documentDirectory || LegacyFS.cacheDirectory || null;
      if (dir && typeof LegacyFS.copyAsync === 'function') {
        const destUri = `${dir}${fileName}`;
        await LegacyFS.copyAsync({ from: sourceUri, to: destUri });
        return destUri;
      }
    } catch (e) {
      console.warn('RecordingService legacy copy failed:', e);
    }

    // 2) New FileSystem API (expo-file-system >= 18: File + Paths)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FSNew: any = require('expo-file-system');
      const Paths = FSNew.Paths;
      const FileCtor = FSNew.File;
      const base = Paths?.document || Paths?.cache || null;
      if (base && FileCtor) {
        const dest = new FileCtor(base, fileName);
        const src = new FileCtor(sourceUri);
        src.copy(dest);
        return dest.uri;
      }
    } catch (e) {
      console.warn('RecordingService new-API copy failed:', e);
    }

    // 3) Fall back to the recorder's own cache URI.
    return sourceUri;
  }

  private static async deleteFile(uri: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const LegacyFS: any = require('expo-file-system/legacy');
      if (typeof LegacyFS.deleteAsync === 'function') {
        await LegacyFS.deleteAsync(uri, { idempotent: true });
        return;
      }
    } catch {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FSNew: any = require('expo-file-system');
      const FileCtor = FSNew.File;
      if (FileCtor) {
        const file = new FileCtor(uri);
        if (file.exists) file.delete();
      }
    } catch {}
  }
}
