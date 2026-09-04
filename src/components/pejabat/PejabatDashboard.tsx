import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  Filter,
  ShieldCheck,
  RefreshCw,
  MessageSquarePlus,
  Layers,
  Send,
  Trash2,
  BookOpen,
  ShieldAlert,
  Crown,
  Printer,
  FileText,
  Sparkles,
  Flame,
  MessageSquareHeart
} from 'lucide-react';
import { ArahanWaliKelas, EntriJurnal, Feedback, KategoriArahan, Kebiasaan, Kelas, PiagamData, Siswa, StafSekolah, SuaraSiswa } from '../../types/database';
import { JournalService } from '../../lib/journalService';
import { getTodayDateString } from '../../lib/timeCalculator';
import { LeaderboardService } from '../../lib/leaderboardService';
import { MatrixRekapTable } from '../walikelas/MatrixRekapTable';
import { SchoolStatsOverview } from './SchoolStatsOverview';
import { StudentDetailModal } from '../walikelas/StudentDetailModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { ExportSharePanel } from '../walikelas/ExportSharePanel';
import { ClassComparisonTable } from './ClassComparisonTable';
import { ArahanWaliKelasModal } from './ArahanWaliKelasModal';
import { ClassReportModal } from '../admin/ClassReportModal';
import { PortofolioLiterasiView } from './PortofolioLiterasiView';
import { EarlyWarningRadar } from './EarlyWarningRadar';
import { PiagamPenghargaanModal } from './PiagamPenghargaanModal';
import { PiagamGeneratorSection } from './PiagamGeneratorSection';
import { RaporKarakterModal } from '../common/RaporKarakterModal';
import { HallOfFameSection } from '../admin/HallOfFameSection';
import { SuaraSiswaModerationView } from '../common/SuaraSiswaModerationView';

interface PejabatDashboardProps {
  staf: StafSekolah;
}

