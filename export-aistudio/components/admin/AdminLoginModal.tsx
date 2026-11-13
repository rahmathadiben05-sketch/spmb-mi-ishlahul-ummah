'use client';

import React, { useState } from 'react';
import { Shield, Lock, Key, ArrowRight, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { verifyAdminPin } from '@/lib/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole) => void;
  schoolName: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  schoolName,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password.trim()) {
      setErrorMsg('Mohon isi PIN / Kata Sandi Panitia.');
      return;
    }

    // PIN admin diverifikasi DI SERVER (verifyAdminPin, backend v2.10).
    // Tanpa username, tanpa daftar PIN di bundle frontend; token sesi
    // disimpan di sessionStorage oleh verifyAdminPin bila PIN cocok.
    setIsSubmitting(true);
    try {
      const res = await verifyAdminPin(password.trim());
      if (res.ok) {
        onLoginSuccess('admin');
        onClose();
      } else {
        setErrorMsg(res.error || 'PIN panitia salah. Periksa kembali PIN Anda.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-stone-200 overflow-hidden relative animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#004724] text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 mb-3 shadow-2xs">
            <Shield className="w-5 h-5 text-[#D6A33A]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/90 border border-white/15 mb-2">
            Portal Otentikasi Admin
          </span>
          <h3 className="text-lg font-bold tracking-tight">Login Portal Admin SPMB</h3>
          <p className="text-xs text-white/80 mt-0.5 font-normal">{schoolName}</p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                PIN / Kata Sandi Panitia
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan PIN panitia..."
                  className="m3-input pl-10"
                />
              </div>
              <p className="text-[11px] text-[#78716C] mt-1.5">Gunakan PIN panitia yang telah ditentukan. Jangan bagikan PIN ini kepada siapa pun.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifikasi Login...</span>
              ) : (
                <>
                  <span>Masuk Portal Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
