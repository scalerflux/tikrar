import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import { AudioService, getReciterName } from '../../services/audio-service';
import { SURAH_LIST } from '../../data/surah-metadata';
import { getAyahListForFace, getAyahRangeForFace } from '../../utils/schedule-calculator';
import { TranslationService, AyahTranslation } from '../../services/translation-service';
import { getUserSetting } from '../../database/db';

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
  return matched ? matched.number : 0;
}

export const AudioPlayerComponent: React.FC<AudioPlayerComponentProps> = ({
  surahName,
  faceNumber,
  onCompleted3Times,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [translations, setTranslations] = useState<AyahTranslation[]>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const [reciterId, setReciterId] = useState<string>('qahtani');

  // Settings is a separate tab that stays mounted in Expo Router. Refreshing
  // on focus makes a newly selected reciter take effect without restarting
  // the app or relying on a stale AudioPlayerComponent instance.
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getUserSetting('reciter', 'qahtani').then((value) => {
        if (!isMounted) return;
        setReciterId(value === 'qatami' ? 'qahtani' : value);
      });
      return () => { isMounted = false; };
    }, [])
  );

  useEffect(() => {
    return () => {
      AudioService.stopAudio();
      setIsPlaying(false);
    };
  }, [faceNumber]);

  const ayahList = useMemo(() => {
    return getAyahListForFace(faceNumber || '');
  }, [faceNumber]);

  const range = useMemo(() => getAyahRangeForFace(faceNumber || ''), [faceNumber]);

  const urls = useMemo(() => {
    if (ayahList.length === 0) return null;
    return ayahList.map(item => AudioService.getAyahAudioUrl(item.surah, item.ayah, reciterId));
  }, [ayahList, reciterId]);

  const rangeLabel = useMemo(() => {
    if (!range) return null;
    const r = range;
    const names = [...new Set(ayahList.map((item) => SURAH_LIST[item.surah - 1]?.transliteration).filter(Boolean))];
    const surahLabel = names.length > 0 ? names.join(', ') : `Surah ${r.surahNumber}`;
    return `${surahLabel} ${r.surahNumber}:${r.startAyah}–${r.endAyah}`;
  }, [range, ayahList]);

  // Load Hilali-Khan translation for today's face
  useEffect(() => {
    let isMounted = true;
    async function loadTranslations() {
      if (!faceNumber) return;
      setLoadingTranslations(true);
      const data = await TranslationService.getFaceTranslation(faceNumber);
      if (isMounted) {
        setTranslations(data);
        setLoadingTranslations(false);
      }
    }
    loadTranslations();
    return () => {
      isMounted = false;
    };
  }, [faceNumber]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pauseAudio();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      if (urls && urls.length > 0) {
        let startIndex = currentAyahIndex;
        if (AudioService.isSequenceFinished()) {
          startIndex = 0;
          setCurrentAyahIndex(0);
        }
        await AudioService.playAyahSequence(urls, startIndex, (status) => {
          setIsPlaying(status.isPlaying);
          if (status.ayahIndex !== undefined) {
            setCurrentAyahIndex(status.ayahIndex);
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
        const surahNumber = resolveSurahNumber(surahName);
        if (surahNumber > 0) {
          const audioUrl = AudioService.getSurahAudioUrl(surahNumber);
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
      }
      setIsLoading(false);
    }
  };

  const handleJumpToAyah = async (index: number) => {
    setCurrentAyahIndex(index);
    if (urls && urls.length > 0) {
      if (isPlaying) {
        await AudioService.jumpToAyah(index);
      } else {
        setIsLoading(true);
        await AudioService.playAyahSequence(urls, index, (status) => {
          setIsPlaying(status.isPlaying);
          if (status.ayahIndex !== undefined) {
            setCurrentAyahIndex(status.ayahIndex);
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
        setIsLoading(false);
      }
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
      {/* Reciter Info Header */}
      <View style={styles.infoBox}>
        <View style={styles.iconCircle}>
          <Ionicons name="headset" size={22} color={Theme.colors.accentGold} />
        </View>
        <View style={styles.textStack}>
          <Text style={styles.reciterName}>{getReciterName(reciterId)}</Text>
          <Text style={styles.subText}>
            {rangeLabel
              ? `Listening to ${rangeLabel} (3 times)`
              : "Listen to today's page 3 times following your Mus-haf"}
          </Text>
        </View>
      </View>

      {/* Play Controls Row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playingBtn]}
          onPress={handlePlayPause}
          disabled={isLoading}
          activeOpacity={0.8}
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

        <TouchableOpacity
          style={styles.countBadge}
          onPress={incrementManualCount}
          activeOpacity={0.7}
        >
          <Text style={styles.countText}>{listenCount} / 3</Text>
          <Text style={styles.countSub}>Listens</Text>
        </TouchableOpacity>
      </View>

      {/* Progress pill if playing multiple ayahs */}
      {urls && urls.length > 1 && (
        <View style={styles.ayahProgressRow}>
          <Text style={styles.progressLabel}>
            Playing Ayah {currentAyahIndex + 1} of {urls.length}
          </Text>
          <TouchableOpacity
            style={styles.toggleTranslationBtn}
            onPress={() => setShowTranslations(!showTranslations)}
          >
            <Ionicons
              name={showTranslations ? "eye-off-outline" : "eye-outline"}
              size={14}
              color={Theme.colors.accentGold}
            />
            <Text style={styles.toggleTranslationText}>
              {showTranslations ? "Hide Translation" : "Show Translation"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hilali & Muhsin Khan Verse-by-Verse Translation List */}
      {showTranslations && (
        <View style={styles.translationContainer}>
          <View style={styles.translationHeaderRow}>
            <View style={styles.translationTitleGroup}>
              <Ionicons name="book-outline" size={16} color={Theme.colors.accentGold} />
              <Text style={styles.translationSourceTitle}>
                Taqi-ud-Din al-Hilali & Muhsin Khan Translation
              </Text>
            </View>
          </View>

          {loadingTranslations ? (
            <View style={styles.skeletonWrap}>
              <View style={styles.translationLoadingBox}>
                <ActivityIndicator size="small" color={Theme.colors.accentGold} />
                <Text style={styles.loadingText}>Loading Hilali translation, cached for offline next time</Text>
              </View>
              {[0, 1].map((k) => (
                <View key={k} style={styles.skeletonCard}>
                  <View style={styles.skeletonLineLong} />
                  <View style={styles.skeletonLineMed} />
                  <View style={styles.skeletonLineShort} />
                </View>
              ))}
            </View>
          ) : translations.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              style={styles.versesScrollView}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {translations.map((item, idx) => {
                const isActive = idx === currentAyahIndex;
                return (
                  <TouchableOpacity
                    key={`${item.surahNumber}_${item.ayahNumber}_${idx}`}
                    style={[
                      styles.verseCard,
                      isActive && styles.activeVerseCard,
                    ]}
                    onPress={() => handleJumpToAyah(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.verseMetaRow}>
                      <View style={[styles.versePill, isActive && styles.activeVersePill]}>
                        <Text style={[styles.versePillText, isActive && styles.activeVersePillText]}>
                          {item.surahName} {item.surahNumber}:{item.ayahNumber}
                        </Text>
                      </View>
                      {isActive && isPlaying && (
                        <View style={styles.nowPlayingTag}>
                          <Ionicons name="volume-high" size={14} color={Theme.colors.accentGold} />
                          <Text style={styles.nowPlayingText}>RECITED NOW</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.verseText, isActive && styles.activeVerseText]}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyTranslationText}>
              No translation verses found for this portion.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 22, 40, 0.75)',
    borderRadius: Theme.borderRadius.lg,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.accentGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  textStack: {
    flex: 1,
  },
  reciterName: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  subText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  playingBtn: {
    backgroundColor: '#EAB308',
  },
  playBtnText: {
    color: Theme.colors.bgDark,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    minWidth: 70,
  },
  countText: {
    color: Theme.colors.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  countSub: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ayahProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.xs,
  },
  progressLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTranslationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(212, 168, 67, 0.1)',
  },
  toggleTranslationText: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '600',
  },
  translationContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  translationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  translationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  translationSourceTitle: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  translationLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.sm,
    gap: 8,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  skeletonWrap: {
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: 'rgba(19, 34, 56, 0.55)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 8,
  },
  skeletonLineLong: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    width: '92%',
  },
  skeletonLineMed: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    width: '78%',
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    width: '62%',
  },
  versesScrollView: {
    maxHeight: 280,
  },
  verseCard: {
    backgroundColor: 'rgba(19, 34, 56, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeVerseCard: {
    backgroundColor: 'rgba(212, 168, 67, 0.14)',
    borderColor: Theme.colors.accentGold,
    borderWidth: 1.5,
  },
  verseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  versePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  activeVersePill: {
    backgroundColor: Theme.colors.accentGold,
  },
  versePillText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  activeVersePillText: {
    color: Theme.colors.bgDark,
    fontWeight: '800',
  },
  nowPlayingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowPlayingText: {
    color: Theme.colors.accentGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verseText: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  activeVerseText: {
    color: '#FFF8E7',
    fontWeight: '500',
  },
  emptyTranslationText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: Theme.spacing.md,
  },
});
