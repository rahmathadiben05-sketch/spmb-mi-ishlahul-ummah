'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  ArrowLeft,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { RegistrationRecord, SchoolSettings } from '@/lib/types';

interface SuccessPageProps {
  record: RegistrationRecord;
  onPrint: () => void;
  onBackToHome: () => void;
  settings?: SchoolSettings;
  /** Diisi bila data gagal terkirim ke Google Sheets (data tetap aman di perangkat). */
  syncWarning?: string | null;
  /** Kirim ulang ke panitia (tampil bila syncWarning terisi). */
  onRetrySync?: () => void;
  isRetrying?: boolean;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  record,
  onPrint,
  onBackToHome,
  settings,
  syncWarning,
  onRetrySync,
  isRetrying,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    const text = `No. Registrasi: ${record.nomorPendaftaran} | PIN: ${record.pin || '-'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parentPhone = record.parent.ayah.noHp || record.parent.ibu.noHp || '';
  const cleanPhone = parentPhone.replace(/\D/g, '');
  const waTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const waShareUrl = `https://wa.me/${waTarget || ''}?text=${encodeURIComponent(
    `*Bukti Pendaftaran SPMB Online*\n\n` +
    `Nama Santri: *${record.student.namaLengkap}*\n` +
    `No. Pendaftaran: *${record.nomorPendaftaran}*\n` +
    `PIN Akses: *${record.pin || '-'}*\n` +
    `Jalur: ${record.jenisPendaftaran === 'baru' ? 'Siswa Baru (Kelas 1)' : 'Siswa Pindahan'}\n\n` +
    `Simpan nomor pendaftaran & PIN ini untuk melacak status atau mencetak formulir kapan saja.`
  )}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-xl p-6 sm:p-10 shadow-xl border border-stone-200 text-center space-y-6 relative overflow-hidden">
        {/* Top green accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0D3B2E]" />

        <div className="relative z-10 space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 stroke-[2.5]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-extrabold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pendaftaran Berhasil Disimpan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-heading">
            {settings?.cmsContent?.successTitle || 'Alhamdulillah, Formulir Telah Diterima!'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {settings?.cmsContent?.successSubtitle || 'Data calon santri telah masuk ke sistem panitia. Simpan Nomor Pendaftaran & PIN Akses Anda di bawah ini untuk mengecek status sewaktu-waktu.'}
          </p>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm text-left leading-relaxed">
            <p className="font-bold">
              {settings?.cmsContent?.successNotice ||
                'Catat dan simpan Nomor Pendaftaran serta PIN akun Anda dengan aman. Gunakan untuk masuk ke Dashboard Wali Murid sewaktu-waktu.'}
            </p>
          </div>
          {syncWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm text-left leading-relaxed">
              <p className="font-extrabold mb-1">⚠️ Perhatian — belum masuk ke data panitia</p>
              <p>{syncWarning}</p>
            </div>
          )}
        </div>

        {/* Credentials Showcase Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#F7F4EC] border-2 border-emerald-300 text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                {syncWarning
                  ? 'Nomor Sementara — belum terkonfirmasi panitia'
                  : 'Nomor Pendaftaran Resmi'}
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-emerald-950">
                {record.nomorPendaftaran}
              </span>
            </div>
            {record.pin && (
              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  PIN Akses Mandiri (6 Digit)
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-amber-900 bg-amber-100/80 px-3 py-0.5 rounded-lg border border-amber-200 inline-block">
                  {record.pin}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-stone-700">
            <div>
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Nama Calon Santri</span>
              <span className="font-extrabold text-stone-900 text-sm">{record.student.namaLengkap}</span>
            </div>
            <div>
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Jalur Pendaftaran</span>
              <span className="font-bold text-stone-900">
                {record.jenisPendaftaran === 'baru' ? 'Siswa Baru (Kelas 1)' : 'Siswa Pindahan'}
              </span>
            </div>
            <div>
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Waktu Mendaftar</span>
              <span className="font-medium text-stone-900">
                {new Date(record.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="block text-stone-400 text-[10px] uppercase font-bold">Orang Tua / Wali</span>
              <span className="font-bold text-stone-900">{record.parent.ayah.namaLengkap}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="py-2 px-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold text-stone-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin No. Reg & PIN'}</span>
            </button>

            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan ke WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Langkah Berikutnya */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 text-left space-y-3">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Langkah Berikutnya
          </span>
          {[
            {
              title: settings?.cmsContent?.successStep1Title || '1. Cetak Lembar Bukti Registrasi',
              desc:
                settings?.cmsContent?.successStep1Desc ||
                'Unduh atau cetak lembar bukti pendaftaran ber-barcode untuk dibawa saat hadir observasi fisik ke madrasah.',
            },
            {
              title: settings?.cmsContent?.successStep2Title || '2. Hadir Observasi Ramah Anak',
              desc:
                settings?.cmsContent?.successStep2Desc ||
                'Ajak calon ananda ke madrasah sesuai jadwal untuk observasi kenyamanan belajar dan pencocokan berkas fisik asli.',
            },
            {
              title: settings?.cmsContent?.successStep3Title || '3. Pantau Hasil Seleksi & Biaya',
              desc:
                settings?.cmsContent?.successStep3Desc ||
                'Masuk secara berkala ke Dashboard Wali Murid untuk memantau status verifikasi dan rincian administrasi madrasah.',
            },
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-stone-900">{step.title}</p>
                <p className="text-xs text-stone-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-stone-500 leading-relaxed pt-2 border-t border-stone-100">
            {settings?.cmsContent?.successHelpText ||
              'Butuh bantuan teknis atau informasi jadwal observasi? Hubungi sekretariat panitia via WhatsApp resmi.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          {syncWarning && onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              disabled={isRetrying}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{isRetrying ? 'Mengirim ulang…' : 'Kirim Ulang ke Panitia'}</span>
            </button>
          )}
          <button
            onClick={onPrint}
            className="btn-primary w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>CETAK BUKTI PENDAFTARAN</span>
          </button>
          <button
            onClick={onBackToHome}
            className="btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
