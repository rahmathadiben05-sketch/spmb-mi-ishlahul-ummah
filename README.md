# SPMB MI Ishlahul Ummah 2027–2028 — Draf Awal Backend

Disiapkan 2026-11-09, sambil menunggu hasil export sementara dari Google AI Studio yang akan dikirim Rahmat.

## Keputusan yang sudah dicatat (dari Rahmat, 2026-11-09)

- Data pendaftaran **hanya ke Google Sheets** — tanpa database/server.
- **Satu file Spreadsheet, banyak tab**: satu tab per tahun ajaran, dibuat otomatis saat pendaftar pertama tahun itu masuk (mis. tab `2027-2028`).
- Pertanyaan formulir **mengikuti pendataan Kemenag (EMIS)** untuk MI di bawah Kemenag.
- Perbaikan dilakukan bertahap (satu fitur per langkah) karena limit AI Studio; hasil export diperbaiki di Antigravity atau dengan bantuan Muse.
- Vibe coding di sini bisa; deploy produksi disiapkan file-nya + dipandu, deploy penuh butuh akses akun hosting madrasah.

## File di folder ini

- **`Code.gs`** — backend Google Apps Script (draf, siap ditempel ke Apps Script):
  - `doPost` menerima JSON dari formulir, validasi field wajib, lalu menulis 1 baris ke tab tahun ajaran.
  - Tab tahun ajaran dibuat otomatis + header bila belum ada; baris pertama dibekukan.
  - `doGet` untuk cek cepat Web App hidup.
  - Kolom otomatis di tiap tab: `Timestamp`, `Tahun Ajaran`, `Status` (default `Baru`).
- **`README.md`** — file ini.

## Yang SENGAJA belum diisi

- **`FORM_FIELDS` di `Code.gs` masih kosong.** Daftar field formulir hanya diisi setelah export AI Studio diterima dan dicocokkan dengan pendataan EMIS — tidak dikarang dari ingatan (sesuai janji ke Rahmat).
- **`SPREADSHEET_ID` masih placeholder.** Diisi dengan ID file Sheets madrasah saat deploy.

## Cara deploy (setelah field terisi)

1. Buat Spreadsheet baru di akun madrasah → salin ID-nya ke `SPREADSHEET_ID`.
2. Extensions → Apps Script → tempel `Code.gs` → Save.
3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.
4. Salin Web App URL ke form hasil export AI Studio (ganti pengiriman form jadi `fetch` POST JSON ke URL itu).
5. Uji dengan 1 pendaftaran percobaan → cek baris masuk ke tab `2027-2028`.

## Keamanan data

- NIK dan data siswa masuk ke Sheets — **file hanya dibagikan ke akun madrasah yang berwenang**, jangan dibuka publik.
- Web App "Anyone" hanya boleh menulis lewat `doPost` (tidak ada endpoint baca/hapus data).

## Langkah berikutnya (menunggu Rahmat)

1. Kirim hasil export sementara AI Studio (zip / link Drive / repo).
2. Muse periksa kode export, isi `FORM_FIELDS` dari form + EMIS, sambungkan form ke `Code.gs` ini.
3. Uji kirim → cek tab `2027-2028` → serahkan file siap pakai untuk Antigravity/deploy.
