# Audit Bidang 3 — Website / Alur Orang Tua (SPMB MI Ishlahul Ummah)

**Tanggal:** 11 November 2026 (±09:10–09:45 WIB)
**Auditor:** Bidang 3 (subagent)
**Metode:** baca kode saja (read-only). Tidak ada kode diubah, deploy, kirim formulir, atau perubahan data Sheets. Tidak ada data pribadi siswa yang disalin/dilaporkan — laporan hanya menyebut nama field dan jumlah.
**Lingkup kode:** `~/workspace/spmb-mi-ishlahul-ummah/export-aistudio` (Next.js) — `app/page.tsx`, `components/landing/`, `components/wizard/`, `components/auth/`, `components/success/`, `components/print/`, `components/admin/UnifiedCmsCenter.tsx`, `components/admin/EditSectionModal.tsx`, `lib/storage.ts`, `lib/types.ts`, `lib/gas-generator.ts` (backend Apps Script, hanya untuk memverifikasi validasi sisi server).
**Cek live:** teks halaman publik `https://export-aistudio.vercel.app` dibaca lewat `browser.open` (hanya baca; konten client-rendered seperti countdown/kuota tidak muncul di hasil crawl teks).

## Ringkasan eksekutif

- **Alur inti berfungsi:** daftar → "Simpan PIN Anda" → wizard 1–4 → review → kirim → sukses; login WA/nomor + PIN 6 digit; dashboard wali; cetak bukti termasking. Validasi usia, NIK/KK, NISN/KIP, dan label "(Opsional)" untuk field KIP/KKS/PKH/Kebutuhan Khusus/Disabilitas/NISN/email siswa **semuanya lolos verifikasi satu per satu** (bagian §4).
- **Semua klaim perbaikan Prioritas 1/2/3 dari audit 10 Nov terverifikasi HIDUP di kode** (§6), kecuali satu yang kambuh sebagian (banner kartu akun masih menyebut nomor "resmi", N-M6).
- **Temuan baru: 2 Critical, 7 Major, 8 Minor.** Yang paling berat:
  1. **Cek Status bisa mengembalikan record anak lain** — login gate ada, tapi pencarian tidak dibatasi ke record milik sesi (N-C1).
  2. **Ubah PIN hanya lokal** — tidak tersinkron ke server dan `tokenCode` tidak ikut berubah, sehingga bukti cetak/review menampilkan PIN lama dan refresh server mengembalikan PIN lama (N-M2).
  3. **Aturan "satu WA = satu pendaftaran" hanya ditegakkan di localStorage** — backend tidak memeriksa duplikat WA (N-M1).
  4. **Diskon Early Bird dijanjikan saat server tak terjangkau**, dan diskon yang server nol-kan tidak dibaca frontend (N-M3).
  5. **Penyebut kuota hero memakai `kuotaTarget`** (field target dashboard) bukan total kursi 120 — berpotensi menampilkan "X dari 30 kursi" (N-M4).
- **Masih terbuka dari sebelumnya:** nomor WA resmi masih dummy `081234567890` (terverifikasi masih tampil di halaman live); tidak ada rate limit/lockout login PIN.

---

## 1. Temuan BARU — Critical

### N-C1 — Cek Status: wali yang login bisa melihat record anak lain (NIK/WA/nomor siapa pun)
- **Lokasi:** `components/interactive/StatusTrackerModal.tsx:96-114` (pencocokan), `:55-57` (gate sesi), `:69-90` (refresh memakai kredensial sesi).
- **Bukti:** Modal memang mewajibkan sesi wali (`if (!session)` → ajakan login, bukan kolom pencarian). Namun setelah login, `handleSearch` mencocokkan query ke **seluruh** `getRegistrations()` di perangkat — nomor pendaftaran, NIK anak 16 digit, No. WA lengkap, atau `tokenCode` — tanpa memeriksa apakah record itu milik sesi yang login. Hasilnya menampilkan nama anak, nama orang tua, NIK termasking, status verifikasi, dan hasil pengumuman record tersebut (`:300-340, :360-400`).
- **Dampak:** Privasi/kepercayaan. Wali mana pun yang login (sesi bahkan dibuat sejak pembuatan akun, sebelum formulir dikirim — `ApplicantAccessCard.tsx:367-380`) dan mengetahui NIK anak lain (tertera di KK yang umum diketahui keluarga besar) bisa mengintip status & pengumuman anak itu. Ini kelanjutan dari temuan audit lama "cek status tanpa login membocorkan data anak lain" — login gate sudah dipasang, tapi pembatasan ke record sendiri belum.
- **Usulan:** Batasi hasil pencarian hanya ke record yang nomor pendaftarannya / No. WA-nya cocok dengan sesi login; hapus pencocokan NIK dan WA lintas-record dari pelacak publik (NIK hanya dipakai sebagai verifikasi milik sendiri bila diperlukan). Idealnya pencarian memanggil `getRegistration` server dengan kredensial sesi, bukan menyaring cache lokal.

