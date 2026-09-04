// TypeScript interfaces untuk Database Jurnal 7 Kebiasaan Anak Indonesia Hebat

export type RoleStaf = 'superadmin' | 'wali_kelas' | 'kepala_sekolah' | 'waka_kurikulum' | 'kesiswaan';
export type ScopeStaf = 'kelas' | 'sekolah';
export type StatusWaktu = 'tepat_waktu' | 'toleransi' | 'terlambat' | 'tidak_berlaku';
export type SumberFoto = 'kamera' | 'upload';
export type KategoriArahan = 'apresiasi' | 'evaluasi' | 'instruksi' | 'tindak_lanjut';

export interface StafSekolah {
  id: string;
  auth_id?: string;
  nama: string;
  role: RoleStaf;
  status_asn: boolean;
  nip_atau_nik: string;
  tanggal_lahir: string; // YYYY-MM-DD -> Password default DDMMYYYY
  kelas_id?: string | null;
  scope: ScopeStaf;
  sudah_ganti_password: boolean;
  created_at?: string;
  kelas?: Kelas;
}

export interface Kelas {
  id: string;
  nama_kelas: string; // misal: '7A', '7B', ..., '9F'
  tingkat: number; // 7, 8, atau 9
  wali_kelas_id?: string | null;
  created_at?: string;
  wali_kelas?: StafSekolah;
}

export interface Siswa {
  id: string;
  auth_id?: string;
  nisn: string;
  nama: string;
  kelas_id: string;
  tanggal_lahir: string; // YYYY-MM-DD -> Password default DDMMYYYY
  sudah_ganti_password: boolean;
  created_at?: string;
  kelas?: Kelas;
}

export interface Kebiasaan {
  id: number;
  nama: string;
  urutan: number;
  deskripsi?: string;
  jam_mulai?: string | null; // HH:MM
  jam_selesai?: string | null; // HH:MM
  toleransi_menit: number;
  maks_input_harian: number;
  butuh_sub_tipe: boolean;
  daftar_sub_tipe?: string[] | null;
  butuh_nama_kegiatan: boolean;
  icon_name?: string;
  warna_tema?: string;
}

export interface EntriJurnal {
  id: string;
  siswa_id: string;
  kebiasaan_id: number;
  tanggal: string; // YYYY-MM-DD
  urutan_ke: number;
  sub_tipe?: string | null;
  nama_kegiatan?: string | null;
  catatan?: string | null;
  foto_url: string;
  sumber_foto: SumberFoto;
  waktu_ambil_foto?: string | null; // ISO timestamptz
  waktu_submit: string; // ISO timestamptz
  flag_foto_mencurigakan: boolean;
  alasan_flag?: string | null;
  status_waktu: StatusWaktu;
  siswa?: Siswa;
  kebiasaan?: Kebiasaan;
}

export interface Feedback {
  id: string;
  staf_id: string;
  siswa_id: string;
  entri_id?: string | null;
  komentar: string;
  created_at: string;
  staf?: StafSekolah;
  siswa?: Siswa;
}

export interface ArahanWaliKelas {
  id: string;
  staf_pengirim_id: string;
  kelas_id: string;
  kategori: KategoriArahan;
  judul: string;
  pesan: string;
  created_at: string;
  dibaca: boolean;
  staf_pengirim?: StafSekolah;
  kelas?: Kelas;
}

export interface LogHapus {
  id: string;
  entri_id?: string;
  data_terhapus: Partial<EntriJurnal>;
  dihapus_oleh: string;
  alasan: string;
  waktu: string;
  staf?: StafSekolah;
}

export interface ExifAnalysisResult {
  hasExif: boolean;
  dateTimeOriginal?: Date | null;
  isSuspicious: boolean;
  reason?: string | null;
  rawTags?: Record<string, any>;
}

export type AuthUser = 
  | { type: 'siswa'; data: Siswa }
  | { type: 'staf'; data: StafSekolah };

export interface ClassRankingItem {
  rank: number;
  kelasId: string;
  namaKelas: string;
  tingkat: number;
  waliKelasNama: string;
  totalSiswa: number;
  siswaTuntasCount: number;
  totalTuntasAkumulasi?: number;
  isMultiDay?: boolean;
  totalDays?: number;
  tuntasPercentage: number;
  totalEntri: number;
  persentaseKepatuhan: number; // 0 - 100%
  flaggedPhotosCount: number;
  tepatWaktuCount: number;
  score: number; // calculated overall compliance score
}

export interface StudentRankingItem {
  rank: number;
  siswaId: string;
  nama: string;
  nisn: string;
  namaKelas: string;
  tingkat: number;
  totalKebiasaan: number; // 7
  selesaiPada: string; // ISO string waktu submit entri ke-7
  selesaiFormatted: string; // HH:mm:ss WIB
  hasFlaggedPhoto: boolean; // Must be false to qualify
  isTepatWaktu: boolean; // Must be true (no terlambat in habit 1 & 7)
  scoreKerapian: number;
}

