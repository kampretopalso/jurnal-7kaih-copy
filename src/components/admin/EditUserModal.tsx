import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Save, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Shield, 
  Briefcase, 
  Loader2,
  Edit3
} from 'lucide-react';
import { Kelas, Siswa, StafSekolah, RoleStaf } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface EditUserModalProps {
  isOpen: boolean;
  targetUser: {
    type: 'siswa' | 'staf';
    data: Siswa | StafSekolah;
  } | null;
  kelasList: Kelas[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  targetUser,
  kelasList,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !targetUser) return null;

  const isSiswa = targetUser.type === 'siswa';
  const siswaData = isSiswa ? (targetUser.data as Siswa) : null;
  const stafData = !isSiswa ? (targetUser.data as StafSekolah) : null;

  const [nama, setNama] = useState('');
  const [identifier, setIdentifier] = useState(''); // NISN or NIP/NIK
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [role, setRole] = useState<RoleStaf>('wali_kelas');
  const [statusAsn, setStatusAsn] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSiswa && siswaData) {
      setNama(siswaData.nama);
      setIdentifier(siswaData.nisn);
      setTanggalLahir(siswaData.tanggal_lahir || '2011-01-01');
      setKelasId(siswaData.kelas_id || kelasList[0]?.id || '');
    } else if (stafData) {
      setNama(stafData.nama);
      setIdentifier(stafData.nip_atau_nik);
      setTanggalLahir(stafData.tanggal_lahir || '1985-01-01');
      setKelasId(stafData.kelas_id || '');
      setRole(stafData.role);
      setStatusAsn(stafData.status_asn);
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [targetUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong!');
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage(`${isSiswa ? 'NISN' : 'NIP/NIK/Username'} tidak boleh kosong!`);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isSiswa && siswaData) {
        await JournalService.adminUpdateUser('siswa', siswaData.id, {
          nama: nama.trim(),
          nisn: identifier.trim(),
          tanggal_lahir: tanggalLahir,
          kelas_id: kelasId
        });
      } else if (stafData) {
        await JournalService.adminUpdateUser('staf', stafData.id, {
          nama: nama.trim(),
          nip_atau_nik: identifier.trim(),
          tanggal_lahir: tanggalLahir,
          kelas_id: role === 'wali_kelas' ? kelasId || null : null,
          role: role,
          scope: role === 'wali_kelas' ? 'kelas' : 'sekolah',
          status_asn: statusAsn
        });
      }

      setSuccessMessage(`Data ${isSiswa ? 'Siswa' : 'Pendidik/Staf'} berhasil diperbarui!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 flex flex-col space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Edit & Rename Data {isSiswa ? 'Siswa' : 'Guru / Staf'}
              </h3>
              <p className="text-xs text-slate-400">
                Akses Khusus Super Administrator SMPN 2 Glagah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Nama Lengkap (Rename) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap (Rename) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 text-xs sm:text-sm"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Identifier (NISN / NIP/NIK) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isSiswa ? 'NISN (Username Login)' : 'NIP / NIK / Username Login'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={isSiswa ? '10 digit NISN' : 'NIP/NIK'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold text-slate-800"
            />
          </div>

          {/* Tanggal Lahir (Password Default) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tanggal Lahir (Dasar Password DDMMYYYY)
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-800"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Siswa: Rombel / Kelas */}
          {isSiswa && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Rombongan Belajar (18 Kelas 7A-9F)
              </label>
              <div className="relative">
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 appearance-none bg-white"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama_kelas} (Tingkat {k.tingkat})
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          {/* Staf: Role, Kelas Binaan, Status ASN */}
          {!isSiswa && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jabatan / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleStaf)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 bg-white uppercase tracking-wider text-[11px]"
                >
                  <option value="wali_kelas">Wali Kelas</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="waka_kurikulum">Waka Kurikulum</option>
                  <option value="kesiswaan">Kesiswaan</option>
                  <option value="superadmin">Super Administrator</option>
                </select>
              </div>

              {role === 'wali_kelas' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas yang Diampu
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 bg-white"
                  >
                    <option value="">-- Pilih Kelas Binaan --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="asnCheckbox"
                  checked={statusAsn}
                  onChange={(e) => setStatusAsn(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="asnCheckbox" className="font-semibold text-slate-700 cursor-pointer select-none">
                  Status Kepegawaian: ASN / PPPK (Centang jika ASN)
                </label>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
