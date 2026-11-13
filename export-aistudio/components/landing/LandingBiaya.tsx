'use client';

import React, { useState } from 'react';
import { Wallet, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FeeItem, SchoolSettings } from '@/lib/types';
import { DEFAULT_RINCIAN_BIAYA, formatRupiah } from '@/lib/storage';

// Seksi Rincian Biaya di beranda (temuan tinjauan 13 Nov: sebelumnya tidak
// ada seksi biaya khusus — rincian lengkap hanya muncul setelah login).
// Data dari CMS yang sama dengan Informasi Pendaftaran (Pengaturan →
// Rincian Biaya), jadi angka di beranda dan di dashboard wali selalu sama.
// (13 Nov, keputusan Rahmat: seksi DIRINGKAS — hanya total yang tampil,
// rincian 3 kartu dibuka lewat tombol, supaya beranda tetap rapi namun
// transparan.)
export const LandingBiaya: React.FC<{ settings: SchoolSettings }> = ({ settings }) => {
  const [expanded, setExpanded] = useState(false);
  const rincian = settings.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;
  const sum = (items: FeeItem[]) => (items || []).reduce((a, it) => a + (Number(it.biaya) || 0), 0);
  const admin = sum(rincian.itemsAdministrasi);
  const putri = sum(rincian.itemsPerempuan);
  const putra = sum(rincian.itemsLakiLaki);

  const groups: Array<{ title: string; items: FeeItem[]; total: number; accent: string }> = [
    { title: rincian.judulAdministrasi || 'Administrasi Pendaftaran', items: rincian.itemsAdministrasi || [], total: admin, accent: 'bg-[#065F46]' },
    { title: rincian.judulPerempuan || 'Perlengkapan Siswa Perempuan', items: rincian.itemsPerempuan || [], total: putri, accent: 'bg-[#B45309]' },
    { title: rincian.judulLakiLaki || 'Perlengkapan Siswa Laki-laki', items: rincian.itemsLakiLaki || [], total: putra, accent: 'bg-[#065F46]' },
  ];

  return (
    <section id="biaya" className="py-10 sm:py-14 bg-[#F7F4EC] border-t border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <Wallet className="w-3.5 h-3.5" />
            <span>Rincian Biaya</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            Biaya Pendaftaran Transparan
          </h2>
          <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
            {rincian.introPesan || 'Rincian resmi administrasi dan paket perlengkapan siswa baru. Tidak ada biaya tersembunyi.'}
          </p>
          <div className="h-1.5 w-16 mx-auto mt-4.5 rounded-full" style={{ background: '#B45309' }} />
        </div>

        {/* Total selalu tampil; rincian dibuka lewat tombol. */}
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

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#065F46] text-white text-sm font-bold hover:bg-[#054d39] cursor-pointer shadow-xs"
          >
            {expanded ? 'Sembunyikan rincian biaya' : 'Lihat rincian biaya'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {groups.map((g) => (
                <div key={g.title} className="bg-white rounded-xl border border-[#E7E5E4] shadow-xs overflow-hidden flex flex-col">
                  <div className={`${g.accent} px-5 py-3.5`}>
                    <h3 className="text-sm font-extrabold text-white font-heading">{g.title}</h3>
                  </div>
                  <ul className="flex-1 px-5 py-4 space-y-2.5 text-sm">
                    {g.items.map((it) => (
                      <li key={it.id} className="flex items-start justify-between gap-3">
                        <span className="flex items-start gap-2 text-[#1C1917]">
                          <Check className="w-4 h-4 text-[#065F46] shrink-0 mt-0.5" />
                          <span>{it.nama}</span>
                        </span>
                        <span className="font-mono font-bold text-[#1C1917] whitespace-nowrap">{formatRupiah(it.biaya)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="px-5 py-3.5 border-t border-[#E7E5E4] bg-[#F8FAF8] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#626862] uppercase tracking-wider">Subtotal</span>
                    <span className="font-mono font-black text-[#065F46]">{formatRupiah(g.total)}</span>
                  </div>
                </div>
              ))}
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
          </>
        )}
      </div>
    </section>
  );
};
