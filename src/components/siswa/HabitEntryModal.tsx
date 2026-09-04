import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Info,
  Loader2,
  BookOpen,
  Lightbulb,
  PenTool,
  BookMarked
} from 'lucide-react';
import { EntriJurnal, Kebiasaan, SumberFoto } from '../../types/database';
import { analyzePhotoExif } from '../../lib/exifHelper';
import { compressImage } from '../../lib/imageCompressor';
import { 
  calculateStatusWaktu, 
  getStatusWaktuLabel, 
  isDailyEntryWindowOpen, 
  getTodayDateString,
  getPrayerSchedule,
  getCurrentActivePrayer,
  BanyuwangiPrayerService
} from '../../lib/timeCalculator';
import { uploadBuktiFotoUnified } from '../../lib/storageService';

interface HabitEntryModalProps {
  kebiasaan: Kebiasaan | null;
  existingEntries: EntriJurnal[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newEntry: Omit<EntriJurnal, 'id' | 'waktu_submit'>) => void;
  studentId: string;
}

const BERMASYARAKAT_CHIPS = [
  'Bantu pekerjaan rumah',
  'Ngobrol sopan dengan tetangga',
  'Ikut kerja bakti lingkungan',
  'Menolong teman / keluarga',
  'Menjaga kebersihan lingkungan',
  'Membantu adik belajar'
];

