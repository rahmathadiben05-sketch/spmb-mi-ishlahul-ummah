'use client';

import React, { useEffect, useState } from 'react';
import { User, AlertCircle, CheckCircle2, Upload, HelpCircle, ArrowRight } from 'lucide-react';
import { RegistrationType, SchoolSettings, StudentData } from '@/lib/types';
import { checkDuplication, MAX_BIRTH_DATE } from '@/lib/storage';

interface WizardStep1Props {
  data: StudentData;
  jenisPendaftaran: RegistrationType;
  onChange: (data: StudentData) => void;
  onNext: () => void;
  settings?: SchoolSettings;
  // Mode edit (Lihat/Edit Formulir dari dashboard wali): id record yang
  // sedang diedit, supaya cek duplikat mengabaikan NIK/NISN milik sendiri.
  // Tanpa ini, wali yang membuka formulirnya sendiri langsung diblokir
  // banner "NIK sudah pernah terdaftar" (temuan tinjauan 13 Nov).
  excludeRegId?: string;
}

// Opsi selaras EMIS 4.0 — Tab DATA SISWA (area 5, 2026-11-10)
const KEWARGANEGARAAN_OPTIONS = ['WNI', 'WNA'];
const AGAMA_OPTIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Kong hu cu'];
const HOBI_OPTIONS = ['Olahraga', 'Kesenian', 'Membaca', 'Menulis', 'Jalan-jalan', 'Lainnya'];
const CITA_CITA_OPTIONS = [
  'PNS',
  'TNI/Polri',
  'Guru/Dosen',
  'Dokter',
  'Politikus',
  'Wiraswasta',
  'Seniman/Artis',
  'Ilmuwan',
  'Agamawan',
  'Lainnya',
];
const PEMBIAYA_OPTIONS = ['Orang Tua', 'Wali/Orang Tua Asuh', 'Tanggungan Sendiri', 'Lainnya'];
const IMUNISASI_OPTIONS: Array<{ key: keyof StudentData; label: string }> = [
  { key: 'imunisasiHepatitisB', label: 'Hepatitis B' },
  { key: 'imunisasiPolio', label: 'Polio' },
  { key: 'imunisasiBcg', label: 'BCG' },
  { key: 'imunisasiCampak', label: 'Campak' },
  { key: 'imunisasiDpt', label: 'DPT' },
  { key: 'imunisasiCovid', label: 'Covid' },
];

