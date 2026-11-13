'use client';

import React, { useState } from 'react';
import {
  FileText,
  User,
  Printer,
  Search,
  LogOut,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  School,
  Sparkles,
  ArrowRight,
  BookOpen,
  KeyRound,
  Lock,
} from 'lucide-react';
import { RegistrationRecord, SchoolSettings, WaliMuridSession } from '@/lib/types';
import { DEFAULT_DASHBOARD_WALI_MURID, updateRegistration, setWaliMuridSession, changePinToWebhook, cacheServerRegistration } from '@/lib/storage';

interface WaliMuridDashboardProps {
  session: WaliMuridSession;
  record?: RegistrationRecord | null;
  settings: SchoolSettings;
  onOpenInformasiPendaftaran: () => void;
  onOpenWizard: () => void;
  onOpenStatusTracker: () => void;
  onPrintBukti: () => void;
  onLogout: () => void;
  /** Tampilkan tombol kirim ulang bila record masih di antrean sync (belum masuk Sheets). */
  showRetrySync?: boolean;
  onRetrySync?: () => void;
  isRetryingSync?: boolean;
  retryNotice?: string | null;
  /** Peringatan jujur: data yang tampil dari perangkat ini karena server tidak terjangkau. */
  dataStaleNotice?: string | null;
}

