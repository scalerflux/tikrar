import scheduleData from '../data/schedule-data.json';

export interface ScheduleItem {
  dayNumber: number;
  faceNumber: string;
  surahName: string;
  tourNumber: number;
  revisionRange: string;
  connectionRange: string;
}

export function getScheduleItem(dayNumber: number): ScheduleItem | null {
  if (dayNumber < 1 || dayNumber > 1206) {
    return null;
  }
  const item = scheduleData.find((d: any) => d.dayNumber === dayNumber);
  return item ? (item as ScheduleItem) : null;
}

export function calculateCurrentDay(startDateIso: string): number {
  if (!startDateIso) return 1;
  const start = new Date(startDateIso);
  start.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const calculatedDay = diffDays + 1; // Day 1 is start date
  return Math.max(1, Math.min(1206, calculatedDay));
}

export function getSurahPageNumber(faceNumber: string): number {
  if (!faceNumber) return 1;
  const parts = faceNumber.split(' ');
  const page = parseInt(parts[0], 10);
  return isNaN(page) ? 1 : page;
}

export function calculateStreak(completedDays: number[]): { currentStreak: number; maxStreak: number } {
  if (!completedDays || completedDays.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }
  
  const sorted = [...new Set(completedDays)].sort((a, b) => a - b);
  let maxStreak = 0;
  let currentRun = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] === sorted[i - 1] + 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }
  
  // Calculate current streak from last entry
  let currentStreak = 0;
  const lastDay = sorted[sorted.length - 1];
  let check = lastDay;
  while (sorted.includes(check)) {
    currentStreak++;
    check--;
  }
  
  return { currentStreak, maxStreak };
}
