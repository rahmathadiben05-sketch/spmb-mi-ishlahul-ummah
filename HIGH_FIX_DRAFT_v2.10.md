# DRAF PATCH — SPMB HIGH (H1): wali tidak boleh self-approve LULUS

Status: DRAF, belum diterapkan ke mana pun. Menunggu ACC Rahmat, lalu diterapkan
ke `Code.gs` + redeploy (versi baru, mis. v2.10) + verifikasi ulang.
Disusun 13 Nov 2026 ~10:00 WIB dari audit keamanan 13 Nov 09:38 dan `Code.gs` v2.9.

## Masalah (audit H1)

`updateRegistrationRecord(record, adminToken)` di `Code.gs:1943` memakai `buildRow()`
untuk membangun baris baru dari payload, lalu menimpa baris lama. Di jalur wali
(`adminToken` kosong, auth hanya PIN record), field admin tidak dipaksa kembali
ke nilai lama — jadi wali bisa mengirim `status: 'LULUS'` / `hasilPengumuman`
/ field pembayaran dan menaikkan statusnya sendiri.

Pola perbaikannya sudah ada di fungsi yang sama untuk kolom verifikasi
(`Code.gs` ~2070-2072): jalur wali memaksa `row[112]` dan `row[113]` kembali
ke `oldRow`. Patch ini memperluas pola yang sama ke kolom admin lainnya.

## Indeks kolom (0-based, diverifikasi dari HEADERS — total 114 kolom)

| Indeks | Kolom (HEADERS) | Diisi buildRow dari |
|---|---|---|
| 4 | Status | `record.status` |
| 65 | Hasil Observasi | `verif.hasilObservasi` |
| 66 | Catatan Observasi | `verif.catatanObservasi` |
| 67 | Wawancara Selesai | `verif.wawancaraSelesai` |
| 68 | Biaya Formulir Lunas | `verif.biayaFormulirLunas` |
| 69 | Paket Seragam Lunas | `verif.paketSeragamLunas` |
| 70 | Paket Buku Lunas | `verif.paketBukuLunas` |
| 71 | Pembayaran Lunas | `verif.pembayaranLunas` |
| 72 | Nominal Terbayar | `verif.nominalTerbayar` |
| 73 | Hasil Pengumuman | `record.hasilPengumuman` |
| 74 | Catatan Panitia | `record.catatanPengumuman` |

## Patch — sisipkan tepat setelah blok `if (!adminToken) { row[112]... }` yang sudah ada, sebelum `sheet.getRange(targetRow, 2, ...).setValues(...)`

```js
    // Jalur WALI tidak boleh menulis kolom status/pengumuman/pembayaran (H1):
    // paksa nilai lama — hanya jalur admin yang boleh mengubahnya.
    // Pola sama seperti kolom verifikasi 112-113 di atas.
    if (!adminToken) {
      var ADMIN_ONLY_IDX = [4, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74];
      for (var e = 0; e < ADMIN_ONLY_IDX.length; e++) {
        row[ADMIN_ONLY_IDX[e]] = oldRow[ADMIN_ONLY_IDX[e]];
      }
    }
```

## Yang TIDAK diubah patch ini

- Jalur admin (`adminToken` valid) tidak tersentuh: admin tetap bisa mengubah
  status / pengumuman / pembayaran seperti biasa.
- `saveRegistrationRecord` (pendaftaran baru) tidak tersentuh.
- Edit data wali yang sah (nama, alamat, dokumen, dsb.) tetap tersimpan —
  hanya 11 kolom di atas yang dipaksa ke nilai lama di jalur wali.

## Catatan di luar cakupan patch (jangan dicampur)

- Kolom inden 106-110 sudah dipertahankan bila `record.inden` tidak dikirim,
  tapi wali yang mengirim `record.inden` masih bisa mengubah DP/diskon (M1:
  harga dari klien). Itu temuan terpisah — putuskan sendiri apakah ikut dikunci.
- M2-M4/L1-L4 dari audit (rate limit, PIN admin cadangan, header keamanan,
  localStorage, validasi upload) tidak disentuh patch ini.

## Uji setelah deploy (wajib sebelum dinyatakan selesai)

1. Wali (PIN 0007 / PIN 282577 — baris tes, ikut cleanup): kirim update dengan
   `status: 'LULUS'` + `hasilPengumuman: 'LULUS'` yang dipalsukan → Sheets
   harus tetap menampilkan status lama, bukan LULUS.
2. Admin: ubah status satu baris tes menjadi 'terverifikasi' → harus tetap jalan.
3. Wali: edit data biasa (mis. alamat) → harus tetap tersimpan.
4. Verifikasi versi backend live berubah (mis. v2.10) dan deployment lama
   sudah tidak ada yang hidup (seperti penutupan deployment pra-v2.9 tadi).

## Langkah terapkan (setelah ACC)

1. Tempel patch ke `Code.gs` (fungsi `updateRegistrationRecord`).
2. `clasp push` + buat deployment versi baru; catat URL baru.
3. Ping backend, pastikan `version` baru; uji 1-3 di atas.
4. Baru setelah itu lanjutkan tahap admin E2E (verifikasi → LULUS, PIN admin
   diketik Rahmat sendiri) dan cleanup baris tes 0001-0007.
