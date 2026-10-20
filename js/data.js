"use strict";

/* ==========================================================================
   DATA — ubah isi file ini untuk menambah qari, riwayat, atau topik kajian.
   Halaman (lembar buku, daftar isi, filter) dibuat otomatis dari data ini.
   ========================================================================== */

const SURAH = [
  "Al-Fatihah","Al-Baqarah","Ali 'Imran","An-Nisa'","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Taubah","Yunus",
  "Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra'","Al-Kahf","Maryam","Thaha",
  "Al-Anbiya'","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Asy-Syu'ara'","An-Naml","Al-Qashash","Al-'Ankabut","Ar-Rum",
  "Luqman","As-Sajdah","Al-Ahzab","Saba'","Fathir","Yasin","Ash-Shaffat","Shad","Az-Zumar","Ghafir",
  "Fushshilat","Asy-Syura","Az-Zukhruf","Ad-Dukhan","Al-Jatsiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf",
  "Adz-Dzariyat","Ath-Thur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadilah","Al-Hasyr","Al-Mumtahanah",
  "Ash-Shaff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","Ath-Thalaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij",
  "Nuh","Al-Jinn","Al-Muzzammil","Al-Muddatstsir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba'","An-Nazi'at","'Abasa",
  "At-Takwir","Al-Infithar","Al-Muthaffifin","Al-Insyiqaq","Al-Buruj","Ath-Thariq","Al-A'la","Al-Ghasyiyah","Al-Fajr","Al-Balad",
  "Asy-Syams","Al-Lail","Adh-Dhuha","Al-Insyirah","At-Tin","Al-'Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-'Adiyat",
  "Al-Qari'ah","At-Takatsur","Al-'Ashr","Al-Humazah","Al-Fil","Quraisy","Al-Ma'un","Al-Kautsar","Al-Kafirun","An-Nashr",
  "Al-Lahab","Al-Ikhlas","Al-Falaq","An-Nas"
];

const GROUPS = {
  sabah:  { short: "Sab'ah",          label: "Qiraat as-Sab'ah",          count: "tujuh imam" },
  asyrah: { short: "'Asyrah",         label: "Qiraat al-'Asyrah",         count: "sepuluh imam" },
  arbaah: { short: "Arba' 'Asyarah",  label: "Qiraat al-Arba' 'Asyarah",  count: "empat belas imam" }
};

/* --------------------------------------------------------------------------
   QARI
   Sumber audio: katalog mp3quran.net (dimuat saat halaman dibuka).
   - keys      : potongan nama qari (huruf kecil, tanpa spasi/tanda baca) untuk mencari di katalog
   - moshaf    : kata kunci nama riwayat di katalog; "a|b" berarti a ATAU b; semua item harus cocok
   - prefer    : jika ada beberapa rekaman, pilih yang namanya memuat kata ini (mis. murattal)
   - fallbackServer : dipakai jika katalog gagal dimuat (alamat folder mp3, diakhiri "/")
   - photo     : isi dengan alamat foto (mis. "img/qari/alafasy.jpg"); kosong = memakai ilustrasi
   -------------------------------------------------------------------------- */
