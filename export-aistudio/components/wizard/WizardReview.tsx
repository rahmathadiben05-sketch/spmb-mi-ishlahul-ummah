'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  FileCheck,
  User,
  Users,
  MapPin,
  FileText,
  Send,
  Loader2,
  Eye,
  Download,
  ExternalLink,
  X,
  ImageIcon,
  GraduationCap,
  Briefcase,
  DollarSign,
  Phone,
  Calendar,
  Building,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { AddressData, DocumentsData, ParentData, RegistrationRecord, RegistrationType, SchoolSettings, StudentData, Token, UploadedFile } from '@/lib/types';
import { MAX_BIRTH_DATE } from '@/lib/storage';

interface WizardReviewProps {
  token: Token;
  jenisPendaftaran: RegistrationType;
  student: StudentData;
  parent: ParentData;
  address: AddressData;
  documents: DocumentsData;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
  settings?: SchoolSettings;
  // Ringkasan inden (N-m4): diisi dari app/page.tsx bila
  // modePendaftaran === 'inden'; kosong = pendaftaran penuh.
  modePendaftaran?: 'penuh' | 'inden';
  inden?: RegistrationRecord['inden'];
}

interface PreviewState {
  isOpen: boolean;
  title: string;
  file: UploadedFile | null;
}

