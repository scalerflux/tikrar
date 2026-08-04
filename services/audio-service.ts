import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Sheikh Nāṣir Al-Qaṭānī reciter identifier on EveryAyah
const RECITER_BASE_URL = 'https://everyayah.com/data/Nasser_Alqatami_128kbps/';

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

  static getSurahAudioUrl(surahNumber: number): string {
    const padSurah = surahNumber.toString().padStart(3, '0');
    return `https://server6.mp3quran.net/qtm/${padSurah}.mp3`;
  }

  static getAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
    const padSurah = surahNumber.toString().padStart(3, '0');
    const padAyah = ayahNumber.toString().padStart(3, '0');
    return `${RECITER_BASE_URL}${padSurah}${padAyah}.mp3`;
  }

  static async playAyahSequence(
    urls: string[],
    onStatusUpdate?: (status: AudioPlayState) => void
  ): Promise<void> {
    try {
      this.stopAudio();

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });

      if (urls.length === 0) return;

      let index = 0;
      const player = createAudioPlayer({ uri: urls[0] });
      this.player = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (!status.isLoaded) return;
        if (onStatusUpdate) {
          onStatusUpdate({
            isPlaying: status.playing,
            positionMillis: Math.round(status.currentTime * 1000),
            durationMillis: Math.round(status.duration * 1000),
            playCount: 0,
            ayahIndex: index,
            totalAyahs: urls.length,
          });
        }
        if (status.didJustFinish) {
          index++;
          if (index >= urls.length) {
            if (onStatusUpdate) {
              onStatusUpdate({
                isPlaying: false,
                positionMillis: 0,
                durationMillis: 0,
                playCount: 1,
                ayahIndex: urls.length - 1,
                totalAyahs: urls.length,
              });
            }
          } else if (this.player === player) {
            try {
              player.replace({ uri: urls[index] });
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
