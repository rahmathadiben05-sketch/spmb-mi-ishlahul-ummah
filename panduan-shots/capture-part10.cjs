// Tangkap screenshot panduan SPMB bagian 2: interstitial PIN, wizard 1-4, review.
// Berhenti di Review — TIDAK submit. Data tes lokal saja.
const { chromium } = require('/opt/muse/assets/spaces/ts-runtime/dist/node_modules/playwright');
const audit = require('/opt/muse/assets/spaces/ts-runtime/dist/playwright-audit.js');

const SITE = 'https://export-aistudio.vercel.app/';
const OUT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/panduan-shots';
const UP = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/test-uploads';
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

async function fillPlaceholder(page, ph, value) {
  try {
    const loc = page.getByPlaceholder(ph, { exact: false });
    if ((await loc.count()) > 0) { await loc.first().fill(value); console.log(`ph ok: ${ph}`); return true; }
  } catch (e) { console.log(`ph FAIL ${ph}: ${e.message.slice(0, 80)}`); return false; }
  console.log(`ph MISSING: ${ph}`); return false;
}

// Isi input/select/textarea berdasarkan teks label di dekatnya.
async function fillByLabel(page, labelSub, value) {
  try {
    const ok = await page.evaluate(([labelSub, value]) => {
      const labels = [...document.querySelectorAll('label')];
      const lab = labels.find((l) => l.innerText.toLowerCase().includes(labelSub.toLowerCase()));
      if (!lab) return 'no-label';
      const wrap = lab.parentElement;
      const field = wrap.querySelector('select, input, textarea');
      if (!field) return 'no-field';
      if (field.tagName === 'SELECT') {
        const opt = [...field.options].find((o) => o.text.toLowerCase().includes(value.toLowerCase()) || o.value.toLowerCase().includes(value.toLowerCase()));
        if (!opt) return 'no-option:' + [...field.options].map((o) => o.text).slice(0, 10).join('|');
        field.value = opt.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
        return 'select:' + opt.text;
      }
      const proto = field.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return 'filled';
    }, [labelSub, value]);
    console.log(`label "${labelSub}" -> ${ok}`);
    return String(ok).startsWith('select:') || ok === 'filled';
  } catch (e) { console.log(`label FAIL ${labelSub}: ${e.message.slice(0, 80)}`); return false; }
}


async function waitSelectOptions(page, labelSub, minOptions, timeoutMs = 20000) {
  try {
    await page.waitForFunction(([labelSub, minOptions]) => {
      const lab = [...document.querySelectorAll('label')].find((l) => l.innerText.toLowerCase().includes(labelSub.toLowerCase()));
      if (!lab) return false;
      const sel = lab.parentElement.querySelector('select');
      return sel && sel.options.length >= minOptions;
    }, [labelSub, minOptions], { timeout: timeoutMs });
    console.log(`opsi siap: ${labelSub}`);
    return true;
  } catch (e) { console.log(`opsi TIMEOUT: ${labelSub}`); return false; }
}