const QARI = [
  {
    id: "alafasy",
    arabic: "مشاري راشد العفاسي",
    name: "Mishary Rashid Alafasy",
    origin: "Kuwait · qari dan imam",
    sub: "Kuwait · Hafs 'an 'Ashim",
    code: "KW",
    palette: { paper: "#dbe7df", accent: "#1f5f4a" },
    photo: "",
    bio: "Qari dan imam dari Kuwait. Bacaan murattalnya jernih dan tempo-nya stabil, sehingga nyaman dipakai untuk menyimak dan mengikuti hafalan.",
    keys: ["afasy"],
    readings: [
      { label: "Hafs 'an 'Ashim", group: "sabah", moshaf: ["hafs"], prefer: ["murattal"],
        note: "Riwayat yang paling luas dipakai, termasuk di Indonesia dan mushaf cetakan Madinah.",
        fallbackServer: "https://server8.mp3quran.net/afs/" }
    ]
  },
  {
    id: "basit",
    arabic: "عبد الباسط عبد الصمد",
    name: "Abdul Basit Abdus Samad",
    origin: "Mesir · 1927–1988",
    sub: "Mesir · Hafs, Warsh, mujawwad",
    code: "EG",
    palette: { paper: "#eadfc4", accent: "#7a4a12" },
    photo: "",
    bio: "Qari legendaris dari Mesir yang terkenal dengan napas panjang dan lagu mujawwad yang penuh warna. Rekamannya mencakup riwayat Hafs dan Warsh.",
    keys: ["abdulbasit","abdelbasset","abdulbaset","abdelbasit"],
    readings: [
      { label: "Hafs 'an 'Ashim — murattal", group: "sabah", moshaf: ["hafs"], prefer: ["murattal"],
        note: "Bacaan tartil dengan tempo tenang.",
        fallbackServer: "https://server7.mp3quran.net/basit/" },
      { label: "Warsh 'an Nafi'", group: "sabah", moshaf: ["warsh"],
        note: "Lazim di Maghrib dan Afrika Barat." },
      { label: "Hafs 'an 'Ashim — mujawwad", group: "sabah", moshaf: ["mojawwad|mujawwad"],
        note: "Dilagukan lebih bebas, dengan mad dan napas yang lebih panjang." }
    ]
  },
  {
    id: "husary",
    arabic: "محمود خليل الحصري",
    name: "Mahmoud Khalil Al-Husary",
    origin: "Mesir · 1917–1980",
    sub: "Mesir · Hafs, Warsh, Qalun",
    code: "EG",
    palette: { paper: "#dfe3ee", accent: "#2b3f7a" },
    photo: "",
    bio: "Qari Mesir yang dikenal sebagai salah satu perintis rekaman mushaf murattal lengkap dengan tajwid yang tertata. Selain Hafs, ia juga merekam Warsh dan Qalun.",
    keys: ["husar","hosar","hussar"],
    readings: [
      { label: "Hafs 'an 'Ashim", group: "sabah", moshaf: ["hafs"], prefer: ["murattal"],
        note: "Riwayat yang paling luas dipakai.",
        fallbackServer: "https://server13.mp3quran.net/husr/" },
      { label: "Warsh 'an Nafi'", group: "sabah", moshaf: ["warsh"],
        note: "Lazim di Maghrib dan Afrika Barat." },
      { label: "Qalun 'an Nafi'", group: "sabah", moshaf: ["qalon|qalun|qaloon"],
        note: "Dipakai di sebagian Libya, Tunisia, dan Qatar." }
    ]
  },
  {
    id: "sudais",
    arabic: "عبد الرحمن السديس",
    name: "Abdurrahman As-Sudais",
    origin: "Arab Saudi · imam Masjidil Haram",
    sub: "Arab Saudi · Hafs 'an 'Ashim",
    code: "SA",
    palette: { paper: "#e4dfee", accent: "#4b3a7a" },
    photo: "",
    bio: "Imam dan khatib Masjidil Haram di Makkah. Bacaannya dikenal luas lewat siaran shalat berjamaah dari Haramain.",
    keys: ["sudais","sudays","sudaes","sudeis"],
    readings: [
      { label: "Hafs 'an 'Ashim", group: "sabah", moshaf: ["hafs"], prefer: ["murattal"],
        note: "Riwayat yang sama dengan mushaf yang umum dipakai di Indonesia.",
        fallbackServer: "https://server11.mp3quran.net/sds/" }
    ]
  },
  {
    id: "jazairi",
    arabic: "ياسين الجزائري",
    name: "Yassin Al-Jazairi",
    origin: "Aljazair · qari",
    sub: "Aljazair · Warsh 'an Nafi'",
    code: "DZ",
    palette: { paper: "#ecdcd6", accent: "#8a2b2b" },
    photo: "",
    bio: "Qari dari Aljazair yang merekam 114 surah dalam riwayat Warsh 'an Nafi'. Riwayat ini lazim dibaca di Maghrib dan Afrika Barat, jadi terdengar berbeda dari Hafs yang biasa kita dengar.",
    keys: ["jazair","jazayr"],
    readings: [
      { label: "Warsh 'an Nafi'", group: "sabah", moshaf: ["warsh"],
        note: "Panjang mad dan pengucapan hamzah-nya terdengar berbeda dari Hafs." }
    ]
  },
  {
    id: "mazroyee",
    arabic: "ياسر المزروعي",
    name: "Yasser Al-Mazroyee",
    origin: "Kuwait · ahli qiraat",
    sub: "Kuwait · Ya'qub, Ruways & Rawh",
    code: "KW",
    palette: { paper: "#d6e5ea", accent: "#1c5f7a" },
    photo: "",
    bio: "Ahli qiraat dari Kuwait yang bersanad dan memiliki ijazah qiraat empat belas. Ia merekam mushaf murattal dalam qiraat Ya'qub al-Hadhrami lewat dua perawi: Ruways dan Rawh.",
    keys: ["mazro"],
    readings: [
      { label: "Ruways & Rawh 'an Ya'qub al-Hadhrami", group: "asyrah", moshaf: ["yakoob|yaqub|yaqoob|yakub"],
        note: "Qiraat 'Asyrah; rekamannya termasuk langka." }
    ]
  },
  {
    id: "abujafar",
    arabic: "أبو جعفر المدني",
    name: "Qiraat Abu Ja'far",
    origin: "Madinah · imam qiraat",
    sub: "Qari dimuat otomatis dari katalog",
    code: "MD",
    palette: { paper: "#e5e9d0", accent: "#5b6b1a" },
    photo: "",
    dynamic: true,           // nama qari diambil dari katalog, bukan ditulis di sini
    bio: "Abu Ja'far Yazid bin al-Qa'qa' adalah imam qiraat dari Madinah; qiraatnya termasuk dalam kelompok qiraat sepuluh. Nama qari untuk rekaman ini diambil otomatis dari katalog.",
    keys: [],
    readings: [
      { label: "Ibnu Jammaz 'an Abu Ja'far", group: "asyrah", moshaf: ["jammaz|jemaaz|jamaz"],
        note: "Qiraat 'Asyrah; rekamannya termasuk langka." }
    ]
  },
  {
    id: "arbaah",
    arabic: "الأربع عشرة",
    name: "Qiraat Arba' 'Asyarah",
    origin: "Empat imam tambahan",
    sub: "Al-Hasan, Ibnu Muhaishin, Al-Yazidi, Al-A'masy",
    code: "14",
    palette: { paper: "#ddd6cc", accent: "#3b3a36" },
    photo: "",
    noAudio: true,
    bio: "Empat imam yang ditambahkan setelah qiraat sepuluh. Umumnya ulama menggolongkan qiraat mereka sebagai qiraat syadz: dipelajari sebagai ilmu, tidak dibaca sebagai Al-Qur'an dalam shalat.",
    keys: [],
    readings: [
      { label: "Al-Hasan al-Bashri", group: "arbaah" },
      { label: "Ibnu Muhaishin", group: "arbaah" },
      { label: "Yahya al-Yazidi", group: "arbaah" },
      { label: "Al-A'masy", group: "arbaah" }
    ]
  }
];

