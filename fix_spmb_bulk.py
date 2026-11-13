#!/usr/bin/env python3
"""Perbaikan massal SPMB (2026-11-09, pasca-audit) — hanya penggantian string eksak.
Setiap penggantian HARUS ketemu tepat 1x (atau jumlah yang dinyatakan); kalau tidak,
script berhenti dengan error supaya tidak ada edit setengah-setengah.
"""
import sys

BASE = "/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio/"

def rep(path, old, new, count=1):
    with open(BASE + path, encoding="utf-8") as f:
        src = f.read()
    n = src.count(old)
    if n != count:
        print(f"FAIL {path}: expected {count}x, found {n}x :: {old[:80]!r}")
        sys.exit(1)
    with open(BASE + path, "w", encoding="utf-8") as f:
        f.write(src.replace(old, new))
    print(f"OK {path}: {old[:60]!r}")

# ---------- lib/types.ts: field kebutuhan khusus ----------
rep("lib/types.ts",
    "  nomorKip?: string; // Opsional: Nomor Kartu Indonesia Pintar",
    "  nomorKip?: string; // Opsional: Nomor Kartu Indonesia Pintar\n  kebutuhanKhusus?: string; // '' atau 'Tidak Ada' = tidak ada; selain itu isi jenis/keterangan kebutuhan khusus")

# ---------- lib/storage.ts: data resmi madrasah ----------
rep("lib/storage.ts",
    "  namaKepalaMadrasah: 'H. Ahmad Zainuddin, M.Pd.I',\n  nipKepalaMadrasah: '197805122005011003',",
    "  namaKepalaMadrasah: 'Astutik, S.Pd',\n  nipKepalaMadrasah: '', // NIP belum diberikan Rahmat — isi lewat Dashboard Admin bila ada")
rep("lib/storage.ts",
    "  biayaPendaftaran: 250000,\n  kuotaTarget: 120,",
    "  biayaPendaftaran: 183000, // Administrasi resmi (rincian): formulir + rapor + tabungan + SPP\n  kuotaTarget: 120,")
rep("lib/storage.ts",
    "  driveFolderId: '',\n  spreadsheetId: '',",
    "  driveFolderId: '1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua',\n  spreadsheetId: '1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4',")
rep("lib/storage.ts",
    "    'Telah membayar biaya pendaftaran dan memiliki Token resmi',",
    "    'Mendaftar langsung secara online dengan No. HP orang tua yang aktif (tanpa token)',")
rep("lib/storage.ts",
    "  kopStatusAkreditasi: 'TERAKREDITASI A • NSM: 111235150099 • NPSN: 20584321',",
    "  kopStatusAkreditasi: 'TERAKREDITASI A • NSM: 111235150097 • NPSN: 60717039',")
rep("lib/storage.ts",
    "  cetakNamaPenandatangan: 'H. Ahmad Zainuddin, M.Pd.I',\n  cetakNipPenandatangan: '197805122005011003',",
    "  cetakNamaPenandatangan: 'Astutik, S.Pd',\n  cetakNipPenandatangan: '',")
# Gelombang: samakan biaya formulir dengan administrasi resmi Rp183.000
rep("lib/storage.ts",
    "    biayaPendaftaran: 250000,\n  },\n  {\n    id: 'w2',",
    "    biayaPendaftaran: 183000,\n  },\n  {\n    id: 'w2',")
rep("lib/storage.ts", "    biayaPendaftaran: 300000,", "    biayaPendaftaran: 183000,")
rep("lib/storage.ts", "    biayaPendaftaran: 200000,", "    biayaPendaftaran: 183000,")

# ---------- lib/storage.ts: duplikasi — No KK BUKAN penanda duplikat ----------
rep("lib/storage.ts",
    """    if (reg.student.noKk === noKk.trim()) {
      return {
        isDuplicate: true,
        field: 'noKk',
        message: `Nomor KK ${noKk} sudah terdaftar dalam sistem atas nama ${reg.student.namaLengkap} (${reg.nomorPendaftaran}).`,
      };
    }
""",
    """    // SENGAJA tidak mengecek No KK: kakak-beradik serumah memakai No KK yang sama.
    // Duplikat hanya dari NIK anak (dan NISN bila ada). Parameter noKk dipertahankan
    // supaya pemanggil lama tidak rusak, tapi nilainya diabaikan di sini.
""")

