# Pusat CMS Terpadu & Pembaruan Struktur Formulir Pendaftaran SPMB

Pengembangan komprehensif untuk menyediakan Pusat CMS Terpadu di Dashboard Admin dengan tab per halaman dan tombol Reset Default di setiap bagian, sekaligus menyelaraskan seluruh field formulir pendaftaran wali murid sesuai spesifikasi standar madrasah (Data Siswa, Data Orang Tua/Wali, Data Alamat rinci, serta Aturan Berkas Langkah 4 terverifikasi) dari tahap pendaftaran hingga lembar cetak resmi.

---

> [!IMPORTANT]
> **Keputusan Kunci yang Telah Dikonfirmasi**:
> 1. **Model Antarmuka Admin**: Pusat CMS terpadu satu pintu dengan tab per halaman (*Beranda, Formulir Pendaftaran, Halaman Sukses, Lembar Cetak KOP, dan Dashboard Wali Murid*).
> 2. **Cakupan Fleksibilitas**: Seluruh halaman dari landing publik, wizard 4-langkah, konfirmasi sukses, hingga dokumen cetak resmi PDF/KOP.
> 3. **Fitur Reset**: Disediakan tombol **"Reset ke Default Madrasah"** mandiri di setiap tab/seksi tanpa menghapus perubahan di tab lainnya.
> 4. **Spesifikasi Field Formulir**:
>    - **Data Siswa**: Nama Lengkap, Nama Panggilan, NISN, NIK (16 digit), Tempat Lahir, Tanggal Lahir, Jenis Kelamin (L/P), Jumlah Saudara, Anak Ke-, Nomor KIP (opsional), dan Nomor Kartu Keluarga (16 digit).
>    - **Data Orang Tua / Wali**:
>      - *Ayah Kandung*: Nama Lengkap, Status (Masih Hidup / Sudah Meninggal / Tidak Diketahui), NIK, Tempat Lahir, Tanggal Lahir, Pendidikan Terakhir, Pekerjaan.
>      - *Ibu Kandung*: Nama Lengkap, Status (Masih Hidup / Sudah Meninggal / Tidak Diketahui), NIK, Tempat Lahir, Tanggal Lahir, Pendidikan Terakhir, Pekerjaan.
>      - *Wali (Opsional jika kedua ortu masih ada)*: Nama Lengkap, Status, NIK, Tempat Lahir, Tanggal Lahir, Pendidikan Terakhir, Pekerjaan.
>    - **Data Alamat**: Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa, RT, RW, Alamat Lengkap (Jalan/Gang/No. Rumah), dan Kode Pos.
> 5. **Spesifikasi Berkas Unggahan (Langkah 4)**:
>    - **Kartu Keluarga (KK)**: Wajib diunggah (Asli/Legalisir).
>    - **Akta Kelahiran (AKTA)**: Wajib diunggah (Asli).
>    - **Bukti / Kartu NISN**: Bersifat **Opsional** (bagi yang sudah memiliki dari jenjang sebelumnya).
>    - **Ijazah TK / RA**: Bersifat **Kondisional** (Opsional bagi calon santri yang belum/tidak menempuh TK, namun **Wajib hukumnya diunggah** bagi calon santri yang memegang ijazah TK atau lulusan RA/TK/PAUD, disertai toggle konfirmasi kepemilikan ijazah TK yang intuitif).

---

## 1. Overview & Core Concept

- **Tujuan Utama**: Memberikan fleksibilitas penuh bagi administrator madrasah untuk mengubah teks judul, narasi, petunjuk berkas, KOP surat resmi, dan rincian biaya tanpa menyentuh kode program, sekaligus memberikan formulir pendaftaran santri baru yang terstandar, validatif, dan ramah pengguna bagi wali murid.
- **Pengguna Sasaran**:
  - **Administrator Madrasah**: Mengelola branding, informasi pendaftaran, teks panduan, ketentuan berkas, KOP surat, dan memulihkan teks default kapan saja.
  - **Wali Murid / Calon Santri**: Mengisi biodata lengkap siswa, data orang tua (ayah, ibu, wali), alamat domisili, mengunggah berkas terverifikasi, serta mengunduh bukti registrasi dan formulir resmi.
- **Nilai Tambah**: Validasi berkas menjadi cerdas dan manusiawi (tidak menghalangi calon siswa yang belum memiliki NISN/TK, namun tetap tegas mewajibkan unggah ijazah bagi yang telah memilikinya).

---

## 2. User Experience & Visual Design

### A. Alur Formulir Pendaftaran Santri Baru (Wali Murid)
1. **Langkah 1 (Data Siswa)**:
   - Formulir bersih dengan panduan NIK & KK 16 digit.
   - Pilihan Jenis Kelamin (Laki-laki / Perempuan) dengan toggle interaktif.
   - Input nomor urut anak dan jumlah saudara kandung.
   - Input opsional untuk **Nomor KIP (Kartu Indonesia Pintar)** dengan penanda badge opsional yang jelas.
