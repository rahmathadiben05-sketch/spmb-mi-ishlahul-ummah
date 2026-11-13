'use client';

import React from 'react';
import { Quote } from 'lucide-react';
import { SchoolSettings } from '@/lib/types';

interface LandingTestimonialsProps {
  settings: SchoolSettings;
}

export const LandingTestimonials: React.FC<LandingTestimonialsProps> = ({ settings }) => {
  const items = (settings.cmsContent?.testimoni || []).filter((t) => t.kutipan.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-[#FBFBF9] border-b border-[#DCEBE3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <span>Testimoni Wali Murid</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#18231F] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            Apa Kata Wali Murid
          </h2>
          <p className="text-base sm:text-lg text-[#52625B] mt-3 leading-relaxed font-normal">
            Cerita jujur dari orang tua yang telah mempercayakan putra-putrinya kepada kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-7 border border-[#E7E5E4] shadow-xs flex flex-col gap-4"
            >
              <Quote className="w-7 h-7 text-[#B45309]" />
              <p className="text-sm text-[#57534E] leading-relaxed flex-1">
                &ldquo;{item.kutipan}&rdquo;
              </p>
              <div className="pt-3 border-t border-[#F5F5F4]">
                <p className="text-sm font-extrabold text-[#1C1917]">{item.nama}</p>
                {item.peran && <p className="text-xs text-[#78716C]">{item.peran}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
