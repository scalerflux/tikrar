import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { getAllCompletedDaysWithDates } from '../../database/db';
import { calculateCurrentDay, calculateStreak, TOTAL_PROGRAM_DAYS } from '../../utils/schedule-calculator';
import { SURAH_LIST } from '../../data/surah-metadata';
import { Ionicons } from '@expo/vector-icons';
import { ProgressRing } from '../../components/progress/ProgressRing';

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    setLoading(true);
    const completed = await getAllCompletedDaysWithDates();
    setCompletedDays(completed.map((c) => c.dayNumber));

    const day = calculateCurrentDay(completed.map((c) => c.dayNumber));
    setCurrentDay(day);

    const streak = calculateStreak(completed.map((c) => c.completedDate).filter((d) => d.length > 0));
    setStreakData(streak);

    setLoading(false);
  };

  const totalFacesCompleted = completedDays.length;
  const totalFacesInQuran = TOTAL_PROGRAM_DAYS;
  const percentComplete = ((totalFacesCompleted / totalFacesInQuran) * 100).toFixed(1);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.accentGold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Progress Analytics</Text>

        {/* Overall Progress Ring */}
        <View style={styles.progressRingContainer}>
          <ProgressRing percentage={parseFloat(percentComplete)} size={200} strokeWidth={16} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalFacesCompleted}</Text>
            <Text style={styles.statLabel}>Faces Done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{1206 - totalFacesCompleted}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Streaks Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakBox}>
            <Ionicons name="flame" size={28} color={Theme.colors.accentGold} />
            <Text style={styles.streakNum}>{streakData.currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak (Days)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.streakBox}>
            <Ionicons name="trophy-outline" size={28} color={Theme.colors.accentGold} />
            <Text style={styles.streakNum}>{streakData.longestStreak}</Text>
            <Text style={styles.streakLabel}>Best Streak (Days)</Text>
          </View>
        </View>

        {/* Surah Breakdown Header */}
        <Text style={styles.sectionHeader}>SURAH BREAKDOWN</Text>

        {/* First 10 Surahs Preview */}
        {SURAH_LIST.slice(0, 15).map(surah => {
          return (
            <View key={surah.number} style={styles.surahRow}>
              <View style={styles.surahNumberBadge}>
                <Text style={styles.surahNumberText}>{surah.number}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{surah.transliteration}</Text>
                <Text style={styles.surahMeta}>{surah.type} • {surah.totalVerses} Verses</Text>
              </View>
              <Text style={styles.surahAr}>{surah.nameAr}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Theme.spacing.md,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Theme.spacing.md,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.md,
  },
  statBox: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    width: '45%',
  },
  statNumber: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  mainProgressCard: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    marginBottom: Theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.lg,
  },
  circleStat: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.accentGoldMuted,
    borderWidth: 3,
    borderColor: Theme.colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    color: Theme.colors.accentGold,
    fontSize: 22,
    fontWeight: '800',
  },
  percentLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  rightStats: {
    flex: 1,
    gap: Theme.spacing.sm,
  },
  smallStatBox: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  smallStatNumber: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  smallStatLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  streakCard: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  streakBox: {
    alignItems: 'center',
  },
  streakNum: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  streakLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Theme.colors.border,
  },
  sectionHeader: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: Theme.spacing.sm,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  surahNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.accentGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  surahNumberText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  surahMeta: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  surahAr: {
    color: Theme.colors.accentGold,
    fontSize: 18,
    fontWeight: '700',
  },
});
