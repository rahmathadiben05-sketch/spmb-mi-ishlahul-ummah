'use client';

import React, { useState } from 'react';
import {
  X,
  XCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Phone,
  UserCheck,
  Check,
} from 'lucide-react';
import { RegistrationRecord, SchoolSettings } from '@/lib/types';
import { getWaliMuridSession, normalizePhone, fetchServerRegistration, cacheServerRegistration } from '@/lib/storage';

// Masking identitas sensitif: hanya 4 digit awal + 4 digit akhir yang tampil.
const maskSensitive = (value: string): string => {
  const v = (value || '').replace(/\s/g, '');
  if (!v) return '-';
  if (v.length < 8) return `${v.slice(0, 2)}***`;
  return `${v.slice(0, 4)}${'*'.repeat(v.length - 8)}${v.slice(-4)}`;
};

interface StatusTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintBukti: (record: RegistrationRecord) => void;
  onRequestLogin?: () => void;
  settings: SchoolSettings;
}

export const StatusTrackerModal: React.FC<StatusTrackerModalProps> = ({
  isOpen,
  onClose,
  onPrintBukti,
  onRequestLogin,
  settings,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegistrationRecord[]>([]);
  const [result, setResult] = useState<RegistrationRecord | null>(null);
  const [searched, setSearched] = useState(false);
  // Cek Status server-first (M4/C9): pencarian HANYA memakai getRegistration
  // server dengan kredensial sesi — TIDAK PERNAH menyaring cache lokal, dan
  // bila server tak terjangkau TIDAK ada hasil yang ditampilkan (bukan cache
  // lokal yang disajikan sebagai hasil resmi).
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pelacak hanya menampilkan data bila ada sesi wali yang valid (login No HP + PIN).
  const session = getWaliMuridSession();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const clean = query.trim().toUpperCase();
    const cleanNumbers = query.replace(/\D/g, '');
    setStaleNotice(null);

    // Server-first dengan kredensial sesi (tanpa sesi, gate di bawah sudah
    // menahan — handler ini tidak pernah mencapai pencarian cache lokal).
    const sess = getWaliMuridSession();
    if (!sess) {
      setResults([]);
      setResult(null);
      setSearched(true);
      setStaleNotice('Sesi login wali tidak ditemukan — silakan login kembali.');
      return;
    }
    setIsRefreshing(true);
    try {
      const res = await fetchServerRegistration({
        nomorPendaftaran: sess.nomorPendaftaran,
        pin: sess.pin,
      });
      if (!res.ok) {
        // Server tak terjangkau / PIN tidak cocok: JUJUR — tidak ada hasil
        // yang ditampilkan, dan cache lokal TIDAK disajikan sebagai resmi.
        setResults([]);
        setResult(null);
        setSearched(true);
        setStaleNotice('Server tidak terjangkau — status tidak dapat diperiksa saat ini. Silakan coba lagi nanti; data perangkat tidak ditampilkan sebagai hasil resmi.');
        return;
      }
      const serverRecord = cacheServerRegistration(res.data);
      // Batasi ke record milik sesi: nomor pendaftaran HARUS sama dengan sesi.
      if (serverRecord.nomorPendaftaran.toUpperCase() !== sess.nomorPendaftaran.toUpperCase()) {
        setResults([]);
        setResult(null);
        setSearched(true);
        setStaleNotice('Data pendaftaran tidak ditemukan atau PIN tidak cocok.');
        return;
      }
      // Pencocokan HANYA terhadap record milik sesi ini: nomor pendaftaran,
      // token, atau No. WA milik sendiri. Pencocokan NIK DIHAPUS — NIK bukan
      // kunci pencarian lintas-record.
      const ownWaNumbers = [serverRecord.parent.ayah.noHp, serverRecord.parent.ibu.noHp]
        .map((hp) => normalizePhone(hp || ''))
        .filter(Boolean);
      const sessionWa = sess.waNumber ? normalizePhone(sess.waNumber) : '';
      const matchNo = serverRecord.nomorPendaftaran.toUpperCase() === clean;
      const matchToken = !!serverRecord.tokenCode && serverRecord.tokenCode.toUpperCase() === clean;
      const matchWa =
        cleanNumbers.length >= 10 &&
        (ownWaNumbers.some((hp) => hp === normalizePhone(cleanNumbers)) ||
          (sessionWa !== '' && sessionWa === normalizePhone(cleanNumbers)));
      const matches = matchNo || matchToken || matchWa ? [serverRecord] : [];
      setResults(matches);
      setResult(matches.length === 1 ? matches[0] : null);
      setSearched(true);
    } catch {
      setResults([]);
      setResult(null);
      setSearched(true);
      setStaleNotice('Server tidak terjangkau — status tidak dapat diperiksa saat ini. Silakan coba lagi nanti; data perangkat tidak ditampilkan sebagai hasil resmi.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine stage (1 to 5)
  const computeCurrentStage = (rec: RegistrationRecord): number => {
    if (rec.hasilPengumuman === 'LULUS') return 5;
    if (rec.hasilPengumuman === 'CADANGAN' || rec.hasilPengumuman === 'TIDAK_LULUS') return 4;
    if (rec.status === 'terverifikasi' || rec.verification?.berkasDiterima) return 3;
    // Tahap 2 HANYA mensyaratkan dokumen WAJIB (KK + Akta). Pas foto
    // bersifat opsional — tidak boleh menjadi syarat naik tahap (M15):
    // progres tidak boleh macet di Tahap 1 hanya karena foto belum ada.
    if (rec.documents?.kk && rec.documents?.akta) return 2;
    return 1;
  };

  const currentStage = result ? computeCurrentStage(result) : 1;

  const stages = [
    {
      num: 1,
      title: 'Formulir Terdaftar',
      desc: 'Biodata pendaftar telah tersimpan di sistem SPMB',
      icon: FileCheck2,
    },
    {
      num: 2,
      title: 'Berkas Digital Diunggah',
      desc: 'Scan KK dan Akta Kelahiran siap diperiksa',
      icon: ShieldCheck,
    },
    {
      num: 3,
      title: 'Verifikasi Fisik & Observasi',
      desc: 'Pencocokan berkas asli & sesi observasi ramah anak di madrasah',
      icon: Building,
    },
    {
      num: 4,
      title: 'Pengumuman Kelulusan',
      desc: 'Penetapan hasil rapat seleksi panitia SPMB',
      icon: GraduationCap,
    },
    {
      num: 5,
      title: 'Daftar Ulang & Seragam',
      desc: 'Konfirmasi santri diterima & pengambilan seragam madrasah',
      icon: UserCheck,
    },
  ];

  const cleanPhone = (settings.kontakWhatsapp || '').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB, saya ingin menanyakan status pendaftaran ananda ${result?.student.namaLengkap || ''} (${result?.nomorPendaftaran || ''}).`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative bg-white rounded-xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-stone-200 my-6 overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0D3B2E]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold shadow-xs">
            <Search className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Pelacak Status SPMB Realtime
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mt-0.5">
              Lacak Progres & Pengumuman Santri
            </h3>
            <p className="text-xs text-stone-500">
              Pantau 5 tahapan seleksi penerimaan santri baru {settings.namaMadrasah}
            </p>
          </div>
        </div>

        {/* Tanpa sesi wali yang valid: ajakan login, bukan kolom pencarian. */}
        {!session ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-700 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">Login Wali Murid Diperlukan</h4>
            <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
              Status pendaftaran hanya dapat dilihat setelah login sebagai wali murid dengan
              No. WhatsApp dan PIN 6 Digit Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestLogin?.();
              }}
              className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Masuk sebagai Wali Murid
            </button>
          </div>
        ) : (
          <>
        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan Nomor Pendaftaran Anda (MIIU/...) atau No. WA Anda..."
              className="w-full px-4 py-3.5 text-xs sm:text-sm rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-medium bg-stone-50/50"
            />
            <button
              type="submit"
              disabled={isRefreshing}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{isRefreshing ? 'Memeriksa…' : 'Cari'}</span>
            </button>
          </div>
          {staleNotice && (
            <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-medium text-amber-800">
              {staleNotice}
            </p>
          )}
        </form>

        {/* Search Results with Multi-Step Timeline Tracker */}
        {searched && (
          <div className="space-y-6 pt-2">
            {result ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {results.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ← Kembali ke daftar hasil ({results.length} pendaftaran)
                  </button>
                )}
                {/* Applicant Summary Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#EEF5F0] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                        {result.nomorPendaftaran}
                      </span>
                      <span className="text-[11px] font-bold text-stone-600">
                        Jalur: {result.jenisPendaftaran === 'baru' ? 'Siswa Baru (Kls 1)' : 'Siswa Pindahan'}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-stone-900 mt-1.5">
                      {result.student.namaLengkap}
                    </h4>
                    <p className="text-xs text-stone-600">
                      Orang Tua: <strong>{result.parent.ayah.namaLengkap}</strong> • NIK: <span className="font-mono">{maskSensitive(result.student.nik)}</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-2xs ${
                        result.status === 'terverifikasi'
                          ? 'bg-emerald-600 text-white'
                          : result.status === 'ditolak'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-400 text-stone-950'
                      }`}
                    >
                      {result.status === 'terverifikasi' ? 'Terverifikasi' : result.status === 'ditolak' ? 'Perlu Perbaikan' : 'Menunggu Verifikasi'}
                    </span>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Didaftarkan: {new Date(result.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* 5-Step Stepper Timeline */}
                <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-4">
                  <h5 className="font-extrabold text-stone-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Tahapan Proses Penerimaan Murid Baru:</span>
                  </h5>

                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {stages.map((stage) => {
                      const isPast = stage.num < currentStage;
                      const isCurrent = stage.num === currentStage;
                      const isFuture = stage.num > currentStage;

                      return (
                        <div key={stage.num} className="relative flex items-start gap-3.5">
                          {/* Dot / Indicator */}
                          <div
                            className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                              isPast
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-100'
                                : 'bg-stone-100 text-stone-400 border border-stone-300'
                            }`}
                          >
                            {isPast ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" /> : stage.num}
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h6
                                className={`text-xs sm:text-sm font-bold ${
                                  isCurrent ? 'text-emerald-900 font-extrabold' : isPast ? 'text-stone-900' : 'text-stone-400'
                                }`}
                              >
                                {stage.title}
                              </h6>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] animate-pulse">
                                  Sedang Berjalan
                                </span>
                              )}
                              {isPast && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Selesai
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hasil Pengumuman Final Box if present */}
                {result.hasilPengumuman && result.hasilPengumuman !== 'PENDING' && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-semibold ${
                      result.hasilPengumuman === 'LULUS'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                        : result.hasilPengumuman === 'CADANGAN'
                        ? 'bg-amber-50 text-amber-950 border-amber-300'
                        : 'bg-rose-50 text-rose-950 border-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.hasilPengumuman === 'LULUS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : result.hasilPengumuman === 'CADANGAN' ? (
                        <Clock className="w-4 h-4 text-amber-700" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-700" />
                      )}
                      <span className="font-extrabold text-sm">
                        Hasil Keputusan Panitia Seleksi: {result.hasilPengumuman}
                      </span>
                    </div>
                    {result.catatanPengumuman && (
                      <p className="text-[11px] text-stone-700 mt-1 pl-6">
                        Catatan: {result.catatanPengumuman}
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPrintBukti(result);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Lembar Bukti Pendaftaran</span>
                  </button>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Konsultasi Panitia</span>
                  </a>
                </div>
              </div>
            ) : results.length > 1 ? (
              <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
                <h4 className="text-sm font-bold text-stone-900">
                  Ditemukan {results.length} pendaftaran yang cocok
                </h4>
                <p className="text-xs text-stone-600">
                  Pilih salah satu pendaftaran untuk melihat statusnya:
                </p>
                <div className="space-y-2">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setResult(r)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                    >
                      <span className="text-xs font-bold text-stone-900">{r.student.namaLengkap}</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 shrink-0">{r.nomorPendaftaran}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="text-sm font-bold text-rose-900">Data Pendaftar Tidak Ditemukan</h4>
                <p className="text-xs text-rose-700 max-w-sm mx-auto">
                  Pastikan Nomor Pendaftaran atau nomor WhatsApp yang dimasukkan sudah sesuai dengan pendaftaran Anda.
                </p>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
