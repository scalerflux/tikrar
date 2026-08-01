export interface TafseerEntry {
  surahName: string;
  summary: string;
  keyThemes: string[];
}

export const TAFSEER_SAADI: Record<string, TafseerEntry> = {
  "Al-Fatihah": {
    surahName: "Al-Fatihah (The Opening)",
    summary: "In the name of Allah, the Most Gracious, the Most Merciful. Praise be to Allah, the Lord of all creation. This fundamental surah contains praising Allah, acknowledging His complete lordship and mercy, declaring worship for Him alone, and asking for guidance to the straight path.",
    keyThemes: ["Praise and Worship of Allah Alone", "The Straight Path (As-Sirat Al-Mustaqim)", "Divine Mercy and Judgment"]
  },
  "Al-Baqarah": {
    surahName: "Al-Baqarah (The Cow)",
    summary: "Tafseer As-Sa'di emphasizes that Al-Baqarah outlines the foundational creed (Eeman), laws of worship, social ethics, financial integrity, and lessons from previous nations (such as Bani Israel). It establishes guidance for the God-fearing.",
    keyThemes: ["Guidance for the Muttaqin", "Story of Adam and Israel", "Ayat Al-Kursi & Laws of Justice"]
  },
  "Al-Imran": {
    surahName: "Al-Imran (Family of Imran)",
    summary: "Focuses on firm faith in divine revelation, defending pure monotheism (Tawheed), lessons from the Battle of Uhud, steadfastness in trials, and unity among believers.",
    keyThemes: ["Tawheed and Refutation of Shirk", "Patience & Perseverance", "Lessons from Uhud"]
  },
  "An-Nisa": {
    surahName: "An-Nisa (The Women)",
    summary: "Outlines laws protecting orphans, women's rights, inheritance, social harmony, justice in leadership, and warnings against hypocrites.",
    keyThemes: ["Justice & Rights of Weak", "Inheritance Rules", "Obedience to Allah and His Messenger"]
  },
  "Al-Maidah": {
    surahName: "Al-Ma'idah (The Table Spread)",
    summary: "Highlights fulfilling covenants, lawful foods, purity for prayer, justice even with enemies, and the perfection of Islam as a complete way of life.",
    keyThemes: ["Fulfilling Covenants", "Halal & Haram Standards", "Perfection of Deen"]
  }
};

export function getTafseerForSurah(surahName: string): TafseerEntry {
  if (TAFSEER_SAADI[surahName]) {
    return TAFSEER_SAADI[surahName];
  }
  return {
    surahName: surahName,
    summary: `Tafseer As-Sa'di for Surah ${surahName}: Reflect upon the verses as you recite today. Contemplate Allah's command, His promises of mercy, and the guidance contained within this portion of the noble Quran.`,
    keyThemes: ["Contemplation (Tadabbur)", "Tawheed & Faith", "Action upon Revelation"]
  };
}
