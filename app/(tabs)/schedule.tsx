import React, { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import scheduleData from '../../data/schedule-data.json';
import { Ionicons } from '@expo/vector-icons';
import { CalendarHeatMap } from '../../components/schedule/CalendarHeatMap';
import { getAllCompletedDaysWithDates } from '../../database/db';
import { calculateCurrentDay } from '../../utils/schedule-calculator';

export default function ScheduleScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const flatListRef = useRef<FlatList>(null);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  const loadData = async () => {
    const completed = await getAllCompletedDaysWithDates();
    const nums = completed.map((c) => c.dayNumber);
    setCompletedDays(nums);
    const day = calculateCurrentDay(nums);
    setCurrentDay(day);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredSchedule = useMemo(() => {
    if (!searchQuery) return scheduleData as any[];
    const query = searchQuery.toLowerCase();
    return (scheduleData as any[]).filter((item) => {
      return (
        item.dayNumber.toString().includes(query) ||
        item.surahName.toLowerCase().includes(query) ||
        item.faceNumber.toLowerCase().includes(query) ||
        String(item.tourNumber).includes(query)
      );
    });
  }, [searchQuery]);

  const getRowStatus = (dayNumber: number) => {
    if (dayNumber === currentDay) return 'today';
    if (completedSet.has(dayNumber)) return 'completed';
    if (dayNumber < currentDay) return 'missed';
    return 'upcoming';
  };

  const scrollToToday = () => {
    const index = filteredSchedule.findIndex((i) => i.dayNumber === currentDay);
    if (index >= 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch {
        flatListRef.current.scrollToOffset({ offset: index * 76, animated: true });
      }
    } else if (flatListRef.current) {
      const allIndex = (scheduleData as any[]).findIndex((i) => i.dayNumber === currentDay);
      try {
        flatListRef.current.scrollToIndex({ index: allIndex, animated: true, viewPosition: 0.5 });
      } catch {
        flatListRef.current.scrollToOffset({ offset: allIndex * 76, animated: true });
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getRowStatus(item.dayNumber);
    const isToday = status === 'today';
    const isCompleted = status === 'completed';
    const isMissed = status === 'missed';
    return (
      <View
        style={[
          styles.rowCard,
          isToday && styles.rowToday,
          isCompleted && styles.rowCompleted,
          isMissed && styles.rowMissed,
        ]}
      >
        <View style={styles.dayCol}>
          <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>Day {item.dayNumber}</Text>
          <Text style={styles.tourNum}>Tour #{item.tourNumber}</Text>
          {isToday ? <Text style={styles.statusBadgeToday}>TODAY</Text> : null}
          {isCompleted ? <Text style={styles.statusBadgeDone}>DONE</Text> : null}
          {isMissed ? <Text style={styles.statusBadgeMissed}>MISSED</Text> : null}
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.surahName}>{item.surahName}</Text>
          <Text style={styles.faceNum}>Face: {item.faceNumber || '—'}</Text>
        </View>

        <View style={styles.rightCol}>
          {item.connectionRange ? (
            <Text style={styles.rangeText} numberOfLines={1}>
              Conn: {item.connectionRange}
            </Text>
          ) : null}
          {item.revisionRange ? (
            <Text style={styles.rangeText} numberOfLines={1}>
              Rev: {item.revisionRange}
            </Text>
          ) : null}
        </View>

        {isToday ? <View style={styles.todayIndicator} /> : null}
        {isCompleted ? <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.checkIcon} /> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>1,206-Day Schedule</Text>
          <TouchableOpacity style={styles.todayBtn} onPress={scrollToToday} activeOpacity={0.7}>
            <Ionicons name="locate-outline" size={14} color={Theme.colors.accentGold} />
            <Text style={styles.todayBtnText}>Go to Today</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.list}
          data={filteredSchedule}
          keyExtractor={(item) => item.dayNumber.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
          ListHeaderComponent={
            <>
              <CalendarHeatMap completedDays={completedDays} currentDay={currentDay} />
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={Theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by Day #, Surah, Face or Tour..."
                  placeholderTextColor={Theme.colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={Theme.colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={28} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No results for "{searchQuery}"</Text>
              <Text style={styles.emptySub}>Try a day number, surah name, or face like "5 h1"</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
  },
  container: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentGoldBorder,
  },
  todayBtnText: {
    color: Theme.colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: Theme.spacing.sm,
    overflow: 'hidden',
  },
  rowToday: {
    borderColor: Theme.colors.accentGold,
    backgroundColor: 'rgba(212,168,67,0.08)',
  },
  rowCompleted: {
    borderColor: 'rgba(16,185,129,0.25)',
  },
  rowMissed: {
    borderColor: Theme.colors.warningAmberBg,
    opacity: 0.95,
  },
  dayCol: {
    width: 72,
  },
  dayNum: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '800',
  },
  dayNumToday: {
    color: Theme.colors.accentGold,
  },
  tourNum: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  statusBadgeToday: {
    color: Theme.colors.accentGold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statusBadgeDone: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statusBadgeMissed: {
    color: Theme.colors.warningAmber,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  centerCol: {
    flex: 1,
  },
  surahName: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  faceNum: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rightCol: {
    width: 100,
    alignItems: 'flex-end',
  },
  rangeText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  todayIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Theme.colors.accentGold,
  },
  checkIcon: {
    marginLeft: 4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySub: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
