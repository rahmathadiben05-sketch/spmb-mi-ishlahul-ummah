import {
  AcademicYear,
  ApplicationStatus,
  AuditLog,
  CmsContent,
  DashboardWaliMuridConfig,
  DocumentsData,
  FeeItem,
  PublicStats,
  RegistrationRecord,
  RegistrationType,
  RincianBiayaPendaftaran,
  SchoolSettings,
  Token,
  UserRole,
  WaliMuridSession,
  Wave,
  WebhookLog,
} from './types';

const STORAGE_KEYS = {
  SETTINGS: 'spmb_school_settings',
  TOKENS: 'spmb_tokens_list',
  REGISTRATIONS: 'spmb_registrations_list',
  ACADEMIC_YEARS: 'spmb_academic_years',
  WAVES: 'spmb_waves',
  AUDIT_LOGS: 'spmb_audit_logs',
  WEBHOOK_LOGS: 'spmb_webhook_logs',
  CURRENT_DRAFT: 'spmb_registration_draft',
  ROLE: 'spmb_user_role',
  WALI_MURID_SESSION: 'spmb_wali_murid_session',
  SYNC_QUEUE: 'spmb_sync_queue',
  SETTINGS_UPDATED_AT: 'spmb_settings_updated_at',
  // Token sesi admin (verifyAdminPin) — kuncinya di sini, tapi aksesnya
  // HANYA lewat get/setAdminSessionToken yang memakai sessionStorage
  // (tidak pernah localStorage).
  ADMIN_TOKEN: 'spmb_admin_session_token',
};

// Initial default rincian biaya pendaftaran resmi
export const DEFAULT_RINCIAN_BIAYA: RincianBiayaPendaftaran = {
  judulDokumen: 'Informasi Pendaftaran',
  subjudulDokumen: 'Rincian Administrasi & Perlengkapan Siswa Baru',
  introPesan: 'Berikut adalah rincian resmi administrasi pendaftaran dan paket perlengkapan siswa baru MI Ishlahul Ummah Pranti Tahun Ajaran 2027/2028.',
  judulAdministrasi: 'Administrasi Pendaftaran',
  itemsAdministrasi: [
    { id: 'adm-1', nama: 'Formulir pendaftaran', biaya: 100000 },
    { id: 'adm-2', nama: 'Buku rapor', biaya: 70000 },
    { id: 'adm-3', nama: 'Buku tabungan', biaya: 7000 },
    { id: 'adm-4', nama: 'Buku pembayaran SPP', biaya: 6000 },
  ],
  catatanAdministrasi: 'Keterangan: Administrasi pendaftaran sebesar Rp {biayaPendaftaran} wajib dilunasi terlebih dahulu.',
  judulPerempuan: 'Perlengkapan Siswa Perempuan',
  itemsPerempuan: [
    { id: 'p-1', nama: 'Seragam batik', biaya: 95000 },
    { id: 'p-2', nama: 'Baju olahraga', biaya: 95000 },
    { id: 'p-3', nama: 'Kerudung putih', biaya: 45000 },
    { id: 'p-4', nama: 'Kerudung cokelat', biaya: 45000 },
    { id: 'p-5', nama: 'Sabuk', biaya: 15000 },
    { id: 'p-6', nama: 'Kaos kaki putih', biaya: 15000 },
    { id: 'p-7', nama: 'Kaos kaki hitam', biaya: 15000 },
    { id: 'p-8', nama: 'Bet sekolah (logo)', biaya: 10000 },
    { id: 'p-9', nama: 'Bet kelas', biaya: 7000 },
    { id: 'p-10', nama: 'Bet Pramuka lengkap', biaya: 10000 },
    { id: 'p-11', nama: 'Hasduk + ring', biaya: 15000 },
  ],
  judulLakiLaki: 'Perlengkapan Siswa Laki-laki',
  itemsLakiLaki: [
    { id: 'l-1', nama: 'Seragam batik', biaya: 95000 },
    { id: 'l-2', nama: 'Baju olahraga', biaya: 95000 },
    { id: 'l-3', nama: 'Sabuk', biaya: 15000 },
    { id: 'l-4', nama: 'Kaos kaki putih', biaya: 15000 },
    { id: 'l-5', nama: 'Kaos kaki hitam', biaya: 15000 },
    { id: 'l-6', nama: 'Bet sekolah (logo)', biaya: 10000 },
    { id: 'l-7', nama: 'Bet kelas', biaya: 7000 },
    { id: 'l-8', nama: 'Bet Pramuka lengkap', biaya: 10000 },
    { id: 'l-9', nama: 'Hasduk + ring', biaya: 15000 },
    { id: 'l-10', nama: 'Kopyah', biaya: 27000 },
    { id: 'l-11', nama: 'Dasi', biaya: 11000 },
  ],
  judulRingkasan: 'Total Administrasi dan Perlengkapan',
  catatanRingkasan: 'Catatan Penting: Total tersebut merupakan gabungan biaya administrasi dan perlengkapan, bukan nominal yang wajib dibayarkan sekaligus.',
  judulKetentuan: 'Ketentuan Pembayaran',
  ketentuanPembayaran: [
    'Administrasi pendaftaran sebesar Rp {biayaPendaftaran} wajib dilunasi terlebih dahulu.',
    'Biaya perlengkapan siswa boleh dibayar secara bertahap sesuai kesepakatan dengan panitia SPMB.',
    'Perlengkapan pada umumnya dibeli melalui madrasah.',
    'Atribut tertentu, seperti bet Pramuka lengkap, boleh dibeli sendiri di luar sekolah selama sesuai dengan ketentuan madrasah.',
    'Harga kaos kaki putih dan hitam masing-masing tetap Rp15.000.',
  ],
  judulBuku: 'Buku Pelajaran',
  deskripsiBuku: 'Biaya buku pelajaran belum termasuk dalam total biaya pendaftaran. Informasi harga akan disampaikan kemudian setelah madrasah menerima daftar harga resmi dari penerbit pada tahun pelajaran berjalan.',
  footerInfo: 'Panitia Penerimaan Murid Baru (SPMB) MI Ishlahul Ummah • Pranti, Sedati, Sidoarjo',
};

// Initial default konfigurasi dashboard wali murid
export const DEFAULT_DASHBOARD_WALI_MURID: DashboardWaliMuridConfig = {
  portalBadge: 'Dashboard Wali Murid',
  portalSubtitle: 'Portal Resmi SPMB TA {TA}',
  verifiedBadge: 'Akun Aktif',
  welcomeSubtitle: 'Wali Murid dari calon ananda {studentName}. Seluruh proses pendaftaran dan informasi biaya dapat Anda kelola secara aman di bawah ini.',
  highlightBadge: 'Fitur Khusus Wali Murid',
  highlightTitle: 'Informasi Pendaftaran & Rincian Biaya Resmi',
  highlightDeskripsi: 'Lihat rincian lengkap biaya administrasi pendaftaran (formulir, rapor, tabungan, SPP), paket perlengkapan siswa laki-laki & perempuan, ketentuan pembayaran bertahap, dan informasi buku pelajaran resmi TA {TA}.',
  highlightBtnText: 'Buka Informasi Pendaftaran',
  card1Title: 'Informasi Pendaftaran',
  card1Deskripsi: 'Rincian biaya administrasi wajib, perlengkapan siswa putra & putri, serta panduan pembayaran bertahap.',
  card1BtnText: 'Buka Rincian Biaya',
  card2TitleDraft: 'Lengkapi Formulir 4 Langkah',
  card2TitleSubmitted: 'Lihat / Edit Formulir',
  card2Deskripsi: 'Kelola data santri, identitas orang tua, alamat tempat tinggal, dan unggah berkas (KK & Akta).',
  card2BtnTextDraft: 'Lanjut Isi Formulir',
  card2BtnTextSubmitted: 'Periksa Data',
  card3Title: 'Lacak Status Seleksi',
  card3Deskripsi: 'Pantau timeline progres verifikasi berkas, jadwal observasi ramah anak, dan hasil pengumuman resmi.',
  card3BtnText: 'Lacak Progres',
  card4Title: 'Cetak Lembar Bukti',
  card4Deskripsi: 'Unduh atau cetak bukti pendaftaran resmi ber-barcode untuk dibawa saat observasi di madrasah.',
  card4BtnText: 'Cetak Sekarang',
  helpdeskTitle: 'Konsultasi Panitia SPMB {namaMadrasah}',
  helpdeskDeskripsi: 'Hubungi panitia via WhatsApp resmi ({kontakWhatsapp}) jika membutuhkan bantuan seputar pendaftaran.',
  helpdeskBtnText: 'Chat Panitia SPMB',
};

// Aturan usia (keputusan Rahmat, 2026-11-10): calon santri kelas 1 TA 2027/2028
// minimal sudah berusia 6 tahun per 1 Juli 2027.
export const AGE_REFERENCE_DATE = '2027-07-01'; // tanggal acuan usia
export const MAX_BIRTH_DATE = '2021-07-01'; // tanggal lahir paling lambat (lahir pada tanggal ini = tepat 6 tahun per 1 Juli 2027)

// URL webhook canonical (deployment V1 lama) — SATU-SATUNYA URL webhook
// hardcode yang diizinkan, dipakai sebagai default di getSchoolSettings.
// Rotasi webhook (Paket A, 2026-11-11): bila NEW_WEBHOOK_URL sudah diisi
// koordinator (URL deployment baru) DAN URL tersimpan masih URL lama,
// getSchoolSettings() memakai URL baru ini (shim di bawah). Sampai
// rotasi dieksekusi, NEW_WEBHOOK_URL sengaja kosong.
export const LEGACY_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyA-VnOSLft5hrhhWyWaVQV8TaXzKmxKF4xoq1T0dDyqxY7ArQT7uYuVXX0on6_C1Wt/exec';
export const NEW_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbw3922uPBY9jj5SE8czThoMO4LX8BKeYlwUBRgNLOOiaSITYJduxlRLP6wocz5Sb7BU/exec';

// Template standar pesan WA ucapan LULUS (dapat diubah admin lewat menu
// Template Pesan WA di tab Pengumuman; tersimpan di pengaturan dan
// tersinkron ke server). Placeholder yang didukung: {namaMadrasah},
// {namaMadrasahUpper}, {namaOrangTua}, {namaSiswa}, {nomorPendaftaran},
// {tahunAjaran}, {siteUrl}.
export const DEFAULT_PESAN_WA_LULUS = `*PENGUMUMAN KELULUSAN SPMB*\n*{namaMadrasahUpper}*\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh,\nYth. Bapak/Ibu {namaOrangTua},\n\nAlhamdulillah, dengan ini kami sampaikan bahwa ananda:\n• Nama Calon Siswa: *{namaSiswa}*\n• Nomor Pendaftaran: *{nomorPendaftaran}*\n\ndinyatakan *LULUS* seleksi penerimaan santri baru {namaMadrasah} Tahun Ajaran {tahunAjaran}.\n\nSilakan datang ke madrasah untuk daftar ulang sesuai jadwal dari panitia dengan menunjukkan pesan WhatsApp ini. Bukti Diterima ananda akan dicetakkan oleh panitia saat daftar ulang. Pengumuman juga dapat dilihat di: {siteUrl} (masuk dengan No. WhatsApp + PIN). Jika membutuhkan bantuan lebih lanjut, silakan hubungi Sekretariat SPMB.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\n*Panitia SPMB {namaMadrasah}*`;

// Initial default school settings
export const DEFAULT_SETTINGS: SchoolSettings = {
  namaMadrasah: 'MI Ishlahul Ummah',
  logoMadrasahUrl: '',
  brosurDigitalUrl: '',
  instansiInduk: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  nsm: '111235150097',
  npsn: '60717039',
  alamatMadrasah: 'Pranti, Kec. Sedati, Kab. Sidoarjo, Jawa Timur 61253',
  googleMapsUrl: '', // Titik peta: diisi lewat Profil Madrasah (link Google Maps / koordinat); kosong = cari teks alamat
  kontakWhatsapp: '085196677872',
  emailMadrasah: 'ishlahulummahmi@gmail.com',
  namaKepalaMadrasah: 'Astutik, S.Pd',
  nipKepalaMadrasah: '', // NIP belum diberikan Rahmat — isi lewat Dashboard Admin bila ada
  activeAcademicYear: '2027/2028',
  activeWave: 'TA 2027/2028',
  biayaPendaftaran: 183000, // Administrasi resmi (rincian): formulir + rapor + tabungan + SPP
  kuotaTarget: 120,
  templateNomorPendaftaran: 'MIIU/SPMB/{TA}/{NO}',
  driveFolderId: '1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua',
  spreadsheetId: '1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4',
  googleAppScriptUrl: LEGACY_WEBHOOK_URL, // Web App v2.4 (Version 6), deploy 2026-11-10 — JANGAN ganti ke URL deployment lain tanpa uji ulang
  enableDigitalStamp: true,
  modeBatasWaktu: 'gelombang',
  tanggalBatasPendaftaran: '2027-06-30T23:59:59',
  sectionVisibility: {
    showCountdown: true,
    showHero: true,
    showTimeline: true,
    showMengenalDekat: false, // Non-aktif sesuai permintaan user, dapat diaktifkan kembali via Admin
    showProgramMutu: true,
    showSambutanKepala: false, // Non-aktif sesuai permintaan user, dapat diaktifkan kembali via Admin
    showDownloads: true,
    showFaq: true,
    showSekretariat: true,
    showHeader: true,
    showFooter: true,
  },
  sectionVisibilityConfigured: false,
  cmsContent: undefined, // will be assigned below
  rincianBiayaPendaftaran: DEFAULT_RINCIAN_BIAYA,
  dashboardWaliMuridConfig: DEFAULT_DASHBOARD_WALI_MURID,
  pesanWaLulus: DEFAULT_PESAN_WA_LULUS,
};

