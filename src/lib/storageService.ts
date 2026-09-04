import { uploadBuktiFoto } from './supabase';
import { 
  getLocalStorageConfig, 
  getActiveStorageConfig, 
  fetchRemoteStorageConfig, 
  StorageConfig 
} from './storageConfig';

/**
 * Template Kode Google Apps Script siap pakai
 * Superadmin cukup menyalin kode ini ke script.google.com dan deploy sebagai Web App
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * BACKEND GOOGLE DRIVE UNTUK JURNAL 7 KAIH
 * Simpan foto jurnal siswa langsung ke Google Drive sekolah / pribadi
 * Menghemat 100% kuota Egress & Storage Supabase (Gratis 15 GB / Unlimited di Akun Belajar.id)
 */

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var base64Data = contents.base64;
    var fileName = contents.fileName || ("jurnal_" + new Date().getTime() + ".webp");
    var mimeType = contents.contentType || "image/webp";

    // Cari atau buat folder penyimpanan di Google Drive
    var folderName = "Jurnal_7KAIH_Foto";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
    }

    // Bersihkan prefix data URL jika ada
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }

    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = targetFolder.createFile(blob);

    // Atur izin agar foto dapat dilihat secara publik oleh guru/siswa
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    // CDN Google direct view (ringan & cepat dimuat di HP maupun web)
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: fileId,
      url: directUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Jurnal 7 KAIH Siap Menerima Foto"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Konversi Blob ke Base64 String
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uji coba koneksi Google Apps Script Web App
 */
export async function testGoogleAppsScriptConnection(webAppUrl: string): Promise<{
  success: boolean;
  message: string;
  suggestion?: string;
}> {
  const cleanUrl = webAppUrl.trim();

  if (!cleanUrl || !cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Format URL Web App Google Apps Script tidak valid. Harus diawali dengan https://script.google.com/macros/s/',
      suggestion: 'Pastikan menyalin URL dari tombol Deploy > New deployment (atau Manage deployments).'
    };
  }

  if (cleanUrl.includes('/edit') || cleanUrl.includes('/dev')) {
    return {
      success: false,
      message: 'URL yang dimasukkan adalah URL editor atau developer mode (' + (cleanUrl.includes('/edit') ? '/edit' : '/dev') + ').',
      suggestion: 'Salin Web App URL yang berakhiran "/exec" dari dialog Deploy.'
    };
  }

  try {
    // Buat pixel 1x1 test image
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const testBase64 = canvas.toDataURL('image/jpeg', 0.5);

    const payload = JSON.stringify({
      base64: testBase64,
      fileName: 'test_koneksi_' + Date.now() + '.jpg',
      contentType: 'image/jpeg'
    });

    // PENTING: Gunakan 'Content-Type': 'text/plain;charset=utf-8' dan redirect: 'follow'
    // Format text/plain adalah CORS-safelisted request sehingga browser TIDAK mengirimkan OPTIONS preflight
    // yang tidak didukung oleh Google Apps Script.
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: payload
    });

    const rawText = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch (_) {
      if (rawText.includes('accounts.google.com') || rawText.includes('Sign in') || rawText.includes('ServiceLogin')) {
        return {
          success: false,
          message: 'Google Apps Script dialihkan ke halaman login akun (Akses Privat).',
          suggestion: 'Di script.google.com > Deploy > Manage deployments > Edit > Ubah "Who has access" dari "Only myself" / "Organisasi" menjadi "Anyone" (Siapa saja). Lalu klik Deploy.'
        };
      }
      return {
        success: false,
        message: 'Respons dari Google Apps Script bukan format JSON: ' + rawText.slice(0, 100),
        suggestion: 'Pastikan Anda telah menyalin dan menempel seluruh kode skrip terbaru di script.google.com.'
      };
    }

    if (json && json.status === 'success' && json.url) {
      return {
        success: true,
        message: 'Koneksi ke Google Drive Berhasil! File uji coba tersimpan dengan URL: ' + json.url
      };
    } else {
      return {
        success: false,
        message: json?.message || 'Google Apps Script merespons tetapi gagal menyimpan file.',
        suggestion: 'Periksa log eksekusi di script.google.com > Executions untuk melihat detail kendala.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menghubungi Google Apps Script: ' + (err.message || 'Failed to fetch'),
      suggestion: 'Penyebab umum "Failed to fetch": (1) Pilihan "Who has access" saat Deploy belum diatur ke "Anyone" (Siapa saja), atau (2) Jika menggunakan akun Belajar.id/organisasi, kebijakan admin membatasi deployment publik — coba buat skrip menggunakan akun Gmail pribadi (@gmail.com) yang gratis 15 GB dan bebas batasan domain.'
    };
  }
}

