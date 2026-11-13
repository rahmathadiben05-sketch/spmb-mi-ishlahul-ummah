// Login-only: tangkap 10-dashboard-1 (HP+PC) dari akun run-13 yang sudah tersubmit.
// HP: No. Pendaftaran MIIU/SPMB/2027/0005 / PIN 742438
// PC: No. Pendaftaran MIIU/SPMB/2027/0006 / PIN 708095
// Login pakai NOMOR PENDAFTARAN (bukan WA): WA akun (006/014) tidak
// tersimpan di kolom HP mana pun — wizard menimpa HP ayah/ibu dengan
// nomor tes yang berbeda — sehingga cari-berdasarkan-WA selalu gagal.
// Tidak membuat pendaftaran baru. Login diulang sampai 3x.
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const path = require('node:path');

const SITE = 'https://export-aistudio.vercel.app/';
const OUT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${stamp()}]`, ...a);

const ACCOUNTS = [
  { key: 'hp', suffix: '', id: 'MIIU/SPMB/2027/0005', pin: '742438', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { key: 'pc', suffix: '-pc', id: 'MIIU/SPMB/2027/0006', pin: '708095', viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
];

async function waitText(page, text, timeout = 15000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}
async function fillPlaceholder(page, ph, value) {
  const loc = page.getByPlaceholder(ph, { exact: true }).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  await loc.fill(value);
}

(async () => {
  const audit = await import('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  const u = new URL(raw);
  const upstream = `${u.protocol}//${u.hostname}:${u.port || 3128}`;
  const username = decodeURIComponent(u.username || 'hatch-runtime');
  const token = decodeURIComponent(u.password || '');
  const relay = await audit.startProxyAuthRelay(upstream, username, token, { connectOnly: true });
  log('relay aktif:', relay.server);
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors'],
    proxy: { server: relay.server },
  };
  let browser;
  try {
    browser = await chromium.launch(launchOpts);
  } catch (e) {
    log('launch bawaan gagal, coba chrome sistem');
    browser = await chromium.launch({ ...launchOpts, executablePath: '/opt/meta-chromium/chrome' });
  }
  for (const acc of ACCOUNTS) {
    const ctx = await browser.newContext({ viewport: acc.viewport, isMobile: acc.isMobile, hasTouch: acc.hasTouch });
    const page = await ctx.newPage();
    let ok = false;
    try {
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitText(page, 'Lacak Status', 20000);
        // Beri waktu hidrasi React: klik sebelum hidrasi tidak memicu apa-apa.
        await sleep(3000);
        await page.getByRole('button', { name: /Lacak Status/ }).first().click();
        // Tunggu form login (placeholder WA) — kadang lambat.
        try {
          await page.getByPlaceholder('Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
        } catch {
          // Bila yang terbuka tab daftar, pindah ke tab masuk (hanya bila tombolnya ada).
          const tabMasuk = page.getByText('Lanjutkan Formulir / Masuk', { exact: true }).first();
          if (await tabMasuk.isVisible().catch(() => false)) {
            await tabMasuk.click();
            await page.getByPlaceholder('Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
          } else {
            throw new Error('form login tidak tampil setelah klik Lacak Status');
          }
        }
        await fillPlaceholder(page, 'Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001', acc.id);
        await fillPlaceholder(page, '6 digit PIN pendaftaran Anda', acc.pin);
        await page.getByRole('button', { name: /Buka Formulir Pendaftaran/ }).click();
        try {
          await waitText(page, 'Akun Aktif', 60000);
          ok = true;
        } catch {
          log(`  [${acc.key}] percobaan ${attempt + 1} gagal, muat ulang...`);
          const body = await page.locator('body').innerText().catch(() => '');
          const m = body.match(/Server panitia tidak terjangkau[^\n]*/);
          if (m) log(`  [${acc.key}] pesan: ${m[0].slice(0, 120)}`);
        }
      }
      if (!ok) throw new Error('dashboard tidak tampil setelah 3 percobaan login');
      // Modal "Lacak Progres" dari klik Lacak Status masih menutupi dashboard
      // — muat ulang (sesi wali tersimpan di sessionStorage) agar bersih.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitText(page, 'Akun Aktif', 30000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(800);
      await page.screenshot({ path: path.join(OUT, `10-dashboard-1${acc.suffix}.png`) });
      log(`  [${acc.key}] OK — 10-dashboard-1${acc.suffix}.png`);
    } catch (err) {
      log(`  [${acc.key}] GAGAL: ${String(err && err.message ? err.message : err).slice(0, 300)}`);
      try { await page.screenshot({ path: path.join(OUT, `DEBUG-dash-${acc.key}-error.png`) }); } catch {}
    } finally {
      await ctx.close().catch(() => {});
    }
  }
  await browser.close().catch(() => {});
  await relay.close().catch(() => {});
})();
