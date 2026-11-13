// Cek visual mobile (390px) beranda SPMB setelah perbaikan kerapian — read-only.
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const audit = require('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');

const SITE = 'https://export-aistudio.vercel.app/';
const OUT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots';
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
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000);
    await page.screenshot({ path: `${OUT}/mobile-hero.png` });
    console.log('hero ok');
    // Pita motto B3 di bawah hero
    const motto = page.locator('img[alt*="Motto MI"]');
    if ((await motto.count()) > 0) { await motto.first().scrollIntoViewIfNeeded(); await sleep(1200); await page.screenshot({ path: `${OUT}/mobile-motto.png` }); console.log('motto ok'); }
    else console.log('motto NOT FOUND');
    // Galeri: cari heading galeri lalu scroll ke sana
    const gal = page.locator('h2', { hasText: 'Suasana Madrasah' });
    if ((await gal.count()) > 0) { await gal.first().scrollIntoViewIfNeeded(); await sleep(1200); await page.screenshot({ path: `${OUT}/mobile-galeri.png` }); console.log('galeri ok'); }
    else console.log('galeri heading NOT FOUND');
    // Sekretariat / peta
    const sek = page.locator('#hubungi-kami');
    if ((await sek.count()) > 0) { await sek.first().scrollIntoViewIfNeeded(); await sleep(8000); await page.screenshot({ path: `${OUT}/mobile-peta.png` }); console.log('peta ok'); }
    else console.log('sekretariat NOT FOUND');
    // CTA banner (teks tombol)
    const cta = page.locator('text=Mulai Registrasi Mandiri');
    if ((await cta.count()) > 0) { await cta.first().scrollIntoViewIfNeeded(); await sleep(1000); await page.screenshot({ path: `${OUT}/mobile-cta.png` }); console.log('cta ok'); }
    // Footer
    const foot = page.locator('footer');
    if ((await foot.count()) > 0) { await foot.first().scrollIntoViewIfNeeded(); await sleep(1200); await page.screenshot({ path: `${OUT}/mobile-footer.png` }); console.log('footer ok'); }
    else console.log('footer NOT FOUND');
    // Info cepat: judul galeri membungkus berapa baris + countdown terisi?
    const info = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')].find((e) => e.innerText.includes('Suasana Madrasah'));
      const cd = document.body.innerText.match(/\d{2}\s*\n?\s*Hari/) ? 'countdown terisi' : 'countdown?';
      return { galeriBaris: h ? Math.round(h.getBoundingClientRect().height / 24) : -1, countdown: cd, judulGaleri: h ? h.innerText : '?' };
    });
    console.log(JSON.stringify(info));
  } finally {
    await browser.close();
    relay.close();
    process.exit(0);
  }
})().catch((e) => { console.error('FATAL', e.message.slice(0, 300)); process.exit(1); });
