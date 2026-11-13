'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { AddressData, SchoolSettings } from '@/lib/types';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  Province,
  Regency,
  District,
  Village,
} from '@/lib/data/indonesia-regions';

interface WizardStep3Props {
  data: AddressData;
  onChange: (data: AddressData) => void;
  onNext: () => void;
  onPrev: () => void;
  settings?: SchoolSettings;
}

// Kode pos desa yang sudah dikonfirmasi (dipakai bila data wilayah API
// tidak membawa postalCode — API hanya mengembalikan id/nama). PRANTI
// = 61253 sesuai alamat resmi madrasah (Jl. K. Hasbullah No. 02).
const KODE_POS_DESA: Record<string, string> = {
  PRANTI: '61253',
};

// Opsi selaras EMIS 4.0 — Tab DATA ALAMAT (area 5, 2026-11-10). Semua opsional.
const STATUS_KEPEMILIKAN_RUMAH_OPTIONS = [
  'Milik Sendiri',
  'Rumah Orang Tua',
  'Rumah Saudara/kerabat',
  'Rumah Dinas',
  'Sewa/kontrak',
  'Lainnya',
];
const STATUS_TEMPAT_TINGGAL_OPTIONS = [
  'Tinggal dengan Ayah Kandung',
  'Tinggal dengan Ibu Kandung',
  'Tinggal dengan Wali',
  'Ikut Saudara/Kerabat',
  'Asrama Madrasah',
  'Kontrak/Kost',
  'Tinggal di Asrama Pesantren',
  'Panti Asuhan',
  'Rumah Singgah',
  'Lainnya',
];
const JARAK_OPTIONS = [
  'Kurang dari 5 km',
  '5–10 Km',
  '11–20 Km',
  '21–30 Km',
  'Lebih dari 30 Km',
];
const TRANSPORTASI_OPTIONS = [
  'Jalan Kaki',
  'Sepeda',
  'Sepeda Motor',
  'Mobil Pribadi',
  'Antar Jemput Sekolah',
  'Angkutan Umum',
  'Perahu/Sampan',
  'Lainnya',
  'Kendaraan Pribadi',
  'Kereta Api',
  'Ojek',
  'Andong/Bendi/Sado/Dokar/Delman/Becak',
];
const WAKTU_TEMPUH_OPTIONS = [
  '1-10 menit',
  '10-19 menit',
  '20-29 menit',
  '30-39 menit',
  '1-2 jam',
  '> 2 jam',
];

