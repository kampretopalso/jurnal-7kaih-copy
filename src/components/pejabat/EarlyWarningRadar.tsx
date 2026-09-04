import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  MessageSquare, 
  ChevronRight, 
  CheckCircle2,
  Users,
  Eye,
  Download,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import { EntriJurnal, Kelas, Siswa, StafSekolah, WarningStudentItem } from '../../types/database';
import { getTodayDateString } from '../../lib/timeCalculator';
import * as XLSX from 'xlsx';

interface EarlyWarningRadarProps {
  entries: EntriJurnal[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  stafList: StafSekolah[];
  onOpenArahanModal: (targetKelasId: string, prefillMessage: string) => void;
  onOpenStudentDetail: (siswa: Siswa) => void;
}

export const EarlyWarningRadar: React.FC<EarlyWarningRadarProps> = ({
  entries,
  kelasList,
  siswaList,
  stafList,
  onOpenArahanModal,
  onOpenStudentDetail
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pasif' | 'anomali' | 'terlambat'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = getTodayDateString();

  // Evaluasi daftar siswa yang membutuhkan perhatian kesiswaan & BK
  const warningList = useMemo<WarningStudentItem[]>(() => {
    const list: WarningStudentItem[] = [];

    siswaList.forEach((siswa) => {
      const studentEntries = entries.filter((e) => e.siswa_id === siswa.id);
      const kelas = kelasList.find((k) => k.id === siswa.kelas_id);
      const waliKelas = stafList.find((s) => s.id === kelas?.wali_kelas_id);

      // Hitung flagged foto
      const flaggedCount = studentEntries.filter((e) => e.flag_foto_mencurigakan).length;

      // Hitung keterlambatan (kebiasaan 1 dan 7)
      const lateCount = studentEntries.filter(
        (e) => (e.kebiasaan_id === 1 || e.kebiasaan_id === 7) && e.status_waktu === 'terlambat'
      ).length;

      // Hitung keaktifan
      const datesSubmitted = Array.from(new Set(studentEntries.map((e) => e.tanggal))).sort();
      const lastDate = datesSubmitted.length > 0 ? datesSubmitted[datesSubmitted.length - 1] : null;

      let daysInactive = 0;
      if (!lastDate) {
        daysInactive = 7; // Belum pernah mengisi sama sekali
      } else {
        const diffMs = new Date(todayStr).getTime() - new Date(lastDate).getTime();
        daysInactive = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 0);
      }

      // Kriteria Warning
      let isWarning = false;
      let kategori: WarningStudentItem['kategoriWarning'] = 'pasif_sedang';
      let rekomendasi = '';

      if (daysInactive >= 3 || !lastDate) {
        isWarning = true;
        kategori = daysInactive >= 5 ? 'pasif_berat' : 'pasif_sedang';
        rekomendasi = `Siswa tidak mengisi jurnal selama ${daysInactive} hari. Perlu konfirmasi wali kelas & pendampingan orang tua.`;
      } else if (flaggedCount >= 2) {
        isWarning = true;
        kategori = 'indikasi_anomali';
        rekomendasi = `Ditemukan ${flaggedCount} foto berindikasi screenshot / metadata EXIF tidak valid. Perlu bimbingan kejujuran.`;
      } else if (lateCount >= 3) {
        isWarning = true;
        kategori = 'sering_terlambat';
        rekomendasi = `Siswa tercatat ${lateCount}x terlambat bangun pagi / tidur malam. Perlu pembinaan pola istirahat.`;
      }

      if (isWarning) {
        list.push({
          siswa,
          namaKelas: kelas?.nama_kelas || '-',
          waliKelasNama: waliKelas?.nama || 'Wali Kelas',
          hariTanpaEntriCount: daysInactive,
          terakhirMengisiTanggal: lastDate,
          flaggedPhotosTotal: flaggedCount,
          terlambatTotal: lateCount,
          kategoriWarning: kategori,
          rekomendasiTindakan: rekomendasi
        });
      }
    });

    // Urutkan dari pasif berat dan indikasi anomali
    return list.sort((a, b) => b.hariTanpaEntriCount - a.hariTanpaEntriCount);
  }, [entries, kelasList, siswaList, stafList, todayStr]);

  const filteredWarnings = warningList.filter((item) => {
    if (selectedClassId !== 'all') {
      if (item.siswa.kelas_id !== selectedClassId) return false;
    }

    if (filterType === 'pasif') {
      if (item.kategoriWarning !== 'pasif_berat' && item.kategoriWarning !== 'pasif_sedang') return false;
    } else if (filterType === 'anomali') {
      if (item.kategoriWarning !== 'indikasi_anomali') return false;
    } else if (filterType === 'terlambat') {
      if (item.kategoriWarning !== 'sering_terlambat') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.siswa.nama.toLowerCase().includes(q) || item.siswa.nisn.includes(q) || item.namaKelas.toLowerCase().includes(q);
    }

    return true;
  });

  const getKategoriBadge = (kategori: WarningStudentItem['kategoriWarning']) => {
    switch (kategori) {
      case 'pasif_berat':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'pasif_sedang':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'indikasi_anomali':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'sering_terlambat':
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  const getKategoriLabel = (kategori: WarningStudentItem['kategoriWarning']) => {
    switch (kategori) {
      case 'pasif_berat':
        return '🚨 Pasif Berat (≥ 5 Hari)';
      case 'pasif_sedang':
        return '⚠️ Tidak Mengisi (≥ 3 Hari)';
      case 'indikasi_anomali':
        return '🔍 Indikasi Anomali Foto EXIF';
      case 'sering_terlambat':
      default:
        return '⏰ Sering Terlambat Bangun/Tidur';
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredWarnings.map((item, idx) => ({
      No: idx + 1,
      NISN: item.siswa.nisn,
      'Nama Siswa': item.siswa.nama,
      Kelas: `Kelas ${item.namaKelas}`,
      'Wali Kelas': item.waliKelasNama,
      'Lama Tidak Mengisi': item.hariTanpaEntriCount >= 7 ? 'Belum Pernah' : `${item.hariTanpaEntriCount} Hari`,
      'Terakhir Mengisi': item.terakhirMengisiTanggal || 'Belum Pernah',
      'Foto Flagged': item.flaggedPhotosTotal,
      'Terlambat Bangun/Tidur': item.terlambatTotal,
      Kategori: getKategoriLabel(item.kategoriWarning),
      'Rekomendasi Pembinaan': item.rekomendasiTindakan
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Radar Siswa Perlu Perhatian');
    XLSX.writeFile(wb, `Laporan_Radar_Pembinaan_Siswa_SMPN2Glagah_${todayStr}.xlsx`);
  };

  const handleCopyWhatsAppBroadcast = () => {
    let msg = `*🚨 PERINGATAN PEMBINAAN SISWA PASIF - JURNAL 7 KAIH*\n`;
    msg += `*SMP Negeri 2 Glagah • Tanggal:* ${todayStr}\n\n`;
    msg += `Yth. Bapak/Ibu Wali Kelas 7A - 9F,\n`;
    msg += `Berikut adalah rekap siswa yang terpantau pasif / tidak mengisi jurnal pembiasaan selama 3 hari berturut-turut atau lebih:\n\n`;

    const groupedByClass: Record<string, WarningStudentItem[]> = {};
    filteredWarnings.filter(w => w.kategoriWarning.startsWith('pasif')).forEach(item => {
      if (!groupedByClass[item.namaKelas]) groupedByClass[item.namaKelas] = [];
      groupedByClass[item.namaKelas].push(item);
    });

    Object.entries(groupedByClass).forEach(([kelasName, items]) => {
      msg += `📌 *Kelas ${kelasName}* (Wali Kelas: ${items[0].waliKelasNama}):\n`;
      items.forEach((it, idx) => {
        msg += `  ${idx + 1}. ${it.siswa.nama} (NISN: ${it.siswa.nisn}) - Pasif ${it.hariTanpaEntriCount >= 7 ? 'Belum Pernah' : it.hariTanpaEntriCount + ' Hari'}\n`;
      });
      msg += `\n`;
    });

    msg += `_Mohon Bapak/Ibu Wali Kelas berkenan menindaklanjuti dan mengingatkan ananda/wali murid masing-masing. Terima kasih._\n\n`;
    msg += `Salam Hormat,\n*Tim Kesiswaan / Pimpinan SMPN 2 Glagah*`;

    navigator.clipboard.writeText(msg);
    alert('✅ Pesan WhatsApp Broadcast Peringatan Siswa Pasif ke Wali Kelas berhasil disalin!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner Kesiswaan */}
      <div className="rounded-3xl p-6 bg-linear-to-r from-rose-900 via-red-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center text-rose-200 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/40 text-rose-200 border border-rose-400/30">
                Kesiswaan, BK & Wali Kelas
              </span>
              <span className="text-xs text-rose-300">Early Warning System & Pembinaan Siswa</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              Radar Pembinaan Karakter & Siswa Tidak Aktif (≥ 3 Hari)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyWhatsAppBroadcast}
            className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            title="Salin Pesan Broadcast Peringatan untuk WhatsApp Group Wali Kelas"
          >
            <Send className="w-4 h-4" />
            <span>Copy WA Broadcast</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-sm shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <div>
              <span className="text-[10px] text-rose-200 block">Siswa Perlu Perhatian</span>
              <span className="text-base font-bold text-white">{warningList.length} Siswa Terdeteksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {[
            { id: 'all', label: `Semua Radar (${warningList.length})` },
            { id: 'pasif', label: '🛑 Tidak Mengisi (≥ 3 Hari)' },
            { id: 'anomali', label: '🔍 Audit Foto EXIF' },
            { id: 'terlambat', label: '⏰ Pola Waktu' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterType === tab.id
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:outline-none w-full md:w-44"
          >
            <option value="all">Semua Rombel (18)</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama_kelas}
              </option>
            ))}
          </select>

          <div className="relative w-full md:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa/NISN..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Warning Cards Grid */}
      {filteredWarnings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-semibold text-slate-700">Kondisi Disiplin & Kepatuhan Sangat Baik!</p>
          <p className="text-xs text-slate-400">Tidak ada siswa yang memerlukan tindakan pembinaan khusus pada kriteria ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWarnings.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        Kelas {item.namaKelas}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getKategoriBadge(item.kategoriWarning)}`}>
                        {getKategoriLabel(item.kategoriWarning)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-1.5">
                      {item.siswa.nama}
                    </h4>
                    <p className="text-xs text-slate-500">
                      NISN: {item.siswa.nisn} • Wali Kelas: {item.waliKelasNama}
                    </p>
                  </div>
                </div>

                {/* Status Detail Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs my-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hari Tidak Mengisi</span>
                    <span className={`font-extrabold ${item.hariTanpaEntriCount >= 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {item.hariTanpaEntriCount} Hari
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Flag Foto Anomali</span>
                    <span className={`font-extrabold ${item.flaggedPhotosTotal > 0 ? 'text-purple-600' : 'text-slate-700'}`}>
                      {item.flaggedPhotosTotal} Foto
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Keterlambatan</span>
                    <span className={`font-extrabold ${item.terlambatTotal > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {item.terlambatTotal}x
                    </span>
                  </div>
                </div>

                {/* Rekomendasi Tindakan */}
                <p className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl leading-relaxed">
                  💡 <span className="font-bold text-amber-900">Rekomendasi Tindakan:</span> {item.rekomendasiTindakan}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenStudentDetail(item.siswa)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Riwayat Siswa</span>
                </button>

                <button
                  onClick={() =>
                    onOpenArahanModal(
                      item.siswa.kelas_id || 'all',
                      `Mohon pendampingan untuk ananda ${item.siswa.nama} (Kelas ${item.namaKelas}). ${item.rekomendasiTindakan}`
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Instruksi ke Wali Kelas</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
