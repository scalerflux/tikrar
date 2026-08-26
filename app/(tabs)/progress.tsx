import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import { getAllCompletedDaysWithDates, getUserSetting } from '../../database/db';
import { calculateCurrentDay, calculateStreak, TOTAL_PROGRAM_DAYS, localDateString, parseLocalDateString, daysBetweenDates } from '../../utils/schedule-calculator';
import { SURAH_LIST } from '../../data/surah-metadata';
import scheduleData from '../../data/schedule-data.json';
import { Ionicons } from '@expo/vector-icons';
import { ProgressRing } from '../../components/progress/ProgressRing';
import { UstadSessionService, UstadSession, getUstadSessionDays } from '../../services/ustad-session-service';
import { NegligenceService } from '../../services/negligence-service';

interface LogEntry {
  key: string;
  date: string;
  attended: boolean;
  session?: UstadSession;
  reason?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatLogDate(dateStr: string): string {
  const d = parseLocalDateString(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [view, setView] = useState<'quran' | 'ustad'>('quran');
  const [ustadName, setUstadName] = useState('');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const loadProgressData = async () => {
    setLoading(true);
    const completed = await getAllCompletedDaysWithDates();
    const nums = completed.map((c) => c.dayNumber);
    setCompletedDays(nums);

    const day = calculateCurrentDay(nums);
    setCurrentDay(day);

    const streak = calculateStreak(completed.map((c) => c.completedDate).filter((d) => d.length > 0));
    setStreakData(streak);

    const savedUstad = await getUserSetting('ustadTeacher', '');
    setUstadName(savedUstad);

    const entries: LogEntry[] = [];
    if (savedUstad) {
      const sessions = await UstadSessionService.getSessions();
      const excuses = await NegligenceService.getExcuses();
      const excuseByDate = new Map<string, string>();
      for (const e of excuses) {
        if (!excuseByDate.has(e.date)) excuseByDate.set(e.date, e.reason);
      }
      const attendedDates = new Set(
        sessions.filter((s) => s.recitedAt).map((s) => s.recitedAt.slice(0, 10))
      );

      for (const s of sessions.slice().reverse()) {
        if (!s.recitedAt) continue;
        entries.push({
          key: `s_${s.recitedAt}_${s.dayNumber}`,
          date: s.recitedAt.slice(0, 10),
          attended: true,
          session: s,
        });
      }

      const setDate = await getUserSetting('ustadSetDate', localDateString());
      const today = localDateString();
      const sessionDays = getUstadSessionDays(savedUstad);
      let cursor = setDate;
      if (daysBetweenDates(cursor, today) > 60) {
        const d = parseLocalDateString(today);
        d.setDate(d.getDate() - 60);
        cursor = localDateString(d);
      }
      while (daysBetweenDates(cursor, today) >= 1) {
        const dow = parseLocalDateString(cursor).getDay();
        if (sessionDays.includes(dow) && !attendedDates.has(cursor)) {
          const reason = excuseByDate.get(cursor);
          entries.push({
            key: `m_${cursor}`,
            date: cursor,
            attended: false,
            reason: reason ? `Not recited to Ustad coz ${reason}` : 'Not recited to Ustad due to negligence',
          });
        }
        const d = parseLocalDateString(cursor);
        d.setDate(d.getDate() + 1);
        cursor = localDateString(d);
      }
    }
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    setLogEntries(entries);

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [])
  );

  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  const totalFacesCompleted = completedDays.length;
  const totalFacesInQuran = TOTAL_PROGRAM_DAYS;
  const percentComplete = ((totalFacesCompleted / totalFacesInQuran) * 100).toFixed(1);

  const surahStats = useMemo(() => {
    const normalize = (n: string) => n.toLowerCase().replace(/['’`]/g, '').replace(/-/g, '').replace(/\s+/g, '');
    const aliases: Record<string, string> = { attawbah: 'attaubah', almujadila: 'almujadilah' };
    const canonical = (n: string) => {
      const k = normalize(n);
      return aliases[k] ?? k;
    };
    const counts = new Map<string, { total: number; done: number }>();
    for (const row of scheduleData as any[]) {
      const name: string = row.surahName;
      if (name === 'Group of Surahs') continue;
      const key = canonical(name);
      const entry = counts.get(key) || { total: 0, done: 0 };
      entry.total += 1;
      if (completedSet.has(row.dayNumber)) entry.done += 1;
      counts.set(key, entry);
    }
    return SURAH_LIST.map((s) => {
      const c = counts.get(canonical(s.transliteration));
      const total = c ? c.total : 0;
      const done = c ? c.done : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { surah: s, total, done, pct, isCompleted: total > 0 && done === total, isStarted: done > 0 };
    });
  }, [completedSet]);

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
        <Text style={styles.headerSubtitle}>Day {currentDay} of {TOTAL_PROGRAM_DAYS} • {streakData.totalCompleted} faces completed</Text>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, view === 'quran' && styles.viewToggleBtnActive]}
            onPress={() => setView('quran')}
            activeOpacity={0.8}
          >
            <Ionicons name="book-outline" size={15} color={view === 'quran' ? Theme.colors.bgDark : Theme.colors.textSecondary} />
            <Text style={[styles.viewToggleText, view === 'quran' && styles.viewToggleTextActive]}>Quran Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, view === 'ustad' && styles.viewToggleBtnActive]}
            onPress={() => setView('ustad')}
            activeOpacity={0.8}
          >
            <Ionicons name="school-outline" size={15} color={view === 'ustad' ? Theme.colors.bgDark : Theme.colors.textSecondary} />
            <Text style={[styles.viewToggleText, view === 'ustad' && styles.viewToggleTextActive]}>Ustad Log</Text>
          </TouchableOpacity>
        </View>

        {view === 'quran' ? (
          <>
            <View style={styles.progressRingContainer}>
              <ProgressRing percentage={parseFloat(percentComplete)} size={200} strokeWidth={16} />
              <Text style={styles.percentCaption}>{percentComplete}% of Quran faces</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalFacesCompleted}</Text>
                <Text style={styles.statLabel}>Faces Done</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{1206 - totalFacesCompleted}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{currentDay}</Text>
                <Text style={styles.statLabel}>Current Day</Text>
              </View>
            </View>

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

            <Text style={styles.sectionHeader}>SURAH BREAKDOWN • {SURAH_LIST.length} surahs</Text>
            <Text style={styles.sectionSub}>Progress per surah based on your 1,206 half-page schedule</Text>

            {surahStats.map(({ surah, total, done, pct, isCompleted, isStarted }) => {
              return (
                <View
                  key={surah.number}
                  style={[
                    styles.surahRow,
                    isCompleted && styles.surahRowCompleted,
                    isStarted && !isCompleted && styles.surahRowStarted,
                  ]}
                >
                  <View style={[styles.surahNumberBadge, isCompleted && styles.surahBadgeDone]}>
                    <Text style={[styles.surahNumberText, isCompleted && styles.surahNumberTextDone]}>{surah.number}</Text>
                  </View>
                  <View style={styles.surahInfo}>
                    <View style={styles.surahNameRow}>
                      <Text style={styles.surahName}>{surah.transliteration}</Text>
                      {isCompleted ? <Ionicons name="checkmark-circle" size={16} color="#10B981" /> : null}
                    </View>
                    <Text style={styles.surahMeta}>{surah.type} • {surah.totalVerses} Verses{total ? ` • ${done}/${total} faces` : ' • Not in main schedule'}</Text>
                    {total > 0 ? (
                      <View style={styles.miniBarTrack}>
                        <View style={[styles.miniBarFill, { width: `${pct}%` }, isCompleted && styles.miniBarDone]} />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.surahRight}>
                    <Text style={styles.surahAr}>{surah.nameAr}</Text>
                    {total > 0 ? <Text style={[styles.surahPct, isCompleted && styles.surahPctDone]}>{pct}%</Text> : null}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.sectionHeader}>USTAD RECITATION LOG</Text>
            <Text style={styles.sectionSub}>Sessions recited to {ustadName || 'your ustad'}, with missed days</Text>
            {logEntries.length === 0 ? (
              <View style={styles.logEmptyBox}>
                <Ionicons name="school-outline" size={28} color={Theme.colors.textMuted} />
                <Text style={styles.logEmptyText}>No sessions logged yet.</Text>
                <Text style={styles.logEmptySub}>On your ustad's session days, mark attendance in the Today tab.</Text>
              </View>
            ) : (
              logEntries.map((e) => (
                <View key={e.key} style={[styles.logRow, e.attended ? styles.logRowAttended : styles.logRowMissed]}>
                  <View style={[styles.logIconWrap, e.attended ? styles.logIconAttended : styles.logIconMissed]}>
                    <Ionicons name={e.attended ? 'checkmark' : 'close'} size={16} color={e.attended ? Theme.colors.bgDark : '#EF4444'} />
                  </View>
                  <View style={styles.logInfo}>
                    {e.attended && e.session ? (
                      <>
                        <Text style={styles.logTitle}>{e.session.faceNumber} — {e.session.surahName}</Text>
                        <Text style={styles.logMeta}>Recited to {e.session.ustadName} • {formatLogTime(e.session.recitedAt)}</Text>
                      </>
                    ) : (
                      <Text style={styles.logMissedText}>{e.reason || 'Not recited to Ustad due to negligence'}</Text>
                    )}
                    <Text style={styles.logDate}>{formatLogDate(e.date)} • {DAY_NAMES[parseLocalDateString(e.date).getDay()]}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
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
    paddingBottom: 100,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Theme.spacing.md,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 4,
    gap: 4,
    marginBottom: Theme.spacing.md,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: Theme.colors.accentGold,
  },
  viewToggleText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  viewToggleTextActive: {
    color: Theme.colors.bgDark,
  },
  logRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.xs,
  },
  logRowAttended: {
    borderColor: 'rgba(16,185,129,0.3)',
  },
  logRowMissed: {
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  logIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logIconAttended: {
    backgroundColor: '#10B981',
  },
  logIconMissed: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  logMeta: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  logMissedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  logDate: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  logEmptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  logEmptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  logEmptySub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  percentCaption: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  statBox: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    flex: 1,
  },
  statNumber: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
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
    marginTop: Theme.spacing.sm,
  },
  sectionSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginBottom: Theme.spacing.sm,
    marginTop: 2,
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
  surahRowCompleted: {
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  surahRowStarted: {
    borderColor: 'rgba(212,168,67,0.25)',
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
  surahBadgeDone: {
    backgroundColor: '#10B981',
  },
  surahNumberText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  surahNumberTextDone: {
    color: '#fff',
  },
  surahInfo: {
    flex: 1,
  },
  surahNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  surahName: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  surahMeta: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  miniBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: 4,
    backgroundColor: Theme.colors.accentGold,
    borderRadius: 2,
  },
  miniBarDone: {
    backgroundColor: '#10B981',
  },
  surahRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  surahAr: {
    color: Theme.colors.accentGold,
    fontSize: 18,
    fontWeight: '700',
  },
  surahPct: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  surahPctDone: {
    color: '#10B981',
  },
});
