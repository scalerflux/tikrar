import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { TranslationService, AyahTranslation } from '../../services/translation-service';

interface TafseerViewComponentProps {
  surahName: string;
  faceNumber?: string;
}

/**
 * Phase 3 body. Shows the Hilali-Khan meaning of today's face so the card is
 * never empty. The tafseer itself is read from the student's own copy, the
 * app does not bundle commentary text.
 */
export const TafseerViewComponent: React.FC<TafseerViewComponentProps> = ({ faceNumber }) => {
  const [ayahs, setAyahs] = useState<AyahTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!faceNumber) return;
    let active = true;
    setLoading(true);
    TranslationService.getFaceTranslation(faceNumber)
      .then((data) => { if (active) setAyahs(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setAyahs([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [faceNumber, attempt]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="book-outline" size={15} color={Theme.colors.accentGold} />
        <Text style={styles.sourceText}>Meaning of today's face · Hilali-Khan</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Theme.colors.accentGold} style={styles.loader} />
      ) : ayahs.length === 0 ? (
        <View>
          <Text style={styles.emptyText}>
            The translation could not be loaded. Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setAttempt((n) => n + 1)} activeOpacity={0.8}>
            <Ionicons name="refresh" size={14} color={Theme.colors.accentGold} />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        ayahs.map((a) => (
          <View key={`${a.surahNumber}:${a.ayahNumber}`} style={styles.ayahRow}>
            <Text style={styles.ayahRef}>{a.surahName} {a.ayahNumber}</Text>
            <Text style={styles.ayahText}>{a.text}</Text>
          </View>
        ))
      )}

      <Text style={styles.note}>
        After reading the meaning, read the tafseer of these verses from your copy of Tafseer As-Sa'di, then check this phase off.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  sourceText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loader: {
    marginVertical: Theme.spacing.md,
  },
  ayahRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  ayahRef: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  ayahText: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.accentGoldMuted,
  },
  retryText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  note: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
});
