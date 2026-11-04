/* Drag on a tablet (2026-11-04): 01 s2E and the draggable feedback popups, driven by real touch input
   (CDP touch events on a page emulating a touch device) and by the mouse. Native HTML5 drag, which this
   replaces, never fires from touch — the first group fails on the code before 2026-11-04.
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/touch-dnd.js [BASE=http://127.0.0.1:8795/] */
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const { HELPERS } = require('./scenarios');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };

  const open = async (u, touch) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, hasTouch: !!touch, isMobile: !!touch });
    page.__errs = [];
    page.on('pageerror', e => page.__errs.push(e.message));
    const url = BASE + 'methodica-math-ratio-05-' + u + '/index.html?xapiLib=../_test/xapi-720-k.js';
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__stmts && __stmts().some(s => s.verb === 'initialized') && !document.getElementById('boot-cover'), { timeout: 20000 });
    await page.evaluate(HELPERS);
    return page;
  };
  const center = (page, sel) => page.evaluate(sel => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);
  const reveal = (page, sel) => page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel);

  /* A finger: touchStart → several touchMoves → touchEnd (CDP Input.dispatchTouchEvent). */
  const touchDrag = async (page, from, to) => {
    await reveal(page, from);
    const a = await center(page, from), b = await center(page, to);
    await page.touchscreen.touchStart(a.x, a.y);
    for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await wait(16); }
    await page.touchscreen.touchEnd();
    await wait(80);
  };
  const touchDragTo = async (page, from, x, y) => {
    const a = await center(page, from);
    await page.touchscreen.touchStart(a.x, a.y);
    for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(a.x + (x - a.x) * i / 8, a.y + (y - a.y) * i / 8); await wait(16); }
    await page.touchscreen.touchEnd();
    await wait(80);
  };
  const tap = async (page, sel) => { await reveal(page, sel); const a = await center(page, sel); await page.touchscreen.tap(a.x, a.y); await wait(80); };
  const placement = page => page.evaluate(() => Object.assign({}, s2EPlacement));

  /* ── 01 s2E by touch ── */
  {
    const p = await open('01', true);
    await p.evaluate(() => goTo(2));
    await wait(300);
    await touchDrag(p, '#s2-drag-known', '#s2-target-known');
    let pl = await placement(p);
    ok('touch: a finger drags a bank card into a target', pl['s2-drag-known'] === 's2-target-known', JSON.stringify(pl));
    ok('touch: no ghost is left behind', await p.evaluate(() => !document.querySelector('.pointer-drag-ghost')));

    await tap(p, '#s2-drag-total');
    ok('touch: a tap picks a bank card', await p.evaluate(() => s2EPicked === 's2-drag-total' && document.getElementById('s2-drag-total').classList.contains('picked')));
    await tap(p, '#s2-target-total');
    pl = await placement(p);
    ok('touch: tapping a target places the picked card', pl['s2-drag-total'] === 's2-target-total', JSON.stringify(pl));

    await touchDrag(p, '#s2-target-known .s2-eq-placed-card', '#s2-target-groupsize');
    pl = await placement(p);
    ok('touch: a placed card moves to another target', pl['s2-drag-known'] === 's2-target-groupsize', JSON.stringify(pl));

    await touchDrag(p, '#s2-drag-groupsize', '#s2-target-groupsize');
    pl = await placement(p);
    ok('touch: dropping on an occupied target evicts its card to the bank', pl['s2-drag-groupsize'] === 's2-target-groupsize' && pl['s2-drag-known'] === 'source', JSON.stringify(pl));

    const away = await center(p, '#s2-e-check');
    await touchDragTo(p, '#s2-target-groupsize .s2-eq-placed-card', away.x, away.y + 120);
    pl = await placement(p);
    ok('touch: a placed card dropped outside every target goes back to the bank', pl['s2-drag-groupsize'] === 'source', JSON.stringify(pl));

    await tap(p, '#s2-target-total .s2-eq-placed-card');
    pl = await placement(p);
    ok('touch: tapping a placed card sends it back to the bank', pl['s2-drag-total'] === 'source', JSON.stringify(pl));

    /* all right, by touch, then check */
    for (const [t, c] of [['known', 'known'], ['total', 'total'], ['groupsize', 'groupsize'], ['knownsize', 'knownsize']]) {
      await touchDrag(p, '#s2-drag-' + c, '#s2-target-' + t);
    }
    ok('touch: the check button opens once all four are placed', await p.evaluate(() => !document.getElementById('s2-e-check').disabled));
    const hit = await p.evaluate(() => { const b = document.getElementById('s2-e-check'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && (e.id || e.className); });
    /* a pause, so this tap is not read as the second half of a double-tap (emulated mobile viewport) */
    await wait(800);
    await tap(p, '#s2-e-check');
    const chk = await p.evaluate(() => ({ checked: s2EChecked, right: s2EIsAllCorrect(), attempts: s2EAttempts, placement: s2EPlacement }));
    ok('touch: checked right', chk.checked && chk.right, JSON.stringify(chk) + ' hit=' + hit);
    const before = await placement(p);
    await touchDrag(p, '#s2-target-known .s2-eq-placed-card', '#s2-target-total');
    ok('touch: nothing moves after the check', JSON.stringify(await placement(p)) === JSON.stringify(before));
    const q = await p.evaluate(() => __stmts().filter(s => /^answered/.test(s.verb)).map(s => s.result && s.result.extensions && String(s.result.extensions.student_answer)).filter(Boolean));
    ok('touch: the answer was reported', q.some(r => /known: /.test(r)), JSON.stringify(q.slice(-2)));
    ok('touch: no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }

  /* ── 01 s2E by mouse (desktop must keep working) ── */
  {
    const p = await open('01', false);
    await p.evaluate(() => goTo(2));
    await wait(300);
    await reveal(p, '#s2-drag-known');
    const a = await center(p, '#s2-drag-known'), b = await center(p, '#s2-target-known');
    await p.mouse.move(a.x, a.y); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await wait(16); }
    await p.mouse.up(); await wait(80);
    ok('mouse: drag into a target', (await placement(p))['s2-drag-known'] === 's2-target-known');
    await p.click('#s2-drag-total'); await wait(50); await p.click('#s2-target-total'); await wait(80);
    ok('mouse: click-to-place', (await placement(p))['s2-drag-total'] === 's2-target-total');
    ok('mouse: no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }

  /* ── the draggable feedback popup moves by touch (02 s1) ── */
  {
    const p = await open('02', true);
    await p.evaluate(() => { goTo(1); __T.viq('s1', false); });
    await wait(300);
    const vis = await p.evaluate(() => { const b = document.getElementById('s1-feedbox'); return !!b && getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().width > 0; });
    ok('popup: the feedback box is shown', vis);
    if (vis) {
      const r0 = await p.evaluate(() => { const r = document.getElementById('s1-feedbox').getBoundingClientRect(); return { x: r.left, y: r.top }; });
      const t = await p.evaluate(() => { const b = document.getElementById('s1-feedbox'); const r = b.getBoundingClientRect(); return { x: r.left + 20, y: r.top + 12 }; });
      await p.touchscreen.touchStart(t.x, t.y);
      for (let i = 1; i <= 6; i++) { await p.touchscreen.touchMove(t.x - 15 * i, t.y - 10 * i); await wait(16); }
      await p.touchscreen.touchEnd(); await wait(80);
      const r1 = await p.evaluate(() => { const r = document.getElementById('s1-feedbox').getBoundingClientRect(); return { x: r.left, y: r.top }; });
      ok('popup: a finger moves the feedback box', Math.abs(r1.x - r0.x) > 20 || Math.abs(r1.y - r0.y) > 20, JSON.stringify({ r0, r1 }));
    }
    ok('popup: no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }

  await browser.close();
  console.log('\ntouch-dnd: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
