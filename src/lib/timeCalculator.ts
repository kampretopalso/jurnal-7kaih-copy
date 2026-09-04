import { Kebiasaan, StatusWaktu } from '../types/database';
import { BanyuwangiPrayerService, DynamicPrayerSchedule, BanyuwangiPrayerTimes } from './banyuwangiPrayerService';

export type PrayerSchedule = DynamicPrayerSchedule;
export { BanyuwangiPrayerService };

/**
 * Cari jadwal sholat dinamis Banyuwangi berdasarkan nama sub_tipe dan waktu
 */
export function getPrayerSchedule(
  subTipe?: string, 
  checkTime: Date = new Date()
): DynamicPrayerSchedule | undefined {
  if (!subTipe) return undefined;
  const clean = subTipe.trim().toLowerCase();
  const prayerTimes = BanyuwangiPrayerService.calculatePrayerTimes(checkTime);
  return prayerTimes.schedules.find((p) => p.name.toLowerCase() === clean || p.aliases.includes(clean));
}

/**
 * Hitung status waktu khusus sholat 5 waktu berdasarkan waktu ambil foto dan hisab Banyuwangi
 */
export function calculateStatusWaktuForPrayer(
  subTipe: string,
  checkTime: Date = new Date()
): StatusWaktu {
  const schedule = getPrayerSchedule(subTipe, checkTime);
  if (!schedule) return 'tepat_waktu';

  const hours = checkTime.getHours();
  const minutes = checkTime.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  const [startH, startM] = schedule.start.split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;

  const [endH, endM] = schedule.end.split(':').map(Number);
  const endTotalMinutes = endH * 60 + endM;

  const maxAllowedMinutes = endTotalMinutes + schedule.toleranceMinutes;

  if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
    return 'tepat_waktu';
  } else if (currentTotalMinutes > endTotalMinutes && currentTotalMinutes <= maxAllowedMinutes) {
    return 'toleransi';
  } else {
    return 'terlambat';
  }
}

/**
 * Mendapatkan sholat yang saat ini sedang aktif di Banyuwangi berdasarkan waktu sekarang
 */
export function getCurrentActivePrayer(checkTime: Date = new Date()): DynamicPrayerSchedule | undefined {
  const prayerTimes = BanyuwangiPrayerService.calculatePrayerTimes(checkTime);
  const hours = checkTime.getHours();
  const minutes = checkTime.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  for (const schedule of prayerTimes.schedules) {
    const [startH, startM] = schedule.start.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;

    const [endH, endM] = schedule.end.split(':').map(Number);
    const endTotalMinutes = endH * 60 + endM;

    if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
      return schedule;
    }
  }

  return undefined;
}

/**
 * Menghitung status_waktu secara dinamis berdasarkan konfigurasi jam di tabel kebiasaan atau waktu sholat
 * @param kebiasaan Objek definisi kebiasaan
 * @param checkTime Waktu pengambilan foto atau waktu submit (Date)
 * @param subTipe Nama sub tipe (misal: 'Subuh', 'Dzuhur', dll.)
 */
export function calculateStatusWaktu(
  kebiasaan: Kebiasaan, 
  checkTime: Date = new Date(),
  subTipe?: string
): StatusWaktu {
  // Jika kebiasaan adalah Beribadah (#2) dan memiliki sub_tipe sholat
  if ((kebiasaan.id === 2 || kebiasaan.nama.toLowerCase().includes('ibadah')) && subTipe) {
    return calculateStatusWaktuForPrayer(subTipe, checkTime);
  }

  // Jika kebiasaan tidak memiliki batasan jam mulai & selesai, statusnya 'tidak_berlaku'
  if (!kebiasaan.jam_mulai || !kebiasaan.jam_selesai) {
    return 'tidak_berlaku';
  }

  const hours = checkTime.getHours();
  const minutes = checkTime.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  const [startH, startM] = kebiasaan.jam_mulai.split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;

  const [endH, endM] = kebiasaan.jam_selesai.split(':').map(Number);
  const endTotalMinutes = endH * 60 + endM;

  const toleranceMinutes = kebiasaan.toleransi_menit || 0;
  const maxAllowedMinutes = endTotalMinutes + toleranceMinutes;

  // Kasus Bangun Pagi (contoh: 04:00 - 05:00)
  if (kebiasaan.nama.toLowerCase().includes('bangun')) {
    if (currentTotalMinutes <= endTotalMinutes) {
      return 'tepat_waktu';
    } else if (currentTotalMinutes <= maxAllowedMinutes) {
      return toleranceMinutes > 0 ? 'toleransi' : 'terlambat';
    } else {
      return 'terlambat';
    }
  }

  // Kasus Tidur Cepat (contoh: 20:00 - 22:00, toleransi 15 menit s.d 22:15)
  if (kebiasaan.nama.toLowerCase().includes('tidur')) {
    // Jika tidur sebelum batas akhir (22:00)
    if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
      return 'tepat_waktu';
    }
    // Jika sebelum jam mulai (misal tidur jam 19:30, tetap dianggap sangat baik)
    if (currentTotalMinutes < startTotalMinutes && currentTotalMinutes >= 18 * 60) {
      return 'tepat_waktu';
    }
    // Jika masuk rentang toleransi (22:01 - 22:15)
    if (currentTotalMinutes > endTotalMinutes && currentTotalMinutes <= maxAllowedMinutes) {
      return 'toleransi';
    }
    // Jika lewat 22:15 atau lewat tengah malam
    return 'terlambat';
  }

  // Aturan umum untuk kebiasaan lain yang memiliki jam
  if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
    return 'tepat_waktu';
  } else if (currentTotalMinutes > endTotalMinutes && currentTotalMinutes <= maxAllowedMinutes) {
    return 'toleransi';
  } else {
    return 'terlambat';
  }
}

/**
 * Helper untuk format teks status waktu yang ramah pengguna
 */
export function getStatusWaktuLabel(status: StatusWaktu): {
  label: string;
  badgeColor: string;
  textColor: string;
} {
  switch (status) {
    case 'tepat_waktu':
      return {
        label: 'Tepat Waktu',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textColor: 'text-emerald-700'
      };
    case 'toleransi':
      return {
        label: 'Toleransi (+15m)',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        textColor: 'text-amber-700'
      };
    case 'terlambat':
      return {
        label: 'Terlambat / Kemalaman',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        textColor: 'text-rose-700'
      };
    case 'tidak_berlaku':
    default:
      return {
        label: 'Selesai',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        textColor: 'text-slate-600'
      };
  }
}

/**
 * Validasi Batas Waktu Operasional Pengisian Jurnal Harian (Pukul 01:00 - 24:00 WIB)
 */
export function isDailyEntryWindowOpen(checkTime: Date = new Date()): {
  isOpen: boolean;
  message?: string;
} {
  const hours = checkTime.getHours();
  // 00:00 - 00:59 WIB adalah masa pergantian hari / sinkronisasi sistem
  if (hours < 1) {
    return {
      isOpen: false,
      message: 'Pengisian jurnal harian dibuka mulai pukul 01:00 WIB s.d 24:00 WIB (Pukul 00:00 - 01:00 WIB adalah jeda pergantian tanggal harian).'
    };
  }
  return {
    isOpen: true
  };
}

/**
 * Mengambil tanggal lokal hari ini dalam format YYYY-MM-DD sesuai zona waktu pengguna/WIB
 * Menghindari bug UTC toISOString() yang bergeser ke hari kemarin saat subuh (00:00 - 06:59 WIB)
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