/* --------------------------------------------------------------------------
   KAJIAN
   Tombol nama ustadz membuka pencarian YouTube (bukan klip tertentu).
   Untuk memutar potongan langsung di halaman, isi "clips", contoh:
     clips: [{ title: "Pengantar waris", ustadz: "Nama Ustadz",
               youtubeId: "ID_VIDEO", start: 120, end: 480 }]
   start/end dalam detik. Pastikan video boleh disematkan (embed).
   -------------------------------------------------------------------------- */
const KAJIAN = [
  {
    id: "ushul",
    title: "Ushul fiqh",
    query: "ushul fiqh",
    blurb: "Kaidah dan dalil yang dipakai untuk menetapkan hukum: Al-Qur'an, sunnah, ijma', dan qiyas, serta cara membaca perintah, larangan, dan lafaz umum-khusus.",
    ustadz: ["Ustadz Adi Hidayat", "Ustadz Abdul Somad", "Ustadz Ahmad Sarwat"],
    video: { youtubeId: "l1gjWGSdQOQ", title: "Perbedaan Fiqh dan Ushul Fiqh", ustadz: "Ustadz Adi Hidayat, Lc., MA" }
  },
  {
    id: "waris",
    title: "Waris (faraidh)",
    query: "hukum waris faraidh",
    blurb: "Siapa yang berhak menerima harta peninggalan, bagian tetapnya (1/2, 1/4, 1/8, 2/3, 1/3, 1/6), dan kapan seorang ahli waris menerima sisa sebagai 'ashabah.",
    ustadz: ["Ustadz Ahmad Sarwat", "Ustadz Abdul Somad", "Buya Yahya"],
    video: { youtubeId: "hsTVW93G__E", title: "Hukum Waris", ustadz: "Dr. Ahmad Sarwat, Lc., MA" }
  },
  {
    id: "nikah",
    title: "Nikah",
    query: "fiqih pernikahan",
    blurb: "Rukun dan syarat akad, peran wali, mahar, khitbah, hak dan kewajiban suami-istri, sampai talak dan rujuk.",
    ustadz: ["Ustadz Adi Hidayat", "Buya Yahya", "Ustadz Khalid Basalamah"],
    video: { youtubeId: "eOy5YNzGKD4", title: "Hakikat dan Tujuan Pernikahan", ustadz: "Buya Yahya" }
  },
  {
    id: "thaharah",
    title: "Bersuci dan shalat",
    query: "fiqih thaharah shalat",
    blurb: "Wudhu, mandi wajib, dan tayamum, lalu syarat, rukun, dan hal yang membatalkan shalat.",
    ustadz: ["Buya Yahya", "Ustadz Firanda Andirja", "Ustadz Ahmad Sarwat"],
    video: { youtubeId: "-F3p__EgYMY", title: "Cara Wudhu yang Benar", ustadz: "Buya Yahya" }
  },
  {
    id: "muamalah",
    title: "Zakat dan muamalah",
    query: "fiqih zakat muamalah",
    blurb: "Nisab dan haul zakat, jual beli, riba, serta akad-akad yang sering muncul dalam kehidupan sehari-hari.",
    ustadz: ["Ustadz Abdul Somad", "Ustadz Adi Hidayat", "Ustadz Ahmad Sarwat"],
    video: { youtubeId: "jqNWibOiNyU", title: "Fiqih Khas Mazhab Syafi'i: Zakat", ustadz: "Ustadz Ahmad Sarwat, Lc., MA" }
  },
  {
    id: "mazhab",
    title: "Perbedaan mazhab",
    query: "perbedaan pendapat mazhab fiqih",
    blurb: "Mengapa empat mazhab bisa berbeda pendapat dalam satu masalah, dan bagaimana bersikap terhadap khilafiyah.",
    ustadz: ["Buya Yahya", "Ustadz Ahmad Sarwat", "Ustadz Firanda Andirja"],
    video: { youtubeId: "QXYcytlQ08k", title: "4 Madzhab vs. Manhaj Salaf: Mana yang Harus Kita Ikuti?", ustadz: "Buya Yahya" }
  }
];

