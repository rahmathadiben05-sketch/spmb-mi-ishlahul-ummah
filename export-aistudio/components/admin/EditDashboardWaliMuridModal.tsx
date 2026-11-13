'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  RotateCcw,
  LayoutDashboard,
  Sparkles,
  Layers,
  FileText,
  User,
  Search,
  Printer,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { DashboardWaliMuridConfig, SchoolSettings } from '@/lib/types';
import { DEFAULT_DASHBOARD_WALI_MURID } from '@/lib/storage';

interface EditDashboardWaliMuridModalProps {
  isOpen: boolean;
  settings: SchoolSettings;
  onClose: () => void;
  onSave: (updatedConfig: DashboardWaliMuridConfig) => void;
}

type TabKey = 'header' | 'highlight' | 'cards' | 'helpdesk';

export const EditDashboardWaliMuridModal: React.FC<EditDashboardWaliMuridModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const initialConfig: DashboardWaliMuridConfig = {
    ...DEFAULT_DASHBOARD_WALI_MURID,
    ...(settings.dashboardWaliMuridConfig || {}),
  };

  const [activeTab, setActiveTab] = useState<TabKey>('header');
  const [config, setConfig] = useState<DashboardWaliMuridConfig>(initialConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResetDefault = () => {
    if (confirm('Kembalikan semua tampilan teks Dashboard Wali Murid ke standar default?')) {
      setConfig({ ...DEFAULT_DASHBOARD_WALI_MURID });
    }
  };

  const handleSave = () => {
    onSave(config);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#0D3B2E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 font-heading block">
                Pengaturan Madrasah &bull; Antarmuka Wali Murid
              </span>
              <h2 className="text-lg sm:text-xl font-black font-heading leading-tight">
                Edit Konten Dashboard Wali Murid
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                Sesuaikan sapaan, banner highlight, 4 kartu fitur, dan pesan bantuan helpdesk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 overflow-x-auto shrink-0 px-4 sm:px-6 gap-1 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'header'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>Sapaan &amp; Header</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlight')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'highlight'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>Banner Utama Biaya</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>4 Kartu Fitur</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('helpdesk')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'helpdesk'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>Kontak Bantuan</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: HEADER & SAPAAN */}
          {activeTab === 'header' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs">
                Gunakan variabel <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono font-bold">{'{studentName}'}</code> untuk nama calon santri, dan <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono font-bold">{'{TA}'}</code> untuk tahun ajaran aktif.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 block">Badge Header Navbar</label>
                  <input
                    type="text"
                    value={config.portalBadge || ''}
                    onChange={(e) => setConfig({ ...config, portalBadge: e.target.value })}
                    placeholder="Dashboard Wali Murid"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 block">Subjudul Navbar</label>
                  <input
                    type="text"
                    value={config.portalSubtitle || ''}
                    onChange={(e) => setConfig({ ...config, portalSubtitle: e.target.value })}
                    placeholder="Portal Resmi SPMB TA {TA}"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Label Badge Status Akun</label>
                <input
                  type="text"
                  value={config.verifiedBadge || ''}
                  onChange={(e) => setConfig({ ...config, verifiedBadge: e.target.value })}
                  placeholder="Akun Terverifikasi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">
                  Teks Penjelasan Sapaan Wali Murid
                </label>
                <textarea
                  rows={3}
                  value={config.welcomeSubtitle || ''}
                  onChange={(e) => setConfig({ ...config, welcomeSubtitle: e.target.value })}
                  placeholder="Wali Murid dari calon ananda {studentName}. Seluruh proses pendaftaran dan informasi biaya dapat Anda kelola secara aman di bawah ini."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BANNER UTAMA BIAYA */}
          {activeTab === 'highlight' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Badge Banner Highlight</label>
                <input
                  type="text"
                  value={config.highlightBadge || ''}
                  onChange={(e) => setConfig({ ...config, highlightBadge: e.target.value })}
                  placeholder="Fitur Khusus Wali Murid"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Judul Banner Utama</label>
                <input
                  type="text"
                  value={config.highlightTitle || ''}
                  onChange={(e) => setConfig({ ...config, highlightTitle: e.target.value })}
                  placeholder="Informasi Pendaftaran & Rincian Biaya Resmi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Deskripsi Banner</label>
                <textarea
                  rows={3}
                  value={config.highlightDeskripsi || ''}
                  onChange={(e) => setConfig({ ...config, highlightDeskripsi: e.target.value })}
                  placeholder="Lihat rincian lengkap biaya administrasi pendaftaran (formulir, rapor, tabungan, SPP), paket perlengkapan siswa laki-laki & perempuan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Teks Tombol Aksi Banner</label>
                <input
                  type="text"
                  value={config.highlightBtnText || ''}
                  onChange={(e) => setConfig({ ...config, highlightBtnText: e.target.value })}
                  placeholder="Buka Informasi Pendaftaran"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 3: 4 KARTU FITUR */}
          {activeTab === 'cards' && (
            <div className="space-y-5">
              
              {/* Kartu 1: Informasi Pendaftaran */}
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-extrabold text-xs text-emerald-950">Kartu 1: Informasi Pendaftaran</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Judul Kartu</label>
                    <input
                      type="text"
                      value={config.card1Title || ''}
                      onChange={(e) => setConfig({ ...config, card1Title: e.target.value })}
                      placeholder="Informasi Pendaftaran"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Teks Link Tombol</label>
                    <input
                      type="text"
                      value={config.card1BtnText || ''}
                      onChange={(e) => setConfig({ ...config, card1BtnText: e.target.value })}
                      placeholder="Buka Rincian Biaya"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={config.card1Deskripsi || ''}
                    onChange={(e) => setConfig({ ...config, card1Deskripsi: e.target.value })}
                    placeholder="Rincian biaya administrasi wajib, perlengkapan siswa putra & putri, serta panduan pembayaran bertahap."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Kartu 2: Pengisian Formulir */}
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-800" />
                  <h4 className="font-extrabold text-xs text-amber-950">Kartu 2: Pengisian Biodata Formulir</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Judul (Saat Draft/Belum Submit)</label>
                    <input
                      type="text"
                      value={config.card2TitleDraft || ''}
                      onChange={(e) => setConfig({ ...config, card2TitleDraft: e.target.value })}
                      placeholder="Lengkapi Formulir 4 Langkah"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Judul (Saat Sudah Submit)</label>
                    <input
                      type="text"
                      value={config.card2TitleSubmitted || ''}
                      onChange={(e) => setConfig({ ...config, card2TitleSubmitted: e.target.value })}
                      placeholder="Lihat / Edit Formulir"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={config.card2Deskripsi || ''}
                    onChange={(e) => setConfig({ ...config, card2Deskripsi: e.target.value })}
                    placeholder="Kelola data santri, identitas orang tua, alamat tempat tinggal, dan unggah berkas (KK & Akta)."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Kartu 3: Lacak Status Seleksi */}
              <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-teal-800" />
                  <h4 className="font-extrabold text-xs text-teal-950">Kartu 3: Lacak Status Seleksi</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Judul Kartu</label>
                    <input
                      type="text"
                      value={config.card3Title || ''}
                      onChange={(e) => setConfig({ ...config, card3Title: e.target.value })}
                      placeholder="Lacak Status Seleksi"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Teks Link Tombol</label>
                    <input
                      type="text"
                      value={config.card3BtnText || ''}
                      onChange={(e) => setConfig({ ...config, card3BtnText: e.target.value })}
                      placeholder="Lacak Progres"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={config.card3Deskripsi || ''}
                    onChange={(e) => setConfig({ ...config, card3Deskripsi: e.target.value })}
                    placeholder="Pantau timeline progres verifikasi berkas, jadwal observasi ramah anak, dan hasil pengumuman resmi."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Kartu 4: Cetak Bukti */}
              <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-800" />
                  <h4 className="font-extrabold text-xs text-sky-950">Kartu 4: Cetak Bukti Pendaftaran</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Judul Kartu</label>
                    <input
                      type="text"
                      value={config.card4Title || ''}
                      onChange={(e) => setConfig({ ...config, card4Title: e.target.value })}
                      placeholder="Cetak Lembar Bukti"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700">Teks Link Tombol</label>
                    <input
                      type="text"
                      value={config.card4BtnText || ''}
                      onChange={(e) => setConfig({ ...config, card4BtnText: e.target.value })}
                      placeholder="Cetak Sekarang"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={config.card4Deskripsi || ''}
                    onChange={(e) => setConfig({ ...config, card4Deskripsi: e.target.value })}
                    placeholder="Unduh atau cetak bukti pendaftaran resmi ber-barcode untuk dibawa saat observasi di madrasah."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: HELPDESK & KONTAK */}
          {activeTab === 'helpdesk' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Judul Box Konsultasi</label>
                <input
                  type="text"
                  value={config.helpdeskTitle || ''}
                  onChange={(e) => setConfig({ ...config, helpdeskTitle: e.target.value })}
                  placeholder="Konsultasi Panitia SPMB {namaMadrasah}"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Deskripsi Bantuan WhatsApp</label>
                <textarea
                  rows={3}
                  value={config.helpdeskDeskripsi || ''}
                  onChange={(e) => setConfig({ ...config, helpdeskDeskripsi: e.target.value })}
                  placeholder="Hubungi panitia via WhatsApp resmi ({kontakWhatsapp}) jika membutuhkan bantuan seputar pendaftaran."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 block">Teks Tombol Chat WhatsApp</label>
                <input
                  type="text"
                  value={config.helpdeskBtnText || ''}
                  onChange={(e) => setConfig({ ...config, helpdeskBtnText: e.target.value })}
                  placeholder="Chat Panitia SPMB"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
