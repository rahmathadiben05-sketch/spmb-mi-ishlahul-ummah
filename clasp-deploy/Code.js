/**
 * ============================================================================
 * SPMB MI ISHLAHUL UMMAH — Backend Google Apps Script (TERPADU, v2)
 * Dibuat: 2026-11-09 — menggantikan draft v1 DAN generator bawaan AI Studio.
 *
 * Desain sesuai keputusan Rahmat (2026-11-09):
 * - Data pendaftaran HANYA ke Google Sheets (tanpa database/server lain).
 * - SATU file Spreadsheet, berisi BANYAK tab — satu tab per tahun ajaran
 *   (tab dibuat OTOMATIS saat pendaftar pertama tahun itu masuk).
 * - Penomoran pendaftaran dari SERVER (bukan dari browser) supaya tidak dobel.
 * - Duplikat dicek dari NIK anak (dan NISN bila ada) — BUKAN dari No KK,
 *   karena kakak-beradik serumah memakai No KK yang sama.
 * - File KK / Akta / Ijazah / Foto yang diunggah pendaftar disimpan ke
 *   folder Google Drive madrasah; di Sheet hanya tersimpan LINK-nya.
 * - Pendaftaran BEBAS (tanpa token). Login wali murid memakai No HP orang
 *   tua + PIN 6 digit yang dibuat saat pendaftaran.
 *
 * FIELD FORMULIR: pemetaan kolom di bawah ini mengikuti formulir export
 * AI Studio + tambahan "Berkebutuhan Khusus" (Rahmat, 2026-11-09).
 * Penyelarasan akhir dengan EMIS Kemenag DITUNDA sampai Rahmat mengarahkan
 * pengecekan ke website EMIS akun sekolah — kolom baru tinggal ditambah
 * di HEADERS + buildRow() di bawah.
 *
 * v2.1 (2026-11-10): kolom teks (PIN, NISN, NIK, No KK, No KIP, No HP, RT/RW,
 * Kode Pos) diformat plain-text supaya Sheets tidak mengubahnya jadi angka
 * dan memotong nol di depan (mis. No HP 0812... sempat tersimpan 812...).
 *
 * v2.2 (2026-11-10): v2.1 TERNYATA TIDAK CUKUP — uji 2026-11-10 membuktikan
 * setNumberFormat('@') saja tidak menahan Sheets: appendRow menulis dengan
 * USER_ENTERED sehingga string angka tetap diparse jadi angka (PIN 012345
 * tersimpan 12345, No HP 0812... tersimpan 812..., RT 01 tersimpan 1).
 * Mulai v2.2, nilai kolom teks diawali apostrof (') lewat helper t() di
 * bawah, supaya tersimpan sebagai teks utuh. Format '@' tetap dipertahankan
 * untuk pengetikan manual. Apostrof tidak tampil dan tidak ikut terbaca
 * saat nilai diambil kembali (getValues mengembalikan '012345' dst.).
 *
 * v2.3 (2026-11-10): validasi usia (keputusan Rahmat) — calon santri kelas 1
 * minimal sudah berusia 6 tahun per 1 Juli 2027 (tanggal lahir paling lambat
 * 1 Juli 2021). Dicek di server juga, supaya pendaftar yang lolos dari
 * formulir (atau kirim langsung) tetap ditolak.
 *
 * v2.4 (2026-11-10): kejujuran sync — endpoint updateRegistration (cari
 * baris berdasarkan nomor pendaftaran, timpa fieldnya dengan setValues);
 * upload dokumen ke Drive dipindah SEBELUM lock penomoran (lock hanya
 * untuk cek duplikat + penomoran + appendRow, supaya tidak kedaluwarsa di
 * tengah upload); gagal upload dokumen wajib (KK/Akta) = gagal submit
 * tanpa appendRow; validasi header tab sebelum menulis; respons doGet/ping
 * membawa version 'v2.4'.
 *
 * v2.5 (2026-11-11): statistik publik — action getPublicStats (hitungan
 * kursi terisi dari jumlah baris tab tahun ajaran, tanpa data pribadi).
 *
 * v2.7 (2026-11-11): sistem inden + diskon Gelombang 1 — 5 kolom baru
 * (107-111: Status Inden, Jumlah DP, Diskon Diberikan, Sisa Bayar,
 * Batas Pelunasan); action createInden / confirmDp / completeInden /
 * extendInden / markIndenExpired; getPublicStats menghitung inden dan
 * sisa kuota diskon (baris 'Inden Kedaluwarsa' tidak terhitung).
 * PLUS sinkronisasi settings server: tab 'Pengaturan' menyimpan JSON
 * {settings, waves, academicYears} ter-chunk 40.000 karakter/baris;
 * action getSettings (publik, baca) / saveSettings (tulis, lock).
 * CATATAN: saveSettings tanpa auth server-side — siapa pun yang tahu URL
 * webhook bisa menulis settings (admin PIN saat ini client-side saja).
 *
 * v2.8 (2026-11-11): daftar pendaftar untuk admin — action
 * listRegistrations (baca tab tahun ajaran, tanpa membuat tab, tanpa
 * menulis apa pun) + rowToRecord() sebagai kebalikan persis buildRow()
 * (sebelum v2.8 tidak ada mapper baris-ke-record). Termasuk kolom inden
 * 107-111. Tab yang belum ada -> array kosong, success:true.
 * v2.9 (2026-11-11): rilis gabungan perbaikan audit ulang — Paket 0 + A + B + C.
 * - saveSettings: amplop frontend kini {action, data:{settings, waves,
 *   academicYears}}; backend MENOLAK bila data.settings bukan objek atau
 *   settings.namaMadrasah kosong — menulis {} tidak mungkin lagi sukses.
 * - 5 action inden (createInden/confirmDp/completeInden/extendInden/
 *   markIndenExpired): amplop frontend kini {action, data:{...payload}};
 *   backend menolak payload kosong di tiap action.
 * - doGet/ping membawa version 'v2.9'.
 * v2.10 (2026-11-13): H1 — jalur WALI updateRegistration tidak lagi bisa
 *   mengubah status, hasilPengumuman, kolom verifikasi/pembayaran, dan
 *   angka inden (semuanya dipaksa ke nilai lama); doGet/ping 'v2.10'.
 * v2.11 (2026-11-13): perbaikan audit M1-M4 + L1/L4/L5 — M1 harga inden
 *   dari server, M2 throttle tulis publik, M3 bootstrap PIN dihapus,
 *   M4 jeda progresif ganti lockout, L1 ID internal disaring, L4 validasi
 *   MIME/ukuran upload, L5 PIN tak dikembalikan + error generik.
 * v2.12 (2026-11-13): kolom 115 'No WA Pendaftaran' — nomor WA kartu
 *   akses disimpan sendiri dan ikut dicari getRegistration, supaya login
 *   WA tetap jalan bila Langkah 2 mengubah nomor ayah/ibu/wali;
 *   doGet/ping 'v2.12'.
 * v2.13 (2026-11-17): NIK + tanggal lahir Ayah/Ibu wajib bila masih
 *   hidup (keputusan Rahmat) — ditegakkan di save + update, supaya data
 *   EMIS lengkap sejak pendaftaran; doGet/ping 'v2.13'.
 * PLUS login wali: action getRegistration (satu record berdasarkan
 * nomor pendaftaran ATAU nomor WA + PIN 6 digit, PIN diverifikasi di
 * server; gagal selalu satu respons generik yang sama supaya tidak
 * membocorkan apakah nomornya ada). Pakai rowToRecord yang sama.
 * KEAMANAN (batasan yang diketahui): seperti getPublicStats/getSettings,
 * listRegistrations tanpa auth server-side — siapa pun yang tahu URL
 * webhook bisa memanggilnya dan menerima seluruh data pendaftar tahun
 * ajaran tersebut. Admin PIN saat ini client-side saja.
 * (DITUTUP di v2.9 — lihat Paket A di bawah.)
 * — Paket A: auth admin server-side.
 * - Action verifyAdminPin: PIN admin dicek DI SERVER terhadap Script
 *   Properties (ADMIN_PIN); bila cocok, terbit token sesi acak
 *   (CacheService, TTL 2 jam, terikat ADMIN_TOKEN_VERSION). PIN lama
 *   TIDAK LAGI BERLAKU. Bila Script Properties kosong, login admin tidak
 *   mungkin berhasil (fail closed — bootstrap dihapus di v2.11, M3).
 * - Action admin WAJIB token valid: listRegistrations, saveSettings,
 *   confirmDp, completeInden, extendInden, markIndenExpired, dan jalur
 *   admin updateRegistration. Tanpa token/kedaluwarsa/versi tidak cocok
 *   -> error generik 'Sesi admin berakhir / token tidak valid'.
 * - Jalur wali updateRegistration wajib PIN record yang cocok.
 * - getRegistration: rate limit maks. 5 gagal per identifier/jam
 *   (CacheService); identifier yang mencapai batas ditahan sampai
 *   jendela berakhir — PIN benar pun ditolak selama terkunci — dengan
 *   respons gagal yang tetap generik. verifyAdminPin dibatasi maks.
 *   10 gagal/jam (global), respons tetap generik.
 * - Action baru changePin (ganti PIN wali, tersinkron ke Sheets) dan
 *   changeAdminPin (ganti PIN admin; menaikkan ADMIN_TOKEN_VERSION
 *   sehingga semua token lama langsung tidak berlaku).
 * - Action checkNik DIHAPUS. Pesan duplikat NIK/NISN menjadi generik
 *   (tanpa nilai NIK/NISN, tanpa nomor baris). Log server (addAuditLog)
 *   hanya memakai nomor pendaftaran, tanpa nama.
 * - rowToRecord: verification membawa verifiedAt/verifiedBy (kosong
 *   bila belum terverifikasi — Sheets tidak punya kolom untuk keduanya).
 * BATASAN YANG TERSISA: (1) rate limit berbasis CacheService — batas
 *   dasar anti-brute-force, bukan penghitung presisi; (2) token sesi
 *   adalah bearer token tanpa ikatan perangkat/IP; siapa pun yang
 *   memegang token bisa memakai semua action admin sampai token
 *   kedaluwarsa/dicabut lewat ganti PIN; (3) Web App 'Anyone' tetap
 *   terbuka — action publik hanya data non-sensitif; (4) action
 *   generateTokens (legacy) DIHAPUS di v2.9 — pendaftaran tidak
 *   memakainya; tidak ada lagi action tanpa auth yang menulis ke Sheets.
 * — Paket C: kolom 112 'Email Orang Tua/Wali' (di akhir;
 * buildRow/rowToRecord + migrasi header otomatis, pola v2.4/v2.7);
 * cek duplikat WA di server (save/update/createInden, di dalam lock,
 * pesan generik tanpa nomor/baris/nama); penegakan server-side
 * minimal satu No HP orang tua/wali yang valid + 3 field wajib EMIS
 * di update (save sudah menegakkan ketiganya); email lama
 * dipertahankan bila update tidak membawa email.
 * — Penutup M9 (koordinator): kolom 113 'Terverifikasi Pada' + 114
 * 'Terverifikasi Oleh' (di akhir); buildRow/rowToRecord + preservasi
 * di update; jalur admin yang mengubah status menjadi 'terverifikasi'
 * mengisi keduanya otomatis bila masih kosong.
 *
 * CARA PAKAI:
 * 1. File Spreadsheet sudah dibuat: "SPMB MI Ishlahul Ummah - Database
 *    Pendaftaran" (ID di CONFIG bawah). Folder Drive dokumen juga sudah ada.
 * 2. Di Spreadsheet itu: Ekstensi > Apps Script, hapus kode default,
 *    tempel file ini, simpan.
 * 3. Deploy > New deployment > Web app, Execute as: Me,
 *    Who has access: Anyone (agar formulir publik bisa POST).
 * 4. Salin Web App URL (.../exec) ke Pengaturan Integrasi di Dashboard
 *    Admin SPMB (kolom URL Webhook Google Apps Script).
 * 5. Uji: buka URL .../exec?action=ping di browser — harus balas JSON sukses.
 * ============================================================================
 */

// ============ KONFIGURASI (sudah terisi — jangan diubah sembarangan) ============
var CONFIG = {
  SPREADSHEET_ID: '1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4',
  DRIVE_FOLDER_ID: '1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua',
  SHEET_LOGS: 'Log Aktivitas',
  SHEET_SETTINGS: 'Pengaturan'
};

// ============ AUTH ADMIN SERVER-SIDE (v2.9, Paket A) ============
// PIN admin TIDAK PERNAH ada di bundle frontend. PIN yang berlaku disimpan
// di Script Properties (key ADMIN_PIN).
// (v2.11, M3) Nilai awal ADMIN_PIN_BOOTSTRAP DIHAPUS: bila Script
// Properties kosong, login admin GAGAL TERTUTUP (fail closed) — tidak ada
// lagi PIN cadangan yang bisa ditebak. Penggantian PIN memakai fitur Ubah
// PIN Admin (action changeAdminPin). PIN yang sudah tersimpan di Script
// Properties TIDAK berubah oleh penghapusan ini.
var ADMIN_PIN_KEY = 'ADMIN_PIN';
var ADMIN_TOKEN_VERSION_KEY = 'ADMIN_TOKEN_VERSION';
var ADMIN_TOKEN_TTL_SECONDS = 7200; // 2 jam
var ADMIN_TOKEN_ERROR = 'Sesi admin berakhir / token tidak valid';

// PIN admin yang berlaku: Script Properties dulu; bila kosong, login
// admin tidak mungkin berhasil (fail closed, v2.11 — M3).
function getAdminPin() {
  var props = PropertiesService.getScriptProperties();
  var pin = props.getProperty(ADMIN_PIN_KEY);
  if (pin) return String(pin);
  return '';
}

