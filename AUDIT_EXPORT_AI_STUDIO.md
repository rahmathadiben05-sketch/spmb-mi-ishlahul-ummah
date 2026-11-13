# Audit Export AI Studio — Smart Madrasah SPMB

Tanggal audit: 2026-11-09 (23:09 WIB). File: `smart-madrasah-spmb.zip` (836 KB, 83 file).
Lokasi hasil ekstrak: `workspace/spmb-mi-ishlahul-ummah/export-aistudio/`
Status: **belum diperbaiki apa pun** — laporan ini dulu, perbaikan menunggu jawaban Rahmat.

## Kabar baik dulu

- **Build lolos.** `npm install` (953 package, ~5 mnt) + `npm run build` berhasil, 0 error TypeScript.
  Rute: `/`, `/admin`, `/informasi-pendaftaran`, `/api/wilayah`, `/api/informasi-pendaftaran`.
- Aplikasi lengkap secara tampilan: landing, wizard 4 langkah + review, dashboard wali murid,
  dashboard admin + CMS, cetak bukti & formulir resmi, token, gelombang, tahun ajaran.
- Validasi form client-side sudah lumayan: NIK & No KK harus 16 digit, KK/akta wajib upload,
  ijazah TK kondisional-wajib, file maks 2 MB + kompresi gambar otomatis.
- Seed data bersih: `DEFAULT_TOKENS = []`, `DEFAULT_REGISTRATIONS = []` (tidak ada data dummy pendaftar).

## Temuan kritis

### 1. Data pendaftar TIDAK masuk ke Google Sheets — hanya tersimpan di browser pendaftar
- Semua data (`lib/storage.ts`) disimpan di `localStorage` browser: `spmb_registrations_list`,
  `spmb_tokens_list`, `spmb_school_settings`, dst.
- Kirim ke Sheets hanya lewat `syncRegistrationToWebhook()` — dan itu **opsional + fire-and-forget**:
  `app/page.tsx:371-373` memanggilnya lalu `.catch(() => {})`, tanpa retry, tanpa pemberitahuan gagal.
  URL webhook default kosong (`googleAppScriptUrl: ''`), jadi saat ini **tidak ada satu pun data yang terkirim ke mana-mana**.
- Akibatnya: admin yang buka dashboard dari laptop/HP lain melihat data **kosong**. Data pendaftar hanya ada
  di HP/laptop pendaftar itu sendiri. Kalau browser dibersihkan, data hilang.
- Ini bertentangan langsung dengan keputusan Rahmat: data hanya ke Sheets, 1 file, 1 tab per tahun ajaran.

### 2. Ada DUA backend Apps Script yang saling bertentangan — keduanya belum terpasang
- **Bawaan AI Studio** (`lib/gas-generator.ts`): menulis ke 3 sheet tetap — `Data Pendaftaran`,
  `Master Token`, `Log Aktivitas` — bukan tab per tahun ajaran. Headernya hanya 30 kolom dan banyak
  field formulir hilang: NIK & pendidikan/penghasilan orang tua, status hidup orang tua, data wali,
  RT/RW/kode pos, anak ke-, jumlah saudara, KIP, semua file upload, rincian biaya, hasil observasi.
  `DRIVE_FOLDER_ID` di-config tapi tidak pernah dipakai — file KK/akta tidak pernah sampai ke Drive.
  Protokolnya `{ action: 'saveRegistration', data: {...record bersarang...} }`.
- **Draft Muse 2026-11-09** (`workspace/spmb-mi-ishlahul-ummah/Code.gs`): 1 file, tab otomatis per tahun
  ajaran (`2027-2028`), tapi `FORM_FIELDS` masih kosong dan `SPREADSHEET_ID` masih placeholder.
  Protokolnya JSON datar — **tidak cocok** dengan payload bersarang dari export AI Studio.
- Keputusan yang dibutuhkan: pakai desain 1 file/tab per tahun (Code.gs) dan buang generator AI Studio,
  lalu samakan format payload-nya. Perlu Spreadsheet ID dari Rahmat (atau saya buatkan file baru).

### 3. Keamanan: login admin & wali murid praktis terbuka
- **`/admin` (app/admin/page.tsx:56):** PIN hardcode `123456`, `admin123`, `admin`, `ishlahulummah` —
  dan halaman loginnya sendiri menampilkan tombol isi-otomatis `123456` / `admin123` (baris 202–213).
