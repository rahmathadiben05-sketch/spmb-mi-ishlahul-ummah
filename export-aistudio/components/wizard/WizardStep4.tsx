'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, ArrowRight, ArrowLeft, Check, Trash2, RefreshCw, FileText, Image as ImageIcon, CheckCircle2, GraduationCap } from 'lucide-react';
import { DocumentsData, RegistrationType, SchoolSettings, UploadedFile } from '@/lib/types';

interface WizardStep4Props {
  data: DocumentsData;
  jenisPendaftaran: RegistrationType;
  onChange: (data: DocumentsData) => void;
  onNext: () => void;
  onPrev: () => void;
  settings?: SchoolSettings;
}

export const WizardStep4: React.FC<WizardStep4Props> = ({
  data,
  jenisPendaftaran,
  onChange,
  onNext,
  onPrev,
  settings,
}) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Perbaikan race upload (2026-11-11): handleFileUpload menunggu kompresi
  // async lalu setTimeout — `data` prop yang tertangkap saat fungsi dipanggil
  // bisa basi bila dua berkas diunggah cepat-cepat (yang terakhir menimpa
  // dan berkas pertama hilang). dataRef selalu menunjuk data terbaru.
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Browser Client-Side Image Compression (Canvas resize <= 1920px & JPEG 82% quality)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject('Gagal membaca file gambar');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Gagal membaca file');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (docKey: keyof DocumentsData, file: File) => {
    setUploadError((prev) => ({ ...prev, [docKey]: '' }));

    // File validation: Size <= 2MB
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setUploadError((prev) => ({
        ...prev,
        [docKey]: `Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 2 MB.`,
      }));
      return;
    }

    // Allowed types: PDF, JPG, JPEG, PNG
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setUploadError((prev) => ({
        ...prev,
        [docKey]: 'Format file harus PDF, JPG, JPEG, atau PNG.',
      }));
      return;
    }

    // Start upload simulation with progress %
    setUploadProgress((prev) => ({ ...prev, [docKey]: 10 }));
    try {
      let finalDataUrl = '';
      if (isImage) {
        setUploadProgress((prev) => ({ ...prev, [docKey]: 40 }));
        finalDataUrl = await compressImage(file);
        setUploadProgress((prev) => ({ ...prev, [docKey]: 80 }));
      } else {
        // PDF read directly
        setUploadProgress((prev) => ({ ...prev, [docKey]: 50 }));
        finalDataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = (e) => res(e.target?.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      }

      setUploadProgress((prev) => ({ ...prev, [docKey]: 100 }));
      setTimeout(() => {
        const newFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: finalDataUrl,
          uploadedAt: new Date().toISOString(),
        };
        onChange({ ...dataRef.current, [docKey]: newFile });
        setUploadProgress((prev) => ({ ...prev, [docKey]: 0 }));
      }, 200);
    } catch (err) {
      console.error(err);
      setUploadProgress((prev) => ({ ...prev, [docKey]: 0 }));
      setUploadError((prev) => ({
        ...prev,
        [docKey]: 'Gagal mengunggah file. Silakan coba kembali.',
      }));
    }
  };

  const handleRemove = (docKey: keyof DocumentsData) => {
    const copy = { ...dataRef.current };
    delete copy[docKey];
    onChange(copy);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.kk) errs.kk = 'Scan / Foto Kartu Keluarga (KK) wajib diunggah.';
    if (!data.akta) errs.akta = 'Scan / Foto Akta Kelahiran wajib diunggah.';

    // Pertanyaan ijazah TK wajib dijawab (Ya/Belum) — bukan dokumennya yang wajib.
    if (data.memilikiIjazahTk === undefined) {
      errs.memilikiIjazahTk = 'Jawab dulu pertanyaan ijazah TK di atas (Ya / Belum).';
    }
    // Ijazah TK: Wajib bagi yang sudah memegang ijazah TK
    if (data.memilikiIjazahTk && !data.ijazahTk) {
      errs.ijazahTk = 'Ijazah TK/RA wajib diunggah karena Anda menyatakan calon santri sudah memegang ijazah TK.';
    }

    if (jenisPendaftaran === 'pindahan') {
      if (!data.ijazahAtauSuratPindah) errs.ijazahAtauSuratPindah = 'Surat Keterangan Pindah wajib diunggah bagi siswa pindahan.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const renderUploadBox = (
    docKey: keyof DocumentsData,
    label: string,
    isMandatory: boolean,
    helper: string
  ) => {
    const file = data[docKey] as UploadedFile | undefined;
    const progress = uploadProgress[docKey] || 0;
    const errorMsg = uploadError[docKey] || errors[docKey];

    return (
      <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
        isMandatory ? 'border-[#4B634B]/40 bg-[#FAFBF9]' : 'border-[#E2E6E2] bg-[#F8FAF8]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#1A1D1A] flex items-center gap-1.5">
              <span>{label}</span>
              {isMandatory ? (
                <span className="text-rose-500 font-extrabold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  WAJIB UPLOAD
                </span>
              ) : (
                <span className="text-[10px] text-[#626862] font-semibold bg-stone-100 px-2 py-0.5 rounded">
                  OPSIONAL
                </span>
              )}
            </h4>
            <p className="text-xs text-[#626862] mt-0.5">{helper}</p>
          </div>
          {file && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4B634B] bg-[#EBF0EB] px-3 py-1 rounded-full border border-[#D1D9D1]">
              <FileCheck className="w-3.5 h-3.5" />
              Telah Diunggah
            </span>
          )}
        </div>

        {/* Existing uploaded file preview */}
        {file ? (
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#E2E6E2]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-[#EBF0EB] text-[#4B634B] flex items-center justify-center font-bold">
                {file.type?.includes('pdf') ? <FileText className="w-5 h-5 text-[#4B634B]" /> : <ImageIcon className="w-5 h-5 text-[#4B634B]" />}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#1A1D1A] truncate">{file.name}</p>
                <p className="text-[10px] text-[#626862]">
                  {(file.size / 1024).toFixed(0)} KB{file.type?.includes('pdf') ? ' • Dokumen PDF' : ' • Dikompresi otomatis'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(docKey)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2 cursor-pointer"
              title="Hapus File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* File input zone */
          <div className="relative">
            <label className="cursor-pointer border-2 border-dashed border-[#D1D9D1] hover:border-[#4B634B] bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all group">
              <Upload className="w-6 h-6 text-[#626862] group-hover:text-[#4B634B] mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-[#1A1D1A] group-hover:text-[#4B634B]">
                Klik untuk memilih file (Maks 2 MB)
              </span>
              <span className="text-[10px] text-[#626862] mt-0.5">Format: JPG, JPEG, PNG, atau PDF</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                className="hidden"
                disabled={progress > 0}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(docKey, f);
                  // Reset value supaya file yang sama bisa dipilih ulang.
                  e.target.value = '';
                }}
              />
            </label>

            {/* Upload progress percentage indicator */}
            {progress > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-[#4B634B]">
                  <span>Mengunggah & Mengkompresi...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E6E2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4B634B] transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleNextClick} className="bg-white rounded-xl p-8 sm:p-10 border border-[#E2E6E2] shadow-xs space-y-8">
      <div className="flex items-center gap-3.5 pb-5 border-b border-[#E2E6E2]">
        <div className="w-10 h-10 rounded-xl bg-[#EBF0EB] text-[#4B634B] flex items-center justify-center font-bold">
          <Upload className="w-5 h-5 text-[#4B634B]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1A1D1A]">
            {settings?.cmsContent?.step4Title || 'LANGKAH 4: Unggah Berkas Persyaratan'}
          </h3>
          <p className="text-xs text-[#626862]">
            {settings?.cmsContent?.step4Subtitle || 'Foto/Scan dokumen dengan jelas. File gambar dikompresi otomatis tanpa mengurangi kejelasan gambar.'}
          </p>
        </div>
      </div>

      {settings?.cmsContent?.step4Notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{settings.cmsContent.step4Notice}</span>
        </div>
      )}

      {/* Pertanyaan Konfirmasi Kepemilikan Ijazah TK / RA */}
      <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <GraduationCap className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1A1D1A]">
              Konfirmasi Kepemilikan Ijazah TK / RA / PAUD <span className="text-rose-500">*</span>
            </h4>
            <p className="text-xs text-[#626862] mt-0.5">
              Wajib dijawab — apakah calon ananda sudah lulus dan memegang ijazah TK/RA?
              Bagi calon santri yang sudah memegang ijazah TK, <strong className="text-emerald-900 font-extrabold">wajib diunggah</strong> berkas ijazah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onChange({ ...data, memilikiIjazahTk: true })}
            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              data.memilikiIjazahTk === true
                ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                : 'bg-white text-[#1A1D1A] border-[#D1D9D1] hover:bg-emerald-50/60'
            }`}
          >
            <div>
              <p className="font-bold">Ya, Sudah Memegang Ijazah TK</p>
              <p className={`text-[10px] ${data.memilikiIjazahTk === true ? 'text-emerald-100' : 'text-[#626862]'}`}>
                Wajib unggah scan/foto Ijazah TK
              </p>
            </div>
            {data.memilikiIjazahTk === true && <Check className="w-4 h-4 text-white" />}
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...data, memilikiIjazahTk: false })}
            className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
              data.memilikiIjazahTk === false
                ? 'bg-[#4B634B] text-white border-[#4B634B] shadow-xs'
                : 'bg-white text-[#1A1D1A] border-[#D1D9D1] hover:bg-emerald-50/60'
            }`}
          >
            <div>
              <p className="font-bold">Belum / Tidak Memegang Ijazah TK</p>
              <p className={`text-[10px] ${data.memilikiIjazahTk === false ? 'text-emerald-100' : 'text-[#626862]'}`}>
                Upload bersifat opsional / dapat dilewati
              </p>
            </div>
            {data.memilikiIjazahTk === false && <Check className="w-4 h-4 text-white" />}
          </button>
        </div>
        {errors.memilikiIjazahTk && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.memilikiIjazahTk}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Kartu Keluarga (KK) - Wajib */}
        {renderUploadBox('kk', 'Kartu Keluarga (KK)', true, 'Scan/foto KK asli yang memuat NIK anak.')}
        
        {/* 2. Akta Kelahiran - Wajib */}
        {renderUploadBox('akta', 'Akta Kelahiran', true, 'Scan/foto Akta Kelahiran asli anak.')}
        
        {/* 3. Kartu NISN - Opsional */}
        {renderUploadBox('nisnDoc', 'Bukti / Kartu NISN', false, 'Opsional bagi yang sudah memiliki nomor NISN dari jenjang sebelumnya.')}
        
        {/* 4. Ijazah TK / RA - Kondisional Wajib */}
        {renderUploadBox(
          'ijazahTk',
          'Ijazah TK / RA / PAUD',
          Boolean(data.memilikiIjazahTk),
          data.memilikiIjazahTk
            ? 'Wajib diunggah bagi calon santri yang sudah memegang ijazah TK.'
            : 'Opsional bagi calon santri yang belum memegang ijazah TK.'
        )}

        {/* 5. Pas Foto 3x4 (Pendukung) */}
        {renderUploadBox('foto', 'Pas Foto 3x4 Anak', false, 'Pas Foto 3x4 berwarna, background merah/biru.')}

        {/* 6. Kartu Keluarga Sejahtera (KKS) — EMIS, Opsional */}
        {renderUploadBox('kks', 'Kartu Keluarga Sejahtera (KKS)', false, 'Opsional — kosongkan bila tidak memiliki KKS.')}

        {/* 7. Kartu Program Keluarga Harapan (PKH) — EMIS, Opsional */}
        {renderUploadBox('pkh', 'Kartu Program Keluarga Harapan (PKH)', false, 'Opsional — kosongkan bila tidak memiliki PKH.')}

        {jenisPendaftaran === 'pindahan' && (
          <>
            {renderUploadBox(
              'ijazahAtauSuratPindah',
              'Surat Keterangan Pindah',
              true,
              'Surat Pindah resmi dari sekolah/madrasah asal.'
            )}
            {renderUploadBox('rapor', 'Rapor Terakhir', false, 'Scan halaman nilai rapor kelas terakhir.')}
          </>
        )}
      </div>

      <div className="pt-6 border-t border-[#E2E6E2] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary px-6 py-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI (LANGKAH 3)</span>
        </button>
        <button
          type="submit"
          className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>TINJAU KEMBALI FORMULIR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
