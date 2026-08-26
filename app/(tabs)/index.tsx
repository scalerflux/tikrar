import React, { useCallback, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator, Modal, Animated, Easing, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import { DayHeader } from '../../components/today/DayHeader';
import { PhaseCard } from '../../components/today/PhaseCard';
import { AudioPlayerComponent } from '../../components/today/AudioPlayerComponent';
import { VoiceRecorderComponent } from '../../components/today/VoiceRecorderComponent';
import { TafseerViewComponent } from '../../components/today/TafseerViewComponent';
import { getScheduleItem, getUstadRecitationItem, calculateCurrentDay, calculateStreak, ScheduleItem, localDateString, datesBetweenExclusive } from '../../utils/schedule-calculator';
import { getReminderForDay, DailyReminder } from '../../utils/reminders';
import { DailyReminderCard } from '../../components/today/DailyReminderCard';
import { getDailyProgress, saveDailyProgress, getAllCompletedDaysWithDates, DailyProgressRow, getUserSetting } from '../../database/db';
import { AudioService } from '../../services/audio-service';
import { TranslationService } from '../../services/translation-service';
import { NegligenceService, Excuse } from '../../services/negligence-service';
import { UstadSessionService, getUstadSessionDays } from '../../services/ustad-session-service';
import { NotificationService } from '../../services/notification-service';
import { getDeviceUtcOffsetHour } from '../../utils/timezone';
import { Ionicons } from '@expo/vector-icons';

function formatRangeText(rangeStr: string): string {
  if (!rangeStr) return '';
  return rangeStr
    .replace(/\s*→\s*/g, '  ➔  ')
    .replace(/h1/g, '(1st Half)')
    .replace(/h2/g, '(2nd Half)');
}

// DST-safe: Makkah conversions use live device UTC offset (utils/timezone).

function parseTimeToMinutesToday(t: string): number | null {
  const m = t.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + min;
}
function formatMinutesToday(mins: number): string {
  mins = ((mins % 1440) + 1440) % 1440;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  let dh = h % 12;
  if (dh === 0) dh = 12;
  return m === 0 ? `${dh} ${ap}` : `${dh}:${String(m).padStart(2, '0')} ${ap}`;
}
function convertTimingToday(timeStr: string, _countryCode?: string): string {
  const diff = getDeviceUtcOffsetHour() - 3;
  if (diff === 0) return timeStr;
  return timeStr.replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi, (match) => {
    const mins = parseTimeToMinutesToday(match);
    if (mins === null) return match;
    return formatMinutesToday(mins + diff * 60);
  });
}