- **Modal login admin dari landing (`components/admin/AdminLoginModal.tsx:36-43`):** lebih parah —
  username + password apa pun diterima, tanpa pengecekan sama sekali, langsung `onLoginSuccess('admin')`.
- **Role admin hanya flag localStorage** (`spmb_user_role`): siapa pun bisa set `localStorage` lewat DevTools
  dan langsung jadi admin.
- **Login wali murid (`lib/storage.ts:772-780`):** PIN master `123456` / `admin123` bisa membuka **akun
  pendaftar mana pun**; NIK anak juga bisa dipakai sebagai password — padahal NIK tercantum di KK yang
  sering difotokopi/diserahkan ke banyak pihak. PIN pendaftar juga tampil di dashboard admin.
- **Audit log palsu:** IP selalu `127.0.0.1 (Cloud Preview)` — tidak ada jejak pelaku yang sebenarnya.
- Catatan jujur: dengan arsitektur Sheets-only + tanpa server login, keamanan "kuat" tidak bisa penuh
  dari client-side saja. Perbaikan realistis: hapus semua PIN hardcode & tombol isi-otomatis, ganti PIN
  admin dengan yang hanya Rahmat yang tahu, cabut master PIN & login via NIK, dan kunci halaman admin
  lewat deployment (mis. Vercel password protection / hanya dari akun Google madrasah) bila memungkinkan.

### 4. Sistem token tidak jalan — pendaftaran bisa langsung tanpa token
- `TokenValidationCard` tidak pernah dipakai di halaman mana pun; `validateTokenCode` hanya dipanggil
  dari dalam `lib/storage.ts` tapi tidak dari alur pendaftaran.
- `ApplicantAccessCard.tsx:86-87` langsung membuat nomor pendaftaran + PIN sendiri, tanpa cek token.
  Padahal syarat pendaftaran & FAQ menyebut "wajib memiliki Token resmi" dan ada fitur generate token
  di admin + `bulkGenerateTokens` di GAS. Jadi saat ini token = pajangan.

### 5. Bug logika duplikasi: adik-kakak dari satu KK akan ditolak
- `checkDuplication()` (`lib/storage.ts:699-728`, dipakai `WizardStep1.tsx:41,85`) menolak bila
  **No KK sudah terdaftar** — padahal kakak-beradik serumah memakai No KK yang sama. Pendaftar kedua
  dari keluarga yang sama akan mentok di Langkah 1 dengan pesan "Nomor KK sudah terdaftar".
  Yang benar: duplikat hanya dari NIK anak (dan NISN bila ada), bukan No KK.

### 6. Nomor pendaftaran bisa dobel / dipakai ulang
- `generateRegistrationNumber()` menghitung `jumlah pendaftar tahun itu + 1` dari localStorage.
  Dua pendaftar di dua browser berbeda bisa dapat nomor sama; hapus satu pendaftar lalu daftar lagi
  = nomor lama dipakai ulang. Penomoran yang aman harus di sisi server (Apps Script: nomor = baris
  terakhir sheet + 1, atau counter di sheet).

### 7. Inkonsistensi biaya — tiga angka berbeda untuk "biaya pendaftaran"
- `settings.biayaPendaftaran = Rp250.000` (FAQ menampilkannya sebagai "biaya formulir resmi").
- Rincian resmi (`lib/storage.ts` + `app/api/informasi-pendaftaran/route.ts`): administrasi
  Rp183.000 (formulir 100rb + rapor 70rb + tabungan 7rb + SPP 6rb) — "wajib dilunasi dahulu".
- Per gelombang: Gel. 1 Rp250.000, Gel. 2 Rp300.000, Prestasi Rp200.000.
- Total perlengkapan: perempuan Rp550.000, laki-laki Rp498.000 (sudah termasuk 183rb).
- Perlu dipastikan angka mana yang benar sebelum go-live, karena wali murid akan melihat ketiganya.

### 8. Data dummy / placeholder yang masih tampil ke publik
- No WA `081234567890` di semua tempat: `lib/storage.ts:126,208`, tombol WA landing/FAQ, KOP surat.
  Email `ishlahulummahmi@gmail.com` — mohon konfirmasi apakah ini email resmi yang benar.
