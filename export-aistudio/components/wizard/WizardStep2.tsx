'use client';

import React, { useState } from 'react';
import { Users, ArrowRight, ArrowLeft, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ParentData, ParentDetail, ParentLifeStatus, SchoolSettings, StatusWaliEmis } from '@/lib/types';

interface WizardStep2Props {
  data: ParentData;
  onChange: (data: ParentData) => void;
  onNext: () => void;
  onPrev: () => void;
  settings?: SchoolSettings;
}

export const PARENT_STATUS_OPTIONS: ParentLifeStatus[] = [
  'Masih Hidup',
  'Sudah Meninggal',
  'Tidak Diketahui',
];

// Opsi selaras EMIS 4.0 — Tab DATA ORANG TUA (area 5, 2026-11-10)
export const EDUCATION_OPTIONS = [
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/Sederajat',
  'D1',
  'D2',
  'D3',
  'D4/S1',
  'S2',
  'S3',
  'Tidak Bersekolah',
  'Lainnya',
];

export const JOB_OPTIONS = [
  'Tidak Bekerja',
  'Pensiunan',
  'PNS',
  'TNI/Polisi',
  'Guru/Dosen',
  'Pegawai Swasta',
  'Wiraswasta',
  'Pengacara/Jaksa/Hakim/Notaris',
  'Seniman/Pelukis/Artis/Sejenis',
  'Dokter/Bidan/Perawat',
  'Pilot/Pramugara',
  'Pedagang',
  'Petani/Peternak',
  'Nelayan',
  'Buruh (Tani/Pabrik/Bangunan)',
  'Sopir/Masinis/Kondektur',
  'Politikus',
  'Lainnya',
];

// EMIS: Penghasilan Rata-rata per Bulan (Rp)
export const INCOME_OPTIONS = [
  'Di bawah 800.000',
  '800.001–1.200.000',
  '1.200.001–1.800.000',
  '1.800.001–2.500.000',
  '2.500.001–3.500.000',
  '3.500.001–4.800.000',
  '4.800.001–6.500.000',
  '6.500.001–10.000.000',
  '10.000.001–20.000.000',
  'Di atas 20.000.001',
];

export const KEWARGANEGARAAN_OPTIONS = ['WNI', 'WNA'];

export const STATUS_WALI_OPTIONS = [
  'Sama dengan ayah kandung',
  'Sama dengan ibu kandung',
  'Lainnya',
];

