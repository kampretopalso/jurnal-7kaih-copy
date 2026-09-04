# 🇮🇩 Jurnal 7 KAIH
### SMP Negeri 2 Glagah — Banyuwangi, Jawa Timur
> **Versi: `v1.1.0` (Official Production)**  
> Platform Web Pencatatan & Evaluasi Pembiasaan Karakter Luhur Peserta Didik Berbasis Cloud Database Realtime.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brownyguy666/jurnal-7kaih)

---

## 🏫 Ingin Menggunakan Aplikasi Ini untuk Sekolah Anda? (Replikasi Mandiri)
Aplikasi ini bersifat sumber terbuka (*open source*) dan dapat direplikasi secara **100% GRATIS** oleh sekolah mana pun di Indonesia!
- 📜 **Skrip SQL Database 1-Klik**: [`supabase/SETUP_SEKOLAH_BARU.sql`](supabase/SETUP_SEKOLAH_BARU.sql)
- 📖 **Panduan Langkah Demi Langkah Operator/Guru TIK**: [**Baca Panduan Replikasi Lengkap di Sini**](PANDUAN_REPLIKASI_SEKOLAH.md)
- ⏱️ **Waktu Setup**: Hanya butuh 10–15 menit untuk mengaktifkan sistem lengkap dengan domain sekolah sendiri.

---

