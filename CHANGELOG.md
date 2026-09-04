# 📜 Changelog - Jurnal 7 KAIH (SMP Negeri 2 Glagah)

Semua pembaruan, perbaikan, dan penambahan fitur aplikasi Jurnal 7 KAIH (7 Karakter Anak Indonesia Hebat) dicatat secara kronologis di bawah ini.

## [v1.1.0] - 2026-09-04 *(Solusi Krisis Kuota Supabase Egress 96%, Kompresi WebP Hemat 90%, Backup & Restore Foto ZIP, dan Integrasi Bebas Biaya Google Drive)*

### 🌟 Fitur Baru & Peningkatan Skalabilitas untuk Replikasi Sekolah
1. **Solusi Egress & Storage Supabase Multi-Provider (`storageService.ts`, `storageConfig.ts`)**:
   - Menghubungkan Google Drive sebagai provider penyimpanan alternatif melalui Google Apps Script Web App (100% gratis, kapasitas 15 GB di Gmail atau Unlimited di akun `@guru.smp.belajar.id`).
   - Seluruh foto bukti jurnal siswa dapat disimpan langsung ke Google Drive dan dimuat dari CDN Google, memangkas konsumsi Egress & Storage Supabase menjadi **0 Byte**.
   - Menyediakan failover otomatis ke Supabase Storage jika terjadi kendala koneksi provider eksternal.
   - Pilihan provider (`supabase` vs `gdrive` vs `cloudinary`) dapat diatur sewaktu-waktu dengan 1 klik oleh Superadmin.

2. **Kompresi Modern WebP Sisi Klien Hemat Kuota 90% (`imageCompressor.ts`)**:
   - Mengubah pipeline kompresi gambar dari JPEG 1280px kualitas 0.8 (~400 KB) menjadi WebP 720px kualitas 0.55 (~25–45 KB).
   - Memangkas ukuran berkas foto secara drastis saat diunggah oleh siswa maupun saat diunduh oleh guru/wali kelas, menghemat kuota internet siswa dan bandwidth server hingga 90%.

3. **Mesin Cadangan Foto Murid (.ZIP) & Metadata Manifest (`photoBackupManager.ts`)**:
   - Superadmin dapat mengunduh seluruh foto jurnal murid dalam satu file `.zip` terstruktur rapi: `[Kelas]/[Nama_Siswa]/[Tanggal]_[Kebiasaan].jpg`.
   - Menyertakan file `manifest_backup.json` yang menyimpan metadata lengkap NISN, nama siswa, tanggal, ID entri, refleksi cerita, status waktu, dan tautan asli.
   - Dilengkapi filter rentang tanggal (Semua Waktu, Bulan Berjalan, Rentang Kustom) dan filter rombel kelas.

4. **Pembersihan Server Aman (*Reclaim Server Storage*)**:
   - Superadmin dapat menghapus berkas foto fisik di Supabase Storage (> 7 hari, > 14 hari, > 30 hari, atau tanggal kustom) untuk mengosongkan kapasitas 540 MB.
   - **Menjamin integritas data siswa**: Catatan cerita, refleksi, poin pembiasaan, serta rekaman waktu siswa **100% aman (tidak hilang)**; foto ditandai dengan status `[TERARSIP]` dan menampilkan banner ramah saat dibuka di modal foto.

5. **Fitur Pemulihan Foto (*Restore from ZIP*)**:
   - Superadmin dapat mengunggah kembali file `.zip` hasil cadangan kapan saja untuk memulihkan foto fisik ke storage dan menyinkronkan kembali URL di database.

6. **Panel Terpadu Manajemen Penyimpanan Superadmin (`StorageManagerModal.tsx`)**:
   - Panel antarmuka 5-in-1: Krisis Kuota & Status, Unduh Backup ZIP, Bersihkan Foto Server, Restore dari ZIP, dan Integrasi Google Drive.
   - Tombol 1-klik salin kode Google Apps Script siap pakai dan fitur uji coba koneksi interaktif.

---

## [v1.0.0] - 2026-08-30 *(Komunikasi Siswa-Guru Dua Arah, Multi-Tanggapan Dewan Guru, Sinkronisasi Cloud Profil Sekolah, Rentang Tanggal Leaderboard, & Rapor Karakter Berkeadilan)*

