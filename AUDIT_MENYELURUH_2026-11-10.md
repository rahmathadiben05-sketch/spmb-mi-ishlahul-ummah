# AUDIT MENYELURUH — SPMB MI Ishlahul Ummah 2027-2028

**Tanggal:** 2026-11-10 (14:00–14:40 WIB)
**Ruang lingkup:** baca-kode atas `export-aistudio` (landing, wizard, modal, bukti cetak, admin) + `Code.gs` v2.3 + `lib/gas-generator.ts` + `lib/storage.ts`; ping GET ke Apps Script V1 via browser.
**Metode:** 3 jalur paralel (tampilan, alur pendaftaran, backend & Sheets) + verifikasi silang + spot-check penulis laporan atas temuan terberat (WA dummy, pesan duplikat NIK, `data?.success !== false`, alur sukses saat sync gagal, daftar action `doPost`).
**Batasan (jujur):** audit baca-kode saja — TIDAK ada uji klik/isi/kirim dari browser nyata, TIDAK ada pemeriksaan isi Sheet secara langsung. Uji kirim nyata dari HP Rahmat tetap satu-satunya bukti ujung-ke-ujung.

## VONIS: BELUM LAYAK DIBUKA KE PUBLIK

Total temuan unik (setelah deduplikasi antar-jalur): **~120** — **16 Kritis, ~45 Major, ~55 Minor**.
Tiga kelompok yang paling berbahaya: (1) orang tua bisa memegang bukti pendaftaran yang tidak ada di Sheets; (2) data anak bisa dibuka siapa saja lewat Cek Status tanpa login; (3) orang tua bisa terkunci dari akunnya sendiri karena PIN tidak pernah ditampilkan di awal.

## YANG SUDAH BENAR (terverifikasi, jangan diubah keliru)

- Data sekolah benar: kamad Astutik, S.Pd; NSM 111235150097; NPSN 60717039.
- Biaya konsisten Rp183.000 di semua tempat (100.000 + 70.000 + 7.000 + 6.000); total putri Rp550.000 / putra Rp498.000 cocok.
- Aturan usia konsisten di form, FAQ, syarat, dan backend: 6 tahun per 1 Juli 2027 (lahir ≤ 1 Juli 2021); lahir tepat 2021-07-01 lolos di kedua sisi.
- Label "Token" → "PIN 6 Digit" bersih di seluruh alur orang tua; tombol "Edit Judul H1 (Admin)" sudah tidak tampil untuk pengunjung umum (terverifikasi di HTML preview).
- Tanggal penutupan konsisten: 28 Februari 2027, 23:59:59.
- Anak kedua (No KK sama, NIK beda) lolos — sesuai desain; duplikat hanya dari NIK (+NISN bila ada).
- NIK & No KK anak: `^\d{16}$` + penghitung x/16 — konsisten dan benar.
- Backend: `Code.gs` lokal identik penuh dengan `gas-generator.ts` (75 kolom, urutan, helper `t()` apostrof, validasi usia, duplikat NIK saja, penomoran server, upload Drive, log). Frontend memakai URL kanonis V1, tidak ada URL lain. Ping GET berhasil: `{"success":true,...}` (namun ping tidak membuktikan versi live = v2.3 — lihat F6).
- Penomoran server aman dari tabrakan selama lewat `doPost` yang sama (LockService + maks+1) — kecuali bila lock kedaluwarsa saat upload (F4).
- Login menolak NIK dan PIN master sebagai kredensial; hanya PIN 6 digit pendaftaran yang berlaku.

