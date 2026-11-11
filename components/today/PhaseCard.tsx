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
        <View style={styles.lockedIcon}>
          <Ionicons name="lock-closed" size={13} color={Theme.colors.textMuted} />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.lockedTitle}>{title}</Text>
          <Text style={styles.lockedText}>{lockedHint || `${title} unlocks soon`}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} style={[styles.card, isCompleted && styles.completedCard, isExpanded && styles.expandedCard]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Phase ${phaseNumber}, ${title}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark ${title} as done`}
          accessibilityState={{ checked: isCompleted }}
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
          {isCompleted ? (
            <Ionicons name="checkmark" size={17} color={Theme.colors.bgDark} />
          ) : (
            <Text style={styles.checkboxNumber}>{phaseNumber}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.titleArea}>
          <View style={styles.labelRow}>
            <Ionicons name={iconName} size={12} color={isCompleted ? Theme.colors.successGreen : Theme.colors.accentGold} />
            <Text style={[styles.phaseLabel, isCompleted && styles.phaseLabelDone]}>
              {isCompleted ? `PHASE ${phaseNumber} · DONE` : `PHASE ${phaseNumber}`}
            </Text>
          </View>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={isExpanded ? 3 : 1}>
            {subtitle}
          </Text>
        </View>

        <View style={[styles.chevron, isExpanded && styles.chevronOpen]}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={isExpanded ? Theme.colors.accentGold : Theme.colors.textMuted}
          />
        </View>
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
    borderRadius: Theme.borderRadius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: Theme.colors.successGreenBorder,
    backgroundColor: 'rgba(61,214,163,0.05)',
  },
  expandedCard: {
    borderColor: Theme.colors.accentGoldBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Theme.colors.accentGoldBorder,
    backgroundColor: Theme.colors.accentGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Theme.colors.successGreen,
    borderColor: Theme.colors.successGreen,
  },
  checkboxNumber: {
    color: Theme.colors.accentGold,
    fontSize: 14,
    fontWeight: '800',
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.accentGold,
    letterSpacing: 1,
  },
  phaseLabelDone: {
    color: Theme.colors.successGreen,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  titleCompleted: {
    color: Theme.colors.textSecondary,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    color: Theme.colors.textSecondary,
    marginTop: 3,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chevronOpen: {
    backgroundColor: Theme.colors.accentGoldMuted,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.xs,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: Theme.colors.borderBright,
  },
  lockedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  lockedTitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  lockedText: {
    color: Theme.colors.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
});