export default function TodayScreen() {
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [scheduleItem, setScheduleItem] = useState<ScheduleItem | null>(null);
  const [reminder, setReminder] = useState<DailyReminder | null>(null);
  const [yesterdayItem, setYesterdayItem] = useState<ScheduleItem | null>(null);
  const [progress, setProgress] = useState<DailyProgressRow | null>(null);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedDay, setCelebratedDay] = useState(1);
  const [ustadName, setUstadName] = useState('');
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [negligenceCount, setNegligenceCount] = useState(0);
  const [excuseInput, setExcuseInput] = useState('');
  const [showExcusePrompt, setShowExcusePrompt] = useState(false);
  const [pendingExcuse, setPendingExcuse] = useState<{ date: string; dayNumber: number } | null>(null);
  const [excuseQueue, setExcuseQueue] = useState<Array<{ date: string; dayNumber: number }>>([]);
  const [pastExcuses, setPastExcuses] = useState<Excuse[]>([]);
  const [ustadSessionCount, setUstadSessionCount] = useState(0);
  const [ustadAttended, setUstadAttended] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState(localDateString());
  const [timeLeftColor, setTimeLeftColor] = useState('#10B981');
  const fajrMinutesRef = useRef(300);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiSpin = useRef(new Animated.Value(0)).current;
  const lastDateRef = useRef(localDateString());
  const confirmedTodayRef = useRef(false);

  const getTimeUntilFajr = () => {
    const now = new Date();
    const fajr = new Date(now);
    fajr.setHours(Math.floor(fajrMinutesRef.current / 60), fajrMinutesRef.current % 60, 0, 0);
    if (now >= fajr) fajr.setDate(fajr.getDate() + 1);
    const diff = fajr.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const color = diff > 6 * 3600000 ? '#10B981' : diff > 3600000 ? '#F59E0B' : '#EF4444';
    return { text: `${h}h ${m}m ${s}s`, color };
  };

  useFocusEffect(
    useCallback(() => {
      lastDateRef.current = localDateString();
      loadTodayData();
      const info = getTimeUntilFajr();
      setTimeLeft(info.text);
      setTimeLeftColor(info.color);
      const id = setInterval(() => {
        const info2 = getTimeUntilFajr();
        setTimeLeft(info2.text);
        setTimeLeftColor(info2.color);
        const d = localDateString();
        if (d !== lastDateRef.current) {
          lastDateRef.current = d;
          setCurrentDateStr(d);
          loadTodayData();
        }
      }, 1000);
      return () => {
        clearInterval(id);
        AudioService.stopAudio();
      };
    }, [])
  );

  const triggerCelebration = (day: number) => {
    setCelebratedDay(day);
    setShowCelebration(true);
    scaleAnim.setValue(0.8);
    confettiSpin.setValue(0);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.15)), useNativeDriver: true }),
      Animated.loop(Animated.timing(confettiSpin, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })),
    ]).start();
  };

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const today = localDateString();
      const savedFajrTime = await getUserSetting('fajrTime', '05:00');
      const fajrMatch = savedFajrTime.match(/^(\d{2}):(\d{2})$/);
      if (fajrMatch) {
        const hours = Number(fajrMatch[1]);
        const minutes = Number(fajrMatch[2]);
        if (hours < 24 && minutes < 60) fajrMinutesRef.current = hours * 60 + minutes;
      }
      const lastOpen = await NegligenceService.getLastAppOpen();
      const completedWithDates = await getAllCompletedDaysWithDates();
      const completedDayNumbers = completedWithDates.map((c) => c.dayNumber);
      const completedDateStrings = completedWithDates
        .map((c) => c.completedDate)
        .filter((d) => d.length > 0);

      const day = calculateCurrentDay(completedDayNumbers);
      setCurrentDay(day);

      const item = getScheduleItem(day) || getScheduleItem(1);
      setScheduleItem(item);
      setReminder(getReminderForDay(day));

      const prevItem = getUstadRecitationItem(day);
      setYesterdayItem(prevItem);

      const prog = await getDailyProgress(day);
      setProgress(prog);

      const streakInfo = calculateStreak(completedDateStrings);
      setStreak(streakInfo.currentStreak);

      const savedUstad = await getUserSetting('ustadTeacher', '');
      setUstadName(savedUstad);
      try {
        const rawDays = await getUserSetting('ustadCustomWeekdays', '[]');
        const parsed = JSON.parse(rawDays) as number[];
        setCustomWeekdays(Array.isArray(parsed) ? parsed.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : []);
      } catch {
        setCustomWeekdays([]);
      }
      // If a Makkah-based session reminder was scheduled before a DST shift, fix it now.
      NotificationService.resyncSessionReminderIfTimezoneChanged().catch(() => {});

      const sessionTotal = await UstadSessionService.getTotalSessions();
      setUstadSessionCount(sessionTotal);

      const attendance = await UstadSessionService.hasAttendanceForDate(today);
      setUstadAttended(attendance);

      const excuseList = await NegligenceService.getExcuses();
      setPastExcuses(excuseList.slice().reverse());

      const count = await NegligenceService.getCount();
      setNegligenceCount(count);

      const nextItem = getScheduleItem(day + 1);
      if (nextItem) TranslationService.prefetchFace(nextItem.faceNumber);

      const confirmed = await NegligenceService.getLastConfirmed();
      if (confirmed && confirmed.date === today) {
        confirmedTodayRef.current = true;
        setCelebratedDay(confirmed.dayNumber);
        setShowCelebration(true);
      } else {
        confirmedTodayRef.current = false;
        setShowCelebration(false);
      }

      let missedQueue: Array<{ date: string; dayNumber: number }> = [];
      if (lastOpen && lastOpen !== today) {
        const candidateDates = [lastOpen, ...datesBetweenExclusive(lastOpen, today)];
        for (const date of candidateDates) {
          const hasExcuse = await NegligenceService.hasExcuseForDate(date);
          if (!hasExcuse && !completedDateStrings.includes(date)) {
            missedQueue.push({ date, dayNumber: day });
          }
        }
      }
      setExcuseQueue(missedQueue);
      if (missedQueue.length > 0) {
        setPendingExcuse(missedQueue[0]);
        setShowExcusePrompt(true);
      } else {
        await NegligenceService.setLastAppOpen(today);
      }
    } catch (err) {
      console.warn('Error loading today data:', err);
      const fallbackItem = getScheduleItem(1);
      setScheduleItem(fallbackItem);
      setYesterdayItem(null);
      setProgress({
        dayNumber: 1,
        phaseYesterday: 0,
        phaseListening: 0,
        phaseTafseer: 0,
        phaseRecording: 0,
        phaseConnection: 0,
        phaseRevision: 0,
        isComplete: 0,
        completedDate: '',
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
      const updated = { ...progress, [phaseKey]: newValue };
      const saved = await saveDailyProgress({ ...updated, isComplete: 0 } as any);
      setProgress({ ...saved, isComplete: 0 });
    } catch (e) {
      console.warn('Error toggling phase:', e);
    }
  };

  const allPhasesDone = !!progress && progress.phaseYesterday === 1 && progress.phaseListening === 1 && progress.phaseTafseer === 1 && progress.phaseRecording === 1 && progress.phaseConnection === 1 && progress.phaseRevision === 1;

  const todayDayOfWeek = new Date().getDay();
  const ustadDays = getUstadSessionDays(ustadName, customWeekdays);
  const isUstadDay = Boolean(ustadName) && ustadDays.includes(todayDayOfWeek);
  const ustadGateOk = !isUstadDay || ustadAttended;
  const canConfirm = allPhasesDone && ustadGateOk;

  const handleConfirmToday = async () => {
    if (!progress || !scheduleItem) return;
    if (!allPhasesDone) {
      Alert.alert('Incomplete', 'Complete all 6 phases before confirming.');
      return;
    }
    if (!ustadGateOk) {
      Alert.alert('Ustad session', 'Mark your recitation attendance before confirming.');
      return;
    }
    const today = localDateString();
    const saved = await saveDailyProgress({ ...progress, isComplete: 1, completedDate: today } as any);
    setProgress(saved);
    await NegligenceService.setLastConfirmed(currentDay, today);
    confirmedTodayRef.current = true;
    await AudioService.stopAudio();
    triggerCelebration(currentDay);
  };

  const resolveExcuse = async (reason: string, countsAsNegligence: boolean) => {
    if (!pendingExcuse) return;
    if (countsAsNegligence) {
      const next = await NegligenceService.increment();
      setNegligenceCount(next);
    }
    await NegligenceService.addExcuse(pendingExcuse.date, pendingExcuse.dayNumber, reason);
    const remaining = excuseQueue.slice(1);
    setExcuseQueue(remaining);
    if (remaining.length > 0) {
      setPendingExcuse(remaining[0]);
      setExcuseInput('');
      return;
    }
    await NegligenceService.setLastAppOpen(localDateString());
    setShowExcusePrompt(false);
    setPendingExcuse(null);
    setExcuseInput('');
  };

  const handleSubmitExcuse = async () => {
    if (!pendingExcuse) return;
    if (!excuseInput.trim()) {
      Alert.alert('Enter reason', 'Please write the reason you missed.');
      return;
    }
    await resolveExcuse(excuseInput.trim(), false);
    Alert.alert('Recorded', 'Excuse saved. Negligence count unchanged.');
  };

  const handleNoReason = async () => {
    if (!pendingExcuse) return;
    await resolveExcuse('No reason', true);
  };

  const handleMarkUstadAttendance = async () => {
    const today = localDateString();
    if (ustadAttended) {
      await UstadSessionService.removeAttendanceForDate(today);
      setUstadAttended(false);
      setUstadSessionCount(await UstadSessionService.getTotalSessions());
      return;
    }
    if (!yesterdayItem) return;
    await UstadSessionService.setAttendanceForDate(today);
    await UstadSessionService.logSession({
      dayNumber: currentDay,
      faceNumber: yesterdayItem.faceNumber,
      surahName: yesterdayItem.surahName,
      ustadName,
    });
    setUstadAttended(true);
    const total = await UstadSessionService.getTotalSessions();
    setUstadSessionCount(total);
  };

  if (loading || !scheduleItem || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.accentGold} />
      </View>
    );
  }

  if (showCelebration) {
    const isFullPage = scheduleItem && !scheduleItem.faceNumber.includes('h');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.celebrationScreen}>
          <Animated.Text style={[styles.celebrationConfetti, { transform: [{ rotate: confettiSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>🎉</Animated.Text>
          <Animated.View style={[styles.celebrationBigTick, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark" size={72} color={Theme.colors.bgDark} />
          </Animated.View>
          <Text style={styles.celebrationTitle}>Allahummabarik!</Text>
          <Text style={styles.celebrationSubtitle}>
            All things completed today. May Allah keep you consistent, ameen.
            {isFullPage ? ` Try to recite this page (${scheduleItem.surahName} ${scheduleItem.faceNumber}) in your Salah today.` : ''}
          </Text>
          <View style={styles.celebrationBadge}><Ionicons name="checkmark-circle" size={18} color={Theme.colors.bgDark} /><Text style={styles.celebrationBadgeText}>Day {celebratedDay} of 1,206 complete</Text></View>
          <View style={styles.celebrationUnlockBox}>
            <Ionicons name="lock-open-outline" size={16} color={Theme.colors.textMuted} />
            <Text style={styles.celebrationUnlockText}>Next day's portion is available after {timeLeft}</Text>
          </View>
          <Text style={styles.celebrationHint}>Come back tomorrow for your next face. Rest well.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasConnection = Boolean(scheduleItem.connectionRange && scheduleItem.connectionRange.trim() !== '-');
  const hasRevision = Boolean(scheduleItem.revisionRange && scheduleItem.revisionRange.trim() !== '-');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DayHeader
          dayNumber={currentDay}
          surahName={scheduleItem.surahName}
          faceNumber={scheduleItem.faceNumber}
          tourNumber={scheduleItem.tourNumber}
          streak={streak}
          timeLeft={timeLeft}
          timeLeftColor={timeLeftColor}
        />

        <DailyReminderCard reminder={reminder} />

        <View style={styles.negligenceRow}>
          <View style={styles.negligenceBox}>
            <View style={styles.negligenceHeader}><Ionicons name="warning-outline" size={14} color="#EF4444" /><Text style={styles.negligenceTitle}>Negligence</Text></View>
            <Text style={styles.negligenceCount}>{negligenceCount}</Text>
            <Text style={styles.negligenceSub}>without excuse</Text>
          </View>
          <View style={styles.excuseBox}>
            <View style={styles.negligenceHeader}><Ionicons name="list-outline" size={14} color={Theme.colors.accentGold} /><Text style={styles.negligenceTitleGold}>My Excuses</Text></View>
            {pastExcuses.length === 0 ? (
              <Text style={styles.excuseHint}>No excuses yet.</Text>
            ) : (
              <View style={styles.excuseInlineList}>
                {pastExcuses.slice(0, 3).map((e) => (
                  <View key={e.id} style={styles.excuseInlineItem}>
                    <Ionicons name="chatbubble-ellipses-outline" size={11} color={Theme.colors.textMuted} />
                    <Text style={styles.excuseInlineText} numberOfLines={1}>{e.reason}</Text>
                  </View>
                ))}
                {pastExcuses.length > 3 && <Text style={styles.excuseMore}>+{pastExcuses.length - 3} more</Text>}
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionHeader}>TODAY'S 6 PHASES</Text>

        <PhaseCard
          phaseNumber={1}
          title="Yesterday's Repetition (5x)"
          subtitle={yesterdayItem ? `Recite ${yesterdayItem.surahName} (Face ${yesterdayItem.faceNumber}) 5x` : "No yesterday portion for Day 1"}
          iconName="repeat-outline"
          isCompleted={progress.phaseYesterday === 1}
          onToggleComplete={() => togglePhase('phaseYesterday')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Portion to Recite 5 Times:</Text>
            {yesterdayItem ? (
              <>
                <Text style={styles.detailValue}>{yesterdayItem.surahName} — Face {yesterdayItem.faceNumber.replace('h1', '(1st Half)').replace('h2', '(2nd Half)')}</Text>
                <Text style={styles.detailInstruction}>Clear your mind and recite yesterday's memorized face 5 times from memory without looking at the Mus-haf.</Text>
              </>
            ) : (
              <Text style={styles.detailRestText}>Day 1 is your very first day! There is no yesterday portion to repeat yet. You can check this phase off and begin Phase 2.</Text>
            )}
          </View>
        </PhaseCard>

        <PhaseCard
          phaseNumber={2}
          title="Listening (3 Times)"
          subtitle="Listen to your reciter & follow Hilali-Khan translation"
          iconName="headset-outline"
          isCompleted={progress.phaseListening === 1}
          onToggleComplete={() => togglePhase('phaseListening')}
        >
          <AudioPlayerComponent
            surahName={scheduleItem.surahName}
            faceNumber={scheduleItem.faceNumber}
            onCompleted3Times={() => { if (progress.phaseListening === 0) togglePhase('phaseListening'); }}
          />
        </PhaseCard>

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

        <PhaseCard
          phaseNumber={4}
          title="Voice Recording (3 Times)"
          subtitle="Record yourself reciting from memory and self-correct"
          iconName="mic-outline"
          isCompleted={progress.phaseRecording === 1}
          onToggleComplete={() => togglePhase('phaseRecording')}
        >
          <VoiceRecorderComponent onCompleted3Times={() => { if (progress.phaseRecording === 0) togglePhase('phaseRecording'); }} />
        </PhaseCard>

        <PhaseCard
          phaseNumber={5}
          title="30-Day Connection (Rabt)"
          subtitle={hasConnection ? `Recite Pages ${formatRangeText(scheduleItem.connectionRange)}` : "No connection portion for today"}
          iconName="link-outline"
          isCompleted={progress.phaseConnection === 1}
          onToggleComplete={() => togglePhase('phaseConnection')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Pages to Recite (Previous 30 Days):</Text>
            {hasConnection ? (
              <>
                <Text style={styles.detailValue}>Pages {formatRangeText(scheduleItem.connectionRange)}</Text>
                <Text style={styles.detailInstruction}>Recite this entire 30-day perfected window once from memory without looking at the Mus-haf.</Text>
              </>
            ) : (
              <Text style={styles.detailRestText}>Connection begins on Day 3 once you have completed your first 2 pages. For today, no connection portion is due!</Text>
            )}
          </View>
        </PhaseCard>

        <PhaseCard
          phaseNumber={6}
          title="Old Memorization Revision"
          subtitle={hasRevision ? `Tour #${scheduleItem.tourNumber} • Pages ${formatRangeText(scheduleItem.revisionRange)}` : "No old revision portion yet"}
          iconName="refresh-outline"
          isCompleted={progress.phaseRevision === 1}
          onToggleComplete={() => togglePhase('phaseRevision')}
        >
          <View style={styles.cardDetailBox}>
            <Text style={styles.detailTitle}>Assigned 6-Day Circuit Slice:</Text>
            {hasRevision ? (
              <>
                <View style={styles.tourPillRow}>
                  <View style={styles.tourPill}><Text style={styles.tourPillText}>Tour #{scheduleItem.tourNumber}</Text></View>
                </View>
                <Text style={styles.detailValue}>Pages {formatRangeText(scheduleItem.revisionRange)}</Text>
                <Text style={styles.detailInstruction}>Recite this assigned slice from memory without looking at the Mus-haf. You will complete your entire old memorization every 6 days.</Text>
              </>
            ) : (
              <Text style={styles.detailRestText}>Revision circuits begin on Tour 1 (Day 33) after your first 30 days of memorization have graduated from the connection window.</Text>
            )}
          </View>
        </PhaseCard>

        {isUstadDay ? (
          <View style={styles.ustadTodayCard}>
            <View style={styles.ustadTodayHeader}>
              <Ionicons name="book-outline" size={18} color={Theme.colors.accentGold} />
              <Text style={styles.ustadTodayTitle}>Today: recite to your Ustad</Text>
            </View>
            <View style={styles.ustadTodayFaceBox}>
              <Text style={styles.ustadTodayLabel}>Previous memorized face</Text>
              <Text style={styles.ustadTodayFace}>{yesterdayItem?.faceNumber} — {yesterdayItem?.surahName} {yesterdayItem?.faceNumber.includes('h') ? '' : '(full page)'}</Text>
              <Text style={styles.ustadTodayHint}>Recite the previous face at class time to give yourself more revision time. Mark attendance after reciting.</Text>
            </View>
            <TouchableOpacity
              style={[styles.attendanceBtn, ustadAttended && styles.attendanceBtnDone]}
              onPress={handleMarkUstadAttendance}
              disabled={!yesterdayItem}
              activeOpacity={0.8}
            >
              <Ionicons name={ustadAttended ? 'checkmark-circle' : 'checkbox-outline'} size={18} color={ustadAttended ? Theme.colors.bgDark : Theme.colors.accentGold} />
              <Text style={[styles.attendanceBtnText, ustadAttended && styles.attendanceBtnTextDone]}>
                {ustadAttended ? 'Attendance recorded • tap to undo' : 'I recited the previous face to my ustad'}
              </Text>
            </TouchableOpacity>
            <View style={styles.ustadSessionRow}>
              <Ionicons name="stats-chart-outline" size={14} color={Theme.colors.textMuted} />
              <Text style={styles.ustadSessionText}>{ustadSessionCount} session{ustadSessionCount === 1 ? '' : 's'} recited so far</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]} onPress={handleConfirmToday} disabled={!canConfirm} activeOpacity={0.9}>
          <Ionicons name={canConfirm ? "checkmark-circle" : "lock-closed-outline"} size={20} color={canConfirm ? Theme.colors.bgDark : Theme.colors.textMuted} />
          <Text style={[styles.confirmBtnText, !canConfirm && styles.confirmBtnTextDisabled]}>Confirm today's Completion</Text>
        </TouchableOpacity>
        {!canConfirm && (
          <Text style={styles.confirmHint}>
            {isUstadDay && !ustadAttended && allPhasesDone
              ? 'Mark your ustad attendance above to enable confirmation.'
              : 'Complete all 6 phases to enable confirmation.'}
          </Text>
        )}

      </ScrollView>

      <Modal visible={showExcusePrompt} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.excuseOverlay}>
          <View style={styles.excuseCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            <Text style={styles.excuseTitle}>Missed Day Detected</Text>
            <Text style={styles.excuseSub}>You moved to {currentDateStr} without confirming Day {pendingExcuse?.dayNumber} on {pendingExcuse?.date}. What was the reason?</Text>
            <TextInput style={styles.excuseInputLarge} value={excuseInput} onChangeText={setExcuseInput} placeholder="Write reason, e.g., illness, travel..." placeholderTextColor={Theme.colors.textMuted} multiline numberOfLines={3} />
            <View style={styles.excuseActions}>
              <TouchableOpacity style={styles.excuseNoBtn} onPress={handleNoReason}><Text style={styles.excuseNoText}>No reason</Text></TouchableOpacity>
              <TouchableOpacity style={styles.excuseYesBtn} onPress={handleSubmitExcuse}><Text style={styles.excuseYesText}>Submit Excuse</Text></TouchableOpacity>
            </View>
            <Text style={styles.excuseHint}>With a valid reason, negligence stays {negligenceCount}. With no reason, it becomes {negligenceCount + 1}.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.bgDark },
  loadingContainer: { flex: 1, backgroundColor: Theme.colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Theme.spacing.md, paddingBottom: 100 },
  sectionHeader: { color: Theme.colors.accentGold, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: Theme.spacing.sm, marginTop: Theme.spacing.xs },
  cardDetailBox: { backgroundColor: 'rgba(10, 22, 40, 0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginTop: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  detailTitle: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: Theme.colors.accentGold, fontSize: 15, fontWeight: '700', marginVertical: 4 },
  detailInstruction: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  detailRestText: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4, fontStyle: 'italic' },
  tourPillRow: { flexDirection: 'row', marginTop: 4, marginBottom: 2 },
  tourPill: { backgroundColor: Theme.colors.accentGoldMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Theme.borderRadius.sm, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  tourPillText: { color: Theme.colors.accentGold, fontSize: 11, fontWeight: '700' },
  ustadTodayCard: { backgroundColor: Theme.colors.bgCard, borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, marginBottom: Theme.spacing.md },
  ustadTodayHeader: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  ustadTodayTitle: { color: Theme.colors.accentGold, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  ustadTodayTeacher: { color: Theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  ustadTodayTiming: { color: Theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  ustadTodayFaceBox: { backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginTop: Theme.spacing.sm },
  ustadTodayLabel: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  ustadTodayFace: { color: Theme.colors.accentGold, fontSize: 15, fontWeight: '800', marginTop: 4 },
  ustadTodayHint: { color: Theme.colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  ustadSessionRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: Theme.spacing.sm },
  ustadSessionText: { color: Theme.colors.textMuted, fontSize: 11, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.bgCard, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  dateText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  dot: { color: Theme.colors.textMuted, fontSize: 12 },
  dayBadgeSmall: { marginLeft: 'auto', backgroundColor: Theme.colors.accentGoldMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  dayBadgeSmallText: { color: Theme.colors.accentGold, fontSize: 11, fontWeight: '800' },
  negligenceRow: { flexDirection: 'row', gap: 8, marginBottom: Theme.spacing.md },
  negligenceBox: { flex: 0.75, backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', alignItems: 'center', justifyContent: 'center' },
  negligenceHeader: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  negligenceTitle: { color: '#EF4444', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  negligenceTitleGold: { color: Theme.colors.accentGold, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  negligenceCount: { color: '#EF4444', fontSize: 22, fontWeight: '900', marginTop: 2 },
  negligenceSub: { color: Theme.colors.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 2 },
  excuseBox: { flex: 1.3, backgroundColor: Theme.colors.bgCard, borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  excuseHint: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 6, textAlign: 'center' },
  excuseInlineList: { marginTop: 6, gap: 4 },
  excuseInlineItem: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: Theme.colors.border },
  excuseInlineText: { flex: 1, color: Theme.colors.textSecondary, fontSize: 11 },
  excuseMore: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  attendanceBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212,168,67,0.1)', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, paddingVertical: 12, borderRadius: Theme.borderRadius.md, marginTop: Theme.spacing.md },
  attendanceBtnDone: { backgroundColor: Theme.colors.successGreen, borderColor: Theme.colors.successGreen },
  attendanceBtnText: { color: Theme.colors.accentGold, fontSize: 13, fontWeight: '800' },
  attendanceBtnTextDone: { color: Theme.colors.bgDark },
  confirmBtn: { flexDirection: 'row', gap: 8, backgroundColor: Theme.colors.accentGold, paddingVertical: 16, borderRadius: Theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Theme.spacing.md },
  confirmBtnDisabled: { backgroundColor: Theme.colors.bgCard, borderWidth: 1, borderColor: Theme.colors.border },
  confirmBtnText: { color: Theme.colors.bgDark, fontSize: 15, fontWeight: '900' },
  confirmBtnTextDisabled: { color: Theme.colors.textMuted },
  confirmHint: { color: Theme.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 6 },
  celebrationIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.colors.accentGoldMuted, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  celebrationConfetti: { fontSize: 44, marginBottom: 4 },
  celebrationBigTick: { width: 84, height: 84, borderRadius: 42, backgroundColor: Theme.colors.successGreen, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.md, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  celebrationTitle: { color: Theme.colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  celebrationSubtitle: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  celebrationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.accentGold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: Theme.spacing.md },
  celebrationBadgeText: { color: Theme.colors.bgDark, fontSize: 12, fontWeight: '800' },
  celebrationHint: { color: Theme.colors.textMuted, fontSize: 11, marginTop: 10, textAlign: 'center' },
  celebrationScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xl },
  celebrationUnlockBox: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: Theme.spacing.lg },
  celebrationUnlockText: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  excuseOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  excuseCard: { width: '100%', maxWidth: 380, backgroundColor: Theme.colors.bgCard, borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.lg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  excuseTitle: { color: Theme.colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 8 },
  excuseSub: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  excuseInputLarge: { width: '100%', backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, color: Theme.colors.textPrimary, fontSize: 13, borderWidth: 1, borderColor: Theme.colors.border, minHeight: 80, textAlignVertical: 'top', marginTop: Theme.spacing.md },
  excuseActions: { flexDirection: 'row', gap: 8, marginTop: Theme.spacing.md, width: '100%' },
  excuseNoBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingVertical: 12, borderRadius: Theme.borderRadius.md, alignItems: 'center' },
  excuseNoText: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
  excuseYesBtn: { flex: 1, backgroundColor: Theme.colors.accentGold, paddingVertical: 12, borderRadius: Theme.borderRadius.md, alignItems: 'center' },
  excuseYesText: { color: Theme.colors.bgDark, fontSize: 13, fontWeight: '800' },
});