// Initial default CMS content for all pages (Beranda, Formulir, Sukses, Dokumen Cetak)
export const DEFAULT_CMS_CONTENT: CmsContent = {
  // 1. Beranda / Landing Page
  headerTagline: 'Generasi Qur\'ani, Cerdas & Berakhlak Mulia',
  footerTagline: 'Membentuk Generasi Qur\'ani, Cerdas, dan Berakhlak Mulia',
  footerAbout: 'Portal resmi Penerimaan Peserta Didik Baru Online (SPMB). Sistem administrasi modern yang memudahkan calon wali murid mendaftarkan putra-putri tercinta secara transparan, aman, dan efisien.',
  heroBadge: 'Penerimaan Murid Baru Online (SPMB)',
  heroTitle: 'Membina Generasi Qur\'ani, Berakhlak Mulia & Berprestasi',
  heroSubtitle: 'Selamat datang di Portal SPMB MI Ishlahul Ummah Pranti. Sistem pendaftaran mudah, transparan, dan terintegrasi langsung dengan konfirmasi digital serta observasi ramah anak.',
  heroCtaPrimary: 'Daftar Sekarang (Mulai Formulir)',
  heroCtaSecondary: 'Lacak Status',
  heroCountdownLabel: 'Hitung Mundur Penutupan:',
  mengenalJudul: 'Madrasah Ramah Anak yang Membina Akhlak & Prestasi',
  mengenalDeskripsi: 'MI Ishlahul Ummah berdedikasi menciptakan lingkungan belajar yang aman, penuh kasih sayang, dan menginspirasi rasa ingin tahu ananda. Kami memadukan nilai keislaman Ahlussunnah wal Jama\'ah dengan kecakapan literasi abad ke-21.',
  mengenalPoints: [
    "Pembiasaan Sholat Dhuha, Dhuhur Berjamaah & Tartil Al-Qur'an",
    'Tenaga Pendidik Berdedikasi, Telaten & Ramah Anak',
    'Gedung Madrasah Bersih, Asri, dan Aman bagi Tumbuh Kembang',
    'Sistem Administrasi SPMB Online Terpadu & Bebas Antrean',
  ],
  mengenalAkreditasiNilai: 'Unggul (A)',
  mengenalRasioGuru: '1 : 15',
  programJudul: 'Program & Keunggulan Madrasah',
  programDeskripsi: 'Kurikulum terpadu yang memadukan nilai Qur\'ani, pembiasaan akhlak mulia, dan sains modern.',
  programCards: [
{
      id: 'prog-1',
      title: "Tahfidz & Tartil Al-Qur'an",
      subtitle: 'Pembinaan Makharijul Huruf & Hafalan Juz Amma',
      desc: "Metode tartil intensif yang membimbing ananda mencintai, membaca dengan fasih, serta menghafal Al-Qur'an secara bertahap dan menyenangkan.",
      tag: 'Program Utama',
      highlights: ['Bimbingan Ustadz/Ustadzah Bersertifikasi', 'Target Hafalan Juz 30 & Surat Pilihan', 'Munaqosyah & Wisuda Tahfidz'],
    },
{
      id: 'prog-2',
      title: 'Pendidikan Karakter & Akhlakul Karimah',
      subtitle: 'Pembiasaan Sholat Berjamaah & Adab Sehari-hari',
      desc: 'Membentuk santri yang santun, disiplin, berbakti kepada orang tua, serta terbiasa menjalankan sholat dhuha dan dhuhur berjamaah.',
      tag: 'Karakter Unggul',
      highlights: ['Sholat Dhuha & Dhuhur Berjamaah Setiap Hari', 'Kultum Siswa & Literasi Islami', 'Budaya 5S (Senyum, Salam, Sapa, Sopan, Santun)'],
    },
{
      id: 'prog-3',
      title: 'Sains, Literasi & Teknologi Abad 21',
      subtitle: 'Kurikulum Merdeka Terpadu & Kelas Digital',
      desc: 'Mengasah nalar kritis, kemampuan logika, dan kecakapan literasi digital anak melalui pembelajaran berbasis proyek interaktif yang ramah anak.',
      tag: 'Akademik & Sains',
      highlights: ['Praktikum Sains & Eksperimen Sederhana', 'Pengenalan Komputer & Literasi Digital', 'Bimbingan Kompetisi Sains Madrasah (KSM)'],
    },
  ],
  sambutanJudul: 'Sambutan Kepala Madrasah',
  sambutanTeks: 'Bismillahirrohmaanirrohiim. Kami meyakini setiap anak membawa fitrah dan potensi terbaik dari Allah SWT. Bersama para orang tua, kami berkomitmen mendampingi langkah awal ananda menuju masa depan yang cerah, cerdas bernalar, dan berakhlak karimah.',
  sambutanAmanah: 'Amanah & Ketulusan Mendidik',
  sambutanFotoUrl: '',
  timelineJudul: '4 Langkah Praktis Menjadi Santri Baru',
  timelineDeskripsi: 'Alur pendaftaran disederhanakan agar Bapak/Ibu dapat mendaftar mandiri dari rumah tanpa ribet, lalu menyelesaikan administrasi dan observasi di madrasah.',
  timelineSteps: [
{
      id: 'step-1',
      badge: 'Online Mandiri (1 Menit)',
      title: 'Registrasi Akun & Buat PIN 6 Digit',
      desc: 'Klik "Daftar Sekarang", isi nama orang tua, no. WhatsApp & nama ananda. Sistem langsung menerbitkan PIN 6 digit unik yang tersimpan dan siap digunakan.',
      details: [
        'Tanpa antre, bisa dilakukan dari HP/laptop',
        'PIN 6 digit langsung muncul di layar & bisa disalin',
        'Bisa dibagikan/disimpan ke WhatsApp pribadi',
      ],
    },
{
      id: 'step-2',
      badge: 'Fleksibel & Auto-Save',
      title: 'Isi Formulir & Unggah Berkas Digital',
      desc: 'Login dengan No. WA/Nomor Pendaftaran + PIN 6 Digit Anda untuk mengisi biodata ananda serta mengunggah foto KK, Akta Kelahiran, dan Pas Foto. Data tersimpan otomatis.',
      details: [
        'Bisa login berulang kali untuk melengkapi data',
        'Kompresi otomatis foto dokumen agar hemat kuota',
        'Cetak & unduh Bukti Registrasi Mandiri',
      ],
    },
{
      id: 'step-3',
      badge: 'Layanan Terpadu di Madrasah',
      title: 'Observasi Santri & Administrasi Terpadu',
      desc: 'Datang ke madrasah membawa berkas asli untuk verifikasi dan ananda mengikuti observasi ramah anak. Sekaligus penyelesaian administrasi paket perlengkapan santri.',
      details: [
        'Pencocokan berkas asli & observasi santri ceria',
        'Penyelesaian biaya formulir pendaftaran SPMB',
        'Administrasi seragam, buku paket, bet, buku tabungan & rapor',
      ],
    },
{
      id: 'step-4',
      badge: 'Hasil Resmi & Transparan',
      title: 'Pengumuman Kelulusan & Daftar Ulang',
      desc: 'Pantau pengumuman kelulusan secara online lewat menu "Cek Status" menggunakan No. WhatsApp/Nomor Pendaftaran + PIN 6 Digit. Bagi santri yang diterima, lanjutkan konfirmasi daftar ulang.',
      details: [
        'Cek status real-time kapan saja dari rumah',
        'Unduh Surat Keterangan Diterima resmi',
        'Selamat bergabung menjadi Santri MI Ishlahul Ummah!',
      ],
    },
  ],
  downloadsJudul: 'Pusat Unduhan & Brosur SPMB',
  downloadsDeskripsi: 'Unduh brosur resmi, format formulir cetak offline, dan buku panduan pendaftaran untuk kemudahan Anda.',
  // Item unduhan (Paket C): judul + deskripsi per item bisa diedit admin
  // dari Pusat CMS; id + aksi unduhnya tetap (lihat LandingDownloads).
  downloadsItems: [
    {
      id: 'download-brosur',
      title: 'Brosur Resmi SPMB TA {TA}',
      description:
        'Brosur informasi lengkap penerimaan murid baru, visi madrasah, program unggulan tahfidz, fasilitas belajar, dan alur pendaftaran santri baru.',
    },
    {
      id: 'download-formulir',
      title: 'Formulir Pendaftaran Fisik / Offline SPMB',
      description:
        'Formulir cetak offline bagi calon wali murid yang ingin mengisi dan mengumpulkan berkas secara langsung ke sekretariat panitia madrasah.',
    },
    {
      id: 'download-panduan',
      title: 'Panduan Tata Cara Pendaftaran Online & PIN 6 Digit',
      description:
        'Petunjuk teknis langkah demi langkah mulai dari membuat PIN 6 digit, mengisi biodata, hingga cetak bukti pendaftaran resmi.',
    },
  ],
  // Deskripsi lokasi kampus (Paket C): tampil di kartu Lokasi seksi Sekretariat.
  lokasiDeskripsi:
    'Kampus madrasah yang asri, tenang, dan strategis, aman dari kebisingan jalan raya utama sehingga sangat kondusif untuk belajar santri.',
  faqJudul: 'Pertanyaan yang Sering Diajukan',
  faqDeskripsi: 'Informasi lengkap seputar alur pendaftaran, dokumen persyaratan, dan mekanisme seleksi murid baru di {namaMadrasah}.',
  faqItems: [
{
        id: 'faq-1',
        category: 'alur',
        question: 'Bagaimana alur pendaftaran murid baru online dan cara mendapatkan Nomor Registrasi & PIN?',
        answer:
          `Pendaftaran santri baru di {namaMadrasah} kini berlangsung cepat, mandiri, dan bebas antrean tanpa perlu datang ke loket di awal:`,
        points: [
          'Langkah 1: Klik tombol "Daftar Sekarang" pada halaman utama website.',
          'Langkah 2: Isi data pendaftaran awal (Nama Orang Tua/Wali, Nomor WhatsApp aktif, dan Nama Calon Santri).',
          'Langkah 3: Sistem langsung menerbitkan Nomor Registrasi resmi dan PIN 6 digit secara instan di layar.',
          'Langkah 4: Simpan Nomor Registrasi dan PIN Anda (bisa disalin dengan 1 klik atau dibagikan ke WhatsApp pribadi).',
          'Langkah 5: Masuk ke formulir wizard 4 langkah untuk melengkapi data santri, orang tua, alamat, dan mengunggah berkas persyaratan.',
        ],
      },
{
        id: 'faq-2',
        category: 'biaya',
        question: 'Bagaimana ketentuan biaya administrasi pendaftaran dan paket perlengkapan santri baru?',
        answer:
          'Rincian resmi biaya administrasi dan perlengkapan siswa dapat diakses secara transparan oleh wali murid yang telah memiliki akun dan login resmi di portal SPMB:',
        points: [
          'Administrasi pendaftaran sebesar Rp {biayaPendaftaran} (formulir pendaftaran, buku rapor, buku tabungan, buku SPP) wajib dilunasi terlebih dahulu.',
          'Biaya perlengkapan siswa (seragam batik, olahraga, kerudung/kopyah, dasi, sabuk, bet, hasduk) boleh dibayar secara bertahap sesuai kesepakatan dengan panitia SPMB.',
          'Atribut tertentu, seperti bet Pramuka lengkap, boleh dibeli sendiri di luar sekolah selama sesuai dengan ketentuan madrasah.',
          'Biaya buku pelajaran belum termasuk dalam total biaya pendaftaran dan akan disampaikan setelah menerima daftar harga resmi dari penerbit.',
        ],
      },
{
        id: 'faq-3',
        category: 'status',
        question: 'Bagaimana cara memantau progres tahapan verifikasi berkas pendaftaran ananda?',
        answer:
          'Wali murid dapat memantau status berkas secara berkala dan mandiri menggunakan fitur Pelacak Status bertahap (stepper timeline):',
        points: [
          'Klik tombol "Lacak Status" di menu atas atau di bagian beranda.',
          'Ketik Nomor Registrasi resmi (misal: MIIU/SPMB/...) atau NIK Santri (16 digit).',
          'Sistem menampilkan timeline 4 tahapan: Pendaftaran Berhasil Diajukan -> Verifikasi Berkas oleh Panitia -> Jadwal Observasi & Wawancara -> Keputusan Penerimaan.',
          'Dari halaman lacak status, Anda juga dapat mengunduh atau mencetak ulang Lembar Bukti Registrasi resmi ber-barcode.',
        ],
      },
{
        id: 'faq-4',
        category: 'alur',
        question: 'Apakah formulir pendaftaran bisa disimpan sementara (Auto-Save) dan dilanjutkan nanti?',
        answer:
          'YA, SANGAT BISA! Sistem formulir kami didukung fitur Auto-Save otomatis sehingga Anda tidak perlu khawatir kehilangan data:',
        points: [
          'Setiap kali Anda mengetik data atau berpindah langkah, sistem otomatis menyimpannya ke perangkat Anda.',
          'Jika Anda ingin keluar dan melanjutkan nanti, cukup buka menu "Masuk / Lanjutkan Pendaftaran" lalu masukkan Nomor Registrasi dan PIN Anda.',
          'Semua data biodata dan foto berkas yang telah Anda unggah tetap tersimpan utuh dan siap dilanjutkan.',
        ],
      },
{
        id: 'faq-5',
        category: 'dokumen',
        question: 'Dokumen dan berkas apa saja yang wajib disiapkan sebelum mendaftar?',
        answer:
          'Sebelum melengkapi formulir digital, pastikan Bapak/Ibu telah menyiapkan foto atau hasil scan dokumen resmi yang jelas:',
        points: [
          'Kartu Keluarga (KK) Asli (pastikan Nomor KK dan NIK ananda terlihat jelas).',
          'Akta Kelahiran Anak Asli.',
          'Pas Foto Berwarna terbaru ukuran 3x4 (background merah atau biru).',
          'Khusus Jalur Siswa Pindahan: Surat Keterangan Pindah dari madrasah/sekolah asal serta fotokopi Rapor terakhir.',
          'Piagam / Sertifikat Kejuaraan atau Tahfidz (opsional sebagai nilai tambah bagi ananda).',
        ],
      },
{
        id: 'faq-6',
        category: 'dokumen',
        question: 'Berapa batasan ukuran dan format file berkas yang diunggah?',
        answer:
          'Sistem SPMB mendukung format dokumen PDF serta gambar JPG, JPEG, dan PNG dengan ukuran maksimal 2 MB per file. Sistem kami dilengkapi fitur kompresi foto otomatis di browser sehingga foto jepretan kamera ponsel tetap ringan diunggah tanpa mengurangi ketajaman tulisan dokumen.',
        points: [
          'Pastikan pencahayaan cukup dan hindari pantulan lampu atau bayangan tangan saat memfoto berkas.',
          'Pastikan seluruh sudut dokumen (terutama NIK dan nama) masuk dalam bingkai foto.',
          'Dokumen hasil scan aplikasi ponsel (seperti CamScanner) dalam format PDF atau JPG juga sangat disarankan.',
        ],
      },
{
        id: 'faq-7',
        category: 'biaya',
        question: 'Kapan biaya formulir dan paket perlengkapan santri dibayarkan?',
        answer:
          `Registrasi akun online dan pengisian formulir di awal bebas biaya awal (tanpa perlu transfer di muka). Biaya formulir resmi dan paket perlengkapan santri dibayarkan saat hadir ke madrasah pada Hari Observasi & Verifikasi Dokumen Asli:`,
        points: [
          'Biaya formulir pendaftaran SPMB resmi: Rp {biayaPendaftaran}',
          'Paket perlengkapan terpadu mencakup: Seragam madrasah lengkap putra/putri, buku pegangan/modul santri, bet madrasah, buku tabungan, dan rapor.',
          'Pembayaran dilayani langsung di loket Sekretariat Panitia Madrasah (Tunai atau non-tunai via Transfer Bank / QRIS).',
          'Tersedia opsi skema cicilan bertahap untuk memudahkan wali murid.',
        ],
      },
{
        id: 'faq-8',
        category: 'status',
        question: 'Apa saja agenda yang dilakukan saat hadir pada Hari Observasi & Verifikasi?',
        answer:
          'Setelah menyelesaikan formulir online dan mencetak Lembar Bukti Registrasi, orang tua dan ananda hadir ke kampus madrasah untuk:',
        points: [
          'Membawa berkas fisik asli (KK, Akta Kelahiran, Pas Foto) untuk pencocokan berkas dengan formulir online.',
          'Ananda mengikuti Sesi Observasi Ramah Anak: Pendekatan ceria dan edukatif untuk memetakan kesiapan motorik, kemandirian, dan adab ananda (tanpa tes calistung yang membebani).',
          'Pengukuran dan penyesuaian ukuran seragam madrasah ananda secara langsung di tempat.',
          'Penerimaan tanda bukti verifikasi resmi dan pengumuman jadwal daftar ulang santri baru.',
        ],
      },
{
        id: 'faq-9',
        category: 'dokumen',
        question: 'Berapa batas usia calon peserta didik baru kelas 1 Madrasah Ibtidaiyah?',
        answer:
          'Sesuai keputusan panitia SPMB MI Ishlahul Ummah TA 2027/2028, calon peserta didik kelas 1 minimal sudah berusia 6 tahun pada tanggal 1 Juli 2027 (tanggal lahir paling lambat 1 Juli 2021):',
        points: [
          'Lahir 1 Juli 2021 atau sebelumnya: memenuhi syarat usia.',
          'Lahir setelah 1 Juli 2021: belum memenuhi syarat — silakan mendaftar pada tahun ajaran berikutnya.',
          'Usia dihitung otomatis dari tanggal lahir di formulir; pendaftar yang belum memenuhi syarat tidak dapat melanjutkan ke langkah berikutnya.',
        ],
      },
  ],
  jamPelayanan: 'Senin - Sabtu: 07.30 - 14.00 WIB',

  // 2. Formulir Pendaftaran (Wizard 4 Langkah & Review)
  step1Title: 'LANGKAH 1: Data Calon Santri',
  step1Subtitle: 'Isikan data identitas siswa baru sesuai Kartu Keluarga (KK) & Akta Kelahiran resmi.',
  step1Notice: 'Pastikan NIK 16 digit dan No. KK sesuai data kependudukan Capil. Nomor KIP bersifat opsional jika sudah memiliki.',
  step2Title: 'LANGKAH 2: Data Orang Tua / Wali',
  step2Subtitle: 'Isi data identitas ayah kandung, ibu kandung, status keberadaan, dan wali santri (jika ada).',
  step2Notice: 'Pilih status keberadaan (Masih Hidup, Sudah Meninggal, atau Tidak Diketahui). Data wali bersifat opsional jika kedua orang tua masih ada.',
  step3Title: 'LANGKAH 3: Data Alamat Domisili',
  step3Subtitle: 'Pilih alamat sesuai KK, dari provinsi sampai desa/kelurahan.',
  step3Notice: 'Cantumkan alamat domisili tempat tinggal riil santri saat ini untuk pemetaan zonasi dan jemputan.',
  step4Title: 'LANGKAH 4: Unggah Berkas Persyaratan',
  step4Subtitle: 'Unggah scan dokumen asli dalam format JPG/PNG/PDF (maksimal 2MB per file).',
  step4Notice: 'Kartu Keluarga dan Akta Kelahiran WAJIB diunggah. Bukti NISN bersifat OPSIONAL. Bagi calon santri yang sudah memegang Ijazah TK/RA, WAJIB diunggah.',
  reviewTitle: 'LANGKAH 5: Peninjauan Akhir & Pakta Integritas',
  reviewSubtitle: 'Periksa kembali seluruh data siswa, orang tua, alamat, dan berkas persyaratan sebelum mengirim formulir.',
  paktaIntegritasTeks: 'Dengan ini saya menyatakan dengan sesungguhnya bahwa seluruh data yang diisikan dan dokumen yang diunggah adalah benar, absah, dan dapat dipertanggungjawabkan sesuai ketentuan madrasah.',

  // 3. Halaman Sukses & Konfirmasi
  successTitle: 'Alhamdulillah, Formulir Telah Diterima!',
  successSubtitle: 'Alhamdulillah, berkas formulir pendaftaran calon santri baru telah tersimpan di sistem SPMB madrasah kami.',
  successNotice: 'Catat dan simpan Nomor Pendaftaran serta PIN akun Anda dengan aman. Gunakan untuk masuk ke Dashboard Wali Murid sewaktu-waktu.',
  successStep1Title: '1. Cetak Lembar Bukti Registrasi',
  successStep1Desc: 'Unduh atau cetak lembar bukti pendaftaran ber-barcode untuk dibawa saat hadir observasi fisik ke madrasah.',
  successStep2Title: '2. Hadir Observasi Ramah Anak',
  successStep2Desc: 'Ajak calon ananda ke madrasah sesuai jadwal untuk observasi kenyamanan belajar dan pencocokan berkas fisik asli.',
  successStep3Title: '3. Pantau Hasil Seleksi & Biaya',
  successStep3Desc: 'Masuk secara berkala ke Dashboard Wali Murid untuk memantau status verifikasi dan rincian administrasi madrasah.',
  successHelpText: 'Butuh bantuan teknis atau informasi jadwal observasi? Hubungi sekretariat panitia via WhatsApp resmi.',

  // 4. Dokumen Cetak KOP & Pengesahan
  kopInstansiAtas: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  kopNamaMadrasah: 'MADRASAH IBTIDAIYAH ISHLAHUL UMMAH',
  kopStatusAkreditasi: 'TERAKREDITASI A • NSM: 111235150097 • NPSN: 60717039',
  kopAlamat: 'Pranti, Kec. Sedati, Kab. Sidoarjo, Jawa Timur 61253 • Telp/WA: 085196677872 • Email: ishlahulummahmi@gmail.com',
  cetakKotaTitimangsa: 'Sidoarjo',
  cetakJabatanPenandatangan: 'Ketua Panitia SPMB',
  cetakNamaPenandatangan: 'Astutik, S.Pd',
  cetakNipPenandatangan: '',
  cetakKetentuanObservasi: '1. Membawa formulir bukti pendaftaran ini saat hadir ke madrasah.\n2. Membawa dokumen fisik asli (KK, Akta Kelahiran, dan Ijazah TK bagi yang sudah memiliki) untuk dicocokkan panitia.\n3. Calon santri hadir berpakaian rapi dan sopan didampingi orang tua/wali.',

  // 5. Galeri, Testimoni & Pengumuman
  galeriFotoUrl: ['/galeri/hari-santri.jpg', '/galeri/pesta-siaga.jpg'],
  testimoni: [],
  pengumumanBanner: '',
};

