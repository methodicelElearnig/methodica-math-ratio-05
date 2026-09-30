'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 5 */

const TOTAL_SCREENS = 4;
let currentScreen = 0;

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md). מפתח האחסון
   זהה בכוונה לזה של סיינים 1+2 ('math-ratio-01_selectedCharacter', לא
   'math-ratio-01-05_...') — הוא מתויג ברמת ה-**יעד/יחידה**, לא ברמת
   הסיין הבודד, כדי שבחירת-הדמות שנעשתה בסיין קודם תישמר ותחול גם כאן
   (localStorage משותף לכל הסינים של אותו origin). */
const CHARACTER_STORAGE_KEY = 'math-ratio-01_selectedCharacter';
const KNOWN_CHARACTER_IDS = ['character-1', 'character-2'];

/* כל סיין הוא מסמך HTML נפרד לחלוטין — window.lomdaState לא "עובר" בין
   הסינים בטעינת עמוד מלאה, לכן הבחירה נשמרת גם ב-localStorage, ונקראת
   בחזרה כאן. ערך שמור שאינו אחד משני ה-ID-ים הידועים נופל בחזרה ל-null.
   try/catch: בפתיחה מ-file:// חלק מהדפדפנים חוסמים גישה ל-localStorage
   עם SecurityError — בלי ה-try/catch, חריגה כאן הייתה עוצרת את טעינת
   כל script.js. */
let savedCharacter = null;
try {
  savedCharacter = localStorage.getItem(CHARACTER_STORAGE_KEY);
} catch (e) { /* localStorage חסום (opaque origin/פרטיות) — נמשיך בלי שמירה */ }
if (KNOWN_CHARACTER_IDS.indexOf(savedCharacter) === -1) savedCharacter = null;
window.lomdaState = {
  selectedCharacter: savedCharacter
};

const CANVAS_W = 1280, CANVAS_H = 710;

function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  const canvasW = window.innerWidth / scale;
  const canvasH = window.innerHeight / scale;
  app.style.width = canvasW + 'px';
  app.style.height = canvasH + 'px';
  app.style.transform = 'scale(' + scale + ')';
  app.style.left = '0px';
  app.style.top = '0px';
}
window.addEventListener('resize', scaleApp);

function getCanvasSize() {
  const app = document.getElementById('app');
  return {
    w: parseFloat(app.style.width) || CANVAS_W,
    h: parseFloat(app.style.height) || CANVAS_H
  };
}

/* ---------- closeAllPopupsAndHints() — bug-fixed version (מקורה מ-
   סיין 1, לפי סיכום-תהליך-בניית-הלומדה.md) ----------
   - פופ-אפ משוב (id מסתיים ב-"-feedbox", class .scq-fb-box): נסגר
     ע"י classList.remove('visible').
   - הצצת-רמז (id מסתיים ב-"-hint-overlay", class .scq-hint-overlay):
     נסגרת ע"י הגדרת התכונה הילידית hidden=true.
   גנרית מספיק כדי להמשיך לעבוד ברגע שמסכי תוכן אמיתיים (עם feedbox/
   hint-overlay בפועל) יתווספו בהמשך. */
function closeAllPopupsAndHints() {
  document.querySelectorAll('[id$="-feedbox"]').forEach(function (el) {
    el.classList.remove('visible');
  });
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) {
    el.hidden = true;
  });
}

function goTo(n) {
  if (n < 0 || n >= TOTAL_SCREENS) return;
  closeAllPopupsAndHints();
  document.querySelectorAll('.screen').forEach(function (el) {
    el.classList.remove('active');
  });
  const target = document.querySelector('.screen[data-screen="' + n + '"]');
  if (!target) return;
  currentScreen = n;
  resetScreenState(n);
  target.classList.add('active');
}

function resetScreenState(n) {
  if (n === 0) resetScreenState0();
  if (n === 1) resetScreenState1();
  if (n === 2) resetScreenState2();
  if (n === 3) resetScreenState3();
}

