export type RegistrationType = 'baru' | 'pindahan';
export type TokenStatus = 'belum_digunakan' | 'sudah_digunakan' | 'kadaluarsa';
export type ApplicationStatus = 'draft' | 'pending' | 'terverifikasi' | 'diterima' | 'cadangan' | 'ditolak';
export type UserRole = 'admin' | 'public';

export interface Token {
  id: string;
  code: string; // e.g. IU27-9XH4-QP8L
  status: TokenStatus;
  createdAt: string;
  usedAt?: string;
  usedByRegistrationId?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  notes?: string;
  academicYear: string;
  wave: string;
}

export interface StudentData {
  namaLengkap: string;
  namaPanggilan: string;
  nisn?: string;
  nik: string; // 16 digits
  noKk: string; // 16 digits
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P' | ''; // '' = belum dipilih (wajib dipilih eksplisit di Langkah 1)
  anakKe: number;
  jumlahSaudara: number;
  nomorKip?: string; // Opsional: Nomor Kartu Indonesia Pintar
  kebutuhanKhusus?: string; // '' atau 'Tidak Ada' = tidak ada; selain itu isi jenis/keterangan kebutuhan khusus
  kebutuhanDisabilitas?: string; // EMIS: daftar disabilitas dipisah koma (opsional)
  asalSekolah: string; // TK / RA / SD asal
  fotoUrl?: string;
  // Siswa Pindahan fields
  asalSekolahPindahan?: string;
  kelasTerakhirPindahan?: string;
  alasanPindah?: string;
  // --- Tambahan selaras EMIS 4.0 (area 5, 2026-11-10) ---
  kewarganegaraan?: 'WNI' | 'WNA'; // WAJIB (EMIS)
  agama?: string; // WAJIB (EMIS): Islam, Kristen Protestan, Katolik, Hindu, Buddha, Kong hu cu
  hobi?: string; // EMIS: Olahraga, Kesenian, Membaca, Menulis, Jalan-jalan, Lainnya
  citaCita?: string; // EMIS: PNS, TNI/Polri, Guru/Dosen, Dokter, Politikus, Wiraswasta, Seniman/Artis, Ilmuwan, Agamawan, Lainnya
  yangMembiayaiSekolah?: string; // WAJIB (EMIS): Orang Tua, Wali/Orang Tua Asuh, Tanggungan Sendiri, Lainnya
  praSekolahTkRa?: boolean; // EMIS PRA SEKOLAH: Pernah TK/RA
  praSekolahPaud?: boolean; // EMIS PRA SEKOLAH: Pernah PAUD
  imunisasiHepatitisB?: boolean;
  imunisasiPolio?: boolean;
  imunisasiBcg?: boolean;
  imunisasiCampak?: boolean;
  imunisasiDpt?: boolean;
  imunisasiCovid?: boolean;
  emailSiswa?: string; // EMIS: ALAMAT EMAIL SISWA (valid bila diisi)
  nisLokal?: string; // EMIS: NIS Lokal
  nomorKks?: string; // EMIS: NOMOR KKS
  nomorPkh?: string; // EMIS: NOMOR PKH
}

export type ParentLifeStatus = 'Masih Hidup' | 'Sudah Meninggal' | 'Tidak Diketahui';

export interface ParentDetail {
  nik?: string; // 16 digits NIK
  namaLengkap: string;
  status?: ParentLifeStatus;
  tempatLahir: string;
  tanggalLahir: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilan: string;
  noHp?: string;
  kewarganegaraan?: 'WNI' | 'WNA'; // EMIS: KEWARGANEGARAAN per orang tua/wali
}

export type StatusWaliEmis = 'Sama dengan ayah kandung' | 'Sama dengan ibu kandung' | 'Lainnya';

export interface ParentData {
  ayah: ParentDetail;
  ibu: ParentDetail;
  wali?: ParentDetail & { hasWali: boolean; hubungan?: string };
  email?: string; // Email orang tua/wali (opsional) — dikumpulkan di kartu akses awal
  statusWali?: StatusWaliEmis; // EMIS: dropdown WALI
  penghasilanGabungan?: string; // EMIS: Total Gabungan Penghasilan Orang Tua/Wali
}