## 2. Temuan BARU — Major

### N-M1 — Cek duplikat WA hanya lokal; backend tidak memeriksa duplikat WA
- **Lokasi:** `components/auth/ApplicantAccessCard.tsx:189-216` (cek `getRegistrations()` + draft lokal saja); `lib/gas-generator.ts:1448-1500` (`saveRegistrationRecord` — hanya cek duplikat NIK/NISN, `findDuplicate`); `lib/gas-generator.ts:855+` (`createIndenRecord` — tidak ada cek WA).
- **Bukti:** Aturan "satu nomor WA = satu pendaftaran" (MEMORY.md) hanya ditegakkan terhadap data di browser itu. Pendaftar yang sama WA-nya dari perangkat/browser lain lolos dan tercatat dua baris di Sheets. Login berbasis WA memakai `.find()` pertama (`lib/storage.ts:1036-1046`) — pendaftaran kedua praktis tidak bisa diakses lewat login WA.
- **Dampak:** Data ganda; wali kebingungan (login masuk ke pendaftaran yang salah); beban admin membersihkan duplikat.
- **Usulan:** Tambah cek duplikat WA di backend (`saveRegistration` + `createInden`, di dalam lock seperti cek NIK) dengan pesan generik yang tidak membocorkan data; atau minimal tampilkan peringatan jujur di layar akun bila server tidak bisa memastikan.

### N-M2 — Ubah PIN hanya tersimpan lokal; `tokenCode` tidak ikut berubah → PIN lama hidup lagi
- **Lokasi:** `components/auth/WaliMuridDashboard.tsx:70-118` (`handleChangePin` hanya memanggil `updateRegistration` lokal + `setWaliMuridSession`); `lib/storage.ts:1210-1232` (`updateRegistration` — tulis localStorage saja, tanpa webhook); `components/print/PrintableBukti.tsx:119,269` (menampilkan `record.tokenCode` sebagai "PIN 6 Digit"); `components/wizard/WizardReview.tsx:279-283` (menampilkan `token.code` dari `record.tokenCode || record.pin`, `app/page.tsx:492-494`).
- **Bukti:** Setelah ganti PIN: (a) server tetap menyimpan PIN lama — login dari perangkat lain / setelah refresh memakai PIN lama; (b) `tokenCode` tidak diperbarui, jadi **Cetak Bukti dan halaman Review menampilkan PIN lama** sementara login memakai PIN baru; (c) `cacheServerRegistration` (`lib/storage.ts:2345-2365`) menimpa cache lokal dengan record server saat refresh — PIN baru hilang dan PIN lama kembali berlaku tanpa pemberitahuan.
- **Dampak:** Kepercayaan & keamanan. Wali mengira PIN sudah diganti padahal belum; bukti cetak berisi PIN yang salah.
- **Usulan:** Tambah action server `changePin` (verifikasi PIN lama di server, lalu update `pin` + `tokenCode` di Sheets), atau nonaktifkan Ubah PIN sampai ada endpoint-nya dan beri tahu wali untuk reset via panitia. Minimal: perbarui `tokenCode` bersama `pin` di `handleChangePin` dan beri label bahwa perubahan hanya berlaku di perangkat ini.

