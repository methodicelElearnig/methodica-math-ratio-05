/* Pass rules, the 03 stop and the default character — MOE monday 05-06.10.26. In a real browser
   against the local library stub, every answer through the real handlers.
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/gates.js [BASE=http://127.0.0.1:8795/]

   02  s0 says "צריך לענות נכון על 2 שאלות לפחות" (of 4): 2 questions fully right → success,
       1 → not, whatever the share of xAPI sub-answers (XAPI_STATION_PASS, 22-scoring.js).
   03  s0 says "ענו נכון על 2 שאלות ומעלה כדי להתקדם" (group A, s1-s3): under 2, s3's "המשך" ENDS
       the component on s3 (completed success false, button ended, no s4); 2+ → s4. Stays ended
       after a reload; answered-but-not-clicked comes back live; missing evidence fails open.
   chr With no character chosen in this browser, the first screen still shows one (the default);
       06's boy clip exists. */
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const { HELPERS } = require('./scenarios');

/* Each station of 02 and of 03's group A, answered right or wrong (twice) through the handlers. */
const STATIONS = `
window.__S = {
  '02': [
    r => { __T.go(1); __T.viq('s1', r); },
    r => { __T.go(2); __T.viq('s2', r); },
    r => { __T.go(3); __T.scq('s3p2', r);
           __T.times(r, () => { [1, 2, 3].forEach(k => s3P3Select(k, r ? s3TfCorrect[k] : (s3TfCorrect[k] === 'true' ? 'false' : 'true'))); s3P3Check(); }); },
    r => { __T.go(4); __T.scq('s4p1', r); __T.scq('s4p2', r); __T.viq('s4p3', r); },
  ],
  '03': [
    r => { __T.go(1);
           ['p1', 'p2'].forEach(k => __T.times(r, () => { const c = S1MIX_CFG[k];
             __T.val(c.whiteId, r ? c.correct.white : c.correct.white + 1 + Math.random()); __T.val(c.darkId, c.correct.dark);
             s1MixSelectYN(k, c.correct.yn); s1MixCheck(k); }));
           __T.scq('s1p3', r); },
    r => { __T.go(2); __T.times(r, () => { [1, 2, 3, 4].forEach(k => s2P1Select(k, r ? s2TfCorrect[k] : (s2TfCorrect[k] === 'true' ? 'false' : 'true'))); s2P1Check(); }); },
    r => { __T.go(3); __T.viq('s3p1', r); __T.scq('s3p2', r);
           const m = MCQ_CFG.s3p3; const all = [...document.querySelectorAll(m.containerSel + ' .scq-opt')].map(e => e.dataset.id);
           const want = r ? m.correctIds : all.filter(x => m.correctIds.indexOf(x) === -1);
           __T.times(r, () => { const st = mcqState.s3p3; const cur = st ? [...st.selected] : [];
             all.forEach(id => { if ((want.indexOf(id) !== -1) !== (cur.indexOf(id) !== -1)) mcqToggle('s3p3', id); }); mcqCheck('s3p3'); }); },
  ],
};`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };
  const comp = st => st.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');

  /* a fresh page for one component: stub reset, booted, helpers in */
  const open = async (u, opts) => {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
    const url = BASE + 'methodica-math-ratio-05-' + u + '/index.html?xapiLib=../_test/xapi-720-k.js';
    page.__url = url; page.__errs = errs;
    await page.goto(url, { waitUntil: 'networkidle0' });
    if (!(opts && opts.keep)) {
      await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
      await page.goto(url, { waitUntil: 'networkidle0' });
    }
    await page.waitForFunction(() => (window.__stmts ? __stmts() : []).some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson'), { timeout: 15000 });
    await page.evaluate(HELPERS); await page.evaluate(STATIONS);
    return page;
  };
  const reload = async page => {
    await page.goto(page.__url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => typeof currentScreen === 'number' && !!document.querySelector('.screen.active'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(HELPERS); await page.evaluate(STATIONS);
  };
  const play = (page, u, plan) => page.evaluate((u, plan) => { plan.forEach((r, i) => __S[u][i](r)); }, u, plan);

  /* ── 02: 2 of 4 questions ── */
  for (const [plan, want] of [[[true, true, false, false], true], [[false, false, true, true], true], [[true, false, false, false], false], [[false, false, false, false], false]]) {
    const p = await open('02');
    await play(p, '02', plan);
    await p.evaluate(() => { goTo(TOTAL_SCREENS - 1); __T.finish(); });
    await new Promise(r => setTimeout(r, 300));
    const c = comp(await p.evaluate(() => __stmts()));
    const n = plan.filter(Boolean).length;
    ok('02 ' + n + '/4 questions right → success ' + want, c.length === 1 && c[0].result && c[0].result.success === want, JSON.stringify(c.map(x => x.result)));
    ok('02 ' + n + '/4 no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }

  /* ── 03: the stop after group A ── */
  for (const [plan, stops] of [[[false, false, false], true], [[true, false, false], true], [[false, true, false], true], [[true, true, false], false], [[false, true, true], false], [[true, true, true], false]]) {
    const tag = '03 ' + plan.filter(Boolean).length + '/3 (' + plan.map(x => x ? '✓' : '✗').join('') + ')';
    const p = await open('03');
    await play(p, '03', plan);
    const live = await p.evaluate(() => !document.getElementById('s3-continue').disabled);
    ok(tag + ': s3 "המשך" is live once group A is answered', live);
    await p.evaluate(() => document.getElementById('s3-continue').click());
    await new Promise(r => setTimeout(r, 400));
    const r1 = await p.evaluate(() => ({ cur: currentScreen, dis: document.getElementById('s3-continue').disabled, aria: document.getElementById('s3-continue').getAttribute('aria-disabled'), st: __stmts() }));
    if (!stops) {
      ok(tag + ': on to s4', r1.cur === 4, 'screen ' + r1.cur);
      ok(tag + ': nothing completed yet', comp(r1.st).length === 0);
      await p.close();
      continue;
    }
    ok(tag + ': stays on s3', r1.cur === 3, 'screen ' + r1.cur);
    ok(tag + ': component completed, success false', comp(r1.st).length === 1 && comp(r1.st)[0].result.success === false, JSON.stringify(comp(r1.st).map(x => x.result)));
    ok(tag + ': the button is ended', r1.dis === true && r1.aria === 'true');
    await p.evaluate(() => { document.getElementById('s3-continue').disabled = false; document.getElementById('s3-continue').click(); goTo(4); });
    await new Promise(r => setTimeout(r, 300));
    const r2 = await p.evaluate(() => ({ cur: currentScreen, st: __stmts() }));
    ok(tag + ': a second click / goTo(4) moves nothing and sends nothing', r2.cur === 3 && comp(r2.st).length === 1, 'screen ' + r2.cur + ' completed ' + comp(r2.st).length);
    if (plan.some(Boolean)) { await p.close(); continue; }
    await p.evaluate(() => { goTo(2); goTo(3); });
    ok('03: Back and forward again leaves the button ended', await p.evaluate(() => document.getElementById('s3-continue').disabled));
    await reload(p);
    const r3 = await p.evaluate(() => ({ cur: currentScreen, dis: document.getElementById('s3-continue').disabled, st: __stmts() }));
    ok('03: after a reload on s3 the button is still ended, nothing re-sent', r3.cur === 3 && r3.dis === true && comp(r3.st).length === 1, JSON.stringify({ cur: r3.cur, dis: r3.dis, c: comp(r3.st).length }));
    ok('03: no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }
  {
    /* answered under 2, reloaded BEFORE the click: live, and the click still stops */
    const p = await open('03');
    await play(p, '03', [true, false, false]);
    await p.evaluate(() => { try { flushResumeSave(); } catch (e) {} });
    await new Promise(r => setTimeout(r, 300));
    await reload(p);
    const r = await p.evaluate(() => ({ cur: currentScreen, dis: document.getElementById('s3-continue').disabled }));
    ok('03: reloaded before the click, the s3 button is live', r.cur === 3 && r.dis === false, JSON.stringify(r));
    await p.evaluate(() => document.getElementById('s3-continue').click());
    await new Promise(r => setTimeout(r, 400));
    const r2 = await p.evaluate(() => ({ cur: currentScreen, st: __stmts() }));
    ok('03: that click still stops and reports', r2.cur === 3 && comp(r2.st).length === 1 && comp(r2.st)[0].result.success === false);
    await p.close();
  }
  {
    /* fails open: group A unresolved → no stop */
    const p = await open('03');
    await p.evaluate(() => { goTo(3); goTo(4); });
    ok('03: with group A unresolved the stop fails open', (await p.evaluate(() => currentScreen)) === 4);
    await p.close();
  }

  /* ── the default character ── */
  for (const [u, id, file] of [['02', 's0-avatar', 'boy-avatar-work-out'], ['03', 's0-avatar', 'boy-avatar-smart'], ['06', 's0-avatar', 'boy-avatar-jumping-happily']]) {
    const p = await open(u);
    const r = await p.evaluate(id => ({ chosen: window.lomdaState.selectedCharacter, src: document.getElementById(id).getAttribute('src') || '' }), id);
    ok(u + ': no character chosen → the first screen still shows one (' + file + ')', r.chosen === null && r.src.indexOf(file) !== -1, JSON.stringify(r));
    const loaded = await p.evaluate(id => new Promise(res => { const v = document.getElementById(id); if (v.readyState >= 1) return res(true); v.addEventListener('loadedmetadata', () => res(true)); v.addEventListener('error', () => res(false)); setTimeout(() => res(v.readyState >= 1), 4000); }), id);
    ok(u + ': and that video actually loads', loaded);
    await p.close();
  }

  await browser.close();
  console.log('\ngates: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
