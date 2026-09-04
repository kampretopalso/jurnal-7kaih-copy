import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { Siswa } from '../../types/database';
import { MockDatabase } from '../../lib/mockStore';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [parsedStudents, setParsedStudents] = useState<Siswa[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (!rawData || rawData.length === 0) {
          setError('File Excel kosong atau format tidak sesuai.');
          setIsProcessing(false);
          return;
        }

        // Map format Dapodik/Excel ke objek Siswa
        const students: Siswa[] = rawData.map((row, index) => {
          const nisn = String(row.NISN || row.nisn || row['No Induk'] || `008${1234500 + index}`);
          const nama = String(row.Nama || row.nama || row['Nama Siswa'] || `Siswa Baru ${index + 1}`);
          const tanggalLahir = String(row['Tanggal Lahir'] || row.tanggal_lahir || '2011-01-01');

          return {
            id: 's-imported-' + Date.now() + '-' + index,
            nisn: nisn.trim(),
            nama: nama.trim(),
            kelas_id: 'k-vii-a',
            tanggal_lahir: tanggalLahir,
            sudah_ganti_password: false
          };
        });

        setParsedStudents(students);
      } catch (err: any) {
        setError('Gagal membaca file Excel: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveImport = () => {
    if (parsedStudents.length === 0) return;

    MockDatabase.importSiswa(parsedStudents);
    setSuccessMsg(`Berhasil mengimpor ${parsedStudents.length} siswa ke database!`);
    setTimeout(() => {
      onImportSuccess();
      onClose();
    }, 1500);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { NISN: '0081234599', 'Nama Siswa': 'Contoh Siswa Dapodik', 'Tanggal Lahir': '2011-06-15' },
      { NISN: '0081234600', 'Nama Siswa': 'Contoh Siswa Kedua', 'Tanggal Lahir': '2011-09-20' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa_Dapodik.xlsx');
  };

  const handleResetData = () => {
    if (window.confirm('Kembalikan semua data ke 32 siswa default dan reset jurnal?')) {
      MockDatabase.resetToDefault();
      setSuccessMsg('Data berhasil direset ke kondisi awal!');
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Import Data Siswa dari Excel / Dapodik</span>
            </h3>
            <p className="text-xs text-slate-500">
              Unggah file data siswa untuk otomatis mendaftarkan akun di sistem.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Download Template Button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-600 font-medium">Butuh format kolom Excel Dapodik?</span>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer text-center">
            <Upload className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-800 block">
              Pilih file Excel (.xlsx / .xls / .csv)
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Kolom wajib: NISN, Nama Siswa, Tanggal Lahir (YYYY-MM-DD)
            </span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Preview Parsed */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Preview Data Siswa ({parsedStudents.length} siswa terdeteksi):
              </span>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {parsedStudents.slice(0, 10).map((s, i) => (
                  <div key={i} className="p-2 flex items-center justify-between bg-slate-50/50">
                    <span className="font-semibold text-slate-800">{s.nama}</span>
                    <span className="text-slate-400 font-mono">NISN: {s.nisn}</span>
                  </div>
                ))}
                {parsedStudents.length > 10 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 italic">
                    +{parsedStudents.length - 10} siswa lainnya...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset ke 32 Siswa Default</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={parsedStudents.length === 0 || isProcessing}
            onClick={handleSaveImport}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isProcessing ? 'Memproses...' : `Simpan ${parsedStudents.length} Siswa`}
          </button>
        </div>
      </div>
    </div>
  );
};
