# Audit Tampilan & Sinkronisasi Admin — SPMB MI Ishlahul Ummah

**Tanggal:** 10 November 2026 (±23:40 WIB)
**Lingkup:** `~/workspace/spmb-mi-ishlahul-ummah/export-aistudio` (Next.js 15)
**Metode:** baca kode saja (read-only). Setiap temuan diverifikasi dengan membaca file yang bersangkutan; tidak ada perubahan kode, tidak ada deploy.
**Konteks awal yang diverifikasi:** footer di `app/page.tsx` memang sudah membaca `settings.cmsContent?.footerTagline` (baris 1180), `footerAbout` (1185), dan `jamPelayanan` (823, 1263) — ketiganya HIDUP. Input "Footer Tagline" memang sudah ada di `components/admin/UnifiedCmsCenter.tsx` bagian "Sekretariat, Kontak & Footer" (±baris 594). Tombol peta memakai `settings.googleMapsUrl` (`app/page.tsx:69-73`), inputnya ada di Profil Madrasah (`components/admin/AdminDashboard.tsx`, `settingsForm.googleMapsUrl`).

---

## 1. Ringkasan Eksekutif

Kondisi umum: **fondasi sinkronisasi sudah benar untuk bagian yang paling sering diubah** (hero, mengenal, sambutan, wizard, sukses judul/subjudul, KOP cetak, rincian biaya, dashboard wali). Namun audit menemukan pola yang sama berulang: **kolom admin yang tidak tersambung ke tampilan, dan tampilan yang tidak tersambung ke admin**.

Angka kunci:

| Kategori | Jumlah |
|---|---|
| Field CMS yang punya input admin tapi **tidak pernah ditampilkan** (MATI) | **17 field** |
| Field yang dibaca publik tapi **tidak punya input admin** | **5 field** (`sambutanFotoUrl`, `instansiInduk`, `enableDigitalStamp`, `modeBatasWaktu`, `tanggalBatasPendaftaran`) |
| Field yang terdefinisi tapi **tidak dipakai di mana pun** (hanya di `lib/types.ts` + default) | **5 field** (`templatePesanWa`, `templatePesanWaLulus`, `enableWaNotification`, `templateToken`, `syaratPendaftaran`) |
| Toggle visibilitas seksi yang **tidak berfungsi** | **3 dari 11** (`showCountdown`, `showSekretariat`, `showFooter`) |
| Teks publik penting yang tertulis mati dan **bertentangan dengan data live** | **2** (biaya Rp183.000 di FAQ; tanggal penutupan gelombang di hero) |
| Pintu edit ganda (field yang sama bisa diubah dari 2–3 tempat) | **±10 field** |

**Temuan paling berbahaya:** jawaban FAQ menulis "Administrasi pendaftaran sebesar **Rp183.000**" secara mati (`components/landing/LandingFaq.tsx:81`), sementara angka biaya yang sama diambil dari `settings.biayaPendaftaran` di baris 155 file yang sama. Jika admin mengubah biaya, halaman depan akan menampilkan dua angka berbeda.

**Temuan paling luas:** seluruh isi FAQ, seluruh 4 langkah alur pendaftaran, dan seluruh 3 kartu program ditulis mati di kode — tidak ada satu pun field CMS untuk isinya, padahal judul/deskripsi seksinya punya kolom admin (yang juga mati, karena komponen tidak membacanya).

**Model sinkronisasi:** semua pengaturan (termasuk CMS) hanya tersimpan di `localStorage` browser (`spmb_school_settings`, `lib/storage.ts:21,397-470`). **Tidak ada sinkronisasi settings/CMS ke server, webhook, maupun Sheets.** Webhook hanya menyinkronkan data *pendaftaran* (`syncRegistrationToWebhook`, `lib/storage.ts:1372`; `syncRegistrationUpdateToWebhook`, `lib/storage.ts:1535`). Konsekuensinya: edit admin di satu browser/perangkat tidak terlihat di perangkat lain, dan pengunjung baru selalu mendapat nilai default sampai admin membuka situs di browser itu.

---

## 2. Temuan Tampilan (Halaman Publik)

Legenda: **HIDUP** = dibaca dari `settings`/`cmsContent` (bisa diubah dari admin). **MATI** = tertulis mati di kode.

### 2.1 Hero — `components/landing/LandingHero.tsx`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-01 | Mayor | Statistik hero: "Akreditasi A / BAN-S/M Unggul", "1 : 15 / Rasio Guru & Santri", "Pendaftaran 100% Online / Layanan & Seleksi" | **MATI** — baris ±186–213, teks literal. Padahal CMS punya `mengenalAkreditasiNilai` dan `mengenalRasioGuru` yang dibaca seksi Mengenal (`components/landing/LandingFeatures.tsx:102,120`). Akibatnya ada **dua sumber kebenaran**: ubah nilai akreditasi/rasio di admin, angka di hero tidak ikut berubah. |
| T-02 | Mayor | Keterangan jam di bawah statistik: "Sekretariat: Senin–Sabtu 07.30–14.00 WIB. Observasi dan verifikasi berkas asli tetap dilakukan langsung di madrasah." | **MATI** — baris 198, teks literal. Tidak memakai `cmsContent.jamPelayanan` (yang sudah dipakai seksi Sekretariat dan footer). |
| T-03 | Mayor | Kartu jalur: "Jalur Reguler (Kelas 1) — Lulusan TK / RA / PAUD • Kurikulum Ramah Anak — Buka" dan "Jalur Siswa Pindahan — Pindahan Kelas 2 - 5 SD / MI — Tersedia" | **MATI** — baris ±235–258. Status "Buka/Tersedia" tidak mengikuti gelombang aktif atau tanggal; tidak ada field CMS untuk jalur. |
| T-04 | Mayor | Keterangan penutupan: "Pendaftaran Gelombang 1 ditutup 28 Februari 2027 pukul 23.59 WIB" | **MATI** — baris 337, teks literal. Hitung mundurnya sendiri HIDUP (mengambil `activeWave.tanggalSelesai` atau `settings.tanggalBatasPendaftaran`, baris 48–58). Jika tanggal gelombang diubah, teks ini akan salah sementara timer-nya benar. |
| T-05 | Minor | Label countdown "Hitung Mundur Penutupan:" | **MATI** — baris ±276. Field CMS `heroCountdownLabel` ada (default "Batas Akhir Pendaftaran Calon Santri:", `lib/storage.ts:192`) tapi tidak pernah dibaca komponen mana pun. |
| T-06 | Minor | Fallback tanggal countdown `'2027-02-28T23:59:59'` | **MATI tapi wajar** — baris 58, hanya dipakai bila gelombang dan `tanggalBatasPendaftaran` kosong. Nilainya masih konsisten hari ini. |
| T-07 | Minor | Label struktural: "Pendaftaran Online Terpadu" (230), "Formulir Online 24 Jam" (±238), "Daftar Langsung (Tanpa Antre)" (±345), "Layanan formulir aktif 24 jam" (±330) | **MATI** — teks antarmuka (UI chrome). Wajar bila tetap mati, dicatat agar tidak dikira bisa diubah dari admin. |
| — | — | HIDUP di hero | `heroBadge`, `heroTitle`, `heroSubtitle`, `heroCtaPrimary`, `heroCtaSecondary` (baris 126–182); nama madrasah (233); nama gelombang + timer (baris 40–58, 324). |