export const WaliMuridDashboard: React.FC<WaliMuridDashboardProps> = ({
  session,
  record,
  settings,
  onOpenInformasiPendaftaran,
  onOpenWizard,
  onOpenStatusTracker,
  onPrintBukti,
  onLogout,
  showRetrySync,
  onRetrySync,
  isRetryingSync,
  retryNotice,
  dataStaleNotice,
}) => {
  const cfg = settings.dashboardWaliMuridConfig || DEFAULT_DASHBOARD_WALI_MURID;

  // Ubah PIN — PIN yang tampil di chip identitas mengikuti state lokal ini
  // supaya langsung berubah setelah PIN diganti (tanpa menunggu refresh).
  const [currentPin, setCurrentPin] = useState(session.pin);
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  // PIN tampil mask secara default; tombol "Lihat" menampilkan sementara.
  const [showPin, setShowPin] = useState(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);
    if (!record) {
      setPinError('Data pendaftaran tidak ditemukan, PIN tidak dapat diubah.');
      return;
    }
    if (oldPin.trim() !== currentPin) {
      setPinError('PIN lama tidak cocok. Periksa kembali PIN Anda saat ini.');
      return;
    }
    if (!/^\d{6}$/.test(newPin.trim())) {
      setPinError('PIN baru harus 6 digit angka.');
      return;
    }
    if (newPin.trim() === currentPin) {
      setPinError('PIN baru tidak boleh sama dengan PIN lama.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinError('Konfirmasi PIN baru tidak sama dengan PIN baru.');
      return;
    }
    // Ganti PIN tersinkron ke server (Paket A, backend v2.10, action
    // changePin): PIN lama diverifikasi DI SERVER. Sukses hanya bila
    // server mengonfirmasi — jangan pernah klaim berhasil sebelum itu.
    const res = await changePinToWebhook({
      nomorPendaftaran: record.nomorPendaftaran,
      oldPin: oldPin.trim(),
      newPin: newPin.trim(),
      academicYear: record.academicYear,
    });
    if (!res.ok) {
      setPinError(res.error || 'Gagal mengubah PIN. Silakan coba lagi atau hubungi panitia SPMB.');
      return;
    }
    const updated = updateRegistration(record.id, (prev) => ({ ...prev, pin: newPin.trim(), tokenCode: newPin.trim() }));
    if (!updated) {
      // Record dari server yang belum ada di cache lokal: simpan sebagai cache.
      try {
        cacheServerRegistration({ ...record, pin: newPin.trim(), tokenCode: newPin.trim() });
      } catch {}
    }
    setWaliMuridSession({ ...session, pin: newPin.trim() });
    setCurrentPin(newPin.trim());
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setShowChangePin(false);
    setPinSuccess('PIN berhasil diubah dan tersimpan di server. Gunakan PIN baru untuk masuk berikutnya.');
  };

  // Calculate dynamic subtotal administrasi from settings
  const subtotalAdmin = (settings.rincianBiayaPendaftaran?.itemsAdministrasi || []).reduce(
    (acc, curr) => acc + (Number(curr.biaya) || 0),
    0
  ) || 183000;

  const cleanPhone = (settings.kontakWhatsapp || '').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB ${settings.namaMadrasah}, saya wali murid dari ananda ${session.studentName} (No. Registrasi: ${session.nomorPendaftaran}) ingin berkonsultasi mengenai pendaftaran.`
  )}`;

  // Determine completion / status
  const isFormSubmitted = record && record.status && record.status !== 'draft';
  const statusLabel = record?.status === 'terverifikasi'
    ? 'Terverifikasi'
    : record?.status === 'ditolak'
    ? 'Perlu Perbaikan'
    : record?.status === 'pending'
    ? 'Menunggu Verifikasi Berkas'
    : 'Dalam Pengisian Formulir';

  const statusColor = record?.status === 'terverifikasi'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : record?.status === 'ditolak'
    ? 'bg-rose-100 text-rose-800 border-rose-300'
    : record?.status === 'pending'
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-stone-100 text-stone-700 border-stone-300';

  // Process template string helper
  const formatTpl = (tpl?: string) => {
    if (!tpl) return '';
    return tpl
      .replace('{studentName}', session.studentName)
      .replace('{parentName}', session.parentName)
      .replace('{TA}', settings.activeAcademicYear)
      .replace('{namaMadrasah}', settings.namaMadrasah)
      .replace('{kontakWhatsapp}', settings.kontakWhatsapp);
  };

  // --- Kartu Status Inden (hanya bila record.inden ada) ---
  const inden = record?.inden;
  const formatRupiahLocal = (val: number) => `Rp${(Number(val) || 0).toLocaleString('id-ID')}`;
  const formatTanggalId = (iso: string) =>
    iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-';
  const sisaHariInden = (() => {
    if (!inden?.batasPelunasan) return 0;
    const target = new Date(`${inden.batasPelunasan}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const indenLewatBatas = !!inden && inden.status === 'Inden' && sisaHariInden < 0;

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-16 font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            {settings.logoMadrasahUrl ? (
              <img
                src={settings.logoMadrasahUrl}
                alt="Logo Madrasah"
                className="w-11 h-11 rounded-2xl object-cover shadow-xs border border-emerald-200 shrink-0"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ background: '#065F46' }}
              >
                <School className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#1C1917] text-base leading-tight font-heading">
                  {settings.namaMadrasah}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {cfg.portalBadge || 'Dashboard Wali Murid'}
                </span>
              </div>
              <p className="text-xs text-[#78716C] font-medium hidden sm:block">
                {formatTpl(cfg.portalSubtitle) || `Portal Resmi SPMB TA ${settings.activeAcademicYear}`}
              </p>
            </div>
          </div>

          {/* Nav Links & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Utama: Informasi Pendaftaran (Khusus Pengguna Login) */}
            <button
              type="button"
              onClick={onOpenInformasiPendaftaran}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer font-heading"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>{cfg.card1Title || 'Informasi Pendaftaran'}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 text-xs sm:text-sm font-bold transition cursor-pointer"
              title="Keluar dari akun wali murid"
            >
              <LogOut className="w-4 h-4 text-stone-500 hover:text-rose-600" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Welcome & Profile Banner */}
        <div className="bg-[#0D382B] text-white rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-bold border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{cfg.verifiedBadge || 'Akun Aktif'}</span>
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading leading-tight">
                Selamat Datang, {session.parentName}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                {cfg.welcomeSubtitle ? (
                  formatTpl(cfg.welcomeSubtitle)
                ) : (
                  <>
                    Wali Murid dari calon ananda <strong className="text-amber-200">{session.studentName}</strong>. Seluruh proses pendaftaran dan informasi biaya dapat Anda kelola secara aman di bawah ini.
                  </>
                )}
              </p>
            </div>

            {/* Registration Credentials Chip */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 text-left shrink-0 w-full md:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                Identitas Pendaftar
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white/70">No. Registrasi:</span>
                  <span className="font-black text-white bg-black/20 px-2 py-0.5 rounded">
                    {session.nomorPendaftaran}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white/70">PIN Akses:</span>
                  <span className="font-black text-amber-200 bg-black/20 px-2 py-0.5 rounded tracking-wider">
                    {showPin ? currentPin : `••••${currentPin.slice(-2)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 text-white text-[10px] font-bold cursor-pointer"
                  >
                    {showPin ? 'Sembunyikan' : 'Lihat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peringatan jujur: data dari perangkat ini, server tidak terjangkau */}
        {dataStaleNotice && (
          <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-xs">
            <p className="text-sm font-extrabold text-amber-900">
              Data mungkin belum terbaru
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{dataStaleNotice}</p>
          </div>
        )}

        {/* Peringatan sync: record belum masuk Google Sheets panitia */}
        {showRetrySync && (
          <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-xs">
            <p className="text-sm font-extrabold text-amber-900">
              ⚠️ Pendaftaran ini belum terkirim ke Google Sheets panitia.
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {retryNotice ||
                'Data tersimpan di perangkat ini. Nomor pendaftaran masih sementara — belum terkonfirmasi panitia. Tekan tombol di bawah untuk mengirim ulang.'}
            </p>
            {onRetrySync && (
              <button
                type="button"
                onClick={onRetrySync}
                disabled={isRetryingSync}
                className="mt-3 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                {isRetryingSync ? 'Mengirim ulang…' : 'Kirim Ulang ke Panitia'}
              </button>
            )}
          </div>
        )}

        {/* Kartu Status Inden — hanya untuk pendaftar inden */}
        {inden && (
          <div
            className={`p-6 rounded-xl border-2 shadow-xs space-y-4 ${
              inden.status === 'Terdaftar'
                ? 'bg-emerald-50 border-emerald-300'
                : inden.status === 'Inden Kedaluwarsa'
                ? 'bg-rose-50 border-rose-300'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 font-heading flex items-center gap-2">
                  Status Inden
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                      inden.status === 'Terdaftar'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : inden.status === 'Inden Kedaluwarsa'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {inden.status}
                  </span>
                </h2>
                <p className="text-xs text-stone-600 mt-1">
                  Kursi ananda sudah dipesan lewat Inden Kursi (TA 2027/2028).
                </p>
              </div>
              {inden.status === 'Inden' && (
                <button
                  type="button"
                  onClick={onOpenWizard}
                  className="px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
                >
                  Lengkapi Formulir
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white rounded-xl border border-stone-200 p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">DP Inden</span>
                <span className="block text-sm font-extrabold text-stone-900 mt-1">
                  {formatRupiahLocal(inden.jumlahDp)}
                </span>
                <span className={`block text-[11px] font-bold mt-0.5 ${inden.dpLunas ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {inden.dpLunas ? 'Sudah dibayar' : 'Belum dibayar'}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Diskon Didapat</span>
                <span className="block text-sm font-extrabold text-stone-900 mt-1">
                  {formatRupiahLocal(inden.diskonDiberikan)}
                </span>
                <span className="block text-[11px] text-stone-500 mt-0.5">{inden.diskonDiberikan > 0 ? 'Diskon Early Bird' : 'Tidak ada diskon'}</span>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Sisa Bayar</span>
                <span className="block text-sm font-extrabold text-stone-900 mt-1">
                  {formatRupiahLocal(inden.sisaBayar)}
                </span>
                <span className="block text-[11px] text-stone-500 mt-0.5">Setelah DP &amp; diskon</span>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Batas Pelunasan</span>
                <span className={`block text-sm font-extrabold mt-1 ${indenLewatBatas ? 'text-rose-700' : 'text-stone-900'}`}>
                  {formatTanggalId(inden.batasPelunasan)}
                </span>
                <span className={`block text-[11px] font-bold mt-0.5 ${indenLewatBatas ? 'text-rose-700' : 'text-stone-500'}`}>
                  {inden.status === 'Terdaftar'
                    ? 'Sudah lunas'
                    : indenLewatBatas
                    ? 'LEWAT BATAS — hubungi panitia'
                    : sisaHariInden === 0
                    ? 'Hari ini'
                    : `${sisaHariInden} hari lagi`}
                </span>
              </div>
            </div>
            {indenLewatBatas && (
              <p className="text-xs font-bold text-rose-800 bg-white border border-rose-200 rounded-xl px-4 py-3">
                Batas pelunasan sudah lewat. Segera hubungi panitia SPMB via WhatsApp untuk kepastian kursi ananda.
              </p>
            )}
          </div>
        )}

        {/* Kartu Pengumuman (N-m1) — tampil bila hasil sudah ditetapkan
            (bukan PENDING): banding/keputusan + catatan panitia + langkah
            berikutnya. Bila masih PENDING, tidak ada kartu ini. */}
        {record && record.hasilPengumuman && record.hasilPengumuman !== 'PENDING' && (
          <div
            className={`p-6 rounded-xl border-2 shadow-xs space-y-3 ${
              record.hasilPengumuman === 'LULUS'
                ? 'bg-emerald-50 border-emerald-300'
                : record.hasilPengumuman === 'CADANGAN'
                ? 'bg-amber-50 border-amber-300'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 font-heading flex items-center gap-2">
                  Hasil Pengumuman
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                      record.hasilPengumuman === 'LULUS'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : record.hasilPengumuman === 'CADANGAN'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {record.hasilPengumuman === 'LULUS'
                      ? 'Diterima'
                      : record.hasilPengumuman === 'CADANGAN'
                      ? 'Cadangan'
                      : 'Tidak Diterima'}
                  </span>
                </h2>
                <p className="text-xs text-stone-600 mt-1">
                  {record.hasilPengumuman === 'LULUS'
                    ? 'Alhamdulillah, ananda dinyatakan DITERIMA sebagai santri baru MI Ishlahul Ummah. Lanjutkan konfirmasi daftar ulang sesuai jadwal dari panitia.'
                    : record.hasilPengumuman === 'CADANGAN'
                    ? 'Ananda masuk daftar CADANGAN. Panitia akan menghubungi bila ada kursi yang tersedia — pantau terus dashboard ini.'
                    : 'Mohon maaf, ananda belum diterima pada seleksi tahun ini. Silakan hubungi panitia bila ada yang ingin ditanyakan.'}
                </p>
              </div>
              {record.hasilPengumuman === 'LULUS' && (
                <button
                  type="button"
                  onClick={onPrintBukti}
                  className="px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
                >
                  Cetak Bukti Diterima
                </button>
              )}
            </div>
            {record.catatanPengumuman && (
              <p className="text-xs text-stone-700 bg-white border border-stone-200 rounded-xl px-4 py-3 leading-relaxed">
                <span className="font-bold">Catatan panitia: </span>
                {record.catatanPengumuman}
              </p>
            )}
          </div>
        )}

        {/* Highlight Section: INFORMASI PENDAFTARAN RESMI */}
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-emerald-200 shadow-md relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </span>
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider font-heading">
                  {cfg.highlightBadge || 'Fitur Khusus Wali Murid'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
                {cfg.highlightTitle || 'Informasi Pendaftaran & Rincian Biaya Resmi'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                {formatTpl(cfg.highlightDeskripsi) ||
                  `Lihat rincian lengkap biaya administrasi pendaftaran (formulir, rapor, tabungan, SPP), paket perlengkapan siswa laki-laki & perempuan, ketentuan pembayaran bertahap, dan informasi buku pelajaran resmi TA ${settings.activeAcademicYear}.`}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenInformasiPendaftaran}
              className="w-full lg:w-auto px-6 py-4 rounded-2xl bg-[#065F46] hover:bg-[#064E3B] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all cursor-pointer font-heading shrink-0"
            >
              <FileText className="w-5 h-5 text-emerald-200" />
              <span>{cfg.highlightBtnText || 'Buka Informasi Pendaftaran'}</span>
              <ArrowRight className="w-5 h-5 text-emerald-200" />
            </button>
          </div>
        </div>

        {/* Feature Grid for Authenticated Parents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Informasi Pendaftaran */}
          <div
            onClick={onOpenInformasiPendaftaran}
            className="group bg-white rounded-xl p-6 border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900 font-heading group-hover:text-emerald-800 transition-colors">
                {cfg.card1Title || 'Informasi Pendaftaran'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {cfg.card1Deskripsi
                  ? formatTpl(cfg.card1Deskripsi)
                  : `Rincian biaya administrasi Rp${subtotalAdmin.toLocaleString('id-ID')}, perlengkapan siswa, dan panduan pembayaran bertahap.`}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>{cfg.card1BtnText || 'Buka Rincian Biaya'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Lanjutkan / Edit Biodata Formulir */}
          <div
            onClick={onOpenWizard}
            className="group bg-white rounded-xl p-6 border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900 font-heading group-hover:text-emerald-800 transition-colors">
                {isFormSubmitted
                  ? (cfg.card2TitleSubmitted || 'Lihat / Edit Formulir')
                  : (cfg.card2TitleDraft || 'Lengkapi Formulir 4 Langkah')}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {cfg.card2Deskripsi || 'Kelola data santri, identitas orang tua, alamat tempat tinggal, dan unggah berkas (KK & Akta).'}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>
                {isFormSubmitted
                  ? (cfg.card2BtnTextSubmitted || 'Periksa Data')
                  : (cfg.card2BtnTextDraft || 'Lanjut Isi Formulir')}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Lacak Status & Observasi */}
          <div
            onClick={onOpenStatusTracker}
            className="group bg-white rounded-xl p-6 border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900 font-heading group-hover:text-emerald-800 transition-colors">
                {cfg.card3Title || 'Lacak Status Seleksi'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {cfg.card3Deskripsi || 'Pantau timeline progres verifikasi berkas, jadwal observasi ramah anak, dan hasil pengumuman resmi.'}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-teal-800">
              <span>{cfg.card3BtnText || 'Lacak Progres'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Cetak Bukti Registrasi */}
          <div
            onClick={onPrintBukti}
            className="group bg-white rounded-xl p-6 border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Printer className="w-6 h-6 text-sky-700" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900 font-heading group-hover:text-emerald-800 transition-colors">
                {cfg.card4Title || 'Cetak Lembar Bukti'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {cfg.card4Deskripsi || 'Unduh atau cetak bukti pendaftaran resmi ber-barcode untuk dibawa saat observasi di madrasah.'}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-sky-800">
              <span>{cfg.card4BtnText || 'Cetak Sekarang'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        {/* Ubah PIN Akses */}
        <div className="p-6 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-stone-900 font-heading">Ubah PIN Akses</h4>
                <p className="text-xs text-stone-500">
                  Ganti PIN 6 digit Anda. PIN lama wajib dimasukkan untuk verifikasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowChangePin((prev) => !prev);
                setPinError(null);
                setPinSuccess(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4" />
              <span>{showChangePin ? 'Tutup' : 'Ubah PIN'}</span>
            </button>
          </div>

          {pinSuccess && (
            <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pinSuccess}</span>
            </p>
          )}

          {showChangePin && (
            <form onSubmit={handleChangePin} className="mt-5 space-y-4 border-t border-stone-100 pt-5">
              {pinError && (
                <p className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800">
                  {pinError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
                    PIN Lama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit PIN lama"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
                    PIN Baru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit PIN baru"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
                    Konfirmasi PIN Baru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ulangi PIN baru"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition font-mono tracking-widest"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
              >
                Simpan PIN Baru
              </button>
            </form>
          )}
        </div>

        {/* Contact Helpdesk Note */}
        <div className="p-6 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-stone-900 font-heading">
                {formatTpl(cfg.helpdeskTitle) || `Konsultasi Panitia SPMB ${settings.namaMadrasah}`}
              </h4>
              <p className="text-xs text-stone-500">
                {formatTpl(cfg.helpdeskDeskripsi) ||
                  `Hubungi panitia via WhatsApp resmi (${settings.kontakWhatsapp}) jika membutuhkan bantuan seputar pendaftaran.`}
              </p>
            </div>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>{cfg.helpdeskBtnText || 'Chat Panitia SPMB'}</span>
          </a>
        </div>

      </main>
    </div>
  );
};
