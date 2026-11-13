'use client';

import React from 'react';
import { Check, Save, Sparkles } from 'lucide-react';

interface WizardProgressBarProps {
  currentStep: number; // 1, 2, 3, 4, 5 (5 is review)
  lastSavedAt?: string | null;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  lastSavedAt,
}) => {
  const steps = [
    { num: 1, title: 'Data Anak' },
    { num: 2, title: 'Data Orang Tua' },
    { num: 3, title: 'Data Alamat' },
    { num: 4, title: 'Upload Berkas' },
    { num: 5, title: 'Tinjau & Kirim' },
  ];

  // Langkah 5 baru meninjau — belum terkirim, jadi progres tidak pernah 100% di sini.
  const percentage = currentStep >= 5 ? 80 : Math.round((currentStep / 5) * 100);

  return (
    <div className="m3-card p-6 sm:p-7 mb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#007A3D] uppercase tracking-wider bg-[#E6F5EC] px-2.5 py-0.5 rounded-md border border-[#B3E2C4]">
              Langkah {currentStep} dari 5
            </span>
            <span className="text-xs font-semibold text-[#A97818] bg-[#F7EBCB] px-2.5 py-0.5 rounded-md border border-[#F7EBCB]">
              {currentStep >= 5 ? 'Langkah terakhir — belum terkirim' : `${percentage}% Selesai`}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#18231F] mt-2.5">
            {steps[currentStep - 1]?.title || 'Formulir SPMB'}
          </h2>
        </div>

        {/* Auto-save Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-[#52625B] bg-[#F8FAF8] px-3 py-1.5 rounded-lg border border-[#E1EAE5]">
          <Save className="w-3.5 h-3.5 text-[#007A3D]" />
          <span className="font-normal">
            {lastSavedAt
              ? `Tersimpan: ${new Date(lastSavedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Auto-save aktif'}
          </span>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="relative w-full h-1.5 bg-[#F8FAF8] rounded-full overflow-hidden mb-7 border border-[#E1EAE5]">
        <div
          className="h-full bg-[#007A3D] transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stepper Dots */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;

          return (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                  isCurrent
                    ? 'step-active scale-105'
                    : isDone
                    ? 'step-complete'
                    : 'step-inactive border border-[#E1EAE5]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
              </div>
              <span
                className={`text-[11px] mt-2 font-medium hidden md:inline-block max-w-[90px] truncate ${
                  isCurrent
                    ? 'text-[#007A3D] font-bold'
                    : isDone
                    ? 'text-[#18231F]'
                    : 'text-[#7A8781]'
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