### 2.2 Alur Pendaftaran — `components/landing/RegistrationTimeline.tsx`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-08 | Mayor | Judul seksi "Alur Pendaftaran Ringkas & Ramah Wali Murid" (baris 102), "4 Langkah Praktis Menjadi Santri Baru" (105), deskripsi (108) | **MATI** — teks literal. Field CMS `timelineJudul` (default "Alur Pendaftaran SPMB Online") dan `timelineDeskripsi` ada tapi tidak dibaca komponen ini. |
| T-09 | Mayor | Keempat langkah (judul + deskripsi): "Registrasi Akun & Buat PIN 6 Digit" (37–38), "Isi Formulir & Unggah Berkas Digital" (50–51), "Observasi Santri & Administrasi Terpadu" (63–64), "Pengumuman Kelulusan & Daftar Ulang" (76–77) | **MATI** — seluruh isi array langkah tertulis mati. Tidak ada field CMS untuk langkah-langkah ini. |

### 2.3 Mengenal / Program / Sambutan — `components/landing/LandingFeatures.tsx`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-10 | Mayor | Tiga kartu program (judul, subjudul, deskripsi, 3 highlight tiap kartu): "Tahfidz & Tartil Al-Qur'an", "Pendidikan Karakter & Akhlakul Karimah", "Sains, Literasi & Teknologi Abad 21" | **MATI** — baris ±44–75, array `programs` literal. Hanya `programJudul` dan `programDeskripsi` yang HIDUP (baris 192, 195). Isi program tidak bisa diubah dari admin sama sekali. |
| T-11 | Minor | Keterangan "Diakui resmi oleh Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M)" (109), "Komitmen Keunggulan / Pendidikan Berkualitas Terpadu" (±100) | **MATI** — teks pendukung statis di seksi Mengenal. |
| — | — | HIDUP di seksi ini | `mengenalJudul`, `mengenalDeskripsi`, `mengenalPoints`, `mengenalAkreditasiNilai`, `mengenalRasioGuru` (102, 120, 136, 139); `sambutanJudul`, `sambutanTeks`, `sambutanAmanah` (310, 313, 320); `sambutanFotoUrl` dibaca (278–281) tapi **tanpa input admin** (lihat S-06); `namaKepalaMadrasah` (298, 301). |

### 2.4 Pusat Unduhan — `components/landing/LandingDownloads.tsx`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-12 | Minor | Tiga item unduhan (judul + deskripsi): "Brosur Resmi SPMB TA {tahunAjaran}", "Formulir Pendaftaran Fisik / Offline SPMB", "Panduan Tata Cara Pendaftaran Online & PIN 6 Digit" (baris ±40–55) | **MATI** (kecuali tahun ajaran yang live, baris 45, 53, 66). Tidak ada field CMS untuk item unduhan. |
| T-13 | Minor | Catatan "Menyiapkan dokumen fisik asli untuk verifikasi: Kartu Keluarga, Akta Kelahiran, dan Pas Foto." | **MATI** — baris 129. |
| — | — | HIDUP di seksi ini | `downloadsJudul`, `downloadsDeskripsi` (171, 174); `brosurDigitalUrl` — bila diisi, tombol brosur menjadi "Unduh" langsung (85–87, 222, 228); `namaMadrasah`, `alamatMadrasah`, `kontakWhatsapp`, `activeAcademicYear` di dokumen cetak brosur/formulir (102, 120–121). |

### 2.5 FAQ — `components/landing/LandingFaq.tsx`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-14 | **Kritis** | Jawaban biaya: "Administrasi pendaftaran sebesar **Rp183.000** (formulir pendaftaran, buku rapor, buku tabungan, buku SPP) wajib dilunasi terlebih dahulu." | **MATI dan bertentangan dengan data live** — baris 81. Di file yang sama, baris 155 memakai `` `Biaya formulir pendaftaran SPMB resmi: Rp ${settings.biayaPendaftaran.toLocaleString('id-ID')}` ``. Jika admin mengubah `biayaPendaftaran`, FAQ menampilkan dua angka berbeda dalam satu seksi. Angka 183.000 juga muncul sebagai fallback mati di `components/auth/WaliMuridDashboard.tsx:110` (`|| 183000`). |
| T-15 | Mayor | Seluruh pertanyaan & jawaban FAQ (±6 item: alur pendaftaran, biaya, pantau progres, auto-save, dokumen wajib, format file) | **MATI** — baris ±61–210, array literal. Tidak ada field CMS untuk isi FAQ. |
| T-16 | Mayor | Judul + deskripsi seksi FAQ | **MATI di tampilan** — field `faqJudul` (default "Pertanyaan yang Sering Diajukan (FAQ)") dan `faqDeskripsi` ada di CMS tapi tidak dibaca komponen ini. |
| — | — | HIDUP di FAQ | `kontakWhatsapp` + `namaMadrasah` di pesan WA konsultasi (49–52); `biayaPendaftaran` (155, kecuali baris 81 di atas); `namaMadrasah` (243). |

### 2.6 Sekretariat & Lokasi — `app/page.tsx:746-914`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-17 | Mayor | Deskripsi lokasi: "Kampus madrasah yang asri, tenang, dan strategis, aman dari kebisingan jalan raya utama sehingga sangat kondusif untuk belajar santri." | **MATI** — baris 857. Tidak ada field CMS untuk deskripsi lokasi. |
| T-18 | Minor | Teks penjelas peta "Gunakan tombol di bawah untuk membuka navigasi rute langsung ke sekolah via Google Maps." (869); catatan bawah "Layanan konsultasi online & sekretariat madrasah" (884) | **MATI**. |
| T-19 | Minor | Heading + subjudul: badge "Sekretariat & Layanan" (755), "Layanan Informasi & Pendaftaran" (761–766) | **MATI** (struktural). |
| — | — | HIDUP di seksi ini | `alamatMadrasah` (781, 869), `kontakWhatsapp` (795), `emailMadrasah` (809), `jamPelayanan` (823), `namaMadrasah` (857), tombol WA (`waUrl`, 833) dan peta (`mapsUrl`, 838, 871). |

