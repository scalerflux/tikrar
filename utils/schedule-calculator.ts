import scheduleData from '../data/schedule-data.json';
import pageAyahMap from '../data/page-ayah-map.json';
import { SURAH_LIST } from '../data/surah-metadata';

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

interface PageAyahInfo {
  s: number;
  sa: number;
  e: number;
  ea: number;
  n: number;
}

export interface AyahRange {
  page: number;
  half: 'h1' | 'h2' | null;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  totalAyahs: number;
}

function enumeratePageAyahs(info: PageAyahInfo): { surah: number; ayah: number }[] {
  const result: { surah: number; ayah: number }[] = [];
  for (let s = info.s; s <= info.e; s++) {
    const totalVerses = SURAH_LIST[s - 1]?.totalVerses ?? 0;
    const fromAyah = s === info.s ? info.sa : 1;
    const toAyah = s === info.e ? info.ea : totalVerses;
    for (let a = fromAyah; a <= toAyah; a++) {
      result.push({ surah: s, ayah: a });
    }
  }
  return result;
}

export function getAyahRangeForFace(faceNumber: string): AyahRange | null {
  if (!faceNumber) return null;
  const match = faceNumber.trim().match(/^(\d+)\s*(h1|h2)?$/i);
  if (!match) return null;
  const page = parseInt(match[1], 10);
  const half = match[2] ? (match[2].toLowerCase() as 'h1' | 'h2') : null;
  const info = (pageAyahMap as Record<string, PageAyahInfo>)[String(page)];
  if (!info) return null;

  const ayahs = enumeratePageAyahs(info);
  if (ayahs.length === 0) return null;

  if (!half) {
    return {
      page,
      half: null,
      surahNumber: ayahs[0].surah,
      startAyah: ayahs[0].ayah,
      endAyah: ayahs[ayahs.length - 1].ayah,
      totalAyahs: ayahs.length,
    };
  }

  const mid = Math.ceil(ayahs.length / 2);
  const selected = half === 'h1' ? ayahs.slice(0, mid) : ayahs.slice(mid);
  return {
    page,
    half,
    surahNumber: selected[0].surah,
    startAyah: selected[0].ayah,
    endAyah: selected[selected.length - 1].ayah,
    totalAyahs: selected.length,
  };
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
