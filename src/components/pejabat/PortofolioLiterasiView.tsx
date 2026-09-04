import React, { useState } from 'react';
import { BookOpen, Search, Filter, Calendar, Eye, FileText, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import { EntriJurnal, Kelas, Siswa } from '../../types/database';

interface PortofolioLiterasiViewProps {
  entries: EntriJurnal[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  onViewPhoto: (entry: EntriJurnal) => void;
}

export const PortofolioLiterasiView: React.FC<PortofolioLiterasiViewProps> = ({
  entries,
  kelasList,
  siswaList,
  onViewPhoto
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Filter hanya entri kebiasaan #5 (Gemar Belajar)
  const literasiEntries = entries.filter((e) => e.kebiasaan_id === 5);

  const filteredItems = literasiEntries.filter((entry) => {
    const student = siswaList.find((s) => s.id === entry.siswa_id);
    if (!student) return false;

    if (selectedClassId !== 'all') {
      if (student.kelas_id !== selectedClassId) return false;
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = student.nama.toLowerCase().includes(q);
      const matchActivity = (entry.nama_kegiatan || '').toLowerCase().includes(q);
      const matchNotes = (entry.catatan || '').toLowerCase().includes(q);
      const matchSubtype = (entry.sub_tipe || '').toLowerCase().includes(q);
      return matchName || matchActivity || matchNotes || matchSubtype;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner Kurikulum */}
      <div className="rounded-3xl p-6 bg-linear-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                Waka Kurikulum
              </span>
              <span className="text-xs text-indigo-300">Gerakan Literasi & Belajar Mandiri</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              Portofolio Kebiasaan Gemar Belajar (Kebiasaan #5)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shrink-0">
          <FileText className="w-5 h-5 text-indigo-300" />
          <div>
            <span className="text-[10px] text-indigo-200 block">Total Catatan Belajar</span>
            <span className="text-base font-bold text-white">{literasiEntries.length} Portofolio</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-48"
          >
            <option value="all">Semua Rombel (18 Kelas)</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari judul buku, materi, atau nama siswa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Grid Portofolio Literasi */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">Belum ada portofolio gemar belajar pada filter ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((entry) => {
            const student = siswaList.find((s) => s.id === entry.siswa_id);
            const kelas = kelasList.find((k) => k.id === student?.kelas_id);

            return (
              <div
                key={entry.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                        Kelas {kelas?.nama_kelas || '-'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">
                        {student?.nama || 'Siswa'}
                      </h4>
                      <p className="text-[10px] text-slate-400">NISN: {student?.nisn}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(entry.waktu_submit).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Subjek / Materi Belajar */}
                  {entry.nama_kegiatan && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-indigo-950 mb-2 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{entry.nama_kegiatan}</span>
                    </div>
                  )}

                  {/* Catatan / Refleksi Siswa */}
                  {(() => {
                    const text = entry.catatan || 'Belajar mandiri dan membaca materi pelajaran.';
                    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-indigo-900 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            <span>Cerita Refleksi</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${
                            wordCount >= 100 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {wordCount} kata
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100">
                          "{text}"
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer with Photo Preview Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Pukul {new Date(entry.waktu_submit).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>

                  {entry.foto_url && (
                    <button
                      onClick={() => onViewPhoto(entry)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Bukti Belajar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
