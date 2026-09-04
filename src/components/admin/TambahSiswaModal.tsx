import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Calendar, 
  User, 
  GraduationCap, 
  Info,
  Sparkles
} from 'lucide-react';
import { Kelas, Siswa } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface TambahSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  onSuccess: (newStudent: Siswa) => void;
}

export const TambahSiswaModal: React.FC<TambahSiswaModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  onSuccess
}) => {
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || '');
  const [tanggalLahir, setTanggalLahir] = useState('2011-01-01');
  const [isMutasi, setIsMutasi] = useState(true);
  const [asalSekolah, setAsalSekolah] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Hitung password default preview dari tanggal_lahir (DDMMYYYY)
  const getPasswordPreview = () => {
    if (!tanggalLahir) return 'DDMMYYYY';
    try {
      const parts = tanggalLahir.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}${month.padStart(2, '0')}${year}`;
      }
    } catch (_) {}
    return 'DDMMYYYY';
  };

  const handleReset = () => {
    setNisn('');
    setNama('');
    setKelasId(kelasList[0]?.id || '');
    setTanggalLahir('2011-01-01');
    setIsMutasi(true);
    setAsalSekolah('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNisn = nisn.trim();
    const cleanNama = nama.trim();

    if (!cleanNisn) {
      setErrorMessage('NISN atau Nomor Induk Siswa wajib diisi!');
      return;
    }

    if (!cleanNama) {
      setErrorMessage('Nama lengkap siswa wajib diisi!');
      return;
    }

    if (!kelasId) {
      setErrorMessage('Silakan pilih rombel / kelas untuk siswa!');
      return;
    }

    if (!tanggalLahir) {
      setErrorMessage('Tanggal lahir wajib diisi untuk menentukan password default login!');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await JournalService.addSiswa({
        nisn: cleanNisn,
        nama: cleanNama,
        kelas_id: kelasId,
        tanggal_lahir: tanggalLahir
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.message || 'Gagal menyimpan siswa.');
        setIsSubmitting(false);
        return;
      }

      // Berhasil
      onSuccess(res.data);
      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
              <UserPlus className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Tambah Siswa Manual
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Pendaftaran siswa mutasi / pindahan di luar tarikan Dapodik
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Info Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <p className="font-bold text-emerald-950">
                Solusi Siswa Mutasi / Belum Masuk Dapodik:
              </p>
              <p className="text-emerald-800">
                Siswa yang baru masuk dapat langsung dibuatkan akunnya di sini. Jika NISN resmi belum terbit, Anda dapat menggunakan nomor induk sementara dan mengupdatenya nanti.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold text-xs">{errorMessage}</span>
            </div>
          )}

          {/* 1. NISN */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>NISN / Nomor Induk Siswa (Username Login) *</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib Unik</span>
            </label>
            <input
              type="text"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Contoh: 0098765432 atau MUTASI-8B-01"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gunakan 10 digit NISN resmi. Jika belum ada dari sekolah asal, gunakan kode sementara (misal: MUTASI-8B-01).
            </p>
          </div>

          {/* 2. Nama Lengkap Siswa */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Nama Lengkap Siswa *</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: AHMAD FAUZI RIDWAN"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              required
            />
          </div>

          {/* 3. Kelas / Rombel */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>Pilih Kelas / Rombel *</span>
            </label>
            <select
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 bg-white"
              required
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas} (Tingkat {k.tingkat})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tanggal Lahir & Password Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tanggal Lahir *</span>
              </label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 bg-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                <span>Password Login Siswa</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between font-mono font-black text-purple-900 text-sm">
                <span>{getPasswordPreview()}</span>
                <span className="text-[10px] text-purple-600 font-sans font-medium">DDMMYYYY</span>
              </div>
            </div>
          </div>

          {/* 5. Catatan / Asal Sekolah Mutasi */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMutasiCheck"
                checked={isMutasi}
                onChange={(e) => setIsMutasi(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isMutasiCheck" className="font-bold text-slate-800 cursor-pointer">
                Siswa Mutasi / Pindahan Masuk
              </label>
            </div>

            {isMutasi && (
              <div className="pt-1">
                <input
                  type="text"
                  value={asalSekolah}
                  onChange={(e) => setAsalSekolah(e.target.value)}
                  placeholder="Asal Sekolah (Opsional, misal: SMPN 1 Banyuwangi)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 text-xs"
                />
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Siswa</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
