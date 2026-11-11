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
      {reminder.source ? <Text style={styles.source}>{reminder.source}</Text> : null}
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
    paddingVertical: Theme.spacing.md,
    paddingRight: Theme.spacing.md,
    paddingLeft: Theme.spacing.md + 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.accentGold,
    marginBottom: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  label: {
    color: Theme.colors.accentGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  text: {
    color: Theme.colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 23,
    fontStyle: 'italic',
  },
  source: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: Theme.spacing.sm,
  },
  more: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Theme.spacing.sm,
  },
});
