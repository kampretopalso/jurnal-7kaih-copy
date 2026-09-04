import { 
  ArahanWaliKelas, 
  EntriJurnal, 
  Feedback, 
  Kebiasaan, 
  Kelas, 
  LogHapus, 
  Siswa, 
  StafSekolah 
} from '../types/database';

export const INITIAL_KEBIASAAN: Kebiasaan[] = [
  {
    id: 1,
    nama: 'Bangun Pagi',
    urutan: 1,
    deskripsi: 'Bangun tepat waktu antara pukul 04.00 s.d 05.00 WIB untuk memulai hari dengan segar.',
    jam_mulai: '04:00',
    jam_selesai: '05:00',
    toleransi_menit: 0,
    maks_input_harian: 1,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: false,
    icon_name: 'Sunrise',
    warna_tema: 'amber'
  },
  {
    id: 2,
    nama: 'Beribadah',
    urutan: 2,
    deskripsi: 'Melaksanakan sholat fardhu tepat waktu sesuai hisab wilayah Banyuwangi. Khusus hari Minggu dinilai 5 waktu (termasuk Dhuhur), sedangkan Senin–Sabtu sholat Dhuhur berjamaah di sekolah.',
    jam_mulai: null,
    jam_selesai: null,
    toleransi_menit: 15,
    maks_input_harian: 5,
    butuh_sub_tipe: true,
    daftar_sub_tipe: ['Subuh', 'Dhuhur', 'Ashar', 'Maghrib', "Isya'"],
    butuh_nama_kegiatan: false,
    icon_name: 'HeartHandshake',
    warna_tema: 'emerald'
  },
  {
    id: 3,
    nama: 'Berolahraga',
    urutan: 3,
    deskripsi: 'Melakukan olahraga atau peregangan fisik minimal 15-30 menit.',
    jam_mulai: null,
    jam_selesai: null,
    toleransi_menit: 0,
    maks_input_harian: 1,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: false,
    icon_name: 'Activity',
    warna_tema: 'blue'
  },
  {
    id: 4,
    nama: 'Makan Sehat dan Bergizi',
    urutan: 4,
    deskripsi: 'Sarapan dan makan makanan bergizi seimbang (sayur, buah, protein, karbohidrat).',
    jam_mulai: null,
    jam_selesai: null,
    toleransi_menit: 0,
    maks_input_harian: 2,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: false,
    icon_name: 'Utensils',
    warna_tema: 'green'
  },
  {
    id: 5,
    nama: 'Gemar Belajar',
    urutan: 5,
    deskripsi: 'Membaca buku pengetahuan, mengulang materi sekolah, atau persiapan pelajaran esok hari disertai cerita refleksi minimal 100 kata.',
    jam_mulai: null,
    jam_selesai: null,
    toleransi_menit: 0,
    maks_input_harian: 1,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: false,
    icon_name: 'BookOpen',
    warna_tema: 'indigo'
  },
  {
    id: 6,
    nama: 'Bermasyarakat',
    urutan: 6,
    deskripsi: 'Membantu orang tua, gotong royong, atau berinteraksi santun dengan tetangga.',
    jam_mulai: null,
    jam_selesai: null,
    toleransi_menit: 0,
    maks_input_harian: 1,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: true,
    icon_name: 'Users',
    warna_tema: 'purple'
  },
  {
    id: 7,
    nama: 'Tidur Cepat',
    urutan: 7,
    deskripsi: 'Tidur malam tepat waktu antara 20.00 s.d 22.00 WIB (toleransi s.d 22.15 WIB).',
    jam_mulai: '20:00',
    jam_selesai: '22:00',
    toleransi_menit: 15,
    maks_input_harian: 1,
    butuh_sub_tipe: false,
    daftar_sub_tipe: null,
    butuh_nama_kegiatan: false,
    icon_name: 'Moon',
    warna_tema: 'violet'
  }
];