/* --------------------------------------------------------------------------
   BACAAN AL-QUR'AN (30 juz)
   Teks Arab (Utsmani) + terjemahan Bahasa Indonesia Kementerian Agama RI,
   dimuat per surah dari paket "quran-json" lewat jsDelivr (CC BY-SA 4.0).
   Ganti QURAN_TEXT_BASE bila Anda ingin memakai salinan lokal, mis. "data/chapters".
   -------------------------------------------------------------------------- */
const QURAN_TEXT_BASE = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/id";
const KEMENAG_URL = "https://quran.kemenag.go.id/";

// jumlah ayat tiap surah (jumlah seluruhnya 6.236)
const AYAH_COUNT = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

// awal tiap juz: surah (s) dan ayat (a)
const JUZ_START = [
  {s:1,a:1},{s:2,a:142},{s:2,a:253},{s:3,a:93},{s:4,a:24},{s:4,a:148},{s:5,a:82},{s:6,a:111},{s:7,a:88},{s:8,a:41},
  {s:9,a:93},{s:11,a:6},{s:12,a:53},{s:15,a:1},{s:17,a:1},{s:18,a:75},{s:21,a:1},{s:23,a:1},{s:25,a:21},{s:27,a:56},
  {s:29,a:46},{s:33,a:31},{s:36,a:28},{s:39,a:32},{s:41,a:47},{s:46,a:1},{s:51,a:31},{s:58,a:1},{s:67,a:1},{s:78,a:1}
];