// Versi token saat ini (default 1). Dinaikkan tiap ganti PIN admin —
// semua token lama langsung tidak berlaku.
function getAdminTokenVersion() {
  var props = PropertiesService.getScriptProperties();
  var v = props.getProperty(ADMIN_TOKEN_VERSION_KEY);
  var n = parseInt(v, 10);
  if (!n || n < 1) {
    props.setProperty(ADMIN_TOKEN_VERSION_KEY, '1');
    return 1;
  }
  return n;
}

// Terbitkan token sesi admin acak; nilai cache = versi token saat diterbitkan.
function issueAdminToken() {
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('adminToken:' + token, String(getAdminTokenVersion()), ADMIN_TOKEN_TTL_SECONDS);
  return token;
}

// Token valid bila ada di cache DAN versinya masih sama dengan versi saat ini.
function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  var stored = CacheService.getScriptCache().get('adminToken:' + token);
  if (!stored) return false;
  return String(stored) === String(getAdminTokenVersion());
}

// Gerbang action admin: {ok:true} atau {ok:false, response:{...}}.
function requireAdminToken(contents) {
  if (contents && verifyAdminToken(contents.adminToken)) return { ok: true };
  return { ok: false, response: { success: false, error: ADMIN_TOKEN_ERROR } };
}

// ============ RATE LIMIT DASAR (CacheService, v2.9; jeda progresif v2.11) ============
// Hitung kegagalan per kunci dalam jendela 1 jam. Batasan: CacheService
// bisa kedaluwarsa lebih cepat / tidak konsisten antar eksekusi — ini
// pembatas dasar anti-brute-force, bukan penghitung presisi.
// (v2.11, M4) TIDAK ADA LAGI lockout keras: kegagalan beruntun hanya
// menambah JEDA progresif (1 dtk setelah 3 gagal, lalu 2/4/8/16 dtk,
// mentok 30 dtk) lewat Utilities.sleep sebelum pengecekan. Brute-force
// tetap tidak layak (30 dtk/tebakan), tapi penyerang tidak bisa lagi
// mengunci admin/wali mana pun — pemilik PIN yang benar cukup menunggu
// jeda itu sekali lalu berhasil dan penghitung direset.
function rateLimitKey(scope, id) {
  return 'rl:' + scope + ':' + String(id || '').replace(/[^A-Za-z0-9]/g, '');
}

function getRateLimitCount(key) {
  var n = parseInt(CacheService.getScriptCache().get(key), 10);
  return (!n || n < 0) ? 0 : n;
}

function isRateLimited(scope, id, maxFail) {
  return getRateLimitCount(rateLimitKey(scope, id)) >= maxFail;
}

function recordRateLimitFail(scope, id) {
  var key = rateLimitKey(scope, id);
  var n = getRateLimitCount(key) + 1;
  CacheService.getScriptCache().put(key, String(n), 3600);
  return n;
}

function clearRateLimit(scope, id) {
  try { CacheService.getScriptCache().remove(rateLimitKey(scope, id)); } catch (e) {}
}

// (v2.11, M4) Jeda progresif dari jumlah kegagalan: <3 gagal = 0;
// 3 gagal = 1 dtk, lalu berlipat (2/4/8/16 dtk), mentok 30 dtk.
function rateLimitDelayMs(scope, id) {
  var n = getRateLimitCount(rateLimitKey(scope, id));
  if (n < 3) return 0;
  var ms = 1000 * Math.pow(2, n - 3);
  return Math.min(ms, 30000);
}

// ============ BATAS TULIS PUBLIK (v2.11, M2) ============
// Hitung kiriman (bukan kegagalan) per identifier per jam untuk action
// tulis publik (saveRegistration, createInden). Batas per identifier
// saja — TIDAK ADA batas global, supaya penyerang tidak bisa mengunci
// semua pendaftar dengan membanjiri kuota global. Kiriman sah: orang tua
// normal mengirim 1x (sesekali retry/kakak-beradik), jadi 10/jam per WA
// dan 5/jam per NIK longgar; 5/jam per WA untuk inden.
function writeLimitKey(scope, id) {
  return 'wl:' + scope + ':' + String(id || '').replace(/[^A-Za-z0-9]/g, '');
}

function getWriteCount(key) {
  var n = parseInt(CacheService.getScriptCache().get(key), 10);
  return (!n || n < 0) ? 0 : n;
}

function isWriteLimited(scope, id, maxPerHour) {
  return getWriteCount(writeLimitKey(scope, id)) >= maxPerHour;
}

function recordWriteAttempt(scope, id) {
  var key = writeLimitKey(scope, id);
  var n = getWriteCount(key) + 1;
  CacheService.getScriptCache().put(key, String(n), 3600);
  return n;
}

// ============ HEADER TAB TAHUN AJARAN (urutan = urutan kolom di Sheet) ============
// HATI-HATI: menambah/menghapus kolom di sini HARUS diikuti buildRow() di bawah
// dan pemetaan di aplikasi web (kolom baru = kolom baru di akhir lebih aman).
var HEADERS = [
  'Timestamp',
  'No Pendaftaran',
  'PIN Wali',
  'Jalur',
  'Status',
  'Tahun Ajaran',
  'Gelombang',
  'Nama Lengkap',
  'Nama Panggilan',
  'NISN',
  'NIK',
  'No KK',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Jenis Kelamin',
  'Anak Ke',
  'Jumlah Saudara',
  'No KIP',
  'Asal TK/RA/SD',
  'Berkebutuhan Khusus',
  'Asal Sekolah Pindahan',
  'Kelas Terakhir Pindahan',
  'Alasan Pindah',
  'Nama Ayah',
  'NIK Ayah',
  'Status Ayah',
  'Tempat Lahir Ayah',
  'Tanggal Lahir Ayah',
  'Pendidikan Ayah',
  'Pekerjaan Ayah',
  'Penghasilan Ayah',
  'No HP Ayah',
  'Nama Ibu',
  'NIK Ibu',
  'Status Ibu',
  'Tempat Lahir Ibu',
  'Tanggal Lahir Ibu',
  'Pendidikan Ibu',
  'Pekerjaan Ibu',
  'Penghasilan Ibu',
  'No HP Ibu',
  'Nama Wali',
  'Hubungan Wali',
  'NIK Wali',
  'Status Wali',
  'Tempat Lahir Wali',
  'Tanggal Lahir Wali',
  'Pendidikan Wali',
  'Pekerjaan Wali',
  'Penghasilan Wali',
  'No HP Wali',
  'Provinsi',
  'Kabupaten/Kota',
  'Kecamatan',
  'Kelurahan/Desa',
  'RT',
  'RW',
  'Alamat Lengkap',
  'Kode Pos',
  'Link KK',
  'Link Akta Kelahiran',
  'Link Bukti NISN',
  'Link Ijazah TK/RA',
  'Link Pas Foto',
  'Link Surat Pindah / Rapor',
  'Hasil Observasi',
  'Catatan Observasi',
  'Wawancara Selesai',
  'Biaya Formulir Lunas',
  'Paket Seragam Lunas',
  'Paket Buku Lunas',
  'Pembayaran Lunas',
  'Nominal Terbayar',
  'Hasil Pengumuman',
  'Catatan Panitia',
  // --- Kolom baru selaras EMIS 4.0 (76-105, koordinator 2026-11-10) ---
  'Kewarganegaraan',
  'Agama',
  'Hobi',
  'Cita-cita',
  'Yang Membiayai Sekolah',
  'Pra Sekolah TK/RA',
  'Pra Sekolah PAUD',
  'Imunisasi Hepatitis B',
  'Imunisasi Polio',
  'Imunisasi BCG',
  'Imunisasi Campak',
  'Imunisasi DPT',
  'Imunisasi Covid',
  'Email Siswa',
  'NIS Lokal',
  'No KKS',
  'No PKH',
  'Kewarganegaraan Ayah',
  'Kewarganegaraan Ibu',
  'Kewarganegaraan Wali',
  'Status Wali',
  'Total Gabungan Penghasilan',
  'Status Kepemilikan Rumah',
  'Status Tempat Tinggal',
  'Jarak ke Madrasah',
  'Transportasi ke Sekolah',
  'Waktu Tempuh',
  'Koordinat Alamat',
  'Link KKS',
  'Link PKH',
  // Kolom 106: disabilitas (EMIS KEBUTUHAN DISABILITAS), opsional.
  'Kebutuhan Disabilitas',
  // --- Kolom inden + diskon Gelombang 1 (107-111, v2.7) ---
  'Status Inden',
  'Jumlah DP',
  'Diskon Diberikan',
  'Sisa Bayar',
  'Batas Pelunasan',
  // --- Kolom 112 (Paket C): Email Orang Tua/Wali (opsional).
  // BARU DI AKHIR — jangan sisip di tengah: 111 kolom lama tidak bergeser.
  'Email Orang Tua/Wali',
  // --- Kolom 113-114 (v2.9, penutup M9): kapan + oleh siapa verifikasi
  // dicatat. BARU DI AKHIR — 112 kolom lama tidak bergeser.
  'Terverifikasi Pada',
  'Terverifikasi Oleh',
  // Kolom 115 (v2.12): No WA Pendaftaran — nomor WA kartu akses; skema
  // kini 115 kolom (migrasi header otomatis menambahkannya di akhir).
  'No WA Pendaftaran'
];

// ============ UTIL ============
function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tabNameForYear(tahunAjaran) {
  return String(tahunAjaran || '2027/2028').trim().replace('/', '-');
}

function getSpreadsheet() {
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) return activeSs;
  } catch (e) {}
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.length > 15) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  throw new Error('Spreadsheet tidak ditemukan. Isi CONFIG.SPREADSHEET_ID atau buat script dari menu Ekstensi > Apps Script di Spreadsheet.');
}

function getOrCreateYearSheet(tahunAjaran) {
  var ss = getSpreadsheet();
  var name = tabNameForYear(tahunAjaran);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#E6F4EA');
    sheet.setFrozenRows(1);
  }
  // Kolom teks — format plain-text supaya Sheets tidak mengubah isinya jadi
  // angka dan memotong nol di depan (No HP 0812..., RT/RW 01/02, PIN 0xxxxx):
  // C PIN Wali, J NISN, K NIK, L No KK, R No KIP, Y NIK Ayah, AH NIK Ibu,
  // AR NIK Wali, AF/AO/AY No HP, BD RT, BE RW, BG Kode Pos, DH Email
  // Orang Tua/Wali (kolom 112), DI/DJ Terverifikasi (kolom 113-114).
  // Format ini saja TIDAK cukup saat menulis lewat appendRow (lihat helper t()
  // di bawah) — tapi tetap dipertahankan untuk pengetikan manual di Sheet.
  var TEXT_COLS = ['C', 'J', 'K', 'L', 'R', 'Y', 'AH', 'AR', 'AF', 'AO', 'AY', 'BD', 'BE', 'BG', 'CL', 'CM', 'CN', 'DH', 'DI', 'DJ'];
  for (var i = 0; i < TEXT_COLS.length; i++) {
    sheet.getRange(TEXT_COLS[i] + '2:' + TEXT_COLS[i]).setNumberFormat('@');
  }
  return sheet;
}

function getOrCreateSimpleSheet(name, headers) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addAuditLog(user, action, details) {
  try {
    var sheet = getOrCreateSimpleSheet(CONFIG.SHEET_LOGS,
      ['ID Log', 'Waktu', 'Pengguna', 'Aksi', 'Keterangan']);
    sheet.appendRow(['log-' + new Date().getTime(), new Date().toISOString(), user, action, details]);
  } catch (e) {}
}

function s(v) {
  if (v === undefined || v === null) return '';
  return String(v);
}

// t() — nilai kolom TEKS (PIN, NISN, NIK, No KK, No KIP, No HP, RT/RW,
// Kode Pos). appendRow menulis dengan USER_ENTERED: string yang terlihat
// seperti angka diparse jadi angka dan nol di depannya hilang, MESKIPUN sel
// sudah diformat plain-text. Awalan apostrof (') memaksa Sheets menyimpan
// nilai sebagai teks utuh; apostrof tidak tampil dan tidak ikut terbaca
// kembali (getValues() mengembalikan '012345' dst. tanpa apostrof).
function t(v) {
  if (v === undefined || v === null || v === '') return '';
  return "'" + String(v);
}

function num(v) {
  if (v === undefined || v === null || v === '') return '';
  return Number(v);
}

