import React, { useState } from 'react';
import { 
  X, 
  User, 
  MessageSquare, 
  Trash2, 
  Calendar, 
  Eye, 
  AlertTriangle, 
  Send,
  ShieldCheck,
  Clock,
  Printer,
  FileText,
  BookOpen,
  Archive
} from 'lucide-react';
import { EntriJurnal, Feedback, Kebiasaan, Siswa } from '../../types/database';
import { StatusBadge, FlagBadge } from '../common/StatusBadge';

interface StudentDetailModalProps {
  siswa: Siswa | null;
  entries: EntriJurnal[];
  kebiasaanList: Kebiasaan[];
  feedbacks: Feedback[];
  isOpen: boolean;
  onClose: () => void;
  onViewPhoto: (entry: EntriJurnal) => void;
  onDeleteEntry: (entry: EntriJurnal) => void;
  onAddFeedback: (siswaId: string, komentar: string) => void;
  onOpenRapor?: (siswa: Siswa) => void;
  isReadOnly?: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  siswa,
  entries,
  kebiasaanList,
  feedbacks,
  isOpen,
  onClose,
  onViewPhoto,
  onDeleteEntry,
  onAddFeedback,
  onOpenRapor,
  isReadOnly = false
}) => {
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!isOpen || !siswa) return null;

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    onAddFeedback(siswa.id, newFeedbackText.trim());
    setNewFeedbackText('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  };

  const studentFeedbacks = feedbacks.filter((f) => f.siswa_id === siswa.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
              {siswa.nama.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                {siswa.nama}
              </h3>
              <p className="text-xs text-slate-500">
                NISN: <span className="font-semibold text-slate-700">{siswa.nisn}</span> • Tanggal Lahir: {siswa.tanggal_lahir}
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
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Section: Daftar Entri Bukti Siswa */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Daftar Bukti Jurnal Siswa ({entries.length} entri)</span>
            </h4>

            {entries.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
                Belum ada data jurnal yang dikirim oleh siswa ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map((entry) => {
                  const habit = kebiasaanList.find((k) => k.id === entry.kebiasaan_id);

                  return (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm flex flex-col justify-between space-y-2.5 transition"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div
                          onClick={() => onViewPhoto(entry)}
                          className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer group"
                        >
                          {entry.foto_url?.includes('[TERARSIP]') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-600 p-1 text-center">
                              <Archive className="w-5 h-5 mb-0.5" />
                              <span className="text-[9px] font-bold">Arsip</span>
                            </div>
                          ) : (
                            <img
                              src={entry.foto_url}
                              alt="Bukti"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white transition">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h5 className="font-bold text-slate-800 text-xs truncate">
                              {habit?.nama}
                            </h5>
                          </div>

                          <span className="text-[11px] font-semibold text-emerald-700 block truncate">
                            {entry.sub_tipe || entry.nama_kegiatan || `Entri #${entry.urutan_ke}`}
                          </span>

                          <div className="mt-1">
                            <StatusBadge status={entry.status_waktu} />
                          </div>
                        </div>
                      </div>

                      {/* Flag Warning */}
                      {entry.flag_foto_mencurigakan && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{entry.alasan_flag || 'Foto mencurigakan'}</span>
                        </div>
                      )}

                      {/* Catatan Siswa */}
                      {entry.catatan && (
                        entry.kebiasaan_id === 5 ? (
                          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Refleksi Gemar Belajar</span>
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-200/60 text-indigo-800">
                                {entry.catatan.trim().split(/\s+/).filter(Boolean).length} kata
                              </span>
                            </div>
                            <p className="text-slate-700 italic text-[11px] leading-relaxed">
                              "{entry.catatan}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg line-clamp-2">
                            "{entry.catatan}"
                          </p>
                        )
                      )}

                      {/* Action Bar (View Photo & Delete Entry for moderation) */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => onViewPhoto(entry)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail Foto</span>
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry)}
                            className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Entri</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Feedback & Komentar Wali Kelas */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Catatan & Feedback Pembinaan untuk Siswa ({studentFeedbacks.length})</span>
              </h4>
            </div>

            {/* List Existing Feedbacks */}
            {studentFeedbacks.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {studentFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-2xl bg-linear-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200 text-xs space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Pendidik / Wali Kelas
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(fb.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-semibold leading-relaxed">"{fb.komentar}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
                Belum ada feedback yang diberikan untuk siswa ini. Berikan motivasi atau apresiasi di bawah!
              </div>
            )}

            {/* Quick Feedback Preset Chips */}
            {!isReadOnly && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Pilih Cepat Template Motivasi:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '✨ Hebat! Pertahankan kebiasaan baikmu.',
                    '🌅 Bagus sekali, selalu bangun pagi tepat waktu!',
                    '🙏 Terus istiqomah dalam menjalankan ibadah ya!',
                    '🥗 Keren! Tetap jaga pola makan sehat bergizi.',
                    '📚 Tetap semangat belajarnya, anak hebat!'
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setNewFeedbackText(preset)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium transition border border-slate-200 hover:border-emerald-300 active:scale-95"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Add Feedback Form */}
                <form onSubmit={handleSendFeedback} className="pt-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeedbackText}
                      onChange={(e) => setNewFeedbackText(e.target.value)}
                      placeholder="Ketik catatan motivasi atau apresiasi untuk siswa..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Feedback</span>
                    </button>
                  </div>
                  {feedbackSent && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">✓ Feedback berhasil dikirim dan tersimpan di cloud!</p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {onOpenRapor && (
              <button
                type="button"
                onClick={() => onOpenRapor(siswa)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rapor Karakter Siswa</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