# ---------- lib/storage.ts: login wali = No HP ortu + PIN saja ----------
rep("lib/storage.ts",
    """  const found = regs.find((r) => {
    return (
      r.nomorPendaftaran.toUpperCase() === cleanId ||
      r.student.nik === cleanId ||
      r.tokenCode.toUpperCase() === cleanId ||
      (r.parent.ayah.noHp && r.parent.ayah.noHp.replace(/\\D/g, '') === cleanId.replace(/\\D/g, ''))
    );
  });""",
    """  // Login wali murid memakai No. HP orang tua (ayah/ibu) atau Nomor Pendaftaran.
  // NIK anak dan kode token TIDAK bisa dipakai sebagai identitas login.
  const cleanIdDigits = cleanId.replace(/\\D/g, '');
  const found = regs.find((r) => {
    const ayahHp = (r.parent.ayah.noHp || '').replace(/\\D/g, '');
    const ibuHp = (r.parent.ibu.noHp || '').replace(/\\D/g, '');
    return (
      r.nomorPendaftaran.toUpperCase() === cleanId ||
      (cleanIdDigits.length >= 9 && (ayahHp === cleanIdDigits || ibuHp === cleanIdDigits))
    );
  });""")
rep("lib/storage.ts",
    """    return {
      success: false,
      message: 'Data pendaftar tidak ditemukan. Periksa kembali Nomor Pendaftaran, NIK Anak, atau No. WhatsApp Anda.',
    };""",
    """    return {
      success: false,
      message: 'Data pendaftar tidak ditemukan. Periksa kembali Nomor Pendaftaran atau No. WhatsApp orang tua Anda.',
    };""")
rep("lib/storage.ts",
    """  // Allow login if PIN matches, or secret matches student NIK, or master PIN '123456'
  const isPinMatch = found.pin && found.pin === cleanSecret;
  const isNikMatch = found.student.nik === cleanSecret;
  const isMasterPin = cleanSecret === '123456' || cleanSecret === 'admin123';

  if (isPinMatch || isNikMatch || isMasterPin || !found.pin) {""",
    """  // HANYA PIN 6 digit yang dibuat saat pendaftaran yang berlaku sebagai password.
  // NIK anak dan PIN master (123456/admin123) TIDAK berlaku — perbaikan keamanan 2026-11-09.
  const isPinMatch = !!found.pin && found.pin === cleanSecret;

  if (isPinMatch) {""")
rep("lib/storage.ts",
    "      pin: found.pin || cleanSecret || '123456',",
    "      pin: found.pin,")
rep("lib/storage.ts",
    "    message: 'PIN Akses tidak sesuai. Silakan gunakan 6 digit PIN pendaftaran atau NIK anak Anda.',",
    "    message: 'PIN Akses tidak sesuai. Gunakan 6 digit PIN yang dibuat saat pendaftaran; bila lupa, hubungi panitia SPMB.',")

# ---------- lib/storage.ts: sync kembalikan nomor dari server ----------
rep("lib/storage.ts",
    """): Promise<{ success: boolean; message: string }> {""",
    """): Promise<{ success: boolean; message: string; nomorPendaftaran?: string }> {""")
rep("lib/storage.ts",
    "      return { success: true, message: msg };",
    "      return { success: true, message: msg, nomorPendaftaran: data?.nomorPendaftaran };")

# ---------- lib/storage.ts: migrasi pengaturan lama di browser ----------
rep("lib/storage.ts",
    """  settings.dashboardWaliMuridConfig = {
    ...DEFAULT_DASHBOARD_WALI_MURID,
    ...(settings.dashboardWaliMuridConfig || {}),
  };
  return settings;""",
    """  settings.dashboardWaliMuridConfig = {
    ...DEFAULT_DASHBOARD_WALI_MURID,
    ...(settings.dashboardWaliMuridConfig || {}),
  };
  // Migrasi sekali jalan (perbaikan 2026-11-09): browser yang sudah menyimpan
  // pengaturan lama ikut diperbarui ke data resmi terbaru.
  if (settings.namaKepalaMadrasah && settings.namaKepalaMadrasah.indexOf('Ahmad Zainuddin') !== -1) {
    settings.namaKepalaMadrasah = 'Astutik, S.Pd';
    settings.nipKepalaMadrasah = '';
  }
  if (settings.nsm === '111235150099') settings.nsm = '111235150097';
  if (settings.npsn === '20584321') settings.npsn = '60717039';
  if (settings.biayaPendaftaran === 250000) settings.biayaPendaftaran = 183000;
  if (!settings.spreadsheetId) settings.spreadsheetId = '1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4';
  if (!settings.driveFolderId) settings.driveFolderId = '1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua';
  if (settings.cmsContent) {
    if (settings.cmsContent.kopStatusAkreditasi && settings.cmsContent.kopStatusAkreditasi.indexOf('111235150099') !== -1) {
      settings.cmsContent.kopStatusAkreditasi = 'TERAKREDITASI A • NSM: 111235150097 • NPSN: 60717039';
    }
    if (settings.cmsContent.cetakNamaPenandatangan && settings.cmsContent.cetakNamaPenandatangan.indexOf('Ahmad Zainuddin') !== -1) {
      settings.cmsContent.cetakNamaPenandatangan = 'Astutik, S.Pd';
      settings.cmsContent.cetakNipPenandatangan = '';
    }
  }
  return settings;""")

