'use strict';

/* =========================================================
   לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 3
   6 מסכי תוכן אמיתי (Prompt 2). מקור: תשתית שהותאמה מסיין 2
   (methodica-math-ratio-01-02) — כרגע מקור-האמת המתודולוגי המאומת/
   מתוקן ביותר בפרויקט. כל הרכיבים הגנריים (Progress Question, SCQ,
   VIQ) הועתקו כפי-שהם מסיין 2; MultipleChoiceQuestion (MCQ) הוא רכיב
   חדש שנבנה כאן לראשונה (אין מופע קודם בפרויקט) — ראו ARCHITECTURE.md
   § "MultipleChoiceQuestion (MCQ) — רכיב חדש" לחוזה המלא.
   ========================================================= */

const TOTAL_SCREENS = 6;
let currentScreen = 0;

/* ⚠️ נוסף (30.08.2026) — ניווט בין-סיינים: כפתור "חזרה" מהמסך הראשון
   כאן מוביל לסיין הקודם (methodica-math-ratio-01-02) בלי פרמטר, ופותח
   שם כרגיל במסך הראשון-שלו. כפתור "חזרה" מהסיין הבא
   (methodica-math-ratio-01-04) מוביל הנה עם ?screen=last — נפתח ישר
   במסך האחרון כאן במקום. script.js נטען בסוף ה-body (אחרי כל ה-.screen
   sections), אז אפשר לקרוא ל-goTo באופן סינכררוני כאן. */
if (new URLSearchParams(location.search).get('screen') === 'last') {
  goTo(TOTAL_SCREENS - 1);
}

/* ---------- Config registries — SCQ_CFG/VIQ_CFG/MCQ_CFG ----------
   מוגדרים כאן, מוקדם מאוד בקובץ (לפני כל שימוש), כדי למנוע
   ReferenceError מ-temporal-dead-zone: להבדיל מהפונקציות הגנריות
   (scqCheck/viqCheck/mcqCheck וכו', שרק *מגדירות* פונקציה ומופעלות
   בעתיד מ-onclick), הקריאות ל-SCQ_CFG_REGISTER/VIQ_CFG_REGISTER/
   MCQ_CFG_REGISTER ליד כל מסך (למטה בקובץ) **מתבצעות מיד** בזמן טעינת
   הסקריפט — ולכן ה-const שהן כותבות לתוכו (SCQ_CFG/VIQ_CFG/MCQ_CFG)
   חייב כבר להיות מאותחל באותו רגע, לא מוגדר בהמשך הקובץ. שווה-ערך
   מבחינה פונקציונלית לאובייקט-הקונפיג המרוכז שבסיין 2 (שם כל המפתחות
   נכתבו כליטרל אחד בלוק אחד) — כאן, בגלל MCQ החדש ומספר גדול יותר של
   מסכים/מפתחות, הרישום פוצל לנקודה ליד כל מסך (register call), אבל
   ה-object שנוצר בסוף זהה בצורתו. ---------- */
const SCQ_CFG = {};
function SCQ_CFG_REGISTER(key, cfg) { SCQ_CFG[key] = cfg; }
const VIQ_CFG = {};
function VIQ_CFG_REGISTER(key, cfg) { VIQ_CFG[key] = cfg; }
const MCQ_CFG = {};
function MCQ_CFG_REGISTER(key, cfg) { MCQ_CFG[key] = cfg; }

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md). מפתח האחסון
   זהה בכוונה לזה של סיינים 1+2 ('math-ratio-01_selectedCharacter', לא
   'math-ratio-01-03_...') — הוא מתויג ברמת ה-**יעד/יחידה**, לא ברמת
   הסיין הבודד, כדי שבחירת-הדמות שנעשתה בסיין קודם תישמר ותחול גם כאן. */
const CHARACTER_STORAGE_KEY = 'math-ratio-01_selectedCharacter';
const KNOWN_CHARACTER_IDS = ['character-1', 'character-2'];

let savedCharacter = null;
try {
  savedCharacter = localStorage.getItem(CHARACTER_STORAGE_KEY);
} catch (e) { /* localStorage חסום (opaque origin/פרטיות) — נמשיך בלי שמירה */ }
if (KNOWN_CHARACTER_IDS.indexOf(savedCharacter) === -1) savedCharacter = null;
window.lomdaState = {
  selectedCharacter: savedCharacter
};

/* ⚠️ תוקן (31.08.2026, לפי בדיקת-רספונסיביות) — CANVAS_W/CANVAS_H היו
   מוצהרים פעמיים: פעם מקומית כאן בתוך scaleApp(), ופעם נפרדת למטה ליד
   clampPopupPosition (BOTTOM_BAR_H) — שני מקורות-אמת לאותם מספרים,
   ללא שום דבר שמכריח אותם להישאר מסונכרנים אם מישהו יערוך רק אחד מהם
   בעתיד. אוחד למקור-אמת יחיד כאן, ברמת-המודול — גם scaleApp() וגם
   clampPopupPosition (למטה) קוראים מכאן, לא מגדירים בעצמם. */
const CANVAS_W = 1280, CANVAS_H = 710;