### 2.7 Header & Footer — `components/landing/LandingHeader.tsx`, `app/page.tsx:1150-1273`

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| T-20 | Minor | Footer kolom 2–3: judul "Navigasi SPMB", "Sekretariat SPMB"; label nav "Beranda Portal", "Daftar Santri Baru", "Lacak Status & Pengumuman"; baris bawah "Sistem Penerimaan Murid Baru Terpadu" | **MATI** — `app/page.tsx:1221-1245, 1271-1273`. Struktural; wajar mati. |
| T-21 | Minor | Tombol WA mengambang "Tanya Panitia" | **MATI** — `app/page.tsx:1288`. URL-nya HIDUP (`waUrl`). |
| T-22 | Minor | Label header: "Beranda", "Lacak Pendaftaran", "Daftar Sekarang", "Status SPMB:" | **MATI** — `components/landing/LandingHeader.tsx:97,139-140,151,171`. Struktural. |
| — | — | HIDUP di header/footer | `headerTagline` (LandingHeader.tsx:85, fallback teks sama dengan footer); `namaMadrasah`, `logoMadrasahUrl` (688–689, 1161–1177); `footerTagline` (1180), `footerAbout` (1185), `jamPelayanan` (1263) — ketiganya sudah diperbaiki 10 Nov 2026. |

### 2.8 Wizard, Sukses, Informasi, Dashboard Wali, Cetak

| # | Tingkat | Elemen | Status & bukti |
|---|---|---|---|
| — | — | Wizard langkah 1–4 + review + pakta integritas | **HIDUP semua**: `step1Title/Subtitle/Notice` (`components/wizard/WizardStep1.tsx:162,165,170`), `step2*` (WizardStep2:205,208,213), `step3*` (WizardStep3:293,296,302), `step4*` (cek pola sama), `reviewTitle/reviewSubtitle` (WizardReview.tsx:255,258), `paktaIntegritasTeks` (WizardReview.tsx:901). |
| T-23 | Mayor | Halaman sukses: tidak ada seksi "3 langkah berikutnya" sama sekali | **MATI (tidak ada)** — `components/success/SuccessPage.tsx` hanya menampilkan judul/subjudul (HIDUP, baris 75, 78), tombol "Simpan ke WhatsApp / Kirim Ulang / Cetak Bukti / Kembali ke Beranda" (150–190-an). Field `successNotice`, `successStep1Title/Desc`, `successStep2Title/Desc`, `successStep3Title/Desc`, `successHelpText` (default di `lib/storage.ts:240-247`) tidak pernah dirender. Lihat S-04. |
| — | — | Halaman Informasi & Rincian Biaya | **HIDUP semua**: seluruh field `rincianBiayaPendaftaran` dibaca `components/informasi/InformasiPendaftaranView.tsx:46-48,81,84,139,153,194,213,259,304,334,342,358,375` (judul, subjudul, intro, item administrasi/perempuan/laki-laki, catatan, ketentuan, buku, footer). |
| — | — | Dashboard Wali Murid | **HIDUP semua**: seluruh `dashboardWaliMuridConfig` dibaca `components/auth/WaliMuridDashboard.tsx:54,175-550`. |
| T-24 | Minor | Dokumen cetak: jabatan penandatangan di Formulir Resmi tertulis mati "Mengetahui Kepala Madrasah" | **MATI sebagian** — `components/print/PrintableFormulirResmi.tsx:209,423`. Field `cetakJabatanPenandatangan` hanya dipakai di `PrintableBukti.tsx:167`, tidak di Formulir Resmi. Field KOP lain HIDUP di kedua dokumen (`kopInstansiAtas`, `kopNamaMadrasah`, `kopStatusAkreditasi`, `kopAlamat`, `cetakKotaTitimangsa`, `cetakNamaPenandatangan`, `cetakNipPenandatangan`, `cetakKetentuanObservasi` — PrintableBukti:102-170; PrintableFormulirResmi:104-107,209-211). |
| T-25 | Minor | Baris "NIP: " kosong di dokumen cetak | **Bukan bug** — `cetakNipPenandatangan` jatuh ke `nipKepalaMadrasah` yang memang kosong permanen (Kepala Madrasah tidak punya NIP; keputusan Rahmat, jangan ditanyakan lagi). Dicatat agar tidak dilaporkan sebagai cacat. |

---

## 3. Temuan Sinkronisasi Admin

### 3.1 Menu Profil Madrasah — `components/admin/AdminDashboard.tsx` (±baris 1800–1875)

Field yang **punya input dan HIDUP**: `namaMadrasah`, `logoMadrasahUrl`, `namaKepalaMadrasah`, `biayaPendaftaran`, `nsm`, `npsn`, `emailMadrasah`, `alamatMadrasah`, `googleMapsUrl` (baru), `kontakWhatsapp`; integrasi `spreadsheetId`, `driveFolderId`, `googleAppScriptUrl`.

| # | Tingkat | Field | Status & bukti |
|---|---|---|---|
| S-01 | Mayor | `kuotaTarget` | **Tidak ada input langsung; tidak tampil publik.** Nilainya disalin dari kuota Tahun Ajaran (`AdminDashboard.tsx:347,375`) dan hanya dipakai di dalam admin (target + progress bar, baris 869, 1208–1210). Pengunjung tidak pernah melihat kuota. |
| S-02 | Mayor | `instansiInduk`, `enableDigitalStamp`, `modeBatasWaktu`, `tanggalBatasPendaftaran` | **Tidak ada input admin, tapi dibaca publik.** `instansiInduk` → KOP cetak (`PrintableFormulirResmi.tsx:104,286`; `PrintableBukti.tsx:102`); `enableDigitalStamp` → stempel digital bukti (`PrintableBukti.tsx:168,335`); `modeBatasWaktu` + `tanggalBatasPendaftaran` → target hitung mundur (`LandingHero.tsx:40,53-54`). Mengubahnya hanya bisa lewat kode/default (`lib/storage.ts:129,147,151-152`). |
| S-03 | Minor | `templateNomorPendaftaran` | **Tidak ada input; dipakai di kode** — `lib/storage.ts:797` (`generateRegistrationNumber`). Perubahan format nomor (mis. `MIIU/SPMB/{TA}/{NO}`) hanya lewat kode. Kemungkinan disengaja; dicatat saja. |
| S-04 | Minor | `nipKepalaMadrasah` | **Tidak ada input — disengaja** (keputusan permanen: tidak ada NIP). |
| S-05 | Minor | `brosurDigitalUrl` | **Input ada, tapi bukan di Profil** — hanya lewat `EditSectionModal` seksi downloads (`components/admin/EditSectionModal.tsx:422-423`). Mudah terlewat. |

### 3.2 Menu Pusat CMS & Teks — `components/admin/UnifiedCmsCenter.tsx` (5 tab)

**Tab 1 Beranda** — input yang HIDUP: `heroBadge`, `heroTitle`, `heroSubtitle`, `heroCtaPrimary`, `heroCtaSecondary`, `jamPelayanan`, `headerTagline`, `footerTagline`, `footerAbout`, `downloadsJudul`, `downloadsDeskripsi`.

