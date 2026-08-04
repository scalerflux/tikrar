import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/theme';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ 
  percentage, 
  size = 180, 
  strokeWidth = 12 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.ringWrapper}>
        {/* Background circle */}
        <View 
          style={[
            styles.backgroundCircle, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: Theme.colors.accentGoldMuted,
            }
          ]} 
        />
        
        {/* Progress circle (simplified with rotation) */}
        <View 
          style={[
            styles.progressCircle,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: Theme.colors.accentGold,
              borderLeftColor: percentage > 25 ? Theme.colors.accentGoldMuted : Theme.colors.accentGold,
              borderBottomColor: percentage > 50 ? Theme.colors.accentGoldMuted : Theme.colors.accentGold,
              borderRightColor: percentage > 75 ? Theme.colors.accentGoldMuted : Theme.colors.accentGold,
            }
          ]} 
        />
        
        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
          <Text style={styles.labelText}>Complete</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    color: Theme.colors.accentGold,
    fontSize: 32,
    fontWeight: '800',
  },
  labelText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