function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  const left = (window.innerWidth - CANVAS_W * scale) / 2;
  const top = (window.innerHeight - CANVAS_H * scale) / 2;
  app.style.transform = 'scale(' + scale + ')';
  app.style.left = left + 'px';
  app.style.top = top + 'px';
}
window.addEventListener('resize', scaleApp);

/* ---------- closeAllPopupsAndHints() — bug-fixed version (מקורה מ-
   סיין 1, לפי סיכום-תהליך-בניית-הלומדה.md) ---------- */
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
  if (n === 4) resetScreenState4();
  if (n === 5) resetScreenState5();
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
   GLOBAL — Companion character resolve helpers.
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
   _global-components.md → "Progress Question"). מועתק כפי-שהוא מסיין
   2, עם הכללה אחת נדרשת: הסיין הזה מריץ **שתי** קבוצות-התקדמות
   נפרדות (practiceProgress — קבוצה A, 3 שאלות, מסכים 1-3; practiceProgress2
   — קבוצה B, 2 שאלות, מסך 5 בלבד) — לכן setCurrentQuestion/
   syncPracticeProgressNav מקבלות כעת פרמטר state (ברירת-מחדל
   practiceProgress, לשמירת-תאימות), במקום להניח על state גלובלי יחיד
   כמו בסיין 2. updateProgressQuestion עצמה כבר הייתה גנרית (מקבלת
   container+state) ולא שונתה כלל. ראו ARCHITECTURE.md.
   ========================================================= */
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
function syncPracticeProgressNav(sectionEl, state) {
  state = state || practiceProgress;
  const nav = sectionEl && sectionEl.querySelector('.progress-question');
  if (nav) updateProgressQuestion(nav, state);
}

/* מסמן שאלה idx (0-based) של state הנתון כ"נוכחית" (אלא אם כבר נפתרה)
   ומחזיר כל שאלה "נוכחית" קודמת ל"טרם נענתה" באותו state — מבטיח
   טבעת-נוכחי יחידה **בתוך אותה קבוצת-התקדמות**, תמיד על המסך שבו
   הלומד/ת נמצא/ת כרגע. */
function setCurrentQuestion(state, idx) {
  state.questions.forEach(function (q) {
    if (q.state === 'current') q.state = 'not-answered';
  });
  const q = state.questions[idx];
  if (q.state !== 'correct' && q.state !== 'incorrect') q.state = 'current';
  q.visited = true;
}

/* =========================================================
   GLOBAL — SingleChoiceQuestion, config-driven (720-templates skill).
   מועתק כפי-שהוא מסיין 2 (scqSelect/scqLockOptions/scqCheck/scqFinish),
   ללא שום שינוי לוגי — רק SCQ_CFG עצמו מכיל מפתחות חדשים לסיין הזה.
   ========================================================= */
const scqState = {};

function scqSelect(key, id) {
  const cfg = SCQ_CFG[key];
  scqState[key] = scqState[key] || { selected: null, attempts: 0, outcome: null };
  const st = scqState[key];
  if (st.outcome !== null) return;
  /* ⚠️ תוקן (31.08.2026, דיווח: "למה מסומנות שתי תשובות לא נכונות
     בשאלה חד-ברירה?") — .wrong/.correct לא נוקו כאן, רק .selected —
     כשהניסיון הראשון שגוי (scqCheck מסמן .wrong על הבחירה), ואז
     הלומד/ת בוחר/ת אפשרות אחרת לניסיון השני, הסימון-השגוי הישן נשאר
     לצמיתות על האפשרות הראשונה, בנוסף לסימון החדש. */
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
  /* ⚠️ נוסף (31.08.2026, דיווח: "המשוב עולה על הפופ-אפ של הרמז") —
     ראו הערה מלאה זהה ב-methodica-math-ratio-01-05-05/script.js. */
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
  /* ⚠️ נוסף (31.08.2026, אותו דיווח בדיוק כמו scqSelect: סימוני
     correct/wrong ישנים מניסיון קודם לא נוקו כשמשנים בחירה, ונשארו
     דבוקים לצד הסימון החדש). */
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
  /* ⚠️ נוסף (31.08.2026, דיווח: "המשוב עולה על הפופ-אפ של הרמז") —
     ראו הערה מלאה זהה ב-methodica-math-ratio-01-05-05/script.js. */
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
    titleEl.textContent = cfg.correctMsg.title;
    bodyEl.textContent = cfg.correctMsg.body;
    st.outcome = 'success';
    mcqFinish(key);
  } else if (st.attempts < 2) {
    /* ⚠️ תוקן (31.08.2026, דיווח: "אין חיווי בכלל אחרי ניסיון ראשון,
       רק אחרי שני") — הלולאה סימנה .wrong רק לבחירות שלא היו בקבוצת-
       הנכונות; אם בניסיון הראשון הלומד/ת בחר/ה רק תת-קבוצה מהתשובות
       הנכונות (למשל רק 'a' מתוך {a,c}, בלי לבחור אף תשובה שגויה),
       isCorrect=false (הקבוצות לא זהות) אבל שום .wrong לא התווסף —
       ואף .correct (זה קרה רק בענפי isCorrect/הניסיון-האחרון) — אז
       לא הוצג שום חיווי בכלל. עכשיו מסמן correct/wrong על כל מה
       שנבחר בפועל (לא חושף תשובות-נכונות שלא נבחרו — עדיין ניסיון
       שני פתוח). */
    st.selected.forEach(function (id) {
      const el = document.querySelector(cfg.containerSel + ' [data-id="' + id + '"]');
      if (el) el.classList.toggle('correct', correctSet.has(id));
      if (el) el.classList.toggle('wrong', !correctSet.has(id));
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.textContent = cfg.wrongOnce.body;
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
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
    st.outcome = 'fail';
    mcqFinish(key);
  }
}

function mcqFinish(key) {
  const cfg = MCQ_CFG[key];
  document.getElementById(cfg.checkBtnId).disabled = true;
  if (cfg.onDone) cfg.onDone();
}

/* =========================================================
   GLOBAL — ValueInputQuestion, config-driven (720-templates skill).
   מועתק כפי-שהוא מסיין 2 (viqOnInput/viqCheck/viqFinish), ללא שום
   שינוי לוגי — רק VIQ_CFG מכיל מפתחות חדשים לסיין הזה.
   ========================================================= */
const viqState = {};
/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md) — הודעת-
   ביניים משותפת, לשימוש חוזר בכל טוגל חזרה-אליה. */
