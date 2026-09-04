/**
 * Service Penghitung Jadwal Sholat Dinamis Presisi Khusus Wilayah Banyuwangi, Jawa Timur
 * Koordinat SMPN 2 Glagah: Latitude -8.2192° S, Longitude 114.3691° E, Ketinggian ~100m DPL, GMT+7 (WIB)
 * Menggunakan Standar Hisab Kementerian Agama Republik Indonesia (Kemenag RI):
 * - Subuh: -20° sudut matahari di bawah ufuk
 * - Isya': -18° sudut matahari di bawah ufuk
 * - Dzuhur: Waktu zawal + 2 menit ihtiyat
 * - Ashar: Bayangan 1x panjang benda (Madzhab Syafi'i)
 * - Maghrib: Terbenam piringan matahari + 2 menit ihtiyat
 * - Ihtiyat Keamanan: +2 menit untuk setiap awal waktu sholat
 */

export interface BanyuwangiPrayerTimes {
  tanggal: string; // YYYY-MM-DD
  isHariMinggu: boolean;
  subuh: string;    // '04:18'
  terbit: string;   // '05:35'
  dhuhur: string;   // '11:35'
  ashar: string;    // '14:55'
  maghrib: string;  // '17:33'
  isya: string;     // '18:44'
  schedules: DynamicPrayerSchedule[];
}

export interface DynamicPrayerSchedule {
  name: string;
  aliases: string[];
  start: string; // '04:18'
  end: string;   // '05:35'
  toleranceMinutes: number;
  displayWindow: string; // '04.18 - 05.35 WIB'
  isWajibDiRumah: boolean; // False untuk Dhuhur di hari Senin-Sabtu
  note?: string;
}

const BANYUWANGI_LAT = -8.2192;
const BANYUWANGI_LNG = 114.3691;
const TIMEZONE_OFFSET = 7; // WIB (UTC+7)
const ELEVATION_METERS = 100;