- Belum terverifikasi (mohon konfirmasi): NSM `111235150099`, NPSN `20584321`, Kepala Madrasah
  `H. Ahmad Zainuddin, M.Pd.I`, NIP `197805122005011003`, alamat "Pranti, Sedati, Sidoarjo 61253".
- Logo & brosur digital kosong (`logoMadrasahUrl: ''`, `brosurDigitalUrl: ''`); tidak ada folder `public/`.
- Default isian form orang tua sudah terisi ("S1", "Karyawan Swasta", "Rp3.000.000 - 5.000.000",
  "Ibu Rumah Tangga") — berisiko terkirim kalau wali murid tidak menggantinya.

### 9. Validasi umur tidak ada, padahal FAQ menjanjikan aturan umur
- FAQ menyebut aturan Kemenag: kelas 1 MI usia 7 tahun, minimal 6 tahun per 1 Juli tahun ajaran berjalan.
  Tapi `WizardStep1` hanya mengecek tanggal lahir terisi — tidak ada pengecekan umur sama sekali.

### 10. Upload dokumen: tersimpan sebagai base64 di localStorage — akan penuh & tidak terkirim
- KK/akta/foto diubah jadi data URL base64 lalu disimpan di `localStorage` (kuota browser ±5 MB).
  Beberapa pendaftar dengan foto KK/akta sudah bisa membuat penyimpanan penuh; `storage.ts:433-501`
  memang punya penanganan quota, tapi ujungnya data gagal simpan / terpotong.
- File-file itu tidak pernah sampai ke Sheets maupun Drive. Opsi: (a) upload ke folder Google Drive
  via Apps Script (butuh folder ID + field upload di GAS), atau (b) verifikasi manual saat observasi
  dan upload hanya jadi pratinjau sementara (bukan arsip).

### 11. Hal-hal kecil / kebersihan kode
- Dependensi tak terpakai: `@google/genai` (tidak ada satu pun pemanggilan Gemini di kode),
  `firebase-tools` (tidak ada config Firebase). README/`.env.example` minta `GEMINI_API_KEY`,
  `metadata.json` mengklaim kemampuan Gemini server-side — semuanya tidak dipakai.
- `next.config.ts`: `eslint.ignoreDuringBuilds: true` (lint dimatikan saat build) + remote image
  `picsum.photos` (placeholder) masih diizinkan.
- `eslint-config-next 16.0.8` vs `next 15.4.9` — versi tidak selaras (build tetap lolos).
- API wilayah memakai API publik `emsifa/api-wilayah-indonesia` via jsDelivr/GitHub/raw — berfungsi,
  tapi data wilayah bergantung ke repo pihak ketiga (ada fallback 3 mirror + cache).
- `app/api/informasi-pendaftaran/route.ts` membaca cookie sesi wali murid (base64 JSON mentah di cookie,
  tanpa signature) — sesi bisa dipalsukan dari browser.

## Yang TIDAK rusak
- Build & typecheck lolos; tidak ada file hilang (semua import `@/...` ketemu); tidak ada TODO/FIXME.
- Struktur form sudah cukup dekat dengan kebutuhan EMIS: siswa (NIK, NISN, KIP, asal TK/RA/SD),
  ayah/ibu/wali (NIK, pendidikan, pekerjaan, penghasilan, status hidup), alamat 4 tingkat + RT/RW/kode pos.
- Yang belum ada di form (kandidat tambahan EMIS, perlu konfirmasi): agama, kewarganegaraan,
  tempat tinggal (bersama orang tua/wali/asrama), moda transportasi, jarak ke madrasah,
  berkebutuhan khusus/disabilitas, status yatim/piatu (saat ini hanya tersirat dari status orang tua).

## Perbaikan 2026-11-09 (jawaban Rahmat atas 8 pertanyaan, 23:25 WIB)

