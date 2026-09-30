'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 3
   Shared engine: ../unit-js/ (loaded before this file). */

const TOTAL_SCREENS = 6;

/* MultipleChoiceQuestion registry (SCQ_CFG / VIQ_CFG live in ../unit-js/35-questions.js). */
const MCQ_CFG = {};
function MCQ_CFG_REGISTER(key, cfg) { MCQ_CFG[key] = cfg; }

/* Aligns the check button to the left edge of the rows' last field. */
function alignInlineCheckBtn(containerId, btnId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = container.querySelectorAll('.viq-answer-row');
  alignBtnToLeftmost(document.getElementById(btnId),
    Array.prototype.map.call(rows, function (row) { return row.lastElementChild || row; }), container);
}

/* Two progress groups: A (practiceProgress, 3 questions, screens 1-3) and
   B (practiceProgress2, 2 questions, screen 5). */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 1 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 3 }
  ]
};

const practiceProgress2 = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 5 },
    { number: 2, visited: false, state: 'not-answered', screen: 5 }
  ]
};

/* =========================================================
   GLOBAL — MultipleChoiceQuestion (MCQ), config-driven — רכיב חדש
   (אין מופע קודם בפרויקט הזה). אח קרוב-מבנה של SCQ למעלה: אותו
   workflow (ניסיונות/משוב/נעילה/feedbox), עם הבדל התנהגותי יחיד —
   בחירה היא Set (בחירה מרובה, role="checkbox"/role="group"), לא ID
   יחיד (role="radio"/role="radiogroup"). ראו ARCHITECTURE.md § חוזה
   מלא + 720-templates skill → MultipleChoiceQuestion.md (שהחוזה כאן
   מיישם במדויק).
   - mcqToggle: מוסיף/מסיר **רק** את ה-id שנלחץ מה-Set — לעולם לא
     מנקה בחירות אחרות (בניגוד ל-scqSelect הבלעדי).
   - שער-הפעלה לכפתור הבדיקה: selected.size >= 1 (לא "בדיוק N").
   - נכונות: שוויון-Set מלא (setsEqual) מול cfg.correctIds — לא חלקי.
   - חשיפה בניסיון סופי-שגוי: כל correctIds מסומן .correct (גם אם לא
     נבחר), כל בחירה שגויה מסומנת .wrong — בדיוק כמו ב-SCQ, מוכלל ל-Set.
   ========================================================= */
const mcqState = {};

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function mcqToggle(key, id) {
  const cfg = MCQ_CFG[key];
  mcqState[key] = mcqState[key] || { selected: new Set(), attempts: 0, outcome: null };
  const st = mcqState[key];
  if (st.outcome !== null) return;
  const opt = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
  if (!opt) return;
  opt.classList.remove('correct', 'wrong');
  if (st.selected.has(id)) {
    st.selected.delete(id);
    opt.classList.remove('selected');
    opt.setAttribute('aria-checked', 'false');
  } else {
    st.selected.add(id);
    opt.classList.add('selected');
    opt.setAttribute('aria-checked', 'true');
  }
  const btn = document.getElementById(cfg.checkBtnId);
  if (btn) btn.disabled = st.selected.size < 1;
  const fb = document.getElementById(cfg.feedboxId);
  if (fb) fb.classList.remove('visible');
}

function mcqLockOptions(containerSel) {
  document.querySelectorAll(containerSel + ' .scq-opt').forEach(function (el) {
    el.style.pointerEvents = 'none';
    el.tabIndex = -1;
  });
}

function mcqCheck(key) {
  const cfg = MCQ_CFG[key];
  const st = mcqState[key];
  if (!st || st.outcome !== null) return;
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) { el.hidden = true; });

  const correctSet = new Set(cfg.correctIds);
  const isCorrect = setsEqual(st.selected, correctSet);
  st.attempts++;

  const fb = document.getElementById(cfg.feedboxId);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition(cfg.feedboxId);
  fb.classList.add('visible');

  if (isCorrect) {
    cfg.correctIds.forEach(function (id) {
      const el = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
      if (el) el.classList.add('correct');
    });
    mcqLockOptions(cfg.containerSel);
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.innerHTML = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    mcqFinish(key);
  } else if (st.attempts < 2) {
    st.selected.forEach(function (id) {
      const el = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
      if (el) el.classList.toggle('correct', correctSet.has(id));
      if (el) el.classList.toggle('wrong', !correctSet.has(id));
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtnId).disabled = true;
  } else {
    cfg.correctIds.forEach(function (id) {
      const el = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
      if (el) el.classList.add('correct');
    });
    st.selected.forEach(function (id) {
      if (!correctSet.has(id)) {
        const el = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
        if (el) el.classList.add('wrong');
      }
    });
    mcqLockOptions(cfg.containerSel);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = fbCorrectShown(cfg.wrongFinal.title);
    bodyEl.innerHTML = cfg.wrongFinal.body;
    st.outcome = 'fail';
    mcqFinish(key);
  }
}