/* --------------------------------------------------------------------------
   MUSHAF MADINAH (604 halaman)
   PAGE_START[n-1] = [surah, ayat] pertama pada halaman n mushaf Madinah (riwayat Hafs).
   Halaman 604 berakhir di An-Nas ayat 6. Data dari paket "quran-meta" (MIT); batas juz
   di JUZ_START di atas sudah dicocokkan dengan paket yang sama (30 dari 30 sama).
   -------------------------------------------------------------------------- */
const PAGE_START = [
  [1,1],[2,1],[2,6],[2,17],[2,25],[2,30],[2,38],[2,49],[2,58],[2,62],[2,70],[2,77],
  [2,84],[2,89],[2,94],[2,102],[2,106],[2,113],[2,120],[2,127],[2,135],[2,142],[2,146],[2,154],
  [2,164],[2,170],[2,177],[2,182],[2,187],[2,191],[2,197],[2,203],[2,211],[2,216],[2,220],[2,225],
  [2,231],[2,234],[2,238],[2,246],[2,249],[2,253],[2,257],[2,260],[2,265],[2,270],[2,275],[2,282],
  [2,283],[3,1],[3,10],[3,16],[3,23],[3,30],[3,38],[3,46],[3,53],[3,62],[3,71],[3,78],
  [3,84],[3,92],[3,101],[3,109],[3,116],[3,122],[3,133],[3,141],[3,149],[3,154],[3,158],[3,166],
  [3,174],[3,181],[3,187],[3,195],[4,1],[4,7],[4,12],[4,15],[4,20],[4,24],[4,27],[4,34],
  [4,38],[4,45],[4,52],[4,60],[4,66],[4,75],[4,80],[4,87],[4,92],[4,95],[4,102],[4,106],
  [4,114],[4,122],[4,128],[4,135],[4,141],[4,148],[4,155],[4,163],[4,171],[4,176],[5,3],[5,6],
  [5,10],[5,14],[5,18],[5,24],[5,32],[5,37],[5,42],[5,46],[5,51],[5,58],[5,65],[5,71],
  [5,77],[5,83],[5,90],[5,96],[5,104],[5,109],[5,114],[6,1],[6,9],[6,19],[6,28],[6,36],
  [6,45],[6,53],[6,60],[6,69],[6,74],[6,82],[6,91],[6,95],[6,102],[6,111],[6,119],[6,125],
  [6,132],[6,138],[6,143],[6,147],[6,152],[6,158],[7,1],[7,12],[7,23],[7,31],[7,38],[7,44],
  [7,52],[7,58],[7,68],[7,74],[7,82],[7,88],[7,96],[7,105],[7,121],[7,131],[7,138],[7,144],
  [7,150],[7,156],[7,160],[7,164],[7,171],[7,179],[7,188],[7,196],[8,1],[8,9],[8,17],[8,26],
  [8,34],[8,41],[8,46],[8,53],[8,62],[8,70],[9,1],[9,7],[9,14],[9,21],[9,27],[9,32],
  [9,37],[9,41],[9,48],[9,55],[9,62],[9,69],[9,73],[9,80],[9,87],[9,94],[9,100],[9,107],
  [9,112],[9,118],[9,123],[10,1],[10,7],[10,15],[10,21],[10,26],[10,34],[10,43],[10,54],[10,62],
  [10,71],[10,79],[10,89],[10,98],[10,107],[11,6],[11,13],[11,20],[11,29],[11,38],[11,46],[11,54],
  [11,63],[11,72],[11,82],[11,89],[11,98],[11,109],[11,118],[12,5],[12,15],[12,23],[12,31],[12,38],
  [12,44],[12,53],[12,64],[12,70],[12,79],[12,87],[12,96],[12,104],[13,1],[13,6],[13,14],[13,19],
  [13,29],[13,35],[13,43],[14,6],[14,11],[14,19],[14,25],[14,34],[14,43],[15,1],[15,16],[15,32],
  [15,52],[15,71],[15,91],[16,7],[16,15],[16,27],[16,35],[16,43],[16,55],[16,65],[16,73],[16,80],
  [16,88],[16,94],[16,103],[16,111],[16,119],[17,1],[17,8],[17,18],[17,28],[17,39],[17,50],[17,59],
  [17,67],[17,76],[17,87],[17,97],[17,105],[18,5],[18,16],[18,21],[18,28],[18,35],[18,46],[18,54],
  [18,62],[18,75],[18,84],[18,98],[19,1],[19,12],[19,26],[19,39],[19,52],[19,65],[19,77],[19,96],
  [20,13],[20,38],[20,52],[20,65],[20,77],[20,88],[20,99],[20,114],[20,126],[21,1],[21,11],[21,25],
  [21,36],[21,45],[21,58],[21,73],[21,82],[21,91],[21,102],[22,1],[22,6],[22,16],[22,24],[22,31],
  [22,39],[22,47],[22,56],[22,65],[22,73],[23,1],[23,18],[23,28],[23,43],[23,60],[23,75],[23,90],
  [23,105],[24,1],[24,11],[24,21],[24,28],[24,32],[24,37],[24,44],[24,54],[24,59],[24,62],[25,3],
  [25,12],[25,21],[25,33],[25,44],[25,56],[25,68],[26,1],[26,20],[26,40],[26,61],[26,84],[26,112],
  [26,137],[26,160],[26,184],[26,207],[27,1],[27,14],[27,23],[27,36],[27,45],[27,56],[27,64],[27,77],
  [27,89],[28,6],[28,14],[28,22],[28,29],[28,36],[28,44],[28,51],[28,60],[28,71],[28,78],[28,85],
  [29,7],[29,15],[29,24],[29,31],[29,39],[29,46],[29,53],[29,64],[30,6],[30,16],[30,25],[30,33],
  [30,42],[30,51],[31,1],[31,12],[31,20],[31,29],[32,1],[32,12],[32,21],[33,1],[33,7],[33,16],
  [33,23],[33,31],[33,36],[33,44],[33,51],[33,55],[33,63],[34,1],[34,8],[34,15],[34,23],[34,32],
  [34,40],[34,49],[35,4],[35,12],[35,19],[35,31],[35,39],[35,45],[36,13],[36,28],[36,41],[36,55],
  [36,71],[37,1],[37,25],[37,52],[37,77],[37,103],[37,127],[37,154],[38,1],[38,17],[38,27],[38,43],
  [38,62],[38,84],[39,6],[39,11],[39,22],[39,32],[39,41],[39,48],[39,57],[39,68],[39,75],[40,8],
  [40,17],[40,26],[40,34],[40,41],[40,50],[40,59],[40,67],[40,78],[41,1],[41,12],[41,21],[41,30],
  [41,39],[41,47],[42,1],[42,11],[42,16],[42,23],[42,32],[42,45],[42,52],[43,11],[43,23],[43,34],
  [43,48],[43,61],[43,74],[44,1],[44,19],[44,40],[45,1],[45,14],[45,23],[45,33],[46,6],[46,15],
  [46,21],[46,29],[47,1],[47,12],[47,20],[47,30],[48,1],[48,10],[48,16],[48,24],[48,29],[49,5],
  [49,12],[50,1],[50,16],[50,36],[51,7],[51,31],[51,52],[52,15],[52,32],[53,1],[53,27],[53,45],
  [54,7],[54,28],[54,50],[55,17],[55,41],[55,68],[56,17],[56,51],[56,77],[57,4],[57,12],[57,19],
  [57,25],[58,1],[58,7],[58,12],[58,22],[59,4],[59,10],[59,17],[60,1],[60,6],[60,12],[61,6],
  [62,1],[62,9],[63,5],[64,1],[64,10],[65,1],[65,6],[66,1],[66,8],[67,1],[67,13],[67,27],
  [68,16],[68,43],[69,9],[69,35],[70,11],[70,40],[71,11],[72,1],[72,14],[73,1],[73,20],[74,18],
  [74,48],[75,20],[76,6],[76,26],[77,20],[78,1],[78,31],[79,16],[80,1],[81,1],[82,1],[83,7],
  [83,35],[85,1],[86,1],[87,16],[89,1],[89,24],[91,1],[92,15],[95,1],[97,1],[98,8],[100,10],
  [103,1],[106,1],[109,1],[112,1]
];

