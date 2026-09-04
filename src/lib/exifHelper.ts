import exifr from 'exifr';
import { ExifAnalysisResult } from '../types/database';
import { getTodayDateString } from './timeCalculator';

/**
 * Menganalisis metadata EXIF dari file foto yang diunggah
 * @param file File foto (Blob / File)
 * @param targetDateStr Tanggal entri yang sedang diisi format YYYY-MM-DD
 */
export async function analyzePhotoExif(
  file: File | Blob, 
  targetDateStr: string = getTodayDateString()
): Promise<ExifAnalysisResult> {
  try {
    // Baca metadata EXIF menggunakan exifr (hanya tag penting: DateTimeOriginal, CreateDate, ModifyDate, Model, Make)
    const exifData = await exifr.parse(file, [
      'DateTimeOriginal',
      'CreateDate',
      'ModifyDate',
      'Make',
      'Model',
      'Software',
      'GPSLatitude',
      'GPSLongitude'
    ]);

    if (!exifData) {
      return {
        hasExif: false,
        dateTimeOriginal: null,
        isSuspicious: true,
        reason: 'Metadata EXIF tidak ditemukan (umum pada foto WhatsApp, screenshot, atau editan), perlu ditinjau manual oleh wali kelas.',
        rawTags: {}
      };
    }

    // Ambil tanggal pengambilan foto
    const rawDate = exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate;
    
    if (!rawDate) {
      return {
        hasExif: true,
        dateTimeOriginal: null,
        isSuspicious: true,
        reason: 'Tag tanggal pengambilan (DateTimeOriginal) tidak ditemukan pada metadata EXIF.',
        rawTags: exifData
      };
    }

    const photoDate = new Date(rawDate);
    if (isNaN(photoDate.getTime())) {
      return {
        hasExif: true,
        dateTimeOriginal: null,
        isSuspicious: true,
        reason: 'Format tanggal pada EXIF tidak valid.',
        rawTags: exifData
      };
    }

    // Format tanggal foto ke YYYY-MM-DD sesuai waktu lokal
    const photoDateStr = getTodayDateString(photoDate);
    
    // Periksa apakah tanggal foto sama dengan tanggal entri
    if (photoDateStr !== targetDateStr) {
      const formattedPhotoDate = photoDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formattedTargetDate = new Date(targetDateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      return {
        hasExif: true,
        dateTimeOriginal: photoDate,
        isSuspicious: true,
        reason: `Tanggal foto EXIF (${formattedPhotoDate}) berbeda dengan tanggal jurnal (${formattedTargetDate}). Kemungkinan foto lama.`,
        rawTags: exifData
      };
    }

    // EXIF valid dan sesuai tanggal hari ini
    return {
      hasExif: true,
      dateTimeOriginal: photoDate,
      isSuspicious: false,
      reason: null,
      rawTags: exifData
    };
  } catch (error) {
    console.warn('Gagal membaca EXIF:', error);
    return {
      hasExif: false,
      dateTimeOriginal: null,
      isSuspicious: true,
      reason: 'Gagal mengekstrak metadata EXIF dari berkas gambar.',
      rawTags: {}
    };
  }
}
