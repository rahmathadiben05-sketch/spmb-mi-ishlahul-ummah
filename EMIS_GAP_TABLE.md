# TABEL GAP — Field EMIS 4.0 vs Formulir SPMB MI Ishlahul Ummah

**Sumber EMIS:** `EMIS_STRUKTUR_DATA_SISWA.md` (dicek 2026-11-10, 8 tab, SATU record read-only).
**Formulir pembanding:** `export-aistudio` — `lib/types.ts`, `WizardStep1–4.tsx`, `WizardReview.tsx`
(per 2026-11-10, sebelum perbaikan area 5).
**Tanggal tabel:** 2026-11-10.

**Legenda Aksi:**
- **sudah ada** — field sudah ada di form (nilai/opsi sama atau setara).
- **samakan** — field ada tapi nilai/opsi berbeda dengan EMIS; opsi diselaraskan ke EMIS.
- **tambah** — field belum ada; ditambahkan oleh area 5 (opsional, kecuali 3 yang WAJIB).
- **tidak ditambah** — sengaja tidak dimasukkan (alasan di kolom Aksi).
- **out-of-scope** — bukan isian formulir pendaftaran (data pasca-pendaftaran / status sistem EMIS).

**3 field WAJIB EMIS** (terbukti dari pesan "tidak boleh kosong"): KEWARGANEGARAAN,
Agama, YANG MEMBIAYAI SEKOLAH — ketiganya ditambahkan sebagai wajib di Langkah 1.

## Sifat field — Wajib vs Opsional (arahan Rahmat 2026-11-10)

Semua field baru dari EMIS adalah **Opsional** kecuali 3 yang Wajib di bawah.
Field opsional WAJIB berlabel "(Opsional)" + teks bantuan di formulir
(mis. "Kosongkan bila tidak memiliki" / "Boleh dikosongkan"), dan validasi
TIDAK BOLEH memblokir bila field itu kosong.

**WAJIB (3 field baru):**
- KEWARGANEGARAAN siswa — Langkah 1
- Agama siswa — Langkah 1
- YANG MEMBIAYAI SEKOLAH — Langkah 1

**OPSIONAL (semua field baru lainnya):**
- Langkah 1: Hobi, Cita-cita, Pra Sekolah TK/RA, Pra Sekolah PAUD,
  Imunisasi (Hepatitis B, Polio, BCG, Campak, DPT, Covid), Alamat Email Siswa,
  NIS Lokal, Nomor KKS, Nomor PKH
- Langkah 2: Kewarganegaraan Ayah, Kewarganegaraan Ibu, Kewarganegaraan Wali,
  Status Wali (dropdown), Total Gabungan Penghasilan; Pendidikan, Pekerjaan,
  Penghasilan per orang tua (opsi disamakan ke EMIS, sifat tetap opsional)
- Langkah 3: Status Kepemilikan Rumah, Status Tempat Tinggal, Jarak ke Madrasah,
  Transportasi ke Sekolah, Waktu Tempuh, Koordinat Alamat
- Langkah 4: Upload KKS, Upload PKH

