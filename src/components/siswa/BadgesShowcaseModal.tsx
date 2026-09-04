import React, { useState } from 'react';
import { X, Award, Flame, Sparkles, CheckCircle2, Lock, Star } from 'lucide-react';
import { BadgeItem, GamificationProfile } from '../../types/database';

interface BadgesShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationProfile;
  studentName: string;
}

export const BadgesShowcaseModal: React.FC<BadgesShowcaseModalProps> = ({
  isOpen,
  onClose,
  gamification,
  studentName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const unlockedCount = gamification.badges.filter((b) => b.isUnlocked).length;
  const totalBadges = gamification.badges.length;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100);

  const filteredBadges = selectedCategory === 'all'
    ? gamification.badges
    : gamification.badges.filter((b) => b.category === selectedCategory);

  const getTierBadge = (tier: BadgeItem['tier']) => {
    switch (tier) {
      case 'diamond':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'gold':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'bronze':
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-slide-up">
        {/* Header Modal */}
        <div className="p-5 sm:px-6 bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-amber-300 shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Koleksi Lencana
                </span>
                <span className="text-xs text-emerald-200 font-medium">Prestasi Karakter</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Lencana Karakter Hebat
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak & Progress Bar Summary */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500 text-white font-extrabold shadow-sm">
              <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
              <span className="text-sm">{gamification.currentStreak} Hari Streak</span>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800 block">Rekor Terbaik: {gamification.longestStreak} Hari</span>
              <span>{gamification.totalDaysActive} Hari Aktif Mengisi</span>
            </div>
          </div>

          <div className="w-full sm:w-56 space-y-1.5 text-right">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Lencana Terbuka</span>
              <span className="text-emerald-700">{unlockedCount} / {totalBadges} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 no-scrollbar">
          {[
            { id: 'all', label: 'Semua Lencana' },
            { id: 'fajar', label: '🌅 Fajar' },
            { id: 'literasi', label: '📖 Literasi' },
            { id: 'spiritual', label: '🤲 Ibadah' },
            { id: 'sosial', label: '🤝 Sosial' },
            { id: 'bugar', label: '🏃 Kebugaran' },
            { id: 'istiqomah', label: '⚡ Istiqomah' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredBadges.map((badge) => {
            const pct = Math.round((badge.currentProgress / badge.targetProgress) * 100);

            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  badge.isUnlocked
                    ? 'bg-white border-emerald-300/80 shadow-xs hover:border-emerald-400 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200/70 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
                          badge.isUnlocked
                            ? 'bg-linear-to-br from-amber-100 to-amber-200 border border-amber-300'
                            : 'bg-slate-200/80 grayscale text-slate-400 border border-slate-300'
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-800 text-sm">{badge.title}</h4>
                          {badge.isUnlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${getTierBadge(badge.tier)}`}>
                          {badge.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar towards unlock */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">{badge.requirement}</span>
                    <span className={badge.isUnlocked ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                      {badge.currentProgress} / {badge.targetProgress}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        badge.isUnlocked ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Terus isi jurnal setiap hari untuk membuka semua lencana kehormatan! ✨
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