## KRITIS (16)

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| K1 | Nomor WA placeholder `081234567890` tampil & aktif di semua tombol WA | `lib/storage.ts:131,214`; `app/page.tsx:552,945`; `LandingFaq.tsx:49`; `CountdownTimer.tsx:92` | Orang tua chat ke nomor dummy, mengira sudah hubungi panitia |
| K2 | FAQ menyebut PIN 4-digit, sistem memakai PIN 6 digit | `LandingFaq.tsx:67` | Orang tua menganggap PIN 6 digit yang diterima salah, gagal login |
| K3 | Tombol hero "Masuk Akun Wali Murid" malah membuka Lacak Status | `LandingHero.tsx:203-207`; `lib/storage.ts:188` | Wali terdaftar tidak menemukan jalan masuk akun dari hero |
| K4 | PIN 6 digit TIDAK PERNAH ditampilkan saat daftar awal, padahal landing menjanjikannya ("langsung muncul di layar & bisa disalin") | `ApplicantAccessCard.tsx:95-155` vs `RegistrationTimeline.tsx:42-43` | Tutup wizard di tengah jalan = terkunci dari draf sendiri; PIN baru terlihat setelah seluruh wizard + kirim selesai |
| K5 | Pesan duplikasi NIK membocorkan nama + nomor pendaftaran anak lain (real-time saat NIK 16 digit diketik) | `lib/storage.ts:736-738`; `WizardStep1.tsx:43-46,145-153` | Siapa pun bisa mengintip identitas anak lain bermodal NIK |
| K6 | PIN admin tertulis langsung di kode client, bisa dibaca publik dari bundle JS | `AdminLoginModal.tsx:37`; `app/admin/page.tsx:58` (`['123456','admin123']`); username diabaikan | Siapa pun bisa masuk dashboard admin |
| K7 | Penolakan backend tetap tampil "Pendaftaran Berhasil" | `app/page.tsx:397-421` | NIK duplikat dari HP lain ditolak server, tapi orang tua sampai di halaman sukses + cetak bukti |
| K8 | Nomor lokal (hitung localStorage) bisa bertabrakan dan dilabeli "Nomor Pendaftaran Resmi" | `lib/storage.ts:758-766`; `SuccessPage.tsx` | Dua HP bisa sama-sama pegang `.../0001` yang tidak ada di Sheets |
| K9 | Respons non-JSON (halaman error Google) dianggap SUKSES | `lib/storage.ts:1230-1247` (`if (res.ok && data?.success !== false)`; `data=null` → sukses) | Deployment bermasalah / halaman "belum terverifikasi" = sukses penuh tanpa peringatan |
| K10 | Cek Status tanpa login: huruf sembarang / nama bisa membuka record orang lain + cetak bukti lengkap | `StatusTrackerModal.tsx:48-59`; `StatusCheckModal.tsx:30-37` | Ketik `asdfgh` atau nama anak → tampil NIK, No KK, alamat, No HP + tombol cetak |
| K11 | Sesi wali murid hanya klaim localStorage; bisa dipalsukan, tanpa kedaluwarsa | `lib/storage.ts:1008-1043`; `app/page.tsx:158-165` | Satu objek JSON di localStorage = masuk dashboard tanpa autentikasi nyata |
| K12 | Tidak ada cek duplikat No WA saat buat akun; nomor sementara bisa bentrok, draft/sesi saling timpa | `ApplicantAccessCard.tsx:69-163`; `lib/storage.ts:755-764,985-1004` | Satu orang tua bisa punya 2 akun/PIN untuk anak yang sama; dua pendaftar bisa berebut nomor sementara yang sama |
| K13 | Tidak ada jalur Lupa PIN / Ubah PIN bagi orang tua | `ApplicantAccessCard.tsx:461`; `lib/storage.ts:822` | Lupa PIN di luar jam sekretariat = terkunci total sampai panitia reset manual |
| K14 | No HP orang tua tidak wajib & tidak divalidasi, padahal itu kredensial login wali | `WizardStep2.tsx:103-108,275-276,417-418` | No HP kosong/salah ketik → pendaftaran "berhasil" tapi login tidak akan pernah bisa |
| K15 | Review tidak melakukan validasi akhir apa pun sebelum submit | `WizardReview.tsx:662` (hanya `disabled={!agreed \|\| isSubmitting}`) | Dokumen wajib kosong tetap bisa terkirim ke Sheets |
| K16 | PIN dibuat dengan `Math.random`, disimpan & ditampilkan plaintext; login tanpa batas percobaan | `lib/storage.ts:766-768,851,1025-1033`; `WaliMuridDashboard.tsx:193-195` | PIN 6 digit bisa ditebak berulang tanpa batas; bocor lewat screenshot/localStorage/cookie/log |

## MAJOR (tema gabungan — rincian lengkap per file ada di bawah)

