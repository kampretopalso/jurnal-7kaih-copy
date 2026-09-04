import React from 'react';
import { Kebiasaan, EntriJurnal, Siswa } from '../../types/database';
import { CheckCircle2, TrendingUp, Award, Users } from 'lucide-react';

interface SchoolStatsOverviewProps {
  kebiasaanList: Kebiasaan[];
  entries: EntriJurnal[];
  siswaList: Siswa[];
  selectedDate: string;
}

export const SchoolStatsOverview: React.FC<SchoolStatsOverviewProps> = ({
  kebiasaanList,
  entries,
  siswaList,
  selectedDate
}) => {
  const currentEntries = entries.filter((e) => e.tanggal === selectedDate);
  const totalSiswa = siswaList.length;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>Tingkat Kepatuhan per Kebiasaan ({selectedDate})</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">Total Basis: {totalSiswa} Siswa</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kebiasaanList.map((k) => {
          const habitEntries = currentEntries.filter((e) => e.kebiasaan_id === k.id);
          const distinctSiswaCompleted = new Set(habitEntries.map((e) => e.siswa_id)).size;
          const percentage = totalSiswa > 0 ? Math.round((distinctSiswaCompleted / totalSiswa) * 100) : 0;

          return (
            <div
              key={k.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                  {k.urutan}. {k.nama}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                  {percentage}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{distinctSiswaCompleted} siswa memenuhi</span>
                <span>Target: {totalSiswa}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
