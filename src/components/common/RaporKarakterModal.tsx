import React, { useRef, useState, useMemo } from 'react';
import { X, Printer, Download, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EntriJurnal, Kebiasaan, Siswa, StafSekolah } from '../../types/database';
import { getTodayDateString } from '../../lib/timeCalculator';
import { useSchoolProfile } from '../../context/SchoolProfileContext';

interface RaporKarakterModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  entries: EntriJurnal[];
  kebiasaanList: Kebiasaan[];
  namaKelas: string;
  waliKelasNama?: string;
  kepalaSekolahNama?: string;
  kepalaSekolahNip?: string;
}

export const RaporKarakterModal: React.FC<RaporKarakterModalProps> = ({
  isOpen,
  onClose,
  siswa,
  entries,
  kebiasaanList,
  namaKelas,
  waliKelasNama,
  kepalaSekolahNama,
  kepalaSekolahNip
}) => {
  const { profile } = useSchoolProfile();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Periode Evaluasi Rapor (Bulan Berjalan, 30 Hari Terakhir, Semester, Kustom)
  const [periodeMode, setPeriodeMode] = useState<'bulan_ini' | '30_hari' | 'semester' | 'kustom'>('bulan_ini');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Hitung rentang tanggal efektif
  const { startDate, endDate, periodeLabel } = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (periodeMode === 'bulan_ini') {
      const startOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      return { 
        startDate: startOfMonth, 
        endDate: todayStr, 
        periodeLabel: `Bulan Berjalan (${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})` 
      };
    }
    if (periodeMode === '30_hari') {
      const past30 = new Date(d);
      past30.setDate(past30.getDate() - 29);
      const start30 = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, '0')}-${String(past30.getDate()).padStart(2, '0')}`;
      return { startDate: start30, endDate: todayStr, periodeLabel: '30 Hari Terakhir' };
    }
    if (periodeMode === 'semester') {
      return { startDate: '2026-07-15', endDate: todayStr, periodeLabel: 'Semester Ganjil 2026/2027' };
    }
    // kustom
    return { 
      startDate: customStartDate, 
      endDate: customEndDate, 
      periodeLabel: `Rentang Kustom (${customStartDate} s.d ${customEndDate})` 
    };
  }, [periodeMode, customStartDate, customEndDate]);

  // Hitung total hari kalender dalam periode evaluasi yang adil dan objektif
  const totalHariEvaluasi = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diffDays, 1);
  }, [startDate, endDate]);

  if (!isOpen || !siswa) return null;

  // Filter entri siswa dalam rentang periode evaluasi
  const studentEntries = entries.filter(
    (e) => e.siswa_id === siswa.id && e.tanggal >= startDate && e.tanggal <= endDate
  );

  // Jumlah hari siswa aktif mengisi dalam rentang ini
  const uniqueDates = new Set(studentEntries.map((e) => e.tanggal));
  const totalHariSiswaAktif = uniqueDates.size;

  // Hitung capaian per 7 kebiasaan terhadap TARGET totalHariEvaluasi
  const habitDetails = kebiasaanList.sort((a, b) => a.urutan - b.urutan).map((k) => {
    const habitEntries = studentEntries.filter((e) => e.kebiasaan_id === k.id);
    const totalTerisi = habitEntries.length;
    // Persentase dihitung objektif terhadap total hari periode evaluasi
    const persentase = Math.min(Math.round((totalTerisi / totalHariEvaluasi) * 100), 100);

    let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Perlu Bimbingan';
    let kodePredikat = 'D';
    let catatanKarakter = '';

    if (persentase >= 85) {
      predikat = 'Sangat Baik';
      kodePredikat = 'A';
      catatanKarakter = `Sangat istiqomah dan mandiri dalam membiasakan diri ${k.nama.toLowerCase()}.`;
    } else if (persentase >= 70) {
      predikat = 'Baik';
      kodePredikat = 'B';
      catatanKarakter = `Mampu melaksanakan pembiasaan ${k.nama.toLowerCase()} dengan tertib dan konsisten.`;
    } else if (persentase >= 50) {
      predikat = 'Cukup';
      kodePredikat = 'C';
      catatanKarakter = `Cukup baik dalam pembiasaan, namun perlu ditingkatkan frekuensinya di rumah.`;
    } else {
      predikat = 'Perlu Bimbingan';
      kodePredikat = 'D';
      catatanKarakter = `Perlu pendampingan dan dorongan orang tua agar lebih rajin ${k.nama.toLowerCase()}.`;
    }

    return {
      kebiasaan: k,
      totalTerisi,
      persentase,
      predikat,
      kodePredikat,
      catatanKarakter
    };
  });

  // Rata-rata kepatuhan keseluruhan
  const totalPersen = habitDetails.reduce((acc, curr) => acc + curr.persentase, 0);
  const rataRataKepatuhan = Math.round(totalPersen / (habitDetails.length || 1));

  let predikatUmum = 'Cukup';
  let predikatBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  if (rataRataKepatuhan >= 85) {
    predikatUmum = 'Sangat Baik (A)';
    predikatBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (rataRataKepatuhan >= 70) {
    predikatUmum = 'Baik (B)';
    predikatBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (rataRataKepatuhan >= 50) {
    predikatUmum = 'Cukup (C)';
    predikatBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    predikatUmum = 'Perlu Bimbingan (D)';
    predikatBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  // Tanggal cetak
  const tanggalCetakFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col border border-slate-200 animate-slide-up">
        {/* Modal Toolbar (Non-printable) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Pratinjau Rapor Karakter 7KAIH
              </h3>
              <p className="text-xs text-slate-400">
                Dokumen Resmi Pembiasaan Karakter - {profile.nama}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Pilihan Periode Evaluasi */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setPeriodeMode('bulan_ini')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${periodeMode === 'bulan_ini' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setPeriodeMode('30_hari')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${periodeMode === '30_hari' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setPeriodeMode('semester')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${periodeMode === 'semester' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Semester
              </button>
              <button
                onClick={() => setPeriodeMode('kustom')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${periodeMode === 'kustom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Kustom
              </button>
            </div>

            {periodeMode === 'kustom' && (
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div className="p-6 sm:p-10 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0 print:overflow-visible bg-white text-slate-900 font-sans" ref={printAreaRef}>
          {/* KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center gap-4 text-center justify-between">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center p-1">
              <img 
                src={profile.logoKabupatenUrl || "/logos/logo_banyuwangi.png"} 
                alt={`Logo ${profile.kabupaten}`} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-600">
                PEMERINTAH {profile.kabupaten.toUpperCase()} • DINAS PENDIDIKAN
              </h4>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-slate-900">
                {profile.nama}
              </h2>
              <p className="text-[11px] text-slate-600 leading-tight">
                {profile.alamat} {profile.telepon ? `| Telp: ${profile.telepon}` : ''} {profile.website ? `| Web: ${profile.website.replace(/^https?:\/\//, '')}` : ''}
              </p>
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider pt-0.5">
                PROGRAM 7 KEBIASAAN ANAK INDONESIA HEBAT (KEMENDIKDASMEN RI)
              </p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 hidden sm:flex items-center justify-center p-1">
              <img 
                src={profile.logoUrl || "/logos/logo_smpn2_glagah.png"} 
                alt={`Logo ${profile.nama}`} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* JUDUL RAPOR */}
          <div className="text-center mb-6">
            <h3 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-slate-900 underline underline-offset-4">
              LEMBAR LAPORAN PEMBIASAAN KARAKTER SISWA
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tahun Ajaran {profile.tahunAjaran || '2026/2027'} • Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s.d. {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ({totalHariEvaluasi} Hari Pelaksanaan)
            </p>
          </div>

          {/* IDENTITAS SISWA */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-500 w-32 inline-block">Nama Lengkap</span>
              <span className="font-bold text-slate-900">: {siswa.nama}</span>
            </div>
            <div>
              <span className="text-slate-500 w-32 inline-block">Kelas / Rombel</span>
              <span className="font-bold text-slate-900">: Kelas {namaKelas}</span>
            </div>
            <div>
              <span className="text-slate-500 w-32 inline-block">NISN</span>
              <span className="font-semibold text-slate-900">: {siswa.nisn}</span>
            </div>
            <div>
              <span className="text-slate-500 w-32 inline-block">Guru Wali Kelas</span>
              <span className="font-semibold text-slate-900">: {waliKelasNama}</span>
            </div>
            <div>
              <span className="text-slate-500 w-32 inline-block">Target Pelaksanaan</span>
              <span className="font-bold text-slate-900">: {totalHariEvaluasi} Hari ({startDate} s.d {endDate})</span>
            </div>
            <div>
              <span className="text-slate-500 w-32 inline-block">Keaktifan Siswa</span>
              <span className="font-semibold text-slate-900">: {totalHariSiswaAktif} Hari Mengisi Jurnal</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 w-32 inline-block">Capaian Umum</span>
                <span className="font-bold text-emerald-800">: {predikatUmum} ({rataRataKepatuhan}%)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Evaluasi Berstandar Adil: {totalHariEvaluasi} Hari Periode</span>
            </div>
          </div>

          {/* TABEL CAPAIAN 7 KEBIASAAN */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 min-w-45 border-r border-slate-300">7 Kebiasaan Anak Hebat</th>
                  <th className="py-2.5 px-3 text-center w-20 border-r border-slate-300">Terlaksana</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-300">Kepatuhan</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-300">Predikat</th>
                  <th className="py-2.5 px-3">Catatan Perkembangan Karakter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {habitDetails.map((h, idx) => (
                  <tr key={h.kebiasaan.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {h.kebiasaan.nama}
                      <span className="block text-[10px] font-normal text-slate-500">
                        {h.kebiasaan.jam_mulai && h.kebiasaan.jam_selesai
                          ? `Target waktu: ${h.kebiasaan.jam_mulai} - ${h.kebiasaan.jam_selesai} WIB`
                          : 'Dilaksanakan setiap hari'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-semibold">
                      {h.totalTerisi} Kali
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold text-slate-800">
                      {h.persentase}%
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      <span className="font-extrabold text-xs block">
                        {h.kodePredikat}
                      </span>
                      <span className="text-[10px] text-slate-500">{h.predikat}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-[11px] leading-relaxed">
                      {h.catatanKarakter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CATATAN DAN MOTIVASI WALI KELAS & KEPALA SEKOLAH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-8">
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 space-y-1">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Catatan & Rekomendasi Guru Wali Kelas:</span>
              </h5>
              <p className="text-[11px] text-slate-700 italic leading-relaxed">
                "{siswa.nama} menunjukkan komitmen yang baik dalam membiasakan nilai-nilai karakter luhur. Terus pertahankan kedisiplinan dan kejujuran dalam segala aktivitas."
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 space-y-1">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Pesan Kepala Sekolah:</span>
              </h5>
              <p className="text-[11px] text-slate-700 italic leading-relaxed">
                "Karakter hebat lahir dari kebiasaan kecil yang dilakukan berulang kali dengan penuh keikhlasan dan kejujuran. Jadilah teladan bagi teman dan keluarga."
              </p>
            </div>
          </div>

          {/* TANDA TANGAN RESMI 3 PIHAK */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4">
            {/* Orang Tua */}
            <div className="space-y-16">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-900">Orang Tua / Wali Murid</p>
              </div>
              <div>
                <p className="border-b border-slate-800 w-36 mx-auto" />
                <p className="text-[11px] text-slate-500 pt-1">( Nama Terang Orang Tua )</p>
              </div>
            </div>

            {/* Wali Kelas */}
            <div className="space-y-16">
              <div>
                <p className="text-slate-500">{profile.kabupaten.replace(/^Kabupaten\s+/i, '')}, {tanggalCetakFormatted}</p>
                <p className="font-bold text-slate-900">Wali Kelas {namaKelas}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline underline-offset-2">{waliKelasNama || `Wali Kelas ${namaKelas}`}</p>
                <p className="text-[11px] text-slate-500">NIP. ....................................</p>
              </div>
            </div>

            {/* Kepala Sekolah */}
            <div className="space-y-16">
              <div>
                <p className="text-slate-500">Mengesahkan,</p>
                <p className="font-bold text-slate-900">Kepala {profile.nama}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline underline-offset-2">{profile.namaKepalaSekolah || kepalaSekolahNama || 'Kepala Sekolah'}</p>
                <p className="text-[11px] text-slate-500">NIP. {profile.nipKepalaSekolah || kepalaSekolahNip || '....................................'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Non-printable) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Format resmi ini siap dicetak pada kertas ukuran A4 atau disimpan dalam bentuk PDF.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