### N-M3 — Diskon Early Bird dijanjikan saat server tak terjangkau; diskon yang server nol-kan tidak dibaca
- **Lokasi:** `lib/storage.ts:1614-1637` (`hitungHargaGelombang`: "Bila sisa kuota tidak diketahui (undefined), diskon dianggap tersedia"); `components/auth/ApplicantAccessCard.tsx:103-120` (`fetchPublicStats` gagal → `sisaKuotaDiskon` tetap `undefined`, `catch () {}`); `components/landing/LandingHero.tsx:118-123,394-418` (pola sama di hero); `lib/gas-generator.ts` (`createIndenRecord`: guard kuota — `diskonDiberikan = 0` bila kuota habis, dan me-return `diskonDiberikan/sisaBayar/batasPelunasan`); `components/auth/ApplicantAccessCard.tsx:331-360` (frontend hanya membaca `res.data?.nomorPendaftaran`, mengabaikan tiga field balasan itu).
- **Bukti:** Offline/server lambat → kartu "Inden Kursi"/"Daftar Penuh" dan hero tetap menampilkan harga diskon Rp158.000 + "Harga Early Bird — diskon masih tersedia". Bila kuota sebenarnya sudah habis, server menol-kan diskon, tetapi record lokal (`indenData.diskonDiberikan = 25000`) dan dashboard tetap menampilkan diskon Rp25.000.
- **Dampak:** Janji harga yang salah; sengketa DP/sisa bayar dengan wali.
- **Usulan:** Bila `sisaKuotaDiskon` tidak diketahui, tampilkan harga normal dengan catatan "kuota diskon belum dapat dipastikan — hubungi panitia" (jangan tampilkan harga diskon); dan pakai `res.data.diskonDiberikan/sisaBayar` dari `createInden` untuk memperbarui record lokal.

### N-M4 — Penyebut "Kursi terisi X dari Y" memakai `kuotaTarget`, bukan total kursi 120
- **Lokasi:** `components/landing/LandingHero.tsx:252-264` (`{kuotaTerisi} dari {settings.kuotaTarget || 120} kursi` + lebar progress bar dari `kuotaTarget`); `lib/storage.ts:143` (default `kuotaTarget: 120`); `components/admin/AdminDashboard.tsx:528,561` (setiap simpan/aktivasi tahun ajaran menimpa `kuotaTarget = kuotaTotal`); `components/admin/AdminDashboard.tsx:1730-1732` (dashboard memakai `kuotaTarget` sebagai target progres).
- **Bukti:** Satu field dipakai untuk dua arti: target dashboard Rahmat (nilai 30, per MEMORY.md — "Target Kuota dashboard = 30 … kuota total kursi tahun ajaran = 120 (field berbeda, ay.kuotaTotal)") dan penyebut kursi hero. Bila `kuotaTarget` = 30, hero menampilkan "X dari 30 kursi" dan progress bar penuh di 30 pendaftar — padahal total kursi 120. Tidak ada input admin untuk `kuotaTarget`, dan nilainya bisa tertimpa diam-diam menjadi 120 setiap kali tahun ajaran disimpan.
- **Dampak:** Informasi kuota menyesatkan di halaman depan (urgensi palsu atau sebaliknya).
- **Usulan:** Hero memakai total kursi tahun ajaran aktif (`kuotaTotal` = 120) sebagai penyebut; `kuotaTarget` hanya untuk progres dashboard. **Butuh uji live oleh Rahmat:** angka penyebut yang tampil di hero saat ini (crawl teks tidak memuat konten client-rendered ini; verifikasi browser 05:15 WIB masih menunjukkan "1 dari 120 kursi", sebelum nilai 30 dikonfirmasi 08:36 WIB).

