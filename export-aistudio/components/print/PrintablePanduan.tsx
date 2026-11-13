'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { SchoolSettings } from '@/lib/types';

interface PrintablePanduanProps {
  settings: SchoolSettings;
  onClose: () => void;
}

interface GuideShot {
  hp: string;
  hpAlt: string;
  pc: string;
  pcAlt: string;
  caption: string;
}

interface GuideStep {
  no: string;
  title: string;
  shots: GuideShot[];
  points: string[];
  callout?: { tone: 'warn' | 'tip'; text: string };
}

const STEPS: GuideStep[] = [
  {
    no: '1',
    title: 'Buka situs & klik Daftar Sekarang',
    shots: [
      {
        hp: '/panduan/01-beranda.jpg',
        hpAlt: 'Halaman depan portal SPMB di HP',
        pc: '/panduan/01-beranda-pc.jpg',
        pcAlt: 'Halaman depan portal SPMB di PC',
        caption: 'Halaman depan portal SPMB — tombol Daftar Sekarang dan Lacak Status',
      },
    ],
    points: [
      'Buka portal SPMB MI Ishlahul Ummah di HP atau komputer Anda.',
      'Klik tombol hijau “Daftar Sekarang (Mulai Formulir)”.',
      'Tombol “Lacak Status” dipakai nanti untuk mengecek status pendaftaran (Langkah 10).',
    ],
  },
  {
    no: '2',
    title: 'Isi data akun (wali & calon santri)',
    shots: [
      {
        hp: '/panduan/02-akun.jpg',
        hpAlt: 'Formulir akun di HP',
        pc: '/panduan/02-akun-pc.jpg',
        pcAlt: 'Formulir akun di PC',
        caption: 'Formulir akun awal — hanya tiga isian wajib',
      },
    ],
    points: [
      'Pastikan tab “Mulai Daftar Baru” yang aktif.',
      'Isi Nama Orang Tua/Wali, Nomor WhatsApp Aktif, dan Nama Calon Santri/Siswa.',
      'Email orang tua boleh dikosongkan (opsional).',
      'Klik “Lanjut Isi Formulir Pendaftaran Sekarang”.',
    ],
    callout: {
      tone: 'tip',
      text: 'Pakai nomor WhatsApp yang aktif — nomor pendaftaran & jadwal observasi dikirim ke nomor ini. Satu nomor WA hanya untuk satu pendaftaran.',
    },
  },
  {
    no: '3',
    title: 'SIMPAN PIN 6 Digit Anda — langkah terpenting',
    shots: [
      {
        hp: '/panduan/02b-simpan-pin.jpg',
        hpAlt: 'Layar Simpan PIN Anda di HP',
        pc: '/panduan/02b-simpan-pin-pc.jpg',
        pcAlt: 'Layar Simpan PIN Anda di PC',
        caption: 'Layar “Simpan PIN Anda” — PIN 6 digit tampil besar di tengah layar',
      },
    ],
    points: [
      'PIN dibuat OTOMATIS oleh sistem — Anda tidak perlu mengetik PIN.',
      'Layar “Simpan PIN Anda” menampilkan Nomor Registrasi dan PIN 6 digit besar.',
      'Segera tekan “Salin PIN” atau “Simpan ke WhatsApp” agar tersimpan di HP Anda.',
      'PIN dipakai untuk masuk kembali dan mengecek status pendaftaran.',
    ],
    callout: {
      tone: 'warn',
      text: 'PERHATIAN: Nomor Registrasi di layar ini MASIH SEMENTARA. Nomor RESMI Anda adalah yang tampil di halaman sukses setelah kirim (Langkah 9) — nomornya bisa berbeda. PIN-nya tetap sama. Bila PIN hilang, Anda harus menghubungi panitia (lihat Langkah 10).',
    },
  },
  {
    no: '4',
    title: 'Langkah 1: Data Calon Santri',
    shots: [
      {
        hp: '/panduan/03-langkah1.jpg',
        hpAlt: 'Formulir Langkah 1 di HP',
        pc: '/panduan/03-langkah1-pc.jpg',
        pcAlt: 'Formulir Langkah 1 di PC',
        caption: 'Formulir Langkah 1 — nama sudah terisi dari data akun, kolom NIK dan No. KK masih kosong',
      },
    ],
    points: [
      'Isi sesuai KK & Akta Kelahiran: Nama Lengkap, Nama Panggilan, NIK 16 digit, No. KK 16 digit, Tempat & Tanggal Lahir, Jenis Kelamin, Anak ke-, Jumlah Saudara, dan Asal TK/RA.',
      'NISN dan Nomor KIP opsional — kosongkan bila belum memiliki.',
      'Wajib dipilih: Kewarganegaraan, Agama, dan Yang Membiayai Sekolah.',
      'Klik “LANJUT KE LANGKAH 2”.',
    ],
    callout: {
      tone: 'warn',
      text: 'Usia: anak harus berusia 6 tahun per 1 Juli 2027 (lahir paling lambat 1 Juli 2021). Bila tanggal lahir lebih muda, formulir akan menolak.',
    },
  },
  {
    no: '5',
    title: 'Langkah 2: Data Orang Tua / Wali',
    shots: [
      {
        hp: '/panduan/04-langkah2.jpg',
        hpAlt: 'Formulir Langkah 2 di HP',
        pc: '/panduan/04-langkah2-pc.jpg',
        pcAlt: 'Formulir Langkah 2 di PC',
        caption: 'Formulir Langkah 2 — status ayah dan ibu wajib dipilih dulu',
      },
    ],
    points: [
      'Pilih Status Ayah dan Ibu (Masih Hidup / Sudah Meninggal / Tidak Diketahui), lalu isi nama, NIK, tempat lahir, dan No. HP masing-masing.',
      'Data wali bersifat opsional bila kedua orang tua masih ada.',
      'Klik “LANJUT KE LANGKAH 3”.',
    ],
  },
  {
    no: '6',
    title: 'Langkah 3: Alamat Domisili',
    shots: [
      {
        hp: '/panduan/05-langkah3.jpg',
        hpAlt: 'Formulir Langkah 3 di HP',
        pc: '/panduan/05-langkah3-pc.jpg',
        pcAlt: 'Formulir Langkah 3 di PC',
        caption: 'Formulir Langkah 3 — pilih wilayah berurutan dari provinsi sampai kelurahan',
      },
    ],
    points: [
      'Pilih berurutan: Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa. Daftar berikutnya baru muncul setelah yang sebelumnya dipilih.',
      'Isi Nomor RT, Nomor RW, Alamat Jalan, dan Kode Pos (kode pos terisi otomatis dari kelurahan — periksa dan betulkan bila salah).',
      'Klik “LANJUT KE LANGKAH 4”.',
    ],
  },
  {
    no: '7',
    title: 'Langkah 4: Unggah Berkas',
    shots: [
      {
        hp: '/panduan/06-langkah4.jpg',
        hpAlt: 'Formulir Langkah 4 di HP',
        pc: '/panduan/06-langkah4-pc.jpg',
        pcAlt: 'Formulir Langkah 4 di PC',
        caption: 'Formulir Langkah 4 — tiap berkas punya tombol unggah sendiri',
      },
    ],
    points: [
      'WAJIB diunggah: Kartu Keluarga dan Akta Kelahiran. Pas Foto 3x4 anak juga disiapkan.',
      'Bukti NISN bersifat opsional. Bila anak sudah memegang Ijazah TK/RA, ijazah tersebut WAJIB diunggah (jawab dulu pertanyaan “Apakah sudah memegang ijazah TK/RA?”).',
      'Format JPG, JPEG, PNG, atau PDF — maksimal 2 MB per file. Foto/scan harus jelas dan terbaca.',
      'Klik “TINJAU KEMBALI FORMULIR” bila semua berkas sudah terunggah.',
    ],
    callout: {
      tone: 'warn',
      text: 'Unggah SATU PER SATU: pilih satu berkas, tunggu sampai muncul tanda “Telah Diunggah”, baru lanjut ke berkas berikutnya. Mengunggah beberapa berkas sekaligus bisa membuat salah satunya tidak tersimpan.',
    },
  },
  {
    no: '8',
    title: 'Langkah 5: Tinjau & Kirim',
    shots: [
      {
        hp: '/panduan/07-review.jpg',
        hpAlt: 'Halaman Tinjau dan Kirim di HP',
        pc: '/panduan/07-review-pc.jpg',
        pcAlt: 'Halaman Tinjau dan Kirim di PC',
        caption: 'Halaman tinjau akhir — PIN tampil lagi di bagian atas',
      },
    ],
    points: [
      'Periksa kembali seluruh data siswa, orang tua, alamat, dan berkas. Ada tombol “Ubah” di tiap bagian bila ada yang salah.',
      'PIN 6 digit Anda ditampilkan lagi di bagian atas halaman ini.',
      'Centang Pakta Integritas, lalu klik “Kirim Pendaftaran”.',
    ],
  },
  {
    no: '9',
    title: 'Halaman Sukses: catat nomor resmi Anda',
    shots: [
      {
        hp: '/panduan/08-sukses.jpg',
        hpAlt: 'Halaman sukses bagian atas di HP',
        pc: '/panduan/08-sukses-1-pc.jpg',
        pcAlt: 'Halaman sukses bagian atas di PC',
        caption: 'Halaman sukses (atas) — nomor resmi & PIN',
      },
      {
        hp: '/panduan/08-sukses-2.jpg',
        hpAlt: 'Halaman sukses bagian bawah di HP',
        pc: '/panduan/08-sukses-2-pc.jpg',
        pcAlt: 'Halaman sukses bagian bawah di PC',
        caption: 'Halaman sukses (bawah) — langkah berikutnya',
      },
    ],
    points: [
      'Setelah terkirim, muncul “Pendaftaran Berhasil Disimpan — Alhamdulillah, Formulir Telah Diterima!” dengan NOMOR PENDAFTARAN RESMI dan PIN AKSES.',
      'INILAH nomor yang dipakai untuk cek status — bukan nomor sementara di Langkah 3.',
      'Tekan “Salin No. Reg & PIN” atau “Simpan ke WhatsApp”.',
      'Langkah berikutnya: (1) Cetak Lembar Bukti Registrasi, (2) Hadir Observasi Ramah Anak sesuai jadwal, (3) Pantau hasil seleksi & biaya di Dashboard Wali.',
    ],
  },
  {
    no: '10',
    title: 'Cek status & Dashboard Wali',
    shots: [
      {
        hp: '/panduan/09-cek-status.jpg',
        hpAlt: 'Layar masuk Cek Status di HP',
        pc: '/panduan/09-cek-status-pc.jpg',
        pcAlt: 'Layar masuk Cek Status di PC',
        caption: 'Layar masuk Cek Status — nomor WA / nomor pendaftaran + PIN',
      },
      {
        hp: '/panduan/10-dashboard.jpg',
        hpAlt: 'Dashboard Wali di HP',
        pc: '/panduan/10-dashboard-1-pc.jpg',
        pcAlt: 'Dashboard Wali di PC',
        caption: 'Dashboard Wali — status menunggu verifikasi berkas',
      },
    ],
    points: [
      'Klik “Lacak Status” di beranda, lalu masukkan No. WhatsApp (atau Nomor Pendaftaran) dan PIN 6 Digit, kemudian klik Masuk.',
      'Dashboard menampilkan status verifikasi berkas, tombol “Cetak Lembar Bukti”, dan rincian biaya.',
      'Lupa PIN? Klik “Lupa PIN?” — Anda diarahkan ke WhatsApp panitia dengan pesan terisi otomatis. Siapkan bukti pendaftaran Anda.',
    ],
  },
];

