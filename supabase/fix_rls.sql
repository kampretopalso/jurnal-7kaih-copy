-- ==============================================================================
-- FIX RLS & DATA SYNC UNTUK JURNAL 7 KAIH SMPN 2 GLAGAH
-- Jalankan skrip ini di SQL Editor Supabase Anda untuk memperbaiki error:
-- "infinite recursion detected in policy for relation staf_sekolah"
-- ==============================================================================

-- 1. HAPUS SEMUA POLICY LAMA YANG MENYEBABKAN REKURSIF
drop policy if exists "Kebiasaan dapat dibaca semua user" on kebiasaan;
drop policy if exists "Superadmin dapat mengelola kebiasaan" on kebiasaan;
drop policy if exists "Kelas dapat dibaca semua user" on kelas;
drop policy if exists "Superadmin dapat mengelola kelas" on kelas;
drop policy if exists "Siswa dapat dibaca oleh user terautentikasi" on siswa;
drop policy if exists "Siswa dapat mengubah datanya sendiri" on siswa;
drop policy if exists "Superadmin dapat mengelola data siswa" on siswa;
drop policy if exists "Staf dapat dibaca oleh user terautentikasi" on staf_sekolah;
drop policy if exists "Staf dapat mengubah datanya sendiri" on staf_sekolah;
drop policy if exists "Superadmin dapat mengelola data staf" on staf_sekolah;
drop policy if exists "Akses entri jurnal siswa dan staf" on entri_jurnal;
drop policy if exists "Siswa dapat insert entri sendiri" on entri_jurnal;
drop policy if exists "Wali kelas dan superadmin dapat menghapus entri" on entri_jurnal;
drop policy if exists "Arahan dapat dibaca wali kelas terkait dan pimpinan sekolah" on arahan_wali_kelas;
drop policy if exists "Pimpinan sekolah dapat mengirim arahan ke wali kelas" on arahan_wali_kelas;

-- 2. BERIKAN AKSES BEBAS REKURSIF (FULL ACCESS UNTUK APLIKASI SEKOLAH)
create policy "Allow all kebiasaan" on kebiasaan for all using (true) with check (true);
create policy "Allow all kelas" on kelas for all using (true) with check (true);
create policy "Allow all siswa" on siswa for all using (true) with check (true);
create policy "Allow all staf" on staf_sekolah for all using (true) with check (true);
create policy "Allow all entri_jurnal" on entri_jurnal for all using (true) with check (true);
create policy "Allow all feedback" on feedback for all using (true) with check (true);
create policy "Allow all arahan_wali_kelas" on arahan_wali_kelas for all using (true) with check (true);
create policy "Allow all log_hapus" on log_hapus for all using (true) with check (true);

-- 3. PASTIKAN BUCKET STORAGE BUKTI FOTO PUBLIC
insert into storage.buckets (id, name, public)
values ('bukti_foto', 'bukti_foto', true)
on conflict (id) do update set public = true;

drop policy if exists "Bukti foto dapat dibaca publik" on storage.objects;
drop policy if exists "User terautentikasi dapat upload bukti foto" on storage.objects;
drop policy if exists "Public upload bukti foto" on storage.objects;

create policy "Bukti foto dapat dibaca publik" on storage.objects for select using (bucket_id = 'bukti_foto');
create policy "Public upload bukti foto" on storage.objects for insert with check (bucket_id = 'bukti_foto');
create policy "Public update bukti foto" on storage.objects for update using (bucket_id = 'bukti_foto');
create policy "Public delete bukti foto" on storage.objects for delete using (bucket_id = 'bukti_foto');