// ============ ENDPOINTS ============
function doGet(e) {
  return responseJSON({
    success: true,
    version: 'v2.13',
    service: 'SPMB MI Ishlahul Ummah',
    message: 'Backend Google Apps Script SPMB aktif dan siap menerima data.',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var contents = {};
    if (e && e.postData && e.postData.contents) {
      try {
        contents = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return responseJSON({ success: false, error: 'Gagal parse JSON: ' + parseErr.toString() });
      }
    }
    var action = contents.action || (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'ping') {
      return responseJSON({ success: true, version: 'v2.12', message: 'Koneksi Webhook Google Apps Script berhasil!' });
    }
    if (action === 'verifyAdminPin') {
      return responseJSON(verifyAdminPinRecord(contents));
    }
    if (action === 'changePin') {
      return responseJSON(changePinRecord(contents));
    }
    if (action === 'changeAdminPin') {
      return responseJSON(changeAdminPinRecord(contents));
    }
    if (action === 'saveRegistration') {
      return responseJSON(saveRegistrationRecord(contents.data || {}));
    }
    if (action === 'updateRegistration') {
      return responseJSON(updateRegistrationRecord(contents.data || {}, contents.adminToken));
    }
    // (v2.9) Action generateTokens (legacy) DIHAPUS — pendaftaran tidak
    // memakainya; action tanpa auth yang menulis ke Sheets tidak ada lagi.
    if (action === 'getPublicStats') {
      return responseJSON(getPublicStats(contents.academicYear || '2027/2028', contents.kuotaDiskon));
    }
    if (action === 'listRegistrations') {
      var listAuth = requireAdminToken(contents);
      if (!listAuth.ok) return responseJSON(listAuth.response);
      return responseJSON(listRegistrations(contents.tahunAjaran || contents.academicYear));
    }
    if (action === 'getRegistration') {
      return responseJSON(getRegistration(contents));
    }
    if (action === 'createInden') {
      return responseJSON(createIndenRecord(contents.data || {}));
    }
    if (action === 'confirmDp') {
      var dpAuth = requireAdminToken(contents);
      if (!dpAuth.ok) return responseJSON(dpAuth.response);
      return responseJSON(confirmDpRecord(contents.data || {}));
    }
    if (action === 'completeInden') {
      var completeAuth = requireAdminToken(contents);
      if (!completeAuth.ok) return responseJSON(completeAuth.response);
      return responseJSON(completeIndenRecord(contents.data || {}));
    }
    if (action === 'extendInden') {
      var extendAuth = requireAdminToken(contents);
      if (!extendAuth.ok) return responseJSON(extendAuth.response);
      return responseJSON(extendIndenRecord(contents.data || {}));
    }
    if (action === 'markIndenExpired') {
      var expiredAuth = requireAdminToken(contents);
      if (!expiredAuth.ok) return responseJSON(expiredAuth.response);
      return responseJSON(markIndenExpiredRecord(contents.data || {}));
    }
    if (action === 'getSettings') {
      return responseJSON(getSettings());
    }
    if (action === 'saveSettings') {
      var settingsAuth = requireAdminToken(contents);
      if (!settingsAuth.ok) return responseJSON(settingsAuth.response);
      return responseJSON(saveSettings(contents.data || {}));
    }
    // (v2.11, L5) Pesan generik — nama action tidak digemakan.
    return responseJSON({ success: false, error: 'Action tidak dikenal.' });
  } catch (err) {
    return responseJSON({ success: false, error: String(err) });
  }
}

// ============ STATISTIK PUBLIK (hanya hitungan, tanpa data pribadi) ============
// Dipakai halaman depan untuk penghitung "kursi terisi" dan sisa kuota
// diskon. Tidak menulis apa pun.
// - total: baris yang Status Inden-nya BUKAN 'Inden Kedaluwarsa'
//   (baris lama tanpa Status Inden ikut terhitung; baris 'Inden' ikut
//   terhitung sebagai kursi terisi; baris kedaluwarsa kursinya lepas).
// - diskonTerpakai: baris dengan Diskon Diberikan > 0 DAN Status Inden
//   bukan 'Inden Kedaluwarsa'.
// - sisaKuotaDiskon: max(0, kuotaDiskon - diskonTerpakai), default kuota 20.
function getPublicStats(academicYear, kuotaDiskon) {
  var sheet = getOrCreateYearSheet(academicYear);
  var lastRow = sheet.getLastRow();
  var total = 0;
  var diskonTerpakai = 0;
  if (lastRow > 1) {
    // Tab lama (106 kolom) belum punya kolom 107/109 — getMaxColumns
    // dipakai supaya tidak membaca di luar grid tab lama.
    var maxCols = sheet.getMaxColumns();
    var statusVals = maxCols >= 107
      ? sheet.getRange(2, 107, lastRow - 1, 1).getValues() : null;
    var diskonVals = maxCols >= 109
      ? sheet.getRange(2, 109, lastRow - 1, 1).getValues() : null;
    for (var i = 0; i < lastRow - 1; i++) {
      var st = statusVals ? String(statusVals[i][0] || '').trim() : '';
      if (st === 'Inden Kedaluwarsa') continue;
      total++;
      var d = diskonVals ? Number(diskonVals[i][0] || 0) : 0;
      if (d > 0) diskonTerpakai++;
    }
  }
  var kuota = parseInt(kuotaDiskon, 10);
  if (!kuota || kuota < 0) kuota = 20;
  return {
    success: true,
    total: total,
    diskonTerpakai: diskonTerpakai,
    sisaKuotaDiskon: Math.max(0, kuota - diskonTerpakai),
    academicYear: academicYear
  };
}

// ============ LIST REGISTRATIONS (v2.8) ============
// Dibaca admin untuk menyamakan daftar pendaftar di semua device
// (localStorage jadi fallback bila server tidak terjangkau).
// - READ-ONLY: tidak membuat tab tahun ajaran, tidak menulis/menambah
//   header, tidak menyentuh tab 'Pengaturan'. Tab yang belum ada ->
//   array kosong dengan success:true (bukan error).
// - Baris kosong / tanpa nomor pendaftaran dilewati.
// - Dokumen: HANYA link Drive yang sudah tersimpan di kolom dokumen
//   (bentuk { url }); isi file tidak pernah dibaca/disertakan.
// - Diurutkan menurut nomor pendaftaran (format bernol di depan, jadi
//   urut leksikografis = urut numerik).
// KEAMANAN (batasan yang diketahui): seperti getPublicStats/getSettings,
// action ini tanpa auth server-side — siapa pun yang tahu URL webhook
// bisa memanggilnya dan menerima SELURUH data pendaftar tahun ajaran
// tersebut. Admin PIN saat ini client-side saja.

// u() — kebalikan t(): hapus SATU apostrof di depan bila ada (t()
// menulis nilai teks dengan awalan apostrof; getValues() biasanya sudah
// menghilangkannya, ini pengaman bila masih terbawa).
function u(v) {
  var str = s(v);
  if (str.charAt(0) === "'") return str.substring(1);
  return str;
}

// dstr() — sel tanggal (Date dari getValues, atau string) -> 'YYYY-MM-DD'
// memakai getter lokal supaya tidak geser hari karena zona waktu UTC.
function dstr(v) {
  if (v === undefined || v === null || v === '') return '';
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    var m = v.getMonth() + 1;
    var d = v.getDate();
    return v.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  return String(v).slice(0, 10);
}

// tsIso() — Timestamp (kolom A) -> string ISO, atau string apa adanya.
function tsIso(v) {
  if (v === undefined || v === null || v === '') return '';
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    return v.toISOString();
  }
  return String(v);
}

// ya() — sel 'Ya'/kosong -> boolean.
function ya(v) {
  return String(v || '').trim() === 'Ya';
}

// n0() — sel angka -> Number, kosong/bukan angka -> 0.
function n0(v) {
  if (v === undefined || v === null || v === '') return 0;
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

// normalizeWa() — kanonik nomor WhatsApp Indonesia: hanya digit,
// '08...' -> '628...', '62...' tetap, '+62...' -> '628...'.
// Pola dasarnya sudah dipakai inline di createIndenRecord
// (s(x).replace(/\D/g, '')); helper ini memusatkan pola itu supaya
// pencocokan nomor wali konsisten di semua action.
function normalizeWa(v) {
  var d = s(v).replace(/\D/g, '');
  if (d.charAt(0) === '0') return '62' + d.substring(1);
  return d;
}

// rowToRecord() — kebalikan persis buildRow(): satu baris Sheet (array
// nilai, indeks = HEADERS) -> record bentuk yang sama seperti yang
// dikirim saveRegistrationRecord/updateRegistrationRecord, supaya admin
// bisa memakai hasilnya langsung (termasuk update ulang).
// Baris tab lama (106 kolom) dipad dengan '' supaya indeks 106-110 aman.
function rowToRecord(row) {
  var r = row.slice(0);
  while (r.length < HEADERS.length) r.push('');
  var nomor = s(r[1]).trim();
  var statusInden = s(r[106]).trim();
  var fotoLink = s(r[63]).trim();
  var ijazahLink = s(r[62]).trim();
  var documents = {};
  function docLink(key, idx) {
    var link = s(r[idx]).trim();
    if (link) documents[key] = { url: link };
  }
  docLink('kk', 59);
  docLink('akta', 60);
  docLink('nisnDoc', 61);
  docLink('ijazahTk', 62);
  docLink('foto', 63);
  docLink('ijazahAtauSuratPindah', 64);
  docLink('kks', 103);
  docLink('pkh', 104);
  if (ijazahLink) documents.memilikiIjazahTk = true;

  var jk = s(r[14]).trim();
  var hp = s(r[73]).trim();
  var namaWali = s(r[41]).trim();
  var record = {
    id: nomor,
    nomorPendaftaran: nomor,
    tokenCode: '',
    // (v2.11, L5) PIN TIDAK PERNAH dikembalikan di respons API — frontend
    // memasang kembali PIN yang baru saja diketik wali (sudah terverifikasi
    // server saat login) lewat fetchServerRegistration.
    pin: '',
    // (v2.12) No WA Pendaftaran (kolom 115) — nomor WA kartu akses.
    noWaPendaftaran: u(r[114]),
    jenisPendaftaran: s(r[3]).trim() === 'Siswa Pindahan' ? 'pindahan' : 'baru',
    status: s(r[4]).trim(),
    createdAt: tsIso(r[0]),
    updatedAt: tsIso(r[0]),
    academicYear: s(r[5]).trim(),
    wave: s(r[6]),
    student: {
      namaLengkap: s(r[7]),
      namaPanggilan: s(r[8]),
      nisn: u(r[9]),
      nik: u(r[10]),
      noKk: u(r[11]),
      tempatLahir: s(r[12]),
      tanggalLahir: dstr(r[13]),
      jenisKelamin: jk === 'Laki-laki' ? 'L' : (jk === 'Perempuan' ? 'P' : ''),
      anakKe: n0(r[15]),
      jumlahSaudara: n0(r[16]),
      nomorKip: u(r[17]),
      asalSekolah: s(r[18]),
      kebutuhanKhusus: s(r[19]),
      asalSekolahPindahan: s(r[20]),
      kelasTerakhirPindahan: s(r[21]),
      alasanPindah: s(r[22]),
      kewarganegaraan: s(r[75]),
      agama: s(r[76]),
      hobi: s(r[77]),
      citaCita: s(r[78]),
      yangMembiayaiSekolah: s(r[79]),
      praSekolahTkRa: ya(r[80]),
      praSekolahPaud: ya(r[81]),
      imunisasiHepatitisB: ya(r[82]),
      imunisasiPolio: ya(r[83]),
      imunisasiBcg: ya(r[84]),
      imunisasiCampak: ya(r[85]),
      imunisasiDpt: ya(r[86]),
      imunisasiCovid: ya(r[87]),
      emailSiswa: s(r[88]),
      nisLokal: u(r[89]),
      nomorKks: u(r[90]),
      nomorPkh: u(r[91]),
      kebutuhanDisabilitas: s(r[105]),
      fotoUrl: fotoLink
    },
    parent: {
      ayah: {
        namaLengkap: s(r[23]),
        nik: u(r[24]),
        status: s(r[25]),
        tempatLahir: s(r[26]),
        tanggalLahir: dstr(r[27]),
        pendidikan: s(r[28]),
        pekerjaan: s(r[29]),
        penghasilan: s(r[30]),
        noHp: u(r[31]),
        kewarganegaraan: s(r[92])
      },
      ibu: {
        namaLengkap: s(r[32]),
        nik: u(r[33]),
        status: s(r[34]),
        tempatLahir: s(r[35]),
        tanggalLahir: dstr(r[36]),
        pendidikan: s(r[37]),
        pekerjaan: s(r[38]),
        penghasilan: s(r[39]),
        noHp: u(r[40]),
        kewarganegaraan: s(r[93])
      },
      wali: {
        namaLengkap: namaWali,
        hubungan: s(r[42]),
        nik: u(r[43]),
        status: s(r[44]),
        tempatLahir: s(r[45]),
        tanggalLahir: dstr(r[46]),
        pendidikan: s(r[47]),
        pekerjaan: s(r[48]),
        penghasilan: s(r[49]),
        noHp: u(r[50]),
        kewarganegaraan: s(r[94]),
        hasWali: namaWali !== ''
      },
      statusWali: s(r[95]),
      penghasilanGabungan: s(r[96]),
      // Kolom 112 (indeks 111): Email Orang Tua/Wali (opsional).
      email: s(r[111])
    },
    address: {
      provinsi: s(r[51]),
      kabupaten: s(r[52]),
      kecamatan: s(r[53]),
      kelurahan: s(r[54]),
      rt: u(r[55]),
      rw: u(r[56]),
      alamatLengkap: s(r[57]),
      kodePos: u(r[58]),
      statusKepemilikanRumah: s(r[97]),
      statusTempatTinggal: s(r[98]),
      jarakKeMadrasah: s(r[99]),
      transportasiKeSekolah: s(r[100]),
      waktuTempuh: s(r[101]),
      koordinatAlamat: s(r[102])
    },
    documents: documents,
    verification: {
      hasilObservasi: s(r[65]),
      catatanObservasi: s(r[66]),
      wawancaraSelesai: ya(r[67]),
      biayaFormulirLunas: ya(r[68]),
      paketSeragamLunas: ya(r[69]),
      paketBukuLunas: ya(r[70]),
      pembayaranLunas: ya(r[71]),
      nominalTerbayar: n0(r[72]),
      // v2.9: kolom 113-114 'Terverifikasi Pada/Oleh' menyimpan keduanya;
      // isVerified di formulir resmi hanya true bila keduanya terisi.
      verifiedAt: s(r[112]),
      verifiedBy: s(r[113])
    },
    hasilPengumuman: (hp === 'LULUS' || hp === 'CADANGAN' || hp === 'TIDAK_LULUS') ? hp : 'PENDING',
    catatanPengumuman: s(r[74]),
    modePendaftaran: statusInden ? 'inden' : 'penuh'
  };
  if (statusInden) {
    record.inden = {
      status: statusInden,
      jumlahDp: n0(r[107]),
      dpLunas: n0(r[107]) > 0,
      diskonDiberikan: n0(r[108]),
      sisaBayar: n0(r[109]),
      batasPelunasan: dstr(r[110]),
      tanggalInden: dstr(r[0])
    };
  }
  return record;
}

// Cek header tab secara READ-ONLY (tanpa menulis/menambah kolom): bila ada
// header terisi yang tidak sama dengan HEADERS, tolak supaya data tidak
// salah kolom diam-diam. '' = lolos.
function checkYearSheetHeadersReadOnly(sheet) {
  try {
    var maxCols = sheet.getMaxColumns();
    var n = Math.min(maxCols, HEADERS.length);
    if (n < 1) return '';
    var vals = sheet.getRange(1, 1, 1, n).getValues()[0];
    for (var i = 0; i < n; i++) {
      var v = String(vals[i] || '').trim();
      if (v !== '' && v !== HEADERS[i]) {
        return 'Header kolom ke-' + (i + 1) + ' pada tab "' + sheet.getName() +
          '" tidak sesuai (ditemukan "' + vals[i] + '", seharusnya "' + HEADERS[i] +
          '"). Daftar tidak dibaca supaya data tidak salah kolom — hubungi panitia SPMB.';
      }
    }
  } catch (e) {
    return 'Gagal membaca header tab: ' + String(e);
  }
  return '';
}

// POST {action:'listRegistrations', tahunAjaran?: string}
// tahunAjaran default '2027/2028'; alias academicYear juga diterima.
function listRegistrations(tahunAjaran) {
  var academicYear = String(tahunAjaran || '2027/2028').trim() || '2027/2028';
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabNameForYear(academicYear));
  if (!sheet) {
    return { success: true, academicYear: academicYear, count: 0, registrations: [] };
  }
  var headerErr = checkYearSheetHeadersReadOnly(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: true, academicYear: academicYear, count: 0, registrations: [] };
  }
  var nCols = Math.min(sheet.getMaxColumns(), HEADERS.length);
  var vals = sheet.getRange(2, 1, lastRow - 1, nCols).getValues();
  var registrations = [];
  for (var i = 0; i < vals.length; i++) {
    var nomor = String(vals[i][1] || '').trim();
    if (!nomor) continue;
    registrations.push(rowToRecord(vals[i]));
  }
  registrations.sort(function (a, b) {
    if (a.nomorPendaftaran < b.nomorPendaftaran) return -1;
    if (a.nomorPendaftaran > b.nomorPendaftaran) return 1;
    return 0;
  });
  return {
    success: true,
    academicYear: academicYear,
    count: registrations.length,
    registrations: registrations
  };
}

