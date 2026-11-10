/* True/false questions report 'true' / 'false', never the label on the button (guide
   Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §6.3b, 2026-11-04). Kata compares
   result.response with the question's correctXapiResponsesPattern, which for a true-false question is
   ["true"] or ["false"]; "נכון" / "לא נכון" / "כן" / "לא" never match. Found on the live Kata rounds of
   09.11.26. In a real browser against the local library stub, every answer through the real handlers.
   Usage (from the repo root, with a static server on BASE):
     NODE_PATH=<tools>/node_modules node _test/true-false.js [BASE=http://127.0.0.1:8795/]

   For every metadata question of type true-false (01-004 q1, 02-003 q2-q4, 03-002 q1-q4, 03-004 q3),
   answered all right and all wrong (twice), each answered statement must carry the reported value
   (result.response, else student_answer — what the live library turns into result.response) 'true' or
   'false', and that value equals the metadata's correct answer exactly when success is true. */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8795/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const { HELPERS } = require('./scenarios');
const ROOT = path.join(__dirname, '..');
const UNIT = fs.readdirSync(path.join(ROOT, 'metadata')).find(f => /_unit\.json$/.test(f)).replace(/_unit\.json$/, '');

/* the metadata's true/false questions, keyed '<item>/<qKey>', with the correct answer as a boolean;
   the correct label may still be the on-screen word in this repo's metadata (נכון / כן → true) */
const TRUE_WORDS = ['true', 'נכון', 'כן', 'صحيح', 'نعم'];
const TF = {};
for (const c of ['01', '02', '03']) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', UNIT + '-' + c + '.json'), 'utf8'));
  for (const it of m.subContent) for (const q of it.questions || []) {
    if (q.questionType !== 'true-false') continue;
    const parts = q.questionId.replace(/\/+$/, '').split('/');
    TF[c + ':' + parts[parts.length - 2].slice(-3) + '/' + parts[parts.length - 1]] = TRUE_WORDS.indexOf(String(q.correctAnswers[0])) !== -1 ? 'true' : 'false';
  }
}

/* one walk per component over its true/false screens, right or wrong (twice), through the handlers */
const WALK = {
  '01': `r => { __T.go(3); __T.go(4); const pills = [...document.querySelectorAll('#s4-pills-1 .s4-pill')];
           const id = r ? S4_STEPS[1].correct : pills.map(p => p.dataset.id).find(x => x !== S4_STEPS[1].correct);
           s4Choose(1, id, pills.find(p => p.dataset.id === id)); s4CheckStep(1); }`,
  '02': `r => { __T.go(3); __T.times(r, () => { [1, 2, 3].forEach(k => s3P3Select(k, r ? s3TfCorrect[k] : (s3TfCorrect[k] === 'true' ? 'false' : 'true'))); s3P3Check(); }); }`,
  '03': `r => { __T.go(2); __T.times(r, () => { [1, 2, 3, 4].forEach(k => s2P1Select(k, r ? s2TfCorrect[k] : (s2TfCorrect[k] === 'true' ? 'false' : 'true'))); s2P1Check(); });
           __T.go(5); __T.scq('s5p3', r); }`,
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };
  ok('the metadata declares the 9 true/false questions', Object.keys(TF).length === 9, Object.keys(TF).join(' '));

  for (const c of Object.keys(WALK)) for (const right of [true, false]) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const url = BASE + UNIT + '-' + c + '/index.html?xapiLib=../_test/xapi-720-l.js';
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { __reset(); try { localStorage.clear(); } catch (e) {} });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => (window.__stmts ? __stmts() : []).some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson'), { timeout: 15000 });
    await page.evaluate(HELPERS);
    await page.evaluate('(' + WALK[c] + ')(' + right + ')');
    const st = await page.evaluate(() => __stmts());
    const tag = c + (right ? ' all right' : ' all wrong');
    const seen = {};
    for (const s of st) {
      if (!/^answered/.test(s.verb) || !s.opts || !s.opts.questionId) continue;
      const parts = s.opts.questionId.replace(/\/+$/, '').split('/');
      const key = c + ':' + parts[parts.length - 2].slice(-3) + '/' + parts[parts.length - 1];
      if (!(key in TF)) continue;
      seen[key] = true;
      const r = s.result || {};
      const sent = r.response != null ? String(r.response) : ((r.extensions && r.extensions.student_answer) || []).join(' | ');
      ok(tag + ' ' + key + ' (' + s.verb + '): reports "true" / "false"', sent === 'true' || sent === 'false', JSON.stringify(sent));
      ok(tag + ' ' + key + ': the value matches the correct answer exactly when success', (sent === TF[key]) === (r.success === true),
        'sent ' + sent + ', correct ' + TF[key] + ', success ' + r.success);
      ok(tag + ' ' + key + ': success as walked', r.success === right, String(r.success));
    }
    for (const key of Object.keys(TF).filter(k => k.startsWith(c + ':'))) ok(tag + ' ' + key + ' was reported', seen[key]);
    ok(tag + ': no page error', !errs.length, errs.slice(0, 2).join(' | '));
    await page.close();
  }

  await browser.close();
  console.log('\ntrue-false: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