/* ---------- Dev postMessage bridge (index_dev.html free nav) ---------- */
window.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'DEV_GOTO') goTo(e.data.screen);
});
window.addEventListener('load', function () {
  if (window.parent === window) return; // not embedded in index_dev.html
  const screenCount = document.querySelectorAll('.screen').length;
  window.parent.postMessage({ type: 'DEV_READY', total: screenCount }, '*');
});

document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === 'ArrowLeft') goTo(currentScreen + 1);
  if (e.ctrlKey && e.key === 'ArrowRight') goTo(currentScreen - 1);
});

/* =========================================================
   GLOBAL — Companion character resolve helpers (ready, not yet
   called — no screen in this scene shows a character bubble/video
   yet). Each future content screen defines its own asset map
   (e.g. S3_AVATAR_ASSETS in סיין 1) and calls one of these by id.
   ========================================================= */
function resolveCharBubbleImg(imgId, assetMap) {
  const el = document.getElementById(imgId);
  if (!el) return;
  const char = window.lomdaState.selectedCharacter;
  const src = (char && assetMap[char]) ? assetMap[char] : '';
  if (el.tagName === 'VIDEO') {
    if (el.getAttribute('src') !== src) {
      if (src) el.setAttribute('src', src); else el.removeAttribute('src');
      el.load();
    }
    el.play().catch(function () {});
  } else {
    el.src = src;
  }
}

function resolveCharBubbleVideo(videoId, assetMap) {
  const el = document.getElementById(videoId);
  if (!el) return;
  const char = window.lomdaState.selectedCharacter;
  const src = (char && assetMap[char]) ? assetMap[char] : '';
  if (el.getAttribute('src') !== src) {
    if (src) el.setAttribute('src', src); else el.removeAttribute('src');
    el.load();
  }
  el.play().catch(function () {});
}

/* GLOBAL — Progress Question (720-templates skill → */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 1 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 3 }
  ]
};

function updateProgressQuestion(container, state) {
  state.questions.forEach((q, i) => {
    const n    = i + 1;
    const item = container.querySelector('[data-question="' + n + '"]');
    if (!item) return;
    const icon  = item.querySelector('.progress-question__icon');
    const label = item.querySelector('.progress-question__label');
    icon.classList.remove(
      'progress-question__icon--current',
      'progress-question__icon--correct',
      'progress-question__icon--incorrect'
    );
    if (q.state !== 'not-answered') icon.classList.add('progress-question__icon--' + q.state);
    label.classList.toggle('progress-question__label--visited', q.visited);
    const navigable = q.visited && q.screen != null && q.screen !== currentScreen;
    item.style.cursor = navigable ? 'pointer' : '';
    item.onclick = navigable ? (() => goTo(q.screen)) : null;
  });
  for (let n = 1; n < state.questions.length; n++) {
    const conn = container.querySelector('[data-connector="' + n + '"]');
    if (!conn) continue;
    const qState = state.questions[n - 1].state;
    conn.classList.toggle('progress-question__connector--visited', qState === 'correct' || qState === 'incorrect');
  }
}
function syncPracticeProgressNav(sectionEl) {
  const nav = sectionEl && sectionEl.querySelector('.progress-question');
  if (nav) updateProgressQuestion(nav, practiceProgress);
}

/* מסמן את שאלה idx (0-based) כ"נוכחית" (אלא אם כבר נפתרה) ומחזיר כל
   שאלה "נוכחית" קודמת ל"טרם נענתה" — מבטיח טבעת-נוכחי יחידה, תמיד על
   המסך שבו הלומד/ת נמצא/ת כרגע. */
function setCurrentQuestion(idx) {
  practiceProgress.questions.forEach(function (q) {
    if (q.state === 'current') q.state = 'not-answered';
  });
  const q = practiceProgress.questions[idx];
  if (q.state !== 'correct' && q.state !== 'incorrect') q.state = 'current';
  q.visited = true;
}

/* =========================================================
   GLOBAL — SingleChoiceQuestion, config-driven (720-templates skill).
   מועתק **כפי-שהוא** (מבנה/לוגיקה) מ-methodica-math-ratio-01-02 —
   רכיב אחד, קונפיג לכל מופע (s1p2/s3p2), לא עותקים כמעט-זהים.
   ========================================================= */
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