### 🌟 Fitur Baru & Peningkatan Besar
1. **Komunikasi Dua Arah Siswa dan Guru/Pimpinan Sekolah (`KomunikasiSiswaGuruModal`)**:
   - **Mode Pendidik / Staf (Superadmin, Kepala Sekolah, Wali Kelas, Kesiswaan, Kurikulum)**: Dapat memilih rombel/kelas, memilih nama siswa target, menentukan topik/subjek apresiasi atau bimbingan, serta mengirim pesan motivasi langsung ke siswa.
   - **Mode Siswa**: Siswa dapat memilih menghubungi guru yang diinginkan (Wali Kelas, Kesiswaan & BK, Waka Kurikulum, Kepala Sekolah, hingga Superadmin) untuk berkonsultasi seputar ibadah, belajar, atau curhat pembiasaan.
   - **Kotak Masuk & Riwayat Percakapan**: Dilengkapi indikator pesan baru belum dibaca (*unread badge*), fitur otomatis tandai pesan dibaca, serta tombol *Balas Pesan* instan.
   - **Sinkronisasi Cloud**: Pesan tersinkronisasi otomatis via Supabase Storage dan tabel database `pesan_komunikasi`.

2. **Multi-Tanggapan Dewan Guru pada Suara/Aspirasi Siswa**:
   - Mengubah sistem respons suara siswa dari yang sebelumnya bersifat tunggal/timpa, menjadi **Thread / Timeline Tanggapan Multi-Pendidik**.
   - Seluruh pemangku kepentingan (Wali Kelas, Kesiswaan, Kurikulum, Kepala Sekolah, Superadmin) dapat memberikan catatan tanggapan dan nasihat masing-masing tanpa menghapus respons dari guru sebelumnya.
   - Antarmuka menampilkan identitas nama guru, badge jabatan/role, tanggal tanggapan, serta opsi *Ubah Tanggapan Saya* atau *Tanggapi Lagi*.
   - Siswa dapat membaca seluruh masukan dari para guru di tab Riwayat Suara Siswa.

3. **Sinkronisasi Profil Sekolah Antar-Browser (*Cross-Browser Persistence*)**:
   - Menerapkan arsitektur *Dual-Persistence* menggunakan Supabase Storage bucket `bukti_foto/config/school_profile.json` dan tabel database `profil_sekolah`.
   - Mengunggah logo sekolah baru langsung ke Supabase Storage CDN (`bukti_foto/logos/`), menjamin logo dan profil sekolah (nama sekolah, NPSN, alamat, motto, nama KS) langsung tersinkronisasi di seluruh browser, laptop, dan perangkat mobile tanpa terkendala DDL cache.

4. **Filter Rentang Tanggal Papan Peringkat / Leaderboard**:
   - Papan Peringkat / Leaderboard kini dilengkapi filter rentang tanggal: **📅 Harian (Hari Ini)**, **🗓️ 7 Hari Terakhir**, **📊 30 Hari Terakhir**, **🏛️ 1 Semester**, serta **🎯 Rentang Kustom (Start Date s.d. End Date)**.
   - `LeaderboardService` menghitung persentase kepatuhan kelas dan siswa secara akurat terhadap total hari dalam rentang waktu yang dipilih.
   - Menyesuaikan ekspor data Excel dan teks broadcast WhatsApp agar menyertakan label rentang tanggal yang dipilih secara otomatis.

5. **Standarisasi & Keadilan Evaluasi Rapor Karakter Siswa**:
   - Memperbaiki kelemahan sistem lama di mana siswa yang hanya mengisi 1 hari mendapatkan nilai 100% (tidak adil bagi siswa yang rajin mengisi setiap hari).
   - Menghadirkan selektor periode evaluasi standar di toolbar Rapor: **Bulan Berjalan**, **30 Hari Terakhir**, **Semester Ganjil**, dan **Rentang Kustom**.
   - `totalHariEvaluasi` dihitung objektif berdasarkan jumlah hari kalender periode evaluasi, kepatuhan kebiasaan dihitung terhadap target hari tersebut, serta menampilkan kolom perbandingan *Target Pelaksanaan* vs *Keaktifan Riil Siswa*.

