import React from 'react';
import { Crown, Medal, Sparkles, Trophy, CheckCircle2, ShieldCheck, Flame, Clock } from 'lucide-react';
import { ClassRankingItem, StudentRankingItem } from '../../types/database';

interface LeaderboardPodiumProps {
  type: 'kelas' | 'siswa';
  items: (ClassRankingItem | StudentRankingItem)[];
  onSelectItem?: (item: any) => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  type,
  items,
  onSelectItem
}) => {
  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];

  if (!top1) {
    return (
      <div className="p-8 text-center bg-slate-50/80 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
        Belum ada data tuntas untuk membentuk podium peringkat hari ini.
      </div>
    );
  }

  const renderClassCard = (item: ClassRankingItem, rank: 1 | 2 | 3) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    return (
      <div
        onClick={() => onSelectItem?.(item)}
        className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 shadow-lg ${
          isGold
            ? 'bg-linear-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 ring-4 ring-amber-300/60 shadow-amber-500/30 order-1 md:order-2 h-72 sm:h-80 z-20'
            : isSilver
            ? 'bg-linear-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-900 ring-2 ring-slate-200 shadow-slate-300/40 order-2 md:order-1 h-64 sm:h-72 mt-0 md:mt-8 z-10'
            : 'bg-linear-to-b from-amber-700/80 via-amber-800 to-amber-900 text-amber-50 ring-2 ring-amber-700/50 shadow-amber-900/40 order-3 h-60 sm:h-68 mt-0 md:mt-12 z-10'
        }`}
      >
        {/* Crown Badge */}
        <div className="absolute -top-4 flex items-center justify-center">
          {isGold && (
            <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-yellow-200 to-amber-400 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <Crown className="w-5 h-5 fill-amber-950" />
            </div>
          )}
          {isSilver && (
            <div className="w-8 h-8 rounded-2xl bg-white text-slate-700 flex items-center justify-center shadow-md border border-slate-300">
              <Medal className="w-4 h-4" />
            </div>
          )}
          {isBronze && (
            <div className="w-8 h-8 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center shadow-md border border-amber-600">
              <Medal className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Top */}
        <div className="text-center pt-3 space-y-1 w-full">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
            isGold ? 'bg-black/15 text-slate-950' : isSilver ? 'bg-black/10 text-slate-800' : 'bg-black/25 text-amber-200'
          }`}>
            Juara {rank}
          </span>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            Kelas {item.namaKelas}
          </h4>
          <p className={`text-[11px] font-semibold truncate max-w-42.5 mx-auto ${
            isGold ? 'text-slate-900/90' : isSilver ? 'text-slate-700' : 'text-amber-200/90'
          }`}>
            Wali: {item.waliKelasNama}
          </p>
        </div>

        {/* Middle Stats */}
        <div className={`w-full p-2.5 rounded-2xl backdrop-blur-md text-center space-y-1 ${
          isGold ? 'bg-white/40 border border-white/60' : isSilver ? 'bg-white/50 border border-white/40' : 'bg-black/25 border border-white/10'
        }`}>
          <div className="flex items-center justify-around text-xs">
            <div>
              <span className="text-[10px] block opacity-80 font-bold">Kepatuhan</span>
              <strong className="text-base font-black">{item.persentaseKepatuhan}%</strong>
            </div>
            <div className="h-6 w-px bg-black/10" />
            <div>
              <span className="text-[10px] block opacity-80 font-bold">
                {item.isMultiDay ? 'Tuntas 7 (Rerata)' : 'Tuntas 7'}
              </span>
              <strong className="text-base font-black">
                {item.isMultiDay ? `~${item.siswaTuntasCount}` : item.siswaTuntasCount} / {item.totalSiswa}
              </strong>
              {item.isMultiDay && item.totalTuntasAkumulasi !== undefined && (
                <span className="text-[9px] block opacity-75 font-normal tracking-tight">
                  Total: {item.totalTuntasAkumulasi} kali
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tag */}
        <div className="text-center w-full">
          <span className={`text-[10px] font-black px-3 py-1 rounded-xl inline-flex items-center gap-1 ${
            isGold ? 'bg-slate-950 text-amber-300' : isSilver ? 'bg-slate-800 text-white' : 'bg-amber-950 text-amber-200'
          }`}>
            <Sparkles className="w-3 h-3" />
            <span>Skor Tertib: {item.score}</span>
          </span>
        </div>
      </div>
    );
  };

  const renderStudentCard = (item: StudentRankingItem, rank: 1 | 2 | 3) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    return (
      <div
        onClick={() => onSelectItem?.(item)}
        className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 shadow-lg ${
          isGold
            ? 'bg-linear-to-b from-emerald-400 via-emerald-500 to-teal-700 text-white ring-4 ring-emerald-300/60 shadow-emerald-600/30 order-1 md:order-2 h-76 sm:h-84 z-20'
            : isSilver
            ? 'bg-linear-to-b from-indigo-400 via-indigo-500 to-indigo-700 text-white ring-2 ring-indigo-300 shadow-indigo-500/30 order-2 md:order-1 h-68 sm:h-76 mt-0 md:mt-8 z-10'
            : 'bg-linear-to-b from-purple-500 via-purple-600 to-purple-800 text-white ring-2 ring-purple-400/50 shadow-purple-600/30 order-3 h-64 sm:h-72 mt-0 md:mt-12 z-10'
        }`}
      >
        {/* Crown Badge */}
        <div className="absolute -top-4 flex items-center justify-center">
          {isGold && (
            <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-amber-300 to-yellow-500 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <Crown className="w-5 h-5 fill-amber-950" />
            </div>
          )}
          {isSilver && (
            <div className="w-8 h-8 rounded-2xl bg-white text-indigo-900 flex items-center justify-center shadow-md border border-indigo-200">
              <Medal className="w-4 h-4" />
            </div>
          )}
          {isBronze && (
            <div className="w-8 h-8 rounded-2xl bg-purple-900 text-purple-200 flex items-center justify-center shadow-md border border-purple-400">
              <Medal className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Top */}
        <div className="text-center pt-3 space-y-1 w-full">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block bg-black/20 text-white border border-white/10">
            {isGold ? '🥇 Teladan #1 Tercepat' : isSilver ? '🥈 Teladan #2' : '🥉 Teladan #3'}
          </span>
          <h4 className="text-base sm:text-lg font-black tracking-tight line-clamp-1">
            {item.nama}
          </h4>
          <p className="text-xs text-white/80 font-bold">
            Kelas {item.namaKelas} • NISN: {item.nisn}
          </p>
        </div>

        {/* Middle Stats */}
        <div className="w-full p-2.5 rounded-2xl bg-black/20 border border-white/15 text-center space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-white/90">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Selesai:</span>
            </span>
            <strong className="text-amber-300 font-extrabold">{item.selesaiFormatted}</strong>
          </div>
          <div className="flex items-center justify-between text-[10px] px-1 text-emerald-200">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Foto EXIF:</span>
            </span>
            <span className="font-bold">100% Valid (Bersih)</span>
          </div>
        </div>

        {/* Bottom Tag */}
        <div className="text-center w-full">
          <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-white text-slate-900 shadow-sm inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>7/7 Kebiasaan Tuntas</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto items-end">
        {type === 'kelas' ? (
          <>
            {top2 && renderClassCard(top2 as ClassRankingItem, 2)}
            {top1 && renderClassCard(top1 as ClassRankingItem, 1)}
            {top3 && renderClassCard(top3 as ClassRankingItem, 3)}
          </>
        ) : (
          <>
            {top2 && renderStudentCard(top2 as StudentRankingItem, 2)}
            {top1 && renderStudentCard(top1 as StudentRankingItem, 1)}
            {top3 && renderStudentCard(top3 as StudentRankingItem, 3)}
          </>
        )}
      </div>
    </div>
  );
};
