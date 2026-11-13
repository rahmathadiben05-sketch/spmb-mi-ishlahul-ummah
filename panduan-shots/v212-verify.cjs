// Verifikasi v2.12 (Playwright, VM): settings gate, privasi draft, input ketik tanggal.
// TIDAK submit — tidak membuat baris Sheets; hanya mengisi kartu akses + Langkah 1.
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
  const results = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e.message).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });

    // 1. Beranda: pengaturan CMS diterapkan (subjudul hero '...efisien.').
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2500);
    const heroText = await page.evaluate(() => document.body.innerText);
    const gate1 = heroText.includes('efisien.');
    results.push(['1. settings gate (teks CMS "efisien." tampil)', gate1]);
    console.log('1. settings gate:', gate1 ? 'PASS' : 'FAIL');

    // 2. Privasi draft: tanam draft pendaftar A, reload TANPA sesi, daftar sebagai B.
    await page.evaluate(() => {
      localStorage.setItem('spmb_registration_draft', JSON.stringify({
        data: {
          nomorPendaftaran: 'MIIU/SPMB/2027/0000',
          pin: '111111',
          modePendaftaran: 'penuh',
          student: { namaLengkap: 'Anak Orang Lain (Test)', nik: '3515999999999999', noKk: '3515999999999998' },
          parent: { ayah: { namaLengkap: 'Ayah Orang Lain', noHp: '6281299999999' }, ibu: { namaLengkap: '', noHp: '' } },
          address: {}, documents: {},
        },
        savedAt: new Date().toISOString(),
      }));
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1500);
    await page.locator('text=Daftar Sekarang').first().click();
    await sleep(1200);
    await page.getByPlaceholder('Contoh: H. Ahmad Fauzi').fill('Bapak V212 (Test)');
    await page.getByPlaceholder('Contoh: 0812xxxxxxx', { exact: true }).fill('081200000010');
    await page.getByPlaceholder('Contoh: Muhammad Rayhan').fill('Contoh V212 (Test)');
    const accForm = page.locator('form', { has: page.getByPlaceholder('Contoh: Muhammad Rayhan') });
    await accForm.locator('button[type="submit"]').first().click();
    await sleep(2000);
    await page.getByRole('button', { name: /Lanjut Isi Formulir/i }).first().click();
    await sleep(1500);
    const nikVal = await page.getByPlaceholder('3515xxxxxxxxxxxx').first().inputValue();
    const nameVal = await page.getByPlaceholder('Sesuai Akta Kelahiran (contoh: Muhammad Rayhan Fauzi)').inputValue();
    const gate2 = nikVal === '' && nameVal === 'Contoh V212 (Test)';
    results.push(['2. privasi draft (NIK kosong, nama dari kartu akses)', gate2]);
    console.log(`2. draft privacy: name=${JSON.stringify(nameVal)} nik=${JSON.stringify(nikVal)} -> ${gate2 ? 'PASS (draft tidak bocor)' : 'FAIL'}`);

    // 3. Ketik tanggal lahir manual.
    await page.getByPlaceholder('atau ketik: HH/BB/TTTT (cth. 15/06/2020)').fill('15/06/2020');
    await sleep(600);
    const dobVal = await page.locator('input[type="date"]').first().inputValue();
    const gate3 = dobVal === '2020-06-15';
    results.push(['3. ketik tanggal "15/06/2020" -> 2020-06-15', gate3]);
    console.log(`3. DOB ketik: date value=${JSON.stringify(dobVal)} -> ${gate3 ? 'PASS' : 'FAIL'}`);

    console.log('JS errors:', errors.length ? errors : 'none');
    const allPass = results.every((r) => r[1]);
    console.log(allPass ? 'V2.12 PLAYWRIGHT: ALL PASS' : 'V2.12 PLAYWRIGHT: ADA FAIL');
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 500)); process.exit(1); });