DEFAULT_SETTINGS.cmsContent = DEFAULT_CMS_CONTENT;

export const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay1', tahun: '2027/2028', isAktif: true, kuotaTotal: 120 },
  { id: 'ay2', tahun: '2028/2029', isAktif: false, kuotaTotal: 150 },
];

export const DEFAULT_WAVES: Wave[] = [
  {
    id: 'w1',
    nama: 'TA 2027/2028',
    academicYear: '2027/2028',
    isAktif: true,
    tanggalMulai: '2026-11-01',
    tanggalSelesai: '2027-06-30',
    biayaPendaftaran: 183000,
    // Inden + diskon Early Bird (disetujui Rahmat 2026-11-11) untuk periode
    // tunggal TA 2027/2028 (model tanpa gelombang): DP Rp50.000, diskon
    // Rp25.000 flat, kuota 20 kursi pertama, pelunasan maks 14 hari,
    // DP hangus bila lewat batas.
    indenAktif: true,
    indenDp: 50000,
    diskonJenis: 'rp',
    diskonNilai: 25000,
    kuotaDiskon: 20,
    batasAkhirInden: '', // '' = ikut tanggalSelesai gelombang (2027-06-30)
    batasPelunasanHari: 14,
    dpHangusJikaLewatBatas: true,
  },
  {
    id: 'w2',
    nama: 'Gelombang 2 (Reguler)',
    academicYear: '2027/2028',
    isAktif: false,
    tanggalMulai: '2027-03-01',
    tanggalSelesai: '2027-05-31',
    biayaPendaftaran: 183000,
    indenAktif: false,
  },
  {
    id: 'w3',
    nama: 'Jalur Prestasi',
    academicYear: '2027/2028',
    isAktif: false,
    tanggalMulai: '2026-11-01',
    tanggalSelesai: '2027-04-30',
    biayaPendaftaran: 183000,
    indenAktif: false,
  },
];

// Initial seed tokens (clean for production)
export const DEFAULT_TOKENS: Token[] = [];

// Seed initial registration records (clean for production)
export const DEFAULT_REGISTRATIONS: RegistrationRecord[] = [];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

// Storage Helpers
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function compressImageDataUrl(
  dataUrl: string,
  maxWidth: number = 500,
  maxHeight: number = 500,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (!isBrowser() || !dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function getLocalStorageUsageBytes(): number {
  if (!isBrowser()) return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      if (val) {
        total += (key.length + val.length) * 2;
      }
    }
  }
  return total;
}

// Batas gabungan ukuran dokumen saat submit (M-F3/B10): dokumen disimpan
// sebagai data URL base64 di localStorage (kuota browser ~5 MB), jadi total
// dokumen dibatasi 8 MB — diperiksa SEBELUM submit supaya gagal dengan
// pesan yang jelas, bukan melempar QuotaExceededError tanpa pesan.
export const MAX_TOTAL_DOCUMENT_BYTES = 8 * 1024 * 1024;

export function getDocumentsTotalBytes(documents: DocumentsData): number {
  let total = 0;
  for (const key of Object.keys(documents || {})) {
    const file = (documents as Record<string, unknown>)[key] as
      | { size?: unknown; url?: unknown }
      | undefined;
    if (!file || typeof file !== 'object') continue;
    if (typeof file.size === 'number' && file.size > 0) {
      total += file.size;
    } else if (typeof file.url === 'string' && file.url.indexOf('data:') === 0) {
      const comma = file.url.indexOf(',');
      const b64len = comma >= 0 ? file.url.length - comma - 1 : file.url.length;
      total += Math.floor((b64len * 3) / 4);
    }
  }
  return total;
}

const SESSION_OFFLOAD_KEYS = {
  BROSUR: 'spmb_session_brosur',
  LOGO: 'spmb_session_logo',
};

export function getSchoolSettings(): SchoolSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  let settings: SchoolSettings = data ? JSON.parse(data) : { ...DEFAULT_SETTINGS };
  if (!settings.emailMadrasah || settings.emailMadrasah === 'info@mi-islamiyah-unggulan.sch.id') {
    settings.emailMadrasah = 'ishlahulummahmi@gmail.com';
  }
  // Restore non-critical settings from sessionStorage if offloaded
  try {
    if (!settings.brosurDigitalUrl) {
      const sessionBrosur = sessionStorage.getItem(SESSION_OFFLOAD_KEYS.BROSUR);
      if (sessionBrosur) {
        settings.brosurDigitalUrl = sessionBrosur;
      }
    }
    if (!settings.logoMadrasahUrl) {
      const sessionLogo = sessionStorage.getItem(SESSION_OFFLOAD_KEYS.LOGO);
      if (sessionLogo) {
        settings.logoMadrasahUrl = sessionLogo;
      }
    }
  } catch (err) {
    console.warn('SessionStorage read error:', err);
  }
  // Ensure sectionVisibility and cmsContent defaults are present
  const defaultVis = { ...DEFAULT_SETTINGS.sectionVisibility };
  const currentVis = { ...(settings.sectionVisibility || {}) };
  // Sesuai preferensi user: pastikan Mengenal Lebih Dekat dan Sambutan Kepala nonaktif kecuali sudah diatur admin
  if (!settings.sectionVisibilityConfigured) {
    currentVis.showMengenalDekat = false;
    currentVis.showSambutanKepala = false;
  }
  settings.sectionVisibility = {
    ...defaultVis,
    ...currentVis,
  };
  settings.cmsContent = {
    ...DEFAULT_SETTINGS.cmsContent,
    ...(settings.cmsContent || {}),
  };
  settings.rincianBiayaPendaftaran = {
    ...DEFAULT_RINCIAN_BIAYA,
    ...(settings.rincianBiayaPendaftaran || {}),
    itemsAdministrasi: settings.rincianBiayaPendaftaran?.itemsAdministrasi || DEFAULT_RINCIAN_BIAYA.itemsAdministrasi,
    itemsPerempuan: settings.rincianBiayaPendaftaran?.itemsPerempuan || DEFAULT_RINCIAN_BIAYA.itemsPerempuan,
    itemsLakiLaki: settings.rincianBiayaPendaftaran?.itemsLakiLaki || DEFAULT_RINCIAN_BIAYA.itemsLakiLaki,
    ketentuanPembayaran: settings.rincianBiayaPendaftaran?.ketentuanPembayaran || DEFAULT_RINCIAN_BIAYA.ketentuanPembayaran,
  };
  settings.dashboardWaliMuridConfig = {
    ...DEFAULT_DASHBOARD_WALI_MURID,
    ...(settings.dashboardWaliMuridConfig || {}),
  };
  // Migrasi sekali jalan (perbaikan 2026-11-09): browser yang sudah menyimpan
  // pengaturan lama ikut diperbarui ke data resmi terbaru.
  if (settings.namaKepalaMadrasah && settings.namaKepalaMadrasah.indexOf('Ahmad Zainuddin') !== -1) {
    settings.namaKepalaMadrasah = 'Astutik, S.Pd';
    settings.nipKepalaMadrasah = '';
  }
  if (settings.nsm === '111235150099') settings.nsm = '111235150097';
  if (settings.npsn === '20584321') settings.npsn = '60717039';
  if (settings.biayaPendaftaran === 250000) settings.biayaPendaftaran = 183000;
  // Nomor WA resmi panitia (keputusan Rahmat, 2026-11-11): nomor dummy
  // 081234567890 diganti 085196677872 (K1). Berlaku untuk pengaturan
  // lama yang tersimpan di perangkat, termasuk sebelum migrasi ke server.
  if (settings.kontakWhatsapp === '081234567890') settings.kontakWhatsapp = '085196677872';
  if (settings.cmsContent?.kopAlamat && settings.cmsContent.kopAlamat.indexOf('081234567890') !== -1) {
    settings.cmsContent.kopAlamat = settings.cmsContent.kopAlamat.replace(/081234567890/g, '085196677872');
  }
  // Model tanpa gelombang TA 2027/2028 (2026-11-11): nama gelombang aktif
  // lama ikut diubah ke 'TA 2027/2028' (periode tunggal 1 Nov 2026–30 Jun 2027).
  if (settings.activeWave === 'Gelombang 1 (Early Bird)') settings.activeWave = 'TA 2027/2028';
  if (!settings.spreadsheetId) settings.spreadsheetId = '1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4';
  if (!settings.driveFolderId) settings.driveFolderId = '1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua';
  if (!settings.pesanWaLulus) settings.pesanWaLulus = DEFAULT_PESAN_WA_LULUS;
  if (!settings.googleAppScriptUrl) settings.googleAppScriptUrl = LEGACY_WEBHOOK_URL;
  // Shim rotasi webhook (Paket A): URL lama yang tersimpan beralih ke
  // deployment baru bila konstanta NEW_WEBHOOK_URL sudah diisi koordinator.
  if (settings.googleAppScriptUrl === LEGACY_WEBHOOK_URL && NEW_WEBHOOK_URL) {
    settings.googleAppScriptUrl = NEW_WEBHOOK_URL;
  }
  // Migrasi label badge (Paket A, 2026-11-11): 'Akun Terverifikasi' tidak
  // lagi dipakai sebagai default — akun wali yang belum diverifikasi
  // tidak boleh mengklaim terverifikasi.
  if (settings.dashboardWaliMuridConfig?.verifiedBadge === 'Akun Terverifikasi') {
    settings.dashboardWaliMuridConfig.verifiedBadge = 'Akun Aktif';
  }
  if (settings.cmsContent) {
    if (settings.cmsContent.kopStatusAkreditasi && settings.cmsContent.kopStatusAkreditasi.indexOf('111235150099') !== -1) {
      settings.cmsContent.kopStatusAkreditasi = 'TERAKREDITASI A • NSM: 111235150097 • NPSN: 60717039';
    }
    if (settings.cmsContent.cetakNamaPenandatangan && settings.cmsContent.cetakNamaPenandatangan.indexOf('Ahmad Zainuddin') !== -1) {
      settings.cmsContent.cetakNamaPenandatangan = 'Astutik, S.Pd';
      settings.cmsContent.cetakNipPenandatangan = '';
    }
  }
  return settings;
}

export function saveSchoolSettings(settings: SchoolSettings, user: string = 'Admin'): void {
  if (!isBrowser()) return;
  // Clean up sessionStorage offload if settings field is intentionally removed
  if (!settings.brosurDigitalUrl) {
    try {
      sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.BROSUR);
    } catch {}
  }
  if (!settings.logoMadrasahUrl) {
    try {
      sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.LOGO);
    } catch {}
  }
  const serialized = JSON.stringify(settings);
  const currentUsage = getLocalStorageUsageBytes();
  // Approximate size threshold (4MB out of ~5MB browser quota)
  const MAX_SAFE_QUOTA_BYTES = 4 * 1024 * 1024;
  // Accurately calculate net new usage by subtracting the previous size of SETTINGS
  const oldVal = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const oldLength = oldVal ? (STORAGE_KEYS.SETTINGS.length + oldVal.length) * 2 : 0;
  const estimatedNewUsage = currentUsage - oldLength + (STORAGE_KEYS.SETTINGS.length + serialized.length) * 2;

  // Attempt 1: Standard direct save if quota looks safe
  if (estimatedNewUsage < MAX_SAFE_QUOTA_BYTES) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized);
      if (settings.brosurDigitalUrl) sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.BROSUR);
      if (settings.logoMadrasahUrl) sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.LOGO);
      markLocalSettingsUpdated();
      addAuditLog(user, 'admin', 'UPDATE_SETTINGS', 'Mengubah Pengaturan Sistem Madrasah');
      return;
    } catch (err) {
      console.warn('LocalStorage save initial attempt failed despite quota estimate:', err);
    }
  }

  // Attempt 2: Clean non-critical logs first (webhook logs & truncate audit logs)
  try {
    localStorage.removeItem(STORAGE_KEYS.WEBHOOK_LOGS);
    const existingAudit = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (existingAudit) {
      try {
        const logs = JSON.parse(existingAudit);
        if (Array.isArray(logs) && logs.length > 20) {
          localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(-20)));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      }
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized);
    if (settings.brosurDigitalUrl) sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.BROSUR);
    if (settings.logoMadrasahUrl) sessionStorage.removeItem(SESSION_OFFLOAD_KEYS.LOGO);
    markLocalSettingsUpdated();
      addAuditLog(user, 'admin', 'UPDATE_SETTINGS', 'Mengubah Pengaturan Sistem Madrasah');
    return;
  } catch (err2) {
    console.warn('LocalStorage log cleanup attempt failed. Offloading non-critical settings to sessionStorage...', err2);
  }

  // Attempt 3: Offload non-critical heavy settings (brosur & logo data URLs) to sessionStorage
  try {
    const settingsCopy: SchoolSettings = { ...settings };
    if (settingsCopy.brosurDigitalUrl && settingsCopy.brosurDigitalUrl.startsWith('data:')) {
      try {
        sessionStorage.setItem(SESSION_OFFLOAD_KEYS.BROSUR, settingsCopy.brosurDigitalUrl);
        settingsCopy.brosurDigitalUrl = '';
      } catch (sErr) {
        console.warn('SessionStorage save for brosur failed:', sErr);
      }
    }
    if (settingsCopy.logoMadrasahUrl && settingsCopy.logoMadrasahUrl.startsWith('data:')) {
      try {
        sessionStorage.setItem(SESSION_OFFLOAD_KEYS.LOGO, settingsCopy.logoMadrasahUrl);
        settingsCopy.logoMadrasahUrl = '';
      } catch (sErr) {
        console.warn('SessionStorage save for logo failed:', sErr);
      }
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsCopy));
    markLocalSettingsUpdated();
    addAuditLog(user, 'admin', 'UPDATE_SETTINGS', 'Mengubah Pengaturan Sistem Madrasah (dengan offload ke SessionStorage)');
  } catch (err3) {
    console.error('Critical LocalStorage QuotaExceededError:', err3);
    alert(
      'Kapasitas penyimpanan lokal browser (LocalStorage) penuh.\n\nDisarankan:\n1. Gunakan URL/Link online atau Google Drive untuk File Brosur/Logo.\n2. Hapus data pendaftaran lama jika tidak diperlukan.'
    );
  }
}