const VIQ_PENDING_FEEDBACK = { title: 'התשובה אינה נכונה.', body: 'רוצים לראות את הפתרון הנכון?' };

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
  /* ⚠️ נוסף (31.08.2026, דיווח: "המשוב עולה על הפופ-אפ של הרמז") —
     ראו הערה מלאה זהה ב-methodica-math-ratio-01-05-05/script.js. */
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
    /* ⚠️ תוקן (31.08.2026, לפי דיווח: "כשמוצגת התשובה הנכונה עדיין יש
       אייקון X", ולפי הנחיות-כפתור-התשובה-הנכונה.md) — קודם: דרס את
       הערך בתשובה-הנכונה מיד אבל השאיר .wrong (correctFlags חושב לפני
       הדריסה) — התשובה הנכונה הוצגה עם אייקון-שגיאה. עכשיו: הערכים של
       הלומד/ת נשארים (עם .correct/.wrong ביחס-אליהם), נלקח snapshot,
       מוצגת הודעת-ביניים, וכפתור "התשובה הנכונה" נחשף. */
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', correctFlags[i]);
      input.classList.toggle('wrong', !correctFlags[i]);
      input.disabled = true;
    });
    st.snapshot = inputs.map(function (input) { return input.value; });
    st.revealed = false;
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = VIQ_PENDING_FEEDBACK.title;
    bodyEl.textContent = VIQ_PENDING_FEEDBACK.body;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
    }
    st.outcome = 'fail';
    viqFinish(key);
  }
}

/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md, וריאנט 2) —
   טוגל: לחיצה ראשונה חושפת את התשובה הנכונה בפועל, לחיצה שנייה משחזרת
   בדיוק את מה שהלומד/ת הקלידו (מ-snapshot). */
function viqToggleReveal(key) {
  const cfg = VIQ_CFG[key];
  const st = viqState[key];
  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const fb = document.getElementById(cfg.feedbox);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!st.revealed) {
    inputs.forEach(function (input, i) {
      input.value = cfg.correct[i];
      input.classList.remove('wrong');
      input.classList.add('correct');
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
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
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = VIQ_PENDING_FEEDBACK.title;
    bodyEl.textContent = VIQ_PENDING_FEEDBACK.body;
    st.revealed = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

function viqFinish(key) {
  const cfg = VIQ_CFG[key];
  const btn = document.getElementById(cfg.checkBtn);
  btn.disabled = false;
  btn.textContent = 'המשך';
  if (cfg.onDone) cfg.onDone();
}

/* =========================================================
   מסך 1 — מסך מעבר (TransitionScreen), data-screen="0", id="s0".
   תוכן משקף 38 (תסריט). דמות-נלווית לפי הדמות שנבחרה בסיין קודם.
   ⚠️ עודכן (30.08.2026) — נכס-וידאו ייעודי ("smart") סופק במפורש,
   מחליף את פוזת-החשיבה/שאילה הזמנית שתועדה קודם כטרם-מאושרת מול
   המפיקה.
   ========================================================= */
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
    correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'בכל שורה נשים פרח שוקולד לבן אחד, ו-9 פרחי שוקולד מריר, סה"כ 10 פרחים בשורה. נקבל 5 שורות מכיוון ש: 5 = 10 : 50. מספר פרחי שוקולד לבן בכל התבנית הוא: 5, מספר פרחי שוקולד המריר בכל התבנית הוא: 45. מאחר ו- 50 = 5 + 45, אז לא נשארו שקעים ריקים.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'בכל שורה נשים פרח שוקולד לבן אחד, ו-9 פרחי שוקולד מריר, סה"כ 10 פרחים בשורה. נקבל 5 שורות מכיוון ש: 5 = 10 : 50. מספר פרחי שוקולד לבן בכל התבנית הוא: 5, מספר פרחי שוקולד המריר בכל התבנית הוא: 45. מאחר ו- 50 = 5 + 45, אז לא נשארו שקעים ריקים.' }
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
    titleEl.textContent = cfg.correctMsg.title;
    bodyEl.textContent = cfg.correctMsg.body;
    st.outcome = 'success';
    s1MixFinish(key);
  } else if (st.attempts < 2) {
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk);
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk);
    chosenEl.classList.toggle('wrong', !ynOk);
    chosenEl.classList.toggle('correct', ynOk);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.textContent = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true;
  } else {
    /* ⚠️ תוקן (31.08.2026, לפי דיווח: "כשמוצגת התשובה הנכונה עדיין יש
       אייקון X", ולפי הנחיות-כפתור-התשובה-הנכונה.md) — קודם: דרס את
       whiteInput/darkInput בערך-הנכון מיד אבל השאיר .wrong (whiteOk/
       darkOk חושבו לפני הדריסה) — התשובה הנכונה הוצגה עם אייקון-שגיאה.
       עכשיו: הערכים של הלומד/ת נשארים (עם .correct/.wrong ביחס-אליהם),
       נלקח snapshot, וכפתור "התשובה הנכונה" נחשף. בורר-כן/לא (yn) לא
       נגוע בבאג הזה כלל (הסימון-הקבוע שלו כבר תואם למוסכמת-הפרויקט
       ל-SCQ — נשאר ללא שינוי, לא חלק מהטוגל). */
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk);
    whiteInput.disabled = true;
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk);
    darkInput.disabled = true;
    if (!ynOk) { chosenEl.classList.add('wrong'); correctYNEl.classList.add('correct'); }
    else { chosenEl.classList.add('correct'); }
    s1MixLock(key);
    st.snapshot = { white: whiteInput.value, dark: darkInput.value };
    st.revealed = false;
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = VIQ_PENDING_FEEDBACK.title;
    bodyEl.textContent = VIQ_PENDING_FEEDBACK.body;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
    }
    st.outcome = 'fail';
    s1MixFinish(key);
  }
}

