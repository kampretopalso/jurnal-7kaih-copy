export interface SchoolProfile {
  nama: string;
  jenjang: string;
  npsn: string;
  status: string;
  alamat: string;
  kabupaten: string;
  provinsi: string;
  akreditasi: string;
  tahunAjaran: string;
  telepon: string;
  email: string;
  website: string;
  motto: string;
  logoUrl?: string;
  logoKabupatenUrl?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
}

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  nama: 'SMPN 2 Glagah',
  jenjang: 'SMP',
  npsn: '20525649',
  status: 'Negeri',
  alamat: 'Jl. Kenjo No.45, Glagah, Banyuwangi, Jawa Timur 68432',
  kabupaten: 'Kabupaten Banyuwangi',
  provinsi: 'Jawa Timur',
  akreditasi: 'A',
  tahunAjaran: '2026/2027',
  telepon: '(0333) 421000',
  email: 'smpn2glagah@gmail.com',
  website: 'https://smpnegeri2glagah.sch.id',
  motto: 'Berakhlak Mulia, Berprestasi, dan Berkarakter Luhur',
  logoUrl: '/logos/logo_smpn2_glagah.png',
  logoKabupatenUrl: '/logos/logo_banyuwangi.png',
  namaKepalaSekolah: 'Drs. Bambang Sudarmono, M.Pd',
  nipKepalaSekolah: '197201011998031002'
};

export const SCHOOL_PROFILE_STORAGE_KEY = 'jurnal_7kaih_custom_school_profile';

/**
 * Helper sinkronisasi profil lokal dari LocalStorage
 */
export function getLocalSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(SCHOOL_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SCHOOL_PROFILE, ...parsed };
    }
  } catch (e) {
    console.warn('Gagal membaca profil sekolah dari localStorage:', e);
  }
  return DEFAULT_SCHOOL_PROFILE;
}

/**
 * Fallback konstan untuk kompatibilitas mundur
 */
export const SCHOOL_PROFILE: SchoolProfile = getLocalSchoolProfile();
