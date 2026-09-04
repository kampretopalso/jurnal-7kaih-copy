import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  PieChart,
  Users
} from 'lucide-react';
import { ClassRankingItem, Kebiasaan, EntriJurnal } from '../../types/database';

interface AnalyticsChartsProps {
  classRankings: ClassRankingItem[];
  kebiasaanList: Kebiasaan[];
  entries: EntriJurnal[];
  selectedDate: string;
  onSelectClass?: (kelasId: string) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  classRankings,
  kebiasaanList,
  entries,
  selectedDate,
  onSelectClass
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | 7 | 8 | 9>('all');
  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const currentEntries = entries.filter((e) => e.tanggal === selectedDate);
  const totalEntriesToday = currentEntries.length;
  const flaggedEntriesToday = currentEntries.filter((e) => e.flag_foto_mencurigakan).length;
  const cleanPhotosPercentage = totalEntriesToday > 0 
    ? Math.round(((totalEntriesToday - flaggedEntriesToday) / totalEntriesToday) * 100) 
    : 100;

  const filteredRankings = gradeFilter === 'all'
    ? classRankings
    : classRankings.filter((c) => c.tingkat === gradeFilter);

  // Grade Statistics
  const grade7 = classRankings.filter((c) => c.tingkat === 7);
  const grade8 = classRankings.filter((c) => c.tingkat === 8);
  const grade9 = classRankings.filter((c) => c.tingkat === 9);

  const calcGradeAvg = (list: ClassRankingItem[]) => {
    if (list.length === 0) return 0;
    return Math.round(list.reduce((acc, c) => acc + c.persentaseKepatuhan, 0) / list.length);
  };

  const avgGrade7 = calcGradeAvg(grade7);
  const avgGrade8 = calcGradeAvg(grade8);
  const avgGrade9 = calcGradeAvg(grade9);