| # | Tingkat | Field | Status & bukti |
|---|---|---|---|
| S-06 | **Kritis** | `heroCountdownLabel` ("Label Batas Countdown", UnifiedCmsCenter.tsx:399) | **MATI.** Tidak dibaca komponen publik mana pun. Label countdown di hero tertulis mati (`LandingHero.tsx:±276`). Input ini memberi kesan bisa diubah padahal tidak berpengaruh. |
| S-07 | Mayor | `timelineJudul`, `timelineDeskripsi` ("Judul/Deskripsi Seksi Alur", UnifiedCmsCenter.tsx:±149–159) | **MATI.** `RegistrationTimeline.tsx` tidak membaca keduanya (lihat T-08). |
| S-08 | Mayor | `faqJudul`, `faqDeskripsi` ("Judul/Deskripsi Seksi FAQ", UnifiedCmsCenter.tsx:±179–189) | **MATI.** `LandingFaq.tsx` tidak membaca keduanya (lihat T-16). |
| S-09 | Mayor | `alamatSekretariat`, `teleponSekretariat`, `emailSekretariat` | **MATI + tanpa input.** Hanya ada di inisialisasi form (`UnifiedCmsCenter.tsx:112-114`) dan default (`lib/storage.ts`), tidak ada inputnya, dan tidak dibaca publik. Seksi Sekretariat memakai `alamatMadrasah`/`kontakWhatsapp`/`emailMadrasah` (`app/page.tsx:781,795,809`). Tiga field ini hantu. |
| S-10 | Minor | Duplikasi pintu edit hero | `heroBadge`, `heroTitle`, `heroSubtitle`, `heroCtaPrimary`, `heroCtaSecondary`, `heroCountdownLabel` bisa diubah dari **dua tempat**: Tab Beranda CMS **dan** `EditSectionModal` seksi hero (`EditSectionModal.tsx:147-226`). Keduanya menyimpan lewat `saveSchoolSettings` yang sama sehingga tidak konflik, tapi membingungkan. |

**Tab 2 Formulir** — semua input HIDUP (`step1-4Title/Subtitle/Notice`, `reviewTitle/Subtitle`, `paktaIntegritasTeks`). Tidak ada temuan.

**Tab 3 Sukses** — hanya 3 input: `successTitle`, `successSubtitle`, `successNotice` (UnifiedCmsCenter.tsx:±871–895). `successTitle`/`successSubtitle` HIDUP (SuccessPage.tsx:75,78).

| # | Tingkat | Field | Status & bukti |
|---|---|---|---|
| S-11 | Mayor | `successNotice` ("Pesan Panduan No. Registrasi & PIN") | **MATI.** Punya input, tapi `SuccessPage.tsx` tidak pernah merendernya. |
| S-12 | Mayor | `successStep1Title/Desc`, `successStep2Title/Desc`, `successStep3Title/Desc`, `successHelpText` | **MATI + tanpa input.** Ada di tipe (`lib/types.ts`) dan default (`lib/storage.ts:241-247`), tidak ada input di tab Sukses maupun di mana pun, dan tidak dirender (SuccessPage tidak punya seksi 3 langkah — lihat T-23). |

**Tab 4 Dokumen (KOP & Pengesahan)** — input yang HIDUP: `kopInstansiAtas` ("Instansi Induk (Baris 1 KOP)"), `kopNamaMadrasah`, `kopStatusAkreditasi`, `kopAlamat`, `cetakKotaTitimangsa`, `cetakJabatanPenandatangan`, `cetakNamaPenandatangan`, `cetakNipPenandatangan`, `cetakKetentuanObservasi` (UnifiedCmsCenter.tsx:±946–1035).

| # | Tingkat | Field | Status & bukti |
|---|---|---|---|
| S-13 | Minor | `kopInstansiBawahan` | **MATI + tanpa input.** Ada di tipe dan default ("KANTOR KEMENTERIAN AGAMA KABUPATEN SIDOARJO", `lib/storage.ts:251`) serta inisialisasi form (`UnifiedCmsCenter.tsx:150`), tapi tidak ada inputnya dan tidak pernah dicetak — KOP hanya memakai `kopInstansiAtas` sebagai baris 1. |
| S-14 | Minor | `cetakJabatanPenandatangan` | **HIDUP sebagian** — dipakai `PrintableBukti.tsx:167`, diabaikan `PrintableFormulirResmi.tsx:209,423` (lihat T-24). |

**Tab 5 Dashboard Wali & Rincian Biaya** — hanya dua kartu penanda yang membuka `EditRincianBiayaModal` dan `EditDashboardWaliMuridModal` (UnifiedCmsCenter.tsx:1050–1130). Semua field di kedua modal HIDUP (rincian: 17 field dibaca `InformasiPendaftaranView.tsx`; dashboard: 23 field `config.*` dibaca `WaliMuridDashboard.tsx` dan bisa diubah `EditDashboardWaliMuridModal.tsx`). Tidak ada temuan.

### 3.3 Visibilitas Seksi — `components/admin/AdminDashboard.tsx:1900-2200`

| # | Tingkat | Field | Status & bukti |
|---|---|---|---|
| S-15 | **Kritis** | `showCountdown`, `showSekretariat`, `showFooter` | **Tidak berfungsi dua arah.** (a) Tidak ada tombol toggle-nya di admin — hanya ada 7 toggle: `showHero` (1932), `showMengenalDekat` (1975), `showSambutanKepala` (2018), `showProgramMutu` (2061), `showTimeline` (2104), `showDownloads` (2147), `showFaq` (2190). (b) Ketiga flag itu juga **tidak pernah dibaca** komponen publik: countdown selalu tampil (`LandingHero.tsx`), seksi Sekretariat selalu tampil (`app/page.tsx:746`), footer selalu tampil (`app/page.tsx:1150`). Default ketiganya `true` (`lib/storage.ts:162-174`). |
| S-16 | Mayor | `showHeader` | **Dibaca publik tapi tanpa toggle.** `app/page.tsx:680` memeriksa `showHeader !== false`, tapi tidak ada tombolnya di admin — admin tidak bisa menyembunyikan header. |
| S-17 | Minor | Catatan perilaku default | `getSchoolSettings()` memaksa `showMengenalDekat=false` dan `showSambutanKepala=false` selama `sectionVisibilityConfigured` belum `true` (`lib/storage.ts`, fungsi `getSchoolSettings`). Toggle apa pun (`handleToggleSection`, `AdminDashboard.tsx:1695`) dan simpan CMS (`handleSaveSectionCms`, baris 278, 291) mengeset flag itu ke `true`, jadi perilaku ini benar — tapi admin yang hanya menyimpan Profil tanpa menyentuh visibilitas akan mendapati kedua seksi itu tetap mati. Sesuai permintaan Rahmat (kedua seksi memang diminta nonaktif), dicatat sebagai perilaku yang perlu diketahui, bukan bug. |

### 3.4 Pintu Edit Ganda & Ikatan Salah (lintas menu)