1. **WA belum resmi** (nomor `081234567890` tetap placeholder); **email `ishlahulummahmi@gmail.com` benar**.
2. **Biaya benar Rp183.000** (rincian administrasi) — `settings.biayaPendaftaran` dan biaya ketiga gelombang disamakan ke 183000.
3. **Bebas daftar langsung (tanpa token)** — syarat token dihapus; login wali = **No. HP ayah/ibu + PIN 6 digit**. NIK sebagai password dan PIN master dicabut.
4. **Backend baru disetujui** — Spreadsheet baru dibuat: "SPMB MI Ishlahul Ummah - Database Pendaftaran" (`1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4`, pemilik rahmathadiben17@gmail.com), tab `2027-2028` + 75 header, dibekukan + tebal. Folder Drive: "SPMB MI Ishlahul Ummah - Dokumen Pendaftar" (`1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua`). **Penyelarasan EMIS ditunda** — Rahmat akan mengarahkan pengecekan ke website EMIS akun sekolah; kolom baru tinggal ditambah di `Code.gs` (HEADERS + buildRow).
5. **PIN ikut arahan lama Rahmat** — nilai admin `123456`/`admin123` dipertahankan (tanpa tombol isi-otomatis, tanpa PIN alternatif `admin`/`ishlahulummah`); modal login admin kini benar-benar mengecek PIN; PIN wali tetap 6 digit hasil generate. Catatan: PIN client-side hanya pintu gerbang, bukan keamanan penuh.
6. **Kepala Madrasah: Astutik, S.Pd; NSM 111235150097; NPSN 60717039** (NIP dikosongkan — belum diberikan). Diterapkan di settings + KOP + migrasi pengaturan lama di browser.
7. **Dokumen ke Drive: ya** — `Code.gs` mengunggah KK/akta/dll ke folder Drive, Sheet hanya menyimpan link.
8. **Field EMIS tambahan tidak perlu, kecuali kebutuhan khusus** — field `kebutuhanKhusus` ditambahkan (types, WizardStep1, WizardReview, PrintableFormulirResmi, header Sheet kolom ke-20).

**Perbaikan lain yang ikut dikerjakan:** duplikat No KK dihapus (hanya NIK/NISN); penomoran dari server (LockService, `MIIU/SPMB/2027/0001`); submit menunggu sync dan menampilkan peringatan kuning bila gagal kirim ke Sheets; isian default orang tua dikosongkan (dropdown kini wajib pilih); `gas-generator.ts` diganti isinya dengan Code.gs v2 yang sama; PIN default `123456` tidak lagi tampil di dashboard admin.

**Verifikasi:** `npm run build` lolos (exit 0, 5 rute); `Code.gs` lolos `node --check`, header 75 = baris 75.

**MASIH MENGGANTUNG (23:36 WIB):** ~~Deploy Apps Script terhenti di verifikasi dua langkah~~ — **SELESAI, lihat "Deploy & verifikasi 2026-11-10" di akhir file.**

## Rencana perbaikan yang diusulkan (setelah jawaban Rahmat)
1. **Kritis — keamanan:** hapus PIN hardcode + tombol isi-otomatis, hapus login admin tanpa cek,
   cabut master PIN & login via NIK, ganti PIN admin.
2. **Kritis — backend Sheets:** satukan ke 1 Code.gs (tab per tahun ajaran), samakan payload form →
   GAS, pasang Spreadsheet ID + deploy Web App, uji kirim 1 pendaftar dummy sampai muncul di sheet.
3. **Kritis — duplikasi & penomoran:** No KK tidak lagi penanda duplikat; nomor pendaftaran dari server.
4. **Fungsional:** putuskan nasib token (wajib / hapus), tambah validasi umur, samakan angka biaya,
   ganti kontak dummy dengan nomor WA resmi, isi logo/brosur.
5. **Arsip dokumen:** putuskan Drive vs verifikasi manual saat observasi.
6. **Bersih-bersih:** hapus dependensi & config Gemini/Firebase yang tak terpakai, nyalakan lint saat build.

## Deploy & verifikasi 2026-11-10 (SELESAI, 05:27 WIB)