  return (
    <div className="space-y-6">
      {/* 1. Grade Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kelas 7 */}
        <div className="bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-5 border border-emerald-700/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30">
              Tingkat Kelas 7 (7A - 7F)
            </span>
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black">{avgGrade7}%</p>
            <span className="text-xs text-emerald-200/80 font-medium">Rata-rata Kepatuhan</span>
          </div>
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-300 to-teal-200 rounded-full transition-all duration-700"
              style={{ width: `${avgGrade7}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-200/80">
            Total Siswa: {grade7.reduce((a, b) => a + b.totalSiswa, 0)} • Tuntas 7: {grade7.reduce((a, b) => a + b.siswaTuntasCount, 0)} Siswa
          </p>
        </div>

        {/* Kelas 8 */}
        <div className="bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-950 text-white rounded-3xl p-5 border border-indigo-700/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/30">
              Tingkat Kelas 8 (8A - 8F)
            </span>
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black">{avgGrade8}%</p>
            <span className="text-xs text-indigo-200/80 font-medium">Rata-rata Kepatuhan</span>
          </div>
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-300 to-purple-200 rounded-full transition-all duration-700"
              style={{ width: `${avgGrade8}%` }}
            />
          </div>
          <p className="text-[11px] text-indigo-200/80">
            Total Siswa: {grade8.reduce((a, b) => a + b.totalSiswa, 0)} • Tuntas 7: {grade8.reduce((a, b) => a + b.siswaTuntasCount, 0)} Siswa
          </p>
        </div>

        {/* Kelas 9 */}
        <div className="bg-linear-to-br from-purple-900 via-purple-800 to-slate-950 text-white rounded-3xl p-5 border border-purple-700/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full border border-purple-400/30">
              Tingkat Kelas 9 (9A - 9F)
            </span>
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black">{avgGrade9}%</p>
            <span className="text-xs text-purple-200/80 font-medium">Rata-rata Kepatuhan</span>
          </div>
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-purple-300 to-pink-200 rounded-full transition-all duration-700"
              style={{ width: `${avgGrade9}%` }}
            />
          </div>
          <p className="text-[11px] text-purple-200/80">
            Total Siswa: {grade9.reduce((a, b) => a + b.totalSiswa, 0)} • Tuntas 7: {grade9.reduce((a, b) => a + b.siswaTuntasCount, 0)} Siswa
          </p>
        </div>
      </div>

      {/* 2. Main Dynamic Chart: 18 Kelas Compliance Bar Visualizer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Grafik Dinamis Tingkat Kepatuhan 18 Kelas</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Diurutkan dari kelas dengan Skor Tertib & Tingkat Kepatuhan tertinggi ({selectedDate})
            </p>
          </div>

          {/* Filter Grade Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-end sm:self-center">
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                gradeFilter === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua (18 Kelas)
            </button>
            <button
              onClick={() => setGradeFilter(7)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                gradeFilter === 7 ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas 7
            </button>
            <button
              onClick={() => setGradeFilter(8)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                gradeFilter === 8 ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas 8
            </button>
            <button
              onClick={() => setGradeFilter(9)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                gradeFilter === 9 ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas 9
            </button>
          </div>
        </div>

        {/* Animated Horizontal Bar Chart per Class */}
        <div className="space-y-3 pt-2">
          {filteredRankings.map((c) => {
            const isTop3 = c.rank <= 3;
            const barGradient = c.rank === 1
              ? 'from-amber-400 to-amber-500'
              : c.rank === 2
              ? 'from-slate-400 to-slate-500'
              : c.rank === 3
              ? 'from-amber-600 to-amber-700'
              : c.persentaseKepatuhan >= 80
              ? 'from-emerald-500 to-teal-600'
              : c.persentaseKepatuhan >= 50
              ? 'from-blue-500 to-indigo-600'
              : 'from-amber-500 to-rose-500';

            return (
              <div
                key={c.kelasId}
                onMouseEnter={() => setHoveredClass(c.kelasId)}
                onMouseLeave={() => setHoveredClass(null)}
                onClick={() => onSelectClass?.(c.kelasId)}
                className={`p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  hoveredClass === c.kelasId
                    ? 'bg-purple-50/60 border-purple-300 shadow-md scale-[1.01]'
                    : isTop3
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-white border-slate-100 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                      c.rank === 1
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : c.rank === 2
                        ? 'bg-slate-300 text-slate-900 shadow-xs'
                        : c.rank === 3
                        ? 'bg-amber-700 text-amber-100 shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.rank}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                        <span>Kelas {c.namaKelas}</span>
                        {isTop3 && (
                          <span className="text-[10px] text-amber-600 font-black px-1.5 py-0.2 bg-amber-50 border border-amber-200 rounded">
                            {c.rank === 1 ? '🥇 Top 1' : c.rank === 2 ? '🥈 Top 2' : '🥉 Top 3'}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Wali: {c.waliKelasNama} • {c.totalSiswa} Siswa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-slate-800 block">
                        {c.persentaseKepatuhan}%
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {c.siswaTuntasCount} / {c.totalSiswa} Tuntas 7
                      </span>
                    </div>

                    <div className="hidden sm:block text-right border-l border-slate-100 pl-3">
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                        Skor: {c.score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Line */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${barGradient} transition-all duration-700 shadow-xs`}
                    style={{ width: `${Math.max(4, c.persentaseKepatuhan)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 7 Habits Success Breakdown & EXIF Authenticity Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7 Habits Success Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Persentase Pemenuhan 7 Kebiasaan Sekolah</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{selectedDate}</span>
          </div>

          <div className="space-y-3">
            {kebiasaanList.map((k) => {
              const habitEntries = currentEntries.filter((e) => e.kebiasaan_id === k.id);
              const distinctSiswaCompleted = new Set(habitEntries.map((e) => e.siswa_id)).size;
              const totalSiswaSekolah = classRankings.reduce((acc, c) => acc + c.totalSiswa, 0);
              const percentage = totalSiswaSekolah > 0 ? Math.round((distinctSiswaCompleted / totalSiswaSekolah) * 100) : 0;

              return (
                <div key={k.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black flex items-center justify-center">
                        {k.urutan}
                      </span>
                      <span>{k.nama}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {distinctSiswaCompleted} dari {totalSiswaSekolah} siswa
                      </span>
                      <strong className="text-xs font-black text-slate-800 min-w-9 text-right">
                        {percentage}%
                      </strong>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXIF Integrity Card */}
        <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Keaslian Bukti Foto</span>
            </div>
            <h4 className="text-lg font-black tracking-tight text-white">
              Tingkat Integritas EXIF
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pemeriksaan metadata tanggal pengambilan kamera secara otomatis untuk mencegah manipulasi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-2">
            <p className="text-4xl font-black text-emerald-400">{cleanPhotosPercentage}%</p>
            <span className="text-xs text-white/80 font-semibold block">Foto 100% Valid & Bersih</span>
            <div className="pt-2 border-t border-white/10 flex items-center justify-around text-[11px] text-slate-300">
              <span>Total: <strong>{totalEntriesToday}</strong> Foto</span>
              <span>Flag Anomali: <strong className="text-amber-400">{flaggedEntriesToday}</strong></span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            SMPN 2 Glagah • Sistem Verifikasi Foto 7 Kebiasaan
          </p>
        </div>
      </div>
    </div>
  );
};
