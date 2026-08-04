import { SURAH_LIST } from './surah-metadata';

export interface TafseerEntry {
  surahNumber: number;
  surahName: string;
  summary: string;
  keyThemes: string[];
}

type SaadiEntry = Omit<TafseerEntry, 'surahNumber'>;

const TAFSEER_SAADI: Record<number, SaadiEntry> = {
  1: {
    surahName: "Al-Fatihah (The Opening)",
    summary: "In the name of Allah, the Most Gracious, the Most Merciful. Praise be to Allah, the Lord of all creation. This fundamental surah contains praising Allah, acknowledging His complete lordship and mercy, declaring worship for Him alone, and asking for guidance to the straight path.",
    keyThemes: ["Praise and Worship of Allah Alone", "The Straight Path (As-Sirat Al-Mustaqim)", "Divine Mercy and Judgment"]
  },
  2: {
    surahName: "Al-Baqarah (The Cow)",
    summary: "Tafseer As-Sa'di emphasizes that Al-Baqarah outlines the foundational creed (Eeman), laws of worship, social ethics, financial integrity, and lessons from previous nations (such as Bani Israel). It establishes guidance for the God-fearing.",
    keyThemes: ["Guidance for the Muttaqin", "Story of Adam and Bani Israel", "Ayat Al-Kursi & Laws of Justice"]
  },
  3: {
    surahName: "Al-Imran (Family of Imran)",
    summary: "Focuses on firm faith in divine revelation, defending pure monotheism (Tawheed), lessons from the Battle of Uhud, steadfastness in trials, and unity among believers.",
    keyThemes: ["Tawheed and Refutation of Shirk", "Patience & Perseverance", "Lessons from Uhud"]
  },
  4: {
    surahName: "An-Nisa (The Women)",
    summary: "Outlines laws protecting orphans, women's rights, inheritance, social harmony, justice in leadership, and warnings against hypocrites.",
    keyThemes: ["Justice & Rights of the Weak", "Inheritance Rules", "Obedience to Allah and His Messenger"]
  },
  5: {
    surahName: "Al-Ma'idah (The Table Spread)",
    summary: "Highlights fulfilling covenants, lawful foods, purity for prayer, justice even with enemies, and the perfection of Islam as a complete way of life.",
    keyThemes: ["Fulfilling Covenants", "Halal & Haram Standards", "Perfection of the Deen"]
  },
  6: {
    surahName: "Al-An'am (The Cattle)",
    summary: "Establishes Tawheed in Allah's lordship, worship and perfect attributes; refutes shirk and false beliefs of the disbelievers; and explains Allah's creation of the heavens and earth as proof of His oneness.",
    keyThemes: ["Establishing Pure Tawheed", "Refutation of Shirk", "Signs of Allah in Creation"]
  },
  7: {
    surahName: "Al-A'raf (The Heights)",
    summary: "Contains the story of Adam's creation, the dialogue between the people of Paradise and Hell, and repeated warnings to follow revelation and abandon sin. Sa'di highlights the 'heights' as those whose good and bad deeds balance, awaiting Allah's decision.",
    keyThemes: ["Story of Adam and Iblis", "The People of the Heights", "Following Revelation over Desires"]
  },
  8: {
    surahName: "Al-Anfal (The Spoils of War)",
    summary: "Addresses the spoils of Badr, obedience to Allah and His Messenger, unity of the believers, patience in battle, and gratitude for Allah's help and victory.",
    keyThemes: ["Lesson of Badr", "Obedience and Unity", "Trust in Allah's Help"]
  },
  9: {
    surahName: "At-Tawbah (The Repentance)",
    summary: "The only surah without basmalah; it clarifies disavowal of the polytheists, the obligation of Jihad, the virtue of the Muhajirun and Ansar, and sincere repentance which wipes out previous sins.",
    keyThemes: ["Sincerity of Repentance", "Jihad and Sacrifice", "Exposing Hypocrisy"]
  },
  10: {
    surahName: "Yunus (Jonah)",
    summary: "Establishes the Qur'an as Allah's revelation, calls to monotheism, tells of Prophet Yunus and his people's delayed faith, and gives glad tidings to the believers while warning the deniers.",
    keyThemes: ["The Qur'an is Revelation", "Story of Yunus", "Patience in Da'wah"]
  },
  11: {
    surahName: "Hud",
    summary: "Consoles the Prophet with the stories of Nuh, Hud, Salih, Ibrahim, Lut, Shu'ayb and Musa; establishes that punishment comes for arrogance and transgression while steadfastness upon the truth is rewarded.",
    keyThemes: ["Stories of the Prophets", "Steadfastness on Truth", "Divine Justice"]
  },
  12: {
    surahName: "Yusuf (Joseph)",
    summary: "The most beautiful of stories: Yusuf's dream, his brothers' envy, his patience in trial, his chastity in temptation, and his eventual elevation. Sa'di highlights the perfection of patience and reliance on Allah in every affair.",
    keyThemes: ["Patience in Trials", "Chastity and Purity", "Allah's Decree Prevails"]
  },
  13: {
    surahName: "Ar-Ra'd (The Thunder)",
    summary: "Affirms the Qur'an's truthfulness, Allah's knowledge of the unseen, thunder praising His glory, the parable of truth and falsehood, and the change that comes only through the people changing themselves.",
    keyThemes: ["Parable of Truth and Falsehood", "Thunder Glorifies Allah", "Change Comes from Within"]
  },
  14: {
    surahName: "Ibrahim (Abraham)",
    summary: "Centers on gratitude, the call of Prophet Ibrahim and his supplication for Makkah, the parable of the good tree, and the recompense of the grateful and the ungrateful.",
    keyThemes: ["Gratitude to Allah", "Ibrahim's Supplication", "The Good Word is a Good Tree"]
  },
  15: {
    surahName: "Al-Hijr (The Rocky Tract)",
    summary: "Guards the remembrance of the Qur'an, recounts the people of Al-Hijr destroyed for rejecting their prophet, and consoles the Messenger that the deniers' plots are futile.",
    keyThemes: ["The Qur'an is Guarded", "Destruction of the Deniers", "Consolation for the Prophet"]
  },
  16: {
    surahName: "An-Nahl (The Bee)",
    summary: "Counts Allah's countless blessings: the bee, rain, cattle, and guidance; refutes shirk; commands justice, kindness and fulfilling promises; and clarifies that reward is full for the patient.",
    keyThemes: ["Allah's Countless Blessings", "The Bee Receives Revelation", "Justice and Kindness"]
  },
  17: {
    surahName: "Al-Isra (The Night Journey)",
    summary: "Opens with the miraculous journey to the farthest mosque, then commands honoring parents, fulfilling pledges, and warns against extravagance and killing; includes the wisdom behind revelation's gradual descent.",
    keyThemes: ["The Night Journey", "Rights of Parents", "Wisdom of Gradual Revelation"]
  },
  18: {
    surahName: "Al-Kahf (The Cave)",
    summary: "Contains four great stories: the people of the cave, the owner of two gardens, Musa and Al-Khidr, and Dhul-Qarnayn. Sa'di draws lessons of faith, humility, patience in seeking knowledge, and the reality of worldly life.",
    keyThemes: ["The People of the Cave", "Musa and Al-Khidr", "The Reality of Worldly Life"]
  },
  19: {
    surahName: "Maryam (Mary)",
    summary: "Narrates the stories of Zakariyya, Yahya, Maryam and Isa, Ibrahim, and other prophets; establishes Allah's mercy, the rejection of calling Allah with children, and the intercession that comes only with His permission.",
    keyThemes: ["Story of Maryam and Isa", "Mercy of Allah", "Refuting the Claim of a Son"]
  },
  20: {
    surahName: "Ta-Ha",
    summary: "Comforts the Prophet, tells the story of Musa from his calling to his confrontation with Pharaoh and the magicians, and shows that those who turn away from the reminder will have a straitened life.",
    keyThemes: ["Story of Musa", "The Quran is a Reminder", "Turning Away from Reminder"]
  },
  21: {
    surahName: "Al-Anbiya (The Prophets)",
    summary: "Surveys many prophets and their struggles, affirms that they were human messengers, refutes the claim that Allah has a son, and declares that the creation of heaven and earth was not in play.",
    keyThemes: ["The Prophets were Human", "Struggle of the Messengers", "Creation not in Play"]
  },
  22: {
    surahName: "Al-Hajj (The Pilgrimage)",
    summary: "Warns of the Hour with its terrors, commands the rites of Hajj and its wisdom, defends those expelled from their homes for saying 'Our Lord is Allah', and distinguishes the believers and the humble from the arrogant.",
    keyThemes: ["Terrors of the Hour", "Wisdom of Hajj", "Permission for the Oppressed to Fight"]
  },
  23: {
    surahName: "Al-Mu'minun (The Believers)",
    summary: "Opens with the traits of the successful believers — humility in prayer, guarding the tongue and chastity, and honesty in trusts — then follows the line of messengers from Nuh to Isa and the reckoning of all.",
    keyThemes: ["Traits of Successful Believers", "Line of the Messengers", "The Reckoning is Certain"]
  },
  24: {
    surahName: "An-Nur (The Light)",
    summary: "Contains the law of adultery punishment and accusation, the command of modesty and lowering gaze, the famous Ayat an-Nur about Allah's light, and the etiquette of entering homes and the Prophet's household.",
    keyThemes: ["Ayat an-Nur", "Modesty and Guarding the Gaze", "Etiquette and Chastity"]
  },
  25: {
    surahName: "Al-Furqan (The Criterion)",
    summary: "Describes the Qur'an as the Criterion separating truth from falsehood, refutes the disbelievers' objections against revelation and resurrection, and portrays the servants of Ar-Rahman with their noble traits.",
    keyThemes: ["The Criterion of Truth", "Refuting the Deniers", "Servants of Ar-Rahman"]
  },
  26: {
    surahName: "Ash-Shu'ara (The Poets)",
    summary: "Recounts Musa, Ibrahim, Nuh, Hud, Salih, Lut and Shu'ayb warning their peoples, ends with the refutation of the poets' claims that the Prophet was a poet, and affirms the Quran's descent with a clear spirit.",
    keyThemes: ["Warnings of the Prophets", "The Quran is not Poetry", "The Clear Spirit Descends"]
  },
  27: {
    surahName: "An-Naml (The Ant)",
    summary: "Contains the story of Sulayman and the ant, the hoopoe and Bilqis' conversion, the miracles of Saleh's she-camel and Musa's staff, and ends affirming that every affair is with Allah and every being will be resurrected.",
    keyThemes: ["Sulayman and the Ant", "Story of Bilqis", "The Hour Approaches"]
  },
  28: {
    surahName: "Al-Qasas (The Stories)",
    summary: "Tells the full story of Musa from the basket to prophethood and the exodus, the fate of Qarun with his treasure, and explains that the abode of the Hereafter is for those who do not desire exaltation in the land.",
    keyThemes: ["Story of Musa Complete", "Fate of Qarun", "The Final Abode"]
  },
  29: {
    surahName: "Al-Ankabut (The Spider)",
    summary: "States that people will be tested, likens those who take protectors besides Allah to the spider's fragile web, and mentions hijrah and striving; the believers' reward is multiplied for their patience.",
    keyThemes: ["Certainty of Testing", "The Spider's Frail Web", "Hijrah and Striving"]
  },
  30: {
    surahName: "Ar-Rum (The Romans)",
    summary: "Foretells the Romans' victory after defeat, points to Allah's signs in creation and the soul, commands patience in spreading faith, and affirms that goodness is for those who believe and do right.",
    keyThemes: ["Prophecy of Rome's Victory", "Signs of Allah", "Patience in Da'wah"]
  },
  31: {
    surahName: "Luqman",
    summary: "Presents Luqman's wise counsel to his son: worship Allah alone, honor parents, guard the prayer, enjoin good, be moderate in walk and speech — the perfect household etiquette of the believer.",
    keyThemes: ["Luqman's Advice to His Son", "Honoring Parents", "Moderation in Conduct"]
  },
  32: {
    surahName: "As-Sajdah (The Prostration)",
    summary: "Affirms the Quran's revelation, the creation of man and the resurrection, and describes those who prostrate, glorify and thank Allah; the believers are promised gardens of refuge.",
    keyThemes: ["Revelation and Creation", "The Prostration of the Believers", "Gardens of Refuge"]
  },
  33: {
    surahName: "Al-Ahzab (The Combined Forces)",
    summary: "Narrates the battle of the Trench and the believers' steadfastness, clarifies rulings of marriage and hijab, and establishes the Prophet's high rank as the most perfect example.",
    keyThemes: ["Battle of the Trench", "Rulings of Hijab and Marriage", "The Prophet as the Perfect Example"]
  },
  34: {
    surahName: "Saba",
    summary: "Contains the story of the people of Saba destroyed by the flood of the dam for their ingratitude, the honesty of Dawood and Sulayman, and the affirmation that provision and destiny are from Allah alone.",
    keyThemes: ["The Dam of Saba", "Dawood and Sulayman", "Provision is from Allah"]
  },
  35: {
    surahName: "Fatir (The Originator)",
    summary: "Highlights Allah's power in creation, the angels carrying His commands, the honor of the one who purifies himself, and the firm word; those who recite and reflect are promised forgiveness and a great reward.",
    keyThemes: ["Angels and Creation", "Purification of the Soul", "Reward of Reflection"]
  },
  36: {
    surahName: "Ya-Sin",
    summary: "The heart of the Qur'an: the truth of the Messenger, the story of the people of the city and the faithful man, Allah's signs in nature, and the resurrection and the Day of Reckoning.",
    keyThemes: ["Truth of the Messengers", "The Faithful Man of the City", "Resurrection and Reckoning"]
  },
  37: {
    surahName: "As-Saffat (Those who set the Ranks)",
    summary: "Describes the angels standing in ranks, the final victory over the devils, and the stories of Nuh, Ibrahim and his sacrifice, Musa, Harun, Ilyas, Lut and Yunus; paradise and its delights are promised to the sincere.",
    keyThemes: ["The Ranks of Angels", "Story of Ibrahim's Sacrifice", "Destruction of the Evildoers"]
  },
  38: {
    surahName: "Sad",
    summary: "Opens with the oath of the Qur'an, tells of Dawood's judgment and repentance, Sulayman's trial, Ayyub's patience, and the debate of the disputants; the Qur'an is a reminder for those of understanding.",
    keyThemes: ["Dawood's Repentance", "Patience of Ayyub", "The Qur'an is a Reminder"]
  },
  39: {
    surahName: "Az-Zumar (The Troops)",
    summary: "Commands sincerity of worship, gives the parable of the two men — the servant shared and the free servant — and describes the troops entering paradise and the troops entering the fire, then repentance before punishment.",
    keyThemes: ["Sincerity of Worship", "Parable of the Two Servants", "The Troops of Paradise and Fire"]
  },
  40: {
    surahName: "Ghafir (The Forgiver)",
    summary: "Affirms that the angels carry the Throne seeking forgiveness for the believers, tells of the believer of Pharaoh's household calling to Allah, and warns that the plots of the tyrants are in vain.",
    keyThemes: ["Angels Seek Forgiveness", "The Believer of Pharaoh's Family", "Plots of Tyrants Fail"]
  },
  41: {
    surahName: "Fussilat (Explained in Detail)",
    summary: "Describes the Qur'an as explained in detail, the witnessing of the skin and limbs on the Day of Judgment, and the call of the two groups: the devotees of Ar-Rahman and the enemies of the truth.",
    keyThemes: ["The Book Explained in Detail", "Witnessing of the Limbs", "Worshipers of Ar-Rahman"]
  },
  42: {
    surahName: "Ash-Shura (The Consultation)",
    summary: "Clarifies that Allah's revelation descends to the Prophet as it did to those before him, describes the believers' affairs as consultation, and calls to forgiveness and returning evil with good.",
    keyThemes: ["Revelation is One", "Consultation among Believers", "Returning Evil with Good"]
  },
  43: {
    surahName: "Az-Zukhruf (The Ornaments of Gold)",
    summary: "Refutes the claim that angels are daughters of Allah, mocks the disbelievers' excuse that they found their fathers upon a religion, and tells of Ibrahim's disavowal of his people's gods; ends with Musa's warning and the like of it for Quraysh.",
    keyThemes: ["Refuting False Gods", "Following Forefathers Blinds", "The Call of Ibrahim"]
  },
  44: {
    surahName: "Ad-Dukhan (The Smoke)",
    summary: "Swears by the clear Book that it descended on a blessed night, warns of the day of the smoke and the punishment of the deniers, and recounts Musa's exodus and the people of Tubba'.",
    keyThemes: ["The Blessed Night", "The Day of Smoke", "Punishment of the Deniers"]
  },
  45: {
    surahName: "Al-Jathiyah (The Kneeling)",
    summary: "Points to Allah's signs in the heavens, earth, rain and guidance, warns of the day every nation kneels, and consoles that the deniers' mockery returns upon themselves.",
    keyThemes: ["Signs of Allah", "The Day of Kneeling", "Mockery Returns to the Mocker"]
  },
  46: {
    surahName: "Al-Ahqaf (The Wind-Curved Sandhills)",
    summary: "Tells of Hud and the destruction of the people of 'Ad with the wind, commands kindness to parents and the dua of the righteous child, and tells of the Jinn listening to the Qur'an and accepting faith.",
    keyThemes: ["Destruction of 'Ad", "Kindness to Parents", "The Jinn Accept Faith"]
  },
  47: {
    surahName: "Muhammad",
    summary: "Clarifies the deeds of the believers are nullified for those who disbelieve and turn away, encourages striving in Allah's cause, and promises paradise to the righteous; the forgiveness of sins is for the believers who follow guidance.",
    keyThemes: ["Nullification of Deeds", "Command of Striving", "Paradise of the Righteous"]
  },
  48: {
    surahName: "Al-Fath (The Victory)",
    summary: "Announces the clear victory of Hudaybiyyah, the pledge of Ridwan under the tree, the mercy and tranquility sent into the believers' hearts, and the promise of abundant spoils.",
    keyThemes: ["Victory of Hudaybiyyah", "Pledge of Ridwan", "Tranquility upon the Believers"]
  },
  49: {
    surahName: "Al-Hujurat (The Rooms)",
    summary: "The surah of manners: guarding respect for the Prophet, verifying news, making peace between brothers, avoiding mockery and suspicion, and the reality that the most honorable is the most God-fearing.",
    keyThemes: ["Etiquette with the Prophet", "Avoiding Mockery and Suspicion", "Nobility is by Taqwa"]
  },
  50: {
    surahName: "Qaf",
    summary: "Swears by the glorious Qur'an, confronts the deniers of resurrection with the signs of creation and the recording angels, and describes the approach of death and the Day of Reckoning.",
    keyThemes: ["The Glorious Qur'an", "Creation Proves Resurrection", "The Approach of Death"]
  },
  51: {
    surahName: "Adh-Dhariyat (The Winnowing Winds)",
    summary: "Swears by the scattering winds that the promise is true, affirms provision and decree, and tells of the honored guests of Ibrahim; the jinn and mankind were created only to worship Allah.",
    keyThemes: ["Certainty of the Promise", "Guests of Ibrahim", "Purpose of Creation is Worship"]
  },
  52: {
    surahName: "At-Tur (The Mount)",
    summary: "Swears by the Mount, the inscribed Book, the frequented House and the raised ceiling that the punishment is coming, and describes the delights of the righteous in the gardens of paradise.",
    keyThemes: ["Swearing the Punishment Comes", "Delights of Paradise", "Recompense for the Righteous"]
  },
  53: {
    surahName: "An-Najm (The Star)",
    summary: "Contains the description of Jibril's descent and the vision at the lote tree of the utmost boundary, refutes the idols of Lat, 'Uzza and Manat, and clarifies that man has only what he strives for.",
    keyThemes: ["The Vision at the Lote Tree", "Refuting the Idols", "Man has what he Strives for"]
  },
  54: {
    surahName: "Al-Qamar (The Moon)",
    summary: "Recounts the splitting of the moon and the stories of the peoples of Nuh, 'Ad, Thamud, Lut and Pharaoh who denied the warnings, with the refrain 'the Qur'an was easy for remembrance'; warns that every deed is recorded.",
    keyThemes: ["Splitting of the Moon", "The Qur'an Made Easy for Remembrance", "Every Deed is Recorded"]
  },
  55: {
    surahName: "Ar-Rahman (The Most Merciful)",
    summary: "Counts the favors of Ar-Rahman: the Qur'an, the balance, the creation of man, the two seas, and the delights of the two gardens; the surah asks with its refrain which of the favors of its Lord will be denied.",
    keyThemes: ["The Favors of Ar-Rahman", "The Two Gardens", "Which of the Favors is Denied"]
  },
  56: {
    surahName: "Al-Waqi'ah (The Inevitable)",
    summary: "Describes the three groups on the Day of Resurrection: the foremost, the companions of the right and the companions of the left, with the recompense of each; urges reflection on the creation of the seed and the water.",
    keyThemes: ["The Three Groups", "Recompense of Each", "Reflection on Creation"]
  },
  57: {
    surahName: "Al-Hadid (The Iron)",
    summary: "Opens glorifying Allah with His perfect attributes, calls to spending before a day of no exchange, and tells of the iron with its severe force and benefit for people; the monks and the believers are each recompensed.",
    keyThemes: ["Glorification of Allah", "Spending in His Cause", "Iron: Force and Benefit"]
  },
  58: {
    surahName: "Al-Mujadilah (The Pleading Woman)",
    summary: "Opens with the woman who pleaded to the Prophet about her husband and Allah hearing her argument; clarifies the law of dhihar, the etiquette of private counsel, and the reward of those who love Allah and His Messenger.",
    keyThemes: ["Allah Hears the Pleading", "Law of Dhihar", "The Party of Allah"]
  },
  59: {
    surahName: "Al-Hashr (The Exile)",
    summary: "Tells of the exile of Banu Nadir and the division of the spoils, the command of obedience to the Messenger, and the famous ayat on the Qur'an being capable of moving mountains; the people of the Suffa and the Ansar are praised.",
    keyThemes: ["Exile of Banu Nadir", "The Quran and the Mountains", "The Muhajirun and Ansar"]
  },
  60: {
    surahName: "Al-Mumtahanah (The Examined Woman)",
    summary: "Commands severing loyalty to the disbelievers, gives the example of Ibrahim's disavowal of his people, and sets the rulings of examining the emigrant women and the oath of allegiance.",
    keyThemes: ["No Loyalty to the Disbelievers", "Example of Ibrahim", "Rulings of the Migrant Women"]
  },
  61: {
    surahName: "As-Saff (The Ranks)",
    summary: "Condemns saying what one does not do, praises the believers standing in ranks like a solid structure, and narrates the glad tidings of Isa of a messenger after him named Ahmad.",
    keyThemes: ["Deeds must match Words", "The Solid Structure", "Glad Tidings of the Messenger"]
  },
  62: {
    surahName: "Al-Jumu'ah (The Congregation)",
    summary: "Describes the sending of a messenger reciting, purifying and teaching the Book and wisdom; commands hastening to the Friday prayer and remembering Allah much, and leaving off trade at its call.",
    keyThemes: ["The Sending of the Messenger", "Obligation of Jumu'ah", "Remembrance of Allah"]
  },
  63: {
    surahName: "Al-Munafiqun (The Hypocrites)",
    summary: "Exposes the hypocrites' oaths, arrogance, and turning away, and warns the believers from being distracted by wealth and children from remembrance of Allah; spending in His cause is urged before death approaches.",
    keyThemes: ["Exposing Hypocrisy", "Wealth must not Distract", "Spend before Death"]
  },
  64: {
    surahName: "At-Taghabun (The Mutual Disillusion)",
    summary: "Explains that the day of gathering is the day of mutual loss for the disbelievers and mutual gain for the believers; calls to fearing Allah with one's full ability and to obedience; warns against the trial of wealth and children.",
    keyThemes: ["The Day of Mutual Loss", "Fear Allah with Full Ability", "Wealth and Children are a Trial"]
  },
  65: {
    surahName: "At-Talaq (The Divorce)",
    summary: "Sets the rulings of divorce, the waiting period and provision, and the command of fearing Allah; whoever fears Allah, He makes a way out for him and provides from where he does not expect.",
    keyThemes: ["Rulings of Divorce", "Fear Allah, He Makes a Way Out", "Provision from Where it is Not Expected"]
  },
  66: {
    surahName: "At-Tahrim (The Prohibition)",
    summary: "Opens with the Prophet's prohibition of what Allah made lawful to please his wives, warns the wives of the Prophet of the sternest punishment for the women of Nuh and Lut, and gives the parable of the believing women of Pharaoh and Imran.",
    keyThemes: ["The Prophet's Household", "Parable of Two Wives", "Parable of Two Believing Women"]
  },
  67: {
    surahName: "Al-Mulk (The Sovereignty)",
    summary: "Blesses the One in Whose hand is sovereignty, describes the perfection of the heavens' creation with no imperfection, and warns of the punishment of those who disbelieve in the unseen; whoever disbelieves hears the raging of the fire.",
    keyThemes: ["Sovereignty of Allah", "Perfection of Creation", "Warning of the Fire"]
  },
  68: {
    surahName: "Al-Qalam (The Pen)",
    summary: "Swears by the pen and what is written that the Prophet is not mad; warns of the day the legs are uncovered and calls to prostration, and tells of the owners of the garden whose miserly resolve was overturned by Allah's decree.",
    keyThemes: ["The Pen and What is Written", "The Prophet is not Mad", "Owners of the Garden"]
  },
  69: {
    surahName: "Al-Haqqah (The Reality)",
    summary: "Describes the Reality of the Day of Judgment, the fate of 'Ad, Thamud, Pharaoh and the overturned cities, and the honor of the one given his book in his right hand and the woe of the one given it in his left.",
    keyThemes: ["The Reality", "Destruction of the Deniers", "The Book in the Right or Left Hand"]
  },
  70: {
    surahName: "Al-Ma'arij (The Ascending Stairways)",
    summary: "Warns that the punishment is coming from Allah to whom the angels and the Spirit ascend in a day whose measure is fifty thousand years; the believers are described as patient in prayer, charitable, chaste and truthful.",
    keyThemes: ["The Coming Punishment", "The Ascending Stairways", "Traits of the Believers"]
  },
  71: {
    surahName: "Nuh",
    summary: "Tells of Nuh's long call to his people by night and day, in secret and openly, and his saying: ask your Lord for forgiveness, He will send upon you the sky in abundance and grant you wealth and sons.",
    keyThemes: ["Nuh's Long Call", "Seek Forgiveness, Rain Comes", "Patience in Da'wah"]
  },
  72: {
    surahName: "Al-Jinn (The Jinn)",
    summary: "Relates the jinn's listening to the Qur'an and their acceptance of faith, their astonishment at the claim that Allah has no partner nor son, and the news that whoever seeks refuge with any jinn increases them in transgression.",
    keyThemes: ["The Jinn Accept Faith", "The Quran Astonishes the Jinn", "Seeking Refuge is from Allah Alone"]
  },
  73: {
    surahName: "Al-Muzzammil (The Enshrouded One)",
    summary: "Commands the night prayer and reciting the Qur'an in measured recitation, for the night prayer is firmer in step and truer in speech; then eases the obligation and commands the duties of prayer, zakat and remembrance.",
    keyThemes: ["Night Prayer (Qiyam)", "Measured Recitation of the Qur'an", "The Easing of the Obligation"]
  },
  74: {
    surahName: "Al-Muddaththir (The Cloaked One)",
    summary: "Commands arising and warning, magnifying Allah, purifying garments and shunning impurity; mentions the nine leaders of Quraysh who mocked, and the keeper of the fire, and that each soul is held in pledge for what it earned.",
    keyThemes: ["The Command to Warn", "The Nine Leaders of Quraysh", "Every Soul is Pledged by its Deeds"]
  },
  75: {
    surahName: "Al-Qiyamah (The Resurrection)",
    summary: "Swears by the self-reproaching soul that resurrection is certain; describes the terror of the Hour, the gathering, and the reckoning; affirms that man was created for struggle and that to Allah is the return.",
    keyThemes: ["Certainty of Resurrection", "The Self-Reproaching Soul", "Man was Created for Struggle"]
  },
  76: {
    surahName: "Al-Insan (Man)",
    summary: "Reminds man that he was a thing unremembered, created and guided; describes the righteous drinking from a cup mixed with camphor, fulfilling vows and feeding the poor and orphan for Allah's sake; and the descent of the Qur'an as a reminder.",
    keyThemes: ["Creation and Guidance of Man", "The Righteous Drink and Feed", "The Qur'an as a Reminder"]
  },
  77: {
    surahName: "Al-Mursalat (The Emissaries)",
    summary: "Swears by the winds sent in succession that what the deniers are promised will occur; describes the day of separation, and the woe of those who deny; the God-fearing are among shades and springs.",
    keyThemes: ["The Emissaries", "The Day of Separation", "Woe to the Deniers"]
  },
  78: {
    surahName: "An-Naba (The Great News)",
    summary: "Asks about the great news concerning which they differ — the Day of Resurrection — and answers with Allah's signs in the earth as a bed, the mountains as pegs, and the creation of pairs, sleep and night; warns of the awaited day.",
    keyThemes: ["The Great News", "Signs in Creation", "The Awaited Day"]
  },
  79: {
    surahName: "An-Nazi'at (Those who drag forth)",
    summary: "Swears by the angels that the hearts will be terrified on the day the quaking one quakes; recounts the story of Musa with Pharaoh and his end, and asks: is the creation or the raising of the heaven harder?",
    keyThemes: ["The Day the Quaking Quakes", "Story of Musa and Pharaoh", "Creation or Resurrection"]
  },
  80: {
    surahName: "'Abasa (He Frowned)",
    summary: "Admonishes the Prophet for frowning at the blind man Ibn Umm Maktum while he was engaged with the Quraysh leaders; the one who comes striving and fearing is given attention, and man is reminded of his food and his creation.",
    keyThemes: ["The Blind Man Ibn Umm Maktum", "Striving with Fear", "Reflection on Food and Creation"]
  },
  81: {
    surahName: "At-Takwir (The Overthrowing)",
    summary: "Describes the overturning of the sun and the falling of the stars when the soul is paired with its body and the scrolls are unrolled; swears by the noble messenger Jibril that the Qur'an is the word of a noble messenger, not of a madman.",
    keyThemes: ["Overthrowing of the Sun", "The Soul Paired with its Body", "The Word of a Noble Messenger"]
  },
  82: {
    surahName: "Al-Infitar (The Cleaving)",
    summary: "Describes the cleaving of the sky and the scattering of the stars, and the noble recording angels who watch over the servant; warns of the Day of Recompense when no soul will avail another.",
    keyThemes: ["Cleaving of the Sky", "The Noble Recording Angels", "No Soul Avails Another"]
  },
  83: {
    surahName: "Al-Mutaffifin (The Defrauding)",
    summary: "Threatens those who cheat in measure and weight — they do not think they will be raised for a tremendous day; the righteous are in 'Illiyyun drinking sealed nectar, while the wicked are in Sijjin.",
    keyThemes: ["Woe to the Defrauders", "The Righteous in 'Illiyyun", "The Wicked in Sijjin"]
  },
  84: {
    surahName: "Al-Inshiqaq (The Sundering)",
    summary: "Describes the sky sundered and obeying its Lord, the earth stretched and casting out what is in it, and the man striving to his Lord meeting Him; the one given his book behind his back calls for destruction.",
    keyThemes: ["Sundering of the Sky", "Striving Leads to Meeting", "The Book Behind the Back"]
  },
  85: {
    surahName: "Al-Buruj (The Mansions of the Stars)",
    summary: "Swears by the sky of the constellations and the promised day, and tells of the companions of the trench burned in the fire for faith; the punishment of the Lord is severe, and the Qur'an is in a preserved tablet.",
    keyThemes: ["The Companions of the Trench", "The Severe Punishment of the Lord", "The Preserved Tablet"]
  },
  86: {
    surahName: "At-Tariq (The Night Comer)",
    summary: "Swears by the sky and the night comer, the piercing star, that every soul has a watcher over it; man is reminded of his creation from a gushing fluid and the day the secrets are examined.",
    keyThemes: ["The Piercing Star", "Every Soul has a Watcher", "Examination of Secrets"]
  },
  87: {
    surahName: "Al-A'la (The Most High)",
    summary: "Commands glorifying the name of the Most High who created, proportioned and ordained, who brought forth the pasture; the remembrance is commanded and the reminder is easy; the last verses describe Ibrahim and Musa's scrolls.",
    keyThemes: ["Glorify the Most High", "Allah Ordains and Guides", "The Scrolls of Ibrahim and Musa"]
  },
  88: {
    surahName: "Al-Ghashiyah (The Overwhelming)",
    summary: "Describes the overwhelming day with faces humbled and scorching fire, and faces radiant in a lofty garden with a flowing spring; commands looking at the camels, the sky, the mountains and the earth as signs.",
    keyThemes: ["The Overwhelming Day", "Faces in the Garden", "Look at the Creation"]
  },
  89: {
    surahName: "Al-Fajr (The Dawn)",
    summary: "Swears by the dawn, the ten nights, the even and the odd; recounts the fate of 'Ad, Thamud and Pharaoh who transgressed, and the soul at peace called to enter among the servants of Allah.",
    keyThemes: ["Destruction of the Transgressors", "The Soul at Peace", "The Even and the Odd"]
  },
  90: {
    surahName: "Al-Balad (The City)",
    summary: "Swears by the sacred city of Makkah and the parent and that which he fathered; man is created in hardship and the two highways are shown to him: the steep ascent of freeing a slave and feeding on a day of hunger.",
    keyThemes: ["The Sacred City", "Man is in Hardship", "The Steep Ascent"]
  },
  91: {
    surahName: "Ash-Shams (The Sun)",
    summary: "Swears by the sun, the moon, the day, the night, the sky and the earth, and the soul and its perfecting, that the one who purifies it has succeeded and the one who buries it has failed; recounts Thamud's destruction.",
    keyThemes: ["The Great Oaths", "Purification of the Soul", "Fate of Thamud"]
  },
  92: {
    surahName: "Al-Layl (The Night)",
    summary: "Swears by the night, the day and the creation of the male and female that your efforts are diverse: the one who gives, fears and believes is eased to ease, while the miserly is eased to hardship; the last are those who deny and turn away.",
    keyThemes: ["Diversity of Striving", "Eased to Ease or Hardship", "The Last of the Deniers"]
  },
  93: {
    surahName: "Ad-Duha (The Morning Hours)",
    summary: "Comforts the Prophet: your Lord has not forsaken you; the last is better than the first, and your Lord will give you and you will be satisfied; the orphan, the beggar and the favors of the Lord are each remembered.",
    keyThemes: ["Your Lord has not Forsaken", "The Last is Better", "Favors of the Lord"]
  },
  94: {
    surahName: "Ash-Sharh (The Relief)",
    summary: "Reminds the Prophet of the opening of his chest, the lifting of his burden, the raising of his mention, and that with hardship comes ease; commands striving and devotion to the Lord.",
    keyThemes: ["Expansion of the Chest", "With Hardship Comes Ease", "Striving and Devotion"]
  },
  95: {
    surahName: "At-Tin (The Fig)",
    summary: "Swears by the fig, the olive, Mount Sinai and this secure city that man was created in the best of proportion, then lowered to the lowest of the low except those who believe and do right; the recompense of the deniers is asked about.",
    keyThemes: ["Created in Best Proportion", "Lowered to the Lowest", "Recompense of the Deniers"]
  },
  96: {
    surahName: "Al-'Alaq (The Clot)",
    summary: "The first revelation: read in the name of your Lord who created man from a clot; then warns Abu Jahl who forbids the servant when he prays; the one who forbids is summoned to his guards and his congregation.",
    keyThemes: ["Read in the Name of your Lord", "The Forbidding of Abu Jahl", "The Clot and Creation"]
  },
  97: {
    surahName: "Al-Qadr (The Power)",
    summary: "Announces the descent of the Qur'an in the Night of Decree, better than a thousand months, when the angels and the Spirit descend with every matter; peace it is until the break of dawn.",
    keyThemes: ["The Night of Decree", "Better than a Thousand Months", "Peace until Dawn"]
  },
  98: {
    surahName: "Al-Bayyinah (The Clear Proof)",
    summary: "States that the disbelievers were not to be separated until the clear proof came to them: a messenger reciting purified scrolls; the best of creation are those who believe and do right, their reward with their Lord.",
    keyThemes: ["The Clear Proof", "The Best of Creation", "Their Reward is with their Lord"]
  },
  99: {
    surahName: "Az-Zalzalah (The Earthquake)",
    summary: "Describes the earth's earthquake, its bringing forth its burdens, and the people coming forth in groups to be shown their deeds; whoever does an atom's weight of good sees it, and whoever does an atom's weight of evil sees it.",
    keyThemes: ["The Earthquake", "The Earth Bears Witness", "An Atom's Weight of Good"]
  },
  100: {
    surahName: "Al-'Adiyat (The Coursers)",
    summary: "Swears by the panting horses that man is ungrateful to his Lord, and that he is a witness against himself, fierce in love of good; the day the contents of the graves are scattered, the Lord is indeed aware.",
    keyThemes: ["Man is Ungrateful to his Lord", "Fierce Love of Good", "The Lord is Aware"]
  },
  101: {
    surahName: "Al-Qari'ah (The Calamity)",
    summary: "Describes the striking calamity of the Day of Judgment: men like scattered moths, mountains like carded wool, scales weighing deeds, and the mother of abyss for the wicked and a well-pleased life for the believers.",
    keyThemes: ["The Striking Calamity", "The Weighing of Deeds", "The Mother of Abyss"]
  },
  102: {
    surahName: "At-Takathur (The Rivalry)",
    summary: "Warns that rivalry in accumulation distracts until the graves are visited; the threat of the fire is certain, and the blessings will be asked about; the remembrance of Allah is better than the accumulation of the world.",
    keyThemes: ["Rivalry in Accumulation", "Distraction until the Graves", "The Blessings will be Asked About"]
  },
  103: {
    surahName: "Al-'Asr (The Declining Day)",
    summary: "Swears by time that man is in loss except those who believe, do righteous deeds, counsel one another to truth and counsel one another to patience — the four pillars of salvation summarized in one surah.",
    keyThemes: ["Man is in Loss", "Faith and Righteous Deeds", "Counsel of Truth and Patience"]
  },
  104: {
    surahName: "Al-Humazah (The Traducer)",
    summary: "Threatens the slanderer and the faultfinder who gathers wealth and counts it, thinking it will immortalize him; the crushing fire of Allah is fed with the hearts of the schemers, upon them closed in columns extended.",
    keyThemes: ["Woe to the Slanderer", "The Crushing Fire", "Wealth Cannot Immortalize"]
  },
  105: {
    surahName: "Al-Fil (The Elephant)",
    summary: "Tells of the army of the elephant sent to destroy the Ka'bah, and how the Lord dealt with their plot, sending birds striking them with stones of baked clay, making them like eaten straw — a sign of Allah's protection of His House.",
    keyThemes: ["The Army of the Elephant", "The Birds of Ababil", "Protection of the Ka'bah"]
  },
  106: {
    surahName: "Quraysh",
    summary: "Calls Quraysh to worship the Lord of this House who fed them against hunger and made them secure from fear, in gratitude for the favor of the winter and summer journeys.",
    keyThemes: ["The Winter and Summer Journeys", "Worship the Lord of the House", "Fed against Hunger, Secure from Fear"]
  },
  107: {
    surahName: "Al-Ma'un (The Small Kindnesses)",
    summary: "Exposes the one who denies the religion: repelling the orphan and not urging the feeding of the poor; woe to the prayerful who are heedless of their prayer, who show off and withhold small kindnesses.",
    keyThemes: ["The Denier of the Religion", "Heedless Prayer", "The Small Kindnesses"]
  },
  108: {
    surahName: "Al-Kawthar (The Abundance)",
    summary: "Gives the Prophet the glad tidings of the river of abundance in paradise and the abundance in this world and the next; commands praying and sacrificing to the Lord, and declares the hater is the one cut off.",
    keyThemes: ["The River of Abundance", "Pray and Sacrifice", "The Hater is Cut Off"]
  },
  109: {
    surahName: "Al-Kafirun (The Disbelievers)",
    summary: "The surah of disavowal: I do not worship what you worship, nor do you worship what I worship; you have your religion and I have mine — purity of worship and the final separation between truth and falsehood.",
    keyThemes: ["Disavowal of Shirk", "Your Religion is Yours", "Purity of Worship"]
  },
  110: {
    surahName: "An-Nasr (The Divine Support)",
    summary: "Announces the victory of Allah and the opening, and the people entering the religion of Allah in crowds; commands glorifying and praising the Lord and seeking His forgiveness, for He is ever-accepting of repentance.",
    keyThemes: ["Victory and the Opening", "People Enter in Crowds", "Glorify and Seek Forgiveness"]
  },
  111: {
    surahName: "Al-Masad (The Palm Fiber)",
    summary: "Announces the perishing of Abu Lahab and his denial of the Prophet; neither his wealth nor his earning availed him; he will burn in a fire of flame along with his wife, the carrier of firewood, with a rope of palm fiber on her neck.",
    keyThemes: ["The Fate of Abu Lahab", "Wealth Avails Not", "The Carrier of Firewood"]
  },
  112: {
    surahName: "Al-Ikhlas (The Sincerity)",
    summary: "Establishes Allah's oneness and His attributes of absolute perfection: He is One, the Self-Sufficient Refuge, He neither begets nor is begotten, and none is equivalent to Him — equal to a third of the Qur'an.",
    keyThemes: ["Allah is One", "The Self-Sufficient Refuge", "None is Equivalent to Him"]
  },
  113: {
    surahName: "Al-Falaq (The Daybreak)",
    summary: "Commands seeking refuge in the Lord of the daybreak from the evil of His creation, the darkness when it spreads, the blowers upon knots and the envier when he envies — the complete protection from all outward evil.",
    keyThemes: ["Seek Refuge in the Daybreak", "Evil of Envy and Sorcery", "Protection from Creation's Evil"]
  },
  114: {
    surahName: "An-Nas (Mankind)",
    summary: "Commands seeking refuge in the Lord, King and God of mankind from the whisperer who withdraws, who whispers in the breasts of mankind, from the jinn and mankind — the complete protection from all inward evil.",
    keyThemes: ["The Lord of Mankind", "The Whispering Devil", "Refuge from Jinn and Mankind"]
  },
};

function normalizeSurahName(name: string): string {
  return name.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '');
}

function resolveSurahNumber(surahName: string): number | null {
  const target = normalizeSurahName(surahName);
  if (target.includes('group')) return null;
  const matched = SURAH_LIST.find(
    s => normalizeSurahName(s.transliteration) === target
  );
  return matched ? matched.number : null;
}

export function getTafseerForSurah(surahName: string): TafseerEntry {
  const surahNumber = resolveSurahNumber(surahName) ?? 0;
  const entry = surahNumber !== 0 ? TAFSEER_SAADI[surahNumber] : undefined;
  if (entry) {
    return { ...entry, surahNumber };
  }
  return {
    surahNumber,
    surahName: surahName,
    summary: `Tafseer As-Sa'di for Surah ${surahName}: Reflect upon the verses as you recite today. Contemplate Allah's command, His promises of mercy, and the guidance contained within this portion of the noble Quran.`,
    keyThemes: ["Contemplation (Tadabbur)", "Tawheed & Faith", "Action upon Revelation"]
  };
}
