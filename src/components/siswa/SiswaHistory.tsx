import React, { useState } from 'react';
import { Calendar, MessageSquare, ShieldCheck, Clock, Camera, AlertTriangle, Eye, Archive } from 'lucide-react';
import { EntriJurnal, Feedback, Kebiasaan } from '../../types/database';
import { StatusBadge, FlagBadge } from '../common/StatusBadge';

interface SiswaHistoryProps {
  entries: EntriJurnal[];
  kebiasaanList: Kebiasaan[];
  feedbacks: Feedback[];
  onViewPhoto: (entry: EntriJurnal) => void;
}

export const SiswaHistory: React.FC<SiswaHistoryProps> = ({
  entries,
  kebiasaanList,
  feedbacks,
  onViewPhoto
}) => {
  const [selectedTab, setSelectedTab] = useState<'entries' | 'feedbacks'>('entries');
  const [filterKebiasaan, setFilterKebiasaan] = useState<number | 'all'>('all');

  // Urutkan entri dari yang paling baru
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.waktu_submit).getTime() - new Date(a.waktu_submit).getTime()
  );

  const filteredEntries = filterKebiasaan === 'all'
    ? sortedEntries
    : sortedEntries.filter((e) => e.kebiasaan_id === filterKebiasaan);

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('entries')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              selectedTab === 'entries'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Riwayat Bukti ({entries.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('feedbacks')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              selectedTab === 'feedbacks'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Pesan Wali Kelas ({feedbacks.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Riwayat Entri */}
      {selectedTab === 'entries' && (
        <div className="space-y-4">
          {/* Filter Kebiasaan */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterKebiasaan('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                filterKebiasaan === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua Kebiasaan
            </button>
            {kebiasaanList.map((k) => (
              <button
                key={k.id}
                onClick={() => setFilterKebiasaan(k.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  filterKebiasaan === k.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {k.nama}
              </button>
            ))}
          </div>

          {/* List Kartu Entri */}
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <p className="text-slate-400 text-sm">Belum ada riwayat entri jurnal yang tercatat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEntries.map((entry) => {
                const habit = kebiasaanList.find((k) => k.id === entry.kebiasaan_id);
                const formattedDate = new Date(entry.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm transition flex gap-4"
                  >
                    {/* Thumbnail Foto */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {entry.foto_url?.includes('[TERARSIP]') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-600 p-2 text-center">
                          <Archive className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold leading-tight">Foto Diarsipkan</span>
                        </div>
                      ) : (
                        <img
                          src={entry.foto_url}
                          alt="Bukti"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => onViewPhoto(entry)}
                        className="absolute inset-0 bg-black/30 hover:bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition cursor-pointer"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Detail Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {habit?.nama || 'Kebiasaan'}
                          </h4>
                          <StatusBadge status={entry.status_waktu} />
                        </div>

                        <p className="text-xs text-slate-500 font-medium">
                          {formattedDate} • {entry.sub_tipe || entry.nama_kegiatan || `Entri #${entry.urutan_ke}`}
                        </p>

                        {entry.catatan && (
                          <p className="text-xs text-slate-600 italic line-clamp-1 mt-1">
                            "{entry.catatan}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>{entry.sumber_foto === 'kamera' ? '📷 Kamera' : '🖼️ Galeri'}</span>
                        {entry.flag_foto_mencurigakan ? (
                          <FlagBadge
                            reason={entry.alasan_flag}
                            onClick={() => onViewPhoto(entry)}
                          />
                        ) : (
                          <span className="text-emerald-600 font-medium">✓ Terverifikasi</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Feedback Wali Kelas */}
      {selectedTab === 'feedbacks' && (
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Belum ada catatan atau masukan dari Wali Kelas.</p>
            </div>
          ) : (
            feedbacks.map((fb) => {
              const formattedTime = new Date(fb.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={fb.id}
                  className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      Ibu Siti Rahayu (Wali Kelas VII-A)
                    </span>
                    <span className="text-[11px] text-slate-400">{formattedTime} WIB</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
                    "{fb.komentar}"
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