---

## [v0.9.1] - 2026-08-26 *(Sinkronisasi Realtime Suara & Curhat Siswa, Migrasi Cloud Schema, & Pembersihan Mock)*

### 🌟 Fitur Baru & Perbaikan
1. **Sinkronisasi Cloud Realtime Suara Siswa**:
   - Menambahkan skrip migrasi database `supabase/create_suara_siswa.sql` untuk membuat tabel `suara_siswa` dengan relasi lengkap ke tabel `siswa`, `kelas`, dan `staf_sekolah` serta konfigurasi RLS.
   - Sinkronisasi realtime otomatis saat siswa mengirimkan aspirasi, saat guru memberikan balasan/tanggapan resmi, maupun saat superadmin memoderasi.
2. **Pembersihan Data Mock Dummy Lokal**:
   - Menghapus inisialisasi dummy data `suara-1` dari penyimpanan lokal agar data yang tampil di dashboard Kepala Sekolah, Wali Kelas, dan Superadmin 100% merupakan curhatan/ide riil siswa.
3. **Penyempurnaan Pemetaan Kelas (*Resilient Class Mapping*)**:
   - Memperbaiki logika filter suara siswa untuk Wali Kelas dan Kepala Sekolah agar mengenali seluruh variasi ID rombel kelas tanpa terputus.
4. **Pemberitahuan Login Informatif & Tepat Sasaran**:
   - Jika **NISN / NIP / NIK salah**: Menampilkan pesan `"Username tidak ditemukan. Silakan periksa kembali NISN / NIP / Username yang Anda masukkan."`
   - Jika **Username benar tapi password salah (Siswa)**: Menampilkan pesan `"Password salah. Silakan tanyakan kepada bapak/ibu wali kelas atau guru Anda jika Anda lupa password."`
   - Jika **Username benar tapi password salah (Guru/Staf)**: Menampilkan pesan `"Password salah. Silakan menghubungi Superadmin sekolah untuk memeriksa atau mereset password akun Anda."`

---

## [v0.9.0] - 2026-08-26 *(Pusat Piagam Penghargaan Kepala Sekolah: Multi-Periode & Kategori Prestasi Siswa / Guru)*

### 🌟 Fitur Baru & Peningkatan
1. **Penerbitan Piagam Multi-Periode Fleksibel (Kepala Sekolah)**:
   - Kepala Sekolah dapat menerbitkan dan mencetak sertifikat piagam penghargaan resmi untuk 4 rentang periode evaluasi: **📅 Harian (Daily)**, **🗓️ Mingguan (Weekly / 7 Hari)**, **📊 Bulanan (Monthly / 1 Bulan Penuh)**, dan **🏛️ Semester (Semester Ganjil & Genap)**.
