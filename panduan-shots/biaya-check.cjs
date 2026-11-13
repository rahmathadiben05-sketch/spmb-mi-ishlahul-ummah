// Cek pita logo (versi ramping) + seksi Biaya ringkas (total + tombol rincian).
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
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000);

    // 1. Pita logo: scroll ke tengah, cek opacity + tinggi tiap logo (versi ramping).
    await page.evaluate(() => { const b = document.querySelector('.motif-band'); if (b) b.scrollIntoView({ block: 'center' }); });
    await sleep(2500);
    const logos = await page.evaluate(() => {
      const band = document.querySelector('.motif-band');
      const br = band ? band.getBoundingClientRect() : null;
      return {
        bandH: br ? Math.round(br.height) : null,
        items: [...document.querySelectorAll('.logo-band-item')].map((el) => {
          const r = el.getBoundingClientRect();
          return { alt: el.tagName === 'IMG' ? el.alt.slice(0, 24) : 'kurikulum-chip', h: Math.round(r.height), opacity: getComputedStyle(el).opacity, inClass: el.className.includes('--in') };
        }),
      };
    });
    console.log('LOGO:', JSON.stringify(logos, null, 1));
    await page.screenshot({ path: '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots/logo-band-viewport.png' });

    // 2. Seksi Biaya: keadaan awal (tertutup) — total tampil, tombol ada, kartu tersembunyi.
    await page.evaluate(() => { const s = document.querySelector('#biaya'); if (s) s.scrollIntoView({ block: 'start' }); });
    await sleep(1200);
    const biayaClosed = await page.evaluate(() => {
      const s = document.querySelector('#biaya');
      if (!s) return { exists: false };
      const txt = s.innerText;
      const btn = [...s.querySelectorAll('button')].find((b) => b.innerText.includes('rincian biaya'));
      return {
        exists: true,
        totalPutra: txt.includes('Rp498.000'),
        totalPutri: txt.includes('Rp550.000'),
        buttonLabel: btn ? btn.innerText.trim() : null,
        cardTitles: [...s.querySelectorAll('h3')].map((h) => h.innerText),
      };
    });
    console.log('BIAYA (tertutup):', JSON.stringify(biayaClosed, null, 1));
    await page.screenshot({ path: '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots/biaya-collapsed.png' });

    // 3. Klik tombol, cek kartu muncul + label berubah.
    await page.evaluate(() => {
      const s = document.querySelector('#biaya');
      const btn = [...s.querySelectorAll('button')].find((b) => b.innerText.includes('rincian biaya'));
      if (btn) btn.click();
    });
    await sleep(1200);
    const biayaOpen = await page.evaluate(() => {
      const s = document.querySelector('#biaya');
      const btn = [...s.querySelectorAll('button')].find((b) => b.innerText.includes('rincian biaya'));
      return {
        buttonLabel: btn ? btn.innerText.trim() : null,
        cardTitles: [...s.querySelectorAll('h3')].map((h) => h.innerText),
        hasSubtotal: s.innerText.includes('Subtotal'),
      };
    });
    console.log('BIAYA (terbuka):', JSON.stringify(biayaOpen, null, 1));
    await page.screenshot({ path: '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots/biaya-expanded.png' });
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 500)); process.exit(1); });