**Jalannya deploy (semua sebagai rahmathadiben17@gmail.com):**
- Extensions > Apps Script dari spreadsheet baru selalu 404, jadi dipakai proyek Apps Script standalone `1O3pfIcjZmBQdofBeFR-MnTr-vckh5etWbHCUkA6ZkssZeMyrbQJMMhaT`. Code.gs v2 ditempel (451 baris, tanpa error sintaks).
- Otorisasi sempat macet di layar Google "aplikasi belum terverifikasi" + redirect callback 404 + halaman google.com/sorry; selesai setelah Rahmat klik "Go to Untitled project (unsafe)" ~00:02 WIB.
- Dua deployment Web App aktif (Execute as Me, Anyone): **V1** "SPMB MI Ishlahul Ummah v2" (Muse, 00:03, `AKfycbyA-VnOSLft5hrhhWyWaVQV8TaXzKmxKF4xoq1T0dDyqxY7ArQT7uYuVXX0on6_C1Wt`) — URL kanonis — dan **V2** "SPMB MI ISHLAHUL UMMAH " (dibuat Rahmat sendiri, 00:13, `AKfycbxyxRg__glikh0v_EtlhOo-lCHRHq-wI5NvwkaGjjQjnW2AWdln1GMc5CdXTZCvkjUp`). Authuser=2 terkonfirmasi sebagai rahmathadiben17@gmail.com.
- `GET ?action=ping` via curl: HTTP 200 `{"success":true,...}` untuk kedua deployment (404 /exec di browser hanya artefak sesi). POST dari VM ini menggantung di transport (0 byte, termasuk POST langsung ke googleusercontent) — jalur POST `doPost` belum teruji dari browser sungguhan; yang teruji: GET ping + logika simpan via editor.

**Cacat nol-depan (ditemukan dari baris dummy pertama):** Sheets memotong nol depan — No HP `081200000001` tersimpan `81200000001`, RT `01`→`1`, PIN `012345`→`12345`. Perbaikan v2.1 (format plain-text `@` saja) TERNYATA TIDAK bekerja karena `appendRow` memakai USER_ENTERED. **v2.2 (helper `t()` = prefix apostrof pada 14 kolom teks) TERVERIFIKASI bekerja** — PIN `012345`, HP `081200000001`, RT `01`/`02` utuh; API membaca kembali tanpa apostrof, jadi cek duplikat NIK tetap jalan. Deployment V1 di-update ke Version 3 (v2.1, 05:06) lalu Version 4 (v2.2, 05:12), URL /exec tetap.

**Uji simpan (via editor, data "TEST DUMMY HAPUS"):** 2x berhasil — nomor server `MIIU/SPMB/2027/0001` lalu `0002` (penomoran melanjutkan setelah baris tes dihapus), file KK/akta masuk Drive dan link tersimpan di Sheet, log tercatat. Semua data tes sudah dibersihkan: 2 baris dummy + 2 baris log + 4 file Drive di-Trash; tab `Sheet1` kosong dihapus. Spreadsheet duplikat yang sempat terbuat salah (`SPMB MI ISHLAHUL UMMAH`, `11sKTZKjyvqDT4h-8K0DX_Ec8kdfJOGRzTNNiEjp8aPM`) sudah di-Trash — JANGAN dipakai.

**Penyelesaian di aplikasi:** URL /exec V1 diisi ke `DEFAULT_SETTINGS.googleAppScriptUrl` + migrasi di `lib/storage.ts`; `lib/gas-generator.ts` diregenerasi dari Code.gs v2.2 kanonis; salinan lokal `Code.gs` disinkronkan ke v2.2 persis (488 baris, `node --check` lolos). `npm run build` LOLOS (exit 0, 5 rute).

**Sisa / catatan:**
- Satu uji kirim nyata dari browser/HP Rahmat tetap disarankan setelah situs tayang (untuk menguji jalur POST `doPost` dari browser sungguhan).
- Validasi umur (audit item 9) belum dikerjakan — tidak diminta.
- Nomor WA masih placeholder `081234567890` (belum resmi); NIP kepala madrasah masih kosong.
- Penyelarasan EMIS masih ditunda (menunggu arahan Rahmat ke website EMIS akun sekolah).

## Validasi usia + deploy v2.3 (2026-11-10, selesai 06:15 WIB)

**Keputusan Rahmat (05:37 WIB):** calon santri kelas 1 minimal sudah berusia 6 tahun per 1 Juli 2027 (lahir paling lambat 1 Juli 2021). Diterapkan di: Langkah 1 formulir (validasi + `max="2021-07-01"` pada input tanggal + keterangan), pengaman akhir saat submit (banner merah + kembali ke Langkah 1), daftar syarat, FAQ (jawaban lama soal aturan umum 5,5–7 tahun diganti aturan sekolah), dan backend.

