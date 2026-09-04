import { EntriJurnal, Kebiasaan, Kelas, Siswa, StafSekolah } from '../types/database';
import { getTodayDateString } from './timeCalculator';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'semester';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export interface StudentStreakData {
  siswa: Siswa;
  namaKelas: string;
  currentStreak: number;
  longestStreak: number;
  badgeLevel: '3_hari' | '7_hari' | '30_hari' | '1_semester' | 'none';
  badgeLabel: string;
  totalActiveDays: number;
  totalPerfectDays: number;
}

export interface StudentEffortData {
  siswa: Siswa;
  namaKelas: string;
  initialScore: number;  // Rata-rata keterisian hari awal (misal 3/7 = 43%)
  recentScore: number;   // Rata-rata keterisian hari terkini (misal 6/7 = 86%)
  growthDelta: number;   // +43%
  description: string;
}

export interface WaliKelasHonorData {
  staf: StafSekolah;
  kelas: Kelas;
  averageScore: number;
  averageComplianceRate: number;
  daysInTop3: number;
  totalStudents: number;
  growthDelta: number; // Kenaikan kepatuhan kelas
  honorType: 'istiqomah' | 'effort' | 'both' | 'standard';
  honorTitle: string;
  honorDescription: string;
}

export interface ClassPeriodSummary {
  kelasId: string;
  namaKelas: string;
  waliKelasNama: string;
  totalSiswa: number;
  totalEntri: number;
  rataRataKepatuhan: number;
  rataRataSiswaTuntas: number;
  totalFotoFlag: number;
  skorTertibPeriode: number;
  growthTrend: number; // Positif/negatif kenaikan
}

export class PeriodAggregationService {
  /**
   * Menghitung Rentang Tanggal Berdasarkan Tipe Periode & Tanggal Acuan
   */
  static getDateRange(period: PeriodType, referenceDate: string = getTodayDateString()): DateRange {
    const ref = new Date(referenceDate);
    const year = ref.getFullYear();
    const month = ref.getMonth(); // 0-indexed

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (period === 'daily') {
      return {
        startDate: referenceDate,
        endDate: referenceDate,
        label: `Harian (${referenceDate})`
      };
    }

    if (period === 'weekly') {
      // 7 Hari terakhir sampai referenceDate
      const start = new Date(ref);
      start.setDate(ref.getDate() - 6);
      return {
        startDate: formatDate(start),
        endDate: referenceDate,
        label: `Mingguan (${formatDate(start)} s.d ${referenceDate})`
      };
    }

    if (period === 'monthly') {
      // 1 Bulan penuh
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
        label: `Bulan ${monthNames[month]} ${year}`
      };
    }