function fbCorrectShown(title) {
  let t = String(title).replace(/\s+$/, '').replace(/[:,;]$/, '');
  if (!/[.!?]$/.test(t)) t += '.';
  return t + ' התשובה הנכונה מוצגת.';
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

  if (isCorrect) {
    if (chosenEl) chosenEl.classList.add('correct');
    scqLockOptions(cfg.containerSel);
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.textContent = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    scqFinish(key);
  } else if (st.attempts < 2) {
    if (chosenEl) chosenEl.classList.add('wrong');
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtnId).disabled = true;
  } else {
    if (chosenEl) chosenEl.classList.add('wrong');
    if (correctEl) correctEl.classList.add('correct');
    scqLockOptions(cfg.containerSel);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = fbCorrectShown(cfg.wrongFinal.title);
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

/* SCQ_CFG מוגדר בהמשך הקובץ, ליד קטע ה-HTML/JS של כל מסך (s1p2, s3p2)
   — לא כאן, לפי אותה מוסכמה כמו methodica-math-ratio-01-02. */

/* =========================================================
   GLOBAL — ValueInputQuestion, config-driven (720-templates skill).
   מועתק **כפי-שהוא** (מבנה/לוגיקה) מ-methodica-math-ratio-01-02.
   שני ניסיונות; ניסיון ראשון שגוי = גבול-אדום, נשאר פתוח; ניסיון שני
   שגוי = חושף את הערכים הנכונים ונועל. תומך במערך-קלטים מכל אורך
   (.every()/.map()), לכן שאלה עם 3 קלטים (s1p1/s3p1) עובדת בלי שינוי
   בפונקציה הגנרית עצמה.
   ========================================================= */
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
    titleEl.textContent = cfg.correctMsg.title;
    bodyEl.innerHTML = cfg.correctMsg.body;
    st.outcome = 'success';
    viqFinish(key);
  } else if (st.attempts < 2) {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true;
  } else {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
      input.disabled = true;
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = fbCorrectShown(cfg.wrongFinal.title);
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

/* טוגל: לחיצה ראשונה מציגה את הערכים הנכונים בפועל בשדות, לחיצה שנייה
   משחזרת בדיוק את מה שהלומד/ת הקלידו (מ-snapshot). המשוב המלא
   (wrongFinal) נשאר קבוע על המסך לאורך כל הטוגל — רק ערכי השדות
   וטקסט הכפתור מתחלפים. */
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

/* VIQ_CFG מוגדר בהמשך הקובץ, ליד קטע ה-HTML/JS של כל מסך (s1p1/s2/s3p1)
   — לא כאן, לפי אותה מוסכמה כמו methodica-math-ratio-01-02. */

/* מסך 1 — מסך מעבר, דמות+בועית-דיבור, data-screen"0", id"s0". */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-writing-notebook.mp4',
  'character-2': 'assets/videos/yellow-avatar-writing-noebook.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסך 2 — מסך גלילה, שאלה 1 מתוך 3, data-screen="1", id="s1". שקף
   (משולש שווה-שוקיים ABC). חלק א' (VIQ, 3 קלטים) → חלק ב' (SCQ, 3
   אפשרויות). תמונת המשולש קבועה בצד שמאל לכל אורך שני החלקים.
   ========================================================= */
const VIQ_CFG_S1P1_BODY = 'א. סכום זוויות במשולש הוא <span dir="ltr">180°</span>.<br>המשולש ABC הוא שווה שוקיים. היחס בין זווית הראש לסכום זוויות הבסיס הוא 3 : 1.<br>נוכל למצוא את גודלה של זווית הראש <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span> · 180 = 45°</span><br>לכן <span dir="ltr"> ∢A = 45°</span>.<br>מכיוון ששתי הזוויות הנותרות זהות, נחלק 135 מעלות ב-2 ונמצא שכל אחת מהן בת 67.5 מעלות.';

const VIQ_CFG_S1P1 = {
  inputs: ['s1-a', 's1-b', 's1-c'], correct: [45, 67.5, 67.5], checkBtn: 's1-p1-check', feedbox: 's1-p1-feedbox', revealBtn: 's1-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: VIQ_CFG_S1P1_BODY },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'לא נכון.', body: VIQ_CFG_S1P1_BODY }
};
function s1P1OnInput() { viqOnInput('s1p1'); }
function s1P1Check() { viqCheck('s1p1'); }

const SCQ_CFG_S1P2_BODY = 'ב. נמצא את סכום שתי זוויות הבסיס <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> · 180 = 135°</span><br>מכיוון שהן שוות, גודלה של כל זווית הוא <span dir="ltr">135 ÷ 2 = 67.5°</span>, לכן <span dir="ltr"><span dir="ltr">∢B = 67.5°</span></span>.<br>האדריכל הצעיר אינו צודק.';
const SCQ_CFG_S1P2 = {
  containerSel: '#s1-part-2',
  correctId: 'b',
  checkBtnId: 's1-p2-check',
  feedboxId: 's1-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: SCQ_CFG_S1P2_BODY },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'לא נכון.', body: SCQ_CFG_S1P2_BODY },
  onDone: function () {
    practiceProgress.questions[0].state = scqState.s1p2.outcome === 'success' ? 'correct' : 'incorrect';
    document.getElementById('s1-continue').disabled = false;
    syncPracticeProgressNav(document.getElementById('s1'));
  }
};
function s1P2Select(id) { scqSelect('s1p2', id); }
function s1P2Check() { scqCheck('s1p2'); }

function s1P2HintOpen() { document.getElementById('s1-p2-hint-overlay').hidden = false; }
function s1P2HintClose() { document.getElementById('s1-p2-hint-overlay').hidden = true; }

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7). גרסה
   מתוקנת-מרוץ, מועתקת מילה-במילה מ-methodica-math-ratio-01-02
   (s3HideGestureOnScroll/s3MaybeShowScrollGesture שם): המאזין
   החד-פעמי לא מבחין בין גלילה אמיתית לגלילה פרוגרמטית שנגרמת
   מ-s1ShowPart(2) (קוראת ל-scrollIntoView). s1ProgrammaticScroll
   *לא* מתאפס בתוך המאזין עצמו — רק ה-setTimeout(700ms) ב-s1ShowPart
   מאפס אותו, כי האנימציה של scrollIntoView מפיקה כמה אירועי scroll
   ולא רק אחד. רק אירוע-scroll שקורה *אחרי* שהדגל כבר כבוי מסתיר את
   ה-Gesture Hint בפועל. */
