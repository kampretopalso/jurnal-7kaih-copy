import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Copy, 
  Check, 
  ShieldAlert 
} from 'lucide-react';
import { Siswa, StafSekolah } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface PasswordManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    type: 'siswa' | 'staf';
    data: Siswa | StafSekolah;
  } | null;
  onSuccess: () => void;
}

export const PasswordManagerModal: React.FC<PasswordManagerModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const currentDob = targetUser?.data?.tanggal_lahir || '2011-01-01';

  // Format default password DDMMYYYY
  const getDefaultDobPassword = (dobStr: string) => {
    try {
      const parts = dobStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}${parts[1]}${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return dobStr.replace(/\D/g, '');
  };

  const defaultPassword = getDefaultDobPassword(currentDob);

  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newPassword, setNewPassword] = useState(defaultPassword);
  const [newDob, setNewDob] = useState(currentDob);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const isSiswa = targetUser.type === 'siswa';
  const siswaData = isSiswa ? (targetUser.data as Siswa) : null;
  const stafData = !isSiswa ? (targetUser.data as StafSekolah) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetToDefault = () => {
    const formatted = getDefaultDobPassword(newDob);
    setNewPassword(formatted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Convert new password if format DDMMYYYY (8 digits) or text
      let resolvedDob = newDob;
      if (/^\d{8}$/.test(newPassword)) {
        const day = newPassword.substring(0, 2);
        const month = newPassword.substring(2, 4);
        const year = newPassword.substring(4, 8);
        resolvedDob = `${year}-${month}-${day}`;
      }

      await JournalService.adminUpdatePassword(
        targetUser.type,
        targetUser.data.id,
        resolvedDob,
        newPassword
      );

      setSuccessMessage('Password berhasil diperbarui secara permanen di cloud!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col animate-slide-up">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Kelola Password {isSiswa ? 'Siswa' : 'Staf/Guru'}
              </h3>
              <p className="text-xs text-slate-500">
                Akses Khusus Super Administrator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* User Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 font-bold text-indigo-700 flex items-center justify-center text-base shadow-xs shrink-0">
              {targetUser.data.nama.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-800 text-sm truncate">
                {targetUser.data.nama}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {isSiswa
                  ? `NISN: ${siswaData?.nisn}`
                  : `NIP/NIK: ${stafData?.nip_atau_nik} • ${stafData?.role}`}
              </p>
            </div>
          </div>

          {/* Current Active Password Card */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password Aktif Saat Ini
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                readOnly
                value={defaultPassword}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-sm font-semibold tracking-wider select-all"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                  title="Salin Password"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Format tanggal lahir: <span className="font-mono font-semibold text-slate-600">{defaultPassword}</span> ({currentDob})
            </p>
          </div>

          {/* Edit / Set New Password */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ubah Tanggal Lahir (Otomatis Menjadi Password Baru)
              </label>
              <input
                type="date"
                value={newDob}
                onChange={(e) => {
                  setNewDob(e.target.value);
                  setNewPassword(getDefaultDobPassword(e.target.value));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Baru (Format DDMMYYYY atau Kustom)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="DDMMYYYY (misal 12042012)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1 shrink-0"
                  title="Sesuaikan dengan Tanggal Lahir"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Format</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
