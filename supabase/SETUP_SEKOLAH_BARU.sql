-- ==============================================================================
-- 🚀 SKRIP INSTALASI 1-KLIK DATABASE: JURNAL 7 KAIH
-- Program Pembiasaan 7 Karakter Anak Indonesia Hebat (Kemendikdasmen RI)
-- ==============================================================================
-- 📌 CARA PENGGUNAAN UNTUK OPERATOR SEKOLAH:
-- 1. Buat akun & project baru di https://supabase.com (Gratis).
-- 2. Buka menu "SQL Editor" di bilah kiri dashboard Supabase Anda.
-- 3. Klik "New Query", paste SELURUH isi script ini dari atas sampai bawah.
-- 4. Klik tombol hijau "Run" (atau tekan Ctrl+Enter).
-- 5. Selesai! Database sekolah Anda sudah 100% siap digunakan.
--
-- 🔑 AKUN SUPERADMIN DEFAULT SETELAH RUN:
-- • Username / NIP: admin
-- • Password Default: admin123  (atau tanggal lahir: 01011990)
-- *Segera ubah nama dan password di dashboard superadmin setelah login pertama!
-- ==============================================================================

-- 1. AKTIFKAN EKSTENSI UUID
create extension if not exists "uuid-ossp";

-- 2. TABEL STAF SEKOLAH (Superadmin, Kepala Sekolah, Waka, Kesiswaan, Wali Kelas)
create table if not exists staf_sekolah (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  nama text not null,
  role text not null check (role in ('superadmin', 'wali_kelas', 'kepala_sekolah', 'waka_kurikulum', 'kesiswaan')),
  status_asn boolean not null default true,
  nip_atau_nik text unique not null,
  tanggal_lahir date not null default '1990-01-01',
  kelas_id uuid,
  scope text not null check (scope in ('kelas', 'sekolah')),
  sudah_ganti_password boolean default false,
  created_at timestamptz default now()
);

-- 3. TABEL KELAS (Daftar Rombel Sekolah)
create table if not exists kelas (
  id uuid primary key default gen_random_uuid(),
  nama_kelas text not null unique,
  tingkat int not null default 7 check (tingkat in (7, 8, 9)),
  wali_kelas_id uuid references staf_sekolah(id) on delete set null,
  created_at timestamptz default now()
);

-- Tambahkan foreign key constraint jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_staf_kelas'
  ) then
    alter table staf_sekolah
      add constraint fk_staf_kelas
      foreign key (kelas_id) references kelas(id) on delete set null;
  end if;
end $$;

-- 4. TABEL SISWA
create table if not exists siswa (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  nisn text unique not null,
  nama text not null,
  kelas_id uuid references kelas(id) on delete set null,
  tanggal_lahir date not null,
  sudah_ganti_password boolean default false,
  created_at timestamptz default now()
);

-- 5. TABEL KEBIASAAN (7 Kebiasaan Resmi Kemendikdasmen)
create table if not exists kebiasaan (
  id serial primary key,
  nama text not null,
  urutan int not null unique,
  deskripsi text,
  jam_mulai time,
  jam_selesai time,
  toleransi_menit int default 0,
  maks_input_harian int not null default 1,
  butuh_sub_tipe boolean default false,
  daftar_sub_tipe text[],
  butuh_nama_kegiatan boolean default false,
  icon_name text default 'Star',
  warna_tema text default 'emerald'
);

-- 6. TABEL ENTRI JURNAL (Submisi Harian Siswa & Bukti Foto)
create table if not exists entri_jurnal (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references siswa(id) on delete cascade,
  kebiasaan_id int not null references kebiasaan(id) on delete restrict,
  tanggal date not null default current_date,
  urutan_ke int not null default 1,
  sub_tipe text,
  nama_kegiatan text,
  catatan text,
  foto_url text not null,
  sumber_foto text not null check (sumber_foto in ('kamera', 'upload')),
  waktu_ambil_foto timestamptz,
  waktu_submit timestamptz default now(),
  flag_foto_mencurigakan boolean default false,
  alasan_flag text,
  status_waktu text check (status_waktu in ('tepat_waktu', 'toleransi', 'terlambat', 'tidak_berlaku')),
  constraint uq_siswa_tanggal_kebiasaan_urutan unique (siswa_id, tanggal, kebiasaan_id, urutan_ke)
);

