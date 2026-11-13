'use client';

import React from 'react';
import { SchoolSettings } from '@/lib/types';

interface LandingGalleryProps {
  settings: SchoolSettings;
}

export const LandingGallery: React.FC<LandingGalleryProps> = ({ settings }) => {
  const photos = (settings.cmsContent?.galeriFotoUrl || []).filter((u) => u.trim().length > 0);
  if (photos.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-white border-b border-[#E7E5E4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="badge-warm-primary mb-3.5 shadow-2xs">
            <span>Galeri Madrasah</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
            Suasana Madrasah Ibtidaiyah Ishlahul Ummah dan berbagai kegiatan siswa siswi
          </h2>
          <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
            Geser untuk melihat kegiatan dan lingkungan belajar santri.
          </p>
        </div>

        <div className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 justify-start lg:justify-center">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className="snap-center shrink-0 w-[280px] sm:w-[360px] aspect-[4/3] rounded-xl overflow-hidden border border-[#E7E5E4] shadow-xs bg-[#F7F4EC]"
            >
              <img
                src={url}
                alt={`Galeri madrasah ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
