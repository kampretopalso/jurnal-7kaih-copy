import { 
  ClassRankingItem, 
  EntriJurnal, 
  Kelas, 
  Siswa, 
  StafSekolah, 
  StudentRankingItem 
} from '../types/database';

export class LeaderboardService {
  /**
   * Menghitung perangkingan kelas untuk tanggal tertentu atau rentang tanggal (Harian, Mingguan, Bulanan, Semester, Kustom)
   * Kriteria:
   * 1. Persentase kepatuhan rata-rata 7 kebiasaan (% tertinggi)
   * 2. Jumlah & persentase siswa tuntas 7 kebiasaan
   * 3. Minimnya foto mencurigakan (anomali EXIF)
   */
  static calculateClassRankings(
    kelasList: Kelas[],
    siswaList: Siswa[],
    entries: EntriJurnal[],
    stafList: StafSekolah[],
    dateOrRange: string | { startDate: string; endDate: string }
  ): ClassRankingItem[] {
    const isRange = typeof dateOrRange === 'object';
    const startDate = isRange ? dateOrRange.startDate : dateOrRange;
    const endDate = isRange ? dateOrRange.endDate : dateOrRange;

    const currentEntries = entries.filter((e) => e.tanggal >= startDate && e.tanggal <= endDate);

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const totalDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const rankings: Omit<ClassRankingItem, 'rank'>[] = kelasList.map((k) => {
      // Temukan siswa kelas ini (support UUID, nama kelas '7A', 'k-7a')
      const classStudents = siswaList.filter((s) => 
        s.kelas_id === k.id ||
        s.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase() ||
        s.kelas_id?.toLowerCase() === `k-${k.nama_kelas.toLowerCase()}`
      );

      const wali = stafList.find((st) => 
        st.id === k.wali_kelas_id || 
        st.kelas_id === k.id || 
        st.kelas_id?.toUpperCase() === k.nama_kelas.toUpperCase() ||
        (st.kelas_id && String(st.kelas_id).toUpperCase().replace(/^K-/, '') === k.nama_kelas.toUpperCase())
      );

      const classEntries = currentEntries.filter((e) => 
        classStudents.some((s) => s.id === e.siswa_id)
      );

      let totalHabitsCompleted = 0;
      let singleDayPerfectCount = 0;
      let totalClassTuntasDays = 0; // Akumulasi hari tuntas 7 untuk seluruh siswa
      let flagCount = 0;
      let tepatWaktuCount = 0;

      classStudents.forEach((student) => {
        const studentEntries = classEntries.filter((e) => e.siswa_id === student.id);
        
        if (totalDays === 1) {
          const distinct = new Set(studentEntries.map((e) => e.kebiasaan_id)).size;
          totalHabitsCompleted += distinct;
          if (distinct === 7) singleDayPerfectCount++;
        } else {
          // Multi-day: hitung total hari-kebiasaan unik
          const distinctPerDay = new Set(studentEntries.map((e) => `${e.tanggal}_${e.kebiasaan_id}`)).size;
          totalHabitsCompleted += distinctPerDay;

          // Hitung berapa kali siswa ini menuntaskan 7 kebiasaan di hari-hari dalam rentang
          const datesSet = new Set(studentEntries.map((e) => e.tanggal));
          datesSet.forEach((tgl) => {
            const habitsOnDate = new Set(studentEntries.filter((e) => e.tanggal === tgl).map((e) => e.kebiasaan_id));
            if (habitsOnDate.size >= 7) {
              totalClassTuntasDays++;
            }
          });
        }

        if (studentEntries.some((e) => e.flag_foto_mencurigakan)) flagCount++;
        tepatWaktuCount += studentEntries.filter((e) => e.status_waktu === 'tepat_waktu').length;
      });

      const totalStudents = classStudents.length;
      const rate = totalStudents > 0 
        ? Math.min(100, Math.round((totalHabitsCompleted / (totalStudents * 7 * totalDays)) * 100)) 
        : 0;

      // Untuk mode multi-hari: siswaTuntasCount adalah RERATA siswa tuntas per hari dalam rentang waktu
      const perfectCount = totalDays > 1 
        ? (totalDays > 0 ? Math.round(totalClassTuntasDays / totalDays) : 0)
        : singleDayPerfectCount;

      const tuntasPercent = totalStudents > 0
        ? Math.round((perfectCount / totalStudents) * 100)
        : 0;

      // Formula Skor Tertib Total:
      // (Persentase Kepatuhan * 0.6) + (Persentase Siswa Tuntas * 0.35) - (Penalti Flag * 2)
      const penalty = flagCount * 2;
      const calculatedScore = Math.max(0, Math.round((rate * 0.6) + (tuntasPercent * 0.35) - penalty));

      return {
        kelasId: k.id,
        namaKelas: k.nama_kelas,
        tingkat: k.tingkat,
        waliKelasNama: wali?.nama || 'Wali Kelas',
        totalSiswa: totalStudents,
        siswaTuntasCount: perfectCount,
        totalTuntasAkumulasi: totalClassTuntasDays,
        isMultiDay: totalDays > 1,
        totalDays,
        tuntasPercentage: tuntasPercent,
        totalEntri: classEntries.length,
        persentaseKepatuhan: rate,
        flaggedPhotosCount: flagCount,
        tepatWaktuCount,
        score: calculatedScore
      };
    });

    // Urutkan berdasarkan Skor Tertib tertinggi, lalu persentase kepatuhan, lalu siswa tuntas
    rankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.persentaseKepatuhan !== a.persentaseKepatuhan) return b.persentaseKepatuhan - a.persentaseKepatuhan;
      if (b.siswaTuntasCount !== a.siswaTuntasCount) return b.siswaTuntasCount - a.siswaTuntasCount;
      return a.namaKelas.localeCompare(b.namaKelas);
    });

    return rankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }

  /**
   * Menghitung Siswa Teladan (Murid Tercepat & Terdisiplin)
   * Mendukung mode Harian maupun Rentang Tanggal (Mingguan, Bulanan, Semester)
   */
  static calculateTopStudents(
    siswaList: Siswa[],
    entries: EntriJurnal[],
    kelasList: Kelas[],
    dateOrRange: string | { startDate: string; endDate: string }
  ): {
    qualifiedStudents: StudentRankingItem[];
    disqualifiedCount: number;
  } {
    const isRange = typeof dateOrRange === 'object';
    const startDate = isRange ? dateOrRange.startDate : dateOrRange;
    const endDate = isRange ? dateOrRange.endDate : dateOrRange;

    const currentEntries = entries.filter((e) => e.tanggal >= startDate && e.tanggal <= endDate);
    const kelasMap = new Map<string, { nama: string; tingkat: number }>();

    kelasList.forEach((k) => {
      kelasMap.set(k.id, { nama: k.nama_kelas, tingkat: k.tingkat });
      kelasMap.set(k.nama_kelas.toUpperCase(), { nama: k.nama_kelas, tingkat: k.tingkat });
      kelasMap.set(`k-${k.nama_kelas.toLowerCase()}`, { nama: k.nama_kelas, tingkat: k.tingkat });
    });

    const candidates: (Omit<StudentRankingItem, 'rank'> & { tuntasHariCount?: number; totalValidHabits?: number })[] = [];
    let disqualified = 0;

    siswaList.forEach((student) => {
      const studentEntries = currentEntries.filter((e) => e.siswa_id === student.id);
      if (studentEntries.length === 0) return;

      const hasFlag = studentEntries.some((e) => e.flag_foto_mencurigakan);
      if (hasFlag) {
        disqualified++;
        return;
      }

      const kInfo = kelasMap.get(student.kelas_id) || 
                    kelasMap.get(student.kelas_id?.toUpperCase()) || 
                    { nama: student.kelas_id || '7A', tingkat: 7 };

      if (!isRange || startDate === endDate) {
        // Mode Harian (1 Hari)
        const distinctHabits = new Set(studentEntries.map((e) => e.kebiasaan_id));
        if (distinctHabits.size < 7) return;

        const hasLateEntry = studentEntries.some((e) => 
          (e.kebiasaan_id === 1 || e.kebiasaan_id === 7) && e.status_waktu === 'terlambat'
        );
        if (hasLateEntry) {
          disqualified++;
          return;
        }

        const submitTimestamps = studentEntries.map((e) => {
          const d = new Date(e.waktu_submit || e.waktu_ambil_foto || `${startDate}T23:59:59Z`);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        });

        const finishTimestamp = Math.max(...submitTimestamps);
        const finishDate = new Date(finishTimestamp);

        const timeFormatted = finishDate.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB';

        candidates.push({
          siswaId: student.id,
          nama: student.nama,
          nisn: student.nisn,
          namaKelas: kInfo.nama,
          tingkat: kInfo.tingkat,
          totalKebiasaan: 7,
          selesaiPada: finishDate.toISOString(),
          selesaiFormatted: timeFormatted,
          hasFlaggedPhoto: false,
          isTepatWaktu: true,
          scoreKerapian: 100
        });
      } else {
        // Mode Rentang Tanggal (Mingguan / Bulanan / Kustom)
        const datesSet = new Set(studentEntries.map((e) => e.tanggal));
        let daysTuntas7 = 0;
        datesSet.forEach((tgl) => {
          const habitsOnDate = new Set(studentEntries.filter((e) => e.tanggal === tgl).map((e) => e.kebiasaan_id));
          if (habitsOnDate.size >= 7) daysTuntas7++;
        });

        if (daysTuntas7 === 0 && studentEntries.length < 7) return;

        candidates.push({
          siswaId: student.id,
          nama: student.nama,
          nisn: student.nisn,
          namaKelas: kInfo.nama,
          tingkat: kInfo.tingkat,
          totalKebiasaan: daysTuntas7 > 0 ? 7 : Math.round(studentEntries.length / datesSet.size),
          selesaiPada: new Date(Date.now() - daysTuntas7 * 86400000).toISOString(),
          selesaiFormatted: `${daysTuntas7} Hari Tuntas (${studentEntries.length} entri)`,
          hasFlaggedPhoto: false,
          isTepatWaktu: true,
          scoreKerapian: 100,
          tuntasHariCount: daysTuntas7,
          totalValidHabits: studentEntries.length
        });
      }
    });

    if (!isRange || startDate === endDate) {
      candidates.sort((a, b) => new Date(a.selesaiPada).getTime() - new Date(b.selesaiPada).getTime());
    } else {
      candidates.sort((a, b) => {
        if ((b.tuntasHariCount || 0) !== (a.tuntasHariCount || 0)) {
          return (b.tuntasHariCount || 0) - (a.tuntasHariCount || 0);
        }
        return (b.totalValidHabits || 0) - (a.totalValidHabits || 0);
      });
    }

    const rankedStudents = candidates.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    return {
      qualifiedStudents: rankedStudents,
      disqualifiedCount: disqualified
    };
  }

  /**
   * Menghitung Ringkasan Tingkat (Kelas 7, Kelas 8, Kelas 9)
   */
  static calculateGradeSummaries(classRankings: ClassRankingItem[]) {
    const grades = [7, 8, 9];

    return grades.map((g) => {
      const gradeClasses = classRankings.filter((c) => c.tingkat === g);
      const totalSiswa = gradeClasses.reduce((acc, c) => acc + c.totalSiswa, 0);
      const totalTuntas = gradeClasses.reduce((acc, c) => acc + c.siswaTuntasCount, 0);
      const avgRate = gradeClasses.length > 0
        ? Math.round(gradeClasses.reduce((acc, c) => acc + c.persentaseKepatuhan, 0) / gradeClasses.length)
        : 0;

      const topClass = gradeClasses.sort((a, b) => b.score - a.score)[0];

      return {
        tingkat: g,
        namaTingkat: `Kelas ${g}`,
        totalKelas: gradeClasses.length,
        totalSiswa,
        totalTuntas,
        persentaseKepatuhan: avgRate,
        kelasTerbaik: topClass ? `Kelas ${topClass.namaKelas}` : '-'
      };
    });
  }
}
