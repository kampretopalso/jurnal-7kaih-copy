import { 
  Kebiasaan, 
  Kelas, 
  Siswa, 
  StafSekolah, 
  EntriJurnal, 
  Feedback, 
  ArahanWaliKelas, 
  LogHapus,
  SuaraSiswa,
  KategoriSuara,
  PesanKomunikasi
} from '../types/database';
import { 
  INITIAL_KEBIASAAN, 
  INITIAL_KELAS, 
  INITIAL_SISWA_7A, 
  ALL_INITIAL_SISWA,
  INITIAL_STAF, 
  INITIAL_ENTRI, 
  INITIAL_FEEDBACK, 
  INITIAL_ARAHAN 
} from './mockData';

const STORAGE_KEYS = {
  KEBIASAAN: 'jurnal_7k_kebiasaan',
  KELAS: 'jurnal_7k_kelas',
  SISWA: 'jurnal_7k_siswa',
  STAF: 'jurnal_7k_staf',
  ENTRI: 'jurnal_7k_entri',
  FEEDBACK: 'jurnal_7k_feedback',
  ARAHAN: 'jurnal_7k_arahan',
  LOG_HAPUS: 'jurnal_7k_log_hapus',
  SUARA_SISWA: 'jurnal_7k_suara_siswa',
  PESAN_KOMUNIKASI: 'jurnal_7k_pesan_komunikasi'
};

