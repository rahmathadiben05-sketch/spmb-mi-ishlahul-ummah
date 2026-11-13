'use client';

import React, { useState } from 'react';
import {
  School,
  Shield,
  Search,
  Sparkles,
  HelpCircle,
  FileText,
  ArrowRight,
  Menu,
  X,
  FileDown,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface LandingHeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenStatusCheck: () => void;
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  onStartRegistration?: () => void;
  schoolName: string;
  logoUrl?: string;
  headerTagline?: string;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenStatusCheck,
  onNavigateHome,
  onOpenAdmin,
  onStartRegistration,
  schoolName,
  logoUrl,
  headerTagline,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    onNavigateHome();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] transition-all shadow-[0_2px_12px_rgba(28,25,23,0.04)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Identitas Madrasah (Style spmb.miwahati.sch.id) */}
        <div
          onClick={() => {
            setMobileMenuOpen(false);
            onNavigateHome();
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none min-h-[44px] min-w-0 flex-1"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Madrasah"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-xs border border-[#E7E5E4] group-hover:scale-105 transition-transform shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0"
              style={{ background: '#065F46' }}
            >
              <School className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            {/* Nama singkat di HP (MI ...) agar tidak menumpuk tombol; nama lengkap mulai sm */}
            <span className="sm:hidden font-extrabold text-[#1C1917] text-sm leading-tight tracking-tight font-heading group-hover:text-[#065F46] transition-colors truncate">
              {schoolName.replace('Madrasah Ibtidaiyah', 'MI')}
            </span>
            <span className="hidden sm:block font-extrabold text-[#1C1917] text-base sm:text-lg leading-tight tracking-tight font-heading group-hover:text-[#065F46] transition-colors">
              {schoolName}
            </span>
            <span className="hidden sm:block text-xs text-[#78716C] font-medium line-clamp-1">
              {headerTagline || 'Generasi Qur\'ani, Cerdas & Berakhlak Mulia'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0" aria-label="Navigasi Utama">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center whitespace-nowrap px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition text-[#065F46] bg-[#EEFAF4] shadow-2xs cursor-pointer"
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('alur-pendaftaran')}
            className="inline-flex items-center whitespace-nowrap px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition text-[#44403C] hover:text-[#065F46] hover:bg-[#F7F4EC] cursor-pointer"
          >
            Alur
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('keunggulan-madrasah')}
            className="inline-flex items-center whitespace-nowrap px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition text-[#44403C] hover:text-[#065F46] hover:bg-[#F7F4EC] cursor-pointer"
          >
            Program
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pusat-unduhan')}
            className="inline-flex items-center whitespace-nowrap px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition text-[#44403C] hover:text-[#065F46] hover:bg-[#F7F4EC] cursor-pointer"
          >
            Unduhan
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('faq-section')}
            className="inline-flex items-center whitespace-nowrap px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition text-[#44403C] hover:text-[#065F46] hover:bg-[#F7F4EC] cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Cek Pengumuman Button — disembunyikan di layar sangat kecil
              (tombol Lacak Status besar sudah ada di hero). NOTE: jangan taruh
              class hidden langsung di tombol ini — .btn-theme-secondary di
              globals.css (tanpa @layer) memaksa display:inline-flex dan
              mengalahkan utility hidden. Sembunyikan lewat pembungkus. */}
          <span className="hidden sm:block">
          <button
            type="button"
            onClick={onOpenStatusCheck}
            className="btn-theme-secondary !py-2.5 !px-3.5 sm:!px-4 !text-xs sm:!text-sm flex items-center whitespace-nowrap gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#065F46]" />
            <span className="hidden xl:inline">Lacak Pendaftaran</span>
            <span className="xl:hidden hidden sm:inline">Lacak</span>
          </button>
          </span>

          {/* Direct CTA Daftar Sekarang */}
          {onStartRegistration && (
            <button
              type="button"
              onClick={onStartRegistration}
              className="btn-theme-primary !py-2.5 !px-3 sm:!px-5 !text-xs sm:!text-sm flex items-center whitespace-nowrap gap-2 cursor-pointer shadow-xs"
            >
              <span className="hidden sm:block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Daftar Sekarang</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-[#1C1917] hover:bg-[#F7F4EC] border border-[#E7E5E4] cursor-pointer"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E7E5E4] bg-white px-5 pt-4 pb-6 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F4EC] border border-[#E7E5E4]">
            <span className="text-xs font-semibold text-[#78716C]">Status SPMB:</span>
            <span className="inline-flex items-center font-bold tracking-wider uppercase rounded-full px-3 py-1 text-[11px] gap-1.5 bg-[#EEFAF4] text-[#065F46] border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sedang Dibuka</span>
            </span>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateHome();
              }}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] border-b border-[#F5F5F4] text-left cursor-pointer"
            >
              Beranda Portal
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('alur-pendaftaran')}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] border-b border-[#F5F5F4] text-left cursor-pointer"
            >
              Alur Pendaftaran (4 Langkah Praktis)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('keunggulan-madrasah')}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] border-b border-[#F5F5F4] text-left cursor-pointer"
            >
              Program &amp; Keunggulan
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pusat-unduhan')}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] border-b border-[#F5F5F4] text-left cursor-pointer"
            >
              Pusat Unduhan &amp; Brosur
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] border-b border-[#F5F5F4] text-left cursor-pointer"
            >
              Tanya Jawab (FAQ)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('hubungi-kami')}
              className="flex w-full items-center py-2.5 text-sm font-semibold text-[#1C1917] text-left cursor-pointer"
            >
              Sekretariat &amp; Lokasi
            </button>
          </div>

          {onStartRegistration && (
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartRegistration();
                }}
                className="btn-theme-primary w-full !py-3 text-center text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Daftar Siswa Baru Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
