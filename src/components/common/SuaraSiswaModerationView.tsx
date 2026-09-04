import React, { useState, useMemo } from 'react';
import { 
  MessageSquareHeart, 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ShieldCheck, 
  User, 
  Trash2, 
  MessageSquare, 
  Sparkles,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { Kelas, Siswa, StafSekolah, SuaraSiswa, KategoriSuara, TanggapanSuaraItem } from '../../types/database';
import { JournalService } from '../../lib/journalService';

interface SuaraSiswaModerationViewProps {
  suaraList: SuaraSiswa[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  stafList: StafSekolah[];
  currentStaf: StafSekolah;
  onRefreshData: () => void;
}

export const SuaraSiswaModerationView: React.FC<SuaraSiswaModerationViewProps> = ({
  suaraList,
  siswaList,
  kelasList,
  stafList,
  currentStaf,
  onRefreshData
}) => {
  const isSuperadmin = currentStaf.role === 'superadmin';
  const isWaliKelas = currentStaf.role === 'wali_kelas';

  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State untuk form tanggapan
  const [respondingItem, setRespondingItem] = useState<SuaraSiswa | null>(null);
  const [tanggapanText, setTanggapanText] = useState<string>('');
  const [isSavingTanggapan, setIsSavingTanggapan] = useState<boolean>(false);

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'wali_kelas': return 'Wali Kelas';
      case 'kepala_sekolah': return 'Kepala Sekolah';
      case 'waka_kurikulum': return 'Waka Kurikulum';
      case 'kesiswaan': return 'Kesiswaan & BK';
      case 'superadmin': return 'Super Administrator';
      default: return 'Guru / Pendidik';
    }
  };

  const parseResponses = (item: SuaraSiswa): TanggapanSuaraItem[] => {
    if (!item.tanggapan) return [];
    if (item.tanggapan.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(item.tanggapan);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    const staf = stafList.find(s => s.id === item.tanggapan_oleh_staf_id);
    return [{
      id: `tg-${item.tanggapan_oleh_staf_id || '1'}`,
      staf_id: item.tanggapan_oleh_staf_id || '',
      staf_nama: staf?.nama || 'Bapak/Ibu Guru',
      staf_role: staf?.role || 'wali_kelas',
      tanggapan: item.tanggapan,
      created_at: item.tanggapan_at || item.created_at || new Date().toISOString()
    }];
  };

  // Filter list
  const filteredList = useMemo(() => {
    return suaraList.filter((item) => {
      // Jika wali kelas, tampilkan suara dari kelas binaannya secara resilient
      if (isWaliKelas) {
        const rawS = siswaList.find(s => s.id === item.siswa_id);
        const itemClassId = item.kelas_id || rawS?.kelas_id;
        const myClassId = currentStaf.kelas_id;
        const myKelas = kelasList.find(k => 
          k.id === myClassId || 
          k.nama_kelas === myClassId || 
          k.wali_kelas_id === currentStaf.id ||
          (myClassId && k.nama_kelas.toUpperCase() === String(myClassId).replace(/^k-/i, '').toUpperCase())
        );
        
        const isMatch = 
          itemClassId === myClassId ||
          (myKelas && (itemClassId === myKelas.id || itemClassId === myKelas.nama_kelas || itemClassId?.toUpperCase() === myKelas.nama_kelas.toUpperCase())) ||
          (rawS && myKelas && rawS.kelas_id === myKelas.id);
        
        if (!isMatch) return false;
      }

      const matchKategori = filterKategori === 'all' || item.kategori === filterKategori;
      const matchKelas = filterKelas === 'all' || item.kelas_id === filterKelas || 
        siswaList.find(s => s.id === item.siswa_id)?.kelas_id === filterKelas;
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'belum_ditanggapi' ? !item.tanggapan :
        Boolean(item.tanggapan);

      const matchQuery = 
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.isi.toLowerCase().includes(searchQuery.toLowerCase());

      return matchKategori && matchKelas && matchStatus && matchQuery;
    });
  }, [suaraList, filterKategori, filterKelas, filterStatus, searchQuery, isWaliKelas, currentStaf, siswaList, kelasList]);

  const handleOpenResponseModal = (item: SuaraSiswa, defaultText: string = '') => {
    setRespondingItem(item);
    setTanggapanText(defaultText);
  };

  const handleSaveTanggapan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingItem || !tanggapanText.trim()) return;

    setIsSavingTanggapan(true);
    try {
      await JournalService.tanggapiSuaraSiswa(
        respondingItem.id, 
        currentStaf.id, 
        tanggapanText.trim(),
        currentStaf.nama,
        currentStaf.role
      );
      setRespondingItem(null);
      setTanggapanText('');
      onRefreshData();
      alert('✅ Tanggapan berhasil disimpan dan dapat langsung dibaca oleh siswa.');
    } catch (e) {
      alert('Gagal menyimpan tanggapan: ' + e);
    } finally {
      setIsSavingTanggapan(false);
    }
  };

  const handleDeleteSuara = async (suaraId: string) => {
    if (!window.confirm('Hapus aspirasi/curhatan siswa ini?')) return;
    await JournalService.deleteSuaraSiswa(suaraId);
    onRefreshData();
  };

  const getKategoriBadge = (kat: KategoriSuara) => {
    switch (kat) {
      case 'curhat_pembiasaan':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'keluhan_kendala':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ide_saran_aplikasi':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 shrink-0">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
                {isSuperadmin ? 'Super Administrator • Akses Lengkap' : 'Kotak Aspirasi & Curhat Siswa'}
              </span>
              <span className="text-xs text-purple-300">
                {isSuperadmin ? 'Audit Identitas Asli Siswa' : 'Format Terproteksi Anonim'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              Suara, Keluhan & Ide Inovasi Siswa
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-xs">
            <span className="text-[10px] text-purple-200 block">Total Masuk</span>
            <span className="text-lg font-black text-white">{suaraList.length} Pesan</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-xs">
            <span className="text-[10px] text-amber-300 block">Belum Ditanggapi</span>
            <span className="text-lg font-black text-amber-300">
              {suaraList.filter(s => !s.tanggapan).length} Pesan
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Semua (${suaraList.length})` },
            { id: 'curhat_pembiasaan', label: '💖 Curhat' },
            { id: 'keluhan_kendala', label: '⚠️ Keluhan' },
            { id: 'ide_saran_aplikasi', label: '💡 Ide & Saran' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterKategori(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterKategori === cat.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status & Rombel Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="belum_ditanggapi">⏳ Belum Ditanggapi</option>
            <option value="sudah_ditanggapi">✅ Sudah Ditanggapi</option>
          </select>

          {!isWaliKelas && (
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="all">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama_kelas}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aspirasi..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
            <MessageSquareHeart className="w-12 h-12 text-purple-300 mx-auto" />
            <h5 className="font-extrabold text-slate-700 text-sm">Tidak Ada Aspirasi / Curhatan</h5>
            <p className="text-xs">Belum ada pesan siswa yang sesuai dengan kriteria filter saat ini.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const rawSiswa = siswaList.find(s => s.id === item.siswa_id);
            const kelas = kelasList.find(k => k.id === (item.kelas_id || rawSiswa?.kelas_id));
            const penanggap = stafList.find(st => st.id === item.tanggapan_oleh_staf_id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Badge Kategori & Pengirim */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getKategoriIcon(item.kategori)}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getKategoriBadge(item.kategori)}`}>
                        {item.kategori.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 font-mono">
                      {item.tanggal}
                    </span>
                  </div>

                  {/* Info Pengirim (Anonim vs Real untuk Superadmin) */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isSuperadmin ? (
                        <div className="flex items-center gap-2 text-purple-900 font-bold">
                          <User className="w-4 h-4 text-purple-600" />
                          <span>{rawSiswa?.nama || 'Siswa'}</span>
                          <span className="text-[10px] text-purple-600 font-mono">({rawSiswa?.nisn})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Siswa Kelas {kelas?.nama_kelas || '7A'} (Anonim)</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                      Kelas {kelas?.nama_kelas || '-'}
                    </span>
                  </div>

                  {/* Judul & Isi Pesan */}
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{item.judul}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      "{item.isi}"
                    </p>
                  </div>
                </div>

                {/* Bagian Tanggapan & Aksi */}
                {(() => {
                  const responses = parseResponses(item);
                  const myResponse = responses.find(r => r.staf_id === currentStaf.id);

                  return (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {responses.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                            Tanggapan Guru & Pimpinan ({responses.length}):
                          </span>
                          {responses.map((resp) => (
                            <div key={resp.id} className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {resp.staf_nama}
                                  </span>
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-200/70 text-emerald-950">
                                    {formatRoleLabel(resp.staf_role)}
                                  </span>
                                </div>
                                {resp.created_at && (
                                  <span className="text-[10px] text-emerald-700 font-mono">
                                    {new Date(resp.created_at).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                                "{resp.tanggapan}"
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Belum Diberikan Tanggapan
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isSuperadmin && (
                          <button
                            onClick={() => handleDeleteSuara(item.id)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                            title="Hapus Aspirasi Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {myResponse ? (
                          <>
                            <button
                              onClick={() => handleOpenResponseModal(item, myResponse.tanggapan)}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Ubah Tanggapan Saya</span>
                            </button>
                            <button
                              onClick={() => handleOpenResponseModal(item, '')}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <span>+ Tanggapi Lagi</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenResponseModal(item, '')}
                            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>+ Beri Tanggapan ({formatRoleLabel(currentStaf.role)})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL BERI TANGGAPAN */}
      {respondingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">Berikan Tanggapan / Feedback</h4>
                  <p className="text-xs text-slate-400">Tanggapan ini akan dapat dibaca langsung oleh siswa di aplikasinya</p>
                </div>
              </div>
              <button
                onClick={() => setRespondingItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Pesan Siswa:</span>
              <p className="text-slate-600 italic">"{respondingItem.isi}"</p>
            </div>

            <form onSubmit={handleSaveTanggapan} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tuliskan Tanggapan Edukatif & Apresiasi:
                </label>
                <textarea
                  required
                  rows={4}
                  value={tanggapanText}
                  onChange={(e) => setTanggapanText(e.target.value)}
                  placeholder="Contoh: Terima kasih atas idemu ananda. Bapak/Ibu guru sangat mengapresiasi dan akan membantu..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingTanggapan}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSavingTanggapan ? 'Menyimpan...' : 'Kirim Tanggapan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
