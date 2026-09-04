# 📖 Panduan Praktis Replikasi Aplikasi Jurnal 7KAIH untuk Sekolah Lain
### Panduan Langkah Demi Langkah bagi Operator Sekolah / Guru TIK (Rilis Resmi: `v1.1.0`)

Panduan ini disusun untuk mempermudah sekolah lain yang ingin mereplikasi dan menjalankan aplikasi **Jurnal 7 Kebiasaan Anak Indonesia Hebat (7KAIH)** versi `v1.1.0` secara mandiri dengan database, domain, dan identitas sekolah masing-masing tanpa biaya langganan server (**100% Gratis menggunakan Supabase, Vercel, & Google Drive**).

---

## ⏱️ Estimasi Waktu Pengerjaan: 10 - 15 Menit

---

## 🛠️ Langkah 1: Buat Database Supabase (3 Menit)

1. Buka [https://supabase.com](https://supabase.com) dan klik **Start your project** (Bisa login dengan akun Google/GitHub).
2. Klik **New project**:
   - **Name**: `Jurnal 7KAIH - [Nama Sekolah Anda]` (Contoh: `Jurnal 7KAIH - SMPN 1 Giri`)
   - **Database Password**: Buat password yang kuat (simpan di catatan Anda).
   - **Region**: Pilih **Singapore (`ap-southeast-1`)** agar akses dari Indonesia super cepat.
   - Klik **Create new project** dan tunggu 1-2 menit hingga status database aktif (*Green*).
3. Di bilah menu sebelah kiri, klik icon **SQL Editor** (icon `>_`).
4. Klik tombol **New query**.
5. Buka file [`supabase/SETUP_SEKOLAH_BARU.sql`](supabase/SETUP_SEKOLAH_BARU.sql) di repositori ini, **Copy seluruh isinya**, lalu **Paste** ke editor query Supabase.
6. Klik tombol hijau **Run** di pojok kanan bawah editor (atau tekan `Ctrl + Enter`).
   - *Status: "Success. No rows returned."* $\to$ Berarti seluruh tabel, keamanan RLS, 7 kebiasaan resmi, dan akun admin perdana sudah selesai dibuat secara otomatis!
7. Ambil Kunci API Supabase:
   - Klik menu **Project Settings** (icon gerigi di pojok kiri bawah) $\to$ pilih sub-menu **API**.
   - Salin dan simpan 2 informasi penting ini:
     1. **Project URL** (Contoh: `https://xyzabcdefg.supabase.co`)
     2. **Project API keys: `anon` / `public`** (String panjang berisi token)

---

## 🚀 Langkah 2: Deploy ke Vercel (5 Menit)

1. **Fork Repositori**:
   - Buka halaman GitHub repositori ini: [https://github.com/brownyguy666/jurnal-7kaih](https://github.com/brownyguy666/jurnal-7kaih)
   - Klik tombol **Fork** di pojok kanan atas untuk menyalin repositori ke akun GitHub sekolah Anda.
2. **Deploy di Vercel**:
   - Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
   - Klik tombol **Add New...** $\to$ pilih **Project**.
   - Pada daftar repositori, pilih repo hasil fork (`jurnal-7kaih`) lalu klik **Import**.
3. **Masukkan Environment Variables**:
   - Sebelum klik deploy, buka bagian **Environment Variables** (accordion di bawah *Build and Output Settings*).
   - Tambahkan 2 variabel yang didapat dari Langkah 1 tadi:
     | Key (Nama Variabel) | Value (Nilai) |
     | :--- | :--- |
     | `VITE_SUPABASE_URL` | *Paste Project URL dari Supabase* |
     | `VITE_SUPABASE_ANON_KEY` | *Paste Anon Key dari Supabase* |
4. Klik tombol **Deploy**!
   - Tunggu sekitar 1 menit hingga proses build selesai dan muncul kembang api ucapan selamat dari Vercel.
   - Website jurnal sekolah Anda sekarang sudah aktif dan dapat diakses publik!

---

## 🌐 Langkah 3: Menautkan Domain Sekolah (Opsional - `sch.id`)

Agar alamat web sekolah terlihat resmi dan profesional (misalnya `jurnal.smpn1giri.sch.id`):
1. Di dashboard proyek Vercel Anda, buka tab **Settings** $\to$ pilih **Domains**.
2. Ketik subdomain yang diinginkan, misalnya `jurnal.namasekolah.sch.id`, lalu klik **Add**.
3. Buka cPanel / DNS Manager pengelola domain sekolah Anda, lalu tambahkan DNS Record:
   - **Type**: `CNAME`
   - **Name**: `jurnal`
   - **Target / Value**: `cname.vercel-dns.com`
4. Tunggu beberapa menit hingga sertifikat SSL (HTTPS) aktif otomatis.

---

## 🔑 Langkah 4: Login Perdana Superadmin & Setup Data Sekolah

1. Buka website jurnal sekolah Anda yang baru saja aktif.
2. Di halaman login, pilih tab **"Superadmin"**:
   - **Username**: `admin`
   - **Password**: `admin123` *(atau tanggal lahir: `01011990`)*
3. Setelah berhasil masuk ke Dashboard Superadmin:
   - Masuk ke tab **"Kelola, Rename & Password Staf"** $\to$ Edit akun `Super Administrator Sekolah` untuk mengganti nama Anda dan memperbarui password baru yang aman.
   - Masuk ke tab **"Kelola, Rename & Password Siswa"** $\to$ Klik tombol **"Import Siswa (CSV/Excel)"** untuk memasukkan data seluruh siswa sekolah Anda dari Dapodik secara massal.
   - 🎯 **Penyesuaian Rombel Otomatis**: Berapa pun jumlah rombel sekolah Anda (misal **3 rombel**, **6 rombel**, **12 rombel**, **18 rombel**, atau **24 rombel**), sistem akan **secara otomatis membaca nama-nama kelas di file Excel Anda**, membuat kelas baru yang belum ada, dan membersihkan kelas kosong lama jika Anda mencentang opsi *"Otomatis sesuaikan rombel"*.
   - Buat akun staf untuk Kepala Sekolah, Waka Kurikulum, Kesiswaan, Guru BK, dan Wali Kelas sesuai rombel yang Anda miliki.

---

## ⚙️ Langkah 5: Setup Penyimpanan Foto Bebas Biaya (Google Drive) - Wajib untuk Menghindari Batas Kuota Supabase

> [!IMPORTANT]
> **Mengapa Langkah Ini Sangat Penting bagi Sekolah?**
> Supabase Free Tier membatasi *Egress* (bandwidth unduh) maksimal **5 GB per bulan**. Jika di sekolah Anda terdapat 300 - 800 murid yang mengunggah foto jurnal setiap hari dan dilihat oleh para wali kelas, kuota 5 GB Supabase bisa cepat habis.
> 
> Dengan menghubungkan **Google Drive** (kapasitas 15 GB gratis di Gmail atau **Kapasitas Besar / Unlimited** di akun Google Workspace for Education `@guru.smp.belajar.id`), **seluruh foto bukti jurnal akan disimpan langsung di Google Drive dan dimuat dari CDN Google**. Supabase Anda menjadi **0 Byte Egress & 0 Byte Storage** sehingga platform dapat berjalan gratis selamanya!

### Cara Setup Google Drive (Hanya Butuh 3 Menit):
1. Login ke web jurnal sekolah Anda sebagai **Superadmin**.
2. Klik tombol **`💾 Backup & Kuota Foto`** di bagian atas dasbor &rarr; pilih tab **`Integrasi Google Drive (Gratis)`**.
3. Klik tombol hijau **`📋 Salin Kode Skrip`**.
4. Buka [https://script.google.com/home/start](https://script.google.com/home/start) dengan akun Google sekolah (misal akun `@guru.smp.belajar.id` atau Gmail Anda).
5. Klik **New Project** (Proyek Baru) di pojok kiri atas.
6. Hapus semua kode bawaan di editor, lalu **Paste (Tempel)** kode skrip yang telah Anda salin tadi.
7. **Beri Otorisasi Sekali**:
   - Di bilah menu atas (samping tombol Deploy), pastikan fungsi terpilih adalah `doGet`, lalu klik tombol **Jalankan (Run)**.
   - Akan muncul jendela *"Otorisasi Diperlukan"* &rarr; Klik **Tinjau Izin** &rarr; Pilih akun Google Anda &rarr; Klik tulisan kecil **Lanjutan (Advanced)** di kiri bawah &rarr; Klik **Buka Project (tidak aman)** &rarr; Klik **Izinkan (Allow)**.
8. **Terapkan Sebagai Web App**:
   - Klik tombol biru **Deploy** (kanan atas) &rarr; pilih **New deployment**.
   - Klik ikon roda gigi (gear) di samping *Select type* &rarr; pilih **Web app**.
   - Pada bagian **Execute as (Jalankan sebagai)**: pilih **Me (Saya)**.
   - Pada bagian **Who has access (Yang memiliki akses)**: pilih **Anyone (Siapa saja)**. *(Wajib agar siswa dapat mengirimkan foto jurnal tanpa perlu login akun Google)*.
   - Klik tombol **Deploy**.
9. **Salin URL Aplikasi Web**:
   - Salin URL yang berada di bawah judul **Aplikasi web** *(URL yang diawali `https://script.google.com/macros/s/...` dan berakhiran `/exec`)*.
10. Kembali ke aplikasi Jurnal sekolah Anda, **Tempel URL** tersebut ke kolom yang disediakan, klik **Uji Coba Koneksi**, lalu klik **Simpan Pengaturan Provider**.
11. 🎉 **Selesai!** Folder `Jurnal_7KAIH_Foto` otomatis terbentuk di Google Drive Anda dan seluruh foto baru murid akan aman tersimpan di sana!

---

## 💾 Langkah 6: Prosedur Pemeliharaan & Backup Foto Rutin (.ZIP)

Untuk menjaga performa dan arsip offline sekolah:
1. Di Dashboard Superadmin, buka menu **`💾 Backup & Kuota Foto`** &rarr; tab **`Unduh Backup ZIP`**.
2. Operator dapat mengunduh cadangan seluruh foto murid (per bulan atau per kelas) dalam format `.zip` terstruktur rapi:
   `[Kelas]/[Nama_Siswa]/[Tanggal]_[Kebiasaan].jpg` beserta metadata lengkap `manifest_backup.json`.
3. Di tab **`Bersihkan Foto Server`**, operator dapat menghapus foto fisik lama (> 7 hari atau > 14 hari) di Supabase Storage untuk mengosongkan kapasitas. **Catatan refleksi, status waktu, dan poin siswa 100% aman (tidak hilang)**.
4. Jika sewaktu-waktu foto ingin dikembalikan ke server, cukup unggah file ZIP tersebut di tab **`Restore dari ZIP`**.

---

## 📍 Langkah 7: Penyesuaian Nama Sekolah & Titik Koordinat Sholat

File profil sekolah tersimpan di file: [`src/lib/schoolProfile.ts`](src/lib/schoolProfile.ts)
Operator dapat mengedit file tersebut langsung di GitHub untuk menyesuaikan:
- Nama Sekolah, NPSN, Motto, dan Kontak Resmi
- **Latitude & Longitude**: Agar hisab jadwal sholat 5 waktu dinamis mengacu presisi ke lokasi astronomis kota sekolah Anda!
- Atau dapat diubah langsung secara visual melalui tombol **`⚙️ Profil & Logo Sekolah`** di Dashboard Superadmin tanpa menyentuh kode!

---

### 🎉 Selesai & Siap Operasional!
Sekolah Anda sekarang memiliki platform digital mandiri untuk memantau pembiasaan karakter 7KAIH bagi seluruh peserta didik tanpa biaya server! Jika ada pertanyaan atau butuh bantuan saat diseminasi, silakan hubungi tim pengembang melalui tab *Issues* di repositori ini.

