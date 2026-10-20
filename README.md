# Tilawah Dunia

Situs murottal dan kajian fiqih (HTML + CSS + JavaScript, tanpa framework).

## Cara menjalankan
1. Buka `index.html` di browser (lebih baik lewat server lokal, mis. ekstensi *Live Server* di VS Code, atau `python -m http.server`).
2. Perlu koneksi internet: audio dari katalog mp3quran.net, teks Al-Qur'an dari jsDelivr, dan huruf lain dari Google Fonts.

## Struktur
- `index.html` — kerangka halaman
- `css/style.css` — tampilan (buku 3D, kaca pembesar, pemutar)
- `js/data.js` — **data qari, riwayat, topik kajian**, dan pengaturan sumber teks Al-Qur'an (yang paling sering Anda ubah)
- `fonts/` — font Amiri Quran (lisensi SIL OFL) agar tanda baca Al-Qur'an tampil lengkap
- `js/app.js` — logika: buku & balik halaman, filter, kaca pembesar, pemutar audio, kajian, bacaan teks + terjemah
- `js/mushaf.js` — tampilan **Mushaf Madinah 3D** (604 halaman, balik halaman, tanpa terjemah)
- `js/library.js` — **Perpustakaan Rujukan**: rak buku 3D interaktif (CSS 3D transform, tanpa WebGL)

## Menambah qari
Salin satu blok di `QARI` (js/data.js), lalu ubah `id`, `arabic`, `name`, `keys`, dan `readings`.
`keys` adalah potongan nama qari di katalog mp3quran (huruf kecil), contoh `["afasy"]`.
`moshaf` adalah kata kunci nama riwayatnya, contoh `["warsh"]`. Lembar baru muncul otomatis.
Jika sebuah riwayat tidak ditemukan, pilihannya ditandai "(belum tersedia)".

## Memasang foto qari
Simpan foto di `img/qari/`, lalu isi `photo: "img/qari/nama.jpg"` pada qari yang bersangkutan.
Jika kosong (atau file tidak ditemukan), halaman memakai ilustrasi lengkung mihrab.
Gunakan foto yang lisensinya jelas (mis. Wikimedia Commons) dan cantumkan sumbernya.

## Bacaan Al-Qur'an 30 juz
Bagian "Baca Al-Qur'an" memuat teks Arab (Utsmani) dan terjemahan Bahasa Indonesia Kementerian Agama,
per juz atau per surah, dengan pilihan terjemahan, transliterasi, dan ukuran huruf.

- Data diambil per surah dari paket **quran-json** lewat jsDelivr (`QURAN_TEXT_BASE` di `js/data.js`). Lisensi CC BY-SA 4.0, jadi cantumkan sumbernya (sudah ada di halaman).
- Data ini **bukan** diambil langsung dari quran.kemenag.go.id: situs itu tidak menyediakan API publik yang terdokumentasi. Terjemahannya berasal dari Kemenag, dan halaman menautkan ke situs resminya untuk mushaf dan tafsir.
- Batas 30 juz ada di `JUZ_START` (`js/data.js`); jumlah ayat per surah di `AYAH_COUNT`.
- Untuk memakai salinan lokal (misalnya saat presentasi tanpa internet): unduh berkas `chapters/id/1.json` sampai `114.json` dari paket quran-json ke folder `data/chapters/`, lalu ubah `QURAN_TEXT_BASE` menjadi `"data/chapters"`.

## Dua tampilan Al-Qur'an
Di bagian "Baca Al-Qur'an" ada dua pilihan tampilan:
1. **Al-Qur'an dan terjemah** — per juz atau per surah, dengan terjemahan Kemenag, disajikan sebagai
   **kartu geser horizontal** (5 ayat per kartu, diatur lewat `SLIDE_SIZE` di `js/app.js`) alih-alih
   satu kolom panjang — supaya halaman tidak perlu digulir jauh untuk sampai ke bagian Perpustakaan
   atau Kajian. Navigasi kartu memakai tombol panah di samping kartu, mendukung geser jari di HP,
   dan tombol panah kiri/kanan keyboard saat kartu berada di tengah layar. Tombol "Sebelumnya /
   Berikutnya" di bawah kartu tetap ada untuk berpindah juz atau surah (mengatur ulang ke kartu pertama).
