'use strict';

/* =========================================================
   Config-driven question engines shared by all components.
   A component registers its instances into SCQ_CFG / VIQ_CFG
   (Object.assign or *_CFG_REGISTER) and wires onclick/oninput to
   scqSelect/scqCheck and viqOnInput/viqCheck/viqToggleReveal.
   Two attempts: first wrong → "try again"; second wrong → correct
   answer shown and the question locks.
   ========================================================= */
const SCQ_CFG = {};
function SCQ_CFG_REGISTER(key, cfg) { SCQ_CFG[key] = cfg; }
const VIQ_CFG = {};
function VIQ_CFG_REGISTER(key, cfg) { VIQ_CFG[key] = cfg; }

/* ---------- SingleChoiceQuestion ----------
   cfg: { containerSel, correctId, checkBtnId, feedboxId,
          correctMsg, wrongOnce, wrongFinal: {title, body}, onDone?,
          xapi?: [itemSuffix, qKey] — reported as answered / answered.last } */
const scqState = {};

function scqSelect(key, id) {
  const cfg = SCQ_CFG[key];
  scqState[key] = scqState[key] || { selected: null, attempts: 0, outcome: null };
  const st = scqState[key];
  if (st.outcome !== null) return;
  document.querySelectorAll(cfg.containerSel + ' .scq-opt').forEach(function (el) {
    el.classList.remove('selected', 'correct', 'wrong');
    el.setAttribute('aria-checked', 'false');
  });
  const chosen = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
  if (chosen) { chosen.classList.add('selected'); chosen.setAttribute('aria-checked', 'true'); }
  st.selected = id;
  const btn = document.getElementById(cfg.checkBtnId);
  if (btn) btn.disabled = false;
  const fb = document.getElementById(cfg.feedboxId);
  if (fb) fb.classList.remove('visible');
}

function scqLockOptions(containerSel) {
  document.querySelectorAll(containerSel + ' .scq-opt').forEach(function (el) {
    el.style.pointerEvents = 'none';
    el.tabIndex = -1;
  });
}

function scqCheck(key) {
  const cfg = SCQ_CFG[key];
  const st = scqState[key];
  if (!st || st.outcome !== null) return;
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) { el.hidden = true; });

  const isCorrect = st.selected === cfg.correctId;
  st.attempts++;

  const fb = document.getElementById(cfg.feedboxId);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition(cfg.feedboxId);
  fb.classList.add('visible');

  const chosenEl = document.querySelector(cfg.containerSel + ' [data-id="' + st.selected + '"]');
  const correctEl = document.querySelector(cfg.containerSel + ' [data-id="' + cfg.correctId + '"]');
  reportQ(cfg.xapi, isCorrect, isCorrect || st.attempts >= 2, xapiAnswerText(chosenEl));

  if (isCorrect) {
    if (chosenEl) chosenEl.classList.add('correct');
    scqLockOptions(cfg.containerSel);
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.innerHTML = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    scqFinish(key);
  } else if (st.attempts < 2) {
    if (chosenEl) chosenEl.classList.add('wrong');
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtnId).disabled = true;
  } else {
    if (chosenEl) chosenEl.classList.add('wrong');
    if (correctEl) correctEl.classList.add('correct');
    scqLockOptions(cfg.containerSel);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = fbCorrectShown(cfg.wrongFinal.title);
    bodyEl.innerHTML = cfg.wrongFinal.body;
    st.outcome = 'fail';
    scqFinish(key);
  }
}

function scqFinish(key) {
  const cfg = SCQ_CFG[key];
  document.getElementById(cfg.checkBtnId).disabled = true;
  if (cfg.onDone) cfg.onDone();
}

/* ---------- ValueInputQuestion ----------
   cfg: { inputs: [ids], correct: [numbers], checkBtn, feedbox, revealBtn?,
          nextScreen?, correctMsg, wrongOnce, wrongFinal, onDone? }
   After the final wrong attempt the correct values are shown at once and
   the reveal button toggles between them and the learner's own answer.
   A check button in the bottom bar turns into "המשך" (→ nextScreen).
   xapi?: [itemSuffix, qKey] when all inputs form one question, or one ref per
   input (inputs sharing a ref form one question, e.g. a point's x and y). */
const viqState = {};

function viqOnInput(key) {
  const cfg = VIQ_CFG[key];
  const st = viqState[key];
  if (st && st.outcome !== null) return;
  const allFilled = cfg.inputs.every(function (id) { return document.getElementById(id).value.trim() !== ''; });
  const btn = document.getElementById(cfg.checkBtn);
  if (btn) btn.disabled = !allFilled;
  cfg.inputs.forEach(function (id) {
    document.getElementById(id).classList.remove('correct', 'wrong');
  });
  const fb = document.getElementById(cfg.feedbox);
  if (fb) fb.classList.remove('visible');
}

