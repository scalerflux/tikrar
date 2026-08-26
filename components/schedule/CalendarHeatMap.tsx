import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/theme';

interface CalendarHeatMapProps {
  completedDays: number[];
  currentDay: number;
}

export const CalendarHeatMap: React.FC<CalendarHeatMapProps> = ({ completedDays, currentDay }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const totalDays = 1206;
  const colsPerRow = 52;
  const rows = Math.ceil(totalDays / colsPerRow);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  const getDayColor = (dayNum: number) => {
    if (dayNum > totalDays) return Theme.colors.bgCard;
    if (dayNum === currentDay) return Theme.colors.accentGold;
    if (completedSet.has(dayNum)) return '#1FA774';
    if (dayNum < currentDay) return '#27364A';
    return '#122137';
  };

  const getDayStatus = (dayNum: number) => {
    if (dayNum === currentDay) return 'Today';
    if (completedSet.has(dayNum)) return 'Completed';
    if (dayNum < currentDay) return 'Missed';
    return 'Upcoming';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memorization Journey</Text>
          <Text style={styles.subtitle}>Tap a day to inspect its status</Text>
        </View>
      </View>
      <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Theme.colors.accentGold }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#1FA774' }]} />
            <Text style={styles.legendText}>Done</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#27364A' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#122137' }]} />
            <Text style={styles.legendText}>Ahead</Text>
          </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {Array.from({ length: colsPerRow }).map((_, colIndex) => {
                const dayNum = rowIndex * colsPerRow + colIndex + 1;
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

const CELL_SIZE = 10;
const CELL_GAP = 2;

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
    marginBottom: 4,
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 3 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Theme.spacing.sm,
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
  scrollContent: {
    paddingRight: Theme.spacing.sm,
  },
  grid: {
    flexDirection: 'column',
    gap: CELL_GAP,
    paddingVertical: 2,
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
  emptyCell: {
    backgroundColor: 'transparent',
    borderWidth: 0,
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
