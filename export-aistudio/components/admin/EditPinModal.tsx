'use client';

import React, { useState } from 'react';
import { X, Check, KeyRound, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { RegistrationRecord } from '@/lib/types';

interface EditPinModalProps {
  isOpen: boolean;
  record: RegistrationRecord | null;
  onClose: () => void;
  onSave: (recordId: string, newPin: string) => void;
}

export const EditPinModal: React.FC<EditPinModalProps> = ({
  isOpen,
  record,
  onClose,
  onSave,
}) => {
  const [pin, setPin] = useState<string>(record?.pin || '');
  const [copied, setCopied] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleGenerateRandomPin = () => {
    // Acak kriptografis (crypto.getRandomValues), bukan Math.random.
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    setPin(String(100000 + (arr[0] % 900000)));
    setPinError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN baru wajib TEPAT 6 digit angka (bukan 4–8). Pesan error inline —
    // TIDAK PERNAH alert() yang menampilkan nilai PIN.
    if (!/^\d{6}$/.test(pin.trim())) {
      setPinError('PIN harus tepat 6 digit angka.');
      return;
    }
    setPinError(null);
    onSave(record.id, pin.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Ubah PIN Akses</h3>
              <p className="text-xs text-slate-500">Reset PIN akun wali murid</p>
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

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-800">{record.student.namaLengkap}</p>
          <p className="text-slate-500 font-mono text-[11px]">{record.nomorPendaftaran}</p>
          <p className="text-slate-600">
            Wali: {record.parent.ayah.namaLengkap || record.parent.ibu.namaLengkap} ({record.parent.ayah.noHp || '-'})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">PIN Akses (6 Digit Angka)</label>
              <button
                type="button"
                onClick={handleGenerateRandomPin}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak PIN</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(null); }}
                className="flex-1 px-3 py-2.5 text-center font-mono text-lg font-black tracking-widest rounded-xl border border-slate-300 bg-white text-slate-900"
                required
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                title="Salin PIN"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Wali murid menggunakan nomor pendaftaran &amp; PIN ini untuk login ke dashboard.
            </p>
            {pinError && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">{pinError}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
              <span>Simpan PIN Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