function viqCheck(key) {
  const cfg = VIQ_CFG[key];
  viqState[key] = viqState[key] || { attempts: 0, outcome: null };
  const st = viqState[key];
  if (st.outcome !== null) { if (cfg.nextScreen != null) goTo(cfg.nextScreen); return; }
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) { el.hidden = true; });

  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const correctFlags = inputs.map(function (input, i) { return Number(input.value) === cfg.correct[i]; });
  const isCorrect = correctFlags.every(Boolean);
  st.attempts++;
  viqReport(cfg, inputs, correctFlags, isCorrect || st.attempts >= 2);

  const fb = document.getElementById(cfg.feedbox);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition(cfg.feedbox);
  fb.classList.add('visible');

  if (isCorrect) {
    inputs.forEach(function (input) {
      input.classList.remove('wrong');
      input.classList.add('correct');
      input.disabled = true;
    });
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.innerHTML = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    viqFinish(key);
  } else if (st.attempts < 2) {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true;
  } else {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
      input.disabled = true;
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = fbCorrectShown(cfg.wrongFinal.title);
    bodyEl.innerHTML = cfg.wrongFinal.body;
    st.snapshot = inputs.map(function (input) { return input.value; });
    st.revealed = false;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
      viqToggleReveal(key);
    }
    st.outcome = 'fail';
    viqFinish(key);
  }
}

/* One answered statement per question of a ValueInput instance (see cfg.xapi above). */
function viqReport(cfg, inputs, correctFlags, isLast) {
  if (!cfg.xapi) return;
  const refs = Array.isArray(cfg.xapi[0]) ? cfg.xapi : inputs.map(function () { return cfg.xapi; });
  const groups = {}, order = [];
  refs.forEach(function (ref, i) {
    const k = ref.join('/');
    if (!groups[k]) { groups[k] = { ref: ref, ok: true, ids: [] }; order.push(k); }
    groups[k].ok = groups[k].ok && correctFlags[i];
    groups[k].ids.push(inputs[i].id);
  });
  order.forEach(function (k) {
    const g = groups[k];
    reportQ(g.ref, g.ok, isLast, xapiFieldsAnswer(g.ids));
  });
}

/* Toggle: correct values ⇄ the learner's own answer (from snapshot).
   The final feedback stays on screen; only field values and the button
   label change. */
function viqToggleReveal(key) {
  const cfg = VIQ_CFG[key];
  const st = viqState[key];
  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!st.revealed) {
    inputs.forEach(function (input, i) {
      input.value = cfg.correct[i];
      input.classList.remove('wrong');
      input.classList.add('correct');
    });
    st.revealed = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    const snapshot = st.snapshot;
    inputs.forEach(function (input, i) {
      input.value = snapshot[i];
      const ok = Number(snapshot[i]) === cfg.correct[i];
      input.classList.toggle('correct', ok);
      input.classList.toggle('wrong', !ok);
    });
    st.revealed = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

function viqFinish(key) {
  const cfg = VIQ_CFG[key];
  const btn = document.getElementById(cfg.checkBtn);
  if (btn.closest('.bottom-bar')) {
    btn.disabled = false;
    btn.textContent = 'המשך';
  } else {
    btn.disabled = true;
  }
  if (cfg.onDone) cfg.onDone();
}

/* ---------- Layout helpers for answer groups ---------- */

/* Equal widths for the true/false buttons inside each .tf-btns group. */
function equalizeTfBtnWidths() {
  document.querySelectorAll('.tf-btns').forEach(function (group) {
    const btns = Array.prototype.slice.call(group.querySelectorAll('.tf-btn'));
    if (!btns.length) return;
    btns.forEach(function (b) { b.style.width = ''; });
    const maxWidth = Math.max.apply(null, btns.map(function (b) { return b.offsetWidth; }));
    btns.forEach(function (b) { b.style.width = maxWidth + 'px'; });
  });
}

/* Equal widths for options in .scq-answers--fit; an inline check/hint
   button right after the group is aligned to the options' left edge. */
function equalizeScqOptWidths() {
  document.querySelectorAll('.scq-answers--fit').forEach(function (group) {
    const opts = Array.prototype.slice.call(group.querySelectorAll('.scq-opt'));
    if (!opts.length) return;
    opts.forEach(function (o) { o.style.width = ''; });
    const maxWidth = Math.max.apply(null, opts.map(function (o) { return o.offsetWidth; }));
    opts.forEach(function (o) { o.style.width = maxWidth + 'px'; });

    const next = group.nextElementSibling;
    if (next && (next.classList.contains('s3-inline-btn') || next.classList.contains('btn-hint-row'))) {
      alignBtnToLeftmost(next, [opts[0]], group.parentElement);
    }
  });
}
