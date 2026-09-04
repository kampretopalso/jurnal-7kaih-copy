-- SEED DATA: JURNAL 7 KAIH (SMPN 2 GLAGAH)
-- Superadmin, 18 Kelas (7A-9F), Password Default Tanggal Lahir (DDMMYYYY)
-- ==============================================================================

-- 1. SEED 7 KEBIASAAN KEMENDIKDASMEN
insert into kebiasaan (
  id, nama, urutan, deskripsi, jam_mulai, jam_selesai, toleransi_menit, 
  maks_input_harian, butuh_sub_tipe, daftar_sub_tipe, butuh_nama_kegiatan, icon_name, warna_tema
) values
(1, 'Bangun Pagi', 1, 'Bangun tepat waktu antara pukul 04.00 s.d 05.00 WIB untuk memulai hari dengan segar.', '04:00', '05:00', 0, 1, false, null, false, 'Sunrise', 'amber'),
(2, 'Beribadah', 2, 'Melaksanakan sholat 5 waktu secara tertib dan khusyuk.', null, null, 0, 5, true, ARRAY['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']::text[], false, 'HeartHandshake', 'emerald'),
(3, 'Berolahraga', 3, 'Melakukan olahraga atau peregangan fisik minimal 15-30 menit.', null, null, 0, 1, false, null, false, 'Activity', 'blue'),
(4, 'Makan Sehat dan Bergizi', 4, 'Sarapan dan makan makanan bergizi seimbang (sayur, buah, protein, karbohidrat).', null, null, 0, 2, false, null, false, 'Utensils', 'green'),
(5, 'Gemar Belajar', 5, 'Membaca buku pengetahuan, mengulang materi sekolah, atau persiapan pelajaran esok hari disertai cerita refleksi minimal 100 kata.', null, null, 0, 1, false, null, false, 'BookOpen', 'indigo'),
(6, 'Bermasyarakat', 6, 'Membantu orang tua, gotong royong, atau berinteraksi santun dengan tetangga.', null, null, 0, 1, false, null, true, 'Users', 'purple'),
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

-- 2. SEED KELAS 7A - 9F
insert into kelas (id, nama_kelas, tingkat)
values 
  ('a1b2c3d4-0001-4000-8000-000000000001', '7A', 7),
  ('a1b2c3d4-0002-4000-8000-000000000002', '7B', 7),
  ('a1b2c3d4-0003-4000-8000-000000000003', '7C', 7),
  ('a1b2c3d4-0004-4000-8000-000000000004', '7D', 7),
  ('a1b2c3d4-0005-4000-8000-000000000005', '7E', 7),
  ('a1b2c3d4-0006-4000-8000-000000000006', '7F', 7),
  ('a1b2c3d4-0007-4000-8000-000000000007', '8A', 8),
  ('a1b2c3d4-0008-4000-8000-000000000008', '8B', 8),
  ('a1b2c3d4-0009-4000-8000-000000000009', '8C', 8),
  ('a1b2c3d4-0010-4000-8000-000000000010', '8D', 8),
  ('a1b2c3d4-0011-4000-8000-000000000011', '8E', 8),
  ('a1b2c3d4-0012-4000-8000-000000000012', '8F', 8),
  ('a1b2c3d4-0013-4000-8000-000000000013', '9A', 9),
  ('a1b2c3d4-0014-4000-8000-000000000014', '9B', 9),
  ('a1b2c3d4-0015-4000-8000-000000000015', '9C', 9),
  ('a1b2c3d4-0016-4000-8000-000000000016', '9D', 9),
  ('a1b2c3d4-0017-4000-8000-000000000017', '9E', 9),
  ('a1b2c3d4-0018-4000-8000-000000000018', '9F', 9)
on conflict (nama_kelas) do nothing;

-- 3. SEED STAF SEKOLAH & SUPERADMIN (Password default: Tanggal Lahir DDMMYYYY)
insert into staf_sekolah (id, nama, role, status_asn, nip_atau_nik, tanggal_lahir, kelas_id, scope, sudah_ganti_password)
values
  -- SUPERADMIN (Aji Bagus Khoiri - Tgl Lahir 06 Agustus 1994 -> Pass: 060894 / 06081994)
  (
    'e1f2a3b4-0000-4000-8000-000000000000',
    'Aji Bagus Khoiri (Superadmin)',
    'superadmin',
    true,
    'ajibaguskhoiri',
    '1994-08-06',
    null,
    'sekolah',
    true
  ),
  -- Kepala Sekolah (Tgl Lahir 01 Januari 1972 -> Pass default: 01011972)
  (
    'e1f2a3b4-0003-4000-8000-000000000003',
    'Drs. Bambang Sudarmono, M.Pd',
    'kepala_sekolah',
    true,
    '197201011998031002',
    '1972-01-01',
    null,
    'sekolah',
    true
  ),
  -- Waka Kurikulum (Tgl Lahir 12 Agustus 1978 -> Pass default: 12081978)
  (
    'e1f2a3b4-0004-4000-8000-000000000004',
    'Hj. Nurul Fadilah, M.Pd',
    'waka_kurikulum',
    true,
    '197808122003122004',
    '1978-08-12',
    null,
    'sekolah',
    true
  ),
  -- Kesiswaan (Tgl Lahir 20 April 1989 -> Pass default: 20041989)
  (
    'e1f2a3b4-0005-4000-8000-000000000005',
    'Hendra Wijaya, S.Pd',
    'kesiswaan',
    true,
    '198904202015041001',
    '1989-04-20',
    null,
    'sekolah',
    true
  ),
  -- Wali Kelas 7A (Tgl Lahir 15 Maret 1985 -> Pass default: 15031985)
  (
    'e1f2a3b4-0001-4000-8000-000000000001',
    'Siti Rahayu, S.Pd',
    'wali_kelas',
    true,
    '198503152010012003',
    '1985-03-15',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'kelas',
    true
  )
