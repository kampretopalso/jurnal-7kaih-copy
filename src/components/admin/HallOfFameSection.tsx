import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Crown, 
  Award, 
  Calendar, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  ArrowUpRight,
  Medal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { EntriJurnal, Kelas, Siswa, StafSekolah } from '../../types/database';
import { 
  PeriodAggregationService, 
  PeriodType, 
  StudentStreakData, 
  StudentEffortData, 
  WaliKelasHonorData 
} from '../../lib/periodAggregationService';

interface HallOfFameSectionProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  entries: EntriJurnal[];
  stafList: StafSekolah[];
  onSelectStudent?: (siswa: Siswa) => void;
}

export const HallOfFameSection: React.FC<HallOfFameSectionProps> = ({
  kelasList,
  siswaList,
  entries,
  stafList,
  onSelectStudent
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [activeTab, setActiveTab] = useState<'siswa_streak' | 'siswa_effort' | 'wali_honor' | 'kelas_summary'>('siswa_streak');

  const dateRange = useMemo(() => {
    return PeriodAggregationService.getDateRange(period);
  }, [period]);

  // 1. Siswa Terkonsisten
  const consistentStudents = useMemo(() => {
    return PeriodAggregationService.calculateConsistentStudents(siswaList, entries, kelasList);
  }, [siswaList, entries, kelasList]);

  // 2. Siswa Ter-Effort
  const effortStudents = useMemo(() => {
    return PeriodAggregationService.calculateEffortStudents(siswaList, entries, kelasList, dateRange);
  }, [siswaList, entries, kelasList, dateRange]);

  // 3. Wali Kelas Honors
  const waliHonors = useMemo(() => {
    return PeriodAggregationService.calculateWaliKelasHonors(stafList, kelasList, siswaList, entries, dateRange);
  }, [stafList, kelasList, siswaList, entries, dateRange]);

  // 4. Ringkasan 18 Rombel Periode Ini
  const classSummaries = useMemo(() => {
    return PeriodAggregationService.calculateClassPeriodSummaries(kelasList, siswaList, stafList, entries, dateRange);
  }, [kelasList, siswaList, stafList, entries, dateRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner & Period Switcher */}
      <div className="bg-linear-to-r from-amber-600 via-purple-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-amber-400/30">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 backdrop-blur-md">
              <Crown className="w-3.5 h-3.5" />
              <span>Apresiasi & Rekapitulasi Berkelanjutan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>🌟 Hall of Fame: Konsistensi & Siswa/Wali Ter-Effort</span>
            </h2>
            <p className="text-xs text-purple-100/90 max-w-2xl leading-relaxed">
              Mengevaluasi rekapitulasi Mingguan, Bulanan, dan Semesteran untuk menemukan murid berkarakter baja (Streak Terpanjang), murid paling berprogres (Ter-Effort), serta Wali Kelas paling istiqomah membina.
            </p>
          </div>

          {/* Period Selector Buttons */}
          <div className="flex items-center bg-black/30 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md self-stretch lg:self-auto overflow-x-auto">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === 'daily'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              📅 Harian
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === 'weekly'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              📆 Mingguan
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === 'monthly'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              🗓️ Bulanan
            </button>
            <button
              onClick={() => setPeriod('semester')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === 'semester'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              🎓 1 Semester
            </button>
          </div>
        </div>

        {/* Sub-bar Info Rentang */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/80">
          <span>Rentang Evaluasi Aktif: <strong className="text-amber-300">{dateRange.label}</strong></span>
          <span>Diperbarui otomatis dari database</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('siswa_streak')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'siswa_streak'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>🔥 Siswa Terkonsisten (Streak {consistentStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa_effort')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'siswa_effort'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>🚀 Siswa Ter-Effort / Berprogres ({effortStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wali_honor')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'wali_honor'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>👑 Wali Kelas Istiqomah & Ter-Effort</span>
        </button>

        <button
          onClick={() => setActiveTab('kelas_summary')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kelas_summary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-300" />
          <span>📊 Klasemen Periode 18 Kelas</span>
        </button>
      </div>

      {/* Content 1: Siswa Terkonsisten (Streak Master) */}
      {activeTab === 'siswa_streak' && (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Pahlawan Konsistensi Karakter 7KAIH</strong>
                <p className="text-amber-800 text-[11px]">Siswa yang tidak pernah absen mengisi jurnal pembiasaan berhari-hari tanpa jeda.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-black bg-amber-200/80 px-2.5 py-1 rounded-xl">
              {consistentStudents.length} Siswa Teladan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consistentStudents.map((item, idx) => {
              const isTop1 = idx === 0;
              const isTop3 = idx < 3;

              return (
                <div
                  key={item.siswa.id}
                  onClick={() => onSelectStudent && onSelectStudent(item.siswa)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer hover:scale-[1.02] relative overflow-hidden flex flex-col justify-between ${
                    isTop1
                      ? 'bg-linear-to-br from-amber-500/10 via-amber-50 to-white border-amber-300 shadow-md ring-2 ring-amber-400'
                      : isTop3
                      ? 'bg-white border-purple-200 shadow-sm hover:border-amber-300'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {isTop1 && (
                    <span className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
                      👑 Juara 1 Konsisten
                    </span>
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                            {item.siswa.nama}
                          </h4>
                          <span className="text-[11px] font-bold text-purple-700">
                            Kelas {item.namaKelas} • NISN {item.siswa.nisn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Streak Badge */}
                    <div className="my-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                        <div>
                          <span className="text-[10px] uppercase font-black text-amber-800 block">Streak Berturut-turut</span>
                          <span className="text-base font-black text-amber-950">{item.longestStreak} Hari Aktif</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        {item.badgeLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Total Hari Isi</span>
                        <strong className="text-slate-700 font-bold">{item.totalActiveDays} Hari</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 block">Tuntas 7/7</span>
                        <strong className="text-emerald-700 font-bold">{item.totalPerfectDays} Hari</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content 2: Siswa Ter-Effort (Most Improved) */}
      {activeTab === 'siswa_effort' && (
        <div className="space-y-4">
          <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl flex items-center justify-between text-xs text-purple-950">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong>Apresiasi Semangat & Pertumbuhan Karakter (Ter-Effort)</strong>
                <p className="text-purple-800 text-[11px]">Siswa yang gigih meningkatkan capaian pembiasaan 7 kebiasaan dari hari ke hari.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-black bg-purple-200/80 px-2.5 py-1 rounded-xl">
              {effortStudents.length} Siswa Berprogres
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {effortStudents.map((item, idx) => {
              return (
                <div
                  key={item.siswa.id}
                  onClick={() => onSelectStudent && onSelectStudent(item.siswa)}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 shadow-sm transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                            {item.siswa.nama}
                          </h4>
                          <span className="text-[11px] font-bold text-purple-700">
                            Kelas {item.namaKelas}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 border border-emerald-300">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{item.growthDelta}%
                      </span>
                    </div>

                    <div className="my-3 p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Capaian Awal: <strong>{item.initialScore}%</strong></span>
                        <span className="text-purple-700 font-bold">Capaian Terkini: <strong>{item.recentScore}%</strong></span>
                      </div>
                      <p className="text-[11px] text-purple-900 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content 3: Wali Kelas Ter-Istiqomah & Ter-Effort */}
      {activeTab === 'wali_honor' && (
        <div className="space-y-6">
          {/* Section 1: Ter-Istiqomah */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>👑 Top 5 Wali Kelas Ter-Istiqomah (Kepatuhan Tertinggi & Konsisten)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waliHonors.waliIstiqomah.map((item, idx) => (
                <div
                  key={item.kelas.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    idx === 0
                      ? 'bg-linear-to-br from-amber-500/10 via-amber-50 to-white border-amber-300 shadow-md ring-2 ring-amber-400'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700 block">
                        {item.honorTitle}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {item.staf.nama}
                      </h4>
                      <span className="text-xs font-bold text-purple-700">
                        Wali Kelas {item.kelas.nama_kelas} ({item.totalStudents} Siswa)
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      #{idx + 1}
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-800 font-semibold">Rata-rata Kepatuhan Kelas:</span>
                      <strong className="text-amber-950 text-sm font-black">{item.averageComplianceRate}%</strong>
                    </div>
                    <p className="text-[11px] text-amber-900 opacity-90">{item.honorDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Ter-Effort */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>⚡ Top 5 Wali Kelas Ter-Effort (Lonjakan Pertumbuhan Kelas Terbesar)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waliHonors.waliEffort.map((item, idx) => (
                <div
                  key={item.kelas.id}
                  className="p-5 rounded-3xl bg-white border border-purple-200 shadow-sm hover:border-purple-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 block">
                        {item.honorTitle}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {item.staf.nama}
                      </h4>
                      <span className="text-xs font-bold text-indigo-700">
                        Wali Kelas {item.kelas.nama_kelas}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 border border-emerald-300 shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{item.growthDelta}%
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                    <p className="text-[11px] text-purple-900 font-medium">{item.honorDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content 4: Klasemen Periode 18 Kelas */}
      {activeTab === 'kelas_summary' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Rekapitulasi 18 Rombel Periode: <strong className="text-purple-700">{dateRange.label}</strong>
            </span>
            <span className="text-slate-400 font-medium">Diurutkan Skor Tertib Agregat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Wali Kelas</th>
                  <th className="px-4 py-3 text-center">Total Siswa</th>
                  <th className="px-4 py-3 text-center">Rerata Kepatuhan</th>
                  <th className="px-4 py-3 text-center">Total Entri</th>
                  <th className="px-4 py-3 text-center">Skor Periode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classSummaries.map((item, idx) => (
                  <tr key={item.kelasId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-center font-black">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      Kelas {item.namaKelas}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {item.waliKelasNama}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-600">
                      {item.totalSiswa}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-purple-700">
                      {item.rataRataKepatuhan}%
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium">
                      {item.totalEntri}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 font-black border border-purple-200">
                        {item.skorTertibPeriode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
