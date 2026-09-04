import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Inbox, 
  SendHorizontal, 
  CheckCheck, 
  Clock, 
  User, 
  GraduationCap, 
  ShieldAlert, 
  Sparkles, 
  HeartHandshake,
  MessageCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Kelas, Siswa, StafSekolah, PesanKomunikasi } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface KomunikasiSiswaGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { type: 'siswa'; data: Siswa } | { type: 'staf'; data: StafSekolah };
  kelasList: Kelas[];
  siswaList: Siswa[];
  stafList: StafSekolah[];
}

export const KomunikasiSiswaGuruModal: React.FC<KomunikasiSiswaGuruModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  kelasList,
  siswaList,
  stafList
}) => {
  const isStaf = currentUser.type === 'staf';
  const isSiswa = currentUser.type === 'siswa';

  const [activeTab, setActiveTab] = useState<'kirim' | 'masuk' | 'terkirim'>('masuk');
  const [messages, setMessages] = useState<PesanKomunikasi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Form State untuk Guru
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');

  // Form State untuk Siswa
  const [selectedGuruId, setSelectedGuruId] = useState<string>('');

  // Common Form State
  const [subjek, setSubjek] = useState<string>('');
  const [pesan, setPesan] = useState<string>('');
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Load Messages
  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const allMsgs = await JournalService.getPesanKomunikasi(currentUser.data.id);
      setMessages(allMsgs);
    } catch (e) {
      console.warn('Gagal memuat pesan komunikasi:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      setSuccessNotif(null);

      // Inisialisasi pilihan default jika Guru
      if (isStaf) {
        const staf = currentUser.data as StafSekolah;
        const myClass = kelasList.find(k => 
          k.id === staf.kelas_id || 
          k.nama_kelas === staf.kelas_id ||
          k.wali_kelas_id === staf.id
        );
        const initKelas = myClass?.id || kelasList[0]?.id || '';
        setSelectedKelasId(initKelas);
      }

      // Inisialisasi pilihan default jika Siswa
      if (isSiswa) {
        const siswa = currentUser.data as Siswa;
        const siswaKelas = kelasList.find(k => 
          k.id === siswa.kelas_id || 
          k.nama_kelas.toUpperCase() === siswa.kelas_id?.toUpperCase()
        );
        const wali = stafList.find(s => 
          s.id === siswaKelas?.wali_kelas_id || 
          s.kelas_id === siswaKelas?.id || 
          s.kelas_id === siswa.kelas_id
        );
        setSelectedGuruId(wali?.id || stafList.find(s => s.role === 'superadmin')?.id || stafList[0]?.id || '');
      }
    }
  }, [isOpen, currentUser.data.id]);

  // Daftar siswa berdasarkan kelas terpilih (untuk guru)
  const siswaInSelectedKelas = useMemo(() => {
    if (!selectedKelasId) return [];
    const targetKelas = kelasList.find(k => k.id === selectedKelasId);
    return siswaList.filter(s => 
      s.kelas_id === selectedKelasId || 
      (targetKelas && s.kelas_id?.toUpperCase() === targetKelas.nama_kelas.toUpperCase()) ||
      (targetKelas && s.kelas_id?.toLowerCase() === `k-${targetKelas.nama_kelas.toLowerCase()}`)
    );
  }, [selectedKelasId, siswaList, kelasList]);

  // Kotak Masuk & Pesan Terkirim
  const inboxMessages = useMemo(() => {
    return messages.filter(m => m.penerima_id === currentUser.data.id);
  }, [messages, currentUser.data.id]);

  const unreadCount = useMemo(() => {
    return inboxMessages.filter(m => !m.sudah_dibaca).length;
  }, [inboxMessages]);

  const sentMessages = useMemo(() => {
    return messages.filter(m => m.pengirim_id === currentUser.data.id);
  }, [messages, currentUser.data.id]);

  const handleSelectKelasChange = (kId: string) => {
    setSelectedKelasId(kId);
    setSelectedSiswaId(''); // reset siswa
  };

  const handleKirimPesan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjek.trim() || !pesan.trim()) {
      alert('Harap isi subjek dan pesan dengan lengkap.');
      return;
    }

    setIsSending(true);
    try {
      if (isStaf) {
        const staf = currentUser.data as StafSekolah;
        const targetSiswa = siswaList.find(s => s.id === selectedSiswaId);
        if (!targetSiswa) {
          alert('Harap pilih siswa penerima pesan.');
          setIsSending(false);
          return;
        }

        const targetKelas = kelasList.find(k => k.id === selectedKelasId);

        await JournalService.kirimPesanKomunikasi({
          pengirim_id: staf.id,
          pengirim_nama: staf.nama,
          pengirim_role: staf.role,
          penerima_id: targetSiswa.id,
          penerima_nama: targetSiswa.nama,
          penerima_role: 'siswa',
          kelas_id: targetSiswa.kelas_id,
          kelas_nama: targetKelas?.nama_kelas || targetSiswa.kelas_id,
          subjek: subjek.trim(),
          pesan: pesan.trim()
        });

        setSuccessNotif(`Pesan berhasil dikirimkan ke siswa ${targetSiswa.nama}.`);
      } else {
        // Siswa mengirim pesan
        const siswa = currentUser.data as Siswa;
        const targetGuru = stafList.find(s => s.id === selectedGuruId);
        if (!targetGuru) {
          alert('Harap pilih guru penerima pesan.');
          setIsSending(false);
          return;
        }

        const siswaKelas = kelasList.find(k => k.id === siswa.kelas_id);

        await JournalService.kirimPesanKomunikasi({
          pengirim_id: siswa.id,
          pengirim_nama: siswa.nama,
          pengirim_role: 'siswa',
          penerima_id: targetGuru.id,
          penerima_nama: targetGuru.nama,
          penerima_role: targetGuru.role,
          kelas_id: siswa.kelas_id,
          kelas_nama: siswaKelas?.nama_kelas || siswa.kelas_id,
          subjek: subjek.trim(),
          pesan: pesan.trim()
        });

        setSuccessNotif(`Pesan konsultasi berhasil dikirimkan ke ${targetGuru.nama}.`);
      }

      setSubjek('');
      setPesan('');
      await loadMessages();
      setActiveTab('terkirim');
    } catch (err) {
      alert('Gagal mengirim pesan: ' + err);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = async (msg: PesanKomunikasi) => {
    if (!msg.sudah_dibaca) {
      await JournalService.tandaiPesanDibaca(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sudah_dibaca: true } : m));
    }
  };

  const handleBalasPesan = (msg: PesanKomunikasi) => {
    if (isStaf) {
      const targetS = siswaList.find(s => s.id === msg.pengirim_id);
      if (targetS) {
        setSelectedKelasId(targetS.kelas_id);
        setSelectedSiswaId(targetS.id);
      }
    } else {
      setSelectedGuruId(msg.pengirim_id);
    }
    setSubjek(`Balasan: ${msg.subjek.replace(/^Balasan:\s*/, '')}`);
    setPesan('');
    setActiveTab('kirim');
    handleMarkAsRead(msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden flex flex-col border border-slate-200 animate-slide-up">
        
        {/* Header Modal */}
        <div className="p-5 sm:px-6 bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>{isStaf ? 'Komunikasi & Bimbingan Siswa' : 'Hubungi Guru & Konsultasi Karakter'}</span>
              </h3>
              <p className="text-xs text-purple-200/80">
                {isStaf 
                  ? 'Saluran resmi interaksi dua arah antara pendidik dan siswa' 
                  : 'Sampaikan pertanyaan, konsultasi, atau curhat pembiasaan langsung ke gurumu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('masuk')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'masuk' 
                ? 'bg-white text-purple-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Kotak Masuk</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('kirim')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'kirim' 
                ? 'bg-white text-purple-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Pesan Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('terkirim')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'terkirim' 
                ? 'bg-white text-purple-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Riwayat Terkirim</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] text-slate-800 space-y-4">
          
          {successNotif && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                {successNotif}
              </span>
              <button 
                onClick={() => setSuccessNotif(null)} 
                className="text-emerald-700 font-bold hover:underline"
              >
                Tutup
              </button>
            </div>
          )}

          {/* TAB 1: KOTAK MASUK */}
          {activeTab === 'masuk' && (
            <div className="space-y-3">
              {inboxMessages.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Belum Ada Pesan Masuk</p>
                  <p className="text-xs text-slate-400">
                    {isStaf 
                      ? 'Pesan atau pertanyaan yang diajukan siswa ke Anda akan tampil di sini.' 
                      : 'Bimbingan atau balasan pesan dari Bapak/Ibu Guru akan tampil di sini.'}
                  </p>
                </div>
              ) : (
                inboxMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    onClick={() => handleMarkAsRead(msg)}
                    className={`p-4 rounded-2xl border transition space-y-2.5 cursor-pointer ${
                      !msg.sudah_dibaca 
                        ? 'bg-purple-50/70 border-purple-200 hover:border-purple-300' 
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {!msg.sudah_dibaca && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                        )}
                        <span className="text-xs font-black text-slate-900">
                          {msg.pengirim_nama}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {msg.pengirim_role === 'siswa' ? `Siswa Kelas ${msg.kelas_nama || '-'}` : msg.pengirim_role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {msg.subjek}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                        "{msg.pesan}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {msg.sudah_dibaca ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Telah dibaca</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-700 font-bold">Pesan Baru</span>
                          </>
                        )}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBalasPesan(msg);
                        }}
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Balas Pesan</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: FORM KIRIM PESAN */}
          {activeTab === 'kirim' && (
            <form onSubmit={handleKirimPesan} className="space-y-4">
              
              {/* Form Input Khusus Guru (Pilih Kelas & Siswa) */}
              {isStaf && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Pilih Rombel / Kelas:
                    </label>
                    <select
                      value={selectedKelasId}
                      onChange={(e) => handleSelectKelasChange(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          Kelas {k.nama_kelas} (Tingkat {k.tingkat})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Pilih Siswa yang Dituju:
                    </label>
                    <select
                      value={selectedSiswaId}
                      onChange={(e) => setSelectedSiswaId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Pilih Siswa ({siswaInSelectedKelas.length} Siswa) --</option>
                      {siswaInSelectedKelas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.nisn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Form Input Khusus Siswa (Pilih Guru) */}
              {isSiswa && (
                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Guru / Pimpinan yang Ingin Dihubungi:
                  </label>
                  <select
                    value={selectedGuruId}
                    onChange={(e) => setSelectedGuruId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {stafList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nama} • {st.role === 'wali_kelas' ? 'Wali Kelas' : st.role === 'kepala_sekolah' ? 'Kepala Sekolah' : st.role === 'kesiswaan' ? 'Kesiswaan & BK' : st.role === 'waka_kurikulum' ? 'Waka Kurikulum' : 'Super Admin'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pilihan Template Subjek Cepat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subjek / Topik Percakapan:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {isStaf ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSubjek('🏆 Apresiasi Kedisiplinan 7 Kebiasaan')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        🏆 Apresiasi Disiplin
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjek('⚠️ Bimbingan Bangun Pagi & Sholat')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        ⚠️ Bimbingan Bangun Pagi
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjek('📖 Pengingat Pengisian Jurnal Harian')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        📖 Pengingat Jurnal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSubjek('🙏 Konsultasi Pembiasaan & Ibadah')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        🙏 Konsultasi Ibadah
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjek('📚 Curhat Belajar & Istiqomah')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        📚 Curhat Belajar
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjek('💡 Pertanyaan Seputar Pembiasaan')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-purple-100 rounded-lg text-slate-700"
                      >
                        💡 Pertanyaan
                      </button>
                    </>
                  )}
                </div>
                <input
                  type="text"
                  value={subjek}
                  onChange={(e) => setSubjek(e.target.value)}
                  placeholder="Contoh: Apresiasi konsistensi bangun pagi..."
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Isi Pesan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Pesan / Bimbingan:
                </label>
                <textarea
                  rows={4}
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  placeholder={isStaf ? "Tuliskan motivasi, bimbingan, atau nasihat hangat untuk siswa..." : "Tuliskan pertanyaan atau cerita pembiasaanmu di rumah..."}
                  className="w-full text-xs leading-relaxed p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Tombol Kirim */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('masuk')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Mengirim...' : 'Kirim Pesan Sekarang'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RIWAYAT PESAN TERKIRIM */}
          {activeTab === 'terkirim' && (
            <div className="space-y-3">
              {sentMessages.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <SendHorizontal className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Belum Ada Pesan yang Dikirim</p>
                  <p className="text-xs text-slate-400">
                    Pesan yang Anda kirimkan akan tersimpan di riwayat ini.
                  </p>
                </div>
              ) : (
                sentMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Kepada: {msg.penerima_nama}
                        </span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                          {msg.penerima_role === 'siswa' ? `Kelas ${msg.kelas_nama || '-'}` : msg.penerima_role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{msg.subjek}</h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                        "{msg.pesan}"
                      </p>
                    </div>

                    <div className="flex items-center justify-end text-[10px] text-slate-400 gap-1 pt-1">
                      {msg.sudah_dibaca ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Telah dibaca penerima
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Terkirim (Menunggu dibaca)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
