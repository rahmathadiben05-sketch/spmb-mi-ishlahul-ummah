'use client';

import React, { useState } from 'react';
import { X, Check, Sparkles, Building, Quote, BookOpen, Clock, Download, HelpCircle, Phone } from 'lucide-react';
import { CmsContent, SchoolSettings, FaqItem as CmsFaqItem, TimelineStep, ProgramCard } from '@/lib/types';
import { DEFAULT_CMS_CONTENT } from '@/lib/storage';

interface EditSectionModalProps {
  sectionKey: string | null;
  settings: SchoolSettings;
  onClose: () => void;
  // v2.9: kembalikan false bila simpan ke server gagal — modal tetap
  // terbuka supaya admin tahu perubahannya belum tersinkron.
  onSave: (updatedCms: CmsContent, updatedSettingsFields?: Partial<SchoolSettings>) => boolean | void | Promise<boolean | void>;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  sectionKey,
  settings,
  onClose,
  onSave,
}) => {
  const currentCms = settings.cmsContent || {};

  // Form states
  const [formData, setFormData] = useState<CmsContent>(() => ({ ...currentCms }));
  const [extraSettings, setExtraSettings] = useState<Partial<SchoolSettings>>(() => ({
    namaMadrasah: settings.namaMadrasah,
    alamatMadrasah: settings.alamatMadrasah,
    kontakWhatsapp: settings.kontakWhatsapp,
    emailMadrasah: settings.emailMadrasah,
    namaKepalaMadrasah: settings.namaKepalaMadrasah,
    nipKepalaMadrasah: settings.nipKepalaMadrasah,
    brosurDigitalUrl: settings.brosurDigitalUrl,
  }));

  const [pointsText, setPointsText] = useState<string>(() =>
    (currentCms.mengenalPoints || [
      "Pembiasaan Sholat Dhuha, Dhuhur Berjamaah & Tartil Al-Qur'an",
      'Tenaga Pendidik Berdedikasi, Telaten & Ramah Anak',
      'Gedung Madrasah Bersih, Asri, dan Aman bagi Tumbuh Kembang',
      'Sistem Administrasi SPMB Online Terpadu & Bebas Antrean',
    ]).join('\n')
  );

  if (!sectionKey) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCms: CmsContent = {
      ...formData,
      mengenalPoints: pointsText
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
    };
    // v2.9: bila onSave melaporkan gagal sync server (false), modal TIDAK
    // ditutup — peringatan server sudah tampil di dashboard di belakang.
    const saved = await onSave(finalCms, extraSettings);
    if (saved === false) return;
    onClose();
  };

  // --- Editor daftar isi (FAQ / langkah / program) — semua tersimpan di formData (CmsContent) ---
  const faqList = formData.faqItems?.length
    ? formData.faqItems
    : DEFAULT_CMS_CONTENT.faqItems || [];
  const updateFaqItem = (idx: number, patch: Partial<CmsFaqItem>) => {
    const items = [...faqList];
    items[idx] = { ...items[idx], ...patch };
    setFormData({ ...formData, faqItems: items });
  };
  const addFaqItem = () => {
    setFormData({
      ...formData,
      faqItems: [
        ...faqList,
        { id: `faq-${Date.now()}`, category: 'alur', question: '', answer: '', points: [] },
      ],
    });
  };
  const removeFaqItem = (idx: number) => {
    const items = [...faqList];
    items.splice(idx, 1);
    setFormData({ ...formData, faqItems: items });
  };
  const moveFaqItem = (idx: number, dir: -1 | 1) => {
    const items = [...faqList];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    setFormData({ ...formData, faqItems: items });
  };

  const stepList: TimelineStep[] = formData.timelineSteps?.length
    ? formData.timelineSteps
    : DEFAULT_CMS_CONTENT.timelineSteps || [];
  const updateStep = (idx: number, patch: Partial<TimelineStep>) => {
    const items = [...stepList];
    items[idx] = { ...items[idx], ...patch };
    setFormData({ ...formData, timelineSteps: items });
  };

  const programList: ProgramCard[] = formData.programCards?.length
    ? formData.programCards
    : DEFAULT_CMS_CONTENT.programCards || [];
  const updateProgram = (idx: number, patch: Partial<ProgramCard>) => {
    const items = [...programList];
    items[idx] = { ...items[idx], ...patch };
    setFormData({ ...formData, programCards: items });
  };

  const getSectionTitle = () => {
    switch (sectionKey) {
      case 'hero':
        return {
          title: 'Edit Seksi: Hero Banner & Headline Utama (H1)',
          desc: 'Teks hero diedit dari Pusat CMS → Tab Beranda (satu pintu edit) — modal ini hanya pengarah.',
          icon: Sparkles,
        };
      case 'mengenal':
        return {
          title: 'Edit Seksi: Mengenal Lebih Dekat',
          desc: 'Sesuaikan narasi komitmen keunggulan, akreditasi, rasio guru, dan fasilitas madrasah.',
          icon: Building,
        };
      case 'sambutan':
        return {
          title: 'Edit Seksi: Sambutan Kepala Madrasah',
          desc: 'Ubah teks sambutan amanah, kutipan nilai, dan nama pimpinan madrasah.',
          icon: Quote,
        };
      case 'program':
        return {
          title: 'Edit Seksi: Program & Keunggulan Mutu',
          desc: 'Ubah judul, deskripsi, dan isi ketiga kartu program (judul, subjudul, deskripsi, label, poin keunggulan).',
          icon: BookOpen,
        };
      case 'timeline':
        return {
          title: 'Edit Seksi: Alur Timeline Pendaftaran',
          desc: 'Ubah isi keempat langkah alur pendaftaran. Judul & deskripsi seksi diedit dari Pusat CMS → Tab Beranda (satu pintu edit).',
          icon: Clock,
        };
      case 'downloads':
        return {
          title: 'Edit Seksi: Pusat Unduhan & Brosur',
          desc: 'Perbarui link brosur digital SPMB. Judul & deskripsi seksi diedit dari Pusat CMS → Tab Beranda (satu pintu edit).',
          icon: Download,
        };
      case 'faq':
        return {
          title: 'Edit Seksi: Pusat Bantuan (FAQ)',
          desc: 'Ubah daftar pertanyaan-jawaban (tambah, hapus, susun ulang). Judul & deskripsi seksi diedit dari Pusat CMS → Tab Beranda (satu pintu edit).',
          icon: HelpCircle,
        };
      case 'sekretariat':
        return {
          title: 'Edit Seksi: Kontak & Sekretariat',
          desc: 'Alamat, WhatsApp & email diedit dari Profil Madrasah; Jam Pelayanan dari Pusat CMS → Tab Beranda (satu pintu edit).',
          icon: Phone,
        };
      default:
        return {
          title: 'Edit Konten Tampilan Beranda',
          desc: 'Sesuaikan teks dan konten landing page.',
          icon: Sparkles,
        };
    }
  };

  const info = getSectionTitle();
  const IconComponent = info.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 border border-slate-200">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{info.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{info.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 0: HERO BANNER & HEADLINE H1 */}
          {sectionKey === 'hero' && (
            <>
              {/* SATU PINTU EDIT (S-10/S-19, Paket C): teks hero (judul,
                  subjudul, badge, countdown, CTA) HANYA diedit dari Pusat
                  CMS → Tab Beranda — input ganda di modal ini dihapus supaya
                  tidak ada dua versi yang saling menimpa. */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Satu pintu edit:</span> teks Hero (judul H1, subjudul, badge, label countdown, tombol CTA) hanya diedit dari <span className="font-bold">Pusat CMS → Tab Beranda</span> di Dashboard Admin. Modal ini tidak lagi menyediakan input hero.
              </div>
            </>
          )}

          {/* SECTION 1: MENGENAL LEBIH DEKAT */}
          {sectionKey === 'mengenal' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Utama Seksi</label>
                <input
                  type="text"
                  value={formData.mengenalJudul || ''}
                  onChange={(e) => setFormData({ ...formData, mengenalJudul: e.target.value })}
                  placeholder="Contoh: Madrasah Ramah Anak yang Membina Akhlak & Prestasi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Narasi</label>
                <textarea
                  rows={3}
                  value={formData.mengenalDeskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, mengenalDeskripsi: e.target.value })}
                  placeholder="Deskripsi keunggulan madrasah..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akreditasi</label>
                  <input
                    type="text"
                    value={formData.mengenalAkreditasiNilai || ''}
                    onChange={(e) => setFormData({ ...formData, mengenalAkreditasiNilai: e.target.value })}
                    placeholder="Contoh: Unggul (A)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rasio Guru &amp; Siswa</label>
                  <input
                    type="text"
                    value={formData.mengenalRasioGuru || ''}
                    onChange={(e) => setFormData({ ...formData, mengenalRasioGuru: e.target.value })}
                    placeholder="Contoh: 1 : 15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Poin-Poin Keunggulan (1 baris per poin)
                </label>
                <textarea
                  rows={4}
                  value={pointsText}
                  onChange={(e) => setPointsText(e.target.value)}
                  placeholder="Masukkan poin keunggulan, satu per baris..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {/* SECTION 2: SAMBUTAN KEPALA MADRASAH */}
          {sectionKey === 'sambutan' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Seksi Sambutan</label>
                <input
                  type="text"
                  value={formData.sambutanJudul || ''}
                  onChange={(e) => setFormData({ ...formData, sambutanJudul: e.target.value })}
                  placeholder="Contoh: Sambutan Kepala Madrasah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* SATU PINTU EDIT (S-10/S-19, Paket C): Nama Kepala
                  Madrasah hanya diedit dari Profil Madrasah (Dashboard
                  Admin) — input ganda di sini dihapus. NIP Kepala tetap
                  di sini karena ini satu-satunya pintu editnya. */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold">Satu pintu edit:</span> Nama Kepala Madrasah ({extraSettings.namaKepalaMadrasah || '—'}) hanya diedit dari <span className="font-bold">Profil Madrasah</span> di Dashboard Admin.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP Kepala Madrasah</label>
                  <input
                    type="text"
                    value={extraSettings.nipKepalaMadrasah || ''}
                    onChange={(e) => setExtraSettings({ ...extraSettings, nipKepalaMadrasah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline Amanah / Quotes Singkat</label>
                <input
                  type="text"
                  value={formData.sambutanAmanah || ''}
                  onChange={(e) => setFormData({ ...formData, sambutanAmanah: e.target.value })}
                  placeholder="Contoh: Amanah & Ketulusan Mendidik"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Sambutan Lengkap</label>
                <textarea
                  rows={5}
                  value={formData.sambutanTeks || ''}
                  onChange={(e) => setFormData({ ...formData, sambutanTeks: e.target.value })}
                  placeholder="Tuliskan sambutan hangat Kepala Madrasah..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Kepala Madrasah (URL)</label>
                <input
                  type="text"
                  value={formData.sambutanFotoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, sambutanFotoUrl: e.target.value })}
                  placeholder="https://... (kosongkan untuk memakai huruf inisial)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">Tempel alamat gambar (mis. tautan berbagi dari Google Drive). Foto tampil bulat di samping sambutan; kosong = huruf awal nama.</p>
              </div>
            </>
          )}

          {/* SECTION 3: PROGRAM & KEUNGGULAN MUTU */}
          {sectionKey === 'program' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Seksi Program</label>
                <input
                  type="text"
                  value={formData.programJudul || ''}
                  onChange={(e) => setFormData({ ...formData, programJudul: e.target.value })}
                  placeholder="Contoh: Program & Keunggulan Madrasah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Umum Program</label>
                <textarea
                  rows={3}
                  value={formData.programDeskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, programDeskripsi: e.target.value })}
                  placeholder="Kurikulum terpadu yang memadukan nilai Qur'ani, pembiasaan akhlak mulia, dan sains modern..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800">Isi 3 Kartu Program</p>
                {programList.map((card, idx) => (
                  <div key={card.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <p className="font-bold text-slate-700">Kartu {idx + 1}</p>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updateProgram(idx, { title: e.target.value })}
                      placeholder="Judul kartu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <input
                      type="text"
                      value={card.subtitle}
                      onChange={(e) => updateProgram(idx, { subtitle: e.target.value })}
                      placeholder="Subjudul kartu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <textarea
                      rows={2}
                      value={card.desc}
                      onChange={(e) => updateProgram(idx, { desc: e.target.value })}
                      placeholder="Deskripsi kartu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                    <input
                      type="text"
                      value={card.tag}
                      onChange={(e) => updateProgram(idx, { tag: e.target.value })}
                      placeholder="Label (mis. Program Utama)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <textarea
                      rows={3}
                      value={(card.highlights || []).join('\n')}
                      onChange={(e) =>
                        updateProgram(idx, {
                          highlights: e.target.value.split('\n').map((h) => h.trim()).filter((h) => h.length > 0),
                        })
                      }
                      placeholder="Poin keunggulan — satu poin per baris"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-slate-500">Ikon kartu mengikuti posisi (Tahfidz, Karakter, Sains).</p>
              </div>
            </>
          )}

          {/* SECTION 4: ALUR TIMELINE */}
          {sectionKey === 'timeline' && (
            <>
              {/* SATU PINTU EDIT (S-10/S-19, Paket C): judul & deskripsi
                  seksi hanya diedit dari Pusat CMS → Tab Beranda. Modal
                  ini hanya untuk isi langkah-langkahnya. */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Satu pintu edit:</span> judul &amp; deskripsi seksi Alur hanya diedit dari <span className="font-bold">Pusat CMS → Tab Beranda</span>. Di bawah ini hanya isi keempat langkahnya.
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800">Isi 4 Langkah Alur</p>
                {stepList.map((step, idx) => (
                  <div key={step.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <p className="font-bold text-slate-700">Langkah {idx + 1}</p>
                    <input
                      type="text"
                      value={step.badge}
                      onChange={(e) => updateStep(idx, { badge: e.target.value })}
                      placeholder="Label langkah (mis. Online Mandiri (1 Menit))"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(idx, { title: e.target.value })}
                      placeholder="Judul langkah"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <textarea
                      rows={2}
                      value={step.desc}
                      onChange={(e) => updateStep(idx, { desc: e.target.value })}
                      placeholder="Deskripsi langkah"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                    <textarea
                      rows={3}
                      value={(step.details || []).join('\n')}
                      onChange={(e) =>
                        updateStep(idx, {
                          details: e.target.value.split('\n').map((d) => d.trim()).filter((d) => d.length > 0),
                        })
                      }
                      placeholder="Poin checklist — satu poin per baris"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-slate-500">Nomor (01–04) dan ikon langkah mengikuti urutan.</p>
              </div>
            </>
          )}

          {/* SECTION 5: PUSAT UNDUHAN & BROSUR */}
          {sectionKey === 'downloads' && (
            <>
              {/* SATU PINTU EDIT (S-10/S-19, Paket C): judul & deskripsi
                  seksi hanya diedit dari Pusat CMS → Tab Beranda (di sana
                  juga ada editor isi kartu unduhannya). Modal ini hanya
                  untuk link brosur digital. */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Satu pintu edit:</span> judul &amp; deskripsi seksi Unduhan hanya diedit dari <span className="font-bold">Pusat CMS → Tab Beranda</span>. Di bawah ini hanya link brosur digital.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link Brosur Digital (URL / Drive)</label>
                <input
                  type="text"
                  value={extraSettings.brosurDigitalUrl || ''}
                  onChange={(e) => setExtraSettings({ ...extraSettings, brosurDigitalUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </>
          )}

          {/* SECTION 6: FAQ */}
          {sectionKey === 'faq' && (
            <>
              {/* SATU PINTU EDIT (S-10/S-19, Paket C): judul & deskripsi
                  seksi hanya diedit dari Pusat CMS → Tab Beranda. Modal
                  ini hanya untuk daftar pertanyaan-jawabannya. */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Satu pintu edit:</span> judul &amp; deskripsi seksi FAQ hanya diedit dari <span className="font-bold">Pusat CMS → Tab Beranda</span>. Di bawah ini hanya daftar pertanyaan &amp; jawaban.
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-800">Daftar Pertanyaan &amp; Jawaban</p>
                {faqList.map((item, idx) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-700">Pertanyaan {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFaqItem(idx, -1)}
                          disabled={idx === 0}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                          title="Naik"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFaqItem(idx, 1)}
                          disabled={idx === faqList.length - 1}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                          title="Turun"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(idx)}
                          className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <select
                      value={item.category}
                      onChange={(e) => updateFaqItem(idx, { category: e.target.value as CmsFaqItem['category'] })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="alur">Alur &amp; Registrasi</option>
                      <option value="biaya">Biaya &amp; Pembayaran</option>
                      <option value="status">Lacak Status &amp; Observasi</option>
                      <option value="dokumen">Persyaratan Berkas</option>
                    </select>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaqItem(idx, { question: e.target.value })}
                      placeholder="Pertanyaan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                    <textarea
                      rows={3}
                      value={item.answer}
                      onChange={(e) => updateFaqItem(idx, { answer: e.target.value })}
                      placeholder="Jawaban"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                    <textarea
                      rows={4}
                      value={(item.points || []).join('\n')}
                      onChange={(e) =>
                        updateFaqItem(idx, {
                          points: e.target.value.split('\n').map((pt) => pt.trim()).filter((pt) => pt.length > 0),
                        })
                      }
                      placeholder="Poin jawaban — satu poin per baris (boleh kosong)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed bg-white"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer"
                >
                  + Tambah Pertanyaan
                </button>
              </div>
            </>
          )}

          {/* SECTION 7: KONTAK & SEKRETARIAT */}
          {sectionKey === 'sekretariat' && (
            <>
              {/* SATU PINTU EDIT (S-10/S-19, Paket C): alamat, WhatsApp &
                  email HANYA diedit dari Profil Madrasah (Dashboard Admin),
                  Jam Pelayanan HANYA dari Pusat CMS → Tab Beranda. Input
                  ganda di modal ini dihapus supaya tidak ada dua versi
                  yang saling menimpa. */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed space-y-1.5">
                <p>
                  <span className="font-bold">Satu pintu edit:</span> Alamat Kampus, WhatsApp Panitia &amp; Email Resmi hanya diedit dari <span className="font-bold">Profil Madrasah</span> di Dashboard Admin.
                </p>
                <p>
                  Jam Pelayanan Sekretariat hanya diedit dari <span className="font-bold">Pusat CMS → Tab Beranda</span> (sub-seksi Sekretariat, Kontak &amp; Footer).
                </p>
                <p className="text-emerald-800">Nilai saat ini: {extraSettings.alamatMadrasah || '—'} • WA {extraSettings.kontakWhatsapp || '—'} • {extraSettings.emailMadrasah || '—'} • Jam {formData.jamPelayanan || '—'}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan Konten</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
