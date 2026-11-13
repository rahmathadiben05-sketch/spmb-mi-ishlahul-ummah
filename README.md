# SPMB MI Ishlahul Ummah 2027–2028

Website pendaftaran santri baru MI Ishlahul Ummah (Pranti, Sedati, Sidoarjo) untuk tahun ajaran 2027/2028.

- **Situs live:** https://export-aistudio.vercel.app
- **Status:** frontend v2.13.5, backend v2.12 — live dan terverifikasi 13 November 2026
- **Pendaftaran:** 1 November 2026 – 30 Juni 2027 pukul 23.59 WIB, satu periode tanpa gelombang
- **Biaya:** administrasi Rp183.000 (total putra Rp498.000, putri Rp550.000 termasuk perlengkapan)
- **Inden:** DP Rp50.000, diskon Early Bird Rp25.000 untuk 20 kursi pertama, pelunasan maks. 14 hari
- **Syarat usia:** calon santri berusia 6 tahun per 1 Juli 2027 (lahir paling lambat 1 Juli 2021)
- **WhatsApp resmi panitia:** 085196677872

## Arsitektur

| Lapisan | Teknologi | Keterangan |
| --- | --- | --- |
| Frontend | Next.js 15 + React 19 + Tailwind CSS 4 | Folder `export-aistudio/` |
| Backend | Google Apps Script (Web App) | `Code.gs` (kanonis), salinan deploy di `clasp-deploy/Code.js` |
| Database | Google Sheets | Satu spreadsheet, satu tab per tahun ajaran (mis. `2027-2028`) |
| Dokumen | Google Drive | KK, akta, ijazah TK, foto — diunggah lewat backend |

Frontend dan backend **terpisah**: backend sudah live sendiri dan tidak perlu di-deploy ulang saat deploy frontend.

## Deploy (untuk pengelola domain)

1. Deploy repo ini di Vercel.
2. **Root Directory: `export-aistudio`** (bukan root repo).
3. Pasang domain `spmb.ishlahul-ummah.sch.id` dan arahkan DNS ke Vercel.
4. Backend tidak perlu di-deploy — sudah live terpisah.

## Alur pendaftaran

1. Wali mengisi kartu akses (nama wali, nomor WhatsApp, nama calon santri) → sistem menerbitkan **PIN 6 digit otomatis** (bukan dipilih wali) dan nomor registrasi sementara.
2. Wizard 5 langkah: data santri → orang tua/wali → alamat → dokumen → tinjau & kirim.
3. Setelah submit, halaman sukses menampilkan nomor pendaftaran final + PIN.
4. **Login wali** memakai nomor WhatsApp atau nomor pendaftaran + PIN. Wali bisa melihat status, mencetak lembar bukti, dan **mengedit formulir setelah submit** (nomor pendaftaran tidak berubah).
5. **Admin** memverifikasi dokumen (pratinjau KK/akta di modal verifikasi), mengatur PIN wali bila lupa, dan mengumumkan hasil (mis. LULUS). Pengumuman tampil di sisi wali.
6. **Lupa PIN?** membuka WhatsApp ke panitia.

## Keamanan

- Autentikasi admin di sisi server (token acak, masa berlaku 2 jam); login admin hanya memakai password, tanpa username.
- PIN wali tidak dikembalikan dalam respons daftar; wali tidak bisa mengubah kolom verifikasi/pengumuman/pembayaran lewat jalur wali.
- Harga inden, DP, diskon, kuota, dan batas pelunasan dipaksa dari konstanta server.
- Upload dokumen: whitelist tipe file + maks. 5 MB, divalidasi di server.
- Cek duplikat (NIK dan nomor HP ayah/ibu/wali) dilakukan di server.

## Struktur repo

- `export-aistudio/` — aplikasi Next.js (satu-satunya folder yang di-deploy ke Vercel)
- `Code.gs` — backend Apps Script kanonis (skema 115 kolom)
- `clasp-deploy/` — salinan backend untuk deploy via `clasp`
- `AUDIT_*.md`, `EMIS_*.md`, `NEW_COLUMNS_SPEC.md` — laporan audit dan spesifikasi data
- `panduan-shots/` — tangkapan layar verifikasi (Playwright)
- `test-uploads/` — file dummy untuk pengujian (bukan data asli)

## Pengembangan lokal

```bash
cd export-aistudio
npm install
npm run dev      # pengembangan
npm run build    # build produksi
npx vercel --prod --yes   # deploy ke Vercel
```

Perubahan backend: edit `Code.gs`, salin ke `clasp-deploy/Code.js`, lalu `clasp push` + `clasp deploy` memakai deployment ID yang sudah live. Setelah perubahan kode, perbarui juga ZIP cadangan dan commit ke repo ini.

## Yang tidak ada di repo ini (dan jangan dimasukkan)

Repo ini publik. **Jangan pernah** memasukkan ke repo: PIN admin, PIN wali, ID Spreadsheet, ID folder Drive, atau data pribadi pendaftar. Data pendaftar hanya ada di Spreadsheet dan Drive milik madrasah, dan tidak boleh disalin, difoto, atau dilaporkan isinya.
