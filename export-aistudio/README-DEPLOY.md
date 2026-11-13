# SPMB MI Ishlahul Ummah — Panduan Deploy (untuk Pengelola Domain)

Paket ini adalah hasil pengembangan website SPMB MI Ishlahul Ummah TA 2027/2028
(versi pengembangan v2.9; peluncuran resmi di domain sekolah = v1.0.0).
Domain resmi: **https://spmb.ishlahul-ummah.sch.id**

## Cara deploy yang disarankan: Vercel

1. Unggah folder ini sebagai proyek baru di Vercel (atau `vercel deploy --prod`
   dari folder ini bila Vercel CLI sudah login).
2. Vercel akan menjalankan `npm install` lalu `npm run build` secara otomatis.
   Tidak ada environment variable yang wajib diisi.
3. Domain `spmb.ishlahul-ummah.sch.id` didaftarkan ke proyek Vercel ini
   SAAT DEPLOY (belum didaftarkan sekarang — deploy domain sekolah masih
   ditunda). Setelah didaftarkan, Vercel menampilkan record DNS yang harus
   dipasang — ikuti record tersebut (umumnya CNAME `spmb` ke alamat
   `*.vercel-dns-*.com` yang ditampilkan Vercel). Hapus/ganti A record lama
   untuk `spmb` bila ada.
   (Alternatif: pindahkan nameserver ke `ns1.vercel-dns.com` dan
   `ns2.vercel-dns.com`.)
4. Tunggu propagasi DNS (beberapa menit sampai beberapa jam), lalu buka
   https://spmb.ishlahul-ummah.sch.id dan pastikan situs tampil.

## Yang tidak boleh diubah

- URL webhook Google Apps Script di `lib/storage.ts` (backend sudah live, v2.9).
- File `Code.gs` (backend) — perubahan backend hanya lewat operator madrasah.
- Isi Spreadsheet "SPMB MI Ishlahul Ummah - Database Pendaftaran" dan folder
  Drive "SPMB MI Ishlahul Ummah - Dokumen Pendaftar" (data pendaftar).
- PIN admin diganti lewat panel admin (/admin → Ubah PIN Admin), bukan dari kode.

## Kontak operator

- Operator madrasah (penanggung jawab situs): Rahmat Hadi.
- Pendaftaran: satu periode, 1 November 2026 s.d. 30 Juni 2027 pukul 23.59 WIB.
- Biaya pendaftaran: Rp183.000 (inden: DP Rp50.000, diskon Rp25.000 untuk
  20 kursi pertama, pelunasan maks. 14 hari).
- WhatsApp resmi panitia: 085196677872.
