import JSZip from 'jszip';
import { EntriJurnal, Siswa, Kelas, Kebiasaan } from '../types/database';
import { supabase, isSupabaseConfigured } from './supabase';
import { JournalService } from './journalService';
import { uploadBuktiFotoUnified } from './storageService';
import { APP_VERSION } from './version';

export interface BackupProgress {
  current: number;
  total: number;
  message: string;
}

export interface BackupManifestItem {
  entryId: string;
  siswaId: string;
  namaSiswa: string;
  nisn: string;
  kelasId: string;
  namaKelas: string;
  kebiasaanId: number;
  namaKebiasaan: string;
  tanggal: string;
  urutanKe: number;
  originalFotoUrl: string;
  zipPath: string;
  catatan?: string | null;
  statusWaktu?: string | null;
  waktuSubmit?: string | null;
}

export interface BackupManifest {
  version: string;
  app: string;
  createdAt: string;
  totalPhotos: number;
  items: BackupManifestItem[];
}

/**
 * Sanitasi string untuk nama berkas atau folder aman di semua OS
 */
function sanitizeFileName(str: string): string {
  return str.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Ekstrak storage path dari Supabase Public URL
 * Contoh: "https://...supabase.co/storage/v1/object/public/bukti_foto/user123/1_12345.jpg"
 * -> "user123/1_12345.jpg"
 */
export function extractStoragePath(url: string): string | null {
  if (!url) return null;
  const marker = '/bukti_foto/';
  const index = url.indexOf(marker);
  if (index !== -1) {
    return decodeURIComponent(url.substring(index + marker.length));
  }
  return null;
}

/**
 * Mengunduh seluruh atau sebagian foto murid dan mengemasnya ke dalam file .ZIP
 */
export async function createPhotoBackupZip({
  entries,
  siswaList,
  kelasList,
  kebiasaanList,
  onProgress
}: {
  entries: EntriJurnal[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  kebiasaanList: Kebiasaan[];
  onProgress?: (progress: BackupProgress) => void;
}): Promise<{ blob: Blob; fileName: string; totalPhotos: number }> {
  const zip = new JSZip();

  // Filter entri yang memiliki foto valid (bukan [TERARSIP] atau placeholder)
  const validEntries = entries.filter((e) => {
    return (
      e.foto_url &&
      !e.foto_url.includes('[TERARSIP]') &&
      !e.foto_url.includes('placeholder') &&
      e.foto_url.startsWith('http')
    );
  });

  const total = validEntries.length;
  if (total === 0) {
    throw new Error('Tidak ada foto aktif yang ditemukan untuk dibackup.');
  }

  // Peta referensi untuk lookup cepat
  const siswaMap = new Map<string, Siswa>(siswaList.map((s) => [s.id, s]));
  const kelasMap = new Map<string, Kelas>(kelasList.map((k) => [k.id, k]));
  const habitMap = new Map<number, Kebiasaan>(kebiasaanList.map((h) => [h.id, h]));

  const manifestItems: BackupManifestItem[] = [];

  for (let i = 0; i < total; i++) {
    const entry = validEntries[i];
    const siswa = siswaMap.get(entry.siswa_id);
    const namaSiswa = sanitizeFileName(siswa?.nama || 'Siswa_Tanpa_Nama');
    const nisn = siswa?.nisn || 'NoNISN';
    const kelas = siswa?.kelas_id ? kelasMap.get(siswa.kelas_id) : undefined;
    const namaKelas = sanitizeFileName(kelas?.nama_kelas || 'Tanpa_Kelas');
    const habit = habitMap.get(entry.kebiasaan_id);
    const namaHabit = sanitizeFileName(habit?.nama || `Kebiasaan_${entry.kebiasaan_id}`);

    const fileExt = entry.foto_url.includes('.webp') ? 'webp' : 'jpg';
    const relativeZipPath = `${namaKelas}/${namaSiswa}/${entry.tanggal}_K${entry.kebiasaan_id}_${namaHabit}_#${entry.urutan_ke}.${fileExt}`;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        message: `Mengunduh foto ${i + 1} dari ${total} (${namaSiswa} - ${namaHabit})...`
      });
    }

    try {
      // Ambil file foto via fetch
      const res = await fetch(entry.foto_url);
      if (res.ok) {
        const photoBlob = await res.blob();
        zip.file(relativeZipPath, photoBlob);

        manifestItems.push({
          entryId: entry.id,
          siswaId: entry.siswa_id,
          namaSiswa: siswa?.nama || 'Siswa',
          nisn,
          kelasId: siswa?.kelas_id || '',
          namaKelas: kelas?.nama_kelas || '',
          kebiasaanId: entry.kebiasaan_id,
          namaKebiasaan: habit?.nama || '',
          tanggal: entry.tanggal,
          urutanKe: entry.urutan_ke,
          originalFotoUrl: entry.foto_url,
          zipPath: relativeZipPath,
          catatan: entry.catatan,
          statusWaktu: entry.status_waktu,
          waktuSubmit: entry.waktu_submit
        });
      }
    } catch (err) {
      console.warn(`Gagal mengunduh foto untuk entri ${entry.id}:`, err);
    }
  }

  // Tambahkan file manifest_backup.json ke dalam ZIP
  const manifest: BackupManifest = {
    version: APP_VERSION,
    app: 'Jurnal 7 KAIH',
    createdAt: new Date().toISOString(),
    totalPhotos: manifestItems.length,
    items: manifestItems
  };

  zip.file('manifest_backup.json', JSON.stringify(manifest, null, 2));

  if (onProgress) {
    onProgress({
      current: total,
      total,
      message: 'Mengompresi seluruh berkas ke dalam file ZIP...'
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const fileName = `Backup_Foto_Jurnal_7KAIH_${todayStr}_(${manifestItems.length}_foto).zip`;

  return {
    blob: zipBlob,
    fileName,
    totalPhotos: manifestItems.length
  };
}

/**
 * Memicu unduhan berkas langsung di browser
 */
export function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Hapus / Bersihkan Foto Lama dari Supabase Storage
 * PENTING: Hanya menghapus file fisik di storage untuk mengosongkan 540 MB kuota.
 * Catatan jurnal dan rekaman poin siswa TIDAK DIHAPUS (URL diubah menjadi [TERARSIP]).
 */
export async function cleanStoragePhotos({
  entries,
  dateBefore,
  onProgress
}: {
  entries: EntriJurnal[];
  dateBefore: string;
  onProgress?: (progress: BackupProgress) => void;
}): Promise<{ deletedStorageFiles: number; updatedEntriesCount: number }> {
  const targetEntries = entries.filter((e) => {
    return (
      e.tanggal <= dateBefore &&
      e.foto_url &&
      !e.foto_url.includes('[TERARSIP]') &&
      e.foto_url.includes('bukti_foto')
    );
  });

  const total = targetEntries.length;
  if (total === 0) {
    return { deletedStorageFiles: 0, updatedEntriesCount: 0 };
  }

  const pathsToDelete: string[] = [];
  const entryIdsToUpdate: string[] = [];

  for (const entry of targetEntries) {
    const path = extractStoragePath(entry.foto_url);
    if (path) {
      pathsToDelete.push(path);
      entryIdsToUpdate.push(entry.id);
    }
  }

  let deletedStorageFiles = 0;
  let updatedEntriesCount = 0;

  // 1. Hapus berkas fisik dari Supabase Storage secara batch (tiap 50 file)
  if (isSupabaseConfigured && pathsToDelete.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < pathsToDelete.length; i += batchSize) {
      const chunk = pathsToDelete.slice(i, i + batchSize);
      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, pathsToDelete.length),
          total: pathsToDelete.length,
          message: `Menghapus file fisik dari storage (${Math.min(i + batchSize, pathsToDelete.length)}/${pathsToDelete.length})...`
        });
      }

      try {
        const { data, error } = await supabase.storage.from('bukti_foto').remove(chunk);
        if (!error && data) {
          deletedStorageFiles += data.length;
        }
      } catch (err) {
        console.warn('Gagal menghapus batch file storage:', err);
      }
    }
  }

  // 2. Perbarui tabel entri_jurnal di Supabase agar foto_url menjadi '[TERARSIP]'
  if (isSupabaseConfigured && entryIdsToUpdate.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < entryIdsToUpdate.length; i += batchSize) {
      const chunk = entryIdsToUpdate.slice(i, i + batchSize);
      try {
        const { error } = await supabase
          .from('entri_jurnal')
          .update({ foto_url: '[TERARSIP]' })
          .in('id', chunk);

        if (!error) {
          updatedEntriesCount += chunk.length;
        }
      } catch (err) {
        console.warn('Gagal mengupdate entri_jurnal arsip:', err);
      }
    }

    // Refresh in-memory cache
    JournalService.clearEntriCache();
  }

  return {
    deletedStorageFiles,
    updatedEntriesCount
  };
}

