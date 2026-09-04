-- ==============================================================================
-- SKRIP MIGRASI TABEL: SUARA SISWA (JURNAL 7 KAIH SMPN 2 GLAGAH)
-- Jalankan skrip ini di SQL Editor Supabase untuk mengaktifkan sinkronisasi
-- realtime curhatan, keluhan, dan aspirasi siswa lintas perangkat dan role.
-- ==============================================================================

-- 1. Buat Tabel suara_siswa jika belum ada
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

-- 2. Buat Index untuk Performa Query
create index if not exists idx_suara_siswa_siswa on suara_siswa(siswa_id);
create index if not exists idx_suara_siswa_kelas on suara_siswa(kelas_id);
create index if not exists idx_suara_siswa_created_at on suara_siswa(created_at desc);

-- 3. Aktifkan Row Level Security (RLS) dan Kebijakan Akses Bebas Rekursif
alter table suara_siswa enable row level security;

drop policy if exists "Allow all suara_siswa" on suara_siswa;
create policy "Allow all suara_siswa" on suara_siswa for all using (true) with check (true);

-- 4. Berikan Izin Akses Anon & Authenticated Role
grant all on table suara_siswa to anon, authenticated, service_role;