function mcqFinish(key) {
  const cfg = MCQ_CFG[key];
  document.getElementById(cfg.checkBtnId).disabled = true;
  if (cfg.onDone) cfg.onDone();
}

/* מסך 1 — מסך מעבר (TransitionScreen), data-screen="0", id="s0". */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-smart.mp4',
  'character-2': 'assets/videos/yellow-avatar-smart.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסך 2 — מסך גלילה, "שאלה 1 מתוך 3" (קבוצת התקדמות A), data-screen="1",
   id="s1". פרחי-שוקולד/יחס, 3 חלקים: (א)+(ב) בדיקה מעורבת (2 שדות
   קלט מספריים + פיל כן/לא אחד, בכפתור-בדיקה יחיד) — לא מתאים לא ל-
   SCQ הגנרי (יש שדות-קלט) ולא ל-VIQ הגנרי (יש גם פיל בחירה), לכן
   S1MIX_CFG/s1Mix* הוא מימוש-ייעודי אחד המשמש את שני החלקים (לא שני
   עותקים כמעט-זהים) — בנוי במבנה זהה ל-viqCheck (attempts/feedback/
   נעילה/חשיפת-הערך-הנכון בניסיון האחרון). (ג) שאלה חד-ברירה רגילה
   (SCQ, s1p3). לצד השאלות — פלייסהולדר-יישומון קבוע בצד שמאל (יישומון
   אינטראקטיבי אמיתי טרם נבנה — החלטת-מוצר מפורשת, לא ניחוש; ראו
   ARCHITECTURE.md § "פלייסהולדר-יישומון").
   ========================================================= */
const S1MIX_CFG = {
  p1: {
    whiteId: 's1-p1-white', darkId: 's1-p1-dark', ynYesId: 's1-p1-yes', ynNoId: 's1-p1-no',
    checkBtn: 's1-p1-check', feedbox: 's1-p1-feedbox', revealBtn: 's1-p1-reveal-btn',
    correct: { white: 5, dark: 45, yn: 'no' },
    correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'בכל שורה נשים פרח שוקולד לבן אחד, ו-9 פרחי שוקולד מריר,\nסה"כ 10 פרחים בשורה. נקבל 5 שורות מכיוון ש: <span dir="">5 = 10 : 50</span>.\nמספר פרחי שוקולד לבן בכל התבנית הוא: 5,\nמספר פרחי שוקולד המריר בכל התבנית הוא: 45.\nמאחר ו- <span dir="">50 = 5 + 45</span>, אז לא נשארו שקעים ריקים.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'בכל שורה נשים פרח שוקולד לבן אחד, ו-9 פרחי שוקולד מריר,\nסה"כ 10 פרחים בשורה. נקבל 5 שורות מכיוון ש: <span dir="">5 = 10 : 50</span>.\nמספר פרחי שוקולד לבן בכל התבנית הוא: 5,\nמספר פרחי שוקולד המריר בכל התבנית הוא: 45.\nמאחר ו- <span dir="">50 = 5 + 45</span>, אז לא נשארו שקעים ריקים.' }
  },
  p2: {
    whiteId: 's1-p2-white', darkId: 's1-p2-dark', ynYesId: 's1-p2-yes', ynNoId: 's1-p2-no',
    checkBtn: 's1-p2-check', feedbox: 's1-p2-feedbox', revealBtn: 's1-p2-reveal-btn',
    correct: { white: 12, dark: 36, yn: 'yes' },
    correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'על כל משבצת לבנה נסמן 3 משבצות חומות. נקבל סך הכל 12 פרחי שוקולד לבן, 36 פרחי שוקולד מריר ו-2 משבצות ריקות. חשבו איך כדאי לכם למלא את התבניות לפי היחס הנתון.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'על כל משבצת לבנה נסמן 3 משבצות חומות. נקבל סך הכל 12 פרחי שוקולד לבן, 36 פרחי שוקולד מריר ו-2 משבצות ריקות. חשבו איך כדאי לכם למלא את התבניות לפי היחס הנתון.' }
  }
};
const s1MixState = {};

