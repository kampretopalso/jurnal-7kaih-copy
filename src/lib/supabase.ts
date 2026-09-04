import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Cek apakah kredensial Supabase sudah diisi dengan benar (bukan placeholder)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

// Inisialisasi client Supabase
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

/**
 * Upload file bukti foto ke Supabase Storage bucket 'bukti_foto'
 */
export async function uploadBuktiFoto(file: Blob, path: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    // Mode demo / fallback: konversi ke base64 / blob URL lokal
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const { error } = await supabase.storage
      .from('bukti_foto')
      .upload(path, file, {
        cacheControl: '31536000', // Cache 1 tahun di browser dan CDN (menghemat egress storage drastis)
        upsert: true,
      });

    if (error) {
      console.error('Gagal upload ke Supabase Storage:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('bukti_foto').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Error saat upload foto:', err);
    return null;
  }
}
