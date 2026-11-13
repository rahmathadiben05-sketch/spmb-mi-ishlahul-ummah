'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AddressData,
  DocumentsData,
  ParentData,
  RegistrationRecord,
  RegistrationType,
  SchoolSettings,
  StudentData,
  Token,
  UserRole,
  WaliMuridSession,
  Wave,
} from '@/lib/types';
import {
  getSchoolSettings,
  getDraft,
  saveDraft,
  clearDraft,
  createRegistration,
  syncRegistrationToWebhook,
  syncRegistrationUpdateToWebhook,
  resyncRecord,
  createIndenToWebhook,
  enqueueFailedSync,
  removeFromSyncQueue,
  retryQueuedSyncs,
  isInSyncQueue,
  getDocumentsTotalBytes,
  MAX_TOTAL_DOCUMENT_BYTES,
  getCurrentRole,
  setCurrentRole,
  getWaves,
  loadSettingsWithServerFallback,
  DEFAULT_WAVES,
  DEFAULT_SETTINGS,
  MAX_BIRTH_DATE,
} from '@/lib/storage';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { RegistrationTimeline } from '@/components/landing/RegistrationTimeline';
import { LandingDownloads } from '@/components/landing/LandingDownloads';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingBiaya } from '@/components/landing/LandingBiaya';
import { LandingGallery } from '@/components/landing/LandingGallery';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { ApplicantAccessCard } from '@/components/auth/ApplicantAccessCard';
import { WaliMuridDashboard } from '@/components/auth/WaliMuridDashboard';
import { InformasiPendaftaranView } from '@/components/informasi/InformasiPendaftaranView';
import { InformasiPendaftaranModal } from '@/components/informasi/InformasiPendaftaranModal';
import { StatusTrackerModal } from '@/components/interactive/StatusTrackerModal';
import { Phone, Mail, Clock, MapPin, ExternalLink, MessageCircle, ArrowRight, School, Search, FileText } from 'lucide-react';
import { WizardProgressBar } from '@/components/wizard/WizardProgressBar';
import { WizardStep1 } from '@/components/wizard/WizardStep1';
import { WizardStep2 } from '@/components/wizard/WizardStep2';
import { WizardStep3 } from '@/components/wizard/WizardStep3';
import { WizardStep4 } from '@/components/wizard/WizardStep4';
import { WizardReview } from '@/components/wizard/WizardReview';
import { SuccessPage } from '@/components/success/SuccessPage';
import { PrintableBukti } from '@/components/print/PrintableBukti';
import { PrintableFormulirResmi } from '@/components/print/PrintableFormulirResmi';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { getWaliMuridSession, setWaliMuridSession, clearWaliMuridSession, getRegistrations, updateRegistration, fetchServerRegistration, cacheServerRegistration, normalizeWaveName } from '@/lib/storage';

