/* The guided walk-through reports no answer and has no score (10.11.26, unit owner: "do not report answers on guided
   questions and do not present them in metadata"). Part 01's s4 (item 01-004) walks the learner through four steps;
   Kata declares no question on 01-004, and since 10.11.26 neither does metadata/. Before, every step sent an
   answered with a real verdict (to questionIds Kata does not have) and 004's four steps sat in part 01's score
   (correct / 14 instead of / 10).
   In a real browser against the local library stub, every pick through the real handlers (s4Choose / s4CheckStep).
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/guided.js [BASE=http://127.0.0.1:8795/]

   For all four steps answered right and answered wrong: no answered (of any kind) names 01-004; the picks are still
   saved (s4State in the state document); leaving s4 closes item 004 with a completed that carries no result;
   004 is not an evaluated item and declares no question; part 01's score counts 10 questions (002 + 003 + 005). */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..');
const UNIT = fs.readdirSync(path.join(ROOT, 'metadata')).find(f => /_unit\.json$/.test(f)).replace(/_unit\.json$/, '');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };

  /* the metadata: 01-004 declares no question */
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', UNIT + '-01.json'), 'utf8'));
  const it4 = meta.subContent.find(i => /-01-004\/?$/.test(i.id));
  ok('metadata: item 01-004 exists and declares no question', it4 && Array.isArray(it4.questions) && it4.questions.length === 0,
     it4 ? JSON.stringify((it4.questions || []).map(q => q.questionId.split('/').pop())) : 'no item');

  for (const right of [true, false]) {
    const tag = right ? 'all right' : 'all wrong';
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const url = BASE + UNIT + '-01/index.html?xapiLib=../_test/xapi-720-l.js';
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => (window.__stmts ? __stmts() : []).some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson'), { timeout: 15000 });
    await page.evaluate(() => { goTo(1); goTo(2); goTo(3); goTo(4); });
    const n0 = await page.evaluate(() => __stmts().length);
    await page.evaluate(right => {
      [1, 2, 3, 4].forEach(n => {
        const pills = [...document.querySelectorAll('#s4-pills-' + n + ' .s4-pill')];
        const id = right ? S4_STEPS[n].correct : pills.map(p => p.dataset.id).find(x => x !== S4_STEPS[n].correct);
        s4Choose(n, id, pills.find(p => p.dataset.id === id));
        s4CheckStep(n);
      });
    }, right);
    await wait(300);
    const during = await page.evaluate(n0 => __stmts().slice(n0), n0);
    const ans = during.filter(s => /^answered/.test(s.verb));
    ok(tag + ': the four guided steps send no answered', ans.length === 0, JSON.stringify(ans.map(s => s.opts && s.opts.questionId)));
    const picks = await page.evaluate(() => s4State.answers);
    ok(tag + ': the picks are kept on the page', Object.keys(picks).length === 4, JSON.stringify(picks));
    await page.evaluate(() => { flushResumeSave(); });
    const saved = await page.evaluate(() => JSON.stringify(__rawState ? __rawState() : __state()));
    ok(tag + ': and saved in the state document', /s4/.test(saved) && Object.values(picks).every(v => saved.indexOf(JSON.stringify(v)) !== -1), saved.slice(0, 200));

    /* leaving s4 closes item 004 without a result */
    const n1 = await page.evaluate(() => __stmts().length);
    await page.evaluate(() => goTo(5));
    const after = await page.evaluate(n1 => __stmts().slice(n1), n1);
    const done4 = after.filter(s => s.verb === 'completed' && /-01-004\/?$/.test(s.objectId || (s.opts && s.opts.objectId) || ''));
    ok(tag + ': leaving s4 sends one completed for item 004', done4.length === 1, JSON.stringify(after.map(s => s.verb + ' ' + (s.objectId || ''))));
    ok(tag + ': with no result (no score, no success)', done4[0] && (!done4[0].result || (done4[0].result.score == null && done4[0].result.success == null)),
       JSON.stringify(done4[0] && done4[0].result));

    /* the whole statement log never names a 01-004 question */
    const all = await page.evaluate(() => __stmts());
    ok(tag + ': no statement anywhere names a 01-004 question', !all.some(s => /-01-004\/q\d/.test(JSON.stringify(s.opts || {}))));

    /* the score: 004 is not evaluated, part 01 counts 10 declared questions */
    const sc = await page.evaluate(() => ({
      eval: Object.keys(XAPI_EVAL_ITEMS), n004: itemQuestionCount('004'),
      total: Object.keys(XAPI_EVAL_ITEMS).reduce((a, it) => a + itemQuestionCount(it), 0),
      item004: typeof XAPI_ITEM_RESULT['004'],
    }));
    ok(tag + ': 004 is not an evaluated item and has no item result', sc.eval.indexOf('004') === -1 && sc.item004 === 'undefined', JSON.stringify(sc));
    ok(tag + ': part 01 scores out of 10 questions (002 + 003 + 005)', sc.total === 10 && sc.n004 === 0, JSON.stringify(sc));
    ok(tag + ': no page error', !errs.length, errs.slice(0, 2).join(' | '));
    await page.close();
  }

  await browser.close();
  console.log('\nguided: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
