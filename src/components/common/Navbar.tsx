import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, KeyRound, ChevronDown } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useSchoolProfile } from '../../context/SchoolProfileContext';
import { APP_VERSION } from '../../lib/version';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { profile } = useSchoolProfile();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const getRoleLabel = () => {
    if (user.type === 'siswa') {
      return `Siswa • ${profile.nama}`;
    }
    const staf = user.data;
    switch (staf.role) {
      case 'superadmin':
        return 'Superadmin';
      case 'wali_kelas':
        return 'Wali Kelas';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'waka_kurikulum':
        return 'Waka Kurikulum';
      case 'kesiswaan':
        return 'Kesiswaan';
      default:
        return 'Staf Sekolah';
    }
  };

  const getRoleBadgeStyle = () => {
    if (user.type === 'siswa') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    const staf = user.data;
    if (staf.role === 'superadmin') {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
    }
    if (staf.role === 'wali_kelas') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return 'bg-purple-100 text-purple-800 border-purple-300';
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <a
                href={profile.website || "https://smpnegeri2glagah.sch.id/"}
                target="_blank"
                rel="noopener noreferrer"
                title={`Website Resmi ${profile.nama}`}
                className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-slate-200 border border-slate-100 flex items-center justify-center hover:scale-105 transition"
              >
                <img 
                  src={profile.logoUrl || "/logos/logo_smpn2_glagah.png"} 
                  alt={`Logo ${profile.nama}`} 
                  className="w-full h-full object-contain"
                />
              </a>
              <div>
                <h1 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5">
                  <span>Jurnal 7 KAIH</span>
                  <a 
                    href={profile.website || "https://smpnegeri2glagah.sch.id/"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-bold hidden sm:inline-block transition"
                  >
                    {profile.nama}
                  </a>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">{profile.nama}</span>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    v{APP_VERSION}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Date & User Profile Dropdown */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <span className="text-xs text-slate-400 font-medium block">Hari ini</span>
                <span className="text-xs font-semibold text-slate-700">{currentDate}</span>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                    {user.data.nama.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-32.5">
                      {user.data.nama}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle()}`}>
                      {getRoleLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-slide-up">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.data.nama}</p>
                        <p className="text-[11px] text-slate-500">
                          {user.type === 'siswa' ? `NISN: ${(user.data as any).nisn}` : `NIP/NIK: ${(user.data as any).nip_atau_nik}`}
                        </p>
                        <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                          {profile.nama} (NPSN: {profile.npsn})
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowChangePassword(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        Ganti Password
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Keluar (Logout)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
};
