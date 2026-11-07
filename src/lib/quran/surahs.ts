// [surah_number, name, ayah_count, juz_number]
export const SURAHS: [number, string, number, number][] = [
  [1,'Al-Fatiha',7,1],[2,'Al-Baqarah',286,1],[3,'Aali Imran',200,3],[4,'An-Nisa',176,4],
  [5,'Al-Maidah',120,6],[6,'Al-Anam',165,7],[7,'Al-Araf',206,8],[8,'Al-Anfal',75,9],
  [9,'At-Tawbah',129,10],[10,'Yunus',109,11],[11,'Hud',123,11],[12,'Yusuf',111,12],
  [13,'Ar-Rad',43,13],[14,'Ibrahim',52,13],[15,'Al-Hijr',99,14],[16,'An-Nahl',128,14],
  [17,'Al-Isra',111,15],[18,'Al-Kahf',110,15],[19,'Maryam',98,16],[20,'Ta-Ha',135,16],
  [21,'Al-Anbiya',112,17],[22,'Al-Hajj',78,17],[23,'Al-Muminun',118,18],[24,'An-Nur',64,18],
  [25,'Al-Furqan',77,18],[26,'Ash-Shuara',227,19],[27,'An-Naml',93,19],[28,'Al-Qasas',88,20],
  [29,'Al-Ankabut',69,20],[30,'Ar-Rum',60,21],[31,'Luqman',34,21],[32,'As-Sajdah',30,21],
  [33,'Al-Ahzab',73,21],[34,'Saba',54,22],[35,'Fatir',45,22],[36,'Ya-Sin',83,22],
  [37,'As-Saffat',182,23],[38,'Sad',88,23],[39,'Az-Zumar',75,23],[40,'Ghafir',85,24],
  [41,'Fussilat',54,24],[42,'Ash-Shura',53,25],[43,'Az-Zukhruf',89,25],[44,'Ad-Dukhan',59,25],
  [45,'Al-Jathiyah',37,25],[46,'Al-Ahqaf',35,26],[47,'Muhammad',38,26],[48,'Al-Fath',29,26],
  [49,'Al-Hujurat',18,26],[50,'Qaf',45,26],[51,'Adh-Dhariyat',60,26],[52,'At-Tur',49,27],
  [53,'An-Najm',62,27],[54,'Al-Qamar',55,27],[55,'Ar-Rahman',78,27],[56,'Al-Waqiah',96,27],
  [57,'Al-Hadid',29,27],[58,'Al-Mujadila',22,28],[59,'Al-Hashr',24,28],[60,'Al-Mumtahanah',13,28],
  [61,'As-Saf',14,28],[62,'Al-Jumuah',11,28],[63,'Al-Munafiqun',11,28],[64,'At-Taghabun',18,28],
  [65,'At-Talaq',12,28],[66,'At-Tahrim',12,28],[67,'Al-Mulk',30,29],[68,'Al-Qalam',52,29],
  [69,'Al-Haqqah',52,29],[70,'Al-Maarij',44,29],[71,'Nuh',28,29],[72,'Al-Jinn',28,29],
  [73,'Al-Muzzammil',20,29],[74,'Al-Muddaththir',56,29],[75,'Al-Qiyamah',40,29],
  [76,'Al-Insan',31,29],[77,'Al-Mursalat',50,29],[78,'An-Naba',40,30],[79,'An-Naziat',46,30],
  [80,'Abasa',42,30],[81,'At-Takwir',29,30],[82,'Al-Infitar',19,30],[83,'Al-Mutaffifin',36,30],
  [84,'Al-Inshiqaq',25,30],[85,'Al-Buruj',22,30],[86,'At-Tariq',17,30],[87,'Al-Ala',19,30],
  [88,'Al-Ghashiyah',26,30],[89,'Al-Fajr',30,30],[90,'Al-Balad',20,30],[91,'Ash-Shams',15,30],
  [92,'Al-Layl',21,30],[93,'Ad-Duha',11,30],[94,'Ash-Sharh',8,30],[95,'At-Tin',8,30],
  [96,'Al-Alaq',19,30],[97,'Al-Qadr',5,30],[98,'Al-Bayyinah',8,30],[99,'Az-Zalzalah',8,30],
  [100,'Al-Adiyat',11,30],[101,'Al-Qariah',11,30],[102,'At-Takathur',8,30],[103,'Al-Asr',3,30],
  [104,'Al-Humazah',9,30],[105,'Al-Fil',5,30],[106,'Quraysh',4,30],[107,'Al-Maun',7,30],
  [108,'Al-Kawthar',3,30],[109,'Al-Kafirun',6,30],[110,'An-Nasr',3,30],[111,'Al-Masad',5,30],
  [112,'Al-Ikhlas',4,30],[113,'Al-Falaq',5,30],[114,'An-Nas',6,30],
]

/**
 * Which surah numbers appear in each Juz.
 * Large surahs that span two Juz appear in both.
 */
export const JUZ_TO_SURAHS: Record<number, number[]> = {
  1:  [1, 2],
  2:  [2],
  3:  [2, 3],
  4:  [3, 4],
  5:  [4],
  6:  [4, 5],
  7:  [5, 6],
  8:  [6, 7],
  9:  [7, 8],
  10: [8, 9],
  11: [9, 10, 11],
  12: [11, 12],
  13: [12, 13, 14],
  14: [15, 16],
  15: [17, 18],
  16: [18, 19, 20],
  17: [21, 22],
  18: [23, 24, 25],
  19: [25, 26, 27],
  20: [27, 28, 29],
  21: [29, 30, 31, 32, 33],
  22: [33, 34, 35, 36],
  23: [36, 37, 38, 39],
  24: [39, 40, 41],
  25: [41, 42, 43, 44, 45],
  26: [46, 47, 48, 49, 50, 51],
  27: [51, 52, 53, 54, 55, 56, 57],
  28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
  29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
       91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102,
       103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
}

/** Look up surah name by number (1-indexed) */
export function surahName(num: number): string {
  return SURAHS.find(([n]) => n === num)?.[1] ?? `Surah ${num}`
}

/** Progress within the current Juz (students go 114 → 1) */
export function juzProgress(currentSurah: number): {
  juz:        number
  total:      number  // surahs in this Juz
  done:       number  // surahs completed in this Juz (>= currentSurah)
  left:       number  // surahs remaining in this Juz (< currentSurah)
  pct:        number  // % of Juz completed
  firstName:  string  // first surah in Juz (highest number, since they go backward)
  lastName:   string  // last surah in Juz (lowest number = goal)
} {
  const entry = SURAHS.find(([n]) => n === currentSurah)
  if (!entry) return { juz: 0, total: 0, done: 0, left: 0, pct: 0, firstName: '', lastName: '' }

  const juz = entry[3]
  const juzSurahs = SURAHS.filter(([,,,j]) => j === juz) // ordered 1→114

  const done  = juzSurahs.filter(([n]) => n >= currentSurah).length
  const total = juzSurahs.length
  const left  = total - done

  // For display: the Juz spans from the highest surah (first they do) to lowest (last they do)
  const nums = juzSurahs.map(([n]) => n)
  const maxN = Math.max(...nums)
  const minN = Math.min(...nums)
  const firstName = surahName(maxN)
  const lastName  = surahName(minN)

  return { juz, total, done, left, pct: Math.round((done / total) * 100), firstName, lastName }
}