2. **Diversifikasi Kategori Piagam Prestasi Siswa**:
   - 🌟 **Siswa Teladan Terdisiplin**: Capaian ketuntasan 100% dan integritas bukti foto asli valid.
   - 🔥 **Siswa Terkonsisten (Streak Master)**: Rekor hari pengisian berturut-turut terpanjang tanpa terputus.
   - 🚀 **Siswa Ter-Effort (Most Improved)**: Lonjakan pertumbuhan dan daya juang kepatuhan karakter tertinggi ($+\Delta\%$).
   - 📖 **Duta Literasi 7KAIH (Gemar Belajar #5)**: Siswa paling aktif menuliskan refleksi bacaan dan pembelajaran bermutu tinggi.
   - 🤝 **Bintang Karakter Sosial (Bermasyarakat #6)**: Keaktifan gotong royong dan kontribusi sosial teraktif.
   - 🏃 **Bintang Kebugaran & Olahraga (Berolahraga #3)**: Kedisiplinan berolahraga dan menjaga kebugaran fisik jasmani.
3. **Kategori Piagam Prestasi Kelas & Pendidik / Wali Kelas**:
   - 👑 **Kelas Juara 1 Terdisiplin**: Kelas dengan Skor Tertib dan persentase kepatuhan kolektif tertinggi pada periode tersebut.
   - 🥇 **Wali Kelas Ter-Istiqomah**: Wali kelas pembina yang konsisten mendampingi kelasnya di peringkat atas klasemen.
   - ⚡ **Wali Kelas Ter-Effort (Highest Growth)**: Wali kelas dengan lonjakan pertumbuhan kepatuhan siswa terbesar ($+\Delta\%$).
   - 💬 **Wali Kelas Paling Responsif & Inspiratif**: Pendidik paling aktif memberikan pendampingan, arahan, dan feedback motivasi harian.
4. **Penerbitan Piagam Kustom Fleksibel**:
   - Formulir penerbitan piagam kustom untuk memilih siswa, guru/staf, atau rombel kelas tertentu di luar sistem pemenang otomatis dengan kustomisasi judul, nomor surat resmi, kategori, dan deskripsi apresiasi.
5. **Format Cetak A4 Landscape Standar Resmi**:
   - Desain sertifikat bernuansa emas elegan dengan ornamen ganda, watermark garuda/bintang karakter, nomor surat dinamis, badge kategori, dan tanda tangan Kepala Sekolah.

---

## [v0.8.0] - 2026-08-26 *(Branding Resmi Jurnal 7 KAIH, Suara & Curhat Siswa, Date Range Picker, & Bulk Reminder WA)*

### 🌟 Fitur Baru & Peningkatan
1. **Branding Resmi & Standarisasi Aplikasi (`Jurnal 7 KAIH`)**:
   - Menstandarkan seluruh antarmuka, navbar, footer, login view, dashboard router, modal rapor, header ekspor Excel, dan format WhatsApp ke nama resmi **Jurnal 7 KAIH**.
2. **Kotak Aspirasi & Curhat Siswa ("Suara Siswa")**:
   - Siswa dapat mengirimkan curhatan pembiasaan, keluhan kendala teknis/kehidupan, maupun ide/saran inovasi aplikasi secara opsional setiap hari melalui modal interaktif.
   - **Privasi Terproteksi (Anonim)**: Wali Kelas, Kepala Sekolah, Waka Kurikulum, dan Kesiswaan membaca pesan dengan label *"Siswa Kelas [Rombel] (Anonim)"* dan dapat memberikan tanggapan resmi yang langsung muncul di dashboard siswa.
   - **Audit Superadmin**: Hanya Superadministrator yang memiliki hak khusus untuk melihat nama dan NISN asli siswa demi keamanan dan pembinaan terarah.
3. **Date Range Picker Kustom pada Evaluasi Progress**:
   - Pemilihan rentang tanggal fleksibel (*Start Date s.d. End Date*) dengan tombol preset cepat (*Hari Ini*, *7 Hari Terakhir*, *30 Hari Terakhir*, *Bulan Ini*, *1 Semester Penuh*).
   - Menghilangkan tab Peringkat 18 Kelas yang duplikat pada tab Progress agar Leaderboard tetap fokus dan eksklusif di tab klasemen.
4. **Peringatan Massal (Bulk Reminder) Siswa Pasif via WhatsApp & In-App**:
   - **Superadmin, KS, Kurikulum, Kesiswaan**: Tombol *Bulk Peringatan ke Semua Wali Kelas* yang otomatis mengirimkan arahan in-app serentak dan membuat template WhatsApp broadcast lengkap dengan rincian nama siswa per kelas.
   - **Wali Kelas**: Tombol *📢 Ingatkan Semua via WA* langsung di banner peringatan siswa pasif 3 hari berturut-turut untuk menyalin format pengingat ke grup kelas/wali murid.

---

## [v0.7.0] - 2026-08-26 *(Superadmin Rename, Radar Inactivity 3 Hari, & Student Progress Dashboard)*

### 🌟 Fitur Baru & Pembaruan
1. **Fitur Rename & Edit Data Lengkap Guru / Siswa (Khusus Superadmin)**:
   - Superadmin dapat me-rename nama, memperbarui NISN/NIP, mengubah rombel kelas, atau memperbarui data staf dan siswa secara instan melalui modal `EditUserModal`.
   - Perubahan langsung tersinkronisasi realtime ke Supabase Cloud (`siswa` dan `staf_sekolah`) serta lokal store.
2. **Radar & Laporan Siswa Tidak Mengisi Jurnal 3 Hari Berturut-turut**:
   - Deteksi otomatis siswa pasif yang tidak memiliki satupun entri selama 3 hari terakhir secara berturut-turut.
   - Dilengkapi **sebaran per 18 kelas (7A–9F)**, rincian tanggal terakhir mengisi, dan tombol **Export Laporan Excel (.xlsx)**.
   - Akses menyeluruh lintas role: **Superadmin**, **Kepala Sekolah**, **Kesiswaan & BK**, **Waka Kurikulum**, serta **Wali Kelas** (dengan *Alert Warning Card* khusus kelasnya).
3. **Dashboard Gambaran Lengkap Progress Siswa (`StudentProgressOverview`)**:
   - Visualisasi distribusi tingkat kepatuhan siswa (🌟 *7/7 Tuntas Sempurna*, 🟢 *5-6 Sangat Aktif*, 🟡 *3-4 Cukup Aktif*, 🔴 *Belum Mengisi*).
   - Capaian partisipasi per 7 Kebiasaan Resmi Kemendikdasmen.
   - Peringkat & persentase kepatuhan 18 rombongan belajar (7A s.d 9F).
4. **Refleksi Literasi Gemar Belajar (Wajib Min. 100 Kata)**:
   - Menerapkan validasi wajib cerita refleksi minimal 100 kata pada kebiasaan #5 (Gemar Belajar) dengan *live word counter badge*, *progress bar*, dan pemantik kalimat singkat.

---

## [v0.6.0] - 2026-08-26 *(Multi-Period Aggregation & Hall of Fame)*

### 🌟 Fitur Baru & Peningkatan Strategis
- **Agregasi Rekap Multi-Periode Fleksibel**:
  - Filter evaluasi kinerja **Harian (Daily)**, **Mingguan (Weekly / 7 Hari)**, **Bulanan (Monthly)**, dan **1 Semester Penuh (Jul–Des / Jan–Jun)** untuk seluruh 18 rombel dan individu siswa.
  - Tersedia di Dashboard Wali Kelas, Dashboard Pimpinan (Kepsek/Waka/Kesiswaan/BK), dan Superadmin.
- **🌟 Hall of Fame: Apresiasi Siswa & Wali Kelas**:
  - **🔥 Siswa Terkonsisten (Streak Master)**: Menghitung streak pengisian beruntun tanpa jeda (Kategori: *3 Hari Berturut-turut*, *1 Minggu Beruntun*, *1 Bulan Penuh*, dan *1 Semester Legendaris 90+ Hari*).
  - **🚀 Siswa Ter-Effort (Most Improved)**: Mengapresiasi siswa dengan lonjakan progresivitas kepatuhan tertinggi ($+\Delta\%$) dari hari-hari sebelumnya.
  - **👑 Wali Kelas Ter-Istiqomah (Consistent Top Mentor)**: Menghargai wali kelas yang konsisten membawa kelas binaannya berada di papan atas klasemen sekolah dan membimbing siswa secara intensif.
  - **⚡ Wali Kelas Ter-Effort (Highest Class Growth)**: Menghargai wali kelas yang paling gigih mendongkrak kepatuhan dan keaktifan kelasnya ($+\Delta\%$ lonjakan terbesar).
- **Auto-Range Chunked Pagination**:
  - Mengimplementasikan penarikan data Supabase secara bertingkat (*multi-page range pagination*) untuk mengatasi limit default 1.000 baris PostgREST. Seluruh ribuan data riil dari hari-hari sebelumnya tetap tersaji 100% utuh tanpa terpotong.

---

## [v0.5.1] - 2026-08-25 *(Presisi Hisab Sholat Banyuwangi & Aturan Dhuhur)*

### 🕌 Penyesuaian & Koreksi Waktu Sholat
- **Engine Hisab Astronomis Banyuwangi**:
  - Menghitung jadwal 5 waktu sholat secara dinamis dan presisi berdasarkan titik koordinat SMPN 2 Glagah (Latitude -8.2192° S, Longitude 114.3691° E, Standar Kemenag RI).
- **Aturan Sholat Dhuhur Hari Minggu vs. Hari Sekolah**:
  - Hari Senin–Sabtu: Siswa sholat Dhuhur berjamaah di sekolah (target mandiri di rumah 4 waktu).
  - Hari Minggu: Dinilai 5 waktu penuh dari rumah (termasuk Dhuhur).
- **Koreksi Elevasi Sudut Ashar**:
  - Memperbaiki rumus hisab sudut matahari Ashar di atas ufuk sehingga rentang waktu valid berada tepat di `14.47 – 17.25 WIB`.

---

## [v0.5.0] - 2026-08-25 *(Diversifikasi Peran, Gamifikasi & Rapor Karakter)*

### 🏛️ Diversifikasi Tupoksi Peran
- **Kepala Sekolah**: 1-Klik Cetak Piagam Penghargaan Resmi Juara 1 Siswa & Rombel Teladan.
- **Waka Kurikulum**: Portofolio Khusus Kebiasaan #5 (Gemar Belajar & Literasi Buku).
- **Kesiswaan & Guru BK**: Radar Pembinaan Dini (*Early Warning Radar*) untuk siswa pasif $\ge 3$ hari, sering terlambat, atau terindikasi anomali foto.
- **Wali Kelas**: Catatan motivasi instan (*Quick Feedback Chips*) langsung ke profil siswa.

### 🎮 Gamifikasi & PWA
- **Sistem Lencana Kehormatan**: 13 badge pencapaian karakter (Early Bird, Night Guardian, Streak Hero, dll.).
- **PWA Ready**: Dukungan `manifest.json` agar aplikasi dapat diinstal di smartphone siswa dan guru layaknya aplikasi native.

### 📄 Rapor Karakter 7KAIH (Standar A4 Resmi)
- Format cetak A4 resmi lengkap dengan Kop SMPN 2 Glagah, nilai capaian predikat (A/B/C/D), deskripsi otomatis, serta kolom tanda tangan Wali Kelas, Kepala Sekolah, dan Orang Tua/Wali Murid.

---

## [v0.4.0] - 2026-08-24 *(Papan Peringkat, Export Excel & Integrasi Cloud)*

### 📊 Fitur Klasemen & Analitik
- **Papan Peringkat 18 Rombel (7A - 9F)**: Formula Skor Tertib berdasarkan persentase kepatuhan, siswa tuntas 7/7, dan minimnya pelanggaran foto.
- **Siswa Teladan Tercepat & Terbersih**: Filter ketat untuk menyaring murid terbaik harian dengan integritas foto 100%.
- **Export & Share**:
  - Export rekapitulasi kelas dan sekolah ke Microsoft Excel (`.xlsx`).
  - Bagikan ringkasan laporan langsung ke grup WhatsApp wali murid.

---

## [v0.3.0] - 2026-08-23 *(Integritas Foto EXIF & Anti-Fraud)*

### 🛡️ Validasi & Forensik Digital
- Pemeriksaan Metadata EXIF (*DateTimeOriginal*, *Software*, *Device Model*).
- Deteksi status waktu otomatis (*Tepat Waktu*, *Toleransi +15m*, *Terlambat*).
- Sistem deteksi foto mencurigakan (*Flag Anomali*) untuk mencegah kecurangan unggahan galeri lawas atau manipulasi jam HP.

---

## [v0.2.0] - 2026-08-22 *(Manajemen Akun & Basis Data)*

### 👥 Pengelolaan Siswa & Staf
- Manajemen akun 563 siswa dan 22 staf sekolah.
- Format default sandi tanggal lahir siswa (`DDMMYYYY`) dan kemudahan reset sandi oleh superadmin.
- Sinkronisasi realtime dengan Supabase PostgreSQL Database.

---

## [v0.1.0] - 2026-08-20 *(Inisiasi Proyek Jurnal 7KAIH)*

### 🚀 Fondasi Aplikasi
- Desain antarmuka modern, responsif, dan ramah pengguna dengan tema warna elegan.
- Implementasi 7 Kebiasaan Anak Indonesia Hebat (Bangun Pagi, Beribadah, Berolahraga, Makan Sehat, Gemar Belajar, Bermasyarakat, Tidur Cepat).
- Kompresi gambar client-side otomatis sebelum unggah ke cloud storage.