/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md, וריאנט 2) —
   טוגל של whiteInput/darkInput בלבד (הבורר yn לא נגוע, נשאר קבוע). */
function s1MixToggleReveal(key) {
  const cfg = S1MIX_CFG[key];
  const st = s1MixState[key];
  const whiteInput = document.getElementById(cfg.whiteId);
  const darkInput = document.getElementById(cfg.darkId);
  const fb = document.getElementById(cfg.feedbox);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!st.revealed) {
    whiteInput.value = cfg.correct.white;
    whiteInput.classList.remove('wrong'); whiteInput.classList.add('correct');
    darkInput.value = cfg.correct.dark;
    darkInput.classList.remove('wrong'); darkInput.classList.add('correct');
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
    st.revealed = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    const snap = st.snapshot;
    whiteInput.value = snap.white;
    const whiteOk = Number(snap.white) === cfg.correct.white;
    whiteInput.classList.toggle('correct', whiteOk); whiteInput.classList.toggle('wrong', !whiteOk);
    darkInput.value = snap.dark;
    const darkOk = Number(snap.dark) === cfg.correct.dark;
    darkInput.classList.toggle('correct', darkOk); darkInput.classList.toggle('wrong', !darkOk);
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = VIQ_PENDING_FEEDBACK.title;
    bodyEl.textContent = VIQ_PENDING_FEEDBACK.body;
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

/* ⚠️ הוסרה s1ShowPart (20.08.2026, לפי בקשה מפורשת: "התוכן לא יעלה
   בהדרגתיות") — שלושת החלקים גלויים תמיד (index.html, hidden הוסר).
   s1ProgrammaticScroll נשאר מוצהר (תמיד false עכשיו, בלי שום קריאה
   שמדליקה אותו) — עדיין נבדק ב-s1HideGestureOnScroll למטה, לא נמחק
   כדי לא לשבור את הפונקציה ההיא. */
let s1ProgrammaticScroll = false;

let s1GestureShown = false;
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
/* QA 19.08.2026: לא מוצג עוד ללא-תנאי — רק אם יש בפועל מה לגלול
   (scrollHeight>clientHeight) באותו רגע. */
function s1MaybeShowScrollGesture() {
  if (s1GestureShown) return;
  const gesture = document.getElementById('s1-scroll-gesture');
  const scrollArea = document.getElementById('s1-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s1GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s1HideGestureOnScroll, { once: true });
}

function resetScreenState1() {
  setCurrentQuestion(practiceProgress, 0);
  syncPracticeProgressNav(document.getElementById('s1'));
  s1MaybeShowScrollGesture();
}

/* =========================================================
   מסך 3 — מסך סטטי (לא גלילה), "שאלה 2 מתוך 3" (קבוצת התקדמות A),
   data-screen="2", id="s2". גיאומטריה של זוויות (דיאגרמת CD אמיתית,
   assets/images/angle-diagram-cd.png) + 4 טענות נכון/לא נכון (לא 3
   כמו בסיין 2 — לפי תוכן התסריט בפועל כאן). בדיוק כמו s3P3Select/
   s3P3Check/s3P3Lock של סיין 2 (מבנה זהה, רק 4 שורות במקום 3, שם
   שונה: s2P1*). אין רמז — לא נמצא טקסט-רמז מפורש בתסריט (אותו ממצא
   שכבר תועד בסיינים קודמים לשאלות דומות).
   ========================================================= */
const s2TfCorrect = { 1: 'false', 2: 'true', 3: 'true', 4: 'true' };
const s2TfState = { selected: { 1: null, 2: null, 3: null, 4: null }, attempts: 0, outcome: null };

function s2P1Select(row, val) {
  if (s2TfState.outcome !== null) return;
  s2TfState.selected[row] = val;
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
  const explain = 'זוויות α ו-β הן זוויות צמודות ולכן סכומן הוא 180°, היחס בין α ל-β הוא 7 : 2. לכן, גודלה של זווית β הוא 140° = 180 · 7/9. גודלה של זווית α הוא 40°, מכיוון ש: 180° − 40° = 140°.';

  if (allCorrect) {
    [1, 2, 3, 4].forEach(function (r) {
      document.getElementById('s2-r' + r + '-' + s2TfCorrect[r]).classList.add('correct');
      s2P1Lock(r);
    });
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.textContent = 'כל הכבוד, צדקתם!';
    bodyEl.textContent = explain;
    s2TfState.outcome = 'success';
    s2P1Finish();
  } else if (s2TfState.attempts < 2) {
    /* ⚠️ נוסף (31.08.2026, דיווח: "אין חיווי בניסיון פתרון 1, זה רק
       משוב") — הענף הזה עדכן רק את תיבת-המשוב הכללית, בלי לסמן אף
       כפתור נכון/שגוי בפועל — בניגוד לענף-הכישלון-הסופי (למטה) ולשאר
       הרכיבים בפרויקט (SCQ/גרירה), ששם החיווי-הפר-פריט מופיע כבר
       בניסיון הראשון. נוסף אותו סימון, בלי לנעול (s2P1Lock) כדי
       שהניסיון השני עדיין יישאר פתוח. */
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
    bodyEl.textContent = explain;
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

/* ⚠️ נוסף (31.08.2026, לפי דיווח: "אורך המלבן של המסיחים צריך להיות
   לפי אורך המסיח הארוך ביותר בכל שאלה") — ראו הערה מלאה זהה ב-
   methodica-math-ratio-01-05-02/script.js. */
function equalizeTfBtnWidths() {
  document.querySelectorAll('.tf-btns').forEach(function (group) {
    const btns = Array.prototype.slice.call(group.querySelectorAll('.tf-btn'));
    if (!btns.length) return;
    btns.forEach(function (b) { b.style.width = ''; });
    const maxWidth = Math.max.apply(null, btns.map(function (b) { return b.offsetWidth; }));
    btns.forEach(function (b) { b.style.width = maxWidth + 'px'; });
  });
}

function resetScreenState2() {
  setCurrentQuestion(practiceProgress, 1);
  syncPracticeProgressNav(document.getElementById('s2'));
  /* ⚠️ נדחה ל-requestAnimationFrame — המסך עדיין display:none בשלב הזה. */
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
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'רועי שילם 5 ש"ח ועינת שילמה 7 ש"ח, לכן יחס ההשקעה הוא 5 : 7.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'רועי שילם 5 ש"ח ועינת שילמה 7 ש"ח, לכן יחס ההשקעה הוא 5 : 7.' },
  onDone: function () { s3ShowPart(2); }
});
function s3P1OnInput() { viqOnInput('s3p1'); }
function s3P1Check() { viqCheck('s3p1'); }

SCQ_CFG_REGISTER('s3p2', {
  containerSel: '#s3-part-2',
  correctId: 'a',
  checkBtnId: 's3-p2-check',
  feedboxId: 's3-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'רועי ועינת זכו ב-120 ש"ח ועליהם לחלק את הסכום ביחס של 5 : 7. נחשב כמה רועי יקבל: (5/12)·120=50, וכמה עינת תקבל: (7/12)·120=70.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'רועי ועינת זכו ב-120 ש"ח ועליהם לחלק את הסכום ביחס של 5 : 7. נחשב כמה רועי יקבל: (5/12)·120=50, וכמה עינת תקבל: (7/12)·120=70.' },
  onDone: null
});
function s3P2Select(id) { scqSelect('s3p2', id); }
function s3P2Check() { scqCheck('s3p2'); }

MCQ_CFG_REGISTER('s3p3', {
  containerSel: '#s3-part-3',
  correctIds: ['a', 'c'],
  checkBtnId: 's3-p3-check',
  feedboxId: 's3-p3-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'ההצעה לא הוגנת כי עינת שילמה יותר כסף בקנייה, ולכן היא צריכה לקבל נתח גדול יותר מכספי הזכייה — היחס בין הכספים שהם שילמו הוא 5 : 7, והסכומים 60 ו-60 מייצגים יחס שונה של 1 : 1.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'ההצעה לא הוגנת כי עינת שילמה יותר כסף בקנייה, ולכן היא צריכה לקבל נתח גדול יותר מכספי הזכייה — היחס בין הכספים שהם שילמו הוא 5 : 7, והסכומים 60 ו-60 מייצגים יחס שונה של 1 : 1.' },
  onDone: function () { s3FinishAggregate(); }
});

/* ⚠️ תוקן (31.08.2026, דיווח: "איפה התמונה של מסך 4?") — s3HidePhoto
   הייתה נקראת פעם-אחת מ-onDone של חלק ב', ומעולם לא הוחזרה בחזרה —
   בעייתי מאז ששלושת החלקים הפכו לגלויים-תמיד-בבת-אחת (לא נחשפים
   בזה-אחר-זה): ברגע שחלק ב' נענה פעם אחת, התמונה נעלמת *לצמיתות*,
   גם כשחלקים א'/ב' עדיין גלויים על המסך וצריכים אותה. אותה בעיה
   בדיוק כמו s5SetPhoto (ראו שם) ו-s2RestoreDiagram ב-
   methodica-math-ratio-01-05-06. הוחלף במנגנון-גלילה
   (s3UpdatePhotoVisibilityByScroll): התמונה גלויה כל עוד חלק ג' לא
   הגיע לאמצע אזור-הגלילה, מוסתרת אחרי זה — עוקב אחרי מה שבאמת גלוי,
   לא אחרי סטטוס-סיום. */
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

/* ⚠️ הוסרה s3ShowPart (20.08.2026, לפי בקשה מפורשת) — אותה סיבה
   בדיוק כמו s1ShowPart למעלה: שלושת החלקים גלויים תמיד. */
let s3ProgrammaticScroll = false;

let s3GestureShown = false;
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
/* QA 19.08.2026: אותו תיקון בדיוק כמו s1MaybeShowScrollGesture. */
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
  setCurrentQuestion(practiceProgress, 2);
  syncPracticeProgressNav(document.getElementById('s3'));
  s3MaybeShowScrollGesture();
  s3WirePhotoScroll();
  /* ⚠️ נדחה ל-requestAnimationFrame — בשלב הזה המסך עדיין display:none
     (goTo קוראת ל-resetScreenState *לפני* target.classList.add('active')),
     אז getBoundingClientRect היה מחזיר הכל 0. אותה גותצ'ה כמו
     s5UpdatePhotoByScroll (סיין 3 עצמו, מסך 6) ו-s2MaybeRestoreDiagram
     (methodica-math-ratio-01-05-06). */
  requestAnimationFrame(s3UpdatePhotoVisibilityByScroll);
}

/* =========================================================
   מסך 5 — מסך מעבר (TransitionScreen), data-screen="4", id="s4".
   תוכן משקף 46 (תסריט). משתמש-חוזר ב-.s0-content/.s0-line-1/2/3
   הגנריים (אין צורך ב-class חדש) — אך "יופי של עבודה!" (המשפט
   הקורא-תיגר, הכי בולט) ממופה ל-class .s0-line-2 (המשקל הוויזואלי
   הגדול/מודגש), למרות שאין כאן "מספר גדול" כמו במסך 1 — לפי בקשה
   מפורשת: "reuse that class for its bold/large visual weight". סדר
   ה-DOM (ולכן הסדר הפיזי, RTL עמודה) הוא: line-2-styled ראשון (הכי
   בולט, פותח), line-1-styled שני (המשפט הרגיל, "הנה עוד 2 תרגילים"),
   line-3-styled שלישי (סגירה קצרה, "קטן עליכם!") — ראו ARCHITECTURE.md
   § "מסך 5" לתיעוד ההחלטה הזו כשיקול-דעת מפורש.
   ⚠️ עודכן (30.08.2026) — פוצל מ-S0_AVATAR_ASSETS (שהיה משותף עם מסך
   1 לפני העדכון) למפת-נכסים ייעודית משלו: נכס-וידאו ("work-out")
   סופק במפורש לפי בקשה, זהה לקובצי-הווידאו המשמשים במסך 1 בסיין 2
   (methodica-math-ratio-01-02) — הועתקו מקומית ל-assets/videos של
   סיין 3 (כל חלק הוא תיקייה עצמאית לפריסה).
   ========================================================= */
const S4_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-work-out.mp4',
  'character-2': 'assets/videos/yellow-avatar-work-out.mp4'
};
function resetScreenState4() {
  resolveCharBubbleVideo('s4-avatar', S4_AVATAR_ASSETS);
}