function s1MixUpdateGate(key) {
  const cfg = S1MIX_CFG[key];
  const st = s1MixState[key];
  const whiteVal = document.getElementById(cfg.whiteId).value.trim();
  const darkVal = document.getElementById(cfg.darkId).value.trim();
  const allFilled = whiteVal !== '' && darkVal !== '' && st.yn != null;
  document.getElementById(cfg.checkBtn).disabled = !allFilled;
}

function s1MixOnInput(key) {
  const cfg = S1MIX_CFG[key];
  s1MixState[key] = s1MixState[key] || { attempts: 0, outcome: null, yn: null };
  const st = s1MixState[key];
  if (st.outcome !== null) return;
  document.getElementById(cfg.whiteId).classList.remove('correct', 'wrong');
  document.getElementById(cfg.darkId).classList.remove('correct', 'wrong');
  s1MixUpdateGate(key);
  const fb = document.getElementById(cfg.feedbox);
  if (fb) fb.classList.remove('visible');
}

function s1MixSelectYN(key, val) {
  const cfg = S1MIX_CFG[key];
  s1MixState[key] = s1MixState[key] || { attempts: 0, outcome: null, yn: null };
  const st = s1MixState[key];
  if (st.outcome !== null) return;
  st.yn = val;
  const yesEl = document.getElementById(cfg.ynYesId);
  const noEl = document.getElementById(cfg.ynNoId);
  yesEl.classList.remove('correct', 'wrong');
  noEl.classList.remove('correct', 'wrong');
  yesEl.classList.toggle('selected', val === 'yes');
  yesEl.setAttribute('aria-checked', val === 'yes' ? 'true' : 'false');
  noEl.classList.toggle('selected', val === 'no');
  noEl.setAttribute('aria-checked', val === 'no' ? 'true' : 'false');
  s1MixUpdateGate(key);
  const fb = document.getElementById(cfg.feedbox);
  if (fb) fb.classList.remove('visible');
}

function s1MixLock(key) {
  const cfg = S1MIX_CFG[key];
  [cfg.ynYesId, cfg.ynNoId].forEach(function (id) {
    const el = document.getElementById(id);
    el.style.pointerEvents = 'none';
    el.tabIndex = -1;
  });
}

function s1MixCheck(key) {
  const cfg = S1MIX_CFG[key];
  s1MixState[key] = s1MixState[key] || { attempts: 0, outcome: null, yn: null };
  const st = s1MixState[key];
  if (st.outcome !== null) return;

  const whiteInput = document.getElementById(cfg.whiteId);
  const darkInput = document.getElementById(cfg.darkId);
  const whiteOk = Number(whiteInput.value) === cfg.correct.white;
  const darkOk = Number(darkInput.value) === cfg.correct.dark;
  const ynOk = st.yn === cfg.correct.yn;
  const isCorrect = whiteOk && darkOk && ynOk;
  st.attempts++;

  const fb = document.getElementById(cfg.feedbox);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition(cfg.feedbox);
  fb.classList.add('visible');

  const yesEl = document.getElementById(cfg.ynYesId);
  const noEl = document.getElementById(cfg.ynNoId);
  const chosenEl = st.yn === 'yes' ? yesEl : noEl;
  const correctYNEl = cfg.correct.yn === 'yes' ? yesEl : noEl;

  if (isCorrect) {
    whiteInput.classList.add('correct'); whiteInput.disabled = true;
    darkInput.classList.add('correct'); darkInput.disabled = true;
    correctYNEl.classList.add('correct');
    s1MixLock(key);
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.innerHTML = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    s1MixFinish(key);
  } else if (st.attempts < 2) {
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk);
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk);
    chosenEl.classList.toggle('wrong', !ynOk);
    chosenEl.classList.toggle('correct', ynOk);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true;
  } else {
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk); whiteInput.disabled = true;
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk); darkInput.disabled = true;
    if (!ynOk) { chosenEl.classList.add('wrong'); correctYNEl.classList.add('correct'); }
    else { chosenEl.classList.add('correct'); }
    s1MixLock(key);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = fbCorrectShown(cfg.wrongFinal.title);
    bodyEl.innerHTML = cfg.wrongFinal.body;
    st.snapshot = { white: whiteInput.value, dark: darkInput.value };
    st.revealed = false;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
      s1MixToggleReveal(key);
    }
    st.outcome = 'fail';
    s1MixFinish(key);
  }
}