### N-M5 — Teks "Rp183.000" masih hardcode di rincian biaya (pola T-14 kambuh di tempat lain)
- **Lokasi:** `lib/storage.ts:48` (`catatanAdministrasi: '…sebesar Rp183.000 wajib dilunasi…'`) dan `:81` (`ketentuanPembayaran[0]` kalimat yang sama); `components/informasi/InformasiPendaftaranView.tsx:35` (membaca `rincianBiayaPendaftaran` apa adanya). Terkait: `app/api/informasi-pendaftaran/route.ts:13,51-52,59` (`OFFICIAL_BIAYA_DATA` hardcode total 183000 + teks Rp183.000).
- **Bukti:** Subtotal administrasi dihitung live dari item (`InformasiPendaftaranView.tsx:46-48`), jadi angka total mengikuti perubahan `biayaPendaftaran` — tetapi dua kalimat prose di atas tetap "Rp183.000" bila admin mengubah biaya. API route mengembalikan data biaya hardcode yang sama, meski saat ini **tidak dipakai komponen mana pun** (grep: tidak ada pemakaian `OFFICIAL_BIAYA_DATA` di luar route) — data mati yang akan divergen bila suatu saat disambungkan.
- **Dampak:** Sama seperti T-14: dua angka berbeda di satu tampilan bila biaya berubah.
- **Usulan:** Ganti kedua kalimat dengan placeholder `{biayaPendaftaran}` seperti FAQ, atau susun kalimat dari subtotal live; hapus/selaraskan `OFFICIAL_BIAYA_DATA` dengan settings (atau hapus route bila memang tidak dipakai).

### N-M6 — Banner kartu akun menyebut nomor "resmi" padahal nomor masih sementara
- **Lokasi:** `components/auth/ApplicantAccessCard.tsx:688-695` ("Sistem akan langsung mengarahkan Anda ke formulir 4 langkah dan menerbitkan **Nomor Registrasi + PIN Akses resmi**") vs `:604-617` (label benar: "Nomor Registrasi Sementara" + penjelasan "Nomor resmi Anda tertera di halaman sukses… nomornya bisa berbeda; PIN tetap sama").
- **Bukti:** Dua pesan bertentangan di alur yang sama — label layar PIN sudah diperbaiki (lihat §6), tetapi teks pembuka di atas formulir masih menjanjikan nomor resmi.
- **Dampak:** Wali mengira nomor di layar PIN adalah nomor final; risiko salah catat / gagal login dengan nomor sementara.
- **Usulan:** Ubah banner menjadi "…menerbitkan Nomor Registrasi sementara + PIN Akses Anda. Nomor resmi terbit setelah formulir dikirim."

### N-M7 — Tidak ada rate limit / lockout pada login PIN (masih terbuka)
- **Lokasi:** `lib/storage.ts:2366-2420` (`authenticateApplicantWithServer`), `:2270-2325` (`fetchServerRegistration`), `:1026-1060` (login lokal); tidak ada penghitung percobaan di frontend maupun backend (`getRegistration` di `lib/gas-generator.ts`).
- **Bukti:** PIN 6 digit (1 juta kombinasi, tanpa batas percobaan) dapat ditebak berulang dari browser mana pun; pesan gagal sudah generik (baik), tetapi tidak ada penundaan/pemblokiran.
- **Dampak:** Keamanan akun wali; sudah diketahui dari audit sebelumnya dan belum ditindaklanjuti.
- **Usulan:** Tambah rate limit + lockout sementara di backend `getRegistration` (mis. maks 5 percobaan salah per nomor per jam) dan jeda progresif di frontend.

## 3. Temuan BARU — Minor

### N-m1 — Dashboard tidak menampilkan hasil pengumuman
- **Lokasi:** `components/auth/WaliMuridDashboard.tsx` — `hasilPengumuman` 0 kemunculan; `statusLabel` (`:127-136`) hanya menampilkan status berkas (Terverifikasi / Menunggu Verifikasi / Perlu Perbaikan / Dalam Pengisian).
- **Dampak:** Wali yang lulus/tidak lulus tidak melihat hasilnya di dashboard; harus membuka "Lacak Status" (`StatusTrackerModal.tsx:360-400` yang menampilkan pengumuman).
- **Usulan:** Tambah kartu/banding pengumuman di dashboard bila `record.hasilPengumuman !== 'PENDING'`.