export interface AddressData {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  rt?: string;
  rw?: string;
  alamatLengkap: string;
  kodePos: string;
  rtRw?: string;
  // --- Tambahan selaras EMIS 4.0 (area 5, 2026-11-10) ---
  statusKepemilikanRumah?: string; // EMIS: Milik Sendiri, Rumah Orang Tua, Rumah Saudara/kerabat, Rumah Dinas, Sewa/kontrak, Lainnya
  statusTempatTinggal?: string; // EMIS STATUS TEMPAT TINGGAL siswa
  jarakKeMadrasah?: string; // EMIS: Kurang dari 5 km, 5–10 Km, 11–20 Km, 21–30 Km, Lebih dari 30 Km
  transportasiKeSekolah?: string; // EMIS TRANSPORTASI KE SEKOLAH
  waktuTempuh?: string; // EMIS: 1-10 menit, 10-19 menit, 20-29 menit, 30-39 menit, 1-2 jam, > 2 jam
  koordinatAlamat?: string; // EMIS: KOORDINAT ALAMAT (teks bebas)
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string; // Data URL or storage link
  uploadedAt: string;
}

export interface DocumentsData {
  kk?: UploadedFile; // Wajib
  akta?: UploadedFile; // Wajib
  nisnDoc?: UploadedFile; // Opsional
  memilikiIjazahTk?: boolean; // Status kepemilikan ijazah TK
  ijazahTk?: UploadedFile; // Wajib jika memilikiIjazahTk = true
  foto?: UploadedFile; // Pas foto
  ijazahAtauSuratPindah?: UploadedFile;
  rapor?: UploadedFile;
  kks?: UploadedFile; // EMIS: Upload KKS (opsional, max 2MB)
  pkh?: UploadedFile; // EMIS: Upload PKH (opsional, max 2MB)
}