// ============ AUTH ADMIN: VERIFY PIN + GANTI PIN (v2.9) ============
// POST {action:'verifyAdminPin', pin}
// PIN cocok (dicek DI SERVER terhadap Script Properties) -> {success:true,
// token}. PIN salah / belum disetel / dibatasi -> SATU respons generik
// yang sama ('PIN admin salah.') — tanpa membocorkan apa pun.
// Pembatas dasar: maks. 10 gagal/jam (global).
function verifyAdminPinRecord(contents) {
  var pin = s(contents && contents.pin).trim();
  // (v2.11, M4) Jeda progresif, bukan lockout: penyerang tidak bisa
  // mengunci login admin; pemilik PIN benar hanya menunggu sebentar.
  var jeda = rateLimitDelayMs('verifyAdminPin', 'global');
  if (jeda > 0) Utilities.sleep(jeda);
  var pinBerlaku = getAdminPin();
  if (pin && pinBerlaku && pin === pinBerlaku) {
    clearRateLimit('verifyAdminPin', 'global');
    return { success: true, token: issueAdminToken() };
  }
  recordRateLimitFail('verifyAdminPin', 'global');
  return { success: false, error: 'PIN admin salah.' };
}

// POST {action:'changePin', nomorPendaftaran, oldPin?, adminToken?, newPin,
//       academicYear?}
// Ganti PIN wali, tersinkron ke Sheets (kolom PIN Wali; tokenCode frontend
// dibaca dari PIN yang sama). Jalur admin (adminToken valid) boleh tanpa
// oldPin (reset oleh admin); jalur wali wajib oldPin cocok dengan PIN
// record di Sheets. PIN baru wajib 6 digit angka.
function changePinRecord(contents) {
  var nomor = s(contents && contents.nomorPendaftaran).trim();
  var newPin = s(contents && contents.newPin).replace(/\D/g, '');
  if (!nomor) return { success: false, error: 'Nomor pendaftaran wajib diisi.' };
  if (!/^\d{6}$/.test(newPin)) return { success: false, error: 'PIN baru harus 6 digit angka.' };
  var academicYear = (contents && (contents.academicYear || contents.tahunAjaran)) || '2027/2028';
  var isAdmin = verifyAdminToken(contents && contents.adminToken);
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba lagi.' };
  }
  try {
    var targetRow = findRowByNomor(sheet, nomor);
    if (targetRow < 0) {
      return { success: false, error: 'Nomor pendaftaran tidak ditemukan.' };
    }
    if (!isAdmin) {
      var oldPin = s(contents && contents.oldPin).replace(/\D/g, '');
      var pinTersimpan = u(sheet.getRange(targetRow, 3).getValue()).replace(/\D/g, '');
      if (!oldPin || oldPin !== pinTersimpan) {
        return { success: false, error: 'PIN lama tidak cocok.' };
      }
    }
    sheet.getRange(targetRow, 3).setValue(t(newPin));
    addAuditLog(isAdmin ? 'ADMIN' : 'WALI', 'CHANGE_PIN', 'PIN diubah: ' + nomor);
    return { success: true, nomorPendaftaran: nomor };
  } finally {
    lock.releaseLock();
  }
}

// POST {action:'changeAdminPin', adminToken, currentPin, newPin}
// Ganti PIN admin. Wajib token sesi admin berlaku; PIN saat ini
// diverifikasi DI SERVER terhadap Script Properties. PIN baru minimal
// 6 karakter huruf/angka dan harus berbeda dari PIN saat ini (konfirmasi
// kesamaan PIN baru dicek frontend DAN backend — backend menolak bila
// newPin !== confirmPin bila field confirmPin dikirim).
// Bila sukses: PIN baru disimpan ke Script Properties + ADMIN_TOKEN_VERSION
// dinaikkan sehingga SEMUA token lama (termasuk di device lain dan di
// perangkat ini) langsung tidak berlaku — admin wajib login ulang.
// Pesan gagal generik bila PIN saat ini salah.
function changeAdminPinRecord(contents) {
  var tokenCheck = requireAdminToken(contents);
  if (!tokenCheck.ok) return tokenCheck.response;
  var currentPin = s(contents && contents.currentPin);
  var newPin = s(contents && contents.newPin);
  var pinBerlaku = getAdminPin();
  if (!currentPin || !pinBerlaku || currentPin !== pinBerlaku) {
    return { success: false, error: 'PIN saat ini salah.' };
  }
  if (contents && contents.confirmPin !== undefined && s(contents.confirmPin) !== newPin) {
    return { success: false, error: 'Konfirmasi PIN baru tidak sama dengan PIN baru.' };
  }
  if (!/^[A-Za-z0-9]{6,}$/.test(newPin)) {
    return { success: false, error: 'PIN baru minimal 6 karakter huruf/angka.' };
  }
  if (newPin === pinBerlaku) {
    return { success: false, error: 'PIN baru harus berbeda dari PIN saat ini.' };
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty(ADMIN_PIN_KEY, newPin);
  var nextVersion = getAdminTokenVersion() + 1;
  props.setProperty(ADMIN_TOKEN_VERSION_KEY, String(nextVersion));
  addAuditLog('ADMIN', 'CHANGE_ADMIN_PIN', 'PIN admin diubah; versi token dinaikkan.');
  return { success: true };
}

// ============ GET REGISTRATION (v2.8) ============
// Login wali: cari SATU record berdasarkan nomor pendaftaran ATAU nomor
// WhatsApp + PIN 6 digit. PIN HARUS cocok di server sebelum record
// dikembalikan.
// - READ-ONLY seperti listRegistrations: tidak membuat tab, tidak menulis.
// - Gagal (nomor tidak ada, nomor WA tidak ada, PIN salah, PIN tidak
//   6 digit, tab belum ada) SELALU mengembalikan SATU respons generik
//   yang sama — jangan pernah membedakan "nomor tidak ditemukan" vs
//   "PIN salah", supaya respons ini tidak bisa dipakai menebak nomor
//   yang terdaftar.
// - Yang dikembalikan hanya SATU record (pakai rowToRecord yang SAMA
//   dengan listRegistrations); daftar/semua record tidak pernah
//   dikembalikan dari action ini.
// - Nomor WA dinormalisasi dengan normalizeWa() (08... = 628...), dan
//   dicocokkan ke No HP wali (kolom AY, indeks 50); No HP ayah/ibu
//   (indeks 31/40) ikut dicocokkan karena wali bisa login memakai nomor
//   orang tua yang mana pun.
// KEAMANAN (batasan yang diketahui, v2.9): rate limit dasar maks. 5 gagal
// per identifier/jam (CacheService) menutup brute force PIN 6 digit dari
// satu identifier; penyerang masih bisa menyebar tebakan ke banyak nomor
// (tiap nomor punya jatah 5/jam) dan CacheService bukan penghitung
// presisi. Mitigasi lanjutan (bila dibutuhkan): PIN lebih panjang,
// CAPTCHA, atau lockout berbasis Spreadsheet.
// POST {action:'getRegistration', nomorPendaftaran?: string,
//       nomorWa?: string, pin: string, tahunAjaran?: string}
function getRegistration(data) {
  var pin = s(data.pin).replace(/\D/g, '');
  var nomor = s(data.nomorPendaftaran).trim();
  var nomorWa = normalizeWa(data.nomorWa);
  var academicYear = String(data.tahunAjaran || data.academicYear || '2027/2028').trim() || '2027/2028';
  // Satu respons generik untuk SEMUA kegagalan pencocokan.
  var GAGAL = { success: false, error: 'Nomor pendaftaran / nomor WhatsApp atau PIN tidak cocok.' };
  // Rate limit (v2.9, jeda progresif v2.11 — M4): kegagalan dicatat per
  // identifier (nomor pendaftaran / nomor WA ternormalisasi); TIDAK ADA
  // lockout — hanya jeda yang membesar. Respons gagal tetap generik.
  var identKey = nomor || nomorWa;
  function gagalDenganLimit() {
    if (identKey) recordRateLimitFail('getRegistration', identKey);
    return GAGAL;
  }
  if (!/^\d{6}$/.test(pin)) return gagalDenganLimit();
  if (!nomor && !nomorWa) return GAGAL;
  // (v2.11, M4) Jeda progresif per identifier, bukan lockout: PIN benar
  // tetap bisa masuk setelah jeda singkat; brute-force tetap tidak layak.
  var jedaLogin = rateLimitDelayMs('getRegistration', identKey);
  if (jedaLogin > 0) Utilities.sleep(jedaLogin);
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabNameForYear(academicYear));
  if (!sheet) return gagalDenganLimit();
  var headerErr = checkYearSheetHeadersReadOnly(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return gagalDenganLimit();
  var nCols = Math.min(sheet.getMaxColumns(), HEADERS.length);
  var vals = sheet.getRange(2, 1, lastRow - 1, nCols).getValues();
  for (var i = 0; i < vals.length; i++) {
    var rowNo = String(vals[i][1] || '').trim();
    if (!rowNo) continue;
    var idCocok = false;
    if (nomor && rowNo === nomor) idCocok = true;
    if (!idCocok && nomorWa) {
      if (nomorWa === normalizeWa(vals[i][50]) ||
          nomorWa === normalizeWa(vals[i][31]) ||
          nomorWa === normalizeWa(vals[i][40]) ||
          // (v2.12) No WA Pendaftaran (kolom 115): nomor WA kartu akses.
          nomorWa === normalizeWa(vals[i][114])) {
        idCocok = true;
      }
    }
    if (!idCocok) continue;
    // PIN diverifikasi di server SEBELUM record dikembalikan.
    var pinTersimpan = u(vals[i][2]).replace(/\D/g, '');
    if (pinTersimpan !== pin) continue;
    clearRateLimit('getRegistration', identKey);
    return { success: true, academicYear: academicYear, registration: rowToRecord(vals[i]) };
  }
  return gagalDenganLimit();
}

// ============ INDEN + DISKON (v2.7) ============
// Angka yang disetujui Rahmat (2026-11-11): DP inden Rp50.000, diskon
// Gelombang 1 Rp25.000 flat (harga Rp183.000 -> Rp158.000), kuota diskon
// 20 kursi pertama, batas pelunasan 14 hari setelah inden, DP hangus bila
// lewat batas (toggle admin — penegakannya di sisi admin/frontend;
// backend hanya menandai 'Inden Kedaluwarsa' lewat markIndenExpired).
// Kolom: 107 Status Inden, 108 Jumlah DP, 109 Diskon Diberikan,
// 110 Sisa Bayar, 111 Batas Pelunasan (indeks 0-based 106-110).
var HARGA_NORMAL_DEFAULT = 183000;
var DP_DEFAULT = 50000;
var DISKON_DEFAULT = 25000;
var KUOTA_DISKON_DEFAULT = 20;

// Cari baris berdasarkan nomor pendaftaran (kolom B). Mengembalikan nomor
// baris (2..lastRow) atau -1 bila tidak ditemukan.
function findRowByNomor(sheet, nomor) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var noVals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < noVals.length; i++) {
    if (String(noVals[i][0] || '').trim() === String(nomor || '').trim()) {
      return i + 2;
    }
  }
  return -1;
}