### N-m2 — Badge "Akun Terverifikasi" menyesatkan
- **Lokasi:** `components/auth/WaliMuridDashboard.tsx:239` (`cfg.verifiedBadge || 'Akun Terverifikasi'`).
- **Dampak:** Akun tidak pernah diverifikasi oleh siapa pun — badge hanya menandakan sudah login. Wali bisa mengira datanya sudah disahkan panitia.
- **Usulan:** Ganti default menjadi "Wali Murid Terdaftar" / "Akun Aktif".

### N-m3 — Kartu inden: sublabel "Diskon Early Bird" tetap tampil walau diskon Rp0
- **Lokasi:** `components/auth/WaliMuridDashboard.tsx:~437` (kotak "Diskon Didapat" selalu ber-sublabel "Diskon Early Bird" meski `inden.diskonDiberikan = 0`).
- **Usulan:** Tampilkan "Tidak ada diskon" bila nilainya 0.

### N-m4 — Halaman Review tidak menampilkan ringkasan inden
- **Lokasi:** `components/wizard/WizardReview.tsx` — 0 kemunculan kata "inden"; props tidak menerima `inden` (`app/page.tsx:1261-1280`).
- **Dampak:** Wali inden tidak melihat DP Rp50.000 / diskon / sisa bayar / batas pelunasan saat tinjau akhir sebelum menekan "KIRIM FORMULIR PENDAFTARAN" (hanya pernah melihatnya di layar "Simpan PIN Anda").
- **Usulan:** Tambah kotak ringkasan inden di review bila `modePendaftaran === 'inden'`.

### N-m5 — Sisa istilah gelombang: "jadwal gelombang berikutnya"
- **Lokasi:** `components/landing/LandingHero.tsx:380` (pesan saat countdown kedaluwarsa).
- **Usulan:** Ganti "jadwal gelombang berikutnya" → "jadwal pendaftaran berikutnya" (model 2027/2028 tanpa gelombang).

### N-m6 — Panduan mengutip teks halaman sukses yang tidak ada
- **Lokasi:** `components/print/PrintablePanduan.tsx:138` ("…muncul 'Pendaftaran Berhasil Dikirim!'…") vs `components/success/SuccessPage.tsx:70,76` (badge "Pendaftaran Berhasil Disimpan", judul default "Alhamdulillah, Formulir Telah Diterima!").
- **Dampak:** Wali mengikuti panduan lalu tidak menemukan kalimat yang dikutip; kebingungan ringan.
- **Usulan:** Samakan kutipan panduan dengan teks sukses yang sebenarnya.

### N-m7 — Gerbang `/api/informasi-pendaftaran` menerima Bearer token apa pun
- **Lokasi:** `app/api/informasi-pendaftaran/route.ts:91-99` (string > 5 karakter setelah "Bearer " diterima sebagai sesi valid); `app/informasi-pendaftaran/page.tsx:56-64` (gagal fetch → fallback ke sesi localStorage).
- **Dampak:** Rendah — yang dilindungi hanya rincian biaya (bukan data pribadi). Tetapi jangan diklaim sebagai otorisasi server; gerbang pada praktiknya client-side.
- **Usulan:** Validasi token terhadap sesi yang diterbitkan server, atau dokumentasikan bahwa halaman ini memang hanya gerbang UX.

### N-m8 — Tampilan HP: tidak ada overflow yang terbukti dari kode; yang perlu uji live
- **Diperiksa:** grid wizard (`grid-cols-1 sm:grid-cols-2`), `WizardProgressBar.tsx:67,86` (label langkah disembunyikan di bawah `md` — perilaku responsif yang disengaja), PIN layar "Simpan PIN" `text-4xl tracking-[0.3em]` (±200px untuk 6 digit — muat di 360px), kartu kredensial sukses `grid-cols-2`, label `text-[10px]` yang tersebar di `WizardReview.tsx` (label kecil tapi masih dalam kartu, tidak terbukti terpotong), header mobile drawer (`LandingHeader.tsx:155-236`, ada).
- **Butuh uji live oleh Rahmat:** keterbacaan label 10px di HP kecil, kartu kredensial sukses 2 kolom saat nama panjang, dan tampilan iframe peta (300px) di HP.