export const HabitEntryModal: React.FC<HabitEntryModalProps> = ({
  kebiasaan,
  existingEntries,
  isOpen,
  onClose,
  onSubmitSuccess,
  studentId
}) => {
  if (!isOpen || !kebiasaan) return null;

  const todayStr = getTodayDateString();
  
  // State form
  const [sumberFoto, setSumberFoto] = useState<SumberFoto>('kamera');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoExt, setPhotoExt] = useState<string>('webp');
  const [waktuAmbilFoto, setWaktuAmbilFoto] = useState<Date>(new Date());
  const [flagFoto, setFlagFoto] = useState<boolean>(false);
  const [alasanFlag, setAlasanFlag] = useState<string | null>(null);
  const [subTipe, setSubTipe] = useState<string>('');
  const [namaKegiatan, setNamaKegiatan] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  // Sub-tipe yang sudah pernah diisi hari ini
  const usedSubTypes = existingEntries.map((e) => e.sub_tipe).filter(Boolean);

  // Otomatis pilih waktu sholat yang sedang aktif jika kebiasaan ibadah
  useEffect(() => {
    if (kebiasaan.butuh_sub_tipe && kebiasaan.daftar_sub_tipe && !subTipe) {
      const active = getCurrentActivePrayer();
      if (active && kebiasaan.daftar_sub_tipe.includes(active.name) && !usedSubTypes.includes(active.name)) {
        setSubTipe(active.name);
      } else {
        const firstAvailable = kebiasaan.daftar_sub_tipe.find((t) => !usedSubTypes.includes(t));
        if (firstAvailable) setSubTipe(firstAvailable);
      }
    }
  }, [kebiasaan.id, isOpen]);

  // Status waktu realtime (memperhitungkan subTipe waktu sholat jika ada)
  const estimatedStatusWaktu = calculateStatusWaktu(kebiasaan, waktuAmbilFoto, subTipe);
  const { label: statusLabel, badgeColor: statusBadgeColor } = getStatusWaktuLabel(estimatedStatusWaktu);

  // Handle pemilihan foto kamera
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const now = new Date();
      setWaktuAmbilFoto(now);
      setSumberFoto('kamera');
      setFlagFoto(false);
      setAlasanFlag(null);

      // Buat preview lokal
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Kompresi di client (WebP 720px hemat kuota hingga 90%)
      const compressed = await compressImage(file, 720, 0.55);
      setPhotoBlob(compressed.blob);
      setPhotoExt(compressed.extension);
    } catch (err) {
      console.error(err);
      setErrorMessage('Gagal memproses foto dari kamera');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle pemilihan foto galeri (Analisis EXIF via exifr)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      setSumberFoto('upload');

      // 1. Ekstraksi EXIF sebelum dikompres
      const exifResult = await analyzePhotoExif(file, todayStr);
      
      if (exifResult.isSuspicious) {
        setFlagFoto(true);
        setAlasanFlag(exifResult.reason || 'Metadata mencurigakan');
        setWaktuAmbilFoto(exifResult.dateTimeOriginal || new Date());
      } else {
        setFlagFoto(false);
        setAlasanFlag(null);
        setWaktuAmbilFoto(exifResult.dateTimeOriginal || new Date());
      }

      // 2. Buat preview
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // 3. Kompresi gambar (resolusi optimal 720px & kualitas 0.55 WebP hemat kuota 90%)
      const compressed = await compressImage(file, 720, 0.55);
      setPhotoBlob(compressed.blob);
      setPhotoExt(compressed.extension);
    } catch (err) {
      console.error(err);
      setErrorMessage('Gagal membaca metadata gambar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const windowStatus = isDailyEntryWindowOpen(new Date());
    if (!windowStatus.isOpen) {
      setErrorMessage(windowStatus.message || 'Pengisian jurnal harian dibuka mulai pukul 01:00 s.d 24:00 WIB.');
      return;
    }

    if (!photoBlob && !photoPreview) {
      setErrorMessage('Wajib melampirkan foto bukti pelaksanaan kebiasaan!');
      return;
    }

    if (kebiasaan.butuh_sub_tipe && !subTipe) {
      setErrorMessage('Silakan pilih waktu sholat/ibadah terlebih dahulu!');
      return;
    }

    if (kebiasaan.butuh_nama_kegiatan && !namaKegiatan.trim()) {
      setErrorMessage('Silakan isi atau pilih nama kegiatan bermasyarakat!');
      return;
    }

    // Validasi Khusus Kebiasaan #5 (Gemar Belajar): Wajib minimal 100 kata refleksi
    const isGemarBelajar = kebiasaan.urutan === 5 || kebiasaan.nama.toLowerCase().includes('belajar');
    const wordCount = catatan.trim().split(/\s+/).filter(Boolean).length;
    if (isGemarBelajar && wordCount < 100) {
      setErrorMessage(
        `Jurnal Gemar Belajar mewajibkan cerita refleksi minimal 100 kata (saat ini baru ${wordCount} kata). Ceritakan lebih lengkap materi pelajaran hari ini atau persiapan materi yang kamu baca untuk esok hari!`
      );
      return;
    }

    setIsProcessing(true);

    try {
      let finalFotoUrl = photoPreview || '';

      // Upload ke storage jika ada blob (otomatis sesuai provider aktif: Google Drive, Cloudinary, atau Supabase)
      if (photoBlob) {
        const fileExt = photoExt || 'webp';
        const fileName = `${studentId}/${kebiasaan.id}_${Date.now()}.${fileExt}`;
        const uploadedUrl = await uploadBuktiFotoUnified(photoBlob, fileName);
        if (uploadedUrl) {
          finalFotoUrl = uploadedUrl;
        }
      }

      const nextUrutanKe = existingEntries.length + 1;
      const finalStatusWaktu = calculateStatusWaktu(kebiasaan, waktuAmbilFoto);

      onSubmitSuccess({
        siswa_id: studentId,
        kebiasaan_id: kebiasaan.id,
        tanggal: todayStr,
        urutan_ke: nextUrutanKe,
        sub_tipe: kebiasaan.butuh_sub_tipe ? subTipe : null,
        nama_kegiatan: kebiasaan.butuh_nama_kegiatan ? namaKegiatan : null,
        catatan: catatan.trim() || null,
        foto_url: finalFotoUrl,
        sumber_foto: sumberFoto,
        waktu_ambil_foto: waktuAmbilFoto.toISOString(),
        flag_foto_mencurigakan: flagFoto,
        alasan_flag: alasanFlag,
        status_waktu: finalStatusWaktu
      });

      onClose();
    } catch (err: any) {
      console.error('Gagal simpan entri:', err);
      setErrorMessage(err.message || 'Gagal menyimpan entri jurnal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-emerald-50 to-teal-50">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Isi Jurnal Kebiasaan #{kebiasaan.urutan}
            </span>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {kebiasaan.nama}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* Info Aturan Jam & Toleransi */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Panduan Pelaksanaan:</span>
            </div>
            <p className="text-[11px] text-slate-500">{kebiasaan.deskripsi}</p>
            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 mt-1">
              <span className="font-medium text-slate-500">
                ⏰ Jam Operasional Jurnal: <strong className="text-slate-700">01:00 - 24:00 WIB</strong>
              </span>
              {kebiasaan.jam_mulai && kebiasaan.jam_selesai && (
                <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${statusBadgeColor}`}>
                  Status: {statusLabel}
                </span>
              )}
            </div>
            {kebiasaan.jam_mulai && kebiasaan.jam_selesai && (
              <div className="text-[11px] text-slate-600">
                🎯 Target Ideal: <strong>{kebiasaan.jam_mulai} - {kebiasaan.jam_selesai} WIB</strong>
                {kebiasaan.toleransi_menit > 0 && ` (+${kebiasaan.toleransi_menit}m toleransi)`}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Pilih Sumber Foto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Bukti Foto Pelaksanaan (Wajib)
            </label>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputCameraRef}
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputGalleryRef}
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />

            {!photoPreview ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputCameraRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-900 block">Ambil Foto Kamera</span>
                  <span className="text-[10px] text-emerald-600 mt-0.5">Waktu otomatis tercatat</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputGalleryRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 transition text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-blue-900 block">Unggah dari Galeri</span>
                  <span className="text-[10px] text-blue-600 mt-0.5">Deteksi otomatis EXIF</span>
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src={photoPreview}
                  alt="Preview Bukti"
                  className="w-full h-44 object-cover"
                />
                
                {/* Overlay Change Photo */}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoBlob(null);
                      setFlagFoto(false);
                      setAlasanFlag(null);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-sm transition"
                  >
                    Ganti Foto
                  </button>
                </div>

                <div className="absolute bottom-2 left-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm">
                    {sumberFoto === 'kamera' ? '📷 Kamera Langsung' : '🖼️ Unggah Galeri'}
                  </span>
                </div>
              </div>
            )}

            {/* Peringatan Flag Deteksi Kecurangan (Non-blocking) */}
            {flagFoto && (
              <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-amber-800">
                    Catatan Verifikasi EXIF:
                  </strong>
                  <p className="text-amber-700 text-[11px] mt-0.5">{alasanFlag}</p>
                  <span className="text-[10px] text-amber-600 italic block mt-1">
                    *Anda tetap dapat mengirim jurnal. Catatan ini akan ditinjau oleh wali kelas.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Sub-Tipe (Khusus Beribadah: Sholat Wajib Banyuwangi) */}
          {kebiasaan.butuh_sub_tipe && (
            <div className="space-y-2.5">
              {(() => {
                const isSunday = waktuAmbilFoto.getDay() === 0;
                const activeList: string[] = kebiasaan.id === 2
                  ? BanyuwangiPrayerService.getRequiredPrayersForDate(waktuAmbilFoto)
                  : (kebiasaan.daftar_sub_tipe || []);

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        {kebiasaan.id === 2 
                          ? (isSunday ? 'Pilih Waktu Sholat (Hari Minggu: 5 Waktu)' : 'Pilih Waktu Sholat Rumah (Senin-Sabtu: 4 Waktu)')
                          : 'Pilih Kategori Pembiasaan'}
                      </label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Hisab Kemenag Banyuwangi
                      </span>
                    </div>

                    {/* Banner Keterangan Khusus Dhuhur Hari Minggu vs Senin-Sabtu */}
                    {kebiasaan.id === 2 && (
                      <div className={`p-2.5 rounded-2xl border text-[11px] flex items-start gap-2 ${
                        isSunday
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      }`}>
                        <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSunday ? 'text-emerald-600' : 'text-indigo-600'}`} />
                        <div>
                          <strong className="block">
                            {isSunday ? '🌟 Hari Minggu (Libur Penuh di Rumah):' : '🏫 Hari Sekolah (Senin s.d. Sabtu):'}
                          </strong>
                          <span>
                            {isSunday
                              ? 'Seluruh 5 waktu sholat (Subuh, Dhuhur, Ashar, Maghrib, Isya\') dinilai dari rumah.'
                              : 'Sholat Dhuhur dilaksanakan berjamaah di sekolah. Jurnal mandiri di rumah menilai 4 waktu sholat (Subuh, Ashar, Maghrib, Isya\').'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={`grid gap-2 ${activeList.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
                      {activeList.map((tipe: string) => {
                        const isUsed = usedSubTypes.includes(tipe);
                        const isSelected = subTipe === tipe;
                        const prayerInfo = getPrayerSchedule(tipe, waktuAmbilFoto);
                        const activePrayer = getCurrentActivePrayer(waktuAmbilFoto);
                        const isCurrentlyActive = activePrayer?.name.toLowerCase() === tipe.toLowerCase();

                        return (
                          <button
                            key={tipe}
                            type="button"
                            disabled={isUsed}
                            onClick={() => setSubTipe(tipe)}
                            className={`p-2.5 rounded-2xl text-xs font-semibold border transition text-center flex flex-col justify-between items-center relative overflow-hidden ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                                : isUsed
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                            }`}
                          >
                            {isCurrentlyActive && !isUsed && (
                              <span className={`absolute top-0 right-0 left-0 text-[8px] py-0.5 font-extrabold uppercase tracking-wider ${
                                isSelected ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Waktu Sekarang
                              </span>
                            )}

                            <div className={isCurrentlyActive && !isUsed ? 'pt-2' : ''}>
                              <span className="font-bold text-sm block">{tipe}</span>
                              {prayerInfo && (
                                <span className={`text-[10px] block mt-0.5 font-mono ${
                                  isSelected ? 'text-emerald-100' : 'text-slate-500'
                                }`}>
                                  {prayerInfo.displayWindow.replace(' WIB', '')}
                                </span>
                              )}
                            </div>

                            {isUsed ? (
                              <span className="mt-1 text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded-md">
                                ✓ Sudah Diisi
                              </span>
                            ) : (
                              <span className={`mt-1 text-[9px] font-medium ${
                                isSelected ? 'text-emerald-200' : 'text-slate-400'
                              }`}>
                                Banyuwangi
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Live Info Banner untuk Sholat yang Dipilih */}
              {subTipe && getPrayerSchedule(subTipe, waktuAmbilFoto) && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all duration-300 ${
                  estimatedStatusWaktu === 'tepat_waktu'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : estimatedStatusWaktu === 'toleransi'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}>
                  <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${
                    estimatedStatusWaktu === 'tepat_waktu'
                      ? 'text-emerald-600'
                      : estimatedStatusWaktu === 'toleransi'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        Jadwal Sholat {subTipe}: {getPrayerSchedule(subTipe, waktuAmbilFoto)?.displayWindow}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {estimatedStatusWaktu === 'tepat_waktu'
                        ? `Alhamdulillah, foto diambil tepat pada rentang waktu Sholat ${subTipe} wilayah Banyuwangi.`
                        : estimatedStatusWaktu === 'toleransi'
                        ? `Foto diambil pada batas toleransi (+15 menit setelah waktu Sholat ${subTipe} berakhir).`
                        : `Foto diambil di luar rentang waktu Sholat ${subTipe} (${getPrayerSchedule(subTipe, waktuAmbilFoto)?.displayWindow}). Tetap dapat dikirim untuk ditinjau guru.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Nama Kegiatan (Khusus Bermasyarakat) */}
          {kebiasaan.butuh_nama_kegiatan && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Kegiatan Bermasyarakat
              </label>
              
              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {BERMASYARAKAT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setNamaKegiatan(chip)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      namaKegiatan === chip
                        ? 'bg-purple-100 text-purple-900 border-purple-300 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Kerja bakti bersihkan selokan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* 4. Catatan Refleksi (Khusus Gemar Belajar: Wajib Minimal 100 Kata) */}
          {(() => {
            const isGemarBelajar = kebiasaan.urutan === 5 || kebiasaan.nama.toLowerCase().includes('belajar');
            const wordCount = catatan.trim().split(/\s+/).filter(Boolean).length;
            const percentage = Math.min(100, Math.round((wordCount / 100) * 100));

            if (isGemarBelajar) {
              return (
                <div className="space-y-3 p-4 rounded-2xl bg-linear-to-br from-indigo-50/90 via-purple-50/60 to-white border-2 border-indigo-200 shadow-xs animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-indigo-950">
                          Cerita Refleksi Belajar (Wajib Min. 100 Kata)
                        </label>
                        <span className="text-[11px] text-indigo-700/80">
                          Ceritakan pelajaran hari ini atau persiapan esok hari
                        </span>
                      </div>
                    </div>

                    {/* Live Word Counter Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                      wordCount >= 100
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {wordCount >= 100 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{wordCount} / 100 kata (Tercapai!)</span>
                        </>
                      ) : (
                        <>
                          <PenTool className="w-3.5 h-3.5 text-amber-700" />
                          <span>{wordCount} / 100 kata</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Word Count Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        wordCount >= 100 
                          ? 'bg-emerald-500' 
                          : wordCount >= 50 
                          ? 'bg-amber-500' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Template Pilihan Pemantik Refleksi (Singkat Sebagai Pemantik) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gunakan Kalimat Pemantik Singkat (Lanjutkan Sendiri Minimal 100 Kata):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCatatan(
                            "Hari ini saya mempelajari mata pelajaran ... Topik yang dibahas adalah ... Hal penting yang saya pahami yaitu ... "
                          );
                        }}
                        className="text-left p-2 rounded-xl bg-white/95 hover:bg-indigo-50 text-indigo-950 border border-indigo-200 hover:border-indigo-400 text-[11px] font-medium transition shadow-2xs group cursor-pointer"
                      >
                        <span className="font-bold flex items-center gap-1 text-indigo-700 group-hover:text-indigo-900">
                          <BookMarked className="w-3 h-3" />
                          <span>1. Pelajaran Hari Ini</span>
                        </span>
                        <span className="text-slate-400 text-[9px] block mt-0.5">Pemantik rangkuman materi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCatatan(
                            "Untuk persiapan pelajaran besok, saya mempelajari materi ... Yang saya pahami dari materi ini adalah ... Hal yang ingin saya diskusikan di kelas yaitu ... "
                          );
                        }}
                        className="text-left p-2 rounded-xl bg-white/95 hover:bg-purple-50 text-purple-950 border border-purple-200 hover:border-purple-400 text-[11px] font-medium transition shadow-2xs group cursor-pointer"
                      >
                        <span className="font-bold flex items-center gap-1 text-purple-700 group-hover:text-purple-900">
                          <Sparkles className="w-3 h-3" />
                          <span>2. Persiapan Besok</span>
                        </span>
                        <span className="text-slate-400 text-[9px] block mt-0.5">Pemantik bacaan esok hari</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCatatan(
                            "Hari ini saya membaca buku tentang ... Dari bacaan ini, saya mendapatkan wawasan baru yaitu ... "
                          );
                        }}
                        className="text-left p-2 rounded-xl bg-white/95 hover:bg-emerald-50 text-emerald-950 border border-emerald-200 hover:border-emerald-400 text-[11px] font-medium transition shadow-2xs group cursor-pointer"
                      >
                        <span className="font-bold flex items-center gap-1 text-emerald-700 group-hover:text-emerald-900">
                          <BookOpen className="w-3 h-3" />
                          <span>3. Membaca Buku</span>
                        </span>
                        <span className="text-slate-400 text-[9px] block mt-0.5">Pemantik literasi buku</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Ceritakan dengan bahasamu sendiri minimal 100 kata (misal: apa mata pelajarannya, apa yang kamu pahami, tantangan yang kamu selesaikan, atau persiapan untuk esok hari)..."
                    className="w-full p-3.5 rounded-xl border border-indigo-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-normal leading-relaxed text-slate-800"
                  />

                  {wordCount < 100 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
                      <span>⚠️ Masih kurang <strong>{100 - wordCount} kata</strong> lagi.</span>
                      <span className="font-bold text-amber-700">{percentage}% selesai</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hebat! Cerita refleksimu telah mencapai {wordCount} kata dan memenuhi syarat pengiriman jurnal.</span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Refleksi Diri (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Ceritakan perasaan atau hal bermanfaat yang kamu rasakan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            );
          })()}

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Bukti Jurnal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