/* טוגל: לחיצה ראשונה מציגה את הערכים הנכונים בפועל (white/dark/yn),
   לחיצה שנייה משחזרת בדיוק את מה שהלומד/ת הקלידו/בחרו (מ-snapshot).
   המשוב המלא (wrongFinal) נשאר קבוע על המסך לאורך כל הטוגל. */
function s1MixToggleReveal(key) {
  const cfg = S1MIX_CFG[key];
  const st = s1MixState[key];
  const whiteInput = document.getElementById(cfg.whiteId);
  const darkInput = document.getElementById(cfg.darkId);
  const yesEl = document.getElementById(cfg.ynYesId);
  const noEl = document.getElementById(cfg.ynNoId);
  const chosenEl = st.yn === 'yes' ? yesEl : noEl;
  const correctYNEl = cfg.correct.yn === 'yes' ? yesEl : noEl;
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!st.revealed) {
    whiteInput.value = cfg.correct.white;
    darkInput.value = cfg.correct.dark;
    whiteInput.classList.remove('wrong'); whiteInput.classList.add('correct');
    darkInput.classList.remove('wrong'); darkInput.classList.add('correct');
    yesEl.classList.remove('correct', 'wrong');
    noEl.classList.remove('correct', 'wrong');
    correctYNEl.classList.add('correct');
    st.revealed = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    const snap = st.snapshot;
    whiteInput.value = snap.white;
    darkInput.value = snap.dark;
    const whiteOk = Number(snap.white) === cfg.correct.white;
    const darkOk = Number(snap.dark) === cfg.correct.dark;
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk);
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk);
    const ynOk = st.yn === cfg.correct.yn;
    yesEl.classList.remove('correct', 'wrong');
    noEl.classList.remove('correct', 'wrong');
    if (!ynOk) { chosenEl.classList.add('wrong'); correctYNEl.classList.add('correct'); }
    else { chosenEl.classList.add('correct'); }
    st.revealed = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

function s1MixFinish(key) {
  const cfg = S1MIX_CFG[key];
  document.getElementById(cfg.checkBtn).disabled = true;
  if (cfg.onDone) cfg.onDone();
}

SCQ_CFG_REGISTER('s1p3', {
  containerSel: '#s1-part-3',
  correctId: 'a',
  checkBtnId: 's1-p3-check',
  feedboxId: 's1-p3-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'רונית צודקת, זו הדרך לחשב את מספר פרחי השוקולד הלבן בהתאם לחלק שלהם מכלל המשבצות.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'רונית צודקת, זו הדרך לחשב את מספר פרחי השוקולד הלבן בהתאם לחלק שלהם מכלל המשבצות.' },
  onDone: function () { s1FinishAggregate(); }
});

function s1FinishAggregate() {
  const anyFail =
    (s1MixState.p1 && s1MixState.p1.outcome === 'fail') ||
    (s1MixState.p2 && s1MixState.p2.outcome === 'fail') ||
    (scqState.s1p3 && scqState.s1p3.outcome === 'fail');
  practiceProgress.questions[0].state = anyFail ? 'incorrect' : 'correct';
  document.getElementById('s1-continue').disabled = false;
  syncPracticeProgressNav(document.getElementById('s1'));
}

function s1WidgetExpandToggle(expand) {
  const wrap = document.getElementById('s1-widget-wrap');
  if (!wrap) return;
  wrap.classList.toggle('is-expanded', expand);
}

const S1_GESTURE = makeScrollGestureHint('s1-scroll-gesture', 's1-scroll-area');

function resetScreenState1() {
  setCurrentQuestion(practiceProgress, 0);
  syncPracticeProgressNav(document.getElementById('s1'));
  S1_GESTURE.maybeShow();
  requestAnimationFrame(function () {
    alignInlineCheckBtn('s1-part-1', 's1-p1-check');
    alignInlineCheckBtn('s1-part-2', 's1-p2-check');
  });
}

/* מסך 3 — מסך סטטי (לא גלילה), "שאלה 2 מתוך 3" (קבוצת התקדמות A), */
const s2TfCorrect = { 1: 'false', 2: 'true', 3: 'true', 4: 'true' };
const s2TfState = { selected: { 1: null, 2: null, 3: null, 4: null }, attempts: 0, outcome: null };