    if (period === 'semester') {
      // Semester Ganjil: Jul - Des, Semester Genap: Jan - Jun
      const isGanjil = month >= 6; // Juli - Desember
      const start = isGanjil ? new Date(year, 6, 1) : new Date(year, 0, 1);
      const end = isGanjil ? new Date(year, 11, 31) : new Date(year, 5, 30);
      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
        label: isGanjil 
          ? `Semester Ganjil TA ${year}/${year + 1} (Jul - Des)`
          : `Semester Genap TA ${year - 1}/${year} (Jan - Jun)`
      };
    }

    return {
      startDate: referenceDate,
      endDate: referenceDate,
      label: referenceDate
    };
  }

  /**
   * Filter entri berdasarkan rentang tanggal
   */
  static filterEntriesByRange(entries: EntriJurnal[], range: DateRange): EntriJurnal[] {
    return entries.filter((e) => e.tanggal >= range.startDate && e.tanggal <= range.endDate);
  }

  /**
   * 1. Deteksi Siswa Terkonsisten (Streak Master)
   * Kriteria:
   * - Menghitung jumlah hari berurutan siswa mengisi minimal 4 kebiasaan atau tuntas 7 kebiasaan
   * - Kategori: 3 Hari (Perunggu), 7 Hari (Perak), 30 Hari (Emas), 1 Semester / 90+ Hari (Mahkota Legenda)
   */
  static calculateConsistentStudents(
    siswaList: Siswa[],
    entries: EntriJurnal[],
    kelasList: Kelas[],
    limit: number = 20
  ): StudentStreakData[] {
    // Ambil daftar seluruh tanggal unik yang ada di entri, urutkan ASC
    const allDates = Array.from(new Set(entries.map((e) => e.tanggal))).sort();
    if (allDates.length === 0) return [];

    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));

    const results: StudentStreakData[] = siswaList.map((siswa) => {
      const studentEntries = entries.filter((e) => e.siswa_id === siswa.id);
      
      // Map per tanggal -> berapa kebiasaan unik
      const habitCountByDate: Record<string, number> = {};
      studentEntries.forEach((e) => {
        if (!habitCountByDate[e.tanggal]) habitCountByDate[e.tanggal] = 0;
        habitCountByDate[e.tanggal]++;
      });

      // Hitung streak beruntun
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let totalActiveDays = 0;
      let totalPerfectDays = 0;

      // Iterasi dari tanggal terlama ke terbaru
      allDates.forEach((tgl) => {
        const count = habitCountByDate[tgl] || 0;
        if (count >= 1) {
          totalActiveDays++;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          if (count >= 7) totalPerfectDays++;
        } else {
          tempStreak = 0;
        }
      });

      // Hitung current streak dari hari terbaru mundur
      const reversedDates = [...allDates].reverse();
      for (const tgl of reversedDates) {
        if ((habitCountByDate[tgl] || 0) >= 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      const bestStreak = Math.max(currentStreak, longestStreak);
      let badgeLevel: StudentStreakData['badgeLevel'] = 'none';
      let badgeLabel = 'Pemula';

      if (bestStreak >= 90) {
        badgeLevel = '1_semester';
        badgeLabel = '👑 1 Semester Legendaris (90+ Hari)';
      } else if (bestStreak >= 30) {
        badgeLevel = '30_hari';
        badgeLabel = '🥇 1 Bulan Penuh (30+ Hari)';
      } else if (bestStreak >= 7) {
        badgeLevel = '7_hari';
        badgeLabel = '🥈 1 Minggu Beruntun (7+ Hari)';
      } else if (bestStreak >= 3) {
        badgeLevel = '3_hari';
        badgeLabel = '🥉 3 Hari Berturut-turut';
      }

      const namaKelas = kelasMap.get(siswa.kelas_id || '') || siswa.kelas_id || 'Kelas';

      return {
        siswa,
        namaKelas,
        currentStreak,
        longestStreak: bestStreak,
        badgeLevel,
        badgeLabel,
        totalActiveDays,
        totalPerfectDays
      };
    });

    // Urutkan berdasarkan streak tertinggi & total keaktifan
    return results
      .filter((r) => r.longestStreak >= 2 || r.totalActiveDays >= 2)
      .sort((a, b) => b.longestStreak - a.longestStreak || b.totalPerfectDays - a.totalPerfectDays)
      .slice(0, limit);
  }

  /**
   * 2. Deteksi Siswa Ter-Effort (Most Improved / Kenaikan Progresif)
   * Kriteria:
   * - Membandingkan capaian kebiasaan rata-rata hari awal vs hari akhir periode
   * - Menghitung delta lonjakan (+Delta %)
   */
  static calculateEffortStudents(
    siswaList: Siswa[],
    entries: EntriJurnal[],
    kelasList: Kelas[],
    range: DateRange,
    limit: number = 20
  ): StudentEffortData[] {
    const rangeEntries = this.filterEntriesByRange(entries, range);
    const uniqueDates = Array.from(new Set(rangeEntries.map((e) => e.tanggal))).sort();
    
    if (uniqueDates.length < 2) {
      // Jika baru 1 hari, hitung berdasarkan jumlah kebiasaan terisi hari ini (misal 5/7, 6/7, 7/7)
      const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));
      return siswaList
        .map((siswa) => {
          const sEntries = rangeEntries.filter((e) => e.siswa_id === siswa.id);
          const distinct = new Set(sEntries.map((e) => e.kebiasaan_id)).size;
          const pct = Math.round((distinct / 7) * 100);
          const namaKelas = kelasMap.get(siswa.kelas_id || '') || siswa.kelas_id || 'Kelas';
          return {
            siswa,
            namaKelas,
            initialScore: 0,
            recentScore: pct,
            growthDelta: pct,
            description: `Menyelesaikan ${distinct}/7 Kebiasaan (${pct}%) dengan gigih.`
          };
        })
        .filter((r) => r.growthDelta > 0)
        .sort((a, b) => b.growthDelta - a.growthDelta)
        .slice(0, limit);
    }

    const midPoint = Math.floor(uniqueDates.length / 2);
    const earlyDates = new Set(uniqueDates.slice(0, midPoint));
    const recentDates = new Set(uniqueDates.slice(midPoint));

    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));

    const results: StudentEffortData[] = siswaList.map((siswa) => {
      const sEntries = rangeEntries.filter((e) => e.siswa_id === siswa.id);
      
      const earlyEntries = sEntries.filter((e) => earlyDates.has(e.tanggal));
      const recentEntries = sEntries.filter((e) => recentDates.has(e.tanggal));

      const earlyHabitAvg = earlyDates.size > 0 
        ? Math.round((earlyEntries.length / (earlyDates.size * 7)) * 100)
        : 0;
      const recentHabitAvg = recentDates.size > 0
        ? Math.round((recentEntries.length / (recentDates.size * 7)) * 100)
        : 0;

      const growthDelta = recentHabitAvg - earlyHabitAvg;
      const namaKelas = kelasMap.get(siswa.kelas_id || '') || siswa.kelas_id || 'Kelas';

      let description = '';
      if (growthDelta > 0) {
        description = `Meningkat +${growthDelta}% dari rata-rata ${earlyHabitAvg}% menjadi ${recentHabitAvg}%.`;
      } else if (recentHabitAvg >= 80) {
        description = `Mempertahankan performa unggul rata-rata ${recentHabitAvg}%.`;
      } else {
        description = `Tingkat partisipasi ${recentHabitAvg}%.`;
      }

      return {
        siswa,
        namaKelas,
        initialScore: earlyHabitAvg,
        recentScore: recentHabitAvg,
        growthDelta,
        description
      };
    });

    return results
      .filter((r) => r.growthDelta > 0 || r.recentScore >= 60)
      .sort((a, b) => b.growthDelta - a.growthDelta || b.recentScore - a.recentScore)
      .slice(0, limit);
  }

  /**
   * 3. Evaluasi Wali Kelas Ter-Istiqomah & Wali Kelas Ter-Effort
   * - Ter-Istiqomah: Kelas binaannya paling sering di Top 3 / Top 5 dan rerata kepatuhan tertinggi
   * - Ter-Effort: Kenaikan delta kepatuhan kelas terbesar (progresivitas pembinaan)
   */
  static calculateWaliKelasHonors(
    stafList: StafSekolah[],
    kelasList: Kelas[],
    siswaList: Siswa[],
    entries: EntriJurnal[],
    range: DateRange
  ): {
    waliIstiqomah: WaliKelasHonorData[];
    waliEffort: WaliKelasHonorData[];
    allWaliData: WaliKelasHonorData[];
  } {
    const rangeEntries = this.filterEntriesByRange(entries, range);
    const uniqueDates = Array.from(new Set(rangeEntries.map((e) => e.tanggal))).sort();

    const allWaliData: WaliKelasHonorData[] = kelasList.map((k) => {
      const wali: StafSekolah = stafList.find((s) => 
        s.id === k.wali_kelas_id || 
        s.kelas_id === k.id ||
        s.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase()
      ) || {
        id: `mock-${k.id}`,
        nama: `Wali Kelas ${k.nama_kelas}`,
        nip_atau_nik: '-',
        status_asn: true,
        tanggal_lahir: '1980-01-01',
        role: 'wali_kelas',
        scope: 'kelas',
        kelas_id: k.id,
        sudah_ganti_password: true
      };

      const classStudents = siswaList.filter((s) => 
        s.kelas_id === k.id || 
        s.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase()
      );
      const studentIds = new Set(classStudents.map((s) => s.id));
      const classEntries = rangeEntries.filter((e) => studentIds.has(e.siswa_id));

      const totalStudents = classStudents.length;
      const numDays = Math.max(1, uniqueDates.length);
      const totalPossibleHabits = totalStudents * numDays * 7;

      const complianceRate = totalPossibleHabits > 0
        ? Math.round((classEntries.length / totalPossibleHabits) * 100)
        : 0;

      // Hitung pertumbuhan awal vs akhir jika > 1 hari
      let growthDelta = 0;
      if (uniqueDates.length >= 2) {
        const mid = Math.floor(uniqueDates.length / 2);
        const earlyD = new Set(uniqueDates.slice(0, mid));
        const recentD = new Set(uniqueDates.slice(mid));

        const earlyE = classEntries.filter((e) => earlyD.has(e.tanggal));
        const recentE = classEntries.filter((e) => recentD.has(e.tanggal));

        const earlyPct = (earlyD.size * totalStudents * 7) > 0
          ? Math.round((earlyE.length / (earlyD.size * totalStudents * 7)) * 100)
          : 0;
        const recentPct = (recentD.size * totalStudents * 7) > 0
          ? Math.round((recentE.length / (recentD.size * totalStudents * 7)) * 100)
          : 0;

        growthDelta = recentPct - earlyPct;
      } else {
        growthDelta = complianceRate;
      }

      const score = Math.round((complianceRate * 0.7) + (Math.max(0, growthDelta) * 0.3));

      return {
        staf: wali,
        kelas: k,
        averageScore: score,
        averageComplianceRate: complianceRate,
        daysInTop3: 0,
        totalStudents,
        growthDelta,
        honorType: 'standard',
        honorTitle: `Wali Kelas ${k.nama_kelas}`,
        honorDescription: `Tingkat kepatuhan kelas: ${complianceRate}% (${classEntries.length} entri)`
      };
    });

    // Urutkan untuk Istiqomah (Kepatuhan tertinggi)
    const waliIstiqomah = [...allWaliData]
      .sort((a, b) => b.averageComplianceRate - a.averageComplianceRate || b.averageScore - a.averageScore)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        honorType: 'istiqomah' as const,
        honorTitle: idx === 0 ? '👑 Wali Kelas Ter-Istiqomah Juara 1' : `🏅 Wali Kelas Teladan Istiqomah #${idx + 1}`,
        honorDescription: `Konsisten membimbing Kelas ${item.kelas.nama_kelas} dengan rata-rata kepatuhan ${item.averageComplianceRate}%.`
      }));

    // Urutkan untuk Ter-Effort (Kenaikan delta tertinggi)
    const waliEffort = [...allWaliData]
      .sort((a, b) => b.growthDelta - a.growthDelta || b.averageComplianceRate - a.averageComplianceRate)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        honorType: 'effort' as const,
        honorTitle: idx === 0 ? '🚀 Wali Kelas Ter-Effort & Penggerak Utama' : `⚡ Wali Kelas Inspiratif Progresif #${idx + 1}`,
        honorDescription: `Berhasil mendongkrak kepatuhan Kelas ${item.kelas.nama_kelas} dengan lonjakan +${item.growthDelta}%.`
      }));

    return {
      waliIstiqomah,
      waliEffort,
      allWaliData
    };
  }

  /**
   * 4. Ringkasan Rekapitulasi 18 Rombel Lintas Periode
   */
  static calculateClassPeriodSummaries(
    kelasList: Kelas[],
    siswaList: Siswa[],
    stafList: StafSekolah[],
    entries: EntriJurnal[],
    range: DateRange
  ): ClassPeriodSummary[] {
    const rangeEntries = this.filterEntriesByRange(entries, range);
    const uniqueDates = Array.from(new Set(rangeEntries.map((e) => e.tanggal))).sort();
    const numDays = Math.max(1, uniqueDates.length);

    return kelasList.map((k) => {
      const wali = stafList.find((s) => 
        s.id === k.wali_kelas_id || 
        s.kelas_id === k.id ||
        s.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase()
      );

      const classStudents = siswaList.filter((s) => 
        s.kelas_id === k.id || 
        s.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase()
      );
      const studentIds = new Set(classStudents.map((s) => s.id));
      const classEntries = rangeEntries.filter((e) => studentIds.has(e.siswa_id));

      const totalStudents = classStudents.length;
      const totalPossibleHabits = totalStudents * numDays * 7;

      const rate = totalPossibleHabits > 0
        ? Math.round((classEntries.length / totalPossibleHabits) * 100)
        : 0;

      // Siswa tuntas harian rata-rata
      let totalDailyTuntas = 0;
      uniqueDates.forEach((d) => {
        const dayE = classEntries.filter((e) => e.tanggal === d);
        classStudents.forEach((st) => {
          const stHabits = new Set(dayE.filter((e) => e.siswa_id === st.id).map((e) => e.kebiasaan_id));
          if (stHabits.size >= 7) totalDailyTuntas++;
        });
      });

      const avgTuntas = numDays > 0 ? Math.round(totalDailyTuntas / numDays) : 0;
      const flagCount = classEntries.filter((e) => e.flag_foto_mencurigakan).length;

      const score = Math.max(0, Math.round((rate * 0.7) + (avgTuntas * 2) - (flagCount * 2)));

      return {
        kelasId: k.id,
        namaKelas: k.nama_kelas,
        waliKelasNama: wali?.nama || 'Wali Kelas',
        totalSiswa: totalStudents,
        totalEntri: classEntries.length,
        rataRataKepatuhan: rate,
        rataRataSiswaTuntas: avgTuntas,
        totalFotoFlag: flagCount,
        skorTertibPeriode: score,
        growthTrend: 0
      };
    }).sort((a, b) => b.skorTertibPeriode - a.skorTertibPeriode || b.rataRataKepatuhan - a.rataRataKepatuhan);
  }
}