**Backend v2.3 (500 baris):** cek usia di `saveRegistrationRecord` setelah validasi NIK/nama/No KK, sebelum cek duplikat — `dob > '2021-07-01'` ditolak dengan pesan usia. V1 di-deploy ke **Version 5** (06:06 WIB), URL /exec tetap. Uji editor (CARA B): DOB 2020-01-15 → sukses `MIIU/SPMB/2027/0001` (PIN 012345, HP 081200000001, RT 01/RW 02 utuh, diverifikasi independen via API); DOB 2022-06-15 (NIK ...0005) → ditolak dengan pesan usia persis, tanpa baris tertulis. Data uji dibersihkan (baris + log + 2 file Drive di-Trash); ping V5 HTTP 200. Catatan: editor menampilkan kode berakhir di baris 501 (satu baris kosong ekstra dari proses tempel — tidak berpengaruh; salinan lokal tetap 500 baris, `node --check` lolos; `lib/gas-generator.ts` diregenerasi dari v2.3, build lolos).

**Insiden rute deploy:** pekerja sempat mengambil jalan memutar (proyek Apps Script bantuan + upload Code.txt ke Drive) sehingga Google meminta verifikasi HP angka 79 — Rahmat sudah mengetuk sebelum membaca pesan (tidak berbahaya: hanya verifikasi identitas akun sendiri). Rute itu dihentikan: pekerja TIDAK klik Allow di layar persetujuan, proyek bantuan + Code.txt sudah di-Trash (terverifikasi). Kode v2.3 akhirnya ditempel langsung dari teks lengkap yang diberikan Muse (file lampiran tidak bisa dibuka langsung di browser pekerja). Pelajaran: untuk deploy berikutnya, sertakan teks kode lengkap di instruksi sejak awal.

**Redesain (05:57 WIB):** threeui.com adalah galeri komponen Three.js (gelap, efek 3D berat) — efeknya TIDAK dipakai (berat di HP orang tua); yang diambil bahasa desainnya: judul serif Fraunces, isi Plus Jakarta Sans (Inter dibuang), tanpa gradasi sama sekali (disapu dari 33 file), warna datar hijau pekat #065F46 + krem #F7F4EC + emas #B45309, sudut lebih tegas, bayangan netral, motif geometris diperkuat + motif-band di bawah hero. Build lolos.

## Deploy preview Vercel (2026-11-10, selesai 06:27 WIB)

**Login CLI:** percobaan pertama gagal "fetch failed" (bukan jaringan — vercel.com dan api.vercel.com merespons normal via curl). Percobaan kedua memakai PTY (`script -qec`) berhasil mengeluarkan device-code flow. Kode pertama SLXM-KVSV tidak sempat diotorisasi (Rahmat mencoba tapi belum berhasil); kode kedua FRMP-VSXN berhasil — Rahmat sign up + authorize 06:23 WIB, CLI login sebagai `rahmathadiben17-8754` (akun Vercel dari rahmathadiben17@gmail.com).

**Deploy:** `npx vercel --yes` dari `export-aistudio/` (tanpa `--prod`). Build di Vercel: `next build` sukses 12,7 detik. URL: https://export-aistudio.vercel.app (HTTP 200, 102 KB, judul "SPMB Online - Penerimaan Murid Baru Terpadu Madrasah Ibtidaiyah") + URL unik deployment https://export-aistudio-mtisqr2zc-mi-ishlahul-ummah.vercel.app (302 ke URL utama). Catatan: deploy pertama otomatis dijadikan production oleh Vercel. Nama proyek "export-aistudio" (ikut nama folder) — bisa diganti di dashboard (Settings) bila diinginkan; URL ikut berubah.

**Belum teruji:** satu kiriman nyata dari browser Rahmat di URL preview (jalur POST doPost dari browser asli — POST dari VM ini menggantung di level transport, jadi hanya bisa dibuktikan dari browser/HP Rahmat). Bila ia mengisi data tes, bersihkan baris + log + file Drive-nya supaya penomoran produksi tetap mulai 0001.

## Cacat header kolom 75 — ditemukan saat uji kirim pertama Rahmat (2026-11-10 22:50 WIB)

