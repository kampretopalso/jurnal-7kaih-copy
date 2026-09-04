import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Sunrise, 
  HeartHandshake, 
  Activity, 
  Utensils, 
  Moon, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  FileSpreadsheet, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles,
  Eye,
  FileText,
  Calendar,
  Send,
  BellRing,
  Copy,
  Check,
  X
} from 'lucide-react';
import { EntriJurnal, Kebiasaan, Kelas, Siswa, StafSekolah } from '../../types/database';
import { getTodayDateString } from '../../lib/timeCalculator';
import { JournalService } from '../../lib/journalService';
import * as XLSX from 'xlsx';

interface StudentProgressOverviewProps {
  entries: EntriJurnal[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  stafList: StafSekolah[];
  kebiasaanList: Kebiasaan[];
  selectedDate?: string;
  currentUser?: StafSekolah | null;
  onOpenStudentDetail?: (siswa: Siswa) => void;
  onOpenArahanModal?: (targetKelasId: string, prefillMessage: string) => void;
}

export const StudentProgressOverview: React.FC<StudentProgressOverviewProps> = ({
  entries,
  kelasList,
  siswaList,
  stafList,
  kebiasaanList,
  selectedDate,
  currentUser,
  onOpenStudentDetail,
  onOpenArahanModal
}) => {
  const todayStr = selectedDate || getTodayDateString();

  // Helper untuk default date range (7 hari terakhir s.d hari ini)
  const defaultStartDate = useMemo(() => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, [todayStr]);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [activePreset, setActivePreset] = useState<string>('7days');

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'inactive3days'>('overview');

  // State Modal Bulk Warning
  const [showBulkWarningModal, setShowBulkWarningModal] = useState<boolean>(false);
  const [bulkJudul, setBulkJudul] = useState<string>('Peringatan Dini: Siswa Tidak Aktif Mengisi Jurnal 3 Hari Berturut-turut');
  const [bulkPesan, setBulkPesan] = useState<string>('Berdasarkan pemantauan sistem, terdapat siswa di kelas binaan Bapak/Ibu yang tidak aktif mengisi jurnal selama 3 hari berturut-turut. Mohon segera lakukan pendampingan dan pembinaan intensif.');
  const [isSendingBulk, setIsSendingBulk] = useState<boolean>(false);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'today' | '7days' | '30days' | 'month' | 'semester') => {
    setActivePreset(preset);
    const now = new Date(todayStr);
    
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'semester') {
      const month = now.getMonth();
      const semesterStart = month >= 6
        ? new Date(now.getFullYear(), 6, 1) // 1 Juli
        : new Date(now.getFullYear(), 0, 1); // 1 Januari
      setStartDate(semesterStart.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filter entri dalam rentang tanggal yang dipilih
  const rangeEntries = useMemo(() => {
    return entries.filter((e) => e.tanggal >= startDate && e.tanggal <= endDate);
  }, [entries, startDate, endDate]);

  // Evaluasi 3 Hari Terakhir untuk Deteksi Inaktivitas
  const last3Days = useMemo(() => {
    const dates: string[] = [];
    const baseDate = new Date(endDate);
    for (let i = 0; i < 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [endDate]);

  // Evaluasi Siswa yang Tidak Mengisi 3 Hari Berturut-turut
  const inactive3DaysStudents = useMemo(() => {
    return siswaList.map((siswa) => {
      const studentEntriesLast3Days = entries.filter(
        (e) => e.siswa_id === siswa.id && last3Days.includes(e.tanggal)
      );

      const allStudentEntries = entries.filter((e) => e.siswa_id === siswa.id);
      const allDates = Array.from(new Set(allStudentEntries.map((e) => e.tanggal))).sort();
      const lastActiveDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

      let daysSinceLast = 0;
      if (!lastActiveDate) {
        daysSinceLast = 999;
      } else {
        const diff = Math.round(
          (new Date(endDate).getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        daysSinceLast = Math.max(diff, 0);
      }

      const kelas = kelasList.find((k) => k.id === siswa.kelas_id);
      const waliKelas = stafList.find((s) => s.id === kelas?.wali_kelas_id);

      return {
        siswa,
        namaKelas: kelas?.nama_kelas || '-',
        tingkat: kelas?.tingkat || 7,
        waliKelasNama: waliKelas?.nama || 'Wali Kelas',
        waliKelasNip: waliKelas?.nip_atau_nik || '-',
        isInactive3Days: studentEntriesLast3Days.length === 0,
        entriesCountLast3Days: studentEntriesLast3Days.length,
        lastActiveDate,
        daysSinceLast
      };
    }).filter((item) => item.isInactive3Days);
  }, [siswaList, entries, last3Days, endDate, kelasList, stafList]);

  // Rekap jumlah siswa tidak aktif per kelas
  const inactiveCountPerClass = useMemo(() => {
    const map: Record<string, { kelas: Kelas; count: number; waliKelas: string }> = {};
    kelasList.forEach((k) => {
      const wali = stafList.find((s) => s.id === k.wali_kelas_id);
      map[k.id] = {
        kelas: k,
        count: 0,
        waliKelas: wali?.nama || 'Wali Kelas'
      };
    });

    inactive3DaysStudents.forEach((item) => {
      if (item.siswa.kelas_id && map[item.siswa.kelas_id]) {
        map[item.siswa.kelas_id].count += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [kelasList, stafList, inactive3DaysStudents]);

  // Daftar kelas yang memiliki siswa tidak aktif untuk bulk warning
  const classesWithInactiveStudents = useMemo(() => {
    return inactiveCountPerClass.filter(c => c.count > 0);
  }, [inactiveCountPerClass]);

  // Filter siswa tidak aktif sesuai dropdown & pencarian
  const filteredInactiveList = useMemo(() => {
    return inactive3DaysStudents.filter((item) => {
      const matchKelas = selectedClassFilter === 'all' || item.siswa.kelas_id === selectedClassFilter;
      const matchQuery = item.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.siswa.nisn.includes(searchQuery);
      return matchKelas && matchQuery;
    });
  }, [inactive3DaysStudents, selectedClassFilter, searchQuery]);

  // Hitung jumlah hari unik dalam rentang
  const daysCountInRange = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [startDate, endDate]);

  // Distribusi Tingkat Kepatuhan dalam Rentang Tanggal
  const complianceDistribution = useMemo(() => {
    let perfect = 0; // >= 90%
    let high = 0;    // 70-89%
    let medium = 0;  // 40-69%
    let low = 0;     // 1-39%
    let zero = 0;    // 0%

    siswaList.forEach((siswa) => {
      const studentEntries = rangeEntries.filter((e) => e.siswa_id === siswa.id);
      const totalPossible = daysCountInRange * 7;
      const completedDistinctPerDay = studentEntries.length;
      const percentage = totalPossible > 0 ? (completedDistinctPerDay / totalPossible) * 100 : 0;

      if (completedDistinctPerDay === 0) zero++;
      else if (percentage >= 90) perfect++;
      else if (percentage >= 70) high++;
      else if (percentage >= 40) medium++;
      else low++;
    });

    return { perfect, high, medium, low, zero };
  }, [siswaList, rangeEntries, daysCountInRange]);

  // Rata-rata kepatuhan sekolah dalam rentang
  const averageComplianceRate = useMemo(() => {
    if (siswaList.length === 0 || daysCountInRange === 0) return 0;
    const totalPossible = siswaList.length * 7 * daysCountInRange;
    const totalFilled = rangeEntries.length;
    return Math.round((totalFilled / totalPossible) * 100);
  }, [siswaList, rangeEntries, daysCountInRange]);

  // Performa Per Kebiasaan dalam Rentang
  const habitPerformance = useMemo(() => {
    return kebiasaanList.map((k) => {
      const habitEntries = rangeEntries.filter((e) => e.kebiasaan_id === k.id);
      const totalExpected = siswaList.length * daysCountInRange;
      const submittedCount = habitEntries.length;
      const percentage = totalExpected > 0 ? Math.round((submittedCount / totalExpected) * 100) : 0;
      
      const wordCountValid = k.id === 5 
        ? habitEntries.filter((e) => (e.catatan || '').trim().split(/\s+/).filter(Boolean).length >= 100).length
        : null;

      return {
        kebiasaan: k,
        submittedCount,
        percentage,
        wordCountValid
      };
    });
  }, [kebiasaanList, rangeEntries, siswaList, daysCountInRange]);

  // Export Excel Siswa Tidak Aktif 3 Hari
  const handleExportInactiveExcel = () => {
    const exportData = filteredInactiveList.map((item, idx) => ({
      No: idx + 1,
      NISN: item.siswa.nisn,
      'Nama Siswa': item.siswa.nama,
      Kelas: `Kelas ${item.namaKelas}`,
      'Wali Kelas': item.waliKelasNama,
      'Terakhir Mengisi Jurnal': item.lastActiveDate || 'Belum Pernah',
      'Lama Tidak Mengisi (Hari)': item.daysSinceLast >= 999 ? 'Belum Pernah' : `${item.daysSinceLast} Hari`,
      Status: 'Tidak Mengisi 3+ Hari Berturut-turut'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa Tidak Aktif 3 Hari');
    XLSX.writeFile(wb, `Laporan_Siswa_Tidak_Aktif_3Hari_SMPN2Glagah_${endDate}.xlsx`);
  };

  // Kirim Bulk Peringatan ke Semua Wali Kelas
  const handleSendBulkWarning = async () => {
    if (!currentUser) return;
    setIsSendingBulk(true);
    try {
      const targetKelasIds = classesWithInactiveStudents.map(c => c.kelas.id);
      await JournalService.kirimBulkArahan(
        currentUser.id,
        targetKelasIds,
        'evaluasi',
        bulkJudul,
        bulkPesan
      );
      setShowBulkWarningModal(false);
      alert(`✅ Berhasil mengirimkan peringatan resmi ke ${targetKelasIds.length} Wali Kelas!`);
    } catch (e) {
      alert('Gagal mengirim peringatan massal: ' + e);
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Generate WhatsApp Broadcast Text untuk Peringatan Massal
  const handleCopyWhatsAppBroadcast = () => {
    let msg = `*🚨 PERINGATAN DINI KESISWAAN - SISWA TIDAK AKTIF (≥ 3 HARI)*\n`;
    msg += `*SMP Negeri 2 Glagah • Per Tanggal:* ${endDate}\n\n`;
    msg += `Yth. Bapak/Ibu Wali Kelas,\n`;
    msg += `Berdasarkan pantauan sistem Jurnal 7 KAIH, berikut adalah rincian siswa yang belum mengisi jurnal 3 hari berturut-turut:\n\n`;

    classesWithInactiveStudents.forEach((c) => {
      const studentsInThisClass = inactive3DaysStudents.filter(s => s.siswa.kelas_id === c.kelas.id);
      msg += `📌 *Kelas ${c.kelas.nama_kelas}* (Wali: ${c.waliKelas}) - *${c.count} Siswa:*\n`;
      studentsInThisClass.forEach((st, idx) => {
        msg += `   ${idx + 1}. ${st.siswa.nama} (${st.siswa.nisn}) • Terakhir: ${st.lastActiveDate || 'Belum Pernah'}\n`;
      });
      msg += `\n`;
    });

    msg += `_Mohon kesediaan Bapak/Ibu Wali Kelas untuk segera melakukan konfirmasi dan pembinaan kepada siswa atau menghubungi orang tua._\n\n`;
    msg += `_Terima kasih atas kerja sama dan dedikasi Bapak/Ibu._\n`;
    msg += `_Tim Kesiswaan & Manajemen SMP Negeri 2 Glagah_`;

    navigator.clipboard.writeText(msg);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const getHabitIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sunrise': return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-emerald-500" />;
      case 'Activity': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Utensils': return <Utensils className="w-5 h-5 text-green-500" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'Users': return <Users className="w-5 h-5 text-purple-500" />;
      case 'Moon': return <Moon className="w-5 h-5 text-indigo-400" />;
      default: return <Sparkles className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Filter & Date Range Picker */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 inline-block mb-1">
              📊 Evaluasi & Progress Kepatuhan Siswa
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Dashboard Perkembangan Pembiasaan Karakter
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis menyeluruh keterlibatan 563 siswa, capaian 7 kebiasaan, serta radar peringatan dini inaktivitas.
            </p>
          </div>

          {/* Sub-Tab Navigation (2 Tabs Bersih Tanpa Duplikasi) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ringkasan 7 Kebiasaan</span>
            </button>
            <button
              onClick={() => setActiveSubTab('inactive3days')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
                activeSubTab === 'inactive3days'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Radar Pasif 3+ Hari</span>
              {inactive3DaysStudents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-400 text-slate-950">
                  {inactive3DaysStudents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Date Range Controls & Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Rentang:
            </span>
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari Terakhir' },
              { id: '30days', label: '30 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'semester', label: 'Semester Ini' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSetPreset(p.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  activePreset === p.id
                    ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-purple-600" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-white px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
              />
              <span className="text-slate-400 font-normal">s.d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-white px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>
            <span className="text-[10px] text-purple-700 bg-purple-100 font-extrabold px-2 py-0.5 rounded-md ml-1">
              {daysCountInRange} Hari
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Total Siswa Aktif</span>
            <span className="text-2xl font-extrabold text-slate-800">{siswaList.length}</span>
            <span className="text-[10px] text-slate-500 block">18 Rombel (7A-9F)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Entri Terkumpul</span>
            <span className="text-2xl font-extrabold text-emerald-600">{rangeEntries.length.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-slate-500 block">Rentang {daysCountInRange} Hari</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Rata-rata Kepatuhan</span>
            <span className="text-2xl font-extrabold text-purple-600">{averageComplianceRate}%</span>
            <span className="text-[10px] text-slate-500 block">Target Sekolah: &gt; 80%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Pasif 3+ Hari</span>
            <span className="text-2xl font-extrabold text-rose-600">{inactive3DaysStudents.length}</span>
            <span className="text-[10px] text-rose-600 font-bold block">Perlu Pembinaan</span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW & 7 KEBIASAAN */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Distribusi 5 Level Kepatuhan Siswa */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">
                  Distribusi Kepatuhan Siswa ({startDate === endDate ? `Tanggal ${startDate}` : `${startDate} s.d ${endDate}`})
                </h4>
                <p className="text-xs text-slate-500">
                  Pengelompokan siswa berdasarkan intensitas ketercapaian 7 kebiasaan pada rentang waktu terpilih.
                </p>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(complianceDistribution.perfect / (siswaList.length || 1)) * 100}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`🌟 Sangat Tertib (90-100%): ${complianceDistribution.perfect} Siswa`}
              />
              <div
                style={{ width: `${(complianceDistribution.high / (siswaList.length || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`🟢 Sangat Aktif (70-89%): ${complianceDistribution.high} Siswa`}
              />
              <div
                style={{ width: `${(complianceDistribution.medium / (siswaList.length || 1)) * 100}%` }}
                className="bg-blue-500 h-full transition-all duration-500"
                title={`🟡 Cukup Aktif (40-69%): ${complianceDistribution.medium} Siswa`}
              />
              <div
                style={{ width: `${(complianceDistribution.low / (siswaList.length || 1)) * 100}%` }}
                className="bg-purple-500 h-full transition-all duration-500"
                title={`⚪ Mulai Aktif (1-39%): ${complianceDistribution.low} Siswa`}
              />
              <div
                style={{ width: `${(complianceDistribution.zero / (siswaList.length || 1)) * 100}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`🔴 Belum Mengisi (0%): ${complianceDistribution.zero} Siswa`}
              />
            </div>

            {/* Legend Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Sangat Tertib (&ge;90%)
                </span>
                <span className="text-lg font-black text-amber-950 mt-1 block">
                  {complianceDistribution.perfect} <span className="text-xs font-normal text-amber-700">siswa</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Sangat Aktif (70-89%)
                </span>
                <span className="text-lg font-black text-emerald-950 mt-1 block">
                  {complianceDistribution.high} <span className="text-xs font-normal text-emerald-700">siswa</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Cukup Aktif (40-69%)
                </span>
                <span className="text-lg font-black text-blue-950 mt-1 block">
                  {complianceDistribution.medium} <span className="text-xs font-normal text-blue-700">siswa</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Mulai Aktif (1-39%)
                </span>
                <span className="text-lg font-black text-purple-950 mt-1 block">
                  {complianceDistribution.low} <span className="text-xs font-normal text-purple-700">siswa</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Belum Mengisi (0%)
                </span>
                <span className="text-lg font-black text-rose-950 mt-1 block">
                  {complianceDistribution.zero} <span className="text-xs font-normal text-rose-700">siswa</span>
                </span>
              </div>
            </div>
          </div>

          {/* 7 Kartu Capaian Kebiasaan Kemendikdasmen */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Capaian Partisipasi 7 Kebiasaan Kemendikdasmen</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {habitPerformance.map((item) => (
                <div
                  key={item.kebiasaan.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {getHabitIcon(item.kebiasaan.icon_name)}
                      </div>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {item.percentage}%
                      </span>
                    </div>

                    <h5 className="font-extrabold text-slate-800 text-sm">
                      {item.kebiasaan.urutan}. {item.kebiasaan.nama}
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {item.kebiasaan.deskripsi}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Total Entri Masuk:</span>
                      <span className="text-slate-900 font-mono">{item.submittedCount.toLocaleString('id-ID')}</span>
                    </div>

                    {item.wordCountValid !== null && (
                      <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 font-medium">
                        ✍️ Refleksi &ge;100 Kata: <span className="font-bold">{item.wordCountValid} entri</span>
                      </div>
                    )}

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RADAR PASIF 3 HARI */}
      {activeSubTab === 'inactive3days' && (
        <div className="space-y-6">
          {/* Header Banner Radar Inaktivitas */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-rose-950 via-red-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center text-rose-200 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/30 px-2.5 py-0.5 rounded-full border border-rose-400/30 inline-block mb-1">
                  Radar Pembinaan Kesiswaan & Wali Kelas
                </span>
                <h4 className="text-xl font-extrabold text-white">
                  Siswa Tidak Mengisi Jurnal 3 Hari Berturut-turut
                </h4>
                <p className="text-xs text-rose-200 mt-0.5">
                  Mendeteksi siswa yang 0 entri pada rentang 3 hari terakhir ({last3Days[2]} s.d {last3Days[0]}).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyWhatsAppBroadcast}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
                title="Salin Pesan Broadcast WhatsApp untuk Grup Wali Kelas"
              >
                {copiedWA ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWA ? 'Tersalin ke Clipboard!' : 'Copy WA Broadcast'}</span>
              </button>

              {currentUser && (
                <button
                  onClick={() => setShowBulkWarningModal(true)}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>Kirim Bulk Peringatan ({classesWithInactiveStudents.length} Kelas)</span>
                </button>
              )}

              <button
                onClick={handleExportInactiveExcel}
                className="px-3.5 py-2.5 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Sebaran Inaktivitas Per Rombel (18 Kelas) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h5 className="font-extrabold text-slate-800 text-sm">
              Sebaran Siswa Tidak Aktif di 18 Rombongan Belajar (Kelas 7A - 9F):
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {inactiveCountPerClass.map((c) => (
                <button
                  key={c.kelas.id}
                  onClick={() => setSelectedClassFilter(selectedClassFilter === c.kelas.id ? 'all' : c.kelas.id)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedClassFilter === c.kelas.id
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : c.count > 0
                      ? 'bg-rose-50/70 border-rose-200 text-slate-800 hover:bg-rose-100/80'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${selectedClassFilter === c.kelas.id ? 'text-white' : 'text-slate-800'}`}>
                      Kelas {c.kelas.nama_kelas}
                    </span>
                    <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
                      selectedClassFilter === c.kelas.id
                        ? 'bg-white text-rose-900'
                        : c.count > 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {c.count}
                    </span>
                  </div>
                  <span className={`text-[10px] truncate block mt-1 ${selectedClassFilter === c.kelas.id ? 'text-rose-100' : 'text-slate-400'}`}>
                    {c.waliKelas}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Detail Siswa Tidak Aktif */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  Daftar Siswa Tidak Aktif ({filteredInactiveList.length} Siswa)
                </span>
                {selectedClassFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedClassFilter('all')}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    (Reset Filter Rombel)
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa atau NISN..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-5">No</th>
                    <th className="p-3.5">NISN & Nama Siswa</th>
                    <th className="p-3.5">Rombel</th>
                    <th className="p-3.5">Wali Kelas</th>
                    <th className="p-3.5">Terakhir Mengisi</th>
                    <th className="p-3.5">Lama Pasif</th>
                    <th className="p-3.5 pr-5 text-right">Aksi Pembinaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInactiveList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">Semua Siswa Terpantau Aktif</p>
                        <p className="text-xs">Tidak ditemukan siswa yang tidak mengisi jurnal 3 hari berturut-turut pada filter ini.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInactiveList.map((item, idx) => (
                      <tr key={item.siswa.id} className="hover:bg-rose-50/40 transition">
                        <td className="p-3.5 pl-5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 block text-xs">{item.siswa.nama}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.siswa.nisn}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Kelas {item.namaKelas}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-slate-700 block">{item.waliKelasNama}</span>
                          <span className="text-[10px] text-slate-400 font-mono">NIP: {item.waliKelasNip}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-600">
                          {item.lastActiveDate ? item.lastActiveDate : <span className="text-rose-500 font-bold">Belum Pernah</span>}
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-rose-600 text-xs">
                            {item.daysSinceLast >= 999 ? 'Belum Pernah' : `${item.daysSinceLast} Hari`}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenStudentDetail && (
                              <button
                                onClick={() => onOpenStudentDetail(item.siswa)}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center gap-1"
                                title="Lihat Riwayat & Profil Siswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            )}

                            {onOpenArahanModal && (
                              <button
                                onClick={() => {
                                  onOpenArahanModal(
                                    item.siswa.kelas_id || '',
                                    `Mohon pendampingan untuk ananda ${item.siswa.nama} (Kelas ${item.namaKelas}) yang belum mengisi jurnal 7 KAIH selama 3 hari berturut-turut.`
                                  );
                                }}
                                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs active:scale-95"
                                title="Kirim Arahan ke Wali Kelas"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Arahan</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BULK PERINGATAN KESISWAAN */}
      {showBulkWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">Kirim Peringatan Massal</h4>
                  <p className="text-xs text-slate-400">Notifikasi resmi ke {classesWithInactiveStudents.length} Wali Kelas</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkWarningModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Daftar Kelas Target:</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 max-h-24 overflow-y-auto">
                  {classesWithInactiveStudents.map((c) => (
                    <span key={c.kelas.id} className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-[10px]">
                      Kelas {c.kelas.nama_kelas} ({c.count} siswa)
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Arahan / Peringatan:</label>
                <input
                  type="text"
                  value={bulkJudul}
                  onChange={(e) => setBulkJudul(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan Instruksi:</label>
                <textarea
                  rows={3}
                  value={bulkPesan}
                  onChange={(e) => setBulkPesan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkWarningModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendBulkWarning}
                disabled={isSendingBulk}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingBulk ? 'Mengirim...' : 'Kirim ke Semua Wali Kelas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