# ---------- components/wizard/WizardStep2.tsx: hapus isian default orang tua ----------
for old, new in [
    ("value={data.ayah?.pendidikan || 'S1'}", "value={data.ayah?.pendidikan || ''}"),
    ("value={data.ayah?.pekerjaan || 'Karyawan Swasta'}", "value={data.ayah?.pekerjaan || ''}"),
    ("value={data.ayah?.penghasilan || 'Rp3.000.000 - 5.000.000'}", "value={data.ayah?.penghasilan || ''}"),
    ("value={data.ibu?.pendidikan || 'S1'}", "value={data.ibu?.pendidikan || ''}"),
    ("value={data.ibu?.pekerjaan || 'Ibu Rumah Tangga'}", "value={data.ibu?.pekerjaan || ''}"),
    ("value={data.ibu?.penghasilan || 'Tidak Berpenghasilan'}", "value={data.ibu?.penghasilan || ''}"),
]:
    rep("components/wizard/WizardStep2.tsx", old, new)
# Opsi "-- Pilih --" di tiap dropdown (3 pendidikan + 3 pekerjaan + 3 penghasilan)
rep("components/wizard/WizardStep2.tsx", "{EDUCATION_OPTIONS.map((opt) => (",
    "<option value=\"\" disabled>-- Pilih --</option>\n              {EDUCATION_OPTIONS.map((opt) => (", count=3)
rep("components/wizard/WizardStep2.tsx", "{JOB_OPTIONS.map((opt) => (",
    "<option value=\"\" disabled>-- Pilih --</option>\n              {JOB_OPTIONS.map((opt) => (", count=3)
rep("components/wizard/WizardStep2.tsx", "{INCOME_OPTIONS.map((opt) => (",
    "<option value=\"\" disabled>-- Pilih --</option>\n              {INCOME_OPTIONS.map((opt) => (", count=3)

# ---------- components/auth/ApplicantAccessCard.tsx ----------
rep("components/auth/ApplicantAccessCard.tsx",
    "            pendidikan: 'S1',\n            pekerjaan: 'Wiraswasta',\n            penghasilan: 'Rp3.000.000 - 5.000.000',",
    "            pendidikan: '',\n            pekerjaan: '',\n            penghasilan: '',")
rep("components/auth/ApplicantAccessCard.tsx",
    "            pendidikan: 'S1',\n            pekerjaan: 'Ibu Rumah Tangga',\n            penghasilan: 'Tidak Berpenghasilan',",
    "            pendidikan: '',\n            pekerjaan: '',\n            penghasilan: '',")
rep("components/auth/ApplicantAccessCard.tsx",
    "Sudah pernah memulai pendaftaran? Masukkan <strong>Nomor Pendaftaran</strong> (atau NIK Anak) beserta <strong>PIN Akses</strong> Anda untuk melanjutkan pengisian biodata atau mengunggah berkas.",
    "Sudah pernah memulai pendaftaran? Masukkan <strong>No. WhatsApp orang tua</strong> (atau <strong>Nomor Pendaftaran</strong>) beserta <strong>PIN Akses 6 digit</strong> Anda untuk melanjutkan pengisian biodata atau mengunggah berkas.")
rep("components/auth/ApplicantAccessCard.tsx",
    "Nomor Pendaftaran / NIK Anak / No. WA <span className=\"text-rose-500\">*</span>",
    "No. WA Orang Tua / Nomor Pendaftaran <span className=\"text-rose-500\">*</span>")
