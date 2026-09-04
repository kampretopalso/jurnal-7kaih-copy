import React, { useState } from 'react';
import { X, Camera, Upload, AlertTriangle, Calendar, Clock, User, ShieldCheck, Archive } from 'lucide-react';
import { EntriJurnal } from '../../types/database';
import { StatusBadge } from './StatusBadge';

interface PhotoViewerModalProps {
  entry: EntriJurnal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  entry,
  isOpen,
  onClose
}) => {
  if (!isOpen || !entry) return null;

  const [imageError, setImageError] = useState(false);
  const isArchived = !entry.foto_url || entry.foto_url.includes('[TERARSIP]') || entry.foto_url === 'archived';

  const formattedSubmitTime = new Date(entry.waktu_submit).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedPhotoTime = entry.waktu_ambil_foto
    ? new Date(entry.waktu_ambil_foto).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Tidak tercatat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <span>Bukti Foto Jurnal</span>
              <StatusBadge status={entry.status_waktu} />
            </h3>
            <p className="text-xs text-slate-500">
              {entry.tanggal} • {entry.sub_tipe || entry.nama_kegiatan || 'Jurnal Harian'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Gambar Foto atau Tampilan Arsip */}
          {isArchived || imageError ? (
            <div className="rounded-2xl p-8 bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/30">
                <Archive className="w-7 h-7" />
              </div>
              <h4 className="text-white font-bold text-base mb-1">
                Foto Bukti Telah Diarsipkan
              </h4>
              <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                Berkas foto fisik jurnal ini telah dibackup dan dibersihkan dari server cloud oleh pihak sekolah demi efisiensi kuota server. Poin kebiasaan, waktu pengisian, dan catatan refleksi siswa tetap tercatat sah dan aman.
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-[380px]">
              <img
                src={entry.foto_url}
                alt="Bukti Foto Jurnal"
                className="max-h-[380px] w-auto object-contain rounded-xl"
                onError={() => setImageError(true)}
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-sm border border-white/20">
                  {entry.sumber_foto === 'kamera' ? (
                    <>
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      Kamera Langsung
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      Unggah Galeri
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Audit Peringatan Fraud jika ada */}
          {entry.flag_foto_mencurigakan ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-800 mb-0.5">
                  Foto Ditandai Memerlukan Tinjauan:
                </strong>
                <p className="text-amber-700">{entry.alasan_flag || 'Metadata foto tidak sesuai dengan tanggal hari ini.'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Metadata dan waktu pengambilan foto terverifikasi valid.</span>
            </div>
          )}

          {/* Detail Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Waktu Pengambilan:</span>
                <strong className="text-slate-700">{formattedPhotoTime}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Waktu Submit Sistem:</span>
                <strong className="text-slate-700">{formattedSubmitTime}</strong>
              </div>
            </div>

            {entry.catatan && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block mb-1">Catatan Siswa:</span>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  "{entry.catatan}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
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
