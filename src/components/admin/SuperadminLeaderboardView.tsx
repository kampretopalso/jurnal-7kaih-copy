import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  Calendar, 
  RefreshCw, 
  BarChart3, 
  ShieldCheck,
  FileSpreadsheet, 
  MessageCircle, 
  Check,
  Search,
  Eye,
  Flame,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ClassRankingItem, EntriJurnal, Kebiasaan, Kelas, Siswa, StafSekolah } from '../../types/database';
import { LeaderboardService } from '../../lib/leaderboardService';
import { LeaderboardPodium } from './LeaderboardPodium';
import { AnalyticsCharts } from './AnalyticsCharts';
import { exportLeaderboardToExcel, generateLeaderboardWhatsAppText, shareToWhatsApp } from '../../lib/excelExporter';
import { HallOfFameSection } from './HallOfFameSection';

interface SuperadminLeaderboardViewProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  entries: EntriJurnal[];
  stafList: StafSekolah[];
  kebiasaanList: Kebiasaan[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefreshData: () => void;
  onSelectClassReport?: (kelas: Kelas) => void;
  onSelectStudent?: (siswa: Siswa) => void;
}

type PeriodeEvaluasi = 'harian' | 'mingguan' | 'bulanan' | 'semester' | 'kustom';

export const SuperadminLeaderboardView: React.FC<SuperadminLeaderboardViewProps> = ({
  kelasList,
  siswaList,
  entries,
  stafList,
  kebiasaanList,
  selectedDate,
  onDateChange,
  onRefreshData,
  onSelectClassReport,
  onSelectStudent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kelas' | 'siswa' | 'grafik' | 'hall_of_fame'>('kelas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExported, setIsExported] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Mode Rentang Tanggal Evaluasi (Harian, Mingguan, Bulanan, Semester, Kustom)
  const [periodeMode, setPeriodeMode] = useState<PeriodeEvaluasi>('harian');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(selectedDate);

  // Hitung range aktif
  const activeDateRange = useMemo(() => {
    if (periodeMode === 'harian') {
      return { startDate: selectedDate, endDate: selectedDate, label: 'Harian' };
    }
    if (periodeMode === 'mingguan') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 6);
      const start = d.toISOString().split('T')[0];
      return { startDate: start, endDate: selectedDate, label: 'Mingguan (7 Hari Terakhir)' };
    }
    if (periodeMode === 'bulanan') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 29);
      const start = d.toISOString().split('T')[0];
      return { startDate: start, endDate: selectedDate, label: 'Bulanan (30 Hari Terakhir)' };
    }
    if (periodeMode === 'semester') {
      return { startDate: '2026-07-15', endDate: selectedDate, label: 'Semester Ini (Mulai 15 Juli)' };
    }
    // kustom
    return { 
      startDate: customStartDate || selectedDate, 
      endDate: customEndDate || selectedDate, 
      label: `Kustom (${customStartDate} s.d ${customEndDate})` 
    };
  }, [periodeMode, selectedDate, customStartDate, customEndDate]);

  // Label periode dinamis untuk podium dan tabel
  const podiumPeriodeText = useMemo(() => {
    switch (periodeMode) {
      case 'harian':
        return 'Hari Ini';
      case 'mingguan':
        return 'Minggu Ini';
      case 'bulanan':
        return 'Bulan Ini';
      case 'semester':
        return 'Semester Ini';
      case 'kustom':
        return `(${activeDateRange.startDate} s.d ${activeDateRange.endDate})`;
      default:
        return 'Periode Terpilih';
    }
  }, [periodeMode, activeDateRange]);

  // 1. Hitung Perangkingan 18 Kelas berdasarkan range aktif
  const classRankings: ClassRankingItem[] = useMemo(() => {
    return LeaderboardService.calculateClassRankings(
      kelasList,
      siswaList,
      entries,
      stafList,
      activeDateRange
    );
  }, [kelasList, siswaList, entries, stafList, activeDateRange]);

  // 2. Hitung Siswa Teladan Tercepat & Terbersih berdasarkan range aktif
  const { qualifiedStudents, disqualifiedCount } = useMemo(() => {
    return LeaderboardService.calculateTopStudents(
      siswaList,
      entries,
      kelasList,
      activeDateRange
    );
  }, [siswaList, entries, kelasList, activeDateRange]);

  // Handlers
  const handleExportExcel = () => {
    exportLeaderboardToExcel(activeDateRange.startDate === activeDateRange.endDate ? activeDateRange.startDate : `${activeDateRange.startDate}_sd_${activeDateRange.endDate}`, classRankings, qualifiedStudents);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  const handleShareWhatsApp = async () => {
    const text = generateLeaderboardWhatsAppText(activeDateRange.startDate === activeDateRange.endDate ? activeDateRange.startDate : `${activeDateRange.startDate} s.d ${activeDateRange.endDate}`, classRankings, qualifiedStudents);
    await shareToWhatsApp(text);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2500);
  };

  // Filtered lists for search
  const filteredClasses = classRankings.filter(
    (c) =>
      c.namaKelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.waliKelasNama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = qualifiedStudents.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.namaKelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Card with Date Selector & Summary Stats */}
      <div className="bg-linear-to-br from-purple-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>Rekapitulasi Evaluasi: {activeDateRange.label}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Papan Peringkat & Juara {periodeMode === 'harian' ? 'Harian' : periodeMode === 'mingguan' ? 'Mingguan' : periodeMode === 'bulanan' ? 'Bulanan' : periodeMode === 'semester' ? 'Semester' : 'Periode'} 7 Kebiasaan</span>
            </h2>
            <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
              Mengevaluasi secara objektif kepatuhan {kelasList.length} kelas serta prestasi siswa teladan ({activeDateRange.startDate} s.d {activeDateRange.endDate}) bebas flag anomali foto dan tertib waktu.
            </p>
          </div>

          {/* Action & Date Range Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Range Presets Selector */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 text-xs font-bold">
              <button
                onClick={() => setPeriodeMode('harian')}
                className={`px-3 py-1.5 rounded-xl transition ${periodeMode === 'harian' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-purple-200 hover:text-white'}`}
              >
                Harian
              </button>
              <button
                onClick={() => setPeriodeMode('mingguan')}
                className={`px-3 py-1.5 rounded-xl transition ${periodeMode === 'mingguan' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-purple-200 hover:text-white'}`}
              >
                Mingguan
              </button>
              <button
                onClick={() => setPeriodeMode('bulanan')}
                className={`px-3 py-1.5 rounded-xl transition ${periodeMode === 'bulanan' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-purple-200 hover:text-white'}`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setPeriodeMode('semester')}
                className={`px-3 py-1.5 rounded-xl transition ${periodeMode === 'semester' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-purple-200 hover:text-white'}`}
              >
                Semester
              </button>
              <button
                onClick={() => setPeriodeMode('kustom')}
                className={`px-3 py-1.5 rounded-xl transition ${periodeMode === 'kustom' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-purple-200 hover:text-white'}`}
              >
                Kustom
              </button>
            </div>

            {/* Input Tanggal Harian vs Kustom Range */}
            {periodeMode === 'harian' ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl">
                <Calendar className="w-4 h-4 text-purple-300" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                />
              </div>
            ) : periodeMode === 'kustom' ? (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl text-xs">
                <span className="text-[11px] text-purple-200">Dari:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-purple-200">s.d.</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-2xl text-xs text-purple-200 border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>{activeDateRange.startDate} s.d {activeDateRange.endDate}</span>
              </div>
            )}

            <button
              onClick={onRefreshData}
              title="Perbarui Data"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              {isExported ? <Check className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>{isExported ? 'Tersimpan' : 'Export Excel'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md shadow-green-500/20 transition flex items-center gap-1.5"
            >
              {isShared ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4 fill-slate-950" />}
              <span>{isShared ? 'Terkirim' : 'Bagikan WA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kelas')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'kelas'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Peringkat 18 Kelas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('siswa')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'siswa'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Siswa Teladan ({qualifiedStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hall_of_fame')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'hall_of_fame'
                ? 'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400 font-extrabold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>🌟 Konsistensi & Ter-Effort (Multi-Periode)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('grafik')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'grafik'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Grafik Dinamis</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden md:inline-block font-medium">
          Rekap: <strong className="text-slate-700">{activeDateRange.startDate === activeDateRange.endDate ? activeDateRange.startDate : `${activeDateRange.startDate} s.d ${activeDateRange.endDate}`}</strong>
        </span>
      </div>

      {/* SUBTAB: HALL OF FAME & MULTI-PERIODE */}
      {activeSubTab === 'hall_of_fame' && (
        <HallOfFameSection
          kelasList={kelasList}
          siswaList={siswaList}
          entries={entries}
          stafList={stafList}
          onSelectStudent={onSelectStudent}
        />
      )}

      {/* 3. SUBTAB 1: PERANGKINGAN 18 KELAS */}
      {activeSubTab === 'kelas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Podium Juara 1, 2, 3 Kelas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>Podium Juara Kelas Terdisiplin {podiumPeriodeText}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Peringkat tertinggi berdasarkan rata-rata kepatuhan 7 kebiasaan dan jumlah siswa tuntas 100% {periodeMode !== 'harian' ? '(rerata harian)' : ''}
              </p>
            </div>

            <LeaderboardPodium
              type="kelas"
              items={classRankings}
              onSelectItem={(item: ClassRankingItem) => {
                const targetK = kelasList.find((k) => k.id === item.kelasId);
                if (targetK && onSelectClassReport) onSelectClassReport(targetK);
              }}
            />
          </div>

          {/* Tabel Lengkap Peringkat 1 s.d 18 Kelas */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Klasemen Lengkap 18 Rombel (Kelas 7A - 9F) • {podiumPeriodeText}
                </h4>
                <p className="text-xs text-slate-400">
                  Klik baris kelas untuk membuka laporan rincian siswa dan bukti foto
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kelas / nama wali..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3.5 px-4 w-14 text-center">Rank</th>
                    <th className="py-3.5 px-4 min-w-27.5">Kelas</th>
                    <th className="py-3.5 px-4 min-w-45">Wali Kelas</th>
                    <th className="py-3.5 px-4 text-center">Total Siswa</th>
                    <th className="py-3.5 px-4 text-center">
                      {periodeMode === 'harian' ? 'Tuntas (7/7)' : 'Tuntas 7 (Rerata/Hari)'}
                    </th>
                    <th className="py-3.5 px-4 text-center min-w-32.5">Tingkat Kepatuhan</th>
                    <th className="py-3.5 px-4 text-center">Foto Flag</th>
                    <th className="py-3.5 px-4 text-center">Skor Tertib</th>
                    <th className="py-3.5 px-4 text-center w-20">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada kelas yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((c) => {
                      const isTop1 = c.rank === 1;
                      const isTop2 = c.rank === 2;
                      const isTop3 = c.rank === 3;

                      return (
                        <tr
                          key={c.kelasId}
                          onClick={() => {
                            const targetK = kelasList.find((k) => k.id === c.kelasId);
                            if (targetK && onSelectClassReport) onSelectClassReport(targetK);
                          }}
                          className={`hover:bg-slate-50/80 transition cursor-pointer group ${
                            isTop1 ? 'bg-amber-50/40' : isTop2 ? 'bg-slate-50/30' : isTop3 ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-4 text-center">
                            <span className={`w-7 h-7 rounded-xl font-black text-xs inline-flex items-center justify-center ${
                              isTop1
                                ? 'bg-amber-400 text-amber-950 shadow-sm'
                                : isTop2
                                ? 'bg-slate-300 text-slate-900 shadow-sm'
                                : isTop3
                                ? 'bg-amber-700 text-amber-100 shadow-sm'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              #{c.rank}
                            </span>
                          </td>

                          {/* Nama Kelas */}
                          <td className="py-3 px-4 font-extrabold text-slate-800 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span>Kelas {c.namaKelas}</span>
                              {isTop1 && <span className="text-xs">🥇</span>}
                              {isTop2 && <span className="text-xs">🥈</span>}
                              {isTop3 && <span className="text-xs">🥉</span>}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Tingkat {c.tingkat}
                            </span>
                          </td>

                          {/* Wali Kelas */}
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {c.waliKelasNama}
                          </td>

                          {/* Total Siswa */}
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {c.totalSiswa}
                          </td>

                          {/* Tuntas 7 */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-extrabold text-emerald-700 block">
                              {c.isMultiDay ? `~${c.siswaTuntasCount}` : c.siswaTuntasCount} <span className="text-[10px] text-slate-400">/ {c.totalSiswa}</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium block">
                              ({c.tuntasPercentage}%)
                            </span>
                            {c.isMultiDay && c.totalTuntasAkumulasi !== undefined && (
                              <span className="text-[9px] text-slate-400 font-normal block tracking-tight">
                                Total: {c.totalTuntasAkumulasi} kali
                              </span>
                            )}
                          </td>

                          {/* Persentase Kepatuhan & Progress */}
                          <td className="py-3 px-4">
                            <div className="space-y-1 max-w-30 mx-auto">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-700">{c.persentaseKepatuhan}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    c.persentaseKepatuhan >= 80 ? 'bg-emerald-500' : c.persentaseKepatuhan >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${c.persentaseKepatuhan}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Flag Foto EXIF */}
                          <td className="py-3 px-4 text-center">
                            {c.flaggedPhotosCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                                ⚠️ {c.flaggedPhotosCount}
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Aman</span>
                              </span>
                            )}
                          </td>

                          {/* Skor Tertib */}
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black border border-purple-200 text-xs">
                              {c.score}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <button
                              title="Buka Laporan Kelas"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTAB 2: SISWA TELADAN TERCEPAT & TERBERSIH */}
      {activeSubTab === 'siswa' && (
        <div className="space-y-6 animate-fade-in">
          {/* Info Syarat Siswa Teladan */}
          <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
              🌟
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-extrabold text-emerald-950">
                Kriteria Khusus Siswa Teladan {podiumPeriodeText} SMPN 2 Glagah
              </h4>
              <p className="text-emerald-800/90 leading-relaxed">
                Hanya siswa yang <strong>menuntaskan ke-7 kebiasaan</strong> dengan <strong>100% foto asli/sinkron (bebas peringatan EXIF)</strong> dan <strong>tepat waktu</strong> pada Bangun Pagi (04.00-05.00) serta Tidur Cepat (20.00-22.00). Peringkat disusun dari yang tercepat menyelesaikan hari ini.
              </p>
              {disqualifiedCount > 0 && (
                <p className="text-slate-500 pt-1 text-[11px]">
                  ℹ️ Sebanyak <strong>{disqualifiedCount} siswa tuntas</strong> belum masuk podium karena memiliki catatan flag foto EXIF atau keterlambatan waktu.
                </p>
              )}
            </div>
          </div>

          {/* Podium Top 3 Siswa Teladan */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-emerald-600" />
                <span>Podium Siswa Teladan Tercepat & Terdisiplin {podiumPeriodeText}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Murid dengan karakter paling konsisten, jujur dalam bukti foto, dan tepat waktu
              </p>
            </div>

            <LeaderboardPodium
              type="siswa"
              items={qualifiedStudents}
            />
          </div>

          {/* Tabel Lengkap Siswa Teladan */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Daftar Peringkat Siswa Teladan Hari Ini ({qualifiedStudents.length} Siswa Lolos Kriteria)
                </h4>
                <p className="text-xs text-slate-400">
                  Diurutkan berdasarkan waktu penyelesaian 7 kebiasaan paling awal pada {selectedDate}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NISN, atau kelas..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3.5 px-4 w-14 text-center">Rank</th>
                    <th className="py-3.5 px-4 min-w-45">Nama Lengkap Siswa</th>
                    <th className="py-3.5 px-4 min-w-30">NISN</th>
                    <th className="py-3.5 px-4 text-center">Kelas</th>
                    <th className="py-3.5 px-4 text-center min-w-35">Waktu Selesai (7/7)</th>
                    <th className="py-3.5 px-4 text-center min-w-32.5">Status Foto EXIF</th>
                    <th className="py-3.5 px-4 text-center">Ketepatan Waktu</th>
                    <th className="py-3.5 px-4 text-center">Badge Prestasi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {qualifiedStudents.length === 0
                          ? 'Belum ada siswa yang memenuhi kriteria ketat tuntas 7 kebiasaan tepat waktu & bebas flag EXIF pada tanggal ini.'
                          : 'Tidak ditemukan siswa dengan kata kunci pencarian.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const isTop1 = s.rank === 1;
                      const isTop2 = s.rank === 2;
                      const isTop3 = s.rank === 3;

                      return (
                        <tr
                          key={s.siswaId}
                          className={`hover:bg-slate-50/80 transition ${
                            isTop1 ? 'bg-emerald-50/40' : isTop2 ? 'bg-indigo-50/30' : isTop3 ? 'bg-purple-50/20' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-4 text-center">
                            <span className={`w-7 h-7 rounded-xl font-black text-xs inline-flex items-center justify-center ${
                              isTop1
                                ? 'bg-amber-400 text-amber-950 shadow-sm'
                                : isTop2
                                ? 'bg-slate-300 text-slate-900 shadow-sm'
                                : isTop3
                                ? 'bg-amber-700 text-amber-100 shadow-sm'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              #{s.rank}
                            </span>
                          </td>

                          {/* Nama Siswa */}
                          <td className="py-3 px-4 font-extrabold text-slate-800 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span>{s.nama}</span>
                              {isTop1 && <span className="text-xs">🥇</span>}
                              {isTop2 && <span className="text-xs">🥈</span>}
                              {isTop3 && <span className="text-xs">🥉</span>}
                            </div>
                          </td>

                          {/* NISN */}
                          <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                            {s.nisn}
                          </td>

                          {/* Kelas */}
                          <td className="py-3 px-4 text-center font-extrabold text-slate-800">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              Kelas {s.namaKelas}
                            </span>
                          </td>

                          {/* Waktu Selesai */}
                          <td className="py-3 px-4 text-center font-black text-indigo-700">
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200">
                              {s.selesaiFormatted}
                            </span>
                          </td>

                          {/* Status EXIF */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>100% Valid</span>
                            </span>
                          </td>

                          {/* Status Waktu */}
                          <td className="py-3 px-4 text-center">
                            <span className="text-emerald-700 font-bold">
                              ✓ Tepat Waktu
                            </span>
                          </td>

                          {/* Badge Prestasi */}
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-200">
                              ⭐ Teladan Hebat
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBTAB 3: GRAFIK DINAMIS & ANALITIK SEKOLAH */}
      {activeSubTab === 'grafik' && (
        <AnalyticsCharts
          classRankings={classRankings}
          kebiasaanList={kebiasaanList}
          entries={entries}
          selectedDate={selectedDate}
          onSelectClass={(kelasId) => {
            const targetK = kelasList.find((k) => k.id === kelasId);
            if (targetK && onSelectClassReport) onSelectClassReport(targetK);
          }}
        />
      )}
    </div>
  );
};
