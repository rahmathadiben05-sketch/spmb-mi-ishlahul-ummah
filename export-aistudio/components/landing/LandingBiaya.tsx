'use client';

import React from 'react';
import { Wallet, Check, Download } from 'lucide-react';
import { FeeItem, SchoolSettings } from '@/lib/types';
import { DEFAULT_RINCIAN_BIAYA, formatRupiah } from '@/lib/storage';

// Seksi Biaya di beranda (temuan tinjauan 13 Nov: sebelumnya tidak ada
// seksi biaya khusus — rincian lengkap hanya muncul setelah login).
// Data dari CMS yang sama dengan Informasi Pendaftaran (Pengaturan →
// Rincian Biaya), jadi angka di beranda dan di dashboard wali selalu sama.
// (13 Nov, keputusan Rahmat: seksi DIRINGKAS — hanya total yang tampil,
// rincian 3 kartu dibuka lewat tombol, supaya beranda tetap rapi namun
// transparan.)
// (17 Nov, v2.13.16, keputusan Rahmat: rincian item DIHAPUS dari beranda —
// pindah ke berkas brosur. Yang tetap: total Putra/Putri + ketentuan
// pembayaran singkat (penenang: bukan dibayar sekaligus, perlengkapan
// boleh dicicil, buku tidak termasuk) + tombol ke brosur. Rincian lengkap
// tetap ada di halaman Informasi Pendaftaran, dashboard wali, dan cetakan
// Bukti Diterima siswa LULUS.)
export const LandingBiaya: React.FC<{ settings: SchoolSettings }> = ({ settings }) => {
  const rincian = settings.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;
  const sum = (items: FeeItem[]) => (items || []).reduce((a, it) => a + (Number(it.biaya) || 0), 0);
  const admin = sum(rincian.itemsAdministrasi);
  const putri = sum(rincian.itemsPerempuan);
  const putra = sum(rincian.itemsLakiLaki);
  const brosurUrl = settings.brosurDigitalUrl || '';

  return (
    <section id="biaya" className="py-10 sm:py-14 bg-[#F7F4EC] border-t border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <Wallet className="w-3.5 h-3.5" />
            <span>Biaya Pendaftaran</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            Biaya Pendaftaran Transparan
          </h2>
          <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
            {rincian.introPesan || 'Rincian resmi administrasi dan paket perlengkapan siswa baru. Tidak ada biaya tersembunyi.'}
          </p>
          <div className="h-1.5 w-16 mx-auto mt-4.5 rounded-full" style={{ background: '#B45309' }} />
        </div>

        {/* Total selalu tampil; rincian lengkap ada di brosur. */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-xs px-5 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-center">
          <p className="text-sm text-[#1C1917]">
            <span className="font-bold">Total Putra:</span>{' '}
            <span className="font-mono font-black text-[#065F46]">{formatRupiah(admin + putra)}</span>
            <span className="text-[#A8A29E]"> (administrasi + perlengkapan)</span>
          </p>
          <p className="text-sm text-[#1C1917]">
            <span className="font-bold">Total Putri:</span>{' '}
            <span className="font-mono font-black text-[#065F46]">{formatRupiah(admin + putri)}</span>
            <span className="text-[#A8A29E]"> (administrasi + perlengkapan)</span>
          </p>
        </div>

        {rincian.catatanAdministrasi && (
          <p className="mt-4 text-center text-xs text-[#78716C] leading-relaxed">
            {rincian.catatanAdministrasi.replaceAll('{biayaPendaftaran}', admin.toLocaleString('id-ID'))}
          </p>
        )}
        {(rincian.ketentuanPembayaran || []).length > 0 && (
          <ul className="mt-3 max-w-2xl mx-auto space-y-1 text-xs text-[#78716C]">
            {(rincian.ketentuanPembayaran || []).map((k, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#065F46] shrink-0 mt-0.5" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 text-center">
          {brosurUrl ? (
            <a
              href={brosurUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#065F46] text-white text-sm font-bold hover:bg-[#054d39] cursor-pointer shadow-xs"
            >
              Lihat rincian lengkap di brosur
              <Download className="w-4 h-4" />
            </a>
          ) : (
            <a
              href="/informasi-pendaftaran"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#065F46] text-white text-sm font-bold hover:bg-[#054d39] cursor-pointer shadow-xs"
            >
              Lihat rincian lengkap biaya
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
