import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  DownloadCloud, 
  Trash2, 
  RotateCcw, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  Layers, 
  Calendar, 
  Filter, 
  ShieldAlert, 
  Zap, 
  FolderArchive,
  RefreshCw,
  Info
} from 'lucide-react';
import { EntriJurnal, Siswa, Kelas, Kebiasaan } from '../../types/database';
import { 
  createPhotoBackupZip, 
  triggerBrowserDownload, 
  cleanStoragePhotos, 
  restorePhotosFromZip,
  BackupProgress 
} from '../../lib/photoBackupManager';
import { 
  getLocalStorageConfig, 
  getActiveStorageConfig,
  fetchRemoteStorageConfig,
  saveStorageConfig, 
  StorageConfig, 
  StorageProviderType 
} from '../../lib/storageConfig';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  testGoogleAppsScriptConnection 
} from '../../lib/storageService';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: EntriJurnal[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  kebiasaanList: Kebiasaan[];
  onDataRefresh: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  isOpen,
  onClose,
  entries,
  siswaList,
  kelasList,
  kebiasaanList,
  onDataRefresh
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'status' | 'backup' | 'clean' | 'restore' | 'gdrive'>('status');

  // Storage Config State
  const [config, setConfig] = useState<StorageConfig>(getActiveStorageConfig);
  const [gdriveInputUrl, setGdriveInputUrl] = useState(config.gdriveWebAppUrl || '');
  const [selectedProvider, setSelectedProvider] = useState<StorageProviderType>(config.provider);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; suggestion?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Backup State
  const [backupDateFilter, setBackupDateFilter] = useState<'all' | 'month' | 'custom'>('all');
  const [backupStartDate, setBackupStartDate] = useState('');
  const [backupEndDate, setBackupEndDate] = useState('');
  const [backupKelasFilter, setBackupKelasFilter] = useState<string>('all');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);

  // Clean / Delete State
  const [cleanCriteria, setCleanCriteria] = useState<'7days' | '14days' | '30days' | 'custom'>('7days');
  const [cleanCustomDate, setCleanCustomDate] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanProgress, setCleanProgress] = useState<BackupProgress | null>(null);
  const [cleanConfirmed, setCleanConfirmed] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ deleted: number; updated: number } | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<BackupProgress | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ restoredCount: number; totalCount: number; errors: string[] } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModalConfig = async () => {
      // 1. Ambil dari in-memory / local storage seketika
      const current = getActiveStorageConfig();
      if (isMounted) {
        setConfig(current);
        setGdriveInputUrl(current.gdriveWebAppUrl || '');
        setSelectedProvider(current.provider);
      }

      // 2. Tarik data terbaru dari Cloud Supabase agar tersinkron lintas perangkat/browser
      if (isSupabaseConfigured) {
        try {
          const remote = await fetchRemoteStorageConfig();
          if (isMounted && remote) {
            setConfig(remote);
            setGdriveInputUrl(remote.gdriveWebAppUrl || '');
            setSelectedProvider(remote.provider);
          }
        } catch (e) {
          console.warn('Gagal fetch remote storage config di modal:', e);
        }
      }
    };

    if (isOpen) {
      loadModalConfig();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);


  // Statistik Foto
  const validPhotoEntries = entries.filter(
    (e) => e.foto_url && !e.foto_url.includes('[TERARSIP]') && e.foto_url.startsWith('http')
  );
  const archivedPhotoEntries = entries.filter(
    (e) => e.foto_url && e.foto_url.includes('[TERARSIP]')
  );
  const supabaseStoragePhotos = validPhotoEntries.filter((e) => e.foto_url.includes('bukti_foto'));
  const gdriveStoragePhotos = validPhotoEntries.filter(
    (e) => e.foto_url.includes('googleusercontent.com') || e.foto_url.includes('drive.google.com')
  );

  // Perhitungan dinamis storage berdasarkan jumlah foto aktif di Supabase (~54 KB per foto WebP/JPEG terkompresi)
  const estimatedSupabaseStorageGb = Math.max(
    0.01,
    parseFloat(((supabaseStoragePhotos.length * 54) / (1024 * 1024)).toFixed(2))
  );
  const estimatedStoragePercent = Math.min(100, Math.round((estimatedSupabaseStorageGb / 1.0) * 100));


  // Helper tanggal
  const getCleanTargetDate = (): string => {
    const now = new Date();
    if (cleanCriteria === '7days') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (cleanCriteria === '14days') {
      const d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (cleanCriteria === '30days') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    return cleanCustomDate || now.toISOString().slice(0, 10);
  };

  const cleanTargetDate = getCleanTargetDate();
  const photosEligibleForClean = supabaseStoragePhotos.filter((e) => e.tanggal <= cleanTargetDate);


  // Handler Salin Kode Apps Script
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2500);
  };

  // Handler Simpan Konfigurasi Storage
  const handleSaveStorageSettings = async () => {
    if (selectedProvider === 'gdrive' && !gdriveInputUrl.trim()) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    const newConfig: StorageConfig = {
      ...config,
      provider: selectedProvider,
      gdriveWebAppUrl: gdriveInputUrl.trim()
    };
    const success = await saveStorageConfig(newConfig);
    setConfig(newConfig);
    if (success) {
      alert('Konfigurasi penyimpanan berhasil disimpan dan disinkronkan ke Cloud! Seluruh foto baru siswa sekarang akan otomatis tersimpan di Google Drive.');
    } else {
      alert('Pengaturan disimpan secara lokal. Pastikan koneksi Supabase terhubung.');
    }
  };


  // Handler Tes Koneksi Google Apps Script
  const handleTestConnection = async () => {
    if (!gdriveInputUrl) {
      alert('Silakan isi URL Web App terlebih dahulu.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGoogleAppsScriptConnection(gdriveInputUrl.trim());
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Handler Jalankan Backup ZIP
  const handleStartBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress({ current: 0, total: 1, message: 'Menyiapkan arsip...' });

    try {
      // Filter entries sesuai pilihan
      let filtered = [...entries];
      if (backupKelasFilter !== 'all') {
        const studentIdsInClass = new Set(
          siswaList.filter((s) => s.kelas_id === backupKelasFilter).map((s) => s.id)
        );
        filtered = filtered.filter((e) => studentIdsInClass.has(e.siswa_id));
      }

      if (backupDateFilter === 'month') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        filtered = filtered.filter((e) => e.tanggal.startsWith(currentMonth));
      } else if (backupDateFilter === 'custom') {
        if (backupStartDate) filtered = filtered.filter((e) => e.tanggal >= backupStartDate);
        if (backupEndDate) filtered = filtered.filter((e) => e.tanggal <= backupEndDate);
      }

      const result = await createPhotoBackupZip({
        entries: filtered,
        siswaList,
        kelasList,
        kebiasaanList,
        onProgress: (p) => setBackupProgress(p)
      });

      triggerBrowserDownload(result.blob, result.fileName);
      setBackupProgress({
        current: result.totalPhotos,
        total: result.totalPhotos,
        message: `Berhasil! File ${result.fileName} telah diunduh ke komputer Anda.`
      });
    } catch (err: any) {
      alert(err.message || 'Gagal membuat file backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handler Bersihkan Server
  const handleCleanStorage = async () => {
    if (!cleanConfirmed) {
      alert('Harap centang konfirmasi bahwa Anda telah mengunduh backup ZIP sebelum menghapus.');
      return;
    }

    if (!window.confirm(`PERINGATAN: Sebanyak ${photosEligibleForClean.length} file foto fisik sebelum tanggal ${cleanTargetDate} akan dihapus dari Supabase Storage. Lanjutkan?`)) {
      return;
    }

    setIsCleaning(true);
    setCleanProgress({ current: 0, total: photosEligibleForClean.length, message: 'Memulai pembersihan...' });

    try {
      const res = await cleanStoragePhotos({
        entries,
        dateBefore: cleanTargetDate,
        onProgress: (p) => setCleanProgress(p)
      });

      setCleanResult({ deleted: res.deletedStorageFiles, updated: res.updatedEntriesCount });
      onDataRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal membersihkan foto server.');
    } finally {
      setIsCleaning(false);
    }
  };

  // Handler Restore dari ZIP
  const handleStartRestore = async () => {
    if (!restoreFile) {
      alert('Pilih file ZIP backup terlebih dahulu.');
      return;
    }

    setIsRestoring(true);
    setRestoreProgress({ current: 0, total: 1, message: 'Membaca manifest ZIP...' });

    try {
      const res = await restorePhotosFromZip({
        zipFile: restoreFile,
        onProgress: (p) => setRestoreProgress(p)
      });

      setRestoreResult(res);
      onDataRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal merestore foto.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] animate-slide-up">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 text-purple-200 flex items-center justify-center border border-purple-400/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Manajemen Kuota, Penyimpanan & Backup Foto
              </h3>
              <p className="text-xs text-purple-200/80">
                Solusi Egress 96% • Backup ZIP • Pembersihan Server • Google Drive Bebas Biaya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 p-2 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'status'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Krisis Kuota & Status</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Unduh Backup ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('clean')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'clean'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Foto Server</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore dari ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('gdrive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'gdrive'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Integrasi Google Drive (Gratis)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: STATUS KUOTA & PENJELASAN KRISIS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Alert Banner Status */}
              {config.provider === 'gdrive' && config.gdriveWebAppUrl ? (
                <div className="rounded-3xl p-5 bg-linear-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/10 border border-emerald-300 text-slate-800">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-extrabold text-base text-emerald-950">
                          Status Penyelamatan: Integrasi Google Drive Aktif!
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                          Egress Supabase 0 KB
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900/90 leading-relaxed">
                        Seluruh unggahan foto baru dari siswa kini langsung dialirkan ke Google Drive sekolah. Konsumsi kuota Egress Supabase <strong>resmi dihentikan (tidak akan naik lagi)</strong> dan akan direset menjadi 0 GB oleh Supabase pada <strong>12 September</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl p-5 bg-linear-to-r from-amber-500/15 via-orange-500/10 to-red-500/10 border border-amber-300 text-slate-800">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-amber-950 mb-1">
                        Peringatan Kuota Egress: 4,788 GB / 5 GB (96%) Terpakai!
                      </h4>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        Siklus tagihan baru direset pada <strong>12 September</strong>. Kuota egress tersisa hanya sekitar <strong>212 MB</strong>. Hubungkan Google Drive di tab "Integrasi Google Drive" untuk menghentikan konsumsi kuota.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Egress Bandwidth
                    </span>
                    {config.provider === 'gdrive' && config.gdriveWebAppUrl && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Freeze (Aman)
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-amber-950">96%</div>
                  <div className="text-xs text-amber-800 mt-1">4,788 GB / 5,000 GB (Reset 12 Sept)</div>
                  <div className="w-full bg-amber-200 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-amber-600 h-full w-[96%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                    Storage Supabase (Dinamis)
                  </span>
                  <div className="text-2xl font-black text-indigo-950">{estimatedStoragePercent}%</div>
                  <div className="text-xs text-indigo-800 mt-1">~{estimatedSupabaseStorageGb} GB / 1,00 GB</div>
                  <div className="w-full bg-indigo-200 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${estimatedStoragePercent}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Database Teks Jurnal
                  </span>
                  <div className="text-2xl font-black text-emerald-950">9% (Aman)</div>
                  <div className="text-xs text-emerald-800 mt-1">46 MB / 500 MB</div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-emerald-600 h-full w-[9%]" />
                  </div>
                </div>
              </div>

              {/* Rincian Inventaris Foto */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>Statistik Inventaris Berkas Foto di Aplikasi (Realtime)</span>
                  </h5>
                  <button
                    onClick={onDataRefresh}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-purple-600" />
                    <span>Segarkan Data</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Total Foto Aktif</span>
                    <strong className="text-lg text-slate-800 font-bold">{validPhotoEntries.length}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Di Supabase Bucket</span>
                    <strong className="text-lg text-amber-700 font-bold">{supabaseStoragePhotos.length}</strong>
                  </div>
                  <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block font-semibold">Di Google Drive</span>
                    <strong className="text-lg text-emerald-700 font-bold">{gdriveStoragePhotos.length}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Foto Terarsip Offline</span>
                    <strong className="text-lg text-purple-700 font-bold">{archivedPhotoEntries.length}</strong>
                  </div>
                </div>
              </div>


              {/* Tiga Langkah Penyelamatan */}
              <div className="p-5 rounded-3xl bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
                <h5 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Solusi Rekomendasi Agar Tidak Terblokir Sebelum 12 September:</span>
                </h5>
                <ol className="text-xs text-purple-900/90 space-y-2.5 list-decimal pl-4">
                  <li>
                    <strong>Kompresi WebP Hemat 90% (Sudah Aktif):</strong>
                    <br />
                    Mulai sekarang, seluruh foto baru yang diunggah siswa otomatis dikompresi menjadi format WebP 720px (~30 KB), bukan JPEG 400 KB lagi.
                  </li>
                  <li>
                    <strong>Gunakan Google Drive untuk Foto Selanjutnya (Tab "Integrasi Google Drive"):</strong>
                    <br />
                    Hubungkan akun Google sekolah Anda (100% gratis). Foto baru akan langsung tersimpan di Google Drive dan dimuat dari CDN Google, sehingga Supabase Egress & Storage menjadi 0 Byte!
                  </li>
                  <li>
                    <strong>Unduh Backup ZIP lalu Bersihkan Foto Lama (Tab "Unduh Backup ZIP" & "Bersihkan Foto Server"):</strong>
                    <br />
                    Unduh file backup ZIP ke laptop Anda, kemudian hapus foto fisik yang berumur lebih dari 7 atau 14 hari di Supabase. Catatan kebiasaan dan poin murid tetap aman 100%!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: UNDUH BACKUP ZIP */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-extrabold text-base text-slate-800">
                  Cadangkan Seluruh Foto Murid ke File ZIP
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Foto akan diunduh dan dikemas rapi ke dalam folder: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">[Kelas]/[Nama_Siswa]/[Tanggal]_[Kebiasaan].jpg</code> lengkap dengan manifest metadata.
                </p>
              </div>

              {/* Filter Opsi Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Filter Rentang Waktu:
                  </label>
                  <select
                    value={backupDateFilter}
                    onChange={(e) => setBackupDateFilter(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="all">Semua Waktu (Semua Foto Tersedia)</option>
                    <option value="month">Bulan Ini Saja</option>
                    <option value="custom">Rentang Tanggal Kustom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Filter Kelas:
                  </label>
                  <select
                    value={backupKelasFilter}
                    onChange={(e) => setBackupKelasFilter(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="all">Semua Kelas ({kelasList.length} Kelas)</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kelas {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                {backupDateFilter === 'custom' && (
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Dari Tanggal:
                      </label>
                      <input
                        type="date"
                        value={backupStartDate}
                        onChange={(e) => setBackupStartDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Sampai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={backupEndDate}
                        onChange={(e) => setBackupEndDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar Backup */}
              {backupProgress && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-purple-950">
                    <span>{backupProgress.message}</span>
                    <span>
                      {backupProgress.current} / {backupProgress.total} (
                      {Math.round((backupProgress.current / (backupProgress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all duration-200"
                      style={{
                        width: `${Math.round((backupProgress.current / (backupProgress.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleStartBackup}
                disabled={isBackingUp || validPhotoEntries.length === 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <DownloadCloud className="w-5 h-5" />
                <span>
                  {isBackingUp ? 'Sedang Memproses Arsip ZIP...' : 'Mulai Buat & Unduh File Backup ZIP'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: BERSIHKAN FOTO SERVER */}
          {activeTab === 'clean' && (
            <div className="space-y-5">
              <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 text-rose-900">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-rose-950">
                      Pembersihan Aman File Fisik Storage Supabase
                    </h5>
                    <p className="text-xs text-rose-800/90 mt-1 leading-relaxed">
                      Fitur ini menghapus berkas gambar berukuran besar dari bucket <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">bukti_foto</code> untuk mengosongkan <strong>0,54 GB storage</strong> dan <strong>menghentikan konsumsi egress</strong>.
                      <br />
                      <strong>Data catatan jurnal, status waktu, dan poin kebiasaan siswa 100% AMAN (tidak akan dihapus)</strong>. Tautan foto diubah menjadi status <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">[TERARSIP]</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pilihan Kriteria Pembersihan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Batas Waktu Foto yang Dihapus:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCleanCriteria('7days')}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between cursor-pointer ${
                      cleanCriteria === '7days'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Foto lebih lama dari 7 hari</span>
                    <span className="text-[10px] opacity-80">Rekomendasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanCriteria('14days')}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between cursor-pointer ${
                      cleanCriteria === '14days'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Foto lebih lama dari 14 hari</span>
                    <span className="text-[10px] opacity-80">Aman</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanCriteria('30days')}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between cursor-pointer ${
                      cleanCriteria === '30days'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Foto lebih lama dari 30 hari</span>
                    <span className="text-[10px] opacity-80">1 Bulan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanCriteria('custom')}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between cursor-pointer ${
                      cleanCriteria === 'custom'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pilih Tanggal Batas Khusus</span>
                    <span className="text-[10px] opacity-80">Kustom</span>
                  </button>
                </div>

                {cleanCriteria === 'custom' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Hapus semua foto pada atau sebelum tanggal:
                    </label>
                    <input
                      type="date"
                      value={cleanCustomDate}
                      onChange={(e) => setCleanCustomDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Indikator Jumlah Berkas yang Terpengaruh */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-800 block">Batas Tanggal Pembersihan: <strong>{cleanTargetDate}</strong></span>
                  <span className="text-amber-950 font-bold text-sm">
                    {photosEligibleForClean.length} file foto siap dibersihkan dari server
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-700 block">Perkiraan Kuota Dihemat</span>
                  <span className="font-extrabold text-amber-900 text-sm">
                    ~{(photosEligibleForClean.length * 0.35).toFixed(1)} MB
                  </span>
                </div>
              </div>

              {/* Checkbox Konfirmasi Keamanan */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="confirmBackupDone"
                  checked={cleanConfirmed}
                  onChange={(e) => setCleanConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="confirmBackupDone" className="text-xs text-slate-700 cursor-pointer select-none">
                  <strong>Saya mengonfirmasi telah mengunduh cadangan file ZIP</strong> di tab "Unduh Backup ZIP" dan menyetujui penghapusan file fisik foto dari server cloud.
                </label>
              </div>

              {/* Progress Bar Pembersihan */}
              {cleanProgress && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-rose-950">
                    <span>{cleanProgress.message}</span>
                    <span>
                      {cleanProgress.current} / {cleanProgress.total} (
                      {Math.round((cleanProgress.current / (cleanProgress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-rose-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full transition-all duration-200"
                      style={{
                        width: `${Math.round((cleanProgress.current / (cleanProgress.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Notifikasi Hasil Bersih */}
              {cleanResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block font-bold">Pembersihan Selesai!</strong>
                    <span>
                      {cleanResult.deleted} file storage dihapus dan {cleanResult.updated} entri jurnal diperbarui menjadi status arsip.
                    </span>
                  </div>
                </div>
              )}

              {/* Tombol Hapus */}
              <button
                onClick={handleCleanStorage}
                disabled={isCleaning || photosEligibleForClean.length === 0 || !cleanConfirmed}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Trash2 className="w-5 h-5" />
                <span>
                  {isCleaning ? 'Sedang Membersihkan Storage...' : `Bersihkan ${photosEligibleForClean.length} Foto dari Supabase Storage`}
                </span>
              </button>
            </div>
          )}

          {/* TAB 4: RESTORE DARI ZIP */}
          {activeTab === 'restore' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-extrabold text-base text-slate-800">
                  Pulihkan Foto dari File Backup ZIP
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.zip</code> hasil backup sebelumnya. Sistem akan membaca file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">manifest_backup.json</code> di dalamnya dan mengunggah ulang foto ke server.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-400 bg-slate-50 text-center space-y-3 transition">
                <FolderArchive className="w-10 h-10 text-purple-600 mx-auto" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Pilih Berkas Backup .ZIP
                  </span>
                  <span className="text-[11px] text-slate-400">
                    File yang dihasilkan dari menu "Unduh Backup ZIP"
                  </span>
                </div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />

              </div>

              {/* Progress Restore */}
              {restoreProgress && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-purple-950">
                    <span>{restoreProgress.message}</span>
                    <span>
                      {restoreProgress.current} / {restoreProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all duration-200"
                      style={{
                        width: `${Math.round((restoreProgress.current / (restoreProgress.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Hasil Restore */}
              {restoreResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <strong className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Pemulihan Selesai
                  </strong>

                  <p>
                    Berhasil memulihkan {restoreResult.restoredCount} dari {restoreResult.totalCount} foto.
                  </p>
                  {restoreResult.errors.length > 0 && (
                    <div className="mt-2 text-rose-700 bg-rose-50 p-2 rounded-lg text-[11px]">
                      <strong>Catatan kegagalan:</strong>
                      <ul className="list-disc pl-4 mt-1">
                        {restoreResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleStartRestore}
                disabled={isRestoring || !restoreFile}
                className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-5 h-5" />
                <span>
                  {isRestoring ? 'Sedang Merestore Foto...' : 'Mulai Pulihkan Foto ke Server'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 5: INTEGRASI GOOGLE DRIVE */}
          {activeTab === 'gdrive' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <span>Penyimpanan Foto di Google Drive (100% Bebas Kuota Supabase)</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    Sangat Direkomendasikan
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dengan menghubungkan Google Drive sekolah (kapasitas 15 GB gratis atau kapasitas besar pada akun sekolah <code>@guru.smp.belajar.id</code>), seluruh foto murid akan tersimpan di Google Drive dan dimuat dari CDN Google. Supabase Anda tidak akan pernah kehabisan kuota Egress lagi!
                </p>
              </div>

              {/* Pilihan Provider Aktif */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Provider Penyimpanan Aktif:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedProvider('gdrive')}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedProvider === 'gdrive'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      checked={selectedProvider === 'gdrive'}
                      onChange={() => setSelectedProvider('gdrive')}
                      className="mt-1 text-emerald-600"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Google Drive (via Apps Script)
                      </strong>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Gratis 15 GB / Unlimited Belajar.id • Egress Supabase 0%
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedProvider('supabase')}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedProvider === 'supabase'
                        ? 'bg-purple-50 border-purple-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      checked={selectedProvider === 'supabase'}
                      onChange={() => setSelectedProvider('supabase')}
                      className="mt-1 text-purple-600"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Supabase Storage (Bawaan)
                      </strong>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Batas Egress 5 GB / bulan • Batas Storage 1 GB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form URL Web App Google Apps Script */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    URL Web App Google Apps Script:
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={gdriveInputUrl}
                    onChange={(e) => setGdriveInputUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dapatkan URL ini setelah Anda men-deploy skrip Google Apps Script (ikuti panduan di bawah).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !gdriveInputUrl}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTesting ? 'Menguji...' : 'Uji Coba Koneksi'}</span>
                  </button>

                  <button
                    onClick={handleSaveStorageSettings}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pengaturan Provider</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                      testResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <strong className="block font-bold">{testResult.message}</strong>
                        {testResult.suggestion && (
                          <div className="mt-1 text-[11px] opacity-90 whitespace-pre-line bg-white/70 p-2.5 rounded-lg border border-rose-200/60 text-slate-800">
                            <strong>💡 Saran Solusi:</strong>
                            <div className="mt-0.5">{testResult.suggestion}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Panduan Langkah demi Langkah Google Apps Script */}
              <div className="p-5 rounded-3xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Panduan Setup Google Apps Script (Hanya 2 Menit):</span>
                  </h5>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopiedCode ? 'Tersalin!' : 'Salin Kode Skrip'}</span>
                  </button>
                </div>

                <ol className="text-xs text-emerald-900/90 space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>
                    Buka{' '}
                    <a
                      href="https://script.google.com/home/start"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5"
                    >
                      script.google.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    dengan akun Google sekolah Anda (misal akun <code>@guru.smp.belajar.id</code>).
                  </li>
                  <li>
                    Klik tombol <strong>"New Project"</strong> (Proyek Baru) di pojok kiri atas.
                  </li>
                  <li>
                    Hapus semua kode bawaan di editor, lalu klik tombol <strong>"Salin Kode Skrip"</strong> di atas dan tempel (Paste) ke editor tersebut.
                  </li>
                  <li>
                    Klik tombol <strong>Deploy</strong> (Terapkan) di kanan atas &rarr; pilih <strong>"New deployment"</strong> (Penerapan baru).
                  </li>
                  <li>
                    Pilih tipe gear (roda gigi) &rarr; pilih <strong>"Web app"</strong>.
                  </li>
                  <li>
                    Pada bagian <em>Execute as</em> pilih <strong>"Me"</strong> (Saya).
                    <br />
                    Pada bagian <em>Who has access</em> pilih <strong>"Anyone"</strong> (Siapa saja). <em>(Sangat penting agar siswa dapat mengunggah foto tanpa perlu login Google)</em>.
                  </li>
                  <li>
                    Klik <strong>Deploy</strong> &rarr; Izinkan Akses Google Drive &rarr; Salin <strong>Web App URL</strong> yang dihasilkan &rarr; Tempel pada kolom URL di atas, lalu klik <strong>Uji Coba Koneksi</strong> dan <strong>Simpan</strong>!
                  </li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>

      </div>
    </div>
  );
};
