# SPESIFIKASI KOLOM BARU — Backend (Code.gs / gas-generator.ts)

**Tanggal:** 2026-11-10 (area 5 — penyesuaian format formulir ke EMIS).
**Status:** SPESIFIKASI SAJA — file ini JANGAN dipakai untuk mengedit langsung;
`Code.gs` dan `lib/gas-generator.ts` diedit oleh pekerja backend/koordinator
berdasarkan dokumen ini.
**Prinsip:** 75 kolom lama TIDAK BOLEH diubah urutan/namanya. 30 kolom baru
DITAMBAHKAN DI AKHIR, berurutan, menjadi kolom 76–105.
**Spreadsheet:** `1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4` (tab per tahun ajaran).
**Referensi kolom lama:** `lib/gas-generator.ts` → `HEADERS` (75 kolom, kolom 1–75),
`TEXT_COLS` lama, dan `EMIS_GAP_TABLE.md` (asal tiap field).

## 1. Daftar header baru — PERSIS, berurutan (kolom 76–105)

| No | Huruf kolom | Nama header (persis) | Sifat | Nilai yang disimpan |
|---|---|---|---|---|
| 76 | BX | Kewarganegaraan | **Wajib** | `WNI` / `WNA` |
| 77 | BY | Agama | **Wajib** | `Islam` / `Kristen Protestan` / `Katolik` / `Hindu` / `Buddha` / `Kong hu cu` |
| 78 | BZ | Hobi | Opsional | `Olahraga` / `Kesenian` / `Membaca` / `Menulis` / `Jalan-jalan` / `Lainnya` (kosong bila tidak diisi) |
| 79 | CA | Cita-cita | Opsional | `PNS` / `TNI/Polri` / `Guru/Dosen` / `Dokter` / `Politikus` / `Wiraswasta` / `Seniman/Artis` / `Ilmuwan` / `Agamawan` / `Lainnya` (kosong bila tidak diisi) |
| 80 | CB | Yang Membiayai Sekolah | **Wajib** | `Orang Tua` / `Wali/Orang Tua Asuh` / `Tanggungan Sendiri` / `Lainnya` |
| 81 | CC | Pra Sekolah TK/RA | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 82 | CD | Pra Sekolah PAUD | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 83 | CE | Imunisasi Hepatitis B | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 84 | CF | Imunisasi Polio | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 85 | CG | Imunisasi BCG | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 86 | CH | Imunisasi Campak | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 87 | CI | Imunisasi DPT | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 88 | CJ | Imunisasi Covid | Opsional | `Ya` bila dicentang, kosong bila tidak |
| 89 | CK | Email Siswa | Opsional | Alamat email (sudah divalidasi format di form bila diisi); kosong bila tidak diisi |
| 90 | CL | NIS Lokal | Opsional | Teks bebas (angka/huruf); kosong bila tidak diisi |
| 91 | CM | No KKS | Opsional | Nomor KKS apa adanya; kosong bila tidak diisi |
| 92 | CN | No PKH | Opsional | Nomor PKH apa adanya; kosong bila tidak diisi |
| 93 | CO | Kewarganegaraan Ayah | Opsional | `WNI` / `WNA` (kosong bila tidak diisi) |
| 94 | CP | Kewarganegaraan Ibu | Opsional | `WNI` / `WNA` (kosong bila tidak diisi) |
| 95 | CQ | Kewarganegaraan Wali | Opsional | `WNI` / `WNA` (kosong bila tidak diisi) |
| 96 | CR | Status Wali | Opsional | `Sama dengan ayah kandung` / `Sama dengan ibu kandung` / `Lainnya` (kosong bila tidak diisi) |
| 97 | CS | Total Gabungan Penghasilan | Opsional | Teks bebas dari form (contoh: `Rp3.500.000`); kosong bila tidak diisi |
| 98 | CT | Status Kepemilikan Rumah | Opsional | `Milik Sendiri` / `Rumah Orang Tua` / `Rumah Saudara/kerabat` / `Rumah Dinas` / `Sewa/kontrak` / `Lainnya` (kosong bila tidak diisi) |
| 99 | CU | Status Tempat Tinggal | Opsional | `Tinggal dengan Ayah Kandung` / `Tinggal dengan Ibu Kandung` / `Tinggal dengan Wali` / `Ikut Saudara/Kerabat` / `Asrama Madrasah` / `Kontrak/Kost` / `Tinggal di Asrama Pesantren` / `Panti Asuhan` / `Rumah Singgah` / `Lainnya` (kosong bila tidak diisi) |
| 100 | CV | Jarak ke Madrasah | Opsional | `Kurang dari 5 km` / `5–10 Km` / `11–20 Km` / `21–30 Km` / `Lebih dari 30 Km` (kosong bila tidak diisi) |
| 101 | CW | Transportasi ke Sekolah | Opsional | `Jalan Kaki` / `Sepeda` / `Sepeda Motor` / `Mobil Pribadi` / `Antar Jemput Sekolah` / `Angkutan Umum` / `Perahu/Sampan` / `Lainnya` / `Kendaraan Pribadi` / `Kereta Api` / `Ojek` / `Andong/Bendi/Sado/Dokar/Delman/Becak` (kosong bila tidak diisi) |
| 102 | CX | Waktu Tempuh | Opsional | `1-10 menit` / `10-19 menit` / `20-29 menit` / `30-39 menit` / `1-2 jam` / `> 2 jam` (kosong bila tidak diisi) |
| 103 | CY | Koordinat Alamat | Opsional | Teks bebas (contoh: `-7.345678, 112.723456`); kosong bila tidak diisi |
| 104 | CZ | Link KKS | Opsional | Link Drive file KKS (pola sama seperti kolom Link lain); kosong bila tidak diunggah |
| 105 | DA | Link PKH | Opsional | Link Drive file PKH (pola sama seperti kolom Link lain); kosong bila tidak diunggah |
| 106 | DB | Kebutuhan Disabilitas | Opsional | Daftar disabilitas dipisah koma (EMIS: Tidak Ada, Tuna Netra, Tuna Rungu, Tuna Daksa, Tuna Grahita, Tuna Laras, Tuna Wicara, Lainnya); kosong bila tidak ada — DITAMBAHKAN koordinator 2026-11-10 (di luar 30 kolom area 5) |

