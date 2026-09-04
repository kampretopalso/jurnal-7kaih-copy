import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar, 
  Eye, 
  FileSpreadsheet, 
  Award, 
  CheckCircle2, 
  Sparkles,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { EntriJurnal, Feedback, Kebiasaan, Kelas, Siswa, StafSekolah } from '../../types/database';
import { MatrixRekapTable } from '../walikelas/MatrixRekapTable';
import { StudentDetailModal } from '../walikelas/StudentDetailModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { ModerationDeleteModal } from '../walikelas/ModerationDeleteModal';
import { JournalService } from '../../lib/journalService';

interface ClassReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelas: Kelas | null;
  allKelas: Kelas[];
  siswaList: Siswa[];
  kebiasaanList: Kebiasaan[];
  entries: EntriJurnal[];
  stafList: StafSekolah[];
  selectedDate: string;
  onDateChange?: (newDate: string) => void;
  onDataRefresh: () => void;
  currentStaf: StafSekolah;
}

export const ClassReportModal: React.FC<ClassReportModalProps> = ({
  isOpen,
  onClose,
  kelas,
  allKelas,
  siswaList,
  kebiasaanList,
  entries,
  stafList,
  selectedDate,
  onDateChange,
  onDataRefresh,
  currentStaf
}) => {
  if (!isOpen || !kelas) return null;

  const [activeClassId, setActiveClassId] = useState<string>(kelas.id);
  const currentSelectedKelas = allKelas.find(k => k.id === activeClassId) || kelas;

  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const [selectedEntryForPhoto, setSelectedEntryForPhoto] = useState<EntriJurnal | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<EntriJurnal | null>(null);

  // Filter siswa untuk kelas yang sedang dibuka
  const classStudents = siswaList.filter(s => s.kelas_id === currentSelectedKelas.id);

  // Cari Wali Kelas
  const waliKelas = stafList.find(st => st.role === 'wali_kelas' && st.kelas_id === currentSelectedKelas.id);

  // Hitung KPI Kelas
  const currentDayEntries = entries.filter(e => e.tanggal === selectedDate);
  let totalHabitsCompleted = 0;
  let perfectStudentCount = 0;

  classStudents.forEach(s => {
    const studentEntries = currentDayEntries.filter(e => e.siswa_id === s.id);
    const distinct = new Set(studentEntries.map(e => e.kebiasaan_id)).size;
    totalHabitsCompleted += distinct;
    if (distinct === 7) perfectStudentCount++;
  });

  const completionRate = classStudents.length > 0
    ? Math.round((totalHabitsCompleted / (classStudents.length * 7)) * 100)
    : 0;

  const handleConfirmDelete = async (entriId: string, alasan: string) => {
    await JournalService.deleteEntriJurnal(entriId, currentStaf.id, alasan);
    onDataRefresh();
  };

  const handleAddFeedback = async (siswaId: string, komentar: string) => {
    await JournalService.addFeedback(currentStaf.id, siswaId, null, komentar);
    onDataRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[96vh] animate-slide-up">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/80 text-white font-black flex items-center justify-center text-lg border border-indigo-400/30 shadow-sm">
              {currentSelectedKelas.nama_kelas}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Laporan & Rekapitulasi Kelas {currentSelectedKelas.nama_kelas}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                  {classStudents.length} Siswa
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Wali Kelas: <strong className="text-white">{waliKelas ? waliKelas.nama : 'Belum Ditentukan'}</strong>
                {waliKelas?.nip_atau_nik && ` (${waliKelas.nip_atau_nik})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Kelas */}
            <select
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="hidden sm:block px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {allKelas.map((k) => (
                <option key={k.id} value={k.id} className="text-slate-800">
                  Kelas {k.nama_kelas}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-2 text-indigo-200 hover:text-white rounded-full hover:bg-white/10 transition"
              title="Tutup Laporan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary KPI Bar */}
        <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 shadow-xs">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">Tanggal:</span>
              <strong className="text-indigo-900">{selectedDate}</strong>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 shadow-xs">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">Tingkat Ketuntasan:</span>
              <strong className="text-emerald-700">{completionRate}%</strong>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 shadow-xs">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-700">Siswa Tuntas 7 Kebiasaan:</span>
              <strong className="text-amber-700">{perfectStudentCount} Siswa</strong>
            </div>
          </div>

          {onDateChange && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Ganti Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Content Body: Full Matrix Table */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
          <MatrixRekapTable
            siswaList={classStudents}
            kebiasaanList={kebiasaanList}
            entries={entries}
            selectedDate={selectedDate}
            onSelectStudent={(siswa) => setSelectedStudent(siswa)}
            searchQuery=""
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500">
            SMPN 2 Glagah • Laporan Resmi Jurnal 7 KAIH
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
          >
            Tutup Laporan
          </button>
        </div>
      </div>

      {/* Sub-modals for detail photo and student */}
      {selectedStudent && (
        <StudentDetailModal
          isOpen={Boolean(selectedStudent)}
          siswa={selectedStudent}
          entries={entries.filter((e) => e.siswa_id === selectedStudent.id && e.tanggal === selectedDate)}
          kebiasaanList={kebiasaanList}
          feedbacks={[]}
          onClose={() => setSelectedStudent(null)}
          onViewPhoto={(entry) => setSelectedEntryForPhoto(entry)}
          onDeleteEntry={(entry) => setEntryToDelete(entry)}
          onAddFeedback={handleAddFeedback}
          isReadOnly={currentStaf.role !== 'superadmin' && currentStaf.role !== 'wali_kelas'}
        />
      )}

      {selectedEntryForPhoto && (
        <PhotoViewerModal
          isOpen={Boolean(selectedEntryForPhoto)}
          entry={selectedEntryForPhoto}
          onClose={() => setSelectedEntryForPhoto(null)}
        />
      )}

      {entryToDelete && (
        <ModerationDeleteModal
          isOpen={Boolean(entryToDelete)}
          entry={entryToDelete}
          onClose={() => setEntryToDelete(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};
