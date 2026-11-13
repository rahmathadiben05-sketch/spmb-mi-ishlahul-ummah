import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-800 text-center">
      <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan (404)</h2>
      <p className="text-sm text-slate-600 mb-4">Halaman yang Anda cari tidak tersedia.</p>
      <Link href="/" className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-colors">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