// 18 KELAS LENGKAP: 7A s.d 9F
export const INITIAL_KELAS: Kelas[] = [
  // Kelas 7 (7A - 7F)
  { id: 'k-7a', nama_kelas: '7A', tingkat: 7, wali_kelas_id: 'staf-wali-7a' },
  { id: 'k-7b', nama_kelas: '7B', tingkat: 7, wali_kelas_id: 'staf-wali-7b' },
  { id: 'k-7c', nama_kelas: '7C', tingkat: 7, wali_kelas_id: 'staf-wali-7c' },
  { id: 'k-7d', nama_kelas: '7D', tingkat: 7, wali_kelas_id: 'staf-wali-7d' },
  { id: 'k-7e', nama_kelas: '7E', tingkat: 7, wali_kelas_id: 'staf-wali-7e' },
  { id: 'k-7f', nama_kelas: '7F', tingkat: 7, wali_kelas_id: 'staf-wali-7f' },
  // Kelas 8 (8A - 8F)
  { id: 'k-8a', nama_kelas: '8A', tingkat: 8, wali_kelas_id: 'staf-wali-8a' },
  { id: 'k-8b', nama_kelas: '8B', tingkat: 8, wali_kelas_id: 'staf-wali-8b' },
  { id: 'k-8c', nama_kelas: '8C', tingkat: 8, wali_kelas_id: 'staf-wali-8c' },
  { id: 'k-8d', nama_kelas: '8D', tingkat: 8, wali_kelas_id: 'staf-wali-8d' },
  { id: 'k-8e', nama_kelas: '8E', tingkat: 8, wali_kelas_id: 'staf-wali-8e' },
  { id: 'k-8f', nama_kelas: '8F', tingkat: 8, wali_kelas_id: 'staf-wali-8f' },
  // Kelas 9 (9A - 9F)
  { id: 'k-9a', nama_kelas: '9A', tingkat: 9, wali_kelas_id: 'staf-wali-9a' },
  { id: 'k-9b', nama_kelas: '9B', tingkat: 9, wali_kelas_id: 'staf-wali-9b' },
  { id: 'k-9c', nama_kelas: '9C', tingkat: 9, wali_kelas_id: 'staf-wali-9c' },
  { id: 'k-9d', nama_kelas: '9D', tingkat: 9, wali_kelas_id: 'staf-wali-9d' },
  { id: 'k-9e', nama_kelas: '9E', tingkat: 9, wali_kelas_id: 'staf-wali-9e' },
  { id: 'k-9f', nama_kelas: '9F', tingkat: 9, wali_kelas_id: 'staf-wali-9f' }
];

