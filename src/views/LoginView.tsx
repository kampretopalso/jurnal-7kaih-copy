import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  UserCheck, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Info,
  UserX,
  KeyRound,
  HelpCircle,
  X
} from 'lucide-react';
import { useSchoolProfile } from '../context/SchoolProfileContext';
import { APP_VERSION } from '../lib/version';

interface ErrorModalState {
  isOpen: boolean;
  type: 'username_not_found' | 'wrong_password' | 'general';
  title: string;
  message: string;
  guide: string;
  role: 'siswa' | 'staf';
}

export const LoginView: React.FC = () => {
  const { loginSiswa, loginStaf } = useAuth();
  const { profile } = useSchoolProfile();
  const [activeTab, setActiveTab] = useState<'siswa' | 'staf'>('siswa');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Siswa state
  const [nisn, setNisn] = useState('');
  const [siswaPassword, setSiswaPassword] = useState('');

  // Staf state
  const [nipNik, setNipNik] = useState('');
  const [stafPassword, setStafPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nisn.trim()) {
      const msg = 'Silakan masukkan NISN Anda.';
      setErrorMessage(msg);
      setErrorModal({
        isOpen: true,
        type: 'username_not_found',
        title: 'NISN Belum Diisi',
        message: 'Kolom NISN masih kosong.',
        guide: 'Silakan masukkan nomor NISN Anda yang terdaftar di sekolah.',
        role: 'siswa'
      });
      return;
    }
    if (!siswaPassword) {
      const msg = 'Silakan masukkan password.';
      setErrorMessage(msg);
      setErrorModal({
        isOpen: true,
        type: 'wrong_password',
        title: 'Password Belum Diisi',
        message: 'Kolom Password masih kosong.',
        guide: 'Password default untuk login pertama adalah tanggal lahir (DDMMYYYY). Contoh: 15 Mei 2011 = 15052011.',
        role: 'siswa'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginSiswa(nisn.trim(), siswaPassword);
      if (!res.success) {
        const msg = res.message || 'Gagal login sebagai Siswa.';
        setErrorMessage(msg);

        const isUserNotFound = msg.toLowerCase().includes('username tidak ditemukan') || msg.toLowerCase().includes('nisn tidak terdaftar');

        setErrorModal({
          isOpen: true,
          type: isUserNotFound ? 'username_not_found' : 'wrong_password',
          title: isUserNotFound ? 'Username Tidak Ditemukan' : 'Password Siswa Salah',
          message: isUserNotFound 
            ? `NISN "${nisn.trim()}" tidak ditemukan dalam sistem database siswa SMPN 2 Glagah.`
            : 'Password yang Anda masukkan tidak sesuai dengan data terdaftar.',
          guide: isUserNotFound
            ? 'Silakan periksa kembali nomor NISN Anda. Pastikan angka yang dimasukkan sudah benar tanpa ada spasi atau karakter lain.'
            : 'Silakan tanyakan kepada bapak/ibu wali kelas atau guru Anda jika Anda lupa password.',
          role: 'siswa'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStafSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nipNik.trim()) {
      const msg = 'Silakan masukkan NIP, NIK, atau Username Anda.';
      setErrorMessage(msg);
      setErrorModal({
        isOpen: true,
        type: 'username_not_found',
        title: 'Username Belum Diisi',
        message: 'Kolom NIP / NIK / Username masih kosong.',
        guide: 'Silakan masukkan NIP, NIK, atau Username pendidik Anda.',
        role: 'staf'
      });
      return;
    }
    if (!stafPassword) {
      const msg = 'Silakan masukkan password.';
      setErrorMessage(msg);
      setErrorModal({
        isOpen: true,
        type: 'wrong_password',
        title: 'Password Belum Diisi',
        message: 'Kolom Password masih kosong.',
        guide: 'Password default awal adalah tanggal lahir (DDMMYYYY) atau password kustom yang telah diatur.',
        role: 'staf'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginStaf(nipNik.trim(), stafPassword);
      if (!res.success) {
        const msg = res.message || 'Gagal login sebagai Pendidik/Staf.';
        setErrorMessage(msg);

        const isUserNotFound = msg.toLowerCase().includes('username tidak ditemukan') || msg.toLowerCase().includes('tidak ditemukan dalam data');

        setErrorModal({
          isOpen: true,
          type: isUserNotFound ? 'username_not_found' : 'wrong_password',
          title: isUserNotFound ? 'Username Tidak Ditemukan' : 'Password Pendidik / Admin Salah',
          message: isUserNotFound 
            ? `Username / NIP / NIK "${nipNik.trim()}" tidak ditemukan dalam data pendidik SMPN 2 Glagah.`
            : 'Password yang Anda masukkan tidak cocok dengan akun ini.',
          guide: isUserNotFound
            ? 'Silakan periksa kembali penulisan NIP, NIK, atau Username Anda. Pastikan tidak ada kesalahan ketik.'
            : 'Silakan menghubungi Superadmin sekolah untuk memeriksa atau mereset password akun Anda.',
          role: 'staf'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-3">
            {/* Logos Berdampingan: Klik untuk menuju website resmi */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
              <a
                href={profile.website || "https://pendidikan.banyuwangikab.go.id/inovasi-daerah/"}
                target="_blank"
                rel="noopener noreferrer"
                title={`Logo Daerah / Kabupaten (${profile.kabupaten})`}
                className="w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl bg-white shadow-lg shadow-slate-200/70 border border-slate-100 flex items-center justify-center transform hover:scale-110 hover:shadow-xl hover:border-emerald-200 transition duration-300 group cursor-pointer"
              >
                <img 
                  src={profile.logoKabupatenUrl || "/logos/logo_banyuwangi.png"} 
                  alt={`Logo ${profile.kabupaten}`} 
                  className="max-h-full max-w-full object-contain group-hover:drop-shadow-sm transition"
                />
              </a>

              <a
                href={profile.website || "https://smpnegeri2glagah.sch.id/"}
                target="_blank"
                rel="noopener noreferrer"
                title={`Website Resmi ${profile.nama}`}
                className="w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl bg-white shadow-lg shadow-slate-200/70 border border-slate-100 flex items-center justify-center transform hover:scale-110 hover:shadow-xl hover:border-purple-200 transition duration-300 group cursor-pointer"
              >
                <img 
                  src={profile.logoUrl || "/logos/logo_smpn2_glagah.png"} 
                  alt={`Logo ${profile.nama}`} 
                  className="max-h-full max-w-full object-contain group-hover:drop-shadow-sm transition"
                />
              </a>
            </div>

            <div className="inline-flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Program Resmi Kemendikdasmen RI</span>
              </div>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                v{APP_VERSION} Official
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                Jurnal 7 KAIH
              </h1>
              <p className="text-sm font-bold text-purple-900 mt-0.5">
                {profile.nama} • {profile.kabupaten}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                NPSN: {profile.npsn} • Status: {profile.status} • Akreditasi: {profile.akreditasi}
              </p>
              {profile.motto && (
                <p className="text-xs italic text-purple-700/90 mt-1 max-w-md mx-auto">
                  "{profile.motto}"
                </p>
              )}
            </div>
          </div>

          {/* Card Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-6 animate-slide-up">
            {/* Tabs Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('siswa');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'siswa'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('staf');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'staf'
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Guru / Admin</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form Siswa */}
            {activeTab === 'siswa' ? (
              <form onSubmit={handleSiswaSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Siswa Nasional (NISN)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="Contoh: 0081234567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={siswaPassword}
                      onChange={(e) => setSiswaPassword(e.target.value)}
                      placeholder="Default: Tanggal Lahir (DDMMYYYY)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Helper info note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Password default awal adalah <strong>tanggal lahir (DDMMYYYY)</strong>. Contoh: tanggal lahir 15 Mei 2011 = <code>15052011</code>.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Memproses...' : 'Masuk sebagai Siswa'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Form Staf Sekolah & Superadmin */
              <form onSubmit={handleStafSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NIK / Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={nipNik}
                      onChange={(e) => setNipNik(e.target.value)}
                      placeholder="Masukkan NIP, NIK, atau Username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={stafPassword}
                      onChange={(e) => setStafPassword(e.target.value)}
                      placeholder="Default: Tanggal Lahir (DDMMYYYY)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Helper info note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    Untuk Wali Kelas, Kepala Sekolah, Kurikulum, & Kesiswaan. Password default awal adalah <strong>tanggal lahir (DDMMYYYY)</strong>.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Memproses...' : 'Masuk sebagai Pendidik / Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1.5 flex-wrap">
        <span>&copy; {new Date().getFullYear()} {profile.nama} ({profile.npsn})</span>
        <span className="hidden sm:inline">•</span>
        <span>{profile.alamat}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-mono text-[10px] font-bold">
          v{APP_VERSION}
        </span>
      </footer>

      {/* Pop-up Modal Pemberitahuan Kesalahan Login */}
      {errorModal?.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setErrorModal(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon & Title */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                  errorModal.type === 'username_not_found'
                    ? 'bg-amber-100 text-amber-600 border border-amber-200'
                    : 'bg-rose-100 text-rose-600 border border-rose-200'
                }`}>
                  {errorModal.type === 'username_not_found' ? (
                    <UserX className="w-6 h-6" />
                  ) : (
                    <KeyRound className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-snug">
                    {errorModal.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${
                    errorModal.type === 'username_not_found' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {errorModal.type === 'username_not_found' ? 'Akun Tidak Ditemukan' : 'Autentikasi Gagal'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup Pemberitahuan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Description */}
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {errorModal.message}
            </div>

            {/* Action Guide Box (Saran Solusi) */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              errorModal.role === 'siswa'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-purple-50/90 border-purple-200 text-purple-950'
            }`}>
              <HelpCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                errorModal.role === 'siswa' ? 'text-emerald-700' : 'text-purple-700'
              }`} />
              <div className="text-xs space-y-1">
                <div className="font-extrabold">Petunjuk & Solusi:</div>
                <div className="leading-relaxed font-medium">
                  {errorModal.guide}
                </div>
              </div>
            </div>

            {/* Close / Retry Button */}
            <button
              type="button"
              onClick={() => setErrorModal(null)}
              className={`w-full py-3 px-4 rounded-2xl font-black text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                errorModal.role === 'siswa'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
              }`}
            >
              <span>Saya Mengerti / Coba Lagi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
