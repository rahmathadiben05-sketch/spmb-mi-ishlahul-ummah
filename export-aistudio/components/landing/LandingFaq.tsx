'use client';

import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  MessageCircle,
  FileCheck2,
  KeyRound,
  ShieldCheck,
  CreditCard,
  PhoneCall,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calculator,
  ListChecks,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolSettings, FaqItem as CmsFaqItem } from '@/lib/types';
import { DEFAULT_CMS_CONTENT } from '@/lib/storage';

interface LandingFaqProps {
  settings: SchoolSettings;
  onStartRegistration?: () => void;
  onOpenStatusCheck?: () => void;
}

interface FaqItem {
  id: string;
  category: 'alur' | 'biaya' | 'status' | 'dokumen';
  categoryLabel: string;
  question: string;
  answer: string;
  points?: string[];
  icon: React.ElementType;
}

export const LandingFaq: React.FC<LandingFaqProps> = ({
  settings,
  onStartRegistration,
  onOpenStatusCheck,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'alur' | 'biaya' | 'status' | 'dokumen'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const cleanPhone = (settings.kontakWhatsapp || '085196677872').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB ${settings.namaMadrasah}, saya ingin berkonsultasi mengenai proses pendaftaran siswa baru.`
  )}`;

  // Isi FAQ dari CMS (admin bisa tambah/ubah/hapus); ikon & label kategori mengikuti posisi/kategori.
  const FAQ_ICONS: React.ElementType[] = [
    KeyRound,
    CreditCard,
    ListChecks,
    Sparkles,
    FileCheck2,
    ShieldCheck,
    CreditCard,
    ArrowRight,
    FileCheck2,
  ];
  const FAQ_CATEGORY_LABELS: Record<CmsFaqItem['category'], string> = {
    alur: 'Alur & Registrasi',
    biaya: 'Biaya & Pembayaran',
    status: 'Lacak Status & Observasi',
    dokumen: 'Persyaratan Berkas',
  };
  const faqList: FaqItem[] = useMemo(() => {
    const cmsItems =
      settings.cmsContent?.faqItems?.length
        ? settings.cmsContent.faqItems
        : DEFAULT_CMS_CONTENT.faqItems || [];
    const replaceTokens = (text: string) =>
      text
        .replaceAll('{namaMadrasah}', settings.namaMadrasah)
        .replaceAll('{biayaPendaftaran}', settings.biayaPendaftaran.toLocaleString('id-ID'));
    return cmsItems.map((item, idx) => ({
      id: item.id || `faq-${idx + 1}`,
      category: item.category,
      categoryLabel: FAQ_CATEGORY_LABELS[item.category] || 'Tanya Jawab',
      question: replaceTokens(item.question),
      answer: replaceTokens(item.answer),
      points: (item.points || []).map(replaceTokens),
      icon: FAQ_ICONS[idx] || HelpCircle,
    }));
  }, [settings]);

  const filteredFaqs = useMemo(() => {
    return faqList.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.points && item.points.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCat && matchQuery;
    });
  }, [faqList, activeCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (settings.sectionVisibility?.showFaq === false) {
    return null;
  }

  return (
    <section
      id="faq-section"
      className="py-10 sm:py-14 bg-[#F7F4EC] border-b border-[#E7E5E4] relative overflow-hidden"
    >
      {/* Background Dot Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
        style={{
          backgroundSize: '32px 32px',
          backgroundImage: 'radial-gradient(#1c1917 0.75px, transparent 0.75px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pusat Bantuan &amp; Tanya Jawab</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            {settings.cmsContent?.faqJudul || 'Pertanyaan yang Sering Diajukan'}
          </h2>
          <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
            {(settings.cmsContent?.faqDeskripsi ||
              'Informasi lengkap seputar alur pendaftaran, dokumen persyaratan, dan mekanisme seleksi murid baru di {namaMadrasah}.').replace(
              '{namaMadrasah}',
              settings.namaMadrasah
            )}
          </p>
          <div
            className="h-1.5 w-16 mx-auto mt-4.5 rounded-full"
            style={{ background: '#B45309' }}
          />
        </div>

        {/* Search Bar & Category Filter Controls */}
        <div className="mb-10 space-y-4 max-w-3xl mx-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#78716C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan (misal: nomor registrasi, PIN, biaya, seragam, status, berkas)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E7E5E4] rounded-2xl text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#065F46] focus:ring-2 focus:ring-[#065F46]/15 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { id: 'all', label: 'Semua Pertanyaan', count: faqList.length },
              { id: 'alur', label: 'Alur & Registrasi', count: faqList.filter((f) => f.category === 'alur').length },
              { id: 'biaya', label: 'Biaya & Pembayaran', count: faqList.filter((f) => f.category === 'biaya').length },
              { id: 'status', label: 'Lacak Status & Observasi', count: faqList.filter((f) => f.category === 'status').length },
              { id: 'dokumen', label: 'Persyaratan Berkas', count: faqList.filter((f) => f.category === 'dokumen').length },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'btn-theme-primary text-white shadow-md'
                      : 'bg-white text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] border border-[#E7E5E4]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F7F4EC] text-[#78716C] border border-[#E7E5E4]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List (Matching spmb.miwahati.sch.id Card Styling) */}
        <div className="space-y-3.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              const IconComp = faq.icon;
              return (
                <div
                  key={faq.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-white border-[#065F46] shadow-lg ring-1 ring-[#065F46]/15'
                      : 'bg-white hover:bg-[#F7F4EC] border-[#E7E5E4] shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(faq.id)}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isExpanded
                            ? 'bg-[#EEFAF4] text-[#065F46] border border-[#A7F3D0]'
                            : 'bg-[#F7F4EC] text-[#57534E] border border-[#E7E5E4]'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#065F46] bg-[#EEFAF4] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                            {faq.categoryLabel}
                          </span>
                        </div>
                        <h3
                          className={`text-base sm:text-lg font-bold leading-snug transition-colors font-heading ${
                            isExpanded ? 'text-[#065F46]' : 'text-[#1C1917]'
                          }`}
                        >
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'bg-[#EEFAF4] text-[#065F46] rotate-180' : 'bg-[#F7F4EC] text-[#57534E]'
                      }`}
                    >
                      <ChevronDown className="w-4.5 h-4.5" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-1 text-sm text-[#44403C] border-t border-[#F5F5F4] mt-1 space-y-4">
                          <p className="leading-relaxed font-normal">{faq.answer}</p>

                          {faq.points && faq.points.length > 0 && (
                            <div className="p-4 rounded-2xl bg-[#F7F4EC] border border-[#E7E5E4] space-y-2">
                              <span className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider font-heading">
                                Catatan &amp; Poin Penting:
                              </span>
                              <ul className="space-y-2">
                                {faq.points.map((point, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#57534E]">
                                    <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {faq.id === 'faq-6' && onOpenStatusCheck && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={onOpenStatusCheck}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065F46] hover:underline cursor-pointer"
                              >
                                <span>Buka Fitur Cek Status Sekarang</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 rounded-xl bg-white border border-[#E7E5E4]">
              <HelpCircle className="w-10 h-10 text-[#A8A29E] mx-auto mb-2 opacity-50" />
              <h4 className="text-base font-bold text-[#1C1917] font-heading">Tidak ada pertanyaan yang sesuai</h4>
              <p className="text-xs text-[#78716C] mt-1">
                Coba gunakan kata kunci lain atau pilih kategori &quot;Semua Pertanyaan&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#E7E5E4] text-xs font-bold text-[#065F46] hover:bg-[#EEFAF4] transition-colors cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>

        {/* Bottom Helpdesk & CTA Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-xl bg-white border border-[#E7E5E4] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider font-heading">
              Butuh Konsultasi Langsung?
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#1C1917] font-heading">
              Masih Memiliki Pertanyaan yang Belum Terjawab?
            </h3>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-lg leading-relaxed">
              Tim Panitia SPMB siap melayani dan mendampingi Bapak/Ibu dalam proses pendaftaran secara langsung atau via WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              <span>Tanya Panitia via WhatsApp</span>
            </a>

            {onStartRegistration && (
              <button
                type="button"
                onClick={onStartRegistration}
                className="btn-theme-primary !py-3.5 !px-6 !text-xs !rounded-2xl cursor-pointer w-full sm:w-auto"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