## 📌 Identitas Satuan Pendidikan
- **Nama Sekolah**: SMP Negeri 2 Glagah
- **NPSN**: 20525649
- **Bentuk Pendidikan**: SMP (Negeri)
- **Akreditasi**: A
- **Jumlah Rombel**: 18 Kelas (Kelas 7A s.d. 9F)
- **Total Siswa Riil**: 563 Siswa
- **Total Pendidik & Staf**: 22 Pengguna (Superadmin, Kepala Sekolah, Waka Kurikulum, Kesiswaan, 18 Wali Kelas)
- **Alamat**: Jl. Kenjo No.45, Glagah, Kec. Glagah, Kab. Banyuwangi, Jawa Timur 68432
- **Website Resmi**: [https://smpnegeri2glagah.sch.id/](https://smpnegeri2glagah.sch.id/)

---

## 🎯 7 Kebiasaan Resmi Kemendikdasmen RI
Sistem mencatat pembiasaan siswa dengan urutan baku resmi Kementerian Pendidikan Dasar dan Menengah RI:
1. **Bangun Pagi** *(Target Ideal: 04.00 – 05.30 WIB)*
2. **Beribadah** *(Sholat 5 Waktu: Subuh, Dzuhur, Ashar, Maghrib, Isya / Ibadah Keagamaan)*
3. **Berolahraga** *(Minimal 15–30 menit pembiasaan fisik sehat)*
4. **Makan Sehat dan Bergizi** *(Maksimal 2x input per hari)*
5. **Gemar Belajar** *(Membaca buku, mengulang pelajaran, eksplorasi pengetahuan, wajib cerita refleksi min. 100 kata)*
6. **Bermasyarakat** *(Aktivitas gotong royong, sosial, membantu sesama dengan nama kegiatan)*
7. **Tidur Cepat** *(Target Ideal: 20.00 – 22.00 WIB, batas toleransi s.d. 22.15 WIB)*

---

## ⏰ Jam Operasional Pengisian Jurnal Harian
- **Jendela Pengisian Aktif**: Setiap hari dibuka mulai **pukul 01.00 WIB s.d. 24.00 WIB** (23:59:59).
- **Jeda Pergantian Tanggal**: Pukul 00.00 – 01.00 WIB sistem membatasi submisi dengan notifikasi informatif untuk sinkronisasi harian server.
- **Evaluasi Ketepatan Waktu Realtime**:
  - 🟢 **Tepat Waktu**: Sesuai jam target ideal kebiasaan.
  - 🟡 **Toleransi**: Masuk dalam rentang toleransi (+15 menit).
  - 🔴 **Terlambat / Kemalaman**: Melewati batas jam ideal & toleransi.
  - ⚪ **Selesai**: Untuk kebiasaan dengan waktu fleksibel sepanjang hari.

---

## 👥 Multi-Role & Hak Akses Pengguna

### 1. 🎓 Peserta Didik (Siswa — 563 Siswa)
- **Login**: Menggunakan **NISN** (10 digit).
- **Password Default**: Tanggal Lahir format `DDMMYYYY` (misal: `12042011`).
- **Fitur**:
  - Input jurnal harian 7 kebiasaan secara mandiri.
  - Bukti foto langsung kamera (`capture="environment"`) atau unggah galeri.
  - **Anti-Kecurangan EXIF**: Deteksi otomatis tanggal pengambilan foto asli (`DateTimeOriginal`) via `exifr`. Foto tangkapan layar/WhatsApp diberi tanda `flag_foto_mencurigakan` tanpa memblokir pengiriman.
  - **Kompresi Client-Side**: Otomatis dikompresi (< 1MB) sebelum diunggah ke cloud storage.
  - **Pesan Apresiasi Guru**: Menampilkan kartu notifikasi motivasi dan pesan pembinaan dari wali kelas/guru di dashboard utama.
  - **Kotak Suara Siswa**: Form opsional untuk mengirimkan curhat pembiasaan, keluhan kendala teknis, atau ide inovasi aplikasi secara terlindungi/anonim ke bapak/ibu guru serta menerima balasan resmi.

### 2. 👨‍🏫 Wali Kelas (18 Rombel: 7A – 9F)
- **Login**: Menggunakan **NIP / NIK / Username**.
- **Password Default**: Tanggal Lahir format `DDMMYYYY`.
- **Fitur**:
  - Matriks rekapitulasi harian siswa di kelas binaan.
  - Inspeksi detail entri jurnal, preview foto resolusi tinggi, dan metadata EXIF.
  - **Beri Feedback & Motivasi Siswa**: Tombol feedback cepat per siswa lengkap dengan pilihan template motivasi siap pakai.
  - **Moderasi & Hapus Entri**: Wali kelas dapat menghapus entri tidak valid disertai alasan wajib yang tercatat dalam audit log (`log_hapus`).
  - **Banner Peringatan 3 Hari Pasif**: Deteksi siswa yang 3 hari berturut-turut belum mengisi jurnal dengan tombol **📢 Ingatkan Semua via WA** untuk menyalin template pengingat ke grup kelas/wali murid.
  - **Kotak Suara Siswa (Anonim)**: Membaca curhat dan masukan siswa kelas binaan dalam mode tersamar serta memberikan tanggapan resmi.
  - **Export & Share**: Cetak laporan format Excel (`.xlsx`) via SheetJS atau bagikan rekap ke WhatsApp wali murid.

### 3. 🏛️ Pimpinan Sekolah (Kepala Sekolah, Waka Kurikulum, Kesiswaan)
- **Login**: Menggunakan **NIP / NIK**.
- **Password Default**: Tanggal Lahir format `DDMMYYYY`.
- **Fitur**:
  - **Executive Overview**: Pantau metrik kepatuhan 563 siswa di 18 rombel secara realtime.
  - **Arahan & Feedback Kelas**: Mengirimkan instruksi dan feedback resmi kepada wali kelas dengan 4 kategori (*Apresiasi*, *Evaluasi*, *Instruksi*, *Tindak Lanjut*).
  - **Early Warning Radar & Copy WA Broadcast**: Memantau siswa pasif $\ge 3$ hari dan menyalin pesan peringatan broadcast langsung ke grup WhatsApp wali kelas.
  - **Kotak Suara Siswa (Anonim)**: Memantau aspirasi dan keluhan seluruh siswa 18 kelas secara anonim dan meresponsnya.
  - **Laporan Drill-Down 18 Kelas (Ikon Mata 👁️)**: Membuka modal inspeksi detail rekapitulasi per kelas lengkap dengan foto bukti dan persentase kehadiran.

### 4. 🔑 Super Administrator
- **Login**: Menggunakan akun Super Administrator terdaftar (Kredensial Khusus Pengelola IT Sekolah)
- **Fitur Tertinggi**:
  - **Rename & Edit Data Lengkap**: Mengubah nama, NISN/NIP, dan kelas guru maupun siswa secara langsung.
  - **Password Manager**: Melihat semua password siswa & staf secara transparan (dengan *show/hide eye toggle*), menyalin password, serta mengganti/mereset password langsung ke database Supabase Cloud.
  - **Audit Suara Siswa**: Membaca seluruh curhatan/ide siswa dengan tampilan nama asli dan NISN pengirim untuk tujuan pendampingan terarah & keamanan.
  - **Evaluasi Progress & Date Range**: Analisis kepatuhan dengan kustomisasi tanggal mulai s.d. tanggal selesai serta bulk peringatan ke seluruh wali kelas.
  - **Import Massal Dapodik/Excel**: Unggah dan sinkronkan data siswa & staf baru via file Excel/CSV dengan pemetaan kolom cerdas.
  - **Konfigurasi 7 Kebiasaan**: Kustomisasi jam target, toleransi waktu, dan kuota input harian untuk setiap butir kebiasaan.
  - **💾 Manajemen Kuota, Backup ZIP & Google Drive**: Unduh cadangan seluruh foto murid (.ZIP), pembersihan aman storage server tanpa menghapus catatan/poin siswa, restore foto dari ZIP, dan integrasi Google Drive (100% gratis, 0 Byte Egress Supabase).

---

## 🛠️ Arsitektur & Tech Stack

| Komponen | Teknologi yang Digunakan |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & UI** | Tailwind CSS + Lucide React Icons |
| **Cloud Database** | PostgreSQL via Supabase Cloud (RLS Active) |
| **Penyimpanan Foto (Dual Mode)** | Supabase Storage (`bukti_foto`) & Google Drive (via Google Apps Script Web App - 0% Egress) |
| **Image Compression** | HTML5 Canvas WebP Ultra-Compressor (Hemat kuota 90%) |
| **Backup & Restore Engine** | `jszip` (Client-side ZIP Packaging & Manifest Extraction) |
| **Anti-Kecurangan** | `exifr` (EXIF Metadata Reader) |
| **Spreadsheet Engine** | `xlsx` (SheetJS) |
| **Visual Effects** | `canvas-confetti` |

---

## 🚀 Panduan Menjalankan Proyek

### 1. Instalasi Lokal
```bash
# Clone repository
git clone https://github.com/brownyguy666/jurnal-7kaih.git
cd jurnal-7kaih

# Install dependensi
npm install

# Buat file environment (.env)
cp .env.example .env
```

Isi file `.env` dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

Jalankan server development:
```bash
npm run dev
```
Akses di browser: `http://localhost:5173`

### 2. Build untuk Produksi
```bash
npm run build
```

---

## ☁️ Deployment ke Vercel
1. Hubungkan repository GitHub `brownyguy666/jurnal-7kaih` ke [Vercel](https://vercel.com).
2. Konfigurasikan **Environment Variables** di Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Vercel akan melakukan *Automatic Deployment* setiap kali ada push ke branch `main`.

---

## 📜 Catatan Perubahan & Riwayat Rilis (Changelog)

### [v1.1.0] - 2026-09-04 *(Solusi Krisis Kuota Supabase Egress 96%, Kompresi WebP Hemat 90%, Backup & Restore Foto ZIP, dan Integrasi Google Drive)*
- **Solusi Egress & Penyimpanan Google Drive Bebas Biaya**:
  - Dukungan Google Drive via Google Apps Script Web App (15 GB gratis per akun Google atau Unlimited di akun `@guru.smp.belajar.id`), memangkas beban egress Supabase hingga 0 Byte.
  - Failover otomatis multi-provider (`supabase`, `gdrive`, `cloudinary`) di panel Superadmin.
- **Kompresi Modern WebP Sisi Klien**:
  - Optimalisasi gambar ke format WebP 720px kualitas 0.55 (~25–45 KB, hemat kuota data dan storage 90%).
- **Mesin Cadangan & Pemulihan Foto Murid (.ZIP)**:
  - Unduh seluruh foto bukti jurnal siswa terorganisir per kelas dan nama siswa beserta file `manifest_backup.json`.
  - Pembersihan berkas fisik server aman (*Reclaim Server Storage*) dengan mempertahankan nilai, catatan, refleksi, dan poin siswa 100%.
  - Fitur pemulihan foto (*Restore from ZIP*) untuk mengunggah dan menyinkronkan kembali foto arsip kapan saja.
- **Panel Manajemen Penyimpanan Superadmin**:
  - Modal 5-in-1 untuk pantauan kuota, backup ZIP, pembersihan foto berkala, pemulihan, dan panduan aktivasi Google Drive.

---

### [v1.0.0] - 2026-08-30 *(Komunikasi Siswa-Guru Dua Arah, Multi-Tanggapan Dewan Guru, Sinkronisasi Cloud Profil Sekolah, Rentang Tanggal Leaderboard, & Rapor Karakter Berkeadilan)*
- **Komunikasi Dua Arah Siswa & Guru / Pimpinan**: Modul pesan apresiasi, motivasi, bimbingan konseling, dan konsultasi pembiasaan dengan kotak masuk & indikator belum dibaca.
- **Multi-Tanggapan Dewan Guru**: Seluruh guru (Wali Kelas, BK, Kurikulum, KS) dapat memberikan tanggapan bersusun pada suara/aspirasi siswa.
- **Sinkronisasi Profil Sekolah Multi-Device**: Sinkronisasi identitas sekolah & logo via Supabase Storage bucket `bukti_foto/config/school_profile.json` dan database.
- **Filter Rentang Tanggal Leaderboard & Rapor Karakter Berkeadilan**: Evaluasi objektif berdasarkan jumlah hari kalender periode evaluasi.

---

### [v0.9.1] - 2026-08-26 *(Sinkronisasi Realtime Suara & Curhat Siswa, Migrasi Cloud Schema, & Pembersihan Mock)*
- **Sinkronisasi Cloud Realtime Suara Siswa**:
  - Menyediakan skrip migrasi database `supabase/create_suara_siswa.sql` untuk membuat tabel `suara_siswa` dengan relasi ke siswa, kelas, dan staf serta proteksi RLS.
  - Memperbarui `journalService.ts` untuk menyinkronkan aspirasi, keluhan, dan tanggapan secara langsung ke Supabase Cloud.
- **Pembersihan Data Mock Lokal**:
  - Menghapus inisialisasi mock data dummy (`suara-1` dari `s-01`) agar data yang tampil 100% merupakan aspirasi nyata siswa yang telah tersinkronkan.
- **Pemetaan Kelas Tangguh (*Resilient Class Mapping*)**:
  - Menyempurnakan filter suara siswa untuk Wali Kelas, Kepala Sekolah, Waka Kurikulum, Kesiswaan, dan Superadmin agar tidak terhalang variasi ID string / UUID rombel kelas.
- **Pemberitahuan Login Informatif & Tepat Sasaran**:
  - Validasi username/NISN/NIP: jika salah, menampilkan pesan *"Username tidak ditemukan"*.
  - Validasi password siswa: jika salah, menampilkan *"Password salah. Silakan tanyakan kepada bapak/ibu wali kelas atau guru Anda jika Anda lupa password."*
  - Validasi password guru/staf: jika salah, menampilkan *"Password salah. Silakan menghubungi Superadmin sekolah untuk memeriksa atau mereset password akun Anda."*

---

### [v0.9.0] - 2026-08-26 *(Pusat Piagam Penghargaan Kepala Sekolah: Multi-Periode & Kategori Prestasi Siswa / Guru)*
- **Penerbitan Piagam Multi-Periode Fleksibel (Kepala Sekolah)**:
  - Kepala Sekolah dapat menerbitkan dan mencetak sertifikat piagam resmi untuk 4 rentang periode evaluasi: **📅 Harian (Daily)**, **🗓️ Mingguan (Weekly / 7 Hari)**, **📊 Bulanan (Monthly / 1 Bulan Penuh)**, dan **🏛️ Semester (Semester Ganjil & Genap)**.
- **Diversifikasi Kategori Piagam Prestasi Siswa**:
  1. 🌟 **Siswa Teladan Terdisiplin**: Capaian ketuntasan 100% dan integritas bukti foto asli valid.
  2. 🔥 **Siswa Terkonsisten (Streak Master)**: Rekor hari pengisian berturut-turut terpanjang tanpa terputus.
  3. 🚀 **Siswa Ter-Effort (Most Improved)**: Lonjakan pertumbuhan dan daya juang kepatuhan karakter tertinggi ($+\Delta\%$).
  4. 📖 **Duta Literasi 7KAIH (Gemar Belajar #5)**: Siswa paling aktif menuliskan refleksi bacaan dan pembelajaran bermutu.
  5. 🤝 **Bintang Karakter Sosial (Bermasyarakat #6)**: Keaktifan gotong royong dan kontribusi sosial teraktif.
  6. 🏃 **Bintang Kebugaran & Olahraga (Berolahraga #3)**: Kedisiplinan berolahraga dan menjaga kebugaran fisik jasmani.
- **Kategori Piagam Prestasi Kelas & Pendidik / Wali Kelas**:
  1. 👑 **Kelas Juara 1 Terdisiplin**: Kelas dengan Skor Tertib dan persentase kepatuhan kolektif tertinggi pada periode tersebut.
  2. 🥇 **Wali Kelas Ter-Istiqomah**: Wali kelas pembina yang konsisten mendampingi kelasnya di peringkat atas klasemen.
  3. ⚡ **Wali Kelas Ter-Effort (Highest Growth)**: Wali kelas dengan lonjakan pertumbuhan kepatuhan siswa terbesar ($+\Delta\%$).
  4. 💬 **Wali Kelas Paling Responsif & Inspiratif**: Pendidik paling aktif memberikan pendampingan, arahan, dan feedback motivasi harian.
- **Penerbitan Piagam Kustom Fleksibel**:
  - Formulir penerbitan piagam kustom untuk memilih siswa, guru/staf, atau rombel kelas tertentu di luar sistem pemenang otomatis dengan kustomisasi judul, nomor surat resmi, kategori, dan deskripsi apresiasi.
- **Format Cetak A4 Landscape Standar Resmi**: Desain sertifikat bernuansa emas elegan dengan ornamen ganda, watermark garuda/bintang karakter, nomor surat dinamis, badge kategori, dan tanda tangan Kepala Sekolah.

---

### [v0.8.0] - 2026-08-26 *(Branding Resmi Jurnal 7 KAIH, Suara & Curhat Siswa, Date Range Picker, & Bulk Reminder WA)*
- **Branding Resmi & Standarisasi Aplikasi (`Jurnal 7 KAIH`)**: Menstandarkan seluruh antarmuka, navbar, footer, login view, dashboard router, modal rapor, header ekspor Excel, dan format WhatsApp ke nama resmi **Jurnal 7 KAIH**.
- **Kotak Aspirasi & Curhat Siswa ("Suara Siswa")**:
  - Siswa dapat mengirimkan curhatan pembiasaan, keluhan kendala teknis/kehidupan, maupun ide/saran inovasi aplikasi secara opsional setiap hari melalui modal interaktif.
  - **Privasi Terproteksi (Anonim)**: Wali Kelas, Kepala Sekolah, Waka Kurikulum, dan Kesiswaan membaca pesan dengan label *"Siswa Kelas [Rombel] (Anonim)"* dan dapat memberikan tanggapan resmi yang langsung muncul di dashboard siswa.
  - **Audit Superadmin**: Hanya Superadministrator yang memiliki hak khusus untuk melihat nama dan NISN asli siswa demi keamanan dan pembinaan terarah.
- **Date Range Picker Kustom pada Evaluasi Progress**:
  - Pemilihan rentang tanggal fleksibel (*Start Date s.d. End Date*) dengan tombol preset cepat (*Hari Ini*, *7 Hari Terakhir*, *30 Hari Terakhir*, *Bulan Ini*, *1 Semester Penuh*).
  - Menghilangkan tab Peringkat 18 Kelas yang duplikat pada tab Progress agar Leaderboard tetap fokus dan eksklusif di tab klasemen.
- **Peringatan Massal (Bulk Reminder) Siswa Pasif via WhatsApp & In-App**:
  - **Superadmin, KS, Kurikulum, Kesiswaan**: Tombol *Bulk Peringatan ke Semua Wali Kelas* yang otomatis mengirimkan arahan in-app serentak dan membuat template WhatsApp broadcast lengkap dengan rincian nama siswa per kelas.
  - **Wali Kelas**: Tombol *📢 Ingatkan Semua via WA* langsung di banner peringatan siswa pasif 3 hari berturut-turut untuk menyalin format pengingat ke grup kelas/wali murid.

---

### [v0.7.0] - 2026-08-26 *(Superadmin Rename, Radar Inactivity 3 Hari, & Student Progress Dashboard)*
- **Fitur Rename & Edit Data Lengkap Guru / Siswa (Khusus Superadmin)**: Superadmin dapat me-rename nama, memperbarui NISN/NIP, mengubah rombel kelas, atau memperbarui data staf dan siswa secara instan melalui modal `EditUserModal`.
- **Radar & Laporan Siswa Tidak Mengisi Jurnal 3 Hari Berturut-turut**:
  - Deteksi otomatis siswa pasif yang tidak memiliki satupun entri selama 3 hari terakhir secara berturut-turut.
  - Dilengkapi **sebaran per 18 kelas (7A–9F)**, rincian tanggal terakhir mengisi, dan tombol **Export Laporan Excel (.xlsx)**.
- **Dashboard Gambaran Lengkap Progress Siswa (`StudentProgressOverview`)**:
  - Visualisasi distribusi tingkat kepatuhan siswa (🌟 *7/7 Tuntas Sempurna*, 🟢 *5-6 Sangat Aktif*, 🟡 *3-4 Cukup Aktif*, 🔴 *Belum Mengisi*).
  - Capaian partisipasi per 7 Kebiasaan Resmi Kemendikdasmen.
  - Peringkat & persentase kepatuhan 18 rombongan belajar (7A s.d 9F).
- **Refleksi Literasi Gemar Belajar (Wajib Min. 100 Kata)**: Menerapkan validasi wajib cerita refleksi minimal 100 kata pada kebiasaan #5 (Gemar Belajar) dengan *live word counter badge*, *progress bar*, dan pemantik kalimat singkat.

---

### [v0.6.0] - 2026-08-26 *(Multi-Period Aggregation & Hall of Fame)*
- **Agregasi Rekap Multi-Periode Fleksibel**: Filter evaluasi kinerja **Harian (Daily)**, **Mingguan (Weekly / 7 Hari)**, **Bulanan (Monthly)**, dan **1 Semester Penuh (Jul–Des / Jan–Jun)** untuk seluruh 18 rombel dan individu siswa.
- **🌟 Hall of Fame: Apresiasi Siswa & Wali Kelas**:
  - **🔥 Siswa Terkonsisten (Streak Master)**: Menghitung streak pengisian beruntun tanpa jeda (Kategori: *3 Hari*, *1 Minggu*, *1 Bulan*, dan *1 Semester 90+ Hari*).
  - **🚀 Siswa Ter-Effort (Most Improved)**: Mengapresiasi siswa dengan lonjakan progresivitas kepatuhan tertinggi ($+\Delta\%$) dari hari-hari sebelumnya.
  - **👑 Wali Kelas Ter-Istiqomah (Consistent Top Mentor)**: Menghargai wali kelas yang konsisten membawa kelas binaannya berada di papan atas klasemen sekolah.
  - **⚡ Wali Kelas Ter-Effort (Highest Class Growth)**: Menghargai wali kelas yang paling gigih mendongkrak kepatuhan dan keaktifan kelasnya ($+\Delta\%$ lonjakan terbesar).
- **Auto-Range Chunked Pagination**: Penarikan data Supabase secara bertingkat (*multi-page range pagination*) mengatasi limit 1.000 baris PostgREST agar seluruh riwayat tersaji 100% utuh.

---

### [v0.5.1] - 2026-08-25 *(Presisi Hisab Sholat Banyuwangi & Aturan Dhuhur)*
- **Engine Hisab Astronomis Banyuwangi**: Menghitung jadwal 5 waktu sholat secara dinamis dan presisi berdasarkan titik koordinat SMPN 2 Glagah (Latitude -8.2192° S, Longitude 114.3691° E, Standar Kemenag RI).
- **Aturan Sholat Dhuhur Hari Minggu vs. Hari Sekolah**:
  - Hari Senin–Sabtu: Siswa sholat Dhuhur berjamaah di sekolah (target mandiri di rumah 4 waktu).
  - Hari Minggu: Dinilai 5 waktu penuh dari rumah (termasuk Dhuhur).
- **Koreksi Elevasi Sudut Ashar**: Memperbaiki rumus hisab sudut matahari Ashar di atas ufuk sehingga rentang waktu valid berada tepat di `14.47 – 17.25 WIB`.

---

### [v0.5.0] - 2026-08-25 *(Diversifikasi Peran, Gamifikasi & Rapor Karakter)*
- **Diversifikasi Tupoksi Peran**:
  - **Kepala Sekolah**: 1-Klik Cetak Piagam Penghargaan Resmi Juara 1 Siswa & Rombel Teladan.
  - **Waka Kurikulum**: Portofolio Khusus Kebiasaan #5 (Gemar Belajar & Literasi Buku).
  - **Kesiswaan & Guru BK**: Radar Pembinaan Dini (*Early Warning Radar*) untuk siswa pasif $\ge 3$ hari, sering terlambat, atau terindikasi anomali foto.
  - **Wali Kelas**: Catatan motivasi instan (*Quick Feedback Chips*) langsung ke profil siswa.
- **Gamifikasi & PWA**: 13 badge lencana pencapaian karakter dan PWA installable.
- **Rapor Karakter 7KAIH (Standar A4 Resmi)**: Format cetak A4 resmi lengkap dengan Kop SMPN 2 Glagah, nilai capaian predikat (A/B/C/D), deskripsi otomatis, serta kolom tanda tangan Wali Kelas, Kepala Sekolah, dan Orang Tua/Wali Murid.

---

### [v0.4.0] - 2026-08-24 *(Papan Peringkat, Export Excel & Integrasi Cloud)*
- **Papan Peringkat 18 Rombel (7A - 9F)**: Formula Skor Tertib berdasarkan persentase kepatuhan, siswa tuntas 7/7, dan minimnya pelanggaran foto.
- **Siswa Teladan Tercepat & Terbersih**: Filter ketat untuk menyaring murid terbaik harian dengan integritas foto 100%.
- **Export & Share**: Export rekapitulasi kelas dan sekolah ke Microsoft Excel (`.xlsx`) dan WhatsApp broadcast.

---

### [v0.3.1] - 2026-08-24 *(Jam Operasional & Feedback Realtime)*
- **Jam Operasional Harian**: Penetapan jendela input jurnal setiap hari pukul **01.00 – 24.00 WIB** disertai pesan notifikasi jeda pergantian hari (00.00 – 01.00 WIB).
- **Feedback Siswa Realtime**: Penambahan tombol feedback langsung pada tabel rekap wali kelas & pimpinan beserta template apresiasi cepat.
- **Superadmin Password Manager**: Fitur melihat password aktif (show/hide toggle) dan modal ubah/reset password siswa & staf langsung tersinkron ke Supabase Cloud.

---

### [v0.3.0] - 2026-08-23 *(Integritas Foto EXIF & Anti-Fraud)*
- **Pemeriksaan Metadata EXIF**: Pemeriksaan otomatis *DateTimeOriginal*, *Software*, dan *Device Model*.
- **Deteksi Status Waktu Otomatis**: Evaluasi otomatis (*Tepat Waktu*, *Toleransi +15m*, *Terlambat*).
- **Flag Anomali Foto**: Sistem deteksi foto mencurigakan untuk mencegah kecurangan unggahan galeri lawas atau manipulasi jam HP.

---

### [v0.2.0] - 2026-08-22 *(Manajemen Akun & Basis Data)*
- **Manajemen Akun Siswa & Staf**: Manajemen akun 563 siswa dan 22 staf sekolah.
- **Format Sandi Tanggal Lahir**: Format default sandi tanggal lahir siswa (`DDMMYYYY`) dan reset sandi.
- **Sinkronisasi Realtime**: Sinkronisasi data realtime dengan PostgreSQL Supabase.

---

### [v0.1.0] - 2026-08-20 *(Inisiasi Proyek Jurnal 7KAIH)*
- **Fondasi Aplikasi**: Implementasi 7 Kebiasaan Anak Indonesia Hebat (Bangun Pagi, Beribadah, Berolahraga, Makan Sehat, Gemar Belajar, Bermasyarakat, Tidur Cepat) dengan autentikasi multi-role.
- **Kompresi Gambar Client-Side**: Otomatis kompresi gambar sebelum unggah ke cloud storage.


---

## 🏫 Hak Cipta & Pengembang
Dikelola dan dioperasikan oleh Tim IT **SMP Negeri 2 Glagah**, Banyuwangi, Jawa Timur.  
*Program Penguatan Pendidikan Karakter — Kementerian Pendidikan Dasar dan Menengah Republik Indonesia.*
