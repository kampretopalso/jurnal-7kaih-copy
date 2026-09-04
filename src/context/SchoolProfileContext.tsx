import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SchoolProfile, 
  DEFAULT_SCHOOL_PROFILE, 
  SCHOOL_PROFILE_STORAGE_KEY, 
  getLocalSchoolProfile 
} from '../lib/schoolProfile';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchRemoteStorageConfig } from '../lib/storageConfig';

interface SchoolProfileContextType {
  profile: SchoolProfile;
  updateProfile: (updates: Partial<SchoolProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  isLoading: boolean;
}

const SchoolProfileContext = createContext<SchoolProfileContextType | undefined>(undefined);

export const SchoolProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<SchoolProfile>(getLocalSchoolProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ambil data profil sekolah dan konfigurasi storage dari Supabase saat awal muat
  useEffect(() => {
    const fetchRemoteProfile = async () => {
      try {
        if (isSupabaseConfigured) {
          // Sync storage config (Google Drive Apps Script Web App URL) di latar belakang
          fetchRemoteStorageConfig().catch(() => {});

          let remoteData: any = null;

          // 1. Coba dari tabel profil_sekolah jika ada
          try {
            const { data, error } = await supabase
              .from('profil_sekolah')
              .select('*')
              .eq('id', 'main')
              .maybeSingle();

            if (data && !error) {
              remoteData = data;
            }
          } catch {
            // Abaikan jika tabel belum dibuat di schema cache
          }

          // 2. Jika tabel belum ada, ambil dari Supabase Storage bukti_foto/config/school_profile.json
          if (!remoteData) {
            try {
              const { data: storageFile, error: storageErr } = await supabase
                .storage
                .from('bukti_foto')
                .download('config/school_profile.json');

              if (storageFile && !storageErr) {
                const text = await storageFile.text();
                const parsed = JSON.parse(text);
                if (parsed && parsed.nama) {
                  remoteData = parsed;
                }
              }
            } catch (errStorage) {
              console.warn('Gagal membaca storage profil sekolah:', errStorage);
            }
          }

          if (remoteData) {
            const merged: SchoolProfile = {
              ...DEFAULT_SCHOOL_PROFILE,
              nama: remoteData.nama || DEFAULT_SCHOOL_PROFILE.nama,
              jenjang: remoteData.jenjang || DEFAULT_SCHOOL_PROFILE.jenjang,
              npsn: remoteData.npsn || DEFAULT_SCHOOL_PROFILE.npsn,
              status: remoteData.status || DEFAULT_SCHOOL_PROFILE.status,
              alamat: remoteData.alamat || DEFAULT_SCHOOL_PROFILE.alamat,
              kabupaten: remoteData.kabupaten || DEFAULT_SCHOOL_PROFILE.kabupaten,
              provinsi: remoteData.provinsi || DEFAULT_SCHOOL_PROFILE.provinsi,
              akreditasi: remoteData.akreditasi || DEFAULT_SCHOOL_PROFILE.akreditasi,
              tahunAjaran: remoteData.tahun_ajaran || remoteData.tahunAjaran || DEFAULT_SCHOOL_PROFILE.tahunAjaran,
              telepon: remoteData.telepon || DEFAULT_SCHOOL_PROFILE.telepon,
              email: remoteData.email || DEFAULT_SCHOOL_PROFILE.email,
              website: remoteData.website || DEFAULT_SCHOOL_PROFILE.website,
              motto: remoteData.motto || DEFAULT_SCHOOL_PROFILE.motto,
              logoUrl: remoteData.logo_url || remoteData.logoUrl || DEFAULT_SCHOOL_PROFILE.logoUrl,
              logoKabupatenUrl: remoteData.logo_kabupaten_url || remoteData.logoKabupatenUrl || DEFAULT_SCHOOL_PROFILE.logoKabupatenUrl,
              namaKepalaSekolah: remoteData.nama_kepala_sekolah || remoteData.namaKepalaSekolah || DEFAULT_SCHOOL_PROFILE.namaKepalaSekolah,
              nipKepalaSekolah: remoteData.nip_kepala_sekolah || remoteData.nipKepalaSekolah || DEFAULT_SCHOOL_PROFILE.nipKepalaSekolah
            };
            setProfile(merged);
            localStorage.setItem(SCHOOL_PROFILE_STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (e) {
        console.warn('Gagal sinkron remote profil sekolah:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRemoteProfile();
  }, []);

  const updateProfile = async (updates: Partial<SchoolProfile>) => {
    const updated: SchoolProfile = { ...profile, ...updates };
    setProfile(updated);
    localStorage.setItem(SCHOOL_PROFILE_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      // 1. Simpan ke Supabase Storage bukti_foto/config/school_profile.json (pasti sukses di semua proyek)
      try {
        const jsonBlob = new Blob([JSON.stringify(updated)], { type: 'application/json' });
        await supabase.storage.from('bukti_foto').upload('config/school_profile.json', jsonBlob, {
          upsert: true,
          contentType: 'application/json'
        });
      } catch (errStorage) {
        console.warn('Gagal upload config profil ke storage:', errStorage);
      }

      // 2. Simpan juga ke tabel profil_sekolah jika ada
      try {
        await supabase
          .from('profil_sekolah')
          .upsert({
            id: 'main',
            nama: updated.nama,
            jenjang: updated.jenjang,
            npsn: updated.npsn,
            status: updated.status,
            alamat: updated.alamat,
            kabupaten: updated.kabupaten,
            provinsi: updated.provinsi,
            akreditasi: updated.akreditasi,
            tahun_ajaran: updated.tahunAjaran,
            telepon: updated.telepon,
            email: updated.email,
            website: updated.website,
            motto: updated.motto,
            logo_url: updated.logoUrl,
            logo_kabupaten_url: updated.logoKabupatenUrl,
            nama_kepala_sekolah: updated.namaKepalaSekolah,
            nip_kepala_sekolah: updated.nipKepalaSekolah,
            updated_at: new Date().toISOString()
          });
      } catch (e) {
        // Table profil_sekolah mungkin belum di-run SQL
      }
    }
  };

  const resetProfile = async () => {
    setProfile(DEFAULT_SCHOOL_PROFILE);
    localStorage.setItem(SCHOOL_PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_PROFILE));

    if (isSupabaseConfigured) {
      try {
        const jsonBlob = new Blob([JSON.stringify(DEFAULT_SCHOOL_PROFILE)], { type: 'application/json' });
        await supabase.storage.from('bukti_foto').upload('config/school_profile.json', jsonBlob, {
          upsert: true,
          contentType: 'application/json'
        });
        await supabase.from('profil_sekolah').delete().eq('id', 'main');
      } catch (e) {
        console.error('Gagal reset profil sekolah di Supabase:', e);
      }
    }
  };

  return (
    <SchoolProfileContext.Provider value={{ profile, updateProfile, resetProfile, isLoading }}>
      {children}
    </SchoolProfileContext.Provider>
  );
};

export const useSchoolProfile = (): SchoolProfileContextType => {
  const context = useContext(SchoolProfileContext);
  if (!context) {
    throw new Error('useSchoolProfile must be used within a SchoolProfileProvider');
  }
  return context;
};
