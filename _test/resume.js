/* Resume round-trip for every component, in a real browser against the local library stub
   (its state document lives in sessionStorage, so it survives a reload of the tab).
   Usage: NODE_PATH=<dir with puppeteer-core, pngjs, pixelmatch@5> node _test/resume.js [BASE] [units]

   Per component:
     1. fresh document; one WRONG attempt at every question (so each is mid-way: attempt 1 of 2);
        stop on screen 1
     2. screenshot every screen (goTo 0..N-1), back to screen 1, let the debounced save land
     3. reload the tab → the restore runs
     4. assert: landed on screen 1; the restore sent only 'initialized' (component + item); the
        document names this component; every screen looks exactly as before the reload
     5. second wrong attempt at every question → every declared question now gets its
        answered.last (i.e. the attempt count survived the reload), exactly once overall;
        finish → one component 'completed', success:false score 0; no duplicate 'completed'
     6. reload again and finish again → the 'done' ledger suppresses a second component 'completed' */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { HELPERS, SCENARIOS } = require('./scenarios');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const UNITS = (process.argv[3] || '01,02,03,04,05,06').split(',');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..');
const wait = ms => new Promise(r => setTimeout(r, ms));
const trim = u => String(u || '').replace(/\/+$/, '');

async function screens(page) {
  const n = await page.evaluate(() => TOTAL_SCREENS);
  const shots = [];
  for (let i = 0; i < n; i++) {
    await page.evaluate(i => goTo(i), i);
    await wait(350);
    await page.evaluate(() => document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} }));
    await wait(150);
    shots.push(PNG.sync.read(await page.screenshot()));
  }
  return shots;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let failures = 0;
  const fail = (u, msg) => { failures++; console.log(`  FAIL ${u}: ${msg}`); };
  for (const u of UNITS) {
    const slug = 'methodica-math-ratio-05-' + u;
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', slug + '.json'), 'utf8'));
    const qids = new Set(); meta.subContent.forEach(s => (s.questions || []).forEach(q => qids.add(trim(q.questionId))));
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 710 });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const url = BASE + slug + '/index.html?xapiLib=../_test/xapi-720-k.js';
    const ready = () => page.waitForFunction(() => window.__stmts && __stmts().filter(s => s.verb === 'initialized' && s.objectType === 'onlinelesson').length >= (window.__expectInit || 1) && !document.getElementById('boot-cover'), { timeout: 20000 });
    const style = () => page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); localStorage.clear(); localStorage.setItem('methodica_math_ratio_05_selectedCharacter', 'character-2'); });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await ready(); await style();
    await page.evaluate(HELPERS);
    await page.evaluate(`window.__TIMES = 1; (${SCENARIOS[u]})(false)`);
    const before = await screens(page);
    await page.evaluate(() => goTo(Math.min(1, TOTAL_SCREENS - 1)));
    await wait(1200);                                   // debounced save (800 ms) lands
    const nBefore = await page.evaluate(() => __stmts().length);
    const doc = await page.evaluate(() => __state());
    if (!doc || doc.component !== slug) fail(u, 'state document component = ' + (doc && doc.component));
    if (!doc || !doc.payload) fail(u, 'no payload saved');
    const bytes = JSON.stringify(doc || {}).length;

    await page.evaluate(() => { window.name = 'expectInit2'; });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => { window.__expectInit = 2; });
    await ready(); await style();
    const landed = await page.evaluate(() => currentScreen);
    if (landed !== Math.min(1, before.length - 1)) fail(u, 'landed on screen ' + landed);
    const added = await page.evaluate(n => __stmts().slice(n).map(s => s.verb + ' ' + s.objectType), nBefore);
    if (added.some(v => !/^initialized /.test(v))) fail(u, 'restore sent: ' + added.join(', '));
    const after = await screens(page);
    before.forEach((A, i) => {
      const B = after[i];
      const px = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 });
      if (px > 0) {
        fail(u, `screen ${i} differs after reload (${px} px)`);
        fs.writeFileSync(path.join(__dirname, `.resume-${u}-s${i}-before.png`), PNG.sync.write(A));
        fs.writeFileSync(path.join(__dirname, `.resume-${u}-s${i}-after.png`), PNG.sync.write(B));
      }
    });

    await page.evaluate(HELPERS);
    await page.evaluate(`window.__TIMES = 1; (${SCENARIOS[u]})(false)`);
    await page.evaluate(() => { goTo(TOTAL_SCREENS - 1); const b = lastScreenButton(); if (b) { b.disabled = false; b.click(); } });
    await wait(300);
    let st = await page.evaluate(() => __stmts());
    const last = st.filter(s => s.verb === 'answered.last').map(s => trim(s.opts.questionId));
    qids.forEach(q => { if (!last.includes(q)) fail(u, 'no answered.last after resume for ' + q.replace(/^.*\/05\//, '')); });
    const cnt = {}; last.forEach(q => cnt[q] = (cnt[q] || 0) + 1);
    Object.entries(cnt).forEach(([q, n]) => { if (n > 1) fail(u, n + 'x answered.last ' + q.replace(/^.*\/05\//, '')); });
    const comp = st.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');
    if (comp.length !== 1) fail(u, comp.length + ' component completed');
    else if (qids.size && (comp[0].result.success !== false || comp[0].result.score.scaled !== 0)) fail(u, 'component result ' + JSON.stringify(comp[0].result));
    const dupes = await page.evaluate(() => __dupes());
    if (dupes.length) fail(u, 'duplicate completed: ' + dupes.join(', '));

    await wait(300);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => { window.__expectInit = 3; });
    await ready();
    const ended = await page.evaluate(() => { goTo(TOTAL_SCREENS - 1); const b = lastScreenButton(); return b ? b.disabled : null; });
    if (ended === false) fail(u, 'last button enabled again after the component was completed');
    await page.evaluate(() => { const b = lastScreenButton(); if (b) { b.disabled = false; b.click(); } });
    await wait(300);
    st = await page.evaluate(() => __stmts());
    if (st.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson').length !== 1) fail(u, 'component completed re-sent after reload');
    errs.forEach(e => fail(u, 'page error: ' + e));
    console.log(`${u}: landed s${landed}, ${before.length} screens compared, document ${bytes} bytes, ${st.length} statements`);
    await page.close();
  }
  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
