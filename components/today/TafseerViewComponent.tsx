import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getTafseerForSurah } from '../../data/tafseer-saadi';
import { Ionicons } from '@expo/vector-icons';

interface TafseerViewComponentProps {
  surahName: string;
}

export const TafseerViewComponent: React.FC<TafseerViewComponentProps> = ({ surahName }) => {
  const tafseer = getTafseerForSurah(surahName);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="book-outline" size={20} color={Theme.colors.accentGold} />
        <Text style={styles.sourceText}>Tafseer As-Sa'di (English)</Text>
      </View>

      <Text style={styles.summaryText}>{tafseer.summary}</Text>

      {tafseer.keyThemes && tafseer.keyThemes.length > 0 && (
        <View style={styles.themesSection}>
          <Text style={styles.themesHeader}>Key Takeaways:</Text>
          {tafseer.keyThemes.map((theme, idx) => (
            <View key={idx} style={styles.themeRow}>
              <Ionicons name="sparkles-outline" size={14} color={Theme.colors.accentGold} />
              <Text style={styles.themeText}>{theme}</Text>
            </View>
          ))}
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  sourceText: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryText: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  themesSection: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  themesHeader: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  themeText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
});
