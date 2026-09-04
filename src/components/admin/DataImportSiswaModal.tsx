import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Users, 
  FileCheck
} from 'lucide-react';
import { Kelas, Siswa } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface DataImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  onImportSuccess: () => void;
}

interface ParsedSiswaRow {
  nisn: string;
  nama: string;
  kelas: string;
  matchedKelasName?: string;
  matchedKelasId?: string;
  tanggal_lahir: string;
  isValid: boolean;
  errorReason?: string;
}

/**
 * Normalisasi pencocokan nama kelas (misal: "7A", "7 A", "VII A", "Kelas 7A", "VIII-B", "IX F")
 */
export function matchKelas(rawKelas: string, kelasList: Kelas[]): Kelas | undefined {
  if (!rawKelas) return undefined;
  
  let clean = String(rawKelas).trim().toUpperCase()
    .replace(/^KELAS\s*/i, '')
    .replace(/^TINGKAT\s*/i, '')
    .replace(/^ROMBEL\s*/i, '')
    .replace(/[\s\-_.]/g, '');

  // Romawi ke Angka
  if (clean.startsWith('VII')) {
    clean = '7' + clean.slice(3);
  } else if (clean.startsWith('VIII')) {
    clean = '8' + clean.slice(4);
  } else if (clean.startsWith('IX')) {
    clean = '9' + clean.slice(2);
  }

  // Cari match exact dengan nama_kelas (misal: '7A')
  let match = kelasList.find(k => {
    const kClean = k.nama_kelas.toUpperCase().replace(/[\s\-_.]/g, '');
    return kClean === clean;
  });

  if (match) return match;

  // Partial search
  match = kelasList.find(k => {
    const kClean = k.nama_kelas.toUpperCase().replace(/[\s\-_.]/g, '');
    return clean.includes(kClean) || kClean.includes(clean);
  });

  return match;
}

/**
 * Ekstraksi nama kelas bersih yang fleksibel untuk sekolah apa pun (misal: "7A", "8-1", "X-IPA", dll)
 */
export function extractCleanKelasName(rawKelas: string, kelasList: Kelas[]): string {
  const matched = matchKelas(rawKelas, kelasList);
  if (matched) return matched.nama_kelas;

  if (!rawKelas) return '7A';

  let clean = String(rawKelas).trim().toUpperCase()
    .replace(/^KELAS\s*/i, '')
    .replace(/^TINGKAT\s*/i, '')
    .replace(/^ROMBEL\s*/i, '')
    .trim();

  if (clean.startsWith('VII-') || clean.startsWith('VII ') || clean.startsWith('VII')) {
    clean = '7' + clean.replace(/^VII[\s\-_.]*/i, '');
  } else if (clean.startsWith('VIII-') || clean.startsWith('VIII ') || clean.startsWith('VIII')) {
    clean = '8' + clean.replace(/^VIII[\s\-_.]*/i, '');
  } else if (clean.startsWith('IX-') || clean.startsWith('IX ') || clean.startsWith('IX')) {
    clean = '9' + clean.replace(/^IX[\s\-_.]*/i, '');
  }

  return clean || '7A';
}

