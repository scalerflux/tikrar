import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CalendarHeatMapProps {
  completedDays: number[];
  currentDay: number;
}

export const CalendarHeatMap: React.FC<CalendarHeatMapProps> = ({ completedDays, currentDay }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const totalDays = 1206;
  const cols = 18;
  const rows = Math.ceil(totalDays / cols);

  const getDayColor = (dayNum: number) => {
    if (dayNum > totalDays) return Theme.colors.bgCard;
    if (dayNum === currentDay) return Theme.colors.accentGold;
    if (completedDays.includes(dayNum)) {
      const progress = dayNum / totalDays;
      if (progress < 0.25) return '#10B981';
      if (progress < 0.5) return '#059669';
      if (progress < 0.75) return '#047857';
      return '#065F46';
    }
    if (dayNum < currentDay) return '#1F2937';
    return Theme.colors.bgCard;
  };

  const getDayStatus = (dayNum: number) => {
    if (dayNum === currentDay) return 'Today';
    if (completedDays.includes(dayNum)) return 'Completed';
    if (dayNum < currentDay) return 'Missed';
    return 'Upcoming';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memorization Journey</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Theme.colors.accentGold }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Done</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#1F2937' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Theme.colors.bgCard }]} />
            <Text style={styles.legendText}>Ahead</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {Array.from({ length: cols }).map((_, colIndex) => {
                const dayNum = rowIndex * cols + colIndex + 1;
                if (dayNum > totalDays) return null;
                
                const isSelected = selectedDay === dayNum;
                
                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[
                      styles.cell,
                      { backgroundColor: getDayColor(dayNum) },
                      isSelected && styles.selectedCell,
                    ]}
                    onPress={() => setSelectedDay(dayNum)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {selectedDay !== null && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Day {selectedDay} — {getDayStatus(selectedDay)}
          </Text>
        </View>
      )}
    </View>
  );
};

const CELL_SIZE = 14;
const CELL_GAP = 3;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
  },
  grid: {
    flexDirection: 'column',
    gap: CELL_GAP,
    paddingRight: Theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: Theme.colors.accentGold,
  },
  infoBox: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  infoText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
