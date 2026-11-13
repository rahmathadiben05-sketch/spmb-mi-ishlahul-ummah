// ============================================================================
// capture-clean.cjs — Penangkap screenshot panduan SPMB (SKRIP BERSIH).
// Ditulis dari nol pada 2026-11-11 atas persetujuan Rahmat ("pakai skrip bersih").
// Playwright + headless Chromium, koneksi ke situs.
// JALAN KELUAR RESMI (terbukti 2026-11-11): Chromium di VM ini TIDAK BISA
// keluar langsung — egress proxy menutup CONNECT dari proses browser
// (dibuktikan 8 diagnostik: curl/Node lolos, Chromium selalu
// ERR_TUNNEL_CONNECTION_FAILED, bahkan dengan byte CONNECT yang identik).
// Pola yang DIPAKAI RUNTIME SENDIRI (playwright-audit.js, diekspor):
//   startProxyAuthRelay(upstream, user, token) -> relay lokal tanpa token,
//   lalu Chromium diarahkan ke relay itu (tanpa kredensial).
//   "proxy auth token must be routed through relay before launching Chromium"
// Skrip ini MEMAKAI fungsi runtime tersebut (bukan skrip lama, bukan relay
// tulisan sendiri). Token dibaca dari environment saat jalan saja — TIDAK
// PERNAH ditulis ke file/log. Jalankan skrip ini dengan `bun` (modul audit
// adalah ESM) — BUKAN `node`.
// Data TES saja — jangan pernah data siswa asli.
// Alur per viewport: beranda -> buat akun (Daftar Penuh) -> Simpan PIN ->
//   wizard 1-4 -> review -> kirim -> sukses (2 shot) -> login -> dashboard.
// ============================================================================
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const SITE = 'https://export-aistudio.vercel.app/';
const OUT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots';
const UP = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/test-uploads';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${stamp()}]`, ...a);

const FILES = {
  kk: path.join(UP, 'kk-contoh.jpg'),
  akta: path.join(UP, 'akta-contoh.jpg'),
  foto: path.join(UP, 'pasfoto-contoh.jpg'),
};

// --- data tes bersama -------------------------------------------------------
const COMMON = {
  parentName: 'Ayah Contoh',
  studentName: 'Contoh Panduan 3 (Test)',
  dob: '2021-06-15', // lahir <= 1 Juli 2021 (syarat usia 6 thn per 1 Juli 2027)
  ayah: { nama: 'Ahmad Fauzi', nik: '3578010101800001', tempat: 'Sidoarjo', hp: '081299990021' },
  ibu: { nama: 'Siti Rahmawati', nik: '3578010101800002', tempat: 'Sidoarjo', hp: '081299990022' },
  alamat: 'Jl. Contoh No. 1, Pranti',
  rt: '03',
  rw: '02',
  kodePos: '61252',
};