| # | Tingkat | Temuan | Bukti |
|---|---|---|---|
| S-18 | Mayor | **Ikatan salah (sudah ada sebelum audit, konteks):** input "Header Tagline" di dalam sub-seksi "Sekretariat, Kontak & Footer" terikat ke `headerTagline` (header halaman), bukan footer. | `UnifiedCmsCenter.tsx:±584-588`. Ini penyebab laporan "footer masih belum berubah" 10 Nov 2026 23:35 — sudah diperbaiki dengan menambah input "Footer Tagline" (±594). |
| S-19 | Mayor | **Input yang sama di 2–3 tempat** (tidak konflik karena satu penyimpanan, tapi membingungkan + rawan salah sangka): `headerTagline` (CMS Beranda + `EditSectionModal` seksi FAQ berlabel "Tagline Header FAQ", `EditSectionModal.tsx:±430-440`); `heroBadge/Title/Subtitle/CTA/CountdownLabel` (CMS Beranda + `EditSectionModal` hero); `downloadsJudul/Deskripsi` (CMS Beranda + `EditSectionModal` downloads); `jamPelayanan` (CMS Beranda + `EditSectionModal` sekretariat); `alamatMadrasah/kontakWhatsapp/emailMadrasah` (Profil Madrasah + `EditSectionModal` sekretariat, `EditSectionModal.tsx:451-500`); `brosurDigitalUrl` (hanya `EditSectionModal` downloads). | Lihat baris-baris di atas. |
| S-20 | Minor | **Field terdefinisi tapi tidak dipakai di mana pun** (selain `lib/types.ts` + default `lib/storage.ts`): `templatePesanWa` + `templatePesanWaLulus` (default baris 149–150) dan `enableWaNotification` (baris 148); `templateToken` (baris 143); `syaratPendaftaran` (baris 153). | Pesan WA admin (mis. kirim PIN) memakai template literal mati di `AdminDashboard.tsx:547`, bukan `templatePesanWa`. Daftar syarat di FAQ/Downloads juga mati (lihat T-15, T-13). |

### 3.5 Menu lain (diperiksa singkat — tidak ada temuan tampilan)

- **Tahun Ajaran & Gelombang** (`EditAcademicYearModal`, `EditWaveModal`): `kuotaTotal`, tanggal gelombang, `biayaPendaftaran` per gelombang HIDUP (dipakai hero countdown, `activeWave` di `app/page.tsx:668-669`, dan penomoran). **Perlu verifikasi:** apakah perubahan tanggal gelombang langsung mengubah caption mati "28 Februari 2027" (T-04) — tidak, itu justru temuannya.
- **Akun Wali & PIN, Data Pendaftaran, Verifikasi, Pengumuman, Grafik, Log, Integrasi Webhook**: mengatur data pendaftar, bukan tampilan. `hasilPengumuman` yang diset admin (AdminDashboard.tsx:599) tampil di pelacak status (`StatusTrackerModal.tsx:89-90,321-332`). Webhook di menu Integrasi hanya untuk data pendaftaran, bukan settings (lihat §4).

---

## 4. Catatan Model Sinkronisasi

### 4.1 Cara kerja saat ini (terverifikasi dari kode)

1. **Penyimpanan:** `saveSchoolSettings()` hanya menulis `localStorage` key `spmb_school_settings` (`lib/storage.ts:21,473-522`). Tidak ada `fetch`/POST settings ke server mana pun.
2. **Pembacaan:** `getSchoolSettings()` membaca `localStorage` yang sama, lalu **menggabungkan (merge) dengan default** untuk `cmsContent`, `sectionVisibility`, `rincianBiayaPendaftaran`, dan `dashboardWaliMuridConfig` (`lib/storage.ts:397-470`). Field skalar tingkat atas (`namaMadrasah`, `alamatMadrasah`, `googleMapsUrl`, dst.) **tidak** di-merge dengan default — bila tidak ada di simpanan, nilainya `undefined` dan komponen memakai fallback-nya sendiri (atau kosong).
3. **Muat ulang:** halaman depan memuat settings saat mount (`app/page.tsx:191`) dan saat kembali ke Beranda (`handleNavigateLanding`, baris 276). Edit admin di tab/browser yang sama langsung diterapkan lewat `onSettingsChange` (`app/page.tsx:1145`, `app/admin/page.tsx:102`).
4. **Webhook/API:** hanya untuk data pendaftaran — `syncRegistrationToWebhook` (`lib/storage.ts:1372`, aksi `saveRegistration`) dan `syncRegistrationUpdateToWebhook` (baris 1535, aksi `updateRegistration`) ke Apps Script (`googleAppScriptUrl`). **Tidak ada aksi sinkronisasi settings/CMS.**
5. **Data lain di localStorage:** token, pendaftar, tahun ajaran, gelombang, draft, sesi wali, antrean sync (`STORAGE_KEYS`, `lib/storage.ts:20-32`) — semuanya lokal per-browser juga, kecuali pendaftar yang disinkronkan ke Sheets via webhook.
6. **Offload khusus:** logo & brosur disimpan sebagai base64 data-URL di `localStorage`/`sessionStorage` (`SESSION_OFFLOAD_KEYS`, `lib/storage.ts:392-394`) dengan catatan kuota browser ±5 MB (`lib/storage.ts:356-369`). File besar berisiko gagal simpan karena kuota.

### 4.2 Konsekuensi localStorage-only

| Konsekuensi | Penjelasan |
|---|---|
| Edit admin di HP tidak terlihat di PC (dan sebaliknya) | `localStorage` terikat pada satu browser di satu perangkat. Admin yang mengedit di browser A lalu memeriksa di browser B akan melihat tampilan lama — persis pola keluhan "masih belum berubah". |
| Pengunjung baru selalu mendapat default | Browser pengunjung yang belum pernah dibuka admin memakai `DEFAULT_SETTINGS` + `DEFAULT_CMS_CONTENT` sampai ada yang mengubahnya di browser itu. |
| Mode incognito / hapus data browser = reset | Semua kustomisasi hilang dan kembali ke default (termasuk migrasi sekali jalan di `getSchoolSettings` yang memperbaiki nama/NSM/NPSN/biaya lama). |
| Tidak ada riwayat/versi settings | `saveSchoolSettings` menimpa tanpa versi; tombol "Reset Bagian Ini" di CMS mengembalikan default tab itu. Log audit (`spmb_audit_logs`) hanya mencatat aksi, bukan isi settings lengkap. |
| Pengecualian: data pendaftar aman | Pendaftar tersimpan di Google Sheets + Drive via Apps Script — tidak terpengaruh model ini. Yang lokal hanya *tampilan & pengaturan*. |
| Admin PIN tetap client-side | Di luar lingkup audit ini, tapi dicatat: gate admin PIN masih di sisi klien (`app/admin/page.tsx`, `AdminLoginModal`) — sudah diketahui dari audit sebelumnya, masih menunggu keputusan Rahmat. |

### 4.3 Yang TIDAK sempat diverifikasi (perlu verifikasi, bukan fakta)