**Ringkasan sifat:** Wajib = 3 kolom (76, 77, 80 — ketiganya sudah divalidasi wajib di
form Langkah 1). Opsional = 27 kolom (semua kolom baru kecuali 76, 77, 80).
Kolom opsional yang kosong disimpan sebagai sel kosong — JANGAN diisi nilai default
(`-`, `Tidak Ada`, `0`, dsb.) agar operator EMIS bisa membedakan "tidak diisi"
dengan "tidak ada".

## 2. TEXT_COLS (format apostrof — cegah Sheets memotong nol di depan)

**TEXT_COLS lama (JANGAN diubah, tetap dipakai):**

```js
var TEXT_COLS = ['C', 'J', 'K', 'L', 'R', 'Y', 'AH', 'AR', 'AF', 'AO', 'AY', 'BD', 'BE', 'BG'];
// C=PIN Wali, J=NISN, K=NIK, L=No KK, R=No KIP, Y=NIK Ayah, AH=NIK Ibu, AR=NIK Wali,
// AF=No HP Ayah, AO=No HP Ibu, AY=No HP Wali, BD=RT, BE=RW, BG=Kode Pos
```

**Tambahan baru (3 kolom):**

| Huruf | Kolom | Alasan |
|---|---|---|
| CL | 90 — NIS Lokal | Nomor induk; bisa berangka nol di depan / berformat angka |
| CM | 91 — No KKS | Nomor kartu; wajib utuh apa adanya |
| CN | 92 — No PKH | Nomor kartu; wajib utuh apa adanya |

**TEXT_COLS baru (lengkap, untuk ditempel):**

```js
var TEXT_COLS = ['C', 'J', 'K', 'L', 'R', 'Y', 'AH', 'AR', 'AF', 'AO', 'AY', 'BD', 'BE', 'BG', 'CL', 'CM', 'CN'];
```

**Tidak masuk TEXT_COLS:** Email Siswa (bukan angka), Koordinat Alamat (mengandung
koma/titik desimal — format teks `@` akan merusak parsing bila dipaksa; simpan
sebagai teks biasa lewat helper `t()` TIDAK perlu — nilai koordinat bukan angka
murni), Total Gabungan Penghasilan (teks bebas berawalan `Rp`), semua kolom
dropdown/checkbox (nilai kata, bukan angka).

## 3. Pemetaan field form → nama header

Sumber nilai: objek `RegistrationRecord` dari frontend (`lib/types.ts` — field baru
area 5). Pemetaan ini dipakai di `buildRow()` (backend) dan di pemetaan kirim
frontend (`lib/storage.ts` — dikerjakan pekerja backend/koordinator).

