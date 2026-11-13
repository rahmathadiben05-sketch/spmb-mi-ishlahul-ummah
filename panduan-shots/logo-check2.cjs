// Tindak lanjut cek pita logo: hitung SEMUA .motif-band, periksa class --in pada
// .logo-band-item (opacity 0 bawaan CSS), dan ambil screenshot viewport penuh.
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

    const probe = () => page.evaluate(() => {
      const bands = [...document.querySelectorAll('.motif-band')].map((b) => {
        const r = b.getBoundingClientRect();
        return { box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, items: b.querySelectorAll('.logo-band-item').length, htmlHead: b.outerHTML.slice(0, 120) };
      });
      const items = [...document.querySelectorAll('.logo-band-item')].map((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { tag: el.tagName, cls: el.className.slice(0, 80), opacity: s.opacity, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
      });
      return { bands, items };
    });

    const before = await probe();
    console.log('AWAL (tanpa scroll):', JSON.stringify(before, null, 1));

    // Scroll pita ke tengah, tunggu, lalu probe lagi + screenshot viewport.
    await page.evaluate(() => {
      const b = document.querySelector('.motif-band');
      if (b) b.scrollIntoView({ block: 'center' });
    });
    await sleep(2500);
    const after = await probe();
    console.log('SETELAH SCROLL:', JSON.stringify(after, null, 1));
    await page.screenshot({ path: '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots/logo-band-viewport.png' });
    console.log('Screenshot viewport: panduan-shots/logo-band-viewport.png');
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 500)); process.exit(1); });
