'use client';

import React from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  User,
  Info,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  School,
  AlertCircle,
} from 'lucide-react';
import { SchoolSettings, WaliMuridSession } from '@/lib/types';
import { DEFAULT_RINCIAN_BIAYA, DEFAULT_SETTINGS, getSchoolSettings } from '@/lib/storage';

interface InformasiPendaftaranViewProps {
  session?: WaliMuridSession | null;
  onBack?: () => void;
  isModal?: boolean;
  settings?: SchoolSettings;
}

export const InformasiPendaftaranView: React.FC<InformasiPendaftaranViewProps> = ({
  session,
  onBack,
  isModal = false,
  settings: propSettings,
}) => {
  // Use provided settings or fallback to stored settings
  const currentSettings = propSettings || (typeof window !== 'undefined' ? getSchoolSettings() : DEFAULT_SETTINGS);
  const rincian = currentSettings.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number) => {
    return `Rp${(Number(val) || 0).toLocaleString('id-ID')}`;
  };

  // Placeholder {biayaPendaftaran} pada teks rincian (catatan
  // administrasi & ketentuan pembayaran) diisi dari settings live —
  // pola yang sama seperti FAQ (LandingFaq). Tanpa ini, teks default
  // "Rp {biayaPendaftaran}" akan tampil mentah.
  const isiBiaya = (teks?: string) =>
    (teks || '').replaceAll(
      '{biayaPendaftaran}',
      (Number(currentSettings.biayaPendaftaran) || 0).toLocaleString('id-ID')
    );

  // Dynamic calculations
  const itemsAdmin = rincian.itemsAdministrasi || [];
  const itemsPutri = rincian.itemsPerempuan || [];
  const itemsPutra = rincian.itemsLakiLaki || [];

  const subtotalAdmin = itemsAdmin.reduce((sum, item) => sum + (Number(item.biaya) || 0), 0);
  const subtotalPutri = itemsPutri.reduce((sum, item) => sum + (Number(item.biaya) || 0), 0);
  const subtotalPutra = itemsPutra.reduce((sum, item) => sum + (Number(item.biaya) || 0), 0);

  const grandTotalPutri = subtotalAdmin + subtotalPutri;
  const grandTotalPutra = subtotalAdmin + subtotalPutra;

  return (
    <div className={`w-full max-w-4xl mx-auto ${isModal ? '' : 'px-4 py-8 sm:py-12'}`}>
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xl overflow-hidden print:shadow-none print:border-none">
        
        {/* Header Banner */}
        <div className="bg-[#0D382B] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              {currentSettings.logoMadrasahUrl ? (
                <img
                  src={currentSettings.logoMadrasahUrl}
                  alt={`Logo ${currentSettings.namaMadrasah}`}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-sm shrink-0">
                  <School className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 font-heading block">
                  Dokumen Resmi SPMB TA {currentSettings.activeAcademicYear}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading leading-tight">
                  {rincian.judulDokumen || 'Informasi Pendaftaran'}
                </h1>
                <p className="text-xs text-white/80 mt-0.5">
                  {currentSettings.namaMadrasah} &mdash; {rincian.subjudulDokumen || 'Rincian Administrasi & Perlengkapan Siswa Baru'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition border border-white/20 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              )}
            </div>
          </div>

          {/* Logged in Applicant Identity Strip */}
          {session && (
            <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/80">Akun Wali Murid:</span>
                <strong className="text-white">{session.parentName || 'Wali Murid'}</strong>
                <span className="text-white/40">&bull;</span>
                <span className="text-white/80">Calon Siswa:</span>
                <strong className="text-amber-200">{session.studentName}</strong>
              </div>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] bg-black/20 px-3 py-1 rounded-full border border-white/10">
                <span className="text-emerald-300">No. Registrasi:</span>
                <span className="font-bold text-white">{session.nomorPendaftaran}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 text-stone-800 text-sm">

          {/* Intro Notice */}
          <div className="p-4 rounded-2xl bg-[#EEFAF4] border border-[#A7F3D0] flex items-start gap-3 text-xs leading-relaxed text-[#065F46]">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Informasi Resmi untuk Wali Murid Terdaftar</p>
              <p className="mt-0.5 text-emerald-900/80">
                {rincian.introPesan ||
                  `Berikut adalah rincian resmi administrasi pendaftaran dan paket perlengkapan siswa baru ${currentSettings.namaMadrasah} Tahun Ajaran ${currentSettings.activeAcademicYear}.`}
              </p>
            </div>
          </div>

          {/* BAGIAN A: Administrasi Pendaftaran */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center font-heading">
                  A
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 font-heading">
                  {rincian.judulAdministrasi || 'Administrasi Pendaftaran'}
                </h2>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                {formatRupiah(subtotalAdmin)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[11px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Komponen Administrasi</th>
                    <th className="py-3 px-4 text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {itemsAdmin.map((item, index) => (
                    <tr key={item.id} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-4 text-center text-stone-400 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-4 text-stone-900 font-semibold">{item.nama}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-stone-800">
                        {formatRupiah(item.biaya)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F7F4EC] border-t border-stone-200 font-extrabold text-stone-900 text-xs sm:text-sm">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-right">
                      Total administrasi:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800 font-black text-sm sm:text-base">
                      {formatRupiah(subtotalAdmin)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {rincian.catatanAdministrasi && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{isiBiaya(rincian.catatanAdministrasi)}</span>
              </div>
            )}
          </div>

          {/* BAGIAN B & C: Dua Kolom Perlengkapan (Perempuan & Laki-laki) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* BAGIAN B: Perlengkapan Siswa Perempuan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center font-heading">
                    B
                  </span>
                  <h2 className="text-sm sm:text-base font-extrabold text-stone-900 font-heading">
                    {rincian.judulPerempuan || 'Perlengkapan Siswa Perempuan'}
                  </h2>
                </div>
                <span className="text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 font-mono">
                  {formatRupiah(subtotalPutri)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">Komponen</th>
                      <th className="py-2 px-3 text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {itemsPutri.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 px-3 text-stone-900">{item.nama}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-stone-800 font-medium">
                          {formatRupiah(item.biaya)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-rose-50/50 border-t border-rose-200 font-extrabold text-xs">
                    <tr>
                      <td className="py-2.5 px-3 text-stone-800">Total perlengkapan:</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-800 font-black">
                        {formatRupiah(subtotalPutri)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* BAGIAN C: Perlengkapan Siswa Laki-laki */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center font-heading">
                    C
                  </span>
                  <h2 className="text-sm sm:text-base font-extrabold text-stone-900 font-heading">
                    {rincian.judulLakiLaki || 'Perlengkapan Siswa Laki-laki'}
                  </h2>
                </div>
                <span className="text-xs font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 font-mono">
                  {formatRupiah(subtotalPutra)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">Komponen</th>
                      <th className="py-2 px-3 text-right">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {itemsPutra.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 px-3 text-stone-900">{item.nama}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-stone-800 font-medium">
                          {formatRupiah(item.biaya)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-sky-50/50 border-t border-sky-200 font-extrabold text-xs">
                    <tr>
                      <td className="py-2.5 px-3 text-stone-800">Total perlengkapan:</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-800 font-black">
                        {formatRupiah(subtotalPutra)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          {/* 4. Ringkasan Total Biaya */}
          <div className="p-6 rounded-xl bg-white border border-emerald-200/90 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base sm:text-lg font-black text-stone-900 font-heading">
                {rincian.judulRingkasan || 'Total Administrasi dan Perlengkapan'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                  Siswa Perempuan (Putri)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-rose-950 font-mono">
                  {formatRupiah(grandTotalPutri)}
                </div>
                <p className="text-[11px] text-stone-500">
                  Rincian: Administrasi ({formatRupiah(subtotalAdmin)}) + Perlengkapan ({formatRupiah(subtotalPutri)})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-sky-200 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
                  Siswa Laki-laki (Putra)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-sky-950 font-mono">
                  {formatRupiah(grandTotalPutra)}
                </div>
                <p className="text-[11px] text-stone-500">
                  Rincian: Administrasi ({formatRupiah(subtotalAdmin)}) + Perlengkapan ({formatRupiah(subtotalPutra)})
                </p>
              </div>
            </div>

            {rincian.catatanRingkasan && (
              <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 text-xs text-stone-600 leading-relaxed font-medium">
                {rincian.catatanRingkasan}
              </div>
            )}
          </div>

          {/* 5. Ketentuan Pembayaran */}
          {rincian.ketentuanPembayaran && rincian.ketentuanPembayaran.length > 0 && (
            <div className="p-5 sm:p-6 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3.5">
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 font-heading flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{rincian.judulKetentuan || 'Ketentuan Pembayaran'}</span>
              </h3>

              <ol className="space-y-2.5 text-xs sm:text-sm text-stone-700 list-decimal list-outside pl-5 leading-relaxed font-medium">
                {rincian.ketentuanPembayaran.map((rule, idx) => (
                  <li key={idx}>{isiBiaya(rule)}</li>
                ))}
              </ol>
            </div>
          )}

          {/* 6. Informasi Buku Pelajaran */}
          {rincian.deskripsiBuku && (
            <div className="p-5 sm:p-6 rounded-xl bg-amber-50/50 border border-amber-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base font-heading">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <h3>{rincian.judulBuku || 'Buku Pelajaran'}</h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                {rincian.deskripsiBuku}
              </p>
            </div>
          )}

        </div>

        {/* Footer info note */}
        <div className="p-6 bg-[#F7F4EC] border-t border-stone-200 text-center text-xs text-stone-500">
          <p>
            {rincian.footerInfo || `Panitia Penerimaan Murid Baru (SPMB) ${currentSettings.namaMadrasah} &bull; ${currentSettings.alamatMadrasah}`}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            * Dokumen ini hanya diperuntukkan bagi wali murid yang telah terdaftar dan login resmi di sistem SPMB.
          </p>
        </div>

      </div>
    </div>
  );
};
