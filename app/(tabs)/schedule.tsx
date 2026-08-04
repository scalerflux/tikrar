import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import scheduleData from '../../data/schedule-data.json';
import { Ionicons } from '@expo/vector-icons';
import { CalendarHeatMap } from '../../components/schedule/CalendarHeatMap';
import { getAllCompletedDays, getUserSetting } from '../../database/db';
import { calculateCurrentDay } from '../../utils/schedule-calculator';

export default function ScheduleScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const completed = await getAllCompletedDays();
    setCompletedDays(completed);
    
    const startDate = await getUserSetting('startDate', new Date().toISOString());
    const day = calculateCurrentDay(startDate);
    setCurrentDay(day);
  };

  const filteredSchedule = scheduleData.filter((item: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.dayNumber.toString().includes(query) ||
      item.surahName.toLowerCase().includes(query) ||
      item.faceNumber.toLowerCase().includes(query)
    );
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.rowCard}>
      <View style={styles.dayCol}>
        <Text style={styles.dayNum}>Day {item.dayNumber}</Text>
        <Text style={styles.tourNum}>Tour #{item.tourNumber}</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>1,206-Day Schedule</Text>

        {/* Calendar Heat Map */}
        <CalendarHeatMap completedDays={completedDays} currentDay={currentDay} />

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Day # or Surah Name..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filteredSchedule}
          keyExtractor={(item) => item.dayNumber.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
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
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Theme.spacing.md,
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
  listContent: {
    paddingBottom: Theme.spacing.lg,
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
  },
  dayCol: {
    width: 65,
  },
  dayNum: {
    color: Theme.colors.accentGold,
    fontSize: 13,
    fontWeight: '800',
  },
  tourNum: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
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
});