// Hitung berapa baris yang sudah memakai diskon (Diskon Diberikan > 0 dan
// Status Inden bukan 'Inden Kedaluwarsa') — dipakai guard kuota diskon.
function countDiskonTerpakai(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var maxCols = sheet.getMaxColumns();
  if (maxCols < 109) return 0;
  var statusVals = sheet.getRange(2, 107, lastRow - 1, 1).getValues();
  var diskonVals = sheet.getRange(2, 109, lastRow - 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < lastRow - 1; i++) {
    var st = String(statusVals[i][0] || '').trim();
    if (st === 'Inden Kedaluwarsa') continue;
    if (Number(diskonVals[i][0] || 0) > 0) n++;
  }
  return n;
}

// Tanggal YYYY-MM-DD, N hari dari hari ini (default 14).
function tanggalPlusHari(hari) {
  var d = new Date();
  d.setDate(d.getDate() + (hari || 14));
  return d.toISOString().slice(0, 10);
}

function isTanggalValid(yyyymmdd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(yyyymmdd || ''))) return false;
  var d = new Date(String(yyyymmdd) + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === String(yyyymmdd);
}

// Baca Status Inden (kolom 107) sebuah baris; '' bila tab lama / kosong.
function readStatusInden(sheet, row) {
  if (sheet.getMaxColumns() < 107) return '';
  return String(sheet.getRange(row, 107).getValue() || '').trim();
}

// ============ CREATE INDEN ============
// Membuat SATU baris baru untuk inden. Nomor inden resmi dari server
// (nextRegistrationNumber di dalam lock). Status (kolom E) = 'Inden'.
// Guard kuota diskon di sisi server: bila kuota sudah habis, diskon
// dipaksa 0 dan sisaBayar dihitung ulang.
function createIndenRecord(data) {
  // v2.9: tolak payload kosong — router mengirim contents.data; tanpa
  // pembungkus data yang benar, inden tidak boleh terbentuk.
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return { success: false, error: 'Payload tidak valid.' };
  }
  var academicYear = data.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };

  var student = data.student || {};
  var parent = data.parent || {};
  var inden = data.inden || {};

  // (v2.11, M2) Batas kiriman inden publik: maks. 5/jam per WA.
  var waInden = normalizeWa(parent.noHp);
  if (waInden.length >= 10) {
    if (isWriteLimited('createInden', waInden, 5)) {
      return { success: false, error: 'Terlalu banyak percobaan dari nomor ini. Coba lagi nanti.' };
    }
    recordWriteAttempt('createInden', waInden);
  }

  if (!s(student.namaLengkap).trim()) {
    return { success: false, error: 'Nama lengkap anak wajib diisi.' };
  }
  if (!s(parent.namaWali).trim()) {
    return { success: false, error: 'Nama orang tua/wali wajib diisi.' };
  }
  var noHpDigits = normalizeWa(parent.noHp);
  if (noHpDigits.length < 10) {
    return { success: false, error: 'Nomor WhatsApp wali minimal 10 digit angka.' };
  }
  if (!/^\d{6}$/.test(s(data.pin))) {
    return { success: false, error: 'PIN harus 6 digit angka.' };
  }
  // Duplikat WA (M13/N-M1) — satu WA = satu pendaftaran, termasuk inden.
  // Cek awal tanpa lock; dicek ulang di dalam lock sebelum appendRow.
  // Pesan generik WA_DUPLIKAT_ERROR: tanpa nilai nomor, tanpa nomor
  // baris, tanpa nama.
  if (findDuplicateWa(sheet, [noHpDigits], 0) > 0) {
    return { success: false, error: WA_DUPLIKAT_ERROR };
  }
  var batasPelunasan = tanggalPlusHari(14);
  // (v2.11, M1) SEMUA angka inden dipaksa dari konstanta server — nilai
  // dari payload klien (hargaNormal/jumlahDp/diskonDiberikan/kuotaDiskon/
  // batasPelunasan) DIABAIKAN sepenuhnya. Nilai-nilai ini yang disetujui
  // Rahmat 2026-11-11 (harga Rp183.000, DP Rp50.000, diskon Rp25.000,
  // kuota 20, pelunasan 14 hari); model TA 2027/2028 tanpa gelombang,
  // jadi tidak ada wave yang perlu dibaca dari settings.
  var hargaNormal = HARGA_NORMAL_DEFAULT;
  var jumlahDp = DP_DEFAULT;
  var kuotaDiskon = KUOTA_DISKON_DEFAULT;
  var diskonDiberikan = DISKON_DEFAULT;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba kirim ulang.' };
  }
  try {
    var headerErr2 = checkYearSheetHeaders(sheet);
    if (headerErr2) return { success: false, error: headerErr2 };
    // Duplikat WA — cek ulang di dalam lock (M13/N-M1).
    if (findDuplicateWa(sheet, [noHpDigits], 0) > 0) {
      return { success: false, error: WA_DUPLIKAT_ERROR };
    }
    // Guard kuota diskon (di dalam lock supaya tidak dobel saat bersamaan).
    if (diskonDiberikan > 0 && countDiskonTerpakai(sheet) >= kuotaDiskon) {
      diskonDiberikan = 0;
    }
    var sisaBayar = Math.max(0, hargaNormal - diskonDiberikan - jumlahDp);
    var nomor = nextRegistrationNumber(sheet, academicYear);
    // buildRow hanya butuh nama anak + nama/No HP wali + pin + inden;
    // field lain kosong.
    var record = {
      academicYear: academicYear,
      wave: data.wave || '',
      pin: data.pin,
      status: 'Inden',
      // (v2.12) No WA Pendaftaran = nomor WA kartu akses (parentNoHp).
      noWaPendaftaran: parent.noHp,
      student: { namaLengkap: student.namaLengkap },
      parent: { wali: { namaLengkap: parent.namaWali, noHp: parent.noHp } },
      inden: {
        status: 'Inden',
        jumlahDp: jumlahDp,
        diskonDiberikan: diskonDiberikan,
        sisaBayar: sisaBayar,
        batasPelunasan: batasPelunasan
      }
    };
    var row = buildRow(record, nomor, { kk: '', akta: '', nisn: '', ijazah: '', foto: '', pindah: '', kks: '', pkh: '' });
    sheet.appendRow(row);
    addAuditLog('PUBLIC', 'CREATE_INDEN', 'Inden baru: ' + nomor + ', DP ' + jumlahDp + ', diskon ' + diskonDiberikan + ', sisa ' + sisaBayar + ', batas ' + batasPelunasan);
    return {
      success: true,
      nomorPendaftaran: nomor,
      diskonDiberikan: diskonDiberikan,
      sisaBayar: sisaBayar,
      batasPelunasan: batasPelunasan
    };
  } finally {
    lock.releaseLock();
  }
}

// ============ CONFIRM DP ============
// Menandai DP inden sudah diterima (biasanya oleh admin setelah cek
// transfer). Sisa Bayar dihitung ulang dari harga setelah diskon.
function confirmDpRecord(data) {
  // v2.9: tolak payload kosong (lihat createIndenRecord).
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return { success: false, error: 'Payload tidak valid.' };
  }
  var nomor = s(data.nomorPendaftaran).trim();
  if (!nomor) {
    return { success: false, error: 'Nomor pendaftaran wajib diisi.' };
  }
  var academicYear = data.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var jumlahDp = Number(data.jumlahDp);
  if (!jumlahDp && jumlahDp !== 0) jumlahDp = DP_DEFAULT;
  if (jumlahDp < 0) {
    return { success: false, error: 'Jumlah DP tidak boleh negatif.' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba kirim ulang.' };
  }
  try {
    var headerErr2 = checkYearSheetHeaders(sheet);
    if (headerErr2) return { success: false, error: headerErr2 };
    var targetRow = findRowByNomor(sheet, nomor);
    if (targetRow < 0) {
      return { success: false, error: 'Nomor pendaftaran ' + nomor + ' tidak ditemukan di sheet ' + tabNameForYear(academicYear) + '.' };
    }
    if (readStatusInden(sheet, targetRow) !== 'Inden') {
      return { success: false, error: 'Pendaftaran ' + nomor + ' bukan inden aktif (Status Inden bukan "Inden").' };
    }
    var diskon = Number(sheet.getRange(targetRow, 109).getValue() || 0);
    var sisaBayar = Math.max(0, HARGA_NORMAL_DEFAULT - diskon - jumlahDp);
    // Kolom 108 Jumlah DP, 109 Diskon (dipertahankan), 110 Sisa Bayar.
    sheet.getRange(targetRow, 108, 1, 3).setValues([[jumlahDp, diskon, sisaBayar]]);
    addAuditLog('PUBLIC', 'CONFIRM_DP', 'DP inden dikonfirmasi: ' + nomor + ', DP ' + jumlahDp + ', sisa ' + sisaBayar);
    return {
      success: true,
      nomorPendaftaran: nomor,
      jumlahDp: jumlahDp,
      sisaBayar: sisaBayar
    };
  } finally {
    lock.releaseLock();
  }
}

// ============ COMPLETE INDEN ============
// Inden lunas / lengkap: Status Inden -> 'Terdaftar', Status (kolom E) ->
// 'pending' supaya alur verifikasi normal berlanjut. PIN dipertahankan.
function completeIndenRecord(data) {
  // v2.9: tolak payload kosong (lihat createIndenRecord).
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return { success: false, error: 'Payload tidak valid.' };
  }
  var nomor = s(data.nomorPendaftaran).trim();
  if (!nomor) {
    return { success: false, error: 'Nomor pendaftaran wajib diisi.' };
  }
  var academicYear = data.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var targetRow = findRowByNomor(sheet, nomor);
  if (targetRow < 0) {
    return { success: false, error: 'Nomor pendaftaran ' + nomor + ' tidak ditemukan di sheet ' + tabNameForYear(academicYear) + '.' };
  }
  if (readStatusInden(sheet, targetRow) !== 'Inden') {
    return { success: false, error: 'Pendaftaran ' + nomor + ' bukan inden aktif (Status Inden bukan "Inden").' };
  }
  sheet.getRange(targetRow, 107).setValue('Terdaftar');
  sheet.getRange(targetRow, 5).setValue('pending');
  addAuditLog('PUBLIC', 'COMPLETE_INDEN', 'Inden selesai (Terdaftar): ' + nomor);
  return { success: true, nomorPendaftaran: nomor };
}

// ============ EXTEND INDEN ============
// Perpanjang batas pelunasan inden aktif.
function extendIndenRecord(data) {
  // v2.9: tolak payload kosong (lihat createIndenRecord).
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return { success: false, error: 'Payload tidak valid.' };
  }
  var nomor = s(data.nomorPendaftaran).trim();
  if (!nomor) {
    return { success: false, error: 'Nomor pendaftaran wajib diisi.' };
  }
  var batasPelunasan = s(data.batasPelunasan).trim();
  if (!batasPelunasan || !isTanggalValid(batasPelunasan)) {
    return { success: false, error: 'Batas pelunasan wajib diisi dengan tanggal valid format YYYY-MM-DD.' };
  }
  var academicYear = data.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var targetRow = findRowByNomor(sheet, nomor);
  if (targetRow < 0) {
    return { success: false, error: 'Nomor pendaftaran ' + nomor + ' tidak ditemukan di sheet ' + tabNameForYear(academicYear) + '.' };
  }
  if (readStatusInden(sheet, targetRow) !== 'Inden') {
    return { success: false, error: 'Pendaftaran ' + nomor + ' bukan inden aktif (Status Inden bukan "Inden").' };
  }
  sheet.getRange(targetRow, 111).setValue(batasPelunasan);
  addAuditLog('PUBLIC', 'EXTEND_INDEN', 'Batas pelunasan inden diperpanjang: ' + nomor + ' -> ' + batasPelunasan);
  return { success: true, nomorPendaftaran: nomor, batasPelunasan: batasPelunasan };
}

// ============ MARK INDEN EXPIRED ============
// Tandai inden lewat batas pelunasan (DP hangus — penegakan oleh admin).
// Kursi otomatis lepas karena getPublicStats mengecualikan baris ini.
function markIndenExpiredRecord(data) {
  // v2.9: tolak payload kosong (lihat createIndenRecord).
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return { success: false, error: 'Payload tidak valid.' };
  }
  var nomor = s(data.nomorPendaftaran).trim();
  if (!nomor) {
    return { success: false, error: 'Nomor pendaftaran wajib diisi.' };
  }
  var academicYear = data.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };
  var targetRow = findRowByNomor(sheet, nomor);
  if (targetRow < 0) {
    return { success: false, error: 'Nomor pendaftaran ' + nomor + ' tidak ditemukan di sheet ' + tabNameForYear(academicYear) + '.' };
  }
  if (readStatusInden(sheet, targetRow) !== 'Inden') {
    return { success: false, error: 'Pendaftaran ' + nomor + ' bukan inden aktif (Status Inden bukan "Inden").' };
  }
  sheet.getRange(targetRow, 107).setValue('Inden Kedaluwarsa');
  addAuditLog('PUBLIC', 'MARK_INDEN_EXPIRED', 'Inden kedaluwarsa: ' + nomor);
  return { success: true, nomorPendaftaran: nomor };
}

