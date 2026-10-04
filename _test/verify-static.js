/* Static checks, no browser, no dependencies:  node _test/verify-static.js
   1. every file an index.html / iframe app / stylesheet / script references exists, sits under a
      shipped folder, and is lowercase-safe (no case mismatch on a case-sensitive host)
   2. every code reference in every index.html carries the SAME ?v= (bump them together)
   3. per component: XAPI_COMP_ID equals metadata id; SCREEN_TO_SUBCONTENT has exactly
      TOTAL_SCREENS keys (0..N-1), names only catalogued items, and maps every catalogued item;
      XAPI_EVAL_ITEMS are exactly the items that declare questions; every
      ['NNN', 'qN'] ref in script.js exists in the metadata
   4. the library loader line and its XAPI_USING_G regex agree (guide §3.5) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const UNITS = ['01', '02', '03', '04', '05', '06'].map(u => 'methodica-math-ratio-05-' + u);
let failures = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.log('  FAIL ' + msg); } };
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const trim = s => String(s).replace(/\/+$/, '');

/* exact-case existence (Windows is case-insensitive; the CDN is not) */
function existsExact(rel) {
  let dir = ROOT;
  for (const seg of rel.split('/')) {
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(seg)) return false;
    dir = path.join(dir, seg);
  }
  return true;
}
const SHIP = /^(unit-js\/[^/]+\.js|unit-css\/[^/]+\.css|unit-assets\/.+|metadata\/[^/]+\.json|methodica-math-ratio-05-0\d\/(index\.html|script\.js|styles\.css|(assets|geogbra-app|juice-store-app|chocolate-ratio-app)\/.+))$/;

