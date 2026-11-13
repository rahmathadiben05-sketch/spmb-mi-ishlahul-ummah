import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// GERBANG UX SAJA — BUKAN OTORISASI SERVER (Paket C, N-m7).
// ----------------------------------------------------------------------------
// Route ini HANYA gerbang UX untuk halaman /informasi-pendaftaran: ia
// memeriksa BENTUK token sesi wali (harus `WM-<id>-<timestamp>`, token
// yang dibuat client-side saat login) dan keberadaan nomor pendaftaran
// di cookie sesi. Route ini TIDAK memverifikasi sesi terhadap sesi yang
// diterbitkan server — tidak ada penyimpanan sesi server-side yang bisa
// dicek — dan TIDAK BOLEH diklaim sebagai otorisasi server. Data sensitif
// tidak pernah disajikan dari route ini.
// Data rincian biaya yang tampil di halaman TIDAK berasal dari route ini:
// InformasiPendaftaranView merender langsung dari settings live
// (settings.rincianBiayaPendaftaran) — karena itu OFFICIAL_BIAYA_DATA
// hardcode yang dulu ada di sini DIHAPUS (angka 183000 dkk. tidak lagi
// diduplikasi di route). Bila suatu hari rincian perlu disajikan server-
// side, sambungkan route ini ke settings server (tab Pengaturan via
// Apps Script), jangan kembalikan hardcode.
// ============================================================================

// Token sesi wali yang sah HANYA yang berbentuk `WM-<id>-<timestamp>`
// (dibuat saat login: `WM-${record.id}-${Date.now()}` atau
// `WM-NEW-${Date.now()}`). String acak apa pun — dulu string > 5 karakter
// apa saja diterima — kini DITOLAK.
const WM_TOKEN_SHAPE = /^WM-[A-Za-z0-9-]+-\d+$/;

export async function GET(req: NextRequest) {
  // Check authorization header or session cookie
  const authHeader = req.headers.get('authorization');
  const cookieSession = req.cookies.get('spmb_applicant_session')?.value;

  let sessionData: any = null;

  // Try parsing from cookie
  if (cookieSession) {
    try {
      sessionData = JSON.parse(decodeURIComponent(cookieSession));
    } catch {
      sessionData = null;
    }
  }

  // Try parsing from Bearer header
  if (!sessionData && authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    try {
      if (rawToken.startsWith('{')) {
        sessionData = JSON.parse(rawToken);
      } else if (WM_TOKEN_SHAPE.test(rawToken)) {
        // Hanya bentuk token WM-* yang diterima — bukan string apa pun.
        sessionData = { authToken: rawToken };
      }
    } catch {
      sessionData = null;
    }
  }

  // Strict verification: Reject if no authenticated session found
  if (!sessionData || (!sessionData.nomorPendaftaran && !sessionData.authToken)) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Akses Ditolak. Halaman dan rincian Informasi Pendaftaran hanya dapat diakses oleh Wali Murid yang telah memiliki akun dan berhasil login.',
      },
      { status: 401 }
    );
  }

  // Gerbang lolos — kembalikan HANYA gema identitas sesi (tanpa data biaya).
  return NextResponse.json({
    success: true,
    applicant: {
      nomorPendaftaran: sessionData.nomorPendaftaran || 'TERDAFTAR',
      studentName: sessionData.studentName || 'Calon Santri',
      parentName: sessionData.parentName || 'Wali Murid',
      jenisKelamin: sessionData.jenisKelamin || 'L',
    },
  });
}
