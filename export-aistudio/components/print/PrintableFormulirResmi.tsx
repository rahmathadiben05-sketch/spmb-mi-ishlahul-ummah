'use client';

import React from 'react';
import { RegistrationRecord, SchoolSettings } from '@/lib/types';
import { School } from 'lucide-react';

interface PrintableFormulirResmiProps {
  record: RegistrationRecord;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintableFormulirResmi: React.FC<PrintableFormulirResmiProps> = ({
  record,
  settings,
  onClose,
}) => {
  const studentPhotoUrl = record.documents?.foto?.url || record.student?.fotoUrl;

  // Bila data verifikasi belum ada, SEMUA item false — jangan pernah default lolos.
  const v = record.verification || {
    kkSesuai: false,
    aktaSesuai: false,
    nikSesuai: false,
    dokumenLengkap: false,
    wawancaraSelesai: false,
    pembayaranLunas: false,
    berkasDiterima: false,
  };
  // isVerified HANYA true bila verifiedAt DAN verifiedBy benar-benar
  // terisi (Paket A). Objek verification yang selalu ada TIDAK BOLEH
  // dianggap terverifikasi — server mengembalikan keduanya kosong bila
  // belum ada verifikasi (Sheets tidak punya kolom untuk keduanya).
  const isVerified = !!(record.verification?.verifiedAt && record.verification?.verifiedBy);

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
            <title>Formulir Pendaftaran Resmi SPMB - ${record.nomorPendaftaran}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; line-height: 1.5; background: #ffffff; margin: 0; }
              .no-print { display: flex; gap: 10px; margin-bottom: 20px; background: #f1f5f9; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; align-items: center; justify-content: space-between; flex-wrap: wrap; }
              .btn-print { background: #065f46; color: #ffffff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .btn-close { background: #ffffff; color: #333; border: 1px solid #ccc; padding: 10px 16px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; }
              .container { max-width: 900px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 28px; border-radius: 12px; background: #fff; }
              .header { display: flex; flex-direction: row; align-items: center; justify-content: space-between; border-bottom: 3px solid #065f46; padding-bottom: 12px; margin-bottom: 16px; gap: 12px; }
              .header-left { display: flex; align-items: center; gap: 16px; }
              .logo { width: 56px; height: 56px; background: #065f46; color: #fde047; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; flex-shrink: 0; }
              .kemenag { font-size: 10px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
              .school-name { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 2px 0; }
              .submeta { font-size: 11px; color: #475569; margin: 0; }
              .reg-badge { text-align: right; border-left: 1px solid #cbd5e1; padding-left: 16px; flex-shrink: 0; }
              .reg-no { font-family: monospace; font-size: 16px; font-weight: 900; color: #065f46; margin: 2px 0; }
              .doc-title { text-align: center; margin: 16px 0; }
              .doc-title h2 { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; text-decoration: underline; color: #0f172a; }
              .doc-title p { font-size: 12px; font-weight: 700; color: #475569; margin: 2px 0 0 0; }
              .section-title { font-weight: 800; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; text-transform: uppercase; font-size: 11px; margin: 16px 0 8px 0; }
              .student-flex { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
              .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 6px 20px; padding: 4px 8px; font-size: 12px; flex: 1; }
              .label { color: #64748b; }
              .photo-box { width: 110px; height: 145px; border: 1px solid #0f172a; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #f8fafc; display: flex; align-items: center; justify-content: center; text-align: center; }
              .photo-placeholder { width: 110px; height: 145px; border: 2px dashed #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; color: #64748b; font-weight: bold; background: #f8fafc; }
              .chk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; padding: 8px; font-size: 11px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; }
              .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; text-align: center; font-size: 12px; }
              .sig-space { height: 60px; display: flex; align-items: flex-end; justify-content: center; font-weight: bold; }
              @media (max-width: 640px) {
                .header { flex-direction: column; text-align: center; }
                .header-left { flex-direction: column; }
                .reg-badge { text-align: center; border-left: none; border-top: 1px solid #cbd5e1; padding-left: 0; padding-top: 8px; width: 100%; }
                .sig-grid { grid-template-columns: 1fr; gap: 24px; }
              }
              @media print {
                .no-print { display: none !important; }
                body { padding: 0; background: #fff; }
                .container { border: none; padding: 0; max-width: 100%; }
                .header { flex-direction: row; text-align: left; }
                .header-left { flex-direction: row; }
                .reg-badge { text-align: right; border-left: 1px solid #cbd5e1; border-top: none; padding-left: 16px; padding-top: 0; width: auto; }
                .sig-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <span style="font-size:12px; font-weight:bold; color:#065f46;">Pratinjau Formulir Resmi SPMB</span>
              <div style="display:flex; gap:8px;">
                <button class="btn-print" onclick="window.print()">🖨 Cetak Formulir Resmi Sekarang</button>
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
                  <div style="font-size:9px; font-weight:bold; color:#94a3b8; text-transform:uppercase;">NO. REGISTRASI RESMI</div>
                  <div class="reg-no">${record.nomorPendaftaran}</div>
                  <div style="font-size:10px; font-weight:bold; color:#065f46; background:#d1fae5; padding:2px 6px; border-radius:4px; display:inline-block; margin-top:4px;">
                    STATUS: ${record.status.toUpperCase()}
                  </div>
                </div>
              </div>
              <div class="doc-title">
                <h2>FORMULIR PENERIMAAN MURID BARU RESMI</h2>
                <p>TAHUN AJARAN ${record.academicYear}</p>
              </div>
              <div>
                <div class="section-title">I. IDENTITAS CALON SISWA</div>
                <div class="student-flex">
                  <div class="grid-2">
                    <p><span class="label">1. Nama Lengkap:</span> <strong>${record.student.namaLengkap}</strong></p>
                    <p><span class="label">2. Nama Panggilan:</span> ${record.student.namaPanggilan || '-'}</p>
                    <p><span class="label">3. NIK Siswa:</span> <strong>${record.student.nik}</strong></p>
                    <p><span class="label">4. No. Kartu Keluarga:</span> <strong>${record.student.noKk}</strong></p>
                    ${record.student.nomorKip ? `<p><span class="label">5. Nomor KIP:</span> <strong>${record.student.nomorKip}</strong> (Program PIP)</p>` : ''}
                    <p><span class="label">6. NISN:</span> ${record.student.nisn || '-'}</p>
                    <p><span class="label">7. TTL:</span> ${record.student.tempatLahir}, ${record.student.tanggalLahir}</p>
                    <p><span class="label">8. Jenis Kelamin:</span> ${record.student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                    <p><span class="label">9. Anak Ke / Jml Saudara:</span> Anak ke-${record.student.anakKe}${record.student.jumlahSaudara ? ` dari ${record.student.jumlahSaudara} bersaudara` : ''}</p>
                    <p><span class="label">10. Asal Sekolah TK/RA:</span> <strong>${record.student.asalSekolah || '-'}</strong></p>
                    <p><span class="label">11. Berkebutuhan Khusus:</span> ${record.student.kebutuhanKhusus || '-'}</p>
                    <p><span class="label">12. Status Ijazah TK:</span> <strong>${record.documents?.memilikiIjazahTk ? 'Memegang Ijazah TK (Wajib Upload)' : 'Belum/Tidak Memegang Ijazah TK'}</strong></p>
                  </div>
                  <div style="margin: 0 auto;">
                    ${
                      studentPhotoUrl
                        ? `<img src="${studentPhotoUrl}" alt="Foto ${record.student.namaLengkap}" class="photo-box" />`
                        : `<div class="photo-placeholder">FOTO SISWA<br>3 x 4</div>`
                    }
                  </div>
                </div>
              </div>
              <div>
                <div class="section-title">II. DATA ORANG TUA / WALI</div>
                <div class="grid-2">
                  <p><span class="label">1. Nama Ayah Kandung:</span> <strong>${record.parent.ayah.namaLengkap}</strong></p>
                  <p><span class="label">2. Status Keberadaan Ayah:</span> <strong>${record.parent.ayah.status || 'Masih Hidup'}</strong></p>
                  <p><span class="label">3. NIK Ayah Kandung:</span> <strong>${record.parent.ayah.nik || '-'}</strong></p>
                  <p><span class="label">4. TTL Ayah:</span> ${record.parent.ayah.tempatLahir || '-'}, ${record.parent.ayah.tanggalLahir || '-'}</p>
                  <p><span class="label">5. Pendidikan Ayah:</span> ${record.parent.ayah.pendidikan || '-'}</p>
                  <p><span class="label">6. Pekerjaan Ayah:</span> ${record.parent.ayah.pekerjaan || '-'}</p>
                  <p><span class="label">7. Penghasilan Ayah:</span> ${record.parent.ayah.penghasilan || '-'}</p>
                  <p><span class="label">8. No. HP/WA Ayah:</span> <strong>${record.parent.ayah.noHp || '-'}</strong></p>
                  <p style="border-top:1px solid #e2e8f0; grid-column: 1 / -1; margin: 4px 0;"></p>
                  <p><span class="label">9. Nama Ibu Kandung:</span> <strong>${record.parent.ibu.namaLengkap}</strong></p>
                  <p><span class="label">10. Status Keberadaan Ibu:</span> <strong>${record.parent.ibu.status || 'Masih Hidup'}</strong></p>
                  <p><span class="label">11. NIK Ibu Kandung:</span> <strong>${record.parent.ibu.nik || '-'}</strong></p>
                  <p><span class="label">12. TTL Ibu:</span> ${record.parent.ibu.tempatLahir || '-'}, ${record.parent.ibu.tanggalLahir || '-'}</p>
                  <p><span class="label">13. Pendidikan Ibu:</span> ${record.parent.ibu.pendidikan || '-'}</p>
                  <p><span class="label">14. Pekerjaan Ibu:</span> ${record.parent.ibu.pekerjaan || '-'}</p>
                  <p><span class="label">15. Penghasilan Ibu:</span> ${record.parent.ibu.penghasilan || '-'}</p>
                  <p><span class="label">16. No. HP/WA Ibu:</span> <strong>${record.parent.ibu.noHp || '-'}</strong></p>
                  ${
                    record.parent.wali?.hasWali || record.parent.wali?.namaLengkap
                      ? `
                      <p style="border-top:1px solid #e2e8f0; grid-column: 1 / -1; margin: 4px 0;"></p>
                      <p><span class="label">17. Nama Wali:</span> <strong>${record.parent.wali.namaLengkap}</strong> (${record.parent.wali.status || 'Masih Hidup'})</p>
                      <p><span class="label">18. NIK Wali:</span> <strong>${record.parent.wali.nik || '-'}</strong></p>
                      <p><span class="label">19. Hubungan Wali:</span> ${record.parent.wali.hubungan || 'Wali'}</p>
                      <p><span class="label">20. No. HP/WA Wali:</span> <strong>${record.parent.wali.noHp || '-'}</strong></p>
                      `
                      : ''
                  }
                </div>
              </div>
              <div>
                <div class="section-title">III. ALAMAT DOMISILI</div>
                <div style="padding: 4px 8px; font-size:12px;">
                  ${record.address.alamatLengkap}, RT ${record.address.rt || '-'}/RW ${record.address.rw || '-'}, Desa/Kel. ${record.address.kelurahan}, Kec. ${record.address.kecamatan}, ${record.address.kabupaten}, ${record.address.provinsi} (${record.address.kodePos || '-'})
                </div>
              </div>
              <div>
                <div class="section-title" style="background:#d1fae5; border-color:#6ee7b7; color:#064e3b;">IV. HASIL VERIFIKASI BERKAS PANITIA (CHECKLIST OPERATOR)</div>
                ${!isVerified ? '<div style="font-size:11px; font-weight:bold; color:#991b1b; padding:4px 8px;">Belum Diverifikasi</div>' : ''}
                <div class="chk-grid">
                  <div>✓ KK Sesuai: <strong>${v.kkSesuai ? 'Sesuai' : 'Belum'}</strong></div>
                  <div>✓ Akta Sesuai: <strong>${v.aktaSesuai ? 'Sesuai' : 'Belum'}</strong></div>
                  <div>✓ NIK Sesuai: <strong>${v.nikSesuai ? 'Sesuai' : 'Belum'}</strong></div>
                  <div>✓ Dokumen Lengkap: <strong>${v.dokumenLengkap ? 'Ya' : 'Belum'}</strong></div>
                  <div>✓ Wawancara: <strong>${v.wawancaraSelesai ? 'Selesai' : 'Belum'}</strong></div>
                  <div>✓ Pembayaran: <strong>${v.pembayaranLunas ? 'Lunas' : 'Belum'}</strong></div>
                </div>
              </div>
              <div class="sig-grid">
                <div>
                  <div style="color:#64748b;">Wali Murid,</div>
                  <div class="sig-space">( ${record.parent.ayah.namaLengkap || record.parent.ibu.namaLengkap || '................................'} )</div>
                </div>
                <div>
                  <div style="color:#64748b;">Operator Verifikasi,</div>
                  <div class="sig-space">( ${record.verification?.verifiedBy || 'Panitia SPMB'} )</div>
                </div>
                <div>
                  <div style="color:#64748b;">${settings.cmsContent?.cetakKotaTitimangsa || 'Sidoarjo'}, Mengetahui Kepala Madrasah</div>
                  <div class="sig-space" style="text-decoration:underline;">${settings.cmsContent?.cetakNamaPenandatangan || settings.namaKepalaMadrasah}</div>
                  <div style="font-size:10px; color:#64748b;">NIP: ${settings.cmsContent?.cetakNipPenandatangan || settings.nipKepalaMadrasah}</div>
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
      <div className="printable-card bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl relative my-auto print:p-0 print:shadow-none print:m-0 print:max-w-none print:rounded-none">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-4 border-b border-slate-200 print:hidden mb-4 sm:mb-6 gap-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 text-center sm:text-left">
            Formulir Pendaftaran Resmi & Hasil Verifikasi Operator
          </h3>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
            >
              <span>🖨 Cetak Formulir Resmi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer flex-1 sm:flex-none text-center"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Official Form */}
        <div id="official-form-area" className="text-slate-900 font-sans space-y-4 sm:space-y-5 border border-slate-300 p-4 sm:p-8 rounded-xl print:border-0 print:p-0">
          {/* Header Kop Surat */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left justify-between pb-3 border-b-2 border-emerald-900 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {settings.logoMadrasahUrl ? (
                <img
                  src={settings.logoMadrasahUrl}
                  alt="Logo Madrasah"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-300 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold shrink-0">
                  <School className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              )}
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-900">{settings.instansiInduk || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}</p>
                <h1 className="text-base sm:text-lg font-black uppercase text-slate-900">{settings.namaMadrasah}</h1>
                <p className="text-[10px] text-slate-600">{settings.alamatMadrasah} | Telp/WA: {settings.kontakWhatsapp}</p>
              </div>
            </div>
            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 pl-0 sm:pl-4 border-slate-300 w-full sm:w-auto">
              <p className="text-[9px] uppercase font-bold text-slate-400">NO. REGISTRASI RESMI</p>
              <p className="text-xs sm:text-sm font-mono font-black text-emerald-900">{record.nomorPendaftaran}</p>
              <span className="inline-block mt-1 text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                STATUS: {record.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xs sm:text-sm font-black uppercase underline tracking-wider">
              FORMULIR PENERIMAAN MURID BARU RESMI
            </h2>
            <p className="text-[11px] sm:text-xs font-bold text-slate-600">TAHUN AJARAN {record.academicYear}</p>
          </div>

          {/* Detailed Data Sections */}
          <div className="space-y-4 text-xs">
            {/* 1. DATA SISWA */}
            <div>
              <h3 className="font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300 text-slate-900 uppercase text-[11px] sm:text-xs">
                I. IDENTITAS CALON SISWA
              </h3>
              <div className="flex flex-col-reverse sm:flex-row gap-4 p-2 sm:p-3 items-center sm:items-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 flex-1 w-full">
                  <p><span className="text-slate-500">1. Nama Lengkap:</span> <strong>{record.student.namaLengkap}</strong></p>
                  <p><span className="text-slate-500">2. Nama Panggilan:</span> {record.student.namaPanggilan || '-'}</p>
                  <p><span className="text-slate-500">3. NIK Siswa:</span> <strong className="font-mono">{record.student.nik}</strong></p>
                  <p><span className="text-slate-500">4. No. Kartu Keluarga:</span> <strong className="font-mono">{record.student.noKk}</strong></p>
                  <p><span className="text-slate-500">5. NISN:</span> {record.student.nisn || '-'}</p>
                  <p><span className="text-slate-500">6. TTL:</span> {record.student.tempatLahir}, {record.student.tanggalLahir}</p>
                  <p><span className="text-slate-500">7. Jenis Kelamin:</span> {record.student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  <p><span className="text-slate-500">8. Anak Ke / Jml Saudara:</span> Anak ke-{record.student.anakKe}{record.student.jumlahSaudara ? ` dari ${record.student.jumlahSaudara} bersaudara` : ''}</p>
                  <p className="sm:col-span-2"><span className="text-slate-500">9. Asal Sekolah TK/RA:</span> <strong>{record.student.asalSekolah || '-'}</strong></p>
                  <p className="sm:col-span-2"><span className="text-slate-500">10. Berkebutuhan Khusus:</span> {record.student.kebutuhanKhusus || '-'}</p>
                </div>

                {/* Pas Foto 3x4 Calon Siswa */}
                <div className="shrink-0 flex flex-col items-center justify-center my-1 sm:my-0">
                  {studentPhotoUrl ? (
                    <img
                      src={studentPhotoUrl}
                      alt={`Foto ${record.student.namaLengkap}`}
                      className="w-[100px] h-[133px] sm:w-[110px] sm:h-[145px] object-cover rounded border border-slate-900 shadow-xs"
                    />
                  ) : (
                    <div className="w-[100px] h-[133px] sm:w-[110px] sm:h-[145px] border-2 border-dashed border-slate-400 rounded bg-slate-50 flex flex-col items-center justify-center text-center p-2 text-slate-500 text-[10px] font-bold">
                      <span>FOTO SISWA</span>
                      <span className="text-[9px] font-normal text-slate-400 mt-0.5">3 x 4 cm</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. DATA ORANG TUA / WALI */}
            <div>
              <h3 className="font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300 text-slate-900 uppercase text-[11px] sm:text-xs">
                II. DATA ORANG TUA / WALI
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 p-2 sm:p-3">
                <p><span className="text-slate-500">1. Nama Ayah Kandung:</span> <strong>{record.parent.ayah.namaLengkap}</strong></p>
                <p><span className="text-slate-500">2. NIK Ayah Kandung:</span> <strong className="font-mono">{record.parent.ayah.nik || '-'}</strong></p>
                <p><span className="text-slate-500">3. TTL Ayah:</span> {record.parent.ayah.tempatLahir || '-'}, {record.parent.ayah.tanggalLahir || '-'}</p>
                <p><span className="text-slate-500">4. Pendidikan Ayah:</span> {record.parent.ayah.pendidikan || '-'}</p>
                <p><span className="text-slate-500">5. Pekerjaan Ayah:</span> {record.parent.ayah.pekerjaan || '-'}</p>
                <p><span className="text-slate-500">6. Penghasilan Ayah:</span> {record.parent.ayah.penghasilan || '-'}</p>
                <p><span className="text-slate-500">7. No. HP/WA Ayah:</span> <strong className="font-mono">{record.parent.ayah.noHp || '-'}</strong></p>
                <div className="sm:col-span-2 border-t border-slate-200 my-1"></div>
                <p><span className="text-slate-500">8. Nama Ibu Kandung:</span> <strong>{record.parent.ibu.namaLengkap}</strong></p>
                <p><span className="text-slate-500">9. NIK Ibu Kandung:</span> <strong className="font-mono">{record.parent.ibu.nik || '-'}</strong></p>
                <p><span className="text-slate-500">10. TTL Ibu:</span> {record.parent.ibu.tempatLahir || '-'}, {record.parent.ibu.tanggalLahir || '-'}</p>
                <p><span className="text-slate-500">11. Pendidikan Ibu:</span> {record.parent.ibu.pendidikan || '-'}</p>
                <p><span className="text-slate-500">12. Pekerjaan Ibu:</span> {record.parent.ibu.pekerjaan || '-'}</p>
                <p><span className="text-slate-500">13. Penghasilan Ibu:</span> {record.parent.ibu.penghasilan || '-'}</p>
                <p><span className="text-slate-500">14. No. HP/WA Ibu:</span> <strong className="font-mono">{record.parent.ibu.noHp || '-'}</strong></p>
                {(record.parent.wali?.hasWali || record.parent.wali?.namaLengkap) && (
                  <>
                    <div className="sm:col-span-2 border-t border-slate-200 my-1"></div>
                    <p><span className="text-slate-500">15. Nama Wali:</span> <strong>{record.parent.wali.namaLengkap}</strong></p>
                    <p><span className="text-slate-500">16. NIK Wali:</span> <strong className="font-mono">{record.parent.wali.nik || '-'}</strong></p>
                    <p><span className="text-slate-500">17. Hubungan Wali:</span> {record.parent.wali.hubungan || 'Wali'}</p>
                    <p><span className="text-slate-500">18. No. HP/WA Wali:</span> <strong className="font-mono">{record.parent.wali.noHp || '-'}</strong></p>
                  </>
                )}
              </div>
            </div>

            {/* 3. ALAMAT */}
            <div>
              <h3 className="font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300 text-slate-900 uppercase text-[11px] sm:text-xs">
                III. ALAMAT DOMISILI
              </h3>
              <div className="p-2 sm:p-3">
                <p>{record.address.alamatLengkap}, Desa/Kel. {record.address.kelurahan}, Kec. {record.address.kecamatan}, {record.address.kabupaten}, {record.address.provinsi} ({record.address.kodePos})</p>
              </div>
            </div>

            {/* 4. OPERATOR VERIFICATION CHECKLIST RESULT */}
            <div>
              <h3 className="font-bold bg-emerald-50 px-3 py-1 rounded border border-emerald-300 text-emerald-950 uppercase text-[11px] sm:text-xs">
                IV. HASIL VERIFIKASI BERKAS PANITIA (CHECKLIST OPERATOR)
              </h3>
              {!isVerified && (
                <p className="text-[11px] font-bold text-red-800 px-2 sm:px-3 pt-1">Belum Diverifikasi</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2 sm:p-3 text-[11px]">
                <p>✓ KK Sesuai: <strong>{v.kkSesuai ? 'Sesuai' : 'Belum'}</strong></p>
                <p>✓ Akta Sesuai: <strong>{v.aktaSesuai ? 'Sesuai' : 'Belum'}</strong></p>
                <p>✓ NIK Sesuai: <strong>{v.nikSesuai ? 'Sesuai' : 'Belum'}</strong></p>
                <p>✓ Dokumen Lengkap: <strong>{v.dokumenLengkap ? 'Ya' : 'Belum'}</strong></p>
                <p>✓ Wawancara: <strong>{v.wawancaraSelesai ? 'Selesai' : 'Belum'}</strong></p>
                <p>✓ Pembayaran: <strong>{v.pembayaranLunas ? 'Lunas' : 'Belum'}</strong></p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-4 sm:pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Wali Murid,</p>
              <div className="h-12 sm:h-16 flex items-end justify-center font-bold">
                ( {record.parent.ayah.namaLengkap || record.parent.ibu.namaLengkap || '................................'} )
              </div>
            </div>
            <div>
              <p className="text-slate-500">Operator Verifikasi,</p>
              <div className="h-12 sm:h-16 flex items-end justify-center font-bold">
                ( {record.verification?.verifiedBy || 'Panitia SPMB'} )
              </div>
            </div>
            <div>
              <p className="text-slate-500">Mengetahui, Kepala Madrasah</p>
              <div className="h-12 sm:h-16 flex items-end justify-center font-bold underline">
                {settings.namaKepalaMadrasah}
              </div>
              <p className="text-[10px] text-slate-500">NIP: {settings.nipKepalaMadrasah}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