export function getTokens(): Token[] {
  if (!isBrowser()) return DEFAULT_TOKENS;
  const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEFAULT_TOKENS));
    return DEFAULT_TOKENS;
  }
  return JSON.parse(data);
}

export function saveTokens(tokens: Token[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
}

export function generateNewTokens(
  count: number,
  buyerName: string = '',
  academicYear: string,
  wave: string,
  user: string = 'Operator'
): Token[] {
  const current = getTokens();
  const ta2 = academicYear.slice(2, 4); // "27"
  const newTokens: Token[] = [];
  for (let i = 0; i < count; i++) {
    const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `IU${ta2}-${rand1}-${rand2}`;
    newTokens.push({
      id: `tok-${Date.now()}-${i}`,
      code,
      status: 'belum_digunakan',
      createdAt: new Date().toISOString(),
      buyerName: buyerName || `Calon Wali Murid #${current.length + i + 1}`,
      academicYear,
      wave,
    });
  }
  const updated = [...newTokens, ...current];
  saveTokens(updated);
  addAuditLog(
    user,
    'admin',
    'GENERATE_TOKENS',
    `Menerbitkan ${count} token baru (${academicYear} - ${wave})`
  );
  return newTokens;
}

export function registerOnlineApplicant(data: {
  parentName: string;
  waNumber: string;
  email: string;
  studentName: string;
  regType: RegistrationType;
  academicYear: string;
  wave: string;
}): { token: Token; isNew: boolean } {
  const currentTokens = getTokens();
  const ta2 = (data.academicYear || '2027/2028').slice(2, 4) || '27';
  const cleanPhone = data.waNumber.replace(/\D/g, '');

  // Check if there is already an existing unused token with this phone and student name
  const existing = currentTokens.find(
    (t) =>
      t.status === 'belum_digunakan' &&
      t.buyerPhone &&
      t.buyerPhone.replace(/\D/g, '') === cleanPhone
  );

  if (existing) {
    return { token: existing, isNew: false };
  }

  const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `IU${ta2}-${rand1}-${rand2}`;

  const newToken: Token = {
    id: `tok-${Date.now()}`,
    code,
    status: 'belum_digunakan',
    createdAt: new Date().toISOString(),
    buyerName: `${data.parentName} (Ananda: ${data.studentName})`,
    buyerPhone: data.waNumber,
    buyerEmail: data.email,
    academicYear: data.academicYear,
    wave: data.wave,
  };

  saveTokens([newToken, ...currentTokens]);

  // Draft awal untuk pendaftar ini (jalur token lama — saat ini tidak
  // dipakai komponen mana pun). TANPA pre-seed (Paket C, M13): nama
  // orang tua TIDAK disalin ke Ayah, No WA TIDAK disalin ke ibu, dan
  // jenis kelamin TIDAK diberi default — semua diisi sendiri di wizard.
  // (Sisa default pendidikan/pekerjaan/penghasilan di bawah ini adalah
  // nilai lama jalur token yang belum dibersihkan; fungsi ini kode mati.)
  saveDraft({
    tokenCode: code,
    jenisPendaftaran: data.regType,
    student: {
      namaLengkap: data.studentName,
      namaPanggilan: data.studentName.split(' ')[0] || data.studentName,
      nik: '',
      noKk: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: '',
      anakKe: 1,
      jumlahSaudara: 1,
      asalSekolah: '',
    },
    parent: {
      ayah: {
        namaLengkap: '',
        tempatLahir: '',
        tanggalLahir: '',
        pendidikan: 'S1',
        pekerjaan: 'Wiraswasta',
        penghasilan: 'Rp3.000.000 - 5.000.000',
        noHp: data.waNumber,
      },
      ibu: {
        namaLengkap: '',
        tempatLahir: '',
        tanggalLahir: '',
        pendidikan: 'S1',
        pekerjaan: 'Ibu Rumah Tangga',
        penghasilan: 'Tidak Berpenghasilan',
        noHp: '',
      },
    },
  });

  addAuditLog(
    data.parentName,
    'public',
    'REGISTER_ACCOUNT',
    `Pendaftaran akun wali murid mandiri online: ${code} (${data.parentName} - ${data.studentName})`
  );

  return { token: newToken, isNew: true };
}

export function validateTokenCode(code: string): {
  valid: boolean;
  message?: string;
  token?: Token;
} {
  const cleanCode = code.trim().toUpperCase();
  const tokens = getTokens();
  const found = tokens.find((t) => t.code === cleanCode);
  if (!found) {
    return { valid: false, message: 'Token tidak ditemukan. Pastikan Anda memasukkan kode token dengan benar.' };
  }
  if (found.status === 'sudah_digunakan') {
    return { valid: false, message: 'Token ini sudah pernah digunakan untuk pendaftaran lain.' };
  }
  if (found.status === 'kadaluarsa') {
    return { valid: false, message: 'Token ini telah kadaluarsa. Silakan hubungi panitia SPMB.' };
  }
  return { valid: true, token: found };
}

export function markTokenUsed(tokenCode: string, registrationId: string): void {
  const tokens = getTokens();
  const updated = tokens.map((t) => {
    if (t.code === tokenCode.trim().toUpperCase()) {
      return {
        ...t,
        status: 'sudah_digunakan' as const,
        usedAt: new Date().toISOString(),
        usedByRegistrationId: registrationId,
      };
    }
    return t;
  });
  saveTokens(updated);
}

export function getRegistrations(): RegistrationRecord[] {
  if (!isBrowser()) return DEFAULT_REGISTRATIONS;
  const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
    return DEFAULT_REGISTRATIONS;
  }
  return JSON.parse(data);
}

export function saveRegistrations(regs: RegistrationRecord[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
  } catch (err) {
    // Kuota localStorage penuh (umumnya karena dokumen base64 besar):
    // lempar Error dengan pesan yang bisa ditampilkan ke pengguna, bukan
    // QuotaExceededError mentah tanpa pesan.
    throw new Error(
      'Gagal menyimpan data pendaftaran: penyimpanan lokal browser penuh. Hapus data pendaftaran lama atau perkecil ukuran dokumen, lalu coba lagi.'
    );
  }
}

export function checkDuplication(nik: string, noKk: string, nisn?: string, excludeRegId?: string): {
  isDuplicate: boolean;
  field?: 'nik' | 'noKk' | 'nisn';
  message?: string;
} {
  const regs = getRegistrations();
  for (const reg of regs) {
    // Kecualikan record yang sedang diedit: cocokkan id ATAU nomor
    // pendaftaran (id record server == nomor pendaftaran).
    if (excludeRegId && (reg.id === excludeRegId || reg.nomorPendaftaran === excludeRegId)) continue;
    if (reg.student.nik === nik.trim()) {
      return {
        isDuplicate: true,
        field: 'nik',
        message: 'NIK ini sudah pernah terdaftar. Jika ini data anak Anda, hubungi panitia SPMB.',
      };
    }
    // SENGAJA tidak mengecek No KK: kakak-beradik serumah memakai No KK yang sama.
    // Duplikat hanya dari NIK anak (dan NISN bila ada). Parameter noKk dipertahankan
    // supaya pemanggil lama tidak rusak, tapi nilainya diabaikan di sini.
    if (nisn && nisn.trim() !== '' && reg.student.nisn === nisn.trim()) {
      return {
        isDuplicate: true,
        field: 'nisn',
        message: 'NISN ini sudah pernah terdaftar. Jika ini data anak Anda, hubungi panitia SPMB.',
      };
    }
  }
  return { isDuplicate: false };
}

export function generateRegistrationNumber(academicYear: string): string {
  const regs = getRegistrations();
  const yearShort = academicYear.slice(0, 4); // "2027"
  const countThisYear = regs.filter((r) => r.academicYear === academicYear).length + 1;
  const paddedNo = String(countThisYear).padStart(4, '0');
  const settings = getSchoolSettings();
  let tmpl = settings.templateNomorPendaftaran || 'MIIU/SPMB/{TA}/{NO}';
  tmpl = tmpl.replace('{TA}', yearShort).replace('{NO}', paddedNo);
  return tmpl;
}

export function generateAccessPin(): string {
  // PIN kriptografis: crypto.getRandomValues, bukan Math.random.
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

export function normalizePhone(phone: string): string {
  // Normalisasi No HP ke format internasional tanpa '+': buang semua non-digit,
  // awalan '0' -> '62', awalan '62'/'+62' tetap '62'. Jadi '0812...' dan
  // '62812...' dianggap nomor yang sama saat daftar maupun login.
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

// Sapaan dashboard wali: pakai nama orang tua/wali yang nomor WA-nya
// cocok dengan WA yang dipakai login (pemegang akun), bukan selalu nama
// ayah. Bila tidak ada yang cocok, fallback ayah → ibu → wali.
// (Temuan tinjauan 13 Nov: dashboard menyapa nama ayah walau akun dibuat
// oleh ibu/wali.)
export function resolveParentName(record: RegistrationRecord, waInput?: string): string {
  const typed = normalizePhone(waInput || '');
  if (typed) {
    const candidates = [record.parent?.ayah, record.parent?.ibu, record.parent?.wali];
    for (const c of candidates) {
      if (c?.namaLengkap && normalizePhone(c.noHp || '') !== '' && normalizePhone(c.noHp || '') === typed) {
        return c.namaLengkap;
      }
    }
  }
  return (
    record.parent?.ayah?.namaLengkap ||
    record.parent?.ibu?.namaLengkap ||
    record.parent?.wali?.namaLengkap ||
    'Wali Murid'
  );
}

export function authenticateApplicant(identifier: string, secret: string): {
  success: boolean;
  message?: string;
  record?: RegistrationRecord;
} {
  // SATU pesan generik untuk "tidak ditemukan" maupun "PIN salah" — jangan
  // bocorkan keberadaan akun (K13 / audit: samakan pesan error login).
  const GENERIC_FAIL =
    'No WA/Nomor Pendaftaran atau PIN tidak cocok.';
  const cleanId = identifier.trim().toUpperCase();
  const cleanSecret = secret.trim();
  const regs = getRegistrations();

  // Login wali murid memakai No. HP orang tua (ayah/ibu) atau Nomor Pendaftaran.
  // NIK anak dan kode token TIDAK bisa dipakai sebagai identitas login.
  // Perbandingan No HP memakai normalizePhone supaya '0812...' == '62812...'.
  const cleanIdDigits = normalizePhone(identifier);
  // B17 (v2.9): JANGAN .find() pertama — bila ada duplikat WA lama di
  // localStorage, record pertama bisa punya PIN berbeda. Coba SEMUA record
  // yang cocok dengan identifier; sukses bila ada satu yang PIN-nya cocok.
  const matches = regs.filter((r) => {
    const ayahHp = normalizePhone(r.parent.ayah.noHp || '');
    const ibuHp = normalizePhone(r.parent.ibu.noHp || '');
    return (
      r.nomorPendaftaran.toUpperCase() === cleanId ||
      (cleanIdDigits.length >= 9 &&
        ((ayahHp !== '' && ayahHp === cleanIdDigits) ||
          (ibuHp !== '' && ibuHp === cleanIdDigits)))
    );
  });
  const found = matches.find((r) => !!r.pin && r.pin === cleanSecret);

  if (found) {
    // HANYA PIN 6 digit yang dibuat saat pendaftaran yang berlaku sebagai password.
    // Tidak ada PIN master / PIN cadangan — login wali selalu PIN record itu sendiri.
    if (!!found.pin && found.pin === cleanSecret) {
      const session: WaliMuridSession = {
        nomorPendaftaran: found.nomorPendaftaran,
        pin: found.pin ?? cleanSecret, // di titik ini found.pin === cleanSecret (sudah dicek di atas)
        studentName: found.student.namaLengkap,
        parentName: resolveParentName(found, identifier),
        waNumber: found.parent.ayah.noHp || found.parent.ibu.noHp || '',
        jenisKelamin: found.student.jenisKelamin,
        authToken: `WM-${found.id}-${Date.now()}`,
        loggedInAt: new Date().toISOString(),
      };
      setWaliMuridSession(session);
      return {
        success: true,
        record: found,
      };
    }
    return { success: false, message: GENERIC_FAIL };
  }
  // Ada record dengan identifier ini tapi tidak satu pun PIN-nya cocok —
  // gagal generik (jangan lanjut ke cek draft; sama seperti sebelumnya).
  if (matches.length > 0) {
    return { success: false, message: GENERIC_FAIL };
  }

  // Belum ada record yang tersubmit: cocokkan dengan DRAFT yang belum submit
  // (No WA + PIN draft). Draft yang cocok dikembalikan sebagai record
  // berstatus 'draft' supaya halaman bisa mengarahkannya ke wizard.
  const draft = getDraft();
  if (draft && draft.data && draft.data.pin && draft.data.pin === cleanSecret) {
    const draftWa = [
      draft.data.parent?.ayah?.noHp || '',
      draft.data.parent?.ibu?.noHp || '',
    ].map((p) => normalizePhone(p));
    const draftRegNo = (draft.data.nomorPendaftaran || '').toUpperCase();
    const isDraftMatch =
      (draftRegNo !== '' && draftRegNo === cleanId) ||
      (cleanIdDigits.length >= 9 && draftWa.some((p) => p !== '' && p === cleanIdDigits));
    if (isDraftMatch) {
      const settings = getSchoolSettings();
      const draftRecord: RegistrationRecord = {
        id: `draft-${draft.data.nomorPendaftaran || 'temp'}`,
        nomorPendaftaran: draft.data.nomorPendaftaran || '',
        tokenCode: draft.data.tokenCode || draft.data.pin || '',
        jenisPendaftaran: draft.data.jenisPendaftaran || 'baru',
        status: 'draft',
        createdAt: draft.savedAt || new Date().toISOString(),
        updatedAt: draft.savedAt || new Date().toISOString(),
        academicYear: settings.activeAcademicYear,
        wave: settings.activeWave,
        student: {
          namaLengkap: '',
          namaPanggilan: '',
          nik: '',
          noKk: '',
          tempatLahir: '',
          tanggalLahir: '',
          jenisKelamin: 'L',
          anakKe: 1,
          jumlahSaudara: 1,
          asalSekolah: '',
          ...(draft.data.student || {}),
        },
        parent: {
          ayah: {
            namaLengkap: '',
            tempatLahir: '',
            tanggalLahir: '',
            pendidikan: '',
            pekerjaan: '',
            penghasilan: '',
            ...(draft.data.parent?.ayah || {}),
          },
          ibu: {
            namaLengkap: '',
            tempatLahir: '',
            tanggalLahir: '',
            pendidikan: '',
            pekerjaan: '',
            penghasilan: '',
            ...(draft.data.parent?.ibu || {}),
          },
          ...(draft.data.parent?.wali ? { wali: draft.data.parent.wali } : {}),
          ...(draft.data.parent?.email ? { email: draft.data.parent.email } : {}),
        },
        address: {
          provinsi: '',
          kabupaten: '',
          kecamatan: '',
          kelurahan: '',
          alamatLengkap: '',
          kodePos: '',
          ...(draft.data.address || {}),
        },
        documents: draft.data.documents || {},
        pin: draft.data.pin,
        ...(draft.data.noWaPendaftaran ? { noWaPendaftaran: draft.data.noWaPendaftaran } : {}),
        ...(draft.data.modePendaftaran ? { modePendaftaran: draft.data.modePendaftaran } : {}),
        ...(draft.data.inden ? { inden: draft.data.inden } : {}),
      };
      const session: WaliMuridSession = {
        nomorPendaftaran: draftRecord.nomorPendaftaran,
        pin: draftRecord.pin || cleanSecret,
        studentName: draftRecord.student.namaLengkap,
        parentName: resolveParentName(draftRecord, identifier),
        waNumber: draftRecord.parent.ayah.noHp || draftRecord.parent.ibu.noHp || '',
        jenisKelamin: draftRecord.student.jenisKelamin,
        authToken: `WM-DRAFT-${Date.now()}`,
        loggedInAt: new Date().toISOString(),
      };
      setWaliMuridSession(session);
      return { success: true, record: draftRecord };
    }
  }

  return {
    success: false,
    message: GENERIC_FAIL,
  };
}

export function createRegistration(data: Omit<RegistrationRecord, 'id' | 'nomorPendaftaran' | 'createdAt' | 'updatedAt'>): RegistrationRecord {
  const settings = getSchoolSettings();
  // Periksa total ukuran dokumen SEBELUM menyimpan apa pun — gagal di sini
  // dengan pesan jelas, bukan di tengah saveRegistrations tanpa pesan.
  const docBytes = getDocumentsTotalBytes(data.documents || {});
  if (docBytes > MAX_TOTAL_DOCUMENT_BYTES) {
    throw new Error(
      `Total ukuran dokumen ${(docBytes / 1024 / 1024).toFixed(1)} MB melebihi batas 8 MB. Perkecil ukuran file (foto/scan) lalu coba kirim lagi — data belum disimpan.`
    );
  }
  const nomorPendaftaran = generateRegistrationNumber(data.academicYear || settings.activeAcademicYear);
  const now = new Date().toISOString();
  const pin = data.pin || generateAccessPin();
  const newRecord: RegistrationRecord = {
    ...data,
    id: `reg-${Date.now()}`,
    nomorPendaftaran,
    pin,
    createdAt: now,
    updatedAt: now,
  };
  const currentRegs = getRegistrations();
  try {
    saveRegistrations([newRecord, ...currentRegs]);
  } catch (err) {
    throw new Error(
      'Gagal menyimpan pendaftaran di perangkat ini karena penyimpanan lokal browser penuh. Hapus data pendaftaran lama atau perkecil ukuran dokumen, lalu coba kirim lagi.'
    );
  }
  // Mark token as used if token is present
  if (data.tokenCode) {
    markTokenUsed(data.tokenCode, newRecord.id);
  }
  // Clear draft
  clearDraft();
  addAuditLog(
    data.student.namaLengkap,
    'public',
    'CREATE_REGISTRATION',
    `Pendaftaran baru disubmit: ${nomorPendaftaran} (${data.student.namaLengkap})`
  );
  return newRecord;
}

export function updateRegistration(
  id: string,
  updater: (prev: RegistrationRecord) => RegistrationRecord,
  user: string = 'Admin',
  role: UserRole = 'admin'
): RegistrationRecord | null {
  const current = getRegistrations();
  let updatedRecord: RegistrationRecord | null = null;
  const nextRegs = current.map((r) => {
    if (r.id === id) {
      updatedRecord = updater(r);
      updatedRecord.updatedAt = new Date().toISOString();
      return updatedRecord;
    }
    return r;
  });
  if (updatedRecord !== null) {
    const rec: RegistrationRecord = updatedRecord;
    saveRegistrations(nextRegs);
    addAuditLog(user, role, 'UPDATE_REGISTRATION', `Memperbarui data pendaftaran ${rec.nomorPendaftaran}`);
  }
  return updatedRecord;
}

export function deleteRegistration(id: string, user: string = 'Operator'): boolean {
  if (!isBrowser()) return false;
  const current = getRegistrations();
  const target = current.find((r) => r.id === id);
  if (!target) return false;
  const nextRegs = current.filter((r) => r.id !== id);
  saveRegistrations(nextRegs);
  // Restore associated token if any
  if (target.tokenCode) {
    const tokens = getTokens();
    const updatedTokens = tokens.map((t) => {
      if (t.code === target.tokenCode.trim().toUpperCase()) {
        return {
          ...t,
          status: 'belum_digunakan' as const,
          usedAt: undefined,
          usedByRegistrationId: undefined,
        };
      }
      return t;
    });
    saveTokens(updatedTokens);
  }
  addAuditLog(
    user,
    'admin',
    'DELETE_REGISTRATION',
    `Menghapus data pendaftaran ${target.nomorPendaftaran} atas nama ${target.student.namaLengkap}`
  );
  return true;
}

export function deleteMultipleRegistrations(ids: string[], user: string = 'Operator'): number {
  if (!isBrowser() || !ids.length) return 0;
  const current = getRegistrations();
  const toDelete = current.filter((r) => ids.includes(r.id));
  if (!toDelete.length) return 0;
  const nextRegs = current.filter((r) => !ids.includes(r.id));
  saveRegistrations(nextRegs);
  // Restore associated tokens
  const deletedTokenCodes = toDelete.map((d) => d.tokenCode.trim().toUpperCase());
  if (deletedTokenCodes.length) {
    const tokens = getTokens();
    const updatedTokens = tokens.map((t) => {
      if (deletedTokenCodes.includes(t.code)) {
        return {
          ...t,
          status: 'belum_digunakan' as const,
          usedAt: undefined,
          usedByRegistrationId: undefined,
        };
      }
      return t;
    });
    saveTokens(updatedTokens);
  }
  addAuditLog(
    user,
    'admin',
    'BULK_DELETE_REGISTRATIONS',
    `Menghapus ${toDelete.length} data pendaftaran secara massal`
  );
  return toDelete.length;
}

export function deleteToken(id: string, user: string = 'Operator'): boolean {
  if (!isBrowser()) return false;
  const tokens = getTokens();
  const target = tokens.find((t) => t.id === id);
  if (!target) return false;
  const updated = tokens.filter((t) => t.id !== id);
  saveTokens(updated);
  addAuditLog(user, 'admin', 'DELETE_TOKEN', `Menghapus token ${target.code} (${target.buyerName || '-'})`);
  return true;
}

export function deleteMultipleTokens(ids: string[], user: string = 'Operator'): number {
  if (!isBrowser() || !ids.length) return 0;
  const tokens = getTokens();
  const target = tokens.filter((t) => ids.includes(t.id));
  if (!target.length) return 0;
  const updated = tokens.filter((t) => !ids.includes(t.id));
  saveTokens(updated);
  addAuditLog(user, 'admin', 'BULK_DELETE_TOKENS', `Menghapus ${target.length} token pendaftaran`);
  return target.length;
}

export function resetAllTestData(user: string = 'Admin'): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT);
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_LOGS);
  try {
    sessionStorage.clear();
  } catch {}
  addAuditLog(
    user,
    'admin',
    'RESET_TEST_DATA',
    'Pembersihan total data uji coba: Semua pendaftaran, token, draft, dan log transmisi direset bersih.'
  );
}