function s2P1Select(row, val) {
  if (s2TfState.outcome !== null) return;
  s2TfState.selected[row] = val;
  document.getElementById('s2-r' + row + '-true').classList.remove('correct', 'wrong');
  document.getElementById('s2-r' + row + '-false').classList.remove('correct', 'wrong');
  document.getElementById('s2-r' + row + '-true').classList.toggle('selected', val === 'true');
  document.getElementById('s2-r' + row + '-false').classList.toggle('selected', val === 'false');
  const allSelected = [1, 2, 3, 4].every(function (r) { return s2TfState.selected[r] !== null; });
  document.getElementById('s2-check').disabled = !allSelected;
  const fb = document.getElementById('s2-feedbox');
  if (fb) fb.classList.remove('visible');
}

function s2P1Lock(row) {
  document.getElementById('s2-r' + row + '-true').disabled = true;
  document.getElementById('s2-r' + row + '-false').disabled = true;
}

function s2P1Check() {
  if (s2TfState.outcome !== null) return;
  s2TfState.attempts++;
  const fb = document.getElementById('s2-feedbox');
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition('s2-feedbox');
  fb.classList.add('visible');

  const allCorrect = [1, 2, 3, 4].every(function (r) { return s2TfState.selected[r] === s2TfCorrect[r]; });
  const explain = 'זוויות α ו-β הן זוויות צמודות ולכן סכומן הוא 180°, היחס בין α ל-β הוא 7 : 2.<br>לכן, גודלה של זווית β הוא <span dir="">140° = 180 · <span class="frac"><span class="frac-num">7</span><span class="frac-den">9</span></span></span>.<br>גודלה של זווית α הוא 40°, מכיוון ש:<br><span dir="ltr">180° − 40° = 140°</span>.';

  if (allCorrect) {
    [1, 2, 3, 4].forEach(function (r) {
      document.getElementById('s2-r' + r + '-' + s2TfCorrect[r]).classList.add('correct');
      s2P1Lock(r);
    });
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.textContent = 'כל הכבוד, צדקתם!';
    bodyEl.innerHTML = explain;
    s2TfState.outcome = 'success';
    s2P1Finish();
  } else if (s2TfState.attempts < 2) {
    [1, 2, 3, 4].forEach(function (r) {
      const correctVal = s2TfCorrect[r];
      document.getElementById('s2-r' + r + '-' + correctVal).classList.toggle('correct', s2TfState.selected[r] === correctVal);
      document.getElementById('s2-r' + r + '-' + (correctVal === 'true' ? 'false' : 'true')).classList.toggle('wrong', s2TfState.selected[r] !== correctVal);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = 'לא בדיוק.';
    bodyEl.textContent = 'בדקו שוב את הטענות ונסו שוב.';
    document.getElementById('s2-check').disabled = true;
  } else {
    [1, 2, 3, 4].forEach(function (r) {
      const correctVal = s2TfCorrect[r];
      document.getElementById('s2-r' + r + '-' + correctVal).classList.add('correct');
      if (s2TfState.selected[r] !== correctVal) {
        document.getElementById('s2-r' + r + '-' + s2TfState.selected[r]).classList.add('wrong');
      }
      s2P1Lock(r);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = 'טעיתם. לא נורא, מטעויות לומדים';
    bodyEl.innerHTML = explain;
    s2TfState.outcome = 'fail';
    s2P1Finish();
  }
}

function s2P1Finish() {
  document.getElementById('s2-check').disabled = true;
  practiceProgress.questions[1].state = s2TfState.outcome === 'success' ? 'correct' : 'incorrect';
  document.getElementById('s2-continue').disabled = false;
  syncPracticeProgressNav(document.getElementById('s2'));
}


const S2_GESTURE = makeScrollGestureHint('s2-scroll-gesture', '.s2-static-wrap');

function resetScreenState2() {
  setCurrentQuestion(practiceProgress, 1);
  syncPracticeProgressNav(document.getElementById('s2'));
  S2_GESTURE.maybeShow();
  requestAnimationFrame(equalizeTfBtnWidths);
}

/* =========================================================
   מסך 4 — מסך גלילה, "שאלה 3 מתוך 3" (קבוצת התקדמות A), data-screen="3",
   id="s3". "כרטיס הזהב" של פורים, 3 חלקים: (א) VIQ זוגי בפורמט-יחס
   "___ : ___" (s3p1, לא (x,y) כמו .viq-coord הרגיל — אותה טכניקת-הטבעה
   בדיוק, מפריד ":" במקום ",", אין תקדים מדויק אחר בפרויקט לפורמט הזה —
   ראו ARCHITECTURE.md); (ב) SCQ רגיל, 4 אפשרויות (s3p2); (ג) **MCQ**
   (בחירה מרובה, 2 מתוך 3, s3p3) — המימוש הראשון בפרויקט של הרכיב
   החדש. תמונה קבועה (purim-gold-tickets.jpeg) מוצגת רק בחלקים א/ב —
   מוסתרת לגמרי בחלק ג לפי בקשה מפורשת בתסריט (מוסתרת מ-JS, לא CSS
   בלבד, ב-onDone של s3p2).
   ========================================================= */
VIQ_CFG_REGISTER('s3p1', {
  inputs: ['s3-p1-a', 's3-p1-b'], correct: [5, 7], checkBtn: 's3-p1-check', feedbox: 's3-p1-feedbox', revealBtn: 's3-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'רועי שילם 5 ש"ח ועינת שילמה 7 ש"ח, לכן יחס ההשקעה הוא 7 : 5.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'רועי שילם 5 ש"ח ועינת שילמה 7 ש"ח, לכן יחס ההשקעה הוא 7 : 5.' },
  onDone: null
});
function s3P1OnInput() { viqOnInput('s3p1'); }
function s3P1Check() { viqCheck('s3p1'); }

SCQ_CFG_REGISTER('s3p2', {
  containerSel: '#s3-part-2',
  correctId: 'a',
  checkBtnId: 's3-p2-check',
  feedboxId: 's3-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'רועי ועינת זכו ב-120 ש"ח ועליהם לחלק את הסכום ביחס של 7 : 5.<br>נחשב כמה רועי יקבל: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">12</span></span> · 120 = 50</span>,<br>וכמה עינת תקבל: <span dir="ltr"><span class="frac"><span class="frac-num">7</span><span class="frac-den">12</span></span> · 120 = 70</span>.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'רועי ועינת זכו ב-120 ש"ח ועליהם לחלק את הסכום ביחס של 7 : 5.<br>נחשב כמה רועי יקבל: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">12</span></span> · 120 = 50</span>,<br>וכמה עינת תקבל: <span dir="ltr"><span class="frac"><span class="frac-num">7</span><span class="frac-den">12</span></span> · 120 = 70 </span>.' },
  onDone: null
});
function s3P2Select(id) { scqSelect('s3p2', id); }
function s3P2Check() { scqCheck('s3p2'); }

MCQ_CFG_REGISTER('s3p3', {
  containerSel: '#s3-part-3',
  correctIds: ['a', 'c'],
  checkBtnId: 's3-p3-check',
  feedboxId: 's3-p3-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'ההצעה לא הוגנת כי עינת שילמה יותר כסף בקנייה, ולכן היא צריכה לקבל נתח גדול יותר מכספי הזכייה — היחס בין הכספים שהם שילמו הוא 7 : 5, והסכומים 60 ו-60 מייצגים יחס שונה של 1 : 1.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'ההצעה לא הוגנת כי עינת שילמה יותר כסף בקנייה, ולכן היא צריכה לקבל נתח גדול יותר מכספי הזכייה — היחס בין הכספים שהם שילמו הוא 7 : 5, והסכומים 60 ו-60 מייצגים יחס שונה של 1 : 1.' },
  onDone: function () { s3FinishAggregate(); }
});

function s3UpdatePhotoVisibilityByScroll() {
  const area = document.getElementById('s3-scroll-area');
  const wrap = document.getElementById('s3-fixed-images');
  const part3 = document.getElementById('s3-part-3');
  if (!area || !wrap || !part3) return;
  const areaRect = area.getBoundingClientRect();
  const midpoint = areaRect.top + areaRect.height / 2;
  const part3Rect = part3.getBoundingClientRect();
  wrap.hidden = part3Rect.top <= midpoint;
}
let s3PhotoScrollWired = false;
function s3WirePhotoScroll() {
  const area = document.getElementById('s3-scroll-area');
  if (!area || s3PhotoScrollWired) return;
  s3PhotoScrollWired = true;
  area.addEventListener('scroll', s3UpdatePhotoVisibilityByScroll);
}

function s3FinishAggregate() {
  const anyFail =
    (viqState.s3p1 && viqState.s3p1.outcome === 'fail') ||
    (scqState.s3p2 && scqState.s3p2.outcome === 'fail') ||
    (mcqState.s3p3 && mcqState.s3p3.outcome === 'fail');
  practiceProgress.questions[2].state = anyFail ? 'incorrect' : 'correct';
  document.getElementById('s3-continue').disabled = false;
  syncPracticeProgressNav(document.getElementById('s3'));
}

const S3_GESTURE = makeScrollGestureHint('s3-scroll-gesture', 's3-scroll-area');

function resetScreenState3() {
  setCurrentQuestion(practiceProgress, 2);
  syncPracticeProgressNav(document.getElementById('s3'));
  S3_GESTURE.maybeShow();
  s3WirePhotoScroll();
  requestAnimationFrame(s3UpdatePhotoVisibilityByScroll);
  requestAnimationFrame(function () { alignInlineCheckBtn('s3-part-1', 's3-p1-check'); });
}

/* מסך 5 — מסך מעבר (TransitionScreen), data-screen="4", id="s4". */
const S4_AVATAR_ASSETS = {
  'character-1': '../unit-assets/video/boy-avatar-work-out.mp4',
  'character-2': '../unit-assets/video/yellow-avatar-work-out.mp4'
};
function resetScreenState4() {
  resolveCharBubbleVideo('s4-avatar', S4_AVATAR_ASSETS);
}

/* מסך 6 — מסך גלילה, קבוצת-התקדמות **נפרדת** משלו (practiceProgress2, */
VIQ_CFG_REGISTER('s5p1', {
  inputs: ['s5-p1-a', 's5-p1-b'], correct: [60, 150], checkBtn: 's5-p1-check', feedbox: 's5-p1-feedbox', revealBtn: 's5-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'היחס בין מספר השעות שעבדה נעמי למספר השעות שעבד יוני הוא 2:5.<br>מספר החלקים הוא <span dir="ltr">2 + 5 = 7</span>.<br>אם נועה ויוני הרוויחו 210 ₪ והם מתכוונים לחלק את הכסף לפי מספר השעות היחסי אז:<br>נועה תקבל <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span> · 210 = 60</span>,<br>ויוני יקבל <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · 210 = 150</span>.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'היחס בין מספר השעות שעבדה נעמי למספר השעות שעבד יוני הוא 2:5.<br>מספר החלקים הוא <span dir="ltr"> 2 + 5 = 7</span>.<br>אם נועה ויוני הרוויחו 210 ₪ והם מתכוונים לחלק את הכסף לפי מספר השעות היחסי אז:<br>נועה תקבל <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span> · 210 = 60</span>,<br>ויוני יקבל <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · 210 = 150</span>.' },
  onDone: null
});
function s5P1OnInput() { viqOnInput('s5p1'); }
function s5P1Check() { viqCheck('s5p1'); }