## 4. Validasi — semua lolos (diperiksa satu per satu)

| Aturan | Form | Backend | Bukti |
|---|---|---|---|
| Umur 6 th per 1 Juli 2027 (lahir ≤ 1 Juli 2021) | ✅ `WizardStep1.tsx:100` (`tanggalLahir > MAX_BIRTH_DATE`), `max={MAX_BIRTH_DATE}` di input tanggal (`:353`), pengaman akhir `app/page.tsx:543`, ulang di `WizardReview.tsx:88` | ✅ `lib/gas-generator.ts:1469-1473` (`dob > '2021-07-01'` → tolak) | Konstanta `lib/storage.ts:121-124` |
| NIK anak 16 digit | ✅ `WizardStep1.tsx:83-90` | ✅ `gas-generator.ts:1460` | — |
| No. KK 16 digit | ✅ `WizardStep1.tsx:93-99` | ✅ `gas-generator.ts:1466` | — |
| WA min 10 digit | ✅ `ApplicantAccessCard.tsx:177` (akun baru); `WizardStep2.tsx:147-155` (min 1 HP ortu valid, pola `^(62\|0)8`, ≥10 digit); backend `createIndenRecord` (≥10 digit) | ✅ | — |
| NISN 10 digit bila diisi | ✅ `WizardStep1.tsx:104-107` (hanya bila diisi) | — (format saja) | Label `(Opsional)` `:235` |
| KIP 6–10 digit bila diisi | ✅ `WizardStep1.tsx:109-111` (hanya bila diisi) | — | Label `(Opsional)` `:258` |
| anakKe ≥ 1 | ✅ `WizardStep1.tsx:113-115` | — | — |
| KIP / KKS / PKH / Kebutuhan Khusus / Disabilitas / NISN / email siswa = `(Opsional)`, tidak memblokir saat kosong | ✅ Semua berlabel `(Opsional)` (`WizardStep1.tsx:235,258,451,469,597,629,643`; KKS/PKH juga di `WizardStep4.tsx:397-401` sebagai upload opsional) dan validasi hanya memeriksa format bila terisi (`WizardStep1.tsx:103-111`; review `WizardReview.tsx:100-107`). 3 field wajib EMIS (Kewarganegaraan, Agama, Yang Membiayai Sekolah) tetap wajib (`WizardStep1.tsx:126-128`; backend `gas-generator.ts:1478-1490`) | ✅ | — |
| Duplikat NIK: pesan generik, tanpa nama/nomor anak lain | ✅ `lib/storage.ts:checkDuplication` — pesan "NIK ini sudah pernah terdaftar. Jika ini data anak Anda, hubungi panitia SPMB." (tanpa identitas pemilik). No KK sengaja tidak dicek (kakak-beradik serumah) | ✅ backend `gas-generator.ts` `findDuplicate` (NIK/NISN) | — |

**Alur yang terverifikasi benar:** layar "Simpan PIN Anda" menampilkan PIN 6 digit besar + label "Nomor Registrasi Sementara" + penjelasan nomor resmi menyusul (`ApplicantAccessCard.tsx:604-617`); mode inden menampilkan DP Rp50.000 / total setelah diskon Rp25.000 / sisa / batas 14 hari (`:705-760`) sesuai `DEFAULT_WAVES` (`lib/storage.ts:449-471`: DP 50000, diskon flat 25000, kuota 20, pelunasan 14 hari, DP hangus); halaman sukses menampilkan nomor resmi + PIN dengan label yang berubah menjadi "Nomor Sementara — belum terkonfirmasi panitia" bila sync gagal (`SuccessPage.tsx:104-126`); "Lupa PIN?" membuka WA panitia dengan pesan terisi otomatis memakai nomor dari settings (`ApplicantAccessCard.tsx:497-505, :929-960`); resume draft → wizard pada langkah terakhir tersimpan (`app/page.tsx:476-510`); cetak bukti memasking NIK/No KK/No HP (`PrintableBukti.tsx:19-23,132-153,280-311`); formulir resmi tanpa masking hanya dicetak dari admin (`AdminDashboard.tsx:1665` → `app/page.tsx:1563`), bukan dari alur orang tua; kata "Token" tidak lagi muncul sebagai teks yang terlihat orang tua (hanya nama variabel/komentar kode dan fungsi internal `replaceTokens` di `LandingFaq.tsx:79`).