// Draft Management
export function saveDraft(draftData: Partial<RegistrationRecord>): void {
  if (!isBrowser()) return;
  localStorage.setItem(
    STORAGE_KEYS.CURRENT_DRAFT,
    JSON.stringify({
      data: draftData,
      savedAt: new Date().toISOString(),
    })
  );
}

export function getDraft(): { data: Partial<RegistrationRecord>; savedAt: string } | null {
  if (!isBrowser()) return null;
  const item = localStorage.getItem(STORAGE_KEYS.CURRENT_DRAFT);
  return item ? JSON.parse(item) : null;
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT);
}

// Wali Murid Session Management (Strict Authentication State)
export function getWaliMuridSession(): WaliMuridSession | null {
  if (!isBrowser()) return null;
  // (v2.11, L3) Sesi hanya dibaca dari sessionStorage — salinan
  // localStorage lama (bila ada) tidak lagi dipakai.
  const data = sessionStorage.getItem(STORAGE_KEYS.WALI_MURID_SESSION);
  if (!data) return null;
  try {
    const session = JSON.parse(data) as WaliMuridSession;
    if (!session || !session.nomorPendaftaran || !session.pin || !session.authToken) {
      return null;
    }
    // Sesi kedaluwarsa: lebih dari 24 jam sejak login.
    const loggedInAt = Date.parse(session.loggedInAt || '');
    if (!loggedInAt || Date.now() - loggedInAt > 24 * 60 * 60 * 1000) {
      clearWaliMuridSession();
      return null;
    }
    // Sesi hanya sah bila nomor pendaftarannya ada di data pendaftaran.
    const exists = getRegistrations().some(
      (r) => r.nomorPendaftaran === session.nomorPendaftaran
    );
    if (!exists) {
      clearWaliMuridSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setWaliMuridSession(session: WaliMuridSession): void {
  if (!isBrowser()) return;
  const serialized = JSON.stringify(session);
  // (v2.11, L3) Sesi (berisi PIN) HANYA di sessionStorage — tertutup saat
  // tab ditutup, tidak tertinggal di perangkat bersama. Hapus juga salinan
  // localStorage lama bila ada. JANGAN simpan sesi/PIN di cookie.
  sessionStorage.setItem(STORAGE_KEYS.WALI_MURID_SESSION, serialized);
  localStorage.removeItem(STORAGE_KEYS.WALI_MURID_SESSION);
}

export function clearWaliMuridSession(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(STORAGE_KEYS.WALI_MURID_SESSION);
  localStorage.removeItem(STORAGE_KEYS.WALI_MURID_SESSION);
}

// User Role Management (Demo Switcher)
// PERINGATAN KEAMANAN (Paket A, 2026-11-11): role di localStorage ini
// HANYA penanda tampilan — BUKAN bukti login dan TIDAK PERNAH boleh
// dipakai sebagai gerbang admin. Halaman /admin tidak lagi auto-login
// dari role; login admin wajib lewat verifyAdminPin ke server dan token
// sesi di sessionStorage (lihat get/setAdminSessionToken di bawah).
export function getCurrentRole(): UserRole {
  if (!isBrowser()) return 'public';
  return (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'public';
}

export function setCurrentRole(role: UserRole): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.ROLE, role);
}

// ============ SESI ADMIN SERVER-SIDE (Paket A, 2026-11-11) ============
// Token sesi admin dari verifyAdminPin HANYA di sessionStorage (hilang
// saat tab ditutup) — TIDAK PERNAH di localStorage, dan TIDAK PERNAH
// berisi PIN. Token diterbitkan server (CacheService, TTL 2 jam, terikat
// ADMIN_TOKEN_VERSION); ganti PIN admin menaikkan versi sehingga semua
// token lama langsung tidak berlaku.
export const ADMIN_TOKEN_ERROR_MESSAGE = 'Sesi admin berakhir / token tidak valid';

export function getAdminSessionToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  } catch {
    return null;
  }
}

export function setAdminSessionToken(token: string): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  } catch {}
}

export function clearAdminSessionToken(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  } catch {}
}

/** True bila error server menandakan token admin tidak ada / kedaluwarsa /
 *  versinya tidak cocok — pemanggil WAJIB membersihkan sesi + meminta
 *  login ulang, bukan diam-diam lanjut dengan data lokal. */
export function isAdminTokenError(error?: string | null): boolean {
  if (!error) return false;
  return error.includes('Sesi admin berakhir') || error.includes('token tidak valid');
}

/** Masking NIK: hanya 4 digit awal + 4 digit akhir yang tampil
 *  (format 16 digit: 3578********1234). Dipakai ekspor CSV admin. */
export function maskNik(value: string | undefined | null): string {
  const v = (value || '').replace(/\s/g, '');
  if (!v) return '-';
  if (v.length < 8) return `${v.slice(0, 2)}***`;
  return `${v.slice(0, 4)}${'*'.repeat(v.length - 8)}${v.slice(-4)}`;
}

// Audit Log Helpers
export function getAuditLogs(): AuditLog[] {
  if (!isBrowser()) return DEFAULT_AUDIT_LOGS;
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
    return DEFAULT_AUDIT_LOGS;
  }
  return JSON.parse(data);
}

export function addAuditLog(
  user: string,
  role: UserRole,
  action: string,
  details: string,
  oldData?: string,
  newData?: string
): void {
  if (!isBrowser()) return;
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user,
    role,
    action,
    details,
    oldData,
    newData,
    ipAddress: '127.0.0.1 (Cloud Preview)',
  };
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...logs.slice(0, 100)]));
}

// Backup & Restore
export function exportDatabaseJson(): string {
  const dump = {
    settings: getSchoolSettings(),
    tokens: getTokens(),
    registrations: getRegistrations(),
    academicYears: getAcademicYears(),
    waves: getWaves(),
    auditLogs: getAuditLogs(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(dump, null, 2);
}

export function importDatabaseJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.tokens) localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(data.tokens));
    if (data.registrations) localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(data.registrations));
    if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
    if (data.academicYears) localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(data.academicYears));
    if (data.waves) localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(data.waves));
    // Impor mengubah pengaturan lokal → naikkan stempel supaya tombol
    // migrasi ke server muncul (tanpa ini impor diam-diam tidak tersinkron).
    markLocalSettingsUpdated();
    addAuditLog('Admin', 'admin', 'RESTORE_DATABASE', 'Memulihkan cadangan database SPMB dari file JSON');
    return true;
  } catch (err) {
    console.error('Import Database Failed', err);
    return false;
  }
}

/** Impor JSON database + sinkronkan pengaturan hasil impor ke server
 *  (server-first seperti jalur simpan admin lain). Bila server gagal,
 *  impor TETAP tersimpan lokal tapi serverOk = false — pemanggil WAJIB
 *  menampilkan peringatan jujur bahwa impor hanya tersimpan di perangkat
 *  ini, bukan sukses palsu. */
export async function importDatabaseJsonToServer(
  jsonString: string
): Promise<{ ok: boolean; serverOk: boolean; error?: string }> {
  const ok = importDatabaseJson(jsonString);
  if (!ok) return { ok: false, serverOk: false, error: 'File JSON tidak valid.' };
  const res = await saveAllSettingsToServer(getSchoolSettings(), getWaves(), getAcademicYears());
  if (!res.ok) {
    return {
      ok: true,
      serverOk: false,
      error: res.error || 'Gagal terhubung ke server.',
    };
  }
  return { ok: true, serverOk: true };
}

// Academic Years Management
export function getAcademicYears(): AcademicYear[] {
  if (!isBrowser()) return DEFAULT_ACADEMIC_YEARS;
  const data = localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEARS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(DEFAULT_ACADEMIC_YEARS));
    return DEFAULT_ACADEMIC_YEARS;
  }
  return JSON.parse(data);
}

export function saveAcademicYears(years: AcademicYear[], user: string = 'Admin'): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(years));
  markLocalSettingsUpdated();
  addAuditLog(user, 'admin', 'UPDATE_ACADEMIC_YEARS', 'Memperbarui master Tahun Ajaran');
}

// Waves Management
export function getWaves(): Wave[] {
  if (!isBrowser()) return DEFAULT_WAVES;
  const data = localStorage.getItem(STORAGE_KEYS.WAVES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(DEFAULT_WAVES));
    return DEFAULT_WAVES;
  }
  const waves = JSON.parse(data) as Wave[];
  // Migrasi sekali jalan (model tanpa gelombang TA 2027/2028, 2026-11-11):
  // browser yang menyimpan gelombang lama ('Gelombang 1 (Early Bird)',
  // tutup 28 Feb 2027, tanpa field inden) ikut diperbarui — nama jadi
  // 'TA 2027/2028', tanggal selesai jadi 2027-06-30, plus default inden
  // Early Bird — tanpa menimpa pengaturan lain yang sudah diubah admin.
  // Stempel lokal diperbarui supaya tombol migrasi ke server muncul lagi.
  let migrated = false;
  const merged = waves.map((w) => {
    if (w.id !== 'w1') return w;
    const needsRename = w.nama === 'Gelombang 1 (Early Bird)';
    const needsInden = w.indenAktif === undefined;
    if (!needsRename && !needsInden) return w;
    migrated = true;
    const d = DEFAULT_WAVES[0];
    return {
      ...w,
      ...(needsRename ? { nama: d.nama, tanggalSelesai: d.tanggalSelesai } : {}),
      ...(needsInden
        ? {
            indenAktif: d.indenAktif,
            indenDp: d.indenDp,
            diskonJenis: d.diskonJenis,
            diskonNilai: d.diskonNilai,
            kuotaDiskon: d.kuotaDiskon,
            batasAkhirInden: d.batasAkhirInden,
            batasPelunasanHari: d.batasPelunasanHari,
            dpHangusJikaLewatBatas: d.dpHangusJikaLewatBatas,
          }
        : {}),
    };
  });
  if (migrated) {
    try {
      localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(merged));
    } catch {}
    markLocalSettingsUpdated();
  }
  return merged;
}

