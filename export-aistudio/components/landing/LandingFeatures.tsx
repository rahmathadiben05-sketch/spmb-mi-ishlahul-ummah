'use client';

import React from 'react';
import {
  BookOpen,
  HeartHandshake,
  Cpu,
  Sparkles,
  CheckCircle2,
  Award,
  Users,
  Quote,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { SchoolSettings } from '@/lib/types';
import { DEFAULT_CMS_CONTENT } from '@/lib/storage';
import { motion } from 'motion/react';

interface LandingFeaturesProps {
  settings: SchoolSettings;
  onStartRegistration: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({
  settings,
  onStartRegistration,
}) => {
  const vis = settings.sectionVisibility;
  const cms = settings.cmsContent || {};

  const showMengenal = vis?.showMengenalDekat !== false;
  const showProgram = vis?.showProgramMutu !== false;
  const showSambutan = vis?.showSambutanKepala !== false;

  const mengenalPoints = cms.mengenalPoints && cms.mengenalPoints.length > 0
    ? cms.mengenalPoints
    : [
        "Pembiasaan Sholat Dhuha, Dhuhur Berjamaah & Tartil Al-Qur'an",
        'Tenaga Pendidik Berdedikasi, Telaten & Ramah Anak',
        'Gedung Madrasah Bersih, Asri, dan Aman bagi Tumbuh Kembang',
        'Sistem Administrasi SPMB Online Terpadu & Bebas Antrean',
      ];

  // Isi kartu program dari CMS (admin bisa ubah teks); ikon mengikuti posisi.
  const PROGRAM_ICONS = [BookOpen, HeartHandshake, Cpu];
  const programs = (
    cms.programCards?.length ? cms.programCards : DEFAULT_CMS_CONTENT.programCards || []
  ).map((card, idx) => ({
    ...card,
    icon: PROGRAM_ICONS[idx] || BookOpen,
  }));

  return (
    <>
      {/* 1. SECTION: Mengenal Lebih Dekat (Bisa Diaktifkan/Dinonaktifkan via Admin) */}
      {showMengenal && (
        <section id="mengenal-madrasah" className="py-10 sm:py-14 bg-white border-b border-[#E7E5E4] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              
              {/* Left Graphic / Highlights */}
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="relative rounded-xl p-6 sm:p-8 bg-white border border-[#E7E5E4] shadow-md">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#065F46] text-white flex items-center justify-center font-bold shadow-xs">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#1C1917] text-base font-heading">
                          Komitmen Keunggulan
                        </h4>
                        <p className="text-xs text-[#78716C]">Pendidikan Berkualitas Terpadu</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E7E5E4] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                        <span>Nilai Akreditasi Madrasah</span>
                        <span className="text-[#065F46] bg-[#EEFAF4] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                          {cms.mengenalAkreditasiNilai || 'Unggul (A)'}
                        </span>
                      </div>
                      <div className="w-full bg-[#F7F4EC] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#065F46] h-full rounded-full w-[96%]" />
                      </div>
                      <p className="text-[11px] text-[#78716C]">
                        Diakui resmi oleh Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M).
                      </p>
                    </div>

                    {/* Kotak rasio guru & siswa dihapus atas permintaan (13 Nov) */}
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E7E5E4] text-center text-xs">
                      <span className="block text-xl font-extrabold text-[#065F46] font-heading">100%</span>
                      <span className="text-[11px] text-[#78716C] font-medium">Lulusan Melanjutkan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Text Column */}
              <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                <span className="badge-warm-primary shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mengenal Lebih Dekat</span>
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight leading-[1.18] font-heading text-balance">
                  {cms.mengenalJudul || 'Madrasah Ramah Anak yang Membina Akhlak & Prestasi'}
                </h2>
                <p className="text-base sm:text-lg text-[#57534E] leading-relaxed font-normal">
                  {cms.mengenalDeskripsi ||
                    `${settings.namaMadrasah} berdedikasi menciptakan lingkungan belajar yang aman, penuh kasih sayang, dan menginspirasi rasa ingin tahu ananda. Kami memadukan nilai keislaman Ahlussunnah wal Jama'ah dengan kecakapan literasi abad ke-21.`}
                </p>

                <div className="space-y-3.5 pt-2">
                  {mengenalPoints.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#EEFAF4] text-[#065F46]">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-[#1C1917]">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onStartRegistration}
                    className="btn-theme-primary px-7 py-3.5 rounded-2xl text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Daftar Siswa Baru Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. SECTION: Program & Keunggulan Madrasah (Bisa Diaktifkan/Dinonaktifkan via Admin) */}
      {showProgram && (
        <section
          id="keunggulan-madrasah"
          className="py-10 sm:py-14 bg-[#F7F4EC] border-b border-[#E7E5E4] relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            aria-hidden="true"
            style={{
              backgroundSize: '32px 32px',
              backgroundImage: 'radial-gradient(#1c1917 0.75px, transparent 0.75px)',
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <span className="badge-warm-primary mb-3.5 shadow-2xs">
                <Star className="w-3.5 h-3.5" />
                <span>Program &amp; Mutu</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
                {cms.programJudul || 'Program & Keunggulan Madrasah'}
              </h2>
              <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
                {cms.programDeskripsi ||
                  "Kurikulum terpadu yang memadukan nilai Qur'ani, pembiasaan akhlak mulia, dan sains modern."}
              </p>
              <div
                className="h-1.5 w-16 mx-auto mt-4.5 rounded-full"
                style={{ background: '#B45309' }}
              />
            </div>

            {/* 3 Program Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {programs.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: idx * 0.08 }}
                    className="group relative bg-white rounded-xl p-7 sm:p-8 border border-[#E7E5E4] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div
                      className="absolute inset-x-7 top-0 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: '#B45309' }}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-[#EEFAF4] text-[#065F46] border border-[#A7F3D0]">
                          <IconComp className="w-7 h-7 stroke-[2]" />
                        </div>
                        <span className="text-xs font-bold text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-full border border-[#FDE68A] uppercase tracking-wider font-heading">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1C1917] font-heading group-hover:text-[#065F46] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#065F46] mt-1">
                        {item.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#78716C] mt-3 leading-relaxed font-normal flex-1">
                        {item.desc}
                      </p>

                      <div className="mt-5 pt-4 border-t border-[#F5F5F4] space-y-2">
                        {item.highlights.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-center gap-2 text-xs text-[#57534E]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. SECTION: Sambutan Kepala Madrasah (Bisa Diaktifkan/Dinonaktifkan via Admin) */}
      {showSambutan && (
        <section
          id="sambutan-kepala-madrasah"
          className="py-10 sm:py-14 bg-white border-b border-[#E7E5E4] relative overflow-hidden"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-[#F7F4EC] rounded-xl sm:rounded-[2.5rem] border border-[#E7E5E4] shadow-lg p-8 sm:p-12 lg:p-14 relative overflow-hidden">
              
              {/* Background Watermark Quote */}
              <div className="absolute top-6 right-8 text-[#E7E5E4] select-none pointer-events-none -z-0">
                <Quote className="w-24 h-24 sm:w-32 sm:h-32 opacity-30 text-[#065F46]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-center relative z-10">
                
                {/* Photo Frame with Emerald Ring */}
                <div className="md:col-span-4 flex flex-col items-center text-center">
                  <div
                    className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full p-2 border-2 shadow-md"
                    style={{
                      borderColor: '#A7F3D0',
                      background: '#F7F4EC',
                    }}
                  >
                    {cms.sambutanFotoUrl ? (
                      <img
                        src={cms.sambutanFotoUrl}
                        alt={settings.namaKepalaMadrasah}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#F5F5F4] flex items-center justify-center text-[#065F46] font-bold text-3xl font-heading">
                        <span>{settings.namaKepalaMadrasah.charAt(0) || 'K'}</span>
                      </div>
                    )}
                    <div
                      className="absolute bottom-1 right-2 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-xs text-white"
                      style={{ backgroundColor: '#065F46' }}
                    >
                      <Award className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-bold text-[#1C1917] font-heading">
                      {settings.namaKepalaMadrasah}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#78716C] font-medium mt-0.5">
                      Kepala {settings.namaMadrasah}
                    </p>
                  </div>
                </div>

                {/* Speech & Quote Column */}
                <div className="md:col-span-8 flex flex-col justify-center">
                  <span className="badge-warm-primary w-fit mb-4 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{cms.sambutanJudul || 'Sambutan Kepala Madrasah'}</span>
                  </span>
                  <blockquote className="text-base sm:text-lg lg:text-xl text-[#1C1917] font-medium leading-relaxed italic mb-6">
                    &ldquo;{cms.sambutanTeks ||
                      'Bismillahirrohmaanirrohiim. Kami meyakini setiap anak membawa fitrah dan potensi terbaik dari Allah SWT. Bersama para orang tua, kami berkomitmen mendampingi langkah awal ananda menuju masa depan yang cerah, cerdas bernalar, dan berakhlak karimah.'}&rdquo;
                  </blockquote>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E7E5E4]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#065F46]" />
                      <span>{cms.sambutanAmanah || 'Amanah & Ketulusan Mendidik'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={onStartRegistration}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#065F46] hover:underline cursor-pointer"
                    >
                      <span>Mulai Pendaftaran Online</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