2. **Langkah 2 (Data Orang Tua / Wali)**:
   - Sub-seksi terstruktur untuk **Ayah Kandung** dan **Ibu Kandung**.
   - Dropdown seleksi status: `Masih Hidup`, `Sudah Meninggal`, atau `Tidak Diketahui` pada masing-masing orang tua.
   - Sub-seksi **Wali Santri** opsional: Dapat diaktifkan secara eksplisit jika siswa tinggal bersama wali atau jika orang tua telah tiada.
3. **Langkah 3 (Data Alamat Domisili)**:
   - Input terpisah untuk Provinsi, Kabupaten/Kota, Kecamatan, dan Kelurahan/Desa.
   - Kolom berdampingan untuk **RT** dan **RW** terpisah, diikuti Alamat Lengkap jalan serta Kode Pos 5 digit.
4. **Langkah 4 (Unggah Berkas Persyaratan)**:
   - **Kartu Keluarga (KK)**: Card upload dengan badge `Wajib`. Format file: JPG/PNG/PDF maks 2MB dengan tombol pratinjau.
   - **Akta Kelahiran**: Card upload dengan badge `Wajib`.
   - **Bukti / Kartu NISN**: Card upload dengan badge `Opsional` ("Kosongkan bila belum diterbitkan").
   - **Ijazah TK / RA**: Dilengkapi pertanyaan konfirmasi: *"Apakah calon santri memiliki Ijazah TK / RA / PAUD?"*
     - Jika dijawab **Ya / Sudah Memegang Ijazah**, kartu upload berubah status menjadi `Wajib Unggah` dengan border aksen dan validasi form aktif.
     - Jika dijawab **Tidak / Belum Ada**, kartu upload tetap dalam status opsional/dilewati.
5. **Langkah 5 (Review & Konfirmasi)**:
   - Rangkuman menyeluruh seluruh field sebelum submit dengan pakta integritas resmi dan status berkas yang telah diunggah.

### B. Pusat CMS Terpadu (Dashboard Admin)
- Navigasi tab modern di panel admin (`cms_center`):
  1. `Tab 1: Beranda & Publik`: Hero banner, narasi profil madrasah, timeline langkah pendaftaran, FAQ, dan kontak footer.
  2. `Tab 2: Formulir Pendaftaran`: Judul langkah 1–4, instruksi berkas (KK, Akta, NISN, Ijazah TK), dan pakta integritas pernyataan wali murid.
  3. `Tab 3: Halaman Sukses`: Narasi ucapan selamat, instruksi langkah lanjutan observasi, dan kontak bantuan CS.
  4. `Tab 4: Dokumen Cetak & KOP`: Nama instansi Kemenag, satuan madrasah, NSM/NPSN, alamat surat, nama ketua panitia/kepala madrasah, dan titimangsa.
  5. `Tab 5: Dashboard & Biaya`: Pengaturan pengumuman dashboard wali murid, batas waktu verifikasi, dan komponen rincian biaya.
- Setiap tab dilengkapi:
  - Tombol **"Reset ke Default Madrasah"** dengan konfirmasi dialog aman.
  - Tombol **"Simpan Perubahan"** dengan indikator sukses/toast interaktif.

---

## 3. Key Product Decisions & Trade-Offs

- **Logika Validasi Berkas Ijazah TK (Kondisional Wajib)**:
  - *Keputusan*: Menggunakan toggle status kepemilikan ijazah TK/RA (*"Sudah memiliki Ijazah TK/RA"* vs *"Belum/Tidak TK"*). Jika dipilih sudah memiliki, validasi form mewajibkan berkas tersebut sebelum wali murid dapat melanjutkan ke tahap review.
  - *Alasan*: Mengakomodasi calon santri yang langsung masuk MI tanpa jenjang TK sekaligus menegakkan kepatuhan dokumen resmi bagi yang telah memegang ijazah TK sesuai instruksi madrasah.
- **Penanganan Bukti NISN**:
  - *Keputusan*: Menandai field berkas NISN sebagai murni opsional.
  - *Alasan*: Sebagian besar lulusan TK/PAUD belum memiliki NISN aktif sebelum terdaftar resmi di EMIS MI.
- **Penyimpanan CMS Terpusat di SchoolSettings**:
  - *Keputusan*: Menyatukan seluruh konfigurasi teks ke dalam objek `settings.cmsContent` yang tersinkronisasi di `localStorage` dan state manajemen aplikasi.
  - *Alasan*: Memudahkan ekspor/impor cadangan, migrasi instan, dan mempertahankan performa render tanpa round-trip jaringan yang berlebihan.

---

## 4. Technical Architecture & Data Strategy

