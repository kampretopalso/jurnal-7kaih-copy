import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Search, 
  Calendar,
  MessageSquare,
  RefreshCw,
  Mail,
  Check,
  Flame,
  Crown,
  Sparkles,
  ArrowUpRight,
  Send,
  MessageSquareHeart,
  MessageCircle
} from 'lucide-react';
import { 
  EntriJurnal, 
  Feedback, 
  Kebiasaan, 
  Kelas, 
  Siswa, 
  StafSekolah,
  ArahanWaliKelas,
  SuaraSiswa
} from '../../types/database';
import { JournalService } from '../../lib/journalService';
import { getTodayDateString } from '../../lib/timeCalculator';
import { PeriodAggregationService, PeriodType } from '../../lib/periodAggregationService';
import { MatrixRekapTable } from './MatrixRekapTable';
import { StudentDetailModal } from './StudentDetailModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { ExportSharePanel } from './ExportSharePanel';
import { ModerationDeleteModal } from './ModerationDeleteModal';
import { RaporKarakterModal } from '../common/RaporKarakterModal';
import { SuaraSiswaModerationView } from '../common/SuaraSiswaModerationView';
import { KomunikasiSiswaGuruModal } from '../common/KomunikasiSiswaGuruModal';

interface WaliKelasDashboardProps {
  staf: StafSekolah;
}