/* Known open item (README "Open items"): reported, not failed, until the asset is supplied. */
const KNOWN_MISSING = ['methodica-math-ratio-05-06/assets/videos/boy-avatar-climbing.mp4'];
function checkRef(fromFile, ref) {
  ref = ref.split(/[?#]/)[0];
  if (!ref || /^(https?:|data:|mailto:|#|javascript:)/.test(ref)) return;
  const rel = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decodeURIComponent(ref)));
  if (KNOWN_MISSING.includes(rel) && !existsExact(rel)) { console.log('  WARN known missing asset: ' + rel); return; }
  ok(existsExact(rel), `${fromFile}: missing (or case-mismatched) ${ref}`);
  ok(SHIP.test(rel), `${fromFile}: ${ref} is not in a shipped folder`);
}

/* 1. references */
const pages = [];
UNITS.forEach(u => {
  pages.push(u + '/index.html');
  ['geogbra-app', 'juice-store-app', 'chocolate-ratio-app'].forEach(a => { if (fs.existsSync(path.join(ROOT, u, a, 'index.html'))) pages.push(`${u}/${a}/index.html`); });
});
pages.forEach(p => {
  const html = read(p).replace(/<!--[\s\S]*?-->/g, '');
  for (const m of html.matchAll(/\b(?:src|href|data-zoom-src)="([^"]+)"/g)) checkRef(p, m[1]);
  for (const m of html.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) checkRef(p, m[1]);
  for (const m of html.matchAll(/['"]((?:\.\.\/)*(?:assets|images|unit-assets)\/[^'"]+\.(?:png|jpe?g|svg|mp4|woff2))['"]/g)) checkRef(p, m[1]);
});
const cssFiles = ['unit-css/common.css', 'unit-css/25-report.css', ...UNITS.map(u => u + '/styles.css')];
cssFiles.forEach(f => {
  const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) checkRef(f, m[1]);
});
UNITS.forEach(u => {
  const js = read(u + '/script.js');
  /* script paths resolve against the page, i.e. the component folder */
  for (const m of js.matchAll(/['"]((?:\.\.\/)*(?:assets|unit-assets)\/[^'"]+\.(?:png|jpe?g|svg|mp4|woff2))['"]/g)) checkRef(u + '/index.html', m[1]);
});

/* 2. one cache-buster */
const vs = new Set();
UNITS.forEach(u => { for (const m of read(u + '/index.html').matchAll(/(?:src|href)="[^"]+\.(?:js|css)\?v=([^"]+)"/g)) vs.add(m[1]); });
ok(vs.size === 1, 'more than one ?v= across the index.html files: ' + [...vs].join(', '));

/* 3. xAPI seams against metadata */
UNITS.forEach(u => {
  const meta = JSON.parse(read('metadata/' + u + '.json'));
  const sandbox = { window: {}, location: { search: '' }, URLSearchParams, console };
  vm.createContext(sandbox);
  vm.runInContext(read('unit-js/10-identity.js'), sandbox);
  const js = read(u + '/script.js');
  const grab = name => { const m = js.match(new RegExp('(?:var|const) ' + name + '\\s*=\\s*([^;]+);')); return m ? vm.runInContext('(' + m[1] + ')', sandbox) : undefined; };
  sandbox.XAPI_COMP_SLUG = grab('XAPI_COMP_SLUG');
  const compId = grab('XAPI_COMP_ID'), total = grab('TOTAL_SCREENS'), map = grab('SCREEN_TO_SUBCONTENT'), evals = grab('XAPI_EVAL_ITEMS') || {};
  ok(compId === meta.id, `${u}: XAPI_COMP_ID ${compId} != metadata ${meta.id}`);
  const keys = Object.keys(map || {}).map(Number).sort((a, b) => a - b);
  ok(keys.length === total && keys.every((k, i) => k === i), `${u}: SCREEN_TO_SUBCONTENT keys ${keys} vs TOTAL_SCREENS ${total}`);
  const itemIds = meta.subContent.map(s => trim(s.id).slice(-3));
  const mapped = new Set(Object.values(map || {}).filter(Boolean).map(v => v[0]));
  mapped.forEach(i => ok(itemIds.includes(i), `${u}: SCREEN_TO_SUBCONTENT names unknown item ${i}`));
  itemIds.forEach(i => ok(mapped.has(i), `${u}: catalogued item ${i} has no screen`));
  const withQ = meta.subContent.filter(s => (s.questions || []).length).map(s => trim(s.id).slice(-3)).sort();
  ok(JSON.stringify(Object.keys(evals).sort()) === JSON.stringify(withQ), `${u}: XAPI_EVAL_ITEMS ${Object.keys(evals)} vs items with questions ${withQ}`);
  const qset = new Set(); meta.subContent.forEach(s => (s.questions || []).forEach(q => qset.add(trim(s.id).slice(-3) + '/' + trim(q.questionId).split('/').pop())));
  for (const m of js.matchAll(/\['(\d{3})',\s*'(q\d+)'\]/g)) ok(qset.has(m[1] + '/' + m[2]), `${u}: script refers to ${m[1]}/${m[2]}, not in metadata`);
  for (const m of js.matchAll(/xapiRequestedHint\('(\d{3})',\s*'(q\d+)'\)/g)) ok(qset.has(m[1] + '/' + m[2]), `${u}: hint refers to ${m[1]}/${m[2]}, not in metadata`);
});

/* 4. loader letter vs regex */
const loader = read('unit-js/50-loader.js');
const letters = [...loader.matchAll(/xapi-720-([a-z])\.js'/g)].map(m => m[1]);
const re = (loader.match(/XAPI_USING_G = \/xapi-720-\[([a-z]+)\]/) || [])[1] || '';
letters.forEach(l => ok(re.includes(l), `50-loader.js loads xapi-720-${l}.js but XAPI_USING_G's regex lacks '${l}'`));
ok(/RESUME_ENABLED = true;/.test(read('unit-js/10-identity.js')) && letters.includes('k'), 'resume on must load -k');

/* 5. F-2 (QA 2026-10-02): a fraction answer keeps its slash. 01 S4 step 2's pills are drawn as
   .frac > .frac-num + .frac-den (the bar is a CSS border), so textContent read "57" for 5/7 — in
   Kata and for a screen reader. Needs jsdom on NODE_PATH; skipped (and said so) without it. */
let JSDOM_ = null; try { JSDOM_ = require('jsdom').JSDOM; } catch (e) {}
if (JSDOM_) {
  const dom = new JSDOM_(read('methodica-math-ratio-05-01/index.html'), { runScripts: 'outside-only' });
  dom.window.eval(read('unit-js/20-xapi.js') + '\nwindow.xapiAnswerText = xapiAnswerText;');   // the file is strict: export explicitly
  const pills = [...dom.window.document.querySelectorAll('#s4-pills-2 .s4-pill')];
  ok(pills.length === 3, 'F-2: 01 S4 step 2 has three fraction pills');
  pills.forEach(p => {
    const t = dom.window.xapiAnswerText(p);
    ok(t === p.dataset.id, `F-2: xapiAnswerText of pill ${p.dataset.id} is "${t}", not "${p.dataset.id}"`);
    ok(p.getAttribute('aria-label') === p.dataset.id, `F-2: pill ${p.dataset.id} has aria-label "${p.getAttribute('aria-label')}" (a screen reader must hear the fraction)`);
  });
} else console.log('  SKIP F-2 checks: jsdom not on NODE_PATH');

console.log(`${checks} checks, ${failures ? failures + ' FAILURE(S)' : 'ALL PASS'}`);
process.exit(failures ? 1 : 0);