async function clickExact(page, name) {
  try {
    const btn = page.getByRole('button', { name, exact: false });
    if ((await btn.count()) > 0) { await btn.first().click({ timeout: 15000 }); console.log(`clicked: ${name}`); return true; }
  } catch (e) { console.log(`click FAIL ${name}: ${e.message.slice(0, 100)}`); return false; }
  console.log(`click MISSING: ${name}`); return false;
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
    await sleep(1200);

    await clickExact(page, 'Daftar Sekarang (Mulai Formulir)');
    await sleep(1200);
    await fillPlaceholder(page, 'H. Ahmad Fauzi', 'Ayah Contoh');
    await fillPlaceholder(page, '081234567890', '081200000009');
    await fillPlaceholder(page, 'Muhammad Rayhan', 'Contoh Panduan (Test)');
    await clickExact(page, 'Lanjut Isi Formulir Pendaftaran Sekarang');
    await page.getByText('Simpan PIN Anda').first().waitFor({ timeout: 15000 }).catch(() => console.log('WARN: interstitial tidak muncul'));
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);
    await page.screenshot({ path: `${OUT}/02b-simpan-pin.png` });
    console.log('shot 02b-simpan-pin');

    await clickExact(page, 'Lanjut Isi Formulir');
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    await page.screenshot({ path: `${OUT}/03-langkah1.png` });
    console.log('shot 03-langkah1');

    // --- Isi Langkah 1 ---
    await fillPlaceholder(page, 'Sesuai Akta Kelahiran', 'Contoh Panduan (Test)');
    await fillPlaceholder(page, 'Contoh: Rayhan', 'Contoh');
    await fillPlaceholder(page, '3515xxxxxxxxxxxx', '3515000000000091');
    try {
      const kkInputs = page.getByPlaceholder('3515xxxxxxxxxxxx', { exact: false });
      if ((await kkInputs.count()) > 1) { await kkInputs.nth(1).fill('3515000000000092'); console.log('KK ok (nth 1)'); }
      else console.log('KK: hanya 1 input placeholder NIK');
    } catch (e) { console.log('KK FAIL', e.message.slice(0, 80)); }
    await fillPlaceholder(page, 'Kota/Kabupaten kelahiran', 'Sidoarjo');
    const dateInput = page.locator('input[type="date"]').first();
    if ((await dateInput.count()) > 0) { await dateInput.fill('2021-01-01'); console.log('DOB ok'); }
    try { await page.getByText(/Laki-laki/i).first().click({ timeout: 5000 }); console.log('gender ok'); }
    catch (e) { console.log('gender FAIL', e.message.slice(0, 80)); }
    await fillByLabel(page, 'Anak Ke', '1');
    await fillByLabel(page, 'Jumlah Saudara', '0');
    await fillPlaceholder(page, 'RA Perwanida', 'TK Contoh');
    await fillByLabel(page, 'Kewarganegaraan', 'WNI');
    await fillByLabel(page, 'Agama', 'Islam');
    await fillByLabel(page, 'Yang Membiayai', 'Orang Tua');
    await fillByLabel(page, 'Berkebutuhan Khusus', 'Tidak');
    await clickExact(page, 'LANJUT KE LANGKAH 2');
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    const errs = await page.evaluate(() => [...document.querySelectorAll('p.text-rose-500')].map((e) => e.innerText).filter(Boolean).slice(0, 8));
    console.log('error validasi Step1:', JSON.stringify(errs));
    console.log('di Step 2?', (await page.locator('text=DATA ORANG TUA').first().isVisible().catch(() => false)));
    await page.screenshot({ path: `${OUT}/04-langkah2.png` });
    console.log('shot 04-langkah2');

    // --- Isi Langkah 2 ---
    await fillPlaceholder(page, 'Contoh: Ahmad Fauzi', 'Ayah Contoh');
    await fillPlaceholder(page, '16 digit NIK Ayah', '3515000000000093');
    await fillPlaceholder(page, 'Kota kelahiran Ayah', 'Sidoarjo');
    await fillPlaceholder(page, '0812xxxxxxxx', '081200000009');
    // Status Ayah/Ibu = tombol pilihan (bukan select); pendidikan/pekerjaan/penghasilan opsional.
    try {
      const hidupBtns = page.getByRole('button', { name: /Masih Hidup/i });
      const nHidup = await hidupBtns.count();
      console.log('tombol Masih Hidup:', nHidup);
      if (nHidup >= 2) { await hidupBtns.nth(0).click(); await hidupBtns.nth(1).click(); console.log('status ayah+ibu ok'); }
    } catch (e) { console.log('status FAIL', e.message.slice(0, 80)); }
    await fillPlaceholder(page, 'Contoh: Siti Rahmawati', 'Ibu Contoh');
    await fillPlaceholder(page, '16 digit NIK Ibu', '3515000000000094');
    await fillPlaceholder(page, 'Kota kelahiran Ibu', 'Sidoarjo');
    await fillPlaceholder(page, '0819xxxxxxxx', '081200000010');

    await clickExact(page, 'LANJUT KE LANGKAH 3');
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    const errs2 = await page.evaluate(() => [...document.querySelectorAll('p.text-rose-500')].map((e) => e.innerText).filter(Boolean).slice(0, 8));
    console.log('error validasi Step2:', JSON.stringify(errs2));
    await page.screenshot({ path: `${OUT}/05-langkah3.png` });
    console.log('shot 05-langkah3');

    // --- Isi Langkah 3 ---
    await sleep(2000);
    await waitSelectOptions(page, 'Provinsi', 2);
    await fillByLabel(page, 'Provinsi', 'Jawa Timur');
    await waitSelectOptions(page, 'Kabupaten', 2);
    await fillByLabel(page, 'Kabupaten', 'Sidoarjo');
    await waitSelectOptions(page, 'Kecamatan', 2);
    await fillByLabel(page, 'Kecamatan', 'Sedati');
    await waitSelectOptions(page, 'Kelurahan', 2);
    await fillByLabel(page, 'Kelurahan', 'Pranti');
    await fillByLabel(page, 'Nomor RT', '01');
    await fillByLabel(page, 'Nomor RW', '01');
    await fillByLabel(page, 'Alamat Jalan', 'Jl. Contoh No. 1, Pranti');
    await fillByLabel(page, 'Kode Pos', '61253');
    await clickExact(page, 'LANJUT KE LANGKAH 4');
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    const errs3 = await page.evaluate(() => [...document.querySelectorAll('p.text-rose-500')].map((e) => e.innerText).filter(Boolean).slice(0, 8));
    console.log('error validasi Step3:', JSON.stringify(errs3));
    await page.screenshot({ path: `${OUT}/06-langkah4.png` });
    console.log('shot 06-langkah4');

    // --- Langkah 4: unggah berkas ---
    const fileInputs = page.locator('input[type="file"]');
    const nFiles = await fileInputs.count();
    console.log('file inputs:', nFiles);
    const mapping = await page.evaluate(() => {
      return [...document.querySelectorAll('input[type="file"]')].map((inp) => {
        const wrap = inp.closest('div');
        const txt = (wrap?.innerText || '').replace(/\n/g, ' ').slice(0, 60);
        return txt;
      });
    });
    console.log('file input contexts:', JSON.stringify(mapping));
    for (let i = 0; i < nFiles; i++) {
      const ctxTxt = (mapping[i] || '').toLowerCase();
      let file = null;
      if (ctxTxt.includes('kartu keluarga') || ctxTxt.includes('(kk)')) file = `${UP}/kk-contoh.jpg`;
      else if (ctxTxt.includes('akta')) file = `${UP}/akta-contoh.jpg`;
      else if (ctxTxt.includes('pas foto') || ctxTxt.includes('foto')) file = `${UP}/pasfoto-contoh.jpg`;
      if (file) {
        try { await fileInputs.nth(i).setInputFiles(file); console.log(`upload[${i}] ${file}`); } catch (e) { console.log(`upload FAIL[${i}]: ${e.message.slice(0, 80)}`); }
      }
    }
    await sleep(1200);
    // pilih "Belum / Tidak Memegang Ijazah TK" bila ada
    try { await page.getByText(/Belum \/ Tidak Memegang Ijazah TK/i).first().click({ timeout: 5000 }); console.log('ijazah option ok'); } catch { console.log('ijazah option skip'); }
    await clickExact(page, 'TINJAU KEMBALI FORMULIR');
    await sleep(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    await page.screenshot({ path: `${OUT}/07-review.png` });
    console.log('shot 07-review');
    console.log('DONE part 2 — berhenti di Review, TIDAK submit');
    // --- Layar login Cek Status ---
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(1200);
    await clickExact(page, 'Lacak Status');
    await sleep(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    await page.screenshot({ path: `${OUT}/09-cek-status.png` });
    console.log('shot 09-cek-status');
  } finally {
    await browser.close().catch(() => {});
    relay.close();
  }
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
