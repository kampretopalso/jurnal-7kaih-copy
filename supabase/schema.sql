-- SKEMA DATABASE: JURNAL 7 KAIH (SMPN 2 GLAGAH)
-- SMPN 2 Glagah • Superadmin, 18 Kelas (7A-9F), Password Default Tanggal Lahir (DDMMYYYY)
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABEL STAF SEKOLAH (Superadmin, Wali Kelas, Kepala Sekolah, Waka Kurikulum, Kesiswaan)
-- ------------------------------------------------------------------------------
create table if not exists staf_sekolah (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  nama text not null,
  role text not null check (role in ('superadmin', 'wali_kelas', 'kepala_sekolah', 'waka_kurikulum', 'kesiswaan')),
  status_asn boolean not null default true,
  nip_atau_nik text unique not null,       -- Untuk superadmin: 'ajibaguskhoiri'
  tanggal_lahir date not null default '1985-01-01', -- Digunakan sebagai password default (DDMMYYYY)
  kelas_id uuid,                           -- Diisi jika role = wali_kelas
  scope text not null check (scope in ('kelas', 'sekolah')),
  sudah_ganti_password boolean default false,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 2. TABEL KELAS (18 Kelas: 7A s.d 9F)
-- ------------------------------------------------------------------------------
create table if not exists kelas (
  id uuid primary key default gen_random_uuid(),
  nama_kelas text not null unique,
  tingkat int not null default 7 check (tingkat in (7, 8, 9)),
  wali_kelas_id uuid references staf_sekolah(id) on delete set null,
  created_at timestamptz default now()
);

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

-- ------------------------------------------------------------------------------
-- 3. TABEL SISWA
-- ------------------------------------------------------------------------------
create table if not exists siswa (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  nisn text unique not null,
  nama text not null,
  kelas_id uuid references kelas(id) on delete restrict,
  tanggal_lahir date not null,
  sudah_ganti_password boolean default false,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 4. TABEL KEBIASAAN (7 Kebiasaan Resmi Kemendikdasmen - Konfigurasi Dinamis)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. TABEL ENTRI JURNAL (Satu baris = satu bukti kebiasaan)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. TABEL FEEDBACK (Komentar Wali Kelas ke Siswa)
-- ------------------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  staf_id uuid not null references staf_sekolah(id) on delete cascade,
  siswa_id uuid not null references siswa(id) on delete cascade,
  entri_id uuid references entri_jurnal(id) on delete set null,
  komentar text not null,
  created_at timestamptz default now()
);

create index if not exists idx_feedback_siswa on feedback(siswa_id);

-- ------------------------------------------------------------------------------
-- 7. TABEL ARAHAN WALI KELAS (Feedback / Arahan Pimpinan ke Wali Kelas)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 8. TABEL LOG AUDIT HAPUS (Catatan penghapusan entri fraud/keliru)
-- ------------------------------------------------------------------------------
create table if not exists log_hapus (
  id uuid primary key default gen_random_uuid(),
  entri_id uuid,
  data_terhapus jsonb not null,
  dihapus_oleh uuid not null references staf_sekolah(id),
  alasan text not null,
  waktu timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 9. TABEL SUARA SISWA (Aspirasi, Curhat, Keluhan & Ide Siswa)
-- ------------------------------------------------------------------------------
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

create policy "Allow all kebiasaan" on kebiasaan for all using (true) with check (true);
create policy "Allow all kelas" on kelas for all using (true) with check (true);
create policy "Allow all siswa" on siswa for all using (true) with check (true);
create policy "Allow all staf" on staf_sekolah for all using (true) with check (true);
create policy "Allow all entri_jurnal" on entri_jurnal for all using (true) with check (true);
create policy "Allow all feedback" on feedback for all using (true) with check (true);
create policy "Allow all arahan_wali_kelas" on arahan_wali_kelas for all using (true) with check (true);
create policy "Allow all log_hapus" on log_hapus for all using (true) with check (true);
create policy "Allow all suara_siswa" on suara_siswa for all using (true) with check (true);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('bukti_foto', 'bukti_foto', true)
on conflict (id) do update set public = true;

create policy "Bukti foto dapat dibaca publik" on storage.objects for select using (bucket_id = 'bukti_foto');
create policy "Public upload bukti foto" on storage.objects for insert with check (bucket_id = 'bukti_foto');
create policy "Public update bukti foto" on storage.objects for update using (bucket_id = 'bukti_foto');
create policy "Public delete bukti foto" on storage.objects for delete using (bucket_id = 'bukti_foto');