// --- konfigurasi per viewport ----------------------------------------------
const VIEWPORTS = [
  {
    key: 'hp', suffix: '', wa: '081299990006', nik: '3578011506210006', kk: '3578011506210007', ayahHp: '081299990031', ibuHp: '081299990032',
    context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  },
  {
    key: 'pc', suffix: '-pc', wa: '081299990014', nik: '3578011506210014', kk: '3578011506210015', ayahHp: '081299990033', ibuHp: '081299990034',
    context: { viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
  },
];

const SHOTS = [
  '01-beranda', '02-akun', '02b-simpan-pin', '03-langkah1', '04-langkah2',
  '05-langkah3', '06-langkah4', '07-review', '08-sukses-1', '08-sukses-2',
  '09-cek-status', '10-dashboard-1',
];

// --- helper -----------------------------------------------------------------
async function launchBrowser(proxyServer) {
  const opts = {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors'],
  };
  // Chromium diarahkan ke relay lokal runtime (tanpa kredensial).
  if (proxyServer) opts.proxy = { server: proxyServer };
  try {
    return await chromium.launch(opts);
  } catch (e) {
    log('launch bawaan gagal, coba chrome sistem:', String(e).slice(0, 120));
    return await chromium.launch({ ...opts, executablePath: '/opt/meta-chromium/chrome' });
  }
}

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  log('  shot:', name, `(${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
  return file;
}

async function shotBottom(page, name) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(700);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  log('  shot:', name, `(${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
  return file;
}

async function waitText(page, text, timeout = 30000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

// Pilih option pada <select> yang label-nya mengandung labelText.
// valueOrLabel: string label option, atau predicate atas teks option.
async function selectByLabel(page, labelText, pick) {
  const sel = page.locator(`//label[contains(., "${labelText}")]/following::select[1]`);
  await sel.waitFor({ state: 'visible', timeout: 15000 });
  // Tunggu opsi termuat: opsi dimuat async (awal hanya placeholder).
  // Poll hingga opsi yang dicari muncul (maks 30 detik).
  let options = [];
  let values = [];
  let idx = -1;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    options = await sel.locator('option').allTextContents();
    values = await sel.locator('option').evaluateAll((els) => els.map((e) => e.getAttribute('value')));
    idx = typeof pick === 'string'
      ? options.findIndex((t) => t.trim() === pick)
      : options.findIndex((t) => pick(t.trim()));
    if (idx >= 0) break;
    await sleep(500);
  }
  if (idx < 0) throw new Error(`option tidak ditemukan untuk label "${labelText}": cari ${pick}; opsi: ${JSON.stringify(options)}`);
  await sel.selectOption(values[idx]);
  log(`  select [${labelText}] -> "${options[idx].trim()}"`);
  return options[idx].trim();
}

async function fillPlaceholder(page, placeholder, value, nth = 0) {
  const input = page.getByPlaceholder(placeholder, { exact: true }).nth(nth);
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(value);
}

function bumpLastDigit(numStr) {
  const last = parseInt(numStr.slice(-1), 10);
  return numStr.slice(0, -1) + String((last + 1) % 10);
}

// --- alur utama per viewport -------------------------------------------------
async function runViewport(browser, cfg) {
  const result = { viewport: cfg.key, wa: cfg.wa, nik: cfg.nik, kk: cfg.kk, checks: {}, shots: [] };
  const ctx = await browser.newContext(cfg.context);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', (e) => log('  [pageerror]', String(e).slice(0, 200)));
  const S = (base) => `${base}${cfg.suffix}.png`;

  try {
    // 01 — beranda
    await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitText(page, 'Daftar Sekarang');
    await sleep(1200);
    await shot(page, S('01-beranda'));
    result.shots.push('01-beranda');

    // 02 — buat akun (coba beberapa nomor WA bila duplikat)
    await page.getByRole('button', { name: /Daftar Sekarang/ }).first().click();
    await waitText(page, 'Mulai Daftar Baru');
    let waUsed = cfg.wa;
    let created = null;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      const waTry = attempt === 0 ? cfg.wa : String(Number(cfg.wa) + attempt).padStart(12, '0');
      await fillPlaceholder(page, 'Contoh: H. Ahmad Fauzi', COMMON.parentName);
      await fillPlaceholder(page, 'Contoh: 0812xxxxxxx', waTry);
      await fillPlaceholder(page, 'Contoh: Muhammad Rayhan', COMMON.studentName);
      // Mode wajib: Daftar Penuh (bukan Inden Kursi)
      await page.getByText('Daftar Penuh', { exact: true }).first().click();
      await sleep(300);
      if (attempt === 0) {
        await shot(page, S('02-akun'));
        result.shots.push('02-akun');
      }
      await page.getByRole('button', { name: /Lanjut Isi Formulir Pendaftaran Sekarang/ }).click();
      try {
        await waitText(page, 'Simpan PIN Anda', 12000);
        waUsed = waTry;
        created = true;
      } catch {
        const bodyText = (await page.locator('body').innerText()).slice(0, 500);
        log(`  [${cfg.key}] akun WA ${waTry} tidak lanjut (coba berikutnya). Cuplikan:`, bodyText.replace(/\n/g, ' | ').slice(0, 220));
        // Bila sudah masuk tab login (duplikat WA), kembali ke tab daftar.
        const loginTab = page.getByText('Mulai Daftar Baru', { exact: true });
        if (await loginTab.count()) await loginTab.first().click().catch(() => {});
        await sleep(800);
      }
    }
    if (!created) throw new Error('gagal membuat akun setelah 3 nomor WA');
    result.wa = waUsed;

    // 02b — Simpan PIN Anda
    const tempRegNo = await page
      .locator(`//span[contains(., "Nomor Registrasi Sementara")]/following::span[1]`)
      .innerText();
    const tempPin = (await page.locator('#created-pin-value').innerText()).trim();
    result.tempRegNo = tempRegNo.trim();
    result.tempPin = tempPin;
    await waitText(page, 'Nomor Registrasi Sementara', 15000).catch(() => {});
    // innerText menerapkan text-transform (huruf besar) — bandingkan tanpa case.
    result.checks.pinScreenLabel = (await page.locator('body').innerText()).toLowerCase().includes('nomor registrasi sementara');
    log(`  [${cfg.key}] akun dibuat: temp=${result.tempRegNo} PIN=${tempPin} (label sementara: ${result.checks.pinScreenLabel})`);
    await shot(page, S('02b-simpan-pin'));
    result.shots.push('02b-simpan-pin');

    // Masuk wizard
    await page.getByRole('button', { name: /Lanjut Isi Formulir/ }).first().click();
    await waitText(page, 'LANGKAH 1', 20000);

    // 03 — Langkah 1 (coba NIK, bila duplikat ubah digit akhir sekali)
    let nikUsed = cfg.nik;
    let kkUsed = cfg.kk;
    let step1ok = false;
    for (let attempt = 0; attempt < 2 && !step1ok; attempt++) {
      await fillPlaceholder(page, 'Sesuai Akta Kelahiran (contoh: Muhammad Rayhan Fauzi)', COMMON.studentName);
      await fillPlaceholder(page, 'Contoh: Rayhan', 'Contoh');
      await fillPlaceholder(page, '3515xxxxxxxxxxxx', nikUsed, 0);
      await fillPlaceholder(page, '3515xxxxxxxxxxxx', kkUsed, 1);
      await fillPlaceholder(page, 'Kota/Kabupaten kelahiran', 'Sidoarjo');
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.waitFor({ state: 'visible', timeout: 15000 });
      await dateInput.fill(COMMON.dob);
      await page.getByText('Laki-laki', { exact: false }).first().click();
      await fillPlaceholder(page, 'Contoh: RA Perwanida 1 Buduran / PAUD Melati', 'RA Contoh');
      // Anak Ke- adalah input angka (bukan select) dan wajib >= 1 (validasi 'Anak ke- minimal 1.').
      const anakKeInput = page.locator('input[type="number"]').first();
      await anakKeInput.waitFor({ state: 'visible', timeout: 15000 });
      await anakKeInput.fill('1');
      // Semua <select> di langkah 1 — isi berdasarkan label.
      const selects = page.locator('form select');
      const nSel = await selects.count();
      for (let i = 0; i < nSel; i++) {
        const label = await selects.nth(i).evaluate((el) => {
          let n = el;
          for (let d = 0; d < 5 && n; d++) {
            n = n.parentElement;
            const lab = n ? n.querySelector('label') : null;
            if (lab) return lab.innerText.trim();
          }
          return '';
        });
        const opts = await selects.nth(i).locator('option').allTextContents();
        const pick = (want) => opts.findIndex((t) => t.trim() === want);
        let idx = -1;
        if (/Kewarganegaraan/.test(label)) idx = pick('WNI');
        else if (/^Agama/.test(label)) idx = pick('Islam');
        else if (/Membiayai/.test(label)) idx = pick('Orang Tua');
        else if (/Anak ke/.test(label)) idx = pick('1');
        else if (/Jumlah Saudara/.test(label)) idx = pick('0');
        else idx = opts.findIndex((t) => t.trim() !== '' && !/Pilih/.test(t));
        if (idx > 0) {
          const vals = await selects.nth(i).locator('option').evaluateAll((els) => els.map((e) => e.getAttribute('value')));
          await selects.nth(i).selectOption(vals[idx]);
          log(`  select langkah1 [${label}] -> "${opts[idx].trim()}"`);
        }
      }
      if (attempt === 0) {
        await shot(page, S('03-langkah1'));
        result.shots.push('03-langkah1');
      }
      await page.getByRole('button', { name: /LANJUT KE LANGKAH 2/ }).click();
      try {
        // Tunggu penanda khusus Langkah 2 ('LANGKAH 2' saja bisa cocok dengan daftar progres).
        await waitText(page, 'Status Ayah Kandung', 15000);
        step1ok = true;
      } catch {
        const bodyText = await page.locator('body').innerText();
        if (/terdaftar/i.test(bodyText)) {
          nikUsed = bumpLastDigit(nikUsed);
          kkUsed = bumpLastDigit(kkUsed);
          log(`  [${cfg.key}] NIK duplikat, coba NIK ${nikUsed}`);
          continue;
        }
        throw new Error('langkah 1 tidak lanjut; cuplikan: ' + bodyText.replace(/\n/g, ' | ').slice(0, 300));
      }
    }
    if (!step1ok) throw new Error('gagal langkah 1 setelah 2 percobaan NIK');
    result.nik = nikUsed;
    result.kk = kkUsed;

    // 04 — Langkah 2 (orang tua): status berupa GRUP TOMBOL, bukan <select>.
    await page.getByRole('button', { name: 'Masih Hidup' }).nth(0).click(); // Ayah
    await fillPlaceholder(page, 'Contoh: Ahmad Fauzi, S.E.', COMMON.ayah.nama);
    await fillPlaceholder(page, '16 digit NIK Ayah sesuai KK — kosongkan bila tidak ada', COMMON.ayah.nik);
    await fillPlaceholder(page, 'Kota kelahiran Ayah', COMMON.ayah.tempat);
    await fillPlaceholder(page, '0812xxxxxxxx', cfg.ayahHp);
    await page.getByRole('button', { name: 'Masih Hidup' }).nth(1).click(); // Ibu
    await fillPlaceholder(page, 'Contoh: Siti Rahmawati, S.Pd.', COMMON.ibu.nama);
    await fillPlaceholder(page, '16 digit NIK Ibu sesuai KK — kosongkan bila tidak ada', COMMON.ibu.nik);
    await fillPlaceholder(page, 'Kota kelahiran Ibu', COMMON.ibu.tempat);
    await fillPlaceholder(page, '0819xxxxxxxx', cfg.ibuHp);
    await shot(page, S('04-langkah2'));
    result.shots.push('04-langkah2');
    await page.getByRole('button', { name: /LANJUT KE LANGKAH 3/ }).click();
    await waitText(page, 'LANGKAH 3', 20000);

    // 05 — Langkah 3 (alamat)
    // Opsi provinsi ditulis HURUF BESAR di situs (mis. 'JAWA TIMUR').
    await selectByLabel(page, 'Provinsi', (t) => t.toLowerCase() === 'jawa timur');
    await sleep(800);
    await selectByLabel(page, 'Kabupaten / Kota', (t) => t.toLowerCase().includes('sidoarjo'));
    await sleep(800);
    await selectByLabel(page, 'Kecamatan', (t) => t.toLowerCase().includes('sedati'));
    await sleep(800);
    const kelurahan = await selectByLabel(page, 'Kelurahan / Desa', (t) => t.toLowerCase() === 'pranti' || (t !== '' && !/Pilih/.test(t)));
    result.kelurahan = kelurahan;
    await fillPlaceholder(page, 'Contoh: Jl. Melati No. 45, Dusun Sidokepo', COMMON.alamat);
    await fillPlaceholder(page, '03', COMMON.rt);
    await fillPlaceholder(page, '02', COMMON.rw);
    await fillPlaceholder(page, '61252', COMMON.kodePos);
    await shot(page, S('05-langkah3'));
    result.shots.push('05-langkah3');
    await page.getByRole('button', { name: /LANJUT KE LANGKAH 4/ }).click();
    await waitText(page, 'LANGKAH 4', 20000);

    // 06 — Langkah 4 (unggah berkas): opsi ijazah TK tertulis 'Belum / Tidak Memegang Ijazah TK' (bukan 'Belum' saja).
    await page.getByText('Belum / Tidak Memegang Ijazah TK', { exact: true }).first().click();
    await sleep(400);
    // Unggah per kotak berdasarkan labelnya (BUKAN indeks): input file HILANG
    // dari DOM setelah berkas terunggah (kotak beralih ke pratinjau + badge
    // "Telah Diunggah"), jadi iterasi berbasis indeks bergeser dan nth(i)
    // bisa tidak pernah ketemu. XPath: dari span label naik ke div kotak
    // terdekat (rounded-2xl), lalu input file di dalamnya.
    const target = { 'Kartu Keluarga (KK)': FILES.kk, 'Akta Kelahiran': FILES.akta, 'Pas Foto 3x4 Anak': FILES.foto };
    for (const [label, file] of Object.entries(target)) {
      const boxXpath = `//h4/span[normalize-space()="${label}"]/ancestor::div[contains(@class,"rounded-2xl")][1]`;
      await page.locator(`xpath=${boxXpath}//input[@type="file"]`).setInputFiles(file);
      log(`  upload [${label}] <- ${path.basename(file)}`);
      // Tunggu badge "Telah Diunggah" di kotak ini sebelum lanjut (unggah ke server bisa lambat).
      await page.locator(`xpath=${boxXpath}`).getByText('Telah Diunggah').waitFor({ state: 'visible', timeout: 120000 });
    }
    await shot(page, S('06-langkah4'));
    result.shots.push('06-langkah4');
    await page.getByRole('button', { name: /TINJAU KEMBALI FORMULIR/ }).click();
    await waitText(page, 'KIRIM FORMULIR PENDAFTARAN', 20000);

    // 07 — Review + kirim
    await shot(page, S('07-review'));
    result.shots.push('07-review');
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /KIRIM FORMULIR PENDAFTARAN/ }).click();
    await waitText(page, 'Pendaftaran Berhasil Disimpan', 180000);
    const officialNo = await page
      .locator(`//span[contains(., "Nomor Pendaftaran Resmi")]/following::span[1]`)
      .innerText()
      .catch(() => '');
    const officialPin = await page
      .locator(`//span[contains(., "PIN Akses Mandiri")]/following::span[1]`)
      .innerText()
      .catch(() => '');
    result.officialRegNo = (officialNo || '').trim();
    result.officialPin = (officialPin || '').trim();
    const syncWarn = (await page.locator('body').innerText()).includes('belum masuk ke data panitia');
    result.checks.syncWarning = syncWarn;
    log(`  [${cfg.key}] TERKIRIM: resmi=${result.officialRegNo} PIN=${result.officialPin} (peringatan sync: ${syncWarn})`);

    // 08 — sukses: atas + footer
    await shot(page, S('08-sukses-1'));
    result.shots.push('08-sukses-1');
    await shotBottom(page, S('08-sukses-2'));
    result.shots.push('08-sukses-2');
    result.checks.footerWA = (await page.locator('body').innerText()).includes('WhatsApp: 085196677872');

    // 09 — form login kosong (muat ulang, klik Lacak Status)
    await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitText(page, 'Lacak Status');
    await page.getByRole('button', { name: /Lacak Status/ }).first().click();
    try {
      await page.getByPlaceholder('Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', { exact: true }).waitFor({ state: 'visible', timeout: 12000 });
    } catch {
      // Bila yang terbuka tab daftar, pindah ke tab masuk.
      await page.getByText('Lanjutkan Formulir / Masuk', { exact: true }).first().click();
      await page.getByPlaceholder('Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', { exact: true }).waitFor({ state: 'visible', timeout: 12000 });
    }
    result.checks.loginPlaceholder = true;
    await shot(page, S('09-cek-status'));
    result.shots.push('09-cek-status');

    // 10 — login wali + dashboard
    // Login verifikasi PIN di server; POST dari VM ini kadang hang — bila
    // form login masih tampil (tombol masih ada), isi ulang lalu klik lagi.
    let badgeOk = false;
    for (let attempt = 0; attempt < 2 && !badgeOk; attempt++) {
      const btn = page.getByRole('button', { name: /Buka Formulir Pendaftaran/ });
      if (await btn.isVisible().catch(() => false)) {
        await fillPlaceholder(page, 'Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', result.wa);
        await fillPlaceholder(page, '6 digit PIN pendaftaran Anda', result.officialPin || result.tempPin);
        await btn.click({ timeout: 10000 }).catch(() => {});
      }
      try {
        await waitText(page, 'Akun Aktif', 60000);
        badgeOk = true;
      } catch { /* coba lagi */ }
    }
    if (!badgeOk) throw new Error('dashboard tidak tampil: badge Akun Aktif tidak muncul setelah login');
    result.checks.badgeAktif = true;
    await sleep(800);
    await shot(page, S('10-dashboard-1'));
    result.shots.push('10-dashboard-1');

    log(`  [${cfg.key}] SELESAI — ${result.shots.length}/12 shot`);
  } catch (err) {
    result.error = String(err && err.message ? err.message : err).slice(0, 600);
    log(`  [${cfg.key}] GAGAL: ${result.error}`);
    try {
      await page.screenshot({ path: path.join(OUT, `DEBUG-${cfg.key}-error.png`) });
    } catch { /* abaikan */ }
  } finally {
    await ctx.close().catch(() => {});
  }
  return result;
}

// --- main --------------------------------------------------------------------
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // Relay auth proxy runtime: token dari environment saat jalan saja.
  const audit = await import('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  const u = new URL(raw);
  const upstream = `${u.protocol}//${u.hostname}:${u.port || 3128}`;
  const username = decodeURIComponent(u.username || 'hatch-runtime');
  const token = decodeURIComponent(u.password || '');
  const relay = await audit.startProxyAuthRelay(upstream, username, token, { connectOnly: true });
  log('relay runtime aktif:', relay.server);
  const browser = await launchBrowser(relay.server);
  const report = { site: SITE, startedAt: new Date().toISOString(), results: [] };
  try {
    for (const cfg of VIEWPORTS) {
      log(`=== viewport ${cfg.key.toUpperCase()} (WA ${cfg.wa}, NIK ${cfg.nik}) ===`);
      const r = await runViewport(browser, cfg);
      report.results.push(r);
    }
  } finally {
    await browser.close().catch(() => {});
    await relay.close().catch(() => {});
  }
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'capture-clean-report.json'), JSON.stringify(report, null, 2));
  console.log('=== LAPORAN ===');
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