// ============ SINKRONISASI SETTINGS SERVER (v2.7) ============
// Masalah: settings/CMS selama ini localStorage-only — edit di satu
// device tidak terlihat di device lain. Perbaikan: settings disimpan di
// server (tab 'Pengaturan' di Spreadsheet yang sama) dan dibaca semua
// device dari server.
// Tab 'Pengaturan': header ['Bagian','Urutan','Nilai','Diperbarui'].
// Satu bagian: 'settings' — nilainya JSON lengkap {settings, waves,
// academicYears} yang dipecah jadi chunk max 40.000 karakter per baris
// (kolom Nilai), diurutkan lewat kolom Urutan (0,1,2,...). Alasan chunk:
// satu sel Apps Script dibatasi ~50.000 karakter dan JSON settings+CMS
// bisa besar.
// KEAMANAN (v2.9): getSettings tetap publik tanpa auth (sama seperti
// getPublicStats — isinya pengaturan tampil, bukan data pendaftar) dan
// saveSettings kini WAJIB token sesi admin (lihat requireAdminToken di
// doPost). Jangan pernah memanggil saveSettings dari halaman publik.
var SETTINGS_CHUNK_MAX = 40000;
var SETTINGS_JSON_MAX = 500000;
var SETTINGS_SECTION = 'settings';

function getOrCreateSettingsSheet() {
  return getOrCreateSimpleSheet(CONFIG.SHEET_SETTINGS,
    ['Bagian', 'Urutan', 'Nilai', 'Diperbarui']);
}

// Baca settings dari server. Bila tab/bagian tidak ada -> settings null
// (frontend memakai default lokal). JSON rusak -> error, jangan crash.
function getSettings() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_SETTINGS);
    if (!sheet) {
      return { success: true, settings: null, updatedAt: null };
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, settings: null, updatedAt: null };
    }
    var vals = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    var chunks = [];
    var updatedAt = null;
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim() !== SETTINGS_SECTION) continue;
      var urutan = Number(vals[i][1] || 0);
      chunks.push({ urutan: urutan, nilai: String(vals[i][2] || '') });
      if (!updatedAt && vals[i][3]) {
        updatedAt = (vals[i][3] instanceof Date)
          ? vals[i][3].toISOString() : String(vals[i][3]);
      }
    }
    if (chunks.length === 0) {
      return { success: true, settings: null, updatedAt: null };
    }
    chunks.sort(function (a, b) { return a.urutan - b.urutan; });
    var json = '';
    for (var j = 0; j < chunks.length; j++) json += chunks[j].nilai;
    var parsed;
    try {
      parsed = JSON.parse(json);
    } catch (parseErr) {
      return { success: false, error: 'Data pengaturan di server rusak (JSON tidak valid): ' + String(parseErr) };
    }
    // (v2.11, L1) Jangan bocorkan ID internal ke publik: spreadsheetId dan
    // driveFolderId dihapus dari respons. Frontend tidak membutuhkannya
    // dari server (sudah ada di default lokal + backfill). googleAppScriptUrl
    // tetap dikembalikan — sudah publik di bundle frontend dan dibutuhkan
    // untuk memanggil backend.
    if (parsed && parsed.settings && typeof parsed.settings === 'object') {
      delete parsed.settings.spreadsheetId;
      delete parsed.settings.driveFolderId;
    }
    return { success: true, settings: parsed, updatedAt: updatedAt };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Simpan SELURUH payload sebagai satu JSON: {settings, waves,
// academicYears} — settings = objek SchoolSettings lengkap (termasuk
// cmsContent), waves = array Wave (termasuk pengaturan inden/diskon),
// academicYears = array bila dikirim. Tulis pakai LockService supaya
// tidak ada dua tulis bersamaan: hapus baris lama bagian 'settings',
// tulis ulang chunk-chunk baru + timestamp.
function saveSettings(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, error: 'Payload saveSettings harus berupa objek {settings, waves, academicYears}.' };
  }
  // v2.9: tolak keras bila data.settings hilang/bukan objek — menulis {}
  // tidak boleh lagi sukses (C1: semua simpan sejak v2.7 menulis {} ke
  // tab Pengaturan karena frontend mengirim tanpa pembungkus data).
  // Syarat minimal: settings harus objek dengan namaMadrasah tak kosong.
  if (data.settings === undefined || data.settings === null ||
      typeof data.settings !== 'object' || Array.isArray(data.settings)) {
    return { success: false, error: 'Field settings wajib berupa objek.' };
  }
  if (typeof data.settings.namaMadrasah !== 'string' || !data.settings.namaMadrasah.trim()) {
    return { success: false, error: 'Field settings.namaMadrasah wajib berupa teks yang tidak kosong.' };
  }
  var json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    return { success: false, error: 'Payload tidak bisa diubah menjadi JSON: ' + String(e) };
  }
  if (json.length > SETTINGS_JSON_MAX) {
    return { success: false, error: 'Data pengaturan terlalu besar (' + json.length + ' karakter, batas ' + SETTINGS_JSON_MAX + ').' };
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba simpan ulang.' };
  }
  try {
    var sheet = getOrCreateSettingsSheet();
    // Hapus baris lama bagian 'settings' (dari bawah supaya indeks aman).
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var bagianVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = bagianVals.length - 1; i >= 0; i--) {
        if (String(bagianVals[i][0] || '').trim() === SETTINGS_SECTION) {
          sheet.deleteRow(i + 2);
        }
      }
    }
    var updatedAt = new Date().toISOString();
    var chunkCount = Math.max(1, Math.ceil(json.length / SETTINGS_CHUNK_MAX));
    for (var c = 0; c < chunkCount; c++) {
      var chunk = json.substring(c * SETTINGS_CHUNK_MAX, (c + 1) * SETTINGS_CHUNK_MAX);
      sheet.appendRow([SETTINGS_SECTION, c, chunk, updatedAt]);
    }
    addAuditLog('ADMIN', 'SAVE_SETTINGS', 'Settings disimpan ke server (' + json.length + ' karakter, ' + chunkCount + ' chunk, ' + updatedAt + ')');
    return { success: true, updatedAt: updatedAt };
  } finally {
    lock.releaseLock();
  }
}

// ============ PENOMORAN SERVER (anti-dobel, pakai LockService) ============
function nextRegistrationNumber(sheet, academicYear) {
  var yearShort = String(academicYear || '2027/2028').slice(0, 4); // "2027"
  var maxNo = 0;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    // Kolom B = No Pendaftaran, format MIIU/SPMB/2027/0001
    var vals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      var m = String(vals[i][0] || '').match(/(\d{4})\s*$/);
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > maxNo) maxNo = n;
      }
    }
  }
  var next = maxNo + 1;
  var padded = ('0000' + next).slice(-4);
  return 'MIIU/SPMB/' + yearShort + '/' + padded;
}

// ============ CEK DUPLIKAT: NIK (dan NISN bila ada). BUKAN No KK. ============
function findDuplicate(sheet, nik, nisn) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  // Kolom K = NIK (ke-11), Kolom J = NISN (ke-10)
  var nikVals = sheet.getRange(2, 11, lastRow - 1, 1).getValues();
  var nisnVals = sheet.getRange(2, 10, lastRow - 1, 1).getValues();
  for (var i = 0; i < nikVals.length; i++) {
    if (nik && String(nikVals[i][0] || '').trim() === nik.trim()) {
      return { field: 'nik', row: i + 2 };
    }
    if (nisn && nisn.trim() !== '' && String(nisnVals[i][0] || '').trim() === nisn.trim()) {
      return { field: 'nisn', row: i + 2 };
    }
  }
  return null;
}

// Pesan tolak duplikat WA — SENGAJA generik (Paket C, M13/N-M1): tanpa
// nilai nomor, tanpa nomor baris, tanpa nama. Dipakai save, update,
// dan createInden.
var WA_DUPLIKAT_ERROR = 'Nomor WhatsApp ini sudah dipakai untuk satu pendaftaran. Silakan masuk dengan nomor tersebut, atau hubungi panitia SPMB.';

// ============ CEK DUPLIKAT WA (Paket C, M13/N-M1) ============
// Satu nomor WA = satu pendaftaran. Nomor kandidat (sudah dinormalisasi
// 08... = 628... = +62...) dicocokkan dengan No HP wali (kolom AY,
// indeks 50) + ayah (AF, indeks 31) + ibu (AO, indeks 40) di semua
// baris — karena wali bisa memakai nomor orang tua yang mana pun, dan
// baris inden hanya menyimpan No HP wali. 'excludeRow' = baris sendiri
// (dipakai update) yang dilewati. Mengembalikan nomor baris yang cocok,
// atau -1 bila tidak ada. Nomor tersimpan yang < 10 digit diabaikan.
function findDuplicateWa(sheet, nomorWaList, excludeRow) {
  var cands = [];
  for (var k = 0; k < nomorWaList.length; k++) {
    var n = normalizeWa(nomorWaList[k]);
    if (n.length >= 10) cands.push(n);
  }
  if (cands.length === 0) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ayahVals = sheet.getRange(2, 32, lastRow - 1, 1).getValues();
  var ibuVals = sheet.getRange(2, 41, lastRow - 1, 1).getValues();
  var waliVals = sheet.getRange(2, 51, lastRow - 1, 1).getValues();
  for (var i = 0; i < lastRow - 1; i++) {
    var rowNo = i + 2;
    if (excludeRow && rowNo === excludeRow) continue;
    var stored = [normalizeWa(ayahVals[i][0]), normalizeWa(ibuVals[i][0]), normalizeWa(waliVals[i][0])];
    for (var j = 0; j < stored.length; j++) {
      if (stored[j].length < 10) continue;
      for (var m = 0; m < cands.length; m++) {
        if (stored[j] === cands[m]) return rowNo;
      }
    }
  }
  return -1;
}