**OPSIONAL (field EMIS yang sudah ada sebelumnya — sudah berlabel jelas):**
- NISN ("(Opsional)"), Nomor KIP ("(Opsional)" + "Kosongkan jika calon santri
  belum/tidak memiliki KIP"), Berkebutuhan Khusus ("(Opsional — kosongkan bila
  tidak ada)"), Pas Foto, Bukti NISN, Ijazah TK/RA (bila belum memegang),
  Surat Pindah/Rapor pindahan — semuanya tidak memblokir bila kosong.
- Detail penanda per kolom baru ada di `NEW_COLUMNS_SPEC.md` §1 (kolom "Sifat").

---

## Tab 1 — DATA SISWA

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| Foto | Ya (Pas Foto 3x4, Langkah 4, opsional) | sudah ada |
| NAMA LENGKAP | Ya (wajib) | sudah ada |
| NISN | Ya (opsional, 10 digit) | sudah ada |
| NIS Lokal | Tidak | **tambah** (Langkah 1, opsional) |
| KEWARGANEGARAAN (WNI, WNA) | Tidak | **tambah** (Langkah 1, **WAJIB**) |
| NIK (16 digit) | Ya (wajib) | sudah ada |
| Valid Dukcapil | Tidak | out-of-scope (status hasil VervalPD, bukan isian) |
| TANGGAL VERIFIKASI | Tidak | out-of-scope (tampilan sistem EMIS) |
| TEMPAT LAHIR | Ya (wajib) | sudah ada |
| TANGGAL LAHIR | Ya (wajib, validasi usia ≤ 2021-07-01) | sudah ada |
| JENIS KELAMIN (Laki-laki, Perempuan) | Ya (wajib) | sudah ada |
| JUMLAH SAUDARA | Ya | sudah ada |
| ANAK KE | Ya | sudah ada |
| Agama (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Kong hu cu) | Tidak | **tambah** (Langkah 1, **WAJIB**) |
| Cita Cita (PNS, TNI/Polri, Guru/Dosen, Dokter, Politikus, Wiraswasta, Seniman/Artis, Ilmuwan, Agamawan, Lainnya) | Tidak | **tambah** (Langkah 1, opsional) |
| Checkbox "Tidak memiliki nomor handphone" (siswa) | Tidak | tidak ditambah — form tidak mengumpulkan HP siswa (anak usia MI umumnya belum punya HP; login wali memakai HP orang tua/wali) |
| NOMOR HANDPHONE siswa (prefix +62) | Tidak | tidak ditambah — alasan sama seperti di atas |
| ALAMAT EMAIL SISWA | Tidak | **tambah** (Langkah 1, opsional; divalidasi format email bila diisi) |
| HOBI (Olahraga, Kesenian, Membaca, Menulis, Jalan-jalan, Lainnya) | Tidak | **tambah** (Langkah 1, opsional) |
| YANG MEMBIAYAI SEKOLAH (Orang Tua, Wali/Orang Tua Asuh, Tanggungan Sendiri, Lainnya) | Tidak | **tambah** (Langkah 1, **WAJIB**) |
| PRA SEKOLAH (checkbox Pernah TK/RA, Pernah PAUD) | Tidak | **tambah** (Langkah 1, opsional) |
| IMUNISASI (checkbox Hepatitis B, Polio, BCG, Campak, DPT, Covid) | Tidak | **tambah** (Langkah 1, opsional) |
| NOMOR KIP / KIP | Ya (opsional) | sudah ada |
| KARTU KELUARGA — NO KK | Ya (wajib, 16 digit) | sudah ada |
| KARTU KELUARGA — NAMA KEPALA KELUARGA | Tidak | tidak ditambah — di luar daftar tugas area 5; dapat dibaca dari file KK saat verifikasi fisik |
| Upload Kartu Keluarga (max 2MB, pdf/jpg/png) | Ya (Langkah 4, wajib) | sudah ada |
| Upload KIP (max 2MB, pdf/jpg/png) | Tidak | tidak ditambah — di luar daftar tugas area 5 (form baru mengumpulkan nomor KIP); bila dibutuhkan, tambah slot seperti KKS/PKH |
| Sinkronisasi Data dengan VervalPD | Tidak | out-of-scope (tombol sistem EMIS, dilakukan operator) |

## Tab 2 — DATA ORANG TUA

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| AYAH — Nama Lengkap | Ya (wajib) | sudah ada |
| AYAH — STATUS (Masih Hidup, Sudah Meninggal, Tidak Diketahui) | Ya | sudah ada |
| AYAH — KEWARGANEGARAAN (WNI, WNA) | Tidak | **tambah** (Langkah 2, opsional) |
| AYAH — NIK | Ya (opsional) | sudah ada |
| AYAH — Tempat Lahir | Ya | sudah ada |
| AYAH — Tanggal Lahir | Ya | sudah ada |
| AYAH — Pendidikan Terakhir (SD/Sederajat, SMP/Sederajat, SMA/Sederajat, D1, D2, D3, D4/S1, S2, S3, Tidak Bersekolah, Lainnya) | Ya, opsi berbeda | **samakan** (opsi dropdown diganti persis ke daftar EMIS) |
| AYAH — Pekerjaan Utama (Tidak Bekerja, Pensiunan, PNS, TNI/Polisi, Guru/Dosen, Pegawai Swasta, Wiraswasta, Pengacara/Jaksa/Hakim/Notaris, Seniman/Pelukis/Artis/Sejenis, Dokter/Bidan/Perawat, Pilot/Pramugara, Pedagang, Petani/Peternak, Nelayan, Buruh (Tani/Pabrik/Bangunan), Sopir/Masinis/Kondektur, Politikus, Lainnya) | Ya, opsi berbeda | **samakan** (opsi dropdown diganti persis ke daftar EMIS) |
| AYAH — Checkbox "Tidak memiliki nomor handphone" | Tidak | tidak ditambah — HP ayah/ibu opsional di form; ketiadaan HP cukup dengan mengosongkan kolom |
| AYAH — Nomor Handphone (prefix +62) | Ya | sudah ada (tampilan di Review memakai format +62; format simpan tidak diubah) |
| AYAH — Upload Kartu Keluarga | Ya (satu file KK di Langkah 4, dipakai bersama) | sudah ada |
| IBU — Nama Lengkap | Ya (wajib) | sudah ada |
| IBU — STATUS | Ya | sudah ada |
| IBU — KEWARGANEGARAAN (WNI, WNA) | Tidak | **tambah** (Langkah 2, opsional) |
| IBU — NIK | Ya | sudah ada |
| IBU — Tempat Lahir | Ya | sudah ada |
| IBU — Tanggal Lahir | Ya | sudah ada |
| IBU — Pendidikan Terakhir | Ya, opsi berbeda | **samakan** (daftar EMIS, sama seperti ayah) |
| IBU — Pekerjaan Utama | Ya, opsi berbeda | **samakan** (daftar EMIS, sama seperti ayah) |
| IBU — Checkbox "Tidak memiliki nomor handphone" | Tidak | tidak ditambah — alasan sama seperti ayah |
| IBU — Nomor Handphone | Ya | sudah ada |
| IBU — Upload Kartu Keluarga | Ya (satu file KK bersama) | sudah ada |
| IBU — Checkbox "KK sama dengan ayah kandung" | Tidak | tidak ditambah — form memakai satu KK keluarga dan satu alamat domisili; tidak ada KK terpisah per orang tua |
| WALI — Dropdown (Sama dengan ayah kandung, Sama dengan ibu kandung, Lainnya) | Tidak | **tambah** (Langkah 2, opsional; "Lainnya" menampilkan isian wali) |
| WALI — Nama Lengkap | Ya (bila ada wali) | sudah ada |
| WALI — KEWARGANEGARAAN (WNI, WNA) | Tidak | **tambah** (Langkah 2, opsional) |
| WALI — NIK | Ya | sudah ada |
| WALI — Tempat Lahir | Ya | sudah ada |
| WALI — Tanggal Lahir | Ya | sudah ada |
| WALI — Pendidikan Terakhir | Ya, opsi berbeda | **samakan** (daftar EMIS) |
| WALI — Pekerjaan Utama | Ya, opsi berbeda | **samakan** (daftar EMIS) |
| WALI — Nomor Handphone | Ya | sudah ada |
| WALI — Hubungan dengan Siswa | Ya (teks bebas) | sudah ada |
| WALI — STATUS (Masih Hidup, Sudah Meninggal, Tidak Diketahui) | Ya | sudah ada |
| PENGHASILAN — Total Gabungan Penghasilan Orang Tua/Wali | Tidak | **tambah** (Langkah 2, opsional, isian teks) |
| PENGHASILAN — Penghasilan Rata-rata per Bulan (Rp) (dibawah 800.000; 800.001–1.200.000; 1.200.001–1.800.000; 1.800.001–2.500.000; 2.500.001–3.500.000; 3.500.001–4.800.000; 4.800.001–6.500.000; 6.500.001–10.000.000; 10.000.001–20.000.000; diatas 20.000.001) | Ya, rentang berbeda (per orang tua) | **samakan** (rentang dropdown diganti persis ke daftar EMIS; tetap per orang tua: ayah/ibu/wali) |
| NOMOR KKS | Tidak | **tambah** (Langkah 1, opsional — sesuai penugasan area 5; di EMIS letaknya di tab ini) |
| NOMOR PKH | Tidak | **tambah** (Langkah 1, opsional — sesuai penugasan area 5) |
| Tombol "REQUEST DATA PKH" | Tidak | out-of-scope (tombol sistem EMIS) |
| Upload KKS (max 2MB, pdf/jpg/png) | Tidak | **tambah** (Langkah 4, opsional) |
| Upload PKH (max 2MB, pdf/jpg/png) | Tidak | **tambah** (Langkah 4, opsional) |

## Tab 3 — DATA ALAMAT

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| AYAH/IBU/WALI — Checkbox "Tinggal Diluar Negeri" | Tidak | tidak ditambah — form memakai satu alamat domisili siswa (WNI lokal); kasus tinggal di luar negeri ditangani manual oleh operator |
| AYAH/IBU/WALI — STATUS KEPEMILIKAN RUMAH (Milik Sendiri, Rumah Orang Tua, Rumah Saudara/kerabat, Rumah Dinas, Sewa/kontrak, Lainnya) | Tidak | **tambah** (Langkah 3, opsional; satu nilai untuk alamat domisili siswa) |
| Provinsi | Ya (dropdown berjenjang) | sudah ada |
| Kabupaten/Kota | Ya | sudah ada |
| Kecamatan | Ya | sudah ada |
| Kelurahan/Desa | Ya | sudah ada |
| RT | Ya | sudah ada |
| RW | Ya | sudah ada |
| Alamat | Ya | sudah ada |
| KODEPOS | Ya | sudah ada |
| IBU — Checkbox "Sama Dengan Ayah Kandung" | Tidak | tidak ditambah — form memakai satu alamat domisili siswa, bukan alamat terpisah per orang tua |
| WALI — STATUS WALI (Sama dengan ayah kandung, Sama dengan ibu kandung, Lainnya) | Tidak (di Langkah 3) | sudah ada — dicakup satu dropdown Status Wali di Langkah 2 (tidak diduplikasi di Langkah 3) |
| SISWA — STATUS TEMPAT TINGGAL (Tinggal dengan Ayah Kandung, Tinggal dengan Ibu Kandung, Tinggal dengan Wali, Ikut Saudara/Kerabat, Asrama Madrasah, Kontrak/Kost, Tinggal di Asrama Pesantren, Panti Asuhan, Rumah Singgah, Lainnya) | Tidak | **tambah** (Langkah 3, opsional) |
| SISWA — KOORDINAT ALAMAT | Tidak | **tambah** (Langkah 3, opsional, teks bebas; tanpa tombol peta — peta EMIS adalah fitur sistem, bukan isian) |
| SISWA — JARAK TEMPAT TINGGAL–MADRASAH (Kurang dari 5 km, 5–10 Km, 11–20 Km, 21–30 Km, Lebih dari 30 Km) | Tidak | **tambah** (Langkah 3, opsional) |
| SISWA — TRANSPORTASI KE SEKOLAH (Jalan Kaki, Sepeda, Sepeda Motor, Mobil Pribadi, Antar Jemput Sekolah, Angkutan Umum, Perahu/Sampan, Lainnya, Kendaraan Pribadi, Kereta Api, Ojek, Andong/Bendi/Sado/Dokar/Delman/Becak) | Tidak | **tambah** (Langkah 3, opsional) |
| SISWA — WAKTU TEMPUH (1-10 menit, 10-19 menit, 20-29 menit, 30-39 menit, 1-2 jam, > 2 jam) | Tidak | **tambah** (Langkah 3, opsional) |

## Tab 4 — AKTIVITAS BELAJAR

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| Banner "Siswa Aktif" + tombol "UBAH TIDAK AKTIF" | Tidak | out-of-scope (status keaktifan pasca-pendaftaran, diatur operator di EMIS) |
| Tabel riwayat (Tahun Ajaran–Semester, Tanggal Mulai Masuk, NSM–Nama Lembaga, Jenjang, Tingkat/Kelompok, Jurusan, Rombel, Status Keaktifan, Keterangan) | Tidak | out-of-scope (riwayat belajar, terbentuk setelah siswa aktif) |

## Tab 5 — KEBUTUHAN KHUSUS

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| KEBUTUHAN KHUSUS (Tidak Ada, Lamban Belajar, Kesulitan Belajar spesifik, Gangguan komunikasi, Berbakat/memiliki kemampuan dan kecerdasan luar biasa, Lainnya) | Sebagian (teks bebas `kebutuhanKhusus`, Langkah 1) | sudah ada (teks bebas) — **tidak disamakan** ke dropdown EMIS; di luar daftar tugas area 5 |
| KEBUTUHAN DISABILITAS (checkbox: Tidak Ada, Tuna Netra, Tuna Rungu, Tuna Daksa, Tuna Grahita, Tuna Laras, Lainnya, Tuna Wicara) | Sebagian (tercakup teks bebas di atas) | sudah ada (teks bebas) — tidak diubah; bila dibutuhkan, jadikan checkbox terpisah pada perbaikan berikutnya |

## Tab 6 — BEASISWA & BANTUAN

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| Tabel + form tambah (Tahun, Kategori, Nama Beasiswa/Bantuan, Jenis/Nama Instansi Pemberi, Jangka Waktu, Nominal) | Tidak | out-of-scope (data pasca-pendaftaran; pengecualian: Nomor KIP sudah ada di Langkah 1, dan KKS/PKH ditambahkan sebagai nomor + upload) |

## Tab 7 — PRESTASI SISWA

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| Tabel + form tambah (Tahun, Nama Lomba, Bidang Lomba, Nama Penyelenggara, Lomba Tingkat, Peringkat, Kategori Lomba, Upload sertifikat) | Tidak | out-of-scope (data pasca-pendaftaran) |

## Tab 8 — PENDIDIKAN LAIN

| Field EMIS | Ada di form? | Aksi |
|---|---|---|
| Tabel + form tambah (Nama Lembaga, Jenis Lembaga, Mulai Belajar, Frekuensi Belajar, Lokasi Lembaga) | Tidak | out-of-scope (data pasca-pendaftaran, mis. TPQ/madin) |

## Lainnya — Alur entri PPDB EMIS (bukan field formulir)

| Item EMIS | Ada di form? | Aksi |
|---|---|---|
| Pencarian awal "KETERANGAN CALON PESERTA DIDIK BERDASARKAN" (NIK / NISN / Nama, Tempat, dan tanggal lahir) | Tidak | out-of-scope (langkah kerja operator di EMIS saat menginput; formulir SPMB tidak perlu menirunya) |

---

## Ringkasan hitung

- **Ditambah:** 30 field/kolom baru (lihat `NEW_COLUMNS_SPEC.md` — kolom 76–105).
  - Langkah 1: 17 (kewarganegaraan*, agama*, hobi, cita-cita, yang membiayai*,
    pra TK/RA, pra PAUD, 6 imunisasi, email siswa, NIS Lokal, No KKS, No PKH).
  - Langkah 2: 5 (kewarganegaraan ayah/ibu/wali, status wali, total gabungan penghasilan).
  - Langkah 3: 6 (status kepemilikan rumah, status tempat tinggal, jarak, transportasi, waktu tempuh, koordinat).
  - Langkah 4: 2 slot upload (KKS, PKH).
  - Disamakan (opsi): pendidikan, pekerjaan, penghasilan per orang tua.
- **Sengaja tidak ditambah:** HP siswa + checkbox "tidak punya HP" siswa, Nama Kepala Keluarga,
  Upload KIP, checkbox "tidak punya HP" orang tua, "KK sama dengan ayah", "Tinggal Diluar Negeri",
  alamat terpisah per orang tua — alasan pada baris masing-masing di atas.
- **Out-of-scope:** beasiswa & bantuan, prestasi siswa, pendidikan lain, aktivitas belajar
  (pasca-pendaftaran) + status sistem EMIS (Valid Dukcapil, Tanggal Verifikasi, REQUEST DATA PKH,
  sinkronisasi VervalPD, pencarian awal PPDB).
- **Tidak diubah:** kebutuhan khusus tetap teks bebas (belum disamakan ke dropdown EMIS).