/* =========================================================
   מסך 6 — מסך גלילה, קבוצת-התקדמות **נפרדת** משלו (practiceProgress2,
   2 שאלות: "שאלה 1"=סעיפים א'+ב' יחד, "שאלה 2"=סעיף 3), data-screen="5",
   id="s5". שעות-עבודה/חלוקת-כסף, 3 חלקים: (א) VIQ זוגי (s5p1); (ב)
   SCQ רגיל 4 אפשרויות (s5p2) — **סיום סעיף ב' הוא מה שקובע את מצב
   "שאלה 1" בסרגל-ההתקדמות**, לא סיום סעיף א' לבדו (א'+ב' הם שני
   סעיפים של אותה שאלה 1 לוגית, לפי התסריט עצמו); (ג) SCQ כן/לא, 2
   אפשרויות (s5p3) — שאלה 2 (עצמאית). תמונה קבועה מתחלפת בכל חלק (לא
   מוסתרת כמו במסך 4 — כאן מתחלפת: boy-washing-car→girl-washing-car→
   lottery-kiosk-siblings), דרך s5SetPhoto().
   ⚠️ תוקן (31.08.2026, דיווח: "בסעיף ב/סעיף 2 מוצגת התמונה הלא-נכונה")
   — קודם s5SetPhoto נקראה רק מ-onDone (סיום-חלק), אבל שלושת החלקים
   גלויים-תמיד-בבת-אחת (לא נחשפים בזה-אחר-זה) — כך שגלילה לחלק ב'/ג'
   *לפני* שהחלק הקודם נענה השאירה את תמונת-ברירת-המחדל מוצגת, לא
   תואמת לחלק שבאמת נקרא/נענה כרגע (בעיה פתוחה שתועדה בזמנו למטה,
   ליד s5SetPhoto). הוחלף במנגנון גלילה (s5UpdatePhotoByScroll,
   ראו שם) שמעדכן לפי איזה חלק גלוי-בפועל, לא לפי סטטוס-סיום.
   מסך אחרון בסיין — כפתור "המשך" הראשי הוא no-op בטוח (goTo(6),
   TOTAL_SCREENS=6 → אינדקסים תקפים 0-5 בלבד), בדיוק לפי המוסכמה
   המתועדת כבר בסיין 1 (#s6-continue→goTo(7)) ובסיין 2 (#s4-continue→
   goTo(5)) — יעד-ניווט אמיתי לסוף-היחידה דורש אישור-מוצר, לא הומצא כאן.
   ========================================================= */
