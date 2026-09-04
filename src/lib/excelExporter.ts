import * as XLSX from 'xlsx';
import { EntriJurnal, Kebiasaan, Kelas, Siswa, StafSekolah } from '../types/database';
import { getLocalSchoolProfile } from './schoolProfile';

const getProfile = () => getLocalSchoolProfile();

export interface ClassRekapRow {
  nisn: string;
  nama: string;
  bangunPagi: string;
  beribadah: string;
  berolahraga: string;
  makanSehat: string;
  gemarBelajar: string;
  bermasyarakat: string;
  tidurCepat: string;
  totalSelesai: number;
  persentase: string;
  catatanFlag: string;
}

export interface SchoolClassSummaryRow {
  no: number;
  namaKelas: string;
  tingkat: number;
  namaWaliKelas: string;
  totalSiswa: number;
  totalEntri: number;
  siswaTuntas7: number;
  flagFotoCount: number;
  persentaseKepatuhan: number;
}

/**
 * Membuat data baris rekap harian kelas
 */
export function buildClassDailyMatrix(
  siswaList: Siswa[],
  kebiasaanList: Kebiasaan[],
  entriList: EntriJurnal[],
  tanggalStr: string
): ClassRekapRow[] {
  return siswaList.map((siswa) => {
    const studentEntries = entriList.filter(
      (e) => e.siswa_id === siswa.id && e.tanggal === tanggalStr
    );

    const getHabitStatus = (habitOrder: number) => {
      const habit = kebiasaanList.find((k) => k.urutan === habitOrder);
      if (!habit) return '-';
      
      const entries = studentEntries.filter((e) => e.kebiasaan_id === habit.id);
      if (entries.length === 0) return 'Belum';

      if (habit.maks_input_harian > 1) {
        return `${entries.length}/${habit.maks_input_harian}`;
      }

      const entry = entries[0];
      if (entry.status_waktu === 'tepat_waktu') return 'Tepat Waktu';
      if (entry.status_waktu === 'toleransi') return 'Toleransi';
      if (entry.status_waktu === 'terlambat') return 'Terlambat';
      return 'Ya';
    };

    const flaggedEntries = studentEntries.filter((e) => e.flag_foto_mencurigakan);
    const flagNotes = flaggedEntries.map((e) => {
      const habit = kebiasaanList.find((k) => k.id === e.kebiasaan_id);
      return `${habit?.nama || 'Foto'}: ${e.alasan_flag || 'Mencurigakan'}`;
    }).join('; ');

    const distinctHabitsCompleted = new Set(studentEntries.map((e) => e.kebiasaan_id)).size;
    const persentase = Math.round((distinctHabitsCompleted / 7) * 100) + '%';

    return {
      nisn: siswa.nisn,
      nama: siswa.nama,
      bangunPagi: getHabitStatus(1),
      beribadah: getHabitStatus(2),
      berolahraga: getHabitStatus(3),
      makanSehat: getHabitStatus(4),
      gemarBelajar: getHabitStatus(5),
      bermasyarakat: getHabitStatus(6),
      tidurCepat: getHabitStatus(7),
      totalSelesai: distinctHabitsCompleted,
      persentase,
      catatanFlag: flagNotes || '-'
    };
  });
}

/**
 * Mengekspor Rekap Kelas ke Excel (.xlsx)
 */
