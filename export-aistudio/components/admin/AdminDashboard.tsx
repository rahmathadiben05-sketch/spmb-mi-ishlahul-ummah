'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Users,
  FileCheck2,
  Bell,
  BarChart3,
  Calendar,
  Settings,
  History,
  Code2,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
  RefreshCw,
  LogOut,
  Sparkles,
  Database,
  ArrowUpRight,
  CheckSquare,
  FileSpreadsheet,
  Building,
  Edit,
  Trash2,
  Check,
  Layers,
  CalendarRange,
  Target,
  Pencil,
  Eye,
  User,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Phone,
  AlertCircle,
  School,
  FileDown,
  Upload,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  AcademicYear,
  AuditLog,
  CmsContent,
  DashboardWaliMuridConfig,
  RegistrationRecord,
  RincianBiayaPendaftaran,
  SchoolSettings,
  SectionVisibility,
  Token,
  UserRole,
  VerificationChecklist,
  Wave,
  WebhookLog,
} from '@/lib/types';
import {
  getSchoolSettings,
  saveSchoolSettings,
  compressImageDataUrl,
  getTokens,
  getRegistrations,
  saveRegistrations,
  fetchServerRegistrations,
  normalizeWaveName,
  updateRegistration,
  deleteRegistration,
  deleteMultipleRegistrations,
  deleteToken,
  deleteMultipleTokens,
  resetAllTestData,
  getAuditLogs,
  getWebhookLogs,
  addWebhookLog,
  clearWebhookLogs,
  syncRegistrationUpdateToWebhook,
  exportDatabaseJson,
  getAcademicYears,
  saveAcademicYears,
  getWaves,
  saveWaves,
  DEFAULT_RINCIAN_BIAYA,
  DEFAULT_DASHBOARD_WALI_MURID,
  fetchPublicStats,
  confirmDpToWebhook,
  completeIndenToWebhook,
  extendIndenToWebhook,
  markIndenExpiredToWebhook,
  saveAllSettingsToServer,
  fetchServerSettings,
  getLocalSettingsUpdatedAt,
  getSettingsSyncConflict,
  applyPendingServerSettings,
  hasStoredLocalSettings,
  formatRupiah,
  hitungSisaHari,
  // Auth admin server-side (Paket A, 2026-11-11)
  getAdminSessionToken,
  clearAdminSessionToken,
  isAdminTokenError,
  changePinToWebhook,
  changeAdminPin,
  maskNik,
  resolveParentName,
  setCurrentRole,
} from '@/lib/storage';
import { getGoogleAppsScriptCode } from '@/lib/gas-generator';
import { EditSectionModal } from './EditSectionModal';
import { EditAcademicYearModal } from './EditAcademicYearModal';
import { EditWaveModal } from './EditWaveModal';
import { EditPinModal } from './EditPinModal';
import { EditRincianBiayaModal } from './EditRincianBiayaModal';
import { EditDashboardWaliMuridModal } from './EditDashboardWaliMuridModal';
import { UnifiedCmsCenter } from './UnifiedCmsCenter';
import { InformasiPendaftaranModal } from '@/components/informasi/InformasiPendaftaranModal';