- Apakah `EditSectionModal` seksi "faq" yang hanya mengedit `headerTagline` memang disengaja, atau seharusnya mengedit `faqJudul`/`faqDeskripsi` (keduanya sudah ada di Tab Beranda CMS).
- Apakah `showCountdown`/`showSekretariat`/`showFooter` sengaja tidak dipakai (desain) atau lupa disambungkan.
- Apakah ada rencana sinkronisasi settings ke server (mis. simpan settings di Sheets/Apps Script) — tidak ada jejaknya di kode saat ini.

---

## 5. Ide Perbaikan Tampilan Kreatif (HANYA IDE — belum diimplementasikan)

Diurutkan berdasarkan dampak terhadap kepercayaan pengunjung dan kemudahan admin. Semua ide di bawah tetap memakai identitas yang sudah diputuskan (hijau `#065F46`, krem, emas, Fraunces + Plus Jakarta Sans, tanpa gradien).

### Prioritas 1 — Perbaiki yang menyesatkan dulu (sebelum mempercantik)

1. **Sambungkan 17 field CMS yang mati (S-06–S-14)** atau hapus inputnya dari admin. Paling penting: `heroCountdownLabel`, `timelineJudul/Deskripsi`, `faqJudul/Deskripsi`, dan seksi sukses. Jangan biarkan admin mengedit sesuatu yang tidak berpengaruh.
2. **Ganti angka mati Rp183.000 di FAQ** (T-14) dengan `settings.biayaPendaftaran`, dan ganti caption penutupan hero (T-04) dengan tanggal gelombang yang sebenarnya (`activeWave.tanggalSelesai` diformat Indonesia). Dua baris ini saja menghilangkan risiko informasi biaya/jadwal yang salah.
3. **Hidupkan 3 toggle visibilitas** (`showCountdown`, `showSekretariat`, `showFooter`) + tambah toggle `showHeader`, atau hapus flag-nya dari tipe data bila memang tidak dibutuhkan.
4. **Beri input untuk `sambutanFotoUrl`** (foto sambutan — dibaca `LandingFeatures.tsx:278-281` tapi tanpa input admin) dan untuk `modeBatasWaktu`/`tanggalBatasPendaftaran` (mode countdown), atau hapus field-nya bila tidak dipakai.

### Prioritas 2 — Jadikan konten bisa diatur admin (mengurangi edit kode)

5. **Editor isi FAQ** (tambah/hapus/urutkan Q&A) — saat ini seluruh FAQ mati (T-15). Simpan sebagai array di `cmsContent.faqItems`.
6. **Editor 4 langkah alur + 3 kartu program** (T-09, T-10) — jadikan array CMS (`timelineSteps`, `programCards`) dengan judul, deskripsi, ikon, dan highlight yang bisa diubah.
7. **Statistik hero ikut CMS** (T-01): hero membaca `mengenalAkreditasiNilai`/`mengenalRasioGuru` yang sama dengan seksi Mengenal — satu sumber kebenaran.
8. **Seksi sukses 3 langkah** (T-23/S-12): tampilkan `successStep1-3` + `successNotice` + `successHelpText` di halaman sukses, atau hapus field-nya.
9. **Satu pintu edit per field** (S-19): tetapkan satu lokasi kanonis untuk tiap field (mis. semua teks hero hanya di Tab Beranda CMS; `EditSectionModal` menjadi jalan pintas yang membuka tab yang sama, bukan formulir kedua). Beri label yang jujur — "Tagline Header FAQ" yang sebenarnya mengedit tagline header sebaiknya dipindah/dihapus.

### Prioritas 3 — Tampilan lebih menarik & kreatif (setelah fondasi beres)

10. **Peta interaktif, bukan tombol saja** — sematkan Google Maps embed (iframe) di kartu "Lokasi Kampus Madrasah" memakai `googleMapsUrl` yang sudah ada, dengan tombol "Petunjuk Arah" tetap di bawahnya. Kartu lokasi saat ini hanya ikon + alamat + tombol.
11. **Galeri/foto madrasah di hero atau seksi Mengenal** — saat ini tidak ada satu pun foto asli di halaman depan (foto sambutan pun fallback huruf inisial). Tambah field CMS `galeriFotoUrl[]` + carousel ringan; foto asli meningkatkan kepercayaan jauh lebih besar daripada ikon.
12. **Penghitung live "kuota terisi"** — `kuotaTarget` + jumlah pendaftar sudah ada di admin; tampilkan progres "X dari 120 kursi" di hero (tanpa menyebut nama pendaftar). Memberi urgensi yang jujur dan otomatis.
13. **Kartu gelombang aktif** — tampilkan gelombang yang sedang buka + biaya gelombangnya + tanggal tutup (semuanya sudah ada di data `Wave`), menggantikan teks mati "Gelombang 1" di hero.
14. **Testimoni wali murid** — seksi baru dengan 2–3 kutipan + nama (array CMS baru), ditempatkan antara Program dan FAQ. Konten asli madrasah, bukan stok foto.
15. **Micro-interaksi ringan** — animasi hitung mundur yang sudah ada dipertahankan; tambah reveal-on-scroll halus pada kartu program dan FAQ accordion yang sudah ada; pertahankan tanpa gradien sesuai identitas.
16. **Mode "pengumuman" di hero** — banner tipis di atas header untuk info mendesak (mis. "Gelombang 1 diperpanjang hingga...") yang bisa diisi dari menu Pengumuman admin; saat ini tidak ada jalur pengumuman situs-wide.

### Yang TIDAK disarankan

- Jangan menambah gradien, font baru, atau palet baru — identitas visual sudah diputuskan dan konsisten.
- Jangan memindahkan settings ke server tanpa keputusan Rahmat — itu mengubah model keamanan & biaya (perlu endpoint Apps Script baru + otorisasi).
- Jangan menghapus field CMS mati secara diam-diam — hapus bersamaan dengan keputusan: sambungkan atau buang, lalu catat di laporan.

---

## Lampiran — Peta singkat HIDUP vs MATI (ringkas)

**HIDUP penuh (admin → tampil):** hero (badge/judul/subjudul/CTA), mengenal (judul/deskripsi/poin/akreditasi/rasio), sambutan (judul/teks/amanah — kecuali foto), unduhan (judul/deskripsi + link brosur), wizard (semua judul/subjudul/catatan + review + pakta), sukses (judul/subjudul), KOP & pengesahan cetak (kecuali `kopInstansiBawahan` + jabatan di Formulir Resmi), rincian biaya (17 field), dashboard wali (23 field), profil (nama/logo/kepala/biaya/NSM/NPSN/email/alamat/peta/WA), footer (tagline/about/jam — diperbaiki 10 Nov 2026), sekretariat (alamat/WA/email/jam).

