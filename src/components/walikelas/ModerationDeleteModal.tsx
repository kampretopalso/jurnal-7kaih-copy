import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { EntriJurnal } from '../../types/database';

interface ModerationDeleteModalProps {
  entry: EntriJurnal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (entriId: string, alasan: string) => void;
}

export const ModerationDeleteModal: React.FC<ModerationDeleteModalProps> = ({
  entry,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim()) {
      setError('Wajib mengisi alasan penghapusan entri untuk keperluan audit log!');
      return;
    }

    onConfirmDelete(entry.id, alasan.trim());
    setAlasan('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <ShieldAlert className="w-5 h-5" />
            <span>Moderasi Data Jurnal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Penghapusan Bersifat Permanen & Diaudit</span>
            Entri yang dihapus akan disimpan ke tabel audit log (`log_hapus`) beserta snapshot data dan identitas Anda.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Penghapusan (Wajib Diisi)
            </label>
            <textarea
              required
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Foto terbukti mengambil dari internet/bukan dokumentasi asli siswa..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Entri</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