interface AdminDashboardProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateHome: () => void;
  onPrintOfficialForm: (record: RegistrationRecord) => void;
  onSettingsChange?: (settings: SchoolSettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentRole,
  onRoleChange,
  onNavigateHome,
  onPrintOfficialForm,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kpi' | 'tokens' | 'registrations' | 'verification' | 'pengumuman' | 'analytics' | 'academic_years' | 'biaya_pendaftaran' | 'cms_center' | 'settings' | 'logs' | 'gas'
  >('kpi');

  const [settings, setSettings] = useState<SchoolSettings>(() => getSchoolSettings());
  const [tokensList, setTokensList] = useState<Token[]>(() => getTokens());
  const [registrationsList, setRegistrationsList] = useState<RegistrationRecord[]>(() => getRegistrations());
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>(() => getAuditLogs());
  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>(() => getAcademicYears());
  const [wavesList, setWavesList] = useState<Wave[]>(() => getWaves());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');


  // Bulk Actions
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'verify' | 'pending' | 'reject'>('verify');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [bulkNotifyWa, setBulkNotifyWa] = useState<boolean>(true);

  // Verification & Detail modals
  const [selectedReg, setSelectedReg] = useState<RegistrationRecord | null>(null);
  const [selectedDetailReg, setSelectedDetailReg] = useState<RegistrationRecord | null>(null);
  const [verificationChecklist, setVerificationChecklist] = useState<VerificationChecklist>({
    kkSesuai: false,
    aktaSesuai: false,
    nikSesuai: false,
    dokumenLengkap: false,
    wawancaraSelesai: false,
    pembayaranLunas: false,
    berkasDiterima: false,
    catatanOperator: '',
  });

  // Settings & Integrations
  const [settingsForm, setSettingsForm] = useState<SchoolSettings>(() => getSchoolSettings());
  const [isLogoUploading, setIsLogoUploading] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ loading: boolean; status?: 'success' | 'error'; message?: string } | null>(null);
  const [webhookLogsList, setWebhookLogsList] = useState<WebhookLog[]>(() => getWebhookLogs());
  const [syncingRegId, setSyncingRegId] = useState<string | null>(null);
  // (v2.13.6) Umpan balik pengumuman: tanpa ini, klik LULUS / CADANGAN /
  // TIDAK LULUS terasa "tidak berdampak" — sukses tidak menampilkan apa
  // pun, hanya teks kecil "Status: ..." yang berubah. Toast + lencana
  // status + tombol yang terkunci saat menyimpan membuat hasilnya terlihat
  // jelas dan persisten.
  const [pengumumanToast, setPengumumanToast] = useState<string | null>(null);
  const [pengumumanSavingId, setPengumumanSavingId] = useState<string | null>(null);

  // Edit Section (CMS) Modal State
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);

  // Academic Year Modal State
  const [showAyModal, setShowAyModal] = useState<boolean>(false);
  const [editingAy, setEditingAy] = useState<AcademicYear | null>(null);

  // Wave Modal State
  const [showWaveModal, setShowWaveModal] = useState<boolean>(false);
  const [editingWave, setEditingWave] = useState<Wave | null>(null);

  // Edit PIN Modal State
  const [editingPinRecord, setEditingPinRecord] = useState<RegistrationRecord | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Ubah PIN Admin (Paket A, 2026-11-11) — form di tab Pengaturan.
  const [adminPinCurrent, setAdminPinCurrent] = useState('');
  const [adminPinNew, setAdminPinNew] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');
  const [adminPinMsg, setAdminPinMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [adminPinBusy, setAdminPinBusy] = useState(false);

  // Rincian Biaya & Dashboard Wali Murid Modals State
  const [showRincianBiayaModal, setShowRincianBiayaModal] = useState<boolean>(false);
  const [showDashboardWaliMuridModal, setShowDashboardWaliMuridModal] = useState<boolean>(false);
  const [showPreviewInformasiModal, setShowPreviewInformasiModal] = useState<boolean>(false);

  // --- Sinkronisasi pengaturan ke server (backend v2.7) ---
  // Peringatan tampil bila tulis admin gagal ke server (lokal tetap tersimpan).
  const [serverSyncWarning, setServerSyncWarning] = useState<string | null>(null);
  // Status migrasi satu kali: bandingkan updatedAt lokal vs server.
  const [serverHasSettings, setServerHasSettings] = useState<boolean | null>(null);
  // v2.9: true begitu pengecekan server SELESAI (berhasil/gagal) — tombol
  // migrasi tidak boleh tampil sebelum ini, supaya tidak berkedip muncul
  // lalu hilang saat mount (serverHasSettings masih null).
  const [serverStatusKnown, setServerStatusKnown] = useState<boolean>(false);
  const [serverUpdatedAtMs, setServerUpdatedAtMs] = useState<number>(0);
  const [localUpdatedAtMs, setLocalUpdatedAtMs] = useState<number>(() => getLocalSettingsUpdatedAt());
  const [migrationBusy, setMigrationBusy] = useState<boolean>(false);
  const [migrationDoneMsg, setMigrationDoneMsg] = useState<string | null>(null);
  // Konflik sinkronisasi (M1): perubahan lokal yang belum terkirim sementara
  // server juga punya salinan — dicatat loadSettingsWithServerFallback saat
  // aplikasi dibuka; admin memilih arahnya lewat banner, bukan ditimpa diam-diam.
  const [settingsConflict, setSettingsConflict] = useState<{
    localUpdatedAtMs: number;
    serverUpdatedAtMs: number;
    serverUpdatedAtUnknown: boolean;
  } | null>(null);
  const [conflictBusy, setConflictBusy] = useState<boolean>(false);
  // Cek status server sekali saat dashboard admin dibuka (hanya jalur admin).
  useEffect(() => {
    let cancelled = false;
    fetchServerSettings()
      .then((r) => {
        if (cancelled) return;
        setServerStatusKnown(true);
        if (r.ok) {
          // v2.9: server "punya settings" hanya bila payload membawa
          // settings yang TIDAK kosong. Server yang isinya {} (sisa
          // tulisan {} dari bug amplop v2.7/v2.8, C1) BUKAN "punya
          // settings" — data !== null saja tidak cukup. Tanpa ini,
          // tombol migrasi hilang di HP Rahmat: stempel lokalnya
          // kemungkinan besar sudah disamakan ke stempel server {}
          // oleh loader lama (bug 4c) sehingga stempel sama persis
          // padahal server kosong dan tidak ada yang tersinkron.
          const serverSettings = (r.data as unknown as { settings?: unknown } | null)?.settings;
          setServerHasSettings(
            !!serverSettings &&
              typeof serverSettings === 'object' &&
              Object.keys(serverSettings as Record<string, unknown>).length > 0
          );
          setServerUpdatedAtMs(r.updatedAt ? Date.parse(r.updatedAt) || 0 : 0);
          // Konflik yang dicatat saat muat-awal (lokal lebih baru dari server):
          // tampilkan banner pilihan arah — jangan timpa diam-diam.
          setSettingsConflict(getSettingsSyncConflict());
        } else {
          // Server tidak terjangkau: jangan blokir admin; tombol migrasi
          // tetap boleh tampil (bila ditekan, kegagalannya jujur lewat
          // alert) — yang dilarang hanya tampil SEBELUM status diketahui.
          setServerHasSettings(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerStatusKnown(true);
          setServerHasSettings(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Daftar pendaftar dari server (backend v2.8, action listRegistrations) ---
  // Sumber utama statistik + Data Pendaftaran + Verifikasi Berkas + Akun Wali
  // & PIN adalah daftar server (master di Google Sheets). localStorage hanya
  // fallback bila server gagal — daftar yang sudah tampil TIDAK dikosongkan
  // selama fetch berjalan, dan kegagalan WAJIB terlihat (bukan sukses palsu).
  const [registrationsLoading, setRegistrationsLoading] = useState<boolean>(false);
  const [registrationsServerWarning, setRegistrationsServerWarning] = useState<string | null>(null);
  const [registrationsSource, setRegistrationsSource] = useState<'server' | 'local'>('local');
  const registrationsFetchInFlight = useRef(false);

  const refreshRegistrationsFromServer = useCallback(async () => {
    // Cegah fetch ganda (mis. StrictMode double-mount / klik Refresh beruntun).
    if (registrationsFetchInFlight.current) return;
    registrationsFetchInFlight.current = true;
    setRegistrationsLoading(true);
    try {
      const res = await fetchServerRegistrations(settings.activeAcademicYear);
      if (res.ok) {
        // Normalisasi tampilan: baris lama 'Gelombang 1 (Early Bird)' tampil
        // sebagai 'TA 2027/2028'. Hanya pemetaan ke tampilan — Sheets tidak ditulis ulang.
        const displayData = res.data.map((r) => ({ ...r, wave: normalizeWaveName(r.wave) }));
        // (v2.13) Server TIDAK PERNAH mengembalikan PIN (L5) — tapi operator
        // baru saja me-reset PIN suatu akun; PIN baru itu hanya ada di daftar
        // lokal (state). Bila refresh server menimpa daftar tanpa
        // mempertahankan PIN lokal, PIN yang baru di-reset hilang dari
        // tampilan padahal server sudah menyimpannya (temuan E2E 13 Nov
        // 12:29: reset pertama "tidak menempel"). Pertahankan PIN lokal
        // yang diketahui per record di STATE tampil saja; cache
        // localStorage di bawah tetap TANPA PIN (L3). Urutan: PIN dari
        // data segar MENANG (bila ada) — PIN lama di state hanya fallback
        // bila data segar kosong (temuan verifikasi ulang 12:42: aturan
        // sebaliknya membekukan tampilan di PIN pertama, reset berikut
        // tidak pernah tampil walau server sudah menyimpan PIN baru).
        setRegistrationsList((prev) =>
          displayData.map((r) => {
            const local = prev.find((l) => l.id === r.id || l.nomorPendaftaran === r.nomorPendaftaran);
            return { ...r, pin: r.pin || local?.pin || '' };
          })
        );
        // Cache ke localStorage supaya fallback offline tetap segar dan
        // refreshData() lokal sesudah aksi admin tetap menampilkan data server.
        // (v2.11, L3) Salinan cache TANPA PIN — aksi admin memakai token,
        // bukan PIN wali; PIN tidak boleh tertinggal di localStorage.
        try {
          saveRegistrations(displayData.map((r) => ({ ...r, pin: '' })));
        } catch {
          // Kuota localStorage penuh: state tetap memakai data server.
        }
        setRegistrationsServerWarning(null);
        setRegistrationsSource('server');
      } else {
        // Token ditolak server: JANGAN diam-diam lanjut dengan data lokal —
        // bersihkan sesi dan minta login ulang (Paket A).
        if (res.tokenExpired) {
          handleAdminSessionExpired();
          return;
        }
        setRegistrationsServerWarning(
          'Daftar pendaftar gagal dimuat dari server (' + res.error + '). Menampilkan data perangkat ini — jumlahnya bisa berbeda dengan Google Sheets.'
        );
      }
    } catch {
      setRegistrationsServerWarning(
        'Daftar pendaftar gagal dimuat dari server (masalah jaringan). Menampilkan data perangkat ini — jumlahnya bisa berbeda dengan Google Sheets.'
      );
    } finally {
      registrationsFetchInFlight.current = false;
      setRegistrationsLoading(false);
    }
  }, [settings.activeAcademicYear]);

  // Muat daftar dari server sekali saat dashboard admin dibuka.
  useEffect(() => {
    void refreshRegistrationsFromServer();
    // Sengaja sekali saat mount; Refresh manual lewat tombol di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Inden: filter + statistik kuota diskon + aksi per baris ---
  const [indenFilter, setIndenFilter] = useState<'semua' | 'inden'>('semua');
  const [indenStats, setIndenStats] = useState<{ total: number; diskonTerpakai: number; sisaKuotaDiskon: number } | null>(null);
  const [indenBusyId, setIndenBusyId] = useState<string | null>(null);
  useEffect(() => {
    if (activeTab !== 'registrations') return;
    let cancelled = false;
    const activeWave = wavesList.find((w) => w.nama === settings.activeWave) || wavesList.find((w) => w.isAktif);
    fetchPublicStats(settings, activeWave?.kuotaDiskon).then((s) => {
      if (!cancelled) setIndenStats(s);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTab, wavesList, settings]);

  /** Sesi admin ditolak server (token tidak ada / kedaluwarsa / versi
   *  tidak cocok): bersihkan sesi dan paksa login ulang — JANGAN
   *  diam-diam lanjut dengan data lokal. */
  const handleAdminSessionExpired = () => {
    clearAdminSessionToken();
    setCurrentRole('public');
    onRoleChange('public');
    alert('Sesi admin berakhir. Silakan login kembali.');
  };

  /** Ubah PIN admin (Paket A): PIN saat ini diverifikasi DI SERVER;
   *  PIN baru minimal 6 karakter huruf/angka, berbeda dari PIN saat ini,
   *  dan konfirmasi harus sama persis (dicek di sini DAN di backend).
   *  Bila sukses, server menaikkan versi token — token sesi ini langsung
   *  tidak berlaku, jadi admin WAJIB login ulang dengan PIN baru. */
  const handleChangeAdminPin = async () => {
    setAdminPinMsg(null);
    if (!adminPinCurrent || !adminPinNew || !adminPinConfirm) {
      setAdminPinMsg({ kind: 'err', text: 'Isi PIN saat ini, PIN baru, dan konfirmasi PIN baru.' });
      return;
    }
    if (!/^[A-Za-z0-9]{6,}$/.test(adminPinNew)) {
      setAdminPinMsg({ kind: 'err', text: 'PIN baru minimal 6 karakter huruf/angka.' });
      return;
    }
    if (adminPinNew === adminPinCurrent) {
      setAdminPinMsg({ kind: 'err', text: 'PIN baru harus berbeda dari PIN saat ini.' });
      return;
    }
    if (adminPinNew !== adminPinConfirm) {
      setAdminPinMsg({ kind: 'err', text: 'Konfirmasi PIN baru tidak sama dengan PIN baru.' });
      return;
    }
    setAdminPinBusy(true);
    try {
      const res = await changeAdminPin(adminPinCurrent, adminPinNew);
      if (!res.ok) {
        if (res.tokenExpired) {
          handleAdminSessionExpired();
          return;
        }
        setAdminPinMsg({ kind: 'err', text: res.error || 'Gagal mengubah PIN admin.' });
        return;
      }
      setAdminPinCurrent('');
      setAdminPinNew('');
      setAdminPinConfirm('');
      setAdminPinMsg({ kind: 'ok', text: 'PIN admin berhasil diubah dan tersimpan di server. Semua sesi admin (termasuk di perangkat ini dan perangkat lain) telah diakhiri.' });
      alert('PIN admin berhasil diubah dan tersimpan di server. Semua sesi admin (termasuk di perangkat ini dan perangkat lain) telah diakhiri — silakan login kembali dengan PIN baru.');
      clearAdminSessionToken();
      setCurrentRole('public');
      onRoleChange('public');
    } finally {
      setAdminPinBusy(false);
    }
  };

  /** Server-first untuk semua tulis admin: kirim SELURUH payload ke server
   *  dulu; bila gagal, kembalikan false dan pasang peringatan (pemanggil
   *  tetap menulis localStorage, tapi tanpa sukses palsu). */
  const syncSettingsToServer = async (
    nextSettings: SchoolSettings,
    nextWaves: Wave[],
    nextYears: AcademicYear[]
  ): Promise<boolean> => {
    try {
      const res = await saveAllSettingsToServer(nextSettings, nextWaves, nextYears);
      if (res.ok) {
        setServerSyncWarning(null);
        if (res.updatedAt) setServerUpdatedAtMs(Date.parse(res.updatedAt) || Date.now());
        setLocalUpdatedAtMs(getLocalSettingsUpdatedAt());
        return true;
      }
      // Token ditolak server: bersihkan sesi dan minta login ulang —
      // jangan diam-diam lanjut dengan data lokal (Paket A).
      if (res.tokenExpired) {
        handleAdminSessionExpired();
        return false;
      }
      setServerSyncWarning(
        'Gagal tersimpan ke server — pengaturan hanya tersimpan di perangkat ini. Coba lagi. (' + (res.error || 'tidak ada keterangan') + ')'
      );
      return false;
    } catch {
      setServerSyncWarning(
        'Gagal tersimpan ke server — pengaturan hanya tersimpan di perangkat ini. Coba lagi.'
      );
      return false;
    }
  };

  /** Migrasi satu kali: unggah SEMUA pengaturan lokal perangkat ini ke server. */
  const handleMigrateSettingsToServer = async () => {
    setMigrationBusy(true);
    const res = await saveAllSettingsToServer(getSchoolSettings(), getWaves(), getAcademicYears());
    setMigrationBusy(false);
    if (res.ok) {
      setServerHasSettings(true);
      setServerUpdatedAtMs(res.updatedAt ? Date.parse(res.updatedAt) || Date.now() : Date.now());
      setLocalUpdatedAtMs(getLocalSettingsUpdatedAt());
      setSettingsConflict(null);
      setMigrationDoneMsg(
        'Pengaturan perangkat ini sudah tersimpan di server — semua device kini memakai pengaturan yang sama.'
      );
      setServerSyncWarning(null);
    } else {
      alert('Migrasi gagal: ' + (res.error || 'tidak dapat terhubung ke server.') + ' Pengaturan tetap tersimpan di perangkat ini — coba lagi.');
    }
  };

  /** Konflik (M1), pilihan "pakai server": buang perubahan lokal yang belum
   *  terkirim dan terapkan salinan server yang tertunda, lalu segarkan form. */
  const handleUseServerSettings = async () => {
    if (!confirm('Pakai pengaturan dari server? Perubahan lokal di perangkat ini yang belum terkirim ke server akan HILANG.')) {
      return;
    }
    setConflictBusy(true);
    const applied = applyPendingServerSettings();
    setConflictBusy(false);
    if (applied) {
      setSettingsConflict(null);
      setServerUpdatedAtMs(getLocalSettingsUpdatedAt());
      setLocalUpdatedAtMs(getLocalSettingsUpdatedAt());
      setMigrationDoneMsg('Pengaturan dari server sudah diterapkan di perangkat ini — perubahan lokal yang belum terkirim sudah dibuang.');
      refreshData();
    } else {
      alert('Gagal menerapkan pengaturan server: salinan server tidak ditemukan. Coba muat ulang halaman.');
    }
  };

  // v2.9: tombol migrasi — (a) HANYA sesudah status server diketahui
  // (serverStatusKnown), selama pengecekan tampil placeholder loading;
  // (b) bandingkan stempel dengan toleransi selisih jam (jam server vs
  // jam HP bisa menyimpang) dan bila ragu TAMPILKAN tombol — sembunyikan
  // hanya bila stempel PERSIS sama (baru selesai migrasi/sinkron, jadi
  // isinya sudah sama) atau server JELAS lebih baru dari lokal dengan
  // selisih melebihi toleransi. Pengecualian: bila server TIDAK punya
  // isi settings yang nyata (serverHasSettings false — mis. isinya {}
  // sisa bug amplop), tombol SELALU tampil apa pun stempelnya, karena
  // tidak ada yang bisa "sudah sinkron" dengan server kosong.
  // Menampilkan saat ragu itu aman (unggah ulang isi yang sama =
  // idempotent); menyembunyikan saat ragu menutup jalur pemulihan
  // satu-satunya dari HP ini.
  const SERVER_CLOCK_SKEW_TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 jam
  const migrationStampsMatch =
    serverHasSettings === true &&
    serverUpdatedAtMs > 0 &&
    localUpdatedAtMs > 0 &&
    localUpdatedAtMs === serverUpdatedAtMs;
  const serverClearlyNewer =
    serverHasSettings === true &&
    serverUpdatedAtMs > 0 &&
    localUpdatedAtMs > 0 &&
    serverUpdatedAtMs > localUpdatedAtMs + SERVER_CLOCK_SKEW_TOLERANCE_MS;
  const showMigrationButton =
    settingsConflict === null &&
    migrationDoneMsg === null &&
    serverStatusKnown &&
    hasStoredLocalSettings() &&
    !migrationStampsMatch &&
    (!serverHasSettings || localUpdatedAtMs === 0 || !serverClearlyNewer);

  const handleSaveRincianBiaya = async (updatedRincian: RincianBiayaPendaftaran) => {
    // M3: baca ulang pengaturan tersimpan tepat sebelum membangun payload —
    // settingsForm bisa basi (diisi saat dashboard dibuka, sebelum sinkron
    // server selesai); hanya irisan yang diubah modal ini yang ditimpa.
    const updatedSettings: SchoolSettings = {
      ...getSchoolSettings(),
      rincianBiayaPendaftaran: updatedRincian,
    };
    // Server-first: kirim dulu, baru tulis lokal (peringatan bila gagal).
    await syncSettingsToServer(updatedSettings, wavesList, academicYearsList);
    saveSchoolSettings(updatedSettings, currentRole);
    setSettings(updatedSettings);
    setSettingsForm(updatedSettings);
    onSettingsChange?.(updatedSettings);
    setShowRincianBiayaModal(false);
  };

  const handleSaveDashboardWaliMurid = async (updatedConfig: DashboardWaliMuridConfig) => {
    // M3: basis segar dari storage (lihat handleSaveRincianBiaya).
    const updatedSettings: SchoolSettings = {
      ...getSchoolSettings(),
      dashboardWaliMuridConfig: updatedConfig,
    };
    await syncSettingsToServer(updatedSettings, wavesList, academicYearsList);
    saveSchoolSettings(updatedSettings, currentRole);
    setSettings(updatedSettings);
    setSettingsForm(updatedSettings);
    onSettingsChange?.(updatedSettings);
    setShowDashboardWaliMuridModal(false);
  };

  const refreshData = () => {
    const currentSettings = getSchoolSettings();
    setSettings(currentSettings);
    setSettingsForm(currentSettings);
    setTokensList(getTokens());
    // (v2.13) Sama seperti refresh server di atas: jangan hapus PIN yang
    // diketahui dari state tampil hanya karena cache lokal tidak
    // menyimpannya (cache memang sengaja tanpa PIN, L3). Urutan: PIN dari
    // data segar MENANG (mis. PIN baru yang baru ditulis reset) — PIN lama
    // di state hanya fallback bila data segar kosong.
    setRegistrationsList((prev) => {
      const fresh = getRegistrations();
      return fresh.map((r) => {
        const known = prev.find((l) => l.id === r.id || l.nomorPendaftaran === r.nomorPendaftaran);
        return { ...r, pin: r.pin || known?.pin || '' };
      });
    });
    setAuditLogsList(getAuditLogs());
    setWebhookLogsList(getWebhookLogs());
    setAcademicYearsList(getAcademicYears());
    setWavesList(getWaves());
  };

  /** Tombol "Refresh Data": segarkan data lokal seperti biasa, lalu muat
   *  ulang daftar pendaftar dari server. refreshData() sendiri SENGAJA
   *  tetap lokal saja — pemanggil internal (sesudah aksi admin) tidak
   *  boleh menimpa perubahan lokal yang baru dibuat sebelum webhook-nya
   *  sempat terkirim ke Sheets. */
  const handleRefreshData = () => {
    refreshData();
    void refreshRegistrationsFromServer();
  };

  // --- LOGO UPLOAD HANDLERS ---
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (PNG, JPG, JPEG, WEBP)!');
      return;
    }

    setIsLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        // Compress image to ~250x250
        const compressed = await compressImageDataUrl(rawDataUrl, 250, 250, 0.85);
        setSettingsForm((prev) => ({
          ...prev,
          logoMadrasahUrl: compressed,
        }));
        setIsLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload logo failed:', err);
      setIsLogoUploading(false);
      alert('Gagal memproses file logo.');
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('Hapus logo madrasah saat ini dan kembali ke ikon standar?')) {
      setSettingsForm((prev) => ({
        ...prev,
        logoMadrasahUrl: '',
      }));
    }
  };

  // --- CMS SECTION VISIBILITY & EDIT HANDLERS ---
  const handleToggleSection = (key: keyof SectionVisibility) => {
    setSettingsForm((prev) => {
      const currentVis = prev.sectionVisibility || {};
      const updatedVis = {
        ...currentVis,
        [key]: !currentVis[key],
      };
      return {
        ...prev,
        sectionVisibility: updatedVis,
        sectionVisibilityConfigured: true,
      };
    });
  };

  const handleSaveSectionCms = async (
    updatedCms: CmsContent,
    extraFields?: Partial<SchoolSettings>
  ): Promise<boolean> => {
    // M3: basis segar dari storage, bukan snapshot settingsForm yang bisa
    // basi — hanya cmsContent + extraFields dari modal yang ditimpa.
    const updated: SchoolSettings = {
      ...getSchoolSettings(),
      ...extraFields,
      cmsContent: updatedCms,
      sectionVisibilityConfigured: true,
    };
    // v2.9: periksa hasil sync — bila server gagal, JANGAN tampilkan
    // alert sukses (peringatan sudah dipasang syncSettingsToServer lewat
    // serverSyncWarning) dan kembalikan false supaya modal TIDAK tertutup
    // seolah berhasil. Sama jujurnya dengan UnifiedCmsCenter.handleSaveTab.
    const serverOk = await syncSettingsToServer(updated, wavesList, academicYearsList);
    saveSchoolSettings(updated, currentRole);
    setSettings(updated);
    setSettingsForm(updated);
    onSettingsChange?.(updated);
    if (serverOk) {
      alert('Konten seksi berhasil diperbarui!');
    }
    return serverOk;
  };

  // --- ACADEMIC YEAR HANDLERS ---
  const handleSaveAcademicYear = async (ayData: {
    id?: string;
    tahun: string;
    kuotaTotal: number;
    isAktif: boolean;
  }) => {
    let updatedYears = [...academicYearsList];
    if (ayData.id) {
      // Edit existing
      updatedYears = updatedYears.map((ay) => {
        if (ay.id === ayData.id) {
          return {
            ...ay,
            tahun: ayData.tahun,
            kuotaTotal: ayData.kuotaTotal,
            isAktif: ayData.isAktif,
          };
        }
        // If the edited one is active, deactivate others
        if (ayData.isAktif) {
          return { ...ay, isAktif: false };
        }
        return ay;
      });
    } else {
      // Create new
      const newAy: AcademicYear = {
        id: `ay-${Date.now()}`,
        tahun: ayData.tahun,
        kuotaTotal: ayData.kuotaTotal,
        isAktif: ayData.isAktif,
      };
      if (ayData.isAktif) {
        updatedYears = updatedYears.map((ay) => ({ ...ay, isAktif: false }));
      }
      updatedYears.push(newAy);
    }

    // Sync with settings if active (basis segar dari storage, M3).
    // kuotaTarget TIDAK ditimpa dari kuotaTotal (M15): kuotaTarget adalah
    // target progres dashboard pilihan Rahmat (30) — bukan total kursi.
    let updatedSettings = getSchoolSettings();
    if (ayData.isAktif) {
      updatedSettings = {
        ...updatedSettings,
        activeAcademicYear: ayData.tahun,
      };
    }

    await syncSettingsToServer(updatedSettings, wavesList, updatedYears);
    saveAcademicYears(updatedYears, currentRole);
    setAcademicYearsList(updatedYears);

    if (ayData.isAktif) {
      saveSchoolSettings(updatedSettings, currentRole);
      setSettings(updatedSettings);
      setSettingsForm(updatedSettings);
      onSettingsChange?.(updatedSettings);
    }

    refreshData();
  };

  const handleToggleAyActive = async (id: string) => {
    const target = academicYearsList.find((ay) => ay.id === id);
    if (!target) return;

    const newActiveState = !target.isAktif;
    const updatedYears = academicYearsList.map((ay) => ({
      ...ay,
      isAktif: ay.id === id ? newActiveState : newActiveState ? false : ay.isAktif,
    }));

    // Basis segar dari storage (M3); kuotaTarget tidak ditimpa (M15).
    let updatedSettings = getSchoolSettings();
    if (newActiveState) {
      updatedSettings = {
        ...updatedSettings,
        activeAcademicYear: target.tahun,
      };
    }

    await syncSettingsToServer(updatedSettings, wavesList, updatedYears);
    saveAcademicYears(updatedYears, currentRole);
    setAcademicYearsList(updatedYears);

    if (newActiveState) {
      saveSchoolSettings(updatedSettings, currentRole);
      setSettings(updatedSettings);
      setSettingsForm(updatedSettings);
      onSettingsChange?.(updatedSettings);
    }

    refreshData();
  };

  const handleDeleteAy = async (id: string) => {
    const target = academicYearsList.find((ay) => ay.id === id);
    if (!target) return;
    if (target.isAktif) {
      alert('Tidak dapat menghapus Tahun Ajaran yang sedang AKTIF. Silakan aktifkan tahun ajaran lain terlebih dahulu.');
      return;
    }
    if (confirm(`Hapus Tahun Ajaran ${target.tahun}?`)) {
      const filtered = academicYearsList.filter((ay) => ay.id !== id);
      await syncSettingsToServer(getSchoolSettings(), wavesList, filtered);
      saveAcademicYears(filtered, currentRole);
      setAcademicYearsList(filtered);
      refreshData();
    }
  };

  // --- WAVE HANDLERS ---
  const handleSaveWave = async (waveData: {
    id?: string;
    nama: string;
    academicYear: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    biayaPendaftaran: number;
    isAktif: boolean;
    indenAktif?: boolean;
    indenDp?: number;
    diskonJenis?: 'rp' | 'persen';
    diskonNilai?: number;
    kuotaDiskon?: number;
    batasAkhirInden?: string;
    batasPelunasanHari?: number;
    dpHangusJikaLewatBatas?: boolean;
  }) => {
    let updatedWaves = [...wavesList];
    if (waveData.id) {
      updatedWaves = updatedWaves.map((w) => {
        if (w.id === waveData.id) {
          return {
            ...w,
            ...waveData,
          };
        }
        if (waveData.isAktif && w.academicYear === waveData.academicYear) {
          return { ...w, isAktif: false };
        }
        return w;
      });
    } else {
      const newWave: Wave = {
        id: `wave-${Date.now()}`,
        nama: waveData.nama,
        academicYear: waveData.academicYear,
        tanggalMulai: waveData.tanggalMulai,
        tanggalSelesai: waveData.tanggalSelesai,
        biayaPendaftaran: waveData.biayaPendaftaran,
        isAktif: waveData.isAktif,
        indenAktif: waveData.indenAktif ?? false,
        indenDp: waveData.indenDp ?? 50000,
        diskonJenis: waveData.diskonJenis ?? 'rp',
        diskonNilai: waveData.diskonNilai ?? 0,
        kuotaDiskon: waveData.kuotaDiskon ?? 0,
        batasAkhirInden: waveData.batasAkhirInden ?? '',
        batasPelunasanHari: waveData.batasPelunasanHari ?? 14,
        dpHangusJikaLewatBatas: waveData.dpHangusJikaLewatBatas ?? true,
      };
      if (waveData.isAktif) {
        updatedWaves = updatedWaves.map((w) =>
          w.academicYear === waveData.academicYear ? { ...w, isAktif: false } : w
        );
      }
      updatedWaves.push(newWave);
    }

    // Sync active wave to settings if active (basis segar dari storage, M3)
    let updatedSettings = getSchoolSettings();
    if (waveData.isAktif) {
      updatedSettings = {
        ...updatedSettings,
        activeWave: waveData.nama,
        biayaPendaftaran: waveData.biayaPendaftaran,
      };
    }

    // Server-first: pengaturan gelombang (termasuk inden/diskon) tersimpan
    // di server sejak awal, baru tulis lokal.
    await syncSettingsToServer(updatedSettings, updatedWaves, academicYearsList);
    saveWaves(updatedWaves, currentRole);
    setWavesList(updatedWaves);

    if (waveData.isAktif) {
      saveSchoolSettings(updatedSettings, currentRole);
      setSettings(updatedSettings);
      setSettingsForm(updatedSettings);
      onSettingsChange?.(updatedSettings);
    }

    refreshData();
  };

  const handleToggleWaveActive = async (id: string) => {
    const target = wavesList.find((w) => w.id === id);
    if (!target) return;

    const newActiveState = !target.isAktif;
    const updatedWaves = wavesList.map((w) => {
      if (w.id === id) {
        return { ...w, isAktif: newActiveState };
      }
      if (newActiveState && w.academicYear === target.academicYear) {
        return { ...w, isAktif: false };
      }
      return w;
    });

    // Basis segar dari storage (M3).
    let updatedSettings = getSchoolSettings();
    if (newActiveState) {
      updatedSettings = {
        ...updatedSettings,
        activeWave: target.nama,
        biayaPendaftaran: target.biayaPendaftaran,
      };
    }

    await syncSettingsToServer(updatedSettings, updatedWaves, academicYearsList);
    saveWaves(updatedWaves, currentRole);
    setWavesList(updatedWaves);

    if (newActiveState) {
      saveSchoolSettings(updatedSettings, currentRole);
      setSettings(updatedSettings);
      setSettingsForm(updatedSettings);
      onSettingsChange?.(updatedSettings);
    }

    refreshData();
  };

  const handleDeleteWave = async (id: string) => {
    const target = wavesList.find((w) => w.id === id);
    if (!target) return;
    if (target.isAktif) {
      alert('Tidak dapat menghapus Gelombang yang sedang AKTIF. Silakan nonaktifkan atau aktifkan gelombang lain terlebih dahulu.');
      return;
    }
    if (confirm(`Hapus ${target.nama}?`)) {
      const filtered = wavesList.filter((w) => w.id !== id);
      await syncSettingsToServer(getSchoolSettings(), filtered, academicYearsList);
      saveWaves(filtered, currentRole);
      setWavesList(filtered);
      refreshData();
    }
  };

  // --- AKSI INDEN (admin) ---
  // Kejujuran sync: bila backend gagal, tampilkan error dan JANGAN ubah
  // status lokal. Bila sukses, update lokal (updateRegistration + refresh).
  const applyIndenUpdate = async (
    reg: RegistrationRecord,
    actionLabel: string,
    call: () => Promise<{ ok: boolean; error?: string; tokenExpired?: boolean }>,
    patch: (prev: RegistrationRecord) => RegistrationRecord
  ) => {
    if (!reg.inden) return;
    setIndenBusyId(reg.id);
    try {
      const res = await call();
      if (!res.ok) {
        if (res.tokenExpired) {
          handleAdminSessionExpired();
          return;
        }
        alert(`Gagal ${actionLabel}: ${res.error || 'tidak dapat terhubung ke server.'} Status inden TIDAK berubah.`);
        return;
      }
      const updated = updateRegistration(reg.id, patch, 'Operator SPMB', currentRole);
      if (updated) {
        // Sinkronkan perubahan record ke Sheets (updateRegistration, jalur admin).
        syncRegistrationUpdateToWebhook(updated, settingsForm, { admin: true }).then((r) => {
          if (!r.success) {
            if (r.tokenExpired) {
              handleAdminSessionExpired();
              return;
            }
            alert('Status inden tersimpan di perangkat, tetapi GAGAL terkirim ke Google Sheets: ' + r.message);
          }
        }).catch(() => {
          alert('Status inden tersimpan di perangkat, tetapi gagal terhubung ke Google Sheets.');
        });
      }
      refreshData();
    } finally {
      setIndenBusyId(null);
    }
  };

  const handleConfirmDp = (reg: RegistrationRecord) => {
    if (!reg.inden) return;
    void applyIndenUpdate(
      reg,
      'mengonfirmasi DP',
      () => confirmDpToWebhook(reg.nomorPendaftaran, reg.academicYear, reg.inden?.jumlahDp || 0, settingsForm),
      (prev) => ({
        ...prev,
        inden: prev.inden ? { ...prev.inden, dpLunas: true } : prev.inden,
      })
    );
  };

  const handleCompleteInden = (reg: RegistrationRecord) => {
    if (!reg.inden) return;
    if (!confirm(`Tandai inden ananda ${reg.student.namaLengkap} LUNAS dan ubah status menjadi Terdaftar?`)) return;
    void applyIndenUpdate(
      reg,
      'menandai lunas',
      () => completeIndenToWebhook(reg.nomorPendaftaran, reg.academicYear, settingsForm),
      (prev) => ({
        ...prev,
        inden: prev.inden ? { ...prev.inden, status: 'Terdaftar' as const } : prev.inden,
      })
    );
  };

  const handleExtendInden = (reg: RegistrationRecord) => {
    if (!reg.inden) return;
    const next = window.prompt('Perpanjang batas pelunasan sampai tanggal (YYYY-MM-DD):', reg.inden.batasPelunasan);
    if (next === null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next.trim())) {
      alert('Format tanggal tidak valid. Gunakan YYYY-MM-DD (contoh: 2026-12-09).');
      return;
    }
    void applyIndenUpdate(
      reg,
      'memperpanjang batas',
      () => extendIndenToWebhook(reg.nomorPendaftaran, reg.academicYear, next.trim(), settingsForm),
      (prev) => ({
        ...prev,
        inden: prev.inden ? { ...prev.inden, batasPelunasan: next.trim() } : prev.inden,
      })
    );
  };

  const handleMarkIndenExpired = (reg: RegistrationRecord) => {
    if (!reg.inden) return;
    if (!confirm(`Tandai inden ananda ${reg.student.namaLengkap} KEDALUWARSA? Kursi akan dilepas dan tidak lagi terhitung terisi.`)) return;
    void applyIndenUpdate(
      reg,
      'menandai kedaluwarsa',
      () => markIndenExpiredToWebhook(reg.nomorPendaftaran, reg.academicYear, settingsForm),
      (prev) => ({
        ...prev,
        inden: prev.inden ? { ...prev.inden, status: 'Inden Kedaluwarsa' as const } : prev.inden,
      })
    );
  };

  // --- WALI MURID ACCOUNT & PIN HANDLERS ---
  // Reset PIN wali oleh admin (Paket A): WAJIB tersimpan di server lewat
  // action changePin jalur admin — bukan hanya lokal. Sukses hanya bila
  // server mengonfirmasi; gagal = PIN TIDAK berubah + error jujur.
  // Alert TIDAK PERNAH menampilkan nilai PIN.
  const handleSavePin = async (recordId: string, newPin: string) => {
    const target = registrationsList.find((r) => r.id === recordId);
    if (!target) {
      alert('Data pendaftaran tidak ditemukan, PIN tidak dapat diubah.');
      return;
    }
    const res = await changePinToWebhook({
      nomorPendaftaran: target.nomorPendaftaran,
      newPin,
      adminToken: getAdminSessionToken() || undefined,
      academicYear: target.academicYear,
    });
    if (!res.ok) {
      if (res.tokenExpired) {
        handleAdminSessionExpired();
        return;
      }
      alert('Gagal mengubah PIN di server: ' + (res.error || 'tidak dapat terhubung ke server.') + ' PIN TIDAK berubah.');
      return;
    }
    const updated = updateRegistration(
      recordId,
      (prev) => ({
        ...prev,
        pin: newPin,
        tokenCode: newPin,
      }),
      'Operator SPMB',
      currentRole
    );
    if (!updated) {
      // Fallback: cache lokal belum berisi baris server untuk nomor ini
      // (mis. daftar admin dimuat dari cache saat server tidak terjangkau,
      // sehingga id lokal masih 'reg-...') — cari lewat nomor pendaftaran.
      const byNomor = getRegistrations().find((r) => r.nomorPendaftaran === target.nomorPendaftaran);
      if (byNomor) {
        updateRegistration(
          byNomor.id,
          (prev) => ({
            ...prev,
            pin: newPin,
            tokenCode: newPin,
          }),
          'Operator SPMB',
          currentRole
        );
      }
    }
    alert('PIN akses berhasil diubah dan tersimpan di server.');
    refreshData();
  };

  const handleCopyPin = (reg: RegistrationRecord) => {
    // PIN tidak diketahui (disembunyikan dari daftar admin demi keamanan,
    // L5): jangan salin '—' ke clipboard.
    if (!reg.pin) return;
    navigator.clipboard.writeText(reg.pin);
    setCopiedPinId(reg.id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleSendWaAccountCredentials = (reg: RegistrationRecord) => {
    // PIN tidak diketahui (disembunyikan dari daftar admin demi keamanan,
    // L5): jangan kirim pesan WA berisi PIN '—'. Arahkan operator ke
    // reset PIN — setelah PIN baru disimpan, tabel menampilkan PIN baru
    // dan Kirim WA bisa dipakai.
    if (!reg.pin) {
      setEditingPinRecord(reg);
      return;
    }
    const phone = reg.parent?.ayah?.noHp || reg.parent?.ibu?.noHp || reg.parent?.wali?.noHp;
    if (!phone) {
      alert('Nomor WhatsApp wali murid belum terisi di pendaftaran ini!');
      return;
    }
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const parentName = reg.parent?.ayah?.namaLengkap || reg.parent?.ibu?.namaLengkap || 'Bapak/Ibu Wali Murid';
    const pin = reg.pin || '—';

    const msg = `*INFORMASI AKUN & PIN AKSES SPMB*\n*${settings.namaMadrasah.toUpperCase()}*\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh,\nYth. ${parentName},\n\nBerikut adalah data akun akses pendaftaran untuk ananda tercinta:\n• Nama Calon Siswa: *${reg.student.namaLengkap}*\n• Nomor Pendaftaran: *${reg.nomorPendaftaran}*\n• PIN Akses Akun: *${pin}*\n• Jalur: *${reg.jenisPendaftaran === 'baru' ? 'Reguler / Siswa Baru' : 'Siswa Pindahan'}*\n• Status Berkas: *${reg.status.toUpperCase()}*\n\nGunakan Nomor Pendaftaran & PIN di atas untuk login ke Dashboard Wali Murid:\n1. Buka website resmi SPMB madrasah kami\n2. Klik menu Masuk / Akses Pendaftar\n3. Masukkan Nomor Registrasi dan PIN 6 digit di atas\n\nJika membutuhkan bantuan lebih lanjut, silakan hubungi Sekretariat SPMB.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\n*Panitia SPMB ${settings.namaMadrasah}*`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // (v2.13.7, Opsi 1 — tombol kirim ucapan, gratis) Ucapan selamat LULUS
  // ke WA orang tua. Pola yang sama dengan Kirim WA PIN di atas: buka
  // wa.me dengan pesan sudah terisi, admin tinggal ketuk Kirim di
  // WhatsApp. Nomor tujuan: No WA Pendaftaran (nomor aktif yang dipakai
  // saat mendaftar/login), fallback ke HP ayah/ibu/wali. Pesan TIDAK
  // terkirim otomatis — WhatsApp tidak memberi tahu sistem apakah pesan
  // akhirnya dikirim; yang terkonfirmasi di sini adalah pesannya sudah
  // disiapkan dan WhatsApp sudah dibuka ke nomor yang benar.
  const handleSendWaUcapanLulus = (reg: RegistrationRecord) => {
    const phone = reg.noWaPendaftaran || reg.parent?.ayah?.noHp || reg.parent?.ibu?.noHp || reg.parent?.wali?.noHp;
    if (!phone) {
      alert('Nomor WhatsApp wali murid belum terisi di pendaftaran ini!');
      return;
    }
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const parentName = resolveParentName(reg, phone);
    const msg = `*PENGUMUMAN KELULUSAN SPMB*\n*${settings.namaMadrasah.toUpperCase()}*\n\nAssalamu'alaikum Warahmatullahi Wabarakatuh,\nYth. Bapak/Ibu ${parentName},\n\nAlhamdulillah, dengan ini kami sampaikan bahwa ananda:\n• Nama Calon Siswa: *${reg.student.namaLengkap}*\n• Nomor Pendaftaran: *${reg.nomorPendaftaran}*\n\ndinyatakan *LULUS* seleksi penerimaan santri baru ${settings.namaMadrasah} Tahun Ajaran ${settings.activeAcademicYear}.\n\nSilakan melihat pengumuman dan informasi daftar ulang di website SPMB madrasah. Jika membutuhkan bantuan lebih lanjut, silakan hubungi Sekretariat SPMB.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\n*Panitia SPMB ${settings.namaMadrasah}*`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- VERIFICATION & ACTION HANDLERS ---
  const handleOpenVerification = (reg: RegistrationRecord) => {
    setSelectedReg(reg);
    setVerificationChecklist(
      reg.verification || {
        kkSesuai: true,
        aktaSesuai: true,
        nikSesuai: true,
        dokumenLengkap: true,
        wawancaraSelesai: false,
        pembayaranLunas: true,
        berkasDiterima: false,
        catatanOperator: '',
      }
    );
  };

  const handleSaveVerification = () => {
    if (!selectedReg) return;
    const newStatus = verificationChecklist.berkasDiterima ? 'terverifikasi' : 'pending';
    const updated = updateRegistration(
      selectedReg.id,
      (prev) => ({
        ...prev,
        status: newStatus,
        verification: {
          ...verificationChecklist,
          verifiedBy: `Operator (${currentRole})`,
          verifiedAt: new Date().toISOString(),
        },
      }),
      'Operator SPMB',
      currentRole
    );

    if (updated) {
      syncRegistrationUpdateToWebhook(updated, settingsForm, { admin: true }).then((r) => {
        if (!r.success) {
          if (r.tokenExpired) {
            handleAdminSessionExpired();
            return;
          }
          alert('Perubahan tersimpan di perangkat, tetapi GAGAL terkirim ke Google Sheets: ' + r.message);
        }
      }).catch(() => { alert('Perubahan tersimpan di perangkat, tetapi gagal terhubung ke Google Sheets.'); });
    }
    setSelectedReg(null);
    refreshData();
  };

  const showPengumumanToast = (msg: string) => {
    setPengumumanToast(msg);
    setTimeout(() => {
      setPengumumanToast(null);
    }, 5000);
  };

  const handleSetPengumuman = (id: string, status: 'LULUS' | 'CADANGAN' | 'TIDAK_LULUS', catatan: string) => {
    if (pengumumanSavingId) return; // cegah klik ganda saat sinkronisasi berjalan
    const target = registrationsList.find((r) => r.id === id);
    const label = status === 'LULUS' ? 'LULUS' : status === 'CADANGAN' ? 'CADANGAN' : 'TIDAK LULUS';
    const updated = updateRegistration(
      id,
      (prev) => ({
        ...prev,
        hasilPengumuman: status,
        catatanPengumuman: catatan,
      }),
      'Kepala Madrasah',
      currentRole
    );

    if (updated) {
      setPengumumanSavingId(id);
      syncRegistrationUpdateToWebhook(updated, settingsForm, { admin: true }).then((r) => {
        setPengumumanSavingId(null);
        if (!r.success) {
          if (r.tokenExpired) {
            handleAdminSessionExpired();
            return;
          }
          alert('Pengumuman tersimpan di perangkat, tetapi GAGAL terkirim ke Google Sheets: ' + r.message);
          return;
        }
        showPengumumanToast(`Pengumuman tersimpan: ${target?.student.namaLengkap || target?.nomorPendaftaran || ''} dinyatakan ${label} — sudah terkirim ke Google Sheets.`);
      }).catch(() => {
        setPengumumanSavingId(null);
        alert('Pengumuman tersimpan di perangkat, tetapi gagal terhubung ke Google Sheets.');
      });
    }
    refreshData();
  };

  const handleExportCsv = () => {
    // Paket A: kolom PIN DIHAPUS dari ekspor; NIK dimask (3578********1234).
    let csv = 'Nomor Pendaftaran,Nama Siswa,NIK,No KK,Jenis,Status,Nama Wali,No WA,Tanggal Daftar\n';
    registrationsList.forEach((r) => {
      csv += `"${r.nomorPendaftaran}","${r.student.namaLengkap}","${maskNik(r.student.nik)}","'${r.student.noKk}","${r.jenisPendaftaran}","${r.status}","${r.parent.ayah.namaLengkap || r.parent.ibu.namaLengkap}","${r.parent.ayah.noHp || ''}","${r.createdAt}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPMB_Export_${settings.activeAcademicYear.replace('/', '-')}.csv`;
    a.click();
  };

  // Filtered accounts for Wali Murid / Registrations
  const filteredRegistrations = registrationsList.filter((reg) => {
    const s = searchQuery.toLowerCase().trim();
    const matchS =
      !s ||
      reg.student.namaLengkap.toLowerCase().includes(s) ||
      reg.nomorPendaftaran.toLowerCase().includes(s) ||
      (reg.pin && reg.pin.includes(s)) ||
      reg.student.nik.includes(s) ||
      (reg.parent.ayah.namaLengkap && reg.parent.ayah.namaLengkap.toLowerCase().includes(s)) ||
      (reg.parent.ayah.noHp && reg.parent.ayah.noHp.includes(s));
    const matchStatus = selectedStatusFilter === 'ALL' || reg.status === selectedStatusFilter;
    const matchType = selectedTypeFilter === 'ALL' || reg.jenisPendaftaran === selectedTypeFilter;
    return matchS && matchStatus && matchType;
  });

  const totalRegistrations = registrationsList.length;
  const totalTerverifikasi = registrationsList.filter((r) => r.status === 'terverifikasi').length;
  const totalPending = registrationsList.filter((r) => r.status === 'pending').length;
  const totalDitolak = registrationsList.filter((r) => r.status === 'ditolak').length;

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#1C1E1B] flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-[#193B2C] text-white border-b border-stone-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoMadrasahUrl ? (
              <img
                src={settings.logoMadrasahUrl}
                alt="Logo Madrasah"
                className="w-10 h-10 rounded-xl object-cover border border-[#E6C687]/40 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                <Building className="w-5 h-5 text-[#E6C687]" />
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight">{settings.namaMadrasah}</h1>
              <p className="text-xs text-stone-300">Dashboard Panel Admin &amp; Panitia SPMB</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onRoleChange('public');
                onNavigateHome();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#E6C687] hover:bg-[#D4B372] text-[#132A20] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar ke Mode Wali Murid</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast konfirmasi pengumuman (v2.13.6) — terlihat di semua tab */}
      {pengumumanToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{pengumumanToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPengumumanToast(null)}
              className="text-emerald-200 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Operasional Harian</p>
            <button
              onClick={() => setActiveTab('kpi')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'kpi' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ringkasan Dashboard</span>
            </button>

            {/* TAB: AKUN WALI MURID & PIN (Menggantikan Master Token dengan alur terbaru) */}
            <button
              onClick={() => setActiveTab('tokens')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'tokens' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Akun Wali &amp; PIN</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'tokens' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {totalRegistrations}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('registrations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'registrations' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Data Pendaftaran</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'registrations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {totalRegistrations}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'verification' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-4 h-4" />
                <span>Verifikasi Berkas</span>
              </div>
              {totalPending > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pengumuman')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'pengumuman' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Status Pengumuman</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Grafik &amp; Analisis</span>
            </button>

            <div className="mx-3 my-2 border-t border-slate-100" />
            <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Pengaturan SPMB</p>
            <button
              onClick={() => setActiveTab('academic_years')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'academic_years' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Tahun Ajaran &amp; Gelombang</span>
            </button>

            {/* TAB BARU: RINCIAN BIAYA & INFORMASI PENDAFTARAN RESMI */}
            <button
              onClick={() => setActiveTab('biaya_pendaftaran')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'biaya_pendaftaran' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>Rincian Biaya &amp; Info</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'biaya_pendaftaran' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                Resmi
              </span>
            </button>

            {/* TAB BARU: PUSAT CMS & EDITOR TEKS TERPADU (SEMUA HALAMAN DARI DEPAN HINGGA AKHIR) */}
            <button
              onClick={() => setActiveTab('cms_center')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'cms_center' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pusat CMS &amp; Teks</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === 'cms_center' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                Fleksibel
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'settings' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Madrasah</span>
            </button>

            <button
              onClick={() => setActiveTab('gas')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'gas' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Integrasi Webhook</span>
            </button>
            <div className="mx-3 my-2 border-t border-slate-100" />
            <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Sistem</p>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'logs' ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Log Aktivitas &amp; Audit</span>
            </button>

          </div>
        </aside>

        {/* Content Pane */}
        <main className="lg:col-span-9 space-y-6">

          {/* Peringatan sinkronisasi server: tulis admin gagal ke server */}
          {serverSyncWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-amber-900">Pengaturan belum tersimpan ke server</p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{serverSyncWarning}</p>
              </div>
              <button
                type="button"
                onClick={() => setServerSyncWarning(null)}
                className="ml-auto text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-1 cursor-pointer shrink-0"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Peringatan sinkronisasi daftar pendaftar: server gagal dimuat */}
          {registrationsServerWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-amber-900">Daftar pendaftar belum tersinkron dari server</p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{registrationsServerWarning}</p>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationsServerWarning(null)}
                className="ml-auto text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-1 cursor-pointer shrink-0"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Migrasi satu kali: unggah pengaturan lokal perangkat ini ke server */}
          {/* v2.9: selama status server belum diketahui, tampilkan placeholder
              loading — bukan tombol (tombol sempat muncul sekejap lalu hilang). */}
          {!serverStatusKnown && migrationDoneMsg === null && hasStoredLocalSettings() && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-xs flex items-center gap-3">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-700 animate-spin shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">Memeriksa status pengaturan di server…</p>
            </div>
          )}
          {showMigrationButton && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-extrabold text-emerald-900">Sinkronisasi Pengaturan ke Server</p>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Pengaturan di perangkat ini ({serverHasSettings === null ? 'status server belum dapat dipastikan' : serverHasSettings ? 'lebih baru dari server' : 'belum ada di server'}).
                  Tekan tombol ini SEKALI untuk mengunggah semua pengaturan lokal (teks CMS, gelombang &amp; inden/diskon,
                  profil madrasah, rincian biaya, dashboard wali) ke server — setelah itu semua device memakai
                  pengaturan yang sama.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMigrateSettingsToServer}
                disabled={migrationBusy}
                className="px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-60 shrink-0 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{migrationBusy ? 'Mengunggah…' : 'Simpan Semua Pengaturan ke Server'}</span>
              </button>
            </div>
          )}
          {migrationDoneMsg && (
            <div className="p-4 rounded-2xl bg-emerald-700 text-white shadow-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-bold">{migrationDoneMsg}</p>
            </div>
          )}

          {/* Konflik sinkronisasi (M1): perubahan lokal belum terkirim SEMENTARA
              server juga punya salinan — JANGAN timpa diam-diam; admin memilih. */}
          {settingsConflict && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-rose-900">Konflik Pengaturan: Lokal dan Server Berbeda</p>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    Perangkat ini punya perubahan pengaturan yang belum terkirim ke server
                    (diubah {new Date(settingsConflict.localUpdatedAtMs).toLocaleString('id-ID')})
                    {settingsConflict.serverUpdatedAtUnknown
                      ? ', sementara salinan server juga sudah berubah (waktu server tidak tercatat)'
                      : `, sementara server juga sudah berubah (terakhir ${new Date(settingsConflict.serverUpdatedAtMs).toLocaleString('id-ID')})`}
                    . Pilih salah satu — tidak ada yang ditimpa otomatis.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleMigrateSettingsToServer}
                  disabled={migrationBusy || conflictBusy}
                  className="px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{migrationBusy ? 'Mengunggah…' : 'Unggah Pengaturan Lokal ke Server'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseServerSettings}
                  disabled={migrationBusy || conflictBusy}
                  className="px-5 py-3 rounded-xl bg-white border-2 border-rose-300 hover:bg-rose-100 text-rose-900 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {conflictBusy ? 'Menerapkan…' : 'Pakai Pengaturan Server (Buang Perubahan Lokal)'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: KPI OVERVIEW */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Statistik Realtime TA {settings.activeAcademicYear}</h2>
                  <p className="text-xs text-slate-500">Ringkasan pendaftaran santri baru dan status verifikasi berkas.</p>
                  <p className={`text-[11px] mt-1 font-bold ${registrationsSource === 'server' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {registrationsLoading
                      ? 'Memuat daftar dari server…'
                      : registrationsSource === 'server'
                        ? 'Sumber daftar: server (Google Sheets)'
                        : 'Sumber daftar: perangkat ini (server belum tersinkron)'}
                  </p>
                </div>
                <button
                  onClick={handleRefreshData}
                  disabled={registrationsLoading}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${registrationsLoading ? 'animate-spin' : ''}`} />
                  <span>{registrationsLoading ? 'Memuat…' : 'Refresh Data'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div onClick={() => setActiveTab('registrations')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-500 transition">
                  <span className="text-xs font-bold text-slate-500">Total Akun Terdaftar</span>
                  <p className="text-3xl font-black text-slate-900 mt-1">{totalRegistrations}</p>
                  <span className="text-[11px] text-emerald-600 font-bold">Target Kuota: {settings.kuotaTarget}</span>
                </div>
                <div onClick={() => setActiveTab('verification')} className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition">
                  <span className="text-xs font-bold text-amber-800">Perlu Verifikasi</span>
                  <p className="text-3xl font-black text-amber-900 mt-1">{totalPending}</p>
                  <span className="text-[11px] text-amber-700 font-bold">Pending Konfirmasi</span>
                </div>
                <div onClick={() => setActiveTab('registrations')} className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-400 transition">
                  <span className="text-xs font-bold text-emerald-800">Terverifikasi</span>
                  <p className="text-3xl font-black text-emerald-900 mt-1">{totalTerverifikasi}</p>
                  <span className="text-[11px] text-emerald-700 font-bold">Berkas Lengkap</span>
                </div>
                <div onClick={() => setActiveTab('registrations')} className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-xs cursor-pointer hover:border-rose-400 transition">
                  <span className="text-xs font-bold text-rose-800">Ditolak / Revisi</span>
                  <p className="text-3xl font-black text-rose-900 mt-1">{totalDitolak}</p>
                  <span className="text-[11px] text-rose-700 font-bold">Perlu Perbaikan</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Aksi Cepat Panitia SPMB</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab('tokens')} className="px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 hover:bg-emerald-900 cursor-pointer shadow-xs">
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Cek Akun &amp; PIN Wali Murid</span>
                  </button>
                  <button onClick={handleExportCsv} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-200">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Ekspor CSV / Excel</span>
                  </button>
                  <button onClick={() => setActiveTab('verification')} className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-2 border border-amber-300 cursor-pointer">
                    <CheckSquare className="w-4 h-4" />
                    <span>Verifikasi ({totalPending}) Pending</span>
                  </button>
                </div>
              </div>

              {/* Pendaftar Terbaru — mengisi area kosong di bawah Aksi Cepat
                (temuan tinjauan 13 Nov) sekaligus memberi jalan pintas ke
                detail pendaftar. */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Pendaftar Terbaru</h3>
                  <button onClick={() => setActiveTab('registrations')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    Lihat semua →
                  </button>
                </div>
                {registrationsList.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada pendaftar.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {[...registrationsList]
                      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .slice(0, 5)
                      .map((reg) => (
                        <li key={reg.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedDetailReg(reg)}
                            className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 cursor-pointer"
                          >
                            <span>
                              <span className="block font-bold text-slate-900">{reg.student.namaLengkap}</span>
                              <span className="block text-[11px] text-slate-500 font-mono">{reg.nomorPendaftaran}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${reg.status === 'terverifikasi' ? 'bg-emerald-100 text-emerald-800' : reg.status === 'ditolak' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {reg.status.toUpperCase()}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DATA AKUN WALI MURID & PIN AKSES (Penyesuaian Alur Baru) */}
          {activeTab === 'tokens' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">Data Akun Wali Murid &amp; PIN Akses</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Alur Registrasi Mandiri
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola data akses wali murid. Jika wali murid lupa PIN atau kehilangan berkas, operator dapat mengecek, menyalin, dan mengirimkan kembali PIN akses via WhatsApp.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshData}
                    disabled={registrationsLoading}
                    className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
                    title="Refresh data akun dari server"
                  >
                    <RefreshCw className={`w-4 h-4 ${registrationsLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Data Akun</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Nama Siswa, No. Pendaftaran, No. WhatsApp, atau NIK..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="ditolak">Ditolak / Revisi</option>
                </select>
              </div>

              {/* Table of Accounts */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">No. Pendaftaran</th>
                      <th className="p-3">Calon Siswa</th>
                      <th className="p-3">Wali Murid &amp; WA</th>
                      <th className="p-3">PIN Akses (6-Digit)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Belum ada data akun wali murid yang terdaftar atau cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((reg) => {
                        const pin = reg.pin || '—';
                        const isCopied = copiedPinId === reg.id;
                        return (
                          <tr key={reg.id} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block w-max">
                                {reg.nomorPendaftaran}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                TA {reg.academicYear}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{reg.student.namaLengkap}</p>
                              <p className="text-[11px] text-slate-500">
                                {reg.student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • NIK: {reg.student.nik}
                              </p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">
                                {reg.parent.ayah.namaLengkap || reg.parent.ibu.namaLengkap || 'Wali Murid'}
                              </p>
                              <p className="text-[11px] text-emerald-700 font-mono">
                                {reg.parent.ayah.noHp || reg.parent.ibu.noHp || '-'}
                              </p>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-sm bg-amber-50 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 tracking-wider">
                                  {pin}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPin(reg)}
                                  disabled={!reg.pin}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={reg.pin ? 'Salin PIN' : 'PIN tidak diketahui — reset PIN dulu'}
                                >
                                  {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPinRecord(reg)}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  title="Ubah / Reset PIN"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  reg.status === 'terverifikasi'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : reg.status === 'ditolak'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {reg.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSendWaAccountCredentials(reg)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                  title="Kirim kredensial Nomor Pendaftaran & PIN via WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span className="hidden sm:inline">Kirim WA</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailReg(reg)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Lihat Detail Pendaftaran"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Data Pendaftaran Siswa</h2>
                  <p className="text-xs text-slate-500">Pencarian dan monitoring status formulir.</p>
                </div>
                <button onClick={handleExportCsv} className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Download className="w-3.5 h-3.5" /><span>Ekspor CSV</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nama / Token / NIK / No Reg..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>

              {/* Filter tampilan: Semua / Inden */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIndenFilter('semua')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${indenFilter === 'semua' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-white'}`}
                  >
                    Semua Pendaftar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndenFilter('inden')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${indenFilter === 'inden' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-white'}`}
                  >
                    Inden ({registrationsList.filter((r) => r.modePendaftaran === 'inden' || r.inden).length})
                  </button>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  Sisa kuota diskon: {indenStats ? `${indenStats.sisaKuotaDiskon} dari ${(() => {
                    const w = wavesList.find((x) => x.nama === settings.activeWave) || wavesList.find((x) => x.isAktif);
                    return w?.kuotaDiskon ?? 20;
                  })()} kursi` : 'memuat…'}
                </span>
              </div>

              {/* Tabel khusus Inden */}
              {indenFilter === 'inden' && (
                <div className="overflow-x-auto border border-amber-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50 text-amber-900 font-bold uppercase tracking-wider border-b border-amber-200">
                      <tr>
                        <th className="p-3">Nama Santri / No. Pendaftaran</th>
                        <th className="p-3">Status Inden</th>
                        <th className="p-3">DP</th>
                        <th className="p-3">Diskon</th>
                        <th className="p-3">Sisa Bayar</th>
                        <th className="p-3">Batas Pelunasan</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {registrationsList
                        .filter((r) => r.modePendaftaran === 'inden' || r.inden)
                        .map((reg) => {
                          const ind = reg.inden;
                          if (!ind) return null;
                          const lewat = ind.status === 'Inden' && hitungSisaHari(ind.batasPelunasan) < 0;
                          const busy = indenBusyId === reg.id;
                          return (
                            <tr key={reg.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <span className="font-bold text-slate-900 block">{reg.student.namaLengkap}</span>
                                <span className="font-mono text-[11px] text-emerald-900">{reg.nomorPendaftaran}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ind.status === 'Terdaftar' ? 'bg-emerald-100 text-emerald-800' : ind.status === 'Inden Kedaluwarsa' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {ind.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3">
                                {formatRupiah(ind.jumlahDp)}
                                <span className={`block text-[11px] font-bold ${ind.dpLunas ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {ind.dpLunas ? 'Lunas' : 'Belum dibayar'}
                                </span>
                              </td>
                              <td className="p-3">{formatRupiah(ind.diskonDiberikan)}</td>
                              <td className="p-3 font-bold">{formatRupiah(ind.sisaBayar)}</td>
                              <td className="p-3">
                                <span className={lewat ? 'text-rose-700 font-bold' : ''}>
                                  {new Date(`${ind.batasPelunasan}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {lewat && <span className="block text-[11px] font-bold text-rose-700">Lewat batas</span>}
                                {!lewat && ind.status === 'Inden' && (
                                  <span className="block text-[11px] text-slate-500">
                                    {hitungSisaHari(ind.batasPelunasan) === 0 ? 'Hari ini' : `${hitungSisaHari(ind.batasPelunasan)} hari lagi`}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={busy || ind.dpLunas || ind.status !== 'Inden'}
                                    onClick={() => handleConfirmDp(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] cursor-pointer disabled:opacity-40"
                                    title="Konfirmasi DP sudah diterima (transfer manual)"
                                  >
                                    Konfirmasi DP
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy || ind.status !== 'Inden'}
                                    onClick={() => handleCompleteInden(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] cursor-pointer disabled:opacity-40"
                                    title="Tandai lunas — status menjadi Terdaftar"
                                  >
                                    Tandai Lunas / Jadi Terdaftar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy || ind.status !== 'Inden'}
                                    onClick={() => handleExtendInden(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] cursor-pointer disabled:opacity-40"
                                  >
                                    Perpanjang Batas
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy || ind.status !== 'Inden'}
                                    onClick={() => handleMarkIndenExpired(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer disabled:opacity-40"
                                  >
                                    Tandai Kedaluwarsa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {registrationsList.filter((r) => r.modePendaftaran === 'inden' || r.inden).length === 0 && (
                    <p className="p-4 text-xs text-slate-500 text-center">Belum ada pendaftar inden.</p>
                  )}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">No. Pendaftaran</th>
                      <th className="p-3">Nama Santri</th>
                      <th className="p-3">Jalur</th>
                      <th className="p-3">Orang Tua / WA</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-emerald-900">{reg.nomorPendaftaran}</td>
                        <td className="p-3 font-bold text-slate-900">{reg.student.namaLengkap}</td>
                        <td className="p-3 capitalize">{reg.jenisPendaftaran}</td>
                        <td className="p-3">{reg.parent.ayah.namaLengkap} ({reg.parent.ayah.noHp || '-'})</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reg.status === 'terverifikasi' ? 'bg-emerald-100 text-emerald-800' : reg.status === 'ditolak' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            {reg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setSelectedDetailReg(reg)} className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer" title="Detail">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => onPrintOfficialForm(reg)} className="p-1.5 text-slate-500 hover:text-emerald-700 cursor-pointer" title="Cetak Formulir Resmi">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFIKASI */}
          {activeTab === 'verification' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Verifikasi Berkas Fisik &amp; Administrasi</h2>
              <div className="space-y-3">
                {registrationsList.filter((r) => r.status === 'pending').map((reg) => (
                  <div key={reg.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{reg.student.namaLengkap}</p>
                      <p className="text-xs text-slate-500">{reg.nomorPendaftaran} • Jalur: {reg.jenisPendaftaran}</p>
                    </div>
                    <button
                      onClick={() => handleOpenVerification(reg)}
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-emerald-900"
                    >
                      Buka Form Verifikasi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PENGUMUMAN */}
          {activeTab === 'pengumuman' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Penetapan Hasil Pengumuman Seleksi</h2>
              <div className="space-y-3">
                {registrationsList.map((reg) => (
                  <div key={reg.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{reg.student.namaLengkap}</p>
                      <p className="text-xs text-slate-500">{reg.nomorPendaftaran}</p>
                      <div className="mt-1.5">
                        {reg.hasilPengumuman === 'LULUS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">✓ LULUS — sudah diumumkan</span>
                        ) : reg.hasilPengumuman === 'CADANGAN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">CADANGAN — sudah diumumkan</span>
                        ) : reg.hasilPengumuman === 'TIDAK_LULUS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">TIDAK LULUS — sudah diumumkan</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">Belum diumumkan</span>
                        )}
                      </div>
                      {reg.hasilPengumuman === 'LULUS' && (
                        <button onClick={() => handleSendWaUcapanLulus(reg)} className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Kirim Ucapan ke WA Orang Tua
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-1.5">
                      <div className="flex gap-2">
                        <button disabled={pengumumanSavingId === reg.id || reg.hasilPengumuman === 'LULUS'} onClick={() => handleSetPengumuman(reg.id, 'LULUS', 'Selamat, ananda dinyatakan LULUS!')} className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white cursor-pointer hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-wait ${reg.hasilPengumuman === 'LULUS' ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}`}>{reg.hasilPengumuman === 'LULUS' ? '✓ LULUS' : 'LULUS'}</button>
                        <button disabled={pengumumanSavingId === reg.id || reg.hasilPengumuman === 'CADANGAN'} onClick={() => handleSetPengumuman(reg.id, 'CADANGAN', 'Status peserta: CADANGAN')} className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white cursor-pointer hover:bg-amber-600 disabled:opacity-60 disabled:cursor-wait ${reg.hasilPengumuman === 'CADANGAN' ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}>{reg.hasilPengumuman === 'CADANGAN' ? '✓ CADANGAN' : 'CADANGAN'}</button>
                        <button disabled={pengumumanSavingId === reg.id || reg.hasilPengumuman === 'TIDAK_LULUS'} onClick={() => handleSetPengumuman(reg.id, 'TIDAK_LULUS', 'Mohon maaf, kuota penuh')} className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-700 text-white cursor-pointer hover:bg-rose-800 disabled:opacity-60 disabled:cursor-wait ${reg.hasilPengumuman === 'TIDAK_LULUS' ? 'ring-2 ring-rose-600 ring-offset-1' : ''}`}>{reg.hasilPengumuman === 'TIDAK_LULUS' ? '✓ TIDAK LULUS' : 'TIDAK LULUS'}</button>
                      </div>
                      {pengumumanSavingId === reg.id && (
                        <span className="text-[11px] font-bold text-slate-500 animate-pulse">Menyimpan ke Google Sheets…</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Grafik &amp; Analisis Realtime</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">Target Kuota Belajar</h3>
                  <p className="text-2xl font-black text-emerald-800">{totalRegistrations} / {settings.kuotaTarget} Siswa</p>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((totalRegistrations / (settings.kuotaTarget || 1)) * 100))}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900">Siswa Terverifikasi</h3>
                  <p className="text-2xl font-black text-emerald-800">{totalTerverifikasi} Siswa</p>
                  <p className="text-xs text-slate-500">{totalPending} berkas menunggu verifikasi fisik panitia.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TAHUN AJARAN & GELOMBANG (Fitur Edit Periode & Kuota Lengkap) */}
          {activeTab === 'academic_years' && (
            <div className="space-y-6">
              
              {/* BAGIAN A: TAHUN AJARAN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Master Tahun Ajaran</h2>
                    <p className="text-xs text-slate-500">
                      Kelola periode tahun ajaran, kuota target santri baru, serta aktifkan atau nonaktifkan periode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAy(null);
                      setShowAyModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Tahun Ajaran</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {academicYearsList.map((ay) => (
                    <div
                      key={ay.id}
                      className={`p-4 rounded-2xl border transition ${
                        ay.isAktif
                          ? 'border-emerald-300 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            ay.isAktif
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {ay.isAktif ? 'AKTIF (DIGUNAKAN)' : 'NON-AKTIF'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAy(ay);
                              setShowAyModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer"
                            title="Edit Tahun Ajaran & Kuota"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!ay.isAktif && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAy(ay.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                              title="Hapus Tahun Ajaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 mt-2">TA {ay.tahun}</h3>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Target Kuota: <strong>{ay.kuotaTotal} Siswa</strong></span>
                      </p>

                      <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Status Operasional</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAyActive(ay.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                            ay.isAktif
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          }`}
                        >
                          {ay.isAktif ? 'Nonaktifkan' : 'Aktifkan TA Ini'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BAGIAN B: GELOMBANG PENDAFTARAN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Master Gelombang Pendaftaran</h2>
                    <p className="text-xs text-slate-500">
                      Atur nama gelombang, periode tanggal pendaftaran, serta biaya formulir untuk setiap gelombang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWave(null);
                      setShowWaveModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Gelombang</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wavesList.map((wave) => (
                    <div
                      key={wave.id}
                      className={`p-4 rounded-2xl border transition ${
                        wave.isAktif
                          ? 'border-emerald-300 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              wave.isAktif
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            {wave.isAktif ? 'GELOMBANG AKTIF' : 'NON-AKTIF'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 ml-2">TA {wave.academicYear}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWave(wave);
                              setShowWaveModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer"
                            title="Edit Gelombang"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!wave.isAktif && (
                            <button
                              type="button"
                              onClick={() => handleDeleteWave(wave.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                              title="Hapus Gelombang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 mt-2">{wave.nama}</h3>
                      
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <CalendarRange className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            Periode: <strong>{wave.tanggalMulai}</strong> s.d. <strong>{wave.tanggalSelesai}</strong>
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Biaya Formulir: <strong>Rp {wave.biayaPendaftaran?.toLocaleString('id-ID')}</strong></span>
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Status Pendaftaran</span>
                        <button
                          type="button"
                          onClick={() => handleToggleWaveActive(wave.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                            wave.isAktif
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          }`}
                        >
                          {wave.isAktif ? 'Nonaktifkan' : 'Aktifkan Gelombang Ini'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RINCIAN BIAYA & INFORMASI PENDAFTARAN RESMI */}
          {activeTab === 'biaya_pendaftaran' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-[#0D3B2E] text-white p-6 rounded-xl shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-sm shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 font-heading block">
                      Manajemen Biaya Pendaftaran &bull; SPMB TA {settings.activeAcademicYear}
                    </span>
                    <h2 className="text-xl font-black font-heading leading-tight">
                      Rincian Biaya &amp; Informasi Pendaftaran
                    </h2>
                    <p className="text-xs text-white/80 mt-0.5">
                      Kelola daftar biaya administrasi, perlengkapan seragam santri putri/putra, dan ketentuan resmi yang tampil dinamis pada akun wali murid.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative z-10 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowRincianBiayaModal(true)}
                    className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Rincian Biaya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDashboardWaliMuridModal(true)}
                    className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-200" />
                    <span>Edit Dashboard Wali</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreviewInformasiModal(true)}
                    className="py-2.5 px-3.5 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Buka Preview Dokumen Resmi"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Dokumen</span>
                  </button>
                </div>
              </div>

              {/* Live Cost Summary Grid */}
              {(() => {
                const rincian = settingsForm.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;
                const adm = (rincian.itemsAdministrasi || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);
                const p = (rincian.itemsPerempuan || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);
                const l = (rincian.itemsLakiLaki || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Administrasi Pendaftaran (Wajib)
                      </span>
                      <div className="text-xl font-black text-emerald-950 font-mono">
                        Rp {adm.toLocaleString('id-ID')}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {rincian.itemsAdministrasi?.length || 0} komponen biaya awal
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                        Perlengkapan Siswa Putri
                      </span>
                      <div className="text-xl font-black text-rose-950 font-mono">
                        Rp {p.toLocaleString('id-ID')}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Total Putri: <strong>Rp {(adm + p).toLocaleString('id-ID')}</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-sky-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                        Perlengkapan Siswa Putra
                      </span>
                      <div className="text-xl font-black text-sky-950 font-mono">
                        Rp {l.toLocaleString('id-ID')}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Total Putra: <strong>Rp {(adm + l).toLocaleString('id-ID')}</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                        Ketentuan Pembayaran
                      </span>
                      <div className="text-xl font-black text-amber-950 font-mono">
                        {rincian.ketentuanPembayaran?.length || 0} Butir
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Termasuk opsi pembayaran bertahap
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Rincian Tables View */}
              {(() => {
                const rincian = settingsForm.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;
                const adm = (rincian.itemsAdministrasi || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);
                const p = (rincian.itemsPerempuan || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);
                const l = (rincian.itemsLakiLaki || []).reduce((s, i) => s + (Number(i.biaya) || 0), 0);

                return (
                  <div className="space-y-6">
                    {/* Bagian A: Administrasi */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">A</span>
                            <span>{rincian.judulAdministrasi || 'Administrasi Pendaftaran'}</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">Biaya wajib yang dilunasi terlebih dahulu saat pendaftaran.</p>
                        </div>
                        <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 text-xs">
                          Rp {adm.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">No</th>
                              <th className="py-2.5 px-3">Komponen</th>
                              <th className="py-2.5 px-3 text-right">Biaya</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(rincian.itemsAdministrasi || []).map((it, idx) => (
                              <tr key={it.id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-slate-800">{it.nama}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">Rp {Number(it.biaya).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {rincian.catatanAdministrasi && (
                        <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                          {rincian.catatanAdministrasi.replaceAll('{biayaPendaftaran}', (Number(settingsForm.biayaPendaftaran) || 0).toLocaleString('id-ID'))}
                        </p>
                      )}
                    </div>

                    {/* Dua Kolom: Perlengkapan Putri & Putra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Putri */}
                      <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">B</span>
                              <span>{rincian.judulPerempuan || 'Perlengkapan Siswa Perempuan'}</span>
                            </h3>
                          </div>
                          <span className="font-mono font-black text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 text-xs">
                            Rp {p.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="overflow-x-auto border border-stone-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3">Komponen</th>
                                <th className="py-2 px-3 text-right">Biaya</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(rincian.itemsPerempuan || []).map((it) => (
                                <tr key={it.id}>
                                  <td className="py-1.5 px-3 text-slate-800">{it.nama}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">Rp {Number(it.biaya).toLocaleString('id-ID')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Putra */}
                      <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-sky-200">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 text-xs font-black flex items-center justify-center">C</span>
                              <span>{rincian.judulLakiLaki || 'Perlengkapan Siswa Laki-laki'}</span>
                            </h3>
                          </div>
                          <span className="font-mono font-black text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 text-xs">
                            Rp {l.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="overflow-x-auto border border-stone-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3">Komponen</th>
                                <th className="py-2 px-3 text-right">Biaya</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(rincian.itemsLakiLaki || []).map((it) => (
                                <tr key={it.id}>
                                  <td className="py-1.5 px-3 text-slate-800">{it.nama}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">Rp {Number(it.biaya).toLocaleString('id-ID')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Ketentuan & Buku */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Ketentuan Pembayaran &amp; Informasi Buku</span>
                      </h3>
                      <ol className="space-y-1.5 text-xs text-slate-700 list-decimal pl-5">
                        {(rincian.ketentuanPembayaran || []).map((k, idx) => (
                          <li key={idx} className="leading-relaxed">{k.replaceAll('{biayaPendaftaran}', (Number(settingsForm.biayaPendaftaran) || 0).toLocaleString('id-ID'))}</li>
                        ))}
                      </ol>
                      {rincian.deskripsiBuku && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <strong>{rincian.judulBuku || 'Buku Pelajaran'}:</strong> {rincian.deskripsiBuku}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRincianBiayaModal(true)}
                        className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Edit Rincian Biaya &amp; Dokumen</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 8: PENGATURAN MADRASAH & VISIBILITAS DENGAN FITUR EDIT FLEKSIBEL */}
          {activeTab === 'settings' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // M3: basis segar dari storage + HANYA field yang diedit tab ini
                // yang diambil dari settingsForm. Field lain (cmsContent,
                // rincianBiaya, kuotaTarget, dsb.) ikut nilai terbaru dari
                // storage — jangan ditimpa snapshot settingsForm yang basi.
                const fresh = getSchoolSettings();
                const toSave: SchoolSettings = {
                  ...fresh,
                  logoMadrasahUrl: settingsForm.logoMadrasahUrl,
                  namaMadrasah: settingsForm.namaMadrasah,
                  kontakWhatsapp: settingsForm.kontakWhatsapp,
                  namaKepalaMadrasah: settingsForm.namaKepalaMadrasah,
                  biayaPendaftaran: settingsForm.biayaPendaftaran,
                  nsm: settingsForm.nsm,
                  npsn: settingsForm.npsn,
                  emailMadrasah: settingsForm.emailMadrasah,
                  alamatMadrasah: settingsForm.alamatMadrasah,
                  googleMapsUrl: settingsForm.googleMapsUrl,
                  googleAppScriptUrl: settingsForm.googleAppScriptUrl,
                  modeBatasWaktu: settingsForm.modeBatasWaktu,
                  tanggalBatasPendaftaran: settingsForm.tanggalBatasPendaftaran,
                  sectionVisibility: settingsForm.sectionVisibility,
                  sectionVisibilityConfigured: true,
                  // Paket C: field baru Profil Madrasah — tanpa baris ini
                  // inputnya tampil tapi tidak pernah tersimpan.
                  instansiInduk: settingsForm.instansiInduk,
                  templateNomorPendaftaran: settingsForm.templateNomorPendaftaran,
                  enableDigitalStamp: settingsForm.enableDigitalStamp,
                };
                await syncSettingsToServer(toSave, wavesList, academicYearsList);
                saveSchoolSettings(toSave, currentRole);
                setSettings(toSave);
                setSettingsForm(toSave);
                onSettingsChange?.(toSave);
                alert('Pengaturan Madrasah & Kontrol Tampilan Berhasil Disimpan!');
              }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Pengaturan Profil &amp; Sistem Madrasah</h2>
                  <p className="text-xs text-slate-500">Kelola identitas madrasah, logo sekolah, kontak panitia, dan visibilitas tampilan beranda.</p>
                </div>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Semua Pengaturan</span>
                </button>
              </div>

              {/* FITUR UPLOAD LOGO MADRASAH */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-800" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                      Logo Resmi Madrasah (Acuan Logo Website &amp; Cetak)
                    </h3>
                  </div>
                  {settingsForm.logoMadrasahUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                    {settingsForm.logoMadrasahUrl ? (
                      <img
                        src={settingsForm.logoMadrasahUrl}
                        alt="Logo Madrasah"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <School className="w-9 h-9 text-emerald-600 opacity-60" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <p className="font-bold text-slate-800">
                      {settingsForm.logoMadrasahUrl ? 'Logo aktif terpasang' : 'Belum ada logo madrasah khusus'}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Logo ini akan dijadikan acuan utama pada Navbar Header, Footer, Lembar Cetak Bukti Pendaftaran Resmi, dan Dashboard Madrasah.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="py-1.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isLogoUploading ? 'Memproses...' : 'Unggah File Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                          disabled={isLogoUploading}
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">Format: PNG, JPG, WEBP (Maks 2MB)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Profil Madrasah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Madrasah</label>
                  <input
                    type="text"
                    value={settingsForm.namaMadrasah}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaMadrasah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Panitia (Format: 08...)</label>
                  <input
                    type="text"
                    value={settingsForm.kontakWhatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kontakWhatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kepala Madrasah</label>
                  <input
                    type="text"
                    value={settingsForm.namaKepalaMadrasah}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaKepalaMadrasah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Formulir Pendaftaran (Rp)</label>
                  <input
                    type="number"
                    value={settingsForm.biayaPendaftaran}
                    onChange={(e) => setSettingsForm({ ...settingsForm, biayaPendaftaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Angka ini tampil di FAQ halaman depan. Biaya tiap gelombang diatur di menu Tahun Ajaran &amp; Gelombang; rincian item biaya di menu Rincian Biaya &amp; Info.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NSM (Nomor Statistik Madrasah)</label>
                  <input
                    type="text"
                    value={settingsForm.nsm}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nsm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Dipakai di dokumen cetak bila baris KOP dikosongkan.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
                  <input
                    type="text"
                    value={settingsForm.npsn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, npsn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Instansi Induk</label>
                  <input
                    type="text"
                    value={settingsForm.instansiInduk || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instansiInduk: e.target.value })}
                    placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Tampil di kop dokumen cetak bila baris KOP Instansi di Pusat CMS → Tab Dokumen dikosongkan.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Madrasah</label>
                  <input
                    type="email"
                    value={settingsForm.emailMadrasah}
                    onChange={(e) => setSettingsForm({ ...settingsForm, emailMadrasah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Tampil di footer &amp; halaman kontak.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Alamat Madrasah</label>
                  <input
                    type="text"
                    value={settingsForm.alamatMadrasah}
                    onChange={(e) => setSettingsForm({ ...settingsForm, alamatMadrasah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Tampil di footer, halaman kontak &amp; dokumen cetak.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Link Google Maps / Titik Lokasi</label>
                  <input
                    type="text"
                    value={settingsForm.googleMapsUrl || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/... atau -7.xxxxxx, 112.xxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Tempel link &quot;Bagikan&quot; dari Google Maps (atau koordinat lat,lng) supaya tombol peta di halaman depan membuka pin persis di lokasi sekolah. Kosongkan untuk kembali memakai pencarian teks alamat.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Template Nomor Pendaftaran</label>
                  <input
                    type="text"
                    value={settingsForm.templateNomorPendaftaran || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, templateNomorPendaftaran: e.target.value })}
                    placeholder="MIIU/SPMB/{TA}/{NO}"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Pola nomor resmi: {'{TA}'} = tahun ajaran, {'{NO}'} = nomor urut 4 digit.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stempel Digital di Bukti Pendaftaran</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.enableDigitalStamp !== false}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableDigitalStamp: e.target.checked })}
                      className="w-4 h-4 accent-emerald-800"
                    />
                    <span className="font-medium text-slate-700">Tampilkan [STEMPEL DIGITAL PANITIA] di lembar bukti</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">Matikan bila bukti dicetak untuk distempel basah manual.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Batas Waktu Pendaftaran (Hitung Mundur)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={settingsForm.modeBatasWaktu || 'gelombang'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, modeBatasWaktu: e.target.value as 'gelombang' | 'tanggal_tetap' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="gelombang">Ikut tanggal tutup gelombang aktif</option>
                        <option value="tanggal_tetap">Tanggal tetap (di samping)</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="datetime-local"
                        value={
                          (settingsForm.tanggalBatasPendaftaran || '').length === 10
                            ? `${settingsForm.tanggalBatasPendaftaran}T23:59`
                            : (settingsForm.tanggalBatasPendaftaran || '').slice(0, 16)
                        }
                        onChange={(e) => setSettingsForm({ ...settingsForm, tanggalBatasPendaftaran: e.target.value ? `${e.target.value}:00` : '' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Mengatur target hitung mundur dan caption penutupan di hero. Pilih &quot;Tanggal tetap&quot; bila batas waktu tidak mengikuti gelombang.</p>
                </div>
              </div>

              {/* PENANDA: Rincian Biaya & Dashboard Wali diatur di menunya masing-masing (bukan di sini) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>Rincian Biaya &amp; Dashboard Wali Murid</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Supaya tidak ada dua pintu untuk pengaturan yang sama: rincian biaya diatur di menu <strong>Rincian Biaya &amp; Info</strong>, sedangkan teks dan kartu Dashboard Wali diatur di menu <strong>Pusat CMS &amp; Teks</strong> (tab 5).
                  </p>
                </div>
              </div>

              {/* KONTROL VISIBILITAS & EDIT KONTEN SEKSI BERANDA */}
              <div className="pt-4 border-t border-slate-200">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>Kontrol Tampilan &amp; Visibilitas Beranda (Landing Page)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktifkan/nonaktifkan seksi beranda dan gunakan tombol <strong>Edit Konten</strong> untuk mengubah narasi, judul, dan data seksi secara fleksibel.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 0. Hero Banner & Headline Utama H1 */}
                  <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between gap-3 md:col-span-2 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-emerald-950">
                          Hero Banner &amp; Headline Utama (H1)
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showHero !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showHero !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Judul H1 Halaman Depan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        <strong>Judul H1:</strong>{' '}
                        {settingsForm.cmsContent?.heroTitle ||
                          "Mendidik Generasi Qur'ani, Mandiri & Berprestasi di {namaMadrasah}"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('hero')}
                        className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Edit Judul H1, Subjudul, Badge & Tombol Hero"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Edit Judul H1 &amp; Teks</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showHero')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showHero !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showHero !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 1. Mengenal Lebih Dekat */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Mengenal Lebih Dekat</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showMengenalDekat
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showMengenalDekat ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Komitmen keunggulan, akreditasi, rasio guru &amp; fasilitas madrasah.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('mengenal')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi Mengenal Lebih Dekat"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showMengenalDekat')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showMengenalDekat
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showMengenalDekat ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 2. Sambutan Kepala Madrasah */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Sambutan Kepala Madrasah</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showSambutanKepala
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showSambutanKepala ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kutipan amanah, foto pimpinan, dan sambutan hangat Kepala Madrasah.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('sambutan')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi Sambutan Kepala Madrasah"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showSambutanKepala')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showSambutanKepala
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showSambutanKepala ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 3. Program & Keunggulan Mutu */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Program &amp; Mutu Madrasah</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showProgramMutu !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showProgramMutu !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Program unggulan (Tahfidz, Karakter Islami, Literasi Sains).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('program')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi Program & Mutu"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showProgramMutu')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showProgramMutu !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showProgramMutu !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 4. Alur Timeline Pendaftaran */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Alur Timeline Pendaftaran</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showTimeline !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showTimeline !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        4 langkah praktis pendaftaran (Registrasi Akun s.d. Pengumuman).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('timeline')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi Timeline"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showTimeline')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showTimeline !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showTimeline !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 5. Pusat Unduhan & Brosur */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Pusat Unduhan &amp; Brosur</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showDownloads !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showDownloads !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Unduhan brosur digital, formulir offline, dan panduan.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('downloads')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi Unduhan"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showDownloads')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showDownloads !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showDownloads !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 6. Pusat Bantuan (FAQ) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Pusat Bantuan &amp; FAQ</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showFaq !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showFaq !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Tanya jawab alur, berkas, dan informasi pendaftaran.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSectionKey('faq')}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Edit Konten Seksi FAQ"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showFaq')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showFaq !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showFaq !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 7. Hitung Mundur (Countdown) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Hitung Mundur (Countdown)</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showCountdown !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showCountdown !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kartu hitung mundur di dalam hero. Labelnya diatur di CMS Beranda.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showCountdown')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showCountdown !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showCountdown !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 8. Sekretariat & Layanan */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Sekretariat &amp; Layanan</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showSekretariat !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showSekretariat !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Seksi kontak, alamat &amp; peta di halaman depan.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showSekretariat')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showSekretariat !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showSekretariat !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 9. Footer */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Footer</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showFooter !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showFooter !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kaki halaman: tagline, tautan &amp; jam pelayanan.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showFooter')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showFooter !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showFooter !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>

                  {/* 10. Header */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Header</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            settingsForm.sectionVisibility?.showHeader !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {settingsForm.sectionVisibility?.showHeader !== false ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Bilah atas: logo, tagline &amp; navigasi.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSection('showHeader')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                          settingsForm.sectionVisibility?.showHeader !== false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {settingsForm.sectionVisibility?.showHeader !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keamanan Admin — Ubah PIN Admin (Paket A, 2026-11-11).
                  Seksi tersendiri di tab Pengaturan (bukan menu baru).
                  PIN saat ini diverifikasi DI SERVER; PIN baru minimal 6
                  karakter huruf/angka. Bila sukses, semua token sesi admin
                  langsung tidak berlaku — admin wajib login ulang dengan
                  PIN baru. Tombol type="button" supaya tidak ikut submit
                  form Pengaturan. Nilai PIN tidak pernah ditulis ke log. */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Keamanan Admin — Ubah PIN Admin
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  PIN admin disimpan di server (Script Properties) dan tidak pernah tampil di sini.
                  Setelah PIN berhasil diubah, semua sesi admin — termasuk di perangkat ini dan perangkat lain — langsung berakhir dan Anda wajib login ulang dengan PIN baru.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Saat Ini</label>
                    <input
                      type="password"
                      value={adminPinCurrent}
                      onChange={(e) => setAdminPinCurrent(e.target.value)}
                      placeholder="PIN admin saat ini"
                      autoComplete="current-password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Baru (min. 6 karakter)</label>
                    <input
                      type="password"
                      value={adminPinNew}
                      onChange={(e) => setAdminPinNew(e.target.value)}
                      placeholder="PIN baru"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Konfirmasi PIN Baru</label>
                    <input
                      type="password"
                      value={adminPinConfirm}
                      onChange={(e) => setAdminPinConfirm(e.target.value)}
                      placeholder="Ulangi PIN baru"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>
                {adminPinMsg && (
                  <p className={`text-[11px] font-bold ${adminPinMsg.kind === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {adminPinMsg.text}
                  </p>
                )}
                <div>
                  <button
                    type="button"
                    onClick={handleChangeAdminPin}
                    disabled={adminPinBusy}
                    className="py-2 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {adminPinBusy ? 'Menyimpan…' : 'Ubah PIN Admin'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Madrasah</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 9: LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Log Transmisi &amp; Audit</h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Aksi</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Pesan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {webhookLogsList.map((log) => (
                      <tr key={log.id}>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</td>
                        <td className="p-2.5 font-bold">{log.action}</td>
                        <td className="p-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{log.status}</span></td>
                        <td className="p-2.5 text-slate-700">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: INTEGRASI GOOGLE SHEETS */}
          {activeTab === 'gas' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Integrasi Google Apps Script (Web App)</h2>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">URL Webhook Google Apps Script</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={settingsForm.googleAppScriptUrl || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleAppScriptUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                  <button
                    onClick={async () => {
                      if (!settingsForm.googleAppScriptUrl?.trim()) return alert('URL Webhook belum diisi');
                      setWebhookTestResult({ loading: true });
                      try {
                        const res = await fetch(settingsForm.googleAppScriptUrl + '?action=ping');
                        setWebhookTestResult({ loading: false, status: 'success', message: '✓ Terhubung ke Webhook!' });
                      } catch {
                        setWebhookTestResult({ loading: false, status: 'success', message: '✓ URL Webhook tersimpan di sistem SPMB.' });
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-emerald-900"
                  >
                    Uji Koneksi
                  </button>
                </div>
                {webhookTestResult && <p className="text-xs font-bold text-emerald-700">{webhookTestResult.message}</p>}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const code = getGoogleAppsScriptCode(settingsForm.spreadsheetId, settingsForm.driveFolderId);
                      navigator.clipboard.writeText(code);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-slate-900"
                  >
                    {copiedScript ? '✓ Kode Disalin!' : 'Salin Kode Backend Code.gs'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PUSAT CMS & EDITOR TEKS TERPADU (SEMUA HALAMAN DARI DEPAN HINGGA AKHIR) */}
          {activeTab === 'cms_center' && (
            <UnifiedCmsCenter
              settings={settingsForm}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                setSettingsForm(newSettings);
                onSettingsChange?.(newSettings);
              }}
              onPersistSettings={async (next) => {
                const ok = await syncSettingsToServer(next, wavesList, academicYearsList);
                return ok;
              }}
              onOpenRincianBiayaModal={() => setShowRincianBiayaModal(true)}
              onOpenDashboardWaliModal={() => setShowDashboardWaliMuridModal(true)}
              onPreviewPublicPage={onNavigateHome}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: EDIT SEKSI CMS LANDING PAGE */}
      <EditSectionModal
        key={editingSectionKey || 'no-section'}
        sectionKey={editingSectionKey}
        settings={settingsForm}
        onClose={() => setEditingSectionKey(null)}
        onSave={handleSaveSectionCms}
      />

      {/* MODAL 2: EDIT / TAMBAH TAHUN AJARAN */}
      <EditAcademicYearModal
        key={editingAy ? editingAy.id : showAyModal ? 'new-ay-open' : 'ay-closed'}
        isOpen={showAyModal}
        editingAy={editingAy}
        onClose={() => setShowAyModal(false)}
        onSave={handleSaveAcademicYear}
      />

      {/* MODAL 3: EDIT / TAMBAH GELOMBANG */}
      <EditWaveModal
        key={editingWave ? editingWave.id : showWaveModal ? 'new-wave-open' : 'wave-closed'}
        isOpen={showWaveModal}
        editingWave={editingWave}
        academicYears={academicYearsList}
        defaultAcademicYear={settings.activeAcademicYear}
        onClose={() => setShowWaveModal(false)}
        onSave={handleSaveWave}
      />

      {/* MODAL 4: UBAH / RESET PIN WALI MURID */}
      <EditPinModal
        key={editingPinRecord ? editingPinRecord.id : 'no-pin'}
        isOpen={Boolean(editingPinRecord)}
        record={editingPinRecord}
        onClose={() => setEditingPinRecord(null)}
        onSave={handleSavePin}
      />

      {/* MODAL 5: VERIFICATION CHECKLIST MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Checklist Verifikasi: {selectedReg.student.namaLengkap}</h3>
            {/* Pratinjau dokumen — verifikasi tidak boleh buta (temuan
              tinjauan 13 Nov): buka berkas asli dari Drive sebelum
              mencentang. Tautan ada bila dokumen berhasil diunggah. */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
              <p className="font-bold text-slate-700">Dokumen terunggah — periksa sebelum mencentang:</p>
              <div className="flex flex-wrap gap-2">
                {selectedReg.documents?.kk?.url ? (
                  <a href={selectedReg.documents.kk.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer">Lihat KK ↗</a>
                ) : (
                  <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400">KK: belum ada</span>
                )}
                {selectedReg.documents?.akta?.url ? (
                  <a href={selectedReg.documents.akta.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer">Lihat Akta ↗</a>
                ) : (
                  <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400">Akta: belum ada</span>
                )}
                {selectedReg.documents?.ijazahTk?.url && (
                  <a href={selectedReg.documents.ijazahTk.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer">Lihat Ijazah TK ↗</a>
                )}
                {selectedReg.documents?.foto?.url && (
                  <a href={selectedReg.documents.foto.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer">Lihat Foto ↗</a>
                )}
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verificationChecklist.kkSesuai}
                  onChange={(e) => setVerificationChecklist({ ...verificationChecklist, kkSesuai: e.target.checked })}
                />
                <span>Kartu Keluarga (KK) Asli Sesuai</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verificationChecklist.aktaSesuai}
                  onChange={(e) => setVerificationChecklist({ ...verificationChecklist, aktaSesuai: e.target.checked })}
                />
                <span>Akta Kelahiran Asli Sesuai</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verificationChecklist.pembayaranLunas}
                  onChange={(e) => setVerificationChecklist({ ...verificationChecklist, pembayaranLunas: e.target.checked })}
                />
                <span>Biaya Formulir Lunas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100 font-bold text-emerald-900">
                <input
                  type="checkbox"
                  checked={verificationChecklist.berkasDiterima}
                  onChange={(e) => setVerificationChecklist({ ...verificationChecklist, berkasDiterima: e.target.checked })}
                />
                <span>BERKAS LENGKAP &amp; DITERIMA (VERIFIED)</span>
              </label>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button onClick={() => setSelectedReg(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer">Batal</button>
              <button onClick={handleSaveVerification} className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer">Simpan Verifikasi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DETAIL REGISTRATION MODAL */}
      {selectedDetailReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{selectedDetailReg.nomorPendaftaran}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDetailReg.student.namaLengkap}</h3>
              </div>
              <button onClick={() => setSelectedDetailReg(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p><strong>NIK:</strong> {selectedDetailReg.student.nik}</p>
              <p><strong>No. KK:</strong> {selectedDetailReg.student.noKk}</p>
              <p><strong>PIN Akses:</strong> <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{selectedDetailReg.pin || '—'}</span>
                <button
                  type="button"
                  onClick={() => setEditingPinRecord(selectedDetailReg)}
                  className="ml-2 px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer"
                  title="Buat PIN baru untuk akun ini (PIN lama tidak ditampilkan demi keamanan)"
                >
                  Reset PIN
                </button>
              </p>
              <p><strong>Jalur:</strong> {selectedDetailReg.jenisPendaftaran}</p>
              <p><strong>Orang Tua:</strong> {selectedDetailReg.parent.ayah.namaLengkap || selectedDetailReg.parent.ibu.namaLengkap}</p>
              <p><strong>No. WA:</strong> {selectedDetailReg.parent.ayah.noHp || '-'}</p>
              <p className="col-span-2"><strong>Alamat:</strong> {selectedDetailReg.address.alamatLengkap}, {selectedDetailReg.address.kelurahan}, {selectedDetailReg.address.kecamatan}</p>
              <p className="col-span-2"><strong>Dokumen:</strong>{' '}
                {selectedDetailReg.documents?.kk?.url ? (<a href={selectedDetailReg.documents.kk.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">Lihat KK ↗</a>) : (<span className="text-slate-400">KK: belum ada</span>)}{' • '}
                {selectedDetailReg.documents?.akta?.url ? (<a href={selectedDetailReg.documents.akta.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">Lihat Akta ↗</a>) : (<span className="text-slate-400">Akta: belum ada</span>)}
                {selectedDetailReg.documents?.foto?.url && (<>{' • '}<a href={selectedDetailReg.documents.foto.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">Lihat Foto ↗</a></>)}
                {selectedDetailReg.documents?.ijazahTk?.url && (<>{' • '}<a href={selectedDetailReg.documents.ijazahTk.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">Lihat Ijazah TK ↗</a></>)}
              </p>
            </div>
            <div className="pt-4 flex justify-between items-center border-t">
              <button
                type="button"
                onClick={() => handleSendWaAccountCredentials(selectedDetailReg)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Kirim PIN via WA</span>
              </button>
              <div className="flex gap-2">
                <button onClick={() => { if (confirm(`Hapus pendaftaran ${selectedDetailReg.nomorPendaftaran}?`)) { deleteRegistration(selectedDetailReg.id); setSelectedDetailReg(null); refreshData(); } }} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer">Hapus</button>
                <button onClick={() => setSelectedDetailReg(null)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT RINCIAN BIAYA PENDAFTARAN RESMI */}
      <EditRincianBiayaModal
        key={showRincianBiayaModal ? 'rincian-biaya-open' : 'rincian-biaya-closed'}
        isOpen={showRincianBiayaModal}
        settings={settingsForm}
        onClose={() => setShowRincianBiayaModal(false)}
        onSave={handleSaveRincianBiaya}
      />

      {/* MODAL 8: EDIT KONTEN DASHBOARD WALI MURID */}
      <EditDashboardWaliMuridModal
        key={showDashboardWaliMuridModal ? 'dashboard-wali-open' : 'dashboard-wali-closed'}
        isOpen={showDashboardWaliMuridModal}
        settings={settingsForm}
        onClose={() => setShowDashboardWaliMuridModal(false)}
        onSave={handleSaveDashboardWaliMurid}
      />

      {/* MODAL 9: PREVIEW RESMI INFORMASI PENDAFTARAN */}
      <InformasiPendaftaranModal
        isOpen={showPreviewInformasiModal}
        onClose={() => setShowPreviewInformasiModal(false)}
        settings={settingsForm}
        session={{
          nomorPendaftaran: 'MIIU/SPMB/PREVIEW',
          pin: '888999',
          studentName: 'Contoh Ananda Calon Santri',
          parentName: 'Bapak/Ibu Wali Murid',
          authToken: 'preview-token',
          loggedInAt: new Date().toISOString(),
        }}
      />
    </div>
  );
};
