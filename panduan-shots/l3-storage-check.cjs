// Cek penyimpanan L3 (v2.11): setelah login wali, PIN tidak boleh ada di
// localStorage (cache record pin='' + sesi hanya di sessionStorage).
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const audit = require('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');

const SITE = 'https://export-aistudio.vercel.app/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startRelay(upstreamProxyUrl, username, token) {
  const http = require('http');
  const net = require('net');
  const upstream = new URL(upstreamProxyUrl);
  const upstreamHost = upstream.hostname;
  const upstreamPort = upstream.port ? Number(upstream.port) : 80;
  const credential = 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64');
  const server = http.createServer((clientReq, clientRes) => {
    if (clientReq.url && (clientReq.url.includes('connectivitycheck.gstatic.com') || clientReq.url.includes('generate_204'))) {
      clientRes.writeHead(204); clientRes.end(); return;
    }
    clientRes.writeHead(502); clientRes.end();
  });
  server.on('connect', (req, clientSocket, head) => {
    const target = req.url ?? '';
    const upstreamSocket = net.connect(upstreamPort, upstreamHost);
    upstreamSocket.once('connect', () => {
      upstreamSocket.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\nProxy-Authorization: ${credential}\r\n\r\n`);
    });
    let established = false;
    let buffer = Buffer.alloc(0);
    upstreamSocket.on('data', (chunk) => {
      if (established) return;
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.indexOf('\r\n\r\n') === -1) return;
      established = true;
      const statusLine = buffer.subarray(0, buffer.indexOf('\r\n')).toString('latin1');
      clientSocket.write(buffer);
      if (statusLine.split(/\s+/)[1] === '200') {
        if (head.length > 0) upstreamSocket.write(head);
        clientSocket.pipe(upstreamSocket);
        upstreamSocket.pipe(clientSocket);
      } else { clientSocket.end(); upstreamSocket.end(); }
    });
    const teardown = () => { try { clientSocket.destroy(); } catch {} try { upstreamSocket.destroy(); } catch {} };
    clientSocket.on('error', teardown);
    upstreamSocket.on('error', teardown);
    clientSocket.on('close', teardown);
    upstreamSocket.on('close', teardown);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

(async () => {
  const rawProxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  const credsMatch = rawProxyUrl.match(/^https?:\/\/([^@/]+)@/);
  const [rawUser, ...rest] = credsMatch[1].split(':');
  const relay = await startRelay(rawProxyUrl.replace(/^(https?:\/\/)[^@]*@/, '$1'), decodeURIComponent(rawUser), decodeURIComponent(rest.join(':')));
  const launchOptions = audit.buildLaunchOptions('/opt/meta-chromium/chrome', relay.server, null, decodeURIComponent(rawUser));
  launchOptions.args = [...(launchOptions.args ?? []), '--disable-background-networking'];
  const browser = await chromium.launch(launchOptions);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2500);
    // Buka kartu akses lewat tombol "Lacak Status" di header.
    const lacak = page.locator('button', { hasText: 'Lacak Status' }).first();
    await lacak.click();
    await sleep(1500);
    await page.getByPlaceholder('Contoh: 0812xxxxxxx atau MIIU/SPMB/2027/0001').fill('081200000007');
    await page.getByPlaceholder('6 digit PIN pendaftaran Anda').fill('282577');
    // Tombol submit di dalam form kartu akses.
    const form = page.locator('form', { has: page.getByPlaceholder('6 digit PIN pendaftaran Anda') });
    await form.locator('button[type="submit"]').first().click();
    // Tunggu dasbor wali muncul (teks sambutan).
    await page.getByText('Selamat Datang', { exact: false }).first().waitFor({ timeout: 30000 });
    await sleep(2000);
    const result = await page.evaluate(() => {
      const PIN = '282577';
      const lsKeys = Object.keys(localStorage);
      const ssKeys = Object.keys(sessionStorage);
      const out = {
        lsKeys,
        ssKeys,
        sessionInLocalStorage: localStorage.getItem('spmb_wali_murid_session') !== null,
        sessionInSessionStorage: sessionStorage.getItem('spmb_wali_murid_session') !== null,
        pinLiteralAnywhereInLocalStorage: false,
        cachedRecordPin: 'KEY_NOT_FOUND',
        cachedRecordCount: -1,
        dashboardStatusText: '',
      };
      for (const k of lsKeys) {
        const v = localStorage.getItem(k) || '';
        if (v.includes(PIN)) out.pinLiteralAnywhereInLocalStorage = true;
      }
      const raw = localStorage.getItem('spmb_registrations_list');
      if (raw) {
        try {
          const list = JSON.parse(raw);
          out.cachedRecordCount = Array.isArray(list) ? list.length : -1;
          const rec = (list || []).find((r) => r && r.nomorPendaftaran === 'MIIU/SPMB/2027/0007');
          out.cachedRecordPin = rec ? JSON.stringify(rec.pin) : 'RECORD_NOT_FOUND';
        } catch (e) { out.cachedRecordPin = 'PARSE_ERROR'; }
      }
      const statusEl = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /MENUNGGU|LULUS|TERVERIFIKASI/.test(e.textContent || ''));
      out.dashboardStatusText = statusEl ? statusEl.textContent.trim() : 'NOT_FOUND';
      return out;
    });
    console.log(JSON.stringify(result, null, 2));
    const pass =
      !result.sessionInLocalStorage &&
      result.sessionInSessionStorage &&
      !result.pinLiteralAnywhereInLocalStorage &&
      result.cachedRecordPin === '""';
    console.log(pass ? 'L3 STORAGE: PASS' : 'L3 STORAGE: FAIL (lihat detail di atas)');
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 500)); process.exit(1); });
