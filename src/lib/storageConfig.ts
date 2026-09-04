import { isSupabaseConfigured, supabase } from './supabase';

export type StorageProviderType = 'supabase' | 'gdrive' | 'cloudinary';

export interface StorageConfig {
  provider: StorageProviderType;
  // Google Drive via Google Apps Script Web App (100% Free, bypasses Supabase Egress)
  gdriveWebAppUrl: string;
  // Cloudinary (Optional fallback)
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  // Auto clean / archive policy settings (opsional)
  autoArchiveDays?: number;
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  provider: 'supabase',
  gdriveWebAppUrl: '',
  cloudinaryCloudName: '',
  cloudinaryUploadPreset: '',
  autoArchiveDays: 30
};

export const STORAGE_CONFIG_KEY = 'jurnal_7kaih_storage_config';
export const STORAGE_CONFIG_REMOTE_PATH = 'config/storage_config.json';

/**
 * Membaca konfigurasi storage dari LocalStorage (dengan fallback default)
 */
export function getLocalStorageConfig(): StorageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORAGE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Gagal membaca storage config dari localStorage:', e);
  }
  return DEFAULT_STORAGE_CONFIG;
}

// In-Memory active config cache
let activeStorageConfig: StorageConfig = getLocalStorageConfig();

/**
 * Mengambil konfigurasi storage aktif dari in-memory cache
 */
export function getActiveStorageConfig(): StorageConfig {
  if (!activeStorageConfig.gdriveWebAppUrl) {
    const local = getLocalStorageConfig();
    if (local.gdriveWebAppUrl) {
      activeStorageConfig = local;
    }
  }
  return activeStorageConfig;
}

/**
 * Menyimpan konfigurasi storage ke LocalStorage, in-memory cache, dan Supabase Storage jika terhubung
 */
export async function saveStorageConfig(config: StorageConfig): Promise<boolean> {
  try {
    activeStorageConfig = { ...config };
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));

    // Simpan juga ke Supabase Storage agar tersinkronisasi ke seluruh siswa dan perangkat
    if (isSupabaseConfigured) {
      try {
        const jsonBlob = new Blob([JSON.stringify(config, null, 2)], {
          type: 'application/json'
        });
        await supabase.storage
          .from('bukti_foto')
          .upload(STORAGE_CONFIG_REMOTE_PATH, jsonBlob, {
            contentType: 'application/json',
            upsert: true
          });
      } catch (e) {
        console.warn('Gagal sync storage config ke Supabase storage:', e);
      }
    }

    return true;
  } catch (err) {
    console.error('Gagal menyimpan storage config:', err);
    return false;
  }
}

/**
 * Mengambil konfigurasi storage dari remote Supabase jika tersedia
 */
export async function fetchRemoteStorageConfig(): Promise<StorageConfig> {
  if (!isSupabaseConfigured) {
    return getActiveStorageConfig();
  }

  try {
    const { data, error } = await supabase.storage
      .from('bukti_foto')
      .download(STORAGE_CONFIG_REMOTE_PATH);

    if (data && !error) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && (parsed.provider || parsed.gdriveWebAppUrl)) {
        const merged = { ...DEFAULT_STORAGE_CONFIG, ...parsed };
        activeStorageConfig = merged;
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    // Gunakan konfigurasi lokal jika belum ada di remote
  }

  return getActiveStorageConfig();
}

