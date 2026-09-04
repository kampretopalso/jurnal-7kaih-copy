import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileCheck,
  Briefcase
} from 'lucide-react';
import { Kelas, RoleStaf, StafSekolah } from '../../types/database';
import { JournalService } from '../../lib/journalService';
import { matchKelas } from './DataImportSiswaModal';

interface DataImportStafModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  onImportSuccess: () => void;
}

interface ParsedStafRow {
  nip_atau_nik: string;
  nama: string;
  tanggal_lahir: string;
  role: RoleStaf;
  kelas: string;
  matchedKelasName?: string;
  matchedKelasId?: string | null;
  status_asn: boolean;
  isValid: boolean;
  errorReason?: string;
}

export const DataImportStafModal: React.FC<DataImportStafModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStafRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true); // Opsi replace staf dummy
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadTemplateExcel = () => {
    const templateData = [
      ['NIP_atau_NIK', 'Nama Lengkap', 'Tanggal_Lahir', 'Role', 'Kelas', 'Status_ASN'],
      ['197201011998031002', 'Drs. Bambang Sudarmono, M.Pd', '1972-01-01', 'kepala_sekolah', '', 'ASN'],
      ['197808122003122004', 'Hj. Nurul Fadilah, M.Pd', '1978-08-12', 'waka_kurikulum', '', 'ASN'],
      ['198904202015041001', 'Hendra Wijaya, S.Pd', '1989-04-20', 'kesiswaan', '', 'ASN'],
      ['198503152010012003', 'Siti Rahayu, S.Pd', '1985-03-15', 'wali_kelas', '7A', 'ASN'],
      ['3201234567890001', 'Ahmad Hidayat, S.Pd', '1988-06-10', 'wali_kelas', '7B', 'Non-ASN'],
      ['198104152006042011', 'Tri Wahyuni, M.Pd', '1981-04-15', 'wali_kelas', '8A', 'ASN'],
      ['197509142000032001', 'Dra. Endang Sulastri', '1975-09-14', 'wali_kelas', '9A', 'ASN']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Staf');
    XLSX.writeFile(wb, 'Template_Import_Staf_SMPN2Glagah.xlsx');
  };

  const downloadTemplateCsv = () => {
    const csvContent = 
      "NIP_atau_NIK,Nama Lengkap,Tanggal_Lahir,Role,Kelas,Status_ASN\n" +
      "197201011998031002,Drs. Bambang Sudarmono M.Pd,1972-01-01,kepala_sekolah,,ASN\n" +
      "197808122003122004,Hj. Nurul Fadilah M.Pd,1978-08-12,waka_kurikulum,,ASN\n" +
      "198904202015041001,Hendra Wijaya S.Pd,1989-04-20,kesiswaan,,ASN\n" +
      "198503152010012003,Siti Rahayu S.Pd,1985-03-15,wali_kelas,7A,ASN\n" +
      "3201234567890001,Ahmad Hidayat S.Pd,1988-06-10,wali_kelas,7B,Non-ASN\n" +
      "198104152006042011,Tri Wahyuni M.Pd,1981-04-15,wali_kelas,8A,ASN\n" +
      "197509142000032001,Dra. Endang Sulastri,1975-09-14,wali_kelas,9A,ASN\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Staf_SMPN2Glagah.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Normalisasi tanggal lahir ke YYYY-MM-DD
  const normalizeDate = (rawDate: any): string => {
    if (!rawDate) return '1985-01-01';
    
    if (typeof rawDate === 'number') {
      const date = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(str)) {
      const parts = str.split(/[/-]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }

    return '1985-01-01';
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
          setErrorMessage('File Excel/CSV kosong atau tidak memiliki data staf.');
          setIsProcessing(false);
          return;
        }

        const header = data[0].map((h: any) => String(h || '').trim().toLowerCase());
        const nipIdx = header.findIndex((h: string) => h.includes('nip') || h.includes('nik') || h.includes('username'));
        const namaIdx = header.findIndex((h: string) => h.includes('nama'));
        const dobIdx = header.findIndex((h: string) => h.includes('lahir') || h.includes('tanggal') || h.includes('tgl') || h.includes('dob'));
        const roleIdx = header.findIndex((h: string) => h.includes('role') || h.includes('jabatan'));
        const kelasIdx = header.findIndex((h: string) => h.includes('kelas') || h.includes('rombel'));
        const asnIdx = header.findIndex((h: string) => h.includes('asn') || h.includes('status'));

        if (nipIdx === -1 || namaIdx === -1) {
          setErrorMessage('Format kolom tidak sesuai. Wajib terdapat kolom "NIP_atau_NIK" dan "Nama Lengkap".');
          setIsProcessing(false);
          return;
        }

        const parsed: ParsedStafRow[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[nipIdx]) continue;

          const rawNip = String(row[nipIdx] || '').trim();
          const rawNama = String(row[namaIdx] || '').trim();
          const rawDob = dobIdx !== -1 ? row[dobIdx] : '1985-01-01';
          const dob = normalizeDate(rawDob);
          let rawRole = roleIdx !== -1 ? String(row[roleIdx] || '').trim().toLowerCase() : 'wali_kelas';
          const rawKelas = kelasIdx !== -1 ? String(row[kelasIdx] || '').trim() : '';
          const rawAsn = asnIdx !== -1 ? String(row[asnIdx] || '').trim().toUpperCase() : 'ASN';

          // Normalisasi role
          let role: RoleStaf = 'wali_kelas';
          if (rawRole.includes('kepala') || rawRole.includes('kepsek')) role = 'kepala_sekolah';
          else if (rawRole.includes('kurikulum')) role = 'waka_kurikulum';
          else if (rawRole.includes('kesiswaan')) role = 'kesiswaan';
          else if (rawRole.includes('admin')) role = 'superadmin';
          else role = 'wali_kelas';

          const isAsn = rawAsn === 'ASN' || rawAsn === 'TRUE' || rawAsn === 'PNS' || rawAsn === 'PPPK';

          const matchedK = matchKelas(rawKelas, kelasList);

          let isValid = true;
          let reason: string | undefined;

          if (!rawNip || rawNip.length < 5) {
            isValid = false;
            reason = 'NIP/NIK minimal 5 karakter';
          } else if (!rawNama) {
            isValid = false;
            reason = 'Nama staf wajib diisi';
          } else if (role === 'wali_kelas' && !rawKelas) {
            isValid = false;
            reason = 'Kelas wajib diisi untuk Wali Kelas (misal 7A)';
          }

          parsed.push({
            nip_atau_nik: rawNip,
            nama: rawNama,
            tanggal_lahir: dob,
            role,
            kelas: rawKelas,
            matchedKelasName: matchedK?.nama_kelas,
            matchedKelasId: matchedK?.id || null,
            status_asn: isAsn,
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
      setErrorMessage('Tidak ada data staf valid yang dapat diimpor.');
      return;
    }

    setIsProcessing(true);

    const staffToImport: StafSekolah[] = validRows.map((r, idx) => {
      const cleanClassName = r.matchedKelasName || r.kelas || '';
      return {
        id: `staf-imp-${Date.now()}-${idx}`,
        nama: r.nama,
        role: r.role,
        status_asn: r.status_asn,
        nip_atau_nik: r.nip_atau_nik,
        tanggal_lahir: r.tanggal_lahir,
        kelas_id: r.role === 'wali_kelas' ? (cleanClassName || r.matchedKelasId || null) : null,
        scope: (r.role === 'wali_kelas' ? 'kelas' : 'sekolah') as 'kelas' | 'sekolah',
        sudah_ganti_password: false
      };
    });

    await JournalService.importStaf(staffToImport, replaceAll);
    const modeText = replaceAll ? 'menggantikan seluruh data guru dummy sebelumnya' : 'menambahkan ke data yang ada';
    setSuccessMessage(`Berhasil mengimpor ${staffToImport.length} data Staf Sekolah SMPN 2 Glagah ke cloud database (${modeText})! Password default adalah Tanggal Lahir (DDMMYYYY).`);
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                Import Data Guru & Staf SMPN 2 Glagah
              </h3>
              <p className="text-xs text-slate-400">
                Impor data pendidik via Excel/CSV. Password awal login = Tanggal Lahir (DDMMYYYY)
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
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Format Kolom CSV / Excel Guru & Staf yang Dibutuhkan:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">1. NIP/NIK</span>
                <span className="text-slate-500 text-[10px]">Username login</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">2. Nama</span>
                <span className="text-slate-500 text-[10px]">Nama + Gelar</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-emerald-700 block">3. Tgl Lahir</span>
                <span className="text-slate-500 text-[10px]">Pass (DDMMYYYY)</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">4. Role</span>
                <span className="text-slate-500 text-[10px]">wali_kelas / ks</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">5. Kelas</span>
                <span className="text-slate-500 text-[10px]">7A, 8B (wali)</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block">6. Status ASN</span>
                <span className="text-slate-500 text-[10px]">ASN / Non-ASN</span>
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
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition flex items-center gap-1 text-[11px]"
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
                id="replace-staf-toggle"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="replace-staf-toggle" className="cursor-pointer font-bold text-xs">
                Hapus & Gantikan seluruh guru dummy sebelumnya (Akun Superadmin Anda tetap aman)
              </label>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
              {replaceAll ? 'Mode Bersih (Rekomendasi)' : 'Mode Gabung'}
            </span>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 text-center transition bg-slate-50/50">
            <input
              type="file"
              id="file-staf-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-staf-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700">
                {file ? file.name : 'Klik untuk Upload File Staf Sekolah (.xlsx / .csv)'}
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
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Preview Data Terdeteksi ({parsedRows.length} Staf)</span>
                <span className="text-emerald-600">
                  {parsedRows.filter((r) => r.isValid).length} Siap Diimpor
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">NIP / NIK</th>
                      <th className="py-2 px-3">Nama</th>
                      <th className="py-2 px-3">Tgl Lahir (Pass)</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-1.5 px-3">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold">{r.nip_atau_nik}</td>
                        <td className="py-1.5 px-3">{r.nama}</td>
                        <td className="py-1.5 px-3 text-slate-600">{r.tanggal_lahir}</td>
                        <td className="py-1.5 px-3 font-bold text-indigo-700">{r.role}</td>
                        <td className="py-1.5 px-3">{r.matchedKelasName ? `Kelas ${r.matchedKelasName}` : '-'}</td>
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
          )}
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
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Impor Staf</span>
          </button>
        </div>
      </div>
    </div>
  );
};