2. **Mushaf Madinah 3D** — buku dua halaman yang dibaca dari kanan ke kiri, 604 halaman, tanpa terjemah.
   Klik halaman kiri (atau tombol panah kiri) untuk maju, klik halaman kanan (atau panah kanan) untuk mundur.
   Ada pilihan lompat ke juz, surah, atau nomor halaman, dan tombol layar penuh. Di HP tampil satu halaman;
   geser ke kanan untuk halaman berikutnya.

Cara kerjanya:
- `PAGE_START` di `js/data.js` berisi ayat pertama tiap halaman mushaf Madinah (dari paket `quran-meta`, MIT).
  Batas 30 juz sudah dicocokkan dengan paket yang sama.
- Teks tiap halaman disusun dari data Utsmani yang sama dengan tampilan pertama. Ukuran huruf dicari otomatis agar
  isi satu halaman muat dalam bingkai, jadi letak baris **tidak sama persis** dengan cetakan resmi Mujamma' Malik Fahd.
- Hanya lembar di sekitar halaman yang sedang dibuka yang dibuat (bukan 302 sekaligus), supaya tetap ringan.
- Teks sumber memakai karakter U+065E untuk tanwin dhammah; karakter ini tidak ada di font, sehingga diganti U+064C.

## Perpustakaan rujukan (rak buku 3D)
Section "Perpustakaan Rujukan" menampilkan kitab hukum Islam sebagai rak buku 3D. Rak ini dibangun
dengan **CSS 3D transform** (teknik yang sama dengan buku sketsa dan mushaf di situs ini), bukan
WebGL/Three.js. Versi WebGL sempat dicoba lebih dulu tetapi tidak tampil konsisten di berbagai
perangkat; versi CSS 3D jauh lebih ringan dan sudah diuji tampil benar di berbagai ukuran layar.

- **Interaksi**: geser rak dengan jari/mouse (seret langsung) atau tombol panah, klik/sentuh sebuah
  buku untuk memiringkannya dan membuka panel info (penulis, tahun, jumlah halaman, ISBN, ringkasan,
  dan tautan ke halaman produk resmi).
- **Data buku**: `LIBRARY_BOOKS` di `js/data.js` — 7 kitab fiqih dan ushul fiqih yang diverifikasi
  satu per satu dari halaman produk resmi **Penerbit Qaf** (penerbitqaf.com), termasuk Syarah
  al-Waraqat, Kaidah-Kaidah Fiqih, Fiqih Praktis Empat Mazhab, Fiqih Wanita, dan tiga jilid
  Fiqih Kontemporer karya Ahmad Zahro. Untuk menambah kitab, salin satu blok objek di array itu
  dan sesuaikan `title`, `authors`, `field`, `blurb`, `url`, dan warna `spine`/`label`; rak
  menyesuaikan otomatis.

## Video kajian tersemat
Tiap topik di "Catatan kajian fiqih" (`KAJIAN` di `js/data.js`) punya satu `video` (judul, nama
ustadz, `youtubeId`) yang sudah diverifikasi benar-benar ada di YouTube dan relevan dengan topiknya.
Mengklik kartu videonya membuka dialog berisi pemutar YouTube tersemat (`youtube-nocookie.com`)
langsung di halaman, tanpa membuka tab baru. Daftar nama ustadz di bawah kartu tetap membuka
pencarian YouTube, sebagai cara mencari kajian lain pada topik yang sama.

Untuk menambah video baru atau mengganti yang ada, isi `video: { youtubeId, title, ustadz }` pada
topik terkait. Untuk memutar potongan tertentu (bukan dari awal video), tambahkan objek ke array
`clips` pada topik yang sama, dengan `start`/`end` dalam detik:

    clips: [{ title: "Bagian tentang wali nikah", ustadz: "Buya Yahya",
              youtubeId: "eOy5YNzGKD4", start: 180, end: 420 }]

Video-video ini akan tampil sebagai tombol tambahan di bawah kartu utama. Karena mengetahui potongan
waktu yang tepat memerlukan menonton videonya terlebih dahulu, `clips` dibiarkan kosong secara
default; isikan sendiri setelah menonton, atau beri tahu topik dan menit yang diinginkan.

