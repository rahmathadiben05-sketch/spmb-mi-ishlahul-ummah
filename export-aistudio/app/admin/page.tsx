'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { SchoolSettings, UserRole, RegistrationRecord } from '@/lib/types';
import {
  getSchoolSettings,
  setCurrentRole,
  verifyAdminPin,
  clearAdminSessionToken,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { PrintableBukti } from '@/components/print/PrintableBukti';
import { PrintableFormulirResmi } from '@/components/print/PrintableFormulirResmi';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setRoleState] = useState<UserRole>('public');
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);

  // Login form state
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Print overlays
  const [printBuktiRecord, setPrintBuktiRecord] = useState<RegistrationRecord | null>(null);
  const [printOfficialRecord, setPrintOfficialRecord] = useState<RegistrationRecord | null>(null);

  // TIDAK ADA auto-login dari role localStorage (Paket A, 2026-11-11):
  // role yang tersimpan di perangkat bukan bukti login. Admin wajib
  // login lewat verifyAdminPin ke server di tiap sesi browser baru.
  useEffect(() => {
    Promise.resolve().then(() => {
      const loadedSettings = getSchoolSettings();
      setSettings(loadedSettings);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    // PIN admin diverifikasi DI SERVER (verifyAdminPin, backend v2.9).
    // Tidak ada daftar PIN di bundle frontend; token sesi disimpan di
    // sessionStorage oleh verifyAdminPin bila PIN cocok.
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setLoginError('Silakan masukkan Kode PIN / Sandi Administrator.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await verifyAdminPin(cleanPin);
      if (res.ok) {
        setCurrentRole('admin');
        setRoleState('admin');
        setIsAuthenticated(true);
      } else {
        setLoginError(res.error || 'Kode PIN atau Kata Sandi salah. Silakan coba kembali.');
      }
    } catch {
      setLoginError('Gagal terhubung ke server. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSessionToken();
    setCurrentRole('public');
    setRoleState('public');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // If authenticated, render full AdminDashboard
  if (isAuthenticated && currentRole === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <AdminDashboard
          currentRole={currentRole}
          onRoleChange={(newRole) => {
            if (newRole === 'public') {
              handleLogout();
            } else {
              setRoleState(newRole);
            }
          }}
          onNavigateHome={() => {
            window.location.href = '/';
          }}
          onPrintOfficialForm={(record) => setPrintOfficialRecord(record)}
          onPrintBukti={(record) => setPrintBuktiRecord(record)}
          onSettingsChange={(newSettings) => setSettings(newSettings)}
        />

        {/* Printable Official Form Modal */}
        {printOfficialRecord && (
          <PrintableFormulirResmi
            record={printOfficialRecord}
            settings={settings}
            onClose={() => setPrintOfficialRecord(null)}
          />
        )}

        {/* Printable Bukti Modal */}
        {printBuktiRecord && (
          <PrintableBukti
            record={printBuktiRecord}
            settings={settings}
            onClose={() => setPrintBuktiRecord(null)}
          />
        )}
      </div>
    );
  }

  // If not authenticated, render secure Admin Gateway Login
  return (
    <div className="min-h-screen bg-[#F7F4EC] flex flex-col justify-between selection:bg-[#D1FAE5] selection:text-[#065F46] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#E7E5E4] bg-white/80 backdrop-blur-md px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#52625B] hover:text-[#145C43] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama SPMB</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
            <ShieldCheck className="w-4 h-4 text-[#145C43]" />
            <span>Akses Khusus Panitia</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 border border-[#DCEBE3] shadow-xl relative overflow-hidden">
          {/* Top Green Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0D3B2E]" />

          <div className="text-center mb-8 pt-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#145C43] text-white flex items-center justify-center shadow-md">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EAF4EF] text-[#145C43] border border-[#C9DED4] mb-2">
              <Sparkles className="w-3 h-3 text-[#145C43]" />
              <span>Portal Terbatas</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18231F] font-heading">
              Login Administrator &amp; Panitia
            </h1>
            <p className="text-xs sm:text-sm text-[#52625B] mt-1">
              {settings.namaMadrasah} &bull; TA {settings.activeAcademicYear}
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#18231F] mb-1.5 uppercase tracking-wider font-heading">
                PIN / Kata Sandi Panitia <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#7A8781] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN panitia..."
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#DCEBE3] bg-[#F7F4EC] text-sm text-[#18231F] focus:outline-none focus:border-[#145C43] focus:bg-white focus:ring-2 focus:ring-[#145C43]/20 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#7A8781] hover:text-[#18231F] cursor-pointer"
                  aria-label="Tampilkan Kata Sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#78716C] mt-1.5">Gunakan PIN panitia yang telah ditentukan. Jangan bagikan PIN ini kepada siapa pun.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-xl bg-[#145C43] hover:bg-[#0D3B2E] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi Akses...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Dashboard Panitia</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E7E5E4] text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-[#52625B] hover:text-[#145C43] inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Pendaftaran Calon Santri</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#A8A29E] border-t border-[#E7E5E4] bg-white">
        <p>&copy; {new Date().getFullYear()} {settings.namaMadrasah}. Sistem Penerimaan Murid Baru Online.</p>
      </footer>
    </div>
  );
}
