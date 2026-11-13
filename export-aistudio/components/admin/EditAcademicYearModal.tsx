'use client';

import React, { useState } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { AcademicYear } from '@/lib/types';

interface EditAcademicYearModalProps {
  isOpen: boolean;
  editingAy: AcademicYear | null;
  onClose: () => void;
  onSave: (ayData: { id?: string; tahun: string; kuotaTotal: number; isAktif: boolean }) => void;
}

export const EditAcademicYearModal: React.FC<EditAcademicYearModalProps> = ({
  isOpen,
  editingAy,
  onClose,
  onSave,
}) => {
  const [tahun, setTahun] = useState<string>(editingAy ? editingAy.tahun : '2027/2028');
  const [kuotaTotal, setKuotaTotal] = useState<number>(editingAy ? editingAy.kuotaTotal : 120);
  const [isAktif, setIsAktif] = useState<boolean>(editingAy ? editingAy.isAktif : false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahun.trim()) {
      alert('Tahun ajaran tidak boleh kosong!');
      return;
    }
    onSave({
      id: editingAy?.id,
      tahun: tahun.trim(),
      kuotaTotal: Number(kuotaTotal) || 0,
      isAktif,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {editingAy ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
              </h3>
              <p className="text-xs text-slate-500">Kelola periode dan target kuota siswa</p>
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
            <label className="block font-bold text-slate-700 mb-1">Periode Tahun Ajaran</label>
            <input
              type="text"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              placeholder="Contoh: 2027/2028"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Format umum: YYYY/YYYY (misal: 2027/2028)</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Kuota Belajar (Siswa)</label>
            <input
              type="number"
              min={1}
              value={kuotaTotal}
              onChange={(e) => setKuotaTotal(Number(e.target.value))}
              placeholder="Contoh: 120"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              required
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Jadikan Tahun Ajaran Aktif</span>
              <span className="text-[11px] text-slate-500">
                Akan otomatis digunakan sebagai TA aktif pada form pendaftaran dan beranda.
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
              <span>Simpan Tahun Ajaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