/**
 * Upload foto ke Google Drive melalui Google Apps Script Web App
 */
async function uploadToGoogleDrive(
  blob: Blob,
  fileName: string,
  webAppUrl: string
): Promise<string | null> {
  try {
    const base64 = await blobToBase64(blob);
    const payload = JSON.stringify({
      base64,
      fileName,
      contentType: blob.type || 'image/webp'
    });

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: payload
    });

    const rawText = await response.text();
    const result = JSON.parse(rawText);
    if (result && result.status === 'success' && result.url) {
      return result.url;
    }
    console.error('Google Apps Script upload error:', result?.message);
    return null;
  } catch (err) {
    console.error('Error saat upload ke Google Apps Script:', err);
    return null;
  }
}

/**
 * Upload foto ke Cloudinary (opsional)
 */
async function uploadToCloudinary(
  blob: Blob,
  cloudName: string,
  uploadPreset: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.secure_url) {
      return result.secure_url;
    }
    console.error('Cloudinary upload error:', result);
    return null;
  } catch (err) {
    console.error('Error saat upload ke Cloudinary:', err);
    return null;
  }
}

/**
 * LAYANAN TERPADU UPLOAD FOTO BUKTI JURNAL
 * Mendukung Supabase Storage, Google Drive (Apps Script), atau Cloudinary.
 * Dilengkapi failover otomatis ke Supabase jika provider eksternal mengalami kendala.
 */
export async function uploadBuktiFotoUnified(
  blob: Blob,
  path: string,
  customConfig?: StorageConfig
): Promise<string | null> {
  let config = customConfig || getActiveStorageConfig();

  // Jika provider masih belum gdrive atau url gdrive masih kosong di browser lokal,
  // coba fetch remote config Supabase untuk memastikan sinkronisasi dari Admin
  if (config.provider !== 'gdrive' || !config.gdriveWebAppUrl) {
    try {
      const remoteConfig = await fetchRemoteStorageConfig();
      if (remoteConfig && remoteConfig.provider === 'gdrive' && remoteConfig.gdriveWebAppUrl) {
        config = remoteConfig;
      }
    } catch (_) {}
  }

  // 1. Opsi Google Drive (Prioritas untuk hemat kuota 100%)
  if (config.provider === 'gdrive' && config.gdriveWebAppUrl) {
    const fileName = path.split('/').pop() || `foto_${Date.now()}.webp`;
    const gdriveUrl = await uploadToGoogleDrive(blob, fileName, config.gdriveWebAppUrl);
    if (gdriveUrl) {
      return gdriveUrl;
    }
    console.warn('Upload Google Drive gagal, beralih otomatis ke Supabase Storage sebagai cadangan');
  }

  // 2. Opsi Cloudinary
  if (config.provider === 'cloudinary' && config.cloudinaryCloudName && config.cloudinaryUploadPreset) {
    const cloudUrl = await uploadToCloudinary(blob, config.cloudinaryCloudName, config.cloudinaryUploadPreset);
    if (cloudUrl) {
      return cloudUrl;
    }
    console.warn('Upload Cloudinary gagal, beralih otomatis ke Supabase Storage sebagai cadangan');
  }

  // 3. Opsi Default / Fallback: Supabase Storage
  return await uploadBuktiFoto(blob, path);
}

