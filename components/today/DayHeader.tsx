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
  phasesDone?: number;
  phasesTotal?: number;
}

function formatFace(face: string): string {
  if (!face) return '—';
  return face.replace('h1', ' · 1st half').replace('h2', ' · 2nd half');
}

export const DayHeader: React.FC<DayHeaderProps> = ({
  dayNumber,
  surahName,
  faceNumber,
  tourNumber,
  streak,
  timeLeft,
  timeLeftColor,
  phasesDone = 0,
  phasesTotal = 0,
}) => {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const pct = phasesTotal > 0 ? Math.min(100, Math.round((phasesDone / phasesTotal) * 100)) : 0;
  const allDone = phasesTotal > 0 && phasesDone >= phasesTotal;

  return (
    <View>
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.greeting}>Assalamu alaikum</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={15} color={Theme.colors.accentGold} />
          <Text style={styles.streakText}>{streak}</Text>
          <Text style={styles.streakUnit}>day streak</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.heroTopRow}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>DAY {dayNumber}</Text>
            <Text style={styles.dayBadgeTotal}> of 1,206</Text>
          </View>
          <View style={styles.clockPill}>
            <Ionicons name="time-outline" size={13} color={timeLeftColor} />
            <Text style={[styles.timeValue, { color: timeLeftColor }]}>{timeLeft}</Text>
          </View>
        </View>

        <Text style={styles.overline}>Today's portion</Text>
        <Text style={styles.surahTitle} numberOfLines={2}>{surahName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="document-text-outline" size={12} color={Theme.colors.textSecondary} />
            <Text style={styles.metaText}>Face {formatFace(faceNumber)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="sync-outline" size={12} color={Theme.colors.textSecondary} />
            <Text style={styles.metaText}>Tour #{tourNumber}</Text>
          </View>
        </View>

        {phasesTotal > 0 ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                {allDone ? 'All phases done' : `${phasesDone} of ${phasesTotal} phases done`}
              </Text>
              <Text style={[styles.progressPct, allDone && styles.progressPctDone]}>{pct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }, allDone && styles.progressFillDone]} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  topBarText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  date: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.accentGoldMuted,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
  },
  streakText: {
    color: Theme.colors.accentGold,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  hero: {
    backgroundColor: Theme.colors.bgHero,
    borderRadius: Theme.borderRadius.xl,
    padding: 20,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    overflow: 'hidden',
    ...Theme.shadow.card,
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -90,
    top: -110,
    backgroundColor: 'rgba(221,178,82,0.10)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  dayBadgeText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dayBadgeTotal: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  overline: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  surahTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBlock: {
    marginTop: Theme.spacing.md + 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPct: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressPctDone: {
    color: Theme.colors.successGreen,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.accentGold,
  },
  progressFillDone: {
    backgroundColor: Theme.colors.successGreen,
  },
});