**Integritas data ke Sheets:**
- M-F1 Perubahan admin (status/verifikasi/pengumuman) TIDAK PERNAH sampai ke Sheets — server tidak punya endpoint update; `saveRegistration` selalu append + ditolak sebagai duplikat NIK sendiri. Panggilan sync admin dibungkam `.catch(()=>{})`. (`Code.gs` doPost hanya: ping, saveRegistration, generateTokens, checkNik; `AdminDashboard.tsx:590,607`)
- M-F2 Tidak ada retry/antrean sync; data bisa tinggal di localStorage saja. (`lib/storage.ts:1199-1271`; `app/page.tsx:386-412`)
- M-F3 Submit dapat gagal total sebelum sync karena kuota localStorage — dokumen base64 (±16 MB) vs kuota ~5 MB; `createRegistration` di luar blok try; tanpa pesan error. (`lib/storage.ts:721-724,826-855`)
- M-F4 Lock penomoran bisa kedaluwarsa di tengah upload 6 file → risiko nomor ganda. (`Code.gs` lock 15 dtk, 6× upload di dalam lock)
- M-F5 Gagal upload dokumen diam-diam: baris tetap "sukses", kolom link berisi `GAGAL_UPLOAD: ...`. (`Code.gs:311-334,382-387`)
- M-F6 Ping GET tidak membuktikan versi live = v2.3 (doGet mengembalikan JSON sama di semua versi). Satu-satunya bukti = uji kirim nyata.
- M-F7 Tidak ada validasi header tab yang sudah ada; kolom diubah manual → data salah kolom diam-diam.
- M-B1 Cek duplikat NIK hanya terhadap localStorage; endpoint server `checkNik` tidak pernah dipakai frontend.
- M-B2 "PIN 6 Digit" dicari/dicetak dari `tokenCode`, bukan `pin` — record lama / fallback `'ONLINE'` bisa tampil sebagai PIN.
- M-B3 Tidak ada validasi ulang saat submit; backend juga tidak menegakkan kelengkapan (No HP, dokumen wajib).
- M-B4 Lock server dipegang selama upload Drive (lihat M-F4).
- M-B5 Tanpa timeout/retry/antrean (lihat M-F2).
- M-B6 Refresh selalu kembali ke landing; tidak ada jalan pintas kembali ke dashboard/wizard.
- M-B7 Resume record yang sudah submit lalu "Edit" kemungkinan diblokir NIK-nya sendiri; submit selalu membuat record baru (tidak ada `updateRegistration`).

**Alur & validasi pendaftaran:**
- M1 Nama gelombang tidak pernah cocok: `activeWave 'Gelombang 1'` vs `nama 'Gelombang 1 (Early Bird)'` — `activeWaveData` selalu undefined; countdown jalan lewat fallback. (`lib/storage.ts:136 vs :269`)
- M2 Tanggal penutupan tidak pernah ditulis eksplisit di landing mana pun (hanya angka countdown).
- M3 `CountdownTimer.tsx` kode mati; ada dua implementasi countdown.
- M4 Pusat Unduhan: jumlah unduhan & ukuran file hardcoded (fiktif); tombol "Unduh" bukan mengunduh file asli (`brosurDigitalUrl` kosong → dokumen HTML generik).
- M5 Modal brosur di Hero kode mati: tidak ada tombol yang memanggilnya.
- M6 Klaim "100% Online" / "Online 24 Jam" bertentangan dengan kewajiban hadir ke madrasah (langkah 3).
- M7 Login butuh 2 kredensial (No WA/Nomor + PIN), tapi Timeline bilang "login menggunakan PIN saja".
- M8 Modal Cek Status yang AKTIF tidak menyebut PIN sama sekali, padahal Timeline/FAQ bilang cek status pakai PIN/NIK.
- M9 Ada DUA modal cek status; yang satu tidak terpakai dan labelnya tidak konsisten.
- M10 Nama ayah/ibu tetap wajib meski status "Sudah Meninggal"/"Tidak Diketahui".
- M11 NIK ayah/ibu dan No HP/WA tidak divalidasi sama sekali.
- M12 Validasi No WA di kartu awal kontradiktif (kode: min 9, pesan: min 10); email dikumpulkan tapi dibuang.
- M13 Data awal diisi diam-diam atas nama orang tua: nama → Ayah, WA disalin ke ayah DAN ibu, jenis kelamin default Laki-laki.
- M14 Tinjauan menampilkan tanggal lahir mentah `YYYY-MM-DD` dan "Anak Ke-X dari Y Saudara" yang ambigu (bisa "dari 0 Saudara").
- M15 Pelacak tahap 2 mensyaratkan Pas Foto, padahal foto itu opsional — progres bisa macet di Tahap 1 selamanya.
- M16 Pesan error penolakan usia di pengaman submit tidak akan terlihat (banner hanya dirender di langkah 5, lalu langkah dipindah ke 1).
- M17 Mengisi nama wali diam-diam mengisi Pendidikan "S1", Pekerjaan "Wiraswasta", Penghasilan "Rp1–2 juta".
- M18 Pencarian Pelacak Status bisa mengembalikan pendaftar lain dari potongan No WA/nama (`includes('')` selalu true).
- M19 Label login modal admin menyesatkan: username/password vs PIN (menyebut "NIP" pula).
- M-B8–B23 (dari audit alur): validasi wilayah tanpa fallback (B12), default wali tanpa validasi (B13/B14), normalisasi No WA tidak konsisten daftar vs login (B16), query ambigu `find()` ambil record pertama (B17), NIK parsial 10 digit cukup + NIK lengkap ditampilkan (B18), cek status hanya bekerja di perangkat tempat mendaftar (B19), bukti cetak memuat identitas lengkap tanpa masking (B20), `StatusCheckModal` dead code (B21), QR "VERIFIED" statis bukan validasi (B22), `PrintableFormulirResmi` mencetak checklist "lolos semua" bila data verifikasi belum ada (B23), klaim "Auto-save aktif" tanpa bukti (B7), pertanyaan Ijazah TK bisa dilewati (B11), batas ukuran berkas total tidak ada (B10).