SCQ_CFG_REGISTER('s5p2', {
  containerSel: '#s5-part-2',
  correctId: 'a',
  checkBtnId: 's5-p2-check',
  feedboxId: 's5-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'נסמן את סכום הכסף שנועה ויוני הרוויחו ב-x.<br>יוני הרוויח: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · x = <span dir="rtl">100 ש"ח</span></span><br>ואם נחלק ב-<span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> נקבל <span dir="ltr">x = 140</span>.<br>מסקנה: נועה ויוני הרוויחו יחד 140 ₪.<br>יוני הרוויח 100 ₪ לכן נועה הרוויחה 40 ₪.<br><br>תשובה א׳ נכונה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'נסמן את סכום הכסף שנועה ויוני הרוויחו ב-x.<br>יוני הרוויח: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · x = <span dir="rtl">100 ש"ח</span></span><br>ואם נחלק ב-<span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> נקבל <span dir="ltr">x = 140</span>.<br>מסקנה: נועה ויוני הרוויחו יחד 140 ₪.<br>יוני הרוויח 100 ₪ לכן נועה הרוויחה 40 ₪.<br><br>תשובה א׳ נכונה.' },
  onDone: function () {
    const anyFail = (viqState.s5p1 && viqState.s5p1.outcome === 'fail') || (scqState.s5p2 && scqState.s5p2.outcome === 'fail');
    practiceProgress2.questions[0].state = anyFail ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress2, 1);
    syncPracticeProgressNav(document.getElementById('s5'), practiceProgress2);
  }
});
function s5P2Select(id) { scqSelect('s5p2', id); }
function s5P2Check() { scqCheck('s5p2'); }

