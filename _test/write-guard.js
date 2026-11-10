/* No write before the restore (KNOWN-ISSUE-drain-overwrites-payload.md, BOOT-AND-RESUME-HARDENING-2026-11-03.md).
   In a real browser against the local library stub (state in sessionStorage, read failures via __failReads).
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/write-guard.js [BASE=http://127.0.0.1:8795/]

   drain    Kata's reproduction, replayed: a document saved on screen 2 → the learner picks a card and moves
            while the restore is still loading → phase B drains → the stored payload must still say screen 2
            (the old drain persisted a live capture of the un-restored page), the character is the new one,
            and the debounced write (which holds the document by reference) does not undo that.
   ledger   markSent before phase B marks in memory and writes nothing; the key rides the next save.
   read     a read that fails (500, 401, network) is not "nothing saved yet": the cover is kept for the
            retry, the second failure leaves the writes closed for the session, the stored document is
            untouched by navigation and answers; a later successful read restores it. A 404 is a fresh
            document with the writes open.
   The first check of each group fails on the code before 2026-11-04. */
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };

  const url = u => BASE + 'methodica-math-ratio-05-' + u + '/index.html?xapiLib=../_test/xapi-720-l.js';
  const booted = page => page.waitForFunction(() => window.__stmts && __stmts().some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson') && !document.getElementById('boot-cover'), { timeout: 20000 });
  const open = async u => {
    const page = await browser.newPage();
    page.__errs = [];
    page.on('pageerror', e => page.__errs.push(e.message));
    await page.goto(url(u), { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
    await page.goto(url(u), { waitUntil: 'networkidle0' });
    await booted(page);
    return page;
  };
  const reload = async page => { await page.goto(url(page.__u || '01'), { waitUntil: 'networkidle0' }); await wait(500); };
  const screenOf = doc => doc && doc.payload ? doc.payload.currentScreen : null;
  /* A saved position: screen 2, synchronously written; returned once the debounced save armed by
     goTo has landed too, so the snapshot is what a reload will read. */
  const saveAt2 = async page => { await page.evaluate(() => { goTo(1); goTo(2); flushResumeSave(); }); await wait(1200); return page.evaluate(() => __rawState()); };

  /* ── drain ── */
  {
    const p = await open('01'); p.__u = '01';
    const saved = await saveAt2(p);
    ok('drain: the setup saved screen 2', screenOf(saved) === 2, JSON.stringify(screenOf(saved)));
    /* The window between the phases, replayed on the live page (BOOT-AND-RESUME-HARDENING §2.7). */
    const r = await p.evaluate(saved => {
      _resumeReady = false;
      _unitState = JSON.parse(JSON.stringify(saved));
      goTo(0);
      setUnitCharacter('character-2');
      goTo(1);
      _resumeReady = true;
      drainPendingUnitState();
      return __rawState();
    }, saved);
    ok('drain: the stored payload still says screen 2 after the drain', screenOf(r) === 2, 'screen ' + screenOf(r));
    ok('drain: the new character is in the document', r && r.ui && r.ui.character === 'character-2', JSON.stringify(r && r.ui));
    await p.evaluate(saved => applyExecutionState(saved.payload), saved);
    await wait(1200);   /* the debounced write fires */
    const r2 = await p.evaluate(() => ({ doc: __rawState(), cur: currentScreen }));
    ok('drain: after the restore and the debounced write the document says screen 2', screenOf(r2.doc) === 2 && r2.cur === 2, JSON.stringify({ stored: screenOf(r2.doc), cur: r2.cur }));
    ok('drain: no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }

  /* ── ledger ── */
  {
    const p = await open('02'); p.__u = '02';
    const before = await saveAt2(p);
    const r = await p.evaluate(() => {
      _resumeReady = false;
      markSent('done', 'write-guard-key');
      return { stored: __rawState(), mem: !!(_unitState.done && _unitState.done['write-guard-key']) };
    });
    ok('ledger: markSent before phase B writes nothing', JSON.stringify(r.stored) === JSON.stringify(before));
    ok('ledger: the key is marked in memory', r.mem);
    const r2 = await p.evaluate(() => { _resumeReady = true; flushResumeSave(); const d = __rawState(); return !!(d.done && d.done['write-guard-key']); });
    ok('ledger: the key rides the next save', r2);
    await p.close();
  }

  /* ── read ── */
  for (const status of [500, 401, '0!']) {
    const tag = 'read ' + status + ': ';
    const p = await open('01'); p.__u = '01';
    const saved = await saveAt2(p);
    await p.evaluate(s => __failReads(s), status);
    await reload(p);
    await p.waitForFunction(() => typeof _resumeReadFailed !== 'undefined' && window.__stmts && __stmts().some(s => s.verb === 'initialized'), { timeout: 20000 }).catch(() => {});
    const r = await p.evaluate(() => ({ failed: typeof _resumeReadFailed !== 'undefined' && _resumeReadFailed, ready: _resumeReady, cur: currentScreen }));
    ok(tag + 'the read is flagged as failed and the writes stay closed', r.failed === true && r.ready === false, JSON.stringify(r));
    /* The baseline is the document as this failed session found it (the healthy session before the
       reload may legitimately have saved once more on leaving the page). */
    const baseline = await p.evaluate(() => __rawState());
    ok(tag + 'the stored document still says screen 2', screenOf(baseline) === 2 && screenOf(saved) === 2);
    const r2 = await p.evaluate(() => {
      goTo(1); goTo(3); flushResumeSave(); scheduleResumeSave();
      const okp = persistUnitState(captureUnitState());
      setUnitCharacter('character-1'); drainPendingUnitState(); markSent('done', 'x');
      return okp;
    });
    await wait(1200);
    const stored = await p.evaluate(() => __rawState());
    ok(tag + 'nothing was written over the saved document', JSON.stringify(stored) === JSON.stringify(baseline) && r2 === false,
      JSON.stringify({ storedScreen: screenOf(stored), persist: r2 }));
    await p.evaluate(() => __failReads(false));
    await reload(p);
    await booted(p);
    const r3 = await p.evaluate(() => ({ failed: typeof _resumeReadFailed !== 'undefined' && _resumeReadFailed, ready: _resumeReady, cur: currentScreen }));
    ok(tag + 'a later successful read restores the saved screen', r3.failed === false && r3.ready === true && r3.cur === 2, JSON.stringify(r3));
    ok(tag + 'no page error', !p.__errs.length, p.__errs.slice(0, 2).join(' | '));
    await p.close();
  }
  {
    /* 404 = a fresh document: not a failure, writes open */
    const p = await open('01');
    const r = await p.evaluate(() => ({ failed: typeof _resumeReadFailed !== 'undefined' && _resumeReadFailed, ready: _resumeReady, last: stateLastResult720() }));
    ok('read 404: a fresh document is not a failure', r.failed === false && r.ready === true, JSON.stringify(r));
    const r2 = await p.evaluate(() => { goTo(1); flushResumeSave(); return __rawState(); });
    ok('read 404: the first save lands', screenOf(r2) === 1);
    await p.close();
  }

  await browser.close();
  console.log('\nwrite-guard: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
