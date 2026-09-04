import { isSupabaseConfigured, supabase } from './supabase';
import { MockDatabase } from './mockStore';
import { fetchRemoteStorageConfig } from './storageConfig';
import { 
  ArahanWaliKelas, 
  EntriJurnal, 
  Feedback, 
  Kebiasaan, 
  Kelas, 
  LogHapus, 
  Siswa, 
  StafSekolah, 
  SuaraSiswa, 
  KategoriSuara, 
  KategoriArahan,
  PesanKomunikasi,
  TanggapanSuaraItem
} from '../types/database';

export class JournalService {
  // Cache in-memory dengan TTL 3 menit untuk memangkas Egress Supabase
  private static entriCache: Map<string, { data: EntriJurnal[]; timestamp: number }> = new Map();
  private static siswaCache: Map<string, { data: Siswa[]; timestamp: number }> = new Map();
  private static readonly CACHE_TTL_MS = 3 * 60 * 1000; // 3 menit

  static clearEntriCache(): void {
    JournalService.entriCache.clear();
  }

  static clearSiswaCache(): void {
    JournalService.siswaCache.clear();
  }

  /**
   * Melakukan inisialisasi sinkronisasi dari Supabase Cloud ke Local Cache
   * Optimasi Egress: Hanya ambil master metadata (kebiasaan, kelas, staf)
   * dan hanya dijalankan 1 kali per tab browser session.
   * Entri jurnal TIDAK diambil di sini karena berukuran megabytes dan hanya dimuat sesuai kebutuhan user/role.
   */
  static async initCloudSync(): Promise<void> {
    if (!isSupabaseConfigured) return;
    
    // Cek sessionStorage agar tidak re-fetch metadata setiap refresh sub-halaman
    const isAlreadySynced = sessionStorage.getItem('jurnal_baseline_synced') === 'true';
    if (isAlreadySynced) return;

    try {
      const [kebRes, kelasRes, stafRes] = await Promise.all([
        supabase.from('kebiasaan').select('*').order('urutan', { ascending: true }),
        supabase.from('kelas').select('*').order('nama_kelas', { ascending: true }),
        supabase.from('staf_sekolah').select('*').order('nama', { ascending: true }).limit(500),
        fetchRemoteStorageConfig().catch(() => null)
      ]);

      if (kebRes.data && kebRes.data.length > 0) {
        MockDatabase.syncKebiasaanFromRemote(kebRes.data as Kebiasaan[]);
      }
      if (kelasRes.data && kelasRes.data.length > 0) {
        MockDatabase.syncKelasFromRemote(kelasRes.data as Kelas[]);
      }
      if (stafRes.data && stafRes.data.length > 0) {
        MockDatabase.syncStafFromRemote(stafRes.data as StafSekolah[]);
      }

      sessionStorage.setItem('jurnal_baseline_synced', 'true');
    } catch (e) {
      console.warn('initCloudSync warning:', e);
    }
  }


