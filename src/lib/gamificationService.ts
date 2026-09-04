import { BadgeItem, EntriJurnal, GamificationProfile } from '../types/database';
import { getTodayDateString } from './timeCalculator';

/**
 * Service untuk memproses gamifikasi, penghitungan streak, dan pembukaan lencana karakter siswa
 */
export class GamificationService {
  /**
   * Menghitung streak harian (rentetan hari berturut-turut) dari riwayat entri siswa
   */
  static calculateStreak(entries: EntriJurnal[]): { currentStreak: number; longestStreak: number; activeDays: string[] } {
    if (!entries || entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDays: [] };
    }

    // Kelompokkan entri berdasarkan tanggal dan hitung distinct kebiasaan per hari
    const dayMap = new Map<string, Set<number>>();
    entries.forEach((e) => {
      if (!dayMap.has(e.tanggal)) {
        dayMap.set(e.tanggal, new Set<number>());
      }
      dayMap.get(e.tanggal)!.add(e.kebiasaan_id);
    });

    // Ambil tanggal-tanggal di mana siswa menyelesaikan minimal 4 dari 7 kebiasaan (atau idealnya 7/7)
    // Diurutkan dari yang paling lama ke paling baru
    const qualifyingDays = Array.from(dayMap.entries())
      .filter(([_, habits]) => habits.size >= 4)
      .map(([date]) => date)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (qualifyingDays.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDays: [] };
    }

    const todayStr = getTodayDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getTodayDateString(yesterdayDate);

    // Hitung longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (let i = 0; i < qualifyingDays.length; i++) {
      const curr = new Date(qualifyingDays[i]);
      if (prevDate) {
        const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curr;
    }

    // Hitung current streak (harus aktif hari ini atau kemarin)
    const lastActiveDate = qualifyingDays[qualifyingDays.length - 1];
    let currentStreak = 0;

    if (lastActiveDate === todayStr || lastActiveDate === yesterdayStr) {
      currentStreak = 1;
      let checkDate = new Date(lastActiveDate);

      for (let i = qualifyingDays.length - 2; i >= 0; i--) {
        const expectedPrev = new Date(checkDate);
        expectedPrev.setDate(expectedPrev.getDate() - 1);
        const expectedStr = getTodayDateString(expectedPrev);

        if (qualifyingDays[i] === expectedStr) {
          currentStreak++;
          checkDate = expectedPrev;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      activeDays: qualifyingDays
    };
  }

  /**
   * Evaluasi daftar seluruh lencana karakter dan status pembukaannya
   */
  static evaluateBadges(entries: EntriJurnal[], currentStreak: number): BadgeItem[] {
    const totalEntries = entries.length;
    
    // Kebiasaan #1 (Bangun Pagi Tepat Waktu)
    const bangunPagiEntries = entries.filter((e) => e.kebiasaan_id === 1);
    const bangunPagiTepatWaktu = bangunPagiEntries.filter((e) => e.status_waktu === 'tepat_waktu').length;

    // Kebiasaan #2 (Beribadah)
    const ibadahCount = entries.filter((e) => e.kebiasaan_id === 2).length;

    // Kebiasaan #3 (Berolahraga)
    const olahragaCount = entries.filter((e) => e.kebiasaan_id === 3).length;

    // Kebiasaan #4 (Makan Sehat & Bergizi)
    const makanSehatCount = entries.filter((e) => e.kebiasaan_id === 4).length;

    // Kebiasaan #5 (Gemar Belajar & Membaca)
    const belajarCount = entries.filter((e) => e.kebiasaan_id === 5).length;

    // Kebiasaan #6 (Bermasyarakat)
    const sosialCount = entries.filter((e) => e.kebiasaan_id === 6).length;

    // Kebiasaan #7 (Tidur Cepat Tepat Waktu)
    const tidurCepatEntries = entries.filter((e) => e.kebiasaan_id === 7);
    const tidurCepatTepatWaktu = tidurCepatEntries.filter((e) => e.status_waktu === 'tepat_waktu').length;

    // Kejujuran Foto (Zero Flag EXIF)
    const cleanPhotoEntries = entries.filter((e) => !e.flag_foto_mencurigakan).length;

    const badges: BadgeItem[] = [
      {
        id: 'fajar-1',
        title: 'Pahlawan Fajar',
        category: 'fajar',
        icon: '🌅',
        description: 'Bangun pagi tepat waktu (04.00 - 05.00 WIB) sebanyak 3 hari.',
        requirement: '3x Bangun Pagi Tepat Waktu',
        isUnlocked: bangunPagiTepatWaktu >= 3,
        currentProgress: Math.min(bangunPagiTepatWaktu, 3),
        targetProgress: 3,
        tier: 'bronze'
      },
      {
        id: 'fajar-2',
        title: 'Ksatria Subuh',
        category: 'fajar',
        icon: '☀️',
        description: 'Bangun pagi tepat waktu secara istiqomah sebanyak 7 hari.',
        requirement: '7x Bangun Pagi Tepat Waktu',
        isUnlocked: bangunPagiTepatWaktu >= 7,
        currentProgress: Math.min(bangunPagiTepatWaktu, 7),
        targetProgress: 7,
        tier: 'silver'
      },
      {
        id: 'literasi-1',
        title: 'Sahabat Literasi',
        category: 'literasi',
        icon: '📖',
        description: 'Mencatat kegiatan gemar belajar & membaca mandiri sebanyak 3 kali.',
        requirement: '3x Gemar Belajar Terisi',
        isUnlocked: belajarCount >= 3,
        currentProgress: Math.min(belajarCount, 3),
        targetProgress: 3,
        tier: 'bronze'
      },
      {
        id: 'literasi-2',
        title: 'Kutu Buku Teladan',
        category: 'literasi',
        icon: '📚',
        description: 'Konsisten belajar dan mendokumentasikan bacaan sebanyak 7 kali.',
        requirement: '7x Gemar Belajar Terisi',
        isUnlocked: belajarCount >= 7,
        currentProgress: Math.min(belajarCount, 7),
        targetProgress: 7,
        tier: 'gold'
      },
      {
        id: 'spiritual-1',
        title: 'Jiwa Khusyuk',
        category: 'spiritual',
        icon: '🤲',
        description: 'Melaksanakan dan mencatat pembiasaan ibadah harian sebanyak 5 kali.',
        requirement: '5x Beribadah Terisi',
        isUnlocked: ibadahCount >= 5,
        currentProgress: Math.min(ibadahCount, 5),
        targetProgress: 5,
        tier: 'silver'
      },
      {
        id: 'sosial-1',
        title: 'Tangan Penolong',
        category: 'sosial',
        icon: '🤝',
        description: 'Membantu pekerjaan rumah atau masyarakat lingkungan sebanyak 3 kali.',
        requirement: '3x Bermasyarakat Terisi',
        isUnlocked: sosialCount >= 3,
        currentProgress: Math.min(sosialCount, 3),
        targetProgress: 3,
        tier: 'bronze'
      },
      {
        id: 'bugar-1',
        title: 'Generasi Bugar',
        category: 'bugar',
        icon: '🏃',
        description: 'Berolahraga dan menjaga kebugaran jasmani sebanyak 5 kali.',
        requirement: '5x Berolahraga Terisi',
        isUnlocked: olahragaCount >= 5,
        currentProgress: Math.min(olahragaCount, 5),
        targetProgress: 5,
        tier: 'silver'
      },
      {
        id: 'nutrisi-1',
        title: 'Pola Sehat Juara',
        category: 'bugar',
        icon: '🥗',
        description: 'Makan makanan sehat, bergizi, dan higienis sebanyak 5 kali.',
        requirement: '5x Makan Sehat Terisi',
        isUnlocked: makanSehatCount >= 5,
        currentProgress: Math.min(makanSehatCount, 5),
        targetProgress: 5,
        tier: 'bronze'
      },
      {
        id: 'malam-1',
        title: 'Tidur Tepat Disiplin',
        category: 'istiqomah',
        icon: '🌙',
        description: 'Tidur cepat malam hari (20.00 - 22.00 WIB) sebanyak 3 kali.',
        requirement: '3x Tidur Cepat Tepat Waktu',
        isUnlocked: tidurCepatTepatWaktu >= 3,
        currentProgress: Math.min(tidurCepatTepatWaktu, 3),
        targetProgress: 3,
        tier: 'bronze'
      },
      {
        id: 'integritas-1',
        title: 'Bintang Kejujuran',
        category: 'istiqomah',
        icon: '🛡️',
        description: 'Mengunggah minimal 10 foto bukti dengan 100% EXIF asli tanpa anomali.',
        requirement: '10x Bukti Foto Asli Bersih',
        isUnlocked: cleanPhotoEntries >= 10,
        currentProgress: Math.min(cleanPhotoEntries, 10),
        targetProgress: 10,
        tier: 'gold'
      },
      {
        id: 'streak-1',
        title: 'Api Semangat 3 Hari',
        category: 'istiqomah',
        icon: '🔥',
        description: 'Mencapai rentetan 3 hari berturut-turut disiplin mengisi jurnal.',
        requirement: 'Streak 3 Hari Beruntun',
        isUnlocked: currentStreak >= 3,
        currentProgress: Math.min(currentStreak, 3),
        targetProgress: 3,
        tier: 'bronze'
      },
      {
        id: 'streak-2',
        title: 'Sang Konsisten 7 Hari',
        category: 'istiqomah',
        icon: '⚡',
        description: 'Mencapai rentetan 7 hari berturut-turut tuntas mengisi jurnal.',
        requirement: 'Streak 7 Hari Beruntun',
        isUnlocked: currentStreak >= 7,
        currentProgress: Math.min(currentStreak, 7),
        targetProgress: 7,
        tier: 'silver'
      },
      {
        id: 'master-1',
        title: 'Generasi Hebat Indonesia',
        category: 'istiqomah',
        icon: '👑',
        description: 'Mencapai total 35 entri pembiasaan karakter di aplikasi 7KAIH.',
        requirement: '35 Total Entri Terisi',
        isUnlocked: totalEntries >= 35,
        currentProgress: Math.min(totalEntries, 35),
        targetProgress: 35,
        tier: 'diamond'
      }
    ];

    return badges;
  }

  /**
   * Menghasilkan profil gamifikasi lengkap untuk siswa
   */
  static getStudentProfile(siswaId: string, entries: EntriJurnal[]): GamificationProfile {
    const studentEntries = entries.filter((e) => e.siswa_id === siswaId);
    const { currentStreak, longestStreak, activeDays } = this.calculateStreak(studentEntries);
    const badges = this.evaluateBadges(studentEntries, currentStreak);

    return {
      siswaId,
      currentStreak,
      longestStreak,
      totalDaysActive: activeDays.length,
      totalHabitsCompleted: studentEntries.length,
      badges
    };
  }
}
