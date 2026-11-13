'use client';

import React from 'react';
import {
  UserPlus,
  FileEdit,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Shirt,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';
import { SchoolSettings } from '@/lib/types';
import { DEFAULT_CMS_CONTENT } from '@/lib/storage';
import { motion } from 'motion/react';

interface RegistrationTimelineProps {
  onStartRegistration?: () => void;
  settings?: SchoolSettings;
}

export const RegistrationTimeline: React.FC<RegistrationTimelineProps> = ({
  onStartRegistration,
  settings,
}) => {
  if (settings?.sectionVisibility?.showTimeline === false) {
    return null;
  }

  // Isi langkah dari CMS (admin bisa ubah teks); ikon & warna aksen mengikuti posisi.
  const STEP_ICONS = [UserPlus, FileEdit, Building2, GraduationCap];
  const STEP_ACCENTS = ['bg-[#145C43]', 'bg-[#0D3B2E]', 'bg-[#145C43]', 'bg-[#145C43]'];
  const simplifiedSteps = (
    settings?.cmsContent?.timelineSteps?.length
      ? settings.cmsContent.timelineSteps
      : DEFAULT_CMS_CONTENT.timelineSteps || []
  ).map((step, idx) => ({
    ...step,
    num: String(idx + 1).padStart(2, '0'),
    icon: STEP_ICONS[idx] || UserPlus,
    accentColor: STEP_ACCENTS[idx] || 'bg-[#145C43]',
  }));

  return (
    <section
      id="alur-pendaftaran"
      className="py-10 sm:py-14 bg-[#FBFBF9] border-b border-[#DCEBE3] relative overflow-hidden"
    >
      {/* Subtle Islamic Motif Background */}
      <div className="absolute inset-0 pointer-events-none islamic-pattern-bg opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF4EF] text-[#145C43] border border-[#C9DED4] mb-3.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alur Pendaftaran Ringkas &amp; Ramah Wali Murid</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#18231F] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            {settings?.cmsContent?.timelineJudul || '4 Langkah Praktis Menjadi Santri Baru'}
          </h2>
          <p className="text-base sm:text-lg text-[#52625B] mt-3 leading-relaxed font-normal">
            {settings?.cmsContent?.timelineDeskripsi ||
              'Alur pendaftaran disederhanakan agar Bapak/Ibu dapat mendaftar mandiri dari rumah tanpa ribet, lalu menyelesaikan administrasi dan observasi di madrasah.'}
          </p>
          <div
            className="h-1.5 w-20 mx-auto mt-4.5 rounded-full"
            style={{ background: '#145C43' }}
          />
        </div>

        {/* 4 Cards Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {simplifiedSteps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="group relative bg-white rounded-xl p-6 sm:p-7 border border-[#DCEBE3] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Colored Indicator Bar */}
                <div
                  className={`absolute inset-x-6 top-0 h-1.5 rounded-full ${step.accentColor} opacity-90 group-hover:h-2 transition-all duration-300`}
                />

                <div className="flex flex-col flex-1">
                  {/* Step Header: Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5 pt-1">
                    <div className="w-13 h-13 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-[#EAF4EF] text-[#145C43] border border-[#C9DED4] shadow-2xs">
                      <IconComp className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#145C43]/40 group-hover:text-[#145C43] transition-colors">
                      {step.num}
                    </span>
                  </div>

                  {/* Badge & Title */}
                  <div className="mb-3">
                    <span className="inline-block text-[11px] font-bold text-[#A97818] bg-[#F7EBCB] px-2.5 py-0.5 rounded-md font-heading">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#18231F] font-heading group-hover:text-[#145C43] transition-colors leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#52625B] mt-2.5 leading-relaxed font-normal flex-1">
                    {step.desc}
                  </p>

                  {/* Micro points checklist */}
                  <div className="mt-5 pt-4 border-t border-[#F0F5F2] space-y-2">
                    {step.details.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-[11px] sm:text-xs text-[#52625B]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#145C43] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner Call to Action */}
        <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-xl bg-[#0D3B2E] text-white flex flex-col items-center justify-center gap-5 text-center shadow-xl relative overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-2/3 -translate-x-1/2 bg-radial from-[#D4A346]/20 to-transparent pointer-events-none" />
          <div className="space-y-1.5 text-center relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#F7EBCB] text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A346]" />
              <span>Daftar Sekarang Tanpa Menunggu</span>
            </span>
            <h3 className="text-lg sm:text-2xl font-extrabold font-heading text-white">
              Siap Menjadi Bagian dari Keluarga Besar MI Ishlahul Ummah?
            </h3>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              Cukup 1 menit untuk mendaftarkan akun wali murid dan mengamankan PIN 6 Digit pendaftaran ananda.
            </p>
          </div>
          {onStartRegistration && (
            <button
              type="button"
              onClick={onStartRegistration}
              className="py-3.5 px-7 rounded-2xl bg-[#D4A346] hover:bg-[#A97818] text-[#18231F] font-extrabold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer shrink-0 relative z-10"
            >
              <span>Mulai Registrasi Mandiri</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
