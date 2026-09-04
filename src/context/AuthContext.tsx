import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, Siswa, StafSekolah } from '../types/database';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { MockDatabase } from '../lib/mockStore';
import { JournalService } from '../lib/journalService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginSiswa: (nisn: string, passwordInput: string) => Promise<{ success: boolean; message?: string }>;
  loginStaf: (nipOrNik: string, passwordInput: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  quickLoginAs: (type: 'siswa' | 'wali_kelas' | 'kepala_sekolah' | 'waka_kurikulum' | 'kesiswaan' | 'superadmin', customId?: string) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'jurnal_7k_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Inisialisasi sinkronisasi cloud data Supabase ke local cache
        await JournalService.initCloudSync();

        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
        }
      } catch (e) {
        console.error('Error reading auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveUserSession = (authUser: AuthUser | null) => {
    setUser(authUser);
    if (authUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  /**
   * Helper untuk menghitung password default DDMMYYYY dari tanggal_lahir (YYYY-MM-DD)
   */
  const getDefaultDobPassword = (dobString: string): string => {
    try {
      const parts = dobString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${day}${month}${year}`;
      }
    } catch {
      // fallback
    }
    const dob = new Date(dobString);
    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const year = dob.getFullYear();
    return `${day}${month}${year}`;
  };

  /**
   * Login Siswa dengan NISN
   * Password default: DDMMYYYY dari tanggal_lahir
   */
  const loginSiswa = async (nisn: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const allSiswa = await JournalService.getSiswa();
      const student = allSiswa.find((s) => s.nisn === nisn.trim());

      if (!student) {
        return { 
          success: false, 
          message: 'Username tidak ditemukan. Silakan periksa kembali NISN yang Anda masukkan.' 
        };
      }

      const defaultPassword = getDefaultDobPassword(student.tanggal_lahir);
      const isPasswordMatch = passwordInput === defaultPassword || (student as any).password === passwordInput;

      if (!isPasswordMatch) {
        return {
          success: false,
          message: 'Password salah. Silakan tanyakan kepada bapak/ibu wali kelas atau guru Anda jika Anda lupa password.'
        };
      }

      saveUserSession({ type: 'siswa', data: student });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Terjadi kesalahan saat login' };
    }
  };

  /**
   * Login Staf Sekolah & Superadmin
   * Password default: Tanggal Lahir (DDMMYYYY) dari staf.tanggal_lahir
   */
  const loginStaf = async (nipOrNik: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanInput = nipOrNik.trim().toLowerCase();

      // Cek apakah Superadmin Aji Bagus Khoiri
      if (cleanInput === 'ajibaguskhoiri') {
        const allStaf = await JournalService.getStaf();
        const superAdmin = allStaf.find(st => st.role === 'superadmin' || st.nip_atau_nik === 'ajibaguskhoiri') || {
          id: 'staf-superadmin-aji',
          nama: 'Aji Bagus Khoiri (Superadmin)',
          role: 'superadmin' as const,
          status_asn: true,
          nip_atau_nik: 'ajibaguskhoiri',
          tanggal_lahir: '1994-08-06',
          kelas_id: null,
          scope: 'sekolah' as const,
          sudah_ganti_password: true
        };

        const defaultPass = getDefaultDobPassword(superAdmin.tanggal_lahir); // '06081994'
        const isPasswordMatch = passwordInput === '060894' || passwordInput === defaultPass || (superAdmin as any).password === passwordInput;

        if (isPasswordMatch) {
          saveUserSession({ type: 'staf', data: superAdmin });
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Password salah. Silakan periksa kembali password akun Superadmin Anda.' 
          };
        }
      }

      // Login staf reguler (Wali Kelas, Kepala Sekolah, Kurikulum, Kesiswaan)
      const allStaf = await JournalService.getStaf();
      const staf = allStaf.find((st) => st.nip_atau_nik.toLowerCase() === cleanInput);

      if (!staf) {
        return { 
          success: false, 
          message: 'Username tidak ditemukan. Silakan periksa kembali NIP, NIK, atau Username yang Anda masukkan.' 
        };
      }

      const defaultPassword = getDefaultDobPassword(staf.tanggal_lahir);
      const isPasswordMatch = passwordInput === defaultPassword || (staf as any).password === passwordInput;

      if (!isPasswordMatch) {
        return {
          success: false,
          message: 'Password salah. Silakan menghubungi Superadmin sekolah untuk memeriksa atau mereset password akun Anda.'
        };
      }

      saveUserSession({ type: 'staf', data: staf });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Terjadi kesalahan saat login' };
    }
  };

  const logout = () => {
    JournalService.clearEntriCache();
    JournalService.clearSiswaCache();
    saveUserSession(null);
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    if (user.type === 'siswa') {
      MockDatabase.updatePassword('siswa', user.data.id);
      if (isSupabaseConfigured) {
        try {
          await supabase.from('siswa').update({ sudah_ganti_password: true }).eq('id', user.data.id);
        } catch (e) {
          console.warn(e);
        }
      }
      setUser({
        ...user,
        data: { ...user.data, sudah_ganti_password: true }
      });
      return true;
    } else {
      MockDatabase.updatePassword('staf', user.data.id);
      if (isSupabaseConfigured) {
        try {
          await supabase.from('staf_sekolah').update({ sudah_ganti_password: true }).eq('id', user.data.id);
        } catch (e) {
          console.warn(e);
        }
      }
      setUser({
        ...user,
        data: { ...user.data, sudah_ganti_password: true }
      });
      return true;
    }
  };

  const quickLoginAs = (
    type: 'siswa' | 'wali_kelas' | 'kepala_sekolah' | 'waka_kurikulum' | 'kesiswaan' | 'superadmin',
    customId?: string
  ) => {
    if (type === 'siswa') {
      const allSiswa = MockDatabase.getSiswa();
      const s = customId ? allSiswa.find((item) => item.id === customId) : allSiswa[0];
      if (s) saveUserSession({ type: 'siswa', data: s });
    } else {
      const allStaf = MockDatabase.getStaf();
      const st = customId
        ? allStaf.find((item) => item.id === customId)
        : allStaf.find((item) => item.role === type) || allStaf[0];
      if (st) saveUserSession({ type: 'staf', data: st });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginSiswa,
        loginStaf,
        logout,
        updatePassword,
        quickLoginAs,
        isDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