export const WizardStep2: React.FC<WizardStep2Props> = ({
  data,
  onChange,
  onNext,
  onPrev,
  settings,
}) => {
  const [showWali, setShowWali] = useState(data.wali?.hasWali || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFatherChange = (field: keyof ParentDetail, val: string) => {
    onChange({
      ...data,
      ayah: { ...data.ayah, [field]: val },
    });
  };

  const handleMotherChange = (field: keyof ParentDetail, val: string) => {
    onChange({
      ...data,
      ibu: { ...data.ibu, [field]: val },
    });
  };

  const handleWaliChange = (field: string, val: string) => {
    const currentWali = data.wali || {
      nik: '',
      namaLengkap: '',
      status: undefined as unknown as ParentLifeStatus,
      tempatLahir: '',
      tanggalLahir: '',
      pendidikan: '',
      pekerjaan: '',
      penghasilan: '',
      noHp: '',
      hasWali: true,
      hubungan: '',
    };
    onChange({
      ...data,
      wali: { ...currentWali, [field]: val, hasWali: true },
    });
  };

  const handleStatusWaliChange = (val: StatusWaliEmis | '') => {
    if (!val) {
      // Dikosongkan (opsional) — hanya hapus status, jangan sentuh data wali
      onChange({ ...data, statusWali: undefined });
      return;
    }
    if (val === 'Lainnya') {
      setShowWali(true);
      onChange({ ...data, statusWali: val });
    } else {
      // Wali sama dengan ayah/ibu kandung — tidak perlu isian wali terpisah
      setShowWali(false);
      onChange({ ...data, statusWali: val, wali: undefined });
    }
  };

  // NIK orang tua/wali bersifat opsional — bila diisi harus tepat 16 digit angka.
  const validateNik = (nik: string | undefined, key: string, label: string, errs: Record<string, string>) => {
    const clean = (nik || '').trim();
    if (clean && !/^\d{16}$/.test(clean)) {
      errs[key] = `${label} harus tepat 16 digit angka. Kosongkan bila tidak ada.`;
    }
  };

  // No. HP orang tua/wali — bila diisi harus format Indonesia, minimal 10 digit angka.
  const validateHp = (hp: string | undefined, key: string, label: string, errs: Record<string, string>) => {
    const clean = (hp || '').replace(/[\s-]/g, '').trim();
    if (clean && !/^(\+?62|0)8\d{7,}$/.test(clean)) {
      errs[key] = `${label} tidak valid. Gunakan nomor HP Indonesia (contoh: 0812xxxxxxxx, minimal 10 digit).`;
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    // Status harus dipilih eksplisit — tidak ada default yang sudah tersorot.
    if (!data.ayah?.status) errs.ayahStatus = 'Pilih status Ayah Kandung.';
    if (!data.ibu?.status) errs.ibuStatus = 'Pilih status Ibu Kandung.';
    // Nama hanya wajib bila orang tua masih hidup.
    if (data.ayah?.status === 'Masih Hidup' && !data.ayah?.namaLengkap?.trim()) {
      errs.ayahNama = 'Nama Ayah wajib diisi.';
    }
    if (data.ibu?.status === 'Masih Hidup' && !data.ibu?.namaLengkap?.trim()) {
      errs.ibuNama = 'Nama Ibu wajib diisi.';
    }
    validateNik(data.ayah?.nik, 'ayahNik', 'NIK Ayah', errs);
    validateNik(data.ibu?.nik, 'ibuNik', 'NIK Ibu', errs);
    validateHp(data.ayah?.noHp, 'ayahHp', 'No. HP Ayah', errs);
    validateHp(data.ibu?.noHp, 'ibuHp', 'No. HP Ibu', errs);
    // K14: minimal satu No. HP orang tua WAJIB valid — No HP adalah
    // kredensial login wali (bukan field EMIS opsional).
    const hpValid = (hp: string | undefined) => {
      const d = (hp || '').replace(/\D/g, '');
      return d.length >= 10 && /^(62|0)8/.test(d);
    };
    if (!hpValid(data.ayah?.noHp) && !hpValid(data.ibu?.noHp)) {
      const msg = 'Isi minimal satu No. HP orang tua (Ayah atau Ibu) yang aktif — dipakai untuk login wali.';
      if (!errs.ayahHp) errs.ayahHp = msg;
      if (!errs.ibuHp) errs.ibuHp = msg;
    }
    if (showWali && data.wali) {
      validateNik(data.wali.nik, 'waliNik', 'NIK Wali', errs);
      validateHp(data.wali.noHp, 'waliHp', 'No. HP Wali', errs);
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
          <Users className="w-5 h-5 text-[#4B634B]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1A1D1A]">
            {settings?.cmsContent?.step2Title || 'LANGKAH 2: Data Orang Tua / Wali'}
          </h3>
          <p className="text-xs text-[#626862]">
            {settings?.cmsContent?.step2Subtitle || 'Lengkapi data identitas Ayah Kandung, Ibu Kandung, dan data Wali jika ada.'}
          </p>
        </div>
      </div>

      {settings?.cmsContent?.step2Notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{settings.cmsContent.step2Notice}</span>
        </div>
      )}

      {/* ================= BAGIAN AYAH ================= */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[#4B634B] font-bold text-xs uppercase tracking-wider bg-[#EBF0EB] px-4 py-2.5 rounded-xl border border-[#D1D9D1]">
          <User className="w-4 h-4 text-[#4B634B]" />
          <span>BAGIAN DATA AYAH KANDUNG</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Status Ayah */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Status Ayah Kandung <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PARENT_STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleFatherChange('status', st)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    data.ayah?.status === st
                      ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                      : 'bg-white text-[#1A1D1A] border-[#D1D9D1] hover:bg-[#F8FAF8]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            {errors.ayahStatus && <p className="text-xs text-rose-500 mt-1">{errors.ayahStatus}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Nama Lengkap Ayah{' '}
              {data.ayah?.status === 'Masih Hidup' ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-[#626862] font-normal">(Opsional)</span>
              )}
            </label>
            <input
              type="text"
              value={data.ayah?.namaLengkap || ''}
              onChange={(e) => handleFatherChange('namaLengkap', e.target.value)}
              placeholder="Contoh: Ahmad Fauzi, S.E."
              className={`m3-input font-medium ${
                errors.ayahNama ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ayahNama && <p className="text-xs text-rose-500 mt-1">{errors.ayahNama}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              NIK Ayah Kandung <span className="text-[#626862] font-normal">(Opsional, 16 Digit)</span>
            </label>
            <input
              type="text"
              maxLength={16}
              value={data.ayah?.nik || ''}
              onChange={(e) => handleFatherChange('nik', e.target.value.replace(/\D/g, ''))}
              placeholder="16 digit NIK Ayah sesuai KK — kosongkan bila tidak ada"
              className={`m3-input font-mono font-medium ${
                errors.ayahNik ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ayahNik && <p className="text-xs text-rose-500 mt-1">{errors.ayahNik}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tempat Lahir Ayah <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <input
              type="text"
              value={data.ayah?.tempatLahir || ''}
              onChange={(e) => handleFatherChange('tempatLahir', e.target.value)}
              placeholder="Kota kelahiran Ayah"
              className="m3-input font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tanggal Lahir Ayah <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <input
              type="date"
              value={data.ayah?.tanggalLahir || ''}
              onChange={(e) => handleFatherChange('tanggalLahir', e.target.value)}
              className="m3-input font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pendidikan Terakhir <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ayah?.pendidikan || ''}
              onChange={(e) => handleFatherChange('pendidikan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pekerjaan Utama <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ayah?.pekerjaan || ''}
              onChange={(e) => handleFatherChange('pekerjaan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {JOB_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Penghasilan Per Bulan <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ayah?.penghasilan || ''}
              onChange={(e) => handleFatherChange('penghasilan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {INCOME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">No. WhatsApp / HP Ayah <span className="text-[#626862] font-normal">(wajib salah satu dari Ayah/Ibu)</span></label>
            <input
              type="text"
              value={data.ayah?.noHp || ''}
              onChange={(e) => handleFatherChange('noHp', e.target.value)}
              placeholder="0812xxxxxxxx"
              className={`m3-input font-medium ${
                errors.ayahHp ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ayahHp && <p className="text-xs text-rose-500 mt-1">{errors.ayahHp}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Kewarganegaraan Ayah <span className="text-[#626862] font-normal">(Opsional)</span>
            </label>
            <select
              value={data.ayah?.kewarganegaraan || ''}
              onChange={(e) => handleFatherChange('kewarganegaraan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="">-- Pilih (boleh dikosongkan) --</option>
              {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#626862] mt-1">Boleh dikosongkan.</p>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN IBU ================= */}
      <div className="space-y-5 pt-6 border-t border-[#E2E6E2]">
        <div className="flex items-center gap-2 text-[#4B634B] font-bold text-xs uppercase tracking-wider bg-[#EBF0EB] px-4 py-2.5 rounded-xl border border-[#D1D9D1]">
          <User className="w-4 h-4 text-[#4B634B]" />
          <span>BAGIAN DATA IBU KANDUNG</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Status Ibu */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Status Ibu Kandung <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PARENT_STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleMotherChange('status', st)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    data.ibu?.status === st
                      ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                      : 'bg-white text-[#1A1D1A] border-[#D1D9D1] hover:bg-[#F8FAF8]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            {errors.ibuStatus && <p className="text-xs text-rose-500 mt-1">{errors.ibuStatus}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Nama Lengkap Ibu{' '}
              {data.ibu?.status === 'Masih Hidup' ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-[#626862] font-normal">(Opsional)</span>
              )}
            </label>
            <input
              type="text"
              value={data.ibu?.namaLengkap || ''}
              onChange={(e) => handleMotherChange('namaLengkap', e.target.value)}
              placeholder="Contoh: Siti Rahmawati, S.Pd."
              className={`m3-input font-medium ${
                errors.ibuNama ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ibuNama && <p className="text-xs text-rose-500 mt-1">{errors.ibuNama}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              NIK Ibu Kandung <span className="text-[#626862] font-normal">(Opsional, 16 Digit)</span>
            </label>
            <input
              type="text"
              maxLength={16}
              value={data.ibu?.nik || ''}
              onChange={(e) => handleMotherChange('nik', e.target.value.replace(/\D/g, ''))}
              placeholder="16 digit NIK Ibu sesuai KK — kosongkan bila tidak ada"
              className={`m3-input font-mono font-medium ${
                errors.ibuNik ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ibuNik && <p className="text-xs text-rose-500 mt-1">{errors.ibuNik}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tempat Lahir Ibu <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <input
              type="text"
              value={data.ibu?.tempatLahir || ''}
              onChange={(e) => handleMotherChange('tempatLahir', e.target.value)}
              placeholder="Kota kelahiran Ibu"
              className="m3-input font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tanggal Lahir Ibu <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <input
              type="date"
              value={data.ibu?.tanggalLahir || ''}
              onChange={(e) => handleMotherChange('tanggalLahir', e.target.value)}
              className="m3-input font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pendidikan Terakhir <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ibu?.pendidikan || ''}
              onChange={(e) => handleMotherChange('pendidikan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pekerjaan Utama <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ibu?.pekerjaan || ''}
              onChange={(e) => handleMotherChange('pekerjaan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {JOB_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Penghasilan Per Bulan <span className="text-[#626862] font-normal">(Opsional)</span></label>
            <select
              value={data.ibu?.penghasilan || ''}
              onChange={(e) => handleMotherChange('penghasilan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="" disabled>-- Pilih --</option>
              {INCOME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">No. WhatsApp / HP Ibu <span className="text-[#626862] font-normal">(wajib salah satu dari Ayah/Ibu)</span></label>
            <input
              type="text"
              value={data.ibu?.noHp || ''}
              onChange={(e) => handleMotherChange('noHp', e.target.value)}
              placeholder="0819xxxxxxxx"
              className={`m3-input font-medium ${
                errors.ibuHp ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            />
            {errors.ibuHp && <p className="text-xs text-rose-500 mt-1">{errors.ibuHp}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Kewarganegaraan Ibu <span className="text-[#626862] font-normal">(Opsional)</span>
            </label>
            <select
              value={data.ibu?.kewarganegaraan || ''}
              onChange={(e) => handleMotherChange('kewarganegaraan', e.target.value)}
              className="m3-input bg-white font-medium"
            >
              <option value="">-- Pilih (boleh dikosongkan) --</option>
              {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#626862] mt-1">Boleh dikosongkan.</p>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN WALI (OPSIONAL) ================= */}
      <div className="pt-6 border-t border-[#E2E6E2]">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showWali}
            onChange={(e) => {
              if (e.target.checked) {
                setShowWali(true);
                onChange({ ...data, statusWali: 'Lainnya' });
              } else if (window.confirm('Data wali yang sudah diisi akan dihapus. Lanjutkan?')) {
                setShowWali(false);
                onChange({ ...data, wali: undefined, statusWali: data.statusWali === 'Lainnya' ? undefined : data.statusWali });
              }
            }}
            className="w-4 h-4 rounded text-[#4B634B] focus:ring-[#4B634B]"
          />
          <span className="text-xs font-bold text-[#1A1D1A]">
            Siswa tinggal bersama Wali (Selain Orang Tua Kandung)
          </span>
        </label>

        {showWali && (
          <div className="mt-4 p-6 rounded-xl bg-[#F8FAF8] border border-[#D1D9D1] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Wali */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#1A1D1A] uppercase tracking-wider">
                  Status Keberadaan Wali <span className="text-[#626862] font-normal">(Opsional)</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {PARENT_STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleWaliChange('status', st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      data.wali?.status === st
                        ? 'bg-[#4B634B] text-white border-[#4B634B]'
                        : 'bg-white text-[#1A1D1A] border-[#D1D9D1] hover:bg-[#EBF0EB]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Nama Lengkap Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <input
                type="text"
                value={data.wali?.namaLengkap || ''}
                onChange={(e) => handleWaliChange('namaLengkap', e.target.value)}
                placeholder="Nama Wali Siswa"
                className="m3-input bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">NIK Wali <span className="text-[#626862] font-normal">(Opsional, 16 Digit)</span></label>
              <input
                type="text"
                maxLength={16}
                value={data.wali?.nik || ''}
                onChange={(e) => handleWaliChange('nik', e.target.value.replace(/\D/g, ''))}
                placeholder="16 digit NIK Wali — kosongkan bila tidak ada"
                className={`m3-input font-mono bg-white ${
                  errors.waliNik ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              />
              {errors.waliNik && <p className="text-xs text-rose-500 mt-1">{errors.waliNik}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tempat Lahir Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <input
                type="text"
                value={data.wali?.tempatLahir || ''}
                onChange={(e) => handleWaliChange('tempatLahir', e.target.value)}
                placeholder="Kota kelahiran Wali"
                className="m3-input bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Tanggal Lahir Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <input
                type="date"
                value={data.wali?.tanggalLahir || ''}
                onChange={(e) => handleWaliChange('tanggalLahir', e.target.value)}
                className="m3-input bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pendidikan Terakhir Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <select
                value={data.wali?.pendidikan || ''}
                onChange={(e) => handleWaliChange('pendidikan', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="" disabled>-- Pilih --</option>
              {EDUCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Pekerjaan Utama Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <select
                value={data.wali?.pekerjaan || ''}
                onChange={(e) => handleWaliChange('pekerjaan', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="" disabled>-- Pilih --</option>
              {JOB_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Penghasilan Per Bulan <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <select
                value={data.wali?.penghasilan || ''}
                onChange={(e) => handleWaliChange('penghasilan', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="" disabled>-- Pilih --</option>
              {INCOME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">Hubungan dengan Siswa <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <input
                type="text"
                value={data.wali?.hubungan || ''}
                onChange={(e) => handleWaliChange('hubungan', e.target.value)}
                placeholder="Contoh: Kakek / Paman / Tante"
                className="m3-input bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">No. HP / WhatsApp Wali <span className="text-[#626862] font-normal">(Opsional)</span></label>
              <input
                type="text"
                value={data.wali?.noHp || ''}
                onChange={(e) => handleWaliChange('noHp', e.target.value)}
                placeholder="08xxxxxxxxxx — kosongkan bila tidak ada"
                className={`m3-input bg-white ${
                  errors.waliHp ? 'border-rose-500 bg-rose-50/20' : ''
                }`}
              />
              {errors.waliHp && <p className="text-xs text-rose-500 mt-1">{errors.waliHp}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Kewarganegaraan Wali <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.wali?.kewarganegaraan || ''}
                onChange={(e) => handleWaliChange('kewarganegaraan', e.target.value)}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#626862] mt-1">Boleh dikosongkan.</p>
            </div>
          </div>
        )}
      </div>

      {/* ================= STATUS WALI & PENGHASILAN GABUNGAN (EMIS) ================= */}
      <div className="pt-6 border-t border-[#E2E6E2] grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Status Wali <span className="text-[#626862] font-normal">(Opsional)</span>
          </label>
          <select
            value={data.statusWali || ''}
            onChange={(e) => handleStatusWaliChange(e.target.value as StatusWaliEmis | '')}
            className="m3-input bg-white font-medium"
          >
            <option value="">-- Pilih (boleh dikosongkan) --</option>
            {STATUS_WALI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <p className="text-[11px] text-[#626862] mt-1">
            Pilih &quot;Lainnya&quot; bila siswa tinggal bersama wali selain orang tua kandung. Boleh dikosongkan.
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Total Gabungan Penghasilan Orang Tua/Wali <span className="text-[#626862] font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            value={data.penghasilanGabungan || ''}
            onChange={(e) => onChange({ ...data, penghasilanGabungan: e.target.value })}
            placeholder="Contoh: Rp3.500.000 (total ayah + ibu + wali)"
            className="m3-input font-medium"
          />
          <p className="text-[11px] text-[#626862] mt-1">Kosongkan bila tidak ingin mengisi.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-[#E2E6E2] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary px-6 py-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI (LANGKAH 1)</span>
        </button>
        <button
          type="submit"
          className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>LANJUT KE LANGKAH 3 (DATA ALAMAT)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
