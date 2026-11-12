import React, { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { CalendarHeatMap } from '../../components/schedule/CalendarHeatMap';
import { getAllCompletedDaysWithDates, loadScheduleDirection } from '../../database/db';
import { calculateCurrentDay, getDisplaySurahName, getSchedule, ScheduleDirection, ScheduleItem } from '../../utils/schedule-calculator';

const ROW_HEIGHT = 76;
const ROW_GAP = 8;
const ROW_STRIDE = ROW_HEIGHT + ROW_GAP;

export default function ScheduleScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [direction, setDirection] = useState<ScheduleDirection>('forward');
  const flatListRef = useRef<FlatList>(null);
  // Kept in state so FlatList recomputes row offsets when the heat map expands.
  const [headerHeight, setHeaderHeight] = useState(0);
  const scheduleData = useMemo<ScheduleItem[]>(() => getSchedule(direction), [direction]);
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);

  const loadData = async () => {
    setDirection(await loadScheduleDirection());
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
    if (!searchQuery) return scheduleData;
    const query = searchQuery.toLowerCase();
    return scheduleData.filter((item) => {
      return (
        item.dayNumber.toString().includes(query) ||
        item.surahName.toLowerCase().includes(query) ||
        getDisplaySurahName(item).toLowerCase().includes(query) ||
        item.faceNumber.toLowerCase().includes(query) ||
        String(item.tourNumber).includes(query)
      );
    });
  }, [searchQuery, scheduleData]);

  const getRowStatus = (dayNumber: number) => {
    if (dayNumber === currentDay) return 'today';
    if (completedSet.has(dayNumber)) return 'completed';
    if (dayNumber < currentDay) return 'missed';
    return 'upcoming';
  };

  const scrollToDay = (list: ScheduleItem[]) => {
    const index = list.findIndex((i) => i.dayNumber === currentDay);
    if (index < 0 || !flatListRef.current) return;
    // Rows have a fixed height, so the offset is exact and does not depend on
    // which rows FlatList has already measured.
    const offset = headerHeight + index * ROW_STRIDE - 160;
    flatListRef.current.scrollToOffset({ offset: Math.max(0, offset), animated: true });
  };

  const scrollToToday = () => {
    if (filteredSchedule.some((i) => i.dayNumber === currentDay)) {
      scrollToDay(filteredSchedule);
      return;
    }
    // Today is hidden by the current search, so clear it first.
    setSearchQuery('');
    setTimeout(() => scrollToDay(scheduleData), 60);
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => {
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
          <Text style={styles.dayLabel}>DAY</Text>
          <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{item.dayNumber}</Text>
        </View>

        <View style={styles.centerCol}>
          <View style={styles.nameRow}>
            <Text style={styles.surahName} numberOfLines={1}>{getDisplaySurahName(item)}</Text>
            {isToday ? <Text style={[styles.statusPill, styles.statusBadgeToday]}>TODAY</Text> : null}
            {isCompleted ? <Text style={[styles.statusPill, styles.statusBadgeDone]}>DONE</Text> : null}
            {isMissed ? <Text style={[styles.statusPill, styles.statusBadgeMissed]}>MISSED</Text> : null}
          </View>
          <Text style={styles.faceNum}>Face {item.faceNumber || '—'} · Tour #{item.tourNumber}</Text>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerOverline}>{direction === 'backward' ? '1,206-day plan · from An-Nas' : '1,206-day plan'}</Text>
            <Text style={styles.headerTitle}>Schedule</Text>
          </View>
          <TouchableOpacity style={styles.todayBtn} onPress={scrollToToday} activeOpacity={0.7}>
            <Ionicons name="locate-outline" size={14} color={Theme.colors.accentGold} />
            <Text style={styles.todayBtnText}>Go to today</Text>
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
          keyboardShouldPersistTaps="handled"
          // Rows have a fixed height. Telling FlatList lets it jump to any day
          // without first rendering every row before it.
          getItemLayout={(_, index) => ({ length: ROW_STRIDE, offset: headerHeight + index * ROW_STRIDE, index })}
          ListHeaderComponent={
            <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
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
            </View>
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
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Theme.spacing.md,
  },
  headerOverline: {
    color: Theme.colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: Theme.spacing.xs,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.accentGoldMuted,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.full,
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
    height: ROW_HEIGHT,
    paddingHorizontal: 14,
    marginBottom: ROW_GAP,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
    overflow: 'hidden',
  },
  rowToday: {
    borderColor: Theme.colors.accentGold,
    backgroundColor: 'rgba(227,185,91,0.08)',
  },
  rowCompleted: {
    borderColor: Theme.colors.successGreenBorder,
  },
  rowMissed: {
    borderColor: Theme.colors.warningAmberBg,
  },
  dayCol: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  dayLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dayNum: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dayNumToday: {
    color: Theme.colors.accentGold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    flexShrink: 0,
  },
  statusBadgeToday: {
    color: Theme.colors.bgDark,
    backgroundColor: Theme.colors.accentGold,
  },
  statusBadgeDone: {
    color: Theme.colors.successGreen,
    backgroundColor: Theme.colors.successGreenBg,
  },
  statusBadgeMissed: {
    color: Theme.colors.warningAmber,
    backgroundColor: Theme.colors.warningAmberBg,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
  },
  surahName: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  faceNum: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rightCol: {
    maxWidth: 96,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  rangeText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
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