SCQ_CFG_REGISTER('s5p3', {
  containerSel: '#s5-part-3',
  correctId: 'b',
  checkBtnId: 's5-p3-check',
  feedboxId: 's5-p3-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'מיה ועומר לא יוכלו לחלק את הכסף ביניהם ביחס הנתון כך שיקבלו רק שטרות.<br>אם הם זכו ב-90 ש"ח, ויחס הזכייה הוא 2:5, אז מיה אמורה לקבל <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span> · 90 = 25<span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span></span>, כלומר שטר של 20, מטבע של 5 ש"ח, ועוד כמה אגורות, ועומר אמור לקבל <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · 90 = 64<span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span></span>, כלומר שטר של 50, 4 מטבעות של 1 ש"ח ועוד כמה אגורות.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'מיה ועומר לא יוכלו לחלק את הכסף ביניהם ביחס הנתון כך שיקבלו רק שטרות.<br>אם הם זכו ב-90 ש"ח, ויחס הזכייה הוא 2:5, אז מיה אמורה לקבל <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span> · 90 = 25<span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span></span>, כלומר שטר של 20, מטבע של 5 ש"ח, ועוד כמה אגורות, ועומר אמור לקבל <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span> · 90 = 64<span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span></span>, כלומר שטר של 50, 4 מטבעות של 1 ש"ח ועוד כמה אגורות.' },
  onDone: function () {
    practiceProgress2.questions[1].state = (scqState.s5p3 && scqState.s5p3.outcome === 'fail') ? 'incorrect' : 'correct';
    document.getElementById('s5-continue').disabled = false;
    syncPracticeProgressNav(document.getElementById('s5'), practiceProgress2);
  }
});
function s5P3Select(id) { scqSelect('s5p3', id); }
function s5P3Check() { scqCheck('s5p3'); }

