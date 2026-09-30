'use strict';
/* ═══════════════════ Resume — this unit's payload, capture and replay ═══════════════════
   40-resume.js (from ratio-01) owns the state document, the ledgers and the write triggers; it
   calls capturePartPayload() on every save and 50-loader.js calls applyExecutionState(payload)
   on launch. This file supplies both for ratio-05.

   Every component is one page holding all of its screens, so the "answered look" of every
   screen lives in the DOM for the whole visit. The payload therefore has two halves:
     vars  the answer state the engines read (attempts, outcomes, selections, progress, scores),
           so the logic continues exactly where it stopped — a second attempt stays a second
           attempt, a locked question stays locked;
     dom   the DIFF of the page against its pristine markup, taken at boot before anything is
           painted: class, hidden, disabled, value, style, aria-checked, tabindex and leaf text of
           every element under #app, plus the feedback title/body HTML. Replaying it rebuilds the
           answered look of every screen without a painter per question type.
   Excluded from the diff: #app itself (scaling), media (re-resolved per character on entry),
   the gesture hints (shown once per page load), iframes and anything inside them.

   Per-part seams (script.js), both optional:
     partCaptureVars()   returns the component's own answer variables (JSON-safe)
     partApplyVars(v)    assigns them back (in place for const objects)
     partAfterRestore()  re-renders DOM a component builds from its variables (e.g. 01's drag board) */

var RESUME_SKIP_ID = /gesture|^app$|^boot-cover$|^report-|^img-zoom|a11y-announcer/;
var _pristineDom = null;

function _resumeNodes() {
  var app = document.getElementById('app');
  if (!app) return [];
  return Array.prototype.filter.call(app.querySelectorAll('*'), function (el) {
    if (el.closest('iframe, video, [id*="gesture"], .report-modal-overlay, #img-zoom-modal')) return false;
    return !(el.id && RESUME_SKIP_ID.test(el.id));
  });
}

/* Stable key: '#id' for elements with an id, else '#nearestAncestorId/i/j/k' (child indexes). */
function _resumeKey(el) {
  if (el.id) return '#' + el.id;
  var path = [];
  var cur = el;
  while (cur && !cur.id && cur.parentElement) {
    path.unshift(Array.prototype.indexOf.call(cur.parentElement.children, cur));
    cur = cur.parentElement;
  }
  return '#' + (cur && cur.id ? cur.id : '') + '/' + path.join('/');
}

function _resumeRead(el) {
  var r = {
    c: el.getAttribute('class') || '',
    h: el.hidden ? 1 : 0,
    s: el.getAttribute('style') || '',
    a: el.getAttribute('aria-checked') || '',
    t: el.getAttribute('tabindex') || ''
  };
  if ('disabled' in el) r.d = el.disabled ? 1 : 0;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') r.v = el.value;
  if (el.matches('.scq-fb-title-text, .scq-fb-body')) r.html = el.innerHTML;
  else if (!el.children.length) r.x = el.textContent;
  return r;
}

/* Called once from 90-boot.js, before the landing screen is painted. */
function snapshotPristineDom() {
  _pristineDom = {};
  _resumeNodes().forEach(function (el) { _pristineDom[_resumeKey(el)] = _resumeRead(el); });
}

function captureDomDiff() {
  var out = {};
  if (!_pristineDom) return out;
  _resumeNodes().forEach(function (el) {
    var k = _resumeKey(el);
    var now = _resumeRead(el), was = _pristineDom[k] || {};
    var d = {};
    Object.keys(now).forEach(function (p) { if (now[p] !== was[p]) d[p] = now[p]; });
    if (Object.keys(d).length) out[k] = d;
  });
  return out;
}

function _resumeFind(k) {
  var slash = k.indexOf('/');
  var id = slash < 0 ? k.slice(1) : k.slice(1, slash);
  var el = id ? document.getElementById(id) : null;
  if (!el || slash < 0) return el;
  var parts = k.slice(slash + 1).split('/');
  for (var i = 0; i < parts.length && el; i++) el = el.children[parseInt(parts[i], 10)] || null;
  return el;
}

