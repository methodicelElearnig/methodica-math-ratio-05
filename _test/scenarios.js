/* Shared by _test/flow.js and _test/resume.js: in-page helpers + one scripted walk per component.
   window.__TIMES (default 2) = how many wrong attempts each question gets when right=false. */
/* In-page helpers. right=true answers correctly; right=false answers wrongly (called twice). */
const HELPERS = `
window.__T = {
  val(id, v) { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); },
  /* every answer is given once when right, twice in a row when wrong (both attempts) */
  times(right, fn) { const n = right ? 1 : (window.__TIMES || 2); for (let k = 0; k < n; k++) fn(); },
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

module.exports = { HELPERS, SCENARIOS };