const INITIAL_SUARA_SISWA: SuaraSiswa[] = [];

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export class MockDatabase {
  static getKebiasaan(): Kebiasaan[] {
    return getStored<Kebiasaan[]>(STORAGE_KEYS.KEBIASAAN, INITIAL_KEBIASAAN);
  }

  static getKelas(): Kelas[] {
    return getStored<Kelas[]>(STORAGE_KEYS.KELAS, INITIAL_KELAS);
  }

  static getSiswa(): Siswa[] {
    return getStored<Siswa[]>(STORAGE_KEYS.SISWA, ALL_INITIAL_SISWA);
  }

  static getStaf(): StafSekolah[] {
    return getStored<StafSekolah[]>(STORAGE_KEYS.STAF, INITIAL_STAF);
  }

  static getEntriJurnal(): EntriJurnal[] {
    return getStored<EntriJurnal[]>(STORAGE_KEYS.ENTRI, INITIAL_ENTRI);
  }

  static getFeedback(): Feedback[] {
    return getStored<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
  }

  static getArahanWaliKelas(): ArahanWaliKelas[] {
    return getStored<ArahanWaliKelas[]>(STORAGE_KEYS.ARAHAN, INITIAL_ARAHAN);
  }

  static getLogHapus(): LogHapus[] {
    return getStored<LogHapus[]>(STORAGE_KEYS.LOG_HAPUS, []);
  }

  static getSuaraSiswa(): SuaraSiswa[] {
    const items = getStored<SuaraSiswa[]>(STORAGE_KEYS.SUARA_SISWA, INITIAL_SUARA_SISWA);
    // Bersihkan data dummy masa lalu jika ada
    const cleanItems = items.filter(s => s.id !== 'suara-1' && s.siswa_id !== 's-01');
    if (cleanItems.length !== items.length) {
      setStored(STORAGE_KEYS.SUARA_SISWA, cleanItems);
    }
    return cleanItems;
  }

  // Cloud Sync Helpers
  static syncSuaraSiswaFromRemote(remoteList: SuaraSiswa[]): void {
    if (Array.isArray(remoteList)) {
      setStored(STORAGE_KEYS.SUARA_SISWA, remoteList);
    }
  }
  static syncSiswaFromRemote(remoteList: Siswa[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.SISWA, remoteList);
    }
  }

  static syncStafFromRemote(remoteList: StafSekolah[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.STAF, remoteList);
    }
  }

  static syncKelasFromRemote(remoteList: Kelas[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.KELAS, remoteList);
    }
  }

  static syncKebiasaanFromRemote(remoteList: Kebiasaan[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.KEBIASAAN, remoteList);
    }
  }

  static syncEntriFromRemote(remoteList: EntriJurnal[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.ENTRI, remoteList);
    }
  }

  static syncArahanFromRemote(remoteList: ArahanWaliKelas[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.ARAHAN, remoteList);
    }
  }

  static syncFeedbackFromRemote(remoteList: Feedback[]): void {
    if (remoteList && remoteList.length > 0) {
      setStored(STORAGE_KEYS.FEEDBACK, remoteList);
    }
  }

  static addEntriJurnal(entryData: Omit<EntriJurnal, 'id' | 'waktu_submit'>): EntriJurnal {
    const current = this.getEntriJurnal();
    const entry: EntriJurnal = {
      ...entryData,
      id: 'entri-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      waktu_submit: new Date().toISOString()
    };

    const existingIndex = current.findIndex(
      (e) =>
        e.siswa_id === entry.siswa_id &&
        e.tanggal === entry.tanggal &&
        e.kebiasaan_id === entry.kebiasaan_id &&
        e.urutan_ke === entry.urutan_ke
    );

    let updated: EntriJurnal[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = entry;
    } else {
      updated = [entry, ...current];
    }

    setStored(STORAGE_KEYS.ENTRI, updated);
    return entry;
  }

  static deleteEntriJurnal(entriId: string, stafId: string, alasan: string): boolean {
    const currentEntries = this.getEntriJurnal();
    const target = currentEntries.find((e) => e.id === entriId);
    if (!target) return false;

    const log: LogHapus = {
      id: 'log-' + Date.now(),
      entri_id: entriId,
      data_terhapus: target,
      dihapus_oleh: stafId,
      alasan: alasan,
      waktu: new Date().toISOString()
    };

    const currentLogs = this.getLogHapus();
    setStored(STORAGE_KEYS.LOG_HAPUS, [log, ...currentLogs]);

    const remaining = currentEntries.filter((e) => e.id !== entriId);
    setStored(STORAGE_KEYS.ENTRI, remaining);

    return true;
  }

  static addFeedback(stafId: string, siswaId: string, entriId: string | null, komentar: string): Feedback {
    const current = this.getFeedback();
    const newFb: Feedback = {
      id: 'fb-' + Date.now(),
      staf_id: stafId,
      siswa_id: siswaId,
      entri_id: entriId,
      komentar,
      created_at: new Date().toISOString()
    };

    setStored(STORAGE_KEYS.FEEDBACK, [newFb, ...current]);
    return newFb;
  }

  static addArahanWaliKelas(
    stafPengirimId: string, 
    kelasId: string, 
    kategori: 'apresiasi' | 'evaluasi' | 'instruksi' | 'tindak_lanjut',
    judul: string,
    pesan: string
  ): ArahanWaliKelas {
    const current = this.getArahanWaliKelas();
    const newArahan: ArahanWaliKelas = {
      id: 'arahan-' + Date.now(),
      staf_pengirim_id: stafPengirimId,
      kelas_id: kelasId,
      kategori,
      judul,
      pesan,
      created_at: new Date().toISOString(),
      dibaca: false
    };

    setStored(STORAGE_KEYS.ARAHAN, [newArahan, ...current]);
    return newArahan;
  }

  static markArahanRead(arahanId: string): void {
    const current = this.getArahanWaliKelas();
    const updated = current.map(a => a.id === arahanId ? { ...a, dibaca: true } : a);
    setStored(STORAGE_KEYS.ARAHAN, updated);
  }

  static deleteArahan(arahanId: string): void {
    const current = this.getArahanWaliKelas();
    const updated = current.filter(a => a.id !== arahanId);
    setStored(STORAGE_KEYS.ARAHAN, updated);
  }

  static addSuaraSiswa(
    siswaId: string,
    kelasId: string,
    kategori: KategoriSuara,
    judul: string,
    isi: string
  ): SuaraSiswa {
    const current = this.getSuaraSiswa();
    const newSuara: SuaraSiswa = {
      id: 'suara-' + Date.now(),
      siswa_id: siswaId,
      kelas_id: kelasId,
      kategori,
      judul,
      isi,
      tanggal: new Date().toISOString().split('T')[0],
      tanggapan: null,
      tanggapan_oleh_staf_id: null,
      tanggapan_at: null,
      created_at: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.SUARA_SISWA, [newSuara, ...current]);
    return newSuara;
  }

  static tanggapiSuaraSiswa(suaraId: string, stafId: string, tanggapan: string): boolean {
    const current = this.getSuaraSiswa();
    const idx = current.findIndex(s => s.id === suaraId);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        tanggapan,
        tanggapan_oleh_staf_id: stafId,
        tanggapan_at: new Date().toISOString()
      };
      setStored(STORAGE_KEYS.SUARA_SISWA, current);
      return true;
    }
    return false;
  }

  static deleteSuaraSiswa(suaraId: string): boolean {
    const current = this.getSuaraSiswa();
    const filtered = current.filter(s => s.id !== suaraId);
    setStored(STORAGE_KEYS.SUARA_SISWA, filtered);
    return true;
  }

  static getPesanKomunikasi(): PesanKomunikasi[] {
    return getStored<PesanKomunikasi[]>(STORAGE_KEYS.PESAN_KOMUNIKASI, []);
  }

  static kirimPesanKomunikasi(pesan: Omit<PesanKomunikasi, 'id' | 'created_at' | 'sudah_dibaca'>): PesanKomunikasi {
    const current = this.getPesanKomunikasi();
    const newPesan: PesanKomunikasi = {
      ...pesan,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sudah_dibaca: false,
      created_at: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.PESAN_KOMUNIKASI, [newPesan, ...current]);
    return newPesan;
  }

  static tandaiPesanDibaca(pesanId: string): boolean {
    const current = this.getPesanKomunikasi();
    const idx = current.findIndex(p => p.id === pesanId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], sudah_dibaca: true };
      setStored(STORAGE_KEYS.PESAN_KOMUNIKASI, current);
      return true;
    }
    return false;
  }

  static deletePesanKomunikasi(pesanId: string): boolean {
    const current = this.getPesanKomunikasi();
    const filtered = current.filter(p => p.id !== pesanId);
    setStored(STORAGE_KEYS.PESAN_KOMUNIKASI, filtered);
    return true;
  }

  static addSiswa(data: {
    id?: string;
    nisn: string;
    nama: string;
    kelas_id: string;
    tanggal_lahir: string;
    sudah_ganti_password?: boolean;
  }): Siswa {
    const allSiswa = this.getSiswa();
    const newId = data.id || `siswa-${Date.now()}`;
    const newStudent: Siswa = {
      id: newId,
      nisn: data.nisn,
      nama: data.nama,
      kelas_id: data.kelas_id,
      tanggal_lahir: data.tanggal_lahir,
      sudah_ganti_password: data.sudah_ganti_password || false
    };
    setStored(STORAGE_KEYS.SISWA, [newStudent, ...allSiswa]);
    return newStudent;
  }

  static deleteSiswa(siswaId: string): boolean {
    const allSiswa = this.getSiswa();
    const filtered = allSiswa.filter((s) => s.id !== siswaId);
    setStored(STORAGE_KEYS.SISWA, filtered);

    const allEntries = this.getEntriJurnal();
    setStored(STORAGE_KEYS.ENTRI, allEntries.filter((e) => e.siswa_id !== siswaId));

    const allFeedback = this.getFeedback();
    setStored(STORAGE_KEYS.FEEDBACK, allFeedback.filter((f) => f.siswa_id !== siswaId));

    const allSuara = this.getSuaraSiswa();
    setStored(STORAGE_KEYS.SUARA_SISWA, allSuara.filter((s) => s.siswa_id !== siswaId));

    return true;
  }

  static updatePassword(type: 'siswa' | 'staf', id: string): boolean {
    if (type === 'siswa') {
      const allSiswa = this.getSiswa();
      const idx = allSiswa.findIndex((s) => s.id === id);
      if (idx >= 0) {
        allSiswa[idx].sudah_ganti_password = true;
        setStored(STORAGE_KEYS.SISWA, allSiswa);
        return true;
      }
    } else {
      const allStaf = this.getStaf();
      const idx = allStaf.findIndex((s) => s.id === id);
      if (idx >= 0) {
        allStaf[idx].sudah_ganti_password = true;
        setStored(STORAGE_KEYS.STAF, allStaf);
        return true;
      }
    }
    return false;
  }

  static updateKebiasaan(updated: Kebiasaan | Kebiasaan[]): void {
    if (Array.isArray(updated)) {
      setStored(STORAGE_KEYS.KEBIASAAN, updated);
    } else {
      const current = this.getKebiasaan();
      const idx = current.findIndex(k => k.id === updated.id);
      if (idx >= 0) {
        current[idx] = updated;
        setStored(STORAGE_KEYS.KEBIASAAN, current);
      }
    }
  }

  static importSiswa(newStudents: Siswa[], replaceAll: boolean = false): void {
    if (replaceAll) {
      setStored(STORAGE_KEYS.SISWA, newStudents);
    } else {
      const current = this.getSiswa();
      const merged = [...current];
      newStudents.forEach((ns) => {
        const existIdx = merged.findIndex((s) => s.nisn === ns.nisn);
        if (existIdx >= 0) {
          merged[existIdx] = ns;
        } else {
          merged.push(ns);
        }
      });
      setStored(STORAGE_KEYS.SISWA, merged);
    }
  }

  static ensureKelasExist(kelasNames: string[]): Kelas[] {
    const current = this.getKelas();
    const existingMap = new Map(current.map((k) => [k.nama_kelas.toUpperCase().trim(), k]));
    const toAdd: Kelas[] = [];

    kelasNames.forEach((name) => {
      const clean = name.toUpperCase().trim();
      if (clean && !existingMap.has(clean)) {
        const numMatch = clean.match(/\d+/);
        const tingkat = numMatch ? Math.min(Math.max(parseInt(numMatch[0], 10), 1), 12) : 7;
        const newK: Kelas = {
          id: `k-${clean.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          nama_kelas: clean,
          tingkat
        };
        existingMap.set(clean, newK);
        toAdd.push(newK);
      }
    });

    if (toAdd.length > 0) {
      const updated = [...current, ...toAdd];
      setStored(STORAGE_KEYS.KELAS, updated);
      return updated;
    }
    return current;
  }

  static cleanupUnusedKelas(activeClassNames: string[]): void {
    const current = this.getKelas();
    const activeSet = new Set(activeClassNames.map((n) => n.toUpperCase().trim()));
    const filtered = current.filter((k) => activeSet.has(k.nama_kelas.toUpperCase().trim()));
    if (filtered.length > 0) {
      setStored(STORAGE_KEYS.KELAS, filtered);
    }
  }

  static importStaf(newStaff: StafSekolah[], replaceAll: boolean = false): void {
    if (replaceAll) {
      const current = this.getStaf();
      const superadmin = current.find((s) => s.role === 'superadmin');
      const staffList = superadmin && !newStaff.some(s => s.role === 'superadmin') 
        ? [superadmin, ...newStaff] 
        : newStaff;
      setStored(STORAGE_KEYS.STAF, staffList);
    } else {
      const current = this.getStaf();
      const merged = [...current];
      newStaff.forEach((ns) => {
        const existIdx = merged.findIndex((s) => s.nip_atau_nik === ns.nip_atau_nik);
        if (existIdx >= 0) {
          merged[existIdx] = ns;
        } else {
          merged.push(ns);
        }
      });
      setStored(STORAGE_KEYS.STAF, merged);
    }
  }

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.KEBIASAAN, JSON.stringify(INITIAL_KEBIASAAN));
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(INITIAL_KELAS));
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(ALL_INITIAL_SISWA));
    localStorage.setItem(STORAGE_KEYS.STAF, JSON.stringify(INITIAL_STAF));
    localStorage.setItem(STORAGE_KEYS.ENTRI, JSON.stringify(INITIAL_ENTRI));
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(INITIAL_FEEDBACK));
    localStorage.setItem(STORAGE_KEYS.ARAHAN, JSON.stringify(INITIAL_ARAHAN));
    localStorage.setItem(STORAGE_KEYS.LOG_HAPUS, JSON.stringify([]));
  }
}