const TROUBLESHOOTING: { problem: string; solution: string }[] = [
  {
    problem: '“NIK sudah terdaftar”',
    solution: 'Anak sudah pernah didaftarkan. Masuk dengan nomor WA yang sama + PIN, atau hubungi panitia.',
  },
  {
    problem: '“Nomor WhatsApp sudah dipakai”',
    solution: 'Satu nomor WA hanya untuk satu pendaftaran. Masuk dengan nomor itu + PIN, atau pakai nomor WA lain.',
  },
  {
    problem: 'Tanggal lahir ditolak',
    solution: 'Anak belum berusia 6 tahun per 1 Juli 2027. Pendaftaran hanya untuk anak yang lahir paling lambat 1 Juli 2021.',
  },
  {
    problem: 'Berkas gagal diunggah',
    solution: 'Periksa ukuran (maks 2 MB) dan format (JPG/PNG/PDF). Unggah satu per satu dan tunggu tanda “Telah Diunggah”.',
  },
  {
    problem: 'Tidak bisa masuk dashboard',
    solution: 'Periksa PIN 6 digit (sama seperti di layar “Simpan PIN” / halaman sukses). Bila tetap gagal, hubungi panitia.',
  },
  {
    problem: 'Nomor pendaftaran di layar PIN berbeda dengan di halaman sukses',
    solution: 'Itu wajar: nomor di layar PIN masih sementara. Yang resmi adalah nomor di halaman sukses (Langkah 9). PIN-nya sama.',
  },
];