**MATI (ada input, tak tampil):** `heroCountdownLabel`, `timelineJudul`, `timelineDeskripsi`, `faqJudul`, `faqDeskripsi`, `alamatSekretariat`, `teleponSekretariat`, `emailSekretariat`, `successNotice`, `successStep1Title/Desc`, `successStep2Title/Desc`, `successStep3Title/Desc`, `successHelpText`, `kopInstansiBawahan` — plus 3 flag visibilitas (`showCountdown`, `showSekretariat`, `showFooter`).

**MATI (tampil, tak ada input):** isi FAQ, isi 4 langkah alur, isi 3 kartu program, statistik hero, jam hero, deskripsi lokasi, caption penutupan gelombang, foto sambutan (`sambutanFotoUrl`), `instansiInduk`, `enableDigitalStamp`, `modeBatasWaktu`, `tanggalBatasPendaftaran`.

**Hantu (terdefinisi, tak dipakai):** `templatePesanWa`, `templatePesanWaLulus`, `enableWaNotification`, `templateToken`, `syaratPendaftaran`.

---

*Laporan ini hanya audit baca-saja. Tidak ada kode yang diubah dan tidak ada deploy yang dilakukan. Perbaikan (termasuk ide di §5) menunggu arahan Rahmat.*

---

## Perbaikan Prioritas 1 — SELESAI 2026-11-11 (disetujui Rahmat 04:36 WIB, deploy live)

Seluruh item Prioritas 1 dari §5 dikerjakan; tidak ada perubahan visual bagi pengunjung sampai admin mengubah isi kolomnya (default disamakan dengan tampilan saat ini).

1. **17 field CMS mati — disambungkan 14, dihapus 3.**
   - Disambungkan: `heroCountdownLabel` (label countdown hero), `timelineJudul`/`timelineDeskripsi` (judul + deskripsi seksi alur), `faqJudul`/`faqDeskripsi` (judul + deskripsi seksi FAQ), `successNotice` + `successStep1-3Title/Desc` + `successHelpText` (seksi "Langkah Berikutnya" baru di halaman sukses + inputnya di Tab 3 Sukses).
   - Dihapus (hantu — tidak dipakai di mana pun, hanya di `types` + default): `alamatSekretariat`, `teleponSekretariat`, `emailSekretariat` (seksi Sekretariat memakai `alamatMadrasah`/`kontakWhatsapp`/`emailMadrasah`), `kopInstansiBawahan` (KOP hanya memakai `kopInstansiAtas`).
   - Dihapus juga 5 field hantu lain: `templatePesanWa`, `templatePesanWaLulus`, `enableWaNotification`, `templateToken`, `syaratPendaftaran` (S-20; pesan WA memakai template literal di `AdminDashboard.tsx:547`).
   - Default diselaraskan dengan tampilan saat ini agar tidak berubah visual: `heroCountdownLabel` → "Hitung Mundur Penutupan:", `timelineJudul` → "4 Langkah Praktis Menjadi Santri Baru", `timelineDeskripsi` → paragraf alur saat ini, `faqJudul` → "Pertanyaan yang Sering Diajukan", `faqDeskripsi` → paragraf FAQ saat ini (dengan placeholder `{namaMadrasah}`).
2. **Teks menyesatkan diperbaiki (T-14, T-04).** Angka "Rp183.000" di FAQ diganti `settings.biayaPendaftaran` (satu sumber — verifikasi: tidak ada lagi "183.000" di bundle halaman depan). Caption penutupan hero dihitung dari tanggal tutup yang sama dengan hitung mundur (`Pendaftaran {gelombang} ditutup {tanggal} pukul {jam} WIB`). Bonus sekelas: statistik hero memakai `mengenalAkreditasiNilai`/`mengenalRasioGuru` (T-01, satu sumber dengan seksi Mengenal) dan catatan jam hero memakai `jamPelayanan` (T-02).
3. **Toggle visibilitas dihidupkan (S-15, S-16).** Tombol toggle ditambah untuk `showCountdown` (kartu hitung mundur di hero), `showSekretariat` (seksi Sekretariat & Layanan), `showFooter` (footer), `showHeader` (header — gerbangnya sudah ada di `page.tsx:680`). Sekarang 11 dari 11 toggle berfungsi.
4. **Input baru (S-02, S-06).** `sambutanFotoUrl` — input URL foto di `EditSectionModal` seksi Sambutan (foto tampil bulat; kosong = huruf inisial). `modeBatasWaktu` (pilihan gelombang/tanggal tetap) + `tanggalBatasPendaftaran` (datetime) — di Profil Madrasah, mengatur target hitung mundur & caption penutupan.
- Verifikasi: `npm run build` lolos, deploy Vercel production live (HTTP 200), ZIP final diregenerasi.
- Sisa dari audit (belum dikerjakan): Prioritas 2 (editor isi FAQ / 4 langkah / 3 kartu program, satu pintu edit per field) dan Prioritas 3 (peta embed, galeri, penghitung kuota, kartu gelombang, testimoni, micro-interaksi, mode pengumuman).

## Perbaikan Prioritas 2 & 3 (kreatif) — SELESAI 2026-11-11 (disetujui Rahmat ~04:46 WIB)

Dikerjakan sekaligus; tampilan tidak berubah sampai admin mengisi/mengubah konten baru (semua default = isi saat ini; galeri & testimoni kosong = seksinya tidak tampil).