// Helper matematika astronomis
const degToRad = (deg: number) => (deg * Math.PI) / 180.0;
const radToDeg = (rad: number) => (rad * 180.0) / Math.PI;

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatHoursToTime(hoursDecimal: number): string {
  let normalized = hoursDecimal % 24;
  if (normalized < 0) normalized += 24;

  const h = Math.floor(normalized);
  const m = Math.floor((normalized - h) * 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class BanyuwangiPrayerService {
  /**
   * Menghitung jadwal sholat dinamis untuk tanggal tertentu di Banyuwangi
   */
  static calculatePrayerTimes(date: Date = new Date()): BanyuwangiPrayerTimes {
    const dayOfYear = getDayOfYear(date);
    const dayOfWeek = date.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const isHariMinggu = dayOfWeek === 0;

    // 1. Deklinasi Matahari (delta) & Equation of Time (EqT)
    const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);
    
    const eqTimeMinutes = 229.18 * (
      0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma)
    );

    const declinationRad = 
      0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma) -
      0.002697 * Math.cos(3 * gamma) +
      0.001480 * Math.sin(3 * gamma);

    const latRad = degToRad(BANYUWANGI_LAT);

    // 2. Solar Noon (Zawal / Tengah Hari) di Banyuwangi
    const solarNoonHour = 12 + (TIMEZONE_OFFSET * 15 - BANYUWANGI_LNG) / 15 - eqTimeMinutes / 60;
    
    // Dzuhur: Solar Noon + 2 menit ihtiyat
    const dhuhurHour = solarNoonHour + (2 / 60);

    // 3. Subuh (Sudut -20° Kemenag RI)
    const subuhAngleRad = degToRad(-20.0);
    const cosH_subuh = (Math.sin(subuhAngleRad) - Math.sin(latRad) * Math.sin(declinationRad)) / (Math.cos(latRad) * Math.cos(declinationRad));
    const h_subuh = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosH_subuh)))) / 15;
    const subuhHour = solarNoonHour - h_subuh + (2 / 60); // + 2m ihtiyat

    // 4. Terbit Matahari (Syuruq, -0.833° + dip elevasi)
    const dip = 0.0347 * Math.sqrt(ELEVATION_METERS);
    const sunriseAngleRad = degToRad(-0.833 - dip);
    const cosH_sunrise = (Math.sin(sunriseAngleRad) - Math.sin(latRad) * Math.sin(declinationRad)) / (Math.cos(latRad) * Math.cos(declinationRad));
    const h_sunrise = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosH_sunrise)))) / 15;
    const sunriseHour = solarNoonHour - h_sunrise - (2 / 60);

    // 5. Ashar (Madzhab Syafi'i: Bayangan = 1 + tan|lat - decl|, sudut di atas ufuk)
    const asharAngleRad = Math.atan(1.0 / (1.0 + Math.tan(Math.abs(latRad - declinationRad))));
    const cosH_ashar = (Math.sin(asharAngleRad) - Math.sin(latRad) * Math.sin(declinationRad)) / (Math.cos(latRad) * Math.cos(declinationRad));
    const h_ashar = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosH_ashar)))) / 15;
    const asharHour = solarNoonHour + h_ashar + (2 / 60); // + 2m ihtiyat

    // 6. Maghrib (Terbenam, -0.833° + dip)
    const maghribHour = solarNoonHour + h_sunrise + (2 / 60); // + 2m ihtiyat

    // 7. Isya' (Sudut -18° Kemenag RI)
    const isyaAngleRad = degToRad(-18.0);
    const cosH_isya = (Math.sin(isyaAngleRad) - Math.sin(latRad) * Math.sin(declinationRad)) / (Math.cos(latRad) * Math.cos(declinationRad));
    const h_isya = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosH_isya)))) / 15;
    const isyaHour = solarNoonHour + h_isya + (2 / 60); // + 2m ihtiyat

    // Format jam String
    const subuhStr = formatHoursToTime(subuhHour);
    const terbitStr = formatHoursToTime(sunriseHour);
    const dhuhurStr = formatHoursToTime(dhuhurHour);
    const asharStr = formatHoursToTime(asharHour);
    const maghribStr = formatHoursToTime(maghribHour);
    const isyaStr = formatHoursToTime(isyaHour);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const tanggalStr = `${year}-${month}-${day}`;

    // Susun daftar jadwal sholat dinamis
    const schedules: DynamicPrayerSchedule[] = [
      {
        name: 'Subuh',
        aliases: ['subuh', 'shubuh', 'fajar'],
        start: subuhStr,
        end: terbitStr,
        toleranceMinutes: 15,
        displayWindow: `${subuhStr.replace(':', '.')} - ${terbitStr.replace(':', '.')} WIB`,
        isWajibDiRumah: true,
        note: 'Waktu Subuh s.d terbit fajar'
      },
      {
        name: 'Dhuhur',
        aliases: ['dhuhur', 'dzuhur', 'zuhur', 'duhur'],
        start: dhuhurStr,
        end: asharStr,
        toleranceMinutes: 15,
        displayWindow: `${dhuhurStr.replace(':', '.')} - ${asharStr.replace(':', '.')} WIB`,
        isWajibDiRumah: isHariMinggu,
        note: isHariMinggu 
          ? 'Dinilai di rumah khusus hari Minggu' 
          : 'Senin-Sabtu sholat berjamaah di sekolah'
      },
      {
        name: 'Ashar',
        aliases: ['ashar', 'asar', 'ashr'],
        start: asharStr,
        end: maghribStr,
        toleranceMinutes: 15,
        displayWindow: `${asharStr.replace(':', '.')} - ${maghribStr.replace(':', '.')} WIB`,
        isWajibDiRumah: true,
        note: 'Waktu Ashar s.d menjelang Maghrib'
      },
      {
        name: 'Maghrib',
        aliases: ['maghrib', 'magrib'],
        start: maghribStr,
        end: isyaStr,
        toleranceMinutes: 15,
        displayWindow: `${maghribStr.replace(':', '.')} - ${isyaStr.replace(':', '.')} WIB`,
        isWajibDiRumah: true,
        note: 'Waktu Maghrib s.d masuk Isya\''
      },
      {
        name: "Isya'",
        aliases: ['isya', "isya'", 'isya`'],
        start: isyaStr,
        end: '23:59',
        toleranceMinutes: 0,
        displayWindow: `${isyaStr.replace(':', '.')} - 23.59 WIB`,
        isWajibDiRumah: true,
        note: 'Waktu Isya\' s.d sebelum istirahat malam'
      }
    ];

    return {
      tanggal: tanggalStr,
      isHariMinggu,
      subuh: subuhStr,
      terbit: terbitStr,
      dhuhur: dhuhurStr,
      ashar: asharStr,
      maghrib: maghribStr,
      isya: isyaStr,
      schedules
    };
  }

  /**
   * Mendapatkan daftar nama sholat yang wajib dicatat di rumah untuk hari ini
   * - Hari Minggu: 5 Sholat (Subuh, Dhuhur, Ashar, Maghrib, Isya')
   * - Hari Senin s.d. Sabtu: 4 Sholat (Subuh, Ashar, Maghrib, Isya')
   */
  static getRequiredPrayersForDate(date: Date = new Date()): string[] {
    const isSunday = date.getDay() === 0;
    if (isSunday) {
      return ['Subuh', 'Dhuhur', 'Ashar', 'Maghrib', "Isya'"];
    }
    return ['Subuh', 'Ashar', 'Maghrib', "Isya'"];
  }

  /**
   * Mendapatkan target jumlah input sholat di rumah:
   * - Hari Minggu = 5
   * - Hari Senin-Sabtu = 4
   */
  static getMaxPrayerCountForDate(date: Date = new Date()): number {
    return date.getDay() === 0 ? 5 : 4;
  }
}
