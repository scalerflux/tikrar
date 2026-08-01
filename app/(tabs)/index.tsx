import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { DayHeader } from '../../components/today/DayHeader';
import { PhaseCard } from '../../components/today/PhaseCard';
import { AudioPlayerComponent } from '../../components/today/AudioPlayerComponent';
import { VoiceRecorderComponent } from '../../components/today/VoiceRecorderComponent';
import { TafseerViewComponent } from '../../components/today/TafseerViewComponent';
import { getScheduleItem, calculateCurrentDay, calculateStreak } from '../../utils/schedule-calculator';
import { getUserSetting, getDailyProgress, saveDailyProgress, getAllCompletedDays, DailyProgressRow } from '../../database/db';

export default function TodayScreen() {
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [scheduleItem, setScheduleItem] = useState<any>(null);
  const [progress, setProgress] = useState<DailyProgressRow | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const startDate = await getUserSetting('startDate', new Date().toISOString());
      const day = calculateCurrentDay(startDate);
      setCurrentDay(day);

      const item = getScheduleItem(day) || getScheduleItem(1);
      setScheduleItem(item);

      const prog = await getDailyProgress(day);
      setProgress(prog);

      const completed = await getAllCompletedDays();
      const streakInfo = calculateStreak(completed);
      setStreak(streakInfo.currentStreak);
    } catch (err) {
      console.warn('Error loading today data:', err);
      // Safe fallback
      const fallbackItem = getScheduleItem(1);
      setScheduleItem(fallbackItem);
      setProgress({
        dayNumber: 1,
        phaseYesterday: 0,
        phaseListening: 0,
        phaseTafseer: 0,
        phaseRecording: 0,
        phaseConnection: 0,
        phaseRevision: 0,
        isComplete: 0,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = async (phaseKey: keyof DailyProgressRow) => {
    if (!progress) return;
    try {
      const currentValue = progress[phaseKey] as number;
      const newValue = currentValue === 1 ? 0 : 1;

      const updated = {
        ...progress,
        [phaseKey]: newValue,
      };

      const isAllDone = (
        (phaseKey === 'phaseYesterday' ? newValue : updated.phaseYesterday) === 1 &&
        (phaseKey === 'phaseListening' ? newValue : updated.phaseListening) === 1 &&
        (phaseKey === 'phaseTafseer' ? newValue : updated.phaseTafseer) === 1 &&
        (phaseKey === 'phaseRecording' ? newValue : updated.phaseRecording) === 1 &&
        (phaseKey === 'phaseConnection' ? newValue : updated.phaseConnection) === 1 &&
        (phaseKey === 'phaseRevision' ? newValue : updated.phaseRevision) === 1
      ) ? 1 : 0;

      updated.isComplete = isAllDone;

      const saved = await saveDailyProgress(updated);
      setProgress(saved);

      if (isAllDone === 1 && currentValue === 0) {
        Alert.alert(
          "🎉 Barakah!",
          `Masha'Allah! You have completed Day ${currentDay} of your Tikrar Quran program.`,
          [{ text: "Alhamdulillah", onPress: () => loadTodayData() }]
        );
      }
    } catch (e) {
      console.warn('Error toggling phase:', e);
    }
  };

  if (loading || !scheduleItem || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.accentGold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <DayHeader
          dayNumber={currentDay}
          surahName={scheduleItem.surahName}
          faceNumber={scheduleItem.faceNumber}
          tourNumber={scheduleItem.tourNumber}
          streak={streak}
        />

        {/* 6 Daily Phases */}
        <Text style={styles.sectionHeader}>TODAY'S 6 PHASES</Text>

        {/* Phase 1: Yesterday's Repetition */}
        <PhaseCard
          phaseNumber={1}
          title="Yesterday's Repetition"
          subtitle="Recite yesterday's page 5 times from memory"
          iconName="repeat-outline"
          isCompleted={progress.phaseYesterday === 1}
          onToggleComplete={() => togglePhase('phaseYesterday')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Yesterday's Portion:</Text>
            <Text style={styles.detailValue}>
              Day {Math.max(1, currentDay - 1)} Page / Face
            </Text>
            <Text style={styles.detailInstruction}>
              Clear your mind and recite the page 5 times out loud without looking at the Mus-haf.
            </Text>
          </View>
        </PhaseCard>

        {/* Phase 2: Listening */}
        <PhaseCard
          phaseNumber={2}
          title="Listening (3 Times)"
          subtitle="Listen to Sheikh Nāṣir Al-Qaṭānī while following along"
          iconName="headset-outline"
          isCompleted={progress.phaseListening === 1}
          onToggleComplete={() => togglePhase('phaseListening')}
        >
          <AudioPlayerComponent
            surahName={scheduleItem.surahName}
            onCompleted3Times={() => {
              if (progress.phaseListening === 0) {
                togglePhase('phaseListening');
              }
            }}
          />
        </PhaseCard>

        {/* Phase 3: Tafseer */}
        <PhaseCard
          phaseNumber={3}
          title="Tafseer & Meaning"
          subtitle="Read English translation & commentary (Tafseer As-Sa'di)"
          iconName="book-outline"
          isCompleted={progress.phaseTafseer === 1}
          onToggleComplete={() => togglePhase('phaseTafseer')}
        >
          <TafseerViewComponent surahName={scheduleItem.surahName} />
        </PhaseCard>

        {/* Phase 4: Recording */}
        <PhaseCard
          phaseNumber={4}
          title="Voice Recording (3 Times)"
          subtitle="Record yourself reciting from memory and self-correct"
          iconName="mic-outline"
          isCompleted={progress.phaseRecording === 1}
          onToggleComplete={() => togglePhase('phaseRecording')}
        >
          <VoiceRecorderComponent
            onCompleted3Times={() => {
              if (progress.phaseRecording === 0) {
                togglePhase('phaseRecording');
              }
            }}
          />
        </PhaseCard>

        {/* Phase 5: Connection */}
        <PhaseCard
          phaseNumber={5}
          title="30-Day Connection (Rabt)"
          subtitle="Recite pages perfected over last 30 days from memory"
          iconName="link-outline"
          isCompleted={progress.phaseConnection === 1}
          onToggleComplete={() => togglePhase('phaseConnection')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Connection Range:</Text>
            <Text style={styles.detailValue}>
              {scheduleItem.connectionRange || "Pages perfected in last 30 days"}
            </Text>
            <Text style={styles.detailInstruction}>
              Recite this entire portion once from memory without looking at the Mus-haf.
            </Text>
          </View>
        </PhaseCard>

        {/* Phase 6: Revision */}
        <PhaseCard
          phaseNumber={6}
          title="Old Memorization Revision"
          subtitle={`Tour #${scheduleItem.tourNumber} — 6 day rotation schedule`}
          iconName="refresh-outline"
          isCompleted={progress.phaseRevision === 1}
          onToggleComplete={() => togglePhase('phaseRevision')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Revision Circuit Range:</Text>
            <Text style={styles.detailValue}>
              {scheduleItem.revisionRange || "All old memorization portion"}
            </Text>
            <Text style={styles.detailInstruction}>
              Recite old memorization from memory. Complete your full old portion every 6 days.
            </Text>
          </View>
        </PhaseCard>
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
  scrollContent: {
    padding: Theme.spacing.md,
  },
  sectionHeader: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  cardDetailBox: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  detailTitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: Theme.colors.accentGold,
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 4,
  },
  detailInstruction: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
