// Tangkap screenshot panduan SPMB (tampilan HP 390x844).
// Berhenti di Review — TIDAK submit. Data tes lokal saja (localStorage browser ini).
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const audit = require('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');

const SITE = 'https://export-aistudio.vercel.app/';
const OUT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots';
const UP = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/test-uploads';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Relay proxy-auth lokal: meneruskan request Chromium ke upstream egress proxy
// dengan kredensial Basic, tanpa memberikan token ke Chromium.
async function startRelay(upstreamProxyUrl, username, token) {
  const http = require('http');
  const net = require('net');
  const upstream = new URL(upstreamProxyUrl);
  const upstreamHost = upstream.hostname;
  const upstreamPort = upstream.port ? Number(upstream.port) : 80;
  const credential = 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64');
  const server = http.createServer((clientReq, clientRes) => {
    // Jawab langsung cek konektivitas Chromium (HTTP biasa) — tidak perlu diteruskan.
    if (clientReq.url && (clientReq.url.includes('connectivitycheck.gstatic.com') || clientReq.url.includes('generate_204'))) {
      clientRes.writeHead(204); clientRes.end(); return;
    }
    // Request HTTP biasa lainnya: situs ini semuanya HTTPS (lewat CONNECT),
    // jadi tolak saja daripada crash karena validasi path Node.
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
      } else {
        clientSocket.end(); upstreamSocket.end();
      }
    });
    const teardown = () => { try { clientSocket.destroy(); } catch {} try { upstreamSocket.destroy(); } catch {} };
    clientSocket.on('error', teardown);
    upstreamSocket.on('error', teardown);
    clientSocket.on('close', teardown);
    upstreamSocket.on('close', teardown);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return { server: `http://127.0.0.1:${port}`, close: () => server.close() };
}

async function dumpControls(page, tag) {
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('input, select, textarea, button')];
    return els.slice(0, 60).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.type || '',
      ph: el.placeholder || '',
      name: el.name || '',
      label: (el.closest('div')?.querySelector('label')?.innerText || '').slice(0, 40),
      text: (el.innerText || '').slice(0, 40),
      opts: el.tagName === 'SELECT' ? [...el.options].slice(0, 8).map((o) => o.text) : undefined,
    }));
  });
  console.log(`--- controls [${tag}] ---`);
  info.forEach((c) => console.log(JSON.stringify(c)));
}

async function fillPlaceholder(page, ph, value) {
  const loc = page.getByPlaceholder(ph, { exact: false });
  if ((await loc.count()) > 0) {
    await loc.first().fill(value);
    console.log(`filled ph "${ph}" -> ${value}`);
    return true;
  }
  console.log(`MISSING placeholder: ${ph}`);
  return false;
}

async function clickButton(page, re) {
  const btn = page.getByRole('button', { name: re });
  if ((await btn.count()) > 0) {
    await btn.first().click();
    console.log(`clicked button ${re}`);
    return true;
  }
  console.log(`MISSING button ${re}`);
  return false;
}

(async () => {
  const rawProxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  const credsMatch = rawProxyUrl.match(/^https?:\/\/([^@/]+)@/);
  const [rawUser, ...rest] = credsMatch[1].split(':');
  const username = decodeURIComponent(rawUser);
  const token = decodeURIComponent(rest.join(':'));
  const proxyServer = rawProxyUrl.replace(/^(https?:\/\/)[^@]*@/, '$1');
  // Relay lokal sendiri (mirip relay runtime, tapi perbaiki Host header untuk
  // request HTTP biasa agar Node tidak menolaknya): token egress tidak pernah
  // masuk ke Chromium; CONNECT ditunnel, HTTP diteruskan tanpa Host asli.
  const relay = await startRelay(proxyServer, username, token);
  const launchOptions = audit.buildLaunchOptions('/opt/meta-chromium/chrome', relay.server, null, username);
  launchOptions.args = [...(launchOptions.args ?? []), '--disable-background-networking'];
  const browser = await chromium.launch(launchOptions);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text().slice(0, 200)); });

  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/01-beranda.png` });
  console.log('shot 01-beranda');

  // Buka pendaftaran
  await clickButton(page, /Daftar Sekarang/i);
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/02-akun.png` });
  console.log('shot 02-akun');
  await dumpControls(page, 'akun');

  // Isi akun
  await fillPlaceholder(page, 'H. Ahmad Fauzi', 'Ayah Contoh');
  await fillPlaceholder(page, '081234567890', '081200000009');
  await fillPlaceholder(page, 'Muhammad Rayhan', 'Contoh Panduan (Test)');
  // submit akun (tombol submit dalam form)
  const submitted = await clickButton(page, /Buat Akun|Daftar|Mulai Pendaftaran|Lanjutkan/i);
  await sleep(2000);
  const pinHeading = await page.getByText('Simpan PIN Anda').count();
  console.log('interstitial Simpan PIN visible:', pinHeading > 0);
  await page.screenshot({ path: `${OUT}/02b-simpan-pin.png` });
  console.log('shot 02b-simpan-pin');
  await dumpControls(page, 'interstitial');

  // Lanjut ke wizard
  await clickButton(page, /Lanjut|Isi Formulir|Mulai Mengisi/i);
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/03-langkah1.png` });
  console.log('shot 03-langkah1');
  await dumpControls(page, 'step1');

  // Isi Step 1
  await fillPlaceholder(page, 'Sesuai Akta Kelahiran', 'Contoh Panduan (Test)');
  await fillPlaceholder(page, 'Contoh: Rayhan', 'Contoh');
  await fillPlaceholder(page, '3515xxxxxxxxxxxx', '3515000000000001');
  // No KK: cari input dengan placeholder mengandung KK
  const kkInput = page.getByPlaceholder(/kartu keluarga/i);
  if ((await kkInput.count()) > 0) { await kkInput.first().fill('3515000000000002'); console.log('filled KK'); }
  else {
    // fallback: input teks ke-4 pada step 1
    const inputs = page.locator('input[type="text"], input:not([type])');
    console.log('text inputs on step1:', await inputs.count());
  }
  await fillPlaceholder(page, 'Kota/Kabupaten kelahiran', 'Sidoarjo');
  // tanggal lahir (input date)
  const dateInput = page.locator('input[type="date"]').first();
  if ((await dateInput.count()) > 0) { await dateInput.fill('2021-01-01'); console.log('filled DOB'); }
  // jenis kelamin Laki-laki
  const male = page.getByText('Laki-laki', { exact: false }).first();
  if ((await male.count()) > 0) { await male.click(); console.log('clicked Laki-laki'); }
  await fillPlaceholder(page, 'RA Perwanida', 'TK Contoh');
  // selects: kewarganegaraan & agama
  const selects = page.locator('select');
  const nSel = await selects.count();
  console.log('selects on step1:', nSel);
  for (let i = 0; i < nSel; i++) {
    const opts = await selects.nth(i).locator('option').allTextContents();
    console.log(`select[${i}] options:`, JSON.stringify(opts.slice(0, 6)));
  }
  // lanjut step 2
  await clickButton(page, /Lanjut|Selanjutnya/i);
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/04-langkah2.png` });
  console.log('shot 04-langkah2');
  await dumpControls(page, 'step2');

  await browser.close();
  console.log('DONE part 1');
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
