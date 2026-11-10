/* answered result.response = Kata's correctXapiResponsesPattern (MOE runbook 10.11.26).
   Usage (from the repo root; serves the repo itself on a free port):
     NODE_PATH=<outside OneDrive>/node_modules node _test/responses.js [units=01,02,...]
   Needs puppeteer-core and a local Chrome (as flow.js).

   metadata/ carries Kata's patterns since 2026-11-11 (and the proposed performance entries for the
   multi-field questions). For each component the scripted walks of scenarios.js are played:
     - right: every metadata question with a pattern gets an answered.last with success true and a
       response that is one of the pattern's entries, byte for byte;
     - wrong: every response is still free of home-made separators (' | ', '->', ', ' joins of ids),
       input / target ids ('s1-a=', 's2-target-') and invisible marks (LRM / RLM / ALM / ZWSP / BOM).
   Plus: the retired string builders are gone from 20-xapi.js and no call site joins with ' | '.
   Mutation check: with 20-xapi.js, 35-questions.js and the part scripts from before 2026-11-11
   most of the right-walk checks fail. */
const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..');
const UNIT = fs.readdirSync(path.join(ROOT, 'metadata')).find(f => /_unit\.json$/.test(f)).replace(/_unit\.json$/, '');
const UNITS = (process.argv[2] || '01,02,03,05,06').split(',');
const { HELPERS, SCENARIOS } = require('./scenarios');

const trim = u => String(u || '').replace(/\/+$/, '');
const BAD = /\s\|\s|->|\b(?:s\d+(?:-[a-z0-9]+)+)\s*[=:]|s\d-target-|[\u200B\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

let passes = 0; const failures = [];
const ok = (tag, what, cond, detail) => { if (cond) passes++; else failures.push(`[${tag}] ${what}${detail ? '  —  ' + detail : ''}`); };

const server = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); r.end(d); });
});

server.listen(0, async () => {
  const BASE = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  try {
    for (const u of UNITS) {
      const slug = UNIT + '-' + u;
      const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', slug + '.json'), 'utf8').replace(/^\uFEFF/, ''));
      const pats = {};
      meta.subContent.forEach(s => (s.questions || []).forEach(q => {
        if (q.correctXapiResponsesPattern && q.correctXapiResponsesPattern.length) pats[trim(q.questionId)] = q.correctXapiResponsesPattern;
      }));
      for (const sc of ['right', 'wrong']) {
        const page = await browser.newPage();
        const errs = [];
        page.on('pageerror', e => errs.push(e.message));
        page.on('console', m => { if (m.type() === 'error' && !/favicon|404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
        const url = BASE + slug + '/index.html?xapiLib=../_test/xapi-720-l.js';
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.evaluate(() => __reset());
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => (window.__stmts ? __stmts() : []).some(s => s.verb === 'initialized' && s.objectType === 'onlinelesson'), { timeout: 15000 });
        await page.evaluate(HELPERS);
        await page.evaluate(`(${SCENARIOS[u]})(${sc === 'right'})`);
        const st = await page.evaluate(() => __stmts());
        await page.close();
        const ans = st.filter(s => /^answered/.test(s.verb) && s.opts && s.opts.questionId);
        const resp = s => { const r = s.result || {}; return r.response != null ? String(r.response) : ''; };
        ans.forEach(s => ok(`${u} ${sc} ${trim(s.opts.questionId).replace(/^.*\/(\d{3}\/q\d+)$/, '$1')}`,
          'no home-made separator / id / invisible mark', !BAD.test(resp(s)), JSON.stringify(resp(s))));
        if (sc === 'right') {
          Object.keys(pats).forEach(qid => {
            const tag = `${u} right ${qid.replace(/^.*-(\d{3}\/q\d+)$/, '$1')}`;
            const last = ans.filter(s => s.verb === 'answered.last' && trim(s.opts.questionId) === qid);
            ok(tag, 'one answered.last', last.length === 1, String(last.length));
            if (!last.length) return;
            ok(tag, 'success true', last[0].result && last[0].result.success === true);
            ok(tag, "response is Kata's pattern", pats[qid].indexOf(resp(last[0])) !== -1,
              JSON.stringify(resp(last[0])) + ' vs ' + JSON.stringify(pats[qid][0]));
          });
        }
        errs.forEach(e => ok(`${u} ${sc}`, 'no page error', false, e));
        console.log(`${u} ${sc.padEnd(5)} ${ans.length} answered`);
      }
    }
  } finally { await browser.close(); server.close(); }

  const layer = fs.readFileSync(path.join(ROOT, 'unit-js', '20-xapi.js'), 'utf8');
  ok('layer', 'no xapiZoneAnswer / xapiFieldsAnswer / xapiMultiAnswer', !/function\s+xapi(?:Zone|Fields|Multi)Answer\b/.test(layer));
  for (const f of ['unit-js/35-questions.js', ...UNITS.map(u => UNIT + '-' + u + '/script.js')]) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    ok(f, 'no retired builder called', !/xapi(?:Zone|Fields|Multi)Answer\(/.test(src));
  }
  console.log('\npassed: ' + passes);
  if (failures.length) { console.log('FAILED: ' + failures.length + '\n'); failures.forEach(f => console.log('  ' + f)); process.exit(1); }
  console.log('all clear');
});