**Gejala:** pendaftaran tes Rahmat dari HP ditolak backend dengan pesan: header kolom ke-75 tab "2027-2028" tidak sesuai (ditemukan "Catatan Paniti", seharusnya "Catatan Panitia"). Frontend menampilkan layar "Pendaftaran Belum Terkirim ke Panitia" + nomor sementara lokal MIIU/SPMB/2027/0001 + tombol "Kirim Ulang" / "Perbaiki Data". Tidak ada baris tertulis — pengaman header bekerja sesuai desain.

**Akar masalah:** saat tab "2027-2028" pertama kali dibuat (uji editor v2), kode yang ditempel memakai ejaan "Catatan Paniti" di HEADERS[74] — satu huruf "a" hilang. Uji editor v2/v2.1/v2.2 lolos karena kode saat itu mengharapkan ejaan yang sama (typo yang konsisten). v2.3 (dari salinan lokal yang benar) mengharapkan "Catatan Panitia", sehingga cek header menolak. Selain itu tab masih 75 kolom, sementara HEADERS kini 106 kolom (31 kolom EMIS 4.0 ditambahkan 2026-11-10).

**Perbaikan (22:52 WIB):** sel BW1 dikoreksi menjadi "Catatan Panitia" lewat Sheets API (1 sel, terverifikasi ulang). Tidak perlu redeploy: kiriman berikutnya akan menjalankan logika migrasi di `checkYearSheetHeaders` (tab lama = awalan persis HEADERS → 31 kolom EMIS ditambahkan otomatis ke baris 1, lalu penulisan diizinkan). Verifikasi: tab 2027-2028 dan Log Aktivitas masih header-only (1 baris) — penolakan tidak menulis apa pun.

**Tindak lanjut:** Rahmat mengetuk "Kirim Ulang" di HP-nya; setelah berhasil, verifikasi baris + file Drive lewat API, lalu bersihkan data tes (baris + log + file) supaya penomoran produksi tetap mulai 0001.

## Perapian halaman admin (2026-11-10 23:09–23:2x WIB, disetujui Rahmat)

**Keluhan Rahmat:** penataan pengaturan di halaman admin membingungkan. Setelah membaca kode, Muse setuju — penyebab konkret: 12 menu sejajar tanpa kelompok; "pengaturan" tersebar di 5 tempat (Profil, CMS, Tahun Ajaran, Biaya, Integrasi); NSM/NPSN tidak bisa diubah di Pengaturan (hanya sebagai teks bebas di KOP); modal Rincian Biaya & Dashboard Wali bisa dibuka dari 2-3 tempat; tombol Simpan tiap tab CMS sebenarnya menyimpan SEMUA tab; seksi Generator Voucher Token legacy masih tampil padahal pendaftaran sudah gratis.

**Perubahan (UI-only, tanpa perubahan alur data):**
1. Sidebar dikelompokkan berlabel: Operasional Harian (Ringkasan, Akun Wali & PIN, Data Pendaftaran, Verifikasi, Pengumuman, Grafik); Pengaturan SPMB (Tahun Ajaran & Gelombang, Rincian Biaya & Info, Pusat CMS & Teks, Pengaturan Madrasah, Integrasi Webhook); Sistem (Log Aktivitas & Audit).
2. Form Profil Madrasah dilengkapi isian NSM, NPSN, Email, Alamat (semuanya sudah ada di tipe SchoolSettings + dipakai halaman publik/cetak; tersimpan lewat handler yang sama) + petunjuk di mana tiap angka biaya tampil.
3. Kartu ganda Rincian Biaya & Dashboard Wali di tab Pengaturan diganti kotak penanda yang menunjuk ke menu yang benar.
4. Seksi Generator Voucher Token legacy dihapus dari tab Akun Wali & PIN (state + import terkait dibersihkan; data layer token dibiarkan).
5. Tombol Simpan CMS dilabeli "Simpan Semua Teks CMS" + catatan bahwa satu simpan berlaku untuk semua tab; teks toast disesuaikan.
Build lolos, deploy production Vercel 23:2x WIB, verifikasi live: /admin HTTP 200, string baru ada di bundle JS, "Generator Voucher Token" sudah tidak ada. ZIP final diregenerasi.