export function saveWaves(waves: Wave[], user: string = 'Admin'): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(waves));
  markLocalSettingsUpdated();
  addAuditLog(user, 'admin', 'UPDATE_WAVES', 'Memperbarui data Gelombang pendaftaran');
}

/** Penanda "pengaturan lokal terakhir diubah" (ms epoch, string) — dipakai
 *  tombol migrasi untuk membandingkan lokal vs server. */
export function getLocalSettingsUpdatedAt(): number {
  if (!isBrowser()) return 0;
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function markLocalSettingsUpdated(atMs: number = Date.now()): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_UPDATED_AT, String(atMs));
  } catch {}
}

/** Apakah perangkat ini menyimpan pengaturan lokal (mis. dari sebelum v2.7,
 *  yang belum punya stempel updatedAt)? Dipakai tombol migrasi: tanpa ini,
 *  perangkat yang pengaturannya disimpan sebelum v2.7 tidak pernah
 *  menampilkan tombol karena getLocalSettingsUpdatedAt() = 0. */
export function hasStoredLocalSettings(): boolean {
  if (!isBrowser()) return false;
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.SETTINGS) !== null ||
      localStorage.getItem(STORAGE_KEYS.WAVES) !== null ||
      localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEARS) !== null
    );
  } catch {
    return false;
  }
}

/** Format angka menjadi "Rp158.000" (tanpa desimal). */
export function formatRupiah(value: number): string {
  return `Rp${(Number(value) || 0).toLocaleString('id-ID')}`;
}

/** Gelombang aktif: cocokkan settings.activeWave (nama), fallback gelombang
 *  bertanda isAktif, fallback gelombang pertama. */
export function getActiveWave(waves: Wave[], settings: SchoolSettings): Wave | undefined {
  if (!waves.length) return undefined;
  return (
    waves.find((w) => w.nama === settings.activeWave) ||
    waves.find((w) => w.isAktif) ||
    waves[0]
  );
}

export interface HargaGelombang {
  hargaNormal: number;
  diskon: number;
  hargaAkhir: number;
  diskonTersedia: boolean;
  /** true bila sisa kuota diskon tidak diketahui (server tak terjangkau):
   *  diskon TIDAK boleh dijanjikan — tampilkan harga normal + keterangan. */
  diskonTidakPasti?: boolean;
}

/** Harga gelombang dengan diskon inden: diskon hanya bila wave.indenAktif
 *  dan diskonNilai > 0 dan (tanpa kuota atau sisaKuotaDiskon > 0).
 *  'persen' = round(hargaNormal * nilai / 100). Bila sisa kuota tidak
 *  diketahui (undefined — server tak terjangkau), diskon TIDAK dijanjikan:
 *  harga normal + diskonTidakPasti = true, supaya pemanggil menampilkan
 *  keterangan "kuota diskon belum dapat dipastikan — hubungi panitia"
 *  dan bukan "kuota diskon habis" maupun harga diskon. */
export function hitungHargaGelombang(
  wave: Wave | undefined,
  sisaKuotaDiskon?: number
): HargaGelombang {
  const hargaNormal = wave?.biayaPendaftaran ?? 183000;
  if (sisaKuotaDiskon === undefined) {
    return { hargaNormal, diskon: 0, hargaAkhir: hargaNormal, diskonTersedia: false, diskonTidakPasti: true };
  }
  const kuotaHabis =
    typeof sisaKuotaDiskon === 'number' && sisaKuotaDiskon <= 0;
  const diskonTersedia = Boolean(
    wave?.indenAktif && (wave?.diskonNilai ?? 0) > 0 && !kuotaHabis
  );
  let diskon = 0;
  if (diskonTersedia && wave) {
    diskon =
      wave.diskonJenis === 'persen'
        ? Math.round((hargaNormal * (wave.diskonNilai || 0)) / 100)
        : wave.diskonNilai || 0;
    diskon = Math.min(diskon, hargaNormal);
  }
  return { hargaNormal, diskon, hargaAkhir: hargaNormal - diskon, diskonTersedia };
}

/** Batas pelunasan inden: tanggalInden (ISO atau YYYY-MM-DD) + hari kalender
 *  → 'YYYY-MM-DD' (waktu lokal). */
export function hitungBatasPelunasan(tanggalIndenISO: string, hari: number): string {
  const base = new Date(tanggalIndenISO.length === 10 ? `${tanggalIndenISO}T00:00:00` : tanggalIndenISO);
  if (Number.isNaN(base.getTime())) return '';
  base.setDate(base.getDate() + (Number(hari) || 0));
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Sisa hari sampai tanggal YYYY-MM-DD (negatif bila sudah lewat). */
export function hitungSisaHari(tanggal: string): number {
  if (!tanggal) return 0;
  const target = new Date(`${tanggal}T23:59:59`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Webhook / Google Apps Script Logs Management
export const DEFAULT_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'wh-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'Inisialisasi Integrasi Webhook',
    status: 'SUCCESS',
    responseCode: '200 OK',
    message: 'Sistem Webhook Google Apps Script diaktifkan untuk SPMB',
    details: 'Status siap menerima kiriman data dari form pendaftaran & verifikasi.',
    targetUrl: 'Google Apps Script Web App',
  },
];

export function getWebhookLogs(): WebhookLog[] {
  if (!isBrowser()) return DEFAULT_WEBHOOK_LOGS;
  const data = localStorage.getItem(STORAGE_KEYS.WEBHOOK_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify(DEFAULT_WEBHOOK_LOGS));
    return DEFAULT_WEBHOOK_LOGS;
  }
  return JSON.parse(data);
}

