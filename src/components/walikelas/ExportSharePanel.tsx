import React, { useState } from 'react';
import { Download, Share2, FileSpreadsheet, MessageCircle, Check, Sparkles } from 'lucide-react';
import { EntriJurnal, Kebiasaan, Siswa } from '../../types/database';
import { buildClassDailyMatrix, exportClassRekapToExcel, generateWhatsAppSummaryText, shareToWhatsApp } from '../../lib/excelExporter';

interface ExportSharePanelProps {
  namaKelas: string;
  selectedDate: string;
  siswaList: Siswa[];
  kebiasaanList: Kebiasaan[];
  entries: EntriJurnal[];
}

export const ExportSharePanel: React.FC<ExportSharePanelProps> = ({
  namaKelas,
  selectedDate,
  siswaList,
  kebiasaanList,
  entries
}) => {
  const [isShared, setIsShared] = useState(false);
  const [isExported, setIsExported] = useState(false);

  const rekapRows = buildClassDailyMatrix(siswaList, kebiasaanList, entries, selectedDate);

  const handleExportExcel = () => {
    exportClassRekapToExcel(namaKelas, selectedDate, rekapRows);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  const handleShareWhatsApp = async () => {
    const text = generateWhatsAppSummaryText(namaKelas, selectedDate, rekapRows);
    await shareToWhatsApp(text);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2500);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="space-y-1.5 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Laporan Kepatuhan Harian Siswa</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Export & Bagikan Rekap {namaKelas}
        </h3>
        <p className="text-xs text-slate-300">
          Unduh laporan Excel resmi dengan format rapi atau kirimkan ringkasan laporan langsung ke grup WhatsApp wali murid.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Tombol Export Excel */}
        <button
          onClick={handleExportExcel}
          className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95"
        >
          {isExported ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Tersimpan (.xlsx)</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </>
          )}
        </button>

        {/* Tombol Share WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-green-500/20 transition flex items-center justify-center gap-2 active:scale-95"
        >
          {isShared ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>Terkirim ke WhatsApp</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Bagikan ke WhatsApp</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
