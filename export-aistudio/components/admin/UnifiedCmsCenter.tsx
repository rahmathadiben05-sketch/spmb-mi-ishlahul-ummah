'use client';

import React, { useState } from 'react';
import {
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Layout,
  Layers,
  GraduationCap,
  Printer,
  Compass,
  AlertCircle,
  Eye,
  Image,
  Check,
  ChevronRight,
  Info,
  DollarSign,
  HelpCircle,
  Phone,
  Building,
  School,
  ExternalLink,
  Quote,
} from 'lucide-react';
import { CmsContent, CmsDownloadItem, DashboardWaliMuridConfig, RincianBiayaPendaftaran, SchoolSettings, Testimonial } from '@/lib/types';
import { DEFAULT_CMS_CONTENT, DEFAULT_DASHBOARD_WALI_MURID, DEFAULT_RINCIAN_BIAYA, saveSchoolSettings } from '@/lib/storage';
import { PrintableBlankForm } from '@/components/print/PrintableBlankForm';

interface UnifiedCmsCenterProps {
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  /** Server-first (admin): kirim ke server dulu; kembalikan false bila gagal
   *  supaya pesan sukses tidak ditampilkan palsu. */
  onPersistSettings?: (nextSettings: SchoolSettings) => Promise<boolean>;
  onOpenRincianBiayaModal?: () => void;
  onOpenDashboardWaliModal?: () => void;
  onPreviewPublicPage?: () => void;
}

type CmsTab = 'beranda' | 'formulir' | 'sukses' | 'dokumen' | 'dashboard' | 'galeri';