export function addWebhookLog(log: Omit<WebhookLog, 'id' | 'timestamp'>): WebhookLog {
  const logs = getWebhookLogs();
  const newLog: WebhookLog = {
    ...log,
    id: `wh-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify([newLog, ...logs.slice(0, 99)]));
  }
  return newLog;
}

export function clearWebhookLogs(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_LOGS);
}

// Timeout kirim ke Google Apps Script (M-B5): jangan menggantung selamanya.
export const SYNC_TIMEOUT_MS = 30000;

export type SyncFailureKind = 'server' | 'network';

export interface SyncResult {
  success: boolean;
  message: string;
  nomorPendaftaran?: string;
  /** 'server' = server menolak / respons tidak valid; 'network' = gagal terhubung / timeout. */
  kind?: SyncFailureKind;
  /** True bila server menolak token sesi admin — pemanggil admin WAJIB
   *  membersihkan sesi + meminta login ulang. */
  tokenExpired?: boolean;
}

// Function to send / sync registration record to Google Apps Script Webhook
export async function syncRegistrationToWebhook(
  registration: RegistrationRecord,
  settings?: SchoolSettings
): Promise<SyncResult> {
  const currentSettings = settings || getSchoolSettings();
  const webhookUrl = currentSettings.googleAppScriptUrl;

  if (!webhookUrl || !webhookUrl.trim()) {
    const errorMsg = 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.';
    addWebhookLog({
      action: `Sync Pendaftaran (${registration.nomorPendaftaran})`,
      status: 'FAILED',
      responseCode: 'NO_WEBHOOK_URL',
      message: errorMsg,
      details: `Pendaftaran ${registration.nomorPendaftaran} | Status: ${registration.status}`,
    });
    return { success: false, message: errorMsg, kind: 'server' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveRegistration',
        data: registration,
      }),
      signal: controller.signal,
    });

    const responseText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    // SUKSES hanya bila: HTTP ok + JSON valid + success === true + nomor
    // pendaftaran (string) dari server. Respons non-JSON (mis. halaman error
    // Google) atau success bukan true = GAGAL (K9). PIN tidak pernah ditulis
    // ke webhook log.
    if (res.ok && data && data.success === true && typeof data.nomorPendaftaran === 'string') {
      const msg = data?.message || `Data pendaftaran ${registration.nomorPendaftaran} berhasil dikirim ke Google Sheets`;
      // v2.9: log memakai pesan TETAP (nomor saja) — pesan server tidak
      // ditulis mentah ke log, supaya nama pendaftar tidak ikut tersimpan.
      addWebhookLog({
        action: `Sync Pendaftaran (${registration.nomorPendaftaran})`,
        status: 'SUCCESS',
        responseCode: `${res.status} OK`,
        message: `Data pendaftaran ${registration.nomorPendaftaran} berhasil dikirim ke Google Sheets`,
        details: `Pendaftaran ${registration.nomorPendaftaran} | Status: ${registration.status}`,
        targetUrl: webhookUrl,
      });
      return { success: true, message: msg, nomorPendaftaran: data?.nomorPendaftaran };
    } else {
      const errorMsg =
        (data && (data.error || data.message)) ||
        (data === null
          ? `Server mengembalikan respons yang bukan JSON (HTTP ${res.status}). Kemungkinan deployment Google Apps Script bermasalah — data TIDAK masuk ke Google Sheets.`
          : `Server menolak pendaftaran (HTTP ${res.status}). Data TIDAK masuk ke Google Sheets.`);
      addWebhookLog({
        action: `Sync Pendaftaran (${registration.nomorPendaftaran})`,
        status: 'FAILED',
        responseCode: `${res.status} ERROR`,
        message: errorMsg,
        details: `Pendaftaran ${registration.nomorPendaftaran} | Status: ${registration.status}`,
        targetUrl: webhookUrl,
      });
      return { success: false, message: errorMsg, kind: 'server' };
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    const errorMsg = isTimeout
      ? 'Koneksi ke server Google Sheets habis waktu (lebih dari 30 detik). Data belum terkirim — coba kirim ulang.'
      : 'Gagal terhubung ke server Google Sheets (masalah jaringan). Data belum terkirim — coba kirim ulang.';
    addWebhookLog({
      action: `Sync Pendaftaran (${registration.nomorPendaftaran})`,
      status: 'FAILED',
      responseCode: isTimeout ? 'TIMEOUT' : 'FETCH_ERROR',
      message: errorMsg,
      details: `Pendaftaran ${registration.nomorPendaftaran} | Status: ${registration.status}`,
      targetUrl: webhookUrl,
    });
    return { success: false, message: errorMsg, kind: 'network' };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============ ANTREAN KIRIM ULANG (M-F2) ============
// Record yang gagal sync disimpan di sini (localStorage) supaya bisa dicoba
// kirim ulang otomatis saat aplikasi dibuka, atau manual lewat tombol
// "Kirim Ulang ke Panitia". Isi antrean = record lengkap (termasuk dokumen)
// karena kirim ulang butuh payload yang sama.
export function getSyncQueue(): RegistrationRecord[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as RegistrationRecord[]) : [];
  } catch {
    return [];
  }
}

export function enqueueFailedSync(record: RegistrationRecord): void {
  if (!isBrowser()) return;
  try {
    const queue = getSyncQueue().filter((r) => r.id !== record.id);
    queue.unshift(record);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (err) {
    // Antrean gagal disimpan (umumnya kuota penuh karena dokumen base64):
    // jangan melempar — record tetap tersimpan di daftar pendaftaran lokal.
    console.warn('Gagal menyimpan antrean kirim ulang:', err);
  }
}

export function removeFromSyncQueue(id: string): void {
  if (!isBrowser()) return;
  try {
    const queue = getSyncQueue().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch {}
}

export function isInSyncQueue(id: string): boolean {
  return getSyncQueue().some((r) => r.id === id);
}

/** Coba kirim ulang semua record di antrean. Dipanggil otomatis saat aplikasi dibuka. */
export async function retryQueuedSyncs(
  settings?: SchoolSettings
): Promise<{ attempted: number; succeeded: number; failed: number }> {
  const queue = getSyncQueue();
  if (!queue.length) return { attempted: 0, succeeded: 0, failed: 0 };
  let succeeded = 0;
  let failed = 0;
  for (const queued of queue) {
    const result = await resyncRecord(queued, settings);
    if (result.success && result.nomorPendaftaran) {
      if (result.nomorPendaftaran !== queued.nomorPendaftaran) {
        try {
          updateRegistration(queued.id, (prev) => ({
            ...prev,
            nomorPendaftaran: result.nomorPendaftaran as string,
          }));
        } catch {}
      }
      removeFromSyncQueue(queued.id);
      succeeded++;
    } else {
      failed++;
    }
  }
  return { attempted: queue.length, succeeded, failed };
}

/** Kirim ulang SATU record dengan action yang benar menurut jenisnya:
 *  - inden + status 'draft' (baris belum ada di Sheets) → createInden;
 *  - inden + sudah tersubmit (baris sudah ada) → updateRegistration;
 *  - pendaftaran penuh → dicek dulu ke server: bila nomornya SUDAH ada
 *    di Sheets (edit record tersubmit / create yang responsnya hilang)
 *    → updateRegistration; bila belum ada → saveRegistration (create).
 *  Tanpa probe ini, kirim ulang edit selalu memakai create dan ditolak
 *  server sebagai duplikat NIK (temuan E2E 13 Nov 12:29).
 *  Dipakai retryQueuedSyncs dan tombol "Kirim Ulang" di halaman. */
export async function resyncRecord(
  record: RegistrationRecord,
  settings?: SchoolSettings
): Promise<SyncResult> {
  if (record.modePendaftaran === 'inden' && record.inden) {
    if (record.status === 'draft') {
      const res = await createIndenToWebhook(
        {
          academicYear: record.academicYear,
          wave: record.wave,
          pin: record.pin || '',
          studentNama: record.student?.namaLengkap || '',
          parentNama: record.parent?.ayah?.namaLengkap || record.parent?.ibu?.namaLengkap || '',
          parentNoHp: record.parent?.ayah?.noHp || record.parent?.ibu?.noHp || '',
          jumlahDp: record.inden.jumlahDp,
          diskonDiberikan: record.inden.diskonDiberikan,
          sisaBayar: record.inden.sisaBayar,
          batasPelunasan: record.inden.batasPelunasan,
        },
        settings
      );
      if (res.ok && res.data?.nomorPendaftaran) {
        return {
          success: true,
          message: `Inden ${res.data.nomorPendaftaran} berhasil dikirim ke Google Sheets`,
          nomorPendaftaran: res.data.nomorPendaftaran,
        };
      }
      return {
        success: false,
        message: res.error || 'Gagal mengirim inden ke Google Sheets.',
        kind: res.kind || 'server',
      };
    }
    return syncRegistrationUpdateToWebhook(record, settings);
  }
  // Pendaftaran penuh: baris sudah ada di Sheets bila nomor + PIN ini
  // dikenali server. Probe memakai getRegistration (PIN diverifikasi
  // server) — nomor sementara yang belum pernah terkonfirmasi tidak akan
  // cocok, jadi pendaftaran baru tetap memakai jalur create.
  if (record.nomorPendaftaran && record.pin) {
    try {
      const probe = await fetchServerRegistration({
        nomorPendaftaran: record.nomorPendaftaran,
        pin: record.pin,
      });
      if (probe.ok && probe.data) {
        return syncRegistrationUpdateToWebhook(record, settings);
      }
    } catch {
      // Probe gagal (jaringan): lanjut ke create di bawah — create pun
      // akan gagal jaringan dan record tetap di antrean.
    }
  }
  return syncRegistrationToWebhook(record, settings);
}

// Sync perubahan record yang sudah ada ke server (endpoint updateRegistration
// Code.gs v2.4 — M-F1; auth v2.9). Dipakai untuk perubahan admin; JANGAN dipakai untuk
// pendaftaran baru (pakai syncRegistrationToWebhook).
// opts.admin=true (jalur admin) -> token sesi admin dilampirkan; backend
// menolak bila token tidak valid. Tanpa opts.admin (jalur wali / kirim
// ulang) -> backend memverifikasi PIN record (record.pin) di Sheets.
export async function syncRegistrationUpdateToWebhook(
  registration: RegistrationRecord,
  settings?: SchoolSettings,
  opts?: { admin?: boolean }
): Promise<SyncResult> {
  const currentSettings = settings || getSchoolSettings();
  const webhookUrl = currentSettings.googleAppScriptUrl;
  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      success: false,
      message: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.',
      kind: 'server',
    };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = {
      action: 'updateRegistration',
      data: registration,
    };
    if (opts?.admin) {
      const token = getAdminSessionToken();
      if (!token) {
        return { success: false, message: ADMIN_TOKEN_ERROR_MESSAGE, kind: 'server', tokenExpired: true };
      }
      body.adminToken = token;
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true) {
      return {
        success: true,
        message: data.message || `Perubahan ${registration.nomorPendaftaran} berhasil dikirim ke Google Sheets`,
        nomorPendaftaran:
          typeof data.nomorPendaftaran === 'string' ? data.nomorPendaftaran : undefined,
      };
    }
    const errMsg =
      (data && (data.error || data.message)) ||
      `Server menolak perubahan (HTTP ${res.status}).`;
    if (isAdminTokenError(errMsg)) {
      clearAdminSessionToken();
      return { success: false, message: ADMIN_TOKEN_ERROR_MESSAGE, kind: 'server', tokenExpired: true };
    }
    return {
      success: false,
      message: errMsg,
      kind: 'server',
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      success: false,
      message: isTimeout
        ? 'Koneksi ke server Google Sheets habis waktu (lebih dari 30 detik). Perubahan belum terkirim.'
        : 'Gagal terhubung ke server Google Sheets (masalah jaringan). Perubahan belum terkirim.',
      kind: 'network',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// INDEN KURSI + DISKON GELOMBANG 1 (backend v2.6)
// ============================================================
// Pola yang sama seperti syncRegistrationToWebhook: POST text/plain,
// timeout 30 dtk, sukses hanya bila JSON valid + success === true.
// Hasil {ok, data?, error?} — pemanggil TIDAK boleh mengubah status lokal
// bila ok === false (kejujuran sync seperti v2.4).

export interface IndenSyncResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  kind?: SyncFailureKind;
  /** True bila server menolak token sesi admin (khusus aksi admin). */
  tokenExpired?: boolean;
}

async function postIndenAction<T>(
  action: string,
  payload: Record<string, unknown>,
  settings?: SchoolSettings,
  opts?: { admin?: boolean }
): Promise<IndenSyncResult<T>> {
  const currentSettings = settings || getSchoolSettings();
  const webhookUrl = currentSettings.googleAppScriptUrl;
  if (!webhookUrl || !webhookUrl.trim()) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.', kind: 'server' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    // Aksi admin (confirmDp/completeInden/extendInden/markIndenExpired)
    // WAJIB token sesi admin (v2.9); createInden tetap publik (tanpa token).
    const body: Record<string, unknown> = { action, data: payload };
    if (opts?.admin) {
      const token = getAdminSessionToken();
      if (!token) {
        return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, kind: 'server', tokenExpired: true };
      }
      body.adminToken = token;
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      // v2.9: amplop {action, data:{...payload}} — backend membaca
      // contents.data; tanpa pembungkus data, action inden menerima {}.
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true) {
      return { ok: true, data: data as T };
    }
    const errMsg =
      (data && (data.error || data.message)) ||
      (data === null
        ? `Server mengembalikan respons yang bukan JSON (HTTP ${res.status}).`
        : `Server menolak aksi ${action} (HTTP ${res.status}).`);
    if (isAdminTokenError(errMsg)) {
      clearAdminSessionToken();
      return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, kind: 'server', tokenExpired: true };
    }
    return {
      ok: false,
      error: errMsg,
      kind: 'server',
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server Google Sheets habis waktu (lebih dari 30 detik).'
        : 'Gagal terhubung ke server Google Sheets (masalah jaringan).',
      kind: 'network',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface CreateIndenParams {
  academicYear: string;
  wave: string;
  pin: string;
  studentNama: string;
  parentNama: string;
  parentNoHp: string;
  jumlahDp: number;
  diskonDiberikan: number;
  sisaBayar: number;
  batasPelunasan: string;
  kuotaDiskon?: number;
}

export interface CreateIndenResponse {
  success: boolean;
  nomorPendaftaran: string;
  diskonDiberikan: number;
  sisaBayar: number;
  batasPelunasan: string;
}

/** Buat baris inden di Sheets (kolom 107–111). */
export async function createIndenToWebhook(
  params: CreateIndenParams,
  settings?: SchoolSettings
): Promise<IndenSyncResult<CreateIndenResponse>> {
  return postIndenAction<CreateIndenResponse>(
    'createInden',
    {
      academicYear: params.academicYear,
      wave: params.wave,
      pin: params.pin,
      student: { namaLengkap: params.studentNama },
      parent: { namaWali: params.parentNama, noHp: params.parentNoHp },
      inden: {
        jumlahDp: params.jumlahDp,
        diskonDiberikan: params.diskonDiberikan,
        sisaBayar: params.sisaBayar,
        batasPelunasan: params.batasPelunasan,
        kuotaDiskon: params.kuotaDiskon,
      },
    },
    settings
  );
}

/** Admin mengonfirmasi DP inden sudah diterima (transfer manual). */
export async function confirmDpToWebhook(
  nomorPendaftaran: string,
  academicYear: string,
  jumlahDp: number,
  settings?: SchoolSettings
): Promise<IndenSyncResult<{ success: boolean; jumlahDp: number; sisaBayar: number }>> {
  return postIndenAction('confirmDp', { nomorPendaftaran, academicYear, jumlahDp }, settings, { admin: true });
}

/** Admin menandai inden lunas → status 'Terdaftar'. */
export async function completeIndenToWebhook(
  nomorPendaftaran: string,
  academicYear: string,
  settings?: SchoolSettings
): Promise<IndenSyncResult<{ success: boolean }>> {
  return postIndenAction('completeInden', { nomorPendaftaran, academicYear }, settings, { admin: true });
}

/** Admin memperpanjang batas pelunasan inden (tanggal baru YYYY-MM-DD). */
export async function extendIndenToWebhook(
  nomorPendaftaran: string,
  academicYear: string,
  batasPelunasan: string,
  settings?: SchoolSettings
): Promise<IndenSyncResult<{ success: boolean }>> {
  return postIndenAction('extendInden', { nomorPendaftaran, academicYear, batasPelunasan }, settings, { admin: true });
}

/** Admin menandai inden kedaluwarsa (DP hangus bila toggle aktif). */
export async function markIndenExpiredToWebhook(
  nomorPendaftaran: string,
  academicYear: string,
  settings?: SchoolSettings
): Promise<IndenSyncResult<{ success: boolean }>> {
  return postIndenAction('markIndenExpired', { nomorPendaftaran, academicYear }, settings, { admin: true });
}

/** Statistik publik (v2.6): total menghitung inden sebagai kursi terisi dan
 *  mengecualikan 'Inden Kedaluwarsa'. Kembalikan null bila fetch gagal —
 *  pemanggil menampilkan harga normal / '-' tanpa memblokir halaman. */
export async function fetchPublicStats(
  settings?: SchoolSettings,
  kuotaDiskon?: number
): Promise<PublicStats | null> {
  const currentSettings = settings || getSchoolSettings();
  const webhookUrl = currentSettings.googleAppScriptUrl;
  if (!webhookUrl || !webhookUrl.trim()) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getPublicStats',
        academicYear: currentSettings.activeAcademicYear,
        kuotaDiskon,
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (res.ok && data && data.success === true && typeof data.total === 'number') {
      return {
        total: data.total,
        diskonTerpakai: typeof data.diskonTerpakai === 'number' ? data.diskonTerpakai : 0,
        sisaKuotaDiskon:
          typeof data.sisaKuotaDiskon === 'number'
            ? data.sisaKuotaDiskon
            : typeof kuotaDiskon === 'number'
              ? Math.max(0, kuotaDiskon - (typeof data.diskonTerpakai === 'number' ? data.diskonTerpakai : 0))
              : 0,
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// SINKRONISASI PENGATURAN DENGAN SERVER (backend v2.7; auth v2.9)
// ============================================================
// Tab "Pengaturan" di Spreadsheet menyimpan JSON {settings, waves,
// academicYears} ter-chunk. saveSettings WAJIB token sesi admin (v2.9);
// getSettings tetap baca publik.
// PENTING: saveSettings HANYA dipanggil dari jalur admin — jangan pernah
// dari halaman publik/pengunjung.

export interface ServerSettingsPayload {
  settings: SchoolSettings;
  waves: Wave[];
  academicYears: AcademicYear[];
}

export type FetchServerSettingsResult =
  | { ok: true; data: ServerSettingsPayload | null; updatedAt?: string }
  | { ok: false; data?: undefined; updatedAt?: string; error: string };

/** Ambil pengaturan dari server. ok:false = fetch gagal (jaringan/timeout/
 *  respons bukan JSON); ok:true + data:null = server belum punya settings. */
export async function fetchServerSettings(
  webhookUrl?: string
): Promise<FetchServerSettingsResult> {
  const url = (webhookUrl || getSchoolSettings().googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getSettings' }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (!res.ok || !data || data.success !== true) {
      return {
        ok: false,
        error:
          (data && (data.error || data.message)) ||
          `Server menolak getSettings (HTTP ${res.status}).`,
      };
    }
    const payload = data.settings ?? null;
    if (!payload) return { ok: true, data: null, updatedAt: data.updatedAt };
    return { ok: true, data: payload as ServerSettingsPayload, updatedAt: data.updatedAt };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik).'
        : 'Gagal terhubung ke server (masalah jaringan).',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// SATU RECORD PENDAFTAR DARI SERVER — JALUR WALI (backend v2.8)
// ============================================================
// Action getRegistration: HANYA dipanggil dari jalur login wali
// (ApplicantAccessCard) dan pemuatan dashboard wali / Cek Status —
// jangan pernah dari halaman utama/publik. Login tetap butuh
// WA/nomor pendaftaran + PIN 6 digit; satu nomor WA = satu pendaftaran
// (aturan itu TIDAK berubah). Respons gagal server sengaja generik
// (tanpa rincian) supaya tidak membocorkan keberadaan akun.

export interface FetchServerRegistrationParams {
  nomorPendaftaran?: string;
  nomorWa?: string;
  pin: string;
}

export type FetchServerRegistrationResult =
  | { ok: true; data: RegistrationRecord }
  | { ok: false; error: string };

/** Ambil SATU record pendaftar dari Google Sheets via webhook.
 *  ok:false = fetch gagal / server menolak (pesan sengaja generik). */
export async function fetchServerRegistration(
  params: FetchServerRegistrationParams
): Promise<FetchServerRegistrationResult> {
  const currentSettings = getSchoolSettings();
  const url = (currentSettings.googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = { action: 'getRegistration', pin: params.pin };
    if (params.nomorPendaftaran) body.nomorPendaftaran = params.nomorPendaftaran;
    if (params.nomorWa) body.nomorWa = params.nomorWa;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    // Backend v2.8 mengembalikan record di field top-level `registration`
    // (bukan wrapper `data`) — konsisten dengan semua action lain
    // (getSettings -> data.settings, getPublicStats -> data.total).
    const registration = data && data.registration;
    if (
      !res.ok ||
      !data ||
      data.success !== true ||
      !registration ||
      typeof registration !== 'object' ||
      typeof registration.nomorPendaftaran !== 'string' ||
      registration.nomorPendaftaran.trim() === ''
    ) {
      return { ok: false, error: 'Data pendaftaran tidak ditemukan atau PIN tidak cocok.' };
    }
    // (v2.11, L5) Server tidak lagi mengembalikan PIN di respons — pasang
    // kembali PIN yang baru saja diketik (sudah terverifikasi server).
    (registration as RegistrationRecord).pin = params.pin;
    return { ok: true, data: registration as RegistrationRecord };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik).'
        : 'Gagal terhubung ke server (masalah jaringan).',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// AUTH ADMIN SERVER-SIDE (Paket A, 2026-11-11)
// ============================================================
// Login admin WAJIB lewat server (action verifyAdminPin, backend v2.9):
// PIN dicek terhadap Script Properties; bila cocok, server menerbitkan
// token sesi (TTL 2 jam) yang disimpan di sessionStorage — TIDAK PERNAH
// ada daftar PIN di bundle frontend dan TIDAK PERNAH ada auto-login dari
// role localStorage. Semua pemanggilan action admin melampirkan token;
// bila server menolak token, sesi dibersihkan + admin diminta login ulang.

export type VerifyAdminPinResult = { ok: true } | { ok: false; error: string };

/** Login admin via server. ok:true = token sesi sudah tersimpan di
 *  sessionStorage. Pesan gagal SENGAJA generik (tidak membedakan PIN
 *  salah / server tak terjangkau / dibatasi). */
export async function verifyAdminPin(pin: string): Promise<VerifyAdminPinResult> {
  const url = (getSchoolSettings().googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verifyAdminPin', pin }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true && typeof data.token === 'string' && data.token) {
      setAdminSessionToken(data.token);
      return { ok: true };
    }
    return { ok: false, error: 'PIN panitia salah. Silakan coba kembali.' };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik).'
        : 'Gagal terhubung ke server (masalah jaringan).',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export type ChangeAdminPinResult =
  | { ok: true }
  | { ok: false; error: string; tokenExpired?: boolean };

/** Ganti PIN admin (backend v2.9, action changeAdminPin). Wajib token
 *  sesi berlaku; PIN saat ini diverifikasi DI SERVER. Bila sukses, semua
 *  token lama langsung tidak berlaku — pemanggil WAJIB membersihkan sesi
 *  + meminta login ulang (token perangkat ini pun ikut gugur). */
export async function changeAdminPin(
  currentPin: string,
  newPin: string
): Promise<ChangeAdminPinResult> {
  const token = getAdminSessionToken();
  if (!token) {
    return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
  }
  const url = (getSchoolSettings().googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'changeAdminPin', adminToken: token, currentPin, newPin, confirmPin: newPin }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true) {
      return { ok: true };
    }
    const errMsg = (data && (data.error || data.message)) || `Server menolak changeAdminPin (HTTP ${res.status}).`;
    if (isAdminTokenError(errMsg)) {
      clearAdminSessionToken();
      return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
    }
    return { ok: false, error: errMsg };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik). PIN admin TIDAK berubah.'
        : 'Gagal terhubung ke server (masalah jaringan). PIN admin TIDAK berubah.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface ChangePinParams {
  nomorPendaftaran: string;
  oldPin?: string;
  /** Hanya diisi pemanggil jalur admin (reset oleh admin). Jalur wali
   *  TIDAK PERNAH mengisi ini — token admin TIDAK diambil otomatis dari
   *  sessionStorage di sini, supaya sesi admin yang kebetulan aktif di
   *  tab yang sama tidak membocorkan jalur admin ke wali. */
  adminToken?: string;
  newPin: string;
  academicYear?: string;
}

export type ChangePinResult =
  | { ok: true }
  | { ok: false; error: string; tokenExpired?: boolean };

/** Ganti PIN wali, tersinkron ke server (backend v2.9, action changePin).
 *  Jalur wali wajib oldPin cocok; jalur admin (adminToken diisi) boleh
 *  tanpa oldPin. ok:false = PIN TIDAK berubah — pemanggil jangan pernah
 *  mengklaim berhasil. */
export async function changePinToWebhook(
  params: ChangePinParams
): Promise<ChangePinResult> {
  const url = (getSchoolSettings().googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = {
      action: 'changePin',
      nomorPendaftaran: params.nomorPendaftaran,
      newPin: params.newPin,
    };
    if (params.oldPin) body.oldPin = params.oldPin;
    if (params.adminToken) body.adminToken = params.adminToken;
    if (params.academicYear) body.academicYear = params.academicYear;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true) {
      return { ok: true };
    }
    const errMsg = (data && (data.error || data.message)) || `Server menolak changePin (HTTP ${res.status}).`;
    if (isAdminTokenError(errMsg)) {
      clearAdminSessionToken();
      return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
    }
    return { ok: false, error: errMsg };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik). PIN TIDAK berubah.'
        : 'Gagal terhubung ke server (masalah jaringan). PIN TIDAK berubah.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// NORMALISASI NAMA GELOMBANG UNTUK TAMPILAN (bukan tulis ke Sheets)
// ============================================================
// Baris lama di Sheets masih menulis 'Gelombang 1 (Early Bird)'; model
// TA 2027/2028 menamai periode itu 'TA 2027/2028'. Normalisasi HANYA
// untuk tampilan (render/pemetaan ke state tampil) — tidak pernah
// menulis ulang baris di Sheets.
export function normalizeWaveName(wave?: string | null): string {
  const w = (wave || '').trim();
  if (w === 'Gelombang 1 (Early Bird)') return 'TA 2027/2028';
  return w;
}

/** Simpan record server sebagai cache lokal (upsert by id/nomorPendaftaran).
 *  Hanya cache tampilan — tidak menulis ke Sheets. Nama gelombang ikut
 *  ternormalisasi untuk tampilan. Kembalikan record yang disimpan. */
export function cacheServerRegistration(record: RegistrationRecord): RegistrationRecord {
  const displayRecord: RegistrationRecord = { ...record, wave: normalizeWaveName(record.wave) };
  try {
    const regs = getRegistrations();
    const idx = regs.findIndex(
      (r) =>
        r.id === displayRecord.id ||
        (displayRecord.nomorPendaftaran !== '' && r.nomorPendaftaran === displayRecord.nomorPendaftaran)
    );
    // (v2.11, L3) Salinan cache TIDAK menyimpan PIN — PIN hanya hidup di
    // sesi (sessionStorage) dan di record yang sedang dipakai. Update
    // memakai PIN dari sesi (app/page.tsx), bukan dari cache ini.
    const storedRecord: RegistrationRecord = { ...displayRecord, pin: '' };
    const next =
      idx >= 0 ? regs.map((r, i) => (i === idx ? storedRecord : r)) : [storedRecord, ...regs];
    saveRegistrations(next);
  } catch {
    // Kuota localStorage penuh: lanjut tanpa cache, record tetap dipakai.
  }
  return displayRecord;
}

/** Login wali server-first (v2.8): coba ambil record dari server dulu
 *  (PIN divalidasi server); bila ketemu, pakai record server + cache lokal.
 *  Bila server gagal/tidak terjangkau/tidak menemukan, fallback lokal
 *  HANYA untuk draft yang belum submit (K11, Paket C) — akun tersubmit
 *  tidak bisa login offline. Tandai serverUnreachable supaya UI bisa
 *  jujur bahwa data yang tampil mungkin belum terbaru. Pesan gagal login
 *  tetap generik. */
export async function authenticateApplicantWithServer(
  identifier: string,
  secret: string
): Promise<{
  success: boolean;
  message?: string;
  record?: RegistrationRecord;
  fromServer?: boolean;
  serverUnreachable?: boolean;
}> {
  const cleanSecret = secret.trim();
  const cleanId = identifier.trim();
  // Nomor pendaftaran selalu mengandung '/'; selain itu dianggap No. WA.
  const serverParams: FetchServerRegistrationParams = cleanId.includes('/')
    ? { nomorPendaftaran: cleanId, pin: cleanSecret }
    : { nomorWa: normalizePhone(cleanId), pin: cleanSecret };
  const server = await fetchServerRegistration(serverParams);
  if (server.ok) {
    const record = cacheServerRegistration(server.data);
    const session: WaliMuridSession = {
      nomorPendaftaran: record.nomorPendaftaran,
      pin: record.pin || cleanSecret,
      studentName: record.student.namaLengkap,
      parentName: resolveParentName(record, identifier),
      waNumber: record.parent.ayah.noHp || record.parent.ibu.noHp || '',
      jenisKelamin: record.student.jenisKelamin,
      authToken: `WM-${record.id}-${Date.now()}`,
      loggedInAt: new Date().toISOString(),
    };
    setWaliMuridSession(session);
    return { success: true, record, fromServer: true };
  }
  // K11 (Paket C): login OFFLINE tanpa cek server DITUTUP untuk akun yang
  // sudah tersubmit. Fallback lokal hanya berlaku untuk DRAFT yang belum
  // terkirim (status 'draft') — draft memang hanya ada di perangkat ini,
  // jadi tidak ada yang bisa diverifikasi server. Record tersubmit yang
  // hanya cocok secara lokal DITOLAK: server sudah ditanya (tidak ketemu
  // / tidak terjangkau) dan cache perangkat tidak boleh mengesahkan
  // login. Catatan: authenticateApplicant() di atas sudah sempat membuat
  // sesi lokal bila cocok — sesi itu dihapus di sini sebelum menolak.
  // Konsekuensi yang disadari: pendaftar yang kirimannya gagal sync
  // (jaringan) tidak bisa login offline sampai server terjangkau lagi;
  // ia tetap bisa memakai tombol "Kirim Ulang ke Panitia" dari dashboard
  // setelah login online.
  const local = authenticateApplicant(identifier, secret);
  if (local.success && local.record) {
    if (local.record.status === 'draft') {
      return { ...local, fromServer: false, serverUnreachable: true };
    }
    clearWaliMuridSession();
    return {
      success: false,
      message:
        'Server panitia tidak terjangkau — login akun yang sudah terdaftar membutuhkan koneksi untuk verifikasi PIN. Coba lagi saat online.',
      serverUnreachable: true,
    };
  }
  return local;
}

/** Simpan seluruh pengaturan ke server (hanya dari jalur admin).
 *  WAJIB token sesi admin (v2.9); tanpa token / token ditolak, server
 *  menolak dan tokenExpired=true supaya pemanggil meminta login ulang. */
export async function saveServerSettings(
  webhookUrl: string,
  payload: ServerSettingsPayload
): Promise<{ ok: boolean; updatedAt?: string; error?: string; tokenExpired?: boolean }> {
  const url = (webhookUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const token = getAdminSessionToken();
  if (!token) {
    return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      // v2.9: amplop {action, data:{settings, waves, academicYears}} —
      // backend membaca contents.data; tanpa pembungkus data, server
      // menerima {} dan menulis {} ke tab Pengaturan (C1).
      // v2.9: adminToken di luar data (top-level) untuk gerbang auth.
      body: JSON.stringify({ action: 'saveSettings', data: payload, adminToken: token }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.success === true) {
      return { ok: true, updatedAt: data.updatedAt };
    }
    const errMsg =
      (data && (data.error || data.message)) ||
      `Server menolak saveSettings (HTTP ${res.status}).`;
    if (isAdminTokenError(errMsg)) {
      clearAdminSessionToken();
      return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
    }
    return {
      ok: false,
      error: errMsg,
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik). Pengaturan belum tersimpan di server.'
        : 'Gagal terhubung ke server (masalah jaringan). Pengaturan belum tersimpan di server.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Helper server-first untuk semua jalur Simpan admin: kirim SELURUH payload
 *  (settings + waves + academicYears saat itu) ke server. Bila server gagal,
 *  kembalikan {ok:false} — pemanggil tetap menulis localStorage tapi WAJIB
 *  menampilkan peringatan, bukan sukses palsu. */
export async function saveAllSettingsToServer(
  settings: SchoolSettings,
  waves: Wave[],
  academicYears: AcademicYear[]
): Promise<{ ok: boolean; updatedAt?: string; error?: string; tokenExpired?: boolean }> {
  const url = (settings.googleAppScriptUrl || getSchoolSettings().googleAppScriptUrl || '').trim();
  const result = await saveServerSettings(url, { settings, waves, academicYears });
  if (result.ok && result.updatedAt) {
    markLocalSettingsUpdated(Date.parse(result.updatedAt) || Date.now());
    // Simpan sukses = lokal dan server sudah sama → konflik (bila ada) selesai.
    clearSettingsSyncConflict();
  }
  return result;
}

/** Konflik sinkronisasi pengaturan (M1): lokal lebih baru dari server
 *  (ada perubahan lokal yang belum terkirim) sementara salinan server
 *  juga ada. Jangan timpa diam-diam ke arah mana pun — admin memilih
 *  lewat banner di AdminDashboard (unggah lokal / pakai server). */
export interface SettingsSyncConflict {
  localUpdatedAtMs: number;
  serverUpdatedAtMs: number;
  /** true bila server tidak mengembalikan updatedAt — kebaruan server tak dapat dipastikan. */
  serverUpdatedAtUnknown: boolean;
}

let pendingSettingsSyncConflict: SettingsSyncConflict | null = null;
let pendingServerSettingsPayload: ServerSettingsPayload | null = null;

/** Konflik terakhir yang dicatat loadSettingsWithServerFallback (null = tidak ada). */
export function getSettingsSyncConflict(): SettingsSyncConflict | null {
  return pendingSettingsSyncConflict;
}

export function clearSettingsSyncConflict(): void {
  pendingSettingsSyncConflict = null;
  pendingServerSettingsPayload = null;
}

/** Admin memilih "pakai server": terapkan salinan server yang tertunda
 *  (yang sebelumnya ditahan karena konflik) ke localStorage dan samakan
 *  stempel lokal dengan stempel server. Kembalikan false bila tidak ada
 *  salinan server yang tertunda. */
export function applyPendingServerSettings(): boolean {
  if (!isBrowser() || !pendingServerSettingsPayload) return false;
  const payload = pendingServerSettingsPayload;
  try {
    let applied = false;
    if (payload.settings && typeof payload.settings === 'object' && Object.keys(payload.settings).length > 0) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(payload.settings));
      applied = true;
    }
    if (Array.isArray(payload.waves) && payload.waves.length > 0) {
      localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(payload.waves));
      applied = true;
    }
    if (Array.isArray(payload.academicYears) && payload.academicYears.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(payload.academicYears));
      applied = true;
    }
    if (!applied) return false;
    if (pendingSettingsSyncConflict && pendingSettingsSyncConflict.serverUpdatedAtMs > 0) {
      markLocalSettingsUpdated(pendingSettingsSyncConflict.serverUpdatedAtMs);
    } else {
      markLocalSettingsUpdated();
    }
    clearSettingsSyncConflict();
    return true;
  } catch {
    return false;
  }
}

// Cache janji muat-awal supaya loadSettingsWithServerFallback tidak
// double-fetch bila dipanggil dua kali saat mount (StrictMode).
let serverSettingsLoadPromise: Promise<FetchServerSettingsResult> | null = null;

/** Muat pengaturan saat aplikasi dibuka: (a) coba server; (b) bila ok dan ada
 *  data → pakai data server (merge di atas DEFAULT_* untuk key yang hilang),
 *  tulis ke localStorage sebagai cache + simpan updatedAt server; (c) bila
 *  fetch gagal atau server kosong → pakai localStorage seperti sekarang
 *  (jangan blokir halaman, jangan tampilkan error ke pengunjung).
 *  DETEKSI KONFLIK (M1): salinan server HANYA diterapkan bila stempel server
 *  lebih baru dari stempel lokal (atau lokal belum pernah diubah). Bila lokal
 *  lebih baru (ada perubahan lokal yang belum terkirim) — atau kebaruan
 *  server tak dapat dipastikan (tanpa updatedAt) sementara lokal sudah
 *  diubah — salinan server DITAHAN (lokal tidak ditimpa), konflik dicatat
 *  lewat getSettingsSyncConflict() untuk dipilih admin (unggah lokal /
 *  pakai server), dan fungsi mengembalikan null. Server kosong/{} tetap
 *  tidak menyentuh lokal sama sekali.
 *  Kembalikan payload server bila dipakai, selain itu null. */
export async function loadSettingsWithServerFallback(): Promise<ServerSettingsPayload | null> {
  if (!isBrowser()) return null;
  if (!serverSettingsLoadPromise) {
    serverSettingsLoadPromise = fetchServerSettings();
  }
  let result: FetchServerSettingsResult;
  try {
    result = await serverSettingsLoadPromise;
  } catch {
    return null;
  }
  if (!result.ok || !result.data) return null;
  const payload = result.data;
  const hasContent =
    (payload.settings && typeof payload.settings === 'object' && Object.keys(payload.settings).length > 0) ||
    (Array.isArray(payload.waves) && payload.waves.length > 0) ||
    (Array.isArray(payload.academicYears) && payload.academicYears.length > 0);
  if (!hasContent) return null;
  // Bandingkan stempel SEBELUM menimpa lokal.
  const serverStamp = result.updatedAt ? Date.parse(result.updatedAt) || 0 : 0;
  const localStamp = getLocalSettingsUpdatedAt();
  if (localStamp > 0 && (serverStamp === 0 || localStamp > serverStamp)) {
    pendingSettingsSyncConflict = {
      localUpdatedAtMs: localStamp,
      serverUpdatedAtMs: serverStamp,
      serverUpdatedAtUnknown: serverStamp === 0,
    };
    pendingServerSettingsPayload = payload;
    return null;
  }
  clearSettingsSyncConflict();
  try {
    // Tulis mentah ke localStorage; getSchoolSettings()/getWaves()/
    // getAcademicYears() yang dipanggil sesudahnya akan mengisi default
    // untuk key yang hilang + menjalankan migrasi yang berlaku.
    // v2.9: stempel lokal HANYA disamakan dengan waktu server bila load
    // ini benar-benar menerapkan isi (settings/waves/academicYears yang
    // tidak kosong). Server yang mengembalikan {} (mis. sisa tulisan {}
    // dari bug amplop v2.7/v2.8) tidak menulis apa pun ke localStorage,
    // maka stempel lokal TIDAK boleh direset — kalau tidak, tombol
    // migrasi hilang padahal tidak ada yang tersinkron.
    let applied = false;
    if (payload.settings && typeof payload.settings === 'object' && Object.keys(payload.settings).length > 0) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(payload.settings));
      applied = true;
    }
    if (Array.isArray(payload.waves) && payload.waves.length > 0) {
      localStorage.setItem(STORAGE_KEYS.WAVES, JSON.stringify(payload.waves));
      applied = true;
    }
    if (Array.isArray(payload.academicYears) && payload.academicYears.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(payload.academicYears));
      applied = true;
    }
    if (applied && result.updatedAt) {
      markLocalSettingsUpdated(Date.parse(result.updatedAt) || Date.now());
    }
  } catch {
    return null;
  }
  return payload;
}

// ============================================================
// DAFTAR PENDAFTAR DARI SERVER (backend v2.8)
// ============================================================
// Action listRegistrations: HANYA dipanggil dari jalur admin
// (AdminDashboard) — jangan pernah dari halaman publik/wali.
// Pola yang sama seperti fetchServerSettings: POST text/plain,
// timeout 30 dtk, sukses hanya bila JSON valid + success === true
// + data berupa array RegistrationRecord. Bila gagal, pemanggil
// WAJIB tetap memakai daftar localStorage + menampilkan peringatan.

export type FetchServerRegistrationsResult =
  | { ok: true; data: RegistrationRecord[] }
  | { ok: false; error: string; tokenExpired?: boolean };

/** Muat daftar pendaftar master dari Google Sheets via webhook.
 *  ok:false = fetch gagal (jaringan/timeout/respons bukan JSON/
 *  server menolak) — pemanggil memakai localStorage sebagai fallback,
 *  KECUALI bila tokenExpired: sesi admin sudah dibersihkan dan pemanggil
 *  WAJIB meminta login ulang (jangan diam-diam lanjut dengan data lokal). */
export async function fetchServerRegistrations(
  tahunAjaran?: string,
  webhookUrl?: string
): Promise<FetchServerRegistrationsResult> {
  const currentSettings = getSchoolSettings();
  const url = (webhookUrl || currentSettings.googleAppScriptUrl || '').trim();
  if (!url) {
    return { ok: false, error: 'URL Webhook Google Apps Script belum diisi di Pengaturan Integrasi.' };
  }
  const token = getAdminSessionToken();
  if (!token) {
    return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'listRegistrations',
        tahunAjaran: tahunAjaran || currentSettings.activeAcademicYear,
        adminToken: token,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (!res.ok || !data || data.success !== true) {
      const errMsg =
        (data && (data.error || data.message)) ||
        (data === null
          ? `Server mengembalikan respons yang bukan JSON (HTTP ${res.status}).`
          : `Server menolak listRegistrations (HTTP ${res.status}).`);
      if (isAdminTokenError(errMsg)) {
        clearAdminSessionToken();
        return { ok: false, error: ADMIN_TOKEN_ERROR_MESSAGE, tokenExpired: true };
      }
      return {
        ok: false,
        error: errMsg,
      };
    }
    // Backend v2.8 mengembalikan daftar di field top-level `registrations`
    // (bukan wrapper `data`) — konsisten dengan semua action lain.
    const registrations = data && data.registrations;
    if (
      !Array.isArray(registrations) ||
      registrations.some(
        (r: any) =>
          !r ||
          typeof r !== 'object' ||
          typeof r.nomorPendaftaran !== 'string' ||
          r.nomorPendaftaran.trim() === ''
      )
    ) {
      return { ok: false, error: 'Server mengembalikan daftar pendaftaran yang tidak valid.' };
    }
    return { ok: true, data: registrations as RegistrationRecord[] };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout
        ? 'Koneksi ke server habis waktu (lebih dari 30 detik).'
        : 'Gagal terhubung ke server (masalah jaringan).',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