### Diagram Arsitektur Komponen & Aliran Data
```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dashboard Panel Admin                           │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │               Pusat CMS Terpadu (UnifiedCmsCenter)             │   │
│   │  [Tab Beranda] [Tab Wizard] [Tab Sukses] [Tab KOP] [Tab Biaya] │   │
│   │                                                                │   │
│   │  - Live Editor Field            - Reset Section Button         │   │
│   │  - Save Changes Handler         - Audit Log Record             │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ update schoolSettings.cmsContent
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local / Persistent Storage                      │
│                  `SchoolSettings` & `DEFAULT_CMS_CONTENT`              │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ reads dynamic texts & rules
             ┌───────────────────────┼───────────────────────┐
             ▼                       ▼                       ▼
┌─────────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│     Halaman Publik      │ │ Alur Registrasi │ │   Dashboard Wali &      │
│  - LandingHero          │ │ - WizardStep1   │ │   Dokumen Cetak         │
│  - RegistrationTimeline │ │ - WizardStep2   │ │ - WaliMuridDashboard    │
│  - PublicLayout/Footer  │ │ - WizardStep3   │ │ - PrintableBukti        │
│                         │ │ - WizardStep4   │ │ - PrintableFormulir     │
│                         │ │ - WizardReview  │ │ - SuccessPage           │
└─────────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### Entitas Data Model yang Diperbarui (`lib/types.ts`)

```typescript
// Field Berkas Unggahan Terperinci (Langkah 4)
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface DocumentsData {
  kartuKeluarga?: UploadedFile; // WAJIB
  aktaKelahiran?: UploadedFile; // WAJIB
  nisnDocument?: UploadedFile;  // OPSIONAL
  memilikiIjazahTk: boolean;    // Toggle status kepemilikan ijazah TK
  ijazahTk?: UploadedFile;      // WAJIB jika memilikiIjazahTk = true, selain itu opsional
  pasFoto?: UploadedFile;       // Pendukung
  suratKeteranganLulus?: UploadedFile;
}

// Field Siswa Lengkap
export interface StudentData {
  namaLengkap: string;
  namaPanggilan: string;
  nisn: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  jumlahSaudara: number;
  anakKe: number;
  nomorKip?: string; // Opsional
  noKk: string;
  asalSekolah?: string;
  hobi?: string;
  citaCita?: string;
}

// Field Orang Tua / Wali dengan Status Vital
export type ParentLifeStatus = 'Masih Hidup' | 'Sudah Meninggal' | 'Tidak Diketahui';

export interface ParentDetail {
  namaLengkap: string;
  status: ParentLifeStatus;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  penghasilanBulanan?: string;
  nomorHp?: string;
}

export interface ParentsData {
  ayah: ParentDetail;
  ibu: ParentDetail;
  wali?: ParentDetail;
  memilikiWali: boolean;
}

// Field Alamat Terinci
export interface AddressData {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  rtRw?: string;
  alamatLengkap: string;
  kodePos: string;
  tinggalBersama?: string;
  jarakKeSekolah?: string;
  transportasi?: string;
}
```

### Rencana Eksekusi Bertahap (Setelah Persetujuan)
1. **Langkah 1**: Perbarui tipe data di `lib/types.ts` dan nilai standar di `lib/defaults.ts` (mencakup dokumen `kartuKeluarga`, `aktaKelahiran`, `nisnDocument`, toggle `memilikiIjazahTk`, dan `ijazahTk`).
2. **Langkah 2**: Perbarui komponen formulir pendaftaran:
   - `WizardStep1.tsx`: Tambah field `namaPanggilan`, `nomorKip` (opsional), `noKk` (16 digit), validasi NIK/NISN.
   - `WizardStep2.tsx`: Tambah pilihan status vital (`Masih Hidup`, `Sudah Meninggal`, `Tidak Diketahui`) untuk Ayah, Ibu, dan Wali opsional.
   - `WizardStep3.tsx`: Tambah input mandiri `rt`, `rw`, `kelurahan`, `kecamatan`, `kabupaten`, `provinsi`, `kodePos`.
   - `WizardStep4.tsx`: Perbarui daftar berkas: KK (Wajib), Akta (Wajib), NISN (Opsional), dan Ijazah TK (Kondisional Wajib bila memegang ijazah TK).
   - `WizardReview.tsx`: Sinkronisasi pratinjau ringkasan data siswa, status ortu, alamat, dan status berkas.
3. **Langkah 3**: Buat antarmuka Pusat CMS Terpadu `components/admin/UnifiedCmsCenter.tsx` dengan tab per halaman dan tombol Reset Default per seksi.
4. **Langkah 4**: Sinkronisasi dokumen cetak `PrintableBukti.tsx` dan `PrintableFormulirResmi.tsx` agar menampilkan status kepemilikan ijazah TK, berkas lampiran, dan KOP dinamis.
5. **Langkah 5**: Verifikasi build melalui `lint_applet` dan `compile_applet` untuk memastikan zero errors.
