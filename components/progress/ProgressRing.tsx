import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/theme';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Accurate circular progress built from two clipped half arcs, so it needs no
 * SVG dependency. An arc element colours its top and right border, which
 * covers 180 degrees starting at -45. Rotating it inside a half-width clip
 * reveals exactly the sweep we want on each side.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 180,
  strokeWidth = 12,
}) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  const sweep = (clamped / 100) * 360;
  const rightSweep = Math.min(sweep, 180);
  const leftSweep = Math.max(sweep, 180);
  const half = size / 2;

  const arc = {
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: strokeWidth,
    borderTopColor: Theme.colors.accentGold,
    borderRightColor: Theme.colors.accentGold,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  } as const;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View
        style={[
          styles.abs,
          { width: size, height: size, borderRadius: half, borderWidth: strokeWidth, borderColor: 'rgba(255,255,255,0.07)' },
        ]}
      />

      {sweep > 0 ? (
        <View style={[styles.abs, styles.clip, { left: half, width: half, height: size }]}>
          <View style={[styles.abs, arc, { left: -half, transform: [{ rotate: `${rightSweep - 135}deg` }] }]} />
        </View>
      ) : null}

      {sweep > 180 ? (
        <View style={[styles.abs, styles.clip, { left: 0, width: half, height: size }]}>
          <View style={[styles.abs, arc, { left: 0, transform: [{ rotate: `${leftSweep - 135}deg` }] }]} />
        </View>
      ) : null}

      <View style={styles.centerContent}>
        <Text style={styles.percentageText}>
          {clamped.toFixed(1)}
          <Text style={styles.percentSign}>%</Text>
        </Text>
        <Text style={styles.labelText}>memorized</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  abs: {
    position: 'absolute',
    top: 0,
  },
  clip: {
    overflow: 'hidden',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    color: Theme.colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  percentSign: {
    color: Theme.colors.accentGold,
    fontSize: 20,
    fontWeight: '800',
  },
  labelText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.4,
  },
});