// ============ UPLOAD FILE KE DRIVE (kembaliannya link, bukan base64) ============
function saveFileToDrive(file, nomorPendaftaran, key) {
  if (!file || !file.url || typeof file.url !== 'string') return '';
  if (file.url.indexOf('data:') !== 0) return file.url; // sudah berupa link
  if (!CONFIG.DRIVE_FOLDER_ID) return 'FOLDER_DRIVE_BELUM_DIIISI';
  try {
    var commaIdx = file.url.indexOf(',');
    var meta = file.url.substring(0, commaIdx); // "data:image/jpeg;base64"
    var base64 = file.url.substring(commaIdx + 1);
    var mime = 'application/octet-stream';
    var mimeMatch = meta.match(/data:([^;]+)/);
    if (mimeMatch) mime = mimeMatch[1];
    var bytes = Utilities.base64Decode(base64);
    // (v2.11, L4) Tolak MIME di luar whitelist + file di atas 5 MB.
    // Kembalikan marker GAGAL_UPLOAD supaya pemanggil memperlakukannya
    // sebagai kegagalan upload (dokumen wajib = submit/update ditolak).
    var MIME_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (MIME_DIIZINKAN.indexOf(mime) < 0) {
      return 'GAGAL_UPLOAD: Jenis file tidak diizinkan (' + mime + ').';
    }
    if (bytes.length > 5 * 1024 * 1024) {
      return 'GAGAL_UPLOAD: Ukuran file melebihi 5 MB.';
    }
    var blob = Utilities.newBlob(bytes, mime, file.name || (key + '.bin'));
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    var safeNo = String(nomorPendaftaran).replace(/\//g, '-');
    var driveFile = folder.createFile(blob).setName(safeNo + '_' + key + '_' + (file.name || 'dokumen'));
    return driveFile.getUrl();
  } catch (err) {
    return 'GAGAL_UPLOAD: ' + String(err);
  }
}

// ============ VALIDASI HEADER TAB (M-F7) ============
// Tolak penulisan bila baris 1 tab tahun ajaran tidak sama dengan HEADERS —
// supaya kolom yang diubah manual tidak membuat data salah kolom diam-diam.
// PENGECUALIAN: bila header yang ada adalah AWALAN persis dari HEADERS
// (mis. tab lama 106 kolom, HEADERS kini 112 kolom), kolom yang kurang
// DITAMBAHKAN otomatis ke baris 1 lalu penulisan diizinkan — ini migrasi
// 106 → 112 kolom yang aman. Mengembalikan pesan error, atau '' bila lolos.
function checkYearSheetHeaders(sheet) {
  try {
    var vals = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    var firstEmpty = -1;
    for (var i = 0; i < HEADERS.length; i++) {
      var v = String(vals[i] || '').trim();
      if (v === '') { if (firstEmpty < 0) firstEmpty = i; continue; }
      if (firstEmpty >= 0) {
        // Ada isi setelah sel kosong di tengah — header rusak, bukan tab lama.
        return 'Header kolom ke-' + (i + 1) + ' pada tab "' + sheet.getName() +
          '" tidak sesuai (ditemukan "' + vals[i] + '", seharusnya "' + HEADERS[i] +
          '"). Penulisan dibatalkan supaya data tidak salah kolom — hubungi panitia SPMB.';
      }
      if (v !== HEADERS[i]) {
        return 'Header kolom ke-' + (i + 1) + ' pada tab "' + sheet.getName() +
          '" tidak sesuai (ditemukan "' + vals[i] + '", seharusnya "' + HEADERS[i] +
          '"). Penulisan dibatalkan supaya data tidak salah kolom — hubungi panitia SPMB.';
      }
    }
    if (firstEmpty >= 0) {
      // Tab lama: header yang ada adalah awalan persis HEADERS — tambahkan
      // kolom baru yang kurang di ujung baris 1, lalu izinkan penulisan.
      var missing = HEADERS.length - firstEmpty;
      sheet.getRange(1, firstEmpty + 1, 1, missing).setValues([HEADERS.slice(firstEmpty)]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#E6F4EA');
    }
  } catch (e) {
    return 'Gagal membaca header tab: ' + String(e);
  }
  return '';
}

// Link hasil upload yang menandai ERROR (bukan link kosong karena file
// memang tidak dikirim).
function isUploadError(link) {
  return !!link && (link.indexOf('GAGAL_UPLOAD') === 0 || link === 'FOLDER_DRIVE_BELUM_DIIISI');
}

// Upload semua dokumen ke Drive. Mengembalikan objek link ('' bila file
// tidak dikirim). Dipakai save (SEBELUM lock) dan update.
function uploadDocsForRecord(docs, nomor) {
  return {
    kk: saveFileToDrive(docs.kk, nomor, 'kk'),
    akta: saveFileToDrive(docs.akta, nomor, 'akta'),
    nisn: saveFileToDrive(docs.nisnDoc, nomor, 'nisn'),
    ijazah: saveFileToDrive(docs.ijazahTk, nomor, 'ijazah-tk'),
    foto: saveFileToDrive(docs.foto, nomor, 'foto'),
    pindah: saveFileToDrive(docs.ijazahAtauSuratPindah || docs.rapor, nomor, 'surat-pindah'),
    kks: saveFileToDrive(docs.kks, nomor, 'kks'),
    pkh: saveFileToDrive(docs.pkh, nomor, 'pkh')
  };
}

// ============ BANGUN BARIS SHEET (112 kolom, urutan = HEADERS) ============
// Dipakai save (appendRow) dan update (setValues). Kolom teks (PIN, NISN,
// NIK, No KK, No KIP, NIK ayah/ibu/wali, No HP, RT/RW, Kode Pos) ditulis
// lewat t() — diawali apostrof supaya nol di depan tidak hilang. Kolom
// lain tetap lewat s() / num().
function buildRow(record, nomor, links) {
  var academicYear = record.academicYear || '2027/2028';
  var student = record.student || {};
  var parent = record.parent || {};
  var ayah = parent.ayah || {};
  var ibu = parent.ibu || {};
  var wali = parent.wali || {};
  var address = record.address || {};
  var verif = record.verification || {};
  return [
    new Date(),
    nomor,
    t(record.pin || record.tokenCode || ''),
    record.jenisPendaftaran === 'pindahan' ? 'Siswa Pindahan' : 'Siswa Baru',
    s(record.status || 'pending'),
    academicYear,
    s(record.wave || ''),
    s(student.namaLengkap),
    s(student.namaPanggilan),
    t(student.nisn),
    t(student.nik),
    t(student.noKk),
    s(student.tempatLahir),
    s(student.tanggalLahir),
    student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    num(student.anakKe),
    num(student.jumlahSaudara),
    t(student.nomorKip),
    s(student.asalSekolah),
    s(student.kebutuhanKhusus),
    s(student.asalSekolahPindahan),
    s(student.kelasTerakhirPindahan),
    s(student.alasanPindah),
    s(ayah.namaLengkap),
    t(ayah.nik),
    s(ayah.status),
    s(ayah.tempatLahir),
    s(ayah.tanggalLahir),
    s(ayah.pendidikan),
    s(ayah.pekerjaan),
    s(ayah.penghasilan),
    t(ayah.noHp),
    s(ibu.namaLengkap),
    t(ibu.nik),
    s(ibu.status),
    s(ibu.tempatLahir),
    s(ibu.tanggalLahir),
    s(ibu.pendidikan),
    s(ibu.pekerjaan),
    s(ibu.penghasilan),
    t(ibu.noHp),
    s(wali.namaLengkap),
    s(wali.hubungan),
    t(wali.nik),
    s(wali.status),
    s(wali.tempatLahir),
    s(wali.tanggalLahir),
    s(wali.pendidikan),
    s(wali.pekerjaan),
    s(wali.penghasilan),
    t(wali.noHp),
    s(address.provinsi),
    s(address.kabupaten),
    s(address.kecamatan),
    s(address.kelurahan),
    t(address.rt),
    t(address.rw),
    s(address.alamatLengkap),
    t(address.kodePos),
    links.kk,
    links.akta,
    links.nisn,
    links.ijazah,
    links.foto,
    links.pindah,
    s(verif.hasilObservasi),
    s(verif.catatanObservasi),
    verif.wawancaraSelesai ? 'Ya' : '',
    verif.biayaFormulirLunas ? 'Ya' : '',
    verif.paketSeragamLunas ? 'Ya' : '',
    verif.paketBukuLunas ? 'Ya' : '',
    verif.pembayaranLunas ? 'Ya' : '',
    num(verif.nominalTerbayar),
    s(record.hasilPengumuman || 'PENDING'),
    s(record.catatanPengumuman || (verif && verif.catatanOperator) || ''),
    // --- Kolom baru selaras EMIS 4.0 (76-106). Opsional = '' bila kosong;
    // JANGAN isi default ('-', 'Tidak Ada', 0) supaya "tidak diisi" tetap
    // bisa dibedakan dari "tidak ada". 3 kolom wajib EMIS divalidasi di
    // saveRegistrationRecord (kewarganegaraan, agama, pembiaya).
    s(student.kewarganegaraan),
    s(student.agama),
    s(student.hobi),
    s(student.citaCita),
    s(student.yangMembiayaiSekolah),
    student.praSekolahTkRa ? 'Ya' : '',
    student.praSekolahPaud ? 'Ya' : '',
    student.imunisasiHepatitisB ? 'Ya' : '',
    student.imunisasiPolio ? 'Ya' : '',
    student.imunisasiBcg ? 'Ya' : '',
    student.imunisasiCampak ? 'Ya' : '',
    student.imunisasiDpt ? 'Ya' : '',
    student.imunisasiCovid ? 'Ya' : '',
    s(student.emailSiswa),
    t(student.nisLokal),
    t(student.nomorKks),
    t(student.nomorPkh),
    s(ayah.kewarganegaraan),
    s(ibu.kewarganegaraan),
    s(wali.kewarganegaraan),
    s(parent.statusWali),
    s(parent.penghasilanGabungan),
    s(address.statusKepemilikanRumah),
    s(address.statusTempatTinggal),
    s(address.jarakKeMadrasah),
    s(address.transportasiKeSekolah),
    s(address.waktuTempuh),
    s(address.koordinatAlamat),
    links.kks || '',
    links.pkh || '',
    s(student.kebutuhanDisabilitas),
    // --- Kolom inden + diskon Gelombang 1 (107-111, v2.7). Angka rupiah
    // lewat num() (bukan t()); Batas Pelunasan string YYYY-MM-DD lewat s().
    // record.inden boleh undefined (pendaftaran penuh) -> sel kosong.
    s(record.inden && record.inden.status),
    num(record.inden && record.inden.jumlahDp),
    num(record.inden && record.inden.diskonDiberikan),
    num(record.inden && record.inden.sisaBayar),
    s(record.inden && record.inden.batasPelunasan),
    // --- Kolom 112 (Paket C): Email Orang Tua/Wali (opsional, s() —
    // bukan t(): email bukan angka, nol di depan tidak relevan).
    s(parent.email),
    // --- Kolom 113-114 (v2.9, penutup M9): kapan + oleh siapa
    // verifikasi dicatat (diisi alur verifikasi admin; s() — teks ISO).
    s(verif.verifiedAt),
    s(verif.verifiedBy),
    // --- Kolom 115 (v2.12): No WA Pendaftaran — t() supaya nomor
    // dengan nol di depan tidak berubah.
    t(record.noWaPendaftaran)
  ];
}

// ============ SIMPAN PENDAFTARAN ============
function saveRegistrationRecord(record) {
  var academicYear = record.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);

  // Validasi header tab SEBELUM menulis apa pun (M-F7).
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };

  // (v2.11, M2) Batas kiriman publik: maks. 10/jam per WA, 5/jam per NIK.
  // Dihitung SEBELUM validasi lain supaya banjir payload tidak valid pun
  // tertahan. Tanpa batas global (anti-lockout, lihat M4).
  var parentThrottle = record.parent || {};
  var waThrottle = normalizeWa(((parentThrottle.ayah || {}).noHp) || ((parentThrottle.ibu || {}).noHp) || ((parentThrottle.wali || {}).noHp) || '');
  var nikThrottle = s((record.student || {}).nik).replace(/\D/g, '');
  if (waThrottle.length >= 10) {
    if (isWriteLimited('saveRegistration', waThrottle, 10)) {
      return { success: false, error: 'Terlalu banyak percobaan dari nomor ini. Coba lagi nanti.' };
    }
    recordWriteAttempt('saveRegistration', waThrottle);
  } else if (nikThrottle) {
    if (isWriteLimited('saveRegistration', nikThrottle, 5)) {
      return { success: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' };
    }
    recordWriteAttempt('saveRegistration', nikThrottle);
  }

  var student = record.student || {};
  var docs = record.documents || {};

  // Validasi minimal (tidak boleh kosong): NIK 16 digit + nama + No KK
  if (!/^\d{16}$/.test(s(student.nik))) {
    return { success: false, error: 'NIK anak harus 16 digit angka.' };
  }
  if (!s(student.namaLengkap).trim()) {
    return { success: false, error: 'Nama lengkap anak wajib diisi.' };
  }
  if (!/^\d{16}$/.test(s(student.noKk))) {
    return { success: false, error: 'Nomor KK harus 16 digit angka.' };
  }

  // Validasi usia (keputusan Rahmat, 2026-11-10): per 1 Juli 2027 sudah
  // berusia 6 tahun — tanggal lahir paling lambat 1 Juli 2021.
  var dob = s(student.tanggalLahir).slice(0, 10);
  if (!dob || dob > '2021-07-01') {
    return { success: false, error: 'Calon santri belum berusia 6 tahun per 1 Juli 2027 (tanggal lahir paling lambat 1 Juli 2021).' };
  }

  // 3 kolom wajib EMIS (terbukti wajib di EMIS 4.0; sudah divalidasi wajib
  // di form Langkah 1 — di sini pengaman terakhir sebelum tulis).
  if (!s(student.kewarganegaraan).trim()) {
    return { success: false, error: 'Kewarganegaraan wajib diisi (WNI/WNA).' };
  }
  if (!s(student.agama).trim()) {
    return { success: false, error: 'Agama wajib diisi.' };
  }
  if (!s(student.yangMembiayaiSekolah).trim()) {
    return { success: false, error: 'Yang Membiayai Sekolah wajib diisi.' };
  }

  // Penegakan server-side (M-B3, Paket C; keputusan fix v2.4): minimal
  // SATU No HP orang tua/wali yang valid. Frontend sudah mewajibkan ini
  // (Wizard Langkah 2: minimal satu HP ayah/ibu/wali valid) — di sini
  // pengaman terakhir sebelum tulis, supaya kiriman langsung ke webhook
  // tanpa HP tetap ditolak. Valid = minimal 10 digit setelah normalisasi.
  var parentSave = record.parent || {};
  var hpAyahSave = normalizeWa((parentSave.ayah || {}).noHp);
  var hpIbuSave = normalizeWa((parentSave.ibu || {}).noHp);
  var hpWaliSave = normalizeWa((parentSave.wali || {}).noHp);
  if (hpAyahSave.length < 10 && hpIbuSave.length < 10 && hpWaliSave.length < 10) {
    return { success: false, error: 'Nomor WhatsApp orang tua/wali wajib diisi dengan nomor yang valid (minimal 10 digit angka).' };
  }

  // (v2.13) NIK + tanggal lahir orang tua wajib bila masih hidup —
  // keputusan Rahmat 2026-11-17: supaya data EMIS lengkap sejak
  // pendaftaran dan operator tidak perlu melihat KK lagi. Bila sudah
  // meninggal, dikecualikan (nama + NIK + tgl lahir boleh kosong).
  var ayahSave = parentSave.ayah || {};
  var ibuSave = parentSave.ibu || {};
  if (s(ayahSave.status) === 'Masih Hidup') {
    if (!/^\d{16}$/.test(s(ayahSave.nik))) {
      return { success: false, error: 'NIK Ayah wajib diisi (16 digit angka).' };
    }
    if (!s(ayahSave.tanggalLahir).trim()) {
      return { success: false, error: 'Tanggal Lahir Ayah wajib diisi.' };
    }
  }
  if (s(ibuSave.status) === 'Masih Hidup') {
    if (!/^\d{16}$/.test(s(ibuSave.nik))) {
      return { success: false, error: 'NIK Ibu wajib diisi (16 digit angka).' };
    }
    if (!s(ibuSave.tanggalLahir).trim()) {
      return { success: false, error: 'Tanggal Lahir Ibu wajib diisi.' };
    }
  }

  // Duplikat (NIK / NISN) — cek awal tanpa lock; dicek ulang di dalam lock
  // sebelum appendRow supaya tetap benar bila dua kiriman bersamaan.
  // Pesan SENGAJA generik (v2.9): tanpa nilai NIK/NISN, tanpa nomor baris.
  var dup = findDuplicate(sheet, s(student.nik), s(student.nisn));
  if (dup) {
    return { success: false, error: 'Data sudah pernah terdaftar. Silakan hubungi panitia SPMB.' };
  }

  // Duplikat WA (M13/N-M1) — cek awal tanpa lock; dicek ulang di dalam
  // lock sebelum appendRow (pola yang sama seperti NIK/NISN di atas).
  // Pesan generik WA_DUPLIKAT_ERROR: tanpa nilai nomor, tanpa nomor
  // baris, tanpa nama.
  var waListSave = [hpAyahSave, hpIbuSave, hpWaliSave];
  if (findDuplicateWa(sheet, waListSave, 0) > 0) {
    return { success: false, error: WA_DUPLIKAT_ERROR };
  }

  // Upload dokumen ke Drive SEBELUM lock penomoran (M-F4): lock 15 detik
  // bisa kedaluwarsa di tengah 6x upload. Nomor sementara di sini hanya
  // untuk nama file di Drive; nomor RESMI dihitung ulang di dalam lock —
  // nama file bisa berbeda dari nomor resmi bila dua pendaftar bersamaan,
  // tapi link yang tersimpan di Sheet selalu benar.
  var nomorSementara = nextRegistrationNumber(sheet, academicYear);
  var links = uploadDocsForRecord(docs, nomorSementara);

  // Dokumen wajib (KK & Akta) gagal diunggah = gagal submit (M-F5):
  // jangan appendRow, jangan ambil nomor pendaftaran.
  if (!links.kk || isUploadError(links.kk)) {
    return { success: false, error: 'Gagal mengunggah dokumen Kartu Keluarga (KK)' + (links.kk ? ': ' + links.kk : ' — file tidak terkirim') + '. Data tidak disimpan. Silakan coba kirim ulang.' };
  }
  if (!links.akta || isUploadError(links.akta)) {
    return { success: false, error: 'Gagal mengunggah dokumen Akta Kelahiran' + (links.akta ? ': ' + links.akta : ' — file tidak terkirim') + '. Data tidak disimpan. Silakan coba kirim ulang.' };
  }
  // Dokumen opsional (KKS/PKH): gagal upload = sel kosong, BUKAN gagal
  // submit — orang tua tidak wajib memilikinya.
  if (isUploadError(links.kks)) links.kks = '';
  if (isUploadError(links.pkh)) links.pkh = '';

  // Lock HANYA untuk: cek duplikat ulang + penomoran + appendRow.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba kirim ulang.' };
  }
  try {
    var headerErr2 = checkYearSheetHeaders(sheet);
    if (headerErr2) return { success: false, error: headerErr2 };
    var dup2 = findDuplicate(sheet, s(student.nik), s(student.nisn));
    if (dup2) {
      return { success: false, error: 'Data sudah pernah terdaftar. Silakan hubungi panitia SPMB.' };
    }
    // Duplikat WA — cek ulang di dalam lock (M13/N-M1).
    if (findDuplicateWa(sheet, waListSave, 0) > 0) {
      return { success: false, error: WA_DUPLIKAT_ERROR };
    }
    // Nomor pendaftaran dari server (bukan dari browser)
    var nomor = nextRegistrationNumber(sheet, academicYear);
    var row = buildRow(record, nomor, links);
    sheet.appendRow(row);
    addAuditLog('PUBLIC', 'CREATE_REGISTRATION', 'Pendaftaran baru: ' + nomor);

    return {
      success: true,
      nomorPendaftaran: nomor,
      message: 'Data ' + nomor + ' berhasil masuk ke sheet ' + tabNameForYear(academicYear) + '.'
    };
  } finally {
    lock.releaseLock();
  }
}

