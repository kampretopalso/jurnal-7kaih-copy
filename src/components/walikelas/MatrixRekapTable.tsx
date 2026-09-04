import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { EntriJurnal, Kebiasaan, Siswa } from '../../types/database';

interface MatrixRekapTableProps {
  siswaList: Siswa[];
  kebiasaanList: Kebiasaan[];
  entries: EntriJurnal[];
  selectedDate: string;
  onSelectStudent: (siswa: Siswa) => void;
  searchQuery: string;
  pageSize?: number;
}

export const MatrixRekapTable: React.FC<MatrixRekapTableProps> = ({
  siswaList,
  kebiasaanList,
  entries,
  selectedDate,
  onSelectStudent,
  searchQuery,
  pageSize = 32
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredStudents = siswaList.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery)
  );

  // Reset ke halaman 1 jika filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, siswaList.length]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in space-y-0">
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3.5 px-3 sm:px-4 w-12 text-center sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">
                No
              </th>
              <th className="py-3.5 px-3 sm:px-4 min-w-[170px] sticky left-12 bg-slate-50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                Nama Siswa
              </th>
              {kebiasaanList.map((k) => (
                <th
                  key={k.id}
                  className="py-3.5 px-2 text-center min-w-[100px] border-l border-slate-100 font-semibold"
                >
                  <span className="block truncate max-w-[110px] mx-auto text-slate-800" title={k.nama}>
                    {k.urutan}. {k.nama}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {k.maks_input_harian > 1 ? `(Maks ${k.maks_input_harian}x)` : '(1x)'}
                  </span>
                </th>
              ))}
              <th className="py-3.5 px-3 sm:px-4 text-center min-w-[100px] border-l border-slate-100 font-bold text-emerald-800">
                Total Capaian
              </th>
              <th className="py-3.5 px-3 sm:px-4 text-center w-20 border-l border-slate-100">
                Aksi
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {currentStudents.length === 0 ? (
              <tr>
                <td colSpan={kebiasaanList.length + 3} className="py-8 text-center text-slate-400">
                  Tidak ditemukan siswa dengan kata kunci "{searchQuery}"
                </td>
              </tr>
            ) : (
              currentStudents.map((siswa, idx) => {
                const globalIndex = startIndex + idx + 1;
                const studentEntries = entries.filter(
                  (e) => e.siswa_id === siswa.id && e.tanggal === selectedDate
                );

                const distinctHabits = new Set(studentEntries.map((e) => e.kebiasaan_id)).size;
                const percentage = Math.round((distinctHabits / 7) * 100);
                const hasSuspiciousPhoto = studentEntries.some((e) => e.flag_foto_mencurigakan);

                return (
                  <tr
                    key={siswa.id}
                    className="hover:bg-slate-50/70 transition group"
                  >
                    {/* No - Sticky on Mobile */}
                    <td className="py-3 px-3 text-center text-slate-400 font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      {globalIndex}
                    </td>

                    {/* Nama Siswa & NISN - Sticky on Mobile */}
                    <td className="py-3 px-3 sm:px-4 sticky left-12 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={() => onSelectStudent(siswa)}
                        className="text-left font-bold text-slate-800 hover:text-emerald-700 transition flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">{siswa.nama}</span>
                        {hasSuspiciousPhoto && (
                          <span title="Ada foto mencurigakan">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </button>
                      <span className="text-[11px] text-slate-400 block">NISN: {siswa.nisn}</span>
                    </td>

                    {/* 7 Kebiasaan Columns */}
                    {kebiasaanList.map((k) => {
                      const habitEntries = studentEntries.filter((e) => e.kebiasaan_id === k.id);
                      const isFilled = habitEntries.length > 0;
                      const hasFlag = habitEntries.some((e) => e.flag_foto_mencurigakan);

                      return (
                        <td
                          key={k.id}
                          className="py-3 px-2 text-center border-l border-slate-100"
                        >
                          {!isFilled ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" title="Belum diisi" />
                          ) : k.maks_input_harian > 1 ? (
                            <div className="inline-flex items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                  habitEntries.length >= k.maks_input_harian
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {habitEntries.length}/{k.maks_input_harian}
                              </span>
                              {hasFlag && (
                                <span title="Perlu review">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              {habitEntries[0].status_waktu === 'tepat_waktu' ? (
                                <span title="Tepat Waktu">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                                </span>
                              ) : habitEntries[0].status_waktu === 'toleransi' ? (
                                <span title="Toleransi">
                                  <Clock className="w-4 h-4 text-amber-600 inline" />
                                </span>
                              ) : habitEntries[0].status_waktu === 'terlambat' ? (
                                <span title="Terlambat">
                                  <Clock className="w-4 h-4 text-rose-500 inline" />
                                </span>
                              ) : (
                                <span title="Selesai">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                                </span>
                              )}

                              {hasFlag && (
                                <span title="Foto ditandai">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Capaian */}
                    <td className="py-3 px-3 text-center border-l border-slate-100 font-bold">
                      <span
                        className={`px-2 py-1 rounded-xl text-xs inline-block ${
                          percentage === 100
                            ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                            : percentage >= 50
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {distinctHabits}/7 ({percentage}%)
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center border-l border-slate-100">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectStudent(siswa)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Lihat Detail & Bukti Foto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectStudent(siswa)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                          title="Beri Catatan / Feedback untuk Siswa Ini"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar (Maks 32 Siswa per halaman) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left">
            Menampilkan <strong className="text-slate-800">{startIndex + 1}</strong> – <strong className="text-slate-800">{endIndex}</strong> dari total <strong className="text-slate-800">{totalItems}</strong> siswa
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sebelumnya</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                })
                .map((p, pIdx, arr) => {
                  const prev = arr[pIdx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold transition text-xs ${
                          currentPage === p
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <span className="hidden xs:inline">Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
