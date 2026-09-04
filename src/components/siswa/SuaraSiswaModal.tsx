import React, { useState, useEffect } from 'react';
import { 
  MessageSquareHeart, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Clock, 
  CheckCircle2, 
  Lightbulb, 
  HelpCircle, 
  AlertCircle, 
  MessageCircle,
  Lock
} from 'lucide-react';
import { KategoriSuara, Siswa, SuaraSiswa } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface SuaraSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa;
}

export const SuaraSiswaModal: React.FC<SuaraSiswaModalProps> = ({
  isOpen,
  onClose,
  siswa
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  const [kategori, setKategori] = useState<KategoriSuara>('curhat_pembiasaan');
  const [judul, setJudul] = useState<string>('');
  const [isi, setIsi] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [riwayatList, setRiwayatList] = useState<SuaraSiswa[]>([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState<boolean>(false);

  const loadRiwayat = async () => {
    setIsLoadingRiwayat(true);
    try {
      const all = await JournalService.getSuaraSiswaList();
      const myItems = all.filter(s => s.siswa_id === siswa.id);
      setRiwayatList(myItems);
    } catch (e) {
      console.warn('Failed to load my suara_siswa', e);
    } finally {
      setIsLoadingRiwayat(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRiwayat();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) {
      alert('Mohon lengkapi judul dan isi pesan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await JournalService.kirimSuaraSiswa(
        siswa.id,
        siswa.kelas_id,
        kategori,
        judul,
        isi
      );
      setJudul('');
      setIsi('');
      await loadRiwayat();
      setActiveTab('riwayat');
      alert('✨ Terima kasih! Curhatan / ide kamu telah berhasil dikirimkan secara anonim ke bapak/ibu guru.');
    } catch (err) {
      alert('Gagal mengirimkan pesan: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKategoriBadge = (kat: KategoriSuara) => {
    switch (kat) {
      case 'curhat_pembiasaan':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'keluhan_kendala':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ide_saran_aplikasi':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getKategoriIcon = (kat: KategoriSuara) => {
    switch (kat) {
      case 'curhat_pembiasaan': return <MessageSquareHeart className="w-4 h-4 text-pink-600" />;
      case 'keluhan_kendala': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'ide_saran_aplikasi': return <Lightbulb className="w-4 h-4 text-purple-600" />;
      default: return <HelpCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <span>Suara & Curhat Siswa</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-bold border border-pink-200">
                  Opsional
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sampaikan keluhan, curhatan pembiasaan, atau ide untuk sekolah & aplikasi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Form vs Riwayat */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Tulis Aspirasi Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat & Tanggapan ({riwayatList.length})</span>
          </button>
        </div>

        {/* TAB 1: FORM PENGIRIMAN */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1">
            {/* Anonymity Banner */}
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-purple-900 leading-relaxed">
                <span className="font-bold">Privasi Terjaga:</span> Wali Kelas, Kepala Sekolah, dan Guru akan membaca pesan ini secara <span className="font-bold">Anonim</span>. Jangan ragu untuk berbagi demi kenyamanan belajarmu!
              </div>
            </div>

            {/* Pilihan Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Pesan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'curhat_pembiasaan', label: '💖 Curhat Pembiasaan', desc: 'Tantangan bangun pagi, sholat, dll' },
                  { id: 'keluhan_kendala', label: '⚠️ Keluhan & Kendala', desc: 'Masalah teknis / kendala harian' },
                  { id: 'ide_saran_aplikasi', label: '💡 Ide & Saran', desc: 'Usulan fitur atau ide kreatif' },
                  { id: 'lainnya', label: '📝 Aspirasi Lainnya', desc: 'Pertanyaan atau masukan umum' }
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKategori(k.id as any)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      kategori === k.id
                        ? 'bg-purple-100/70 border-purple-400 text-purple-950 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold block">{k.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{k.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Aspirasi:
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Kesulitan bangun subuh / Usul fitur notifikasi"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Isi Pesan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ceritakan Lebih Detail:
              </label>
              <textarea
                required
                rows={4}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan cerita, keluhan, atau idemu dengan bebas dan santun di sini..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: RIWAYAT & TANGGAPAN DARI GURU */}
        {activeTab === 'riwayat' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {isLoadingRiwayat ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Memuat riwayat aspirasi...
              </div>
            ) : riwayatList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquareHeart className="w-10 h-10 text-pink-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">Belum Ada Curhatan</p>
                <p className="text-[11px]">Kamu belum pernah mengirimkan curhat atau ide. Yuk tulis aspirasimu!</p>
              </div>
            ) : (
              riwayatList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getKategoriIcon(item.kategori)}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getKategoriBadge(item.kategori)}`}>
                        {item.kategori.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.tanggal}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{item.judul}</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                      {item.isi}
                    </p>
                  </div>

                  {/* Tanggapan Guru & Pimpinan */}
                  {(() => {
                    let responses: Array<{ id: string; staf_nama?: string; staf_role?: string; tanggapan: string; created_at?: string }> = [];
                    if (item.tanggapan) {
                      if (item.tanggapan.trim().startsWith('[')) {
                        try {
                          responses = JSON.parse(item.tanggapan);
                        } catch {
                          responses = [];
                        }
                      } else {
                        responses = [{
                          id: 'legacy',
                          staf_nama: 'Bapak/Ibu Guru',
                          tanggapan: item.tanggapan,
                          created_at: item.tanggapan_at || item.created_at
                        }];
                      }
                    }

                    if (responses.length > 0) {
                      return (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500">
                            Tanggapan dari Guru & Pimpinan Sekolah ({responses.length}):
                          </span>
                          {responses.map((resp, rIdx) => (
                            <div key={resp.id || rIdx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  {resp.staf_nama || 'Bapak/Ibu Guru'}
                                </span>
                                {resp.created_at && (
                                  <span className="text-[10px] text-emerald-600 font-mono">
                                    {new Date(resp.created_at).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                                "{resp.tanggapan}"
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sedang ditinjau oleh tim guru / pimpinan sekolah.</span>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
