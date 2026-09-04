import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Sliders, 
  FileSpreadsheet, 
  UploadCloud, 
  Search, 
  Filter, 
  RefreshCw, 
  Settings2, 
  Building2, 
  Layers, 
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  Trophy,
  Edit2,
  Pencil,
  MessageSquareHeart,
  Trash2,
  MessageCircle,
  UserPlus,
  HardDrive
} from 'lucide-react';
import { Kebiasaan, Kelas, Siswa, StafSekolah, EntriJurnal, SuaraSiswa } from '../../types/database';
import { JournalService } from '../../lib/journalService';
import { getTodayDateString } from '../../lib/timeCalculator';
import { MockDatabase } from '../../lib/mockStore';
import { DataImportSiswaModal } from './DataImportSiswaModal';
import { TambahSiswaModal } from './TambahSiswaModal';
import { DataImportStafModal } from './DataImportStafModal';
import { KebiasaanConfigModal } from './KebiasaanConfigModal';
import { PasswordManagerModal } from './PasswordManagerModal';
import { EditUserModal } from './EditUserModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { EditSchoolProfileModal } from './EditSchoolProfileModal';
import { KomunikasiSiswaGuruModal } from '../common/KomunikasiSiswaGuruModal';
import { useSchoolProfile } from '../../context/SchoolProfileContext';
import { ClassReportModal } from './ClassReportModal';
import { ClassComparisonTable } from '../pejabat/ClassComparisonTable';
import { ArahanWaliKelasModal } from '../pejabat/ArahanWaliKelasModal';
import { SuperadminLeaderboardView } from './SuperadminLeaderboardView';
import { StudentProgressOverview } from '../common/StudentProgressOverview';
import { SuaraSiswaModerationView } from '../common/SuaraSiswaModerationView';
import { StorageManagerModal } from './StorageManagerModal';
import { APP_VERSION } from '../../lib/version';