function s5SetPhoto(src, alt) {
  const img = document.getElementById('s5-fixed-img');
  if (!img) return;
  if (img.src.indexOf(src) === -1) {
    img.src = src; img.alt = alt;
    const zoomBtn = document.getElementById('s5-fixed-img-zoom-btn');
    if (zoomBtn) { zoomBtn.setAttribute('data-zoom-src', src); zoomBtn.setAttribute('data-zoom-alt', alt); }
  }
}

function s5UpdatePhotoByScroll() {
  const area = document.getElementById('s5-scroll-area');
  if (!area) return;
  const areaRect = area.getBoundingClientRect();
  const midpoint = areaRect.top + areaRect.height / 2;

  const wrap = document.getElementById('s5-fixed-images');
  const part3 = document.getElementById('s5-part-3');
  if (wrap && part3) {
    wrap.hidden = part3.getBoundingClientRect().top <= midpoint;
    if (wrap.hidden) return;
  }

  const parts = [
    { el: document.getElementById('s5-part-2'), src: 'assets/images/girl-washing-car.jpg', alt: 'ילדה שוטפת מכונית' }
  ];
  let active = null;
  parts.forEach(function (p) {
    if (!p.el) return;
    const r = p.el.getBoundingClientRect();
    if (r.top <= midpoint) active = p;
  });
  if (active) s5SetPhoto(active.src, active.alt);
  else s5SetPhoto('assets/images/boy-washing-car.jpg', 'ילד שוטף מכונית');
}
let s5PhotoScrollWired = false;
function s5WirePhotoScroll() {
  const area = document.getElementById('s5-scroll-area');
  if (!area || s5PhotoScrollWired) return;
  s5PhotoScrollWired = true;
  area.addEventListener('scroll', s5UpdatePhotoByScroll);
}

const S5_GESTURE = makeScrollGestureHint('s5-scroll-gesture', 's5-scroll-area');

function resetScreenState5() {
  const q1Done = practiceProgress2.questions[0].state === 'correct' || practiceProgress2.questions[0].state === 'incorrect';
  setCurrentQuestion(practiceProgress2, q1Done ? 1 : 0);
  syncPracticeProgressNav(document.getElementById('s5'), practiceProgress2);
  S5_GESTURE.maybeShow();
  s5WirePhotoScroll();
  requestAnimationFrame(s5UpdatePhotoByScroll);
  requestAnimationFrame(function () { alignInlineCheckBtn('s5-part-1', 's5-p1-check'); });
}

document.addEventListener('click', function (e) {
  const wrap = document.getElementById('s1-widget-wrap');
  if (wrap && wrap.classList.contains('is-expanded') && e.target === wrap) {
    s1WidgetExpandToggle(false);
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const widgetWrap = document.getElementById('s1-widget-wrap');
  if (widgetWrap && widgetWrap.classList.contains('is-expanded')) s1WidgetExpandToggle(false);
});

scqFbMakeDraggable('s2-feedbox');