export const WaliKelasDashboard: React.FC<WaliKelasDashboardProps> = ({ staf }) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentKelas, setCurrentKelas] = useState<Kelas | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kebiasaanList, setKebiasaanList] = useState<Kebiasaan[]>([]);
  const [entries, setEntries] = useState<EntriJurnal[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [arahanList, setArahanList] = useState<ArahanWaliKelas[]>([]);
  const [stafList, setStafList] = useState<StafSekolah[]>([]);
  const [suaraList, setSuaraList] = useState<SuaraSiswa[]>([]);

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const [selectedEntryForPhoto, setSelectedEntryForPhoto] = useState<EntriJurnal | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<EntriJurnal | null>(null);
  const [studentForRapor, setStudentForRapor] = useState<Siswa | null>(null);
  const [showSuaraModal, setShowSuaraModal] = useState<boolean>(false);
  const [showKomunikasiModal, setShowKomunikasiModal] = useState<boolean>(false);

  const dateRange = useMemo(() => {
    return PeriodAggregationService.getDateRange(period, selectedDate);
  }, [period, selectedDate]);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      const [allKelas, allSiswa, habits, allEntries, allFeedbacks, allStaf, allSuara] = await Promise.all([
        JournalService.getKelas(),
        JournalService.getSiswa(undefined, forceRefresh),
        JournalService.getKebiasaan(),
        JournalService.getEntriJurnal(undefined, undefined, forceRefresh),
        JournalService.getFeedback(),
        JournalService.getStaf(),
        JournalService.getSuaraSiswaList()
      ]);

      let matchedKelas = allKelas.find((k) => 
        (staf.id && k.wali_kelas_id === staf.id) ||
        (staf.kelas_id && k.id === staf.kelas_id) ||
        (staf.kelas_id && (
          k.nama_kelas.toUpperCase() === String(staf.kelas_id).toUpperCase().replace(/^K-/, '') ||
          k.id === String(staf.kelas_id)
        ))
      );

      if (!matchedKelas && allKelas.length > 0) {
        matchedKelas = allKelas[0];
      }

      setKelasList(allKelas);
      setCurrentKelas(matchedKelas || null);

      const targetClassId = matchedKelas ? matchedKelas.id : (staf.kelas_id || 'k-7a');
      const targetClassClean = targetClassId.replace(/^k-/i, '').toUpperCase();
      
      const filteredSiswa = allSiswa.filter((s) => 
        s.kelas_id === targetClassId || 
        s.kelas_id?.replace(/^k-/i, '').toUpperCase() === targetClassClean ||
        (matchedKelas && s.kelas_id?.toUpperCase() === matchedKelas.nama_kelas.toUpperCase())
      );

      let classArahan: ArahanWaliKelas[] = [];
      if (matchedKelas) {
        classArahan = await JournalService.getArahanWaliKelas(matchedKelas.id);
      }

      setSiswaList(filteredSiswa);
      setKebiasaanList(habits.sort((a, b) => a.urutan - b.urutan));
      setEntries(allEntries);
      setFeedbacks(allFeedbacks);
      setArahanList(classArahan);
      setStafList(allStaf);
      setSuaraList(allSuara);
    } catch (e) {
      console.warn('Error loading wali kelas dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [staf.id, staf.kelas_id]);

  const classConsistentStudents = useMemo(() => {
    return PeriodAggregationService.calculateConsistentStudents(
      siswaList, 
      entries, 
      currentKelas ? [currentKelas] : [], 
      5
    );
  }, [siswaList, entries, currentKelas]);

  const classEffortStudents = useMemo(() => {
    return PeriodAggregationService.calculateEffortStudents(
      siswaList, 
      entries, 
      currentKelas ? [currentKelas] : [], 
      dateRange, 
      5
    );
  }, [siswaList, entries, currentKelas, dateRange]);

  const currentDayEntries = entries.filter((e) => e.tanggal === selectedDate);
  const totalSiswa = siswaList.length;

  // 3 Hari Terakhir untuk Deteksi Inaktivitas
  const last3Days = useMemo(() => {
    const dates: string[] = [];
    const baseDate = new Date(selectedDate);
    for (let i = 0; i < 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [selectedDate]);

  const inactive3DaysStudents = useMemo(() => {
    return siswaList.filter((siswa) => {
      const studentEntriesLast3Days = entries.filter(
        (e) => e.siswa_id === siswa.id && last3Days.includes(e.tanggal)
      );
      return studentEntriesLast3Days.length === 0;
    });
  }, [siswaList, entries, last3Days]);

  let totalHabitsCompleted = 0;
  let perfectStudentCount = 0;
  let flaggedPhotoCount = 0;

  siswaList.forEach((siswa) => {
    const studentDayEntries = currentDayEntries.filter((e) => e.siswa_id === siswa.id);
    const distinctHabits = new Set(studentDayEntries.map((e) => e.kebiasaan_id)).size;
    totalHabitsCompleted += distinctHabits;
    if (distinctHabits === 7) perfectStudentCount++;
    if (studentDayEntries.some((e) => e.flag_foto_mencurigakan)) flaggedPhotoCount++;
  });

  const avgCompletionRate = totalSiswa > 0
    ? Math.round((totalHabitsCompleted / (totalSiswa * 7)) * 100)
    : 0;

  const handleConfirmDelete = async (entriId: string, alasan: string) => {
    await JournalService.deleteEntriJurnal(entriId, staf.id, alasan);
    await loadData();
  };

  const handleAddFeedback = async (siswaId: string, komentar: string) => {
    await JournalService.addFeedback(staf.id, siswaId, null, komentar);
    await loadData();
  };

  const handleMarkArahanRead = async (arahanId: string) => {
    await JournalService.markArahanRead(arahanId);
    setArahanList((prev) =>
      prev.map((a) => (a.id === arahanId ? { ...a, dibaca: true } : a))
    );
  };

  const handleCopyClassWhatsAppReminder = () => {
    let msg = `*🚨 PENGINGAT JURNAL 7 KAIH - KELAS ${currentKelas?.nama_kelas || ''}*\n`;
    msg += `*SMP Negeri 2 Glagah • Tanggal:* ${selectedDate}\n\n`;
    msg += `Assalamu'alaikum Wr. Wb. & Selamat Pagi/Siang,\n`;
    msg += `Yth. Bapak/Ibu Wali Murid dan Ananda Siswa Kelas ${currentKelas?.nama_kelas || ''},\n\n`;
    msg += `Berdasarkan pemantauan sistem, berikut adalah nama ananda yang belum mengisi jurnal 7 KAIH selama 3 hari terakhir:\n`;
    inactive3DaysStudents.forEach((st, idx) => {
      msg += `${idx + 1}. *${st.nama}* (NISN: ${st.nisn})\n`;
    });
    msg += `\n_Mohon ananda segera melengkapi pencatatan pembiasaan hari ini sebelum pukul 24.00 WIB._\n`;
    msg += `_Semangat menjaga karakter luhur dan kedisiplinan setiap hari!_\n\n`;
    msg += `Salam hangat,\n*${staf.nama}* (Wali Kelas ${currentKelas?.nama_kelas || ''})`;

    navigator.clipboard.writeText(msg);
    alert('✅ Teks pengingat WhatsApp untuk siswa/wali murid berhasil disalin ke clipboard!');
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'instruksi': return 'bg-amber-400/20 text-amber-300 border border-amber-400/30';
      case 'apresiasi': return 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30';
      case 'evaluasi': return 'bg-purple-400/20 text-purple-300 border border-purple-400/30';
      default: return 'bg-blue-400/20 text-blue-300 border border-blue-400/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header & Period Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-1">
            Portal Wali Kelas • Kelas {currentKelas?.nama_kelas || staf.kelas_id || '7A'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            Rekap & Moderasi Jurnal Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kedisiplinan {totalSiswa} siswa {currentKelas ? `kelas ${currentKelas.nama_kelas}` : ''}, tinjau keaslian bukti foto EXIF, dan berikan feedback apresiasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => setPeriod('daily')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${period === 'daily' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Harian</button>
            <button onClick={() => setPeriod('weekly')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${period === 'weekly' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Mingguan</button>
            <button onClick={() => setPeriod('monthly')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${period === 'monthly' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Bulanan</button>
            <button onClick={() => setPeriod('semester')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${period === 'semester' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Semester</button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowKomunikasiModal(true)}
            className="px-3.5 py-1.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
            title="Kirim pesan langsung dan bimbingan ke siswa kelas binaan"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>💬 Komunikasi Siswa</span>
          </button>

          <button
            onClick={() => setShowSuaraModal(true)}
            className="px-3.5 py-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 border border-purple-200"
            title="Buka Kotak Aspirasi & Curhat Siswa"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
            <span>Aspirasi Siswa ({
              suaraList.filter(s => 
                s.kelas_id === currentKelas?.id || 
                s.kelas_id === currentKelas?.nama_kelas ||
                siswaList.find(st => st.id === s.siswa_id)?.kelas_id === currentKelas?.id
              ).length
            })</span>
          </button>

          <button
            onClick={() => loadData(true)}
            title="Muat Ulang Data"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(classConsistentStudents.length > 0 || classEffortStudents.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classConsistentStudents.length > 0 && (
            <div className="p-4 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-50 to-white border border-amber-300 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5 fill-slate-950" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">🔥 Siswa Terkonsisten Kelas {currentKelas?.nama_kelas}</span>
                <h4 className="font-bold text-slate-900 text-sm truncate">{classConsistentStudents[0].siswa.nama}</h4>
                <p className="text-[11px] text-amber-900 mt-0.5 font-medium">Streak {classConsistentStudents[0].longestStreak} Hari ({classConsistentStudents[0].badgeLabel})</p>
              </div>
            </div>
          )}
          {classEffortStudents.length > 0 && (
            <div className="p-4 rounded-3xl bg-linear-to-r from-purple-500/10 via-purple-50 to-white border border-purple-300 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">🚀 Siswa Ter-Effort / Berprogres</span>
                <h4 className="font-bold text-slate-900 text-sm truncate">{classEffortStudents[0].siswa.nama}</h4>
                <p className="text-[11px] text-purple-900 mt-0.5 font-medium">{classEffortStudents[0].description} (+{classEffortStudents[0].growthDelta}%)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Banner Siswa Tidak Mengisi 3 Hari Berturut-turut */}
      {inactive3DaysStudents.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 shadow-sm space-y-3 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-rose-950 text-sm">
                  Perhatian Wali Kelas: Ada {inactive3DaysStudents.length} Siswa Tidak Mengisi Jurnal 3 Hari Berturut-turut
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Siswa berikut belum mencatat satupun dari 7 kebiasaan pada rentang {last3Days[2]} s.d {last3Days[0]}. Mohon segera berikan pendampingan atau hubungi orang tua.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyClassWhatsAppReminder}
              className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
              title="Salin Pesan Pengingat WhatsApp untuk Grup Kelas"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ingatkan Semua via WA</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {inactive3DaysStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100/80 border border-rose-300 text-rose-900 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs group cursor-pointer"
                title="Klik untuk membuka detail dan memberi feedback"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:animate-ping" />
                <span>{s.nama}</span>
                <span className="text-[10px] text-rose-500 font-mono">({s.nisn})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Directives from School Leaders Banner (Arahan Pimpinan Sekolah) */}
      {arahanList.length > 0 && (
        <div className="bg-linear-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-purple-800/40 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>Arahan & Feedback dari Pimpinan Sekolah</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
                    {arahanList.length} Pesan
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80">
                  Instruksi dan masukan resmi dari Kepala Sekolah / Waka Kurikulum / Kesiswaan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {arahanList.map((arahan) => {
              const sender = stafList.find((s) => s.id === arahan.staf_pengirim_id);

              return (
                <div
                  key={arahan.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-purple-200">
                        Dari: {sender?.nama || 'Pimpinan Sekolah'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getKategoriBadge(arahan.kategori)}`}>
                        {arahan.kategori}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{arahan.judul}</h4>
                    <p className="text-xs text-purple-100/90 mt-1 leading-relaxed bg-black/20 p-2.5 rounded-xl">
                      "{arahan.pesan}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-purple-300">
                    <span>
                      {new Date(arahan.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WIB
                    </span>
                    {!arahan.dibaca ? (
                      <button
                        onClick={() => handleMarkArahanRead(arahan.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 font-semibold border border-emerald-400/30 flex items-center gap-1 transition"
                      >
                        <Check className="w-3 h-3" />
                        <span>Tandai Sudah Dibaca</span>
                      </button>
                    ) : (
                      <span className="text-emerald-300 font-medium">✓ Sudah Dibaca</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Siswa Kelas</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{totalSiswa}</p>
          <span className="text-[11px] text-slate-400">
            Siswa Kelas {currentKelas?.nama_kelas || staf.kelas_id || ''}
          </span>
        </div>

        {/* Rata-rata Capaian */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Rata-rata Capaian</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{avgCompletionRate}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">Kepatuhan 7 Kebiasaan</span>
        </div>

        {/* Tuntas 7 Kebiasaan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tuntas 7 Kebiasaan</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">
            {perfectStudentCount} <span className="text-xs font-normal text-slate-400">/ {totalSiswa}</span>
          </p>
          <span className="text-[11px] text-slate-400">Siswa Tuntas Hari Ini</span>
        </div>

        {/* Flag Foto Perlu Review */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Perlu Review Foto</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{flaggedPhotoCount}</p>
          <span className="text-[11px] text-amber-700">Siswa dengan Flag EXIF</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NISN siswa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        <span className="text-xs text-slate-500 self-end sm:self-center">
          Menampilkan matriks pelaksanaan tanggal: <strong className="text-slate-700">{selectedDate}</strong>
        </span>
      </div>

      {/* Matrix Table */}
      <MatrixRekapTable
        siswaList={siswaList}
        kebiasaanList={kebiasaanList}
        entries={entries}
        selectedDate={selectedDate}
        onSelectStudent={(s) => setSelectedStudent(s)}
        searchQuery={searchQuery}
      />

      {/* Export & WhatsApp Share Panel */}
      <ExportSharePanel
        namaKelas={currentKelas ? `Kelas ${currentKelas.nama_kelas}` : (staf.kelas_id ? `Kelas ${staf.kelas_id}` : 'Kelas')}
        selectedDate={selectedDate}
        siswaList={siswaList}
        kebiasaanList={kebiasaanList}
        entries={entries}
      />

      {/* Modals */}
      <StudentDetailModal
        isOpen={Boolean(selectedStudent)}
        siswa={selectedStudent}
        entries={
          selectedStudent
            ? entries.filter((e) => e.siswa_id === selectedStudent.id)
            : []
        }
        kebiasaanList={kebiasaanList}
        feedbacks={feedbacks}
        onClose={() => setSelectedStudent(null)}
        onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
        onDeleteEntry={(entry) => setEntryToDelete(entry)}
        onAddFeedback={handleAddFeedback}
        onOpenRapor={(s) => setStudentForRapor(s)}
      />

      <PhotoViewerModal
        isOpen={Boolean(selectedEntryForPhoto)}
        entry={selectedEntryForPhoto}
        onClose={() => setSelectedEntryForPhoto(null)}
      />

      <ModerationDeleteModal
        isOpen={Boolean(entryToDelete)}
        entry={entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Modal Rapor Karakter 7KAIH */}
      <RaporKarakterModal
        isOpen={Boolean(studentForRapor)}
        siswa={studentForRapor}
        entries={entries}
        kebiasaanList={kebiasaanList}
        namaKelas={currentKelas?.nama_kelas || (staf.kelas_id ? staf.kelas_id.replace(/^k-/i, '').toUpperCase() : '-')}
        waliKelasNama={staf.nama}
        kepalaSekolahNama={stafList.find((s) => s.role === 'kepala_sekolah')?.nama || 'H. Abdul Kirom, M.Pd.'}
        kepalaSekolahNip={stafList.find((s) => s.role === 'kepala_sekolah')?.nip_atau_nik || '197508122002121003'}
        onClose={() => setStudentForRapor(null)}
      />

      {/* Modal Suara & Aspirasi Siswa (Anonim) */}
      {showSuaraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-100 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 text-lg">
                  Kotak Aspirasi & Curhat Siswa • Kelas {currentKelas?.nama_kelas}
                </span>
              </div>
              <button
                onClick={() => setShowSuaraModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs transition"
              >
                Tutup
              </button>
            </div>

            <SuaraSiswaModerationView
              suaraList={suaraList}
              siswaList={siswaList}
              kelasList={kelasList.length > 0 ? kelasList : (currentKelas ? [currentKelas] : [])}
              stafList={stafList}
              currentStaf={staf}
              onRefreshData={() => loadData(true)}
            />
          </div>
        </div>
      )}

      <KomunikasiSiswaGuruModal
        isOpen={showKomunikasiModal}
        onClose={() => setShowKomunikasiModal(false)}
        currentUser={{ type: 'staf', data: staf }}
        kelasList={kelasList.length > 0 ? kelasList : (currentKelas ? [currentKelas] : [])}
        siswaList={siswaList}
        stafList={stafList}
      />
    </div>
  );
};
