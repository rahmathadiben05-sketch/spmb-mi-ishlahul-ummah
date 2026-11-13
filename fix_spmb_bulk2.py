#!/usr/bin/env python3
"""Lanjutan perbaikan massal SPMB — sisa dari fix_spmb_bulk.py (berhenti di tengah)."""
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

# Sisa WizardStep2: ibu + wali
rep("components/wizard/WizardStep2.tsx",
    "value={data.ibu?.pekerjaan || 'Karyawan Swasta'}",
    "value={data.ibu?.pekerjaan || ''}")
rep("components/wizard/WizardStep2.tsx",
    "value={data.ibu?.penghasilan || 'Rp2.000.000 - 3.000.000'}",
    "value={data.ibu?.penghasilan || ''}")
rep("components/wizard/WizardStep2.tsx",
    "value={data.wali?.pendidikan || 'S1'}",
    "value={data.wali?.pendidikan || ''}")
rep("components/wizard/WizardStep2.tsx",
    "value={data.wali?.pekerjaan || 'Wiraswasta'}",
    "value={data.wali?.pekerjaan || ''}")
rep("components/wizard/WizardStep2.tsx",
    "value={data.wali?.penghasilan || 'Rp1.000.000 - 2.000.000'}",
    "value={data.wali?.penghasilan || ''}")
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

# ---------- components/admin/AdminDashboard.tsx ----------
rep("components/admin/AdminDashboard.tsx", " || '123456'", " || '—'", count=4)

# ---------- app/admin/page.tsx ----------
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

# ---------- components/admin/AdminLoginModal.tsx ----------
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

# ---------- app/page.tsx: kosongkan isian default orang tua (state awal + reset) ----------
for old, new in [
    ("pendidikan: 'S1',", "pendidikan: '',"),
    ("pekerjaan: 'Karyawan Swasta',", "pekerjaan: '',"),
    ("penghasilan: 'Rp3.000.000 - 5.000.000',", "penghasilan: '',"),
    ("pekerjaan: 'Ibu Rumah Tangga',", "pekerjaan: '',"),
    ("penghasilan: 'Tidak Berpenghasilan',", "penghasilan: '',"),
]:
    rep("app/page.tsx", old, new, count=2)

print("SEMUA PENGGANTIAN MASSAL (BAGIAN 2) BERHASIL")