let s1GestureShown = false;
let s1ProgrammaticScroll = false;
function s1HideGestureOnScroll() {
  const scrollArea = document.getElementById('s1-scroll-area');
  const gesture = document.getElementById('s1-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s1ProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s1HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}
function s1MaybeShowScrollGesture() {
  requestAnimationFrame(function () {
  if (s1GestureShown) return;
  const gesture = document.getElementById('s1-scroll-gesture');
  const scrollArea = document.getElementById('s1-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s1GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s1HideGestureOnScroll, { once: true });

  });}

function s1P1AlignCheckBtn() {
  const btn = document.getElementById('s1-p1-check');
  const inputs = document.querySelectorAll('#s1-part-1 .viq-input');
  const part = document.getElementById('s1-part-1');
  if (!btn || !inputs.length || !part) return;
  const scale = currentCanvasScale();
  const leftmost = Math.min.apply(null, Array.prototype.map.call(inputs, function (i) { return i.getBoundingClientRect().left; }));
  const partRect = part.getBoundingClientRect();
  btn.style.marginLeft = Math.max(0, (leftmost - partRect.left) / scale) + 'px';
}

function resetScreenState1() {
  setCurrentQuestion(0);
  syncPracticeProgressNav(document.getElementById('s1'));
  s1MaybeShowScrollGesture();
  requestAnimationFrame(equalizeScqOptWidths);
  requestAnimationFrame(s1P1AlignCheckBtn);
}

/* =========================================================
   מסך 3 — מסך סטטי (לא גלילה — "זה לא מסך גלילה", לפי התסריט
   המפורש), שאלה 2 מתוך 3, data-screen="2", id="s2". דיאגרמת
   ACD/ADB עם שני קלטים הממוקמים כ-overlay אבסולוטי מתחת לדיאגרמה
   (28%/67% מרוחב-הדיאגרמה — נמדד ישירות מהשקף המעובד, ראו CSS/
   ARCHITECTURE.md). אין רמז — לא נמצא טקסט-רמז מפורש בתסריט.
   ========================================================= */
const VIQ_CFG_S2_BODY = 'היחס בין שטח משולש ACD לשטח משולש ABD הוא<br>3 : 1. <br> שטח ABC הוא: <span dir="ltr">ABC = <span dir="rtl">64 סמ"ר</span></span>.<br>נחשב את שטחי המשולשים:<br>שטח ACD הוא <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> · 64 = 48</span><br>ושטח ABD הוא <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span> · 64 = 16</span>.<br>AE שווה 8 ס"מ, והוא גובה במשולש ACD, לכן:<br><span dir="ltr"><span class="frac"><span class="frac-num">8·CD</span><span class="frac-den">2</span></span> = 48</span>, <span dir="ltr">4CD = 48</span>, <span dir="ltr">לכן CD = <span dir="rtl">12 ס"מ</span></span>.<br>לשני המשולשים (ACD ו-ABD) יש אותו גובה.<br>יחס הצלעות הנפגשות עם הגובה יהיה כמו יחס השטחים (3 : 1).<br>לכן – <span dir="ltr">BD = 12 : 3 = 4</span>.';
const VIQ_CFG_S2 = {
  inputs: ['s2-cd', 's2-db'], correct: [12, 4], checkBtn: 's2-continue', feedbox: 's2-feedbox', revealBtn: 's2-reveal-btn', nextScreen: 3,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: VIQ_CFG_S2_BODY },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'לא נכון.', body: VIQ_CFG_S2_BODY },
  onDone: function () {
    practiceProgress.questions[1].state = viqState.s2.outcome === 'success' ? 'correct' : 'incorrect';
    document.getElementById('s2-continue').disabled = false;
    syncPracticeProgressNav(document.getElementById('s2'));
  }
};
function s2OnInput() { viqOnInput('s2'); }
function s2Check() { viqCheck('s2'); }

function resetScreenState2() {
  setCurrentQuestion(1);
  syncPracticeProgressNav(document.getElementById('s2'));
  /* אין Gesture Hint כאן — מסך סטטי (לא גלילה) במפורש. */
}

/* =========================================================
   מסך 4 — מסך גלילה, שאלה 3 מתוך 3, data-screen="3", id="s3". שאלת
   ערבוב-צבעים (יחס 2:3:5). חלק א' (VIQ, 3 קלטים) → חלק ב' (SCQ, 4
   אפשרויות). תמונת פחיות-הצבע קבועה בצד שמאל לכל אורך שני החלקים.
   זהו המסך האחרון בסיין.
   ========================================================= */
const VIQ_CFG_S3P1_BODY = 'א. נסמן ב-x את סך הליטרים של הצבע "ירוק זית" שהתקבל.<br>סכום חלקי היחס הוא: <span dir="ltr">5 + 3 + 2 = 10</span><br>לכן הצבע השחור מהווה <span class="frac"><span class="frac-num">2</span><span class="frac-den">10</span></span> מהתערובת.<br>נסמן ב-x את כמות הליטרים של התערובת ונבנה משוואה: <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">10</span></span> · x = 12</span><br>נחלק ב-<span class="frac"><span class="frac-num">2</span><span class="frac-den">10</span></span> ונקבל: <span dir="ltr">x = 60</span>.<br>לכן, יש 60 ליטרים של צבע ירוק זית.<br>הצבע הצהוב מהווה <span class="frac"><span class="frac-num">5</span><span class="frac-den">10</span></span> מהתערובת. מדובר במחצית מהתערובת לכן יש 30 ליטרים של צבע צהוב בתערובת.<br>מסקנה: יש <span dir="ltr">60 − 12 − 30 = <span dir="rtl">18 ליטרים</span></span><br>של צבע כחול בתערובת.';

const VIQ_CFG_S3P1 = {
  inputs: ['s3-total', 's3-yellow', 's3-blue'], correct: [60, 30, 18], checkBtn: 's3-p1-check', feedbox: 's3-p1-feedbox', revealBtn: 's3-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: VIQ_CFG_S3P1_BODY },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'לא נכון.', body: VIQ_CFG_S3P1_BODY }
};
function s3P1OnInput() { viqOnInput('s3p1'); }
function s3P1Check() { viqCheck('s3p1'); }

function s3P1HintOpen() { document.getElementById('s3-p1-hint-overlay').hidden = false; }
function s3P1HintClose() { document.getElementById('s3-p1-hint-overlay').hidden = true; }

const SCQ_CFG_S3P2_BODY = 'ב. תשובה ב׳ נכונה כי רק חלקו של הצבע השחור גדל.';
const SCQ_CFG_S3P2 = {
  containerSel: '#s3-part-2',
  correctId: 'b',
  checkBtnId: 's3-p2-check',
  feedboxId: 's3-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: SCQ_CFG_S3P2_BODY },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'לא נכון.', body: SCQ_CFG_S3P2_BODY },
  onDone: function () {
    practiceProgress.questions[2].state = scqState.s3p2.outcome === 'success' ? 'correct' : 'incorrect';
    document.getElementById('s3-continue').disabled = false;
    syncPracticeProgressNav(document.getElementById('s3'));
  }
};
function s3P2Select(id) { scqSelect('s3p2', id); }
function s3P2Check() { scqCheck('s3p2'); }

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7). גרסה
   מתוקנת-מרוץ, אותו מנגנון בדיוק כמו s1MaybeShowScrollGesture. */
