'use client';

import React, { useState } from 'react';
import { X, Check, Layers } from 'lucide-react';
import { AcademicYear, Wave } from '@/lib/types';

interface EditWaveModalProps {
  isOpen: boolean;
  editingWave: Wave | null;
  academicYears: AcademicYear[];
  defaultAcademicYear: string;
  onClose: () => void;
  onSave: (waveData: {
    id?: string;
    nama: string;
    academicYear: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    biayaPendaftaran: number;
    isAktif: boolean;
    indenAktif?: boolean;
    indenDp?: number;
    diskonJenis?: 'rp' | 'persen';
    diskonNilai?: number;
    kuotaDiskon?: number;
    batasAkhirInden?: string;
    batasPelunasanHari?: number;
    dpHangusJikaLewatBatas?: boolean;
  }) => void;
}

export const EditWaveModal: React.FC<EditWaveModalProps> = ({
  isOpen,
  editingWave,
  academicYears,
  defaultAcademicYear,
  onClose,
  onSave,
}) => {
  const [nama, setNama] = useState<string>(editingWave ? editingWave.nama : 'Gelombang 1');
  const [academicYear, setAcademicYear] = useState<string>(
    editingWave ? editingWave.academicYear || defaultAcademicYear : defaultAcademicYear
  );
  const [tanggalMulai, setTanggalMulai] = useState<string>(
    editingWave ? editingWave.tanggalMulai : new Date().toISOString().split('T')[0]
  );
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(() => {
    if (editingWave) return editingWave.tanggalSelesai;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 3);
    return nextMonth.toISOString().split('T')[0];
  });
  const [biayaPendaftaran, setBiayaPendaftaran] = useState<number>(
    editingWave ? editingWave.biayaPendaftaran : 250000
  );
  const [isAktif, setIsAktif] = useState<boolean>(editingWave ? editingWave.isAktif : false);

  // --- Inden & Diskon (fitur periode ini; bukan gelombang) ---
  const [indenAktif, setIndenAktif] = useState<boolean>(editingWave ? editingWave.indenAktif ?? false : false);
  const [indenDp, setIndenDp] = useState<number>(editingWave?.indenDp ?? 50000);
  const [diskonJenis, setDiskonJenis] = useState<'rp' | 'persen'>(editingWave?.diskonJenis ?? 'rp');
  const [diskonNilai, setDiskonNilai] = useState<number>(editingWave?.diskonNilai ?? 25000);
  const [kuotaDiskon, setKuotaDiskon] = useState<number>(editingWave?.kuotaDiskon ?? 20);
  const [batasAkhirInden, setBatasAkhirInden] = useState<string>(editingWave?.batasAkhirInden ?? '');
  const [batasPelunasanHari, setBatasPelunasanHari] = useState<number>(editingWave?.batasPelunasanHari ?? 14);
  const [dpHangusJikaLewatBatas, setDpHangusJikaLewatBatas] = useState<boolean>(
    editingWave?.dpHangusJikaLewatBatas ?? true
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama gelombang wajib diisi!');
      return;
    }
    onSave({
      id: editingWave?.id,
      nama: nama.trim(),
      academicYear: academicYear || defaultAcademicYear,
      tanggalMulai,
      tanggalSelesai,
      biayaPendaftaran: Number(biayaPendaftaran) || 0,
      isAktif,
      indenAktif,
      indenDp: Number(indenDp) || 0,
      diskonJenis,
      diskonNilai: Number(diskonNilai) || 0,
      kuotaDiskon: Number(kuotaDiskon) || 0,
      batasAkhirInden: batasAkhirInden || '',
      batasPelunasanHari: Number(batasPelunasanHari) || 14,
      dpHangusJikaLewatBatas,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {editingWave ? 'Edit Gelombang Pendaftaran' : 'Tambah Gelombang Baru'}
              </h3>
              <p className="text-xs text-slate-500">Atur periode tanggal dan biaya formulir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Gelombang</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Gelombang 1 (Early Bird)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.tahun}>
                  TA {ay.tahun} {ay.isAktif ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Biaya Formulir Pendaftaran (Rp)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={biayaPendaftaran}
              onChange={(e) => setBiayaPendaftaran(Number(e.target.value))}
              placeholder="Contoh: 250000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              required
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Status Gelombang Aktif</span>
              <span className="text-[11px] text-slate-500">
                Wali murid dapat mendaftar pada gelombang ini jika diaktifkan.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAktif}
                onChange={(e) => setIsAktif(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
            </label>
          </div>

          {/* --- Inden & Diskon (Periode ini) --- */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Inden &amp; Diskon (Periode ini)</span>
                <span className="text-[11px] text-slate-500">
                  Wali murid bisa pesan kursi dengan DP, lalu lunasi sisanya sebelum batas pelunasan.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={indenAktif}
                  onChange={(e) => setIndenAktif(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {indenAktif && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">DP Inden (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={indenDp}
                      onChange={(e) => setIndenDp(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batas Pelunasan (hari)</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={batasPelunasanHari}
                      onChange={(e) => setBatasPelunasanHari(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Diskon</label>
                    <select
                      value={diskonJenis}
                      onChange={(e) => setDiskonJenis(e.target.value as 'rp' | 'persen')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    >
                      <option value="rp">Rupiah (Rp)</option>
                      <option value="persen">Persen (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nilai Diskon {diskonJenis === 'persen' ? '(%)' : '(Rp)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={diskonJenis === 'persen' ? 1 : 1000}
                      value={diskonNilai}
                      onChange={(e) => setDiskonNilai(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kuota Kursi Diskon</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={kuotaDiskon}
                      onChange={(e) => setKuotaDiskon(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batas Akhir Inden</label>
                    <input
                      type="date"
                      value={batasAkhirInden}
                      onChange={(e) => setBatasAkhirInden(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                    />
                    <span className="text-[10px] text-slate-500">Kosong = ikut tanggal selesai gelombang.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">DP hangus jika lewat batas</span>
                    <span className="text-[11px] text-slate-500">
                      Bila wali tidak melunasi sebelum batas pelunasan, DP hangus dan kursi dilepas.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dpHangusJikaLewatBatas}
                      onChange={(e) => setDpHangusJikaLewatBatas(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Gelombang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
