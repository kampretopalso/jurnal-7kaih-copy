import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MessageSquarePlus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { KategoriArahan, Kelas, StafSekolah } from '../../types/database';

interface ArahanWaliKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  stafList: StafSekolah[];
  currentStaf: StafSekolah;
  selectedKelasIdDefault?: string;
  onSendSuccess: (
    kelasId: string, 
    kategori: KategoriArahan, 
    judul: string, 
    pesan: string
  ) => void;
}

export const ArahanWaliKelasModal: React.FC<ArahanWaliKelasModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  stafList,
  currentStaf,
  selectedKelasIdDefault,
  onSendSuccess
}) => {
  const [kelasId, setKelasId] = useState<string>(selectedKelasIdDefault || (kelasList[0]?.id || ''));
  const [kategori, setKategori] = useState<KategoriArahan>('apresiasi');
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const targetClass = kelasList.find((k) => k.id === kelasId);
  const targetWali = stafList.find((s) => s.id === targetClass?.wali_kelas_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!kelasId) {
      setError('Silakan pilih kelas tujuan.');
      return;
    }
    if (!judul.trim()) {
      setError('Silakan isi judul arahan / feedback.');
      return;
    }
    if (!pesan.trim()) {
      setError('Silakan isi pesan atau arahan untuk wali kelas.');
      return;
    }

    onSendSuccess(kelasId, kategori, judul.trim(), pesan.trim());
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setJudul('');
      setPesan('');
      onClose();
    }, 1200);
  };

  const getKategoriBadge = (kat: KategoriArahan) => {
    switch (kat) {
      case 'apresiasi':
        return { label: 'Apresiasi & Pujian', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'evaluasi':
        return { label: 'Evaluasi & Catatan', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'instruksi':
        return { label: 'Instruksi Kebiasaan', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'tindak_lanjut':
        return { label: 'Tindak Lanjut Siswa', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Pimpinan Sekolah • {currentStaf.nama}
            </span>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 mt-1">
              <MessageSquarePlus className="w-5 h-5 text-purple-600" />
              <span>Beri Arahan / Feedback ke Wali Kelas</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Arahan berhasil dikirimkan ke Wali Kelas!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1">
          {/* Pilih Kelas Tujuan (7A - 9F) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Kelas Tujuan
            </label>
            <select
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas} (Tingkat {k.tingkat})
                </option>
              ))}
            </select>
            {targetWali && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Wali Kelas: <strong className="text-slate-600">{targetWali.nama}</strong>
              </span>
            )}
          </div>

          {/* Kategori Arahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kategori Pesan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['apresiasi', 'evaluasi', 'instruksi', 'tindak_lanjut'] as KategoriArahan[]).map((kat) => {
                const info = getKategoriBadge(kat);
                const isSelected = kategori === kat;

                return (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setKategori(kat)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-left ${
                      isSelected
                        ? `${info.color} shadow-sm ring-2 ring-purple-400`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Judul Arahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Topik / Judul Arahan
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Penguatan Kepatuhan Bangun Pagi dan Sholat Subuh"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Isi Pesan Arahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Isi Arahan / Feedback
            </label>
            <textarea
              required
              rows={4}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Tuliskan arahan, tindak lanjut, atau apresiasi terinci untuk wali kelas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={success}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Kirim ke Wali Kelas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