interface SuperadminDashboardProps {
  staf: StafSekolah;
}

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({ staf }) => {
  const { profile } = useSchoolProfile();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'monitoring' | 'suara' | 'siswa' | 'staf' | 'kebiasaan'>('leaderboard');
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [stafList, setStafList] = useState<StafSekolah[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kebiasaanList, setKebiasaanList] = useState<Kebiasaan[]>([]);
  const [entries, setEntries] = useState<EntriJurnal[]>([]);
  const [suaraList, setSuaraList] = useState<SuaraSiswa[]>([]);

  // Search & Filter
  const [searchSiswa, setSearchSiswa] = useState('');
  const [filterKelasSiswa, setFilterKelasSiswa] = useState('all');
  const [searchStaf, setSearchStaf] = useState('');

  // Password visibility states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Modals
  const [isImportSiswaOpen, setIsImportSiswaOpen] = useState(false);
  const [isImportStafOpen, setIsImportStafOpen] = useState(false);
  const [selectedHabitForConfig, setSelectedHabitForConfig] = useState<Kebiasaan | null>(null);
  const [isArahanModalOpen, setIsArahanModalOpen] = useState(false);
  const [targetClassForArahan, setTargetClassForArahan] = useState('');
  
  // Password Manager Modal & Class Report Modal & Edit User Modal & Delete Student Modal
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<{
    type: 'siswa' | 'staf';
    data: Siswa | StafSekolah;
  } | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<{
    type: 'siswa' | 'staf';
    data: Siswa | StafSekolah;
  } | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Siswa | null>(null);
  const [selectedClassForReport, setSelectedClassForReport] = useState<Kelas | null>(null);
  const [isSchoolProfileModalOpen, setIsSchoolProfileModalOpen] = useState(false);
  const [isKomunikasiModalOpen, setIsKomunikasiModalOpen] = useState(false);
  const [isTambahSiswaManualOpen, setIsTambahSiswaManualOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const loadAllData = async (forceRefresh: boolean = false) => {
    try {
      const [allKelas, allStaf, allSiswa, habits, allEntries, allSuara] = await Promise.all([
        JournalService.getKelas(),
        JournalService.getStaf(),
        JournalService.getSiswa(undefined, forceRefresh),
        JournalService.getKebiasaan(),
        JournalService.getEntriJurnal(undefined, undefined, forceRefresh),
        JournalService.getSuaraSiswaList()
      ]);

      setKelasList(allKelas);
      setStafList(allStaf);
      setSiswaList(allSiswa);
      setKebiasaanList(habits.sort((a, b) => a.urutan - b.urutan));
      setEntries(allEntries);
      setSuaraList(allSuara);
    } catch (e) {
      console.warn('Error loading superadmin data:', e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleResetDatabase = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi default awal?')) {
      MockDatabase.resetToDefault();
      loadAllData();
      alert('Database telah direset ke kondisi awal.');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper konversi Tanggal Lahir -> Format Password DDMMYYYY
  const getFormattedDobPassword = (dob?: string) => {
    if (!dob) return '01012011';
    try {
      const [yyyy, mm, dd] = dob.split('-');
      if (yyyy && mm && dd) {
        return `${dd}${mm}${yyyy}`;
      }
    } catch (_) {
      // fallback
    }
    return dob.replace(/[^0-9]/g, '');
  };

  // Handler Hapus Siswa dari Database / Kelas
  const handleConfirmDeleteStudent = async (siswaId: string) => {
    await JournalService.deleteSiswa(siswaId);
    await loadAllData();
  };

  // Filtered Siswa
  const filteredSiswa = siswaList.filter((s) => {
    const matchKelas = filterKelasSiswa === 'all' || s.kelas_id === filterKelasSiswa;
    const matchSearch = s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) || s.nisn.includes(searchSiswa);
    return matchKelas && matchSearch;
  });

  // Filtered Staf
  const filteredStaf = stafList.filter((st) => {
    return st.nama.toLowerCase().includes(searchStaf.toLowerCase()) || st.nip_atau_nik.includes(searchStaf);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Top Banner Dashboard Superadmin */}
      <div className="rounded-3xl p-6 sm:p-8 bg-linear-to-br from-purple-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-purple-900/20 border border-purple-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold backdrop-blur-sm border border-purple-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Hak Akses Tertinggi • Super Administrator</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-400/30 text-white font-mono text-[10px] font-bold">
              v{APP_VERSION}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panel Kendali Superadmin {profile.nama}
          </h2>
          <p className="text-xs text-purple-200/80 mt-1 max-w-2xl">
            Kelola data {siswaList.length} Siswa, {stafList.length} Pendidik & Staf, rename data, lihat serta ubah password, pantau radar siswa tidak aktif 3 hari, dan periksa laporan {kelasList.length} kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Kelola kuota Supabase, unduh backup foto ZIP, bersihkan storage & Google Drive"
          >
            <HardDrive className="w-4 h-4 text-white" />
            <span>💾 Backup & Kuota Foto</span>
          </button>
          <button
            onClick={() => setIsKomunikasiModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Kirim pesan langsung dan bimbingan ke siswa"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>💬 Komunikasi Siswa</span>
          </button>
          <button
            onClick={() => setIsSchoolProfileModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Kustomisasi nama sekolah, logo, motto, dan kontak"
          >
            <Building2 className="w-4 h-4 text-slate-950" />
            <span>⚙️ Profil & Logo Sekolah</span>
          </button>
          <button
            onClick={() => loadAllData(true)}
            title="Refresh Data Cloud"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetDatabase}
            title="Reset Database ke Default"
            className="px-3.5 py-2.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-bold text-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Siswa Riil</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{siswaList.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Tersinkronisasi Cloud</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Staf & Guru</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{stafList.length}</p>
          <span className="text-[11px] text-slate-400">Kepsek, Waka, Kesiswaan & 18 Wali Kelas</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Rombongan Belajar</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{kelasList.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium">18 Kelas (7A s.d 9F)</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Entri Jurnal</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{entries.length}</p>
          <span className="text-[11px] text-slate-400">Bukti 7 Kebiasaan Tersimpan</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400 font-extrabold'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>🏆 Leaderboard & Prestasi</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'monitoring'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📊 Progress Siswa & Radar 3 Hari</span>
        </button>

        <button
          onClick={() => setActiveTab('suara')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'suara'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4" />
          <span>💬 Suara Siswa ({suaraList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'siswa'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola, Rename & Password Siswa ({siswaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staf')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'staf'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Kelola, Rename & Password Staf ({stafList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kebiasaan')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kebiasaan'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Konfigurasi 7 Kebiasaan</span>
        </button>

        <button
          onClick={() => setIsStorageModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap bg-linear-to-r from-rose-50 to-amber-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
          title="Buka panel manajemen penyimpanan dan kuota foto"
        >
          <HardDrive className="w-4 h-4 text-rose-600" />
          <span>💾 Backup & Kuota Foto</span>
        </button>
      </div>

      {/* TAB 0: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <SuperadminLeaderboardView
          kelasList={kelasList}
          siswaList={siswaList}
          entries={entries}
          stafList={stafList}
          kebiasaanList={kebiasaanList}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefreshData={() => loadAllData(true)}
          onSelectClassReport={(k) => setSelectedClassForReport(k)}
        />
      )}

      {/* TAB 1: MONITORING & PROGRESS OVERVIEW + RADAR 3 HARI */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <StudentProgressOverview
            entries={entries}
            kelasList={kelasList}
            siswaList={siswaList}
            stafList={stafList}
            kebiasaanList={kebiasaanList}
            selectedDate={selectedDate}
            currentUser={staf}
            onOpenArahanModal={(kId) => {
              setTargetClassForArahan(kId);
              setIsArahanModalOpen(true);
            }}
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
            onDrillDownClass={(kId) => {
              const targetK = kelasList.find((c) => c.id === kId);
              if (targetK) {
                setSelectedClassForReport(targetK);
              }
            }}
          />
        </div>
      )}

      {/* TAB: SUARA & ASPIRASI SISWA */}
      {activeTab === 'suara' && (
        <SuaraSiswaModerationView
          suaraList={suaraList}
          siswaList={siswaList}
          kelasList={kelasList}
          stafList={stafList}
          currentStaf={staf}
          onRefreshData={() => loadAllData(true)}
        />
      )}

      {/* TAB 2: KELOLA SISWA (RENAME & PASSWORD) */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              {/* Filter Rombel / Kelas */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterKelasSiswa}
                  onChange={(e) => setFilterKelasSiswa(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all">Semua Rombel (18 Kelas)</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Cari Siswa */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchSiswa}
                  onChange={(e) => setSearchSiswa(e.target.value)}
                  placeholder="Cari siswa atau NISN..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Tombol Tambah Siswa Manual & Import CSV/XLSX */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsTambahSiswaManualOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Siswa Manual</span>
              </button>

              <button
                onClick={() => setIsImportSiswaOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import Siswa (CSV/Excel)</span>
              </button>
            </div>
          </div>

          {/* Tabel Siswa */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">NISN (Username)</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 text-center">Kelas</th>
                    <th className="py-3 px-4">Tanggal Lahir</th>
                    <th className="py-3 px-4 text-center">Password Login (DDMMYYYY)</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSiswa.slice(0, 100).map((s, idx) => {
                    const k = kelasList.find((c) => c.id === s.kelas_id);
                    const formattedPass = getFormattedDobPassword(s.tanggal_lahir);
                    const isVisible = visiblePasswords[s.id];

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-purple-900">{s.nisn}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{s.nama}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {k?.nama_kelas || '7A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{s.tanggal_lahir}</td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-800 font-bold">
                            <span>{isVisible ? formattedPass : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(s.id)}
                              className="p-1 text-slate-400 hover:text-purple-700 transition"
                              title={isVisible ? 'Sembunyikan' : 'Lihat Password'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedUserForEdit({ type: 'siswa', data: s })}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition flex items-center gap-1 active:scale-95"
                              title="Edit / Rename Siswa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => setSelectedUserForPassword({ type: 'siswa', data: s })}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition flex items-center gap-1 active:scale-95"
                              title="Lihat atau Ganti Password Siswa"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Password</span>
                            </button>
                            <button
                              onClick={() => setSelectedStudentForDelete(s)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition flex items-center gap-1 active:scale-95"
                              title="Hapus Siswa dari Kelas & Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredSiswa.length > 100 && (
              <div className="p-3 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
                Menampilkan 100 dari total {filteredSiswa.length} siswa (Gunakan filter kelas/pencarian).
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA STAF (RENAME & PASSWORD) */}
      {activeTab === 'staf' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchStaf}
                onChange={(e) => setSearchStaf(e.target.value)}
                placeholder="Cari staf atau NIP/NIK..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Tombol Import CSV/XLSX Staf */}
            <button
              onClick={() => setIsImportStafOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Staf (CSV/Excel)</span>
            </button>
          </div>

          {/* Tabel Staf */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">NIP / NIK / Username</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Role / Jabatan</th>
                    <th className="py-3 px-4 text-center">Kelas Binaan</th>
                    <th className="py-3 px-4 text-center">Password Login</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaf.map((st, idx) => {
                    const k = kelasList.find((c) => c.id === st.kelas_id);
                    const formattedPass = st.role === 'superadmin' ? '060894' : getFormattedDobPassword(st.tanggal_lahir);
                    const isVisible = visiblePasswords[st.id];

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-900">{st.nip_atau_nik}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{st.nama}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">
                          <span className="uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {st.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {k ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                              Kelas {k.nama_kelas}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-800 font-bold">
                            <span>{isVisible ? formattedPass : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(st.id)}
                              className="p-1 text-slate-400 hover:text-indigo-700 transition"
                              title={isVisible ? 'Sembunyikan' : 'Lihat Password'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedUserForEdit({ type: 'staf', data: st })}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition flex items-center gap-1 active:scale-95"
                              title="Edit / Rename Data Staf"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => setSelectedUserForPassword({ type: 'staf', data: st })}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition flex items-center gap-1 active:scale-95"
                              title="Lihat atau Ganti Password Staf"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Password</span>
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
      )}

      {/* TAB 4: KONFIGURASI 7 KEBIASAAN */}
      {activeTab === 'kebiasaan' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800 text-sm">
                  Aturan Parameter 7 Kebiasaan Resmi Kemendikdasmen
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  Operasional: 01.00 - 24.00 WIB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pengisian jurnal aktif setiap hari dari pukul 01:00 s.d 24:00 WIB. Klik ikon ubah aturan untuk menyesuaikan target jam ideal, toleransi waktu, dan batas submisi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kebiasaanList.map((k) => (
              <div
                key={k.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Urutan #{k.urutan}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Maks: {k.maks_input_harian}x / hari
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{k.nama}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{k.deskripsi}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    {k.jam_mulai && k.jam_selesai ? (
                      <span>{k.jam_mulai} - {k.jam_selesai} (+{k.toleransi_menit}m)</span>
                    ) : (
                      <span className="text-slate-400 italic">Fleksibel / Sesuai Waktu</span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedHabitForConfig(k)}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition flex items-center gap-1"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Konfigurasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <DataImportSiswaModal
        isOpen={isImportSiswaOpen}
        onClose={() => setIsImportSiswaOpen(false)}
        kelasList={kelasList}
        onImportSuccess={loadAllData}
      />

      <TambahSiswaModal
        isOpen={isTambahSiswaManualOpen}
        onClose={() => setIsTambahSiswaManualOpen(false)}
        kelasList={kelasList}
        onSuccess={async (newStudent) => {
          await loadAllData(true);
          alert(`Siswa ${newStudent.nama} (NISN: ${newStudent.nisn}) berhasil ditambahkan ke kelas!`);
        }}
      />

      <DataImportStafModal
        isOpen={isImportStafOpen}
        onClose={() => setIsImportStafOpen(false)}
        kelasList={kelasList}
        onImportSuccess={loadAllData}
      />

      <KebiasaanConfigModal
        isOpen={Boolean(selectedHabitForConfig)}
        kebiasaan={selectedHabitForConfig}
        onClose={() => setSelectedHabitForConfig(null)}
        onSaveSuccess={loadAllData}
      />

      <PasswordManagerModal
        isOpen={Boolean(selectedUserForPassword)}
        targetUser={selectedUserForPassword}
        onClose={() => setSelectedUserForPassword(null)}
        onSuccess={loadAllData}
      />

      <EditUserModal
        isOpen={Boolean(selectedUserForEdit)}
        targetUser={selectedUserForEdit}
        kelasList={kelasList}
        onClose={() => setSelectedUserForEdit(null)}
        onSuccess={loadAllData}
      />

      <DeleteStudentModal
        isOpen={Boolean(selectedStudentForDelete)}
        siswa={selectedStudentForDelete}
        kelasList={kelasList}
        onClose={() => setSelectedStudentForDelete(null)}
        onConfirmDelete={handleConfirmDeleteStudent}
      />

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
        onDataRefresh={loadAllData}
        currentStaf={staf}
        onClose={() => setSelectedClassForReport(null)}
      />

      <ArahanWaliKelasModal
        isOpen={isArahanModalOpen}
        onClose={() => setIsArahanModalOpen(false)}
        kelasList={kelasList}
        stafList={stafList}
        currentStaf={staf}
        selectedKelasIdDefault={targetClassForArahan}
        onSendSuccess={async (kId, kat, jud, pes) => {
          await JournalService.sendArahanWaliKelas(staf.id, kId, kat, jud, pes);
          await loadAllData();
        }}
      />

      <EditSchoolProfileModal
        isOpen={isSchoolProfileModalOpen}
        onClose={() => setIsSchoolProfileModalOpen(false)}
      />

      <KomunikasiSiswaGuruModal
        isOpen={isKomunikasiModalOpen}
        onClose={() => setIsKomunikasiModalOpen(false)}
        currentUser={{ type: 'staf', data: staf }}
        kelasList={kelasList}
        siswaList={siswaList}
        stafList={stafList}
      />

      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        entries={entries}
        siswaList={siswaList}
        kelasList={kelasList}
        kebiasaanList={kebiasaanList}
        onDataRefresh={() => loadAllData(true)}
      />
    </div>
  );
};
