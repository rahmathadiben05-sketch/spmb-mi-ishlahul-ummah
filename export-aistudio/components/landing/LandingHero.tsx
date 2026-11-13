'use client';

import React from 'react';
import {
  ArrowRight,
  School,
  CheckCircle2,
  Calendar,
  CreditCard,
  Calculator,
  Search,
  Award,
  Sparkles,
  Clock,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { SchoolSettings, Wave } from '@/lib/types';
import { fetchPublicStats, hitungHargaGelombang, formatRupiah, getAcademicYears } from '@/lib/storage';

interface LandingHeroProps {
  onStartRegistration: () => void;
  onOpenStatusTracker: () => void;
  settings: SchoolSettings;
  activeWave: Wave | undefined;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartRegistration,
  onOpenStatusTracker,
  settings,
  activeWave,
}) => {
  const waveName = activeWave ? activeWave.nama : settings.activeWave || 'TA 2027/2028';

  // State hitung mundur (menggantikan tampilan kuota)
  const isGelombangMode = (settings.modeBatasWaktu || 'gelombang') === 'gelombang';
  // Target hitung mundur + sisa waktu dihitung saat render pertama (bukan
  // 00 00 00 00) — grid countdown sudah suppressHydrationWarning.
  const getTargetDate = () => {
    let targetStr = '';
    if (isGelombangMode && activeWave?.tanggalSelesai) {
      targetStr = `${activeWave.tanggalSelesai}T23:59:59`;
    } else if (settings.tanggalBatasPendaftaran) {
      targetStr = settings.tanggalBatasPendaftaran;
    } else if (activeWave?.tanggalSelesai) {
      targetStr = `${activeWave.tanggalSelesai}T23:59:59`;
    } else {
      targetStr = '2027-06-30T23:59:59';
    }
    if (targetStr.length === 10) {
      targetStr = `${targetStr}T23:59:59`;
    }
    return new Date(targetStr);
  };
  const computeRemaining = (targetDate: Date) => {
    const difference = targetDate.getTime() - new Date().getTime();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(difference / (1000 * 60 * 60)) % 24,
      minutes: Math.floor(difference / (1000 * 60)) % 60,
      seconds: Math.floor(difference / 1000) % 60,
      isExpired: false,
    };
  };
  const [timeRemaining, setTimeRemaining] = React.useState(() =>
    computeRemaining(getTargetDate())
  );
  // Kartu jalur mengikuti periode aktif (T-03): sebelum tanggal mulai
  // tampil "Segera Dibuka", sesudah tanggal tutup tampil "Ditutup".
  // Diperbarui di effect hitung mundur yang sama (bukan saat render,
  // supaya tidak ada selisih SSR).
  const [pendaftaranBelumMulai, setPendaftaranBelumMulai] = React.useState(false);

  React.useEffect(() => {
    const targetDate = getTargetDate();

    const calculateTime = () => {
      const now = new Date();
      // Status "belum mulai": tanggal mulai gelombang aktif (mis. TA
      // 2027/2028 mulai 1 Nov 2026) belum tercapai.
      const mulaiStr = activeWave?.tanggalMulai ? `${activeWave.tanggalMulai}T00:00:00` : '';
      setPendaftaranBelumMulai(mulaiStr ? now.getTime() < new Date(mulaiStr).getTime() : false);
      setTimeRemaining(computeRemaining(targetDate));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isGelombangMode, settings.tanggalBatasPendaftaran, activeWave?.tanggalSelesai, activeWave?.tanggalMulai]);

  // Penghitung kursi terisi + sisa kuota diskon (live dari Sheets via Apps
  // Script v2.6; total sudah menghitung inden, mengecualikan kedaluwarsa).
  // Gagal fetch = sembunyikan penghitung & tampilkan harga normal (jangan
  // tampilkan diskon yang belum terverifikasi).
  const [kuotaTerisi, setKuotaTerisi] = React.useState<number | null>(null);
  const [sisaKuotaDiskon, setSisaKuotaDiskon] = React.useState<number | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    fetchPublicStats(settings, activeWave?.kuotaDiskon)
      .then((stats) => {
        if (!cancelled && stats) {
          setKuotaTerisi(stats.total);
          setSisaKuotaDiskon(stats.sisaKuotaDiskon);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settings.googleAppScriptUrl, settings.activeAcademicYear, activeWave?.kuotaDiskon]);
  // Harga gelombang aktif: bila fetch gagal (sisaKuotaDiskon null), diskon
  // dianggap tidak terverifikasi → tampilkan harga normal.
  const hargaWave =
    sisaKuotaDiskon === null
      ? { hargaNormal: activeWave?.biayaPendaftaran ?? 183000, diskon: 0, hargaAkhir: activeWave?.biayaPendaftaran ?? 183000, diskonTersedia: false, diskonTidakPasti: true }
      : hitungHargaGelombang(activeWave, sisaKuotaDiskon);

  // Penyebut "Kursi terisi X dari Y" (M15): total kursi TAHUN AJARAN AKTIF
  // (kuotaTotal), BUKAN kuotaTarget — kuotaTarget hanya target progres
  // dashboard pilihan Rahmat dan tidak boleh dipakai sebagai penyebut.
  const kuotaTotalAktif = React.useMemo(
    () =>
      getAcademicYears().find((ay) => ay.tahun === settings.activeAcademicYear)?.kuotaTotal || 120,
    [settings.activeAcademicYear]
  );

  // Statistik hero memakai nilai CMS yang sama dengan seksi Mengenal (satu sumber kebenaran)
  const akreditasiRaw = settings.cmsContent?.mengenalAkreditasiNilai || 'Unggul (A)';
  const akreditasiMatch = akreditasiRaw.match(/^(.+?)\s*\(([A-Za-z])\)\s*$/);
  const akreditasiHuruf = akreditasiMatch ? akreditasiMatch[2] : 'A';
  const akreditasiKata = akreditasiMatch ? akreditasiMatch[1] : 'Unggul';

  // Caption penutupan mengikuti tanggal tutup yang sama dengan hitung mundur
  const closingTargetStr = (() => {
    if (isGelombangMode && activeWave?.tanggalSelesai) return `${activeWave.tanggalSelesai}T23:59:59`;
    if (settings.tanggalBatasPendaftaran) return settings.tanggalBatasPendaftaran;
    if (activeWave?.tanggalSelesai) return `${activeWave.tanggalSelesai}T23:59:59`;
    return '2027-06-30T23:59:59';
  })();
  const closingDate = new Date(
    closingTargetStr.length === 10 ? `${closingTargetStr}T23:59:59` : closingTargetStr
  );
  const closingLabel = `Pendaftaran ${waveName} ditutup ${closingDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} pukul ${String(closingDate.getHours()).padStart(2, '0')}.${String(
    closingDate.getMinutes()
  ).padStart(2, '0')} WIB`;

  // Label kartu jalur mengikuti periode aktif (T-03): sebelum tanggal
  // mulai -> "Segera Dibuka"; sesudah tanggal tutup -> "Ditutup";
  // di dalam periode -> "Buka" (Reguler) / "Tersedia" (Pindahan).
  const jalurReguler = pendaftaranBelumMulai ? 'Segera Dibuka' : timeRemaining.isExpired ? 'Ditutup' : 'Buka';
  const jalurPindahan = pendaftaranBelumMulai ? 'Segera Dibuka' : timeRemaining.isExpired ? 'Ditutup' : 'Tersedia';
  const kelasBadgeJalur = (bukaUtama: boolean) =>
    pendaftaranBelumMulai
      ? 'text-amber-800 bg-amber-100/80 border-amber-200'
      : timeRemaining.isExpired
      ? 'text-rose-700 bg-rose-100/80 border-rose-200'
      : bukaUtama
      ? 'text-emerald-800 bg-emerald-100/80 border-emerald-200'
      : 'text-stone-700 bg-white border-stone-200';

  if (settings.sectionVisibility?.showHero === false) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-[#F7F4EC] text-[#292524] pt-8 sm:pt-12 pb-10 sm:pb-14 border-b border-[#E7E5E4]">
      {/* Background Dot Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
        style={{
          backgroundSize: '28px 28px',
          backgroundImage: 'radial-gradient(#1c1917 0.75px, transparent 0.75px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Hero Left: Headline, Badge & Action CTAs */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            
            {/* Status & Wave Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/90 shadow-2xs bg-white text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-[#065F46]">
                {(settings.cmsContent?.heroBadge || 'Penerimaan Santri Baru TA {activeAcademicYear}').replace(
                  '{activeAcademicYear}',
                  settings.activeAcademicYear
                )}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {waveName}
              </span>
            </div>

            {/* Display Headline H1 */}
            <div className="relative group">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.12] text-[#1C1917] font-heading">
                {(settings.cmsContent?.heroTitle || "Mendidik Generasi Qur'ani, Mandiri & Berprestasi di {namaMadrasah}").replace(
                  '{namaMadrasah}',
                  settings.namaMadrasah
                )}
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#78716C] leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
              {settings.cmsContent?.heroSubtitle ||
                'Pendaftaran online mudah dan transparan. Dilengkapi pelacak progres berkas, sistem pendaftaran terpadu, serta kurikulum berbasis cinta dan karakter Islami.'}
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 max-w-xl mx-auto lg:mx-0">
              <button
                type="button"
                onClick={onStartRegistration}
                className="btn-theme-primary min-h-[48px] px-7 py-3 text-sm sm:text-base rounded-2xl gap-2 text-white w-full sm:w-auto shadow-md cursor-pointer font-bold"
              >
                <span>{settings.cmsContent?.heroCtaPrimary || 'Daftar Sekarang'}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={onOpenStatusTracker}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-white hover:bg-[#F7F4EC] border border-[#E7E5E4] text-xs sm:text-sm font-bold text-[#44403C] hover:text-[#065F46] transition cursor-pointer shadow-2xs w-full sm:w-auto"
              >
                <Search className="w-4 h-4 text-emerald-700" />
                <span>{settings.cmsContent?.heroCtaSecondary || 'Lacak Status'}</span>
              </button>
            </div>

            {/* Quick Metrics — rasio guru & santri dihapus atas permintaan (13 Nov) */}
            <div className="pt-4 border-t border-[#E7E5E4] grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-lg sm:text-2xl font-black text-[#065F46] font-heading whitespace-nowrap">
                  Akreditasi {akreditasiHuruf}
                </div>
                <div className="text-[11px] sm:text-xs text-[#78716C] font-medium">
                  BAN-S/M {akreditasiKata}
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-black text-[#065F46] font-heading whitespace-nowrap">
                  100% Online
                </div>
                <div className="text-[11px] sm:text-xs text-[#78716C] font-medium">
                  Pendaftaran &amp; Seleksi
                </div>
              </div>
            </div>
            <p className="pt-3 text-[11px] sm:text-xs text-[#78716C] font-medium max-w-lg mx-auto lg:mx-0">
              Sekretariat: {settings.cmsContent?.jamPelayanan || 'Senin - Sabtu: 07.30 - 14.00 WIB'}. Observasi dan verifikasi berkas asli tetap dilakukan langsung di madrasah.
            </p>
            {kuotaTerisi !== null && (
              <div className="pt-3 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#57534E]">
                  <span>Kursi terisi</span>
                  <span>
                    {kuotaTerisi} dari {kuotaTotalAktif} kursi
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
                  <div
                    className="h-full bg-[#065F46] rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (kuotaTerisi / kuotaTotalAktif) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hero Right: Modern Dynamic Interactive Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-[#DCEBE3] shadow-xl bg-white p-6 space-y-4">
              
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shadow-2xs font-bold">
                    <School className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 font-heading block">
                      Pendaftaran Online Terpadu
                    </span>
                    <h3 className="text-sm font-extrabold text-stone-900 leading-tight">
                      {settings.namaMadrasah}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Formulir Online</span>
                </span>
              </div>

              {/* Jalur Pilihan Box */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block font-heading">
                  Pilihan Jalur Penerimaan:
                </span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#F7F4EC] border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <strong className="text-stone-900 block text-xs">Jalur Reguler (Kelas 1)</strong>
                      <span className="text-[11px] text-stone-500">Lulusan TK / RA / PAUD • Kurikulum Ramah Anak</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${kelasBadgeJalur(true)}`}>
                      {jalurReguler}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F7F4EC] border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <strong className="text-stone-900 block text-xs">Jalur Siswa Pindahan</strong>
                      <span className="text-[11px] text-stone-500">Pindahan Kelas 2 - 5 SD / MI</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${kelasBadgeJalur(false)}`}>
                      {jalurPindahan}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hitung Mundur Pendaftaran (Tanpa Kuota) */}
              {settings.sectionVisibility?.showCountdown !== false && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7F4EC] border border-emerald-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-900 font-heading">
                    <Clock className="w-4 h-4 text-emerald-700 animate-pulse" />
                    <span>{settings.cmsContent?.heroCountdownLabel || 'Hitung Mundur Penutupan:'}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    <span>{waveName}</span>
                  </span>
                </div>

                {!timeRemaining.isExpired ? (
                  <div suppressHydrationWarning className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white rounded-xl py-2 px-1 border border-emerald-100 shadow-2xs">
                      <span suppressHydrationWarning className="block text-lg sm:text-xl font-black text-emerald-950 font-heading leading-tight">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase">
                        Hari
                      </span>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-1 border border-emerald-100 shadow-2xs">
                      <span suppressHydrationWarning className="block text-lg sm:text-xl font-black text-emerald-950 font-heading leading-tight">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase">
                        Jam
                      </span>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-1 border border-emerald-100 shadow-2xs">
                      <span suppressHydrationWarning className="block text-lg sm:text-xl font-black text-emerald-950 font-heading leading-tight">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase">
                        Menit
                      </span>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-1 border border-emerald-100 shadow-2xs">
                      <span suppressHydrationWarning className="block text-lg sm:text-xl font-black text-amber-600 font-heading leading-tight">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-amber-700 uppercase">
                        Detik
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-center">
                    <p className="text-xs font-bold text-amber-900">Pendaftaran {waveName} Telah Ditutup</p>
                    <p className="text-[10px] text-amber-800">Silakan hubungi Panitia untuk jadwal pendaftaran berikutnya.</p>
                  </div>
                )}

                <div className="flex items-center text-[10px] text-stone-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Layanan formulir aktif 24 jam</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-stone-700 text-center text-balance pt-1">
                  {closingLabel}
                </p>
                {isGelombangMode && activeWave && (
                  <div className="text-center pt-1 space-y-0.5">
                    {hargaWave.diskonTersedia ? (
                      <>
                        <p className="text-[11px] sm:text-xs font-bold text-stone-500">
                          Biaya {waveName}: <span className="line-through">{formatRupiah(hargaWave.hargaNormal)}</span>{' '}
                          <span className="text-base sm:text-lg font-black text-emerald-800">{formatRupiah(hargaWave.hargaAkhir)}</span>
                        </p>
                        <p className="text-[11px] sm:text-xs font-bold text-emerald-800">
                          Harga Early Bird — diskon {formatRupiah(hargaWave.diskon)}, tersisa {sisaKuotaDiskon} kursi diskon
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] sm:text-xs font-bold text-emerald-800">
                          Biaya {waveName}: {formatRupiah(hargaWave.hargaNormal)}
                        </p>
                        {activeWave.indenAktif && sisaKuotaDiskon === null && (
                          <p className="text-[11px] sm:text-xs font-bold text-amber-800">
                            Kuota diskon belum dapat dipastikan — hubungi panitia
                          </p>
                        )}
                        {activeWave.indenAktif && sisaKuotaDiskon !== null && (
                          <p className="text-[11px] sm:text-xs font-bold text-stone-500">
                            Kuota diskon Early Bird sudah habis
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Fast Direct Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Daftar Langsung (Tanpa Antre)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