export function exportClassRekapToExcel(
  namaKelas: string,
  tanggalStr: string,
  rekapRows: ClassRekapRow[]
) {
  const formattedDate = new Date(tanggalStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const worksheetData: any[][] = [
    [`JURNAL 7 KAIH (${getProfile().nama.toUpperCase()})`],
    [`Sekolah: ${getProfile().nama} (NPSN: ${getProfile().npsn}) - Akreditasi ${getProfile().akreditasi}`],
    [`Alamat: ${getProfile().alamat}`],
    [`Laporan Harian Kelas: ${namaKelas} • Tanggal: ${formattedDate}`],
    [`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`],
    [],
    [
      'No',
      'NISN',
      'Nama Siswa',
      '1. Bangun Pagi',
      '2. Beribadah (Maks 5)',
      '3. Berolahraga',
      '4. Makan Sehat (Maks 2)',
      '5. Gemar Belajar',
      '6. Bermasyarakat',
      '7. Tidur Cepat',
      'Total Selesai',
      'Capaian (%)',
      'Audit Flag Foto'
    ]
  ];

  rekapRows.forEach((row, index) => {
    worksheetData.push([
      index + 1,
      row.nisn,
      row.nama,
      row.bangunPagi,
      row.beribadah,
      row.berolahraga,
      row.makanSehat,
      row.gemarBelajar,
      row.bermasyarakat,
      row.tidurCepat,
      row.totalSelesai,
      row.persentase,
      row.catatanFlag
    ]);
  });

  const totalSiswa = rekapRows.length;
  const avgCapaian = Math.round(
    rekapRows.reduce((acc, curr) => acc + curr.totalSelesai, 0) / (totalSiswa * 7) * 100
  );

  worksheetData.push([]);
  worksheetData.push([
    'Rata-rata Capaian Kelas',
    '',
    `${avgCapaian}% Kepatuhan Harian`,
    '', '', '', '', '', '', '', '', '', ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  ws['!cols'] = [
    { wch: 5 },  { wch: 14 }, { wch: 28 }, { wch: 15 },
    { wch: 16 }, { wch: 15 }, { wch: 16 }, { wch: 15 },
    { wch: 16 }, { wch: 15 }, { wch: 13 }, { wch: 12 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${namaKelas}`);

  const fileName = `Rekap_7KAIH_${getProfile().nama.replace(/\s+/g, '_')}_${namaKelas.replace(/\s+/g, '_')}_${tanggalStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Mengekspor Rekap Perbandingan Seluruh Kelas (7A - 9F) ke Excel
 */
export function exportSchoolComparisonToExcel(
  tanggalStr: string,
  summaryRows: SchoolClassSummaryRow[]
) {
  const formattedDate = new Date(tanggalStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const worksheetData: any[][] = [
    [`REKAPITULASI 7 KEBIASAAN ANAK INDONESIA HEBAT (${getProfile().nama.toUpperCase()})`],
    [`Sekolah: ${getProfile().nama} (NPSN: ${getProfile().npsn}) • ${getProfile().kabupaten}, ${getProfile().provinsi}`],
    [`Alamat: ${getProfile().alamat} • Status: ${getProfile().status} • Akreditasi: ${getProfile().akreditasi}`],
    [`Tanggal Rekap: ${formattedDate}`],
    [`Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`],
    [],
    [
      'No',
      'Tingkat',
      'Nama Kelas',
      'Wali Kelas',
      'Jumlah Siswa',
      'Siswa Tuntas 7',
      'Catatan Flag Foto',
      'Tingkat Kepatuhan (%)'
    ]
  ];

  summaryRows.forEach((row, idx) => {
    worksheetData.push([
      idx + 1,
      `Kelas ${row.tingkat}`,
      row.namaKelas,
      row.namaWaliKelas,
      row.totalSiswa,
      `${row.siswaTuntas7} Siswa`,
      row.flagFotoCount > 0 ? `${row.flagFotoCount} Foto Ditandai` : 'Aman',
      `${row.persentaseKepatuhan}%`
    ]);
  });

  const totalAllStudents = summaryRows.reduce((acc, r) => acc + r.totalSiswa, 0);
  const avgSchool = Math.round(
    summaryRows.reduce((acc, r) => acc + r.persentaseKepatuhan, 0) / (summaryRows.length || 1)
  );

  worksheetData.push([]);
  worksheetData.push([
    'Rata-rata Sekolah (18 Kelas)',
    '',
    '',
    '',
    totalAllStudents,
    '',
    '',
    `${avgSchool}%`
  ]);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 26 },
    { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap 18 Kelas (7A-9F)');

  const fileName = `Rekap_Sekolah_18_Kelas_${getProfile().nama.replace(/\s+/g, '_')}_${tanggalStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Format teks ringkas untuk dibagikan ke WhatsApp
 */
export function generateWhatsAppSummaryText(
  namaKelas: string,
  tanggalStr: string,
  rekapRows: ClassRekapRow[]
): string {
  const formattedDate = new Date(tanggalStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalSiswa = rekapRows.length;
  const tuntasSemua = rekapRows.filter((r) => r.totalSelesai === 7).length;
  const flaggedCount = rekapRows.filter((r) => r.catatanFlag !== '-').length;
  const avgCapaian = Math.round(
    rekapRows.reduce((acc, curr) => acc + curr.totalSelesai, 0) / (totalSiswa * 7) * 100
  );

  return `*🇮🇩 REKAP JURNAL 7 KAIH*
🏫 *${getProfile().nama}* (NPSN: ${getProfile().npsn})
📅 *Hari/Tanggal:* ${formattedDate}
👥 *Kelas:* ${namaKelas} (${totalSiswa} Siswa)

📊 *Ringkasan Kepatuhan:*
• Rata-rata Capaian: *${avgCapaian}%*
• Tuntas 7 Kebiasaan: *${tuntasSemua} siswa*
• Perlu Review Foto/Audit: *${flaggedCount} catatan*

⭐ _Mari dukung putra-putri kita menjadi generasi hebat berkarakter luhur!_
_Laporan resmi telah diexport ke format Excel oleh Wali Kelas ${getProfile().nama}._`;
}

/**
 * Trigger share ke WhatsApp via Web Share API atau WhatsApp URL
 */
export async function shareToWhatsApp(text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Rekap Jurnal 7 KAIH - ${getProfile().nama}`,
        text: text,
      });
      return true;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      }
      return false;
    }
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    return true;
  }
}

/**
 * Ekspor Laporan Resmi Perangkingan Harian Sekolah ke Excel
 */
export function exportLeaderboardToExcel(
  tanggalStr: string,
  classRankings: import('../types/database').ClassRankingItem[],
  topStudents: import('../types/database').StudentRankingItem[]
) {
  let formattedDate = tanggalStr;
  if (tanggalStr.includes('_sd_') || tanggalStr.includes(' s.d ')) {
    formattedDate = `Periode ${tanggalStr.replace(/_sd_/g, ' s.d. ')}`;
  } else {
    const d = new Date(tanggalStr);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Peringkat Kelas
  const classSheetData: any[][] = [
    ['PAPAN PERINGKAT KELAS TERDISIPLIN 7 KEBIASAAN'],
    [`Sekolah: ${getProfile().nama} (NPSN: ${getProfile().npsn})`],
    [`Tanggal Rekapitulasi: ${formattedDate}`],
    [`Waktu Generate: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['Peringkat', 'Kelas', 'Tingkat', 'Wali Kelas', 'Total Siswa', 'Siswa Tuntas (7/7)', '% Kepatuhan', 'Skor Tertib']
  ];

  classRankings.forEach((c) => {
    classSheetData.push([
      `#${c.rank}`,
      `Kelas ${c.namaKelas}`,
      `Tingkat ${c.tingkat}`,
      c.waliKelasNama,
      c.totalSiswa,
      `${c.siswaTuntasCount} Siswa (${c.tuntasPercentage}%)`,
      `${c.persentaseKepatuhan}%`,
      c.score
    ]);
  });

  const wsClass = XLSX.utils.aoa_to_sheet(classSheetData);
  wsClass['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsClass, 'Peringkat Kelas');

  // Sheet 2: Siswa Teladan Tercepat
  const studentSheetData: any[][] = [
    ['PAPAN SISWA TELADAN TERCEPAT & TERDISIPLIN (BEBAS FLAG EXIF)'],
    [`Sekolah: ${getProfile().nama}`],
    [`Tanggal Rekapitulasi: ${formattedDate}`],
    [],
    ['Peringkat', 'Nama Siswa', 'NISN', 'Kelas', 'Total Kebiasaan', 'Waktu Tuntas', 'Status Foto EXIF', 'Status Waktu']
  ];

  topStudents.forEach((s) => {
    studentSheetData.push([
      `#${s.rank}`,
      s.nama,
      s.nisn,
      `Kelas ${s.namaKelas}`,
      '7 / 7 Kebiasaan',
      s.selesaiFormatted,
      '100% Valid (Bersih)',
      'Tepat Waktu'
    ]);
  });

  const wsStudent = XLSX.utils.aoa_to_sheet(studentSheetData);
  wsStudent['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsStudent, 'Siswa Teladan Tercepat');

  const fileName = `Leaderboard_7Kebiasaan_${getProfile().nama.replace(/\s+/g, '_')}_${tanggalStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Format teks pengumuman perangkingan untuk WhatsApp
 */
export function generateLeaderboardWhatsAppText(
  tanggalStr: string,
  classRankings: import('../types/database').ClassRankingItem[],
  topStudents: import('../types/database').StudentRankingItem[]
): string {
  let formattedDate = tanggalStr;
  if (tanggalStr.includes('_sd_') || tanggalStr.includes(' s.d ')) {
    formattedDate = `Periode ${tanggalStr.replace(/_sd_/g, ' s.d. ')}`;
  } else {
    const d = new Date(tanggalStr);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  const top3Class = classRankings.slice(0, 3);
  const top3Students = topStudents.slice(0, 3);

  let msg = `*🏆 PENGUMUMAN JUARA EVALUASI 7 KEBIASAAN ANAK INDONESIA HEBAT*\n`;
  msg += `🏫 *${getProfile().nama}*\n`;
  msg += `📅 *Periode/Tanggal:* ${formattedDate}\n\n`;

  const isMulti = formattedDate.includes(' s.d') || formattedDate.includes('_sd_') || formattedDate.includes('Periode');
  msg += `*🥇 TOP 3 KELAS TERDISIPLIN ${isMulti ? 'PERIODE INI' : 'HARI INI'}:*\n`;
  top3Class.forEach((c, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
    const tuntasLabel = c.isMultiDay 
      ? `~${c.siswaTuntasCount}/${c.totalSiswa} Siswa Tuntas (Rerata/Hari)` 
      : `${c.siswaTuntasCount}/${c.totalSiswa} Siswa Tuntas`;
    msg += `${medal} *Kelas ${c.namaKelas}* (Kepatuhan: ${c.persentaseKepatuhan}% • ${tuntasLabel} • Skor: ${c.score})\n   _Wali Kelas: ${c.waliKelasNama}_\n`;
  });

  msg += `\n*🌟 TOP 3 SISWA TELADAN TERCEPAT & TERBERSIH:*\n`;
  if (top3Students.length === 0) {
    msg += `_Belum ada siswa yang memenuhi kriteria ketat tuntas 7 kebiasaan tepat waktu & bebas flag EXIF._\n`;
  } else {
    top3Students.forEach((s, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
      msg += `${medal} *${s.nama}* (Kelas ${s.namaKelas})\n   ⏰ Selesai: *${s.selesaiFormatted}* • Foto EXIF: *100% Valid*\n`;
    });
  }

  msg += `\n✨ _Selamat kepada para juara dan mari terus tingkatkan karakter pembiasaan luhur setiap hari!_\n`;
  msg += `_Laporan resmi telah direkap otomatis oleh Sistem Jurnal 7 KAIH ${getProfile().nama}._`;

  return msg;
}

