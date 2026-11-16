'use client';

import React from 'react';
import { RegistrationRecord, SchoolSettings } from '@/lib/types';
import { DEFAULT_RINCIAN_BIAYA, formatRupiah } from '@/lib/storage';
import { School } from 'lucide-react';

interface PrintableBuktiProps {
  record: RegistrationRecord;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintableBukti: React.FC<PrintableBuktiProps> = ({
  record,
  settings,
  onClose,
}) => {
  // Masking identitas sensitif: hanya 4 digit awal + 4 digit akhir yang tampil.
  const maskSensitive = (value: string | undefined): string => {
    const v = (value || '').replace(/\s/g, '');
    if (!v) return '-';
    if (v.length < 8) return `${v.slice(0, 2)}***`;
    return `${v.slice(0, 4)}${'*'.repeat(v.length - 8)}${v.slice(-4)}`;
  };

  const studentPhotoUrl = record.documents?.foto?.url || record.student?.fotoUrl;

  // Rincian biaya — sumber sama dengan seksi Biaya di beranda, jadi angka di
  // cetakan selalu sama dengan website (bila Rahmat mengubah angka di admin,
  // cetakan ikut berubah). Hanya tampil di Bukti Diterima (LULUS), dan paket
  // perlengkapan mengikuti jenis kelamin anak.
  const rincian = settings.rincianBiayaPendaftaran || DEFAULT_RINCIAN_BIAYA;
  const sumBiaya = (items: { biaya: number }[] | undefined) =>
    (items || []).reduce((a, it) => a + (Number(it.biaya) || 0), 0);
  const adminTotal = sumBiaya(rincian.itemsAdministrasi);
  const isLakiLaki = record.student.jenisKelamin === 'L';
  const perlengkapanItems = isLakiLaki ? rincian.itemsLakiLaki : rincian.itemsPerempuan;
  const perlengkapanTitle = isLakiLaki
    ? rincian.judulLakiLaki || 'Perlengkapan Siswa Laki-laki'
    : rincian.judulPerempuan || 'Perlengkapan Siswa Perempuan';
  const perlengkapanTotal = sumBiaya(perlengkapanItems);
  const grandTotal = adminTotal + perlengkapanTotal;
  const catatanRingkasan = rincian.catatanRingkasan || DEFAULT_RINCIAN_BIAYA.catatanRingkasan;
  // Status lunas administrasi — fail-closed seperti PrintableFormulirResmi:
  // tanpa data verifikasi, tampil 'Belum lunas', jangan pernah default lolos.
  const pembayaranLunas = record.verification?.pembayaranLunas === true;

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
            <title>${record.hasilPengumuman === 'LULUS' ? 'Bukti Diterima SPMB' : 'Bukti Pendaftaran SPMB'} - ${record.nomorPendaftaran}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #1a1d1a; line-height: 1.5; background: #ffffff; margin: 0; }
              .no-print { display: flex; gap: 10px; margin-bottom: 20px; background: #f0f4f0; padding: 12px 16px; border-radius: 10px; border: 1px solid #d1d9d1; align-items: center; justify-content: space-between; flex-wrap: wrap; }
              .btn-print { background: #4B634B; color: #ffffff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .btn-close { background: #ffffff; color: #333; border: 1px solid #ccc; padding: 10px 16px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; }
              .container { max-width: 800px; margin: 0 auto; border: 1px solid #d1d9d1; padding: 24px; border-radius: 12px; background: #fff; }
              .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #4B634B; padding-bottom: 12px; margin-bottom: 16px; }
              .logo { width: 56px; height: 56px; background: #4B634B; color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; flex-shrink: 0; }
              .title-group p { margin: 0; }
              .tag { font-size: 10px; font-weight: bold; color: #4B634B; text-transform: uppercase; letter-spacing: 1px; }
              .school-name { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #1a1d1a; margin: 2px 0; }
              .submeta { font-size: 11px; color: #626862; }
              .doc-title { text-align: center; margin: 16px 0; }
              .doc-title h2 { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0; color: #1a1d1a; }
              .doc-title p { font-size: 12px; font-weight: 700; color: #4B634B; margin: 2px 0 0 0; }
              .reg-box { background: #f8faf8; border: 2px solid #4B634B; padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
              .reg-label { font-size: 10px; font-weight: bold; color: #626862; text-transform: uppercase; }
              .reg-no { font-family: monospace; font-size: 18px; font-weight: 800; color: #4B634B; margin: 2px 0 0 0; }
              .token-val { font-family: monospace; font-size: 14px; font-weight: 700; color: #1a1d1a; margin: 2px 0 0 0; }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px; }
              .card { border: 1px solid #e2e6e2; padding: 12px; border-radius: 8px; font-size: 12px; }
              .card-title { font-weight: 800; color: #1b4d3e; border-bottom: 1px solid #e2e6e2; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; }
              .card p { margin: 4px 0; }
              .label { color: #626862; }
              .photo-box { width: 90px; height: 120px; object-fit: cover; border: 1px solid #0f172a; border-radius: 4px; float: right; margin-left: 10px; }
              .photo-placeholder { width: 90px; height: 120px; border: 2px dashed #94a3b8; border-radius: 4px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #64748b; font-weight: bold; background: #f8fafc; float: right; margin-left: 10px; }
              .notice { background: #fffbe3; border: 1px solid #f2e293; padding: 12px; border-radius: 8px; font-size: 11px; color: #7a6300; margin-bottom: 16px; }
              .notice ol { margin: 4px 0 0 0; padding-left: 20px; }
              .notice-green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; }
              .accept-box { background: #f0fdf4; border: 2px solid #15803d; padding: 14px 16px; border-radius: 10px; margin-bottom: 16px; }
              .accept-box h3 { margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; }
              .accept-box p { margin: 4px 0; font-size: 12px; color: #14532d; }
              .fee-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 12px; }
              .fee-row strong { font-family: monospace; white-space: nowrap; }
              .fee-total { display: flex; justify-content: space-between; gap: 8px; border-top: 1px solid #e2e6e2; padding-top: 6px; margin-top: 6px; font-weight: 800; font-size: 12px; }
              .fee-total strong { font-family: monospace; color: #4B634B; }
              .fee-note { font-size: 11px; color: #626862; margin-top: 8px; line-height: 1.5; }
              .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e6e2; padding-top: 16px; margin-top: 20px; font-size: 11px; flex-wrap: wrap; gap: 16px; }
              .qr-box { display: flex; align-items: center; gap: 10px; }
              .qr-code { width: 56px; height: 56px; border: 1px solid #ccc; padding: 4px; border-radius: 6px; text-align: center; font-size: 8px; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; }
              .sig-box { text-align: center; }
              .stamp-space { height: 48px; display: flex; align-items: center; justify-content: center; font-style: italic; color: #1b4d3e; font-weight: bold; }
              @media (max-width: 640px) {
                .header { flex-direction: column; text-align: center; }
                .footer { flex-direction: column; align-items: center; text-align: center; }
              }
              @media print {
                .no-print { display: none !important; }
                body { padding: 0; background: #fff; }
                .container { border: none; padding: 0; max-width: 100%; }
                .header { flex-direction: row; text-align: left; }
                .footer { flex-direction: row; align-items: flex-end; text-align: left; }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <span style="font-size:12px; font-weight:bold; color:#4B634B;">${record.hasilPengumuman === 'LULUS' ? 'Pratinjau Bukti Diterima' : 'Pratinjau Bukti Pendaftaran Online'}</span>
              <div style="display:flex; gap:8px;">
                <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan PDF Sekarang</button>
                <button class="btn-close" onclick="window.close()">Tutup Tab</button>
              </div>
            </div>
            <div class="container">
              <div class="header">
                ${
                  settings.logoMadrasahUrl
                    ? `<img src="${settings.logoMadrasahUrl}" alt="Logo" class="logo" style="object-fit:cover; border:1px solid #d1d9d1;" />`
                    : `<div class="logo">🏫</div>`
                }
                <div class="title-group">
                  <p class="tag">${settings.cmsContent?.kopInstansiAtas || settings.instansiInduk || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}</p>
                  <h1 class="school-name">${settings.cmsContent?.kopNamaMadrasah || settings.namaMadrasah}</h1>
                  <p class="submeta">${settings.cmsContent?.kopStatusAkreditasi || `NSM: ${settings.nsm} | NPSN: ${settings.npsn}`}</p>
                  <p class="submeta">${settings.cmsContent?.kopAlamat || `${settings.alamatMadrasah} | WA: ${settings.kontakWhatsapp}`}</p>
                </div>
              </div>
              <div class="doc-title">
                <h2>${record.hasilPengumuman === 'LULUS' ? 'BUKTI DITERIMA SPMB' : 'BUKTI PENDAFTARAN ONLINE SPMB'}</h2>
                <p>TAHUN AJARAN ${record.academicYear}</p>
              </div>
              <div class="reg-box">
                <div>
                  <div class="reg-label">Nomor Pendaftaran Resmi</div>
                  <div class="reg-no">${record.nomorPendaftaran}</div>
                </div>
                <div style="text-align:right;">
                  <div class="reg-label">PIN 6 Digit</div>
                  <div class="token-val">${record.pin || record.tokenCode || '—'}</div>
                </div>
              </div>
              ${record.hasilPengumuman === 'LULUS' ? `
              <div class="accept-box">
                <h3>✓ Pernyataan Diterima</h3>
                <p>Berdasarkan hasil seleksi Panitia SPMB ${settings.namaMadrasah} Tahun Ajaran ${record.academicYear}, ananda <strong>${record.student.namaLengkap}</strong> dengan Nomor Pendaftaran <strong>${record.nomorPendaftaran}</strong> dinyatakan <strong>DITERIMA</strong> sebagai santri baru.</p>
                <p><strong>Bukti ini wajib dibawa saat daftar ulang di madrasah.</strong></p>
              </div>` : ''}
              <div class="grid">
                <div class="card">
                  <div class="card-title">A. Data Calon Siswa</div>
                  ${
                    studentPhotoUrl
                      ? `<img src="${studentPhotoUrl}" alt="Foto Siswa" class="photo-box" />`
                      : `<div class="photo-placeholder">FOTO SISWA<br>3 x 4</div>`
                  }
                  <p><span class="label">Nama Lengkap:</span> <strong>${record.student.namaLengkap}</strong></p>
                  <p><span class="label">Nama Panggilan:</span> ${record.student.namaPanggilan || '-'}</p>
                  <p><span class="label">NIK Siswa:</span> <strong>${maskSensitive(record.student.nik)}</strong></p>
                  <p><span class="label">No. KK:</span> <strong>${maskSensitive(record.student.noKk)}</strong></p>
                  ${record.student.nomorKip ? `<p><span class="label">Nomor KIP:</span> <strong>${record.student.nomorKip}</strong> (Program PIP)</p>` : ''}
                  <p><span class="label">TTL:</span> ${record.student.tempatLahir}, ${record.student.tanggalLahir}</p>
                  <p><span class="label">Jenis Kelamin:</span> ${record.student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  <p><span class="label">Anak Ke / Jml Saudara:</span> Ke-${record.student.anakKe}${record.student.jumlahSaudara ? ` dari ${record.student.jumlahSaudara} bersaudara` : ''}</p>
                  <p><span class="label">Asal TK/SD:</span> ${record.student.asalSekolah || '-'}</p>
                  <p><span class="label">Status Ijazah TK:</span> <strong>${record.documents?.memilikiIjazahTk ? 'Memegang Ijazah TK (Wajib Diunggah)' : 'Belum/Tidak Memegang Ijazah TK'}</strong></p>
                  <p><span class="label">Jalur:</span> <strong style="text-transform:uppercase;">${record.jenisPendaftaran}</strong></p>
                </div>
                <div class="card">
                  <div class="card-title">B. Data Orang Tua & Alamat</div>
                  <p><span class="label">Nama Ayah:</span> <strong>${record.parent.ayah.namaLengkap}</strong> [${record.parent.ayah.status || 'Masih Hidup'}]</p>
                  <p><span class="label">NIK Ayah:</span> <strong>${maskSensitive(record.parent.ayah.nik)}</strong> | Pekerjaan: ${record.parent.ayah.pekerjaan || '-'}</p>
                  <p><span class="label">Nama Ibu:</span> <strong>${record.parent.ibu.namaLengkap}</strong> [${record.parent.ibu.status || 'Masih Hidup'}]</p>
                  <p><span class="label">NIK Ibu:</span> <strong>${maskSensitive(record.parent.ibu.nik)}</strong> | Pekerjaan: ${record.parent.ibu.pekerjaan || '-'}</p>
                  ${
                    record.parent.wali?.hasWali || record.parent.wali?.namaLengkap
                      ? `<p><span class="label">Nama Wali:</span> <strong>${record.parent.wali.namaLengkap}</strong> [${record.parent.wali.status || 'Masih Hidup'}] (Hubungan: ${record.parent.wali.hubungan || 'Wali'})</p>`
                      : ''
                  }
                  <p><span class="label">No. HP/WA:</span> <strong>${maskSensitive(record.parent.ayah.noHp || record.parent.ibu.noHp)}</strong></p>
                  <p><span class="label">Alamat:</span> ${record.address.alamatLengkap}, RT ${record.address.rt || '-'}/RW ${record.address.rw || '-'}, Desa/Kel. ${record.address.kelurahan}, Kec. ${record.address.kecamatan}, ${record.address.kabupaten} (${record.address.kodePos || '-'})</p>
                </div>
              </div>
              ${record.hasilPengumuman === 'LULUS' ? `
              <div style="margin-bottom:16px;">
                <div class="card-title" style="margin-bottom:8px;">C. Rincian Biaya Daftar Ulang</div>
                <div class="grid" style="margin-bottom:0;">
                  <div class="card">
                    <div class="card-title">${rincian.judulAdministrasi || 'Administrasi Pendaftaran'}</div>
                    ${(rincian.itemsAdministrasi || []).map((it) => `<p class="fee-row"><span>${it.nama}</span><strong>${formatRupiah(it.biaya)}</strong></p>`).join('')}
                    <p class="fee-total"><span>Subtotal Administrasi</span><strong>${formatRupiah(adminTotal)}</strong></p>
                    <p style="font-size:11px; margin:6px 0 0 0;">Status pembayaran administrasi: <strong>${pembayaranLunas ? 'Lunas' : 'Belum lunas'}</strong></p>
                  </div>
                  <div class="card">
                    <div class="card-title">${perlengkapanTitle}</div>
                    ${(perlengkapanItems || []).map((it) => `<p class="fee-row"><span>${it.nama}</span><strong>${formatRupiah(it.biaya)}</strong></p>`).join('')}
                    <p class="fee-total"><span>Subtotal Perlengkapan</span><strong>${formatRupiah(perlengkapanTotal)}</strong></p>
                  </div>
                </div>
                <p class="fee-total" style="border-top:2px solid #4B634B; margin-top:10px; padding-top:8px; font-size:13px;"><span>Total Administrasi + Perlengkapan</span><strong>${formatRupiah(grandTotal)}</strong></p>
                ${catatanRingkasan ? `<p class="fee-note">${catatanRingkasan}</p>` : ''}
              </div>` : ''}
              ${record.hasilPengumuman === 'LULUS' ? `
              <div class="notice notice-green">
                <strong>📌 Petunjuk Daftar Ulang:</strong>
                <div style="white-space:pre-line; margin-top:4px;">1. Bawa cetakan Bukti Diterima ini saat daftar ulang di madrasah.
2. Lakukan konfirmasi kehadiran santri dan pelunasan sisa biaya perlengkapan/seragam di sekretariat madrasah.
3. Pengambilan seragam madrasah dilakukan saat daftar ulang.
4. Jadwal daftar ulang mengikuti pengumuman dari panitia.</div>
              </div>` : `
              <div class="notice">
                <strong>📌 Ketentuan & Petunjuk Observasi Calon Siswa:</strong>
                <div style="white-space:pre-line; margin-top:4px;">${settings.cmsContent?.cetakKetentuanObservasi || '1. Membawa formulir bukti pendaftaran ini saat hadir ke madrasah.\n2. Membawa dokumen fisik asli (KK, Akta Kelahiran, dan Ijazah TK bagi yang sudah memiliki) untuk dicocokkan panitia.\n3. Calon santri hadir berpakaian rapi dan sopan didampingi orang tua/wali.'}</div>
              </div>`}
              <div class="footer">
                <div style="font-size:10px; color:#626862; max-width:220px;">
                  Verifikasi ke panitia dengan Nomor Pendaftaran &amp; PIN 6 Digit
                </div>
                <div class="sig-box">
                  <div>${settings.cmsContent?.cetakKotaTitimangsa || 'Sidoarjo'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div>${settings.cmsContent?.cetakJabatanPenandatangan || 'Ketua Panitia SPMB'},</div>
                  <div class="stamp-space">${settings.enableDigitalStamp ? '[STEMPEL DIGITAL PANITIA]' : ''}</div>
                  <div style="font-weight:bold; color:#1a1d1a;">${settings.cmsContent?.cetakNamaPenandatangan || settings.namaKepalaMadrasah}</div>
                  <div style="font-size:10px; color:#626862;">NIP: ${settings.cmsContent?.cetakNipPenandatangan || settings.nipKepalaMadrasah}</div>
                </div>
              </div>
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

  return (
    <div className="printable-modal-wrapper fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="printable-card bg-white rounded-xl sm:rounded-2xl max-w-3xl w-full p-4 sm:p-8 shadow-2xl relative my-auto print:p-0 print:shadow-none print:m-0 print:max-w-none print:rounded-none">
        {/* Action bar (hidden during print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-4 border-b border-[#E2E6E2] print:hidden mb-4 sm:mb-6 gap-3">
          <h3 className="text-xs sm:text-sm font-bold text-[#1A1D1A] text-center sm:text-left">
            {record.hasilPengumuman === 'LULUS' ? 'Pratinjau Cetak Bukti Diterima' : 'Pratinjau Cetak Bukti Pendaftaran'}
          </h3>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary px-3.5 py-2 rounded-xl text-xs shadow-xs cursor-pointer font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
            >
              <span>🖨 Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs cursor-pointer font-bold flex-1 sm:flex-none text-center"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-area" className="text-[#1A1D1A] font-sans space-y-4 sm:space-y-6 border border-[#D1D9D1] p-4 sm:p-6 rounded-xl print:border-0 print:p-0">
          {/* Header Kop Surat */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 pb-4 border-b-2 border-[#4B634B]">
            {settings.logoMadrasahUrl ? (
              <img
                src={settings.logoMadrasahUrl}
                alt="Logo Madrasah"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-300 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#4B634B] text-white flex items-center justify-center font-bold shrink-0">
                <School className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#4B634B]">PANITIA PENERIMAAN MURID BARU (SPMB)</p>
              <h1 className="text-base sm:text-xl font-extrabold uppercase text-[#1A1D1A] tracking-tight">{settings.namaMadrasah}</h1>
              <p className="text-[10px] sm:text-[11px] text-[#626862]">
                NSM: {settings.nsm} | NPSN: {settings.npsn}
              </p>
              <p className="text-[10px] text-[#626862] mt-0.5">{settings.alamatMadrasah} | WA: {settings.kontakWhatsapp}</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#1A1D1A]">
              {record.hasilPengumuman === 'LULUS' ? 'BUKTI DITERIMA SPMB' : 'BUKTI PENDAFTARAN ONLINE SPMB'}
            </h2>
            <p className="text-xs font-bold text-[#4B634B]">TAHUN AJARAN {record.academicYear}</p>
          </div>

          {/* Registration Number Highlight */}
          <div className="bg-[#F8FAF8] border-2 border-[#4B634B] p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#626862]">Nomor Pendaftaran Pendaftar</p>
              <p className="text-base sm:text-lg font-mono font-extrabold text-[#4B634B]">{record.nomorPendaftaran}</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] uppercase font-bold text-[#626862]">PIN 6 Digit</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#1A1D1A]">{record.pin || record.tokenCode || '—'}</p>
            </div>
          </div>

          {/* Pernyataan Diterima — hanya tampil bila status pengumuman LULUS */}
          {record.hasilPengumuman === 'LULUS' && (
            <div className="bg-emerald-50 border-2 border-emerald-700 p-4 rounded-xl space-y-1.5">
              <p className="font-extrabold text-emerald-800 uppercase tracking-wide text-xs sm:text-sm">✓ Pernyataan Diterima</p>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                Berdasarkan hasil seleksi Panitia SPMB {settings.namaMadrasah} Tahun Ajaran {record.academicYear}, ananda{' '}
                <strong>{record.student.namaLengkap}</strong> dengan Nomor Pendaftaran <strong>{record.nomorPendaftaran}</strong> dinyatakan{' '}
                <strong>DITERIMA</strong> sebagai santri baru.
              </p>
              <p className="text-xs sm:text-sm text-emerald-900 font-bold">Bukti ini wajib dibawa saat daftar ulang di madrasah.</p>
            </div>
          )}

          {/* Student & Parent Data Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 relative">
              <p className="font-bold text-emerald-900 border-b pb-1 uppercase">A. Data Calon Siswa</p>
              <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 w-full">
                  <p><span className="text-slate-500">Nama Lengkap:</span> <strong>{record.student.namaLengkap}</strong></p>
                  <p><span className="text-slate-500">NIK Siswa:</span> <strong className="font-mono">{maskSensitive(record.student.nik)}</strong></p>
                  <p><span className="text-slate-500">No. KK:</span> <strong className="font-mono">{maskSensitive(record.student.noKk)}</strong></p>
                  <p><span className="text-slate-500">TTL:</span> {record.student.tempatLahir}, {record.student.tanggalLahir}</p>
                  <p><span className="text-slate-500">Jenis Kelamin:</span> {record.student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  <p><span className="text-slate-500">Asal TK/SD:</span> {record.student.asalSekolah || '-'}</p>
                  <p><span className="text-slate-500">Jalur:</span> <strong className="uppercase">{record.jenisPendaftaran}</strong></p>
                </div>
                {studentPhotoUrl ? (
                  <img
                    src={studentPhotoUrl}
                    alt={`Foto ${record.student.namaLengkap}`}
                    className="w-[85px] h-[115px] object-cover rounded border border-slate-900 shrink-0"
                  />
                ) : (
                  <div className="w-[85px] h-[115px] border-2 border-dashed border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center text-center p-1 text-slate-400 text-[9px] font-bold shrink-0">
                    <span>FOTO SISWA</span>
                    <span>3 x 4</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <p className="font-bold text-emerald-900 border-b pb-1 uppercase">B. Data Orang Tua & Alamat</p>
              <p><span className="text-slate-500">Nama Ayah:</span> <strong>{record.parent.ayah.namaLengkap}</strong></p>
              <p><span className="text-slate-500">NIK Ayah:</span> <strong className="font-mono">{maskSensitive(record.parent.ayah.nik)}</strong></p>
              <p><span className="text-slate-500">Nama Ibu:</span> <strong>{record.parent.ibu.namaLengkap}</strong></p>
              <p><span className="text-slate-500">NIK Ibu:</span> <strong className="font-mono">{maskSensitive(record.parent.ibu.nik)}</strong></p>
              {(record.parent.wali?.hasWali || record.parent.wali?.namaLengkap) && (
                <p><span className="text-slate-500">Nama Wali:</span> <strong>{record.parent.wali.namaLengkap}</strong> (NIK: {maskSensitive(record.parent.wali.nik)})</p>
              )}
              <p><span className="text-slate-500">No. Kontak HP:</span> <strong className="font-mono">{maskSensitive(record.parent.ayah.noHp || record.parent.ibu.noHp)}</strong></p>
              <p><span className="text-slate-500">Alamat:</span> {record.address.alamatLengkap}, {record.address.kelurahan}, {record.address.kecamatan}, {record.address.kabupaten}</p>
            </div>
          </div>

          {/* Rincian Biaya — hanya di Bukti Diterima (LULUS) */}
          {record.hasilPengumuman === 'LULUS' && (
            <div className="space-y-2">
              <p className="font-bold text-emerald-900 uppercase text-xs">C. Rincian Biaya Daftar Ulang</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-emerald-900 border-b pb-1 uppercase">{rincian.judulAdministrasi || 'Administrasi Pendaftaran'}</p>
                  {(rincian.itemsAdministrasi || []).map((it) => (
                    <p key={it.id} className="flex items-center justify-between gap-2">
                      <span>{it.nama}</span>
                      <strong className="font-mono whitespace-nowrap">{formatRupiah(it.biaya)}</strong>
                    </p>
                  ))}
                  <p className="flex items-center justify-between gap-2 border-t pt-1.5 mt-1.5 font-extrabold">
                    <span>Subtotal Administrasi</span>
                    <span className="font-mono text-emerald-800">{formatRupiah(adminTotal)}</span>
                  </p>
                  <p className="text-[11px] pt-1">Status pembayaran administrasi: <strong>{pembayaranLunas ? 'Lunas' : 'Belum lunas'}</strong></p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-emerald-900 border-b pb-1 uppercase">{perlengkapanTitle}</p>
                  {(perlengkapanItems || []).map((it) => (
                    <p key={it.id} className="flex items-center justify-between gap-2">
                      <span>{it.nama}</span>
                      <strong className="font-mono whitespace-nowrap">{formatRupiah(it.biaya)}</strong>
                    </p>
                  ))}
                  <p className="flex items-center justify-between gap-2 border-t pt-1.5 mt-1.5 font-extrabold">
                    <span>Subtotal Perlengkapan</span>
                    <span className="font-mono text-emerald-800">{formatRupiah(perlengkapanTotal)}</span>
                  </p>
                </div>
              </div>
              <p className="flex items-center justify-between gap-2 border-t-2 border-emerald-800 pt-2 font-extrabold text-xs sm:text-sm">
                <span>Total Administrasi + Perlengkapan</span>
                <span className="font-mono text-emerald-800">{formatRupiah(grandTotal)}</span>
              </p>
              {catatanRingkasan && <p className="text-[11px] text-slate-500 leading-relaxed">{catatanRingkasan}</p>}
            </div>
          )}

          {/* Verification Instructions */}
          {/* Petunjuk — daftar ulang bila LULUS, observasi bila belum ada pengumuman */}
          {record.hasilPengumuman === 'LULUS' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-900">📌 Petunjuk Daftar Ulang:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-emerald-900 text-[11px]">
                <li>Bawa cetakan Bukti Diterima ini saat daftar ulang di madrasah.</li>
                <li>Lakukan konfirmasi kehadiran santri dan pelunasan sisa biaya perlengkapan/seragam di sekretariat madrasah.</li>
                <li>Pengambilan seragam madrasah dilakukan saat daftar ulang.</li>
                <li>Jadwal daftar ulang mengikuti pengumuman dari panitia.</li>
              </ol>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-amber-900">📌 Petunjuk Verifikasi Berkas Fisik:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-amber-900 text-[11px]">
                <li>Bawa Cetakan Bukti Pendaftaran ini ke Panitia SPMB di Madrasah.</li>
                <li>Bawa dokumen asli & fotokopi: Kartu Keluarga (KK), Akta Kelahiran, Pas Foto 3x4 (2 lembar).</li>
                <li>Bagi Siswa Pindahan: Bawa Surat Keterangan Pindah & Rapor Asli.</li>
              </ol>
            </div>
          )}

          {/* Footer & Digital Stamp Signature */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-center sm:text-left">
            <p className="text-[10px] text-slate-500 max-w-[220px]">
              Verifikasi ke panitia dengan Nomor Pendaftaran &amp; PIN 6 Digit
            </p>

            <div className="text-center space-y-1">
              <p className="text-[11px] text-slate-600">Panitia SPMB Online,</p>
              <div className="h-10 sm:h-12 flex items-center justify-center text-emerald-800 font-bold italic">
                {settings.enableDigitalStamp ? '[STEMPEL DIGITAL PANITIA]' : ''}
              </div>
              <p className="font-bold text-slate-900">{settings.namaKepalaMadrasah}</p>
              <p className="text-[10px] text-slate-500">Kepala Madrasah</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
