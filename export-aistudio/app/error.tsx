'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-800 text-center">
      <h2 className="text-2xl font-bold mb-2">Terjadi Kesalahan Sistem</h2>
      <p className="text-sm text-slate-600 mb-4">Mohon maaf, terjadi kendala saat memuat halaman.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
      >
        Muat Ulang Halaman
      </button>
    </div>
  );
}
