import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  UploadCloud, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  Sparkles,
  Phone,
  Mail,
  Globe,
  MapPin,
  Award,
  Calendar,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { useSchoolProfile } from '../../context/SchoolProfileContext';
import { SchoolProfile, DEFAULT_SCHOOL_PROFILE } from '../../lib/schoolProfile';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface EditSchoolProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditSchoolProfileModal: React.FC<EditSchoolProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { profile, updateProfile, resetProfile } = useSchoolProfile();

  const [activeSubTab, setActiveSubTab] = useState<'identitas' | 'logo' | 'kontak' | 'pimpinan'>('identitas');

  // Form State
  const [nama, setNama] = useState(profile.nama);
  const [jenjang, setJenjang] = useState(profile.jenjang);
  const [npsn, setNpsn] = useState(profile.npsn);
  const [status, setStatus] = useState(profile.status);
  const [akreditasi, setAkreditasi] = useState(profile.akreditasi);
  const [tahunAjaran, setTahunAjaran] = useState(profile.tahunAjaran);
  
  // Logo & Motto
  const [motto, setMotto] = useState(profile.motto || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [logoKabupatenUrl, setLogoKabupatenUrl] = useState(profile.logoKabupatenUrl || '');

  // Kontak & Alamat
  const [alamat, setAlamat] = useState(profile.alamat);
  const [kabupaten, setKabupaten] = useState(profile.kabupaten);
  const [provinsi, setProvinsi] = useState(profile.provinsi);
  const [telepon, setTelepon] = useState(profile.telepon || '');
  const [email, setEmail] = useState(profile.email || '');
  const [website, setWebsite] = useState(profile.website || '');

  // Pimpinan
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState(profile.namaKepalaSekolah || '');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState(profile.nipKepalaSekolah || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNama(profile.nama);
      setJenjang(profile.jenjang);
      setNpsn(profile.npsn);
      setStatus(profile.status);
      setAkreditasi(profile.akreditasi);
      setTahunAjaran(profile.tahunAjaran);
      setMotto(profile.motto || '');
      setLogoUrl(profile.logoUrl || '');
      setLogoKabupatenUrl(profile.logoKabupatenUrl || '');
      setAlamat(profile.alamat);
      setKabupaten(profile.kabupaten);
      setProvinsi(profile.provinsi);
      setTelepon(profile.telepon || '');
      setEmail(profile.email || '');
      setWebsite(profile.website || '');
      setNamaKepalaSekolah(profile.namaKepalaSekolah || '');
      setNipKepalaSekolah(profile.nipKepalaSekolah || '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Helper untuk membaca upload file gambar dan kompresi ringan base64
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap unggah file format gambar (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 3 MB.');
      return;
    }

    // Coba upload langsung ke Supabase Storage agar URL cloud permanen bisa diakses semua browser
    if (isSupabaseConfigured) {
      const ext = file.name.split('.').pop() || 'png';
      const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
      const storagePath = `logos/logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${cleanExt}`;

      supabase.storage
        .from('bukti_foto')
        .upload(storagePath, file, { upsert: true, cacheControl: '31536000' })
        .then(({ data: uploadData, error: uploadErr }) => {
          if (uploadData && !uploadErr) {
            const { data: urlData } = supabase.storage.from('bukti_foto').getPublicUrl(storagePath);
            if (urlData?.publicUrl) {
              setter(urlData.publicUrl);
              setErrorMessage(null);
              return;
            }
          }
          // Fallback base64 jika gagal
          const reader = new FileReader();
          reader.onload = (event) => {
            setter(event.target?.result as string);
            setErrorMessage(null);
          };
          reader.readAsDataURL(file);
        })
        .catch(() => {
          const reader = new FileReader();
          reader.onload = (event) => {
            setter(event.target?.result as string);
            setErrorMessage(null);
          };
          reader.readAsDataURL(file);
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMessage('Nama sekolah tidak boleh kosong!');
      return;
    }
    if (!npsn.trim()) {
      setErrorMessage('NPSN tidak boleh kosong!');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateProfile({
        nama: nama.trim(),
        jenjang: jenjang.trim(),
        npsn: npsn.trim(),
        status: status.trim(),
        akreditasi: akreditasi.trim(),
        tahunAjaran: tahunAjaran.trim(),
        motto: motto.trim(),
        logoUrl: logoUrl.trim() || DEFAULT_SCHOOL_PROFILE.logoUrl,
        logoKabupatenUrl: logoKabupatenUrl.trim() || DEFAULT_SCHOOL_PROFILE.logoKabupatenUrl,
        alamat: alamat.trim(),
        kabupaten: kabupaten.trim(),
        provinsi: provinsi.trim(),
        telepon: telepon.trim(),
        email: email.trim(),
        website: website.trim(),
        namaKepalaSekolah: namaKepalaSekolah.trim(),
        nipKepalaSekolah: nipKepalaSekolah.trim()
      });

      setSuccessMessage('Profil & Logo Sekolah berhasil diperbarui! Tampilan halaman otomatis menyesuaikan.');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan profil: ' + err.message);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan profil ke bawaan SMPN 2 Glagah?')) {
      setIsSaving(true);
      await resetProfile();
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Kustomisasi Profil & Logo Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Ubah identitas, logo resmi, motto, dan alamat untuk personalisasi aplikasi sekolah Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('identitas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'identitas'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Identitas Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('logo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'logo'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Logo & Motto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('kontak')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'kontak'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>3. Kontak & Alamat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pimpinan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'pimpinan'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>4. Kepala Sekolah</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: IDENTITAS */}
          {activeSubTab === 'identitas' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Satuan Pendidikan / Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: SMP Negeri 2 Glagah / SMPN 1 Giri"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 text-sm"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Nama ini akan tampil di judul navbar, header login, piagam penghargaan, dan rapor karakter.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NPSN Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={npsn}
                    onChange={(e) => setNpsn(e.target.value)}
                    placeholder="Contoh: 20525649"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold text-purple-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold bg-white"
                  >
                    <option value="SD">SD / MI (Sekolah Dasar)</option>
                    <option value="SMP">SMP / MTs (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA / MA (Sekolah Menengah Atas)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Sekolah
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold bg-white"
                  >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Akreditasi
                  </label>
                  <select
                    value={akreditasi}
                    onChange={(e) => setAkreditasi(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold bg-white"
                  >
                    <option value="A">Terakreditasi A (Unggul)</option>
                    <option value="B">Terakreditasi B (Baik)</option>
                    <option value="C">Terakreditasi C (Cukup)</option>
                    <option value="-">Belum Terakreditasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tahun Ajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    placeholder="2026/2027"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & MOTTO */}
          {activeSubTab === 'logo' && (
            <div className="space-y-5 animate-fade-in">
              {/* Motto / Slogan Sekolah */}
              <div>
                <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Motto / Slogan Sekolah</span>
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Contoh: Berakhlak Mulia, Berprestasi, dan Berkarakter Luhur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Logo Sekolah */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Logo Resmi Sekolah</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLogoUrl(DEFAULT_SCHOOL_PROFILE.logoUrl || '')}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-bold"
                  >
                    Gunakan Logo Bawaan
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Preview Logo Sekolah" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold text-center">No Logo</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Gambar Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setLogoUrl)}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Atau tempel URL gambar logo di sini..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Kabupaten / Pemda */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Logo Daerah / Kabupaten (Kop Surat & Login)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLogoKabupatenUrl(DEFAULT_SCHOOL_PROFILE.logoKabupatenUrl || '')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold"
                  >
                    Gunakan Logo Bawaan
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {logoKabupatenUrl ? (
                      <img src={logoKabupatenUrl} alt="Preview Logo Pemda" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold text-center">No Logo</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Gambar Daerah</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setLogoKabupatenUrl)}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={logoKabupatenUrl}
                      onChange={(e) => setLogoKabupatenUrl(e.target.value)}
                      placeholder="Atau tempel URL logo daerah di sini..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KONTAK & ALAMAT */}
          {activeSubTab === 'kontak' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Lengkap Sekolah
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Kenjo No.45, Glagah, Banyuwangi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    placeholder="Contoh: Kabupaten Banyuwangi"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    placeholder="Contoh: Jawa Timur"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. Telepon / WA</span>
                  </label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="(0333) 421xxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email Resmi</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sekolah@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Website Sekolah</span>
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KEPALA SEKOLAH */}
          {activeSubTab === 'pimpinan' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Data Kepala Sekolah ini akan otomatis tercantum pada lembar tanda tangan <strong>Rapor Karakter 7KAIH</strong> dan <strong>Piagam Penghargaan Resmi Juara</strong>.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kepala Sekolah (Lengkap dengan Gelar)
                </label>
                <input
                  type="text"
                  value={namaKepalaSekolah}
                  onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                  placeholder="Contoh: Drs. Bambang Sudarmono, M.Pd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIP / NIK Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={nipKepalaSekolah}
                  onChange={(e) => setNipKepalaSekolah(e.target.value)}
                  placeholder="Contoh: 197201011998031002"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center gap-1.5"
              title="Kembalikan ke profil bawaan SMPN 2 Glagah"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Profil Sekolah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