export const INITIAL_STAF: StafSekolah[] = [
  // SUPERADMIN (Aji Bagus Khoiri - Tanggal Lahir 06-08-1994)
  {
    id: 'staf-superadmin-aji',
    nama: 'Aji Bagus Khoiri (Superadmin)',
    role: 'superadmin',
    status_asn: true,
    nip_atau_nik: 'ajibaguskhoiri',
    tanggal_lahir: '1994-08-06',
    kelas_id: null,
    scope: 'sekolah',
    sudah_ganti_password: true
  },
  // Pimpinan Sekolah
  {
    id: 'staf-kepsek',
    nama: 'Drs. Bambang Sudarmono, M.Pd',
    role: 'kepala_sekolah',
    status_asn: true,
    nip_atau_nik: '197201011998031002',
    tanggal_lahir: '1972-01-01',
    kelas_id: null,
    scope: 'sekolah',
    sudah_ganti_password: false
  },
  {
    id: 'staf-kurikulum',
    nama: 'Hj. Nurul Fadilah, M.Pd',
    role: 'waka_kurikulum',
    status_asn: true,
    nip_atau_nik: '197808122003122004',
    tanggal_lahir: '1978-08-12',
    kelas_id: null,
    scope: 'sekolah',
    sudah_ganti_password: false
  },
  {
    id: 'staf-kesiswaan',
    nama: 'Hendra Wijaya, S.Pd',
    role: 'kesiswaan',
    status_asn: true,
    nip_atau_nik: '198904202015041001',
    tanggal_lahir: '1989-04-20',
    kelas_id: null,
    scope: 'sekolah',
    sudah_ganti_password: false
  },
  // Wali Kelas 7
  { id: 'staf-wali-7a', nama: 'Siti Rahayu, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198503152010012003', tanggal_lahir: '1985-03-15', kelas_id: 'k-7a', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-7b', nama: 'Ahmad Hidayat, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890001', tanggal_lahir: '1988-06-10', kelas_id: 'k-7b', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-7c', nama: 'Dewi Lestari, M.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198605122011012005', tanggal_lahir: '1986-05-12', kelas_id: 'k-7c', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-7d', nama: 'Budi Santoso, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198402102009021003', tanggal_lahir: '1984-02-10', kelas_id: 'k-7d', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-7e', nama: 'Rina Marlina, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890002', tanggal_lahir: '1990-11-22', kelas_id: 'k-7e', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-7f', nama: 'Fajar Nugroho, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '199001012019031008', tanggal_lahir: '1990-01-01', kelas_id: 'k-7f', scope: 'kelas', sudah_ganti_password: false },
  // Wali Kelas 8
  { id: 'staf-wali-8a', nama: 'Tri Wahyuni, M.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198104152006042011', tanggal_lahir: '1981-04-15', kelas_id: 'k-8a', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-8b', nama: 'Eko Prasetyo, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198709212014021002', tanggal_lahir: '1987-09-21', kelas_id: 'k-8b', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-8c', nama: 'Sri Mulyani, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890003', tanggal_lahir: '1983-07-04', kelas_id: 'k-8c', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-8d', nama: 'Agus Setiawan, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198308112008011004', tanggal_lahir: '1983-08-11', kelas_id: 'k-8d', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-8e', nama: 'Indah Permata, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '199106302018012006', tanggal_lahir: '1991-06-30', kelas_id: 'k-8e', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-8f', nama: 'Wawan Gunawan, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890004', tanggal_lahir: '1986-12-18', kelas_id: 'k-8f', scope: 'kelas', sudah_ganti_password: false },
  // Wali Kelas 9
  { id: 'staf-wali-9a', nama: 'Dra. Endang Sulastri', role: 'wali_kelas', status_asn: true, nip_atau_nik: '197509142000032001', tanggal_lahir: '1975-09-14', kelas_id: 'k-9a', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-9b', nama: 'Yusuf Habibi, M.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198003252005011005', tanggal_lahir: '1980-03-25', kelas_id: 'k-9b', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-9c', nama: 'Ratna Juwita, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890005', tanggal_lahir: '1989-02-14', kelas_id: 'k-9c', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-9d', nama: 'Heri Susanto, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198212052007011007', tanggal_lahir: '1982-12-05', kelas_id: 'k-9d', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-9e', nama: 'Maya Anggraini, S.Pd', role: 'wali_kelas', status_asn: true, nip_atau_nik: '198811192015032004', tanggal_lahir: '1988-11-19', kelas_id: 'k-9e', scope: 'kelas', sudah_ganti_password: false },
  { id: 'staf-wali-9f', nama: 'Joko Priyono, S.Pd', role: 'wali_kelas', status_asn: false, nip_atau_nik: '3201234567890006', tanggal_lahir: '1985-08-28', kelas_id: 'k-9f', scope: 'kelas', sudah_ganti_password: false }
];

