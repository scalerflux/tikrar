import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export const RECITERS = {
  // Level 1 - Tajwid based, monotone foundation
  suwayd: { id: 'suwayd', name: 'Dr. Ayman Suwayd (Tajwid Based)', level: 1, baseUrl: 'https://everyayah.com/data/Ayman_Sowaid_64kbps/' },
  minshawi: { id: 'minshawi', name: 'Sheikh Minshāwī', level: 1, baseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/' },
  hudayfi: { id: 'hudayfi', name: 'Sheikh Ḥuḏayfī', level: 1, baseUrl: 'https://everyayah.com/data/Hudhaify_128kbps/' },
  husary: { id: 'husary', name: 'Sheikh Maḥmūd Khālid Al-Ḥuṣarī', level: 1, baseUrl: 'https://everyayah.com/data/Husary_128kbps/' },
  // Level 2 - Slightly harder, repetitive tone
  ayyub: { id: 'ayyub', name: 'Sheikh Muḥammad Ayyūb', level: 2, baseUrl: 'https://everyayah.com/data/Muhammad_Ayyoub_128kbps/' },
  jabir: { id: 'jabir', name: 'Sheikh ʿAlī Jābir', level: 2, baseUrl: 'https://everyayah.com/data/Ali_Jaber_64kbps/' },
  shatiri: { id: 'shatiri', name: 'Sheikh Abū Bakr Shāṭirī', level: 2, baseUrl: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_64kbps/' },
  shuraym: { id: 'shuraym', name: 'Sheikh Shuraym', level: 2, baseUrl: 'https://everyayah.com/data/Saood_ash-Shuraym_128kbps/' },
  sudays: { id: 'sudays', name: 'Sheikh Sudays', level: 2, baseUrl: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/' },
  matrud: { id: 'matrud', name: 'Sheikh ʿAbdullāh Maṭrūd', level: 2, baseUrl: 'https://everyayah.com/data/Abdullah_Matroud_128kbps/' },
  qahtani: { id: 'qahtani', name: 'Sheikh Nāṣir Al-Qaḥṭānī', level: 2, baseUrl: 'https://everyayah.com/data/Nasser_Alqatami_128kbps/' },
  // Level 3 - Repetitive but harder to imitate uniqueness
  muaiqly: { id: 'muaiqly', name: 'Sheikh Māhir Al-Muʿayqilī', level: 3, baseUrl: 'https://everyayah.com/data/Maher_AlMuaiqly_64kbps/' },
  // kurdi removed - no per-ayah source available
  yasser: { id: 'yasser', name: 'Sheikh Yāsir Ad-Dawsarī', level: 3, baseUrl: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/' },
  afasi: { id: 'afasi', name: 'Sheikh Mishārī Al-ʿAfāsī', level: 3, baseUrl: 'https://everyayah.com/data/Alafasy_128kbps/' },
  abbad: { id: 'abbad', name: 'Sheikh Fāris ʿAbbād', level: 3, baseUrl: 'https://everyayah.com/data/Fares_Abbad_64kbps/' },
  ajmi: { id: 'ajmi', name: 'Sheikh Aḥmad Al-ʿAjmī', level: 3, baseUrl: 'https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/' },
  // Level 4 - With meaning, hardest to imitate
  luhaydan: { id: 'luhaydan', name: 'Sheikh Luḥaydān', level: 4, baseUrl: 'https://server8.mp3quran.net/lhdan/' },
  badr: { id: 'badr', name: 'Sheikh Badr At-Turkī', level: 4, baseUrl: 'https://server10.mp3quran.net/bader/Rewayat-Hafs-A-n-Assem/' },
  baleela: { id: 'baleela', name: 'Sheikh Bandar Balīlah', level: 4, baseUrl: 'https://server6.mp3quran.net/balilah/' },
  juhani: { id: 'juhani', name: 'Sheikh ʿAbdullāh Al-Juhanī', level: 4, baseUrl: 'https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/' },
} as const;

export type ReciterId = keyof typeof RECITERS;

const DEFAULT_RECITER: ReciterId = 'qahtani';

export function getReciterBaseUrl(reciterId: string = DEFAULT_RECITER): string {
  return RECITERS[reciterId as ReciterId]?.baseUrl || RECITERS[DEFAULT_RECITER].baseUrl;
}

export function getReciterName(reciterId: string = DEFAULT_RECITER): string {
  return RECITERS[reciterId as ReciterId]?.name || RECITERS[DEFAULT_RECITER].name;
}

export function getReciterLevel(reciterId: string = DEFAULT_RECITER): number {
  return RECITERS[reciterId as ReciterId]?.level || 1;
}

export function isPerSurahReciter(reciterId: string = DEFAULT_RECITER): boolean {
  const base = RECITERS[reciterId as ReciterId]?.baseUrl || '';
  return base.includes('mp3quran.net');
}

export interface AudioPlayState {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playCount: number;
  ayahIndex?: number;
  totalAyahs?: number;
}

export class AudioService {
  private static player: AudioPlayer | null = null;
  private static sequenceUrls: string[] = [];
  private static currentSequenceIndex: number = 0;
  private static statusCallback: ((status: AudioPlayState) => void) | null = null;

  static getSurahAudioUrl(surahNumber: number): string {
    const padSurah = surahNumber.toString().padStart(3, '0');
    return `https://server6.mp3quran.net/qtm/${padSurah}.mp3`;
  }

  static getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciterId: string = DEFAULT_RECITER): string {
    if (isPerSurahReciter(reciterId)) {
      const padSurah = surahNumber.toString().padStart(3, '0');
      return `${getReciterBaseUrl(reciterId)}${padSurah}.mp3`;
    }
    const padSurah = surahNumber.toString().padStart(3, '0');
    const padAyah = ayahNumber.toString().padStart(3, '0');
    return `${getReciterBaseUrl(reciterId)}${padSurah}${padAyah}.mp3`;
  }

  static async playAyahSequence(
    urls: string[],
    startIndex: number = 0,
    onStatusUpdate?: (status: AudioPlayState) => void
  ): Promise<void> {
    try {
      this.stopAudio();

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });

      if (urls.length === 0) return;

      this.sequenceUrls = urls;
      this.currentSequenceIndex = Math.max(0, Math.min(startIndex, urls.length - 1));
      this.statusCallback = onStatusUpdate || null;

      const player = createAudioPlayer({ uri: urls[this.currentSequenceIndex] });
      this.player = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (!status.isLoaded) return;
        if (this.statusCallback) {
          this.statusCallback({
            isPlaying: status.playing,
            positionMillis: Math.round(status.currentTime * 1000),
            durationMillis: Math.round(status.duration * 1000),
            playCount: 0,
            ayahIndex: this.currentSequenceIndex,
            totalAyahs: this.sequenceUrls.length,
          });
        }
        if (status.didJustFinish) {
          this.currentSequenceIndex++;
          if (this.currentSequenceIndex >= this.sequenceUrls.length) {
            if (this.statusCallback) {
              this.statusCallback({
                isPlaying: false,
                positionMillis: 0,
                durationMillis: 0,
                playCount: 1,
                ayahIndex: this.sequenceUrls.length - 1,
                totalAyahs: this.sequenceUrls.length,
              });
            }
          } else if (this.player === player) {
            try {
              player.replace({ uri: this.sequenceUrls[this.currentSequenceIndex] });
              player.play();
            } catch (e) {
              console.error('Error advancing ayah:', e);
            }
          }
        }
      });

      player.play();
    } catch (error) {
      console.error('Error playing audio sequence:', error);
    }
  }

  static async jumpToAyah(index: number): Promise<void> {
    if (!this.player || this.sequenceUrls.length === 0) return;
    if (index < 0 || index >= this.sequenceUrls.length) return;

    this.currentSequenceIndex = index;
    try {
      this.player.replace({ uri: this.sequenceUrls[this.currentSequenceIndex] });
      this.player.play();
      if (this.statusCallback) {
        this.statusCallback({
          isPlaying: true,
          positionMillis: 0,
          durationMillis: 0,
          playCount: 0,
          ayahIndex: this.currentSequenceIndex,
          totalAyahs: this.sequenceUrls.length,
        });
      }
    } catch (e) {
      console.error('Error jumping to ayah:', e);
    }
  }

  static async playAudio(
    url: string,
    onStatusUpdate?: (status: AudioPlayState) => void
  ): Promise<AudioPlayer | null> {
    try {
      this.stopAudio();

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });

      const player = createAudioPlayer({ uri: url });
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && onStatusUpdate) {
          onStatusUpdate({
            isPlaying: status.playing,
            positionMillis: Math.round(status.currentTime * 1000),
            durationMillis: Math.round(status.duration * 1000),
            playCount: status.didJustFinish ? 1 : 0,
          });
        }
      });

      this.player = player;
      player.play();
      return player;
    } catch (error) {
      console.error('Error playing audio:', error);
      return null;
    }
  }

  static async pauseAudio(): Promise<void> {
    if (this.player) {
      this.player.pause();
    }
  }

  static async resumeAudio(): Promise<void> {
    if (this.player) {
      this.player.play();
    }
  }

  static async stopAudio(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (e) {
        // ignore unload error
      }
      this.player = null;
    }
  }

  static isSequenceFinished(): boolean {
    return (
      this.sequenceUrls.length > 0 &&
      this.currentSequenceIndex >= this.sequenceUrls.length
    );
  }

  static getCurrentSequenceIndex(): number {
    return this.currentSequenceIndex;
  }
}