let s3GestureShown = false;
let s3ProgrammaticScroll = false;
function s3HideGestureOnScroll() {
  const scrollArea = document.getElementById('s3-scroll-area');
  const gesture = document.getElementById('s3-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s3ProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s3HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}
function s3MaybeShowScrollGesture() {
  requestAnimationFrame(function () {
  if (s3GestureShown) return;
  const gesture = document.getElementById('s3-scroll-gesture');
  const scrollArea = document.getElementById('s3-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s3GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s3HideGestureOnScroll, { once: true });

  });}

function currentCanvasScale() {
  const appEl = document.getElementById('app');
  return appEl ? (appEl.getBoundingClientRect().width / getCanvasSize().w) : 1;
}

function s3AlignHintRow() {
  const row = document.querySelector('#s3-part-1 .btn-hint-row');
  const inputs = document.querySelectorAll('#s3-part-1 .viq-input');
  const part = document.getElementById('s3-part-1');
  if (!row || !inputs.length || !part) return;
  const scale = currentCanvasScale();
  const leftmost = Math.min.apply(null, Array.prototype.map.call(inputs, function (i) { return i.getBoundingClientRect().left; }));
  const partRect = part.getBoundingClientRect();
  row.style.marginLeft = Math.max(0, (leftmost - partRect.left) / scale) + 'px';
}

function equalizeScqOptWidths() {
  document.querySelectorAll('.scq-answers--fit').forEach(function (group) {
    const opts = Array.prototype.slice.call(group.querySelectorAll('.scq-opt'));
    if (!opts.length) return;
    opts.forEach(function (o) { o.style.width = ''; });
    const maxWidth = Math.max.apply(null, opts.map(function (o) { return o.offsetWidth; }));
    opts.forEach(function (o) { o.style.width = maxWidth + 'px'; });

    const next = group.nextElementSibling;
    if (next && (next.classList.contains('s3-inline-btn') || next.classList.contains('btn-hint-row'))) {
      const scale = currentCanvasScale();
      const optRect = opts[0].getBoundingClientRect();
      const partRect = group.parentElement.getBoundingClientRect();
      next.style.marginLeft = Math.max(0, (optRect.left - partRect.left) / scale) + 'px';
    }
  });
}

function resetScreenState3() {
  setCurrentQuestion(2);
  syncPracticeProgressNav(document.getElementById('s3'));
  s3MaybeShowScrollGesture();
  requestAnimationFrame(s3AlignHintRow);
}

const SCQ_CFG = {
  s1p2: SCQ_CFG_S1P2,
  s3p2: SCQ_CFG_S3P2
};
const VIQ_CFG = {
  s1p1: VIQ_CFG_S1P1,
  s2: VIQ_CFG_S2,
  s3p1: VIQ_CFG_S3P1
};

/* =========================================================
   GLOBAL — Feedback popup: drag + clamp (_global-components.md).
   CSS ready (.scq-fb-box), JS ready — no instance yet (no question
   screen exists). scqFbMakeDraggable(boxId) no-ops safely if the id
   doesn't exist yet (getElementById guard), so it's safe to keep here
   unused until the first real question screen calls it.
   ========================================================= */
const BOTTOM_BAR_H = 74;

function clampPopupPosition(x, y, popupEl) {
  const w = popupEl.offsetWidth, h = popupEl.offsetHeight;
  const canvas = getCanvasSize();
  const minX = 0, maxX = canvas.w - w;
  const minY = 0, maxY = (canvas.h - BOTTOM_BAR_H) - h; // top edge of the bottom bar
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY)
  };
}

function scqFbResetPosition(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.style.left = '';
  box.style.top = '';
  box.style.bottom = '';
}

function scqFbMakeDraggable(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  box.addEventListener('mousedown', function (e) {
    if (e.target.closest('.scq-fb-reveal-btn')) return;
    const parent = box.offsetParent || box.parentElement;
    const boxRect = box.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    startLeft = boxRect.left - parentRect.left;
    startTop = boxRect.top - parentRect.top;
    box.style.left = startLeft + 'px';
    box.style.top = startTop + 'px';
    box.style.bottom = 'auto';
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    box.classList.add('is-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    const parent = box.offsetParent || box.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const scale = parentRect.width / getCanvasSize().w;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    const clamped = clampPopupPosition(startLeft + dx, startTop + dy, box);
    box.style.left = clamped.x + 'px';
    box.style.top = clamped.y + 'px';
  });

  document.addEventListener('mouseup', function () {
    if (!dragging) return;
    dragging = false;
    box.classList.remove('is-dragging');
  });
}

/* =========================================================
   GLOBAL — Image zoom (_global-components.md: "Image zoom") — רכיב
   גלובלי יחיד, מחוץ לכל .screen, ישירות ב-#app. עובד על כל תמונה
   שהתווית שלה מקבלת כפתור .img-zoom-btn עם data-zoom-src — לא מוגבל
   לפריים ספציפי, כי הכפתור תמיד יושב בתוך ה-wrapper של התמונה.
   ========================================================= */
function imgZoomOpen(trigger) {
  const modal = document.getElementById('img-zoom-modal');
  const stage = modal && modal.querySelector('.img-zoom-modal__stage');
  const frame = trigger.parentElement;
  if (!modal || !stage || !frame) return;
  const clone = frame.cloneNode(true);
  const btnInClone = clone.querySelector('.img-zoom-btn');
  if (btnInClone) btnInClone.remove();
  stage.innerHTML = '';
  stage.appendChild(clone);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function imgZoomClose() {
  const modal = document.getElementById('img-zoom-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  const stage = modal.querySelector('.img-zoom-modal__stage');
  if (stage) stage.innerHTML = '';
}

document.addEventListener('click', function (e) {
  const trigger = e.target.closest('[data-zoom-src]');
  if (trigger) { imgZoomOpen(trigger); return; }
  const closeTarget = e.target.closest('[data-zoom-close="true"]');
  if (!closeTarget) return;
  if (closeTarget.id === 'img-zoom-modal' && e.target.closest('.img-zoom-modal__panel')) return;
  imgZoomClose();
});

document.addEventListener('keydown', function (e) {
  const modal = document.getElementById('img-zoom-modal');
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) imgZoomClose();
});

/* אתחול */
scaleApp();
['s2-feedbox'].forEach(scqFbMakeDraggable);
(function () {
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (new URLSearchParams(location.search).get('screen') === 'last') goTo(TOTAL_SCREENS - 1);
  else if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
})();