rep("components/auth/ApplicantAccessCard.tsx",
    "placeholder=\"Contoh: MIIU/SPMB/2027/0001 atau 351502...\"",
    "placeholder=\"Contoh: 081234567890 atau MIIU/SPMB/2027/0001\"")
rep("components/auth/ApplicantAccessCard.tsx",
    "PIN Akses 6-Digit atau NIK Anak <span className=\"text-rose-500\">*</span>",
    "PIN Akses 6 Digit <span className=\"text-rose-500\">*</span>")
rep("components/auth/ApplicantAccessCard.tsx",
    "Jika lupa PIN, Anda dapat memasukkan 16 digit NIK anak yang didaftarkan.",
    "Jika lupa PIN, hubungi panitia SPMB dengan membawa bukti pendaftaran.")
rep("components/auth/ApplicantAccessCard.tsx",
    "setErrorMessage('Masukkan Nomor Pendaftaran, NIK Anak, atau No. WhatsApp Anda.');",
    "setErrorMessage('Masukkan No. WhatsApp orang tua atau Nomor Pendaftaran Anda.');")
rep("components/auth/ApplicantAccessCard.tsx",
    "setErrorMessage('Masukkan 6 digit PIN Akses atau NIK Anak.');",
    "setErrorMessage('Masukkan 6 digit PIN Akses Anda.');")

# ---------- components/admin/EditPinModal.tsx ----------
rep("components/admin/EditPinModal.tsx",
    "const [pin, setPin] = useState<string>(record?.pin || '123456');",
    "const [pin, setPin] = useState<string>(record?.pin || '');")

# ---------- components/admin/AdminDashboard.tsx: jangan tampilkan PIN default ----------
rep("components/admin/AdminDashboard.tsx", " || '123456'", " || '—'", count=4)

# ---------- app/admin/page.tsx: PIN admin + hapus tombol isi-otomatis ----------
rep("app/admin/page.tsx",
    "    const validPins = ['123456', 'admin123', 'admin', 'ishlahulummah'];",
    "    // PIN admin sesuai arahan Rahmat (nilai lama dari aplikasi). JANGAN tampilkan\n    // nilainya di halaman login dan JANGAN tambah PIN alternatif yang mudah ditebak.\n    const validPins = ['123456', 'admin123'];")
rep("app/admin/page.tsx",
    """              <p className="text-[11px] text-[#78716C] mt-1.5 flex items-center gap-1">
                <span>Default PIN:</span>
                <button
                  type="button"
                  onClick={() => setPinInput('123456')}
                  className="font-mono font-bold text-[#145C43] hover:underline cursor-pointer"
                >
                  123456
                </button>
                <span>atau</span>
                <button
                  type="button"
                  onClick={() => setPinInput('admin123')}
                  className="font-mono font-bold text-[#145C43] hover:underline cursor-pointer"
                >
                  admin123
                </button>
              </p>""",
    """              <p className="text-[11px] text-[#78716C] mt-1.5">Gunakan PIN panitia yang telah ditentukan. Jangan bagikan PIN ini kepada siapa pun.</p>""")

# ---------- components/admin/AdminLoginModal.tsx: modal wajib cek PIN ----------
rep("components/admin/AdminLoginModal.tsx",
    """    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess('admin');
      onClose();
    }, 400);""",
    """    // PIN admin sama seperti di /admin (sesuai arahan Rahmat). Username bebas diisi.
    const ADMIN_PINS = ['123456', 'admin123'];
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (ADMIN_PINS.includes(password.trim())) {
        onLoginSuccess('admin');
        onClose();
      } else {
        setErrorMsg('PIN panitia salah. Periksa kembali PIN Anda.');
      }
    }, 400);""")

# ---------- app/page.tsx: kosongkan isian default orang tua (2 tempat: state awal + reset) ----------
for old, new in [
    ("pendidikan: 'S1',", "pendidikan: '',"),
    ("pekerjaan: 'Karyawan Swasta',", "pekerjaan: '',"),
    ("penghasilan: 'Rp3.000.000 - 5.000.000',", "penghasilan: '',"),
    ("pekerjaan: 'Ibu Rumah Tangga',", "pekerjaan: '',"),
    ("penghasilan: 'Tidak Berpenghasilan',", "penghasilan: '',"),
]:
    rep("app/page.tsx", old, new, count=2)

print("SEMUA PENGGANTIAN MASSAL BERHASIL")
