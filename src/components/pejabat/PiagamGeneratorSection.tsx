import React, { useState, useMemo } from 'react';
import { 
  Crown, 
  Award, 
  Calendar, 
  Printer, 
  Sparkles, 
  Flame, 
  ArrowUpRight, 
  BookOpen, 
  Users, 
  HeartHandshake, 
  Activity, 
  CheckCircle2, 
  UserCheck, 
  Sliders,
  Filter,
  Search
} from 'lucide-react';
import { EntriJurnal, Feedback, Kebiasaan, Kelas, PiagamData, Siswa, StafSekolah, TipePiagam } from '../../types/database';
import { PeriodAggregationService, PeriodType, DateRange } from '../../lib/periodAggregationService';
import { LeaderboardService } from '../../lib/leaderboardService';
import { getTodayDateString } from '../../lib/timeCalculator';

interface PiagamGeneratorSectionProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  entries: EntriJurnal[];
  stafList: StafSekolah[];
  feedbacks: Feedback[];
  kebiasaanList: Kebiasaan[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentStaf: StafSekolah;
  onGeneratePiagam: (piagam: PiagamData) => void;
}

export const PiagamGeneratorSection: React.FC<PiagamGeneratorSectionProps> = ({
  kelasList,
  siswaList,
  entries,
  stafList,
  feedbacks,
  kebiasaanList,
  selectedDate,
  onSelectDate,
  currentStaf,
  onGeneratePiagam
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'siswa' | 'guru_kelas' | 'custom'>('siswa');

  // Custom Form State
  const [customTargetType, setCustomTargetType] = useState<'siswa' | 'guru' | 'kelas'>('siswa');
  const [customSelectedTargetId, setCustomSelectedTargetId] = useState<string>('');
  const [customJudul, setCustomJudul] = useState<string>('PIAGAM PENGHARGAAN APRESIASI KHUSUS');
  const [customKategori, setCustomKategori] = useState<string>('PENGHARGAAN KHUSUS KEPALA SEKOLAH');
  const [customKeterangan, setCustomKeterangan] = useState<string>('Atas dedikasi, kedisiplinan, dan keteladanan yang luar biasa dalam pembiasaan karakter.');
  const [customSkor, setCustomSkor] = useState<string>('Predikat Amat Baik');

  // Rentang tanggal periode aktif
  const dateRange: DateRange = useMemo(() => {
    return PeriodAggregationService.getDateRange(period, selectedDate);
  }, [period, selectedDate]);

  // Data entries pada periode aktif
  const rangeEntries = useMemo(() => {
    return PeriodAggregationService.filterEntriesByRange(entries, dateRange);
  }, [entries, dateRange]);

  // 1. Rekap Kelas Periode Aktif
  const classPeriodSummaries = useMemo(() => {
    return PeriodAggregationService.calculateClassPeriodSummaries(kelasList, siswaList, stafList, entries, dateRange);
  }, [kelasList, siswaList, stafList, entries, dateRange]);

  // 2. Siswa Teladan (Kepatuhan & Ketepatan)
  const topDisciplineStudents = useMemo(() => {
    const qualified = LeaderboardService.calculateTopStudents(siswaList, rangeEntries, kelasList, selectedDate);
    return qualified.qualifiedStudents;
  }, [siswaList, rangeEntries, kelasList, selectedDate]);

  // 3. Siswa Terkonsisten (Streak Master)
  const consistentStudents = useMemo(() => {
    return PeriodAggregationService.calculateConsistentStudents(siswaList, entries, kelasList, 10);
  }, [siswaList, entries, kelasList]);

  // 4. Siswa Ter-Effort (Most Improved)
  const effortStudents = useMemo(() => {
    return PeriodAggregationService.calculateEffortStudents(siswaList, entries, kelasList, dateRange, 10);
  }, [siswaList, entries, kelasList, dateRange]);

  // 5. Duta Literasi (#5 Gemar Belajar)
  const topLiterasiStudents = useMemo(() => {
    const literasiEntries = rangeEntries.filter((e) => e.kebiasaan_id === 5);
    const countMap: Record<string, { count: number; totalWords: number }> = {};

    literasiEntries.forEach((e) => {
      if (!countMap[e.siswa_id]) countMap[e.siswa_id] = { count: 0, totalWords: 0 };
      countMap[e.siswa_id].count++;
      const words = e.catatan ? e.catatan.trim().split(/\s+/).length : (e.nama_kegiatan ? e.nama_kegiatan.trim().split(/\s+/).length : 0);
      countMap[e.siswa_id].totalWords += words;
    });

    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));

    return Object.entries(countMap)
      .map(([siswaId, stats]) => {
        const s = siswaList.find((st) => st.id === siswaId);
        if (!s) return null;
        const namaKelas = kelasMap.get(s.kelas_id || '') || s.kelas_id || '-';
        return {
          siswa: s,
          namaKelas,
          totalEntries: stats.count,
          totalWords: stats.totalWords
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalEntries - a.totalEntries || b.totalWords - a.totalWords)
      .slice(0, 10);
  }, [rangeEntries, siswaList, kelasList]);

  // 6. Bintang Karakter Sosial (#6 Bermasyarakat)
  const topSosialStudents = useMemo(() => {
    const sosialEntries = rangeEntries.filter((e) => e.kebiasaan_id === 6);
    const countMap: Record<string, number> = {};
    sosialEntries.forEach((e) => {
      countMap[e.siswa_id] = (countMap[e.siswa_id] || 0) + 1;
    });

    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));

    return Object.entries(countMap)
      .map(([siswaId, count]) => {
        const s = siswaList.find((st) => st.id === siswaId);
        if (!s) return null;
        return {
          siswa: s,
          namaKelas: kelasMap.get(s.kelas_id || '') || '-',
          totalEntries: count
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalEntries - a.totalEntries)
      .slice(0, 10);
  }, [rangeEntries, siswaList, kelasList]);

  // 7. Bintang Kebugaran & Olahraga (#3 Berolahraga)
  const topOlahragaStudents = useMemo(() => {
    const sportEntries = rangeEntries.filter((e) => e.kebiasaan_id === 3);
    const countMap: Record<string, number> = {};
    sportEntries.forEach((e) => {
      countMap[e.siswa_id] = (countMap[e.siswa_id] || 0) + 1;
    });

    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]));

    return Object.entries(countMap)
      .map(([siswaId, count]) => {
        const s = siswaList.find((st) => st.id === siswaId);
        if (!s) return null;
        return {
          siswa: s,
          namaKelas: kelasMap.get(s.kelas_id || '') || '-',
          totalEntries: count
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalEntries - a.totalEntries)
      .slice(0, 10);
  }, [rangeEntries, siswaList, kelasList]);

  // 8. Wali Kelas Honors (Istiqomah & Effort)
  const waliHonors = useMemo(() => {
    return PeriodAggregationService.calculateWaliKelasHonors(stafList, kelasList, siswaList, entries, dateRange);
  }, [stafList, kelasList, siswaList, entries, dateRange]);

  // 9. Wali Kelas Paling Responsif (Feedback terbanyak)
  const topResponsiveWaliKelas = useMemo(() => {
    const feedbackCount: Record<string, number> = {};
    feedbacks.forEach((f) => {
      feedbackCount[f.staf_id] = (feedbackCount[f.staf_id] || 0) + 1;
    });

    return stafList
      .filter((s) => s.role === 'wali_kelas')
      .map((staf) => {
        const kelas = kelasList.find((k) => k.id === staf.kelas_id || k.wali_kelas_id === staf.id);
        const count = feedbackCount[staf.id] || 0;
        return {
          staf,
          kelas,
          totalFeedback: count
        };
      })
      .sort((a, b) => b.totalFeedback - a.totalFeedback);
  }, [feedbacks, stafList, kelasList]);

  // Helper Pembuat Nomor Surat
  const getNomorSurat = (kode: string) => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    return `421.3 / 7KAIH-${kode}.${rand} / SMPN2 / ${year}`;
  };

  const getPeriodeString = () => {
    return dateRange.label;
  };

  const handleCustomGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    let namaPenerima = '';
    let subPenerima = '';

    if (customTargetType === 'siswa') {
      const targetS = siswaList.find((s) => s.id === customSelectedTargetId);
      if (!targetS) return alert('Silakan pilih siswa penerima');
      const k = kelasList.find((c) => c.id === targetS.kelas_id);
      namaPenerima = targetS.nama.toUpperCase();
      subPenerima = `NISN: ${targetS.nisn} • Kelas ${k?.nama_kelas || '-'}`;
    } else if (customTargetType === 'guru') {
      const targetG = stafList.find((s) => s.id === customSelectedTargetId);
      if (!targetG) return alert('Silakan pilih guru penerima');
      namaPenerima = targetG.nama.toUpperCase();
      subPenerima = `NIP: ${targetG.nip_atau_nik} • ${targetG.role.replace(/_/g, ' ').toUpperCase()}`;
    } else {
      const targetK = kelasList.find((k) => k.id === customSelectedTargetId);
      if (!targetK) return alert('Silakan pilih kelas penerima');
      const w = stafList.find((s) => s.id === targetK.wali_kelas_id);
      namaPenerima = `KELAS ${targetK.nama_kelas}`;
      subPenerima = `Wali Kelas: ${w?.nama || '-'}`;
    }

    onGeneratePiagam({
      tipe: 'siswa_teladan',
      kategoriLabel: customKategori,
      judul: customJudul,
      nomorSurat: getNomorSurat('KS'),
      diberikanKepada: namaPenerima,
      subPenerima,
      periodeLabel: getPeriodeString(),
      keterangan: customKeterangan,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      namaKepalaSekolah: currentStaf.nama,
      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
      skor: customSkor
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner Kepala Sekolah */}
      <div className="bg-linear-to-r from-amber-700 via-amber-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shrink-0">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 uppercase tracking-wider">
                Hak Akses Kepala Sekolah
              </span>
              <span className="text-xs text-amber-200/80">Penerbitan Sertifikat & Piagam Resmi</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Pusat Piagam Penghargaan Karakter 7KAIH
            </h3>
            <p className="text-xs text-amber-100/90 mt-0.5">
              Apresiasi bergengsi untuk Siswa, Kelas Juara, dan Pendidik/Wali Kelas per Harian, Mingguan, Bulanan, dan Semester.
            </p>
          </div>
        </div>

        {/* Periode Selector */}
        <div className="bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-xs flex flex-wrap items-center gap-1.5 shrink-0">
          {[
            { id: 'daily', label: '📅 Harian' },
            { id: 'weekly', label: '🗓️ Mingguan' },
            { id: 'monthly', label: '📊 Bulanan' },
            { id: 'semester', label: '🏛️ Semester' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === p.id
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Periode Aktif */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">
            Periode Penilaian Aktif:{' '}
            <span className="text-amber-900 font-extrabold">{dateRange.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveCategoryTab('siswa')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeCategoryTab === 'siswa'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🏆 Piagam Prestasi Siswa</span>
        </button>

        <button
          onClick={() => setActiveCategoryTab('guru_kelas')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeCategoryTab === 'guru_kelas'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>👑 Piagam Kelas & Wali Kelas</span>
        </button>

        <button
          onClick={() => setActiveCategoryTab('custom')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeCategoryTab === 'custom'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>✍️ Terbitkan Piagam Kustom</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. SUB-TAB: PIAGAM PRESTASI SISWA */}
      {/* ========================================================= */}
      {activeCategoryTab === 'siswa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Siswa Teladan Terdisiplin */}
          {(() => {
            const top = topDisciplineStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Siswa Teladan Terdisiplin</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Juara 1</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-emerald-700">
                        ✨ Tuntas {top.totalKebiasaan}/7 Kebiasaan (100% Valid)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data siswa tuntas.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_teladan',
                      kategoriLabel: 'SISWA TELADAN & TERDISIPLIN 7KAIH',
                      judul: 'PIAGAM PENGHARGAAN SISWA TELADAN',
                      nomorSurat: getNomorSurat('ST'),
                      diberikanKepada: top.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai SISWA TELADAN TERDISIPLIN atas ketepatan waktu, kejujuran bukti foto, dan ketuntasan sempurna 7 Kebiasaan Anak Indonesia Hebat`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: 'Kepatuhan 100% Tuntas'
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Siswa Teladan</span>
                </button>
              </div>
            );
          })()}

          {/* Card 2: Siswa Terkonsisten (Streak Master) */}
          {(() => {
            const top = consistentStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5 uppercase">
                      <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>Siswa Terkonsisten (Streak)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Streak Master</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.siswa.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.siswa.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-amber-900">
                        🔥 Rekor Streak: {top.longestStreak} Hari Berturut-turut ({top.totalActiveDays} Hari Aktif)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data streak siswa.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_istiqomah',
                      kategoriLabel: 'SISWA TERKONSISTEN (STREAK MASTER)',
                      judul: 'PIAGAM PENGHARGAAN KONSISTENSI KARAKTER',
                      nomorSurat: getNomorSurat('STREAK'),
                      diberikanKepada: top.siswa.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.siswa.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai SISWA TERKONSISTEN atas ketekunan dan istiqomah luar biasa dalam mengisi jurnal 7 Kebiasaan berturut-turut tanpa terputus`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `Streak ${top.longestStreak} Hari`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Terkonsisten</span>
                </button>
              </div>
            );
          })()}

          {/* Card 3: Siswa Ter-Effort / Most Improved */}
          {(() => {
            const top = effortStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1.5 uppercase">
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                      <span>Siswa Ter-Effort (Most Improved)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Pertumbuhan Karakter</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.siswa.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.siswa.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-purple-800">
                        🚀 Lonjakan Pertumbuhan: +{top.growthDelta}% ({top.description})
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data progresivitas siswa.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_effort',
                      kategoriLabel: 'SISWA TER-EFFORT (MOST IMPROVED)',
                      judul: 'PIAGAM PENGHARGAAN PROGRESIVITAS KARAKTER',
                      nomorSurat: getNomorSurat('EFFORT'),
                      diberikanKepada: top.siswa.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.siswa.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai SISWA TER-EFFORT (MOST IMPROVED) atas daya juang tinggi dan lonjakan kepatuhan terbesar dalam pembiasaan karakter luhur`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `Kenaikan +${top.growthDelta}%`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Ter-Effort</span>
                </button>
              </div>
            );
          })()}

          {/* Card 4: Duta Literasi (#5 Gemar Belajar) */}
          {(() => {
            const top = topLiterasiStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1.5 uppercase">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Duta Literasi (Gemar Belajar)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Kebiasaan #5</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.siswa.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.siswa.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-indigo-800">
                        📖 {top.totalEntries} Refleksi Belajar ({top.totalWords.toLocaleString('id-ID')} Total Kata)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data refleksi literasi.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_literasi',
                      kategoriLabel: 'DUTA LITERASI & GEMAR BELAJAR 7KAIH',
                      judul: 'PIAGAM PENGHARGAAN DUTA LITERASI',
                      nomorSurat: getNomorSurat('LIT'),
                      diberikanKepada: top.siswa.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.siswa.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai DUTA LITERASI atas kecintaan membaca buku dan konsistensi menuliskan refleksi pembelajaran bermutu tinggi`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `${top.totalEntries} Catatan Refleksi`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Duta Literasi</span>
                </button>
              </div>
            );
          })()}

          {/* Card 5: Bintang Karakter Sosial (#6 Bermasyarakat) */}
          {(() => {
            const top = topSosialStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-pink-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-pink-50 text-pink-900 border border-pink-200 flex items-center gap-1.5 uppercase">
                      <HeartHandshake className="w-3.5 h-3.5 text-pink-600" />
                      <span>Bintang Karakter Sosial</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Kebiasaan #6</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.siswa.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.siswa.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-pink-800">
                        🤝 {top.totalEntries} Aktivitas Gotong Royong & Peduli Lingkungan
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data bermasyarakat.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_sosial',
                      kategoriLabel: 'BINTANG BERKARAKTER SOSIAL 7KAIH',
                      judul: 'PIAGAM PENGHARGAAN KEPEDULIAN SOSIAL',
                      nomorSurat: getNomorSurat('SOS'),
                      diberikanKepada: top.siswa.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.siswa.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai BINTANG BERKARAKTER SOSIAL atas keaktifan gotong royong, kepedulian lingkungan, dan kontribusi nyata bagi masyarakat`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `${top.totalEntries} Kegiatan Sosial`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Karakter Sosial</span>
                </button>
              </div>
            );
          })()}

          {/* Card 6: Bintang Kebugaran & Olahraga (#3 Berolahraga) */}
          {(() => {
            const top = topOlahragaStudents[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-teal-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1.5 uppercase">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      <span>Bintang Kebugaran & Olahraga</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Kebiasaan #3</span>
                  </div>

                  {top ? (
                    <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{top.siswa.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Kelas {top.namaKelas} • NISN: {top.siswa.nisn}
                      </p>
                      <div className="pt-2 text-xs font-bold text-teal-800">
                        🏃 {top.totalEntries} Sesi Pembiasaan Olahraga Fisik Sehat
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data olahraga.</p>
                  )}
                </div>

                <button
                  disabled={!top}
                  onClick={() => {
                    if (!top) return;
                    onGeneratePiagam({
                      tipe: 'siswa_olahraga',
                      kategoriLabel: 'BINTANG KEBUGARAN & OLAHRAGA 7KAIH',
                      judul: 'PIAGAM PENGHARGAAN KEBUGARAN FISIK',
                      nomorSurat: getNomorSurat('FIT'),
                      diberikanKepada: top.siswa.nama.toUpperCase(),
                      subPenerima: `NISN: ${top.siswa.nisn} • Kelas ${top.namaKelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai BINTANG KEBUGARAN atas kedisiplinan berolahraga, menjaga kesehatan jasmani, dan gaya hidup aktif`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `${top.totalEntries} Sesi Olahraga`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Kebugaran</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUB-TAB: PIAGAM KELAS & WALI KELAS */}
      {/* ========================================================= */}
      {activeCategoryTab === 'guru_kelas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Kelas Juara 1 Terdisiplin */}
          {(() => {
            const topClass = classPeriodSummaries[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 uppercase">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kelas Juara 1 Terdisiplin</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Skor Tertib Terbaik</span>
                  </div>

                  {topClass ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-lg">Kelas {topClass.namaKelas}</h4>
                      <p className="text-xs text-slate-600">
                        Wali Kelas: <span className="font-bold text-slate-900">{topClass.waliKelasNama}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Rerata Kepatuhan</span>
                          <span className="font-bold text-emerald-700">{topClass.rataRataKepatuhan}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Skor Tertib</span>
                          <span className="font-bold text-amber-900">{topClass.skorTertibPeriode} Poin</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data ranking kelas.</p>
                  )}
                </div>

                <button
                  disabled={!topClass}
                  onClick={() => {
                    if (!topClass) return;
                    onGeneratePiagam({
                      tipe: 'kelas_terbaik',
                      kategoriLabel: 'KELAS TERDISIPLIN JUARA 1',
                      judul: 'PIAGAM PENGHARGAAN KELAS TERDISIPLIN',
                      nomorSurat: getNomorSurat('KL-01'),
                      diberikanKepada: `KELAS ${topClass.namaKelas}`,
                      subPenerima: `Wali Kelas: ${topClass.waliKelasNama}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai KELAS JUARA 1 PALING TERTIB & BERKARAKTER atas kepatuhan tertinggi 7 Kebiasaan Anak Indonesia Hebat`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `${topClass.skorTertibPeriode} Poin (${topClass.rataRataKepatuhan}% Kepatuhan)`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Kelas Juara 1</span>
                </button>
              </div>
            );
          })()}

          {/* Card 2: Wali Kelas Ter-Istiqomah */}
          {(() => {
            const topWali = waliHonors.waliIstiqomah[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 uppercase">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Wali Kelas Ter-Istiqomah</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Pendidik Berdedikasi</span>
                  </div>

                  {topWali ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{topWali.staf.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Wali Kelas {topWali.kelas.nama_kelas} • NIP: {topWali.staf.nip_atau_nik}
                      </p>
                      <div className="pt-2 text-xs font-bold text-amber-900">
                        👑 {topWali.honorDescription} ({topWali.averageComplianceRate}% Kepatuhan)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data wali kelas istiqomah.</p>
                  )}
                </div>

                <button
                  disabled={!topWali}
                  onClick={() => {
                    if (!topWali) return;
                    onGeneratePiagam({
                      tipe: 'wali_istiqomah',
                      kategoriLabel: 'WALI KELAS TER-ISTIQOMAH & BERDEDIKASI',
                      judul: 'PIAGAM PENGHARGAAN WALI KELAS TELADAN',
                      nomorSurat: getNomorSurat('GURU-IST'),
                      diberikanKepada: topWali.staf.nama.toUpperCase(),
                      subPenerima: `NIP. ${topWali.staf.nip_atau_nik} • Wali Kelas ${topWali.kelas.nama_kelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai WALI KELAS TER-ISTIQOMAH atas dedikasi dan kepemimpinan teladan membawa kelas binaannya konsisten di peringkat unggul`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `Kepatuhan Kelas ${topWali.averageComplianceRate}%`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Wali Kelas Istiqomah</span>
                </button>
              </div>
            );
          })()}

          {/* Card 3: Wali Kelas Ter-Effort (Highest Growth) */}
          {(() => {
            const topEffortWali = waliHonors.waliEffort[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1.5 uppercase">
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                      <span>Wali Kelas Ter-Effort (Highest Growth)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Lonjakan Tertinggi</span>
                  </div>

                  {topEffortWali ? (
                    <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{topEffortWali.staf.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Wali Kelas {topEffortWali.kelas.nama_kelas} • NIP: {topEffortWali.staf.nip_atau_nik}
                      </p>
                      <div className="pt-2 text-xs font-bold text-purple-900">
                        ⚡ {topEffortWali.honorDescription} (+{topEffortWali.growthDelta}%)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data lonjakan kelas.</p>
                  )}
                </div>

                <button
                  disabled={!topEffortWali}
                  onClick={() => {
                    if (!topEffortWali) return;
                    onGeneratePiagam({
                      tipe: 'wali_effort',
                      kategoriLabel: 'WALI KELAS TER-EFFORT & INOVATIF',
                      judul: 'PIAGAM PENGHARGAAN PEMBINAAN KELAS PROGRESIF',
                      nomorSurat: getNomorSurat('GURU-EFF'),
                      diberikanKepada: topEffortWali.staf.nama.toUpperCase(),
                      subPenerima: `NIP. ${topEffortWali.staf.nip_atau_nik} • Wali Kelas ${topEffortWali.kelas.nama_kelas}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai WALI KELAS TER-EFFORT atas kegigihan luar biasa mendongkrak kepatuhan dan kedisiplinan peserta didik dengan kenaikan tertinggi`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `Lonjakan +${topEffortWali.growthDelta}%`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Wali Kelas Effort</span>
                </button>
              </div>
            );
          })()}

          {/* Card 4: Wali Kelas Paling Responsif & Inspiratif */}
          {(() => {
            const topResp = topResponsiveWaliKelas[0];
            return (
              <div className="bg-white rounded-3xl p-5 border border-blue-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1.5 uppercase">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Wali Kelas Paling Responsif</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Feedback Aktif</span>
                  </div>

                  {topResp ? (
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{topResp.staf.nama}</h4>
                      <p className="text-xs text-slate-600">
                        Wali Kelas {topResp.kelas?.nama_kelas} • NIP: {topResp.staf.nip_atau_nik}
                      </p>
                      <div className="pt-2 text-xs font-bold text-blue-900">
                        💬 Telah Memberikan {topResp.totalFeedback} Catatan & Masukan Pembinaan
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada data feedback.</p>
                  )}
                </div>

                <button
                  disabled={!topResp}
                  onClick={() => {
                    if (!topResp) return;
                    onGeneratePiagam({
                      tipe: 'wali_responsif',
                      kategoriLabel: 'WALI KELAS PALING RESPONSIF & INSPIRATIF',
                      judul: 'PIAGAM PENGHARGAAN PEMBINAAN SISWA TERAKTIF',
                      nomorSurat: getNomorSurat('GURU-RESP'),
                      diberikanKepada: topResp.staf.nama.toUpperCase(),
                      subPenerima: `NIP. ${topResp.staf.nip_atau_nik} • Wali Kelas ${topResp.kelas?.nama_kelas || '-'}`,
                      periodeLabel: getPeriodeString(),
                      keterangan: `Sebagai WALI KELAS PALING RESPONSIF atas keaktifan luar biasa memberikan pendampingan, motivasi, dan apresiasi berkala bagi murid`,
                      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                      namaKepalaSekolah: currentStaf.nama,
                      nipKepalaSekolah: currentStaf.nip_atau_nik || '197508122002121003',
                      skor: `${topResp.totalFeedback} Catatan Motivasi`
                    });
                  }}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Piagam Wali Responsif</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SUB-TAB: TERBITKAN PIAGAM KUSTOM */}
      {/* ========================================================= */}
      {activeCategoryTab === 'custom' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm max-w-3xl space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Formulir Penerbitan Piagam Penghargaan Kustom</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kepala Sekolah dapat memberikan piagam apresiasi resmi dengan kategori, penerima, dan deskripsi khusus sesuai kebutuhan kegiatan sekolah.
            </p>
          </div>

          <form onSubmit={handleCustomGenerate} className="space-y-4">
            {/* Tipe Sasaran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Sasaran Penerima:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'siswa', label: '🎓 Siswa Individu' },
                  { id: 'guru', label: '👨‍🏫 Guru / Wali Kelas' },
                  { id: 'kelas', label: '🏛️ Rombel Kelas' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setCustomTargetType(t.id as any);
                      setCustomSelectedTargetId('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      customTargetType === t.id
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Penerima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Nama {customTargetType === 'siswa' ? 'Siswa' : customTargetType === 'guru' ? 'Guru / Staf' : 'Kelas'}:
              </label>
              <select
                required
                value={customSelectedTargetId}
                onChange={(e) => setCustomSelectedTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Pilih Penerima Piagam --</option>
                {customTargetType === 'siswa' &&
                  siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} (NISN: {s.nisn} - Kelas {kelasList.find(k => k.id === s.kelas_id)?.nama_kelas || '-'})
                    </option>
                  ))}
                {customTargetType === 'guru' &&
                  stafList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nama} ({st.role.replace(/_/g, ' ').toUpperCase()} - NIP: {st.nip_atau_nik})
                    </option>
                  ))}
                {customTargetType === 'kelas' &&
                  kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas} (Wali Kelas: {stafList.find(s => s.id === k.wali_kelas_id)?.nama || '-'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Kategori & Judul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Badge Penghargaan:</label>
                <input
                  type="text"
                  required
                  value={customKategori}
                  onChange={(e) => setCustomKategori(e.target.value)}
                  placeholder="Contoh: DUTA KEDISIPLINAN SEKOLAH"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Piagam:</label>
                <input
                  type="text"
                  required
                  value={customJudul}
                  onChange={(e) => setCustomJudul(e.target.value)}
                  placeholder="Contoh: PIAGAM PENGHARGAAN SISWA BERPRESTASI"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Keterangan & Skor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Resmi Apresiasi:</label>
              <textarea
                rows={3}
                required
                value={customKeterangan}
                onChange={(e) => setCustomKeterangan(e.target.value)}
                placeholder="Tuliskan alasan pemberian penghargaan..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Capaian / Predikat:</label>
              <input
                type="text"
                value={customSkor}
                onChange={(e) => setCustomSkor(e.target.value)}
                placeholder="Contoh: 100 Poin / Predikat Sangat Baik"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Terbitkan & Pratinjau Piagam Kustom</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
