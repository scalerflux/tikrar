import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { AudioService } from '../../services/audio-service';
import { SURAH_LIST } from '../../data/surah-metadata';
import { getAyahRangeForFace } from '../../utils/schedule-calculator';

interface AudioPlayerComponentProps {
  surahName: string;
  faceNumber?: string;
  onCompleted3Times?: () => void;
}

function normalizeSurahName(name: string): string {
  return name.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '');
}

function resolveSurahNumber(surahName: string): number {
  const target = normalizeSurahName(surahName);
  const matched = SURAH_LIST.find(
    s => normalizeSurahName(s.transliteration) === target
  );
  return matched ? matched.number : 1;
}

export const AudioPlayerComponent: React.FC<AudioPlayerComponentProps> = ({
  surahName,
  faceNumber,
  onCompleted3Times,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [ayahProgress, setAyahProgress] = useState<{ index: number; total: number } | null>(null);

  const range = useMemo(() => getAyahRangeForFace(faceNumber || ''), [faceNumber]);

  const urls = useMemo(() => {
    if (!range) return null;
    const list: string[] = [];
    const { surahNumber, startAyah, endAyah, totalAyahs } = range;
    if (totalAyahs === 1) {
      return [AudioService.getAyahAudioUrl(surahNumber, startAyah)];
    }
    for (let a = startAyah; a <= endAyah; a++) {
      list.push(AudioService.getAyahAudioUrl(surahNumber, a));
    }
    return list;
  }, [range]);

  const rangeLabel = useMemo(() => {
    if (!range) return null;
    const r = range;
    const surah = SURAH_LIST[r.surahNumber - 1];
    return `${surah ? surah.transliteration : ''} ${r.surahNumber}:${r.startAyah}–${r.endAyah}`;
  }, [range]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pauseAudio();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      setAyahProgress(null);
      if (urls) {
        await AudioService.playAyahSequence(urls, (status) => {
          setIsPlaying(status.isPlaying);
          if (status.totalAyahs && status.ayahIndex !== undefined) {
            setAyahProgress({ index: status.ayahIndex + 1, total: status.totalAyahs });
          }
          if (status.playCount > 0) {
            setListenCount(prev => {
              const next = prev + 1;
              if (next >= 3 && onCompleted3Times) {
                onCompleted3Times();
              }
              return next;
            });
          }
        });
      } else {
        const audioUrl = AudioService.getSurahAudioUrl(resolveSurahNumber(surahName));
        await AudioService.playAudio(audioUrl, (status) => {
          setIsPlaying(status.isPlaying);
          if (status.playCount > 0) {
            setListenCount(prev => {
              const next = prev + 1;
              if (next >= 3 && onCompleted3Times) {
                onCompleted3Times();
              }
              return next;
            });
          }
        });
      }
      setIsLoading(false);
    }
  };

  const incrementManualCount = () => {
    setListenCount(prev => {
      const next = prev >= 3 ? 3 : prev + 1;
      if (next >= 3 && onCompleted3Times) {
        onCompleted3Times();
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Ionicons name="headset-outline" size={24} color={Theme.colors.accentGold} />
        <View style={styles.textStack}>
          <Text style={styles.reciterName}>Sheikh Nāṣir Al-Qaṭānī</Text>
          <Text style={styles.subText}>
            {range && rangeLabel
              ? `Page ${range.page}${range.half ? ` (${range.half})` : ''} • ${rangeLabel}`
              : "Listen to today's page 3 times following your Mus-haf"}
          </Text>
          {ayahProgress && (
            <Text style={styles.ayahProgress}>
              Ayah {ayahProgress.index} / {ayahProgress.total}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity 
          style={[styles.playBtn, isPlaying && styles.playingBtn]} 
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Theme.colors.bgDark} size="small" />
          ) : (
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={22} 
              color={Theme.colors.bgDark} 
            />
          )}
          <Text style={styles.playBtnText}>
            {isPlaying ? "Pause Recitation" : "Play Recitation"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.countBadge} onPress={incrementManualCount}>
          <Text style={styles.countText}>{listenCount} / 3</Text>
          <Text style={styles.countSub}>Times</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  textStack: {
    flex: 1,
  },
  reciterName: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  ayahProgress: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.accentGold,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  playingBtn: {
    backgroundColor: Theme.colors.textPrimary,
  },
  playBtnText: {
    color: Theme.colors.bgDark,
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  countText: {
    color: Theme.colors.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  countSub: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