export const PejabatDashboard: React.FC<PejabatDashboardProps> = ({ staf }) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Default tab berdasarkan peran spesifik
  const defaultTab = staf.role === 'kesiswaan' 
    ? 'early_warning' 
    : staf.role === 'waka_kurikulum' 
    ? 'literasi' 
    : 'comparison';
    
  const [activeTab, setActiveTab] = useState<'comparison' | 'students' | 'suara' | 'arahan' | 'literasi' | 'early_warning' | 'piagam' | 'hall_of_fame'>(defaultTab);

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [stafList, setStafList] = useState<StafSekolah[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kebiasaanList, setKebiasaanList] = useState<Kebiasaan[]>([]);
  const [entries, setEntries] = useState<EntriJurnal[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [arahanList, setArahanList] = useState<ArahanWaliKelas[]>([]);
  const [suaraList, setSuaraList] = useState<SuaraSiswa[]>([]);

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const [selectedEntryForPhoto, setSelectedEntryForPhoto] = useState<EntriJurnal | null>(null);
  const [isArahanModalOpen, setIsArahanModalOpen] = useState(false);
  const [targetClassForArahan, setTargetClassForArahan] = useState<string>('');
  const [selectedClassForReport, setSelectedClassForReport] = useState<Kelas | null>(null);
  const [piagamData, setPiagamData] = useState<PiagamData | null>(null);
  const [studentForRapor, setStudentForRapor] = useState<Siswa | null>(null);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      const [allKelas, allStaf, allSiswa, habits, allEntries, allFeedbacks, allArahan, allSuara] = await Promise.all([
        JournalService.getKelas(),
        JournalService.getStaf(),
        JournalService.getSiswa(undefined, forceRefresh),
        JournalService.getKebiasaan(),
        JournalService.getEntriJurnal(undefined, undefined, forceRefresh),
        JournalService.getFeedback(),
        JournalService.getArahanWaliKelas(),
        JournalService.getSuaraSiswaList()
      ]);

      setKelasList(allKelas);
      setStafList(allStaf);
      setSiswaList(allSiswa);
      setKebiasaanList(habits.sort((a, b) => a.urutan - b.urutan));
      setEntries(allEntries);
      setFeedbacks(allFeedbacks);
      setArahanList(allArahan);
      setSuaraList(allSuara);
    } catch (e) {
      console.warn('Error loading pejabat data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [staf.id]);

  // Filter siswa berdasarkan kelas terpilih
  const filteredSiswaList = selectedClassId === 'all'
    ? siswaList
    : siswaList.filter((s) => s.kelas_id === selectedClassId);

  // Hitung KPI
  const currentDayEntries = entries.filter((e) => e.tanggal === selectedDate);
  const totalSiswa = filteredSiswaList.length;

  let totalHabitsCompleted = 0;
  let perfectStudentCount = 0;
  let flaggedPhotoCount = 0;

  filteredSiswaList.forEach((siswa) => {
    const studentDayEntries = currentDayEntries.filter((e) => e.siswa_id === siswa.id);
    const distinct = new Set(studentDayEntries.map((e) => e.kebiasaan_id)).size;
    totalHabitsCompleted += distinct;
    if (distinct === 7) perfectStudentCount++;
    if (studentDayEntries.some((e) => e.flag_foto_mencurigakan)) flaggedPhotoCount++;
  });

  const avgCompletionRate = totalSiswa > 0
    ? Math.round((totalHabitsCompleted / (totalSiswa * 7)) * 100)
    : 0;

  const getRoleTitle = () => {
    switch (staf.role) {
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'waka_kurikulum':
        return 'Waka Kurikulum';
      case 'kesiswaan':
        return 'Bidang Kesiswaan';
      default:
        return 'Pimpinan Sekolah';
    }
  };

  const getTargetClassName = () => {
    if (selectedClassId === 'all') return 'Seluruh Sekolah (7A - 9F)';
    const k = kelasList.find((c) => c.id === selectedClassId);
    return k ? `Kelas ${k.nama_kelas}` : 'Sekolah';
  };

  const handleSendArahan = async (
    kelasId: string, 
    kategori: KategoriArahan, 
    judul: string, 
    pesan: string
  ) => {
    await JournalService.sendArahanWaliKelas(staf.id, kelasId, kategori, judul, pesan);
    await loadData();
  };

  const handleDeleteArahan = async (arahanId: string) => {
    await JournalService.deleteArahan(arahanId);
    await loadData();
  };

  const handleDrillDownClass = (kelasId: string) => {
    const targetK = kelasList.find((c) => c.id === kelasId);
    if (targetK) {
      setSelectedClassForReport(targetK);
    }
  };

  const handleAddStudentFeedback = async (siswaId: string, komentar: string) => {
    await JournalService.addFeedback(staf.id, siswaId, null, komentar);
    await loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {getRoleTitle()} • Executive Dashboard
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              18 Kelas (7A - 9F)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            Monitoring & Evaluasi 7 Kebiasaan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau performa seluruh kelas 7A–9F, rekap tingkat kepatuhan harian, dan berikan arahan langsung ke Wali Kelas.
          </p>
        </div>

        {/* Date Selector & Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setTargetClassForArahan(kelasList[0]?.id || '');
              setIsArahanModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Beri Arahan</span>
          </button>

          <button
            onClick={() => loadData(true)}
            title="Muat Ulang"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Siswa Terpantau</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{totalSiswa}</p>
          <span className="text-[11px] text-slate-400">{getTargetClassName()}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tingkat Kepatuhan</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{avgCompletionRate}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">Rata-rata 7 Kebiasaan</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tuntas 7 Kebiasaan</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">
            {perfectStudentCount} <span className="text-xs font-normal text-slate-400">/ {totalSiswa}</span>
          </p>
          <span className="text-[11px] text-slate-400">Siswa Capaian 100%</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Arahan Terkirim</span>
            <Send className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700">{arahanList.length}</p>
          <span className="text-[11px] text-purple-600">Pesan ke Wali Kelas</span>
        </div>
      </div>

      {/* Tabs Navigation (Disesuaikan berdasarkan peran / tupoksi) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 no-scrollbar">
        {/* Tab Khusus Kesiswaan (Prioritas Radar) */}
        {staf.role === 'kesiswaan' && (
          <button
            onClick={() => setActiveTab('early_warning')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'early_warning'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <span>🚨 Radar Pembinaan & Disiplin</span>
          </button>
        )}

        {/* Tab Khusus Waka Kurikulum (Prioritas Literasi) */}
        {staf.role === 'waka_kurikulum' && (
          <button
            onClick={() => setActiveTab('literasi')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'literasi'
                ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>📖 Portofolio Gemar Belajar (#5)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'comparison'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekap Per Kelas (7A - 9F)</span>
        </button>

        {/* Tab Khusus Kepala Sekolah (Piagam Apresiasi) */}
        {staf.role === 'kepala_sekolah' && (
          <button
            onClick={() => setActiveTab('piagam')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'piagam'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span>🏆 Piagam Penghargaan Juara</span>
          </button>
        )}

        {/* Tab Tambahan untuk Kepala Sekolah (bisa akses semua) */}
        {staf.role === 'kepala_sekolah' && (
          <>
            <button
              onClick={() => setActiveTab('early_warning')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'early_warning'
                  ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Radar Disiplin</span>
            </button>

            <button
              onClick={() => setActiveTab('literasi')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'literasi'
                  ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Portofolio Literasi</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('hall_of_fame')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'hall_of_fame'
              ? 'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>🌟 Hall of Fame (Konsistensi & Effort)</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Monitoring Detail Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('suara')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'suara'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4 text-pink-500" />
          <span>💬 Suara Siswa ({suaraList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('arahan')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'arahan'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Riwayat Arahan ({arahanList.length})</span>
        </button>
      </div>

      {/* TAB: SUARA & ASPIRASI SISWA (ANONIM) */}
      {activeTab === 'suara' && (
        <SuaraSiswaModerationView
          suaraList={suaraList}
          siswaList={siswaList}
          kelasList={kelasList}
          stafList={stafList}
          currentStaf={staf}
          onRefreshData={() => loadData(true)}
        />
      )}

      {/* TAB: HALL OF FAME (KONSISTENSI, EFFORT & WALI KELAS ISTIQOMAH) */}
      {activeTab === 'hall_of_fame' && (
        <HallOfFameSection
          kelasList={kelasList}
          siswaList={siswaList}
          entries={entries}
          stafList={stafList}
          onSelectStudent={(s) => setSelectedStudent(s)}
        />
      )}

      {/* TAB: RADAR EARLY WARNING (KESISWAAN & BK) */}
      {activeTab === 'early_warning' && (
        <EarlyWarningRadar
          entries={entries}
          kelasList={kelasList}
          siswaList={siswaList}
          stafList={stafList}
          onOpenArahanModal={(targetKId, prefill) => {
            setTargetClassForArahan(targetKId);
            setIsArahanModalOpen(true);
          }}
          onOpenStudentDetail={(s) => setSelectedStudent(s)}
        />
      )}

      {/* TAB: PORTOFOLIO LITERASI (KURIKULUM) */}
      {activeTab === 'literasi' && (
        <PortofolioLiterasiView
          entries={entries}
          kelasList={kelasList}
          siswaList={siswaList}
          onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
        />
      )}

      {/* TAB: PIAGAM PENGHARGAAN JUARA (KEPALA SEKOLAH) */}
      {activeTab === 'piagam' && (
        <PiagamGeneratorSection
          kelasList={kelasList}
          siswaList={siswaList}
          entries={entries}
          stafList={stafList}
          feedbacks={feedbacks}
          kebiasaanList={kebiasaanList}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentStaf={staf}
          onGeneratePiagam={(p) => setPiagamData(p)}
        />
      )}

      {/* TAB: REKAP PER KELAS 7A - 9F */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <SchoolStatsOverview
            kebiasaanList={kebiasaanList}
            entries={entries}
            siswaList={siswaList}
            selectedDate={selectedDate}
          />

          <ClassComparisonTable
            kelasList={kelasList}
            siswaList={siswaList}
            entries={entries}
            stafList={stafList}
            selectedDate={selectedDate}
            onOpenArahanModal={(kId) => {
              setTargetClassForArahan(kId);
              setIsArahanModalOpen(true);
            }}
            onDrillDownClass={handleDrillDownClass}
          />
        </div>
      )}

      {/* TAB: MONITORING DETAIL SISWA */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter Kelas 7A - 9F */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Kelas (7A - 9F)</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa atau NISN..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Mode Baca Laporan (Read-Only)</span>
            </div>
          </div>

          <MatrixRekapTable
            siswaList={filteredSiswaList}
            kebiasaanList={kebiasaanList}
            entries={entries}
            selectedDate={selectedDate}
            onSelectStudent={(s) => setSelectedStudent(s)}
            searchQuery={searchQuery}
          />

          <ExportSharePanel
            namaKelas={getTargetClassName()}
            selectedDate={selectedDate}
            siswaList={filteredSiswaList}
            kebiasaanList={kebiasaanList}
            entries={entries}
          />
        </div>
      )}

      {/* TAB 3: RIWAYAT ARAHAN KE WALI KELAS */}
      {activeTab === 'arahan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">
              Daftar Arahan & Feedback untuk Wali Kelas
            </h3>
            <button
              onClick={() => {
                setTargetClassForArahan(kelasList[0]?.id || '');
                setIsArahanModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Tulis Arahan Baru</span>
            </button>
          </div>

          {arahanList.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              Belum ada arahan yang dikirim ke wali kelas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {arahanList.map((arahan) => {
                const targetK = kelasList.find((c) => c.id === arahan.kelas_id);
                const targetW = stafList.find((s) => s.id === targetK?.wali_kelas_id);
                const sender = stafList.find((s) => s.id === arahan.staf_pengirim_id);

                const getCategoryStyle = () => {
                  switch (arahan.kategori) {
                    case 'apresiasi':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    case 'evaluasi':
                      return 'bg-amber-100 text-amber-800 border-amber-300';
                    case 'instruksi':
                      return 'bg-blue-100 text-blue-800 border-blue-300';
                    case 'tindak_lanjut':
                      return 'bg-purple-100 text-purple-800 border-purple-300';
                  }
                };

                return (
                  <div
                    key={arahan.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                          Untuk: Kelas {targetK?.nama_kelas} ({targetW?.nama || 'Wali Kelas'})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryStyle()}`}>
                          {arahan.kategori}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm">
                        {arahan.judul}
                      </h4>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl mt-2 border border-slate-100">
                        "{arahan.pesan}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Dari: {sender?.nama || 'Pimpinan'}</span>
                      <button
                        onClick={() => handleDeleteArahan(arahan.id)}
                        className="text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Tulis Arahan ke Wali Kelas */}
      <ArahanWaliKelasModal
        isOpen={isArahanModalOpen}
        onClose={() => setIsArahanModalOpen(false)}
        kelasList={kelasList}
        stafList={stafList}
        currentStaf={staf}
        selectedKelasIdDefault={targetClassForArahan}
        onSendSuccess={handleSendArahan}
      />

      {/* Student Detail Modal (With direct feedback ability from School Leadership) */}
      <StudentDetailModal
        isOpen={Boolean(selectedStudent)}
        siswa={selectedStudent}
        entries={
          selectedStudent
            ? entries.filter((e) => e.siswa_id === selectedStudent.id && e.tanggal === selectedDate)
            : []
        }
        kebiasaanList={kebiasaanList}
        feedbacks={feedbacks}
        onClose={() => setSelectedStudent(null)}
        onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
        onDeleteEntry={() => {}}
        onAddFeedback={handleAddStudentFeedback}
        isReadOnly={false}
      />

      <PhotoViewerModal
        isOpen={Boolean(selectedEntryForPhoto)}
        entry={selectedEntryForPhoto}
        onClose={() => setSelectedEntryForPhoto(null)}
      />

      {/* Class Report Modal for Executive Leadership (KS, Kurikulum, Kesiswaan) */}
      <ClassReportModal
        isOpen={Boolean(selectedClassForReport)}
        kelas={selectedClassForReport}
        allKelas={kelasList}
        siswaList={siswaList}
        kebiasaanList={kebiasaanList}
        entries={entries}
        stafList={stafList}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onDataRefresh={loadData}
        currentStaf={staf}
        onClose={() => setSelectedClassForReport(null)}
      />

      {/* Piagam Penghargaan Modal */}
      <PiagamPenghargaanModal
        isOpen={Boolean(piagamData)}
        data={piagamData}
        onClose={() => setPiagamData(null)}
      />

      {/* Rapor Karakter Modal */}
      <RaporKarakterModal
        isOpen={Boolean(studentForRapor)}
        siswa={studentForRapor}
        entries={entries}
        kebiasaanList={kebiasaanList}
        namaKelas={kelasList.find((k) => k.id === studentForRapor?.kelas_id)?.nama_kelas || '-'}
        waliKelasNama={stafList.find((s) => s.id === kelasList.find((k) => k.id === studentForRapor?.kelas_id)?.wali_kelas_id)?.nama || 'Wali Kelas'}
        kepalaSekolahNama={stafList.find((s) => s.role === 'kepala_sekolah')?.nama || 'H. Abdul Kirom, M.Pd.'}
        kepalaSekolahNip={stafList.find((s) => s.role === 'kepala_sekolah')?.nip_atau_nik || '197508122002121003'}
        onClose={() => setStudentForRapor(null)}
      />
    </div>
  );
};