## 5. Teks & tombol — hasil sapuan

- **Sisa kata "Token" di alur orang tua: tidak ada** (teks terlihat). Yang tersisa hanya internal: komentar `Token & Jalur Box` (`WizardReview.tsx:279`), class CSS `token-val` (`PrintableBukti.tsx:58`), `tokenCode` sebagai nama field.
- **Tombol mati:** tidak ditemukan di alur orang tua (semua CTA utama tersambung: daftar, login, lupa PIN, salin PIN, simpan WA, kirim, cetak bukti, lacak status, ubah PIN, logout).
- **Biaya/jadwal hardcode yang tersisa:** lihat N-M5 (dua kalimat Rp183.000 di rincian) dan `app/api/informasi-pendaftaran/route.ts` (data mati). FAQ sudah memakai placeholder (lihat §6).
- **Nomor WA dummy masih live:** teks halaman publik hasil crawl menampilkan "WhatsApp / Telepon, **081234567890**" — nomor resmi panitia masih dummy (diketahui, masih menunggu Rahmat).

## 6. Status perbaikan lama (Prioritas 1/2/3) — verifikasi satu per satu

| Klaim perbaikan | Status | Bukti |
|---|---|---|
| `heroCountdownLabel` disambung | ✅ TERTUTUP | `LandingHero.tsx:331` |
| `timelineJudul/Deskripsi` disambung | ✅ TERTUTUP | `RegistrationTimeline.tsx:66,69` |
| `faqJudul/Deskripsi` disambung | ✅ TERTUTUP | `LandingFaq.tsx:138,141` |
| `successNotice` + `successStep1-3` + `successHelpText` tampil | ✅ TERTUTUP | `SuccessPage.tsx:82-88,168-215` (seksi "Langkah Berikutnya") |
| FAQ biaya → `settings.biayaPendaftaran` | ✅ TERTUTUP | `LandingFaq.tsx:79-89` placeholder `{biayaPendaftaran}`; default faq-2 `lib/storage.ts:298` |
| Caption penutupan hero mengikuti tanggal tutup | ✅ TERTUTUP | `LandingHero.tsx:132-145` |
| Statistik hero ikut CMS Mengenal | ✅ TERTUTUP | `LandingHero.tsx:125-131` (`mengenalAkreditasiNilai`/`mengenalRasioGuru`) |
| Jam hero ikut `jamPelayanan` | ✅ TERTUTUP | `LandingHero.tsx:248` |
| 11/11 toggle visibilitas berfungsi | ✅ TERTUTUP | Toggle `AdminDashboard.tsx:2483-2877` (11 tombol); gate `app/page.tsx:883` (header), `LandingHero.tsx:326` (countdown), `app/page.tsx:946` (sekretariat), `:1375` (footer) |
| Input `sambutanFotoUrl` | ✅ TERTUTUP | `EditSectionModal.tsx:400-401`; render `LandingFeatures.tsx:263-265` |
| Input `modeBatasWaktu` + `tanggalBatasPendaftaran` | ✅ TERTUTUP | `AdminDashboard.tsx:2394-2410`; logika hero `LandingHero.tsx:38-58` |
| Field hantu dihapus (3 sekretariat + 5 ghost) | ✅ TERTUTUP | grep `alamatSekretariat\|teleponSekretariat\|emailSekretariat\|kopInstansiBawahan\|templatePesanWa\|enableWaNotification\|templateToken\|syaratPendaftaran` di `app/components/lib` = 0 hasil |
| Editor isi FAQ (9 Q&A, tambah/hapus/susun ulang + kategori) | ✅ TERTUTUP | `EditSectionModal.tsx:60-89`; render `LandingFaq.tsx:76-89` |
| Editor 4 langkah alur + 3 kartu program | ✅ TERTUTUP | `EditSectionModal.tsx:90-105`; render `RegistrationTimeline.tsx:39-41`, `LandingFeatures.tsx:49` |
| Label "Tagline Header FAQ" yang salah | ✅ TERTUTUP | grep label itu di `EditSectionModal.tsx` = 0 hasil |
| Peta Google Maps tersemat | ✅ TERTUTUP | `app/page.tsx:1073-1080` iframe `mapsEmbedUrl`; live crawl menampilkan seksi Lokasi + pin |
| Penghitung kuota live "X dari 120" | ⚠️ TERTUTUP (kode) / BUTUH UJI LIVE (angka) | `LandingHero.tsx:98-117,252-264` (`fetchPublicStats`); penyebut memakai `kuotaTarget` — lihat N-M4 |
| Biaya gelombang aktif di kartu countdown | ✅ TERTUTUP | `LandingHero.tsx:394-418` ("Biaya TA 2027/2028: Rp183.000" / harga coret + Early Bird) |
| Galeri & Testimoni (Tab 6 CMS) | ✅ TERTUTUP | `UnifiedCmsCenter.tsx:1297-1402`; `LandingGallery.tsx`/`LandingTestimonials.tsx` (kosong = tidak tampil); 2 foto di `public/galeri/` tampil di live crawl |
| Banner Pengumuman | ✅ TERTUTUP | Input `UnifiedCmsCenter.tsx:436-452`; render `app/page.tsx:867-873` (strip hijau di atas header, ada tombol tutup) |
| Reveal-on-scroll kartu program & langkah | ✅ TERTUTUP | `whileInView` di `LandingFeatures.tsx:193`, `RegistrationTimeline.tsx:86` |
| Race condition upload Langkah 4 | ✅ TERTUTUP | `WizardStep4.tsx:28-35` (`dataRef` — perbaikan sudah di kode) |
| Label "Nomor Sementara" di layar PIN | ⚠️ TERTUTUP SEBAGIAN / KAMBUH SEBAGIAN | Label + penjelasan benar (`ApplicantAccessCard.tsx:604-617`), tetapi banner pembuka masih menyebut nomor "resmi" (N-M6) |
| Nomor WA resmi (dummy) | ❌ MASIH TERBUKA | Live crawl 2026-11-11 menampilkan "081234567890" |
| Keputusan PIN admin | ❌ MASIH TERBUKA | Di luar bidang 3; dicatat dari audit sebelumnya |
| Sinkronisasi settings localStorage-only | ℹ️ CATATAN | Di luar bidang 3; `saveServerSettings` (`lib/storage.ts:2440+`) ada untuk jalur admin — tidak diverifikasi di audit ini |

