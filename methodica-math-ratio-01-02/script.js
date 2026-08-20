'use strict';

/* =========================================================
   לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 2
   מנוע גלובלי — canvas scaling, ניווט מסכים, סטייט גלובלי.
   TOTAL_SCREENS יעודכן ל-1+ עם הוספת כל מסך תוכן אמיתי (Prompt 2+).

   מקור: הועתק/הותאם מהמנוע הגלובלי של סיין 1 (methodica-math-ratio-01-01)
   של הפרויקט הזה עצמו (לא ישירות מ-methodica-science-mass-measure-03-01)
   — סיין 1 כבר מכיל את הגרסה המתוקנת/מאומתת (closeAllPopupsAndHints,
   מוסכמת-ID, Math theme). ראו ARCHITECTURE.md לפירוט מלא.
   ========================================================= */

const TOTAL_SCREENS = 5;
let currentScreen = 0;

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md). מפתח האחסון
   זהה בכוונה לזה של סיין 1 ('math-ratio-01_selectedCharacter', לא
   'math-ratio-01-02_...') — הוא מתויג ברמת ה-**יעד/יחידה**, לא ברמת
   הסיין הבודד, כדי שבחירת-הדמות שנעשתה בסיין 1 תישמר ותחול גם כאן
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

function scaleApp() {
  const app = document.getElementById('app');
  const CANVAS_W = 1280;
  const CANVAS_H = 710;
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  const left = (window.innerWidth - CANVAS_W * scale) / 2;
  const top = (window.innerHeight - CANVAS_H * scale) / 2;
  app.style.transform = 'scale(' + scale + ')';
  app.style.left = left + 'px';
  app.style.top = top + 'px';
}
window.addEventListener('resize', scaleApp);

/* ---------- closeAllPopupsAndHints() — bug-fixed version (מהותה מ-
   סיין 1, לפי סיכום-תהליך-בניית-הלומדה.md §0.3) ----------
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
  /* כל מסך תוכן אמיתי שנוסף מקבל כאן שורת if (n === X) resetScreenStateX();
     משלו, ומגדיר את הפונקציה resetScreenStateX() ליד קטע ה-HTML/JS של
     המסך — לפי אותה מוסכמה בדיוק כמו סיין 1. */
  if (n === 0) resetScreenState0();
  if (n === 1) resetScreenState1();
  if (n === 2) resetScreenState2();
  if (n === 3) resetScreenState3();
  if (n === 4) resetScreenState4();
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

/* =========================================================
   GLOBAL — Progress Question (720-templates skill →
   _global-components.md → "Progress Question"). קוד הרינדור/הסנכרון
   הועתק **כפי-שהוא** מהחוזה בסקיל (לא הומצא) — משותף למסכים 1-4
   (data-screen 1..4), שכל אחד מהם הוא "שאלה" אחת מתוך 4 בסדרה. state
   אחד משותף (לא אחד-לכל-מסך), לפי הדרישה המפורשת של הסקיל.
   ========================================================= */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 1 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 3 },
    { number: 4, visited: false, state: 'not-answered', screen: 4 }
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
   רכיב אחד, קונפיג לכל מופע (s3p2/s4p1/s4p2) — לא שלושה עותקים
   כמעט-זהים, לפי "one generic renderer... do not write a per-count
   variant" (אותו עיקרון כמו Progress Question).
   ========================================================= */
const scqState = {};

function scqSelect(key, id) {
  const cfg = SCQ_CFG[key];
  scqState[key] = scqState[key] || { selected: null, attempts: 0, outcome: null };
  const st = scqState[key];
  if (st.outcome !== null) return;
  document.querySelectorAll(cfg.containerSel + ' .scq-opt').forEach(function (el) {
    el.classList.remove('selected');
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
    bodyEl.textContent = cfg.correctMsg.body;
    st.outcome = 'success';
    scqFinish(key);
  } else if (st.attempts < 2) {
    if (chosenEl) chosenEl.classList.add('wrong');
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.textContent = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtnId).disabled = true;
  } else {
    if (chosenEl) chosenEl.classList.add('wrong');
    if (correctEl) correctEl.classList.add('correct');
    scqLockOptions(cfg.containerSel);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
    st.outcome = 'fail';
    scqFinish(key);
  }
}

