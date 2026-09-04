import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2, UserX } from 'lucide-react';
import { Kelas, Siswa } from '../../types/database';

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  kelasList: Kelas[];
  onConfirmDelete: (siswaId: string) => Promise<void>;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  siswa,
  kelasList,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !siswa) return null;

  const kelas = kelasList.find((k) => k.id === siswa.kelas_id);
  const namaKelas = kelas ? `Kelas ${kelas.nama_kelas}` : (siswa.kelas_id || 'Kelas');

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(siswa.id);
      setIsDeleting(false);
      setConfirmed(false);
      onClose();
    } catch (e) {
      console.error('Error deleting student:', e);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 relative space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
              Konfirmasi Hapus Siswa
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Hapus Siswa dari Kelas
            </h3>
          </div>
        </div>

        {/* Detail Siswa Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Nama Siswa:</span>
            <strong className="text-slate-900 font-bold text-sm">{siswa.nama}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">NISN:</span>
            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              {siswa.nisn}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Kelas:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {namaKelas}
            </span>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px]">
            <strong>Perhatian:</strong> Siswa ini akan dihapus dari daftar kelas dan database. Seluruh riwayat submisi jurnal harian dan foto pembiasaan terkait akan dibersihkan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Siswa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