  /**
   * Mengambil data Kebiasaan
   */
  static async getKebiasaan(): Promise<Kebiasaan[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('kebiasaan')
          .select('*')
          .order('urutan', { ascending: true });
        if (!error && data && data.length > 0) {
          MockDatabase.syncKebiasaanFromRemote(data as Kebiasaan[]);
          return data as Kebiasaan[];
        }
      } catch (e) {
        console.warn('Fallback to local store for kebiasaan:', e);
      }
    }
    return MockDatabase.getKebiasaan();
  }

  /**
   * Mengupdate data Kebiasaan
   */
  static async updateKebiasaan(updated: Kebiasaan | Kebiasaan[]): Promise<void> {
    MockDatabase.updateKebiasaan(updated);
    if (isSupabaseConfigured) {
      try {
        const list = Array.isArray(updated) ? updated : [updated];
        await supabase.from('kebiasaan').upsert(list);
      } catch (e) {
        console.warn('Failed remote update kebiasaan:', e);
      }
    }
  }

  /**
   * Mengambil data Kelas
   */
  static async getKelas(): Promise<Kelas[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('kelas')
          .select('*')
          .order('nama_kelas', { ascending: true });
        if (!error && data && data.length > 0) {
          MockDatabase.syncKelasFromRemote(data as Kelas[]);
          return data as Kelas[];
        }
      } catch (e) {
        console.warn('Fallback to local store for kelas:', e);
      }
    }
    return MockDatabase.getKelas();
  }

  /**
   * Mengambil data Siswa dengan in-memory cache
   */
  static async getSiswa(kelasId?: string, forceRefresh: boolean = false): Promise<Siswa[]> {
    const cacheKey = kelasId || 'all';

    if (!forceRefresh) {
      const cached = JournalService.siswaCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < JournalService.CACHE_TTL_MS)) {
        return cached.data;
      }
      if (cacheKey !== 'all') {
        const allCached = JournalService.siswaCache.get('all');
        if (allCached && (Date.now() - allCached.timestamp < JournalService.CACHE_TTL_MS)) {
          const clean = kelasId!.replace(/^k-/i, '').toUpperCase();
          return allCached.data.filter(s => s.kelas_id === kelasId || s.kelas_id?.replace(/^k-/i, '').toUpperCase() === clean);
        }
      }
    }

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('siswa')
          .select('*')
          .order('nama', { ascending: true })
          .limit(5000);

        if (kelasId && kelasId !== 'all') {
          query = query.eq('kelas_id', kelasId);
        }
        const { data, error } = await query;
        if (!error && data) {
          JournalService.siswaCache.set(cacheKey, {
            data: data as Siswa[],
            timestamp: Date.now()
          });
          if (!kelasId || kelasId === 'all') {
            MockDatabase.syncSiswaFromRemote(data as Siswa[]);
          }
          return data as Siswa[];
        }
      } catch (e) {
        console.warn('Fallback to local store for siswa:', e);
      }
    }
    const local = MockDatabase.getSiswa();
    if (kelasId && kelasId !== 'all') {
      const clean = kelasId.replace(/^k-/i, '').toUpperCase();
      return local.filter((s) => s.kelas_id === kelasId || s.kelas_id?.replace(/^k-/i, '').toUpperCase() === clean);
    }
    return local;
  }

  /**
   * Mengambil data Staf Sekolah
   */
  static async getStaf(): Promise<StafSekolah[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('staf_sekolah')
          .select('*')
          .order('nama', { ascending: true })
          .limit(500);
        if (!error && data && data.length > 0) {
          MockDatabase.syncStafFromRemote(data as StafSekolah[]);
          return data as StafSekolah[];
        }
      } catch (e) {
        console.warn('Fallback to local store for staf:', e);
      }
    }
    return MockDatabase.getStaf();
  }

  /**
   * Mengambil Entri Jurnal dari Cloud Supabase & Local Cache dengan Pagination & Smart Memory Cache
   * Optimasi Egress:
   * 1. Siswa hanya memuat entri miliknya sendiri (~15 KB vs 3.6 MB)
   * 2. Memory cache 3 menit mencegah re-fetch berulang kali saat berpindah tab
   * 3. Filter semester berjalan (tanggal >= 2026-07-01) untuk query umum
   */
  static async getEntriJurnal(tanggal?: string, siswaId?: string, forceRefresh: boolean = false): Promise<EntriJurnal[]> {
    const cacheKey = `${tanggal || 'all'}_${siswaId || 'all'}`;

    // 1. Cek in-memory cache
    if (!forceRefresh) {
      const cached = JournalService.entriCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < JournalService.CACHE_TTL_MS)) {
        return cached.data;
      }
      
      // Jika data 'all_all' sudah ada di memori, saring dari memori tanpa request network ke Supabase
      if (cacheKey !== 'all_all') {
        const allCached = JournalService.entriCache.get('all_all');
        if (allCached && (Date.now() - allCached.timestamp < JournalService.CACHE_TTL_MS)) {
          let filtered = allCached.data;
          if (tanggal) filtered = filtered.filter(e => e.tanggal === tanggal);
          if (siswaId) filtered = filtered.filter(e => e.siswa_id === siswaId);
          return filtered;
        }
      }
    }

    if (isSupabaseConfigured) {
      try {
        let allData: EntriJurnal[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('entri_jurnal')
            .select('*')
            .order('waktu_submit', { ascending: false })
            .range(from, from + pageSize - 1);

          if (tanggal) query = query.eq('tanggal', tanggal);
          if (siswaId) {
            query = query.eq('siswa_id', siswaId);
          } else if (!tanggal) {
            // Optimasi Egress: Batasi pada tahun ajaran aktif berjalan (mulai 1 Juli 2026)
            query = query.gte('tanggal', '2026-07-01');
          }

          const { data, error } = await query;
          if (error) {
            console.error('Error fetching journal entries chunk:', error);
            break;
          }

          if (data && data.length > 0) {
            allData = allData.concat(data as EntriJurnal[]);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0 || siswaId || tanggal) {
          JournalService.entriCache.set(cacheKey, {
            data: allData,
            timestamp: Date.now()
          });

          MockDatabase.syncEntriFromRemote(allData);
          return allData;
        }
      } catch (e) {
        console.warn('Fallback to local store for entries:', e);
      }
    }
    let local = MockDatabase.getEntriJurnal();
    if (tanggal) local = local.filter((e) => e.tanggal === tanggal);
    if (siswaId) local = local.filter((e) => e.siswa_id === siswaId);
    return local;
  }

  /**
   * Menyimpan Entri Jurnal Siswa ke Cloud & Local
   */
  static async submitEntriJurnal(
    entry: Omit<EntriJurnal, 'id' | 'waktu_submit'>
  ): Promise<EntriJurnal> {
    JournalService.clearEntriCache();
    const localEntry = MockDatabase.addEntriJurnal(entry);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('entri_jurnal')
          .upsert({
            siswa_id: entry.siswa_id,
            kebiasaan_id: entry.kebiasaan_id,
            tanggal: entry.tanggal,
            urutan_ke: entry.urutan_ke,
            sub_tipe: entry.sub_tipe || null,
            nama_kegiatan: entry.nama_kegiatan || null,
            foto_url: entry.foto_url,
            sumber_foto: entry.sumber_foto,
            waktu_ambil_foto: entry.waktu_ambil_foto ? new Date(entry.waktu_ambil_foto).toISOString() : null,
            status_waktu: entry.status_waktu,
            flag_foto_mencurigakan: entry.flag_foto_mencurigakan || false,
            alasan_flag: entry.alasan_flag || null,
            catatan: entry.catatan || null
          }, { onConflict: 'siswa_id, tanggal, kebiasaan_id, urutan_ke' })
          .select()
          .single();

        if (error) {
          console.error('Error saving entry to Supabase:', error);
        } else if (data) {
          return data as EntriJurnal;
        }
      } catch (e) {
        console.warn('Failed remote save entri:', e);
      }
    }
    return localEntry;
  }

  /**
   * Menghapus Entri Jurnal (Wali Kelas / Superadmin)
   */
  static async deleteEntriJurnal(entriId: string, stafId: string, alasan: string): Promise<boolean> {
    JournalService.clearEntriCache();
    MockDatabase.deleteEntriJurnal(entriId, stafId, alasan);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('entri_jurnal').delete().eq('id', entriId);
        await supabase.from('log_hapus').insert({
          entri_id: entriId,
          dihapus_oleh: stafId,
          alasan: alasan,
          waktu: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.warn('Failed remote delete entri:', e);
      }
    }
    return true;
  }

  /**
   * Mengambil Feedback Guru ke Siswa
   */
  static async getFeedback(siswaId?: string): Promise<Feedback[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(1000);
        if (siswaId) query = query.eq('siswa_id', siswaId);
        const { data, error } = await query;
        if (!error && data) {
          return data as Feedback[];
        }
      } catch (e) {
        console.warn('Fallback to local store for feedback:', e);
      }
    }
    const local = MockDatabase.getFeedback();
    if (siswaId) return local.filter(f => f.siswa_id === siswaId);
    return local;
  }

  /**
   * Menambah Feedback dari Guru ke Siswa
   */
  static async addFeedback(
    stafId: string, 
    siswaId: string, 
    entriId: string | null, 
    komentar: string
  ): Promise<Feedback> {
    const localFb = MockDatabase.addFeedback(stafId, siswaId, entriId, komentar);
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('feedback')
          .insert({
            staf_id: stafId,
            siswa_id: siswaId,
            entri_id: entriId,
            komentar
          })
          .select()
          .single();
        if (data) return data as Feedback;
      } catch (e) {
        console.warn('Failed remote insert feedback:', e);
      }
    }
    return localFb;
  }

  /**
   * Mengambil Arahan Wali Kelas
   */
  static async getArahanWaliKelas(kelasId?: string): Promise<ArahanWaliKelas[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('arahan_wali_kelas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);
        if (kelasId) query = query.eq('kelas_id', kelasId);
        const { data, error } = await query;
        if (!error && data) return data as ArahanWaliKelas[];
      } catch (e) {
        console.warn('Fallback to local store for arahan:', e);
      }
    }
    let local = MockDatabase.getArahanWaliKelas();
    if (kelasId) local = local.filter((a) => a.kelas_id === kelasId);
    return local;
  }

  /**
   * Mengirim Arahan ke Wali Kelas
   */
  static async sendArahanWaliKelas(
    stafPengirimId: string,
    kelasId: string,
    kategori: 'apresiasi' | 'evaluasi' | 'instruksi' | 'tindak_lanjut',
    judul: string,
    pesan: string
  ): Promise<ArahanWaliKelas> {
    const localArahan = MockDatabase.addArahanWaliKelas(stafPengirimId, kelasId, kategori, judul, pesan);
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('arahan_wali_kelas')
          .insert({
            staf_pengirim_id: stafPengirimId,
            kelas_id: kelasId,
            kategori,
            judul,
            pesan
          })
          .select()
          .single();
        if (data) return data as ArahanWaliKelas;
      } catch (e) {
        console.warn('Failed remote insert arahan:', e);
      }
    }
    return localArahan;
  }

  /**
   * Menandai Arahan Terbaca
   */
  static async markArahanRead(arahanId: string): Promise<void> {
    MockDatabase.markArahanRead(arahanId);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('arahan_wali_kelas').update({ dibaca: true }).eq('id', arahanId);
      } catch (e) {
        console.warn('Failed remote mark arahan read:', e);
      }
    }
  }

  /**
   * Menghapus Arahan Wali Kelas
   */
  static async deleteArahan(arahanId: string): Promise<void> {
    MockDatabase.deleteArahan(arahanId);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('arahan_wali_kelas').delete().eq('id', arahanId);
      } catch (e) {
        console.warn('Failed remote delete arahan:', e);
      }
    }
  }

  /**
   * Impor Massal Siswa ke Cloud Supabase & Local Cache dengan Auto-Class Generator Dinamis
   */
  static async importSiswa(
    students: Siswa[], 
    replaceAll: boolean, 
    syncClasses: boolean = true
  ): Promise<{ importedCount: number; newClassesCount: number; removedClassesCount: number }> {
    // 1. Ekstrak seluruh nama kelas unik dari siswa yang diimpor
    const uniqueImportedClassNames = Array.from(new Set(
      students.map(s => ((s as any).kelas_name || s.kelas_id?.replace(/^k-/, '') || '7A').toUpperCase().trim())
    )).filter(Boolean);

    // 2. Sinkronkan MockDatabase
    MockDatabase.ensureKelasExist(uniqueImportedClassNames);
    if (replaceAll && syncClasses) {
      MockDatabase.cleanupUnusedKelas(uniqueImportedClassNames);
    }
    MockDatabase.importSiswa(students, replaceAll);

    let newClassesCount = 0;
    let removedClassesCount = 0;

    if (isSupabaseConfigured) {
      try {
        const { data: dbKelasList } = await supabase.from('kelas').select('id, nama_kelas, tingkat');
        const kelasUuidMap = new Map<string, string>();
        
        if (dbKelasList) {
          dbKelasList.forEach(k => {
            kelasUuidMap.set(k.nama_kelas.toUpperCase().trim(), k.id);
          });
        }

        // 3. Deteksi kelas baru di CSV yang belum ada di database, lalu insert otomatis
        const missingClassNames = uniqueImportedClassNames.filter(name => !kelasUuidMap.has(name));
        if (missingClassNames.length > 0) {
          const classesToInsert = missingClassNames.map(name => {
            const numMatch = name.match(/\d+/);
            const tingkat = numMatch ? Math.min(Math.max(parseInt(numMatch[0], 10), 1), 12) : 7;
            return {
              nama_kelas: name,
              tingkat
            };
          });

          const { data: insertedClasses, error: insertErr } = await supabase
            .from('kelas')
            .insert(classesToInsert)
            .select('id, nama_kelas');

          if (insertedClasses) {
            newClassesCount = insertedClasses.length;
            insertedClasses.forEach(k => {
              kelasUuidMap.set(k.nama_kelas.toUpperCase().trim(), k.id);
            });
          }
          if (insertErr) {
            console.warn('Gagal auto-insert kelas baru:', insertErr.message);
          }
        }

        // 4. Jika replaceAll & syncClasses aktif, hapus kelas kosong lama yang tidak ada di CSV
        if (replaceAll) {
          await supabase.from('siswa').delete().neq('nama', '___RESERVED_NEVER_MATCH___');

          if (syncClasses && dbKelasList) {
            const classesToDelete = dbKelasList.filter(
              k => !uniqueImportedClassNames.includes(k.nama_kelas.toUpperCase().trim())
            );
            for (const c of classesToDelete) {
              try {
                await supabase.from('staf_sekolah').update({ kelas_id: null }).eq('kelas_id', c.id);
                const { error: delErr } = await supabase.from('kelas').delete().eq('id', c.id);
                if (!delErr) {
                  removedClassesCount++;
                }
              } catch (e) {
                console.warn('Gagal hapus kelas kosong lama:', c.nama_kelas, e);
              }
            }
          }
        }

        const defaultKelasUuid = Array.from(kelasUuidMap.values())[0];

        // 5. Buat payload siswa dengan resolved UUID yang akurat
        const payload = students.map(s => {
          let resolvedKelasId = s.kelas_id;
          const cleanName = ((s as any).kelas_name || resolvedKelasId?.replace(/^k-/, '') || '7A').toUpperCase().trim();
          resolvedKelasId = kelasUuidMap.get(cleanName) || defaultKelasUuid;

          return {
            nisn: String(s.nisn).trim(),
            nama: String(s.nama).trim(),
            kelas_id: resolvedKelasId,
            tanggal_lahir: s.tanggal_lahir,
            sudah_ganti_password: s.sudah_ganti_password || false
          };
        });

        const chunkSize = 50;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error } = await supabase.from('siswa').upsert(chunk, { onConflict: 'nisn' });
          if (error) {
            console.error(`Error import siswa chunk [${i}..${i + chunkSize}]:`, error.message);
          }
        }

        // 6. Refresh data siswa & kelas di cache lokal
        const [{ data: refreshedSiswa }, { data: refreshedKelas }] = await Promise.all([
          supabase.from('siswa').select('*').limit(5000),
          supabase.from('kelas').select('*').order('nama_kelas')
        ]);

        if (refreshedSiswa) {
          MockDatabase.syncSiswaFromRemote(refreshedSiswa as Siswa[]);
        }
        if (refreshedKelas) {
          MockDatabase.syncKelasFromRemote(refreshedKelas as Kelas[]);
        }
        JournalService.clearSiswaCache();
      } catch (e) {
        console.error('Gagal sync import siswa ke Supabase Cloud:', e);
      }
    }

    return {
      importedCount: students.length,
      newClassesCount,
      removedClassesCount
    };
  }

  /**
   * Impor Massal Staf ke Cloud Supabase & Local Cache dengan UUID Resolver
   */
  static async importStaf(staffList: StafSekolah[], replaceAll: boolean): Promise<void> {
    MockDatabase.importStaf(staffList, replaceAll);

    if (isSupabaseConfigured) {
      try {
        const { data: dbKelasList } = await supabase.from('kelas').select('id, nama_kelas');
        const kelasUuidMap = new Map<string, string>();
        
        if (dbKelasList) {
          dbKelasList.forEach(k => {
            kelasUuidMap.set(k.nama_kelas.toUpperCase().trim(), k.id);
          });
        }

        if (replaceAll) {
          await supabase.from('staf_sekolah').delete().neq('role', 'superadmin');
        }

        const payload = staffList.map(st => {
          let resolvedKelasId: string | null = null;
          if (st.role === 'wali_kelas') {
            const rawK = st.kelas_id ? String(st.kelas_id).replace(/^k-/i, '').toUpperCase().trim() : '';
            resolvedKelasId = kelasUuidMap.get(rawK) || dbKelasList?.find(k => k.id === st.kelas_id)?.id || null;
          }

          return {
            nip_atau_nik: String(st.nip_atau_nik).trim(),
            nama: String(st.nama).trim(),
            role: st.role,
            status_asn: st.status_asn,
            tanggal_lahir: st.tanggal_lahir,
            kelas_id: resolvedKelasId,
            scope: st.scope,
            sudah_ganti_password: st.sudah_ganti_password || false
          };
        });

        const chunkSize = 20;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error } = await supabase.from('staf_sekolah').upsert(chunk, { onConflict: 'nip_atau_nik' });
          if (error) {
            console.error(`Error import staf chunk [${i}..${i + chunkSize}]:`, error.message);
            if (error.message.includes('tanggal_lahir')) {
              const fallbackChunk = chunk.map(({ tanggal_lahir, ...rest }) => rest);
              await supabase.from('staf_sekolah').upsert(fallbackChunk, { onConflict: 'nip_atau_nik' });
            }
          }
        }

        const { data: refreshedStaf } = await supabase.from('staf_sekolah').select('*').limit(500);
        if (refreshedStaf && refreshedStaf.length > 0) {
          MockDatabase.syncStafFromRemote(refreshedStaf as StafSekolah[]);
          // Update kelas.wali_kelas_id in Supabase
          for (const st of refreshedStaf) {
            if (st.role === 'wali_kelas' && st.kelas_id) {
              await supabase.from('kelas').update({ wali_kelas_id: st.id }).eq('id', st.kelas_id);
            }
          }
        }
      } catch (e) {
        console.error('Gagal sync import staf ke Supabase Cloud:', e);
      }
    }
  }

  /**
   * Mengubah Password / Tanggal Lahir Siswa atau Staf (Akses Khusus Superadmin)
   */
  static async adminUpdatePassword(
    type: 'siswa' | 'staf',
    userId: string,
    newTanggalLahir: string,
    _newPasswordText?: string
  ): Promise<boolean> {
    if (type === 'siswa') {
      const allSiswa = MockDatabase.getSiswa();
      const idx = allSiswa.findIndex(s => s.id === userId);
      if (idx >= 0) {
        allSiswa[idx].tanggal_lahir = newTanggalLahir;
        allSiswa[idx].sudah_ganti_password = true;
        MockDatabase.syncSiswaFromRemote(allSiswa);
      }

      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('siswa')
            .update({ 
              tanggal_lahir: newTanggalLahir, 
              sudah_ganti_password: true 
            })
            .eq('id', userId);
        } catch (e) {
          console.warn('Failed admin update password siswa:', e);
        }
      }
      return true;
    } else {
      const allStaf = MockDatabase.getStaf();
      const idx = allStaf.findIndex(st => st.id === userId);
      if (idx >= 0) {
        allStaf[idx].tanggal_lahir = newTanggalLahir;
        allStaf[idx].sudah_ganti_password = true;
        MockDatabase.syncStafFromRemote(allStaf);
      }

      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('staf_sekolah')
            .update({ 
              tanggal_lahir: newTanggalLahir, 
              sudah_ganti_password: true 
            })
            .eq('id', userId);
        } catch (e) {
          console.warn('Failed admin update password staf:', e);
        }
      }
      return true;
    }
  }

  /**
   * Mengedit / Rename Data Siswa atau Staf (Akses Khusus Superadmin)
   */
  static async adminUpdateUser(
    type: 'siswa' | 'staf',
    userId: string,
    updates: Partial<Siswa> | Partial<StafSekolah>
  ): Promise<boolean> {
    if (type === 'siswa') {
      const allSiswa = MockDatabase.getSiswa();
      const idx = allSiswa.findIndex(s => s.id === userId);
      if (idx >= 0) {
        allSiswa[idx] = { ...allSiswa[idx], ...updates } as Siswa;
        MockDatabase.syncSiswaFromRemote(allSiswa);
      }

      if (isSupabaseConfigured) {
        try {
          const { id, auth_id, created_at, ...cleanUpdates } = updates as any;
          await supabase
            .from('siswa')
            .update(cleanUpdates)
            .eq('id', userId);
        } catch (e) {
          console.warn('Failed admin update siswa:', e);
        }
      }
      return true;
    } else {
      const allStaf = MockDatabase.getStaf();
      const idx = allStaf.findIndex(st => st.id === userId);
      if (idx >= 0) {
        allStaf[idx] = { ...allStaf[idx], ...updates } as StafSekolah;
        MockDatabase.syncStafFromRemote(allStaf);
      }

      if (isSupabaseConfigured) {
        try {
          const { id, auth_id, created_at, ...cleanUpdates } = updates as any;
          await supabase
            .from('staf_sekolah')
            .update(cleanUpdates)
            .eq('id', userId);
          
          if (cleanUpdates.kelas_id && (updates as StafSekolah).role === 'wali_kelas') {
            await supabase.from('kelas').update({ wali_kelas_id: userId }).eq('id', cleanUpdates.kelas_id);
          }
        } catch (e) {
          console.warn('Failed admin update staf:', e);
        }
      }
      return true;
    }
  }

  /**
   * Mengambil Seluruh Daftar Curhatan / Aspirasi Siswa (Kotak Suara Siswa)
   */
  static async getSuaraSiswaList(): Promise<SuaraSiswa[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('suara_siswa')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          MockDatabase.syncSuaraSiswaFromRemote(data as SuaraSiswa[]);
          return data as SuaraSiswa[];
        }
        if (error) {
          console.warn('Notice from Supabase suara_siswa:', error.message);
        }
      } catch (e) {
        console.warn('Fallback local for getSuaraSiswaList:', e);
      }
    }
    return MockDatabase.getSuaraSiswa();
  }

  /**
   * Siswa Mengirimkan Curhatan / Keluhan / Ide
   */
  static async kirimSuaraSiswa(
    siswaId: string,
    kelasId: string,
    kategori: KategoriSuara,
    judul: string,
    isi: string
  ): Promise<SuaraSiswa> {
    const localSuara = MockDatabase.addSuaraSiswa(siswaId, kelasId, kategori, judul, isi);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('suara_siswa')
          .insert({
            siswa_id: siswaId,
            kelas_id: kelasId,
            kategori,
            judul,
            isi,
            tanggal: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        if (error) {
          console.warn('Failed remote insert suara_siswa:', error.message);
        }
        if (data) {
          const current = MockDatabase.getSuaraSiswa().map(s => s.id === localSuara.id ? data as SuaraSiswa : s);
          MockDatabase.syncSuaraSiswaFromRemote(current);
          return data as SuaraSiswa;
        }
      } catch (e) {
        console.warn('Failed remote insert suara_siswa:', e);
      }
    }
    return localSuara;
  }

  /**
   * Pendidik / Pimpinan Sekolah Memberikan Tanggapan / Respons terhadap Suara Siswa
   * Mendukung banyak tanggapan dari guru/wali kelas/KS/kesiswaan/kurikulum/superadmin
   */
  static async tanggapiSuaraSiswa(
    suaraId: string,
    stafId: string,
    tanggapan: string,
    stafNama?: string,
    stafRole?: string
  ): Promise<boolean> {
    const localSuara = MockDatabase.getSuaraSiswa().find(s => s.id === suaraId);
    let responses: TanggapanSuaraItem[] = [];

    if (localSuara && localSuara.tanggapan) {
      if (localSuara.tanggapan.trim().startsWith('[')) {
        try {
          responses = JSON.parse(localSuara.tanggapan);
        } catch {
          responses = [];
        }
      } else {
        responses = [{
          id: `tg-${localSuara.tanggapan_oleh_staf_id || '1'}`,
          staf_id: localSuara.tanggapan_oleh_staf_id || '',
          staf_nama: 'Bapak/Ibu Guru',
          staf_role: 'Guru',
          tanggapan: localSuara.tanggapan,
          created_at: localSuara.tanggapan_at || new Date().toISOString()
        }];
      }
    }

    const existingIdx = responses.findIndex(r => r.staf_id === stafId);
    const newEntry: TanggapanSuaraItem = {
      id: `tg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      staf_id: stafId,
      staf_nama: stafNama || 'Bapak/Ibu Guru',
      staf_role: stafRole || 'Guru',
      tanggapan,
      created_at: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      responses[existingIdx] = {
        ...responses[existingIdx],
        tanggapan,
        created_at: new Date().toISOString()
      };
    } else {
      responses.push(newEntry);
    }

    const serialized = JSON.stringify(responses);
    MockDatabase.tanggapiSuaraSiswa(suaraId, stafId, serialized);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('suara_siswa')
          .update({
            tanggapan: serialized,
            tanggapan_oleh_staf_id: stafId,
            tanggapan_at: new Date().toISOString()
          })
          .eq('id', suaraId);
      } catch (e) {
        console.warn('Failed remote tanggapi suara_siswa:', e);
      }
    }
    return true;
  }

  /**
   * Menghapus Suara Siswa (Superadmin)
   */
  static async deleteSuaraSiswa(suaraId: string): Promise<boolean> {
    MockDatabase.deleteSuaraSiswa(suaraId);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('suara_siswa').delete().eq('id', suaraId);
      } catch (e) {
        console.warn('Failed remote delete suara_siswa:', e);
      }
    }
    return true;
  }

  /**
   * Menambahkan 1 Siswa Baru secara Manual (Superadmin)
   * Berguna untuk siswa mutasi / pindahan yang belum tercatat di Dapodik awal
   */
  static async addSiswa(
    studentData: {
      id?: string;
      nisn: string;
      nama: string;
      kelas_id: string;
      tanggal_lahir: string;
      sudah_ganti_password?: boolean;
    }
  ): Promise<{ success: boolean; data?: Siswa; message?: string }> {
    try {
      const cleanNisn = String(studentData.nisn || '').trim();
      const cleanNama = String(studentData.nama || '').trim();

      if (!cleanNisn) {
        return { success: false, message: 'NISN / Nomor Induk Siswa wajib diisi!' };
      }
      if (!cleanNama) {
        return { success: false, message: 'Nama lengkap siswa wajib diisi!' };
      }
      if (!studentData.kelas_id) {
        return { success: false, message: 'Rombel / Kelas wajib dipilih!' };
      }
      if (!studentData.tanggal_lahir) {
        return { success: false, message: 'Tanggal lahir wajib diisi (untuk password login siswa)!' };
      }

      // 1. Cek duplikasi NISN
      const existing = await JournalService.getSiswa();
      if (existing.some(s => s.nisn.toLowerCase() === cleanNisn.toLowerCase())) {
        return { success: false, message: `Siswa dengan NISN "${cleanNisn}" sudah terdaftar!` };
      }

      let createdStudent: Siswa;

      if (isSupabaseConfigured) {
        const payload = {
          nisn: cleanNisn,
          nama: cleanNama,
          kelas_id: studentData.kelas_id,
          tanggal_lahir: studentData.tanggal_lahir,
          sudah_ganti_password: false
        };

        const { data, error } = await supabase
          .from('siswa')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Failed to insert student into Supabase:', error.message);
          return { success: false, message: `Gagal menyimpan ke database Supabase: ${error.message}` };
        }

        createdStudent = data as Siswa;
      } else {
        createdStudent = {
          id: studentData.id || `siswa-${Date.now()}`,
          nisn: cleanNisn,
          nama: cleanNama,
          kelas_id: studentData.kelas_id,
          tanggal_lahir: studentData.tanggal_lahir,
          sudah_ganti_password: false
        };
      }

      // Update mockstore dan clear cache
      MockDatabase.addSiswa(createdStudent);
      JournalService.clearSiswaCache();

      return { success: true, data: createdStudent };
    } catch (err: any) {
      console.error('Error adding single student:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat menambahkan siswa' };
    }
  }

  /**
   * Menghapus Siswa dari Database / Kelas (Superadmin)
   */
  static async deleteSiswa(siswaId: string): Promise<boolean> {
    JournalService.clearSiswaCache();
    JournalService.clearEntriCache();
    MockDatabase.deleteSiswa(siswaId);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('entri_jurnal').delete().eq('siswa_id', siswaId);
        await supabase.from('feedback').delete().eq('siswa_id', siswaId);
        await supabase.from('suara_siswa').delete().eq('siswa_id', siswaId);
        const { error } = await supabase.from('siswa').delete().eq('id', siswaId);
        if (error) {
          console.error('Failed to delete student from Supabase:', error.message);
          return false;
        }
      } catch (e) {
        console.warn('Failed remote delete siswa:', e);
      }
    }
    return true;
  }

  /**
   * Mengirimkan Bulk Arahan / Peringatan Massal ke Banyak Kelas Sekaligus
   */
  static async kirimBulkArahan(
    stafPengirimId: string,
    kelasIds: string[],
    kategori: KategoriArahan,
    judul: string,
    pesan: string
  ): Promise<void> {
    const promises = kelasIds.map((kelasId) =>
      this.sendArahanWaliKelas(stafPengirimId, kelasId, kategori, judul, pesan)
    );
    await Promise.all(promises);
  }

  /**
   * Mengambil semua Pesan Komunikasi Siswa-Guru
   */
  static async getPesanKomunikasi(userId?: string): Promise<PesanKomunikasi[]> {
    let localList = MockDatabase.getPesanKomunikasi();

    if (isSupabaseConfigured) {
      try {
        const { data: fileData, error } = await supabase.storage.from('bukti_foto').download('chat/messages.json');
        if (fileData && !error) {
          const text = await fileData.text();
          const remoteList: PesanKomunikasi[] = JSON.parse(text);
          if (Array.isArray(remoteList)) {
            const map = new Map<string, PesanKomunikasi>();
            remoteList.forEach(m => map.set(m.id, m));
            localList.forEach(m => map.set(m.id, m));
            localList = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            localStorage.setItem('jurnal_7k_pesan_komunikasi', JSON.stringify(localList));
          }
        }
      } catch {
        // silent
      }
    }

    if (userId) {
      return localList.filter(m => m.pengirim_id === userId || m.penerima_id === userId);
    }
    return localList;
  }

  /**
   * Mengirim Pesan Komunikasi Siswa-Guru
   */
  static async kirimPesanKomunikasi(data: Omit<PesanKomunikasi, 'id' | 'created_at' | 'sudah_dibaca'>): Promise<PesanKomunikasi> {
    const newMsg = MockDatabase.kirimPesanKomunikasi(data);
    const all = MockDatabase.getPesanKomunikasi();

    if (isSupabaseConfigured) {
      try {
        const blob = new Blob([JSON.stringify(all)], { type: 'application/json' });
        await supabase.storage.from('bukti_foto').upload('chat/messages.json', blob, {
          upsert: true,
          contentType: 'application/json'
        });
      } catch (e) {
        console.warn('Failed cloud sync pesan komunikasi:', e);
      }
    }
    return newMsg;
  }

  /**
   * Menandai Pesan Komunikasi sudah dibaca
   */
  static async tandaiPesanDibaca(pesanId: string): Promise<void> {
    MockDatabase.tandaiPesanDibaca(pesanId);
    const all = MockDatabase.getPesanKomunikasi();
    if (isSupabaseConfigured) {
      try {
        const blob = new Blob([JSON.stringify(all)], { type: 'application/json' });
        await supabase.storage.from('bukti_foto').upload('chat/messages.json', blob, {
          upsert: true,
          contentType: 'application/json'
        });
      } catch {
        // silent
      }
    }
  }
}