create index if not exists idx_entri_jurnal_tanggal on entri_jurnal(tanggal);
create index if not exists idx_entri_jurnal_siswa_tanggal on entri_jurnal(siswa_id, tanggal);
create index if not exists idx_entri_jurnal_kebiasaan on entri_jurnal(kebiasaan_id);

-- 7. TABEL FEEDBACK (Bimbingan / Komentar Wali Kelas)
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  staf_id uuid not null references staf_sekolah(id) on delete cascade,
  siswa_id uuid not null references siswa(id) on delete cascade,
  entri_id uuid references entri_jurnal(id) on delete set null,
  komentar text not null,
  created_at timestamptz default now()
);

create index if not exists idx_feedback_siswa on feedback(siswa_id);

-- 8. TABEL ARAHAN WALI KELAS (Instruksi Pimpinan ke Wali Kelas)
create table if not exists arahan_wali_kelas (
  id uuid primary key default gen_random_uuid(),
  staf_pengirim_id uuid not null references staf_sekolah(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  kategori text not null check (kategori in ('apresiasi', 'evaluasi', 'instruksi', 'tindak_lanjut')),
  judul text not null,
  pesan text not null,
  created_at timestamptz default now(),
  dibaca boolean default false
);

create index if not exists idx_arahan_kelas on arahan_wali_kelas(kelas_id);

-- 9. TABEL LOG AUDIT PENGHAPUSAN
create table if not exists log_hapus (
  id uuid primary key default gen_random_uuid(),
  entri_id uuid,
  data_terhapus jsonb not null,
  dihapus_oleh uuid not null references staf_sekolah(id),
  alasan text not null,
  waktu timestamptz default now()
);

-- 10. TABEL SUARA SISWA (Kotak Aspirasi & Curhat)
create table if not exists suara_siswa (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references siswa(id) on delete cascade,
  kelas_id uuid references kelas(id) on delete set null,
  kategori text not null check (kategori in ('curhat_pembiasaan', 'keluhan_kendala', 'ide_saran_aplikasi', 'lainnya')),
  judul text not null,
  isi text not null,
  tanggal date not null default current_date,
  tanggapan text,
  tanggapan_oleh_staf_id uuid references staf_sekolah(id) on delete set null,
  tanggapan_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_suara_siswa_siswa on suara_siswa(siswa_id);
create index if not exists idx_suara_siswa_kelas on suara_siswa(kelas_id);
create index if not exists idx_suara_siswa_created_at on suara_siswa(created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table staf_sekolah enable row level security;
alter table kelas enable row level security;
alter table siswa enable row level security;
alter table kebiasaan enable row level security;
alter table entri_jurnal enable row level security;
alter table feedback enable row level security;
alter table arahan_wali_kelas enable row level security;
alter table log_hapus enable row level security;
alter table suara_siswa enable row level security;

-- Kebijakan Akses Penuh untuk Klien Anon
create policy "Allow all kebiasaan" on kebiasaan for all using (true) with check (true);
create policy "Allow all kelas" on kelas for all using (true) with check (true);
create policy "Allow all siswa" on siswa for all using (true) with check (true);
create policy "Allow all staf" on staf_sekolah for all using (true) with check (true);
create policy "Allow all entri_jurnal" on entri_jurnal for all using (true) with check (true);
create policy "Allow all feedback" on feedback for all using (true) with check (true);
create policy "Allow all arahan_wali_kelas" on arahan_wali_kelas for all using (true) with check (true);
create policy "Allow all log_hapus" on log_hapus for all using (true) with check (true);
create policy "Allow all suara_siswa" on suara_siswa for all using (true) with check (true);

-- ==============================================================================
-- STORAGE BUCKET: BUKTI FOTO JURNAL
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('bukti_foto', 'bukti_foto', true)
on conflict (id) do update set public = true;

create policy "Bukti foto dapat dibaca publik" on storage.objects for select using (bucket_id = 'bukti_foto');
create policy "Public upload bukti foto" on storage.objects for insert with check (bucket_id = 'bukti_foto');
create policy "Public update bukti foto" on storage.objects for update using (bucket_id = 'bukti_foto');
create policy "Public delete bukti foto" on storage.objects for delete using (bucket_id = 'bukti_foto');

-- ==============================================================================
-- SEED DATA AWAL: 7 KEBIASAAN RESMI KEMENDIKDASMEN RI
-- ==============================================================================
insert into kebiasaan (
  id, nama, urutan, deskripsi, jam_mulai, jam_selesai, toleransi_menit, 
  maks_input_harian, butuh_sub_tipe, daftar_sub_tipe, butuh_nama_kegiatan, icon_name, warna_tema
) values
(1, 'Bangun Pagi', 1, 'Bangun tepat waktu antara pukul 04.00 s.d 05.30 WIB untuk memulai hari dengan bugar.', '04:00', '05:30', 0, 1, false, null, false, 'Sunrise', 'amber'),
(2, 'Beribadah', 2, 'Melaksanakan sholat / ibadah keagamaan secara tertib dan khusyuk.', null, null, 0, 5, true, ARRAY['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']::text[], false, 'HeartHandshake', 'emerald'),
(3, 'Berolahraga', 3, 'Melakukan olahraga atau peregangan fisik minimal 15-30 menit.', null, null, 0, 1, false, null, false, 'Activity', 'blue'),
(4, 'Makan Sehat dan Bergizi', 4, 'Makan makanan bergizi seimbang (sayur, buah, protein, karbohidrat).', null, null, 0, 2, false, null, false, 'Utensils', 'green'),
(5, 'Gemar Belajar', 5, 'Membaca buku dan belajar mandiri dengan refleksi cerita minimal 100 kata.', null, null, 0, 1, false, null, false, 'BookOpen', 'indigo'),
(6, 'Bermasyarakat', 6, 'Membantu orang tua, gotong royong, atau berinteraksi sosial di lingkungan.', null, null, 0, 1, false, null, true, 'Users', 'purple'),
(7, 'Tidur Cepat', 7, 'Tidur malam tepat waktu antara 20.00 s.d 22.00 WIB (toleransi s.d 22.15 WIB).', '20:00', '22:00', 15, 1, false, null, false, 'Moon', 'violet')
on conflict (id) do update set
  nama = excluded.nama,
  deskripsi = excluded.deskripsi,
  jam_mulai = excluded.jam_mulai,
  jam_selesai = excluded.jam_selesai,
  toleransi_menit = excluded.toleransi_menit,
  maks_input_harian = excluded.maks_input_harian,
  butuh_sub_tipe = excluded.butuh_sub_tipe,
  daftar_sub_tipe = excluded.daftar_sub_tipe,
  butuh_nama_kegiatan = excluded.butuh_nama_kegiatan;

-- ==============================================================================
-- SEED DATA AWAL: 18 KELAS STANDAR (7A - 9F)
-- 📌 CATATAN: Ini adalah contoh rombel awal. Berapa pun jumlah rombel sekolah Anda 
-- (3 rombel, 6 rombel, 12 rombel, 24 rombel, dsb.), sistem akan OTOMATIS
-- menyesuaikan daftar kelas saat Anda mengimpor data siswa via Excel/CSV!
-- ==============================================================================
insert into kelas (nama_kelas, tingkat)
values 
  ('7A', 7), ('7B', 7), ('7C', 7), ('7D', 7), ('7E', 7), ('7F', 7),
  ('8A', 8), ('8B', 8), ('8C', 8), ('8D', 8), ('8E', 8), ('8F', 8),
  ('9A', 9), ('9B', 9), ('9C', 9), ('9D', 9), ('9E', 9), ('9F', 9)
on conflict (nama_kelas) do nothing;

-- ==============================================================================
-- SEED DATA AWAL: AKUN SUPERADMIN PERDANA
-- Login: Username = admin | Password = admin123 atau 01011990
-- ==============================================================================
insert into staf_sekolah (nama, role, status_asn, nip_atau_nik, tanggal_lahir, scope, sudah_ganti_password)
values (
  'Super Administrator Sekolah',
  'superadmin',
  true,
  'admin',
  '1990-01-01',
  'sekolah',
  true
)
on conflict (nip_atau_nik) do nothing;

-- ==============================================================================
-- 10. TABEL PROFIL & KUSTOMISASI SEKOLAH (NAMA, LOGO, NPSN, MOTTO, KONTAK)
-- ==============================================================================
create table if not exists profil_sekolah (
  id text primary key default 'main',
  nama text not null default 'SMPN 2 Glagah',
  jenjang text default 'SMP',
  npsn text not null default '20525649',
  status text default 'Negeri',
  alamat text not null default 'Jl. Kenjo No.45, Glagah, Banyuwangi, Jawa Timur',
  kabupaten text not null default 'Kabupaten Banyuwangi',
  provinsi text not null default 'Jawa Timur',
  akreditasi text default 'A',
  tahun_ajaran text default '2026/2027',
  telepon text default '(0333) 421000',
  email text default 'smpn2glagah@gmail.com',
  website text default 'https://smpnegeri2glagah.sch.id',
  motto text default 'Berakhlak Mulia, Berprestasi, dan Berkarakter Luhur',
  logo_url text default '/logos/logo_smpn2_glagah.png',
  logo_kabupaten_url text default '/logos/logo_banyuwangi.png',
  nama_kepala_sekolah text default 'Drs. Bambang Sudarmono, M.Pd',
  nip_kepala_sekolah text default '197201011998031002',
  updated_at timestamptz default now()
);

alter table profil_sekolah enable row level security;

create policy "Allow read profil_sekolah" on profil_sekolah for select using (true);
create policy "Allow insert profil_sekolah" on profil_sekolah for insert with check (true);
create policy "Allow update profil_sekolah" on profil_sekolah for update using (true);
create policy "Allow delete profil_sekolah" on profil_sekolah for delete using (true);

insert into profil_sekolah (id, nama, npsn, alamat, kabupaten, provinsi)
values ('main', 'SMPN 2 Glagah', '20525649', 'Jl. Kenjo No.45, Glagah, Banyuwangi, Jawa Timur', 'Kabupaten Banyuwangi', 'Jawa Timur')
on conflict (id) do nothing;

-- ==============================================================================
-- 11. TABEL KOMUNIKASI & BIMBINGAN SISWA-GURU
-- ==============================================================================
create table if not exists pesan_komunikasi (
  id text primary key,
  pengirim_id text not null,
  pengirim_nama text not null,
  pengirim_role text not null,
  penerima_id text not null,
  penerima_nama text not null,
  penerima_role text not null,
  kelas_id text,
  kelas_nama text,
  subjek text not null,
  pesan text not null,
  sudah_dibaca boolean default false,
  created_at timestamptz default now()
);

alter table pesan_komunikasi enable row level security;

create policy "Allow read pesan_komunikasi" on pesan_komunikasi for select using (true);
create policy "Allow insert pesan_komunikasi" on pesan_komunikasi for insert with check (true);
create policy "Allow update pesan_komunikasi" on pesan_komunikasi for update using (true);
create policy "Allow delete pesan_komunikasi" on pesan_komunikasi for delete using (true);