/**
 * Merestore foto-foto dari file .ZIP backup ke server Supabase Storage
 */
export async function restorePhotosFromZip({
  zipFile,
  onProgress
}: {
  zipFile: File;
  onProgress?: (progress: BackupProgress) => void;
}): Promise<{ restoredCount: number; totalCount: number; errors: string[] }> {
  const zip = await JSZip.loadAsync(zipFile);
  const manifestFile = zip.file('manifest_backup.json');

  if (!manifestFile) {
    throw new Error('File ZIP tidak valid: tidak ditemukan manifest_backup.json di dalamnya.');
  }

  const manifestText = await manifestFile.async('text');
  const manifest: BackupManifest = JSON.parse(manifestText);

  const total = manifest.items.length;
  let restoredCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < total; i++) {
    const item = manifest.items[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        message: `Memulihkan foto ${i + 1} dari ${total} (${item.namaSiswa})...`
      });
    }

    try {
      const fileInZip = zip.file(item.zipPath);
      if (!fileInZip) {
        errors.push(`File tidak ditemukan dalam ZIP: ${item.zipPath}`);
        continue;
      }

      const photoBlob = await fileInZip.async('blob');
      const fileExt = item.zipPath.split('.').pop() || 'jpg';
      const storagePath = `${item.siswaId}/${item.kebiasaanId}_${Date.now()}.${fileExt}`;

      // Upload ulang ke storage provider aktif
      const newUrl = await uploadBuktiFotoUnified(photoBlob, storagePath);
      if (newUrl) {
        // Update database entri_jurnal
        if (isSupabaseConfigured) {
          await supabase
            .from('entri_jurnal')
            .update({ foto_url: newUrl })
            .eq('id', item.entryId);
        }
        restoredCount++;
      } else {
        errors.push(`Gagal mengupload ulang: ${item.namaSiswa} - ${item.tanggal}`);
      }
    } catch (err: any) {
      errors.push(`Error restore ${item.namaSiswa}: ${err.message || 'Unknown'}`);
    }
  }

  JournalService.clearEntriCache();

  return {
    restoredCount,
    totalCount: total,
    errors
  };
}
