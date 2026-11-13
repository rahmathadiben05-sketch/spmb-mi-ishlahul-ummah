'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  School,
  Sparkles,
  LogOut,
  Loader2,
} from 'lucide-react';
import { WaliMuridSession } from '@/lib/types';
import { getWaliMuridSession, clearWaliMuridSession } from '@/lib/storage';
import { InformasiPendaftaranView } from '@/components/informasi/InformasiPendaftaranView';

export default function InformasiPendaftaranPage() {
  const router = useRouter();
  const [session, setSession] = useState<WaliMuridSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const clientSession = getWaliMuridSession();

      if (!clientSession || !clientSession.nomorPendaftaran) {
        setIsAuthorized(false);
        setIsLoading(false);
        setAuthError(
          'Halaman Informasi Pendaftaran hanya dapat diakses oleh Wali Murid yang telah terdaftar dan berhasil login.'
        );
        return;
      }

      try {
        // Validate with server API
        const res = await fetch('/api/informasi-pendaftaran', {
          headers: {
            Authorization: `Bearer ${clientSession.authToken || 'session'}`,
          },
        });

        if (res.ok) {
          setSession(clientSession);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setAuthError('Sesi login telah berakhir atau tidak valid. Silakan login kembali.');
        }
      } catch {
        // Fallback saat gangguan jaringan: otorisasi dari sesi klien
        // (gerbang UX saja — route /api/informasi-pendaftaran juga hanya
        // memeriksa bentuk token, bukan otorisasi server; lihat route.ts).
        if (clientSession.nomorPendaftaran && clientSession.pin) {
          setSession(clientSession);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    clearWaliMuridSession();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-sm font-bold text-stone-700">Memverifikasi otorisasi akun Wali Murid...</p>
      </div>
    );
  }

  // JIKA BELUM LOGIN / AKSES DITOLAK:
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-stone-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/70 px-3 py-1 rounded-full">
              Akses Terbatas
            </span>
            <h1 className="text-xl font-extrabold text-stone-900 font-heading">
              Informasi Pendaftaran Khusus Wali Murid
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {authError ||
                'Halaman rincian resmi administrasi pendaftaran dan perlengkapan siswa hanya dapat diakses oleh Wali Murid yang telah memiliki akun dan berhasil login.'}
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>Login / Masuk Akun Pendaftar</span>
            </Link>

            <Link
              href="/"
              className="w-full py-3 px-4 rounded-2xl bg-[#F7F4EC] hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda Publik</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-400">
            MI Ishlahul Ummah • Pranti, Sedati, Sidoarjo
          </div>
        </div>
      </div>
    );
  }

  // JIKA BERHASIL TERAUTENTIKASI SEBAGAI WALI MURID:
  return (
    <div className="min-h-screen bg-[#F7F4EC] py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Navbar for Logged-in Wali Murid */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-emerald-800 transition cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda / Formulir</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar (Logout)</span>
        </button>
      </div>

      <InformasiPendaftaranView
        session={session}
        onBack={() => router.push('/')}
      />
    </div>
  );
}