| Field form (types.ts) | Header Sheet | Catatan |
|---|---|---|
| `student.kewarganegaraan` | Kewarganegaraan (76) | Wajib; `WNI`/`WNA` |
| `student.agama` | Agama (77) | Wajib |
| `student.hobi` | Hobi (78) | `''` bila kosong |
| `student.citaCita` | Cita-cita (79) | `''` bila kosong |
| `student.yangMembiayaiSekolah` | Yang Membiayai Sekolah (80) | Wajib |
| `student.praSekolahTkRa` | Pra Sekolah TK/RA (81) | `true` → `Ya`, selain itu `''` |
| `student.praSekolahPaud` | Pra Sekolah PAUD (82) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiHepatitisB` | Imunisasi Hepatitis B (83) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiPolio` | Imunisasi Polio (84) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiBcg` | Imunisasi BCG (85) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiCampak` | Imunisasi Campak (86) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiDpt` | Imunisasi DPT (87) | `true` → `Ya`, selain itu `''` |
| `student.imunisasiCovid` | Imunisasi Covid (88) | `true` → `Ya`, selain itu `''` |
| `student.emailSiswa` | Email Siswa (89) | `''` bila kosong |
| `student.nisLokal` | NIS Lokal (90) | Lewat helper `t()` (TEXT_COLS CL) |
| `student.nomorKks` | No KKS (91) | Lewat helper `t()` (TEXT_COLS CM) |
| `student.nomorPkh` | No PKH (92) | Lewat helper `t()` (TEXT_COLS CN) |
| `parent.ayah.kewarganegaraan` | Kewarganegaraan Ayah (93) | `''` bila kosong |
| `parent.ibu.kewarganegaraan` | Kewarganegaraan Ibu (94) | `''` bila kosong |
| `parent.wali.kewarganegaraan` | Kewarganegaraan Wali (95) | `''` bila kosong / bila tidak ada wali |
| `parent.statusWali` | Status Wali (96) | `''` bila kosong |
| `parent.penghasilanGabungan` | Total Gabungan Penghasilan (97) | `''` bila kosong |
| `address.statusKepemilikanRumah` | Status Kepemilikan Rumah (98) | `''` bila kosong |
| `address.statusTempatTinggal` | Status Tempat Tinggal (99) | `''` bila kosong |
| `address.jarakKeMadrasah` | Jarak ke Madrasah (100) | `''` bila kosong |
| `address.transportasiKeSekolah` | Transportasi ke Sekolah (101) | `''` bila kosong |
| `address.waktuTempuh` | Waktu Tempuh (102) | `''` bila kosong |
| `address.koordinatAlamat` | Koordinat Alamat (103) | `''` bila kosong |
| `documents.kks` (file) | Link KKS (104) | Upload via `saveFileToDrive` seperti Link lain; `''` bila tidak ada |
| `documents.pkh` (file) | Link PKH (105) | Upload via `saveFileToDrive` seperti Link lain; `''` bila tidak ada |

**Perubahan terkait di luar kolom (untuk pekerja backend/koordinator, bukan area 5):**
- `buildRow()` di `Code.gs` + `lib/gas-generator.ts`: tambah 30 nilai di AKHIR
  baris, urutan sama dengan tabel §1; validasi header tab lama tetap jalan.
- `lib/storage.ts` (pemetaan kirim): kirim 30 field baru ke `doPost`
  `saveRegistration` — field kosong dikirim sebagai string kosong.
- Validasi backend: tolak bila 3 kolom wajib (76, 77, 80) kosong — selaras
  dengan validasi form Langkah 1. Kolom opsional kosong TIDAK BOLEH
  menyebabkan penolakan.
- Upload KKS/PKH mengikuti pola Link lain (max 2MB, pdf/jpg/png; gagal upload
  mengikuti penanganan yang sudah ada — jangan diam-diam sukses bila file
  wajib gagal; kedua file ini opsional, jadi gagal upload = sel kosong +
  catatan, bukan gagal submit — keputusan akhir di koordinator).
- Nilai dropdown Pendidikan/Pekerjaan/Penghasilan lama yang tersimpan di
  localStorage (opsi lama, mis. `SD / MI`, `Rp1.000.000 - 2.000.000`) TIDAK
  dikonversi otomatis; form baru memakai opsi EMIS — record lama yang diedit
  ulang akan diminta memilih ulang opsi tersebut.

## 4. Yang TIDAK berubah

- 75 header lama (kolom 1–75): nama & urutan tetap.
- TEXT_COLS lama: tetap, hanya ditambah CL/CM/CN.
- Biaya Rp183.000, pendaftaran gratis tanpa token, login No HP + PIN 6 digit,
  validasi usia lahir ≤ 2021-07-01, URL GAS kanonis V1, Spreadsheet ID
  `1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4` — semua tidak disentuh area 5.
- Nomor WA dan nilai PIN tidak diubah.