// 32 SISWA KELAS 7A
export const INITIAL_SISWA_7A: Siswa[] = [
  { id: 's-01', nisn: '0081234567', nama: 'Ahmad Faiz Al-Faruq', kelas_id: 'k-7a', tanggal_lahir: '2011-05-15', sudah_ganti_password: true },
  { id: 's-02', nisn: '0081234568', nama: 'Aisyah Putri Azzahra', kelas_id: 'k-7a', tanggal_lahir: '2011-08-20', sudah_ganti_password: false },
  { id: 's-03', nisn: '0081234569', nama: 'Alif Pratama Ramadhan', kelas_id: 'k-7a', tanggal_lahir: '2011-09-02', sudah_ganti_password: false },
  { id: 's-04', nisn: '0081234570', nama: 'Annisa Nurul Izzah', kelas_id: 'k-7a', tanggal_lahir: '2011-03-12', sudah_ganti_password: false },
  { id: 's-05', nisn: '0081234571', nama: 'Bagas Dwi Wicaksono', kelas_id: 'k-7a', tanggal_lahir: '2011-11-25', sudah_ganti_password: false },
  { id: 's-06', nisn: '0081234572', nama: 'Bilqis Humaira', kelas_id: 'k-7a', tanggal_lahir: '2011-01-19', sudah_ganti_password: false },
  { id: 's-07', nisn: '0081234573', nama: 'Dafa Arya Putra', kelas_id: 'k-7a', tanggal_lahir: '2011-06-14', sudah_ganti_password: false },
  { id: 's-08', nisn: '0081234574', nama: 'Devina Salma Zahra', kelas_id: 'k-7a', tanggal_lahir: '2011-07-30', sudah_ganti_password: false },
  { id: 's-09', nisn: '0081234575', nama: 'Dimas Satrio Utomo', kelas_id: 'k-7a', tanggal_lahir: '2011-04-05', sudah_ganti_password: false },
  { id: 's-10', nisn: '0081234576', nama: 'Fadhil Rahman Hakim', kelas_id: 'k-7a', tanggal_lahir: '2011-10-10', sudah_ganti_password: false },
  { id: 's-11', nisn: '0081234577', nama: 'Farhan Maulana Malik', kelas_id: 'k-7a', tanggal_lahir: '2011-02-18', sudah_ganti_password: false },
  { id: 's-12', nisn: '0081234578', nama: 'Fatimah Az-Zahra', kelas_id: 'k-7a', tanggal_lahir: '2011-12-01', sudah_ganti_password: false },
  { id: 's-13', nisn: '0081234579', nama: 'Galih Pangestu', kelas_id: 'k-7a', tanggal_lahir: '2011-05-22', sudah_ganti_password: false },
  { id: 's-14', nisn: '0081234580', nama: 'Ghaida Shafa Kamila', kelas_id: 'k-7a', tanggal_lahir: '2011-09-17', sudah_ganti_password: false },
  { id: 's-15', nisn: '0081234581', nama: 'Hafizh Ihsanuddin', kelas_id: 'k-7a', tanggal_lahir: '2011-03-08', sudah_ganti_password: false },
  { id: 's-16', nisn: '0081234582', nama: 'Hana Nabilah Syarif', kelas_id: 'k-7a', tanggal_lahir: '2011-06-27', sudah_ganti_password: false },
  { id: 's-17', nisn: '0081234583', nama: 'Irfan Syahputra', kelas_id: 'k-7a', tanggal_lahir: '2011-08-11', sudah_ganti_password: false },
  { id: 's-18', nisn: '0081234584', nama: 'Kayla Nayla Putri', kelas_id: 'k-7a', tanggal_lahir: '2011-10-23', sudah_ganti_password: false },
  { id: 's-19', nisn: '0081234585', nama: 'Kenzie Raditya Anwar', kelas_id: 'k-7a', tanggal_lahir: '2011-01-04', sudah_ganti_password: false },
  { id: 's-20', nisn: '0081234586', nama: 'Latifah Qurrota Ayun', kelas_id: 'k-7a', tanggal_lahir: '2011-07-16', sudah_ganti_password: false },
  { id: 's-21', nisn: '0081234587', nama: 'M. Rizky Kurniawan', kelas_id: 'k-7a', tanggal_lahir: '2011-04-29', sudah_ganti_password: false },
  { id: 's-22', nisn: '0081234588', nama: 'Nabila Maharani', kelas_id: 'k-7a', tanggal_lahir: '2011-11-14', sudah_ganti_password: false },
  { id: 's-23', nisn: '0081234589', nama: 'Naufal Raihan Akbar', kelas_id: 'k-7a', tanggal_lahir: '2011-02-09', sudah_ganti_password: false },
  { id: 's-24', nisn: '0081234590', nama: 'Putri Ayu Wandira', kelas_id: 'k-7a', tanggal_lahir: '2011-05-03', sudah_ganti_password: false },
  { id: 's-25', nisn: '0081234591', nama: 'Rafi Ahmad Fauzi', kelas_id: 'k-7a', tanggal_lahir: '2011-09-28', sudah_ganti_password: false },
  { id: 's-26', nisn: '0081234592', nama: 'Rania Khalila Putri', kelas_id: 'k-7a', tanggal_lahir: '2011-12-19', sudah_ganti_password: false },
  { id: 's-27', nisn: '0081234593', nama: 'Reza Adityawarman', kelas_id: 'k-7a', tanggal_lahir: '2011-03-31', sudah_ganti_password: false },
  { id: 's-28', nisn: '0081234594', nama: 'Salma Nur Azizah', kelas_id: 'k-7a', tanggal_lahir: '2011-08-07', sudah_ganti_password: false },
  { id: 's-29', nisn: '0081234595', nama: 'Syamil Zhafran Hadi', kelas_id: 'k-7a', tanggal_lahir: '2011-06-02', sudah_ganti_password: false },
  { id: 's-30', nisn: '0081234596', nama: 'Tania Safitri', kelas_id: 'k-7a', tanggal_lahir: '2011-10-15', sudah_ganti_password: false },
  { id: 's-31', nisn: '0081234597', nama: 'Zackly Wildan Pratama', kelas_id: 'k-7a', tanggal_lahir: '2011-01-28', sudah_ganti_password: false },
  { id: 's-32', nisn: '0081234598', nama: 'Zahra Amelia Santoso', kelas_id: 'k-7a', tanggal_lahir: '2011-07-09', sudah_ganti_password: false }
];

