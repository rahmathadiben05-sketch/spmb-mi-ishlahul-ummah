// Probe: panggil webhook getRegistration langsung dari browser (via relay),
// untuk membedakan gagal-server vs gagal-jaringan. Akun tes run-13 HP.
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');

const WEBHOOK = 'https://script.google.com/macros/s/AKfycbw3922uPBY9jj5SE8czThoMO4LX8BKeYlwUBRgNLOOiaSITYJduxlRLP6wocz5Sb7BU/exec';
const SITE = 'https://export-aistudio.vercel.app/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${stamp()}]`, ...a);

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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);
  // 1) getRegistration via NOMOR PENDAFTARAN (akun tes HP run-13)
  const r1 = await page.evaluate(async (url) => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getRegistration', nomorPendaftaran: 'MIIU/SPMB/2027/0005', pin: '742438' }),
      });
      const text = await res.text();
      return { ms: Date.now() - t0, status: res.status, body: text.slice(0, 400) };
    } catch (e) {
      return { ms: Date.now() - t0, error: String(e && e.message ? e.message : e).slice(0, 200) };
    }
  }, WEBHOOK);
  log('getRegistration:', JSON.stringify(r1));
  // 2) getPublicStats sebagai kontrol (action baca lain)
  const r2 = await page.evaluate(async (url) => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getPublicStats' }),
      });
      const text = await res.text();
      return { ms: Date.now() - t0, status: res.status, body: text.slice(0, 300) };
    } catch (e) {
      return { ms: Date.now() - t0, error: String(e && e.message ? e.message : e).slice(0, 200) };
    }
  }, WEBHOOK);
  log('getPublicStats:', JSON.stringify(r2));
  await browser.close().catch(() => {});
  await relay.close().catch(() => {});
})();
