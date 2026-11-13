'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  BookOpen,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FeeItem, RincianBiayaPendaftaran, SchoolSettings } from '@/lib/types';
import { DEFAULT_RINCIAN_BIAYA } from '@/lib/storage';

interface EditRincianBiayaModalProps {
  isOpen: boolean;
  settings: SchoolSettings;
  onClose: () => void;
  onSave: (updatedRincianBiaya: RincianBiayaPendaftaran) => void;
}

type TabKey = 'admin' | 'putri' | 'putra' | 'ketentuan' | 'intro';

export const EditRincianBiayaModal: React.FC<EditRincianBiayaModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const initialData: RincianBiayaPendaftaran = {
    ...DEFAULT_RINCIAN_BIAYA,
    ...(settings.rincianBiayaPendaftaran || {}),
    itemsAdministrasi: [
      ...(settings.rincianBiayaPendaftaran?.itemsAdministrasi || DEFAULT_RINCIAN_BIAYA.itemsAdministrasi).map((it) => ({
        ...it,
      })),
    ],
    itemsPerempuan: [
      ...(settings.rincianBiayaPendaftaran?.itemsPerempuan || DEFAULT_RINCIAN_BIAYA.itemsPerempuan).map((it) => ({
        ...it,
      })),
    ],
    itemsLakiLaki: [
      ...(settings.rincianBiayaPendaftaran?.itemsLakiLaki || DEFAULT_RINCIAN_BIAYA.itemsLakiLaki).map((it) => ({
        ...it,
      })),
    ],
    ketentuanPembayaran: [
      ...(settings.rincianBiayaPendaftaran?.ketentuanPembayaran || DEFAULT_RINCIAN_BIAYA.ketentuanPembayaran),
    ],
  };

  const [activeTab, setActiveTab] = useState<TabKey>('admin');
  const [data, setData] = useState<RincianBiayaPendaftaran>(initialData);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Helper calculations
  const subtotalAdministrasi = data.itemsAdministrasi.reduce(
    (sum, item) => sum + (Number(item.biaya) || 0),
    0
  );
  const subtotalPerempuan = data.itemsPerempuan.reduce(
    (sum, item) => sum + (Number(item.biaya) || 0),
    0
  );
  const subtotalLakiLaki = data.itemsLakiLaki.reduce(
    (sum, item) => sum + (Number(item.biaya) || 0),
    0
  );
  const grandTotalPerempuan = subtotalAdministrasi + subtotalPerempuan;
  const grandTotalLakiLaki = subtotalAdministrasi + subtotalLakiLaki;

  // Handlers for Items
  const handleItemChange = (
    listKey: 'itemsAdministrasi' | 'itemsPerempuan' | 'itemsLakiLaki',
    id: string,
    field: 'nama' | 'biaya',
    value: string | number
  ) => {
    setData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((it) =>
        it.id === id ? { ...it, [field]: field === 'biaya' ? Number(value) || 0 : value } : it
      ),
    }));
  };

  const handleAddItem = (listKey: 'itemsAdministrasi' | 'itemsPerempuan' | 'itemsLakiLaki') => {
    const newItem: FeeItem = {
      id: `${listKey.slice(0, 3)}-${Date.now()}`,
      nama: 'Komponen Baru',
      biaya: 10000,
    };
    setData((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], newItem],
    }));
  };

  const handleDeleteItem = (
    listKey: 'itemsAdministrasi' | 'itemsPerempuan' | 'itemsLakiLaki',
    id: string
  ) => {
    setData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((it) => it.id !== id),
    }));
  };

  // Handlers for Ketentuan Pembayaran
  const handleKetentuanChange = (index: number, val: string) => {
    setData((prev) => {
      const updated = [...prev.ketentuanPembayaran];
      updated[index] = val;
      return { ...prev, ketentuanPembayaran: updated };
    });
  };

  const handleAddKetentuan = () => {
    setData((prev) => ({
      ...prev,
      ketentuanPembayaran: [...prev.ketentuanPembayaran, 'Butir ketentuan pembayaran baru...'],
    }));
  };

  const handleDeleteKetentuan = (index: number) => {
    setData((prev) => ({
      ...prev,
      ketentuanPembayaran: prev.ketentuanPembayaran.filter((_, i) => i !== index),
    }));
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan semua rincian biaya pendaftaran ke standar awal madrasah?')) {
      setData({
        ...DEFAULT_RINCIAN_BIAYA,
        itemsAdministrasi: [...DEFAULT_RINCIAN_BIAYA.itemsAdministrasi.map((i) => ({ ...i }))],
        itemsPerempuan: [...DEFAULT_RINCIAN_BIAYA.itemsPerempuan.map((i) => ({ ...i }))],
        itemsLakiLaki: [...DEFAULT_RINCIAN_BIAYA.itemsLakiLaki.map((i) => ({ ...i }))],
        ketentuanPembayaran: [...DEFAULT_RINCIAN_BIAYA.ketentuanPembayaran],
      });
    }
  };

  const handleSave = () => {
    onSave(data);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-[#0D3B2E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 font-heading block">
                Pengaturan Madrasah &bull; Fitur Informasi Pendaftaran
              </span>
              <h2 className="text-lg sm:text-xl font-black font-heading leading-tight">
                Edit Rincian Biaya &amp; Dokumen SPMB
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                Kelola nominal administrasi, seragam &amp; atribut putri/putra, serta poin ketentuan resmi.
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

        {/* Live Calculation Strip */}
        <div className="bg-[#F7F4EC] border-b border-stone-200 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Subtotal Admin</span>
            <span className="font-mono font-black text-emerald-800 text-sm">
              Rp {subtotalAdministrasi.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Perlengkapan Putri</span>
            <span className="font-mono font-black text-rose-900 text-sm">
              Rp {subtotalPerempuan.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-sky-200 shadow-2xs">
            <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider block">Perlengkapan Putra</span>
            <span className="font-mono font-black text-sky-900 text-sm">
              Rp {subtotalLakiLaki.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Total Akhir (P / L)</span>
            <span className="font-mono font-black text-stone-900 text-xs sm:text-sm">
              Rp {grandTotalPerempuan.toLocaleString('id-ID')} / {grandTotalLakiLaki.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 overflow-x-auto shrink-0 px-4 sm:px-6 gap-1 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>A. Administrasi (Wajib)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono">
              {data.itemsAdministrasi.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('putri')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'putri'
                ? 'bg-white text-rose-800 border-t-2 border-rose-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>B. Siswa Putri</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-mono">
              {data.itemsPerempuan.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('putra')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'putra'
                ? 'bg-white text-sky-800 border-t-2 border-sky-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>C. Siswa Putra</span>
            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full font-mono">
              {data.itemsLakiLaki.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ketentuan')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ketentuan'
                ? 'bg-white text-amber-800 border-t-2 border-amber-600 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>Ketentuan &amp; Buku</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-mono">
              {data.ketentuanPembayaran.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intro')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'intro'
                ? 'bg-white text-stone-900 border-t-2 border-stone-800 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>Teks &amp; Header</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* TAB 1: ADMINISTRASI PENDAFTARAN */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Bagian A: Administrasi Pendaftaran
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Komponen wajib pendaftaran awal (Formulir, Buku Rapor, Tabungan, SPP).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono px-3 py-1 bg-white text-emerald-900 rounded-xl border border-emerald-300">
                    Subtotal: Rp {subtotalAdministrasi.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItem('itemsAdministrasi')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Judul Seksi Administrasi</label>
                <input
                  type="text"
                  value={data.judulAdministrasi || ''}
                  onChange={(e) => setData({ ...data, judulAdministrasi: e.target.value })}
                  placeholder="Administrasi Pendaftaran"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Komponen</th>
                      <th className="py-2.5 px-3 w-40 text-right">Biaya (Rp)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {data.itemsAdministrasi.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-stone-50/60">
                        <td className="py-2 px-3 text-center text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) =>
                              handleItemChange('itemsAdministrasi', item.id, 'nama', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.biaya}
                            onChange={(e) =>
                              handleItemChange('itemsAdministrasi', item.id, 'biaya', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-right rounded-lg border border-stone-200 focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('itemsAdministrasi', item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan Khusus Administrasi */}
              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-stone-700 block">
                  Catatan Keterangan Administrasi (Ditampilkan di bawah tabel)
                </label>
                <input
                  type="text"
                  value={data.catatanAdministrasi || ''}
                  onChange={(e) => setData({ ...data, catatanAdministrasi: e.target.value })}
                  placeholder="Keterangan: Administrasi pendaftaran sebesar Rp {biayaPendaftaran} wajib dilunasi terlebih dahulu."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PERLENGKAPAN SISWA PEREMPUAN */}
          {activeTab === 'putri' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-sm text-rose-950">
                    Bagian B: Perlengkapan Siswa Perempuan (Putri)
                  </h3>
                  <p className="text-[11px] text-rose-800">
                    Seragam, kerudung, kaos kaki, sabuk, dan atribut khusus santri putri.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono px-3 py-1 bg-white text-rose-900 rounded-xl border border-rose-300">
                    Subtotal: Rp {subtotalPerempuan.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItem('itemsPerempuan')}
                    className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Judul Seksi Siswa Perempuan</label>
                <input
                  type="text"
                  value={data.judulPerempuan || ''}
                  onChange={(e) => setData({ ...data, judulPerempuan: e.target.value })}
                  placeholder="Perlengkapan Siswa Perempuan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Komponen Perlengkapan</th>
                      <th className="py-2.5 px-3 w-40 text-right">Biaya (Rp)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {data.itemsPerempuan.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-stone-50/60">
                        <td className="py-2 px-3 text-center text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) =>
                              handleItemChange('itemsPerempuan', item.id, 'nama', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 focus:border-rose-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.biaya}
                            onChange={(e) =>
                              handleItemChange('itemsPerempuan', item.id, 'biaya', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-right rounded-lg border border-stone-200 focus:border-rose-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('itemsPerempuan', item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PERLENGKAPAN SISWA LAKI-LAKI */}
          {activeTab === 'putra' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-sky-50/70 border border-sky-200 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-sm text-sky-950">
                    Bagian C: Perlengkapan Siswa Laki-laki (Putra)
                  </h3>
                  <p className="text-[11px] text-sky-800">
                    Seragam, kopyah, dasi, sabuk, dan atribut khusus santri putra.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono px-3 py-1 bg-white text-sky-900 rounded-xl border border-sky-300">
                    Subtotal: Rp {subtotalLakiLaki.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItem('itemsLakiLaki')}
                    className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Judul Seksi Siswa Laki-laki</label>
                <input
                  type="text"
                  value={data.judulLakiLaki || ''}
                  onChange={(e) => setData({ ...data, judulLakiLaki: e.target.value })}
                  placeholder="Perlengkapan Siswa Laki-laki"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Items Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F4EC] text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Komponen Perlengkapan</th>
                      <th className="py-2.5 px-3 w-40 text-right">Biaya (Rp)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {data.itemsLakiLaki.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-stone-50/60">
                        <td className="py-2 px-3 text-center text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) =>
                              handleItemChange('itemsLakiLaki', item.id, 'nama', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 focus:border-sky-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.biaya}
                            onChange={(e) =>
                              handleItemChange('itemsLakiLaki', item.id, 'biaya', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-right rounded-lg border border-stone-200 focus:border-sky-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('itemsLakiLaki', item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: KETENTUAN PEMBAYARAN & BUKU PELAJARAN */}
          {activeTab === 'ketentuan' && (
            <div className="space-y-5">
              
              {/* Ketentuan Pembayaran Points */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900">
                      Poin-Poin Ketentuan Pembayaran
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Instruksi pembayaran bertahap, pembelian atribut di luar, dll.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddKetentuan}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Butir</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-stone-700 block">Judul Bagian Ketentuan</label>
                  <input
                    type="text"
                    value={data.judulKetentuan || ''}
                    onChange={(e) => setData({ ...data, judulKetentuan: e.target.value })}
                    placeholder="Ketentuan Pembayaran"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  {data.ketentuanPembayaran.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={point}
                        onChange={(e) => handleKetentuanChange(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteKetentuan(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus butir ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buku Pelajaran */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-800" />
                  <h4 className="font-bold text-xs text-amber-950">Informasi Buku Pelajaran</h4>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-stone-700 text-[11px] block">Judul Bagian Buku</label>
                  <input
                    type="text"
                    value={data.judulBuku || ''}
                    onChange={(e) => setData({ ...data, judulBuku: e.target.value })}
                    placeholder="Buku Pelajaran"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-stone-700 text-[11px] block">Deskripsi / Penjelasan Buku</label>
                  <textarea
                    rows={3}
                    value={data.deskripsiBuku || ''}
                    onChange={(e) => setData({ ...data, deskripsiBuku: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* Catatan Ringkasan Total */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-stone-700 block">
                  Catatan Ringkasan Total (Ditampilkan di bawah ringkasan biaya)
                </label>
                <textarea
                  rows={2}
                  value={data.catatanRingkasan || ''}
                  onChange={(e) => setData({ ...data, catatanRingkasan: e.target.value })}
                  placeholder="Catatan Penting: Total tersebut merupakan gabungan biaya administrasi dan perlengkapan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* TAB 5: INTRO, HEADER & FOOTER */}
          {activeTab === 'intro' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Judul Dokumen Informasi</label>
                <input
                  type="text"
                  value={data.judulDokumen || ''}
                  onChange={(e) => setData({ ...data, judulDokumen: e.target.value })}
                  placeholder="Informasi Pendaftaran"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Subjudul Dokumen</label>
                <input
                  type="text"
                  value={data.subjudulDokumen || ''}
                  onChange={(e) => setData({ ...data, subjudulDokumen: e.target.value })}
                  placeholder="Rincian Administrasi & Perlengkapan Siswa Baru"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Pesan Pengantar (Intro Box)</label>
                <textarea
                  rows={3}
                  value={data.introPesan || ''}
                  onChange={(e) => setData({ ...data, introPesan: e.target.value })}
                  placeholder="Berikut adalah rincian resmi administrasi pendaftaran dan paket perlengkapan siswa baru..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Teks Footer Dokumen</label>
                <input
                  type="text"
                  value={data.footerInfo || ''}
                  onChange={(e) => setData({ ...data, footerInfo: e.target.value })}
                  placeholder="Panitia Penerimaan Murid Baru (SPMB) MI Ishlahul Ummah • Pranti, Sedati, Sidoarjo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset ke Standar Madrasah</span>
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
                  <span>Simpan Rincian Biaya</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
