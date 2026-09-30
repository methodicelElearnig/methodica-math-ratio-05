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

/* In-page helpers. right=true answers correctly; right=false answers wrongly (called twice). */
const HELPERS = `
window.__T = {
  val(id, v) { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); },
  /* every answer is given once when right, twice in a row when wrong (both attempts) */
  times(right, fn) { for (let k = 0; k < (right ? 1 : 2); k++) fn(); },
  scq(key, right) {
    const c = SCQ_CFG[key];
    const opts = [...document.querySelectorAll(c.containerSel + ' .scq-opt')].map(e => e.dataset.id);
    __T.times(right, () => { scqSelect(key, right ? c.correctId : opts.find(o => o !== c.correctId)); scqCheck(key); });
  },
  viq(key, right) {
    const c = VIQ_CFG[key];
    __T.times(right, () => { c.inputs.forEach((id, i) => __T.val(id, right ? c.correct[i] : c.correct[i] + 1 + Math.random())); viqCheck(key); });
  },
  go(n) { goTo(n); },
  finish() { const b = lastScreenButton(); if (b) { b.disabled = false; b.click(); } },
};`;

/* Per-component scenario, one walk through the component. */
const SCENARIOS = {
  '01': `(right) => {
    __T.go(1);
    [['q1','b','a'],['q2','40','30'],['q3','a','b']].forEach(([q, ok, bad]) => {
      if (s1State[q].done) return;
      const fn = { q1: olyQ1Select, q2: olyQ2Select, q3: olyQ3Select }[q];
      const el = [...document.querySelectorAll('#s1-' + q + ' .scq-opt')].find(e => e.dataset.id === (right ? ok : bad))
              || [...document.querySelectorAll('#s1-' + q + ' .scq-opt')].find(e => e.dataset.id !== ok);
      fn(el); ({ q1: olyQ1Check, q2: olyQ2Check, q3: olyQ3Check })[q]();
    });
    __T.go(2);
    if (!s2State.c.done) {
      const el = [...document.querySelectorAll('#s2-sec-c .scq-opt')].find(e => right ? e.dataset.id === '10' : e.dataset.id !== '10');
      s2CSelect(el); s2CCheck();
    }
    __T.times(right, () => {
      const t = Object.keys(S2_DDQ_CORRECT);
      s2EPlacement = {};
      t.forEach((tg, i) => { s2EPlacement[S2_DDQ_CORRECT[right ? tg : t[(i + 1) % t.length]]] = tg; });
      s2ECheck();
    });
    __T.go(3); __T.go(4);
    [1, 2, 3, 4].forEach(n => {
      if (s4State.answers[n]) return;
      const pills = [...document.querySelectorAll('#s4-pills-' + n + ' .s4-pill')];
      const id = right ? S4_STEPS[n].correct : pills.map(p => p.dataset.id).find(x => x !== S4_STEPS[n].correct);
      s4Choose(n, id, pills.find(p => p.dataset.id === id)); s4CheckStep(n);
    });
    __T.go(5); __T.go(6);
    [1, 2].forEach(n => __T.times(right, () => { S6_Q[n].inputs.forEach((id, i) => __T.val(id, right ? S6_Q[n].correct[i] : S6_Q[n].correct[i] + 1 + Math.random())); s6Check(n); }));
    s6HintOpen();
  }`,
  '02': `(right) => {
    __T.go(1); __T.viq('s1', right); __T.go(2); __T.viq('s2', right); __T.go(3); __T.scq('s3p2', right);
    __T.times(right, () => { [1, 2, 3].forEach(r => s3P3Select(r, right ? s3TfCorrect[r] : (s3TfCorrect[r] === 'true' ? 'false' : 'true'))); s3P3Check(); });
    __T.go(4); __T.scq('s4p1', right); __T.scq('s4p2', right); __T.viq('s4p3', right);
  }`,
  '03': `(right) => {
    __T.go(1);
    ['p1', 'p2'].forEach(k => __T.times(right, () => {
      const c = S1MIX_CFG[k];
      __T.val(c.whiteId, right ? c.correct.white : c.correct.white + 1 + Math.random()); __T.val(c.darkId, c.correct.dark);
      s1MixSelectYN(k, c.correct.yn); s1MixCheck(k);
    }));
    __T.scq('s1p3', right);
    __T.go(2); __T.times(right, () => { [1, 2, 3, 4].forEach(r => s2P1Select(r, right ? s2TfCorrect[r] : (s2TfCorrect[r] === 'true' ? 'false' : 'true'))); s2P1Check(); });
    __T.go(3); __T.viq('s3p1', right); __T.scq('s3p2', right);
    const m = MCQ_CFG.s3p3;
    const all = [...document.querySelectorAll(m.containerSel + ' .scq-opt')].map(e => e.dataset.id);
    const want = right ? m.correctIds : all.filter(x => m.correctIds.indexOf(x) === -1);
    __T.times(right, () => {
      const st = mcqState.s3p3; const cur = st ? [...st.selected] : [];
      all.forEach(id => { if ((want.indexOf(id) !== -1) !== (cur.indexOf(id) !== -1)) mcqToggle('s3p3', id); });
      mcqCheck('s3p3');
    });
    __T.go(4); __T.go(5); __T.viq('s5p1', right); __T.scq('s5p2', right); __T.scq('s5p3', right);
  }`,
  '04': `(right) => {
    __T.go(1); __T.go(2);
    S2_OPEN_INPUT_IDS.forEach(id => __T.val(id, 3));
  }`,
  '05': `(right) => {
    __T.go(1); __T.viq('s1p1', right); s1P2HintOpen(); __T.scq('s1p2', right); __T.go(2); __T.viq('s2', right);
    __T.go(3); s3P1HintOpen(); __T.viq('s3p1', right); __T.scq('s3p2', right);
  }`,
  '06': `(right) => {
    __T.go(1); __T.go(2); s2P1HintOpen(); __T.viq('s2p1', right); __T.viq('s2p2', right);
    __T.go(3); __T.go(4); __T.viq('s2p5', right); __T.viq('s2p4', right);
  }`,
};

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
