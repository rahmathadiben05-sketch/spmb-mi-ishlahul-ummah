'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  Mail,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Lock,
  Copy,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { RegistrationRecord, RegistrationType, SchoolSettings, WaliMuridSession, Wave } from '@/lib/types';
import {
  authenticateApplicantWithServer,
  saveDraft,
  generateRegistrationNumber,
  generateAccessPin,
  getSchoolSettings,
  getRegistrations,
  saveRegistrations,
  updateRegistration,
  getDraft,
  getWaves,
  getActiveWave,
  hitungHargaGelombang,
  hitungBatasPelunasan,
  fetchPublicStats,
  createIndenToWebhook,
  enqueueFailedSync,
  formatRupiah,
  normalizePhone,
  addAuditLog,
  setWaliMuridSession,
} from '@/lib/storage';

interface ApplicantAccessCardProps {
  onStartNewRegistration: (initialData: {
    regType: RegistrationType;
    parentName: string;
    waNumber: string;
    email: string;
    studentName: string;
    tempRegNo: string;
    tempPin: string;
    modePendaftaran?: 'penuh' | 'inden';
    inden?: RegistrationRecord['inden'];
  }) => void;
  onResumeRegistration: (record: RegistrationRecord, opts?: { serverUnreachable?: boolean }) => void;
  onBackToHome: () => void;
  initialTab?: 'register' | 'login';
}