export const WizardStep1: React.FC<WizardStep1Props> = ({
  data,
  jenisPendaftaran,
  onChange,
  onNext,
  settings,
  excludeRegId,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  // Ketik tanggal manual (v2.12): pemilih tanggal bawaan browser sulit
  // diketik di desktop — kolom teks HH/BB/TTTT ini mem-parsing ke nilai
  // ISO yang sama dengan pemilih tanggal. Keduanya menulis state yang sama.
  const formatDobText = (iso: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  };
  const parseDobText = (text: string): string | null => {
    const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text.trim());
    if (!m) return null;
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  const [dobText, setDobText] = useState<string>(() => formatDobText(data.tanggalLahir || ''));
  const [dobTextInvalid, setDobTextInvalid] = useState(false);
  // Sinkronkan teks ketik bila tanggal berubah dari luar (pemilih tanggal /
  // restore draft). Saat mengetik tanggal belum lengkap, nilai ISO tidak
  // berubah sehingga teks ketikan tidak tertimpa.
  useEffect(() => {
    setDobText(formatDobText(data.tanggalLahir || ''));
  }, [data.tanggalLahir]);

  const handleChange = (field: keyof StudentData, value: any) => {
    const updated = { ...data, [field]: value };
    onChange(updated);

    // Clear error for field
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    // Pemeriksaan duplikasi NIK / KK / NISN saat diketik
    if (field === 'nik' && value.length === 16) {
      const res = checkDuplication(value, updated.noKk || '', updated.nisn);
      if (res.isDuplicate) setDupWarning(res.message || null);
      else setDupWarning(null);
    } else if (field === 'noKk' && value.length === 16) {
      const res = checkDuplication(updated.nik || '', value, updated.nisn);
      if (res.isDuplicate) setDupWarning(res.message || null);
      else setDupWarning(null);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.namaLengkap?.trim()) errs.namaLengkap = 'Nama Lengkap wajib diisi.';
    if (!data.namaPanggilan?.trim()) errs.namaPanggilan = 'Nama Panggilan wajib diisi.';

    // NIK check exact 16 digits
    const cleanNik = (data.nik || '').trim();
    if (!cleanNik) {
      errs.nik = 'NIK Wajib diisi.';
    } else if (!/^\d{16}$/.test(cleanNik)) {
      errs.nik = 'NIK harus tepat 16 digit angka.';
    }

    // No KK check exact 16 digits
    const cleanKk = (data.noKk || '').trim();
    if (!cleanKk) {
      errs.noKk = 'Nomor KK Wajib diisi.';
    } else if (!/^\d{16}$/.test(cleanKk)) {
      errs.noKk = 'Nomor KK harus tepat 16 digit angka.';
    }

    if (!data.tempatLahir?.trim()) errs.tempatLahir = 'Tempat Lahir wajib diisi.';
    if (!data.tanggalLahir) errs.tanggalLahir = 'Tanggal Lahir wajib diisi.';
    else if (data.tanggalLahir > MAX_BIRTH_DATE) errs.tanggalLahir = 'Calon santri belum berusia 6 tahun per 1 Juli 2027 (tanggal lahir paling lambat 1 Juli 2021).';
    if (!data.jenisKelamin) errs.jenisKelamin = 'Pilih Jenis Kelamin.';

    // NISN & KIP bersifat opsional — bila diisi, hanya formatnya yang diperiksa.
    const cleanNisn = (data.nisn || '').trim();
    if (cleanNisn && !/^\d{10}$/.test(cleanNisn)) {
      errs.nisn = 'NISN harus tepat 10 digit angka. Kosongkan bila belum memiliki NISN.';
    }
    const cleanKip = (data.nomorKip || '').trim();
    if (cleanKip && !/^\d{6,10}$/.test(cleanKip)) {
      errs.nomorKip = 'Nomor KIP harus 6–10 digit angka. Kosongkan bila tidak memiliki KIP.';
    }

    if (data.anakKe === undefined || data.anakKe === null || Number.isNaN(data.anakKe) || data.anakKe < 1) {
      errs.anakKe = 'Anak ke- minimal 1.';
    }
    if (data.jumlahSaudara === undefined || data.jumlahSaudara === null || Number.isNaN(data.jumlahSaudara) || data.jumlahSaudara < 0) {
      errs.jumlahSaudara = 'Jumlah saudara minimal 0.';
    }
    if (!data.asalSekolah?.trim()) errs.asalSekolah = 'Asal TK/RA/SD wajib diisi.';

    // Wajib EMIS (3 field) + validasi email siswa bila diisi
    if (!data.kewarganegaraan) errs.kewarganegaraan = 'Pilih Kewarganegaraan (wajib diisi untuk EMIS).';
    if (!data.agama) errs.agama = 'Pilih Agama (wajib diisi untuk EMIS).';
    if (!data.yangMembiayaiSekolah) errs.yangMembiayaiSekolah = 'Pilih Yang Membiayai Sekolah (wajib diisi untuk EMIS).';
    if (data.emailSiswa?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailSiswa.trim())) {
      errs.emailSiswa = 'Format email siswa tidak valid.';
    }

    if (jenisPendaftaran === 'pindahan') {
      if (!data.asalSekolahPindahan?.trim()) errs.asalSekolahPindahan = 'Asal Sekolah Pindahan wajib diisi.';
      if (!data.kelasTerakhirPindahan?.trim()) errs.kelasTerakhirPindahan = 'Kelas Terakhir wajib diisi.';
      if (!data.alasanPindah?.trim()) errs.alasanPindah = 'Alasan Pindah wajib diisi.';
    }

    // Final duplication check — kecualikan record yang sedang diedit
    // (mode edit wali), supaya NIK/NISN sendiri tidak dianggap duplikat.
    if (cleanNik.length === 16 && cleanKk.length === 16) {
      const res = checkDuplication(cleanNik, cleanKk, data.nisn, excludeRegId);
      if (res.isDuplicate) {
        errs.duplication = res.message || 'Data sudah pernah terdaftar.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleNextClick} className="bg-white rounded-xl p-8 sm:p-10 border border-[#E2E6E2] shadow-xs space-y-8">
      <div className="flex items-center gap-3.5 pb-5 border-b border-[#E2E6E2]">
        <div className="w-10 h-10 rounded-xl bg-[#EBF0EB] text-[#4B634B] flex items-center justify-center font-bold">
          <User className="w-5 h-5 text-[#4B634B]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1A1D1A]">
            {settings?.cmsContent?.step1Title || 'LANGKAH 1: Data Calon Siswa'}
          </h3>
          <p className="text-xs text-[#626862]">
            {settings?.cmsContent?.step1Subtitle || 'Isi identitas anak sesuai Dokumen Akta Kelahiran dan Kartu Keluarga (KK).'}
          </p>
        </div>
      </div>

      {settings?.cmsContent?.step1Notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{settings.cmsContent.step1Notice}</span>
        </div>
      )}

      {dupWarning && (
        <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#D1D9D1] text-[#1A1D1A] text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#4B634B] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Peringatan Duplikasi Data</p>
            <p className="mt-0.5">{dupWarning}</p>
          </div>
        </div>
      )}

      {errors.duplication && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Tidak Dapat Melanjutkan</p>
            <p className="mt-0.5">{errors.duplication}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Nama Lengkap */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Nama Lengkap Anak <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.namaLengkap || ''}
            onChange={(e) => handleChange('namaLengkap', e.target.value)}
            placeholder="Sesuai Akta Kelahiran (contoh: Muhammad Rayhan Fauzi)"
            className={`m3-input font-medium ${
              errors.namaLengkap ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.namaLengkap && <p className="text-xs text-rose-500 mt-1">{errors.namaLengkap}</p>}
        </div>

        {/* Nama Panggilan */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Nama Panggilan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.namaPanggilan || ''}
            onChange={(e) => handleChange('namaPanggilan', e.target.value)}
            placeholder="Contoh: Rayhan"
            className={`m3-input font-medium ${
              errors.namaPanggilan ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.namaPanggilan && <p className="text-xs text-rose-500 mt-1">{errors.namaPanggilan}</p>}
        </div>

        {/* NISN (Opsional) */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            NISN <span className="text-[#626862] font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            maxLength={10}
            value={data.nisn || ''}
            onChange={(e) => handleChange('nisn', e.target.value.replace(/\D/g, ''))}
            placeholder="10 digit NISN jika ada"
            className={`m3-input font-medium ${
              errors.nisn ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.nisn ? (
            <p className="text-xs text-rose-500 mt-1">{errors.nisn}</p>
          ) : (
            <p className="text-[11px] text-[#626862] mt-1">Kosongkan bila belum memiliki NISN.</p>
          )}
        </div>

        {/* Nomor KIP (Opsional) */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#1A1D1A] uppercase tracking-wider">
              Nomor KIP / Kartu Indonesia Pintar <span className="text-[#626862] font-normal">(Opsional)</span>
            </label>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Program Bantuan Pemerintah
            </span>
          </div>
          <input
            type="text"
            maxLength={10}
            value={data.nomorKip || ''}
            onChange={(e) => handleChange('nomorKip', e.target.value.replace(/\D/g, ''))}
            placeholder="Isikan 6–10 digit kode KIP jika anak memiliki Kartu Indonesia Pintar / PIP"
            className={`m3-input font-medium ${
              errors.nomorKip ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.nomorKip ? (
            <p className="text-xs text-rose-500 mt-1">{errors.nomorKip}</p>
          ) : (
            <p className="text-[11px] text-[#626862] mt-1">Kosongkan jika calon santri belum/tidak memiliki KIP.</p>
          )}
        </div>

        {/* NIK (Wajib 16 Digit) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#1A1D1A] uppercase tracking-wider">
              NIK Anak (16 Digit) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-[#626862]">
              {(data.nik || '').length}/16
            </span>
          </div>
          <input
            type="text"
            maxLength={16}
            value={data.nik || ''}
            onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, ''))}
            placeholder="3515xxxxxxxxxxxx"
            className={`m3-input font-mono font-bold tracking-wider ${
              errors.nik ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.nik && <p className="text-xs text-rose-500 mt-1">{errors.nik}</p>}
        </div>

        {/* Nomor KK (Wajib 16 Digit) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#1A1D1A] uppercase tracking-wider">
              Nomor Kartu Keluarga (KK) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-[#626862]">
              {(data.noKk || '').length}/16
            </span>
          </div>
          <input
            type="text"
            maxLength={16}
            value={data.noKk || ''}
            onChange={(e) => handleChange('noKk', e.target.value.replace(/\D/g, ''))}
            placeholder="3515xxxxxxxxxxxx"
            className={`m3-input font-mono font-bold tracking-wider ${
              errors.noKk ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.noKk && <p className="text-xs text-rose-500 mt-1">{errors.noKk}</p>}
        </div>

        {/* Tempat Lahir */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Tempat Lahir <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.tempatLahir || ''}
            onChange={(e) => handleChange('tempatLahir', e.target.value)}
            placeholder="Kota/Kabupaten kelahiran"
            className={`m3-input font-medium ${
              errors.tempatLahir ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.tempatLahir && <p className="text-xs text-rose-500 mt-1">{errors.tempatLahir}</p>}
        </div>

        {/* Tanggal Lahir */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Tanggal Lahir <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={data.tanggalLahir || ''}
            onChange={(e) => handleChange('tanggalLahir', e.target.value)}
            max={MAX_BIRTH_DATE}
            className={`m3-input font-medium ${
              errors.tanggalLahir ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          <input
            type="text"
            inputMode="numeric"
            value={dobText}
            placeholder="atau ketik: HH/BB/TTTT (cth. 15/06/2020)"
            aria-label="Ketik tanggal lahir (hari/bulan/tahun)"
            onChange={(e) => {
              const text = e.target.value;
              setDobText(text);
              if (text.trim() === '') {
                setDobTextInvalid(false);
                handleChange('tanggalLahir', '');
                return;
              }
              const iso = parseDobText(text);
              if (iso) {
                setDobTextInvalid(false);
                handleChange('tanggalLahir', iso);
              } else {
                setDobTextInvalid(true);
              }
            }}
            className={`m3-input font-medium mt-2 ${
              dobTextInvalid ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {dobTextInvalid && (
            <p className="text-xs text-rose-500 mt-1">Format tanggal: HH/BB/TTTT, contoh 15/06/2020.</p>
          )}
          {errors.tanggalLahir ? (
            <p className="text-xs text-rose-500 mt-1">{errors.tanggalLahir}</p>
          ) : (
            <p className="text-xs text-[#78716C] mt-1">Minimal berusia 6 tahun per 1 Juli 2027.</p>
          )}
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Jenis Kelamin <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('jenisKelamin', 'L')}
              className={`py-3 px-4 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                data.jenisKelamin === 'L'
                  ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                  : 'bg-[#F8FAF8] text-[#1A1D1A] border-[#D1D9D1] hover:bg-[#EBF0EB]'
              }`}
            >
              Laki-Laki (L)
            </button>
            <button
              type="button"
              onClick={() => handleChange('jenisKelamin', 'P')}
              className={`py-3 px-4 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                data.jenisKelamin === 'P'
                  ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                  : 'bg-[#F8FAF8] text-[#1A1D1A] border-[#D1D9D1] hover:bg-[#EBF0EB]'
              }`}
            >
              Perempuan (P)
            </button>
          </div>
          {errors.jenisKelamin && <p className="text-xs text-rose-500 mt-1">{errors.jenisKelamin}</p>}
        </div>

        {/* Anak Ke & Jumlah Saudara */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Anak Ke-
            </label>
            <input
              type="number"
              min={1}
              value={data.anakKe || ''}
              onChange={(e) => handleChange('anakKe', parseInt(e.target.value) || 0)}
              className={`m3-input font-medium ${
                errors.anakKe ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.anakKe && <p className="text-xs text-rose-500 mt-1">{errors.anakKe}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Jumlah Saudara
            </label>
            <input
              type="number"
              min={0}
              value={data.jumlahSaudara ?? 0}
              onChange={(e) => handleChange('jumlahSaudara', parseInt(e.target.value) || 0)}
              className={`m3-input font-medium ${
                errors.jumlahSaudara ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.jumlahSaudara && <p className="text-xs text-rose-500 mt-1">{errors.jumlahSaudara}</p>}
          </div>
        </div>

        {/* Asal TK/RA */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Asal TK / RA / PAUD / SD <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.asalSekolah || ''}
            onChange={(e) => handleChange('asalSekolah', e.target.value)}
            placeholder="Contoh: RA Perwanida 1 Buduran / PAUD Melati"
            className={`m3-input font-medium ${
              errors.asalSekolah ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.asalSekolah && <p className="text-xs text-rose-500 mt-1">{errors.asalSekolah}</p>}
        </div>

        {/* Berkebutuhan Khusus (opsional — dropdown sesuai EMIS) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Berkebutuhan Khusus <span className="text-[#626862] font-normal">(Opsional — kosongkan bila tidak ada)</span>
          </label>
          <select
            value={data.kebutuhanKhusus || ''}
            onChange={(e) => handleChange('kebutuhanKhusus', e.target.value)}
            className="m3-input font-medium"
          >
            <option value="">— Tidak Ada —</option>
            {['Lamban Belajar', 'Kesulitan Belajar spesifik', 'Gangguan komunikasi', 'Berbakat/memiliki kemampuan dan kecerdasan luar biasa', 'Lainnya'].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <p className="text-[11px] text-[#78716C] mt-1">Diisi hanya bila ada kebutuhan khusus agar madrasah dapat menyiapkan pendampingan yang sesuai.</p>
        </div>

        {/* Kebutuhan Disabilitas (opsional — sesuai EMIS, boleh pilih lebih dari satu) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Kebutuhan Disabilitas <span className="text-[#626862] font-normal">(Opsional — kosongkan bila tidak ada)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {['Tidak Ada', 'Tuna Netra', 'Tuna Rungu', 'Tuna Daksa', 'Tuna Grahita', 'Tuna Laras', 'Tuna Wicara', 'Lainnya'].map((opt) => {
              const cur = (data.kebutuhanDisabilitas || '').split(',').map((s) => s.trim()).filter(Boolean);
              const checked = cur.includes(opt);
              return (
                <label key={opt} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${checked ? 'bg-[#EAF4EF] border-[#145C43] text-[#145C43]' : 'bg-white border-[#E2E6E2] text-[#52625B]'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked ? cur.filter((v) => v !== opt) : [...cur, opt];
                      handleChange('kebutuhanDisabilitas', next.join(', '));
                    }}
                    className="accent-[#145C43]"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>

        {/* Data Tambahan Sesuai EMIS 4.0 (Tab DATA SISWA) */}
        <div className="sm:col-span-2 p-6 rounded-xl bg-[#F8FAF8] border border-[#D1D9D1] space-y-5">
          <h4 className="text-xs font-bold text-[#4B634B] uppercase tracking-wider">
            Data Tambahan — Sesuai EMIS (untuk pendataan madrasah)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Kewarganegaraan (WAJIB EMIS) */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Kewarganegaraan <span className="text-rose-500">*</span>
              </label>
              <select
                value={data.kewarganegaraan || ''}
                onChange={(e) => handleChange('kewarganegaraan', e.target.value as 'WNI' | 'WNA')}
                className={`m3-input bg-white font-medium ${
                  errors.kewarganegaraan ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              >
                <option value="" disabled>-- Pilih --</option>
                {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.kewarganegaraan && <p className="text-xs text-rose-500 mt-1">{errors.kewarganegaraan}</p>}
            </div>

            {/* Agama (WAJIB EMIS) */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Agama <span className="text-rose-500">*</span>
              </label>
              <select
                value={data.agama || ''}
                onChange={(e) => handleChange('agama', e.target.value)}
                className={`m3-input bg-white font-medium ${
                  errors.agama ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              >
                <option value="" disabled>-- Pilih --</option>
                {AGAMA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.agama && <p className="text-xs text-rose-500 mt-1">{errors.agama}</p>}
            </div>

            {/* Hobi */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Hobi <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.hobi || ''}
                onChange={(e) => handleChange('hobi', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih --</option>
                {HOBI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Cita-cita */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Cita-cita <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.citaCita || ''}
                onChange={(e) => handleChange('citaCita', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih --</option>
                {CITA_CITA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Yang Membiayai Sekolah (WAJIB EMIS) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Yang Membiayai Sekolah <span className="text-rose-500">*</span>
              </label>
              <select
                value={data.yangMembiayaiSekolah || ''}
                onChange={(e) => handleChange('yangMembiayaiSekolah', e.target.value)}
                className={`m3-input bg-white font-medium ${
                  errors.yangMembiayaiSekolah ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              >
                <option value="" disabled>-- Pilih --</option>
                {PEMBIAYA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.yangMembiayaiSekolah && <p className="text-xs text-rose-500 mt-1">{errors.yangMembiayaiSekolah}</p>}
            </div>

            {/* Email Siswa */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Alamat Email Siswa <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <input
                type="email"
                value={data.emailSiswa || ''}
                onChange={(e) => handleChange('emailSiswa', e.target.value)}
                placeholder="contoh@email.com"
                className={`m3-input bg-white font-medium ${
                  errors.emailSiswa ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              />
              {errors.emailSiswa ? (
                <p className="text-xs text-rose-500 mt-1">{errors.emailSiswa}</p>
              ) : (
                <p className="text-[11px] text-[#626862] mt-1">Kosongkan bila siswa belum memiliki email.</p>
              )}
            </div>

            {/* NIS Lokal */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                NIS Lokal <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={data.nisLokal || ''}
                onChange={(e) => handleChange('nisLokal', e.target.value)}
                placeholder="Nomor Induk Siswa madrasah (bila sudah ada)"
                className="m3-input bg-white font-medium"
              />
            </div>

            {/* Nomor KKS */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Nomor KKS <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={data.nomorKks || ''}
                onChange={(e) => handleChange('nomorKks', e.target.value)}
                placeholder="Nomor Kartu Keluarga Sejahtera (bila ada)"
                className="m3-input bg-white font-medium"
              />
            </div>

            {/* Nomor PKH */}
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Nomor PKH <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={data.nomorPkh || ''}
                onChange={(e) => handleChange('nomorPkh', e.target.value)}
                placeholder="Nomor Program Keluarga Harapan (bila ada)"
                className="m3-input bg-white font-medium"
              />
            </div>
          </div>

          {/* Pra Sekolah */}
          <div>
            <span className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Pra Sekolah <span className="text-[#626862] font-normal">(Opsional — centang bila pernah)</span>
            </span>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#1A1D1A]">
                <input
                  type="checkbox"
                  checked={Boolean(data.praSekolahTkRa)}
                  onChange={(e) => handleChange('praSekolahTkRa', e.target.checked)}
                  className="w-4 h-4 rounded text-[#4B634B] focus:ring-[#4B634B]"
                />
                Pernah TK/RA
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#1A1D1A]">
                <input
                  type="checkbox"
                  checked={Boolean(data.praSekolahPaud)}
                  onChange={(e) => handleChange('praSekolahPaud', e.target.checked)}
                  className="w-4 h-4 rounded text-[#4B634B] focus:ring-[#4B634B]"
                />
                Pernah PAUD
              </label>
            </div>
          </div>

          {/* Imunisasi */}
          <div>
            <span className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Imunisasi <span className="text-[#626862] font-normal">(Opsional — centang yang pernah diterima)</span>
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {IMUNISASI_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#1A1D1A]">
                  <input
                    type="checkbox"
                    checked={Boolean(data[opt.key])}
                    onChange={(e) => handleChange(opt.key, e.target.checked)}
                    className="w-4 h-4 rounded text-[#4B634B] focus:ring-[#4B634B]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Conditional Fields for Siswa Pindahan */}
        {jenisPendaftaran === 'pindahan' && (
          <div className="sm:col-span-2 p-6 rounded-xl bg-[#F8FAF8] border border-[#D1D9D1] space-y-4">
            <h4 className="text-xs font-bold text-[#4B634B] uppercase tracking-wider">
              Informasi Khusus Siswa Pindahan
            </h4>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5">
                Nama SD/MI Asal Asli <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={data.asalSekolahPindahan || ''}
                onChange={(e) => handleChange('asalSekolahPindahan', e.target.value)}
                placeholder="Contoh: SDN Waru 1 Surabaya"
                className="m3-input bg-white"
              />
              {errors.asalSekolahPindahan && (
                <p className="text-xs text-rose-500 mt-1">{errors.asalSekolahPindahan}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5">
                  Kelas Terakhir Diikuti <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.kelasTerakhirPindahan || ''}
                  onChange={(e) => handleChange('kelasTerakhirPindahan', e.target.value)}
                  placeholder="Contoh: Kelas 2 Semester 1"
                  className="m3-input bg-white"
                />
                {errors.kelasTerakhirPindahan && (
                  <p className="text-xs text-rose-500 mt-1">{errors.kelasTerakhirPindahan}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5">
                  Alasan Pindah Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.alasanPindah || ''}
                  onChange={(e) => handleChange('alasanPindah', e.target.value)}
                  placeholder="Contoh: Pindah tugas domisili orang tua"
                  className="m3-input bg-white"
                />
                {errors.alasanPindah && (
                  <p className="text-xs text-rose-500 mt-1">{errors.alasanPindah}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-[#E2E6E2] flex justify-end">
        <button
          type="submit"
          className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>LANJUT KE LANGKAH 2 (DATA ORANG TUA)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
