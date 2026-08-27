import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface DayHeaderProps {
  dayNumber: number;
  surahName: string;
  faceNumber: string;
  tourNumber: number;
  streak: number;
  timeLeft: string;
  timeLeftColor: string;
}

export const DayHeader: React.FC<DayHeaderProps> = ({
  dayNumber,
  surahName,
  faceNumber,
  tourNumber,
  streak,
  timeLeft,
  timeLeftColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.mainInfo}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>DAY {dayNumber} / 1206</Text>
          </View>
          <Text style={styles.surahTitle}>{surahName}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Page Face: <Text style={styles.detailHighlight}>{faceNumber || '—'}</Text></Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.detailText}>Tour: <Text style={styles.detailHighlight}>#{tourNumber}</Text></Text>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={Theme.colors.accentGold} />
            <Text style={styles.streakText}>{streak} Day Streak</Text>
          </View>
          <Text style={styles.timeRemainingLabel}>Time remaining</Text>
          <View style={styles.clockPill}>
            <Ionicons name="time-outline" size={14} color={timeLeftColor} />
            <Text style={[styles.timeValue, { color: timeLeftColor }]}>{timeLeft}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  mainInfo: {
    flex: 1,
    minWidth: 0,
  },
  dayBadge: {
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  dayBadgeText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 67, 0.1)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    gap: 4,
  },
  streakText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  surahTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  detailHighlight: {
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  dot: {
    color: Theme.colors.textMuted,
    marginHorizontal: 8,
  },
  timeRemainingLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 132,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
