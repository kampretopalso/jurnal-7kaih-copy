import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Save, 
  CheckCircle2, 
  Clock, 
  Sliders,
  Sparkles
} from 'lucide-react';
import { Kebiasaan } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface KebiasaanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  kebiasaan: Kebiasaan | null;
  onSaveSuccess: () => void;
}

export const KebiasaanConfigModal: React.FC<KebiasaanConfigModalProps> = ({
  isOpen,
  onClose,
  kebiasaan,
  onSaveSuccess
}) => {
  if (!isOpen || !kebiasaan) return null;

  const [nama, setNama] = useState(kebiasaan.nama);
  const [deskripsi, setDeskripsi] = useState(kebiasaan.deskripsi || '');
  const [jamMulai, setJamMulai] = useState(kebiasaan.jam_mulai || '');
  const [jamSelesai, setJamSelesai] = useState(kebiasaan.jam_selesai || '');
  const [toleransiMenit, setToleransiMenit] = useState(kebiasaan.toleransi_menit || 0);
  const [maksInput, setMaksInput] = useState(kebiasaan.maks_input_harian || 1);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Kebiasaan = {
      ...kebiasaan,
      nama,
      deskripsi,
      jam_mulai: jamMulai || null,
      jam_selesai: jamSelesai || null,
      toleransi_menit: Number(toleransiMenit),
      maks_input_harian: Number(maksInput)
    };

    await JournalService.updateKebiasaan(updated);
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
      onSaveSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Konfigurasi Aturan Kebiasaan
              </h3>
              <p className="text-xs text-slate-400">
                Ubah jam berlaku, toleransi waktu, dan batas harian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Konfigurasi kebiasaan berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama Kebiasaan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Kebiasaan
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-semibold"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Deskripsi / Petunjuk untuk Siswa
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Pengaturan Jam */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jam Mulai (HH:MM)</span>
                </label>
                <input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kosongkan jika fleksibel</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jam Selesai (HH:MM)</span>
                </label>
                <input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Batas akhir tepat waktu</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
              ℹ️ Sistem aktif menerima pengisian jurnal harian setiap hari dari <strong>pukul 01:00 s.d 24:00 WIB</strong>.
            </p>
          </div>

          {/* Toleransi & Maks Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Toleransi (Menit)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={toleransiMenit}
                onChange={(e) => setToleransiMenit(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Misal: 15 menit</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Maksimal Input / Hari
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maksInput}
                onChange={(e) => setMaksInput(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Misal sholat = 5, makan = 2</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={success}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
