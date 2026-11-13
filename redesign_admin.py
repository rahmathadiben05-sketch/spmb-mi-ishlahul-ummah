#!/usr/bin/env python3
"""Rapikan halaman admin SPMB (disetujui Rahmat 2026-11-10 23:09 WIB).
1. Sidebar 12 menu -> 3 kelompok berlabel (Operasional / Pengaturan SPMB / Sistem).
2. Form Profil Madrasah dilengkapi: NSM, NPSN, Email, Alamat (+ petunjuk biaya).
3. Hapus kartu ganda Rincian Biaya & Dashboard Wali di tab Pengaturan -> penanda.
4. Hapus seksi Generator Voucher Token legacy di tab Akun Wali & PIN.
5. CMS: tombol Simpan jujur (menyimpan semua tab) + catatan penjelasan.
Semua perubahan UI-only: tidak ada perubahan alur data / nilai yang dibaca halaman publik.
Jalankan: python3 redesign_admin.py  (idempotent TIDAK dijamin - jalankan sekali, cek build)
"""
import re, sys

DASH = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio/components/admin/AdminDashboard.tsx'
CMS = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio/components/admin/UnifiedCmsCenter.tsx'

def must_replace(text, old, new, count=1, name=''):
    n = text.count(old)
    assert n == count, f'{name}: expected {count}x, found {n}x'
    return text.replace(old, new)

dash = open(DASH, encoding='utf-8').read()
cms = open(CMS, encoding='utf-8').read()

# ---------- 1. Sidebar: label OPERASIONAL ----------
dash = must_replace(dash,
    '          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1">\n'
    '            <button\n              onClick={() => setActiveTab(\'kpi\')}',
    '          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1">\n'
    '            <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Operasional Harian</p>\n'
    '            <button\n              onClick={() => setActiveTab(\'kpi\')}',
    name='sidebar-operasional')

# ---------- 1b. Sidebar: label PENGATURAN SPMB sebelum tombol Tahun Ajaran ----------
dash = must_replace(dash,
    '            <button\n              onClick={() => setActiveTab(\'academic_years\')}',
    '            <div className="mx-3 my-2 border-t border-slate-100" />\n'
    '            <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Pengaturan SPMB</p>\n'
    '            <button\n              onClick={() => setActiveTab(\'academic_years\')}',
    name='sidebar-pengaturan')

# ---------- 1c. Sidebar: pindah tombol Integrasi Webhook ke kelompok Pengaturan, label SISTEM sebelum Log ----------
m_gas = re.search(
    r"            <button\n              onClick=\{\(\) => setActiveTab\('gas'\)\}.*?<span>Integrasi Webhook</span>\n            </button>\n",
    dash, re.S)
assert m_gas, 'gas button block not found'
gas_block = m_gas.group(0)
dash = dash.replace(gas_block, '', 1)
dash = must_replace(dash,
    '            <button\n              onClick={() => setActiveTab(\'logs\')}',
    gas_block
    + '            <div className="mx-3 my-2 border-t border-slate-100" />\n'
    '            <p className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Sistem</p>\n'
    '            <button\n              onClick={() => setActiveTab(\'logs\')}',
    name='sidebar-sistem')

# ---------- 2. Profil Madrasah: tambah NSM, NPSN, Email, Alamat + petunjuk biaya ----------
old_biaya = """                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Formulir Pendaftaran (Rp)</label>
                  <input
                    type="number"
                    value={settingsForm.biayaPendaftaran}
                    onChange={(e) => setSettingsForm({ ...settingsForm, biayaPendaftaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>"""
new_biaya = """                <div>
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
                </div>"""
dash = must_replace(dash, old_biaya, new_biaya, name='profil-fields')

# ---------- 3. Hapus kartu ganda di tab Pengaturan -> penanda ----------
m_cards = re.search(
    r"              \{\/\* DUA KARTU FITUR UTAMA: RINCIAN BIAYA & DASHBOARD WALI MURID \*\/\}.*?"
    r"\n              \{\/\* KONTROL VISIBILITAS & EDIT KONTEN SEKSI BERANDA \*\/\}",
    dash, re.S)
assert m_cards, 'dua-kartu block not found'
signpost = """              {/* PENANDA: Rincian Biaya & Dashboard Wali diatur di menunya masing-masing (bukan di sini) */}
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

              {/* KONTROL VISIBILITAS & EDIT KONTEN SEKSI BERANDA */}"""
dash = dash[:m_cards.start()] + signpost + dash[m_cards.end():]

# ---------- 4. Hapus seksi Generator Voucher Token legacy ----------
m_tok = re.search(
    r"              \{\/\* Legacy Token Generator Collapsible \(Optional Tool\) \*\/\}.*?"
    r"              </div>\n            </div>\n          \)\}",
    dash, re.S)
assert m_tok, 'legacy token block not found'
dash = dash[:m_tok.start()] + "            </div>\n          )}" + dash[m_tok.end():]

# state + import yang hanya dipakai seksi legacy
dash = must_replace(dash,
    "  // Token Generation (Legacy/Optional voucher tool)\n"
    "  const [bulkCount, setBulkCount] = useState<number>(10);\n"
    "  const [buyerNameInput, setBuyerNameInput] = useState<string>('');\n"
    "  const [showLegacyTokenTool, setShowLegacyTokenTool] = useState<boolean>(false);\n",
    "", name='legacy-state')
dash = must_replace(dash, "  generateNewTokens,\n", "", name='legacy-import')

# ---------- 5. CMS: tombol Simpan jujur + catatan ----------
cms = must_replace(cms, "<span>Simpan Perubahan</span>", "<span>Simpan Semua Teks CMS</span>", count=4, name='cms-save-label')
cms = must_replace(cms,
    "    showToast(`Perubahan konten tab \"${tabName}\" berhasil disimpan ke sistem!`);",
    "    showToast('Semua perubahan teks CMS berhasil disimpan ke sistem!');",
    name='cms-toast')
cms = must_replace(cms,
    "      {/* ================= TAB 1: BERANDA / LANDING PAGE ================= */}",
    "      <p className=\"text-[11px] text-stone-500 -mt-4\">\n"
    "        Catatan: tombol Simpan di tiap tab menyimpan <strong>seluruh teks CMS</strong> (semua tab), bukan hanya tab yang sedang dibuka.\n"
    "      </p>\n\n"
    "      {/* ================= TAB 1: BERANDA / LANDING PAGE ================= */}",
    name='cms-hint')

open(DASH, 'w', encoding='utf-8').write(dash)
open(CMS, 'w', encoding='utf-8').write(cms)
print('OK: semua 5 edit diterapkan')
