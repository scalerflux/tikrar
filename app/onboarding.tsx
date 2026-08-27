import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert, Switch } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { setUserSetting, getUserSetting, saveDailyProgress } from '../database/db';
import { isValidLocalDateString, localDateString } from '../utils/schedule-calculator';
import { faceOrdinalForDay, formatFace } from '../utils/face';
import { RECITERS, ReciterId } from '../services/audio-service';
import { AudioService } from '../services/audio-service';
import { CalendarService } from '../services/calendar-service';
import { PressableScale } from '../components/ui/PressableScale';

const PRECONDITIONS_1_10 = [
  { n: 1, t: 'Sincerity for Allah', d: 'Have sincerity to Allah with all your actions especially with His Book. The Quran will either be an evidence for you or against you.' },
  { n: 2, t: 'Reliance on Allah', d: 'Hold fast to the rope of Allah and do not rely on yourself or the program. Make lots of duaa and remember Allah much.' },
  { n: 3, t: 'Patience', d: 'Success comes with patience. Leave off hastiness. Days and weeks will pass until you reach this great goal with permission of Allah.' },
  { n: 4, t: 'Leave off sins', d: 'No one is granted goodness by doing evil. Increase in good deeds and abandon sins.' },
  { n: 5, t: 'Full devotion', d: 'Do not put any other knowledge before the Quran. The Quran is the best and most blessed science.' },
  { n: 6, t: 'Revision in Salah', d: 'A lot of revision in salah and recitation. It is the best way to strengthen memorization.' },
  { n: 7, t: 'Companions', d: 'Have companions who assist in memorization, but beware of comparing abilities or gathering for useless talk.' },
  { n: 8, t: 'Seriousness', d: 'Mastering the Quran is only for the serious and diligent. Being easy on yourself spoils the program for the day.' },
  { n: 9, t: '6-day completion after finish', d: 'After completing the whole Quran, you must complete revision of the whole Quran every 6 days for 6 months.' },
  { n: 10, t: 'Firm Shaykh', d: 'You must have a firm shaykh who follows up with you before and after memorization.' },
];

const PRECONDITIONS_11_20 = [
  { n: 11, t: 'Special Mus-haf', d: 'Have a special Mus-haf for memorization so you do not change the place where you stop and start and the beginning of lines.' },
  { n: 12, t: 'Daily without stopping', d: 'Memorize every day of the week without stopping. In emergency, only new memorization stops while Connection and Revision never stop.' },
  { n: 13, t: 'Mus-haf far in revision', d: 'During revision the Mus-haf should be far from your hands so you do not return to it for every doubt.' },
  { n: 14, t: 'Fajr to Fajr', d: 'You should complete your daily portion from the adhan of Fajr to the adhan of Fajr of the next day.' },
  { n: 15, t: 'Clear mind for Rabt', d: 'Repetition and Connection cannot be done in the car or on the road. They require a completely clear mind. Revision is allowed.' },
  { n: 16, t: 'Measured recitation', d: 'Half page: not less than half a minute and not more than a minute with al-Hadr. One page: not less than a minute and not more than a minute and a half.' },
  { n: 17, t: 'Do not exceed portion', d: 'Do not memorize or perfect more than your daily portion except after coordinating with your shaykh.' },
  { n: 18, t: 'Precision and honesty', d: 'Precision, truthfulness and honesty while completing the program.' },
  { n: 19, t: 'Follow exactly', d: 'Every part of this program must be completed without adding or subtracting anything.' },
  { n: 20, t: 'Follow as is', d: 'If you do not follow the program as it is, you will not achieve perfecting the Quran.' },
];

const DEFINITIONS_A = [
  { k: 'Repetition of Yesterday', d: 'Repeating what was memorized yesterday from memory 5 times.' },
  { k: 'Listening', d: 'Listen to the page to be memorized 3 times by a reciter who has mastered tajweed while following the Mus-haf.' },
  { k: 'Tafseer', d: 'Read the tafseer of the page to be memorized to enhance awareness of meanings. Recommended: Hilali-Khan and As-Sa\'di.' },
];

const DEFINITIONS_B = [
  { k: 'Recording', d: 'Record yourself reciting the memorized page 3 times from memory without looking, then listen while looking to ensure no errors. Repeat if even one mistake.' },
  { k: 'Connection (Rabt)', d: 'Reciting all perfected pages over the previous 30 days from memory, one time, without looking.' },
  { k: 'Revision', d: 'Reciting old memorization that has exited the Connection window. Complete the old portion every 6 days.' },
  { k: 'Circuit', d: 'Every completion of your old memorization is considered a circuit. The more you progress, the more pages are added.' },
];

