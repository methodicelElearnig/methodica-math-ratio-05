/* The leave save goes through xapi-720-l.js's saveState720OnLeave (hardening doc
   Documentation/reporting-and-resume/BOOT-AND-RESUME-HARDENING-2026-11-03.md §2.10, 2026-11-10).
   On -k the leave handler called saveState720, a synchronous PUT Chrome refuses during page
   dismissal, so a screen change in the last ≤ 800 ms (the debounce) before a reload was lost.
   In a real browser against the local library stubs, ported from methodica-math-percent-03 8b63a4f.
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/leave-save.js [BASE=http://127.0.0.1:8795/]

   For each component and each stub (-l, then -k): a debounced save lands on screen A, then goTo(B)
   and an immediate reload (inside the debounce) — the reload must land on B, and on -l the last
   leave write must have gone through saveState720OnLeave carrying B; on -k (no such function, the
   rollback path) the unit still lands on B through saveState720 and nothing throws. The Chrome
   refusal itself cannot happen on sessionStorage; it is checked live against Kata. */
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = ms => new Promise(r => setTimeout(r, ms));
const COMPONENTS = ['01', '02', '03', '04', '05', '06'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };
  const booted = page => page.waitForFunction(() => window.__stmts && __stmts().some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson') && !document.getElementById('boot-cover'), { timeout: 20000 });

  for (const c of COMPONENTS) for (const lib of ['l', 'k']) {
    const tag = c + ' -' + lib;
    const url = BASE + 'methodica-math-ratio-05-' + c + '/index.html?xapiLib=../_test/xapi-720-' + lib + '.js';
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await booted(page);
    /* two screens of this component after its first one */
    const [a, b] = await page.evaluate(() => {
      const ns = [...document.querySelectorAll('.screen[data-screen]')].map(s => +s.dataset.screen).sort((x, y) => x - y);
      return [ns[1], ns[2]];
    });
    await page.evaluate(n => goTo(n), a); await wait(1200);       // this debounced write lands…
    await page.evaluate(n => { goTo(n); }, b);                     // …this one is still pending at the reload
    await page.goto(url, { waitUntil: 'networkidle0' });
    await booted(page); await wait(500);
    const cs = await page.evaluate(() => currentScreen);
    ok(tag + ': a reload right after goTo(' + b + ') lands there', cs === b, 'landed on ' + cs + ' (A ' + a + ')');
    const lw = await page.evaluate(() => typeof __leaveWrites === 'function' ? __leaveWrites() : null);
    if (lib === 'l') ok(tag + ': the leave write went through saveState720OnLeave with screen ' + b,
      lw && lw.length >= 1 && lw[lw.length - 1].cs === b && lw[lw.length - 1].ok, JSON.stringify(lw));
    else ok(tag + ': the -k stub has no saveState720OnLeave', lw === null, JSON.stringify(lw));
    ok(tag + ': no page error', !errs.length, errs.slice(0, 2).join(' | '));
    await page.evaluate(() => __reset());
    await page.close();
  }

  await browser.close();
  console.log('\nleave-save: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
