import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../constants/theme';

interface PhaseCardProps {
  phaseNumber: number;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isCompleted: boolean;
  onToggleComplete: () => void;
  children?: React.ReactNode;
  locked?: boolean;
  lockedHint?: string;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phaseNumber,
  title,
  subtitle,
  iconName,
  isCompleted,
  onToggleComplete,
  children,
  locked = false,
  lockedHint,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setIsReduceMotionEnabled(enabled);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduceMotionEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const entering = isReduceMotionEnabled ? undefined : FadeInDown.delay(phaseNumber * 60).springify();

  if (locked) {
    return (
      <Animated.View entering={entering} style={[styles.card, styles.lockedCard]}>
        <View style={styles.lockedRow}>
          <Ionicons name="lock-closed-outline" size={14} color={Theme.colors.textMuted} />
          <Text style={styles.lockedText}>{lockedHint || `${title} unlocks soon`}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} style={[styles.card, isCompleted && styles.completedCard]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          onPress={async () => {
            try {
              if (!isCompleted) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch {}
            onToggleComplete();
          }}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={16} color={Theme.colors.bgDark} />
          )}
        </TouchableOpacity>

        <View style={styles.titleArea}>
          <View style={styles.titleRow}>
            <Text style={styles.phaseLabel}>PHASE {phaseNumber}</Text>
            <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
              {title}
            </Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Theme.colors.textMuted}
        />
      </TouchableOpacity>

      {isExpanded && children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(19, 34, 56, 0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Theme.colors.successGreen,
    borderColor: Theme.colors.successGreen,
  },
  titleArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.accentGold,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textSecondary,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  lockedCard: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.surface1,
    borderColor: Theme.colors.border,
    opacity: 0.9,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
