import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Sheikh Nāṣir Al-Qaṭānī reciter identifier on EveryAyah
const RECITER_BASE_URL = 'https://everyayah.com/data/Nasser_Alqatami_128kbps/';

export interface AudioPlayState {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playCount: number;
}

export class AudioService {
  private static player: AudioPlayer | null = null;

  static getSurahAudioUrl(surahNumber: number): string {
    const padSurah = surahNumber.toString().padStart(3, '0');
    return `https://server14.mp3quran.net/qtn/${padSurah}.mp3`;
  }

  static getAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
    const padSurah = surahNumber.toString().padStart(3, '0');
    const padAyah = ayahNumber.toString().padStart(3, '0');
    return `${RECITER_BASE_URL}${padSurah}${padAyah}.mp3`;
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
}