## 7. Formulir offline & panduan — konsistensi

- **`PrintableBlankForm.tsx`:** konsisten dengan formulir online saat ini — tanpa gelombang, memakai "PIN Wali (6 digit)" (`:113,227`), biaya dari `settings.biayaPendaftaran` (`:20`), tidak ada kata "Token"/"Gelombang". ✅
- **`PrintablePanduan.tsx`:** konsisten dan sudah memperingatkan soal nomor sementara (`:64` "Nomor Registrasi di layar ini MASIH SEMENTARA…", troubleshooting `:181-182`), langkah 10 menampilkan dashboard, tombol WA melayang sudah di-portal (catatan perbaikan 07:23 WIB — tidak diverifikasi ulang di audit ini karena butuh browser live). Satu ketidakcocokan: kutipan teks sukses (N-m6).

## 8. Yang tidak bisa dibuktikan dari kode (butuh uji live oleh Rahmat)

1. Angka penyebut kuota hero saat ini ("dari 30" vs "dari 120") — N-M4.
2. Keterbacaan label 10px & kartu 2 kolom di HP kecil — N-m8.
3. Apakah diskon Early Bird benar-benar masih tersedia saat ini (sisa kuota live) — terkait N-M3.
4. Perilaku tombol "Tutup" jendela cetak & portal modal panduan (catatan lama) — tidak diuji ulang.

---

*Laporan baca-saja. Tidak ada kode yang diubah, tidak ada deploy, tidak ada data yang dikirim atau dibuat.*
