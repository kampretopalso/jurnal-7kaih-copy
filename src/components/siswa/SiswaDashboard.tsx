import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  History, 
  Award, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Heart,
  Flame,
  FileText,
  MessageSquareHeart,
  MessageCircle
} from 'lucide-react';
import { EntriJurnal, Feedback, Kebiasaan, Siswa, Kelas, StafSekolah } from '../../types/database';
import { JournalService } from '../../lib/journalService';
import { getTodayDateString } from '../../lib/timeCalculator';
import { GamificationService } from '../../lib/gamificationService';
import { HabitCard } from './HabitCard';
import { HabitEntryModal } from './HabitEntryModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { SiswaHistory } from './SiswaHistory';
import { BadgesShowcaseModal } from './BadgesShowcaseModal';
import { SuaraSiswaModal } from './SuaraSiswaModal';
import { KomunikasiSiswaGuruModal } from '../common/KomunikasiSiswaGuruModal';

interface SiswaDashboardProps {
  siswa: Siswa;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ siswa }) => {
  const todayStr = getTodayDateString();
  
  const [kebiasaanList, setKebiasaanList] = useState<Kebiasaan[]>([]);
  const [entries, setEntries] = useState<EntriJurnal[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [stafList, setStafList] = useState<StafSekolah[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  
  // Modal states
  const [selectedKebiasaanForEntry, setSelectedKebiasaanForEntry] = useState<Kebiasaan | null>(null);
  const [selectedEntryForPhoto, setSelectedEntryForPhoto] = useState<EntriJurnal | null>(null);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [isSuaraModalOpen, setIsSuaraModalOpen] = useState<boolean>(false);
  const [isKomunikasiModalOpen, setIsKomunikasiModalOpen] = useState<boolean>(false);

  // Load data
  const loadData = async () => {
    try {
      const [habits, allEntries, studentFeedbacks, allKelas, allStaf] = await Promise.all([
        JournalService.getKebiasaan(),
        JournalService.getEntriJurnal(undefined, siswa.id),
        JournalService.getFeedback(siswa.id),
        JournalService.getKelas(),
        JournalService.getStaf()
      ]);

      setKebiasaanList(habits.sort((a: Kebiasaan, b: Kebiasaan) => a.urutan - b.urutan));
      setEntries(allEntries);
      setFeedbacks(studentFeedbacks);
      setKelasList(allKelas);
      setStafList(allStaf);
    } catch (e) {
      console.warn('Error loading student data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [siswa.id]);

  // Gamifikasi: Hitung profil lencana dan streak
  const gamificationProfile = useMemo(() => {
    return GamificationService.getStudentProfile(siswa.id, entries);
  }, [siswa.id, entries]);

  // Filter entri hari ini
  const todayEntries = entries.filter((e) => e.tanggal === todayStr);

  // Hitung progres (kebiasaan unik yang minimal sudah diisi 1x hari ini)
  const distinctHabitsCompleted = new Set(todayEntries.map((e) => e.kebiasaan_id)).size;
  const progressPercentage = Math.round((distinctHabitsCompleted / 7) * 100);

  // Trigger confetti jika semua 7 kebiasaan tuntas
  useEffect(() => {
    if (distinctHabitsCompleted === 7) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [distinctHabitsCompleted]);

  const handleEntrySuccess = async (newEntryData: Omit<EntriJurnal, 'id' | 'waktu_submit'>) => {
    await JournalService.submitEntriJurnal(newEntryData);
    await loadData();
  };

  const unlockedBadgesCount = gamificationProfile.badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Greeting & Motivation Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-700/10 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Semangat Berkarakter Luhur</span>
              </div>
              
              {/* Streak Badge */}
              <button
                onClick={() => setIsBadgesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition hover:scale-105"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500 animate-pulse" />
                <span>Streak: {gamificationProfile.currentStreak} Hari</span>
              </button>

              {/* Badges Counter Badge */}
              <button
                onClick={() => setIsBadgesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition hover:scale-105"
              >
                <Award className="w-3.5 h-3.5 text-yellow-300" />
                <span>{unlockedBadgesCount}/{gamificationProfile.badges.length} Lencana</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {siswa.nama}! 👋
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl">
              Catat setiap kebiasaan baikmu hari ini dengan penuh kejujuran. Jadilah generasi hebat kebanggaan Indonesia!
            </p>
          </div>

          {/* Quick Progress Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 min-w-55">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
              {distinctHabitsCompleted}/7
            </div>
            <div>
              <span className="text-xs text-emerald-100 font-medium block">Progres Hari Ini</span>
              <span className="text-base font-bold text-white">
                {progressPercentage === 100 ? '🎉 Tuntas Sempurna!' : `${progressPercentage}% Terpenuhi`}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between text-xs text-emerald-100 mb-1.5 font-semibold">
            <span>Target 7 Kebiasaan Kemendikdasmen</span>
            <span>{distinctHabitsCompleted} dari 7 Selesai</span>
          </div>
          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-linear-to-r from-amber-300 via-emerald-300 to-teal-200 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Motivational Feedback Banner from Teachers */}
      {feedbacks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/80 shadow-sm flex items-start gap-3.5 animate-slide-up">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 font-bold flex items-center justify-center shrink-0 shadow-xs">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-bold text-amber-900">
                Pesan Apresiasi & Motivasi dari Guru:
              </span>
              <span className="text-[10px] text-amber-700/70 font-medium">
                {new Date(feedbacks[0].created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 italic">
              "{feedbacks[0].komentar}"
            </p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="px-3 py-1.5 rounded-xl bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold text-xs transition shrink-0 hidden sm:block"
          >
            Lihat Semua ({feedbacks.length})
          </button>
        </div>
      )}

      {/* Navigation Tabs (Hari Ini vs Riwayat) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'today'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>7 Kebiasaan Hari Ini</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat & Masukan Guru</span>
          {feedbacks.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
              {feedbacks.length}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsKomunikasiModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Hubungi Guru</span>
          </button>

          <button
            onClick={() => setIsSuaraModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-md shadow-pink-500/20 active:scale-95 cursor-pointer"
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Suara & Curhat Siswa</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 7 Kebiasaan Hari Ini */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <span>Daftar Pelaksanaan 7 Kebiasaan</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Urutan tetap Kemendikdasmen RI
            </span>
          </div>

          {/* Grid 7 Habit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {kebiasaanList.map((kebiasaan) => {
              const habitEntries = todayEntries.filter((e) => e.kebiasaan_id === kebiasaan.id);
              return (
                <HabitCard
                  key={kebiasaan.id}
                  kebiasaan={kebiasaan}
                  entries={habitEntries}
                  onOpenEntryModal={(k) => setSelectedKebiasaanForEntry(k)}
                  onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Riwayat & Feedback Siswa */}
      {activeTab === 'history' && (
        <SiswaHistory
          entries={entries}
          kebiasaanList={kebiasaanList}
          feedbacks={feedbacks}
          onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
        />
      )}

      {/* Modals */}
      <HabitEntryModal
        isOpen={Boolean(selectedKebiasaanForEntry)}
        kebiasaan={selectedKebiasaanForEntry}
        existingEntries={
          selectedKebiasaanForEntry
            ? todayEntries.filter((e) => e.kebiasaan_id === selectedKebiasaanForEntry.id)
            : []
        }
        onClose={() => setSelectedKebiasaanForEntry(null)}
        onSubmitSuccess={handleEntrySuccess}
        studentId={siswa.id}
      />

      <PhotoViewerModal
        isOpen={Boolean(selectedEntryForPhoto)}
        entry={selectedEntryForPhoto}
        onClose={() => setSelectedEntryForPhoto(null)}
      />

      <BadgesShowcaseModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        gamification={gamificationProfile}
        studentName={siswa.nama}
      />

      <SuaraSiswaModal
        isOpen={isSuaraModalOpen}
        onClose={() => setIsSuaraModalOpen(false)}
        siswa={siswa}
      />

      <KomunikasiSiswaGuruModal
        isOpen={isKomunikasiModalOpen}
        onClose={() => setIsKomunikasiModalOpen(false)}
        currentUser={{ type: 'siswa', data: siswa }}
        kelasList={kelasList}
        siswaList={[siswa]}
        stafList={stafList}
      />
    </div>
  );
};
