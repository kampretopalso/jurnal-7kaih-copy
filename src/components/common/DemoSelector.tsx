import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, GraduationCap, ShieldAlert, Sparkles, ShieldCheck } from 'lucide-react';

export const DemoSelector: React.FC = () => {
  const { quickLoginAs, user } = useAuth();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 text-white text-xs py-2 px-3 sm:px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-semibold text-purple-200">Mode Uji Coba Cepat (Preview Akun Demo):</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* SUPERADMIN */}
          <button
            onClick={() => quickLoginAs('superadmin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              user?.type === 'staf' && (user.data as any).role === 'superadmin'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-300'
                : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Superadmin</span>
          </button>

          {/* KEPALA SEKOLAH */}
          <button
            onClick={() => quickLoginAs('kepala_sekolah')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              user?.type === 'staf' && (user.data as any).role === 'kepala_sekolah'
                ? 'bg-white text-purple-950 shadow'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Kepala Sekolah</span>
          </button>

          {/* WALI KELAS */}
          <button
            onClick={() => quickLoginAs('wali_kelas')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              user?.type === 'staf' && (user.data as any).role === 'wali_kelas'
                ? 'bg-white text-purple-950 shadow'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Wali Kelas (7A)</span>
          </button>

          {/* SISWA */}
          <button
            onClick={() => quickLoginAs('siswa')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              user?.type === 'siswa'
                ? 'bg-white text-purple-950 shadow'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>Siswa Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
