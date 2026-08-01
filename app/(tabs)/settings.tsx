import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { getUserSetting, setUserSetting } from '../../database/db';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [startDate, setStartDate] = useState('');
  const [reciter, setReciter] = useState('Sheikh Nāṣir Al-Qaṭānī');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedDate = await getUserSetting('startDate', new Date().toISOString().split('T')[0]);
    setStartDate(savedDate.split('T')[0]);
  };

  const handleSaveDate = async () => {
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }
    await setUserSetting('startDate', new Date(startDate).toISOString());
    Alert.alert('Settings Saved', `Your program start date has been updated to ${startDate}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>

        {/* Start Date Setting */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Program Start Date</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Your 1,206-day schedule is automatically calculated from this date.
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
        </View>

        {/* Audio Reciter Setting */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={20} color={Theme.colors.accentGold} />
            <Text style={styles.sectionTitle}>Default Reciter</Text>
          </View>

          <View style={styles.reciterBox}>
            <Text style={styles.reciterName}>{reciter}</Text>
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.accentGold} />
          </View>
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
      </ScrollView>
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
  reciterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 22, 40, 0.6)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    marginTop: Theme.spacing.xs,
  },
  reciterName: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
});