const generateOtherClassStudents = (): Siswa[] => {
  const list: Siswa[] = [...INITIAL_SISWA_7A];
  INITIAL_KELAS.filter(k => k.id !== 'k-7a').forEach((kelas, kIdx) => {
    for (let i = 1; i <= 32; i++) {
      const idNum = String(i).padStart(2, '0');
      list.push({
        id: `s-${kelas.nama_kelas}-${idNum}`,
        nisn: `00${kelas.tingkat}12${kIdx}${idNum}`,
        nama: `Siswa ${kelas.nama_kelas} #${i}`,
        kelas_id: kelas.id,
        tanggal_lahir: `201${12 - kelas.tingkat}-05-${(i % 28) + 1}`,
        sudah_ganti_password: false
      });
    }
  });
  return list;
};

export const ALL_INITIAL_SISWA: Siswa[] = generateOtherClassStudents();

const _now = new Date();
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

export const INITIAL_ENTRI: EntriJurnal[] = [
  {
    id: 'entry-1',
    siswa_id: 's-01',
    kebiasaan_id: 1,
    tanggal: todayStr,
    urutan_ke: 1,
    sub_tipe: null,
    nama_kegiatan: null,
    catatan: 'Bangun pukul 04.30, langsung wudhu dan merapikan kasur.',
    foto_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop',
    sumber_foto: 'kamera',
    waktu_ambil_foto: `${todayStr}T04:32:00.000Z`,
    waktu_submit: `${todayStr}T04:35:00.000Z`,
    flag_foto_mencurigakan: false,
    alasan_flag: null,
    status_waktu: 'tepat_waktu'
  },
  {
    id: 'entry-2',
    siswa_id: 's-01',
    kebiasaan_id: 2,
    tanggal: todayStr,
    urutan_ke: 1,
    sub_tipe: 'Subuh',
    nama_kegiatan: null,
    catatan: 'Sholat Subuh berjamaah di masjid dekat rumah.',
    foto_url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&auto=format&fit=crop',
    sumber_foto: 'kamera',
    waktu_ambil_foto: `${todayStr}T04:55:00.000Z`,
    waktu_submit: `${todayStr}T05:00:00.000Z`,
    flag_foto_mencurigakan: false,
    alasan_flag: null,
    status_waktu: 'tidak_berlaku'
  },
  {
    id: 'entry-3',
    siswa_id: 's-01',
    kebiasaan_id: 3,
    tanggal: todayStr,
    urutan_ke: 1,
    sub_tipe: null,
    nama_kegiatan: null,
    catatan: 'Jogging pagi dan peregangan di halaman rumah.',
    foto_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop',
    sumber_foto: 'upload',
    waktu_ambil_foto: `${todayStr}T06:15:00.000Z`,
    waktu_submit: `${todayStr}T06:20:00.000Z`,
    flag_foto_mencurigakan: false,
    alasan_flag: null,
    status_waktu: 'tidak_berlaku'
  },
  {
    id: 'entry-4',
    siswa_id: 's-01',
    kebiasaan_id: 6,
    tanggal: todayStr,
    urutan_ke: 1,
    sub_tipe: null,
    nama_kegiatan: 'Bantu pekerjaan rumah',
    catatan: 'Membantu ibu mencuci piring dan membersihkan meja makan.',
    foto_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop',
    sumber_foto: 'upload',
    waktu_ambil_foto: `2026-08-20T07:10:00.000Z`,
    waktu_submit: `${todayStr}T07:15:00.000Z`,
    flag_foto_mencurigakan: true,
    alasan_flag: 'Tanggal foto EXIF (20 Agustus 2026) berbeda dengan tanggal jurnal hari ini.',
    status_waktu: 'tidak_berlaku'
  },
  {
    id: 'entry-5',
    siswa_id: 's-02',
    kebiasaan_id: 1,
    tanggal: todayStr,
    urutan_ke: 1,
    sub_tipe: null,
    nama_kegiatan: null,
    catatan: 'Bangun pagi 04.45 WIB.',
    foto_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop',
    sumber_foto: 'kamera',
    waktu_ambil_foto: `${todayStr}T04:46:00.000Z`,
    waktu_submit: `${todayStr}T04:50:00.000Z`,
    flag_foto_mencurigakan: false,
    alasan_flag: null,
    status_waktu: 'tepat_waktu'
  }
];