on conflict (nip_atau_nik) do update set
  nama = excluded.nama,
  role = excluded.role,
  tanggal_lahir = excluded.tanggal_lahir,
  scope = excluded.scope;

update kelas set wali_kelas_id = 'e1f2a3b4-0001-4000-8000-000000000001' where nama_kelas = '7A';

-- 4. SEED 32 SISWA KELAS 7A
insert into siswa (id, nisn, nama, kelas_id, tanggal_lahir, sudah_ganti_password)
values
  ('b1c2d3e4-0001-4000-8000-000000000001', '0081234567', 'Ahmad Faiz Al-Faruq', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-05-15', true),
  ('b1c2d3e4-0002-4000-8000-000000000002', '0081234568', 'Aisyah Putri Azzahra', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-08-20', false),
  ('b1c2d3e4-0003-4000-8000-000000000003', '0081234569', 'Alif Pratama Ramadhan', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-09-02', false),
  ('b1c2d3e4-0004-4000-8000-000000000004', '0081234570', 'Annisa Nurul Izzah', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-03-12', false),
  ('b1c2d3e4-0005-4000-8000-000000000005', '0081234571', 'Bagas Dwi Wicaksono', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-11-25', false),
  ('b1c2d3e4-0006-4000-8000-000000000006', '0081234572', 'Bilqis Humaira', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-01-19', false),
  ('b1c2d3e4-0007-4000-8000-000000000007', '0081234573', 'Dafa Arya Putra', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-06-14', false),
  ('b1c2d3e4-0008-4000-8000-000000000008', '0081234574', 'Devina Salma Zahra', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-07-30', false),
  ('b1c2d3e4-0009-4000-8000-000000000009', '0081234575', 'Dimas Satrio Utomo', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-04-05', false),
  ('b1c2d3e4-0010-4000-8000-000000000010', '0081234576', 'Fadhil Rahman Hakim', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-10-10', false),
  ('b1c2d3e4-0011-4000-8000-000000000011', '0081234577', 'Farhan Maulana Malik', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-02-18', false),
  ('b1c2d3e4-0012-4000-8000-000000000012', '0081234578', 'Fatimah Az-Zahra', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-12-01', false),
  ('b1c2d3e4-0013-4000-8000-000000000013', '0081234579', 'Galih Pangestu', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-05-22', false),
  ('b1c2d3e4-0014-4000-8000-000000000014', '0081234580', 'Ghaida Shafa Kamila', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-09-17', false),
  ('b1c2d3e4-0015-4000-8000-000000000015', '0081234581', 'Hafizh Ihsanuddin', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-03-08', false),
  ('b1c2d3e4-0016-4000-8000-000000000016', '0081234582', 'Hana Nabilah Syarif', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-06-27', false),
  ('b1c2d3e4-0017-4000-8000-000000000017', '0081234583', 'Irfan Syahputra', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-08-11', false),
  ('b1c2d3e4-0018-4000-8000-000000000018', '0081234584', 'Kayla Nayla Putri', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-10-23', false),
  ('b1c2d3e4-0019-4000-8000-000000000019', '0081234585', 'Kenzie Raditya Anwar', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-01-04', false),
  ('b1c2d3e4-0020-4000-8000-000000000020', '0081234586', 'Latifah Qurrota Ayun', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-07-16', false),
  ('b1c2d3e4-0021-4000-8000-000000000021', '0081234587', 'M. Rizky Kurniawan', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-04-29', false),
  ('b1c2d3e4-0022-4000-8000-000000000022', '0081234588', 'Nabila Maharani', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-11-14', false),
  ('b1c2d3e4-0023-4000-8000-000000000023', '0081234589', 'Naufal Raihan Akbar', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-02-09', false),
  ('b1c2d3e4-0024-4000-8000-000000000024', '0081234590', 'Putri Ayu Wandira', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-05-03', false),
  ('b1c2d3e4-0025-4000-8000-000000000025', '0081234591', 'Rafi Ahmad Fauzi', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-09-28', false),
  ('b1c2d3e4-0026-4000-8000-000000000026', '0081234592', 'Rania Khalila Putri', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-12-19', false),
  ('b1c2d3e4-0027-4000-8000-000000000027', '0081234593', 'Reza Adityawarman', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-03-31', false),
  ('b1c2d3e4-0028-4000-8000-000000000028', '0081234594', 'Salma Nur Azizah', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-08-07', false),
  ('b1c2d3e4-0029-4000-8000-000000000029', '0081234595', 'Syamil Zhafran Hadi', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-06-02', false),
  ('b1c2d3e4-0030-4000-8000-000000000030', '0081234596', 'Tania Safitri', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-10-15', false),
  ('b1c2d3e4-0031-4000-8000-000000000031', '0081234597', 'Zackly Wildan Pratama', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-01-28', false),
  ('b1c2d3e4-0032-4000-8000-000000000032', '0081234598', 'Zahra Amelia Santoso', 'a1b2c3d4-0001-4000-8000-000000000001', '2011-07-09', false)
on conflict (nisn) do update set
  nama = excluded.nama,
  tanggal_lahir = excluded.tanggal_lahir;
