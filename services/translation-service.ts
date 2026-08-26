import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAyahListForFace } from '../utils/schedule-calculator';
import { SURAH_LIST } from '../data/surah-metadata';

export interface AyahTranslation {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  page: number;
}

const CACHE_PREFIX = 'hilali_page_v1_';

export class TranslationService {
  /**
   * Fetch Hilali-Khan translation for a full page from Quran API or cache.
   */
  static async getPageTranslation(page: number): Promise<AyahTranslation[]> {
    if (page < 1 || page > 604) return [];

    const cacheKey = `${CACHE_PREFIX}${page}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Error reading translation cache:', e);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(`https://api.alquran.cloud/v1/page/${page}/en.hilali`, {
        signal: controller.signal as any,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data && data.status === 'OK' && data.data && Array.isArray(data.data.ayahs)) {
        const ayahs: AyahTranslation[] = data.data.ayahs.map((a: any) => {
          const surahMeta = SURAH_LIST[a.surah.number - 1];
          return {
            surahNumber: a.surah.number,
            surahName: surahMeta ? surahMeta.transliteration : a.surah.englishName,
            ayahNumber: a.numberInSurah,
            text: a.text,
            page: a.page,
          };
        });

        // Cache for offline usage
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(ayahs));
        } catch (e) {
          console.warn('Error caching translation:', e);
        }

        return ayahs;
      }
    } catch (err) {
      console.warn('Error fetching Hilali translation for page', page, err);
    }

    return [];
  }

  /**
   * Prefetch in background without blocking UI.
   */
  static prefetchFace(faceNumber: string): void {
    const list = getAyahListForFace(faceNumber);
    if (list.length === 0) return;
    this.getPageTranslation(list[0].page).catch(() => {});
  }

  /**
   * Get Hilali-Khan translations for a specific Face (e.g. "3 h1", "50 h2", "1")
   */
  static async getFaceTranslation(faceNumber: string): Promise<AyahTranslation[]> {
    const list = getAyahListForFace(faceNumber);
    if (list.length === 0) return [];

    const page = list[0].page;
    const pageAyahs = await this.getPageTranslation(page);

    if (pageAyahs.length === 0) {
      // Return placeholders if offline and not yet cached
      return list.map(item => {
        const surah = SURAH_LIST[item.surah - 1];
        return {
          surahNumber: item.surah,
          surahName: surah ? surah.transliteration : `Surah ${item.surah}`,
          ayahNumber: item.ayah,
          text: `[${surah ? surah.transliteration : item.surah} ${item.ayah}] (Translation available online - connect to load Hilali & Muhsin Khan translation)`,
          page: item.page,
        };
      });
    }

    // Filter page ayahs to match the face list
    const faceAyahs = list.map(item => {
      const match = pageAyahs.find(
        p => p.surahNumber === item.surah && p.ayahNumber === item.ayah
      );
      if (match) return match;
      const surah = SURAH_LIST[item.surah - 1];
      return {
        surahNumber: item.surah,
        surahName: surah ? surah.transliteration : `Surah ${item.surah}`,
        ayahNumber: item.ayah,
        text: '',
        page: item.page,
      };
    });

    return faceAyahs;
  }
}
