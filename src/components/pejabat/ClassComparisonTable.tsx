import React, { useState } from 'react';
import { 
  Building2, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquarePlus, 
  TrendingUp, 
  Eye, 
  FileSpreadsheet, 
  Users 
} from 'lucide-react';
import { EntriJurnal, Kelas, Siswa, StafSekolah } from '../../types/database';
import { exportSchoolComparisonToExcel, SchoolClassSummaryRow } from '../../lib/excelExporter';

interface ClassComparisonTableProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  entries: EntriJurnal[];
  stafList: StafSekolah[];
  selectedDate: string;
  onOpenArahanModal: (kelasId: string) => void;
  onDrillDownClass: (kelasId: string) => void;
}

export const ClassComparisonTable: React.FC<ClassComparisonTableProps> = ({
  kelasList,
  siswaList,
  entries,
  stafList,
  selectedDate,
  onOpenArahanModal,
  onDrillDownClass
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | '7' | '8' | '9'>('all');

  const filteredClasses = gradeFilter === 'all'
    ? kelasList
    : kelasList.filter((k) => String(k.tingkat) === gradeFilter);

  // Generate metrics for all classes based on real student count
  const classSummaryRows: SchoolClassSummaryRow[] = filteredClasses.map((k, idx) => {
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

    const classEntries = entries.filter(
      (e) => e.tanggal === selectedDate && classStudents.some((s) => s.id === e.siswa_id)
    );

    let perfectCount = 0;
    let totalHabitsCompleted = 0;
    let flagCount = 0;

    classStudents.forEach((student) => {
      const studentEntries = classEntries.filter((e) => e.siswa_id === student.id);
      const distinct = new Set(studentEntries.map((e) => e.kebiasaan_id)).size;
      totalHabitsCompleted += distinct;
      if (distinct === 7) perfectCount++;
      if (studentEntries.some((e) => e.flag_foto_mencurigakan)) flagCount++;
    });

    const totalStudents = classStudents.length;
    const rate = totalStudents > 0 
      ? Math.round((totalHabitsCompleted / (totalStudents * 7)) * 100) 
      : 0;

    return {
      no: idx + 1,
      namaKelas: k.nama_kelas,
      tingkat: k.tingkat,
      namaWaliKelas: wali?.nama || 'Wali Kelas',
      totalSiswa: totalStudents,
      totalEntri: classEntries.length,
      siswaTuntas7: perfectCount,
      flagFotoCount: flagCount,
      persentaseKepatuhan: rate
    };
  });

  const handleExportComparison = () => {
    exportSchoolComparisonToExcel(selectedDate, classSummaryRows);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        {/* Grade Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setGradeFilter('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              gradeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kelas (18 Kelas)
          </button>
          <button
            onClick={() => setGradeFilter('7')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              gradeFilter === '7'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas 7 (7A - 7F)
          </button>
          <button
            onClick={() => setGradeFilter('8')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              gradeFilter === '8'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas 8 (8A - 8F)
          </button>
          <button
            onClick={() => setGradeFilter('9')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              gradeFilter === '9'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas 9 (9A - 9F)
          </button>
        </div>

        {/* Tombol Export Laporan Seluruh Kelas */}
        <button
          onClick={handleExportComparison}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 self-stretch sm:self-center justify-center shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel Rekap 18 Kelas</span>
        </button>
      </div>

      {/* Tabel Komparasi 18 Kelas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3.5 px-3 sm:px-4 w-12 text-center sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">
                  No
                </th>
                <th className="py-3.5 px-3 sm:px-4 min-w-27.5 sticky left-12 bg-slate-50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Kelas
                </th>
                <th className="py-3.5 px-3 sm:px-4 min-w-45">Wali Kelas</th>
                <th className="py-3.5 px-3 sm:px-4 text-center min-w-25">Jumlah Siswa</th>
                <th className="py-3.5 px-3 sm:px-4 text-center min-w-30">Tuntas 7 Kebiasaan</th>
                <th className="py-3.5 px-3 sm:px-4 text-center min-w-25">Flag Foto</th>
                <th className="py-3.5 px-3 sm:px-4 text-center min-w-30 text-purple-900 font-extrabold">
                  Tingkat Kepatuhan
                </th>
                <th className="py-3.5 px-3 sm:px-4 text-center min-w-45">Aksi Pimpinan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {classSummaryRows.map((row, idx) => {
                const k = kelasList.find((c) => c.nama_kelas === row.namaKelas);

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition group">
                    {/* No - Sticky on mobile */}
                    <td className="py-3.5 px-3 text-center text-slate-400 font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      {idx + 1}
                    </td>

                    {/* Kelas - Sticky on mobile */}
                    <td className="py-3.5 px-3 sm:px-4 font-extrabold text-slate-800 text-sm sticky left-12 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                        Kelas {row.namaKelas}
                      </span>
                    </td>

                    {/* Wali Kelas */}
                    <td className="py-3.5 px-3 sm:px-4 text-slate-700 font-medium">
                      {row.namaWaliKelas}
                    </td>

                    {/* Jumlah Siswa Riil */}
                    <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                      {row.totalSiswa} Siswa
                    </td>

                    {/* Tuntas 7 */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {row.siswaTuntas7} Siswa
                      </span>
                    </td>

                    {/* Flag Foto */}
                    <td className="py-3.5 px-3 text-center">
                      {row.flagFotoCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {row.flagFotoCount} Foto
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Tingkat Kepatuhan */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-extrabold text-sm text-slate-800">
                          {row.persentaseKepatuhan}%
                        </span>
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${row.persentaseKepatuhan}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Aksi Pimpinan */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Beri Arahan */}
                        <button
                          onClick={() => k && onOpenArahanModal(k.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1.5 active:scale-95"
                          title="Kirim Arahan / Feedback ke Wali Kelas"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                          <span>Beri Arahan</span>
                        </button>

                        {/* Lihat Detail Siswa Kelas Ini */}
                        <button
                          onClick={() => k && onDrillDownClass(k.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
                          title="Lihat Detail Siswa Kelas Ini"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