1. **Editor isi (P2 #5, #6).** FAQ (9 pertanyaan), 4 langkah alur, dan 3 kartu program kini tersimpan sebagai array di `cmsContent` (`faqItems`, `timelineSteps`, `programCards`) dengan default = isi saat ini — diekstrak otomatis dari komponen, bukan diketik ulang. Editornya di modal "Edit Seksi" (tombol Edit di kartu visibilitas admin): FAQ bisa tambah/hapus/susun ulang + pilih kategori; langkah & kartu bisa ubah teks (nomor langkah dan ikon mengikuti posisi). Placeholder `{namaMadrasah}` dan `{biayaPendaftaran}` di jawaban FAQ terisi otomatis dari pengaturan.
2. **Satu pintu edit (P2 #9, sebagian).** Field "Tagline Header FAQ" yang salah label di modal FAQ (sebenarnya mengedit tagline header) diganti dengan editor FAQ yang benar — judul, deskripsi, dan daftar Q&A. Pintu ganda untuk judul/deskripsi (modal + tab CMS) tetap ada, tetapi keduanya menyimpan ke store yang sama, jadi tidak ada konflik.
3. **Peta interaktif (P3 #10).** Kartu "Lokasi Kampus Madrasah" kini menampilkan peta Google Maps tersemat (iframe, sumber dari `googleMapsUrl` atau alamat), tombol "Buka Peta Navigasi" tetap ada di bawahnya.
4. **Penghitung kuota live (P3 #12).** Hero menampilkan bar "Kursi terisi: X dari 120 kursi" dari hitungan baris Sheets via action baru `getPublicStats` di Apps Script — hanya angka, tanpa data pribadi. Backend **Code.gs v2.5** (deploy clasp, ping terverifikasi v2.5 LIVE); POST dari VM ini hang di transport (sudah dikenal), jadi angka live diverifikasi lewat browser. Catatan: hitungan saat ini mencakup baris data tes 0001 sampai dibersihkan.
5. **Kartu gelombang aktif (P3 #13).** Kartu hitung mundur hero menampilkan "Biaya {nama gelombang}: Rp {biaya gelombang}" dari data gelombang aktif.
6. **Galeri & testimoni (P3 #11, #14).** Seksi baru (komponen `LandingGallery`, `LandingTestimonials`) + Tab 6 CMS "Galeri & Testimoni": URL foto satu per baris, testimoni (nama/peran/kutipan, tambah/hapus). Keduanya kosong secara default → seksi tidak tampil sampai Rahmat mengisi foto/kutipan asli.
7. **Mode pengumuman (P3 #16).** Input "Banner Pengumuman" di Tab 1 CMS Beranda; tampil sebagai strip hijau tipis di atas header (dengan tombol tutup) bila terisi, hilang bila kosong.
8. **Micro-interaksi (P3 #15).** Kartu program dan langkah alur muncul halus saat di-scroll (`motion` whileInView, sudah dipakai di FAQ) — tanpa mengubah identitas tanpa-gradien.
- Tidak dikerjakan: ikon yang bisa dipilih per kartu/langkah (ikon tetap mengikuti posisi — mengubah topik kartu lebih masuk akal lewat edit teks, bukan ganti ikon).
- Verifikasi: `npm run build` lolos, deploy Vercel production live (HTTP 200), ZIP final diregenerasi.

## Panduan pendaftaran langkah-demi-langkah — SELESAI 2026-11-11 (disetujui Rahmat 06:23 WIB)

Kartu "Panduan Tata Cara Pendaftaran Online & PIN 6 Digit" di Pusat Unduhan sebelumnya hanya membuka halaman cetak generik (judul + deskripsi + 4 poin umum) padahal deskripsi kartunya menjanjikan petunjuk teknis langkah demi langkah — temuan ini disampaikan jujur ke Rahmat 06:14 WIB dan ia menyetujui pembuatan panduan sungguhan.

1. **Komponen baru `PrintablePanduan.tsx`.** Modal panduan 10 langkah (beranda → akun → SIMPAN PIN → wizard Langkah 1–4 → review/kirim → halaman sukses → cek status/dashboard) + seksi troubleshooting 6 masalah. Tiap langkah punya instruksi singkat + screenshot tampilan HP. Tombol "Cetak / Simpan PDF" membuka jendela cetak berisi panduan yang sama (HTML mandiri dengan gambar dari `/panduan/*.jpg`).
2. **11 screenshot tampilan HP terverifikasi** (`panduan-shots/`, asli 780px; salinan JPEG 480w di `public/panduan/`, semua HTTP 200): 01-beranda, 02-akun, 02b-simpan-pin, 03-langkah1, 04-langkah2, 05-langkah3, 06-langkah4, 07-review, 08-sukses, 09-cek-status, 10-dashboard.
3. **PDF panduan 12 hal. A4** (`goals/.../files/Panduan-Pendaftaran-Online-2027-2028/Panduan-Pendaftaran-Online-2027-2028.pdf`, sumber `.src/template.html` + `build_html.py`): sampul + persiapan + 10 langkah + troubleshooting; semua halaman diperiksa visualnya, gate render lolos (tanpa overflow, tanpa font hilang).
4. **Wiring `LandingDownloads.tsx`.** `actionType === 'guide'` kini membuka modal panduan; perilaku 'brosur' dan 'form_offline' tidak diubah.
- Verifikasi: `npm run build` lolos, deploy Vercel production live (HTTP 200), semua gambar `/panduan/*.jpg` HTTP 200, ZIP final diregenerasi (104 file). Verifikasi tampilan modal di browser sedang berjalan.

## Temuan baru dari pembuatan panduan (BELUM diperbaiki — menunggu keputusan Rahmat)

1. **Nomor sementara di layar "Simpan PIN Anda" tidak sama dengan nomor resmi akhir.** Nomor sementara dihitung dari localStorage (browser baru = 0001) sementara server memberi max+1 dari Sheets, jadi nomor yang ditampilkan di layar PIN selalu 1 angka lebih rendah dari nomor resmi di halaman sukses (uji: 0001→0002, 0002→0003; PIN sama). Risiko: wali mencoba masuk dengan nomor sementara. Usulan: beri label "Nomor Sementara" atau sembunyikan nomor sampai halaman sukses. Panduan sudah memperingatkan wali soal ini (Langkah 3 + troubleshooting).
2. **Race condition upload berkas Langkah 4.** `WizardStep4.tsx handleFileUpload` menutup `data` lama dan memanggil `onChange({...data, [docKey]: newFile})` setelah kompresi async — mengunggah beberapa berkas cepat-cepat bisa menghilangkan unggahan sebelumnya (hanya yang terakhir selesai yang tersisa; terverifikasi saat pengambilan screenshot). Panduan sudah menginstruksikan unggah SATU PER SATU dan tunggu "Telah Diunggah". Perbaikan kode kandidat: functional update / merge per kunci dokumen.

## Perbaikan susulan panduan — SELESAI 2026-11-11 ~07:23 WIB (deploy live)

Ditemukan saat verifikasi browser atas panduan (dua kali jalan browser):

1. **Langkah 10 modal situs hanya menampilkan 1 gambar.** Teks langkah membahas Dashboard Wali, tetapi modal hanya menampilkan gambar login Cek Status — gambar dashboard (`10-dashboard.jpg`, sudah live HTTP 200) tidak dirender karena tiap langkah di `PrintablePanduan.tsx` hanya punya satu slot gambar. Diperbaiki: langkah 10 kini punya gambar kedua (dashboard) di modal (ditumpuk) dan di jendela cetak (berdampingan, seperti PDF). PDF panduan sudah benar sejak awal (kedua gambar di hal. 11). Baris troubleshooting ke-6 (nomor sementara vs nomor resmi) juga ditambahkan ke modal agar sama dengan PDF.
2. **Tombol WA melayang menutupi isi modal.** Tombol hijau melayang (z-40, `app/page.tsx`) tampil DI ATAS screenshot di dalam modal panduan karena seksi Downloads (`relative` + `overflow-hidden`) membuat stacking context sendiri yang menjebak modal z-50 di dalamnya. Diperbaiki dengan me-render kedua modal cetak (`PrintablePanduan`, `PrintableBlankForm`) via React portal ke `document.body` — cara standar untuk modal. Verifikasi browser sedang berjalan.
3. **Tombol "Tutup" di jendela cetak tidak menutup tab** (diklik sekali, tab tetap terbuka; tab akhirnya ditutup manual lewat kontrol browser). Kemungkinan perilaku browser terhadap `window.close()` — dicatat, belum diselidiki lebih lanjut karena pengguna selalu bisa menutup tab sendiri.