// ============ UPDATE PENDAFTARAN (v2.4, M-F1; auth v2.9) ============
// Dipakai perubahan admin (status/verifikasi/pengumuman) dan kirim ulang
// dari form: cari baris berdasarkan nomor pendaftaran, timpa fieldnya
// dengan setValues. PIN dan link dokumen lama dipertahankan bila payload
// baru kosong. Mengharapkan record LENGKAP (seperti yang dikirim save).
// AUTH (v2.9): adminToken diisi (jalur admin) -> token WAJIB valid,
// tanpa fallback ke PIN record. adminToken kosong (jalur wali) -> PIN
// record (record.pin) wajib cocok dengan PIN tersimpan di Sheets.
function updateRegistrationRecord(record, adminToken) {
  var nomor = s(record.nomorPendaftaran).trim();
  if (!nomor) {
    return { success: false, error: 'Nomor pendaftaran wajib diisi untuk update.' };
  }
  var academicYear = record.academicYear || '2027/2028';
  var sheet = getOrCreateYearSheet(academicYear);
  var headerErr = checkYearSheetHeaders(sheet);
  if (headerErr) return { success: false, error: headerErr };

  // Auth sebelum upload/lock (gagal cepat, tanpa menulis apa pun).
  if (adminToken) {
    if (!verifyAdminToken(adminToken)) {
      return { success: false, error: ADMIN_TOKEN_ERROR };
    }
  } else {
    var authRow = findRowByNomor(sheet, nomor);
    if (authRow < 0) {
      return { success: false, error: 'Nomor pendaftaran tidak ditemukan.' };
    }
    var pinTersimpan = u(sheet.getRange(authRow, 3).getValue()).replace(/\D/g, '');
    var pinKirim = s(record.pin).replace(/\D/g, '');
    if (!pinKirim || pinKirim !== pinTersimpan) {
      return { success: false, error: ADMIN_TOKEN_ERROR };
    }
  }

  // Penegakan server-side (M-B3, Paket C): minimal satu No HP orang
  // tua/wali yang valid + 3 field wajib EMIS — sama seperti save.
  // Dilewati bila baris lama adalah baris INDEN (Status Inden terisi):
  // baris inden memang belum punya data lengkap (nama anak + WA saja)
  // dan dilengkapi lewat alur inden, bukan update ini.
  var targetRowPre = findRowByNomor(sheet, nomor);
  if (targetRowPre < 0 || !readStatusInden(sheet, targetRowPre)) {
    var studentUpd = record.student || {};
    var parentUpd = record.parent || {};
    var hpUpd = [normalizeWa((parentUpd.ayah || {}).noHp), normalizeWa((parentUpd.ibu || {}).noHp), normalizeWa((parentUpd.wali || {}).noHp)];
    if (hpUpd[0].length < 10 && hpUpd[1].length < 10 && hpUpd[2].length < 10) {
      return { success: false, error: 'Nomor WhatsApp orang tua/wali wajib diisi dengan nomor yang valid (minimal 10 digit angka).' };
    }
    // (v2.13) NIK + tanggal lahir orang tua wajib bila masih hidup —
    // sama seperti save (lihat saveRegistrationRecord).
    var ayahUpd = parentUpd.ayah || {};
    var ibuUpd = parentUpd.ibu || {};
    if (s(ayahUpd.status) === 'Masih Hidup') {
      if (!/^\d{16}$/.test(s(ayahUpd.nik))) {
        return { success: false, error: 'NIK Ayah wajib diisi (16 digit angka).' };
      }
      if (!s(ayahUpd.tanggalLahir).trim()) {
        return { success: false, error: 'Tanggal Lahir Ayah wajib diisi.' };
      }
    }
    if (s(ibuUpd.status) === 'Masih Hidup') {
      if (!/^\d{16}$/.test(s(ibuUpd.nik))) {
        return { success: false, error: 'NIK Ibu wajib diisi (16 digit angka).' };
      }
      if (!s(ibuUpd.tanggalLahir).trim()) {
        return { success: false, error: 'Tanggal Lahir Ibu wajib diisi.' };
      }
    }
    if (!s(studentUpd.kewarganegaraan).trim()) {
      return { success: false, error: 'Kewarganegaraan wajib diisi (WNI/WNA).' };
    }
    if (!s(studentUpd.agama).trim()) {
      return { success: false, error: 'Agama wajib diisi.' };
    }
    if (!s(studentUpd.yangMembiayaiSekolah).trim()) {
      return { success: false, error: 'Yang Membiayai Sekolah wajib diisi.' };
    }
  }

  // Upload dokumen baru (bila ada file data URL) SEBELUM lock; dokumen
  // yang tidak dikirim ulang dipertahankan dari baris lama.
  var docs = record.documents || {};
  var links = uploadDocsForRecord(docs, nomor);
  var linkKeys = ['kk', 'akta', 'nisn', 'ijazah', 'foto', 'pindah'];
  for (var i = 0; i < linkKeys.length; i++) {
    if (isUploadError(links[linkKeys[i]])) {
      return { success: false, error: 'Gagal mengunggah dokumen ' + linkKeys[i] + ': ' + links[linkKeys[i]] + '. Perubahan tidak disimpan.' };
    }
  }
  // Dokumen opsional (KKS/PKH): gagal upload = sel kosong, bukan gagal update.
  if (isUploadError(links.kks)) links.kks = '';
  if (isUploadError(links.pkh)) links.pkh = '';

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, error: 'Server sibuk, silakan coba kirim ulang.' };
  }
  try {
    var headerErr2 = checkYearSheetHeaders(sheet);
    if (headerErr2) return { success: false, error: headerErr2 };
    // Cari baris berdasarkan nomor pendaftaran (kolom B).
    var targetRow = findRowByNomor(sheet, nomor);
    if (targetRow < 0) {
      return { success: false, error: 'Nomor pendaftaran ' + nomor + ' tidak ditemukan di sheet ' + tabNameForYear(academicYear) + '. Perubahan tidak disimpan.' };
    }
    // Duplikat NIK/NISN milik pendaftar LAIN tetap ditolak (baris sendiri dikecualikan).
    // Pesan SENGAJA generik (v2.9): tanpa nilai NIK/NISN, tanpa nomor baris.
    var student = record.student || {};
    var dup = findDuplicate(sheet, s(student.nik), s(student.nisn));
    if (dup && dup.row !== targetRow) {
      return { success: false, error: 'Data sudah terdaftar atas pendaftar lain. Perubahan tidak disimpan.' };
    }
    // Duplikat WA milik pendaftar LAIN tetap ditolak (M13/N-M1; baris
    // sendiri dikecualikan). Pesan generik WA_DUPLIKAT_ERROR.
    var parentLock = record.parent || {};
    var waListLock = [normalizeWa((parentLock.ayah || {}).noHp), normalizeWa((parentLock.ibu || {}).noHp), normalizeWa((parentLock.wali || {}).noHp)];
    if (findDuplicateWa(sheet, waListLock, targetRow) > 0) {
      return { success: false, error: WA_DUPLIKAT_ERROR };
    }
    var oldRow = sheet.getRange(targetRow, 1, 1, HEADERS.length).getValues()[0];
    var row = buildRow(record, nomor, links);
    // Pertahankan PIN lama bila payload tidak membawa PIN, dan link dokumen
    // lama bila dokumen tidak dikirim ulang (indeks 59-64 = Link KK..Pindah,
    // 103-104 = Link KKS/PKH).
    if (row[2] === '') row[2] = oldRow[2];
    var LINK_IDX = [59, 60, 61, 62, 63, 64, 103, 104];
    for (var c = 0; c < LINK_IDX.length; c++) {
      if (row[LINK_IDX[c]] === '') row[LINK_IDX[c]] = oldRow[LINK_IDX[c]];
    }
    // Kolom inden 107-111 (indeks 106-110): bila payload tidak membawa
    // record.inden, PERTAHANKAN nilai lama (pola yang sama seperti PIN
    // dan link dokumen). Bila record.inden ada, pakai nilai barunya.
    if (!record.inden) {
      for (var d = 106; d <= 110; d++) {
        row[d] = oldRow[d];
      }
    }
    // Kolom 112 Email Orang Tua/Wali (indeks 111, Paket C): bila payload
    // tidak membawa email, PERTAHANKAN email lama (pola yang sama).
    if (row[111] === '') row[111] = oldRow[111];
    // Kolom 113-114 Terverifikasi (indeks 112-113, v2.9): bila payload
    // tidak membawa, PERTAHANKAN nilai lama. Bila jalur ADMIN mengubah
    // status menjadi 'terverifikasi' dan kolom masih kosong, isi otomatis
    // (waktu saat ini + 'Admin') supaya isVerified di formulir resmi
    // benar tanpa verifikasi ulang.
    if (row[112] === '') row[112] = oldRow[112];
    if (row[113] === '') row[113] = oldRow[113];
    if (adminToken && s(record.status).trim() === 'terverifikasi' && s(oldRow[112]).trim() === '' && s(row[112]).trim() === '') {
      row[112] = new Date().toISOString();
      row[113] = 'Admin';
    }
    // Jalur WALI tidak boleh menulis kolom verifikasi (v2.9): paksa nilai
    // lama — hanya jalur admin yang boleh mengisi/mengubahnya.
    // (v2.10, H1) Jalur WALI juga tidak boleh mengubah status, hasil
    // pengumuman, seluruh kolom verifikasi/pembayaran, dan angka inden —
    // paksa semuanya ke nilai lama supaya wali tidak bisa self-approve
    // LULUS/lunas. Hanya jalur admin yang boleh mengubah kolom-kolom ini.
    // Indeks kolom: 4 = Status; 65-72 = verification.* (hasil/catatan
    // observasi, wawancara, biaya formulir, seragam, buku, pembayaran
    // lunas, nominal terbayar); 73-74 = hasil/catatan pengumuman;
    // 106-110 = inden; 112-113 = Terverifikasi Pada/Oleh.
    if (!adminToken) {
      row[112] = oldRow[112];
      row[113] = oldRow[113];
      row[4] = oldRow[4];
      for (var v = 65; v <= 74; v++) {
        row[v] = oldRow[v];
      }
      for (var d2 = 106; d2 <= 110; d2++) {
        row[d2] = oldRow[d2];
      }
    }
    // Timpa kolom B..(akhir), kolom A (Timestamp) dipertahankan.
    sheet.getRange(targetRow, 2, 1, HEADERS.length - 1).setValues([row.slice(1)]);
    addAuditLog('PUBLIC', 'UPDATE_REGISTRATION', 'Update pendaftaran: ' + nomor);
    return {
      success: true,
      nomorPendaftaran: nomor,
      message: 'Data ' + nomor + ' berhasil diperbarui di sheet ' + tabNameForYear(academicYear) + '.'
    };
  } finally {
    lock.releaseLock();
  }
}

// ============ TOKEN (kompatibilitas mundur — pendaftaran saat ini TIDAK memakai token) ============
// (v2.9) Fungsi bulkGenerateTokens (legacy) DIHAPUS beserta route-nya:
// action tanpa auth yang menulis kode token ke sheet 'Master Token'.
// Pendaftaran saat ini tidak memakainya; penghapusan menutup celah tulis
// tanpa auth terakhir di backend.
