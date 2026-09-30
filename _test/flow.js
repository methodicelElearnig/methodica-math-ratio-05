/* Statement-flow check for every component, in a real browser against the local library stub.
   Usage (from the repo root, with a static server on BASE):
     node _test/flow.js [BASE=http://127.0.0.1:8795/] [units=01,02,...]
   Needs puppeteer-core (install it OUTSIDE OneDrive and run with NODE_PATH) and a local Chrome.

   For each component it plays two scenarios — every question right first time, and every
   question wrong twice — walking every screen in order and pressing the last "המשך". It then
   asserts, against ../metadata/<component>.json:
     - every declared questionId gets exactly one answered.last, and nothing undeclared is reported
     - every statement object is a declared component / item / question id
     - every graded item gets one item 'completed' with a score; no 'completed' is duplicated
     - the component 'completed' carries the expected success/score
     - no page error */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const UNITS = (process.argv[3] || '01,02,03,04,05,06').split(',');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..');

const { HELPERS, SCENARIOS } = require('./scenarios');

function trim(u) { return String(u || '').replace(/\/+$/, ''); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let failures = 0;
  const fail = (u, sc, msg) => { failures++; console.log(`  FAIL ${u} ${sc}: ${msg}`); };
  for (const u of UNITS) {
    const slug = 'methodica-math-ratio-05-' + u;
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', slug + '.json'), 'utf8'));
    const items = {}; const qids = new Set();
    meta.subContent.forEach(s => { items[trim(s.id)] = s; (s.questions || []).forEach(q => qids.add(trim(q.questionId))); });
    for (const sc of ['right', 'wrong']) {
      const page = await browser.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
      const url = BASE + slug + '/index.html?xapiLib=../_test/xapi-720-k.js';
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.evaluate(() => __reset());
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => (window.__stmts ? __stmts() : []).some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson'), { timeout: 15000 });
      await page.evaluate(HELPERS);
      await page.evaluate(`(${SCENARIOS[u]})(${sc === 'right'})`);
      await page.evaluate(() => { goTo(TOTAL_SCREENS - 1); __T.finish(); });
      await new Promise(r => setTimeout(r, 300));
      const st = await page.evaluate(() => __stmts());
      await page.close();

      const last = st.filter(s => s.verb === 'answered.last').map(s => trim(s.opts.questionId));
      const lastSet = new Set(last);
      qids.forEach(q => { if (!lastSet.has(q)) fail(u, sc, 'no answered.last for ' + q.replace(/^.*\/05\//, '')); });
      last.forEach(q => { if (!qids.has(q)) fail(u, sc, 'undeclared question ' + q); });
      const counts = {}; last.forEach(q => counts[q] = (counts[q] || 0) + 1);
      Object.entries(counts).forEach(([q, n]) => { if (n > 1) fail(u, sc, n + 'x answered.last ' + q.replace(/^.*\/05\//, '')); });
      st.forEach(s => {
        const o = s.opts || {};
        if (o.objectId && !items[trim(o.objectId)]) fail(u, sc, 'unknown object ' + o.objectId);
        if (o.questionId && !qids.has(trim(o.questionId))) fail(u, sc, s.verb + ' unknown question ' + o.questionId);
        if (o.parentId && !items[trim(o.parentId)]) fail(u, sc, 'unknown parent ' + o.parentId);
      });
      const graded = Object.keys(items).filter(i => (items[i].questions || []).length);
      graded.forEach(i => {
        const c = st.filter(s => s.verb === 'completed' && trim(s.objectId) === i);
        if (c.length !== 1) fail(u, sc, c.length + ' item completed for ' + i.slice(-3));
        else if (!c[0].result || !c[0].result.score) fail(u, sc, 'item completed without score ' + i.slice(-3));
        else if (c[0].result.score.scaled !== (sc === 'right' ? 1 : 0)) fail(u, sc, 'item ' + i.slice(-3) + ' scaled ' + c[0].result.score.scaled);
      });
      const comp = st.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');
      if (comp.length !== 1) fail(u, sc, comp.length + ' component completed');
      else {
        const r = comp[0].result || {};
        const want = graded.length ? { success: sc === 'right', scaled: sc === 'right' ? 1 : 0 } : { success: true };
        if (r.success !== want.success || (want.scaled != null && (!r.score || r.score.scaled !== want.scaled))) fail(u, sc, 'component result ' + JSON.stringify(r));
      }
      const dup = {}; st.filter(s => s.verb === 'completed').forEach(s => { const k = s.objectType + (s.objectId || ''); dup[k] = (dup[k] || 0) + 1; });
      Object.entries(dup).forEach(([k, n]) => { if (n > 1) fail(u, sc, 'duplicate completed ' + k); });
      if (st.filter(s => s.verb === 'initialized' && s.objectType === 'onlinelesson').length !== 1) fail(u, sc, 'component initialized count');
      errs.forEach(e => fail(u, sc, 'page error: ' + e));
      const hints = st.filter(s => /^requested/.test(s.verb)).length;
      console.log(`${u} ${sc.padEnd(5)} ${st.length} statements, ${lastSet.size}/${qids.size} questions, ${hints} hint request(s), component ${comp[0] ? JSON.stringify(comp[0].result) : '—'}`);
    }
  }
  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
