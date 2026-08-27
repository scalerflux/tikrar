import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';
import { getUserSetting, setUserSetting } from '../../database/db';
import { isValidLocalDateString, localDateString } from '../../utils/schedule-calculator';
import { NotificationService } from '../../services/notification-service';
import { RECITERS, ReciterId, AudioService } from '../../services/audio-service';
import { BackupService } from '../../services/backup-service';
import { getUstadSessionDays } from '../../services/ustad-session-service';
import { CalendarService } from '../../services/calendar-service';
import { Toast } from '../../components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', offset: 4.5 }, { code: 'AL', name: 'Albania', offset: 1 }, { code: 'DZ', name: 'Algeria', offset: 1 }, { code: 'AR', name: 'Argentina', offset: -3 }, { code: 'AU', name: 'Australia', offset: 10 }, { code: 'AT', name: 'Austria', offset: 1 }, { code: 'AZ', name: 'Azerbaijan', offset: 4 }, { code: 'BH', name: 'Bahrain', offset: 3 }, { code: 'BD', name: 'Bangladesh', offset: 6 }, { code: 'BY', name: 'Belarus', offset: 3 }, { code: 'BE', name: 'Belgium', offset: 1 }, { code: 'BO', name: 'Bolivia', offset: -4 }, { code: 'BA', name: 'Bosnia', offset: 1 }, { code: 'BR', name: 'Brazil', offset: -3 }, { code: 'BN', name: 'Brunei', offset: 8 }, { code: 'BG', name: 'Bulgaria', offset: 2 }, { code: 'KH', name: 'Cambodia', offset: 7 }, { code: 'CM', name: 'Cameroon', offset: 1 }, { code: 'CA', name: 'Canada', offset: -5 }, { code: 'CL', name: 'Chile', offset: -4 }, { code: 'CN', name: 'China', offset: 8 }, { code: 'CO', name: 'Colombia', offset: -5 }, { code: 'CR', name: 'Costa Rica', offset: -6 }, { code: 'HR', name: 'Croatia', offset: 1 }, { code: 'CU', name: 'Cuba', offset: -5 }, { code: 'CY', name: 'Cyprus', offset: 2 }, { code: 'CZ', name: 'Czech Republic', offset: 1 }, { code: 'DK', name: 'Denmark', offset: 1 }, { code: 'EC', name: 'Ecuador', offset: -5 }, { code: 'EG', name: 'Egypt', offset: 2 }, { code: 'EE', name: 'Estonia', offset: 2 }, { code: 'ET', name: 'Ethiopia', offset: 3 }, { code: 'FI', name: 'Finland', offset: 2 }, { code: 'FR', name: 'France', offset: 1 }, { code: 'GE', name: 'Georgia', offset: 4 }, { code: 'DE', name: 'Germany', offset: 1 }, { code: 'GH', name: 'Ghana', offset: 0 }, { code: 'GR', name: 'Greece', offset: 2 }, { code: 'GT', name: 'Guatemala', offset: -6 }, { code: 'HU', name: 'Hungary', offset: 1 }, { code: 'IS', name: 'Iceland', offset: 0 }, { code: 'IN', name: 'India', offset: 5.5 }, { code: 'ID', name: 'Indonesia (WIB)', offset: 7 }, { code: 'IR', name: 'Iran', offset: 3.5 }, { code: 'IQ', name: 'Iraq', offset: 3 }, { code: 'IE', name: 'Ireland', offset: 0 }, { code: 'IL', name: 'Israel', offset: 2 }, { code: 'IT', name: 'Italy', offset: 1 }, { code: 'JP', name: 'Japan', offset: 9 }, { code: 'JO', name: 'Jordan', offset: 3 }, { code: 'KZ', name: 'Kazakhstan', offset: 5 }, { code: 'KE', name: 'Kenya', offset: 3 }, { code: 'KW', name: 'Kuwait', offset: 3 }, { code: 'KG', name: 'Kyrgyzstan', offset: 6 }, { code: 'LA', name: 'Laos', offset: 7 }, { code: 'LV', name: 'Latvia', offset: 2 }, { code: 'LB', name: 'Lebanon', offset: 2 }, { code: 'LY', name: 'Libya', offset: 2 }, { code: 'LT', name: 'Lithuania', offset: 2 }, { code: 'LU', name: 'Luxembourg', offset: 1 }, { code: 'MY', name: 'Malaysia', offset: 8 }, { code: 'MV', name: 'Maldives', offset: 5 }, { code: 'MT', name: 'Malta', offset: 1 }, { code: 'MA', name: 'Morocco', offset: 1 }, { code: 'MM', name: 'Myanmar', offset: 6.5 }, { code: 'NP', name: 'Nepal', offset: 5.75 }, { code: 'NL', name: 'Netherlands', offset: 1 }, { code: 'NZ', name: 'New Zealand', offset: 12 }, { code: 'NG', name: 'Nigeria', offset: 1 }, { code: 'NO', name: 'Norway', offset: 1 }, { code: 'OM', name: 'Oman', offset: 4 }, { code: 'PK', name: 'Pakistan', offset: 5 }, { code: 'PS', name: 'Palestine', offset: 2 }, { code: 'PA', name: 'Panama', offset: -5 }, { code: 'PY', name: 'Paraguay', offset: -4 }, { code: 'PE', name: 'Peru', offset: -5 }, { code: 'PH', name: 'Philippines', offset: 8 }, { code: 'PL', name: 'Poland', offset: 1 }, { code: 'PT', name: 'Portugal', offset: 0 }, { code: 'QA', name: 'Qatar', offset: 3 }, { code: 'RO', name: 'Romania', offset: 2 }, { code: 'RU', name: 'Russia', offset: 3 }, { code: 'SA', name: 'Saudi Arabia', offset: 3 }, { code: 'SN', name: 'Senegal', offset: 0 }, { code: 'RS', name: 'Serbia', offset: 1 }, { code: 'SG', name: 'Singapore', offset: 8 }, { code: 'SK', name: 'Slovakia', offset: 1 }, { code: 'SI', name: 'Slovenia', offset: 1 }, { code: 'SO', name: 'Somalia', offset: 3 }, { code: 'ZA', name: 'South Africa', offset: 2 }, { code: 'ES', name: 'Spain', offset: 1 }, { code: 'LK', name: 'Sri Lanka', offset: 5.5 }, { code: 'SD', name: 'Sudan', offset: 2 }, { code: 'SE', name: 'Sweden', offset: 1 }, { code: 'CH', name: 'Switzerland', offset: 1 }, { code: 'SY', name: 'Syria', offset: 3 }, { code: 'TW', name: 'Taiwan', offset: 8 }, { code: 'TJ', name: 'Tajikistan', offset: 5 }, { code: 'TZ', name: 'Tanzania', offset: 3 }, { code: 'TH', name: 'Thailand', offset: 7 }, { code: 'TN', name: 'Tunisia', offset: 1 }, { code: 'TR', name: 'Turkey', offset: 3 }, { code: 'TM', name: 'Turkmenistan', offset: 5 }, { code: 'UG', name: 'Uganda', offset: 3 }, { code: 'UA', name: 'Ukraine', offset: 2 }, { code: 'AE', name: 'UAE', offset: 4 }, { code: 'GB', name: 'United Kingdom', offset: 0 }, { code: 'US', name: 'USA', offset: -5 }, { code: 'UY', name: 'Uruguay', offset: -3 }, { code: 'UZ', name: 'Uzbekistan', offset: 5 }, { code: 'VE', name: 'Venezuela', offset: -4 }, { code: 'VN', name: 'Vietnam', offset: 7 }, { code: 'YE', name: 'Yemen', offset: 3 }, { code: 'ZM', name: 'Zambia', offset: 2 }, { code: 'ZW', name: 'Zimbabwe', offset: 2 },
];

