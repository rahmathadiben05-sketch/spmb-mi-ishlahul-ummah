'use client';

import React from 'react';
import { X } from 'lucide-react';
import { SchoolSettings, WaliMuridSession } from '@/lib/types';
import { InformasiPendaftaranView } from './InformasiPendaftaranView';

interface InformasiPendaftaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: WaliMuridSession | null;
  settings?: SchoolSettings;
}

export const InformasiPendaftaranModal: React.FC<InformasiPendaftaranModalProps> = ({
  isOpen,
  onClose,
  session,
  settings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition cursor-pointer print:hidden"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <InformasiPendaftaranView
          session={session}
          settings={settings}
          onBack={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