**Minor (34 tampilan + 13 alur + 6 backend — sorotan):**
- Typo "bed" (→ bet) dan "raport" (→ rapor); campuran Inggris (`realtime`, `Auto-Save`, `YA, SANGAT BISA!`, `Early Bird`); format biaya tidak seragam (`Rp183.000` vs `Rp 183.000`); alamat tanpa kode pos di landing (kop surat punya 61253); label akreditasi ganda + bilah 96% tanpa sumber; section Sambutan Kamad nonaktif sehingga nama kamad/NSM/NPSN tidak tampil di landing; tombol "Buka Fitur Cek Status" muncul di jawaban FAQ yang salah; rumusan usia di dokumen unduhan kabur.
- Istilah tanpa penjelasan (NISN, KIP, "e.g."); "Jml Saudara"; duplikasi field pindahan; subjudul Langkah 3 berbahasa teknis internal; RT/RW diminta dua kali; "wajib hukumnya", "legibilitas"; ijazah TK; badge "Utama" ganda; tombol kembali ganda; bukti: alamat layar vs cetak berbeda, "NIP: " kosong, jabatan penandatangan tidak cocok (Ketua Panitia vs Kepala Madrasah), kotak "QR Code" bukan QR asli; campuran santri/siswa/anak; badge "Wali Santri Sah" tanpa penjelasan; klaim notifikasi WA belum terbukti; kata "token" di data default syarat (laten); `TokenValidationCard.tsx` dead code utuh; grid 3 kolom sempit di HP; teks 9–10px abu-abu muda; dua judul login admin berbeda; tidak ada bantuan "lupa PIN" di login admin; prop `onOpenAdmin` di header kabel mati.
- Backend minor: format plain-text hanya baris 2–1000; komentar `storage.ts:143` masih menyebut v2.2/Version 4; `getSpreadsheet()` mendahulukan spreadsheet aktif; URL efektif bisa ditimpa localStorage; endpoint `checkNik` membuat tab kosong sebagai efek samping; validasi usia server membandingkan string mentah (format non-ISO bisa lolos); nomor lokal tampil saat sync gagal.

**Catatan admin-only:** generator voucher legacy di `AdminDashboard.tsx:1078` masih fungsional dan bertentangan dengan kebijakan "pendaftaran bebas tanpa token" bila tidak sengaja dipakai.

## URUTAN PERBAIKAN YANG DISARANKAN

1. **K1 nomor WA resmi** — satu-satunya yang membuat orang tua gagal menghubungi madrasah sama sekali.
2. **Kejujuran sync (K7+K8+K9, M-F2/M-F3):** bedakan sukses/gagal secara jujur; jangan tampilkan nomor lokal sebagai "Resmi"; syarat sukses harus `data.success === true` + nomor dari server; timeout + antrean + tombol kirim ulang.
3. **Kunci Cek Status (K10, K11, K16):** wajibkan login wali untuk melihat data; NIK hanya cocok persis 16 digit + masking; samakan pesan error login.
4. **Rantai PIN (K4, K2, K13, K14):** tampilkan PIN segera setelah akun dibuat (layar simpan PIN + salin + WA); samakan 4→6 digit; jalur Lupa PIN; wajibkan + normalisasi No HP.
5. **Backend (M-F1, M-F4, M-F5):** endpoint `updateRegistration`/upsert untuk perubahan admin; upload di luar lock; gagal upload dokumen wajib = gagal submit.
6. **K6 PIN admin ke server** (atau minimal ganti `admin123` + samakan label login admin, M19).
7. Major alur & tampilan lainnya (M1–M18, B-kelompok), lalu Minor.
8. **Terakhir: satu uji kirim nyata dari HP Rahmat** (data uji, lalu dibersihkan) — satu-satunya bukti ujung-ke-ujung bahwa data sampai ke Sheets milik rahmathadiben17@gmail.com dengan versi v2.3 yang benar.

## STATUS SAAT INI

- Preview Vercel live (perbaikan label Token + sembunyikan tombol admin sudah ter-deploy & terverifikasi).
- ZIP final sudah diregenerasi — namun KODE di dalamnya masih mengandung semua temuan di atas; regenerate ulang setelah perbaikan.
- GitHub push masih menunggu login `gh` Rahmat.
- Uji kirim nyata dari HP Rahmat masih menunggu; EMIS check menunggu pilihan cara login Rahmat.