function isValidClock(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [fajrTime, setFajrTime] = useState('05:00');
  const [reciterId, setReciterId] = useState<ReciterId>('qahtani');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState('06:00');
  const [importText, setImportText] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [ustadMode, setUstadMode] = useState<'custom' | 'none'>('none');
  const [customName, setCustomName] = useState('');
  const [customTiming, setCustomTiming] = useState('');
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);
  const [customHour, setCustomHour] = useState('5');
  const [customMinute, setCustomMinute] = useState('00');
  const [customAmPm, setCustomAmPm] = useState<'am' | 'pm'>('pm');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [countryCode, setCountryCode] = useState('SA');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [sessionNotifEnabled, setSessionNotifEnabled] = useState(false);
  const [sessionNotifTime, setSessionNotifTime] = useState('');
  const [playingReciter, setPlayingReciter] = useState<ReciterId | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const hideToast = useCallback(() => setToastMessage(''), []);

  React.useEffect(() => {
    return () => {
      AudioService.stopAudio();
    };
  }, []);

  const previewReciter = async (id: ReciterId) => {
    if (playingReciter === id) {
      await AudioService.stopAudio();
      setPlayingReciter(null);
      return;
    }
    setPlayingReciter(id);
    const url = AudioService.getAyahAudioUrl(1, 1, id);
    const player = await AudioService.playAudio(url, (status) => {
      if (status.playCount > 0) {
        setPlayingReciter((current) => current === id ? null : current);
      }
    });
    if (!player) setPlayingReciter(null);
  };

  const loadSettings = async () => {
    const savedDate = await getUserSetting('startDate', localDateString());
    setStartDate(savedDate.split('T')[0]);
    setFajrTime(await getUserSetting('fajrTime', '05:00'));

    const savedReciterRaw = await getUserSetting('reciter', 'qahtani');
    const savedReciter = savedReciterRaw === 'qatami' ? 'qahtani' : savedReciterRaw;
    if (savedReciter in RECITERS) setReciterId(savedReciter as ReciterId);

    const savedModeRaw = await getUserSetting('ustadMode', 'none');
    // Markaz Al Fawaid option was removed. Map any legacy markaz selection to none.
    setUstadMode(savedModeRaw === 'custom' ? 'custom' : 'none');
    const savedTeacher = await getUserSetting('ustadTeacher', '');
    const savedTiming = await getUserSetting('ustadTiming', '');
    const savedCountry = await getUserSetting('countryCode', 'SA');
    if (COUNTRIES.some((c) => c.code === savedCountry)) setCountryCode(savedCountry);
    try {
      const rawDays = await getUserSetting('ustadCustomWeekdays', '[]');
      const parsedDays = JSON.parse(rawDays) as unknown;
      setCustomWeekdays(Array.isArray(parsedDays)
        ? parsedDays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)
        : []);
      const cal = await getUserSetting('addToCalendar', 'false');
      setAddToCalendar(cal === 'true');
    } catch {
      setCustomWeekdays([]);
      setAddToCalendar(false);
    }
    if (savedModeRaw === 'custom') {
      setCustomName(savedTeacher);
      setCustomTiming(savedTiming);
      const parsed = parseTimeToMinutes(savedTiming);
      if (parsed !== null) {
        const h24 = Math.floor(parsed / 60);
        const m = parsed % 60;
        const ap: 'am' | 'pm' = h24 >= 12 ? 'pm' : 'am';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        setCustomHour(String(h12));
        const minuteStr = String(m).padStart(2, '0');
        setCustomMinute(['00', '15', '30', '45'].includes(minuteStr) ? minuteStr : '00');
        setCustomAmPm(ap);
      }
    } else {
      setCustomName('');
      setCustomTiming('');
    }

    const notifSettings = await NotificationService.getNotificationSettings();
    setNotifEnabled(notifSettings.enabled);
    setNotifTime(notifSettings.time);

    const sessionNotif = await NotificationService.getSessionReminderSettings();
    setSessionNotifEnabled(sessionNotif.enabled);
    setSessionNotifTime(sessionNotif.time);

    const resynced = await NotificationService.resyncSessionReminderIfTimezoneChanged();
    if (resynced) {
      const updated = await NotificationService.getSessionReminderSettings();
      setSessionNotifTime(updated.time);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleSelectReciter = async (id: ReciterId) => {
    setReciterId(id);
    await setUserSetting('reciter', id);
  };

  const handleRemoveUstad = async () => {
    Alert.alert('Remove Ustad', 'This removes your teacher, session days, timing, session reminders and calendar events. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await NotificationService.cancelSessionReminder();
          await CalendarService.removeUstadSessions();
          await setUserSetting('ustadMode', 'none');
          await setUserSetting('ustadTeacher', '');
          await setUserSetting('ustadTiming', '');
          await setUserSetting('ustadCustomWeekdays', '[]');
          await setUserSetting('addToCalendar', 'false');
          setUstadMode('none');
          setCustomName('');
          setCustomTiming('');
          setCustomWeekdays([]);
          setCustomHour('5');
          setCustomMinute('00');
          setCustomAmPm('pm');
          setAddToCalendar(false);
          setSessionNotifEnabled(false);
          setSessionNotifTime('');
          setToastMessage('Ustad removed');
        },
      },
    ]);
  };

  const handleSelectCountry = async (code: string) => {
    setCountryCode(code);
    await setUserSetting('countryCode', code);
    const cc = COUNTRIES.find((c) => c.code === code);
    if (cc) await setUserSetting('countryName', cc.name);
    if (sessionNotifEnabled) {
      const timing = customTiming.trim();
      const teacher = customName.trim();
      if (timing) {
        await NotificationService.scheduleSessionReminder(timing, getUstadSessionDays(teacher, customWeekdays));
      }
    }
  };

  const handleSaveCustomUstad = async () => {
    if (!customName.trim()) {
      Alert.alert('Missing', 'Enter teacher name');
      return;
    }
    if (customWeekdays.length === 0) {
      Alert.alert('Pick days', 'Select at least one weekday for your sessions.');
      return;
    }
    const composedTiming = `${customHour}:${customMinute} ${customAmPm}`;
    setUstadMode('custom');
    await setUserSetting('ustadMode', 'custom');
    await setUserSetting('ustadTeacher', customName.trim());
    await setUserSetting('ustadTiming', composedTiming);
    await setUserSetting('ustadCustomWeekdays', JSON.stringify(customWeekdays));
    await setUserSetting('addToCalendar', String(addToCalendar));
    setCustomTiming(composedTiming);
    const existing = await getUserSetting('ustadSetDate', '');
    if (!existing) await setUserSetting('ustadSetDate', localDateString());
    if (sessionNotifEnabled) {
      const ok = await NotificationService.scheduleSessionReminder(composedTiming, customWeekdays);
      if (ok) {
        const s = await NotificationService.getSessionReminderSettings();
        setSessionNotifTime(s.time);
      }
    }
    let calendarNote = '';
    if (addToCalendar) {
      const calRes = await CalendarService.syncUstadSessions({
        teacherName: customName.trim(),
        time12h: composedTiming,
        weekdays: customWeekdays,
      });
      calendarNote = calRes.ok
        ? ` • ${calRes.created} session${calRes.created === 1 ? '' : 's'} added to your calendar`
        : ' • Calendar needs permission, allow it when prompted';
    } else {
      await CalendarService.removeUstadSessions();
    }
    setToastMessage(`Ustad saved • ${composedTiming} • ${customWeekdays.map((d) => WEEKDAY_LABELS[d]).join(', ')}${calendarNote}`);
  };

  const handleToggleSessionReminder = async (value: boolean) => {
    const timing = customTiming.trim();
    if (value && !timing) {
      Alert.alert('No timing', 'Set your ustad timing first, then enable the reminder.');
      setSessionNotifEnabled(false);
      return;
    }
    if (value && ustadMode === 'custom' && customWeekdays.length === 0) {
      Alert.alert('Pick days', 'Select the weekdays you meet your teacher on.');
      setSessionNotifEnabled(false);
      return;
    }
    setSessionNotifEnabled(value);
    if (value) {
      const ok = await NotificationService.scheduleSessionReminder(timing, getUstadSessionDays(customName.trim(), customWeekdays));
      if (ok) {
        const s = await NotificationService.getSessionReminderSettings();
        setSessionNotifTime(s.time);
        Alert.alert('Reminder Set', `You will be notified 15 minutes before each session (${s.time} local).`);
      } else {
        setSessionNotifEnabled(false);
        Alert.alert('Permission Required', 'Enable notifications in device settings to receive session reminders.');
      }
    } else {
      await NotificationService.cancelSessionReminder();
      setSessionNotifTime('');
      Alert.alert('Reminder Off', 'Session reminders have been turned off.');
    }
  };

  const handleSaveDate = async () => {
    if (!isValidLocalDateString(startDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }
    await setUserSetting('startDate', startDate);
    Alert.alert('Settings Saved', `Your program start date has been updated to ${startDate}.`);
  };

  const handleSaveFajrTime = async () => {
    if (!isValidClock(fajrTime)) {
      Alert.alert('Invalid time', 'Use 24-hour HH:MM format, for example 05:00.');
      return;
    }
    await setUserSetting('fajrTime', fajrTime);
    Alert.alert('Settings Saved', `Fajr window starts at ${fajrTime}.`);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    if (value) {
      const [h, m] = notifTime.split(':').map(Number);
      const success = await NotificationService.scheduleDailyReminder(h || 6, m || 0);
      if (success) {
        Alert.alert('Reminder Set', `Daily Tikrar reminder scheduled for ${notifTime}.`);
      } else {
        setNotifEnabled(false);
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily Tikrar reminders.'
        );
      }
    } else {
      await NotificationService.cancelDailyReminder();
      Alert.alert('Reminder Disabled', 'Daily Tikrar notifications have been turned off.');
    }
  };

  const handleSelectPresetTime = async (timeStr: string) => {
    setNotifTime(timeStr);
    if (notifEnabled) {
      const [h, m] = timeStr.split(':').map(Number);
      await NotificationService.scheduleDailyReminder(h, m);
      Alert.alert('Time Updated', `Daily reminder time changed to ${timeStr}.`);
    }
  };

  const handleTestNotification = async () => {
    const sent = await NotificationService.sendTestNotification();
    if (sent) {
      Alert.alert('Test Sent', 'A test reminder has been sent to your device!');
    } else {
      Alert.alert('Notice', 'Notification permissions are needed to test notifications.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await BackupService.exportData();
      const parsed = JSON.parse(json);
      const count = parsed.progress?.length ?? 0;
      setBackupStatus(`Exported ${count} days`);
      Alert.alert(
        'Backup Exported',
        `${count} completed days exported. On device you can Share the file. Copied length ${json.length} chars.`,
        [
          {
            text: 'Share File',
            onPress: async () => {
              try {
                await BackupService.shareExport();
              } catch (e: any) {
                Alert.alert('Share Info', e?.message || 'Sharing not available, copy JSON from debug');
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Unknown error');
    }
  };

  const handleImportBackup = async () => {
    if (!importText.trim()) {
      Alert.alert('Import', 'Paste backup JSON first');
      return;
    }
    Alert.alert('Import Backup', 'This will merge progress from the JSON into your device. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        onPress: async () => {
          try {
            const result = await BackupService.importData(importText.trim());
            setBackupStatus(`Imported ${result.imported} days`);
            Alert.alert('Import Complete', `Imported ${result.imported} days and ${result.settings} settings. Restart app to see updated progress.`);
            setImportText('');
          } catch (e: any) {
            Alert.alert('Import Failed', e?.message || 'Invalid JSON');
          }
        },
      },
    ]);
  };

  const handleClearData = async () => {
    Alert.alert('Clear All Data', 'Delete all progress and settings? This cannot be undone. Export first if needed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await BackupService.clearAllData();
          setBackupStatus('All data cleared');
          Alert.alert('Cleared', 'All progress has been deleted. App will restart on next tab focus.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>

        {/* Daily Notifications Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Daily Memorization Reminders</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Get a gentle daily reminder to complete your 6 Tikrar phases.
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Daily Reminder</Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.accentGold }}
              thumbColor={notifEnabled ? '#FFF' : '#888'}
            />
          </View>

          {notifEnabled && (
            <View style={styles.timeSelectContainer}>
              <Text style={styles.timeSelectLabel}>Select Reminder Time:</Text>
              <View style={styles.timePresetsRow}>
                {[
                  { label: 'Fajr (05:30)', time: '05:30' },
                  { label: 'Morning (08:00)', time: '08:00' },
                  { label: 'Evening (18:00)', time: '18:00' },
                  { label: 'Night (21:00)', time: '21:00' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.time}
                    style={[
                      styles.timePill,
                      notifTime === item.time && styles.activeTimePill,
                    ]}
                    onPress={() => handleSelectPresetTime(item.time)}
                  >
                    <Text
                      style={[
                        styles.timePillText,
                        notifTime === item.time && styles.activeTimePillText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
            <Ionicons name="paper-plane-outline" size={16} color={Theme.colors.accentGold} />
            <Text style={styles.testNotifBtnText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Start Date Setting */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Program Start Date</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Kept as a record of when your program began. Your next face is decided by what you have completed, not the calendar.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Theme.colors.textMuted}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDate}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>Fajr time for the daily Fajr-to-Fajr window.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.dateInput}
              value={fajrTime}
              onChangeText={setFajrTime}
              placeholder="HH:MM"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFajrTime}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ustad Setting */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>My Ustad</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Optional. Select a teacher. Country / Profile is stored for your profile, times are shown in your device local time.</Text>

          <Text style={[styles.sectionSubtitle, { marginBottom: 4, fontWeight: '700' as any }]}>Country / Profile</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCountryDropdown(!showCountryDropdown)} activeOpacity={0.7}>
            <Text style={styles.dropdownBtnText}>{COUNTRIES.find((c) => c.code === countryCode)?.name}</Text>
            <Ionicons name={showCountryDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          {showCountryDropdown && (
            <View style={styles.dropdownList}>
              <View style={styles.dropdownSearchRow}>
                <Ionicons name="search-outline" size={16} color={Theme.colors.textMuted} />
                <TextInput style={styles.dropdownSearchInput} value={countrySearch} onChangeText={setCountrySearch} placeholder="Search country..." placeholderTextColor={Theme.colors.textMuted} autoFocus />
              </View>
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                  <TouchableOpacity key={c.code} style={[styles.dropdownItem, countryCode === c.code && styles.dropdownItemActive]} onPress={() => { handleSelectCountry(c.code); setShowCountryDropdown(false); setCountrySearch(''); }}>
                    <Text style={[styles.dropdownItemText, countryCode === c.code && styles.dropdownItemTextActive]}>{c.name}</Text>
                    <Text style={styles.dropdownItemOffset}>UTC{c.offset >= 0 ? '+' : ''}{c.offset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={[styles.ustadCardEnhanced, ustadMode === 'custom' && styles.ustadCardActive]} onPress={() => setUstadMode('custom')} activeOpacity={0.7}>
            <View style={styles.cardIconBadge}><Ionicons name="person-add-outline" size={20} color={Theme.colors.accentGold} /></View>
            <View style={styles.ustadHeaderEnhanced}>
              <Text style={styles.ustadTitleEnhanced}>Add your Ustad</Text>
              {ustadMode === 'custom' && <Ionicons name="checkmark-circle" size={22} color={Theme.colors.accentGold} />}
            </View>
            <Text style={styles.ustadSubEnhanced}>Your personal teacher for recitation. Pick the session days, set the time, and optionally add them to your calendar.</Text>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="person-outline" size={13} color={Theme.colors.accentGold} />
              <Text style={styles.fieldLabel}>Teacher name</Text>
            </View>
            <TextInput style={styles.dateInput} value={customName} onChangeText={(v) => { setCustomName(v); setUstadMode('custom'); }} placeholder="e.g. Sheikh Ahmad" placeholderTextColor={Theme.colors.textMuted} />
            <View style={styles.fieldLabelRow}>
              <Ionicons name="calendar-number-outline" size={13} color={Theme.colors.accentGold} />
              <Text style={styles.fieldLabel}>Session days</Text>
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((lbl, idx) => {
                const selected = customWeekdays.includes(idx);
                return (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.weekdayChip, selected && styles.weekdayChipActive]}
                    onPress={() => {
                      setUstadMode('custom');
                      setCustomWeekdays((prev) => (prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort((a, b) => a - b)));
                    }}
                  >
                    <Text style={[styles.weekdayChipText, selected && styles.weekdayChipTextActive]}>{lbl}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="time-outline" size={13} color={Theme.colors.accentGold} />
              <Text style={styles.fieldLabel}>Start time</Text>
            </View>
            <View style={styles.pickerGroup}>
              <View style={styles.timePickerRow}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((h) => (
                  <TouchableOpacity key={h} style={[styles.timeChip, customHour === h && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomHour(h); }}>
                    <Text style={[styles.timeChipText, customHour === h && styles.timeChipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.timePickerRow}>
                {['00', '15', '30', '45'].map((m) => (
                  <TouchableOpacity key={m} style={[styles.timeChip, customMinute === m && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomMinute(m); }}>
                    <Text style={[styles.timeChipText, customMinute === m && styles.timeChipTextActive]}>:{m}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.timeAmPmGroup}>
                  {(['am', 'pm'] as const).map((ap) => (
                    <TouchableOpacity key={ap} style={[styles.timeChip, customAmPm === ap && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomAmPm(ap); }}>
                      <Text style={[styles.timeChipText, customAmPm === ap && styles.timeChipTextActive]}>{ap.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.summaryStrip}>
              <Ionicons name="sparkles-outline" size={14} color={Theme.colors.accentGold} />
              <Text style={styles.summaryText}>
                {customName.trim() || 'Your Ustad'} • {customHour}:{customMinute} {customAmPm} • {customWeekdays.length ? customWeekdays.map((d) => WEEKDAY_LABELS[d]).join(', ') : 'pick days'}
              </Text>
            </View>
            <View style={styles.calendarRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.calendarLabel}>Add sessions to calendar</Text>
                <Text style={styles.calendarHint}>Creates recurring weekly events so you never miss a session.</Text>
              </View>
              <Switch value={addToCalendar} onValueChange={setAddToCalendar} trackColor={{ false: Theme.colors.border, true: Theme.colors.accentGold }} thumbColor={addToCalendar ? '#FFF' : '#888'} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCustomUstad}><Text style={styles.saveBtnText}>Save Ustad</Text></TouchableOpacity>
          </TouchableOpacity>

          {ustadMode === 'custom' && (
            <TouchableOpacity style={styles.removeUstadBtn} onPress={handleRemoveUstad} activeOpacity={0.7}>
              <Ionicons name="person-remove-outline" size={16} color="#EF4444" />
              <Text style={styles.removeUstadBtnText}>Remove Ustad</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sessionNotifRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionNotifTitle}>Session Reminder</Text>
              <Text style={styles.sessionNotifSub}>
                {sessionNotifEnabled && sessionNotifTime
                  ? `On • Notifies 15 min before (${sessionNotifTime} local)`
                  : 'Notify me 15 minutes before the session time'}
              </Text>
            </View>
            <Switch
              value={sessionNotifEnabled}
              onValueChange={handleToggleSessionReminder}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.accentGold }}
              thumbColor={sessionNotifEnabled ? '#FFF' : '#888'}
            />
          </View>
        </View>

        {/* Audio Reciter Setting */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Default Reciter</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Level 1 first for tajwid and monotone foundation. Move up when you can recite similarly. Beauty of voice comes after correctness.</Text>
          <View style={styles.reciterList}>
            {[1, 2, 3, 4].map((lvl) => (
              <View key={lvl}>
                <Text style={styles.reciterLevelLabel}>Level {lvl} {lvl === 1 ? '• Tajwid foundation' : lvl === 2 ? '• Repetitive tone' : lvl === 3 ? '• Advanced uniqueness' : '• With meaning, hardest'}</Text>
                {(Object.values(RECITERS) as Array<{ id: ReciterId; name: string; level: number }>).filter((r) => r.level === lvl).map((r) => {
                  const selected = r.id === reciterId;
                  const isPlaying = playingReciter === r.id;
                  return (
                    <View key={r.id} style={[styles.reciterBox, selected && styles.reciterBoxSelected]}>
                      {/* One large touch target covers the name and the radio icon so
                          selection always registers, even with imprecise taps. The
                          play preview stays a separate sibling button. */}
                      <TouchableOpacity
                        style={styles.reciterSelectArea}
                        onPress={() => handleSelectReciter(r.id)}
                        activeOpacity={0.7}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.reciterName, selected && styles.reciterNameSelected]}>{r.name}</Text>
                        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? Theme.colors.accentGold : Theme.colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.reciterPlayBtn, isPlaying && styles.reciterPlayBtnActive]}
                        onPress={() => previewReciter(r.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? Theme.colors.bgDark : Theme.colors.accentGold} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Backup & Sync */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Backup & Sync</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Offline-first. Export your progress as JSON to keep a backup or move to another device. No login required. Optional cloud sync can be added later.</Text>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={18} color={Theme.colors.bgDark} />
            <Text style={styles.backupBtnText}>Export Backup (JSON)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backupBtn, styles.backupBtnSecondary]} onPress={handleImportBackup} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={18} color={Theme.colors.accentGold} />
            <Text style={styles.backupBtnSecondaryText}>Import Pasted JSON</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
            placeholder="Paste backup JSON here to import"
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            numberOfLines={4}
          />
          {backupStatus ? <Text style={styles.backupStatus}>{backupStatus}</Text> : null}
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearData} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.clearBtnText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* About Tikrar Program */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>About Tikrar</Text>
          </View>
          <Text style={styles.aboutText}>
            The Tikrar program is a systematic 1,206-day Quran memorization and perfection system originating from Madinah. It builds unshakable memorization through structured daily repetition, listening, recording, connection (rabt), and revision circuits.
          </Text>
        </View>

        {/* 20 Preconditions Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Keys to Success</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletText}>Sincerity (Ikhlas) for Allah alone.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletText}>Consistency without skipping Connection or Revision.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletText}>Never look at the Mus-haf during revision doubt.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>4.</Text>
            <Text style={styles.bulletText}>Complete revision of the full Quran every 6 days.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="refresh-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Onboarding</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Go through the introduction, reciter choice and setup again.</Text>
          <TouchableOpacity style={styles.backupBtn} onPress={() => router.push('/onboarding')} activeOpacity={0.7}>
            <Ionicons name="play-circle-outline" size={18} color={Theme.colors.bgDark} />
            <Text style={styles.backupBtnText}>Replay Onboarding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast message={toastMessage} visible={Boolean(toastMessage)} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
  },
  container: {
    padding: Theme.spacing.md,
    paddingBottom: 100,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: Theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.xs,
  },
  switchLabel: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  timeSelectContainer: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  timeSelectLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activeTimePill: {
    backgroundColor: Theme.colors.accentGoldMuted,
    borderColor: Theme.colors.accentGold,
  },
  timePillText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeTimePillText: {
    color: Theme.colors.accentGold,
    fontWeight: '700',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(212, 168, 67, 0.1)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  testNotifBtnText: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  saveBtn: {
    backgroundColor: Theme.colors.accentGold,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
  },
  saveBtnText: {
    color: Theme.colors.bgDark,
    fontSize: 14,
    fontWeight: '700',
  },
  reciterList: {
    gap: 12,
    marginTop: Theme.spacing.xs,
  },
  reciterLevelLabel: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  reciterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  reciterBoxSelected: {
    borderColor: Theme.colors.accentGoldBorder,
    backgroundColor: 'rgba(212,168,67,0.08)',
  },
  reciterName: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  reciterNameSelected: {
    color: Theme.colors.textPrimary,
  },
  reciterPlayBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212,168,67,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  reciterPlayBtnActive: { backgroundColor: Theme.colors.accentGoldMuted },
  sessionNotifRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginTop: 8 },
  sessionNotifTitle: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  sessionNotifSub: { color: Theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  countryPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border },
  countryPillActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  countryPillText: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  countryPillTextActive: { color: Theme.colors.accentGold },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(10,22,40,0.6)', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 12 },
  dropdownBtnText: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '600' },
  dropdownList: { backgroundColor: Theme.colors.bgCard, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md, marginTop: 6, overflow: 'hidden' },
  dropdownSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Theme.spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  dropdownSearchInput: { flex: 1, color: Theme.colors.textPrimary, fontSize: 13 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dropdownItemActive: { backgroundColor: Theme.colors.accentGoldMuted },
  dropdownItemText: { color: Theme.colors.textSecondary, fontSize: 13 },
  dropdownItemTextActive: { color: Theme.colors.accentGold, fontWeight: '700' },
  dropdownItemOffset: { color: Theme.colors.textMuted, fontSize: 11 },
  cardIconBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.accentGoldMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, marginBottom: 10 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Theme.spacing.md, marginBottom: 6 },
  fieldLabel: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '800' },
  pickerGroup: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  summaryStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 8, marginTop: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  summaryText: { flex: 1, color: Theme.colors.textPrimary, fontSize: 11, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekdayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  weekdayChipActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  weekdayChipText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  weekdayChipTextActive: { color: Theme.colors.accentGold },
  timePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  timeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  timeChipActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  timeChipText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  timeChipTextActive: { color: Theme.colors.accentGold },
  timeAmPmGroup: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.accentGold,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.sm,
  },
  backupBtnText: {
    color: Theme.colors.bgDark,
    fontSize: 14,
    fontWeight: '800',
  },
  backupBtnSecondary: {
    backgroundColor: 'rgba(212,168,67,0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  backupBtnSecondaryText: {
    color: Theme.colors.accentGold,
    fontSize: 14,
    fontWeight: '700',
  },
  importInput: {
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    color: Theme.colors.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: Theme.spacing.sm,
  },
  backupStatus: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Theme.spacing.sm,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  aboutText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: Theme.spacing.xs,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  bulletDot: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '700',
  },
  bulletText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  ustadCardActive: { borderColor: Theme.colors.accentGold, backgroundColor: 'rgba(212,168,67,0.08)' },
  ustadCardEnhanced: { backgroundColor: 'rgba(10,22,40,0.7)', borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.lg, borderWidth: 1.5, borderColor: Theme.colors.accentGoldBorder, marginTop: 12 },
  removeUstadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 10, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' },
  removeUstadBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  reciterSelectArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  ustadHeaderEnhanced: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 },
  ustadTitleEnhanced: { flex: 1, color: Theme.colors.textPrimary, fontSize: 16, fontWeight: '900' },
  ustadSubEnhanced: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  calendarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Theme.spacing.md, paddingTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  calendarLabel: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  calendarHint: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 2 },
});
