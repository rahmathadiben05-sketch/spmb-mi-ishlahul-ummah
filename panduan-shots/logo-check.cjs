// Cek pita logo di bawah hero (temuan tinjauan 13 Nov 11:52-12:00: pita tampil kosong).
// Verifikasi independen via Playwright VM: apakah 5 logo benar-benar tidak terlihat,
// atau hanya artefak browser tinjauan. Screenshot pita disimpan ke panduan-shots/.
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
    const errors = [];
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e.message).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });

    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000);

    // Cari pita logo: elemen .motif-band atau .logo-band-item, dan semua <img> logo.
    const before = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.logo-band-item')];
      const imgs = [...document.querySelectorAll('img')].filter((i) => /maarif|kemenag|hebat|motto-b3|kurikulum|merdeka/i.test(i.src));
      const band = document.querySelector('.motif-band');
      const cs = (el) => { const s = getComputedStyle(el); return { opacity: s.opacity, visibility: s.visibility, display: s.display, animationName: s.animationName, animationPlayState: s.animationPlayState }; };
      return {
        bandExists: !!band,
        bandBox: band ? band.getBoundingClientRect().toJSON() : null,
        bandClass: band ? band.className : null,
        items: items.length,
        logos: imgs.map((i) => {
          const r = i.getBoundingClientRect();
          return { src: i.src.split('/').pop(), complete: i.complete, naturalWidth: i.naturalWidth, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, style: cs(i), parentStyle: i.parentElement ? cs(i.parentElement) : null };
        }),
      };
    });
    console.log('SEBELUM SCROLL:', JSON.stringify(before, null, 1));

    // Scroll pita ke tengah viewport, tunggu IntersectionObserver + animasi 0.7s.
    await page.evaluate(() => {
      const band = document.querySelector('.motif-band');
      if (band) band.scrollIntoView({ block: 'center' });
    });
    await sleep(2000);

    const after = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter((i) => /maarif|kemenag|hebat|motto-b3|kurikulum|merdeka/i.test(i.src));
      const cs = (el) => { const s = getComputedStyle(el); return { opacity: s.opacity, visibility: s.visibility, display: s.display, animationName: s.animationName }; };
      return {
        logos: imgs.map((i) => {
          const r = i.getBoundingClientRect();
          return { src: i.src.split('/').pop(), complete: i.complete, naturalWidth: i.naturalWidth, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, inViewport: r.top >= 0 && r.bottom <= innerHeight, style: cs(i), parentStyle: i.parentElement ? cs(i.parentElement) : null };
        }),
      };
    });
    console.log('SETELAH SCROLL:', JSON.stringify(after, null, 1));

    // Screenshot pita.
    const bandEl = page.locator('.motif-band').first();
    if (await bandEl.count()) {
      await bandEl.screenshot({ path: '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots/logo-band-check.png' });
      console.log('Screenshot pita: panduan-shots/logo-band-check.png');
    }
    console.log('JS errors:', errors.length ? errors : 'none');
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 500)); process.exit(1); });