export const WizardReview: React.FC<WizardReviewProps> = ({
  token,
  jenisPendaftaran,
  student,
  parent,
  address,
  documents,
  onSubmit,
  onEditStep,
  isSubmitting,
  settings,
  modePendaftaran,
  inden,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [missingIssues, setMissingIssues] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewState>({
    isOpen: false,
    title: '',
    file: null,
  });

  // Format tanggal YYYY-MM-DD ke Bahasa Indonesia, mis. "15 Januari 2020".
  const formatTanggal = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Validasi akhir sebelum kirim: ulang validasi Langkah 1–4 + kelengkapan dokumen wajib.
  // Field opsional (NISN, KIP, NIK/HP orang tua, dsb.) hanya dicek formatnya bila diisi.
  const validateAll = (): string[] => {
    const issues: string[] = [];
    // Langkah 1 — Data Anak
    if (!student.namaLengkap?.trim()) issues.push('Langkah 1: Nama lengkap anak belum diisi.');
    if (!student.namaPanggilan?.trim()) issues.push('Langkah 1: Nama panggilan belum diisi.');
    if (!/^\d{16}$/.test((student.nik || '').trim())) issues.push('Langkah 1: NIK anak harus tepat 16 digit angka.');
    if (!/^\d{16}$/.test((student.noKk || '').trim())) issues.push('Langkah 1: Nomor KK harus tepat 16 digit angka.');
    if (!student.tempatLahir?.trim()) issues.push('Langkah 1: Tempat lahir belum diisi.');
    if (!student.tanggalLahir) issues.push('Langkah 1: Tanggal lahir belum diisi.');
    else if (student.tanggalLahir > MAX_BIRTH_DATE) issues.push('Langkah 1: Calon santri belum berusia 6 tahun per 1 Juli 2027 (tanggal lahir paling lambat 1 Juli 2021).');
    if (!student.jenisKelamin) issues.push('Langkah 1: Jenis kelamin belum dipilih.');
    if (!student.asalSekolah?.trim()) issues.push('Langkah 1: Asal TK/RA/PAUD/SD belum diisi.');
    const cleanNisn = (student.nisn || '').trim();
    if (cleanNisn && !/^\d{10}$/.test(cleanNisn)) issues.push('Langkah 1: NISN harus tepat 10 digit angka (atau kosongkan bila belum memiliki).');
    const cleanKip = (student.nomorKip || '').trim();
    if (cleanKip && !/^\d{6,10}$/.test(cleanKip)) issues.push('Langkah 1: Nomor KIP harus 6–10 digit angka (atau kosongkan bila tidak memiliki).');
    if (student.anakKe === undefined || student.anakKe === null || Number.isNaN(student.anakKe) || student.anakKe < 1) issues.push('Langkah 1: Anak ke- minimal 1.');
    if (student.jumlahSaudara === undefined || student.jumlahSaudara === null || Number.isNaN(student.jumlahSaudara) || student.jumlahSaudara < 0) issues.push('Langkah 1: Jumlah saudara minimal 0.');
    // Wajib EMIS (3 field) — email/KKS/PKH/NISN/KIP tetap opsional, hanya format bila diisi.
    if (!student.kewarganegaraan) issues.push('Langkah 1: Kewarganegaraan belum dipilih (wajib untuk EMIS).');
    if (!student.agama) issues.push('Langkah 1: Agama belum dipilih (wajib untuk EMIS).');
    if (!student.yangMembiayaiSekolah) issues.push('Langkah 1: Yang Membiayai Sekolah belum dipilih (wajib untuk EMIS).');
    const cleanEmail = (student.emailSiswa || '').trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) issues.push('Langkah 1: Format email siswa tidak valid (atau kosongkan bila belum memiliki).');
    if (jenisPendaftaran === 'pindahan') {
      if (!student.asalSekolahPindahan?.trim()) issues.push('Langkah 1: Asal sekolah pindahan belum diisi.');
      if (!student.kelasTerakhirPindahan?.trim()) issues.push('Langkah 1: Kelas terakhir pindahan belum diisi.');
      if (!student.alasanPindah?.trim()) issues.push('Langkah 1: Alasan pindah belum diisi.');
    }
    // Langkah 2 — Orang Tua / Wali
    const checkNik = (nik: string | undefined, label: string) => {
      const clean = (nik || '').trim();
      if (clean && !/^\d{16}$/.test(clean)) issues.push(`Langkah 2: ${label} harus tepat 16 digit angka (atau kosongkan).`);
    };
    const checkHp = (hp: string | undefined, label: string) => {
      const clean = (hp || '').replace(/[\s-]/g, '').trim();
      if (clean && !/^(\+?62|0)8\d{7,}$/.test(clean)) issues.push(`Langkah 2: ${label} tidak valid (format Indonesia, minimal 10 digit).`);
    };
    if (!parent.ayah?.status) issues.push('Langkah 2: Status Ayah Kandung belum dipilih.');
    else if (parent.ayah.status === 'Masih Hidup' && !parent.ayah?.namaLengkap?.trim()) issues.push('Langkah 2: Nama Ayah wajib diisi.');
    if (!parent.ibu?.status) issues.push('Langkah 2: Status Ibu Kandung belum dipilih.');
    else if (parent.ibu.status === 'Masih Hidup' && !parent.ibu?.namaLengkap?.trim()) issues.push('Langkah 2: Nama Ibu wajib diisi.');
    checkNik(parent.ayah?.nik, 'NIK Ayah');
    checkNik(parent.ibu?.nik, 'NIK Ibu');
    checkHp(parent.ayah?.noHp, 'No. HP Ayah');
    checkHp(parent.ibu?.noHp, 'No. HP Ibu');
    if (parent.wali?.hasWali) {
      checkNik(parent.wali.nik, 'NIK Wali');
      checkHp(parent.wali.noHp, 'No. HP Wali');
    }
    // Langkah 3 — Alamat
    if (!address.provinsi) issues.push('Langkah 3: Provinsi belum dipilih.');
    if (!address.kabupaten) issues.push('Langkah 3: Kabupaten/Kota belum dipilih.');
    if (!address.kecamatan) issues.push('Langkah 3: Kecamatan belum dipilih.');
    if (!address.kelurahan) issues.push('Langkah 3: Kelurahan/Desa belum dipilih.');
    if (!address.alamatLengkap?.trim()) issues.push('Langkah 3: Alamat lengkap belum diisi.');
    // Langkah 4 — Dokumen
    if (documents.memilikiIjazahTk === undefined) issues.push('Langkah 4: Pertanyaan ijazah TK belum dijawab (Ya/Belum).');
    if (!documents.kk) issues.push('Langkah 4: Kartu Keluarga (KK) wajib diunggah.');
    if (!documents.akta) issues.push('Langkah 4: Akta Kelahiran wajib diunggah.');
    if (documents.memilikiIjazahTk && !documents.ijazahTk) issues.push('Langkah 4: Ijazah TK/RA wajib diunggah (Anda menyatakan sudah memegang ijazah TK).');
    if (jenisPendaftaran === 'pindahan' && !documents.ijazahAtauSuratPindah) issues.push('Langkah 4: Surat Keterangan Pindah wajib diunggah bagi siswa pindahan.');
    return issues;
  };

  const handleSubmitClick = () => {
    const issues = validateAll();
    setMissingIssues(issues);
    if (issues.length > 0) return;
    onSubmit();
  };

  const openPreview = (title: string, file?: UploadedFile) => {
    if (!file || !file.url) return;
    setPreview({
      isOpen: true,
      title,
      file,
    });
  };

  const closePreview = () => {
    setPreview({
      isOpen: false,
      title: '',
      file: null,
    });
  };

  // Tampilan No HP format +62 (sesuai EMIS) — hanya tampilan di Review;
  // nilai yang tersimpan tidak diubah (normalisasi milik pekerja lain).
  const formatHp62 = (hp?: string) => {
    const d = (hp || '').replace(/\D/g, '');
    if (!d) return '-';
    if (d.startsWith('62')) return `+${d}`;
    if (d.startsWith('0')) return `+62${d.slice(1)}`;
    return `+62${d}`;
  };

  // Helper for document status rendering
  const docList: Array<{
    key: keyof DocumentsData;
    title: string;
    isMandatory: boolean;
    file?: UploadedFile;
  }> = [
    {
      key: 'kk',
      title: 'Kartu Keluarga (KK)',
      isMandatory: true,
      file: documents.kk,
    },
    {
      key: 'akta',
      title: 'Akta Kelahiran',
      isMandatory: true,
      file: documents.akta,
    },
    {
      key: 'nisnDoc',
      title: 'Kartu / Bukti NISN',
      isMandatory: false,
      file: documents.nisnDoc,
    },
    {
      key: 'ijazahTk',
      title: documents.memilikiIjazahTk ? 'Ijazah TK / RA (Wajib Diunggah)' : 'Ijazah TK / RA (Opsional)',
      isMandatory: Boolean(documents.memilikiIjazahTk),
      file: documents.ijazahTk,
    },
    {
      key: 'foto',
      title: 'Pas Foto 3x4 Anak',
      isMandatory: false,
      file: documents.foto,
    },
    {
      key: 'kks',
      title: 'Kartu Keluarga Sejahtera (KKS)',
      isMandatory: false,
      file: documents.kks,
    },
    {
      key: 'pkh',
      title: 'Kartu Program Keluarga Harapan (PKH)',
      isMandatory: false,
      file: documents.pkh,
    },
  ];

  if (jenisPendaftaran === 'pindahan') {
    docList.push({
      key: 'ijazahAtauSuratPindah',
      title: 'Surat Keterangan Pindah',
      isMandatory: true,
      file: documents.ijazahAtauSuratPindah,
    });
    docList.push({
      key: 'rapor',
      title: 'Rapor Terakhir',
      isMandatory: false,
      file: documents.rapor,
    });
  }

  const isPdf = (type?: string) => type?.includes('pdf');

  return (
    <div className="bg-white rounded-xl p-6 sm:p-10 border border-[#E2E6E2] shadow-xs space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-[#E2E6E2]">
        <div>
          <span className="text-xs font-bold text-[#4B634B] bg-[#EBF0EB] px-3.5 py-1.5 rounded-full border border-[#D1D9D1]">
            Langkah Terakhir (Tinjauan Data)
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1D1A] mt-3">
            {settings?.cmsContent?.reviewTitle || 'Tinjauan Lengkap Formulir Pendaftaran'}
          </h3>
          <p className="text-xs sm:text-sm text-[#626862] mt-1">
            {settings?.cmsContent?.reviewSubtitle || 'Harap periksa seluruh rincian data calon siswa, orang tua, domisili, dan berkas terunggah sebelum mengirim.'}
          </p>
        </div>
      </div>

      {/* Daftar kekurangan — tampil bila validasi akhir menemukan yang belum lengkap */}
      {missingIssues.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
          <p className="text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Formulir belum bisa dikirim — masih ada {missingIssues.length} kekurangan:
          </p>
          <ul className="text-xs space-y-1 list-disc pl-5">
            {missingIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <p className="text-xs">Klik tombol &quot;Ubah Langkah&quot; pada bagian terkait untuk melengkapi.</p>
        </div>
      )}

      {/* Token & Jalur Box */}
      <div className="p-6 rounded-2xl bg-[#4B634B] text-white flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <p className="text-[10px] text-[#EBF0EB] uppercase tracking-wider font-semibold">PIN 6 Digit</p>
          <p className="text-2xl font-mono font-extrabold text-white tracking-wide">{token.code}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] text-[#EBF0EB] uppercase tracking-wider font-semibold">Jalur Pendaftaran</p>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <p className="text-sm font-bold text-white">
              {jenisPendaftaran === 'baru' ? 'Siswa Baru' : 'Siswa Pindahan'} ({token.academicYear} • {token.wave})
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Inden (N-m4) — hanya bila modePendaftaran === 'inden' */}
      {modePendaftaran === 'inden' && inden && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
          <p className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            Ringkasan Inden Kursi
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="block text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Status Inden</span>
              <span className="font-bold text-stone-900">{inden.status || 'Inden'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="block text-stone-500 text-[10px] uppercase tracking-wider font-semibold">DP Inden</span>
              <span className="font-bold text-stone-900">Rp{(Number(inden.jumlahDp) || 0).toLocaleString('id-ID')}</span>
              <span className={`block text-[11px] font-bold mt-0.5 ${inden.dpLunas ? 'text-emerald-700' : 'text-rose-700'}`}>
                {inden.dpLunas ? 'Sudah dibayar' : 'Belum dibayar'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="block text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Diskon Didapat</span>
              <span className="font-bold text-stone-900">Rp{(Number(inden.diskonDiberikan) || 0).toLocaleString('id-ID')}</span>
              <span className="block text-[11px] text-stone-500 mt-0.5">{(Number(inden.diskonDiberikan) || 0) > 0 ? 'Diskon Early Bird' : 'Tidak ada diskon'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="block text-stone-500 text-[10px] uppercase tracking-wider font-semibold">Sisa Bayar</span>
              <span className="font-bold text-stone-900">Rp{(Number(inden.sisaBayar) || 0).toLocaleString('id-ID')}</span>
              <span className="block text-[11px] text-stone-500 mt-0.5">
                Lunasi maks {inden.batasPelunasan ? formatTanggal(inden.batasPelunasan) : '-'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Kursi ananda sudah dipesan lewat Inden Kursi. Setelah formulir ini dikirim, lengkapi pembayaran DP dan lunasi sisa bayar sebelum batas pelunasan di atas.
          </p>
        </div>
      )}

      {/* Sections Wrapper */}
      <div className="space-y-6">
        {/* Section 1: Data Calon Siswa */}
        <div className="p-6 rounded-2xl border border-[#E2E6E2] bg-[#F8FAF8] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-3">
            <h4 className="text-base font-bold text-[#1A1D1A] flex items-center gap-2">
              <User className="w-5 h-5 text-[#4B634B]" />
              <span>1. Data Lengkap Calon Siswa</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs font-bold text-[#4B634B] hover:bg-[#EBF0EB] px-3 py-1.5 rounded-lg border border-[#D1D9D1] transition-colors cursor-pointer"
            >
              Ubah Langkah 1
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Foto Avatar Preview if uploaded */}
            {(documents.foto?.url || student.fotoUrl) && (
              <div className="shrink-0 flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <img
                  src={documents.foto?.url || student.fotoUrl}
                  alt="Pas Foto Siswa"
                  className="w-24 h-32 object-cover rounded-lg border border-[#D1D9D1] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => openPreview('Pas Foto 3x4 Anak', documents.foto)}
                  className="text-[11px] font-bold text-[#4B634B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Foto</span>
                </button>
              </div>
            )}

            {/* Grid Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs flex-1 w-full">
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Nama Lengkap</span>
                <span className="font-extrabold text-[#1A1D1A] text-sm">{student.namaLengkap}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Nama Panggilan</span>
                <span className="font-bold text-[#1A1D1A]">{student.namaPanggilan || '-'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">NIK Siswa</span>
                <span className="font-mono font-bold text-[#1A1D1A]">{student.nik}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">NISN</span>
                <span className="font-mono font-bold text-[#1A1D1A]">{student.nisn || '-'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">No. Kartu Keluarga</span>
                <span className="font-mono font-bold text-[#1A1D1A]">{student.noKk}</span>
              </div>
              {student.nomorKip && (
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <span className="block text-emerald-800 text-[10px] uppercase tracking-wider font-bold">Nomor KIP (Bantuan)</span>
                  <span className="font-mono font-bold text-emerald-950">{student.nomorKip}</span>
                </div>
              )}
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Tempat, Tgl Lahir</span>
                <span className="font-bold text-[#1A1D1A]">
                  {student.tempatLahir}, {formatTanggal(student.tanggalLahir)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Jenis Kelamin</span>
                <span className="font-bold text-[#1A1D1A]">
                  {student.jenisKelamin === 'L' ? 'Laki-Laki' : student.jenisKelamin === 'P' ? 'Perempuan' : '-'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Status Keluarga</span>
                <span className="font-bold text-[#1A1D1A]">
                  {student.jumlahSaudara
                    ? `Anak ke-${student.anakKe ?? '-'} dari ${student.jumlahSaudara} bersaudara`
                    : `Anak ke-${student.anakKe ?? '-'}`}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Asal TK / RA / Sekolah</span>
                <span className="font-bold text-[#1A1D1A]">{student.asalSekolah || '-'}</span>
              </div>
              {/* Data tambahan EMIS */}
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Kewarganegaraan (Wajib EMIS)</span>
                <span className="font-bold text-[#1A1D1A]">{student.kewarganegaraan || '-'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Agama (Wajib EMIS)</span>
                <span className="font-bold text-[#1A1D1A]">{student.agama || '-'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Yang Membiayai Sekolah (Wajib EMIS)</span>
                <span className="font-bold text-[#1A1D1A]">{student.yangMembiayaiSekolah || '-'}</span>
              </div>
              {student.hobi && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Hobi</span>
                  <span className="font-bold text-[#1A1D1A]">{student.hobi}</span>
                </div>
              )}
              {student.citaCita && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Cita-cita</span>
                  <span className="font-bold text-[#1A1D1A]">{student.citaCita}</span>
                </div>
              )}
              {student.emailSiswa && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Email Siswa</span>
                  <span className="font-bold text-[#1A1D1A]">{student.emailSiswa}</span>
                </div>
              )}
              {student.nisLokal && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">NIS Lokal</span>
                  <span className="font-mono font-bold text-[#1A1D1A]">{student.nisLokal}</span>
                </div>
              )}
              {student.nomorKks && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Nomor KKS</span>
                  <span className="font-mono font-bold text-[#1A1D1A]">{student.nomorKks}</span>
                </div>
              )}
              {student.nomorPkh && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Nomor PKH</span>
                  <span className="font-mono font-bold text-[#1A1D1A]">{student.nomorPkh}</span>
                </div>
              )}
              {(student.praSekolahTkRa || student.praSekolahPaud) && (
                <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                  <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Pra Sekolah</span>
                  <span className="font-bold text-[#1A1D1A]">
                    {[student.praSekolahTkRa ? 'Pernah TK/RA' : null, student.praSekolahPaud ? 'Pernah PAUD' : null].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(() => {
                const imun = [
                  student.imunisasiHepatitisB ? 'Hepatitis B' : null,
                  student.imunisasiPolio ? 'Polio' : null,
                  student.imunisasiBcg ? 'BCG' : null,
                  student.imunisasiCampak ? 'Campak' : null,
                  student.imunisasiDpt ? 'DPT' : null,
                  student.imunisasiCovid ? 'Covid' : null,
                ].filter(Boolean);
                return imun.length > 0 ? (
                  <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                    <span className="block text-[#626862] text-[10px] uppercase tracking-wider font-semibold">Imunisasi</span>
                    <span className="font-bold text-[#1A1D1A]">{imun.join(', ')}</span>
                  </div>
                ) : null;
              })()}
              {student.kebutuhanKhusus && student.kebutuhanKhusus.trim() !== '' && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span className="block text-amber-800 text-[10px] uppercase tracking-wider font-bold">Berkebutuhan Khusus</span>
                  <span className="font-bold text-[#1A1D1A]">{student.kebutuhanKhusus}</span>
                  {student.kebutuhanDisabilitas && student.kebutuhanDisabilitas.trim() !== '' && (
                    <span className="block font-bold text-[#1A1D1A] mt-1">Disabilitas: {student.kebutuhanDisabilitas}</span>
                  )}
                </div>
              )}

              {/* Data Khusus Pindahan */}
              {jenisPendaftaran === 'pindahan' && (
                <>
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 col-span-1 sm:col-span-2">
                    <span className="block text-amber-800 text-[10px] uppercase tracking-wider font-semibold">Sekolah Pindahan Asal</span>
                    <span className="font-bold text-[#1A1D1A]">{student.asalSekolahPindahan || '-'}</span>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <span className="block text-amber-800 text-[10px] uppercase tracking-wider font-semibold">Kelas Terakhir</span>
                    <span className="font-bold text-[#1A1D1A]">{student.kelasTerakhirPindahan || '-'}</span>
                  </div>
                  {student.alasanPindah && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 col-span-1 sm:col-span-3">
                      <span className="block text-amber-800 text-[10px] uppercase tracking-wider font-semibold">Alasan Kepindahan</span>
                      <span className="font-medium text-[#1A1D1A]">{student.alasanPindah}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Data Orang Tua / Wali */}
        <div className="p-6 rounded-2xl border border-[#E2E6E2] bg-[#F8FAF8] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-3">
            <h4 className="text-base font-bold text-[#1A1D1A] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4B634B]" />
              <span>2. Data Orang Tua & Wali</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-bold text-[#4B634B] hover:bg-[#EBF0EB] px-3 py-1.5 rounded-lg border border-[#D1D9D1] transition-colors cursor-pointer"
            >
              Ubah Langkah 2
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Ayah Kandung */}
            <div className="p-5 bg-white rounded-xl border border-[#E2E6E2] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-2">
                <span className="font-extrabold text-[#4B634B] text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#4B634B]" />
                  Ayah Kandung
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[#626862] text-[10px] block">Nama Lengkap</span>
                  <span className="font-bold text-[#1A1D1A] text-sm">{parent.ayah.namaLengkap}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#626862] text-[10px] block">NIK Ayah</span>
                    <span className="font-mono font-bold text-[#1A1D1A]">{parent.ayah.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block text-right">Status</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      parent.ayah.status === 'Masih Hidup'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {parent.ayah.status || '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0F3F0]">
                  <div>
                    <span className="text-[#626862] text-[10px] block">TTL</span>
                    <span className="font-medium text-[#1A1D1A]">{[parent.ayah.tempatLahir, parent.ayah.tanggalLahir ? formatTanggal(parent.ayah.tanggalLahir) : ''].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pendidikan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ayah.pendidikan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pekerjaan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ayah.pekerjaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Penghasilan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ayah.penghasilan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Kewarganegaraan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ayah.kewarganegaraan || '-'}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#F0F3F0] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#4B634B]" />
                  <span className="font-mono font-bold text-[#1A1D1A]">{formatHp62(parent.ayah.noHp)}</span>
                </div>
              </div>
            </div>

            {/* Ibu Kandung */}
            <div className="p-5 bg-white rounded-xl border border-[#E2E6E2] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-2">
                <span className="font-extrabold text-[#4B634B] text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#4B634B]" />
                  Ibu Kandung
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[#626862] text-[10px] block">Nama Lengkap</span>
                  <span className="font-bold text-[#1A1D1A] text-sm">{parent.ibu.namaLengkap}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#626862] text-[10px] block">NIK Ibu</span>
                    <span className="font-mono font-bold text-[#1A1D1A]">{parent.ibu.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block text-right">Status</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      parent.ibu.status === 'Masih Hidup'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {parent.ibu.status || '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0F3F0]">
                  <div>
                    <span className="text-[#626862] text-[10px] block">TTL</span>
                    <span className="font-medium text-[#1A1D1A]">{[parent.ibu.tempatLahir, parent.ibu.tanggalLahir ? formatTanggal(parent.ibu.tanggalLahir) : ''].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pendidikan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ibu.pendidikan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pekerjaan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ibu.pekerjaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Penghasilan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ibu.penghasilan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Kewarganegaraan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.ibu.kewarganegaraan || '-'}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#F0F3F0] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#4B634B]" />
                  <span className="font-mono font-bold text-[#1A1D1A]">{formatHp62(parent.ibu.noHp)}</span>
                </div>
              </div>
            </div>

            {/* Wali (If filled) */}
            {parent.wali?.hasWali && (
              <div className="p-5 bg-white rounded-xl border border-[#E2E6E2] space-y-3 shadow-2xs md:col-span-2">
                <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-2">
                  <span className="font-extrabold text-[#4B634B] text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#4B634B]" />
                    Wali Siswa ({parent.wali.hubungan || 'Wali'})
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Wali
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[#626862] text-[10px] block">Nama Lengkap Wali</span>
                    <span className="font-bold text-[#1A1D1A]">{parent.wali.namaLengkap || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">NIK Wali</span>
                    <span className="font-mono font-bold text-[#1A1D1A]">{parent.wali.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">TTL Wali</span>
                    <span className="font-medium text-[#1A1D1A]">{[parent.wali.tempatLahir, parent.wali.tanggalLahir ? formatTanggal(parent.wali.tanggalLahir) : ''].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Hubungan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.wali.hubungan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pendidikan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.wali.pendidikan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Pekerjaan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.wali.pekerjaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Penghasilan</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.wali.penghasilan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">No. HP Wali</span>
                    <span className="font-mono font-bold text-[#1A1D1A]">{formatHp62(parent.wali.noHp)}</span>
                  </div>
                  <div>
                    <span className="text-[#626862] text-[10px] block">Kewarganegaraan Wali</span>
                    <span className="font-medium text-[#1A1D1A]">{parent.wali.kewarganegaraan || '-'}</span>
                  </div>
                </div>
              </div>
            )}
            {(parent.statusWali || parent.penghasilanGabungan) && (
              <div className="p-4 bg-white rounded-xl border border-[#E2E6E2] text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
                {parent.statusWali && (
                  <div>
                    <span className="text-[#626862] text-[10px] block">Status Wali (EMIS)</span>
                    <span className="font-bold text-[#1A1D1A]">{parent.statusWali}</span>
                  </div>
                )}
                {parent.penghasilanGabungan && (
                  <div>
                    <span className="text-[#626862] text-[10px] block">Total Gabungan Penghasilan Orang Tua/Wali</span>
                    <span className="font-bold text-[#1A1D1A]">{parent.penghasilanGabungan}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Data Alamat Domisili */}
        <div className="p-6 rounded-2xl border border-[#E2E6E2] bg-[#F8FAF8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-3">
            <h4 className="text-base font-bold text-[#1A1D1A] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#4B634B]" />
              <span>3. Alamat Domisili Siswa</span>
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs font-bold text-[#4B634B] hover:bg-[#EBF0EB] px-3 py-1.5 rounded-lg border border-[#D1D9D1] transition-colors cursor-pointer"
            >
              Ubah Langkah 3
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Provinsi</span>
              <span className="font-bold text-[#1A1D1A]">{address.provinsi || '-'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Kabupaten / Kota</span>
              <span className="font-bold text-[#1A1D1A]">{address.kabupaten || '-'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Kecamatan</span>
              <span className="font-bold text-[#1A1D1A]">{address.kecamatan || '-'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Desa / Kelurahan</span>
              <span className="font-bold text-[#1A1D1A]">{address.kelurahan || '-'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">RT / RW</span>
              <span className="font-mono font-bold text-[#1A1D1A]">
                RT {address.rt || '-'} / RW {address.rw || '-'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Kode Pos</span>
              <span className="font-mono font-bold text-[#1A1D1A]">{address.kodePos || '-'}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E2E6E2] sm:col-span-2">
              <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Alamat Jalan / Perumahan</span>
              <span className="font-bold text-[#1A1D1A]">{address.alamatLengkap || '-'}</span>
            </div>
            {/* Data tambahan EMIS — tampil hanya bila diisi */}
            {address.statusKepemilikanRumah && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Status Kepemilikan Rumah</span>
                <span className="font-bold text-[#1A1D1A]">{address.statusKepemilikanRumah}</span>
              </div>
            )}
            {address.statusTempatTinggal && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Status Tempat Tinggal</span>
                <span className="font-bold text-[#1A1D1A]">{address.statusTempatTinggal}</span>
              </div>
            )}
            {address.jarakKeMadrasah && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Jarak ke Madrasah</span>
                <span className="font-bold text-[#1A1D1A]">{address.jarakKeMadrasah}</span>
              </div>
            )}
            {address.transportasiKeSekolah && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Transportasi ke Sekolah</span>
                <span className="font-bold text-[#1A1D1A]">{address.transportasiKeSekolah}</span>
              </div>
            )}
            {address.waktuTempuh && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Waktu Tempuh</span>
                <span className="font-bold text-[#1A1D1A]">{address.waktuTempuh}</span>
              </div>
            )}
            {address.koordinatAlamat && (
              <div className="bg-white p-3 rounded-xl border border-[#E2E6E2]">
                <span className="text-[#626862] text-[10px] uppercase tracking-wider block font-semibold">Koordinat Alamat</span>
                <span className="font-mono font-bold text-[#1A1D1A]">{address.koordinatAlamat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Berkas Terunggah + FITUR PREVIEW */}
        <div className="p-6 rounded-2xl border border-[#E2E6E2] bg-[#F8FAF8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-3">
            <div>
              <h4 className="text-base font-bold text-[#1A1D1A] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#4B634B]" />
                <span>4. Berkas Terunggah (Fitur Preview Aktif)</span>
              </h4>
              <p className="text-xs text-[#626862] mt-0.5">
                Klik tombol <span className="font-bold text-[#4B634B]">Preview / Lihat Berkas</span> pada dokumen untuk memeriksa tampilan file sebelum dikirim.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-xs font-bold text-[#4B634B] hover:bg-[#EBF0EB] px-3 py-1.5 rounded-lg border border-[#D1D9D1] transition-colors cursor-pointer shrink-0"
            >
              Ubah Langkah 4
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docList.map((doc) => {
              const file = doc.file;
              return (
                <div
                  key={doc.key}
                  className={`p-4 rounded-xl border transition-all ${
                    file
                      ? 'bg-white border-[#E2E6E2] hover:border-[#4B634B]'
                      : 'bg-gray-50/70 border-dashed border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1A1D1A] flex items-center gap-1.5">
                      <span>{doc.title}</span>
                      {doc.isMandatory ? (
                        <span className="text-rose-500 font-bold">*</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal">(Opsional)</span>
                      )}
                    </span>
                    {file ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4B634B] bg-[#EBF0EB] px-2.5 py-1 rounded-full border border-[#D1D9D1]">
                        <CheckCircle2 className="w-3 h-3" />
                        Terunggah
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Belum Diunggah
                      </span>
                    )}
                  </div>

                  {file ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#EBF0EB] text-[#4B634B] flex items-center justify-center shrink-0 font-bold">
                          {isPdf(file.type) ? (
                            <FileText className="w-5 h-5 text-[#4B634B]" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-[#4B634B]" />
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-bold text-[#1A1D1A] truncate">{file.name}</p>
                          <p className="text-[10px] text-[#626862]">
                            {(file.size / 1024).toFixed(0)} KB • {isPdf(file.type) ? 'Dokumen PDF' : 'File Gambar'}
                          </p>
                        </div>
                      </div>

                      {/* Preview Action Controls */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#F0F3F0]">
                        <button
                          type="button"
                          onClick={() => openPreview(doc.title, file)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#4B634B] text-white font-bold text-xs hover:bg-[#3d523d] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Berkas</span>
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          download={file.name}
                          className="p-1.5 rounded-lg border border-[#E2E6E2] text-[#626862] hover:text-[#1A1D1A] hover:bg-[#F8FAF8] transition-colors flex items-center justify-center cursor-pointer"
                          title="Buka / Unduh File"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-400">
                      {doc.isMandatory ? (
                        <span className="text-rose-500 font-medium">Dokumen ini wajib diunggah pada Langkah 4</span>
                      ) : (
                        <span>Tidak ada file terunggah</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#D1D9D1] space-y-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded text-[#4B634B] focus:ring-[#4B634B] mt-1 shrink-0 cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-semibold text-[#1A1D1A] leading-relaxed">
            {settings?.cmsContent?.paktaIntegritasTeks || 'Saya menyatakan bahwa seluruh data yang telah diisikan dalam formulir pendaftaran ini adalah benar, sah, dan sesuai dengan dokumen resmi yang kami miliki. Saya bersedia mengikuti seluruh proses verifikasi fisik serta prosedur penerimaan murid baru di Madrasah.'}
          </span>
        </label>
      </div>

      {/* Action Buttons — tombol kembali hanya ada di tiap seksi ("Ubah Langkah N") di atas */}
      <div className="pt-6 border-t border-[#E2E6E2] flex flex-col items-end gap-2">
        <button
          type="button"
          disabled={!agreed || isSubmitting}
          onClick={handleSubmitClick}
          className="btn-primary px-8 py-4 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>MENGIRIM FORMULIR...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>KIRIM FORMULIR PENDAFTARAN</span>
            </>
          )}
        </button>
        {!agreed && !isSubmitting && (
          <p className="text-xs text-[#626862]">Centang pernyataan di atas untuk mengaktifkan tombol kirim.</p>
        )}
      </div>

      {/* MODAL PREVIEW BERKAS DOKUMEN */}
      {preview.isOpen && preview.file && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1A1D1A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#4B634B] flex items-center justify-center text-white font-bold">
                  {isPdf(preview.file.type) ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{preview.title}</h4>
                  <p className="text-[11px] text-gray-300 truncate max-w-xs sm:max-w-md">
                    {preview.file.name} • {(preview.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={preview.file.url}
                  target="_blank"
                  rel="noreferrer"
                  download={preview.file.name}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh / Buka Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-gray-900 overflow-auto p-4 flex items-center justify-center min-h-[350px]">
              {isPdf(preview.file.type) ? (
                <iframe
                  src={preview.file.url}
                  className="w-full h-[65vh] rounded-lg bg-white"
                  title={preview.title}
                />
              ) : (
                <div className="relative flex items-center justify-center w-full h-full">
                  <img
                    src={preview.file.url}
                    alt={preview.title}
                    className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <span>
                Diunggah pada:{' '}
                <strong className="text-gray-900">
                  {preview.file.uploadedAt ? new Date(preview.file.uploadedAt).toLocaleString('id-ID') : '-'}
                </strong>
              </span>
              <button
                type="button"
                onClick={closePreview}
                className="px-5 py-2 rounded-xl bg-gray-800 text-white font-bold hover:bg-black transition-colors cursor-pointer"
              >
                TUTUP PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