VIQ_CFG_REGISTER('s5p1', {
  inputs: ['s5-p1-a', 's5-p1-b'], correct: [60, 150], checkBtn: 's5-p1-check', feedbox: 's5-p1-feedbox', revealBtn: 's5-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'היחס בין מספר השעות שעבדה נעמי למספר השעות שעבד יוני הוא 2:5. מספר החלקים הוא 7=2+5. אם נועה ויוני הרוויחו 210 ₪ והם מתכוונים לחלק את הכסף לפי מספר השעות היחסי אז: נועה תקבל (2/7)·210=60, ויוני יקבל (5/7)·210=150.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'היחס בין מספר השעות שעבדה נעמי למספר השעות שעבד יוני הוא 2:5. מספר החלקים הוא 7=2+5. אם נועה ויוני הרוויחו 210 ₪ והם מתכוונים לחלק את הכסף לפי מספר השעות היחסי אז: נועה תקבל (2/7)·210=60, ויוני יקבל (5/7)·210=150.' },
  onDone: null
});
function s5P1OnInput() { viqOnInput('s5p1'); }
function s5P1Check() { viqCheck('s5p1'); }

SCQ_CFG_REGISTER('s5p2', {
  containerSel: '#s5-part-2',
  correctId: 'a',
  checkBtnId: 's5-p2-check',
  feedboxId: 's5-p2-feedbox',
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'נסמן את סכום הכסף שנועה ויוני הרוויחו ב-x. יוני הרוויח: (5/7)·x, ואם נחלק ב-100 נקבל x=140. מסקנה: נועה ויוני הרוויחו יחד 140 ₪. יוני הרוויח 100 ₪ לכן נועה הרוויחה 40 ₪.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'נסמן את סכום הכסף שנועה ויוני הרוויחו ב-x. יוני הרוויח: (5/7)·x, ואם נחלק ב-100 נקבל x=140. מסקנה: נועה ויוני הרוויחו יחד 140 ₪. יוני הרוויח 100 ₪ לכן נועה הרוויחה 40 ₪.' },
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
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'מיה ועומר לא יוכלו לחלק את הכסף ביניהם ביחס הנתון כך שיקבלו רק שטרות. אם הם זכו ב-90 ש"ח, ויחס הזכייה הוא 2:5, אז מיה אמורה לקבל (2/7)·90, כלומר שטר של 20, מטבע של 5 ש"ח, ועוד כמה אגורות, ועומר אמור לקבל (5/7)·90, כלומר שטר של 50, 4 מטבעות של 1 ש"ח ועוד כמה אגורות.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'מיה ועומר לא יוכלו לחלק את הכסף ביניהם ביחס הנתון כך שיקבלו רק שטרות. אם הם זכו ב-90 ש"ח, ויחס הזכייה הוא 2:5, אז מיה אמורה לקבל (2/7)·90, כלומר שטר של 20, מטבע של 5 ש"ח, ועוד כמה אגורות, ועומר אמור לקבל (5/7)·90, כלומר שטר של 50, 4 מטבעות של 1 ש"ח ועוד כמה אגורות.' },
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
  if (img.src.indexOf(src) === -1) { img.src = src; img.alt = alt; }
}

/* ⚠️ נוסף (31.08.2026, ראו הערה מלאה למעלה ליד "מסך 6") — שלושת החלקים
   גלויים-תמיד-בבת-אחת, אז התמונה חייבת לעקוב אחרי מה שגלוי-בפועל
   בגלילה, לא אחרי סטטוס-סיום. בודק איזה חלק חוצה את אמצע-אזור-הגלילה
   (getBoundingClientRect, לא scrollTop/offsetTop — מדויק גם כשהמסך
   מוקטן/מוגדל ע"י scaleApp). נקרא גם ב-scroll וגם פעם אחת בכניסה
   למסך (resetScreenState5), למקרה שכבר גוללנו לפני חזרה למסך. */
function s5UpdatePhotoByScroll() {
  const area = document.getElementById('s5-scroll-area');
  if (!area) return;
  const parts = [
    { el: document.getElementById('s5-part-2'), src: 'assets/images/girl-washing-car.jpeg', alt: 'ילדה שוטפת מכונית' },
    { el: document.getElementById('s5-part-3'), src: 'assets/images/lottery-kiosk-siblings.jpg', alt: 'אחים בדוכן הגרלה' } /* ⚠️ תוקן (31.08.2026, דיווח: "לא מופיעה התמונה בסעיף האחרון") — הקובץ בפועל בדיסק הוא .jpg, לא .jpeg */
  ];
  const areaRect = area.getBoundingClientRect();
  const midpoint = areaRect.top + areaRect.height / 2;
  let active = null;
  parts.forEach(function (p) {
    if (!p.el) return;
    const r = p.el.getBoundingClientRect();
    if (r.top <= midpoint) active = p;
  });
  if (active) s5SetPhoto(active.src, active.alt);
  else s5SetPhoto('assets/images/boy-washing-car.jpeg', 'ילד שוטף מכונית');
}
let s5PhotoScrollWired = false;
function s5WirePhotoScroll() {
  const area = document.getElementById('s5-scroll-area');
  if (!area || s5PhotoScrollWired) return;
  s5PhotoScrollWired = true;
  area.addEventListener('scroll', s5UpdatePhotoByScroll);
}

/* ⚠️ הוסרה s5ShowPart (20.08.2026, לפי בקשה מפורשת) — אותה סיבה
   בדיוק כמו s1ShowPart למעלה: שלושת החלקים גלויים תמיד.
   ⚠️ שים לב — נושא פתוח, לא טופל: s5SetPhoto (שנשאר, ראו onDone
   למעלה) מחליף את *תמונת-ההקשר* (`#s5-fixed-img`) לפי החלק שהושלם.
   כל עוד החלקים נחשפו בזה-אחר-זה, התמונה תמיד תאמה לחלק הגלוי. עכשיו
   ששלושת החלקים גלויים בבת-אחת מתחילת המסך, תמונת ברירת-המחדל (חלק
   א') תישאר מוצגת גם כשהלומד/ת כבר קוראים את חלקים ב'/ג' — עד
   שהחלק הקודם נענה. לא שונה כאן — דורש החלטת-עיצוב (תמונה אחת קבועה
   לאורך כל המסך? שלוש תמונות זו-לצד-זו?) — יש להציג בפני המשתמשת. */
let s5ProgrammaticScroll = false;

let s5GestureShown = false;
function s5HideGestureOnScroll() {
  const scrollArea = document.getElementById('s5-scroll-area');
  const gesture = document.getElementById('s5-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s5ProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s5HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}
/* QA 19.08.2026: אותו תיקון בדיוק כמו s1MaybeShowScrollGesture. */
function s5MaybeShowScrollGesture() {
  if (s5GestureShown) return;
  const gesture = document.getElementById('s5-scroll-gesture');
  const scrollArea = document.getElementById('s5-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s5GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s5HideGestureOnScroll, { once: true });
}

function resetScreenState5() {
  const q1Done = practiceProgress2.questions[0].state === 'correct' || practiceProgress2.questions[0].state === 'incorrect';
  setCurrentQuestion(practiceProgress2, q1Done ? 1 : 0);
  syncPracticeProgressNav(document.getElementById('s5'), practiceProgress2);
  s5MaybeShowScrollGesture();
  s5WirePhotoScroll();
  /* ⚠️ נדחה ל-requestAnimationFrame — בשלב הזה המסך עדיין display:none
     (goTo קוראת ל-resetScreenState *לפני* target.classList.add('active')),
     אז getBoundingClientRect של האזור/החלקים היה מחזיר הכל 0 — אותה
     גותצ'ה בדיוק כמו equalizeTfBtnWidths (מסכים 4/5, ראו שם). */
  requestAnimationFrame(s5UpdatePhotoByScroll);
}

/* =========================================================
   GLOBAL — Feedback popup drag/reset helpers (_global-components.md).
   מועתק כפי-שהוא מסיין 2.
   ========================================================= */
/* ⚠️ CANVAS_W/CANVAS_H הוסרו מכאן (31.08.2026) — מוגדרים פעם אחת בלבד,
   למעלה ליד scaleApp(). ראו ההערה המלאה שם. */
const BOTTOM_BAR_H = 74;

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
   GLOBAL — Image zoom (_global-components.md: "Image zoom"). מועתק
   כפי-שהוא מסיין 2. אין עדיין שימוש בפועל (אף תמונת-תוכן בסיין הזה
   לא הוסיפה כפתור .img-zoom-btn) — מוכן לשימוש עתידי.
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
/* QA 19.08.2026: s1-p1/p2/p3, s3-p1/p2/p3, s5-p1/p2/p3 (9 תיבות) הפכו
   ל-.is-static — s1/s3/s5 הם מסכי-גלילה. s2-feedbox נשאר draggable —
   מסך s2 סטטי (לא-גולל), לא מושפע משינוי-המדיניות הזה. */
['s2-feedbox'].forEach(scqFbMakeDraggable);
(function () {
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
})();
