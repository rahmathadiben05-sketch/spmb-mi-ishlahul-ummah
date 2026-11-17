'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { SchoolSettings, Wave } from '@/lib/types';
import { DEFAULT_CMS_CONTENT } from '@/lib/storage';

interface PrintableBlankFormProps {
  settings: SchoolSettings;
  waves?: Wave[];
  onClose: () => void;
}

export const PrintableBlankForm: React.FC<PrintableBlankFormProps> = ({
  settings,
  onClose,
}) => {
  const pakta =
    settings.cmsContent?.paktaIntegritasTeks || DEFAULT_CMS_CONTENT.paktaIntegritasTeks;
  const fee = (settings.biayaPendaftaran || 183000).toLocaleString('id-ID');
  const kepala = settings.cmsContent?.cetakNamaPenandatangan || settings.namaKepalaMadrasah;
  const kota = settings.cmsContent?.cetakKotaTitimangsa || 'Sidoarjo';

  const digitBoxes = (n: number) =>
    Array.from({ length: n })
      .map(() => '<span class="db"></span>')
      .join('');

  const handlePrint = () => {
    try {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Formulir Pendaftaran Fisik SPMB - ${settings.namaMadrasah}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; line-height: 1.5; background: #ffffff; margin: 0; }
              .no-print { display: flex; gap: 10px; margin-bottom: 20px; background: #f1f5f9; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; align-items: center; justify-content: space-between; flex-wrap: wrap; }
              .btn-print { background: #065f46; color: #ffffff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .btn-close { background: #ffffff; color: #333; border: 1px solid #ccc; padding: 10px 16px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; }
              .container { max-width: 900px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 28px; border-radius: 12px; background: #fff; }
              .header { display: flex; flex-direction: row; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #065f46; padding-bottom: 12px; margin-bottom: 12px; gap: 12px; }
              .header-left { display: flex; align-items: center; gap: 16px; }
              .logo { width: 56px; height: 56px; background: #065f46; color: #fde047; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; flex-shrink: 0; }
              .kemenag { font-size: 10px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
              .school-name { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 2px 0; }
              .submeta { font-size: 11px; color: #475569; margin: 0; }
              .reg-badge { text-align: left; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; flex-shrink: 0; font-size: 11px; background: #f8fafc; }
              .reg-badge .box-line { border-bottom: 1px solid #94a3b8; min-height: 18px; margin: 2px 0 6px 0; }
              .doc-title { text-align: center; margin: 14px 0 4px 0; }
              .doc-title h2 { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; text-decoration: underline; color: #0f172a; }
              .doc-title p { font-size: 12px; font-weight: 700; color: #475569; margin: 2px 0 0 0; }
              .hint { text-align: center; font-size: 11px; color: #64748b; margin: 0 0 8px 0; }
              .section-title { font-weight: 800; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; text-transform: uppercase; font-size: 11px; margin: 16px 0 8px 0; }
              .section-title.green { background: #d1fae5; border-color: #6ee7b7; color: #064e3b; }
              .frow { display: flex; gap: 8px; align-items: flex-end; font-size: 12px; padding: 4px 8px; }
              .frow .lab { white-space: nowrap; color: #475569; }
              .frow .line { flex: 1; border-bottom: 1px solid #94a3b8; min-height: 16px; }
              .frow .line.s { flex: 0 0 90px; }
              .frow .line.m { flex: 0 0 160px; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
              .check { font-size: 13px; white-space: nowrap; }
              .digits { display: inline-flex; gap: 2px; vertical-align: bottom; }
              .db { width: 17px; height: 21px; border: 1px solid #64748b; display: inline-block; }
              .photo-placeholder { width: 110px; height: 145px; border: 2px dashed #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; color: #64748b; font-weight: bold; background: #f8fafc; flex-shrink: 0; }
              .flex-row { display: flex; gap: 16px; align-items: flex-start; }
              .flex-1 { flex: 1; }
              .chk-list { font-size: 12px; padding: 4px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
              .chk-box { font-size: 12px; padding: 4px 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
              .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; text-align: center; font-size: 12px; }
              .sig-space { height: 60px; display: flex; align-items: flex-end; justify-content: center; font-weight: bold; }
              .pakta { font-size: 12px; padding: 4px 8px; text-align: justify; }
              @media print {
                .no-print { display: none !important; }
                body { padding: 0; background: #fff; }
                .container { border: none; padding: 0; max-width: 100%; }
                .section-title { break-after: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <span style="font-size:12px; font-weight:bold; color:#065f46;">Formulir Pendaftaran Fisik / Offline SPMB</span>
              <div style="display:flex; gap:8px;">
                <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan ke PDF</button>
                <button class="btn-close" onclick="window.close()">Tutup Tab</button>
              </div>
            </div>
            <div class="container">
              <div class="header">
                <div class="header-left">
                  ${
                    settings.logoMadrasahUrl
                      ? `<img src="${settings.logoMadrasahUrl}" alt="Logo" class="logo" style="object-fit:cover; border:1px solid #cbd5e1;" />`
                      : `<div class="logo">🏫</div>`
                  }
                  <div>
                    <p class="kemenag">${settings.cmsContent?.kopInstansiAtas || settings.instansiInduk || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}</p>
                    <h1 class="school-name">${settings.cmsContent?.kopNamaMadrasah || settings.namaMadrasah}</h1>
                    <p class="submeta">${settings.cmsContent?.kopStatusAkreditasi || `NSM: ${settings.nsm} | NPSN: ${settings.npsn}`}</p>
                    <p class="submeta">${settings.cmsContent?.kopAlamat || `${settings.alamatMadrasah} | Telp/WA: ${settings.kontakWhatsapp}`}</p>
                  </div>
                </div>
                <div class="reg-badge">
                  <div style="font-weight:bold; color:#065f46;">No. Pendaftaran</div>
                  <div style="color:#64748b;">(diisi panitia setelah diinput)</div>
                  <div class="box-line"></div>
                  <div style="font-weight:bold; color:#065f46;">PIN Wali (6 digit)</div>
                  <div style="color:#64748b;">(diisi panitia setelah diinput)</div>
                  <div class="box-line"></div>
                </div>
              </div>

              <div class="doc-title">
                <h2>Formulir Pendaftaran Murid Baru (Offline)</h2>
                <p>TAHUN AJARAN ${settings.activeAcademicYear}</p>
              </div>
              <p class="hint">Isi dengan huruf cetak / balok. Tanda (*) wajib diisi. Serahkan formulir ini beserta berkas ke Sekretariat SPMB.</p>

              <div class="frow" style="flex-wrap:wrap;">
                <span class="lab">Jalur *</span>
                <span class="check">☐ Reguler (Kelas 1)</span>
                <span class="check">☐ Pindahan (Kelas 2–5 SD/MI)</span>
              </div>

              <div class="section-title">I. Identitas Calon Siswa</div>
              <div class="flex-row">
                <div class="flex-1">
                  <div class="frow"><span class="lab">1. Nama Lengkap *</span><span class="line"></span></div>
                  <div class="frow"><span class="lab">2. Nama Panggilan *</span><span class="line"></span></div>
                  <div class="frow"><span class="lab">3. NIK * (16 digit)</span><span class="digits">${digitBoxes(16)}</span></div>
                  <div class="frow"><span class="lab">4. No. Kartu Keluarga * (16 digit)</span><span class="digits">${digitBoxes(16)}</span></div>
                  <div class="frow"><span class="lab">5. NISN (10 digit, bila ada)</span><span class="digits">${digitBoxes(10)}</span></div>
                  <div class="frow"><span class="lab">6. No. KIP (bila ada)</span><span class="line"></span></div>
                  <div class="frow"><span class="lab">7. Tempat Lahir *</span><span class="line"></span><span class="lab">Tanggal Lahir *</span><span class="line s"></span></div>
                  <div class="frow"><span class="lab">8. Jenis Kelamin *</span><span class="check">☐ Laki-laki</span><span class="check">☐ Perempuan</span></div>
                  <div class="frow"><span class="lab">9. Anak ke-</span><span class="line s"></span><span class="lab">dari</span><span class="line s"></span><span class="lab">bersaudara</span></div>
                  <div class="frow"><span class="lab">10. Asal TK/RA/SD *</span><span class="line"></span></div>
                  <div class="frow"><span class="lab">11. Kewarganegaraan *</span><span class="line"></span><span class="lab">Agama *</span><span class="line"></span></div>
                  <div class="frow"><span class="lab">12. Berkebutuhan Khusus / Disabilitas</span><span class="line"></span></div>
                </div>
                <div class="photo-placeholder">FOTO SISWA<br>3 x 4<br>(tempel di sini)</div>
              </div>

              <div class="section-title">II. Data Orang Tua / Wali</div>
              <div class="grid-2">
                <div class="frow"><span class="lab">1. Nama Ayah Kandung *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">2. NIK Ayah *</span><span class="line"></span></div>
              </div>
              <div class="frow"><span class="lab">3. Status Ayah</span><span class="check">☐ Masih Hidup</span><span class="check">☐ Sudah Meninggal</span><span class="check">☐ Tidak Diketahui</span></div>
              <div class="grid-2">
                <div class="frow"><span class="lab">4. TTL Ayah *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">5. Pendidikan Ayah</span><span class="line"></span></div>
                <div class="frow"><span class="lab">6. Pekerjaan Ayah</span><span class="line"></span></div>
                <div class="frow"><span class="lab">7. Penghasilan Ayah / bulan</span><span class="line"></span></div>
                <div class="frow"><span class="lab">8. No. HP/WA Ayah *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">9. Nama Ibu Kandung *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">10. NIK Ibu *</span><span class="line"></span></div>
              </div>
              <div class="frow"><span class="lab">11. Status Ibu</span><span class="check">☐ Masih Hidup</span><span class="check">☐ Sudah Meninggal</span><span class="check">☐ Tidak Diketahui</span></div>
              <div class="grid-2">
                <div class="frow"><span class="lab">12. TTL Ibu *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">13. Pendidikan Ibu</span><span class="line"></span></div>
                <div class="frow"><span class="lab">14. Pekerjaan Ibu</span><span class="line"></span></div>
                <div class="frow"><span class="lab">15. Penghasilan Ibu / bulan</span><span class="line"></span></div>
                <div class="frow"><span class="lab">16. No. HP/WA Ibu</span><span class="line"></span></div>
              </div>
              <p style="font-size:11px; color:#64748b; padding: 0 8px; margin: 6px 0 0 0;">Wali (diisi bila ada — bila kedua orang tua tidak dapat dihubungi / tidak ada):</p>
              <div class="grid-2">
                <div class="frow"><span class="lab">17. Nama Wali</span><span class="line"></span></div>
                <div class="frow"><span class="lab">18. Hubungan dengan Siswa</span><span class="line"></span></div>
                <div class="frow"><span class="lab">19. NIK Wali</span><span class="line"></span></div>
                <div class="frow"><span class="lab">20. No. HP/WA Wali</span><span class="line"></span></div>
              </div>

              <div class="section-title">III. Alamat Domisili</div>
              <div class="grid-2">
                <div class="frow"><span class="lab">Provinsi *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">Kabupaten/Kota *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">Kecamatan *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">Kelurahan/Desa *</span><span class="line"></span></div>
                <div class="frow"><span class="lab">RT *</span><span class="line s"></span><span class="lab">RW *</span><span class="line s"></span></div>
                <div class="frow"><span class="lab">Kode Pos</span><span class="line"></span></div>
              </div>
              <div class="frow"><span class="lab">Alamat Lengkap (jalan, dusun, nomor rumah) *</span><span class="line"></span></div>
              <div class="frow"><span class="lab">&nbsp;</span><span class="line"></span></div>

              <div class="section-title">IV. Berkas yang Dilampirkan (beri tanda ✓ pada kotak)</div>
              <div class="chk-list">
                <span>☐ Fotokopi Kartu Keluarga (KK)</span>
                <span>☐ Akta Kelahiran (fotokopi)</span>
                <span>☐ Pas Foto Berwarna 3x4 (2 lembar)</span>
                <span>☐ Ijazah TK/RA (bila sudah ada)</span>
                <span>☐ Bukti NISN (bila ada)</span>
                <span>☐ Surat Keterangan Pindah + Rapor (jalur pindahan)</span>
              </div>

              <div class="section-title">V. Pakta Integritas</div>
              <p class="pakta">${pakta}</p>

              <div class="sig-grid">
                <div>
                  <div style="color:#64748b;">${kota}, ............ ${settings.activeAcademicYear}</div>
                  <div style="color:#64748b;">Orang Tua / Wali Murid,</div>
                  <div class="sig-space">( ............................ )</div>
                </div>
                <div>
                  <div style="color:#64748b;">&nbsp;</div>
                  <div style="color:#64748b;">Operator Verifikasi,</div>
                  <div class="sig-space">( ............................ )</div>
                </div>
                <div>
                  <div style="color:#64748b;">&nbsp;</div>
                  <div style="color:#64748b;">Mengetahui, Kepala Madrasah</div>
                  <div class="sig-space" style="text-decoration:underline;">${kepala}</div>
                </div>
              </div>

              <div class="section-title green">VI. Untuk Panitia — Diisi Operator Saat Input ke Sistem</div>
              <div class="grid-2">
                <div class="frow"><span class="lab">No. Pendaftaran (sistem)</span><span class="line"></span></div>
                <div class="frow"><span class="lab">PIN Wali (sistem)</span><span class="line"></span></div>
                <div class="frow"><span class="lab">Tanggal Input ke Sistem</span><span class="line"></span></div>
                <div class="frow"><span class="lab">Biaya Formulir Rp ${fee}</span><span class="check">☐ Lunas</span><span class="check">☐ Belum</span></div>
              </div>
              <div class="chk-box">
                <span>☐ KK sesuai</span>
                <span>☐ Akta sesuai</span>
                <span>☐ NIK sesuai</span>
                <span>☐ Dokumen lengkap</span>
                <span>☐ Wawancara / observasi selesai</span>
                <span>☐ Pembayaran lunas</span>
              </div>
              <div class="frow"><span class="lab">Catatan panitia</span><span class="line"></span></div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 300);
              };
            </script>
          </body>
          </html>
        `);
        printWin.document.close();
        printWin.focus();
      } else {
        window.focus();
        setTimeout(() => {
          window.print();
        }, 100);
      }
    } catch (err) {
      console.error('Print popup error, fallbacking to direct print:', err);
      window.focus();
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  // Portal ke document.body: modal keluar dari stacking context seksi
  // (relative + overflow-hidden) sehingga tombol WA melayang (z-40) tidak
  // lagi menutupi isi modal.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Formulir Pendaftaran Fisik / Offline SPMB
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulir kosong siap cetak — isinya sama dengan formulir online (Langkah 1–4) ditambah
              kolom panitia untuk No. Pendaftaran &amp; PIN setelah diinput ke sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="py-5 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800">Isi formulir:</strong> KOP madrasah, pilihan Jalur,
            I. Identitas Calon Siswa (dengan kotak pas foto 3x4), II. Data Orang Tua/Wali,
            III. Alamat Domisili, IV. Checklist berkas, V. Pakta Integritas, VI. Kolom panitia
            (No. Pendaftaran, PIN, verifikasi, pembayaran Rp {fee}).
          </p>
          <p>
            <strong className="text-slate-800">Cara pakai:</strong> klik tombol cetak di bawah, lalu di
            dialog cetak pilih “Save as PDF” untuk menyimpan berkasnya, atau cetak langsung ke printer.
            Satu formulir untuk satu calon santri.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🖨 Cetak Formulir Kosong</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