export const INITIAL_FEEDBACK: Feedback[] = [
  {
    id: 'fb-1',
    staf_id: 'staf-wali-7a',
    siswa_id: 's-01',
    entri_id: 'entry-1',
    komentar: 'Hebat Faiz! Pertahankan bangun pagi dan sholat subuh tepat waktu.',
    created_at: `${todayStr}T08:00:00.000Z`
  }
];

export const INITIAL_ARAHAN: ArahanWaliKelas[] = [
  {
    id: 'arahan-1',
    staf_pengirim_id: 'staf-kepsek',
    kelas_id: 'k-7a',
    kategori: 'apresiasi',
    judul: 'Apresiasi Tingkat Kepatuhan Jurnal Kelas 7A',
    pesan: 'Terima kasih Ibu Siti Rahayu. Kelas 7A menunjukkan antusiasme yang sangat baik dalam pengisian jurnal 7 kebiasaan pada minggu ini. Mohon terus dampingi siswa.',
    created_at: `${todayStr}T07:30:00.000Z`,
    dibaca: false
  },
  {
    id: 'arahan-2',
    staf_pengirim_id: 'staf-kurikulum',
    kelas_id: 'k-7a',
    kategori: 'instruksi',
    judul: 'Penguatan Kebiasaan Gemar Belajar dan Membaca',
    pesan: 'Mohon wali kelas mengingatkan siswa untuk mendokumentasikan kegiatan membaca buku non-pelajaran 15 menit sebelum tidur malam.',
    created_at: `${todayStr}T08:15:00.000Z`,
    dibaca: false
  },
  {
    id: 'arahan-3',
    staf_pengirim_id: 'staf-kesiswaan',
    kelas_id: 'k-8b',
    kategori: 'evaluasi',
    judul: 'Tinjauan Catatan Foto Bermasyarakat',
    pesan: 'Ada beberapa entri siswa yang foto tanpa metadata EXIF. Mohon ditinjau manual pada saat jam wali kelas.',
    created_at: `${todayStr}T09:00:00.000Z`,
    dibaca: false
  }
];

export const INITIAL_LOG_HAPUS: LogHapus[] = [];