export const WizardStep3: React.FC<WizardStep3Props> = ({
  data,
  onChange,
  onNext,
  onPrev,
  settings,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalize = (s: string) =>
    (s || '')
      .toUpperCase()
      .replace(/^(KABUPATEN|KAB\.|KAB|KOTA|KECAMATAN|KEC\.|DESA|KELURAHAN|KEL\.)\s+/g, '')
      .trim();

  // 1. Load Provinces
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingProvinces(true);
      const list = await fetchProvinces();
      if (!isMounted) return;
      setProvinces(list);
      setLoadingProvinces(false);

      if (data.provinsi) {
        const normProv = normalize(data.provinsi);
        const match = list.find(
          (p) => p.name === data.provinsi || normalize(p.name) === normProv || p.id === data.provinsi
        );
        if (match) setSelectedProvinceId(match.id);
      }
    }
    Promise.resolve().then(load);
    return () => {
      isMounted = false;
    };
  }, [data.provinsi]);

  // 2. Load Regencies when Province changes
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!selectedProvinceId) {
        setRegencies([]);
        setSelectedRegencyId('');
        setDistricts([]);
        setSelectedDistrictId('');
        setVillages([]);
        return;
      }
      setLoadingRegencies(true);
      const list = await fetchRegencies(selectedProvinceId);
      if (!isMounted) return;
      setRegencies(list);
      setLoadingRegencies(false);

      if (data.kabupaten) {
        const normKab = normalize(data.kabupaten);
        const match = list.find(
          (r) => r.name === data.kabupaten || normalize(r.name) === normKab || r.id === data.kabupaten
        );
        if (match) setSelectedRegencyId(match.id);
      }
    }
    Promise.resolve().then(load);
    return () => {
      isMounted = false;
    };
  }, [selectedProvinceId, data.kabupaten]);

  // 3. Load Districts when Regency changes
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!selectedRegencyId) {
        setDistricts([]);
        setSelectedDistrictId('');
        setVillages([]);
        return;
      }
      setLoadingDistricts(true);
      const list = await fetchDistricts(selectedRegencyId);
      if (!isMounted) return;
      setDistricts(list);
      setLoadingDistricts(false);

      if (data.kecamatan) {
        const normKec = normalize(data.kecamatan);
        const match = list.find(
          (d) => d.name === data.kecamatan || normalize(d.name) === normKec || d.id === data.kecamatan
        );
        if (match) setSelectedDistrictId(match.id);
      }
    }
    Promise.resolve().then(load);
    return () => {
      isMounted = false;
    };
  }, [selectedRegencyId, data.kecamatan]);

  // 4. Load Villages when District changes
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!selectedDistrictId) {
        setVillages([]);
        return;
      }
      setLoadingVillages(true);
      const list = await fetchVillages(selectedDistrictId);
      if (!isMounted) return;
      setVillages(list);
      setLoadingVillages(false);
    }
    Promise.resolve().then(load);
    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId]);

  const handleProvinceSelect = (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    const found = provinces.find((p) => p.id === provId);
    onChange({
      ...data,
      provinsi: found ? found.name : '',
      kabupaten: '',
      kecamatan: '',
      kelurahan: '',
    });
  };

  const handleRegencySelect = (regId: string) => {
    setSelectedRegencyId(regId);
    setSelectedDistrictId('');
    setDistricts([]);
    setVillages([]);

    const found = regencies.find((r) => r.id === regId);
    onChange({
      ...data,
      kabupaten: found ? found.name : '',
      kecamatan: '',
      kelurahan: '',
    });
  };

  const handleDistrictSelect = (distId: string) => {
    setSelectedDistrictId(distId);
    setVillages([]);

    const found = districts.find((d) => d.id === distId);
    onChange({
      ...data,
      kecamatan: found ? found.name : '',
      kelurahan: '',
    });
  };

  const handleVillageSelect = (villageName: string) => {
    const found = villages.find((v) => v.name === villageName);
    onChange({
      ...data,
      kelurahan: villageName,
      kodePos: found?.postalCode || KODE_POS_DESA[villageName] || data.kodePos || '',
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.provinsi) errs.provinsi = 'Pilih Provinsi.';
    if (!data.kabupaten) errs.kabupaten = 'Pilih Kabupaten / Kota.';
    if (!data.kecamatan) errs.kecamatan = 'Pilih Kecamatan.';
    if (!data.kelurahan) errs.kelurahan = 'Pilih Kelurahan / Desa.';
    if (!data.alamatLengkap?.trim()) errs.alamatLengkap = 'Tulis Alamat Lengkap.';

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
      <div className="flex items-center justify-between pb-5 border-b border-[#E2E6E2]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EBF0EB] text-[#4B634B] flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5 text-[#4B634B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1A1D1A]">
              {settings?.cmsContent?.step3Title || 'LANGKAH 3: Data Alamat Domisili'}
            </h3>
            <p className="text-xs text-[#626862]">
              {settings?.cmsContent?.step3Subtitle || 'Pilih alamat sesuai KK, dari provinsi sampai desa/kelurahan.'}
            </p>
          </div>
        </div>
      </div>

      {settings?.cmsContent?.step3Notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{settings.cmsContent.step3Notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Provinsi */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Provinsi <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedProvinceId}
              onChange={(e) => handleProvinceSelect(e.target.value)}
              className={`m3-input font-medium bg-white ${
                errors.provinsi ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            >
              <option value="">-- Pilih Provinsi (38 Provinsi) --</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <Loader2 className="w-4 h-4 text-[#4B634B] animate-spin absolute right-3 top-3.5" />
            )}
          </div>
          {errors.provinsi && <p className="text-xs text-rose-500 mt-1">{errors.provinsi}</p>}
        </div>

        {/* Kabupaten / Kota */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Kabupaten / Kota <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              disabled={!selectedProvinceId}
              value={selectedRegencyId}
              onChange={(e) => handleRegencySelect(e.target.value)}
              className={`m3-input font-medium bg-white disabled:bg-[#F8FAF8] ${
                errors.kabupaten ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            >
              <option value="">
                {!selectedProvinceId ? '-- Pilih Provinsi Terlebih Dahulu --' : '-- Pilih Kabupaten/Kota --'}
              </option>
              {regencies.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {loadingRegencies && (
              <Loader2 className="w-4 h-4 text-[#4B634B] animate-spin absolute right-3 top-3.5" />
            )}
          </div>
          {errors.kabupaten && <p className="text-xs text-rose-500 mt-1">{errors.kabupaten}</p>}
        </div>

        {/* Kecamatan */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Kecamatan <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              disabled={!selectedRegencyId}
              value={selectedDistrictId}
              onChange={(e) => handleDistrictSelect(e.target.value)}
              className={`m3-input font-medium bg-white disabled:bg-[#F8FAF8] ${
                errors.kecamatan ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            >
              <option value="">
                {!selectedRegencyId ? '-- Pilih Kabupaten/Kota Terlebih Dahulu --' : '-- Pilih Kecamatan --'}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <Loader2 className="w-4 h-4 text-[#4B634B] animate-spin absolute right-3 top-3.5" />
            )}
          </div>
          {errors.kecamatan && <p className="text-xs text-rose-500 mt-1">{errors.kecamatan}</p>}
        </div>

        {/* Kelurahan / Desa */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Kelurahan / Desa <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              disabled={!selectedDistrictId}
              value={data.kelurahan || ''}
              onChange={(e) => handleVillageSelect(e.target.value)}
              className={`m3-input font-medium bg-white disabled:bg-[#F8FAF8] ${
                errors.kelurahan ? 'border-rose-500 bg-rose-50/20' : ''
              }`}
            >
              <option value="">
                {!selectedDistrictId ? '-- Pilih Kecamatan Terlebih Dahulu --' : '-- Pilih Kelurahan/Desa --'}
              </option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
            {loadingVillages && (
              <Loader2 className="w-4 h-4 text-[#4B634B] animate-spin absolute right-3 top-3.5" />
            )}
          </div>
          {errors.kelurahan && <p className="text-xs text-rose-500 mt-1">{errors.kelurahan}</p>}
        </div>

        {/* Alamat Lengkap */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Alamat Jalan, Dusun / Perumahan <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={data.alamatLengkap || ''}
            onChange={(e) => onChange({ ...data, alamatLengkap: e.target.value })}
            placeholder="Contoh: Jl. Melati No. 45, Dusun Sidokepo"
            className={`m3-input font-medium ${
              errors.alamatLengkap ? 'border-rose-500 bg-rose-50/20' : ''
            }`}
          />
          {errors.alamatLengkap && <p className="text-xs text-rose-500 mt-1">{errors.alamatLengkap}</p>}
          <p className="text-[11px] text-[#626862] mt-1">RT/RW diisi pada kolom terpisah di bawah, tidak perlu ditulis di sini.</p>
        </div>

        {/* RT & RW Terpisah */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Nomor RT <span className="text-[#626862] font-normal">(Contoh: 03)</span>
            </label>
            <input
              type="text"
              value={data.rt || ''}
              onChange={(e) => {
                const newRt = e.target.value;
                const newRtRw = `${newRt || '00'} / ${data.rw || '00'}`;
                onChange({ ...data, rt: newRt, rtRw: newRtRw });
              }}
              placeholder="03"
              className="m3-input font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
              Nomor RW <span className="text-[#626862] font-normal">(Contoh: 02)</span>
            </label>
            <input
              type="text"
              value={data.rw || ''}
              onChange={(e) => {
                const newRw = e.target.value;
                const newRtRw = `${data.rt || '00'} / ${newRw || '00'}`;
                onChange({ ...data, rw: newRw, rtRw: newRtRw });
              }}
              placeholder="02"
              className="m3-input font-medium"
            />
          </div>
        </div>

        {/* Kode Pos */}
        <div>
          <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
            Kode Pos
          </label>
          <input
            type="text"
            maxLength={5}
            value={data.kodePos || ''}
            onChange={(e) => onChange({ ...data, kodePos: e.target.value.replace(/\D/g, '') })}
            placeholder="61253"
            className="m3-input font-medium"
          />
          <p className="text-[11px] text-[#626862] mt-1">Kode pos terisi otomatis setelah memilih desa/kelurahan; boleh dikoreksi bila berbeda.</p>
        </div>

        {/* Data Tambahan Sesuai EMIS 4.0 (Tab DATA ALAMAT) — semua opsional */}
        <div className="sm:col-span-2 p-6 rounded-xl bg-[#F8FAF8] border border-[#D1D9D1] space-y-5">
          <h4 className="text-xs font-bold text-[#4B634B] uppercase tracking-wider">
            Data Tambahan — Sesuai EMIS (opsional, boleh dikosongkan)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Status Kepemilikan Rumah <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.statusKepemilikanRumah || ''}
                onChange={(e) => onChange({ ...data, statusKepemilikanRumah: e.target.value })}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {STATUS_KEPEMILIKAN_RUMAH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Status Tempat Tinggal Siswa <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.statusTempatTinggal || ''}
                onChange={(e) => onChange({ ...data, statusTempatTinggal: e.target.value })}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {STATUS_TEMPAT_TINGGAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Jarak Tempat Tinggal–Madrasah <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.jarakKeMadrasah || ''}
                onChange={(e) => onChange({ ...data, jarakKeMadrasah: e.target.value })}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {JARAK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Transportasi ke Sekolah <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.transportasiKeSekolah || ''}
                onChange={(e) => onChange({ ...data, transportasiKeSekolah: e.target.value })}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {TRANSPORTASI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Waktu Tempuh ke Madrasah <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <select
                value={data.waktuTempuh || ''}
                onChange={(e) => onChange({ ...data, waktuTempuh: e.target.value })}
                className="m3-input bg-white font-medium"
              >
                <option value="">-- Pilih (boleh dikosongkan) --</option>
                {WAKTU_TEMPUH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1D1A] mb-1.5 uppercase tracking-wider">
                Koordinat Alamat <span className="text-[#626862] font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={data.koordinatAlamat || ''}
                onChange={(e) => onChange({ ...data, koordinatAlamat: e.target.value })}
                placeholder="Contoh: -7.345678, 112.723456"
                className="m3-input bg-white font-medium"
              />
              <p className="text-[11px] text-[#626862] mt-1">Kosongkan bila tidak diketahui.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-[#E2E6E2] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary px-6 py-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI (LANGKAH 2)</span>
        </button>
        <button
          type="submit"
          className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>LANJUT KE LANGKAH 4 (UPLOAD BERKAS)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