export const PrintablePanduan: React.FC<PrintablePanduanProps> = ({ settings, onClose }) => {
  const fee = (settings.biayaPendaftaran || 183000).toLocaleString('id-ID');
  const ta = settings.activeAcademicYear || '2027/2028';
  const wa = settings.kontakWhatsapp || '085196677872';
  const alamat = settings.alamatMadrasah || 'Pranti, Kec. Sedati, Kab. Sidoarjo, Jawa Timur 61253';
  const jam = settings.cmsContent?.jamPelayanan || 'Senin – Sabtu: 07.30 – 14.00 WIB';

  const handlePrint = () => {
    try {
      const origin = window.location.origin;
      const stepsHtml = STEPS.map(
        (s) => `
          <div class="step">
            <div class="step-head"><span class="step-no">${s.no}</span><h3>${s.title}</h3></div>
            <ul>${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>
            ${s.shots
              .map(
                (shot) => `
              <div class="shots-dual">
                <figure class="hp"><img src="${origin}${shot.hp}" alt="${shot.hpAlt}" /><figcaption>Tampilan HP</figcaption></figure>
                <figure class="pc"><img src="${origin}${shot.pc}" alt="${shot.pcAlt}" /><figcaption>Tampilan PC</figcaption></figure>
              </div>
              <p class="shot-cap">${shot.caption}</p>`
              )
              .join('')}
            ${
              s.callout
                ? `<div class="callout ${s.callout.tone}">${s.callout.text}</div>`
                : ''
            }
          </div>`
      ).join('');
      const troubleHtml = TROUBLESHOOTING.map(
        (t) => `<tr><td><strong>${t.problem}</strong></td><td>${t.solution}</td></tr>`
      ).join('');

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panduan Pendaftaran Online SPMB - ${settings.namaMadrasah}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; line-height: 1.55; background: #ffffff; margin: 0; }
              .no-print { display: flex; gap: 10px; margin-bottom: 20px; background: #f1f5f9; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; align-items: center; justify-content: space-between; flex-wrap: wrap; }
              .btn-print { background: #065f46; color: #ffffff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px; }
              .btn-close { background: #ffffff; color: #333; border: 1px solid #ccc; padding: 10px 16px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; }
              .container { max-width: 760px; margin: 0 auto; }
              .header { border-bottom: 3px solid #065f46; padding-bottom: 12px; margin-bottom: 16px; }
              .kemenag { font-size: 10px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
              .school-name { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 2px 0; }
              .submeta { font-size: 11px; color: #475569; margin: 0; }
              h1.doc { font-size: 20px; font-weight: 900; margin: 14px 0 4px 0; }
              .notice { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 10px 14px; font-size: 12px; margin: 12px 0 20px 0; }
              .prep { background: #f7f4ec; border: 1px solid #e7e5e4; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
              .prep h3 { margin: 0 0 6px 0; font-size: 13px; color: #065f46; }
              .prep ul { margin: 0; padding-left: 20px; }
              .step { page-break-inside: avoid; margin-bottom: 26px; }
              .step-head { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
              .step-no { width: 30px; height: 30px; border-radius: 50%; background: #065f46; color: #fff; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
              .step h3 { margin: 0; font-size: 15px; }
              .step ul { margin: 4px 0 8px 0; padding-left: 22px; font-size: 13px; }
              .step img { display: block; width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; }
              .shots-dual { display: flex; gap: 8px; align-items: flex-start; margin: 8px 0 2px 0; }
              .shots-dual figure { margin: 0; }
              .shots-dual figure.hp { width: 120px; flex-shrink: 0; }
              .shots-dual figure.pc { flex: 1; min-width: 0; }
              .shots-dual figcaption { font-size: 10px; color: #64748b; text-align: center; margin-top: 4px; }
              .shot-cap { font-size: 11px; color: #64748b; text-align: center; margin: 2px 0 10px 0; }
              .callout { font-size: 12px; border-radius: 10px; padding: 10px 12px; margin-top: 10px; }
              .callout.warn { background: #fef2f2; border: 1px solid #fca5a5; color: #7f1d1d; }
              .callout.tip { background: #ecfdf5; border: 1px solid #6ee7b7; color: #064e3b; }
              table.trouble { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
              table.trouble td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
              table.trouble td:first-child { width: 38%; }
              h2.sec { font-size: 15px; margin: 22px 0 4px 0; }
              .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #065f46; font-size: 11px; color: #475569; }
              @media print { .no-print { display: none !important; } .step { page-break-inside: avoid; } }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan ke PDF</button>
              <button class="btn-close" onclick="window.close()">Tutup</button>
            </div>
            <div class="container">
              <div class="header">
                <p class="kemenag">Kementerian Agama • MI Ishlahul Ummah</p>
                <p class="school-name">${settings.namaMadrasah}</p>
                <p class="submeta">${alamat} | WA: ${wa} | ${jam}</p>
              </div>
              <h1 class="doc">Panduan Pendaftaran Online SPMB ${ta}</h1>
              <p style="font-size:13px; color:#475569; margin:0;">Panduan langkah demi langkah dengan gambar — dari membuat akun sampai mengecek status pendaftaran. Biaya pendaftaran Rp ${fee}.</p>
              <div class="notice"><strong>Gambar contoh:</strong> semua gambar di panduan ini berasal dari pendaftaran percobaan — nomor pendaftaran dan PIN Anda akan berbeda dengan yang ada di gambar.</div>
              <div class="prep">
                <h3>Yang perlu disiapkan sebelum mendaftar</h3>
                <ul>
                  <li>Kartu Keluarga, Akta Kelahiran, dan Pas Foto anak (foto/scan jelas, maks 2 MB per file, format JPG/PNG/PDF).</li>
                  <li>Nomor HP/WhatsApp aktif — satu nomor hanya untuk satu pendaftaran.</li>
                  <li>Data anak: NIK 16 digit, No. KK 16 digit, tempat & tanggal lahir (anak berusia minimal 6 tahun per 1 Juli 2027).</li>
                </ul>
              </div>
              ${stepsHtml}
              <h2 class="sec">Kalau ada masalah</h2>
              <table class="trouble">${troubleHtml}</table>
              <div class="footer">
                Sekretariat SPMB ${settings.namaMadrasah} — ${alamat}. WhatsApp: ${wa}. Jam layanan: ${jam}. Panduan ini dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() { window.focus(); window.print(); }, 500);
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
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-4 sm:my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Panduan Pendaftaran Online SPMB {ta}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah demi langkah dengan gambar — dari membuat akun sampai mengecek status.
              Biaya pendaftaran Rp {fee}.
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

        <div className="py-5 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] sm:text-xs text-amber-900">
            <strong>Gambar contoh:</strong> semua gambar di panduan ini berasal dari pendaftaran
            percobaan — nomor pendaftaran dan PIN Anda akan berbeda dengan yang ada di gambar.
          </div>

          <div className="bg-[#F7F4EC] border border-[#E7E5E4] rounded-xl p-4">
            <h4 className="font-extrabold text-[#065F46] text-xs sm:text-sm mb-2">
              Yang perlu disiapkan sebelum mendaftar
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kartu Keluarga, Akta Kelahiran, dan Pas Foto anak (foto/scan jelas, maks 2 MB per file, format JPG/PNG/PDF).</li>
              <li>Nomor HP/WhatsApp aktif — satu nomor hanya untuk satu pendaftaran.</li>
              <li>Data anak: NIK 16 digit, No. KK 16 digit, tempat & tanggal lahir (anak berusia minimal 6 tahun per 1 Juli 2027).</li>
            </ul>
          </div>

          {STEPS.map((s) => (
            <div key={s.no} className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#065F46] text-white font-black flex items-center justify-center text-sm shrink-0">
                  {s.no}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{s.title}</h4>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {s.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              {s.shots.map((shot, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-start">
                    <figure className="w-[120px] shrink-0">
                      <img
                        src={shot.hp}
                        alt={shot.hpAlt}
                        loading="lazy"
                        className="block w-full rounded-xl border border-slate-200"
                      />
                      <figcaption className="text-center text-[10px] text-slate-400 mt-1">
                        Tampilan HP
                      </figcaption>
                    </figure>
                    <figure className="flex-1 min-w-0">
                      <img
                        src={shot.pc}
                        alt={shot.pcAlt}
                        loading="lazy"
                        className="block w-full rounded-xl border border-slate-200"
                      />
                      <figcaption className="text-center text-[10px] text-slate-400 mt-1">
                        Tampilan PC
                      </figcaption>
                    </figure>
                  </div>
                  <p className="text-center text-[11px] text-slate-400">{shot.caption}</p>
                </div>
              ))}
              {s.callout && (
                <div
                  className={
                    s.callout.tone === 'warn'
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 text-[11px] sm:text-xs'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-[11px] sm:text-xs'
                  }
                >
                  {s.callout.text}
                </div>
              )}
            </div>
          ))}

          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mb-2">
              Kalau ada masalah
            </h4>
            <div className="space-y-2">
              {TROUBLESHOOTING.map((t) => (
                <div key={t.problem} className="border border-slate-200 rounded-xl p-3">
                  <p className="font-bold text-slate-800">{t.problem}</p>
                  <p>{t.solution}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            Sekretariat SPMB {settings.namaMadrasah} — {alamat}. WhatsApp: {wa}. Jam layanan:{' '}
            {jam}.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-theme-secondary !py-2.5 !px-4 text-xs cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-theme-primary !py-2.5 !px-5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            🖨 Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