export const ApplicantAccessCard: React.FC<ApplicantAccessCardProps> = ({
  onStartNewRegistration,
  onResumeRegistration,
  onBackToHome,
  initialTab,
}) => {
  const settings = getSchoolSettings();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(initialTab || 'register');

  // Form Baru
  const [parentName, setParentName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [email, setEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [regType, setRegType] = useState<RegistrationType>('baru');

  // Form Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginSecret, setLoginSecret] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Layar interstitial "Simpan PIN Anda" — tampil setelah akun dibuat,
  // SEBELUM masuk wizard. PIN wajib terlihat di layar ini.
  const [createdAccount, setCreatedAccount] = useState<{
    regType: RegistrationType;
    parentName: string;
    waNumber: string;
    email: string;
    studentName: string;
    tempRegNo: string;
    tempPin: string;
    modePendaftaran?: 'penuh' | 'inden';
    inden?: RegistrationRecord['inden'];
    /** true = nomor berasal dari server (resmi); false = nomor sementara lokal. */
    nomorResmi?: boolean;
  } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // --- Inden Gelombang 1: gelombang aktif + harga + sisa kuota diskon ---
  const activeWave: Wave | undefined = getActiveWave(getWaves(), settings);
  const [sisaKuotaDiskon, setSisaKuotaDiskon] = useState<number | undefined>(undefined);
  React.useEffect(() => {
    if (!activeWave?.indenAktif) return;
    let cancelled = false;
    fetchPublicStats(settings, activeWave.kuotaDiskon)
      .then((s) => {
        if (!cancelled && s) setSisaKuotaDiskon(s.sisaKuotaDiskon);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWave?.id]);
  const hargaWave = hitungHargaGelombang(activeWave, sisaKuotaDiskon);
  const indenDp = activeWave?.indenDp ?? 50000;
  const batasPelunasanHari = activeWave?.batasPelunasanHari ?? 14;
  // Pilihan mode: hanya tampil bila gelombang aktif membuka inden.
  const [selectedMode, setSelectedMode] = useState<'penuh' | 'inden' | null>(null);
  const effectiveMode: 'penuh' | 'inden' =
    activeWave?.indenAktif ? selectedMode ?? 'penuh' : 'penuh';

  const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const formatTanggalId = (iso: string) =>
    iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-';

  // Panel "Lupa PIN?" di tab login
  const [showForgotPin, setShowForgotPin] = useState(false);

  const handleCopyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
    } catch {
      // Fallback: pilih teks PIN secara manual bila clipboard diblokir browser
      const el = document.getElementById('created-pin-value');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  // Submit Registrasi Baru Langsung
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!parentName.trim()) {
      setErrorMessage('Mohon isi nama lengkap orang tua / wali murid.');
      return;
    }
    if (!waNumber.trim() || waNumber.replace(/\D/g, '').length < 10) {
      setErrorMessage('Mohon masukkan nomor WhatsApp aktif yang valid (min. 10 digit).');
      return;
    }
    if (!studentName.trim()) {
      setErrorMessage('Mohon isi nama lengkap / panggilan calon ananda.');
      return;
    }
    // Gelombang inden: cara pendaftaran wajib dipilih eksplisit.
    if (activeWave?.indenAktif && selectedMode === null) {
      setErrorMessage('Silakan pilih cara pendaftaran: Inden Kursi atau Daftar Penuh.');
      return;
    }

    // Cek duplikat No WA: bila nomor sudah punya pendaftaran (record tersubmit
    // atau draft yang belum selesai), JANGAN buat akun baru.
    const normalizedWa = normalizePhone(waNumber);
    const waAlreadyRegistered =
      getRegistrations().some((r) => {
        const ayahHp = normalizePhone(r.parent.ayah.noHp || '');
        const ibuHp = normalizePhone(r.parent.ibu.noHp || '');
        return (
          (ayahHp !== '' && ayahHp === normalizedWa) ||
          (ibuHp !== '' && ibuHp === normalizedWa)
        );
      }) ||
      (() => {
        const draft = getDraft();
        if (!draft?.data?.parent) return false;
        return [draft.data.parent.ayah?.noHp || '', draft.data.parent.ibu?.noHp || ''].some(
          (p) => {
            const n = normalizePhone(p);
            return n !== '' && n === normalizedWa;
          }
        );
      })();
    if (waAlreadyRegistered) {
      setErrorMessage('No WA sudah terdaftar, silakan masuk.');
      setLoginIdentifier(waNumber.trim());
      setActiveTab('login');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      const tempRegNo = generateRegistrationNumber(settings.activeAcademicYear);
      const tempPin = generateAccessPin();

      // Draft awal — TANPA pre-seed (Paket C, M13): nama orang tua TIDAK
      // disalin ke Ayah, No WA hanya disimpan SEKALI di Ayah (bukan
      // disalin ke ibu juga), dan jenis kelamin TIDAK diberi default
      // 'L' — ketiganya diisi sendiri oleh orang tua di wizard.
      // No WA disimpan ternormalisasi '62...', email orang tua ikut
      // tersimpan di draft dan mengalir ke kolom 112 Sheets saat submit.
      const draftStudent = {
        namaLengkap: studentName.trim(),
        namaPanggilan: studentName.trim().split(' ')[0] || studentName.trim(),
        nik: '',
        noKk: '',
        tempatLahir: '',
        tanggalLahir: '',
        jenisKelamin: '' as const,
        anakKe: 1,
        jumlahSaudara: 1,
        asalSekolah: '',
      };
      const draftParent = {
        ayah: {
          namaLengkap: '',
          tempatLahir: '',
          tanggalLahir: '',
          pendidikan: '',
          pekerjaan: '',
          penghasilan: '',
          noHp: normalizedWa,
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
        email: email.trim(),
      };

      // ---- MODE INDEN: buat baris inden di server, lalu record lokal ----
      if (effectiveMode === 'inden' && activeWave?.indenAktif) {
        const tanggalInden = todayLocal();
        const indenData: NonNullable<RegistrationRecord['inden']> = {
          status: 'Inden',
          jumlahDp: indenDp,
          dpLunas: false,
          diskonDiberikan: hargaWave.diskon,
          sisaBayar: Math.max(0, hargaWave.hargaAkhir - indenDp),
          batasPelunasan: hitungBatasPelunasan(tanggalInden, batasPelunasanHari),
          tanggalInden,
        };
        const nowIso = new Date().toISOString();
        const indenRecord: RegistrationRecord = {
          id: `reg-inden-${Date.now()}`,
          nomorPendaftaran: tempRegNo,
          tokenCode: tempPin,
          jenisPendaftaran: regType,
          status: 'draft',
          createdAt: nowIso,
          updatedAt: nowIso,
          academicYear: settings.activeAcademicYear,
          wave: activeWave.nama,
          student: draftStudent,
          parent: draftParent,
          address: {
            provinsi: '',
            kabupaten: '',
            kecamatan: '',
            kelurahan: '',
            alamatLengkap: '',
            kodePos: '',
          },
          documents: {},
          pin: tempPin,
          noWaPendaftaran: normalizedWa,
          modePendaftaran: 'inden',
          inden: indenData,
        };
        try {
          saveRegistrations([indenRecord, ...getRegistrations()]);
        } catch {
          // Kuota localStorage penuh: lanjut dengan draft saja; wizard submit
          // akan menampilkan error yang jelas bila penyimpanan gagal.
        }
        saveDraft({
          id: indenRecord.id,
          nomorPendaftaran: tempRegNo,
          pin: tempPin,
          noWaPendaftaran: normalizedWa,
          jenisPendaftaran: regType,
          modePendaftaran: 'inden',
          inden: indenData,
          student: draftStudent,
          parent: draftParent,
        });

        // Nomor inden RESMI berasal dari server (createInden). Bila gagal
        // (offline), pakai nomor sementara lokal + masukkan ke antrean sync
        // agar bisa dikirim ulang — jangan blokir wali dengan error mentah.
        let finalRegNo = tempRegNo;
        let nomorResmi = false;
        try {
          const res = await createIndenToWebhook({
            academicYear: settings.activeAcademicYear,
            wave: activeWave.nama,
            pin: tempPin,
            studentNama: studentName.trim(),
            parentNama: parentName.trim(),
            parentNoHp: normalizedWa,
            jumlahDp: indenData.jumlahDp,
            diskonDiberikan: indenData.diskonDiberikan,
            sisaBayar: indenData.sisaBayar,
            batasPelunasan: indenData.batasPelunasan,
            kuotaDiskon: activeWave.kuotaDiskon,
          });
          if (res.ok && res.data?.nomorPendaftaran) {
            finalRegNo = res.data.nomorPendaftaran;
            nomorResmi = true;
            // Hormati keputusan diskon SERVER (M14): server menol-kan diskon
            // bila kuota habis — record lokal + draft + layar interstitial
            // memakai diskonDiberikan/sisaBayar/batasPelunasan dari server,
            // bukan angka lokal yang bisa menampilkan Rp25.000 palsu.
            const serverDiskon =
              typeof res.data.diskonDiberikan === 'number' ? res.data.diskonDiberikan : indenData.diskonDiberikan;
            const serverSisaBayar =
              typeof res.data.sisaBayar === 'number' ? res.data.sisaBayar : indenData.sisaBayar;
            const serverBatas =
              typeof res.data.batasPelunasan === 'string' && res.data.batasPelunasan
                ? res.data.batasPelunasan
                : indenData.batasPelunasan;
            const finalIndenData: NonNullable<RegistrationRecord['inden']> = {
              ...indenData,
              diskonDiberikan: serverDiskon,
              sisaBayar: serverSisaBayar,
              batasPelunasan: serverBatas,
            };
            updateRegistration(indenRecord.id, (prev) => ({
              ...prev,
              nomorPendaftaran: finalRegNo,
              inden: finalIndenData,
            }));
            saveDraft({
              id: indenRecord.id,
              nomorPendaftaran: finalRegNo,
              pin: tempPin,
              noWaPendaftaran: normalizedWa,
              jenisPendaftaran: regType,
              modePendaftaran: 'inden',
              inden: finalIndenData,
              student: draftStudent,
              parent: draftParent,
            });
            // Layar interstitial memakai angka final dari server.
            indenData.diskonDiberikan = finalIndenData.diskonDiberikan;
            indenData.sisaBayar = finalIndenData.sisaBayar;
            indenData.batasPelunasan = finalIndenData.batasPelunasan;
          } else {
            enqueueFailedSync(indenRecord);
          }
        } catch {
          enqueueFailedSync(indenRecord);
        }

        addAuditLog(
          parentName.trim(),
          'public',
          'START_INDENT',
          `Inden kursi dimulai: ${finalRegNo} (${parentName} - ${studentName})`
        );
        const session: WaliMuridSession = {
          nomorPendaftaran: finalRegNo,
          pin: tempPin,
          studentName: studentName.trim(),
          parentName: parentName.trim(),
          waNumber: normalizedWa,
          // Jenis kelamin belum diketahui di titik ini (diisi di wizard
          // Langkah 1) — kosong, bukan default 'L' (Paket C, M13).
          jenisKelamin: '',
          authToken: `WM-NEW-${Date.now()}`,
          loggedInAt: new Date().toISOString(),
        };
        setWaliMuridSession(session);
        setIsLoading(false);
        setCreatedAccount({
          regType,
          parentName: parentName.trim(),
          waNumber: normalizedWa,
          email: email.trim(),
          studentName: studentName.trim(),
          tempRegNo: finalRegNo,
          tempPin,
          modePendaftaran: 'inden',
          inden: indenData,
          nomorResmi,
        });
        return;
      }

      // ---- MODE PENUH: alur lama tidak berubah ----
      saveDraft({
        nomorPendaftaran: tempRegNo,
        pin: tempPin,
        noWaPendaftaran: normalizedWa,
        jenisPendaftaran: regType,
        modePendaftaran: 'penuh',
        student: draftStudent,
        parent: draftParent,
      });

      addAuditLog(
        parentName.trim(),
        'public',
        'START_REGISTRATION',
        `Pendaftaran mandiri baru dimulai: ${tempRegNo} (${parentName} - ${studentName})`
      );

      const session: WaliMuridSession = {
        nomorPendaftaran: tempRegNo,
        pin: tempPin,
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        waNumber: normalizedWa,
        // Jenis kelamin belum diketahui di titik ini (diisi di wizard
        // Langkah 1) — kosong, bukan default 'L' (Paket C, M13).
        jenisKelamin: '',
        authToken: `WM-NEW-${Date.now()}`,
        loggedInAt: new Date().toISOString(),
      };
      setWaliMuridSession(session);

      setIsLoading(false);
      // Tampilkan layar "Simpan PIN Anda" dulu — wizard baru dibuka setelah
      // orang tua menekan "Lanjut Isi Formulir".
      setCreatedAccount({
        regType,
        parentName: parentName.trim(),
        waNumber: normalizedWa,
        email: email.trim(),
        studentName: studentName.trim(),
        tempRegNo,
        tempPin,
        modePendaftaran: 'penuh',
        nomorResmi: false,
      });
    }, 350);
  };

  // Submit Login Pendaftar — server-first (v2.8): ambil record dari server
  // dulu; bila server tidak terjangkau/tidak menemukan, fallback ke data
  // perangkat ini (authenticateApplicant lokal, termasuk draft). Aturan
  // tetap: WA/nomor + PIN 6 digit, satu nomor WA = satu pendaftaran.
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Masukkan No. WhatsApp orang tua atau Nomor Pendaftaran Anda.');
      return;
    }
    if (!loginSecret.trim()) {
      setErrorMessage('Masukkan 6 digit PIN Akses Anda.');
      return;
    }

    setIsLoading(true);
    void (async () => {
      const auth = await authenticateApplicantWithServer(loginIdentifier, loginSecret);
      setIsLoading(false);

      if (auth.success && auth.record) {
        onResumeRegistration(auth.record, { serverUnreachable: auth.serverUnreachable });
      } else {
        setErrorMessage(auth.message || 'Data pendaftar tidak cocok. Periksa kembali input Anda.');
      }
    })();
  };

  // Tautan WA "Lupa PIN?" — memakai nomor kontak dari settings (bukan hardcode).
  const forgotPinWaPhone = normalizePhone(settings.kontakWhatsapp || '');
  const forgotPinWaUrl = `https://wa.me/${forgotPinWaPhone}?text=${encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB ${settings.namaMadrasah}, saya lupa PIN 6 digit pendaftaran. Nomor Pendaftaran / No. WA saya: ${loginIdentifier.trim() || '-'}. Mohon bantuan reset PIN dengan bukti pendaftaran.`
  )}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <div className="bg-white rounded-xl p-6 sm:p-10 border border-stone-200 shadow-xl relative overflow-hidden">
        {/* Top brand line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0D3B2E]" />

        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-emerald-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Main Title & Brand */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Portal Pendaftaran Santri Baru
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                TA {settings.activeAcademicYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-heading tracking-tight">
              Penerimaan Murid Baru {settings.namaMadrasah}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Daftar online langsung, aman, transparan, dan dapat dilanjutkan kapan saja.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        {!createdAccount && (
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100/80 rounded-2xl border border-stone-200 mb-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Mulai Daftar Baru</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Lanjutkan Formulir / Masuk</span>
          </button>
        </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* LAYAR INTERSTITIAL "SIMPAN PIN ANDA" — tampil setelah akun dibuat,
            SEBELUM masuk wizard. PIN wajib terlihat di layar ini. */}
        {createdAccount && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
              <ShieldCheck className="w-8 h-8 text-emerald-700 mx-auto" />
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 font-heading">
                Simpan PIN Anda
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Akun pendaftaran ananda <strong>{createdAccount.studentName}</strong> sudah dibuat.
                Simpan Nomor Registrasi dan PIN 6 digit di bawah ini — keduanya dibutuhkan
                untuk masuk kembali dan melanjutkan formulir.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  {/* BUG 1 (2026-11-11): nomor alur penuh di sini masih SEMENTARA
                      (dihitung dari perangkat ini); nomor resmi terbit saat
                      formulir dikirim. Nomor inden berasal dari server, jadi
                      sudah resmi — labelnya tidak memakai "Sementara". */}
                  {createdAccount.modePendaftaran === 'inden'
                    ? createdAccount.nomorResmi
                      ? 'Nomor Inden'
                      : 'Nomor Inden Sementara'
                    : 'Nomor Registrasi Sementara'}
                </span>
                <span className="block text-base sm:text-lg font-extrabold text-stone-900 font-mono break-all">
                  {createdAccount.tempRegNo}
                </span>
                {createdAccount.modePendaftaran !== 'inden' && (
                  <span className="block text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                    Nomor resmi Anda tertera di halaman sukses setelah formulir dikirim — nomornya bisa berbeda; PIN tetap sama.
                  </span>
                )}
                {createdAccount.modePendaftaran === 'inden' && !createdAccount.nomorResmi && (
                  <span className="block text-[11px] text-amber-800 mt-1.5 leading-relaxed">
                    Nomor inden ini masih sementara (belum terkirim ke panitia) — nomor resmi menyusul setelah data terkirim.
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  PIN 6 Digit Anda
                </span>
                <span
                  id="created-pin-value"
                  className="block text-4xl sm:text-5xl font-black text-emerald-900 font-mono tracking-[0.3em]"
                >
                  {createdAccount.tempPin}
                </span>
              </div>
            </div>

            {/* Rincian inden: hanya untuk mode Inden Kursi */}
            {createdAccount.modePendaftaran === 'inden' && createdAccount.inden && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-xs sm:text-sm">
                <p className="font-extrabold text-amber-900">
                  Inden Kursi — DP {formatRupiah(createdAccount.inden.jumlahDp)}
                </p>
                <div className="space-y-1 text-stone-700 leading-relaxed">
                  <p>
                    Silakan transfer DP {formatRupiah(createdAccount.inden.jumlahDp)} secara manual,
                    lalu hubungi panitia via WhatsApp untuk konfirmasi pembayaran.
                  </p>
                  <p>
                    Batas pelunasan: <strong>lunasi sebelum {formatTanggalId(createdAccount.inden.batasPelunasan)}</strong>
                    {activeWave?.dpHangusJikaLewatBatas ? ' — DP hangus bila lewat batas.' : '.'}
                  </p>
                  <p>
                    Sisa bayar: <strong>{formatRupiah(createdAccount.inden.sisaBayar)}</strong>
                    {createdAccount.inden.diskonDiberikan > 0 &&
                      ` (termasuk diskon Early Bird ${formatRupiah(createdAccount.inden.diskonDiberikan)})`}
                    .
                  </p>
                </div>
                <a
                  href={`https://wa.me/${normalizePhone(settings.kontakWhatsapp || '')}?text=${encodeURIComponent(
                    `Assalamu'alaikum Panitia SPMB ${settings.namaMadrasah}, saya ${createdAccount.parentName} ingin konfirmasi pembayaran DP inden ${formatRupiah(createdAccount.inden.jumlahDp)} untuk ananda ${createdAccount.studentName} (Nomor Inden: ${createdAccount.tempRegNo}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Konfirmasi DP via WhatsApp Panitia</span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCopyPin(createdAccount.tempPin)}
                className="py-3 px-4 rounded-2xl bg-white border border-stone-300 hover:border-emerald-700 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedPin ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPin ? 'PIN Disalin' : 'Salin PIN'}</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  createdAccount.modePendaftaran === 'inden'
                    ? `Assalamu'alaikum, saya mendaftar SPMB MI Ishlahul Ummah (Inden Kursi).\nNomor Inden${createdAccount.nomorResmi ? '' : ' (Sementara)'}: ${createdAccount.tempRegNo}\nPIN 6 Digit: ${createdAccount.tempPin}\nNama ananda: ${createdAccount.studentName}\nMohon simpan data ini untuk masuk kembali.`
                    : `Assalamu'alaikum, saya mendaftar SPMB MI Ishlahul Ummah.\nNomor Pendaftaran (Sementara): ${createdAccount.tempRegNo}\nPIN 6 Digit: ${createdAccount.tempPin}\nNama ananda: ${createdAccount.studentName}\nMohon simpan data ini untuk masuk kembali.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Simpan ke WhatsApp</span>
              </a>
            </div>
            <p className="text-[11px] text-stone-500 text-center leading-relaxed">
              Tombol WhatsApp membuka WhatsApp Anda — pilih kontak / diri sendiri untuk menyimpan data ini.
            </p>

            <button
              type="button"
              onClick={() => {
                const acc = createdAccount;
                setCreatedAccount(null);
                onStartNewRegistration(acc);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <span>Lanjut Isi Formulir</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* TAB 1: FORM PENDAFTARAN LANGSUNG (TANPA TOKEN) */}
        {!createdAccount && activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Cukup isi data singkat wali murid & calon ananda. Sistem akan langsung mengarahkan Anda ke formulir 4 langkah dan menerbitkan <strong>Nomor Registrasi Sementara + PIN Akses</strong>.
              </span>
            </div>

            {/* Pilihan mode: Inden Kursi / Daftar Penuh (hanya periode TA 2027/2028) */}
            {activeWave?.indenAktif && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider font-heading">
                  Pilih Cara Pendaftaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('inden')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      selectedMode === 'inden'
                        ? 'border-emerald-700 bg-emerald-50 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-stone-900">Inden Kursi</span>
                      {selectedMode === 'inden' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </span>
                    <span className="block text-xs text-stone-600 mt-1 leading-relaxed">
                      DP {formatRupiah(indenDp)} sekarang, total {formatRupiah(hargaWave.hargaAkhir)}
                      {hargaWave.diskonTersedia ? ` setelah diskon ${formatRupiah(hargaWave.diskon)}` : ''}.
                      Sisa {formatRupiah(Math.max(0, hargaWave.hargaAkhir - indenDp))}, lunasi maks {batasPelunasanHari} hari.
                    </span>
                    {hargaWave.diskonTidakPasti && (
                      <span className="block text-[11px] font-bold text-amber-800 mt-1.5">
                        Diskon Early Bird belum dapat dipastikan — hubungi panitia.
                      </span>
                    )}
                    <span className="block text-[11px] font-bold text-emerald-800 mt-1.5">
                      Kursi ananda langsung diamankan.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode('penuh')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      selectedMode === 'penuh'
                        ? 'border-emerald-700 bg-emerald-50 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-stone-900">Daftar Penuh</span>
                      {selectedMode === 'penuh' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </span>
                    <span className="block text-xs text-stone-600 mt-1 leading-relaxed">
                      Bayar {formatRupiah(hargaWave.hargaAkhir)} sekaligus
                      {hargaWave.diskonTersedia
                        ? `, hemat ${formatRupiah(hargaWave.diskon)} dari ${formatRupiah(hargaWave.hargaNormal)}.`
                        : ` (harga normal ${formatRupiah(hargaWave.hargaNormal)}).`}
                    </span>
                    <span className="block text-[11px] font-bold text-emerald-800 mt-1.5">
                      {hargaWave.diskonTersedia
                        ? 'Harga Early Bird — diskon masih tersedia.'
                        : hargaWave.diskonTidakPasti
                          ? 'Kuota diskon belum dapat dipastikan — hubungi panitia.'
                          : 'Kuota diskon habis — harga normal berlaku.'}
                    </span>
                  </button>
                </div>
                {selectedMode === null && (
                  <p className="text-[11px] text-amber-800 font-medium">Silakan pilih salah satu cara pendaftaran di atas.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                  Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: H. Ahmad Fauzi"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                  Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="Contoh: 0812xxxxxxx"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Notifikasi nomor pendaftaran & jadwal observasi dikirim ke nomor ini.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                  Nama Calon Santri / Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Muhammad Rayhan"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                  Email Orang Tua <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* Jalur */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2 uppercase tracking-wider font-heading">
                Pilih Jalur Pendaftaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegType('baru')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    regType === 'baru'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <span className="block text-xs sm:text-sm font-bold">Siswa Baru (Kelas 1)</span>
                    <span className="block text-[11px] opacity-75 font-normal">Lulusan TK / RA / PAUD</span>
                  </div>
                  {regType === 'baru' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </button>

                <button
                  type="button"
                  onClick={() => setRegType('pindahan')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    regType === 'pindahan'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <span className="block text-xs sm:text-sm font-bold">Siswa Pindahan</span>
                    <span className="block text-[11px] opacity-75 font-normal">Pindahan Kelas 2 - 5 SD/MI</span>
                  </div>
                  {regType === 'pindahan' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Menyiapkan Formulir Pendaftaran...</span>
                ) : (
                  <>
                    <span>Lanjut Isi Formulir Pendaftaran Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: FORM LOGIN / LANJUTKAN DENGAN PIN */}
        {!createdAccount && activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Sudah pernah memulai pendaftaran? Masukkan <strong>No. WhatsApp orang tua</strong> (atau <strong>Nomor Pendaftaran</strong>) beserta <strong>PIN Akses 6 digit</strong> Anda untuk melanjutkan pengisian biodata atau mengunggah berkas.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                No. WA Orang Tua / Nomor Pendaftaran <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 uppercase tracking-wider font-heading">
                PIN Akses 6 Digit <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={loginSecret}
                  onChange={(e) => {
                    setLoginSecret(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="6 digit PIN pendaftaran Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition font-mono tracking-widest"
                />
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                Jika lupa PIN, hubungi panitia SPMB dengan membawa bukti pendaftaran.
              </span>
            </div>

            {/* Lupa PIN? — hubungi panitia via WA (nomor dari settings) */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <button
                type="button"
                onClick={() => setShowForgotPin((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Lupa PIN?</span>
              </button>
              {showForgotPin && (
                <div className="mt-3 space-y-3 text-xs text-stone-600 leading-relaxed">
                  <p>
                    Hubungi panitia SPMB melalui WhatsApp resmi dengan membawa bukti pendaftaran
                    (Nomor Pendaftaran / nama ananda). Panitia akan membantu reset PIN Anda setelah
                    memverifikasi identitas pendaftar.
                  </p>
                  <a
                    href={forgotPinWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat Panitia SPMB via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi Akses...</span>
                ) : (
                  <>
                    <span>Buka Formulir Pendaftaran</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