function scqFinish(key) {
  const cfg = SCQ_CFG[key];
  document.getElementById(cfg.checkBtnId).disabled = true;
  if (cfg.onDone) cfg.onDone();
}

const SCQ_CFG = {
  s3p2: {
    containerSel: '#s3-part-2',
    correctId: 'b',
    checkBtnId: 's3-p2-check',
    feedboxId: 's3-p2-feedbox',
    correctMsg: { title: 'נכון!', body: 'שתי הזוויות האחרות הן 45° ו-75° — 120° הנותרים (180°−60°) מתחלקים ביחס 5:3.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'התשובה הנכונה: 45°,75° — 120° הנותרים (180°−60°) מתחלקים ביחס 5:3.' }
  },
  s4p1: {
    containerSel: '#s4-part-1',
    correctId: 'b',
    checkBtnId: 's4-p1-check',
    feedboxId: 's4-p1-feedbox',
    correctMsg: { title: 'נכון מאוד!', body: 'נופר השתתפה ביותר משחים - לשניהם אותו מספר ניצחונות, אך נופר נדרשה ל-8 משחים על כל 3 ניצחונות (לעומת 5 בלבד אצל דניאל), ולכן עשתה יותר מישחים בסך הכל.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם, בואו נסביר:', body: 'נופר השתתפה ביותר משחים - לשניהם אותו מספר ניצחונות, אך נופר נדרשה ל-8 משחים על כל 3 ניצחונות (לעומת 5 בלבד אצל דניאל), ולכן עשתה יותר מישחים בסך הכל.' }
  },
  s4p2: {
    containerSel: '#s4-part-2',
    correctId: 'a',
    checkBtnId: 's4-p2-check',
    feedboxId: 's4-p2-feedbox',
    correctMsg: { title: 'נכון מאוד!', body: 'דניאל ניצח ביותר מישחים – דניאל מנצח ב-3 מתוך 5 מישחים (יותר ממחצית מסך המישחים שלו), לעומת נופר שמנצחת ב-3 מתוך 8 (פחות מחצי).' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם, בואו נסביר:', body: 'דניאל ניצח ביותר מישחים – דניאל מנצח ב-3 מתוך 5 מישחים (יותר ממחצית מסך המישחים שלו), לעומת נופר שמנצחת ב-3 מתוך 8 (פחות מחצי).' }
  }
};

function s3P2Select(id) { scqSelect('s3p2', id); }
function s3P2Check() { scqCheck('s3p2'); }
function s4P1Select(id) { scqSelect('s4p1', id); }
function s4P1Check() { scqCheck('s4p1'); }
function s4P2Select(id) { scqSelect('s4p2', id); }
function s4P2Check() { scqCheck('s4p2'); }

/* =========================================================
   GLOBAL — ValueInputQuestion, config-driven (720-templates skill).
   שני ניסיונות; ניסיון ראשון שגוי = גבול-אדום, נשאר פתוח; ניסיון שני
   שגוי = חושף את הערכים הנכונים ונועל (אין reveal-button נפרד, לפי
   המוסכמה הקיימת כבר בסיין 1). לחיצה חוזרת על הכפתור אחרי סיום
   (המשך) מנווטת ל-nextScreen, אם הוגדר.
   ========================================================= */
const viqState = {};

/* ⚠️ נבנה מחדש (18.08.2026) לפי SELF-QA-lomda.md §1 בפועל: (1) התג
   (רקע-ירוק/אדום + אייקון אמיתי) יושב ישירות על ה-<input> עצמו
   (classList על האלמנט, לא על "wrap"/"badge" נפרד — תוקן), (2) כל
   קלט מסומן correct/wrong **בנפרד**, לפי הערך שלו-עצמו, לא כל-או-
   כלום ברמת השאלה כולה, (3) התג מופיע **גם בניסיון הראשון השגוי**,
   לא רק בסופי (§1 checklist: "the icon must appear on the first
   wrong attempt too, not only the final one"). */
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
    bodyEl.textContent = cfg.correctMsg.body;
    st.outcome = 'success';
    viqFinish(key);
  } else if (st.attempts < 2) {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.textContent = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true;
  } else {
    inputs.forEach(function (input, i) {
      if (!correctFlags[i]) input.value = cfg.correct[i];
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
      input.disabled = true;
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
    st.outcome = 'fail';
    viqFinish(key);
  }
}

function viqFinish(key) {
  const cfg = VIQ_CFG[key];
  const btn = document.getElementById(cfg.checkBtn);
  btn.disabled = false;
  btn.textContent = 'המשך';
  if (cfg.onDone) cfg.onDone();
}

const VIQ_CFG = {
  s1: {
    inputs: ['s1-a', 's1-b'], correct: [21, 9], checkBtn: 's1-check', feedbox: 's1-feedbox', nextScreen: 2,
    correctMsg: { title: 'נכון!', body: 'על כל 3 עורכי וידאו יש 7 שחקנים, כלומר כל קבוצה בת 10 תלמידים (3+7). מתוך 30 תלמידים יש 3 קבוצות כאלה: 7⋅3=21 שחקנים ו-3⋅3=9 עורכי וידאו.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'על כל 3 עורכי וידאו יש 7 שחקנים, כלומר כל קבוצה בת 10 תלמידים (3+7). מתוך 30 תלמידים יש 3 קבוצות כאלה: 7⋅3=21 שחקנים ו-3⋅3=9 עורכי וידאו.' },
    onDone: function () {
      practiceProgress.questions[0].state = viqState.s1.outcome === 'success' ? 'correct' : 'incorrect';
      syncPracticeProgressNav(document.getElementById('s1'));
    }
  },
  s2: {
    inputs: ['s2-a-x', 's2-a-y', 's2-b-x', 's2-b-y'], correct: [5, 25, 25, 25], checkBtn: 's2-check', feedbox: 's2-feedbox', nextScreen: 3,
    correctMsg: { title: 'נכון!', body: 'ביחס ההתחלתי 5:1 מתוך 30 משתתפים: 5 חלקים בנים, חלק אחד בנות — A(5,25). בחצי השני היחס 1:1 מתוך אותם 30: B(25,25).' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'ביחס ההתחלתי 5:1 מתוך 30 משתתפים: 5 חלקים בנים, חלק אחד בנות — A(5,25). בחצי השני היחס 1:1 מתוך אותם 30: B(25,25).' },
    onDone: function () {
      practiceProgress.questions[1].state = viqState.s2.outcome === 'success' ? 'correct' : 'incorrect';
      syncPracticeProgressNav(document.getElementById('s2'));
    }
  },
  s4p3: {
    inputs: ['s4-p3-a', 's4-p3-b'], correct: [20, 32], checkBtn: 's4-p3-check', feedbox: 's4-p3-feedbox', nextScreen: null,
    correctMsg: { title: 'נכון!', body: 'דניאל: 3/5 ⋅ x = 12 ⟹ x = 20 משחקים. נופר: 3/8 ⋅ y = 12 ⟹ y = 32 משחקים.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'דניאל: 3/5 ⋅ x = 12 ⟹ x = 20 משחקים. נופר: 3/8 ⋅ y = 12 ⟹ y = 32 משחקים.' },
    onDone: function () { s4UpdateAggregate(); }
  }
};

function s1OnInput() { viqOnInput('s1'); }
function s1Check() { viqCheck('s1'); }
function s2OnInput() { viqOnInput('s2'); }
function s2Check() { viqCheck('s2'); }
function s4P3OnInput() { viqOnInput('s4p3'); }
function s4P3Check() { viqCheck('s4p3'); }

/* =========================================================
   מסך 1 — מסך מעבר, data-screen="0", id="s0". שקף 28. דמות-נלווית
   לפי הדמות שנבחרה בסיין 1 — אין וידאו "מוכן להתחיל" ייעודי בנכסים,
   נבחרו הפוזות הכי-קרובות מבחינה תוכנית שכבר קיימות בתיקייה (חשיבה/
   שאילה) — שיוך זה טרם אושר מול המפיקה, ראו ARCHITECTURE.md § "מסך 1".
   ========================================================= */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-thinking.mp4',
  'character-2': 'assets/videos/yellow-avatr-asking.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסכים 2/3 — ValueInputQuestion + פלייסהולדר-תמונה, data-screen 1/2,
   id s1/s2. שאלה 1/2 מתוך 4.
   ========================================================= */
function resetScreenState1() {
  setCurrentQuestion(0);
  syncPracticeProgressNav(document.getElementById('s1'));
}
function resetScreenState2() {
  setCurrentQuestion(1);
  syncPracticeProgressNav(document.getElementById('s2'));
}

/* =========================================================
   מסך 4 — מסך גלילה, שאלה 3 מתוך 4, data-screen="3", id="s3". שקפים
   31-33: חלק 1 מידע בלבד, חלק 2 שאלה חד-ברירה, חלק 3 נכון/לא נכון
   (3 טענות). ה"שאלה" הכוללת (question 3 בסרגל ההתקדמות) נפתרת רק
   בסיום חלק 3 — 'incorrect' אם חלק 2 או חלק 3 דרשו גילוי-תשובה, אחרת
   'correct'.
   ========================================================= */
/* ⚠️ הוסרה s3ShowPart (20.08.2026, לפי בקשה מפורשת: "לא צריך שהתוכן
   יופיע בהדרגתיות") — כל שלושת חלקי-המסך גלויים תמיד מההתחלה
   (index.html, hidden הוסר), הלומד/ת פשוט גולל/ת. s3MaybeShowScrollGesture
   עדיין נקראת ישירות מ-resetScreenState3 בכניסה למסך. */

const s3TfCorrect = { 1: 'true', 2: 'true', 3: 'false' };
const s3TfState = { selected: { 1: null, 2: null, 3: null }, attempts: 0, outcome: null };

function s3P3Select(row, val) {
  if (s3TfState.outcome !== null) return;
  s3TfState.selected[row] = val;
  document.getElementById('s3-p3-r' + row + '-true').classList.toggle('selected', val === 'true');
  document.getElementById('s3-p3-r' + row + '-false').classList.toggle('selected', val === 'false');
  const allSelected = [1, 2, 3].every(function (r) { return s3TfState.selected[r] !== null; });
  document.getElementById('s3-p3-check').disabled = !allSelected;
  const fb = document.getElementById('s3-p3-feedbox');
  if (fb) fb.classList.remove('visible');
}

function s3P3Lock(row) {
  document.getElementById('s3-p3-r' + row + '-true').disabled = true;
  document.getElementById('s3-p3-r' + row + '-false').disabled = true;
}

function s3P3Check() {
  if (s3TfState.outcome !== null) return;
  s3TfState.attempts++;
  const fb = document.getElementById('s3-p3-feedbox');
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  scqFbResetPosition('s3-p3-feedbox');
  fb.classList.add('visible');

  const allCorrect = [1, 2, 3].every(function (r) { return s3TfState.selected[r] === s3TfCorrect[r]; });
  const explain = 'שלוש הטענות נבדקות מול חלוקת 120° (180°−60°) ביחס 3:5 — כל שינוי בזווית ∢BAC משנה את 180°−∢BAC בהתאם, אבל היחס בין שתי הזוויות האחרות (3:5) נשאר קבוע.';

  if (allCorrect) {
    [1, 2, 3].forEach(function (r) {
      document.getElementById('s3-p3-r' + r + '-' + s3TfCorrect[r]).classList.add('correct');
      s3P3Lock(r);
    });
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.textContent = 'נכון!';
    bodyEl.textContent = explain;
    s3TfState.outcome = 'success';
    s3P3Finish();
  } else if (s3TfState.attempts < 2) {
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = 'לא בדיוק.';
    bodyEl.textContent = 'בדקו שוב את שלוש הטענות ונסו שוב.';
    document.getElementById('s3-p3-check').disabled = true;
  } else {
    [1, 2, 3].forEach(function (r) {
      const correctVal = s3TfCorrect[r];
      document.getElementById('s3-p3-r' + r + '-' + correctVal).classList.add('correct');
      if (s3TfState.selected[r] !== correctVal) {
        document.getElementById('s3-p3-r' + r + '-' + s3TfState.selected[r]).classList.add('wrong');
      }
      s3P3Lock(r);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = 'לא נכון.';
    bodyEl.textContent = explain;
    s3TfState.outcome = 'fail';
    s3P3Finish();
  }
}

function s3P3Finish() {
  document.getElementById('s3-p3-check').disabled = true;
  const anyFail = (scqState.s3p2 && scqState.s3p2.outcome === 'fail') || s3TfState.outcome === 'fail';
  practiceProgress.questions[2].state = anyFail ? 'incorrect' : 'correct';
  document.getElementById('s3-continue').disabled = false;
  syncPracticeProgressNav(document.getElementById('s3'));
}

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7). מוצג פעם אחת
   בכל כניסה למסך (s3GestureShown הוא flag ברמת-מודול, לא resume-state
   מתמשך). נעלם ברגע גלילה אמיתית (אירוע `scroll` הנייטיבי — מכסה גם
   עכבר/מגע/גרירת-פס-גלילה, לא רק wheel/keydown). זהה במנגנון לסיין 1
   (s1MaybeShowScrollGesture/s2MaybeShowScrollGesture).

   ⚠️ תוקן (18.08.2026, audit; תוקן שוב 18.08.2026 אחרי QA-verification
   שני — ראו למטה) — שורש-הבאג: המאזין החד-פעמי
   ({once:true}) לא הבחין בין גלילה אמיתית של הלומד/ת לבין גלילה
   פרוגרמטית שנגרמת מ-s3ShowPart(n) (שקוראת ל-scrollIntoView בעת חשיפת
   חלק 2/3) — הדפדפן מפעיל אירוע `scroll` נייטיבי גם על גלילה יזומה
   בקוד. אם הלומד/ת עדיין לא גללו בעצמם כשחלק 2/3 נחשף, ה-scrollIntoView
   "צרך" את המאזין החד-פעמי בטעות, וה-Gesture Hint נעלם בלי שהלומד/ת
   באמת גללו. תוקן ע"י s3ProgrammaticScroll (מוגדר ב-s3ShowPart למעלה):
   אירוע-scroll שקורה כשה-flag דלוק נחשב "לא אמיתי" — מצרף מאזין
   חד-פעמי טרי במקום להסתיר; רק אירוע-scroll כשה-flag כבוי מסתיר
   בפועל את ה-Gesture Hint.

   ⚠️ תוקן שוב (18.08.2026, QA-verification שני) — הגרסה הראשונה איפסה
   את ה-flag בתוך המאזין עצמו, על האירוע-scroll הראשון שקרה בזמן
   שה-flag דלוק. אבל scrollIntoView({behavior:'smooth'}) מפיק כמה
   אירועי scroll במהלך האנימציה שלו (התנהגות דפדפן סטנדרטית), לא רק
   אחד — כך שהאירוע השני (וכל הבאים) של אותה אנימציה יזומה עדיין
   הגיעו אחרי שה-flag כבר התאפס, ונפלו דרך להסתרה. עכשיו ה-flag
   *לא* מתאפס בתוך המאזין בכלל — רק ה-setTimeout(700ms) ב-s3ShowPart
   מאפס אותו. כך כל אירועי ה-scroll שקורים תוך כדי האנימציה (בד"כ
   מתחת ל-500ms) מוגנים, ורק גלילה אמיתית שקורית *אחרי* שה-700ms חלפו
   מסתירה את ה-Gesture Hint בפועל. */
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
/* QA 19.08.2026: לא מוצג עוד ללא-תנאי בכניסה למסך — רק אם יש בפועל
   מה לגלול (scrollHeight>clientHeight) באותו רגע. נקראת שוב מתוך
   s3ShowPart בכל חשיפת-חלק חדש. */
function s3MaybeShowScrollGesture() {
  if (s3GestureShown) return;
  const gesture = document.getElementById('s3-scroll-gesture');
  const scrollArea = document.getElementById('s3-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s3GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s3HideGestureOnScroll, { once: true });
}

function resetScreenState3() {
  setCurrentQuestion(2);
  syncPracticeProgressNav(document.getElementById('s3'));
  s3MaybeShowScrollGesture();
}

/* =========================================================
   מסך 5 — מסך גלילה, שאלה 4 מתוך 4, data-screen="4", id="s4". שקפים
   34-36: חלק 1+2 שאלה חד-ברירה בלי תמונה, חלק 3 שאלת-קלט כפולה.
   ========================================================= */
/* ⚠️ הוסרה s4ShowPart (20.08.2026, לפי בקשה מפורשת) — אותה סיבה
   בדיוק כמו s3ShowPart למעלה: שלושת החלקים גלויים תמיד. */

function s4UpdateAggregate() {
  if (viqState.s4p3 && viqState.s4p3.outcome !== null) {
    const anyFail = (scqState.s4p1 && scqState.s4p1.outcome === 'fail') ||
                    (scqState.s4p2 && scqState.s4p2.outcome === 'fail') ||
                    viqState.s4p3.outcome === 'fail';
    practiceProgress.questions[3].state = anyFail ? 'incorrect' : 'correct';
    document.getElementById('s4-continue').disabled = false;
  }
  syncPracticeProgressNav(document.getElementById('s4'));
}

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7) — אותו מנגנון
   בדיוק כמו s3MaybeShowScrollGesture, כולל אותו תיקון (18.08.2026) של
   s4ProgrammaticScroll/s4HideGestureOnScroll — ראו ההערה המלאה ליד
   s3MaybeShowScrollGesture למעלה, זהה מילה-במילה כאן. */
let s4GestureShown = false;
let s4ProgrammaticScroll = false;
function s4HideGestureOnScroll() {
  const scrollArea = document.getElementById('s4-scroll-area');
  const gesture = document.getElementById('s4-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s4ProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s4HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}
/* QA 19.08.2026: אותו תיקון בדיוק כמו s3MaybeShowScrollGesture. */
function s4MaybeShowScrollGesture() {
  if (s4GestureShown) return;
  const gesture = document.getElementById('s4-scroll-gesture');
  const scrollArea = document.getElementById('s4-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s4GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s4HideGestureOnScroll, { once: true });
}

function resetScreenState4() {
  setCurrentQuestion(3);
  syncPracticeProgressNav(document.getElementById('s4'));
  s4MaybeShowScrollGesture();
}

/* =========================================================
   GLOBAL — Feedback popup drag/reset helpers (ready, not yet
   instantiated — no question screen exists yet in this scene).
   לפי _global-components.md → "Feedback popup system" → "Drag bounds":
   הפופ-אפ יכול לזוז בכל הקנבס חוץ מהפס התחתון (74px) ומעבר לגבולות
   הקנבס (1280×710).
   ========================================================= */
const CANVAS_W = 1280, CANVAS_H = 710, BOTTOM_BAR_H = 74;

function clampPopupPosition(x, y, popupEl) {
  const w = popupEl.offsetWidth, h = popupEl.offsetHeight;
  const minX = 0, maxX = CANVAS_W - w;
  const minY = 0, maxY = (CANVAS_H - BOTTOM_BAR_H) - h; // top edge of the bottom bar
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
    // pointer delta lives in raw viewport px — convert to canvas-space
    // (divide by the current scaleApp() zoom factor) before clamping.
    const scale = parentRect.width / CANVAS_W;
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
/* ⚠️ תוקן שוב (20.08.2026, לפי בקשה מפורשת: "מסך 2/3 סיין 2 הם לא
   מסכי-גלילה") — התיעוד הקודם (19.08.2026) טעה: הניח ששני המסכים
   האלה הם מסכי-גלילה לפי שם המחלקה (.scq-scroll-outer) בלבד, בלי
   לבדוק שהיא כלל מוגדרת ב-CSS (לא הייתה — לא הפעילה שום גלילה
   בפועל). s1/s2 הוחזרו לפופאפ-צף/גריר; רק s3-p2/s3-p3/s4-p1/s4-p2/
   s4-p3 (בתוך .s3-scroll-area/.s4-scroll-area האמיתיים) נשארים
   .is-static. */
['s1-feedbox', 's2-feedbox'].forEach(scqFbMakeDraggable);
(function () {
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
})();