function applyDomDiff(diff) {
  Object.keys(diff || {}).forEach(function (k) {
    var el = _resumeFind(k);
    if (!el) return;
    var d = diff[k];
    try {
      if ('c' in d) el.setAttribute('class', d.c);
      if ('h' in d) el.hidden = !!d.h;
      if ('s' in d) { if (d.s) el.setAttribute('style', d.s); else el.removeAttribute('style'); }
      if ('a' in d) { if (d.a) el.setAttribute('aria-checked', d.a); else el.removeAttribute('aria-checked'); }
      if ('t' in d) { if (d.t) el.setAttribute('tabindex', d.t); else el.removeAttribute('tabindex'); }
      if ('d' in d && 'disabled' in el) el.disabled = !!d.d;
      if ('v' in d) el.value = d.v;
      if ('html' in d) el.innerHTML = d.html;
      if ('x' in d && !el.children.length) el.textContent = d.x;
    } catch (e) {}
  });
}

/* ── Answer variables shared by every component ── */
function _json(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
function _assignInto(target, src) {
  if (!target || !src) return;
  Object.keys(target).forEach(function (k) { delete target[k]; });
  Object.keys(src).forEach(function (k) { target[k] = _json(src[k]); });
}

function capturePartPayload() {
  var vars = {
    q: _json(XAPI_Q_RESULTS),
    scq: _json(scqState),
    viq: _json(viqState),
    progress: (typeof practiceProgress !== 'undefined') ? _json(practiceProgress) : null,
    part: (typeof partCaptureVars === 'function') ? _json(partCaptureVars()) : null
  };
  return { currentScreen: currentScreen, vars: vars, dom: captureDomDiff() };
}

function applyResumeVars(st) {
  var v = (st && st.vars) || {};
  _assignInto(XAPI_Q_RESULTS, v.q);
  _assignInto(scqState, v.scq);
  _assignInto(viqState, v.viq);
  if (v.progress && typeof practiceProgress !== 'undefined') {
    practiceProgress.questions.forEach(function (q, i) { if (v.progress.questions[i]) Object.assign(q, v.progress.questions[i]); });
  }
  if (v.part && typeof partApplyVars === 'function') partApplyVars(v.part);
}

function applyResumeDom(st) {
  if (typeof partAfterRestore === 'function') { try { partAfterRestore(); } catch (e) { console.error('[resume] partAfterRestore', e); } }
  applyDomDiff(st && st.dom);
}

/* Replay a saved payload onto this component (50-loader.js, phase B). Nothing is reported while
   it runs: the sender is stubbed and _restoring suppresses the ledger. Afterwards the library is
   told which items already have answers (or it drops their 'completed'), and the landing
   screen's item is opened once. screenOverride (#screen=N) wins in choosing the screen only. */
function applyExecutionState(st, screenOverride) {
  if (!st) return;
  _restoring = true;
  var _origSend = window.sendStatement720;
  window.sendStatement720 = function () {};
  try {
    applyResumeVars(st);
    applyResumeDom(st);
    var n = (typeof screenOverride === 'number' && screenOverride >= 0 && screenOverride < TOTAL_SCREENS)
      ? screenOverride
      : ((typeof st.currentScreen === 'number' && st.currentScreen < TOTAL_SCREENS) ? st.currentScreen : 0);
    goTo(n);
    restoreEndedButton();
  } catch (e) {
    console.error('[resume] apply', e);
  } finally {
    window.sendStatement720 = _origSend;
    _restoring = false;
  }
  try { xapiSeedAnsweredFromResume(); } catch (e) {}
  xapiCurrentItem = null;
  try { xapiOnScreen(currentScreen); } catch (e) {}
}

/* Answer commitment → one synchronous save, after the handler that committed it has finished
   updating state and DOM (a microtask runs before the browser yields to anything else). */
var _flushQueued = false;
function flushAfterCommit() {
  if (_flushQueued) return;
  _flushQueued = true;
  Promise.resolve().then(function () { _flushQueued = false; flushResumeSave(); });
}

/* Typing, selecting and toggling save too (debounced), not only a screen change or a check.
   Bubble phase, so the element's own handler has already updated state and DOM when the payload
   is captured (captureUnitState takes the payload at call time). */
function initResumeEditSaves() {
  var app = document.getElementById('app');
  if (!app) return;
  ['input', 'change', 'click'].forEach(function (ev) {
    app.addEventListener(ev, function (e) {
      if (e.target && e.target.closest && e.target.closest('.report-modal-overlay, #img-zoom-modal')) return;
      scheduleResumeSave();
    });
  });
}