export interface BadgeItem {
  id: string;
  title: string;
  category: 'fajar' | 'literasi' | 'sosial' | 'bugar' | 'spiritual' | 'istiqomah';
  icon: string;
  description: string;
  requirement: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  targetProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface GamificationProfile {
  siswaId: string;
  currentStreak: number; // hari berturut-turut
  longestStreak: number;
  totalDaysActive: number;
  totalHabitsCompleted: number;
  badges: BadgeItem[];
}

export interface HabitRaporDetail {
  kebiasaanId: number;
  urutan: number;
  nama: string;
  totalTerisi: number;
  totalTargetHari: number;
  persentase: number;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  catatanKarakter: string;
}

export interface RaporKarakterData {
  siswa: Siswa;
  namaKelas: string;
  waliKelasNama: string;
  kepalaSekolahNama: string;
  periodeLabel: string;
  rentangTanggal: string;
  totalHariAktif: number;
  rataRataKepatuhan: number;
  predikatUmum: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  habitsDetail: HabitRaporDetail[];
  catatanWaliKelas: string;
  pesanKepalaSekolah: string;
}

export interface LiterasiItem {
  id: string;
  siswaId: string;
  siswaNama: string;
  namaKelas: string;
  tanggal: string;
  subTipe: string | null;
  namaKegiatan: string | null; // Judul buku / materi
  catatan: string | null;
  waktuSubmit: string;
  fotoUrl: string | null;
}

export interface WarningStudentItem {
  siswa: Siswa;
  namaKelas: string;
  waliKelasNama: string;
  hariTanpaEntriCount: number;
  terakhirMengisiTanggal: string | null;
  flaggedPhotosTotal: number;
  terlambatTotal: number;
  kategoriWarning: 'pasif_berat' | 'pasif_sedang' | 'indikasi_anomali' | 'sering_terlambat';
  rekomendasiTindakan: string;
}

export type TipePiagam = 
  | 'kelas_terbaik'
  | 'siswa_teladan'
  | 'siswa_istiqomah'
  | 'siswa_effort'
  | 'siswa_literasi'
  | 'siswa_sosial'
  | 'siswa_olahraga'
  | 'wali_istiqomah'
  | 'wali_effort'
  | 'wali_responsif';

export interface PiagamData {
  tipe: TipePiagam;
  kategoriLabel: string; // Misal: "Siswa Terkonsisten (Streak Master)", "Wali Kelas Ter-Istiqomah", dll.
  judul: string;
  nomorSurat: string;
  diberikanKepada: string; // Nama Kelas / Siswa / Wali Kelas
  subPenerima?: string; // Misal: "NISN: 0112345678 • Kelas 7A" atau "NIP. 1980... • Wali Kelas 8B"
  periodeLabel: string; // Misal: "Periode Mingguan (19 - 26 Agustus 2026)", "Bulan Agustus 2026", "Semester Ganjil 2026/2027"
  keterangan: string; // Deskripsi penghargaan resmi
  tanggal: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  skor: number | string;
}

export type KategoriSuara = 'curhat_pembiasaan' | 'keluhan_kendala' | 'ide_saran_aplikasi' | 'lainnya';

export interface TanggapanSuaraItem {
  id: string;
  staf_id: string;
  staf_nama: string;
  staf_role: string;
  tanggapan: string;
  created_at: string;
}

export interface SuaraSiswa {
  id: string;
  siswa_id: string;
  kelas_id?: string;
  kategori: KategoriSuara;
  judul: string;
  isi: string;
  tanggal: string; // YYYY-MM-DD
  tanggapan?: string | null;
  tanggapan_oleh_staf_id?: string | null;
  tanggapan_at?: string | null;
  daftar_tanggapan?: TanggapanSuaraItem[];
  created_at?: string;
  // Join properties
  siswa?: Siswa;
  kelas?: Kelas;
  staf_penanggap?: StafSekolah;
}

export interface PesanKomunikasi {
  id: string;
  pengirim_id: string;
  pengirim_nama: string;
  pengirim_role: 'siswa' | 'wali_kelas' | 'kepala_sekolah' | 'waka_kurikulum' | 'kesiswaan' | 'superadmin';
  penerima_id: string;
  penerima_nama: string;
  penerima_role: 'siswa' | 'wali_kelas' | 'kepala_sekolah' | 'waka_kurikulum' | 'kesiswaan' | 'superadmin';
  kelas_id?: string;
  kelas_nama?: string;
  subjek: string;
  pesan: string;
  sudah_dibaca: boolean;
  created_at: string;
}


