'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileDown,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SchoolSettings, Wave } from '@/lib/types';
import { PrintableBlankForm } from '@/components/print/PrintableBlankForm';
import { PrintablePanduan } from '@/components/print/PrintablePanduan';

interface LandingDownloadsProps {
  settings: SchoolSettings;
  waves?: Wave[];
  onStartRegistration?: () => void;
}

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  fileType: string;
  filename: string;
  actionType: 'brosur' | 'form_offline' | 'guide';
}

export const LandingDownloads: React.FC<LandingDownloadsProps> = ({
  settings,
  waves,
  onStartRegistration,
}) => {
  const [previewItem, setPreviewItem] = useState<DownloadItem | null>(null);
  const [showBlankForm, setShowBlankForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Judul + deskripsi item unduhan bisa diedit admin dari Pusat CMS
  // (Paket C, T-03/S-02): id + aksi unduh tiap item tetap dari kode,
  // supaya tombol brosur/formulir/panduan tidak bisa rusak dari CMS.
  // Placeholder {TA} pada judul diisi tahun ajaran aktif.
  const cmsItemUnduhan = (id: string) =>
    (settings.cmsContent?.downloadsItems || []).find((it) => it.id === id);
  const judulUnduhan = (id: string, fallback: string) =>
    (cmsItemUnduhan(id)?.title || fallback).replace('{TA}', settings.activeAcademicYear);
  const deskripsiUnduhan = (id: string, fallback: string) =>
    cmsItemUnduhan(id)?.description || fallback;

  const downloadList: DownloadItem[] = [
    {
      id: 'download-brosur',
      title: judulUnduhan('download-brosur', `Brosur Resmi SPMB TA ${settings.activeAcademicYear}`),
      description: deskripsiUnduhan(
        'download-brosur',
        'Brosur informasi lengkap penerimaan murid baru, visi madrasah, program unggulan tahfidz, fasilitas belajar, dan alur pendaftaran santri baru.'
      ),
      tag: 'Brosur & Pamflet',
      badgeBg: 'bg-[#EEFAF4]',
      badgeText: 'text-[#065F46]',
      badgeBorder: 'border-[#A7F3D0]',
      fileType: 'PDF',
      filename: `Brosur-SPMB-${settings.activeAcademicYear.replace(/\//g, '-')}.pdf`,
      actionType: 'brosur',
    },
    {
      id: 'download-formulir',
      title: judulUnduhan('download-formulir', 'Formulir Pendaftaran Fisik / Offline SPMB'),
      description: deskripsiUnduhan(
        'download-formulir',
        'Formulir cetak offline bagi calon wali murid yang ingin mengisi dan mengumpulkan berkas secara langsung ke sekretariat panitia madrasah.'
      ),
      tag: 'Formulir Pendaftaran',
      badgeBg: 'bg-[#F0F9FF]',
      badgeText: 'text-[#0284C7]',
      badgeBorder: 'border-[#BAE6FD]',
      fileType: 'Halaman cetak',
      filename: `Formulir-Pendaftaran-Fisik-${settings.activeAcademicYear.replace(/\//g, '-')}.pdf`,
      actionType: 'form_offline',
    },
    {
      id: 'download-panduan',
      title: judulUnduhan('download-panduan', 'Panduan Tata Cara Pendaftaran Online & PIN 6 Digit'),
      description: deskripsiUnduhan(
        'download-panduan',
        'Petunjuk teknis langkah demi langkah mulai dari membuat PIN 6 digit, mengisi biodata, hingga cetak bukti pendaftaran resmi.'
      ),
      tag: 'Panduan & Petunjuk Teknis',
      badgeBg: 'bg-[#F5F3FF]',
      badgeText: 'text-[#7C3AED]',
      badgeBorder: 'border-[#DDD6FE]',
      fileType: 'Halaman cetak',
      filename: `Panduan-Pendaftaran-Online-SPMB.pdf`,
      actionType: 'guide',
    },
  ];

  const handleDownload = (item: DownloadItem) => {
    // Panduan langkah-demi-langkah: buka modal panduan dengan screenshot (bukan halaman generik)
    if (item.actionType === 'guide') {
      setShowGuide(true);
      return;
    }

    // Formulir fisik/offline: buka modal formulir kosong siap cetak (bukan halaman generik)
    if (item.actionType === 'form_offline') {
      setShowBlankForm(true);
      return;
    }

    if (item.actionType === 'brosur' && settings.brosurDigitalUrl) {
      const link = document.createElement('a');
      link.href = settings.brosurDigitalUrl;
      link.download = item.filename;
      link.click();
      return;
    }

    // Generate beautifully styled printable HTML window ready for PDF save/print
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${item.title} - ${settings.namaMadrasah}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1c1917; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #065F46; padding-bottom: 12px; margin-bottom: 20px; }
          .school { font-size: 20px; font-weight: 800; color: #065F46; margin: 0; text-transform: uppercase; }
          .doc-type { font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 16px; font-weight: 800; margin: 16px 0 8px 0; color: #1c1917; }
          .box { background: #f7f4ec; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; }
          .btn-print { background: #065F46; color: #fff; border: none; padding: 10px 20px; font-weight: 700; border-radius: 8px; cursor: pointer; font-size: 13px; margin-bottom: 20px; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan ke PDF</button>
        </div>
        <div class="header">
          <div class="doc-type">Dokumen Resmi SPMB Online</div>
          <h1 class="school">${settings.namaMadrasah}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #78716c;">${settings.alamatMadrasah} | WA: ${settings.kontakWhatsapp}</p>
        </div>
        <h2 class="title">${item.title}</h2>
        <p style="font-size: 13px; color: #57534e;">${item.description}</p>
        <div class="box">
          <h3 style="margin-top:0; font-size: 13px; color: #065f46;">Ketentuan & Petunjuk Penting:</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            <li>Usia calon peserta didik baru minimal 6 tahun per 1 Juli tahun ajaran berjalan.</li>
            <li>Menyiapkan dokumen fisik asli untuk verifikasi: Kartu Keluarga, Akta Kelahiran, dan Pas Foto.</li>
            <li>Pendaftaran dapat diselesaikan secara online melalui portal resmi madrasah.</li>
            <li>Sekretariat SPMB buka setiap Senin - Sabtu pukul 07.30 - 14.00 WIB.</li>
          </ul>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
  };

  if (settings.sectionVisibility?.showDownloads === false) {
    return null;
  }

  const cms = settings.cmsContent || {};

  return (
    <section
      id="pusat-unduhan"
      className="py-10 sm:py-14 bg-white border-b border-[#E7E5E4] relative overflow-hidden"
    >
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
        style={{
          backgroundSize: '32px 32px',
          backgroundImage: 'radial-gradient(#1c1917 0.75px, transparent 0.75px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header (matching spmb.miwahati.sch.id) */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <FileDown className="w-3.5 h-3.5" />
            <span>Pusat Berkas &amp; Informasi</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            {cms.downloadsJudul || 'Pusat Unduhan & Brosur SPMB'}
          </h2>
          <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
            {cms.downloadsDeskripsi || 'Lihat brosur resmi, cetak formulir offline, dan baca panduan pendaftaran untuk kemudahan Anda.'}
          </p>
          <div
            className="h-1.5 w-16 mx-auto mt-4.5 rounded-full"
            style={{ background: '#B45309' }}
          />
        </div>

        {/* 3 Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {downloadList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-6 sm:p-7 border border-[#E7E5E4] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
            >
              <div className="space-y-4 flex-1">
                {/* Header Tag & File Type */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${item.badgeBg} ${item.badgeText} ${item.badgeBorder}`}
                  >
                    {item.tag}
                  </span>
                  <span className="text-xs text-[#A8A29E] font-medium font-mono">
                    {item.fileType}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#1C1917] group-hover:text-[#065F46] transition leading-snug font-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78716C] line-clamp-3 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-5 mt-5 border-t border-[#F5F5F4] flex items-center justify-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="btn-theme-primary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title={item.actionType === 'brosur' && settings.brosurDigitalUrl ? 'Unduh Berkas Langsung' : 'Lihat / Cetak Berkas'}
                  >
                    {item.actionType === 'brosur' && settings.brosurDigitalUrl ? (
                      <Download className="w-3.5 h-3.5" />
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {item.actionType === 'brosur' && settings.brosurDigitalUrl ? 'Unduh' : 'Lihat / Cetak'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="btn-theme-secondary !py-2 !px-2.5 text-xs font-bold flex items-center text-[#57534E] hover:text-[#065F46] cursor-pointer"
                    title="Lihat Detail & Pratinjau"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Pratinjau Berkas */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 border border-[#E7E5E4] shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F7F4EC] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEFAF4] text-[#065F46] flex items-center justify-center border border-[#A7F3D0]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#065F46] font-heading">
                  Pratinjau Dokumen
                </span>
                <h3 className="text-lg font-bold text-[#1C1917] font-heading leading-tight">
                  {previewItem.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
              {previewItem.description}
            </p>

            <div className="p-4 rounded-2xl bg-[#F7F4EC] border border-[#E7E5E4] space-y-2 text-xs">
              <div className="flex justify-between text-[#57534E]">
                <span>Format Dokumen:</span>
                <strong className="text-[#1C1917]">{previewItem.fileType}</strong>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Tahun Ajaran:</span>
                <strong className="text-[#065F46]">{settings.activeAcademicYear}</strong>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Lembaga:</span>
                <strong className="text-[#1C1917]">{settings.namaMadrasah}</strong>
              </div>
              {previewItem.actionType !== 'brosur' && (
                <p className="text-[#57534E] pt-1">
                  Dokumen ini dibuka sebagai halaman cetak — simpan sebagai PDF lewat tombol cetak di halaman tersebut.
                </p>
              )}
              {previewItem.actionType === 'brosur' && !settings.brosurDigitalUrl && (
                <p className="text-[#57534E] pt-1">
                  Berkas brosur digital resmi belum diunggah panitia — yang dibuka adalah halaman cetak brosur.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="btn-theme-secondary !py-2.5 !px-4 text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownload(previewItem);
                  setPreviewItem(null);
                }}
                className="btn-theme-primary !py-2.5 !px-5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {previewItem.actionType === 'brosur' && settings.brosurDigitalUrl ? (
                  <Download className="w-3.5 h-3.5" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>
                  {previewItem.actionType === 'brosur' && settings.brosurDigitalUrl ? 'Unduh Sekarang' : 'Lihat / Cetak'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Formulir Kosong (Offline) */}
      {showBlankForm && (
        <PrintableBlankForm
          settings={settings}
          waves={waves}
          onClose={() => setShowBlankForm(false)}
        />
      )}
      {/* Modal Panduan Pendaftaran Online (langkah demi langkah + screenshot) */}
      {showGuide && (
        <PrintablePanduan settings={settings} onClose={() => setShowGuide(false)} />
      )}
    </section>
  );
};