export interface VerificationChecklist {
  // Berkas Fisik Asli
  kkSesuai: boolean;
  aktaSesuai: boolean;
  nikSesuai: boolean;
  suratPindahSesuai?: boolean; // Khusus jalur Siswa Pindahan
  dokumenLengkap: boolean;
  // Observasi & Wawancara Tatap Muka
  observasiSantriSelesai?: boolean;
  hasilObservasi?: 'Sangat Siap' | 'Siap' | 'Perlu Pendampingan';
  catatanObservasi?: string;
  wawancaraSelesai: boolean;
  // Rincian Pembayaran Administrasi SPMB
  biayaFormulirLunas?: boolean;
  paketSeragamLunas?: boolean;
  paketBukuLunas?: boolean;
  bedAtributLunas?: boolean;
  bukuTabunganLunas?: boolean;
  bukuSppLunas?: boolean;
  bukuRaportLunas?: boolean;
  pembayaranLunas: boolean;
  nominalTerbayar?: number;
  catatanPembayaran?: string;
  // Status Akhir Verifikasi Fisik
  berkasDiterima: boolean;
  catatanOperator?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RegistrationRecord {
  id: string;
  nomorPendaftaran: string; // e.g. MIIU/SPMB/2027/0001
  tokenCode: string;
  jenisPendaftaran: RegistrationType; // 'baru' = Reguler, 'pindahan' = Siswa Pindahan
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  academicYear: string;
  wave: string;
  student: StudentData;
  parent: ParentData;
  address: AddressData;
  documents: DocumentsData;
  verification?: VerificationChecklist;
  // Pengumuman result
  hasilPengumuman?: 'LULUS' | 'CADANGAN' | 'TIDAK_LULUS' | 'PENDING';
  catatanPengumuman?: string;
  pin?: string; // 6-digit access PIN for applicant self-service login
  // No WA Pendaftaran (v2.12): nomor WA yang dipakai orang tua di kartu
  // akses saat memulai pendaftaran. Dipakai login Cek Status bila nomor itu
  // tidak ada di data ayah/ibu/wali (Langkah 2 boleh mengubah nomor-nomor
  // itu, jadi nomor akses harus tersimpan sendiri).
  noWaPendaftaran?: string;
  // --- Inden kursi + diskon Gelombang 1 (2026-11-11) ---
  // 'penuh' = daftar penuh seperti biasa; 'inden' = pesan kursi dengan DP.
  modePendaftaran?: 'penuh' | 'inden';
  inden?: {
    status: 'Inden' | 'Terdaftar' | 'Inden Kedaluwarsa';
    jumlahDp: number;
    dpLunas: boolean;
    diskonDiberikan: number;
    sisaBayar: number;
    batasPelunasan: string; // YYYY-MM-DD
    tanggalInden: string; // YYYY-MM-DD
  };
}

/** Hasil getPublicStats dari backend (v2.6): total sudah menghitung inden
 *  sebagai kursi terisi dan mengecualikan 'Inden Kedaluwarsa'. */
export interface PublicStats {
  total: number;
  diskonTerpakai: number;
  sisaKuotaDiskon: number;
}

export interface FeeCalculationEstimate {
  jalur: RegistrationType;
  gender: 'L' | 'P';
  ukuranSeragam: 'S' | 'M' | 'L' | 'XL' | 'Custom';
  includeKatering: boolean;
  includeAntarJemput: boolean;
  biayaFormulir: number;
  biayaSeragam: number;
  biayaBukuModul: number;
  biayaAtributTabungan: number;
  biayaKatering: number;
  biayaAntarJemput: number;
  totalEstimasi: number;
}

export interface AcademicYear {
  id: string;
  tahun: string; // e.g. "2027/2028"
  isAktif: boolean;
  kuotaTotal: number;
}

export interface Wave {
  id: string;
  nama: string; // e.g. "Gelombang 1", "Gelombang 2", "Prestasi"
  academicYear: string;
  isAktif: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
  biayaPendaftaran: number;
  // --- Inden kursi + diskon (hanya Gelombang 1 Early Bird yang aktif) ---
  indenAktif?: boolean;
  indenDp?: number; // DP inden (Rp), default 50000
  diskonJenis?: 'rp' | 'persen';
  diskonNilai?: number; // Rp bila 'rp', % bila 'persen'
  kuotaDiskon?: number; // jumlah kursi pertama yang mendapat diskon
  batasAkhirInden?: string; // YYYY-MM-DD; '' = ikut tanggalSelesai gelombang
  batasPelunasanHari?: number; // hari sejak inden dibuat, default 14
  dpHangusJikaLewatBatas?: boolean; // default true
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  oldData?: string;
  newData?: string;
  ipAddress?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  responseCode?: string;
  message: string;
  details?: string;
  targetUrl?: string;
}

export interface SectionVisibility {
  showCountdown?: boolean;
  showHero?: boolean;
  showTimeline?: boolean;
  showMengenalDekat?: boolean;
  showProgramMutu?: boolean;
  showSambutanKepala?: boolean;
  showDownloads?: boolean;
  showFaq?: boolean;
  showSekretariat?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface CmsContent {
  // 1. Beranda / Landing Page
  headerTagline?: string;
  footerTagline?: string;
  footerAbout?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  heroCountdownLabel?: string;
  mengenalJudul?: string;
  mengenalDeskripsi?: string;
  mengenalPoints?: string[];
  mengenalAkreditasiNilai?: string;
  mengenalRasioGuru?: string;
  programJudul?: string;
  programDeskripsi?: string;
  programCards?: ProgramCard[];
  sambutanJudul?: string;
  sambutanTeks?: string;
  sambutanAmanah?: string;
  sambutanFotoUrl?: string;
  timelineJudul?: string;
  timelineDeskripsi?: string;
  timelineSteps?: TimelineStep[];
  downloadsJudul?: string;
  downloadsDeskripsi?: string;
  // Item unduhan (judul + deskripsi per item; 3 item tetap — brosur,
  // formulir offline, panduan — aksinya ditentukan kode, bukan CMS).
  downloadsItems?: CmsDownloadItem[];
  // Deskripsi lokasi kampus di seksi Sekretariat (halaman depan).
  lokasiDeskripsi?: string;
  faqJudul?: string;
  faqDeskripsi?: string;
  faqItems?: FaqItem[];
  jamPelayanan?: string;
  galeriFotoUrl?: string[];
  testimoni?: Testimonial[];
  pengumumanBanner?: string;

  // 2. Formulir Pendaftaran (Wizard 4 Langkah & Review)
  step1Title?: string;
  step1Subtitle?: string;
  step1Notice?: string;
  step2Title?: string;
  step2Subtitle?: string;
  step2Notice?: string;
  step3Title?: string;
  step3Subtitle?: string;
  step3Notice?: string;
  step4Title?: string;
  step4Subtitle?: string;
  step4Notice?: string;
  reviewTitle?: string;
  reviewSubtitle?: string;
  paktaIntegritasTeks?: string;

  // 3. Halaman Sukses & Konfirmasi
  successTitle?: string;
  successSubtitle?: string;
  successNotice?: string;
  successStep1Title?: string;
  successStep1Desc?: string;
  successStep2Title?: string;
  successStep2Desc?: string;
  successStep3Title?: string;
  successStep3Desc?: string;
  successHelpText?: string;

  // 4. Dokumen Cetak KOP & Pengesahan
  kopInstansiAtas?: string;
  kopNamaMadrasah?: string;
  kopStatusAkreditasi?: string;
  kopAlamat?: string;
  cetakKotaTitimangsa?: string;
  cetakJabatanPenandatangan?: string;
  cetakNamaPenandatangan?: string;
  cetakNipPenandatangan?: string;
  cetakKetentuanObservasi?: string;
}

export interface FaqItem {
  id: string;
  category: 'alur' | 'biaya' | 'status' | 'dokumen';
  question: string;
  answer: string;
  points: string[];
}

export interface TimelineStep {
  id: string;
  badge: string;
  title: string;
  desc: string;
  details: string[];
}

export interface ProgramCard {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  tag: string;
  highlights: string[];
}

// Item unduhan yang bisa diedit admin (judul + deskripsi saja; aksi
// unduh per item — brosur / formulir offline / panduan — ditentukan
// kode LandingDownloads berdasarkan id yang tetap).
export interface CmsDownloadItem {
  id: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  nama: string;
  peran: string;
  kutipan: string;
}

export interface FeeItem {
  id: string;
  nama: string;
  biaya: number;
}

export interface RincianBiayaPendaftaran {
  judulDokumen?: string;
  subjudulDokumen?: string;
  introPesan?: string;
  judulAdministrasi?: string;
  itemsAdministrasi: FeeItem[];
  catatanAdministrasi?: string;
  judulPerempuan?: string;
  itemsPerempuan: FeeItem[];
  judulLakiLaki?: string;
  itemsLakiLaki: FeeItem[];
  judulRingkasan?: string;
  catatanRingkasan?: string;
  judulKetentuan?: string;
  ketentuanPembayaran: string[];
  judulBuku?: string;
  deskripsiBuku?: string;
  footerInfo?: string;
}

export interface DashboardWaliMuridConfig {
  portalBadge?: string;
  portalSubtitle?: string;
  verifiedBadge?: string;
  welcomeSubtitle?: string;
  highlightBadge?: string;
  highlightTitle?: string;
  highlightDeskripsi?: string;
  highlightBtnText?: string;
  card1Title?: string;
  card1Deskripsi?: string;
  card1BtnText?: string;
  card2TitleDraft?: string;
  card2TitleSubmitted?: string;
  card2Deskripsi?: string;
  card2BtnTextDraft?: string;
  card2BtnTextSubmitted?: string;
  card3Title?: string;
  card3Deskripsi?: string;
  card3BtnText?: string;
  card4Title?: string;
  card4Deskripsi?: string;
  card4BtnText?: string;
  helpdeskTitle?: string;
  helpdeskDeskripsi?: string;
  helpdeskBtnText?: string;
}

export interface SchoolSettings {
  namaMadrasah: string;
  logoMadrasahUrl?: string;
  brosurDigitalUrl?: string;
  instansiInduk?: string; // e.g. KEMENTERIAN AGAMA REPUBLIK INDONESIA
  nsm: string;
  npsn: string;
  alamatMadrasah: string;
  googleMapsUrl?: string; // Link "Bagikan" Google Maps / koordinat lat,lng — tombol peta; kosong = cari teks alamat
  kontakWhatsapp: string;
  emailMadrasah: string;
  namaKepalaMadrasah: string;
  nipKepalaMadrasah: string;
  activeAcademicYear: string;
  activeWave: string;
  biayaPendaftaran: number;
  kuotaTarget: number;
  templateNomorPendaftaran: string; // e.g. MIIU/SPMB/{TA}/{NO}
  driveFolderId: string;
  spreadsheetId: string;
  googleAppScriptUrl?: string;
  enableDigitalStamp: boolean;
  modeBatasWaktu?: 'gelombang' | 'tanggal_tetap';
  tanggalBatasPendaftaran?: string;
  sectionVisibility?: SectionVisibility;
  sectionVisibilityConfigured?: boolean;
  cmsContent?: CmsContent;
  rincianBiayaPendaftaran?: RincianBiayaPendaftaran;
  dashboardWaliMuridConfig?: DashboardWaliMuridConfig;
  pesanWaLulus?: string; // Template pesan WA ucapan LULUS (placeholder {namaSiswa} dst.); kosong = teks standar
}

export interface WaliMuridSession {
  nomorPendaftaran: string;
  pin: string;
  studentName: string;
  parentName: string;
  waNumber?: string;
  jenisKelamin?: 'L' | 'P' | '';
  authToken: string;
  loggedInAt: string;
}

