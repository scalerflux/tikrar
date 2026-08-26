import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { DailyReminder } from '../../utils/reminders';

const CATEGORY_LABELS: Record<string, string> = {
  Verse: 'Quran',
  Hadith: 'Hadith',
  Companion: 'Companion',
  Salaf: 'Salaf',
  Tip: "Today's reminder",
};

export function DailyReminderCard({ reminder }: { reminder: DailyReminder | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!reminder) return null;

  const label = CATEGORY_LABELS[reminder.category] ?? 'Reminder';
  const isLong = reminder.text.length > 220;
  const toggle = () => setExpanded((v) => !v);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isLong ? 0.85 : 1}
      onPress={isLong ? toggle : undefined}
      disabled={!isLong}
    >
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" size={13} color={Theme.colors.accentGold} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.text} numberOfLines={expanded ? undefined : 5}>
        {reminder.text}
      </Text>
      {reminder.source ? <Text style={styles.source}>[{reminder.source}]</Text> : null}
      {isLong && (
        <Text style={styles.more}>{expanded ? 'Show less' : 'Read more'}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
    marginBottom: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  // title removed to avoid duplicate "reminder" word
  label: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  text: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  source: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: Theme.spacing.xs,
    fontStyle: 'italic',
  },
  more: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: Theme.spacing.xs,
  },
});