/* --------------------------------------------------------------------------
   PERPUSTAKAAN RUJUKAN — kitab hukum Islam (fiqih & ushul fiqih)
   Data diverifikasi dari katalog Penerbit Qaf (https://penerbitqaf.com), September 2026:
   judul, penulis, ISBN, dan ringkasan disalin ringkas dari halaman produk masing-masing.
   "spine" mengatur warna punggung buku di rak 3D. Tautan menuju halaman produk resmi.
   -------------------------------------------------------------------------- */
const LIBRARY_BOOKS = [
  {
    id: "waraqat",
    title: "Syarah al-Waraqat",
    subtitle: "Fi Ushul al-Fiqh — Memahami Kaidah Asasi Hukum Islam",
    authors: "Imam Haramain al-Juwaini & Imam Jalaluddin al-Mahalli",
    field: "Ushul Fiqih",
    year: "2022",
    pages: "248 halaman",
    isbn: "978-623-6219-30-0",
    blurb: "Kitab dasar ilmu ushul fiqih karya Imam al-Juwaini (w. 478 H), diulas Jalaluddin al-Mahalli, disandingkan teks Arab dan dilengkapi skema agar konsepnya mudah dipahami.",
    url: "https://penerbitqaf.com/product/syarah-al-waraqat/",
    spine: "#5c3a21", label: "#e7d7b8"
  },
  {
    id: "kaidah-fiqih",
    title: "Kaidah-Kaidah Fiqih",
    subtitle: "Al-Qawa'id al-Fiqhiyyah",
    authors: "Muhammad Maftuhin Ar-Raudli",
    field: "Qawa'id Fiqhiyyah",
    year: "2024",
    pages: "—",
    isbn: "",
    blurb: "Mengulas kaidah umum yang merangkum beragam persoalan fiqih: lima kaidah utama (al-qawa'id al-khams al-kubra), kaidah umum, dan kaidah yang diperselisihkan ulama.",
    url: "https://penerbitqaf.com/product/kaidah-kaidah-fiqih/",
    spine: "#1f6b52", label: "#eaf3ec"
  },
  {
    id: "empat-mazhab",
    title: "Fiqih Praktis Empat Mazhab",
    subtitle: "Buku Pegangan Utama",
    authors: "Majdah Amir",
    field: "Fiqih Perbandingan Mazhab",
    year: "2017",
    pages: "504 halaman",
    isbn: "978-602-71435-7-9",
    blurb: "Ketentuan hukum ibadah mendasar dibahas lewat pendapat empat mazhab (Syafi'i, Hanafi, Maliki, Hanbali) dengan pola tanya-jawab dan dalilnya masing-masing.",
    url: "https://penerbitqaf.com/product/buku-pegangan-utama-fiqih-praktis-empat-mazhab/",
    spine: "#2b3f7a", label: "#dde3f2"
  },
  {
    id: "fiqih-wanita",
    title: "Fiqih Wanita",
    subtitle: "Segala Hal yang Ingin Anda Ketahui tentang Perempuan dalam Hukum Islam",
    authors: "Dr. Majdah Amir",
    field: "Fiqih Munakahat & Waris",
    year: "2023",
    pages: "628 halaman",
    isbn: "978-602-71435-9-3",
    blurb: "Membahas hak waris, pertunangan, akad nikah, hingga pernikahan beda agama dari sudut pandang hukum Islam, disusun dalam bab-bab tematik.",
    url: "https://penerbitqaf.com/product/buku-pegangan-utama-fiqih-wanita/",
    spine: "#7a2b4f", label: "#f3dfe8"
  },
  {
    id: "kontemporer-1",
    title: "Fiqih Kontemporer",
    subtitle: "Buku 1 — Menjawab 111 Masalah Aktual Hukum Islam di Zaman Kita",
    authors: "Prof. Dr. H. Ahmad Zahro, M.A.",
    field: "Fiqih Kontemporer",
    year: "2016",
    pages: "448 halaman",
    isbn: "978-602-71435-2-4",
    blurb: "111 soal aktual—ibadah, muamalah, hingga fiqih munakahat—dijawab dengan metode istinbath manhaji atas Al-Qur'an, hadis, dan kaidah fiqih.",
    url: "https://penerbitqaf.com/product/fiqih-kontemporer/",
    spine: "#8f6a17", label: "#f2e8d2"
  },
  {
    id: "kontemporer-3",
    title: "Fiqih Kontemporer",
    subtitle: "Buku 3 — Kupas 111 Isu Terbaru dalam Hukum Islam",
    authors: "Prof. Dr. K.H. Ahmad Zahro, M.A.",
    field: "Fiqih Kontemporer",
    year: "2017",
    pages: "440 halaman",
    isbn: "978-602-71435-4-8",
    blurb: "Mencakup fiqih ibadah, muamalah, munakahat, jinayah, hingga fiqih kesehatan—111 isu terkini dijawab dengan bahasa sederhana.",
    url: "https://penerbitqaf.com/product/fiqih-kontemporer-buku-3/",
    spine: "#8f6a17", label: "#f2e8d2"
  },
  {
    id: "kontemporer-4",
    title: "Fiqih Kontemporer",
    subtitle: "Buku 4 — Tanya Jawab 111 Isu Aktual dalam Hukum Islam",
    authors: "Prof. Dr. K.H. Ahmad Zahro, M.A.",
    field: "Fiqih Kontemporer",
    year: "2022",
    pages: "328 halaman",
    isbn: "978-623-6219-27-0",
    blurb: "Melanjutkan seri Fiqih Kontemporer 1–3, membahas isu akidah-spiritualitas hingga muamalah dan munakahah masa kini.",
    url: "https://penerbitqaf.com/product/fiqih-kontemporer-buku-4/",
    spine: "#8f6a17", label: "#f2e8d2"
  }
];
const LIBRARY_SOURCE = { name: "Penerbit Qaf", url: "https://penerbitqaf.com/seri-kitab-terjemahan/" };