const BEAUTIFYING_VOICE_TEXT = `Before beauty, seek correctness, and before correctness seek sincerity. Learn the letters right first and the beauty comes naturally after, not instead.

Level 1, the base:
Dr. Ayman Suwayd (tajwid based), Sheikh Minshawi, Sheikh Hudayfi, Sheikh Khalid Al-Husari.

When you can recite similarly to these, move onto Level 2. Learn monotone first because it breaks rhythm habits you might have subconsciously. This gives you a solid foundation that will help you recite in different styles, especially when you switch styles in accordance with meaning.

Level 2:
Sheikh Muhammad Ayyub, Sheikh Ahmad At-Talib, Sheikh Ali Jaber, Sheikh Abu Bakr Shatiri, Sheikh Shuraym, Sheikh Sudays, Sheikh Abdullah Matrud, Sheikh Nasir Al-Qahtani. These are relatively harder than Level 1 but a bit repetitive in tone.

Level 3:
Sheikh Mahir Al-Muaiqili, Sheikh Raad Al-Kurdi, Sheikh Ash-Shishani, Sheikh Yasir Ad-Dawsari, Sheikh Mishari Al-Afasi, Sheikh Faris Abbad, Sheikh Ahmad Al-Ajmi, Sheikh Hazza Al-Balushi. These are also repetitive, but it is harder to imitate their individual uniqueness and the repetition is more advanced.

Level 4:
Sheikh Luhaydan, Sheikh Badr At-Turki, Sheikh Bandar Balilah, Sheikh Abdullah Al-Juhani. These recite with meaning and they are the hardest to imitate, because their voice changes with the meaning of the verses.

Along the way you will realize you can mix these voices up and create your own version of them: Yasir Ad-Dawsari + Hazza + Luhaydan, or Mahir + Ayyub + Ali Jaber + Hudayfi, or Shuraym + Sudays + Matrud, or Mishari + Raad Al-Kurdi + Luhaydan + Ash-Shishani, and many more combinations you can try. It is completely up to you and your creativity, and how you use your voice to recite.

The goal is not to imitate the shuyukh 100%. Rather it is to learn their essence and uniqueness and use it to create your own voice.`;

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', offset: 4.5 }, { code: 'AL', name: 'Albania', offset: 1 }, { code: 'DZ', name: 'Algeria', offset: 1 }, { code: 'AR', name: 'Argentina', offset: -3 }, { code: 'AU', name: 'Australia', offset: 10 }, { code: 'AT', name: 'Austria', offset: 1 }, { code: 'AZ', name: 'Azerbaijan', offset: 4 }, { code: 'BH', name: 'Bahrain', offset: 3 }, { code: 'BD', name: 'Bangladesh', offset: 6 }, { code: 'BY', name: 'Belarus', offset: 3 }, { code: 'BE', name: 'Belgium', offset: 1 }, { code: 'BO', name: 'Bolivia', offset: -4 }, { code: 'BA', name: 'Bosnia', offset: 1 }, { code: 'BR', name: 'Brazil', offset: -3 }, { code: 'BN', name: 'Brunei', offset: 8 }, { code: 'BG', name: 'Bulgaria', offset: 2 }, { code: 'KH', name: 'Cambodia', offset: 7 }, { code: 'CM', name: 'Cameroon', offset: 1 }, { code: 'CA', name: 'Canada', offset: -5 }, { code: 'CL', name: 'Chile', offset: -4 }, { code: 'CN', name: 'China', offset: 8 }, { code: 'CO', name: 'Colombia', offset: -5 }, { code: 'CR', name: 'Costa Rica', offset: -6 }, { code: 'HR', name: 'Croatia', offset: 1 }, { code: 'CU', name: 'Cuba', offset: -5 }, { code: 'CY', name: 'Cyprus', offset: 2 }, { code: 'CZ', name: 'Czech Republic', offset: 1 }, { code: 'DK', name: 'Denmark', offset: 1 }, { code: 'EC', name: 'Ecuador', offset: -5 }, { code: 'EG', name: 'Egypt', offset: 2 }, { code: 'EE', name: 'Estonia', offset: 2 }, { code: 'ET', name: 'Ethiopia', offset: 3 }, { code: 'FI', name: 'Finland', offset: 2 }, { code: 'FR', name: 'France', offset: 1 }, { code: 'GE', name: 'Georgia', offset: 4 }, { code: 'DE', name: 'Germany', offset: 1 }, { code: 'GH', name: 'Ghana', offset: 0 }, { code: 'GR', name: 'Greece', offset: 2 }, { code: 'GT', name: 'Guatemala', offset: -6 }, { code: 'HU', name: 'Hungary', offset: 1 }, { code: 'IS', name: 'Iceland', offset: 0 }, { code: 'IN', name: 'India', offset: 5.5 }, { code: 'ID', name: 'Indonesia (WIB)', offset: 7 }, { code: 'IR', name: 'Iran', offset: 3.5 }, { code: 'IQ', name: 'Iraq', offset: 3 }, { code: 'IE', name: 'Ireland', offset: 0 }, { code: 'IL', name: 'Israel', offset: 2 }, { code: 'IT', name: 'Italy', offset: 1 }, { code: 'JP', name: 'Japan', offset: 9 }, { code: 'JO', name: 'Jordan', offset: 3 }, { code: 'KZ', name: 'Kazakhstan', offset: 5 }, { code: 'KE', name: 'Kenya', offset: 3 }, { code: 'KW', name: 'Kuwait', offset: 3 }, { code: 'KG', name: 'Kyrgyzstan', offset: 6 }, { code: 'LA', name: 'Laos', offset: 7 }, { code: 'LV', name: 'Latvia', offset: 2 }, { code: 'LB', name: 'Lebanon', offset: 2 }, { code: 'LY', name: 'Libya', offset: 2 }, { code: 'LT', name: 'Lithuania', offset: 2 }, { code: 'LU', name: 'Luxembourg', offset: 1 }, { code: 'MY', name: 'Malaysia', offset: 8 }, { code: 'MV', name: 'Maldives', offset: 5 }, { code: 'MT', name: 'Malta', offset: 1 }, { code: 'MA', name: 'Morocco', offset: 1 }, { code: 'MM', name: 'Myanmar', offset: 6.5 }, { code: 'NP', name: 'Nepal', offset: 5.75 }, { code: 'NL', name: 'Netherlands', offset: 1 }, { code: 'NZ', name: 'New Zealand', offset: 12 }, { code: 'NG', name: 'Nigeria', offset: 1 }, { code: 'NO', name: 'Norway', offset: 1 }, { code: 'OM', name: 'Oman', offset: 4 }, { code: 'PK', name: 'Pakistan', offset: 5 }, { code: 'PS', name: 'Palestine', offset: 2 }, { code: 'PA', name: 'Panama', offset: -5 }, { code: 'PY', name: 'Paraguay', offset: -4 }, { code: 'PE', name: 'Peru', offset: -5 }, { code: 'PH', name: 'Philippines', offset: 8 }, { code: 'PL', name: 'Poland', offset: 1 }, { code: 'PT', name: 'Portugal', offset: 0 }, { code: 'QA', name: 'Qatar', offset: 3 }, { code: 'RO', name: 'Romania', offset: 2 }, { code: 'RU', name: 'Russia', offset: 3 }, { code: 'SA', name: 'Saudi Arabia', offset: 3 }, { code: 'SN', name: 'Senegal', offset: 0 }, { code: 'RS', name: 'Serbia', offset: 1 }, { code: 'SG', name: 'Singapore', offset: 8 }, { code: 'SK', name: 'Slovakia', offset: 1 }, { code: 'SI', name: 'Slovenia', offset: 1 }, { code: 'SO', name: 'Somalia', offset: 3 }, { code: 'ZA', name: 'South Africa', offset: 2 }, { code: 'ES', name: 'Spain', offset: 1 }, { code: 'LK', name: 'Sri Lanka', offset: 5.5 }, { code: 'SD', name: 'Sudan', offset: 2 }, { code: 'SE', name: 'Sweden', offset: 1 }, { code: 'CH', name: 'Switzerland', offset: 1 }, { code: 'SY', name: 'Syria', offset: 3 }, { code: 'TW', name: 'Taiwan', offset: 8 }, { code: 'TJ', name: 'Tajikistan', offset: 5 }, { code: 'TZ', name: 'Tanzania', offset: 3 }, { code: 'TH', name: 'Thailand', offset: 7 }, { code: 'TN', name: 'Tunisia', offset: 1 }, { code: 'TR', name: 'Turkey', offset: 3 }, { code: 'TM', name: 'Turkmenistan', offset: 5 }, { code: 'UG', name: 'Uganda', offset: 3 }, { code: 'UA', name: 'Ukraine', offset: 2 }, { code: 'AE', name: 'UAE', offset: 4 }, { code: 'GB', name: 'United Kingdom', offset: 0 }, { code: 'US', name: 'USA', offset: -5 }, { code: 'UY', name: 'Uruguay', offset: -3 }, { code: 'UZ', name: 'Uzbekistan', offset: 5 }, { code: 'VE', name: 'Venezuela', offset: -4 }, { code: 'VN', name: 'Vietnam', offset: 7 }, { code: 'YE', name: 'Yemen', offset: 3 }, { code: 'ZM', name: 'Zambia', offset: 2 }, { code: 'ZW', name: 'Zimbabwe', offset: 2 },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [startDate, setStartDate] = useState(localDateString());
  const [ustadMode, setUstadMode] = useState<'custom' | 'none'>('none');
  const [customName, setCustomName] = useState('');
  const [customTiming, setCustomTiming] = useState('');
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);
  const [customHour, setCustomHour] = useState('5');
  const [customMinute, setCustomMinute] = useState('00');
  const [customAmPm, setCustomAmPm] = useState<'am' | 'pm'>('pm');
  const [countryCode, setCountryCode] = useState('PK');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [priorMode, setPriorMode] = useState<'fresh' | 'prior'>('fresh');
  const [priorPagesInput, setPriorPagesInput] = useState('');
  const [selectedReciter, setSelectedReciter] = useState<ReciterId>('qahtani');
  const [playingReciter, setPlayingReciter] = useState<ReciterId | null>(null);
  const [addToCalendarOnboard, setAddToCalendarOnboard] = useState(false);

  const totalPages = 9;

  const next = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const back = () => setPage((p) => Math.max(p - 1, 0));

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    getUserSetting('reciter', 'qahtani').then((v) => {
      const recId = v === 'qatami' ? 'qahtani' : v;
      if (recId in RECITERS) setSelectedReciter(recId as ReciterId);
    });
    getUserSetting('addToCalendar', 'false').then((v) => setAddToCalendarOnboard(v === 'true'));
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      AudioService.stopAudio();
    };
  }, []);

  const previewReciter = async (id: ReciterId) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
    if (playingReciter === id) {
      await AudioService.stopAudio();
      setPlayingReciter(null);
      return;
    }
    setPlayingReciter(id);
    const url = AudioService.getAyahAudioUrl(1, 1, id);
    await AudioService.playAudio(url);
    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null;
      setPlayingReciter((cur) => {
        if (cur === id) AudioService.stopAudio();
        return cur === id ? null : cur;
      });
    }, 8000);
  };

  const finish = async () => {
    if (!isValidLocalDateString(startDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD');
      return;
    }
    let priorPages = 0;
    if (priorMode === 'prior') {
      priorPages = parseInt(priorPagesInput, 10);
      if (isNaN(priorPages) || priorPages < 1 || priorPages > 604) {
        Alert.alert('Invalid pages', 'Enter the page number you memorized up to (1-604)');
        return;
      }
    }
    await setUserSetting('hasSeenOnboarding', 'true');
    await setUserSetting('startDate', startDate);
    await setUserSetting('reciter', selectedReciter);
    const selectedMode = ustadMode === 'custom' && !customName.trim() ? 'none' : ustadMode;
    await setUserSetting('ustadMode', selectedMode);
    await setUserSetting('countryCode', countryCode);
    const cc = COUNTRIES.find((c) => c.code === countryCode);
    if (cc) await setUserSetting('countryName', cc.name);
    if (selectedMode !== 'none') {
      await setUserSetting('ustadSetDate', localDateString());
    }
    if (selectedMode === 'custom') {
      const useStructured = customWeekdays.length > 0;
      const timingToSave = useStructured ? `${customHour}:${customMinute} ${customAmPm}` : customTiming || '';
      await setUserSetting('ustadTeacher', customName || 'My Ustad');
      await setUserSetting('ustadTiming', timingToSave);
      await setUserSetting('ustadCustomWeekdays', JSON.stringify(customWeekdays));
      await setUserSetting('addToCalendar', String(addToCalendarOnboard));
      if (addToCalendarOnboard && useStructured && timingToSave) {
        await CalendarService.syncUstadSessions({
          teacherName: customName || 'My Ustad',
          time12h: `${customHour}:${customMinute} ${customAmPm}`,
          weekdays: customWeekdays,
        });
      } else {
        await CalendarService.removeUstadSessions();
      }
    } else {
      await setUserSetting('ustadTeacher', '');
      await setUserSetting('ustadTiming', '');
      await setUserSetting('ustadCustomWeekdays', '[]');
      await setUserSetting('addToCalendar', String(addToCalendarOnboard));
      await CalendarService.removeUstadSessions();
    }
    if (priorPages > 0) {
      const startDay = priorPages === 1 ? 2 : 2 * priorPages - 1;
      await setUserSetting('priorMemorizedPages', String(priorPages));
      for (let d = 1; d < startDay; d++) {
        await saveDailyProgress({ dayNumber: d, isComplete: 1, completedDate: startDate });
      }
    }
    router.replace('/(tabs)');
  };

  const skip = async () => {
    await setUserSetting('hasSeenOnboarding', 'true');
    await setUserSetting('ustadMode', 'none');
    await setUserSetting('ustadTeacher', '');
    await setUserSetting('ustadTiming', '');
    await setUserSetting('ustadCustomWeekdays', '[]');
    await setUserSetting('addToCalendar', 'false');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>Tikrar 0.5</Text>
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Animated.View key={i} layout={Layout.springify()} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>

        {page === 0 && (
          <View style={styles.card}>
            <Text style={styles.bismillah}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</Text>
            <Text style={styles.paraTitle}>In the Name of Allah, the Most Gracious, the Most Merciful</Text>
            <Text style={styles.para}>All praises are due to Allah, Lord of the worlds, and we send our blessings and salutations to the most noble of prophets and messengers.</Text>
            <Image source={require('../assets/images/splash-icon.png')} style={styles.heroImg} resizeMode="contain" />
            <Text style={styles.paraMuted}>A premium 1,206-day system from Tikrar.net, based in Madinah, on half-pages of the Quran.</Text>
            <View style={styles.creditBox}>
              <View style={styles.creditHeader}><Ionicons name="ribbon-outline" size={16} color={Theme.colors.accentGold} /><Text style={styles.creditTitle}>Credit and Contact</Text></View>
              <Text style={styles.creditText}>Tikrar program, Madinah. For more information contact Tikrar.net.</Text>
              <View style={styles.contactRow}><Ionicons name="call-outline" size={14} color={Theme.colors.accentGold} /><Text style={styles.contactText}>Men's Section: 00966508466544</Text></View>
              <View style={styles.contactRow}><Ionicons name="call-outline" size={14} color={Theme.colors.accentGold} /><Text style={styles.contactText}>Women's Section: 00966553332452</Text></View>
              <View style={styles.contactRow}><Ionicons name="globe-outline" size={14} color={Theme.colors.accentGold} /><Text style={styles.contactText}>www.Tikrar.net  •  Info@Tikrar.net</Text></View>
            </View>
            <View style={styles.mushafBox}>
              <Ionicons name="book-outline" size={18} color={Theme.colors.accentGold} />
              <Text style={styles.mushafText}>This app does not contain the Mushaf text. Please read from your physical Madinah Mushaf (Uthmani) as instructed in precondition 11.</Text>
            </View>
          </View>
        )}

        {page === 1 && (
          <View style={styles.card}>
            <View style={styles.iconCircle}><Ionicons name="heart" size={28} color={Theme.colors.accentGold} /></View>
            <Text style={styles.h1}>Welcome, O Memorizer of the Quran</Text>
            <Text style={styles.para}>We ask Allah to assist you in memorizing and perfecting the Quran.</Text>
            <Text style={styles.para}>Before we show you the steps of memorizing the Quran and perfecting it, we would like to mention and warn about a few points that are preconditions of memorizing.</Text>
            <View style={styles.callout}><Ionicons name="information-circle-outline" size={18} color={Theme.colors.accentGold} /><Text style={styles.calloutText}>Follow the program exactly, without adding or subtracting.</Text></View>
          </View>
        )}

        {page === 2 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Preconditions 1 to 10</Text>
            <Text style={styles.sub}>Keys to success before you begin. Take them as a covenant.</Text>
            {PRECONDITIONS_1_10.map((p) => (
              <View key={p.n} style={styles.pointRow}><Text style={styles.pointNum}>{p.n}.</Text><View style={styles.pointTextWrap}><Text style={styles.pointTitle}>{p.t}</Text><Text style={styles.pointDesc}>{p.d}</Text></View></View>
            ))}
          </View>
        )}

        {page === 3 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Preconditions 11 to 20</Text>
            <Text style={styles.sub}>Continue the covenant. These guard your hifz.</Text>
            {PRECONDITIONS_11_20.map((p) => (
              <View key={p.n} style={styles.pointRow}><Text style={styles.pointNum}>{p.n}.</Text><View style={styles.pointTextWrap}><Text style={styles.pointTitle}>{p.t}</Text><Text style={styles.pointDesc}>{p.d}</Text></View></View>
            ))}
          </View>
        )}

        {page === 4 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Definitions 1 to 3</Text>
            <Text style={styles.sub}>Six daily phases. First three build the new face.</Text>
            {DEFINITIONS_A.map((d) => (
              <View key={d.k} style={styles.defCard}><Text style={styles.defName}>{d.k}</Text><Text style={styles.defDesc}>{d.d}</Text></View>
            ))}
            <View style={styles.noteBox}><Text style={styles.noteText}>Half page h1 is first half, h2 second half. Days 1 to 2 are whole pages 1 and 2 per the source PDF.</Text></View>
          </View>
        )}

        {page === 5 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Definitions 4 to 7</Text>
            <Text style={styles.sub}>The three that perfect and preserve.</Text>
            {DEFINITIONS_B.map((d) => (
              <View key={d.k} style={styles.defCard}><Text style={styles.defName}>{d.k}</Text><Text style={styles.defDesc}>{d.d}</Text></View>
            ))}
            <View style={styles.twoCol}>
              <View style={styles.miniCard}><Ionicons name="time-outline" size={20} color={Theme.colors.accentGold} /><Text style={styles.miniTitle}>Timing</Text><Text style={styles.miniDesc}>Half page 30 to 60 sec, full page 60 to 90 sec with al-Hadr.</Text></View>
              <View style={styles.miniCard}><Ionicons name="calendar-outline" size={20} color={Theme.colors.accentGold} /><Text style={styles.miniTitle}>Window</Text><Text style={styles.miniDesc}>Complete daily portion from Fajr to next Fajr.</Text></View>
            </View>
          </View>
        )}

        {page === 6 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Who is your Ustad?</Text>
            <Text style={styles.sub}>Optional. Set up your weekly recitation sessions now, or do it later in Settings.</Text>

            <View style={styles.fieldLabelRow}>
              <Ionicons name="globe-outline" size={13} color={Theme.colors.accentGold} />
              <Text style={styles.fieldLabel}>Country / Profile</Text>
            </View>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCountryDropdown(!showCountryDropdown)} activeOpacity={0.7}>
              <Text style={styles.dropdownBtnText}>{COUNTRIES.find((c) => c.code === countryCode)?.name}</Text>
              <Ionicons name={showCountryDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
            {showCountryDropdown && (
              <View style={styles.dropdownList}>
                <View style={styles.dropdownSearchRow}>
                  <Ionicons name="search-outline" size={16} color={Theme.colors.textMuted} />
                  <TextInput style={styles.dropdownSearchInput} value={countrySearch} onChangeText={setCountrySearch} placeholder="Search country..." placeholderTextColor={Theme.colors.textMuted} autoFocus />
                </View>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                    <TouchableOpacity key={c.code} style={[styles.dropdownItem, countryCode === c.code && styles.dropdownItemActive]} onPress={() => { setCountryCode(c.code); setShowCountryDropdown(false); setCountrySearch(''); }}>
                      <Text style={[styles.dropdownItemText, countryCode === c.code && styles.dropdownItemTextActive]}>{c.name}</Text>
                      <Text style={styles.dropdownItemOffset}>UTC{c.offset >= 0 ? '+' : ''}{c.offset}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity style={[styles.ustadCardEnhanced, ustadMode === 'custom' && styles.ustadCardActive]} onPress={() => setUstadMode('custom')} activeOpacity={0.7}>
              <View style={styles.cardIconBadge}><Ionicons name="person-add-outline" size={20} color={Theme.colors.accentGold} /></View>
              <View style={styles.ustadHeaderEnhanced}>
                <Text style={styles.ustadTitleEnhanced}>Add your Ustad</Text>
                {ustadMode === 'custom' && <Ionicons name="checkmark-circle" size={22} color={Theme.colors.accentGold} />}
              </View>
              <Text style={styles.ustadSubEnhanced}>Your personal teacher for recitation. Pick the session days, set the time, and optionally add them to your calendar.</Text>

              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={13} color={Theme.colors.accentGold} />
                <Text style={styles.fieldLabel}>Teacher name</Text>
              </View>
              <TextInput style={styles.input} value={customName} onChangeText={(v) => { setCustomName(v); setUstadMode('custom'); }} placeholder="e.g. Sheikh Ahmad" placeholderTextColor={Theme.colors.textMuted} />

              <View style={styles.fieldLabelRow}>
                <Ionicons name="calendar-number-outline" size={13} color={Theme.colors.accentGold} />
                <Text style={styles.fieldLabel}>Session days</Text>
              </View>
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((lbl, idx) => {
                  const selected = customWeekdays.includes(idx);
                  return (
                    <TouchableOpacity key={lbl} style={[styles.weekdayChip, selected && styles.weekdayChipActive]} onPress={() => { setUstadMode('custom'); setCustomWeekdays((prev) => (prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort((a, b) => a - b))); }}>
                      <Text style={[styles.weekdayChipText, selected && styles.weekdayChipTextActive]}>{lbl}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.fieldLabelRow}>
                <Ionicons name="time-outline" size={13} color={Theme.colors.accentGold} />
                <Text style={styles.fieldLabel}>Start time</Text>
              </View>
              <View style={styles.pickerGroup}>
                <View style={styles.timePickerRow}>
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map((h) => (
                    <TouchableOpacity key={h} style={[styles.timeChip, customHour === h && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomHour(h); }}>
                      <Text style={[styles.timeChipText, customHour === h && styles.timeChipTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.timePickerRow}>
                  {['00','15','30','45'].map((m) => (
                    <TouchableOpacity key={m} style={[styles.timeChip, customMinute === m && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomMinute(m); }}>
                      <Text style={[styles.timeChipText, customMinute === m && styles.timeChipTextActive]}>:{m}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={styles.timeAmPmGroup}>
                    {(['am','pm'] as const).map((ap) => (
                      <TouchableOpacity key={ap} style={[styles.timeChip, customAmPm === ap && styles.timeChipActive]} onPress={() => { setUstadMode('custom'); setCustomAmPm(ap); }}>
                        <Text style={[styles.timeChipText, customAmPm === ap && styles.timeChipTextActive]}>{ap.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.summaryStrip}>
                <Ionicons name="sparkles-outline" size={14} color={Theme.colors.accentGold} />
                <Text style={styles.summaryText}>
                  {customName.trim() || 'Your Ustad'} • {customHour}:{customMinute} {customAmPm} • {customWeekdays.length ? customWeekdays.map((d) => WEEKDAY_LABELS[d]).join(', ') : 'pick days'}
                </Text>
              </View>

              <View style={styles.calendarRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calendarLabel}>Add sessions to calendar</Text>
                  <Text style={styles.calendarHint}>Creates recurring weekly events so you never miss a session.</Text>
                </View>
                <Switch value={addToCalendarOnboard} onValueChange={setAddToCalendarOnboard} trackColor={{ false: Theme.colors.border, true: Theme.colors.accentGold }} thumbColor={addToCalendarOnboard ? '#FFF' : '#888'} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipUstadBtn}
              onPress={() => {
                setUstadMode('none');
                next();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward-circle-outline" size={17} color={Theme.colors.textSecondary} />
              <Text style={styles.skipUstadText}>Choose an Ustad later</Text>
            </TouchableOpacity>
          </View>
        )}

        {page === 7 && (
          <View style={styles.card}>
            <View style={styles.iconCircle}><Ionicons name="rocket-outline" size={28} color={Theme.colors.accentGold} /></View>
            <Text style={styles.h1}>Ready to begin?</Text>
            <Text style={styles.para}>Your schedule has 1,206 days, 604 pages as 1,206 half-faces, Tour system for revision every 6 days, and 30-day Rabt connection.</Text>

            <Text style={styles.label}>Have you memorized any portion of the Quran before?</Text>
            <View style={styles.priorRow}>
              <TouchableOpacity style={[styles.priorBtn, priorMode === 'fresh' && styles.priorBtnActive]} onPress={() => setPriorMode('fresh')}>
                <Ionicons name="flag-outline" size={16} color={priorMode === 'fresh' ? Theme.colors.bgDark : Theme.colors.textSecondary} />
                <Text style={[styles.priorBtnText, priorMode === 'fresh' && styles.priorBtnTextActive]}>No, starting fresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.priorBtn, priorMode === 'prior' && styles.priorBtnActive]} onPress={() => setPriorMode('prior')}>
                <Ionicons name="book-outline" size={16} color={priorMode === 'prior' ? Theme.colors.bgDark : Theme.colors.textSecondary} />
                <Text style={[styles.priorBtnText, priorMode === 'prior' && styles.priorBtnTextActive]}>Yes, I have</Text>
              </TouchableOpacity>
            </View>
            {priorMode === 'prior' && (
              <>
                <TextInput
                  style={styles.input}
                  value={priorPagesInput}
                  onChangeText={(v) => setPriorPagesInput(v.replace(/[^0-9]/g, ''))}
                  placeholder="I have memorized up to page (1-604)"
                  placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.hint}>
                  {(() => {
                    const p = parseInt(priorPagesInput, 10);
                    if (isNaN(p) || p < 1 || p > 604) return 'Enter the page you memorized up to. Everything before it is marked done.';
                    const startDay = p === 1 ? 2 : 2 * p - 1;
                    const face = formatFace(faceOrdinalForDay(Math.min(startDay, 1206)));
                    return `You will continue from Day ${startDay} — Face ${face}. Days 1 to ${startDay - 1} will be marked complete.`;
                  })()}
                </Text>
              </>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statNum}>1,206</Text><Text style={styles.statLbl}>Days</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>6</Text><Text style={styles.statLbl}>Phases</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>604</Text><Text style={styles.statLbl}>Pages</Text></View>
            </View>
            <Text style={styles.label}>Program start date</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={Theme.colors.textMuted} />
            <Text style={styles.hint}>Kept as a record. Your next face is decided by what you complete, not the calendar.</Text>
            <Image source={require('../assets/images/icon.png')} style={styles.smallLogo} resizeMode="contain" />
          </View>
        )}

        {page === 8 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Beautifying Your Voice</Text>
            <Text style={[styles.para, { textAlign: 'left' }]}>{BEAUTIFYING_VOICE_TEXT}</Text>

            <Text style={[styles.h2, { marginTop: Theme.spacing.lg }]}>Choose Your Reciter</Text>
            <Text style={styles.sub}>Tap play for a preview, tap the name to choose. Level 1 is the monotone tajwid foundation. Move up when you can recite similarly.</Text>

            {[1,2,3,4].map((lvl) => (
              <View key={lvl} style={{ marginTop: Theme.spacing.md }}>
                <Text style={styles.reciterLevelLabel}>Level {lvl} {lvl===1 ? '• Tajwid foundation' : lvl===2 ? '• Repetitive tone' : lvl===3 ? '• Advanced uniqueness' : '• With meaning, hardest'}</Text>
                {Object.values(RECITERS).filter((r: any) => r.level === lvl).map((r: any) => {
                  const isSelected = selectedReciter === r.id;
                  const isPlaying = playingReciter === r.id;
                  return (
                    <View key={r.id} style={[styles.reciterRow, isSelected && styles.reciterRowSelected]}>
                      <TouchableOpacity
                        style={[styles.reciterPlayBtn, isPlaying && styles.reciterPlayBtnActive]}
                        onPress={() => previewReciter(r.id as ReciterId)}
                      >
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? Theme.colors.bgDark : Theme.colors.accentGold} />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedReciter(r.id as ReciterId)}>
                        <Text style={[styles.reciterName, isSelected && styles.reciterNameSelected]}>{r.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedReciter(r.id as ReciterId)}>
                        <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={18} color={Theme.colors.accentGold} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.navRow}>
          {page > 0 ? (
            <PressableScale style={styles.navBtnGhost} onPress={back}><Ionicons name="chevron-back" size={18} color={Theme.colors.textPrimary} /><Text style={styles.navGhostText}>Back</Text></PressableScale>
          ) : <View style={{ flex: 1 }} />}
          {page < totalPages - 1 ? (
            <PressableScale style={styles.navBtn} onPress={next}><Text style={styles.navBtnText}>Next</Text><Ionicons name="chevron-forward" size={18} color={Theme.colors.bgDark} /></PressableScale>
          ) : (
            <PressableScale style={styles.navBtn} onPress={finish}><Text style={styles.navBtnText}>Begin Journey</Text><Ionicons name="checkmark-circle" size={18} color={Theme.colors.bgDark} /></PressableScale>
          )}
        </View>

        <View style={styles.footer}><Text style={styles.footerText}>Tikrar.net • Info@Tikrar.net • Madinah</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.bgDark },
  scroll: { padding: Theme.spacing.md, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Theme.spacing.sm },
  logo: { width: 36, height: 36, borderRadius: 8 },
  brand: { flex: 1, color: Theme.colors.accentGold, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  skipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Theme.colors.border },
  skipText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: Theme.spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.border },
  dotActive: { backgroundColor: Theme.colors.accentGold, width: 20 },
  card: { backgroundColor: Theme.colors.bgCard, borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.lg, borderWidth: 1, borderColor: Theme.colors.border, marginTop: Theme.spacing.sm },
  bismillah: { color: Theme.colors.accentGold, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  paraTitle: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  para: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: Theme.spacing.sm, textAlign: 'center' },
  paraMuted: { color: Theme.colors.textMuted, fontSize: 12, marginTop: Theme.spacing.sm, textAlign: 'center' },
  heroImg: { width: '100%', height: 120, marginTop: Theme.spacing.md, opacity: 0.9 },
  creditBox: { backgroundColor: 'rgba(212,168,67,0.08)', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginTop: Theme.spacing.md },
  creditHeader: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  creditTitle: { color: Theme.colors.accentGold, fontSize: 13, fontWeight: '800' },
  creditText: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  contactRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  contactText: { color: Theme.colors.textPrimary, fontSize: 12, fontWeight: '600' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.accentGoldMuted, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  h1: { color: Theme.colors.textPrimary, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: Theme.spacing.md },
  h2: { color: Theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sub: { color: Theme.colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: Theme.spacing.sm },
  callout: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(212,168,67,0.08)', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, padding: Theme.spacing.sm, borderRadius: Theme.borderRadius.md, marginTop: Theme.spacing.md, alignItems: 'center' },
  calloutText: { color: Theme.colors.accentGold, fontSize: 12, flex: 1, fontWeight: '600' },
  pointRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  pointNum: { color: Theme.colors.accentGold, fontSize: 13, fontWeight: '800', width: 22 },
  pointTextWrap: { flex: 1 },
  pointTitle: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  pointDesc: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 2 },
  defCard: { backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginTop: 10 },
  defName: { color: Theme.colors.accentGold, fontSize: 13, fontWeight: '800' },
  defDesc: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 },
  noteBox: { backgroundColor: 'rgba(255,255,255,0.04)', padding: Theme.spacing.sm, borderRadius: Theme.borderRadius.md, marginTop: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  noteText: { color: Theme.colors.textMuted, fontSize: 11, textAlign: 'center' },
  twoCol: { flexDirection: 'row', gap: 8, marginTop: Theme.spacing.md },
  miniCard: { flex: 1, backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center' },
  miniTitle: { color: Theme.colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 6 },
  miniDesc: { color: Theme.colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  ustadCard: { backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, marginTop: 12 },
  ustadCardActive: { borderColor: Theme.colors.accentGold, backgroundColor: 'rgba(212,168,67,0.08)' },
  skipUstadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 10, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  skipUstadText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  ustadHeader: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  ustadTitle: { flex: 1, color: Theme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  ustadSub: { color: Theme.colors.textSecondary, fontSize: 12, marginBottom: 8 },
  countryPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border },
  countryPillActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  countryPillText: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  countryPillTextActive: { color: Theme.colors.accentGold },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(10,22,40,0.6)', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 12 },
  dropdownBtnText: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '600' },
  dropdownList: { backgroundColor: Theme.colors.bgCard, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.md, marginTop: 6, overflow: 'hidden' },
  dropdownSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Theme.spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  dropdownSearchInput: { flex: 1, color: Theme.colors.textPrimary, fontSize: 13 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dropdownItemActive: { backgroundColor: Theme.colors.accentGoldMuted },
  dropdownItemText: { color: Theme.colors.textSecondary, fontSize: 13 },
  dropdownItemTextActive: { color: Theme.colors.accentGold, fontWeight: '700' },
  dropdownItemOffset: { color: Theme.colors.textMuted, fontSize: 11 },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  weekdayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  weekdayChipActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  weekdayChipText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  weekdayChipTextActive: { color: Theme.colors.accentGold },
  timePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  timeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  timeChipActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGold },
  timeChipText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  timeChipTextActive: { color: Theme.colors.accentGold },
  timeAmPmGroup: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  teacherRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 6, paddingHorizontal: 8, borderRadius: Theme.borderRadius.sm, marginTop: 4, borderWidth: 1, borderColor: 'transparent' },
  teacherRowActive: { backgroundColor: Theme.colors.accentGoldMuted, borderColor: Theme.colors.accentGoldBorder },
  teacherName: { color: Theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  teacherTime: { color: Theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: Theme.spacing.md },
  stat: { flex: 1, backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  statNum: { color: Theme.colors.accentGold, fontSize: 18, fontWeight: '900' },
  statLbl: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  label: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: Theme.spacing.md },
  input: { backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 10, color: Theme.colors.textPrimary, borderWidth: 1, borderColor: Theme.colors.border, marginTop: 6, fontSize: 14 },
  hint: { color: Theme.colors.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
  smallLogo: { width: 48, height: 48, alignSelf: 'center', marginTop: Theme.spacing.md, opacity: 0.9 },
  priorRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  priorBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'rgba(10,22,40,0.6)' },
  priorBtnActive: { backgroundColor: Theme.colors.accentGold, borderColor: Theme.colors.accentGold },
  priorBtnText: { color: Theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  priorBtnTextActive: { color: Theme.colors.bgDark },
  mushafBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginTop: Theme.spacing.md, alignItems: 'flex-start' },
  mushafText: { flex: 1, color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: Theme.spacing.lg, alignItems: 'center' },
  navBtnGhost: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  navGhostText: { color: Theme.colors.textPrimary, fontWeight: '700' },
  navBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: Theme.colors.accentGold, paddingVertical: 14, borderRadius: Theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { color: Theme.colors.bgDark, fontWeight: '800' },
  footer: { alignItems: 'center', marginTop: Theme.spacing.md },
  footerText: { color: Theme.colors.textMuted, fontSize: 11 },
  ustadCardEnhanced: { backgroundColor: 'rgba(10,22,40,0.7)', borderRadius: Theme.borderRadius.lg, padding: Theme.spacing.lg, borderWidth: 1.5, borderColor: Theme.colors.accentGoldBorder, marginTop: 12 },
  cardIconBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.accentGoldMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder, marginBottom: 10 },
  ustadHeaderEnhanced: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 },
  ustadTitleEnhanced: { flex: 1, color: Theme.colors.textPrimary, fontSize: 16, fontWeight: '900' },
  ustadSubEnhanced: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Theme.spacing.md, marginBottom: 6 },
  fieldLabel: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '800' },
  pickerGroup: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  summaryStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: 8, marginTop: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  summaryText: { flex: 1, color: Theme.colors.textPrimary, fontSize: 11, fontWeight: '700' },
  calendarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Theme.spacing.md, paddingTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  calendarLabel: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  calendarHint: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  reciterLevelLabel: { color: Theme.colors.accentGold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  reciterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(10,22,40,0.6)', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 6 },
  reciterRowSelected: { borderColor: Theme.colors.accentGold, backgroundColor: 'rgba(212,168,67,0.12)' },
  reciterPlayBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212,168,67,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.accentGoldBorder },
  reciterPlayBtnActive: { backgroundColor: Theme.colors.accentGold },
  reciterName: { flex: 1, color: Theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  reciterNameSelected: { color: Theme.colors.textPrimary, fontWeight: '800' },
});