type ViewMode = 'landing' | 'applicant_access' | 'applicant_dashboard' | 'informasi_pendaftaran' | 'wizard' | 'success' | 'submit_failed' | 'admin';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  // Pita logo: animasi masuk (stagger) saat pita terlihat — sekali saja.
  // (Dipindah ke bawah, setelah deklarasi settingsReady — lihat di sana.)
  const logoBandRef = useRef<HTMLDivElement>(null);
  const [logoBandInView, setLogoBandInView] = useState(false);
  const [currentRole, setRoleState] = useState<UserRole>('public');
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  // Titik peta: link Google Maps / koordinat dari Profil Madrasah; kosong = cari teks alamat
  const mapsUrl = settings.googleMapsUrl?.trim()
    ? (settings.googleMapsUrl.trim().startsWith('http')
        ? settings.googleMapsUrl.trim()
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.googleMapsUrl.trim())}`)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.alamatMadrasah)}`;
  // Query embed peta: bila yang tersimpan adalah LINK Google Maps utuh, link
  // itu tidak bisa dipakai mentah sebagai kata kunci (peta tampil zoom
  // benua + peringatan kuning). Ambil nama tempat dari /place/... bila ada,
  // koordinat dari @lat,lng bila ada, selain itu pakai teks alamat.
  // Tombol navigasi tetap memakai link utuh (mapsUrl).
  const mapsEmbedQuery = (() => {
    const raw = settings.googleMapsUrl?.trim() || '';
    if (/^https?:\/\//i.test(raw)) {
      const placeMatch = raw.match(/\/place\/([^/?#]+)/);
      if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      const coordMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;
      return settings.alamatMadrasah;
    }
    return raw || settings.alamatMadrasah;
  })();
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    mapsEmbedQuery
  )}&output=embed`;
  const [wavesList, setWavesList] = useState<Wave[]>([]);

  // Authenticated Wali Murid Session State
  const [waliMuridSession, setWaliMuridSessionState] = useState<WaliMuridSession | null>(null);
  const [userRecord, setUserRecord] = useState<RegistrationRecord | null>(null);
  // true = data wali yang tampil berasal dari perangkat ini karena server
  // tidak terjangkau saat login/muat — tampilkan peringatan jujur di dashboard.
  const [waliDataStale, setWaliDataStale] = useState(false);
  const [isInformasiModalOpen, setIsInformasiModalOpen] = useState(false);

  // Interactive Modals
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  // Pelacak diminta sebelum login: buka otomatis setelah login wali berhasil.
  const [pendingOpenTracker, setPendingOpenTracker] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Active registration session state
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeTempPin, setActiveTempPin] = useState<string>('');
  const [activeTempRegNo, setActiveTempRegNo] = useState<string>('');
  const [jenisPendaftaran, setJenisPendaftaran] = useState<RegistrationType>('baru');
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Mode pendaftaran + data inden (bila wali memilih Inden Kursi Gelombang 1).
  const [activeModePendaftaran, setActiveModePendaftaran] = useState<'penuh' | 'inden'>('penuh');
  const [activeInden, setActiveInden] = useState<RegistrationRecord['inden']>(undefined);
  // Mode edit (v2.13): true bila wizard dibuka dari dashboard wali lewat
  // "Lihat / Edit Formulir" untuk record yang SUDAH tersubmit. Submit edit
  // HARUS memakai updateRegistration (baris sudah ada di Sheets), bukan
  // createRegistration baru — kalau tidak, server menolak sebagai duplikat
  // NIK (temuan E2E 13 Nov 12:29).
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);
  // No WA Pendaftaran (v2.12): nomor WA dari kartu akses — disimpan
  // terpisah karena Langkah 2 boleh mengubah nomor ayah/ibu/wali.
  const [activeAccessWa, setActiveAccessWa] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  // Gate anti-flicker hero (v2.12): halaman tidak dirender sebelum
  // pengaturan lokal diterapkan, supaya tidak sempat berkedip dengan
  // konten default saat (re)load.
  const [settingsReady, setSettingsReady] = useState(false);
  // Observer pita logo: HARUS depend on settingsReady. Gate anti-flicker
  // (v2.12) membuat komponen early-return layar muat sebelum pengaturan
  // diterapkan — saat efek [] pertama jalan, pita belum ada di DOM
  // (logoBandRef.current null) sehingga observer tidak pernah terpasang dan
  // 5 logo selamanya opacity 0 (regresi terkonfirmasi 13 Nov 12:03).
  // Dengan deps [settingsReady], observer dipasang begitu konten asli
  // dirender; bila pita sudah terlihat saat itu, IntersectionObserver
  // langsung melaporkan intersecting.
  useEffect(() => {
    if (!settingsReady) return;
    const el = logoBandRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLogoBandInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [settingsReady]);
  // Menandai restore awal selesai — simpan viewMode ke sessionStorage hanya
  // setelah restore, supaya nilai 'landing' awal tidak menimpa simpanan.
  const [viewRestored, setViewRestored] = useState(false);

  // Form State
  const [studentData, setStudentData] = useState<StudentData>({
    namaLengkap: '',
    namaPanggilan: '',
    nik: '',
    noKk: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    anakKe: 0,
    jumlahSaudara: 0,
    asalSekolah: '',
    kebutuhanKhusus: '',
  });

  const [parentData, setParentData] = useState<ParentData>({
    ayah: {
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: '',
      pendidikan: '',
      pekerjaan: '',
      penghasilan: '',
      noHp: '',
    },
    ibu: {
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: '',
      pendidikan: '',
      pekerjaan: '',
      penghasilan: '',
      noHp: '',
    },
  });

  const [addressData, setAddressData] = useState<AddressData>({
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    kelurahan: '',
    alamatLengkap: '',
    kodePos: '',
  });

  const [documentsData, setDocumentsData] = useState<DocumentsData>({});

  // Created Registration Record after success
  const [createdRecord, setCreatedRecord] = useState<RegistrationRecord | null>(null);

  // Print Overlays
  const [printBuktiRecord, setPrintBuktiRecord] = useState<RegistrationRecord | null>(null);
  const [printOfficialRecord, setPrintOfficialRecord] = useState<RegistrationRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Layar gagal kirim (K7): penolakan server tidak boleh sampai ke halaman sukses.
  const [submitFailure, setSubmitFailure] = useState<{
    message: string;
    kind: 'server' | 'network';
    record: RegistrationRecord;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [dashboardRetryNotice, setDashboardRetryNotice] = useState<string | null>(null);

  // Perkirakan langkah wizard terakhir dari kelengkapan data draft/record:
  // Step 1 data santri -> Step 2 orang tua -> Step 3 alamat -> Step 4 berkas
  // -> Step 5 review. Dipakai saat login dengan draft dan saat restore refresh.
  const inferResumeStep = (rec: Partial<RegistrationRecord>): number => {
    const docs = rec.documents || {};
    if (docs.kk || docs.akta || docs.foto || docs.ijazahTk || docs.rapor) return 5;
    if (
      rec.address?.provinsi ||
      rec.address?.kabupaten ||
      rec.address?.kecamatan ||
      rec.address?.alamatLengkap
    )
      return 4;
    if (
      rec.parent?.ayah?.tempatLahir ||
      rec.parent?.ayah?.pendidikan ||
      rec.parent?.ayah?.pekerjaan ||
      rec.parent?.ibu?.namaLengkap
    )
      return 3;
    if (rec.student?.nik) return 2;
    return 1;
  };

  // Initialize
  useEffect(() => {
    Promise.resolve().then(() => {
      setRoleState(getCurrentRole());
      setSettings(getSchoolSettings());
      setWavesList(getWaves());

      // Sinkronisasi pengaturan dari server (v2.7): bila server punya
      // pengaturan, pakai itu (ditulis ke localStorage sebagai cache) lalu
      // segarkan state — tanpa memblokir halaman bila server gagal/kosong.
      loadSettingsWithServerFallback()
        .then((payload) => {
          if (payload) {
            setSettings(getSchoolSettings());
            setWavesList(getWaves());
          }
        })
        .catch(() => {});

      // (v2.12) Draft TIDAK lagi dipulihkan otomatis saat halaman dimuat:
      // di perangkat bersama, draft pendaftar sebelumnya (termasuk NIK)
      // akan terlihat oleh pendaftar berikutnya. Resume draft hanya lewat
      // login WA + PIN (handleResumeRegistration) — data draft mengalir
      // lewat record hasil login, bukan dari localStorage mentah.
      // PENGECUALIAN: bila ada sesi wali AKTIF (sessionStorage, tab ini),
      // draft boleh dipakai untuk melanjutkan wizard — sesi itu sendiri
      // yang menjadi bukti identitas, jadi ini bukan pemulihan anonim.
      setSettingsReady(true);
      const draft = getDraft();

      // Pulihkan tampilan terakhir (disimpan di sessionStorage saat viewMode berubah).
      let savedView: string | null = null;
      try {
        savedView = sessionStorage.getItem('spmb_last_view');
      } catch {}

      // Check active authenticated wali murid session
      const session = getWaliMuridSession();
      if (session) {
        setWaliMuridSessionState(session);
        const regs = getRegistrations();
        const found = regs.find((r) => r.nomorPendaftaran === session.nomorPendaftaran);
        if (found) {
          // Sesi wali valid (pendaftaran sudah tersubmit) -> dashboard wali murid.
          setUserRecord(found);
          setViewMode('applicant_dashboard');
          // Segarkan record wali dari server (v2.8, getRegistration) supaya
          // wali yang kembali dari device lain melihat data terbaru dari
          // Sheets. Daftar lokal tetap tampil selama fetch berjalan; bila
          // server gagal, tandai data mungkin belum terbaru (jangan diam-diam).
          void (async () => {
            const res = await fetchServerRegistration({
              nomorPendaftaran: session.nomorPendaftaran,
              pin: session.pin,
            });
            if (res.ok) {
              setUserRecord(cacheServerRegistration(res.data));
              setWaliDataStale(false);
            } else {
              setWaliDataStale(true);
            }
          })();
        } else if (
          draft &&
          draft.data &&
          (draft.data.nomorPendaftaran === session.nomorPendaftaran ||
            draft.data.pin === session.pin)
        ) {
          // Ada draft + sesi sementara (akun baru, belum submit) -> wizard
          // pada langkah terakhir yang tersimpan di draft. Pemulihan ini
          // TERIKAT SESI (bukti identitas sudah ada), bukan anonim.
          if (draft.data.student) setStudentData(draft.data.student as StudentData);
          if (draft.data.parent) setParentData(draft.data.parent as ParentData);
          if (draft.data.address) setAddressData(draft.data.address as AddressData);
          if (draft.data.documents) setDocumentsData(draft.data.documents as DocumentsData);
          if (draft.data.pin) setActiveTempPin(draft.data.pin);
          if (draft.data.nomorPendaftaran) setActiveTempRegNo(draft.data.nomorPendaftaran);
          if (draft.data.noWaPendaftaran) setActiveAccessWa(draft.data.noWaPendaftaran);
          if (draft.data.modePendaftaran) setActiveModePendaftaran(draft.data.modePendaftaran);
          if (draft.data.inden) setActiveInden(draft.data.inden);
          setLastSavedAt(draft.savedAt);
          setCurrentStep(inferResumeStep(draft.data));
          setViewMode('wizard');
        } else if (savedView === 'applicant_dashboard') {
          setViewMode('applicant_dashboard');
        }
      } else if (savedView === 'applicant_access') {
        setViewMode('applicant_access');
      }

      // Kirim ulang otomatis antrean sync yang gagal sebelumnya (M-F2).
      retryQueuedSyncs().then((r) => {
        if (r.succeeded > 0) {
          const regs = getRegistrations();
          const activeSession = getWaliMuridSession();
          if (activeSession) {
            const found = regs.find((x) => x.nomorPendaftaran === activeSession.nomorPendaftaran);
            if (found) setUserRecord(found);
          }
        }
      }).catch(() => {});

      setViewRestored(true);
    });
  }, []);

  // Simpan viewMode terakhir ke sessionStorage setiap kali berubah
  // (dipakai restore di atas saat refresh).
  useEffect(() => {
    if (!viewRestored) return;
    try {
      sessionStorage.setItem('spmb_last_view', viewMode);
    } catch {}
  }, [viewMode, viewRestored]);

  // Handle Role Change
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setRoleState(role);
    if (role !== 'public' && viewMode !== 'admin') {
      setViewMode('admin');
    } else if (role === 'public' && viewMode === 'admin') {
      handleNavigateLanding();
    }
  };

  const handleNavigateLanding = () => {
    setSettings(getSchoolSettings());
    setWavesList(getWaves());
    setViewMode('landing');
  };

  const resetRegistrationForm = () => {
    setActiveToken(null);
    setActiveTempPin('');
    setActiveTempRegNo('');
    setActiveAccessWa('');
    setActiveModePendaftaran('penuh');
    setActiveInden(undefined);
    setIsEditingSubmitted(false);
    setCurrentStep(1);
    setLastSavedAt(null);
    clearDraft();
    setStudentData({
      namaLengkap: '',
      namaPanggilan: '',
      nik: '',
      noKk: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: '',
      anakKe: 0,
      jumlahSaudara: 0,
      asalSekolah: '',
      kebutuhanKhusus: '',
    });
    setParentData({
      ayah: {
        namaLengkap: '',
        tempatLahir: '',
        tanggalLahir: '',
        pendidikan: '',
        pekerjaan: '',
        penghasilan: '',
        noHp: '',
      },
      ibu: {
        namaLengkap: '',
        tempatLahir: '',
        tanggalLahir: '',
        pendidikan: '',
        pekerjaan: '',
        penghasilan: '',
        noHp: '',
      },
    });
    setAddressData({
      provinsi: '',
      kabupaten: '',
      kecamatan: '',
      kelurahan: '',
      alamatLengkap: '',
      kodePos: '',
    });
    setDocumentsData({});
  };

  // Auto Save Draft
  const triggerAutoSave = () => {
    const draft = {
      nomorPendaftaran: activeTempRegNo,
      pin: activeTempPin,
      noWaPendaftaran: activeAccessWa,
      modePendaftaran: activeModePendaftaran,
      inden: activeInden,
      student: studentData,
      parent: parentData,
      address: addressData,
      documents: documentsData,
    };
    saveDraft(draft);
    setLastSavedAt(new Date().toISOString());
  };

  // Step change with auto-save
  const handleNextStep = () => {
    triggerAutoSave();
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    triggerAutoSave();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Start new registration directly
  const handleStartNewRegistration = (data: {
    regType: RegistrationType;
    parentName: string;
    waNumber: string;
    email: string;
    studentName: string;
    tempRegNo: string;
    tempPin: string;
    modePendaftaran?: 'penuh' | 'inden';
    inden?: RegistrationRecord['inden'];
  }) => {
    // Daftar baru, bukan login: batalkan permintaan buka pelacak yang tertunda.
    setPendingOpenTracker(false);
    // Daftar baru — BUKAN edit record tersubmit.
    setIsEditingSubmitted(false);
    setJenisPendaftaran(data.regType);
    setActiveTempRegNo(data.tempRegNo);
    setActiveTempPin(data.tempPin);
    setActiveAccessWa(data.waNumber || '');
    setActiveModePendaftaran(data.modePendaftaran || 'penuh');
    setActiveInden(data.inden);
    setCurrentStep(1);

    setStudentData((prev) => ({
      ...prev,
      namaLengkap: data.studentName,
      namaPanggilan: data.studentName.split(' ')[0] || data.studentName,
    }));

    setParentData((prev) => ({
      ...prev,
      email: data.email,
    }));

    // Synthesize active token object for compatibility
    setActiveToken({
      id: `tok-${Date.now()}`,
      code: data.tempPin,
      status: 'belum_digunakan',
      createdAt: new Date().toISOString(),
      academicYear: settings.activeAcademicYear,
      wave: settings.activeWave,
      buyerName: data.parentName,
      buyerPhone: data.waNumber,
    });

    const session = getWaliMuridSession();
    if (session) {
      setWaliMuridSessionState(session);
    }

    setViewMode('wizard');
  };

  // Buka Pelacak Status: hanya bila ada sesi wali yang valid. Bila belum login,
  // arahkan ke kartu akses wali; pelacak dibuka otomatis setelah login berhasil.
  const handleOpenStatusTracker = () => {
    const session = getWaliMuridSession();
    if (session) {
      setIsTrackerOpen(true);
    } else {
      setPendingOpenTracker(true);
      setViewMode('applicant_access');
    }
  };

  // Resume existing registration from PIN / login -> arahkan ke Dashboard Wali Murid
  const handleResumeRegistration = (record: RegistrationRecord, opts?: { serverUnreachable?: boolean }) => {
    setJenisPendaftaran(record.jenisPendaftaran);
    setActiveTempRegNo(record.nomorPendaftaran);
    setActiveTempPin(record.pin || '');
    setActiveAccessWa(record.noWaPendaftaran || '');
    setActiveModePendaftaran(record.modePendaftaran || 'penuh');
    setActiveInden(record.inden);
    setStudentData(record.student);
    setParentData(record.parent);
    setAddressData(record.address);
    setDocumentsData(record.documents || {});
    setUserRecord(record);
    // Login berhasil dari data perangkat (server tidak terjangkau): beri tahu
    // wali di dashboard bahwa data mungkin belum terbaru.
    setWaliDataStale(!!opts?.serverUnreachable);

    const session = getWaliMuridSession();
    if (session) {
      setWaliMuridSessionState(session);
    }

    setActiveToken({
      id: `tok-${Date.now()}`,
      code: record.tokenCode || record.pin || 'REG',
      status: 'belum_digunakan',
      createdAt: record.createdAt,
      academicYear: record.academicYear,
      wave: normalizeWaveName(record.wave),
      buyerName: record.parent.ayah.namaLengkap,
      buyerPhone: record.parent.ayah.noHp,
    });

    setCurrentStep(1);
    if (record.status === 'draft') {
      // Login dengan draft yang belum submit -> langsung ke wizard pada
      // langkah terakhir yang tersimpan di draft (bukan dashboard).
      setCurrentStep(inferResumeStep(record));
      setViewMode('wizard');
      // (v2.12) Pelacak TIDAK dibuka otomatis setelah login: dashboard
      // sudah menampilkan progres + pengumuman yang sama, dan modal yang
      // menutupi dashboard sampai ditutup dinilai mengganggu. Pelacak
      // tetap satu ketukan lewat tombol "Lacak Status".
      setPendingOpenTracker(false);
      return;
    }
    // Masuk ke Dashboard Wali Murid Resmi
    setViewMode('applicant_dashboard');
    // (v2.12) Lihat catatan di atas — pelacak tidak dibuka otomatis.
    setPendingOpenTracker(false);
  };

  // Logout Wali Murid (Pembersihan Sesi Resmi)
  const handleLogoutWaliMurid = () => {
    clearWaliMuridSession();
    setWaliMuridSessionState(null);
    setUserRecord(null);
    setWaliDataStale(false);
    resetRegistrationForm();
    setViewMode('landing');
  };

  // Submit Registration: simpan lokal dulu (supaya data tidak hilang),
  // lalu kirim ke Google Sheets. Nomor resmi diambil dari server.
  // KEJUJURAN SYNC (K7/K8/K9): halaman sukses HANYA bila server mengonfirmasi
  // (success === true + nomor dari server). Penolakan server (duplikat/usia/
  // validasi) -> layar gagal, JANGAN ke halaman sukses. Gagal jaringan ->
  // halaman sukses dengan peringatan jelas + nomor berlabel SEMENTARA.
  const handleSubmitRegistration = async () => {
    // Pengaman akhir (Langkah 1 sudah memvalidasi): tolak bila usia < 6 tahun per 1 Juli 2027.
    if (!studentData.tanggalLahir || studentData.tanggalLahir > MAX_BIRTH_DATE) {
      setSubmitError('Calon santri belum berusia 6 tahun per 1 Juli 2027 (tanggal lahir paling lambat 1 Juli 2021). Periksa kembali tanggal lahir di Langkah 1.');
      setCurrentStep(1);
      return;
    }
    // Batas gabungan ukuran dokumen 8 MB — diperiksa sebelum menyimpan apa pun.
    const docBytes = getDocumentsTotalBytes(documentsData);
    if (docBytes > MAX_TOTAL_DOCUMENT_BYTES) {
      setSubmitError(
        `Total ukuran dokumen ${(docBytes / 1024 / 1024).toFixed(1)} MB melebihi batas 8 MB. Perkecil ukuran file (foto/scan) lalu coba kirim lagi.`
      );
      return;
    }
    setSubmitError(null);
    setSubmitFailure(null);
    setIsSubmitting(true);
    setSyncWarning(null);

    // ---- ALUR INDEN: baris sudah ada di Sheets (dibuat createInden saat
    // buat akun) → submit memakai updateRegistration, BUKAN saveRegistration
    // baru. Record HARUS membawa record.inden (status tetap 'Inden' sampai
    // admin menandai lunas). ----
    if (activeModePendaftaran === 'inden' && activeInden) {
      const draft = getDraft();
      // (v2.12) Draft hanya dipakai bila nomornya cocok dengan sesi ini —
      // draft usang dari pendaftar sebelumnya di perangkat bersama tidak
      // boleh mengarahkan submit ke record orang lain.
      const draftBelongsToSession =
        !!draft?.data?.nomorPendaftaran && draft.data.nomorPendaftaran === activeTempRegNo;
      const localRecord =
        getRegistrations().find((r) => r.nomorPendaftaran === activeTempRegNo) ||
        (draftBelongsToSession && draft?.data?.id
          ? getRegistrations().find((r) => r.id === (draft.data.id as string))
          : undefined);
      if (!localRecord) {
        setIsSubmitting(false);
        setSubmitError(
          'Data inden tidak ditemukan di perangkat ini. Silakan masuk kembali dengan No. WA + PIN Anda, lalu kirim ulang formulir.'
        );
        return;
      }
      // Nomor masih sementara (createInden belum pernah sukses): coba
      // createInden dulu; bila tetap gagal → layar submit_failed.
      if (isInSyncQueue(localRecord.id) && localRecord.status === 'draft') {
        const created = await createIndenToWebhook(
          {
            academicYear: localRecord.academicYear,
            wave: localRecord.wave,
            pin: activeTempPin,
            studentNama: studentData.namaLengkap,
            parentNama: parentData.ayah.namaLengkap || parentData.ibu.namaLengkap,
            parentNoHp: parentData.ayah.noHp || parentData.ibu.noHp || '',
            jumlahDp: activeInden.jumlahDp,
            diskonDiberikan: activeInden.diskonDiberikan,
            sisaBayar: activeInden.sisaBayar,
            batasPelunasan: activeInden.batasPelunasan,
          },
          settings
        );
        if (!created.ok || !created.data?.nomorPendaftaran) {
          setIsSubmitting(false);
          setSubmitFailure({
            message: created.error || 'Inden belum terkirim ke panitia. Coba kirim ulang.',
            kind: created.kind || 'server',
            record: localRecord,
          });
          setViewMode('submit_failed');
          return;
        }
        removeFromSyncQueue(localRecord.id);
        const renumbered = updateRegistration(localRecord.id, (prev) => ({
          ...prev,
          nomorPendaftaran: created.data?.nomorPendaftaran as string,
        }));
        if (renumbered) {
          setActiveTempRegNo(created.data.nomorPendaftaran);
          const session = getWaliMuridSession();
          if (session) {
            setWaliMuridSession({ ...session, nomorPendaftaran: created.data.nomorPendaftaran });
          }
        }
      }

      const fullRecord: RegistrationRecord = {
        ...localRecord,
        nomorPendaftaran: activeTempRegNo,
        tokenCode: activeTempPin || localRecord.tokenCode,
        pin: activeTempPin,
        noWaPendaftaran: activeAccessWa || localRecord.noWaPendaftaran,
        status: 'pending',
        academicYear: settings.activeAcademicYear,
        wave: localRecord.wave || settings.activeWave,
        student: studentData,
        parent: parentData,
        address: addressData,
        documents: documentsData,
        hasilPengumuman: 'PENDING',
        modePendaftaran: 'inden',
        inden: activeInden, // status tetap 'Inden' — jadi 'Terdaftar' hanya lewat completeInden admin
      };
      let updatedLocal: RegistrationRecord | null = null;
      try {
        updatedLocal = updateRegistration(localRecord.id, () => fullRecord, 'Wali Murid', 'public');
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmitError(
          err?.message || 'Gagal menyimpan formulir di perangkat ini. Coba kirim lagi.'
        );
        return;
      }
      if (!updatedLocal) {
        setIsSubmitting(false);
        setSubmitError('Data inden tidak ditemukan di perangkat ini. Coba kirim lagi.');
        return;
      }
      const sync = await syncRegistrationUpdateToWebhook(updatedLocal, settings);
      let finalRecord = updatedLocal;
      if (sync.success) {
        if (sync.nomorPendaftaran && sync.nomorPendaftaran !== updatedLocal.nomorPendaftaran) {
          const renumbered = updateRegistration(updatedLocal.id, (prev) => ({
            ...prev,
            nomorPendaftaran: sync.nomorPendaftaran as string,
          }));
          if (renumbered) finalRecord = renumbered;
        }
        setIsSubmitting(false);
        setCreatedRecord(finalRecord);
        setUserRecord(finalRecord);
        resetRegistrationForm();
        setViewMode('success');
        return;
      }
      enqueueFailedSync(finalRecord);
      setIsSubmitting(false);
      setCreatedRecord(finalRecord);
      setUserRecord(finalRecord);
      if (sync.kind === 'server') {
        setSubmitFailure({ message: sync.message, kind: 'server', record: finalRecord });
        setViewMode('submit_failed');
      } else {
        setSyncWarning(
          'Data tersimpan di perangkat ini, tetapi GAGAL terkirim ke Google Sheets karena jaringan: ' +
            sync.message +
            ' Nomor di bawah ini masih SEMENTARA — belum terkonfirmasi panitia. Tekan "Kirim Ulang ke Panitia" untuk mencoba lagi.'
        );
        resetRegistrationForm();
        setViewMode('success');
      }
      return;
    }

    // ---- ALUR EDIT (v2.13): wali mengubah formulir yang SUDAH tersubmit
    // (wizard dibuka dari dashboard lewat "Lihat / Edit Formulir").
    // Baris sudah ada di Sheets → submit memakai updateRegistration,
    // BUKAN createRegistration baru. Tanpa cabang ini, submit edit selalu
    // membuat nomor sementara baru lalu ditolak server sebagai duplikat
    // NIK (temuan E2E 13 Nov 12:29). Status & hasil pengumuman
    // DIPERTAHANKAN — edit data tidak mereset status verifikasi.
    if (isEditingSubmitted && userRecord && userRecord.status !== 'draft') {
      const localRecord =
        getRegistrations().find((r) => r.id === userRecord.id) ||
        getRegistrations().find((r) => r.nomorPendaftaran === userRecord.nomorPendaftaran);
      if (!localRecord) {
        setIsSubmitting(false);
        setSubmitError(
          'Data pendaftaran tidak ditemukan di perangkat ini. Silakan masuk kembali dengan No. WA + PIN Anda, lalu coba edit lagi.'
        );
        return;
      }
      const fullRecord: RegistrationRecord = {
        ...localRecord,
        nomorPendaftaran: userRecord.nomorPendaftaran,
        tokenCode: activeTempPin || localRecord.tokenCode,
        pin: activeTempPin || localRecord.pin,
        noWaPendaftaran: activeAccessWa || localRecord.noWaPendaftaran,
        status: localRecord.status,
        academicYear: localRecord.academicYear || settings.activeAcademicYear,
        wave: localRecord.wave || settings.activeWave,
        student: studentData,
        parent: parentData,
        address: addressData,
        documents: documentsData,
        hasilPengumuman: localRecord.hasilPengumuman ?? 'PENDING',
        modePendaftaran: localRecord.modePendaftaran || 'penuh',
        ...(localRecord.inden ? { inden: localRecord.inden } : {}),
      };
      let updatedLocal: RegistrationRecord | null = null;
      try {
        updatedLocal = updateRegistration(localRecord.id, () => fullRecord, 'Wali Murid', 'public');
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmitError(
          err?.message || 'Gagal menyimpan perubahan di perangkat ini. Coba kirim lagi.'
        );
        return;
      }
      if (!updatedLocal) {
        setIsSubmitting(false);
        setSubmitError('Data pendaftaran tidak ditemukan di perangkat ini. Coba kirim lagi.');
        return;
      }
      const sync = await syncRegistrationUpdateToWebhook(updatedLocal, settings);
      if (sync.success) {
        setIsSubmitting(false);
        setCreatedRecord(updatedLocal);
        setUserRecord(updatedLocal);
        resetRegistrationForm();
        setViewMode('success');
        return;
      }
      enqueueFailedSync(updatedLocal);
      setIsSubmitting(false);
      setCreatedRecord(updatedLocal);
      setUserRecord(updatedLocal);
      if (sync.kind === 'server') {
        setSubmitFailure({ message: sync.message, kind: 'server', record: updatedLocal });
        setViewMode('submit_failed');
      } else {
        setSyncWarning(
          'Perubahan tersimpan di perangkat ini, tetapi GAGAL terkirim ke Google Sheets karena jaringan: ' +
            sync.message +
            ' Tekan "Kirim Ulang ke Panitia" untuk mencoba lagi.'
        );
        resetRegistrationForm();
        setViewMode('success');
      }
      return;
    }

    let newRecord: RegistrationRecord;
    try {
      newRecord = createRegistration({
        tokenCode: activeTempPin || 'ONLINE',
        pin: activeTempPin,
        noWaPendaftaran: activeAccessWa || undefined,
        jenisPendaftaran,
        status: 'pending',
        academicYear: settings.activeAcademicYear,
        wave: settings.activeWave,
        student: studentData,
        parent: parentData,
        address: addressData,
        documents: documentsData,
        hasilPengumuman: 'PENDING',
      });
    } catch (err: any) {
      // Kuota localStorage penuh / ukuran dokumen berlebih: gagal dengan
      // pesan jelas, tetap di wizard (langkah review).
      setIsSubmitting(false);
      setSubmitError(
        err?.message ||
          'Gagal menyimpan pendaftaran di perangkat ini. Perkecil ukuran dokumen atau hapus data pendaftaran lama, lalu coba kirim lagi.'
      );
      return;
    }

    const sync = await syncRegistrationToWebhook(newRecord, settings);
    if (sync.success && sync.nomorPendaftaran) {
      let finalRecord = newRecord;
      if (sync.nomorPendaftaran !== newRecord.nomorPendaftaran) {
        // Server memberi nomor resmi — pakai nomor itu di semua tempat.
        const updated = updateRegistration(newRecord.id, (prev) => ({
          ...prev,
          nomorPendaftaran: sync.nomorPendaftaran as string,
        }));
        if (updated) {
          finalRecord = updated;
          const session = getWaliMuridSession();
          if (session) {
            setWaliMuridSession({ ...session, nomorPendaftaran: sync.nomorPendaftaran });
          }
        }
      }
      setIsSubmitting(false);
      setCreatedRecord(finalRecord);
      setUserRecord(finalRecord);
      const session = getWaliMuridSession();
      if (session) {
        setWaliMuridSessionState(session);
      }
      resetRegistrationForm();
      setViewMode('success');
      return;
    }

    // Sync GAGAL: simpan ke antrean kirim ulang (dicoba otomatis saat aplikasi dibuka).
    enqueueFailedSync(newRecord);
    setIsSubmitting(false);
    setCreatedRecord(newRecord);
    setUserRecord(newRecord);
    if (sync.kind === 'server') {
      // Penolakan server (duplikat/usia/validasi/respons tidak valid):
      // JANGAN ke halaman sukses — tampilkan layar gagal.
      setSubmitFailure({ message: sync.message, kind: 'server', record: newRecord });
      setViewMode('submit_failed');
    } else {
      // Gagal jaringan: halaman sukses dengan peringatan jelas; nomor yang
      // tampil di sana berlabel "Nomor Sementara — belum terkonfirmasi panitia".
      setSyncWarning(
        'Data tersimpan di perangkat ini, tetapi GAGAL terkirim ke Google Sheets karena jaringan: ' +
          sync.message +
          ' Nomor di bawah ini masih SEMENTARA — belum terkonfirmasi panitia. Tekan "Kirim Ulang ke Panitia" untuk mencoba lagi.'
      );
      const session = getWaliMuridSession();
      if (session) {
        setWaliMuridSessionState(session);
      }
      resetRegistrationForm();
      setViewMode('success');
    }
  };

  // Kirim ulang dari layar gagal (penolakan server / jaringan).
  const handleRetrySubmit = async () => {
    if (!submitFailure) return;
    setIsRetrying(true);
    const sync = await resyncRecord(submitFailure.record, settings);
    setIsRetrying(false);
    if (sync.success && sync.nomorPendaftaran) {
      removeFromSyncQueue(submitFailure.record.id);
      let finalRecord = submitFailure.record;
      if (sync.nomorPendaftaran !== submitFailure.record.nomorPendaftaran) {
        const updated = updateRegistration(submitFailure.record.id, (prev) => ({
          ...prev,
          nomorPendaftaran: sync.nomorPendaftaran as string,
        }));
        if (updated) {
          finalRecord = updated;
          const session = getWaliMuridSession();
          if (session) {
            setWaliMuridSession({ ...session, nomorPendaftaran: sync.nomorPendaftaran });
          }
        }
      }
      setSubmitFailure(null);
      setCreatedRecord(finalRecord);
      setUserRecord(finalRecord);
      resetRegistrationForm();
      setViewMode('success');
    } else {
      setSubmitFailure({ message: sync.message, kind: sync.kind || 'server', record: submitFailure.record });
    }
  };

  // Kirim ulang dari halaman sukses (kasus gagal jaringan).
  const handleRetryFromSuccess = async () => {
    if (!createdRecord) return;
    setIsRetrying(true);
    const sync = await resyncRecord(createdRecord, settings);
    setIsRetrying(false);
    if (sync.success && sync.nomorPendaftaran) {
      removeFromSyncQueue(createdRecord.id);
      let finalRecord = createdRecord;
      if (sync.nomorPendaftaran !== createdRecord.nomorPendaftaran) {
        const updated = updateRegistration(createdRecord.id, (prev) => ({
          ...prev,
          nomorPendaftaran: sync.nomorPendaftaran as string,
        }));
        if (updated) finalRecord = updated;
      }
      setCreatedRecord(finalRecord);
      setUserRecord(finalRecord);
      setSyncWarning(null);
    } else if (sync.kind === 'server') {
      // Kirim ulang ternyata ditolak server (mis. duplikat): pindah ke layar gagal.
      setSubmitFailure({ message: sync.message, kind: 'server', record: createdRecord });
      setViewMode('submit_failed');
    } else {
      setSyncWarning(
        'Kirim ulang gagal (jaringan): ' + sync.message + ' Data tersimpan di perangkat ini — coba "Kirim Ulang ke Panitia" lagi.'
      );
    }
  };

  // Kirim ulang dari dashboard wali murid (record masih di antrean).
  const handleRetryFromDashboard = async () => {
    if (!userRecord) return;
    setIsRetrying(true);
    setDashboardRetryNotice(null);
    const sync = await resyncRecord(userRecord, settings);
    setIsRetrying(false);
    if (sync.success && sync.nomorPendaftaran) {
      removeFromSyncQueue(userRecord.id);
      let finalRecord = userRecord;
      if (sync.nomorPendaftaran !== userRecord.nomorPendaftaran) {
        const updated = updateRegistration(userRecord.id, (prev) => ({
          ...prev,
          nomorPendaftaran: sync.nomorPendaftaran as string,
        }));
        if (updated) finalRecord = updated;
      }
      setUserRecord(finalRecord);
    } else {
      setDashboardRetryNotice('Kirim ulang gagal: ' + sync.message);
    }
  };

  const activeWaveData =
    wavesList.find((w) => w.nama === settings.activeWave) ||
    DEFAULT_WAVES.find((w) => w.nama === settings.activeWave);

  const cleanPhone = (settings.kontakWhatsapp || '085196677872').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB ${settings.namaMadrasah}, saya ingin bertanya mengenai pendaftaran siswa baru.`
  )}`;

  // (v2.12) Layar muat netral: jangan render konten apa pun sebelum
  // pengaturan lokal diterapkan — ini yang mencegah hero berkedip dengan
  // konten default saat (re)load.
  if (!settingsReady) {
    return (
      <div className="min-h-screen bg-[#0D3B2E] text-[#F7F4EC] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm font-bold tracking-widest uppercase">MI Ishlahul Ummah</p>
        <div
          className="w-8 h-8 rounded-full border-2 border-[#F7F4EC]/30 border-t-[#F7F4EC] animate-spin"
          aria-hidden="true"
        />
        <p className="text-xs text-[#F7F4EC]/70">Memuat halaman pendaftaran…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#292524] font-sans flex flex-col selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {/* Banner pengumuman (diisi dari admin; kosong = tidak tampil) */}
      {viewMode === 'landing' && settings.cmsContent?.pengumumanBanner && !bannerDismissed && (
        <div className="bg-[#065F46] text-white text-xs sm:text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-3 relative z-30">
          <span className="text-center">{settings.cmsContent.pengumumanBanner}</span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Tutup pengumuman"
            className="shrink-0 px-1.5 py-0.5 rounded hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      {viewMode === 'landing' && settings.sectionVisibility?.showHeader !== false && (
        <LandingHeader
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          onOpenStatusCheck={handleOpenStatusTracker}
          onNavigateHome={handleNavigateLanding}
          onStartRegistration={() => setViewMode('applicant_access')}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
          schoolName={settings.namaMadrasah}
          logoUrl={settings.logoMadrasahUrl}
          headerTagline={settings.cmsContent?.headerTagline}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {/* VIEW 1: STREAMLINED LANDING PAGE */}
        {viewMode === 'landing' && (
          <div>
            {/* 1. Hero Section with Integrated Status & Actions */}
            <LandingHero
              onStartRegistration={() => setViewMode('applicant_access')}
              onOpenStatusTracker={handleOpenStatusTracker}
              settings={settings}
              activeWave={activeWaveData}
            />

            {/* Pita logo — 6 logo sejajar di tengah: LP Ma'arif NU,
                Kemenag, Madrasah Hebat Bermartabat, motto B3, Kurikulum
                Merdeka, Kurikulum Berbasis Cinta. Kedua logo kurikulum
                bertransparan (latar putih dihapus, 13 Nov) supaya menyatu
                dengan pita hijau tua — tanpa chip. Catatan: teks biru tua
                logo Kurikulum Merdeka jadi kurang kontras di atas hijau
                tua; bila Rahmat menilai tidak terbaca, kembalikan chip
                untuk logo itu saja. */}
            <div className="motif-band relative overflow-hidden" ref={logoBandRef}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                <img
                  src="/lp-maarif-nu.png"
                  alt="LP Ma'arif NU"
                  className={`h-11 sm:h-14 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '0ms' }}
                  width={200}
                  height={148}
                />
                <img
                  src="/kemenag.png"
                  alt="Kementerian Agama — Ikhlas Beramal"
                  className={`h-14 sm:h-16 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '80ms' }}
                  width={396}
                  height={381}
                />
                <img
                  src="/madrasah-hebat.png"
                  alt="Madrasah Hebat Bermartabat"
                  className={`h-14 sm:h-18 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '160ms' }}
                  width={448}
                  height={294}
                />
                <img
                  src="/motto-b3.png"
                  alt="Motto MI Ishlahul Ummah — Berilmu, Berakhlak, Berprestasi"
                  className={`h-16 sm:h-20 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '240ms' }}
                  width={921}
                  height={457}
                />
                <img
                  src="/kurikulum-merdeka.png"
                  alt="Kurikulum Merdeka"
                  className={`h-10 sm:h-12 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '320ms' }}
                  width={238}
                  height={230}
                />
                <img
                  src="/kurikulum-berbasis-cinta.png"
                  alt="Kurikulum Berbasis Cinta"
                  className={`h-10 sm:h-12 w-auto logo-band-item${logoBandInView ? ' logo-band-item--in' : ''}`}
                  style={{ animationDelay: '400ms' }}
                  width={1024}
                  height={1024}
                />
              </div>
            </div>

            {/* 2. Alur Pendaftaran 4 Langkah Praktis */}
            <RegistrationTimeline
              settings={settings}
              onStartRegistration={() => setViewMode('applicant_access')}
            />

            {/* 3. Program Unggulan, Mutu & Sambutan */}
            <LandingFeatures
              settings={settings}
              onStartRegistration={() => setViewMode('applicant_access')}
            />

            {/* 3b. Galeri Madrasah (tampil bila ada foto di CMS) */}
            <LandingGallery settings={settings} />

            {/* 4. Pusat Unduhan & Brosur SPMB */}
            <LandingDownloads
              settings={settings}
              waves={wavesList}
              onStartRegistration={() => setViewMode('applicant_access')}
            />

            {/* 4b. Testimoni Wali Murid (tampil bila ada testimoni di CMS) */}
            <LandingTestimonials settings={settings} />

            {/* 5. Tanya Jawab (FAQ) */}
            <LandingFaq
              settings={settings}
              onStartRegistration={() => setViewMode('applicant_access')}
              onOpenStatusCheck={handleOpenStatusTracker}
            />

            {/* 5b. Rincian Biaya (temuan tinjauan 13 Nov) */}
            <LandingBiaya settings={settings} />

            {/* 6. Hubungi Kami & Sekretariat */}
            {settings.sectionVisibility?.showSekretariat !== false && (
            <section
              id="hubungi-kami"
              className="py-10 sm:py-14 bg-white border-t border-[#E7E5E4] relative overflow-hidden"
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
                    <Phone className="w-3.5 h-3.5" />
                    <span>Sekretariat &amp; Layanan</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1917] tracking-tight mt-1 leading-[1.2] font-heading text-balance">
                    Layanan Informasi &amp; Pendaftaran
                  </h2>
                  <p className="text-base sm:text-lg text-[#78716C] mt-3 leading-relaxed font-normal">
                    Kunjungi langsung Sekretariat SPMB {settings.namaMadrasah} atau hubungi saluran resmi panitia.
                  </p>
                  <div
                    className="h-1.5 w-16 mx-auto mt-4.5 rounded-full"
                    style={{ background: '#B45309' }}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 bg-[#F7F4EC] rounded-xl p-6 sm:p-8 border border-[#E7E5E4] shadow-xs flex flex-col space-y-6">
                    <div className="space-y-5 text-sm">
                      <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#EEFAF4] text-[#065F46]">
                          <MapPin className="w-5 h-5" />
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1 font-heading">
                            Alamat Lembaga
                          </span>
                          <p className="text-[#1C1917] font-medium leading-relaxed">
                            {settings.alamatMadrasah}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#EEFAF4] text-[#065F46]">
                          <Phone className="w-5 h-5" />
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1 font-heading">
                            WhatsApp / Telepon
                          </span>
                          <p className="text-[#1C1917] font-bold text-base">
                            {settings.kontakWhatsapp}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#EEFAF4] text-[#065F46]">
                          <Mail className="w-5 h-5" />
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1 font-heading">
                            Email Resmi
                          </span>
                          <p className="text-[#1C1917] font-medium">
                            {settings.emailMadrasah || 'ishlahulummahmi@gmail.com'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#EEFAF4] text-[#065F46]">
                          <Clock className="w-5 h-5" />
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1 font-heading">
                            Jam Pelayanan
                          </span>
                          <p className="text-[#1C1917] font-medium">
                            {settings.cmsContent?.jamPelayanan || 'Senin - Sabtu: 07.30 - 14.00 WIB'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E7E5E4] flex flex-col sm:flex-row gap-3">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-theme-primary !py-3 !px-5 !text-sm gap-2 w-full text-center whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Hubungi WhatsApp</span>
                      </a>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-theme-secondary !py-3 !px-5 !text-sm gap-2 w-full text-center"
                      >
                        <MapPin className="w-4 h-4 text-[#065F46]" />
                        <span>Petunjuk Arah</span>
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-[#F7F4EC] rounded-xl p-6 sm:p-8 border border-[#E7E5E4] shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-[#065F46] uppercase tracking-wider font-heading">
                        Lokasi Kampus Madrasah
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1C1917] font-heading">
                        {settings.namaMadrasah}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
                        {settings.cmsContent?.lokasiDeskripsi ||
                          'Kampus madrasah yang asri, tenang, dan strategis, aman dari kebisingan jalan raya utama sehingga sangat kondusif untuk belajar santri.'}
                      </p>
                    </div>

                    <div className="my-6 rounded-2xl overflow-hidden border border-[#E7E5E4] bg-white">
                      <iframe
                        title="Peta lokasi MI Ishlahul Ummah"
                        src={mapsEmbedUrl}
                        className="w-full h-[300px] sm:h-[360px] border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                      <div className="p-6 text-center space-y-3">
                        <h4 className="text-sm font-bold text-[#1C1917] font-heading">
                          {settings.alamatMadrasah}
                        </h4>
                        <p className="text-xs text-[#78716C]">
                          Gunakan tombol di bawah untuk membuka navigasi rute langsung ke sekolah via Google Maps.
                        </p>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-theme-primary !py-2.5 !px-6 !text-xs !rounded-xl inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Peta Navigasi Google Maps</span>
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E7E5E4] flex items-center justify-between">
                      <span className="text-xs text-stone-500 font-medium">
                        Layanan konsultasi online &amp; sekretariat madrasah
                      </span>

                      <button
                        type="button"
                        onClick={() => setViewMode('applicant_access')}
                        className="text-xs font-bold text-[#065F46] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Daftar Online Sekarang</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            )}
          </div>
        )}

        {/* VIEW 2: DIRECT APPLICANT REGISTRATION & ACCESS (HALAMAN LOGIN / DAFTAR BARU) */}
        {viewMode === 'applicant_access' && (
          <ApplicantAccessCard
            initialTab={pendingOpenTracker ? 'login' : 'register'}
            onStartNewRegistration={handleStartNewRegistration}
            onResumeRegistration={handleResumeRegistration}
            onBackToHome={() => {
              setPendingOpenTracker(false);
              setViewMode('landing');
            }}
          />
        )}

        {/* VIEW 2.5: WALI MURID DASHBOARD (KHUSUS PENGGUNA TERDAFTAR & LOGIN RESMI) */}
        {viewMode === 'applicant_dashboard' && waliMuridSession && (
          <WaliMuridDashboard
            session={waliMuridSession}
            record={userRecord}
            settings={settings}
            onOpenInformasiPendaftaran={() => setViewMode('informasi_pendaftaran')}
            onOpenWizard={() => {
              // "Lihat / Edit Formulir" dari dashboard: tandai mode edit
              // supaya submit memakai jalur update, bukan pendaftaran baru.
              setIsEditingSubmitted(true);
              setViewMode('wizard');
            }}
            onOpenStatusTracker={handleOpenStatusTracker}
            onPrintBukti={() => {
              if (userRecord) {
                setPrintBuktiRecord(userRecord);
              } else {
                handleOpenStatusTracker();
              }
            }}
            onLogout={handleLogoutWaliMurid}
            dataStaleNotice={
              waliDataStale
                ? 'Server tidak terjangkau saat data dimuat — yang tampil di bawah ini berasal dari perangkat ini dan mungkin belum terbaru (mis. status verifikasi atau pengumuman). Coba muat ulang halaman saat koneksi membaik.'
                : null
            }
            showRetrySync={userRecord ? isInSyncQueue(userRecord.id) : false}
            onRetrySync={handleRetryFromDashboard}
            isRetryingSync={isRetrying}
            retryNotice={dashboardRetryNotice}
          />
        )}

        {/* VIEW 2.6: HALAMAN INFORMASI PENDAFTARAN RESMI (KHUSUS WALI MURID LOGIN RESMI) */}
        {viewMode === 'informasi_pendaftaran' && waliMuridSession && (
          <div className="min-h-screen bg-[#F7F4EC] py-8 sm:py-12">
            <InformasiPendaftaranView
              session={waliMuridSession}
              settings={settings}
              onBack={() => setViewMode('applicant_dashboard')}
              isModal={false}
            />
          </div>
        )}

        {/* VIEW 3: 4-STEP WIZARD FORM */}
        {viewMode === 'wizard' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Top Navigation Bar Khusus Wali Murid Login Saat Mengisi Formulir */}
            {waliMuridSession && (
              <div className="mb-6 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-stone-500 font-medium">Akun Terdaftar:</span>
                  <strong className="text-stone-900">{waliMuridSession.parentName}</strong>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500">Calon Ananda:</span>
                  <strong className="text-emerald-800">{waliMuridSession.studentName}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInformasiModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Informasi Pendaftaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('applicant_dashboard')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition cursor-pointer"
                  >
                    <span>Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutWaliMurid}
                    className="text-stone-400 hover:text-rose-600 font-semibold px-2 py-1 text-[11px] cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}
            <WizardProgressBar currentStep={currentStep} lastSavedAt={lastSavedAt} />
            {currentStep === 1 && (
              <WizardStep1
                data={studentData}
                jenisPendaftaran={jenisPendaftaran}
                onChange={setStudentData}
                onNext={handleNextStep}
                settings={settings}
                excludeRegId={userRecord?.id}
              />
            )}
            {currentStep === 2 && (
              <WizardStep2
                data={parentData}
                onChange={setParentData}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                settings={settings}
              />
            )}
            {currentStep === 3 && (
              <WizardStep3
                data={addressData}
                onChange={setAddressData}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                settings={settings}
              />
            )}
            {currentStep === 4 && (
              <WizardStep4
                data={documentsData}
                jenisPendaftaran={jenisPendaftaran}
                onChange={setDocumentsData}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                settings={settings}
              />
            )}
            {currentStep === 5 && (
              <>
                {submitError && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </div>
                )}
                <WizardReview
                token={activeToken || {
                  id: 'tok-temp',
                  code: activeTempPin || 'REG',
                  status: 'belum_digunakan',
                  createdAt: new Date().toISOString(),
                  academicYear: settings.activeAcademicYear,
                  wave: settings.activeWave,
                }}
                jenisPendaftaran={jenisPendaftaran}
                student={studentData}
                parent={parentData}
                address={addressData}
                documents={documentsData}
                onSubmit={handleSubmitRegistration}
                onEditStep={(step) => setCurrentStep(step)}
                isSubmitting={isSubmitting}
                settings={settings}
                modePendaftaran={activeModePendaftaran}
                inden={activeInden}
              />
              </>
            )}
          </div>
        )}

        {/* VIEW 3.5: LAYAR GAGAL KIRIM (K7) — penolakan server: data TIDAK masuk ke Sheets */}
        {viewMode === 'submit_failed' && submitFailure && (
          <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
            <div className="bg-white rounded-xl p-6 sm:p-10 shadow-xl border border-stone-200 text-center space-y-6">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                  <span className="text-3xl font-black">!</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-heading">
                  Pendaftaran Belum Terkirim ke Panitia
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                  {submitFailure.kind === 'server'
                    ? 'Server panitia menolak pendaftaran ini, jadi data belum masuk ke Google Sheets:'
                    : 'Gagal terhubung ke server panitia (jaringan), jadi data belum terkirim:'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm text-left leading-relaxed">
                <p className="font-extrabold mb-1">Alasan penolakan:</p>
                <p>{submitFailure.message}</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F7F4EC] border-2 border-amber-300 text-left space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  Nomor Sementara — belum terkonfirmasi panitia
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-stone-900">
                  {submitFailure.record.nomorPendaftaran}
                </span>
                <p className="text-xs text-stone-600">
                  Nomor ini hanya nomor sementara di perangkat ini, bukan nomor pendaftaran resmi.
                  Data tersimpan aman di perangkat ini dan masuk antrean kirim ulang otomatis.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetrySubmit}
                  disabled={isRetrying}
                  className="btn-primary w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <span>{isRetrying ? 'Mengirim ulang…' : 'Kirim Ulang'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitFailure(null);
                    setCurrentStep(5);
                    setViewMode('wizard');
                  }}
                  className="btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Perbaiki Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SUCCESS PAGE */}
        {viewMode === 'success' && createdRecord && (
          <SuccessPage
            record={createdRecord}
            onPrint={() => setPrintBuktiRecord(createdRecord)}
            onBackToHome={handleNavigateLanding}
            settings={settings}
            syncWarning={syncWarning}
            onRetrySync={handleRetryFromSuccess}
            isRetrying={isRetrying}
          />
        )}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {viewMode === 'admin' && (
          <AdminDashboard
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            onNavigateHome={handleNavigateLanding}
            onPrintOfficialForm={(record) => setPrintOfficialRecord(record)}
            onSettingsChange={(newSettings) => {
              setSettings(newSettings);
              setWavesList(getWaves());
            }}
          />
        )}
      </main>

      {/* Footer */}
      {settings.sectionVisibility?.showFooter !== false && (
      <footer className="bg-[#0D382B] text-[#DCECE5] pt-14 pb-12 border-t border-[#145C43]/50 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Kolom 1: Brand */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3.5">
                {settings.logoMadrasahUrl ? (
                  <img
                    src={settings.logoMadrasahUrl}
                    alt="Logo Madrasah"
                    className="w-11 h-11 rounded-2xl object-cover shadow-xs border border-white/20 shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ background: '#B45309' }}
                  >
                    <School className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-base leading-tight font-heading">
                    {settings.namaMadrasah}
                  </span>
                  <span className="text-xs text-[#A8D1C0] font-medium line-clamp-1">
                    {settings.cmsContent?.footerTagline || "Membentuk Generasi Qur'ani, Cerdas, dan Berakhlak Mulia"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#B2D6C6] leading-relaxed font-normal">
                {settings.cmsContent?.footerAbout || "Portal resmi Penerimaan Peserta Didik Baru Online (SPMB). Sistem administrasi modern yang memudahkan calon wali murid mendaftarkan putra-putri tercinta secara transparan, aman, dan efisien."}
              </p>
              {/* Logo motto B3 kecil di footer (latar transparan, terbaca di hijau tua) */}
              <img
                src="/motto-b3.png"
                alt="Motto MI Ishlahul Ummah — Berilmu, Berakhlak, Berprestasi"
                className="h-10 sm:h-12 w-auto"
                width={921}
                height={457}
              />
              <div className="flex items-center gap-2 pt-1 text-xs text-[#B2D6C6]">
                <button
                  type="button"
                  onClick={handleOpenStatusTracker}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-amber-300" />
                  <span>Lacak Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('applicant_access')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#6EE7B7] font-bold transition cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Daftar Online</span>
                </button>
              </div>
            </div>

            {/* Kolom 2: Navigasi */}
            <div className="lg:col-span-3 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-[#F4DA8E] uppercase tracking-wider font-heading">
                Navigasi SPMB
              </h3>
              <ul className="space-y-2 text-[#B2D6C6]">
                <li>
                  <button
                    type="button"
                    onClick={handleNavigateLanding}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Beranda Portal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setViewMode('applicant_access')}
                    className="hover:text-white transition-colors cursor-pointer text-left font-bold text-[#6EE7B7]"
                  >
                    Daftar Santri Baru
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenStatusTracker}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Lacak Status &amp; Pengumuman
                  </button>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Sekretariat */}
            <div className="lg:col-span-4 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-[#F4DA8E] uppercase tracking-wider font-heading">
                Sekretariat SPMB
              </h3>
              <div className="space-y-2 text-[#B2D6C6]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#6EE7B7] shrink-0 mt-0.5" />
                  <span>{settings.alamatMadrasah}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#6EE7B7] shrink-0" />
                  <span>WhatsApp: {settings.kontakWhatsapp}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#6EE7B7] shrink-0" />
                  <span>{settings.emailMadrasah || 'ishlahulummahmi@gmail.com'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#6EE7B7] shrink-0" />
                  <span>{settings.cmsContent?.jamPelayanan || 'Senin - Sabtu: 07.30 - 14.00 WIB'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-[#145C43]/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A8D1C0] gap-4">
            <p>&copy; {new Date().getFullYear()} {settings.namaMadrasah}. Seluruh hak cipta dilindungi.</p>
            <p>Sistem Penerimaan Murid Baru Terpadu</p>
          </div>
        </div>
      </footer>
      )}

      {/* Floating WhatsApp Quick Consultation */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Konsultasi Panitia SPMB melalui WhatsApp Resmi"
          className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20BA59] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 fill-white text-[#25D366] shrink-0" />
          <span className="hidden md:inline-block text-xs font-bold tracking-wide pr-1">
            Tanya Panitia
          </span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-white" />
          </span>
        </a>
      </div>

      {/* MODAL 1: INFORMASI PENDAFTARAN RESMI (KHUSUS WALI MURID LOGIN) */}
      {waliMuridSession && (
        <InformasiPendaftaranModal
          isOpen={isInformasiModalOpen}
          onClose={() => setIsInformasiModalOpen(false)}
          session={waliMuridSession}
          settings={settings}
        />
      )}

      {/* MODAL 2: STEPPER TIMELINE STATUS TRACKER */}
      <StatusTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        onPrintBukti={(record) => setPrintBuktiRecord(record)}
        onRequestLogin={() => {
          setPendingOpenTracker(true);
          setViewMode('applicant_access');
        }}
        settings={settings}
      />

      {/* Printable Bukti Modal */}
      {printBuktiRecord && (
        <PrintableBukti
          record={printBuktiRecord}
          settings={settings}
          onClose={() => setPrintBuktiRecord(null)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(role) => {
          handleRoleChange(role);
          setViewMode('admin');
        }}
        schoolName={settings.namaMadrasah}
      />

      {/* Printable Official Form Modal */}
      {printOfficialRecord && (
        <PrintableFormulirResmi
          record={printOfficialRecord}
          settings={settings}
          onClose={() => setPrintOfficialRecord(null)}
        />
      )}
    </div>
  );
}