export const UnifiedCmsCenter: React.FC<UnifiedCmsCenterProps> = ({
  settings,
  onUpdateSettings,
  onPersistSettings,
  onOpenRincianBiayaModal,
  onOpenDashboardWaliModal,
  onPreviewPublicPage,
}) => {
  const [activeTab, setActiveTab] = useState<CmsTab>('beranda');
  const [formData, setFormData] = useState<CmsContent>(() => ({
    ...DEFAULT_CMS_CONTENT,
    ...(settings.cmsContent || {}),
  }));
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [confirmResetTab, setConfirmResetTab] = useState<CmsTab | null>(null);
  const [showBlankForm, setShowBlankForm] = useState(false);

  const showToast = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 3500);
  };

  const handleFieldChange = (field: keyof CmsContent, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // --- Editor testimoni (tab Galeri & Testimoni) ---
  const testiList = formData.testimoni || [];
  const updateTesti = (idx: number, patch: Partial<Testimonial>) => {
    const items = [...testiList];
    items[idx] = { ...items[idx], ...patch };
    setFormData((prev) => ({ ...prev, testimoni: items }));
  };
  const addTesti = () => {
    setFormData((prev) => ({
      ...prev,
      testimoni: [...testiList, { id: `testi-${Date.now()}`, nama: '', peran: '', kutipan: '' }],
    }));
  };
  const removeTesti = (idx: number) => {
    const items = [...testiList];
    items.splice(idx, 1);
    setFormData((prev) => ({ ...prev, testimoni: items }));
  };

  // --- Editor item unduhan (tab Beranda; Paket C, T-03/S-02) ---
  // 3 item tetap (brosur / formulir offline / panduan): hanya judul +
  // deskripsi yang bisa diedit; id + aksi unduh ditentukan kode
  // (LandingDownloads), supaya tombol tidak bisa rusak dari CMS.
  const unduhanList: CmsDownloadItem[] = formData.downloadsItems?.length
    ? formData.downloadsItems
    : DEFAULT_CMS_CONTENT.downloadsItems || [];
  const updateUnduhan = (idx: number, patch: Partial<CmsDownloadItem>) => {
    const items = [...unduhanList];
    items[idx] = { ...items[idx], ...patch };
    setFormData((prev) => ({ ...prev, downloadsItems: items }));
  };

  const handleSaveTab = async (tabName: string) => {
    const updatedSettings: SchoolSettings = {
      ...settings,
      cmsContent: {
        ...formData,
      },
    };
    // Server-first (admin): kirim dulu; lokal tetap ditulis, tapi pesan
    // sukses jujur bila server gagal.
    const serverOk = onPersistSettings ? await onPersistSettings(updatedSettings) : true;
    saveSchoolSettings(updatedSettings, 'Admin');
    onUpdateSettings(updatedSettings);
    showToast(
      serverOk
        ? 'Semua perubahan teks CMS berhasil disimpan ke sistem!'
        : 'Teks tersimpan di perangkat ini, tetapi GAGAL tersimpan ke server — coba Simpan lagi.'
    );
  };

  const handleResetTab = async (tab: CmsTab) => {
    let resetSlice: Partial<CmsContent> = {};

    if (tab === 'beranda') {
      resetSlice = {
        headerTagline: DEFAULT_CMS_CONTENT.headerTagline,
        footerTagline: DEFAULT_CMS_CONTENT.footerTagline,
        footerAbout: DEFAULT_CMS_CONTENT.footerAbout,
        heroBadge: DEFAULT_CMS_CONTENT.heroBadge,
        heroTitle: DEFAULT_CMS_CONTENT.heroTitle,
        heroSubtitle: DEFAULT_CMS_CONTENT.heroSubtitle,
        heroCtaPrimary: DEFAULT_CMS_CONTENT.heroCtaPrimary,
        heroCtaSecondary: DEFAULT_CMS_CONTENT.heroCtaSecondary,
        heroCountdownLabel: DEFAULT_CMS_CONTENT.heroCountdownLabel,
        mengenalJudul: DEFAULT_CMS_CONTENT.mengenalJudul,
        mengenalDeskripsi: DEFAULT_CMS_CONTENT.mengenalDeskripsi,
        mengenalPoints: DEFAULT_CMS_CONTENT.mengenalPoints,
        mengenalAkreditasiNilai: DEFAULT_CMS_CONTENT.mengenalAkreditasiNilai,
        mengenalRasioGuru: DEFAULT_CMS_CONTENT.mengenalRasioGuru,
        programJudul: DEFAULT_CMS_CONTENT.programJudul,
        programDeskripsi: DEFAULT_CMS_CONTENT.programDeskripsi,
        sambutanJudul: DEFAULT_CMS_CONTENT.sambutanJudul,
        sambutanTeks: DEFAULT_CMS_CONTENT.sambutanTeks,
        sambutanAmanah: DEFAULT_CMS_CONTENT.sambutanAmanah,
        timelineJudul: DEFAULT_CMS_CONTENT.timelineJudul,
        timelineDeskripsi: DEFAULT_CMS_CONTENT.timelineDeskripsi,
        downloadsJudul: DEFAULT_CMS_CONTENT.downloadsJudul,
        downloadsDeskripsi: DEFAULT_CMS_CONTENT.downloadsDeskripsi,
        downloadsItems: DEFAULT_CMS_CONTENT.downloadsItems,
        lokasiDeskripsi: DEFAULT_CMS_CONTENT.lokasiDeskripsi,
        faqJudul: DEFAULT_CMS_CONTENT.faqJudul,
        faqDeskripsi: DEFAULT_CMS_CONTENT.faqDeskripsi,
        jamPelayanan: DEFAULT_CMS_CONTENT.jamPelayanan,
      };
    } else if (tab === 'formulir') {
      resetSlice = {
        step1Title: DEFAULT_CMS_CONTENT.step1Title,
        step1Subtitle: DEFAULT_CMS_CONTENT.step1Subtitle,
        step1Notice: DEFAULT_CMS_CONTENT.step1Notice,
        step2Title: DEFAULT_CMS_CONTENT.step2Title,
        step2Subtitle: DEFAULT_CMS_CONTENT.step2Subtitle,
        step2Notice: DEFAULT_CMS_CONTENT.step2Notice,
        step3Title: DEFAULT_CMS_CONTENT.step3Title,
        step3Subtitle: DEFAULT_CMS_CONTENT.step3Subtitle,
        step3Notice: DEFAULT_CMS_CONTENT.step3Notice,
        step4Title: DEFAULT_CMS_CONTENT.step4Title,
        step4Subtitle: DEFAULT_CMS_CONTENT.step4Subtitle,
        step4Notice: DEFAULT_CMS_CONTENT.step4Notice,
        reviewTitle: DEFAULT_CMS_CONTENT.reviewTitle,
        reviewSubtitle: DEFAULT_CMS_CONTENT.reviewSubtitle,
        paktaIntegritasTeks: DEFAULT_CMS_CONTENT.paktaIntegritasTeks,
      };
    } else if (tab === 'sukses') {
      resetSlice = {
        successTitle: DEFAULT_CMS_CONTENT.successTitle,
        successSubtitle: DEFAULT_CMS_CONTENT.successSubtitle,
        successNotice: DEFAULT_CMS_CONTENT.successNotice,
        successStep1Title: DEFAULT_CMS_CONTENT.successStep1Title,
        successStep1Desc: DEFAULT_CMS_CONTENT.successStep1Desc,
        successStep2Title: DEFAULT_CMS_CONTENT.successStep2Title,
        successStep2Desc: DEFAULT_CMS_CONTENT.successStep2Desc,
        successStep3Title: DEFAULT_CMS_CONTENT.successStep3Title,
        successStep3Desc: DEFAULT_CMS_CONTENT.successStep3Desc,
        successHelpText: DEFAULT_CMS_CONTENT.successHelpText,
      };
    } else if (tab === 'dokumen') {
      resetSlice = {
        kopInstansiAtas: DEFAULT_CMS_CONTENT.kopInstansiAtas,
        kopNamaMadrasah: DEFAULT_CMS_CONTENT.kopNamaMadrasah,
        kopStatusAkreditasi: DEFAULT_CMS_CONTENT.kopStatusAkreditasi,
        kopAlamat: DEFAULT_CMS_CONTENT.kopAlamat,
        cetakKotaTitimangsa: DEFAULT_CMS_CONTENT.cetakKotaTitimangsa,
        cetakJabatanPenandatangan: DEFAULT_CMS_CONTENT.cetakJabatanPenandatangan,
        cetakNamaPenandatangan: DEFAULT_CMS_CONTENT.cetakNamaPenandatangan,
        cetakNipPenandatangan: DEFAULT_CMS_CONTENT.cetakNipPenandatangan,
        cetakKetentuanObservasi: DEFAULT_CMS_CONTENT.cetakKetentuanObservasi,
      };
    } else if (tab === 'galeri') {
      resetSlice = {
        galeriFotoUrl: DEFAULT_CMS_CONTENT.galeriFotoUrl,
        testimoni: DEFAULT_CMS_CONTENT.testimoni,
      };
    } else if (tab === 'dashboard') {
      const updatedSettings: SchoolSettings = {
        ...settings,
        dashboardWaliMuridConfig: DEFAULT_DASHBOARD_WALI_MURID,
        rincianBiayaPendaftaran: DEFAULT_RINCIAN_BIAYA,
      };
      const serverOk = onPersistSettings ? await onPersistSettings(updatedSettings) : true;
      saveSchoolSettings(updatedSettings, 'Admin');
      onUpdateSettings(updatedSettings);
      setConfirmResetTab(null);
      showToast(
        serverOk
          ? 'Konfigurasi Dashboard & Rincian Biaya berhasil direset ke standar bawaan!'
          : 'Reset tersimpan di perangkat ini, tetapi GAGAL tersimpan ke server — coba Simpan lagi.'
      );
      return;
    }

    const updatedFormData = {
      ...formData,
      ...resetSlice,
    };
    setFormData(updatedFormData);

    const updatedSettings: SchoolSettings = {
      ...settings,
      cmsContent: updatedFormData,
    };
    const serverOk = onPersistSettings ? await onPersistSettings(updatedSettings) : true;
    saveSchoolSettings(updatedSettings, 'Admin');
    onUpdateSettings(updatedSettings);
    setConfirmResetTab(null);
    showToast(
      serverOk
        ? `Seluruh teks bagian "${tab.toUpperCase()}" berhasil direset ke default madrasah!`
        : `Reset tab "${tab.toUpperCase()}" tersimpan di perangkat ini, tetapi GAGAL tersimpan ke server — coba Simpan lagi.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="text-xs sm:text-sm font-bold">{savedSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccessMsg(null)}
            className="text-emerald-200 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      {confirmResetTab && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                Reset Teks ke Standar Madrasah?
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Tindakan ini akan mengembalikan seluruh teks pada tab{' '}
                <strong className="text-stone-900 uppercase">[{confirmResetTab}]</strong> ke teks
                asli standar tanpa memengaruhi tab lainnya.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConfirmResetTab(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleResetTab(confirmResetTab)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Bagian Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header CMS Center */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pusat CMS &amp; Pengaturan Teks Terpadu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-heading">
            Pusat Kontrol Konten Seluruh Halaman
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Sesuaikan teks judul, narasi petunjuk, instruksi berkas syarat pendaftaran, KOP dokumen cetak, dan dashboard secara langsung dan dinamis. Tersedia tombol reset terpisah di setiap bagian.
          </p>
        </div>

        {onPreviewPublicPage && (
          <button
            type="button"
            onClick={onPreviewPublicPage}
            className="btn-theme-secondary !py-2.5 !px-5 !text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-700" />
            <span>Lihat Halaman Publik</span>
          </button>
        )}
      </div>

      {/* Navigasi Tab Internal CMS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('beranda')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'beranda'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>1. Beranda / Landing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('formulir')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'formulir'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Formulir Pendaftaran (Langkah 1–5)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sukses')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'sukses'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>3. Halaman Sukses &amp; Konfirmasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dokumen')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'dokumen'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>4. Dokumen Cetak KOP &amp; Pengesahan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>5. Dashboard Wali &amp; Rincian Biaya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('galeri')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'galeri'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>6. Galeri &amp; Testimoni</span>
        </button>
      </div>

      <p className="text-[11px] text-stone-500 -mt-4">
        Catatan: tombol Simpan di tiap tab menyimpan <strong>seluruh teks CMS</strong> (semua tab), bukan hanya tab yang sedang dibuka.
      </p>

      {/* ================= TAB 1: BERANDA / LANDING PAGE ================= */}
      {activeTab === 'beranda' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                1. Pengaturan Konten Halaman Beranda (Landing Page)
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Mengontrol teks Hero Banner, profil madrasah, timeline, jam pelayanan, dan kontak sekretariat.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('beranda')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveTab('Beranda / Landing')}
                className="btn-theme-primary !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Teks CMS</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sub-seksi Banner Pengumuman */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-emerald-700" />
                <span>Banner Pengumuman (di atas header)</span>
              </h4>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Teks Pengumuman</label>
                <input
                  type="text"
                  value={formData.pengumumanBanner || ''}
                  onChange={(e) => handleFieldChange('pengumumanBanner', e.target.value)}
                  placeholder="Contoh: Gelombang 1 diperpanjang hingga 30 Juni 2027!"
                  className="m3-input bg-white text-xs"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Kosongkan untuk menyembunyikan banner. Banner tampil sebagai strip hijau tipis di atas header halaman depan.
                </p>
              </div>
            </div>

            {/* Sub-seksi Hero */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Seksi Hero Banner Utama</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Badge Teks Hero</label>
                  <input
                    type="text"
                    value={formData.heroBadge || ''}
                    onChange={(e) => handleFieldChange('heroBadge', e.target.value)}
                    placeholder="Penerimaan Murid Baru Online (SPMB)"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Label Batas Countdown</label>
                  <input
                    type="text"
                    value={formData.heroCountdownLabel || ''}
                    onChange={(e) => handleFieldChange('heroCountdownLabel', e.target.value)}
                    placeholder="Batas Akhir Pendaftaran:"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Utama (Headline)</label>
                  <input
                    type="text"
                    value={formData.heroTitle || ''}
                    onChange={(e) => handleFieldChange('heroTitle', e.target.value)}
                    placeholder="Membina Generasi Qur'ani, Berakhlak Mulia & Berprestasi"
                    className="m3-input bg-white font-bold text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Hero</label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle || ''}
                    onChange={(e) => handleFieldChange('heroSubtitle', e.target.value)}
                    placeholder="Deskripsi singkat sambutan di hero..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Teks Tombol CTA Utama</label>
                  <input
                    type="text"
                    value={formData.heroCtaPrimary || ''}
                    onChange={(e) => handleFieldChange('heroCtaPrimary', e.target.value)}
                    placeholder="Daftar Sekarang (Mulai Formulir)"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Teks Tombol CTA Sekunder</label>
                  <input
                    type="text"
                    value={formData.heroCtaSecondary || ''}
                    onChange={(e) => handleFieldChange('heroCtaSecondary', e.target.value)}
                    placeholder="Masuk Akun Wali Murid"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Preview Live H1 Hero */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                    Pratinjau Langsung (Preview Tampilan H1):
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Sesuai Tampilan Asli
                  </span>
                </div>
                <div className="border border-stone-100 rounded-xl p-4 bg-[#F7F4EC] space-y-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                    {(formData.heroBadge || 'Penerimaan Santri Baru TA {activeAcademicYear}').replace(
                      '{activeAcademicYear}',
                      settings.activeAcademicYear
                    )}
                  </span>
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#1C1917] leading-tight font-heading">
                    {(formData.heroTitle || "Mendidik Generasi Qur'ani, Mandiri & Berprestasi di {namaMadrasah}").replace(
                      '{namaMadrasah}',
                      settings.namaMadrasah
                    )}
                  </h1>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {formData.heroSubtitle ||
                      'Pendaftaran online mudah dan transparan. Dilengkapi pelacak progres berkas realtime...'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-[11px] font-bold">
                      {formData.heroCtaPrimary || 'Daftar Sekarang'}
                    </span>
                    <span className="px-3 py-1 bg-white border border-stone-300 text-stone-700 rounded-lg text-[11px] font-bold">
                      {formData.heroCtaSecondary || 'Lacak Status'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-seksi Timeline & Alur */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Seksi Alur Pendaftaran &amp; Timeline</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Seksi Alur</label>
                  <input
                    type="text"
                    value={formData.timelineJudul || ''}
                    onChange={(e) => handleFieldChange('timelineJudul', e.target.value)}
                    placeholder="Alur Pendaftaran SPMB Online"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Deskripsi Seksi Alur</label>
                  <input
                    type="text"
                    value={formData.timelineDeskripsi || ''}
                    onChange={(e) => handleFieldChange('timelineDeskripsi', e.target.value)}
                    placeholder="4 langkah mudah mendaftarkan calon ananda tercinta..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Sub-seksi FAQ & Bantuan */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Seksi Tanya-Jawab (FAQ) &amp; Unduhan</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Seksi FAQ</label>
                  <input
                    type="text"
                    value={formData.faqJudul || ''}
                    onChange={(e) => handleFieldChange('faqJudul', e.target.value)}
                    placeholder="Pertanyaan yang Sering Diajukan (FAQ)"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Deskripsi FAQ</label>
                  <input
                    type="text"
                    value={formData.faqDeskripsi || ''}
                    onChange={(e) => handleFieldChange('faqDeskripsi', e.target.value)}
                    placeholder="Temukan jawaban seputar pendaftaran..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Pusat Unduhan</label>
                  <input
                    type="text"
                    value={formData.downloadsJudul || ''}
                    onChange={(e) => handleFieldChange('downloadsJudul', e.target.value)}
                    placeholder="Pusat Unduhan & Brosur SPMB"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Deskripsi Unduhan</label>
                  <input
                    type="text"
                    value={formData.downloadsDeskripsi || ''}
                    onChange={(e) => handleFieldChange('downloadsDeskripsi', e.target.value)}
                    placeholder="Unduh brosur resmi..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
              {/* Item unduhan: judul + deskripsi per item (Paket C, T-03/S-02).
                  Aksi unduh tiap item tetap dari kode — di sini tidak ada
                  tambah/hapus item, supaya tombol brosur/formulir/panduan
                  tidak bisa hilang dari CMS. */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-800">Isi Kartu Unduhan (3 item tetap)</p>
                {unduhanList.map((item, idx) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-2.5">
                    <p className="text-[11px] font-bold text-stone-500">
                      {idx + 1}. {item.id === 'download-brosur' ? 'Brosur Resmi' : item.id === 'download-formulir' ? 'Formulir Offline' : 'Panduan Pendaftaran'}
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Judul Kartu</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateUnduhan(idx, { title: e.target.value })}
                        placeholder="Judul kartu unduhan"
                        className="m3-input bg-white text-xs font-bold"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">Tulis {'{TA}'} untuk tahun ajaran aktif.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">Deskripsi Kartu</label>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateUnduhan(idx, { description: e.target.value })}
                        placeholder="Deskripsi singkat isi unduhan..."
                        className="m3-input bg-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowBlankForm(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🖨 Cetak Formulir Kosong (Offline) — untuk pendaftaran di sekretariat</span>
              </button>
              {showBlankForm && (
                <PrintableBlankForm
                  settings={settings}
                  onClose={() => setShowBlankForm(false)}
                />
              )}
            </div>

            {/* Sub-seksi Sekretariat & Jam Pelayanan */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>Sekretariat, Kontak &amp; Footer</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Jam Pelayanan</label>
                  <input
                    type="text"
                    value={formData.jamPelayanan || ''}
                    onChange={(e) => handleFieldChange('jamPelayanan', e.target.value)}
                    placeholder="Senin - Sabtu: 07.30 - 14.00 WIB"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Header Tagline</label>
                  <input
                    type="text"
                    value={formData.headerTagline || ''}
                    onChange={(e) => handleFieldChange('headerTagline', e.target.value)}
                    placeholder="Generasi Qur'ani, Cerdas & Berakhlak Mulia"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Deskripsi Lokasi Kampus</label>
                  <textarea
                    rows={2}
                    value={formData.lokasiDeskripsi || ''}
                    onChange={(e) => handleFieldChange('lokasiDeskripsi', e.target.value)}
                    placeholder="Deskripsi singkat lokasi kampus di kartu peta Sekretariat..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Footer Tagline</label>
                  <input
                    type="text"
                    value={formData.footerTagline || ''}
                    onChange={(e) => handleFieldChange('footerTagline', e.target.value)}
                    placeholder="Membentuk Generasi Qur'ani, Cerdas, dan Berakhlak Mulia"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Footer About / Keterangan Kaki</label>
                  <textarea
                    rows={2}
                    value={formData.footerAbout || ''}
                    onChange={(e) => handleFieldChange('footerAbout', e.target.value)}
                    placeholder="Portal resmi Penerimaan Peserta Didik Baru Online..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FORMULIR PENDAFTARAN WIZARD ================= */}
      {activeTab === 'formulir' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                2. Pengaturan Konten Alur Formulir Pendaftaran (Wizard 4 Langkah &amp; Review)
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Kelola instruksi, petunjuk NIK, aturan berkas (KK, Akta, NISN, Ijazah TK), dan pakta integritas.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('formulir')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveTab('Formulir Pendaftaran')}
                className="btn-theme-primary !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Teks CMS</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Langkah 1 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Langkah 1: Data Calon Siswa (NIK, KK, KIP)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Langkah 1</label>
                  <input
                    type="text"
                    value={formData.step1Title || ''}
                    onChange={(e) => handleFieldChange('step1Title', e.target.value)}
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Langkah 1</label>
                  <input
                    type="text"
                    value={formData.step1Subtitle || ''}
                    onChange={(e) => handleFieldChange('step1Subtitle', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Pesan Petunjuk / Notice Langkah 1</label>
                  <input
                    type="text"
                    value={formData.step1Notice || ''}
                    onChange={(e) => handleFieldChange('step1Notice', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Langkah 2 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Langkah 2: Data Orang Tua / Wali (Status Hidup/Meninggal)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Langkah 2</label>
                  <input
                    type="text"
                    value={formData.step2Title || ''}
                    onChange={(e) => handleFieldChange('step2Title', e.target.value)}
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Langkah 2</label>
                  <input
                    type="text"
                    value={formData.step2Subtitle || ''}
                    onChange={(e) => handleFieldChange('step2Subtitle', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Pesan Petunjuk / Notice Langkah 2</label>
                  <input
                    type="text"
                    value={formData.step2Notice || ''}
                    onChange={(e) => handleFieldChange('step2Notice', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Langkah 3 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Langkah 3: Data Alamat Domisili (RT/RW, Desa, Kecamatan, Kab, Kode Pos)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Langkah 3</label>
                  <input
                    type="text"
                    value={formData.step3Title || ''}
                    onChange={(e) => handleFieldChange('step3Title', e.target.value)}
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Langkah 3</label>
                  <input
                    type="text"
                    value={formData.step3Subtitle || ''}
                    onChange={(e) => handleFieldChange('step3Subtitle', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Pesan Petunjuk / Notice Langkah 3</label>
                  <input
                    type="text"
                    value={formData.step3Notice || ''}
                    onChange={(e) => handleFieldChange('step3Notice', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Langkah 4 */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Langkah 4: Unggah Berkas (KK, Akta, NISN, Ijazah TK Kondisional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Langkah 4</label>
                  <input
                    type="text"
                    value={formData.step4Title || ''}
                    onChange={(e) => handleFieldChange('step4Title', e.target.value)}
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Langkah 4</label>
                  <input
                    type="text"
                    value={formData.step4Subtitle || ''}
                    onChange={(e) => handleFieldChange('step4Subtitle', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Pesan Petunjuk / Notice Langkah 4</label>
                  <textarea
                    rows={2}
                    value={formData.step4Notice || ''}
                    onChange={(e) => handleFieldChange('step4Notice', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Langkah 5 Review & Pakta Integritas */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Langkah 5: Tinjauan Akhir &amp; Pakta Integritas Wali Murid
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Judul Review</label>
                  <input
                    type="text"
                    value={formData.reviewTitle || ''}
                    onChange={(e) => handleFieldChange('reviewTitle', e.target.value)}
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Review</label>
                  <input
                    type="text"
                    value={formData.reviewSubtitle || ''}
                    onChange={(e) => handleFieldChange('reviewSubtitle', e.target.value)}
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Teks Pernyataan Pakta Integritas Wali Murid</label>
                  <textarea
                    rows={3}
                    value={formData.paktaIntegritasTeks || ''}
                    onChange={(e) => handleFieldChange('paktaIntegritasTeks', e.target.value)}
                    placeholder="Dengan ini saya menyatakan dengan sesungguhnya..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: HALAMAN SUKSES ================= */}
      {activeTab === 'sukses' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                3. Pengaturan Konten Halaman Sukses &amp; Konfirmasi
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Mengontrol narasi ucapan terima kasih, panduan langkah lanjutan, dan informasi observasi santri.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('sukses')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveTab('Halaman Sukses')}
                className="btn-theme-primary !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Teks CMS</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Judul Halaman Sukses</label>
                <input
                  type="text"
                  value={formData.successTitle || ''}
                  onChange={(e) => handleFieldChange('successTitle', e.target.value)}
                  placeholder="Alhamdulillah, Formulir Telah Diterima!"
                  className="m3-input bg-white text-sm font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Subjudul Halaman Sukses</label>
                <textarea
                  rows={2}
                  value={formData.successSubtitle || ''}
                  onChange={(e) => handleFieldChange('successSubtitle', e.target.value)}
                  placeholder="Data calon santri telah masuk ke sistem panitia..."
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Pesan Panduan No. Registrasi &amp; PIN</label>
                <input
                  type="text"
                  value={formData.successNotice || ''}
                  onChange={(e) => handleFieldChange('successNotice', e.target.value)}
                  placeholder="Catat dan simpan Nomor Pendaftaran serta PIN akun Anda..."
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 1 — Judul</label>
                <input
                  type="text"
                  value={formData.successStep1Title || ''}
                  onChange={(e) => handleFieldChange('successStep1Title', e.target.value)}
                  placeholder="1. Cetak Lembar Bukti Registrasi"
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 2 — Judul</label>
                <input
                  type="text"
                  value={formData.successStep2Title || ''}
                  onChange={(e) => handleFieldChange('successStep2Title', e.target.value)}
                  placeholder="2. Hadir Observasi Ramah Anak"
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 1 — Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.successStep1Desc || ''}
                  onChange={(e) => handleFieldChange('successStep1Desc', e.target.value)}
                  placeholder="Unduh atau cetak lembar bukti pendaftaran..."
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 2 — Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.successStep2Desc || ''}
                  onChange={(e) => handleFieldChange('successStep2Desc', e.target.value)}
                  placeholder="Ajak calon ananda ke madrasah sesuai jadwal..."
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 3 — Judul</label>
                <input
                  type="text"
                  value={formData.successStep3Title || ''}
                  onChange={(e) => handleFieldChange('successStep3Title', e.target.value)}
                  placeholder="3. Pantau Hasil Seleksi & Biaya"
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Teks Bantuan (bawah langkah)</label>
                <input
                  type="text"
                  value={formData.successHelpText || ''}
                  onChange={(e) => handleFieldChange('successHelpText', e.target.value)}
                  placeholder="Butuh bantuan teknis atau informasi jadwal observasi?..."
                  className="m3-input bg-white text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 mb-1">Langkah 3 — Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.successStep3Desc || ''}
                  onChange={(e) => handleFieldChange('successStep3Desc', e.target.value)}
                  placeholder="Masuk secara berkala ke Dashboard Wali Murid..."
                  className="m3-input bg-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DOKUMEN CETAK KOP & PENGESAHAN ================= */}
      {activeTab === 'dokumen' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                4. Pengaturan Dokumen Cetak KOP &amp; Pengesahan
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Konfigurasi KOP surat resmi Kementerian Agama, status akreditasi, titimangsa tanda tangan, dan ketentuan observasi.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('dokumen')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveTab('Dokumen Cetak KOP')}
                className="btn-theme-primary !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Teks CMS</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-700" />
                <span>KOP Surat Resmi Madrasah</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Instansi Induk (Baris 1 KOP)</label>
                  <input
                    type="text"
                    value={formData.kopInstansiAtas || ''}
                    onChange={(e) => handleFieldChange('kopInstansiAtas', e.target.value)}
                    placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Nama Satuan Madrasah (Baris 2 KOP)</label>
                  <input
                    type="text"
                    value={formData.kopNamaMadrasah || ''}
                    onChange={(e) => handleFieldChange('kopNamaMadrasah', e.target.value)}
                    placeholder="MADRASAH IBTIDAIYAH ISHLAHUL UMMAH"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Status Akreditasi, NSM, NPSN (Baris 3 KOP)</label>
                  <input
                    type="text"
                    value={formData.kopStatusAkreditasi || ''}
                    onChange={(e) => handleFieldChange('kopStatusAkreditasi', e.target.value)}
                    placeholder="TERAKREDITASI A • NSM: 111235150097 • NPSN: 60717039"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Alamat Lengkap &amp; Kontak (Baris 4 KOP)</label>
                  <input
                    type="text"
                    value={formData.kopAlamat || ''}
                    onChange={(e) => handleFieldChange('kopAlamat', e.target.value)}
                    placeholder="Pranti, Kec. Sedati, Kab. Sidoarjo, Jawa Timur 61253 • Telp/WA: 085196677872"
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Pengesahan, Titimangsa &amp; Petunjuk Observasi</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Kota Titimangsa</label>
                  <input
                    type="text"
                    value={formData.cetakKotaTitimangsa || ''}
                    onChange={(e) => handleFieldChange('cetakKotaTitimangsa', e.target.value)}
                    placeholder="Sidoarjo"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={formData.cetakJabatanPenandatangan || ''}
                    onChange={(e) => handleFieldChange('cetakJabatanPenandatangan', e.target.value)}
                    placeholder="Ketua Panitia SPMB"
                    className="m3-input bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Nama Pejabat</label>
                  <input
                    type="text"
                    value={formData.cetakNamaPenandatangan || ''}
                    onChange={(e) => handleFieldChange('cetakNamaPenandatangan', e.target.value)}
                    placeholder="Astutik, S.Pd"
                    className="m3-input bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">NIP Pejabat Penandatangan</label>
                  <input
                    type="text"
                    value={formData.cetakNipPenandatangan || ''}
                    onChange={(e) => handleFieldChange('cetakNipPenandatangan', e.target.value)}
                    placeholder="197805122005011003"
                    className="m3-input bg-white text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">Petunjuk / Ketentuan Observasi</label>
                  <textarea
                    rows={3}
                    value={formData.cetakKetentuanObservasi || ''}
                    onChange={(e) => handleFieldChange('cetakKetentuanObservasi', e.target.value)}
                    placeholder="1. Membawa formulir bukti pendaftaran ini..."
                    className="m3-input bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: DASHBOARD WALI & BIAYA ================= */}
      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                5. Dashboard Wali Murid &amp; Rincian Biaya Pendaftaran
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Kelola kartu-kartu menu portal wali murid serta rincian biaya administrasi &amp; seragam secara lengkap.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('dashboard')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Rincian Biaya */}
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5 text-emerald-800" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 font-heading">
                  Rincian Biaya &amp; Administrasi Resmi
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Ubah nominal dan item biaya formulir, rapor, buku tabungan, SPP, paket perlengkapan seragam siswa laki-laki &amp; perempuan, serta ketentuan pembayaran bertahap.
                </p>
              </div>

              {onOpenRincianBiayaModal && (
                <button
                  type="button"
                  onClick={onOpenRincianBiayaModal}
                  className="btn-theme-primary !py-2.5 !px-4 !text-xs font-bold flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Buka Editor Rincian Biaya Detail</span>
                </button>
              )}
            </div>

            {/* Card 2: Dashboard Wali Murid */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                  <Layout className="w-5 h-5 text-stone-800" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 font-heading">
                  Tata Letak &amp; Teks Dashboard Wali Murid
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Ubah judul sambutan portal, kartu highlight informasi pendaftaran, judul kartu isi formulir, lacak seleksi, unduh bukti cetak, dan helpdesk WhatsApp.
                </p>
              </div>

              {onOpenDashboardWaliModal && (
                <button
                  type="button"
                  onClick={onOpenDashboardWaliModal}
                  className="btn-theme-secondary !py-2.5 !px-4 !text-xs font-bold flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <Layout className="w-4 h-4 text-emerald-700" />
                  <span>Buka Editor Dashboard Wali Detail</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: GALERI & TESTIMONI ================= */}
      {activeTab === 'galeri' && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 font-heading">
                6. Galeri Foto &amp; Testimoni Wali Murid
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Foto galeri dan kutipan testimoni tampil di halaman depan hanya bila ada isinya.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetTab('galeri')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bagian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveTab('Galeri & Testimoni')}
                className="btn-theme-primary !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Teks CMS</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Galeri */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-emerald-700" />
                <span>Galeri Foto Madrasah</span>
              </h4>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">URL Foto (satu URL per baris)</label>
                <textarea
                  rows={5}
                  value={(formData.galeriFotoUrl || []).join('\n')}
                  onChange={(e) =>
                    handleFieldChange(
                      'galeriFotoUrl',
                      e.target.value.split('\n').map((u) => u.trim()).filter((u) => u.length > 0)
                    )
                  }
                  placeholder={'https://.../foto-kegiatan-1.jpg\nhttps://.../foto-kegiatan-2.jpg'}
                  className="m3-input bg-white text-xs leading-relaxed"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Tempel alamat gambar (mis. tautan berbagi dari Google Drive). Kosong = seksi galeri tidak tampil di halaman depan.
                </p>
              </div>
            </div>

            {/* Testimoni */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-emerald-700" />
                <span>Testimoni Wali Murid</span>
              </h4>
              <div className="space-y-3">
                {testiList.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-xl border border-stone-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">Testimoni {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTesti(idx)}
                        className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.nama}
                        onChange={(e) => updateTesti(idx, { nama: e.target.value })}
                        placeholder="Nama wali murid"
                        className="m3-input bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={item.peran}
                        onChange={(e) => updateTesti(idx, { peran: e.target.value })}
                        placeholder="Peran (mis. Wali Murid Kelas 1)"
                        className="m3-input bg-white text-xs"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={item.kutipan}
                      onChange={(e) => updateTesti(idx, { kutipan: e.target.value })}
                      placeholder="Kutipan testimoni..."
                      className="m3-input bg-white text-xs leading-relaxed"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTesti}
                  className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer"
                >
                  + Tambah Testimoni
                </button>
                <p className="text-[11px] text-stone-500">
                  Gunakan kutipan asli dari wali murid. Kosong = seksi testimoni tidak tampil di halaman depan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