export const DataImportSiswaModal: React.FC<DataImportSiswaModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedSiswaRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true); // Default true agar data dummy tergantikan otomatis
  const [syncClasses, setSyncClasses] = useState(true); // Otomatis sesuaikan jumlah kelas (3, 6, 12, 18, 24 rombel)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadTemplateExcel = () => {
    const templateData = [
      ['NISN', 'Nama Siswa', 'Kelas', 'Tanggal_Lahir'],
      ['0081234567', 'Aditya Pratama Putra', '7A', '2011-05-15'],
      ['0081234568', 'Anisa Rahmawati', '7A', '2011-08-22'],
      ['0081234569', 'Bagas Dwi Cahyo', '7B', '2011-02-10'],
      ['0081234570', 'Cantika Dewi Lestari', '7B', '2011-11-04'],
      ['0071234571', 'Dimas Arya Nugraha', '8A', '2010-06-18'],
      ['0061234572', 'Eka Putri Handayani', '9A', '2009-09-30']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa_SMPN2Glagah.xlsx');
  };

  const downloadTemplateCsv = () => {
    const csvContent = 
      "NISN,Nama Siswa,Kelas,Tanggal_Lahir\n" +
      "0081234567,Aditya Pratama Putra,7A,2011-05-15\n" +
      "0081234568,Anisa Rahmawati,7A,2011-08-22\n" +
      "0081234569,Bagas Dwi Cahyo,7B,2011-02-10\n" +
      "0081234570,Cantika Dewi Lestari,7B,2011-11-04\n" +
      "0071234571,Dimas Arya Nugraha,8A,2010-06-18\n" +
      "0061234572,Eka Putri Handayani,9A,2009-09-30\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Siswa_SMPN2Glagah.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Normalisasi tanggal lahir ke format YYYY-MM-DD
  const normalizeDate = (rawDate: any): string => {
    if (!rawDate) return '2011-01-01';
    
    // Jika dari excel berupa serial number
    if (typeof rawDate === 'number') {
      const date = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    // Format DD/MM/YYYY atau DD-MM-YYYY
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(str)) {
      const parts = str.split(/[/-]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }

    return '2011-01-01';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];

        if (data.length <= 1) {
          setErrorMessage('File Excel/CSV kosong atau tidak memiliki data siswa.');
          setIsProcessing(false);
          return;
        }

        // Header mapping
        const header = data[0].map((h: any) => String(h || '').trim().toLowerCase());
        const nisnIdx = header.findIndex((h: string) => h.includes('nisn') || h.includes('nis') || h.includes('nomor induk'));
        const namaIdx = header.findIndex((h: string) => h.includes('nama'));
        const kelasIdx = header.findIndex((h: string) => h.includes('kelas') || h.includes('rombel') || h.includes('tingkat'));
        const dobIdx = header.findIndex((h: string) => h.includes('lahir') || h.includes('tanggal') || h.includes('tgl') || h.includes('dob'));

        if (nisnIdx === -1 || namaIdx === -1) {
          setErrorMessage('Format kolom tidak sesuai. Wajib terdapat kolom "NISN" dan "Nama Siswa".');
          setIsProcessing(false);
          return;
        }

        const parsed: ParsedSiswaRow[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[nisnIdx]) continue;

          const rawNisn = String(row[nisnIdx] || '').trim();
          const rawNama = String(row[namaIdx] || '').trim();
          const rawKelas = kelasIdx !== -1 ? String(row[kelasIdx] || '').trim() : '';
          const rawDob = dobIdx !== -1 ? row[dobIdx] : '2011-01-01';
          const dob = normalizeDate(rawDob);

          const matchedK = matchKelas(rawKelas, kelasList);
          const targetKelasName = matchedK ? matchedK.nama_kelas : extractCleanKelasName(rawKelas, kelasList);

          let isValid = true;
          let reason: string | undefined;

          if (!rawNisn || rawNisn.length < 5) {
            isValid = false;
            reason = 'NISN minimal 5 digit';
          } else if (!rawNama) {
            isValid = false;
            reason = 'Nama siswa wajib diisi';
          }

          parsed.push({
            nisn: rawNisn,
            nama: rawNama,
            kelas: rawKelas,
            matchedKelasName: targetKelasName,
            matchedKelasId: matchedK?.id,
            tanggal_lahir: dob,
            isValid,
            errorReason: reason
          });
        }

        setParsedRows(parsed);
      } catch (err: any) {
        setErrorMessage('Gagal memproses file: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Tidak ada data siswa valid yang dapat diimpor.');
      return;
    }

    setIsProcessing(true);

    const studentsToImport: Siswa[] = validRows.map((r, idx) => {
      const item: any = {
        id: `s-imp-${Date.now()}-${idx}`,
        nisn: r.nisn,
        nama: r.nama,
        kelas_id: r.matchedKelasId || `k-${r.matchedKelasName?.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        kelas_name: r.matchedKelasName || r.kelas || '7A',
        tanggal_lahir: r.tanggal_lahir,
        sudah_ganti_password: false
      };
      return item as Siswa;
    });

    const result = await JournalService.importSiswa(studentsToImport, replaceAll, syncClasses);
    const modeText = replaceAll ? 'menggantikan seluruh data dummy sebelumnya' : 'menambahkan ke data yang ada';
    
    // Hitung distribusi kelas
    const classCountMap: Record<string, number> = {};
    validRows.forEach(r => {
      const c = r.matchedKelasName || '7A';
      classCountMap[c] = (classCountMap[c] || 0) + 1;
    });

    const summaryDist = Object.entries(classCountMap)
      .slice(0, 5)
      .map(([k, cnt]) => `${k}: ${cnt}`)
      .join(', ');

    const classStatsText = result.newClassesCount > 0 
      ? ` (${result.newClassesCount} rombel baru otomatis dibuat)` 
      : '';

    setSuccessMessage(`Berhasil mengimpor ${studentsToImport.length} data siswa (${modeText})! Rombel otomatis disinkronkan${classStatsText}.`);
    setIsProcessing(false);
    
    setTimeout(() => {
      onImportSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                Import Data Siswa SMPN 2 Glagah (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-400">
                Impor data siswa Dapodik / Excel ke dalam database sekolah (Otomatis terbagi ke 7A s.d 9F)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Format Kolom Penjelasan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <span>Format Kolom CSV / Excel yang Dibutuhkan:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-purple-700 block">1. NISN</span>
                <span className="text-slate-500 text-[10px]">Contoh: 0081234567</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-purple-700 block">2. Nama Siswa</span>
                <span className="text-slate-500 text-[10px]">Nama lengkap siswa</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-purple-700 block">3. Kelas</span>
                <span className="text-slate-500 text-[10px]">7A, 7B, s.d 9F</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-purple-700 block">4. Tanggal Lahir</span>
                <span className="text-slate-500 text-[10px]">YYYY-MM-DD / DD/MM/YYYY</span>
              </div>
            </div>

            {/* Tombol Unduh Template */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={downloadTemplateExcel}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={downloadTemplateCsv}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold hover:bg-purple-100 transition flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* Opsi Penggantian Data Dummy */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="replace-siswa-toggle"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="replace-siswa-toggle" className="cursor-pointer font-bold text-xs">
                Hapus & Gantikan seluruh data dummy sebelumnya dengan file ini
              </label>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
              {replaceAll ? 'Mode Bersih (Rekomendasi)' : 'Mode Gabung'}
            </span>
          </div>

          {/* Opsi Sinkronisasi Rombel Otomatis */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sync-kelas-toggle"
                checked={syncClasses}
                onChange={(e) => setSyncClasses(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="sync-kelas-toggle" className="cursor-pointer font-bold text-xs">
                Otomatis sesuaikan rombel (Buat kelas baru & bersihkan rombel kosong di luar file)
              </label>
            </div>
            <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full font-bold">
              Fleksibel Rombel
            </span>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-3xl p-6 text-center transition bg-slate-50/50">
            <input
              type="file"
              id="file-siswa-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-siswa-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700">
                {file ? file.name : 'Klik untuk Upload File Siswa (.xlsx / .csv)'}
              </p>
              <p className="text-[11px] text-slate-400">
                Format file didukung: Microsoft Excel (.xlsx, .xls) atau CSV
              </p>
            </label>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Preview Parsed Data */}
          {parsedRows.length > 0 && (() => {
            const detectedClasses = Array.from(new Set(parsedRows.map((r) => r.matchedKelasName).filter(Boolean))).sort();
            const newClasses = detectedClasses.filter((c) => !kelasList.some((k) => k.nama_kelas.toUpperCase() === c?.toUpperCase()));

            return (
              <div className="space-y-3">
                {/* Rombel Badge Overview */}
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-900">
                      Terdeteksi {detectedClasses.length} Rombel / Kelas dari File:
                    </span>
                    {newClasses.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        +{newClasses.length} Rombel Baru Otomatis Dibuat
                      </span>
                    ) : (
                      <span className="text-[10px] text-purple-600 font-semibold">
                        Semua rombel sesuai
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedClasses.map((c) => {
                      const isExisting = kelasList.some((k) => k.nama_kelas.toUpperCase() === c?.toUpperCase());
                      return (
                        <span
                          key={c}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                            isExisting
                              ? 'bg-white text-purple-800 border border-purple-200 shadow-2xs'
                              : 'bg-emerald-600 text-white shadow-xs'
                          }`}
                        >
                          <span>{c}</span>
                          {!isExisting && (
                            <span className="text-[9px] bg-emerald-700 text-emerald-100 px-1 rounded-sm font-extrabold">
                              BARU
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Preview Data Terdeteksi ({parsedRows.length} Siswa)</span>
                  <span className="text-emerald-600">
                    {parsedRows.filter((r) => r.isValid).length} Siap Diimpor
                  </span>
                </div>

              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">NISN</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">Kelas Asal</th>
                      <th className="py-2 px-3">Kelas Terpetakan</th>
                      <th className="py-2 px-3">Tgl Lahir</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-1.5 px-3">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold">{r.nisn}</td>
                        <td className="py-1.5 px-3">{r.nama}</td>
                        <td className="py-1.5 px-3 text-slate-500">{r.kelas}</td>
                        <td className="py-1.5 px-3 font-bold text-purple-700">Kelas {r.matchedKelasName}</td>
                        <td className="py-1.5 px-3">{r.tanggal_lahir}</td>
                        <td className="py-1.5 px-3">
                          {r.isValid ? (
                            <span className="text-emerald-600 font-bold">Valid</span>
                          ) : (
                            <span className="text-rose-600 font-bold">{r.errorReason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleCommitImport}
            className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Impor ke Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
