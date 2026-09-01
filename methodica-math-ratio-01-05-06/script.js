'use strict';

/* =========================================================
   לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 6
   3 מסכי תוכן אמיתי (Prompt 2): מסך-מעבר (s0), תמונה ממלאת-מסך (s1),
   מסך-גלילה עם "שאלת השיא" בת 4 סעיפים + חלק-ביניים תמונתי (s2).
   מקור: תשתית שהותאמה מסיין 2 (methodica-math-ratio-01-02); הרכיבים
   הגנריים (Progress Question, VIQ, Feedback popup, Gesture Hint) הועתקו
   כפי-שהם ממסך-הגלילה המקביל בסיין 3 (methodica-math-ratio-01-03) —
   ראו ARCHITECTURE.md לפירוט מלא של מה הועתק ומה נבנה כאן לראשונה.
   ========================================================= */

const TOTAL_SCREENS = 3;
let currentScreen = 0;

/* ---------- Config registry — VIQ_CFG ----------
   מוגדר כאן, מוקדם מאוד בקובץ (לפני כל שימוש), כדי למנוע ReferenceError
   מ-temporal-dead-zone: קריאות VIQ_CFG_REGISTER (למטה, ליד מסך 3)
   מתבצעות מיד בזמן טעינת הסקריפט, אז ה-const שהן כותבות לתוכו חייב
   כבר להיות מאותחל. אין SCQ_CFG/MCQ_CFG בסיין הזה — כל 4 השאלות
   האמיתיות הן ValueInputQuestion בלבד (אין שאלת-בחירה בסיין הזה). */
const VIQ_CFG = {};
function VIQ_CFG_REGISTER(key, cfg) { VIQ_CFG[key] = cfg; }

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md). מפתח האחסון
   זהה בכוונה לזה של הסינים הקודמים ('math-ratio-01_selectedCharacter',
   לא 'math-ratio-01-06_...') — הוא מתויג ברמת ה-**יעד/יחידה**, לא ברמת
   הסיין הבודד. */
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
   _global-components.md → "Progress Question"). מועתק כפי-שהוא מסיין 3.
   שימוש יחיד כאן: 4 פריטים (סעיפים א/ב/ג/ד), כולם על אותו מסך פיזי
   יחיד (data-screen="2") — לא כמו בסיינים 1/3, ששם כל שאלה חיה על מסך
   נפרד משלה. ראו resetScreenState2()/setCurrentQuestion() למטה לאופן
   שבו זה מוכלל לתרחיש "כמה שאלות על מסך-גלילה אחד".
   ========================================================= */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 2 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 2 },
    { number: 4, visited: false, state: 'not-answered', screen: 2 }
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

/* מסמן שאלה idx (0-based) כ"נוכחית" (אלא אם כבר נפתרה) ומחזיר כל שאלה
   "נוכחית" קודמת ל"טרם נענתה" — מבטיח טבעת-נוכחי יחידה. */
function setCurrentQuestion(state, idx) {
  state.questions.forEach(function (q) {
    if (q.state === 'current') q.state = 'not-answered';
  });
  const q = state.questions[idx];
  if (q.state !== 'correct' && q.state !== 'incorrect') q.state = 'current';
  q.visited = true;
}

/* =========================================================
   GLOBAL — ValueInputQuestion, config-driven (720-templates skill).
   מועתק כפי-שהוא מסיין 3 (viqOnInput/viqCheck/viqFinish) — אין שום
   שינוי לוגי, רק VIQ_CFG מכיל מפתחות חדשים לסיין הזה.
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
     סוגר רמז פתוח לפני שמציגים משוב, כדי שלא יחפפו חזותית. */
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
   טוגל: לחיצה ראשונה חושפת את התשובה הנכונה בפועל (מעדכנת ערכים,
   מסמנת .correct, מציגה את wrongFinal הקיים ללא שינוי), לחיצה שנייה
   משחזרת בדיוק את מה שהלומד/ת הקלידו (מ-snapshot) עם .correct/.wrong
   ביחס-אליו, וחוזרת להודעת-הביניים. */
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
   GLOBAL — Feedback popup drag/reset helpers (_global-components.md).
   מועתק כפי-שהוא מהתשתית (Prompt 1) — בלי שום שינוי.
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
   GLOBAL — Image zoom (_global-components.md: "Image zoom") — מוכן
   לשימוש, לא הופעל בפועל בסיין הזה (ראו הערה ב-index.html).
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

/* =========================================================
   מסך 1 — מסך מעבר (TransitionScreen), data-screen="0", id="s0".
   תוכן משקף 62 (תסריט). דמות-נלווית לפי הדמות שנבחרה בסיין קודם.
   ⚠️ עודכן (30.08.2026) — נכס-וידאו ייעודי ("climbing") סופק במפורש,
   מחליף את פוזת-החשיבה/שאילה הזמנית שתועדה קודם כטרם-מאושרת מול
   המפיקה.
   ========================================================= */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-climbing.mp4',
  'character-2': 'assets/videos/yellow-avatar-climbing.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסך 2 — תמונה ממלאת-מסך + תגית-מידע, data-screen="1", id="s1".
   תוכן משקף 63 (תסריט). מסך סטטי לחלוטין — בלי שאלה, בלי דמות, בלי
   state לאפס. resetScreenState1 ריקה בכוונה (נשמרת רק לשם עקביות
   עם מוסכמת ה-dispatcher resetScreenState(n) של הפרויקט הזה).
   ========================================================= */
function resetScreenState1() {
  /* אין state לאפס — מסך תמונה+כרטיס-מידע סטטי בלבד. */
}

/* =========================================================
   מסך 3 — מסך גלילה, "שאלת השיא" בת 4 סעיפים (א/ב/ג/ד, שקפים 64/65/
   67/68) + חלק-ביניים תמונתי לא-מנוקד (שקף 66, בין סעיף ב' לסעיף ג'),
   data-screen="2", id="s2". דיאגרמת המגרש (land-plot-diagram.png)
   קבועה וזהה בארבעת הסעיפים — מוסתרת זמנית בחלק-הביניים (לא רלוונטית
   לתוכנו) דרך s2HideDiagramForInterlude()/s2RestoreDiagram().
   ========================================================= */
VIQ_CFG_REGISTER('s2p1', {
  inputs: ['s2-p1-input'], correct: [216], checkBtn: 's2-p1-check', feedbox: 's2-p1-feedbox', revealBtn: 's2-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'היחס בין AB ל-AE הוא 2 : 1, לכן AE = 10. נחשב את שטח המלבן AEDB: 20⋅10 = 200. נחשב את שטח הריבוע GHCD: 4⋅4 = 16. שטח החלקה כולה הוא 200 + 16 = 216 מ"ר.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'היחס בין AB ל-AE הוא 2 : 1, לכן AE = 10. נחשב את שטח המלבן AEDB: 20⋅10 = 200. נחשב את שטח הריבוע GHCD: 4⋅4 = 16. שטח החלקה כולה הוא 200 + 16 = 216 מ"ר.' },
  onDone: function () {
    practiceProgress.questions[0].state = (viqState.s2p1 && viqState.s2p1.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 1);
    syncPracticeProgressNav(document.getElementById('s2'));
  }
});
function s2P1OnInput() { viqOnInput('s2p1'); }
function s2P1Check() { viqCheck('s2p1'); }
function s2P1HintOpen() { document.getElementById('s2-p1-hint-overlay').hidden = false; }
function s2P1HintClose() { document.getElementById('s2-p1-hint-overlay').hidden = true; }

/* ⚠️ שיקול-דעת מתועד — נשאר-בכוונה: הסבר-הפתרון של סעיף ב' בתסריט-
   המקור מנוסח "היחס בין AT ל-TB הוא 3 : 2. נחשב את AT: 2/5⋅20=8" —
   יש כאן חוסר-עקביות ניסוחי לכאורה (3:2 מול המקדם 2/5), אבל לפי כלל-
   הפרויקט הקבוע "תוכן כפי-שסופק, לא נגזר-מחדש" (ראו תקדים זהה בדיוק
   בשאלת-ערבוב-הצבעים של methodica-math-ratio-01-05), משעתקים את הטקסט
   הנתון מילה-במילה ולא "מתקנים" אותו. */
VIQ_CFG_REGISTER('s2p2', {
  inputs: ['s2-p2-input'], correct: [80], checkBtn: 's2-p2-check', feedbox: 's2-p2-feedbox', revealBtn: 's2-p2-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'ידוע כי מ\' AB = 20. היחס בין AT ל-TB הוא 3 : 2. נחשב את AT: 2/5⋅20=8, לכן שטח הגינה הוא 10⋅8=80.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'ידוע כי מ\' AB = 20. היחס בין AT ל-TB הוא 3 : 2. נחשב את AT: 2/5⋅20=8, לכן שטח הגינה הוא 10⋅8=80.' },
  onDone: function () {
    practiceProgress.questions[1].state = (viqState.s2p2 && viqState.s2p2.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 2);
    syncPracticeProgressNav(document.getElementById('s2'));
    s2HideDiagramForInterlude();
  }
});
function s2P2OnInput() { viqOnInput('s2p2'); }
function s2P2Check() { viqCheck('s2p2'); }
function s2P2HintOpen() { document.getElementById('s2-p2-hint-overlay').hidden = false; }
function s2P2HintClose() { document.getElementById('s2-p2-hint-overlay').hidden = true; }

/* ⚠️ תוקן (31.08.2026, לפי בקשה מפורשת: "תוריד את כפתור 'המשך'"
   בחלק-הביניים התמונתי) — s2Part3Continue (כפתור, הוסר מ-index.html)
   הייתה הטריגר היחיד ל-s2RestoreDiagram. הוחלף בבדיקת-גלילה
   (s2MaybeRestoreDiagram): ברגע שחלק 4 (הסעיף שאחרי ה-interlude)
   חוצה את אמצע אזור-הגלילה, הדיאגרמה משוחזרת אוטומטית — אותה טכניקה
   בדיוק כמו s5UpdatePhotoByScroll ב-methodica-math-ratio-01-05-03. */
let s2DiagramRestored = false;
function s2MaybeRestoreDiagram() {
  if (s2DiagramRestored) return;
  const area = document.getElementById('s2-scroll-area');
  const part4 = document.getElementById('s2-part-4');
  if (!area || !part4) return;
  const areaRect = area.getBoundingClientRect();
  const midpoint = areaRect.top + areaRect.height / 2;
  const partRect = part4.getBoundingClientRect();
  if (partRect.top <= midpoint) {
    s2DiagramRestored = true;
    s2RestoreDiagram();
  }
}
let s2DiagramScrollWired = false;
function s2WireDiagramScroll() {
  const area = document.getElementById('s2-scroll-area');
  if (!area || s2DiagramScrollWired) return;
  s2DiagramScrollWired = true;
  area.addEventListener('scroll', s2MaybeRestoreDiagram);
}

VIQ_CFG_REGISTER('s2p4', {
  inputs: ['s2-p4-input'], correct: [26], checkBtn: 's2-p4-check', feedbox: 's2-p4-feedbox', revealBtn: 's2-p4-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1. נחשב את השטח המיועד לבנייה לפי היחס המבוקש: 3/4⋅216=162 ואת השטח המיועד לגינה: 1/4⋅216=54. שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר. לכן, עלינו להעביר 80 - 54 = 26 מ"ר לשטח המיועד לבנייה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1. נחשב את השטח המיועד לבנייה לפי היחס המבוקש: 3/4⋅216=162 ואת השטח המיועד לגינה: 1/4⋅216=54. שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר. לכן, עלינו להעביר 80 - 54 = 26 מ"ר לשטח המיועד לבנייה.' },
  onDone: function () {
    practiceProgress.questions[2].state = (viqState.s2p4 && viqState.s2p4.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 3);
    syncPracticeProgressNav(document.getElementById('s2'));
  }
});
function s2P4OnInput() { viqOnInput('s2p4'); }
function s2P4Check() { viqCheck('s2p4'); }
function s2P4HintOpen() { document.getElementById('s2-p4-hint-overlay').hidden = false; }
function s2P4HintClose() { document.getElementById('s2-p4-hint-overlay').hidden = true; }

VIQ_CFG_REGISTER('s2p5', {
  inputs: ['s2-p5-input'], correct: [28], checkBtn: 's2-p5-check', feedbox: 's2-p5-feedbox', revealBtn: 's2-p5-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח הגינה כולה הוא 216 מ"ר. אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים. לכן, שטח הבנייה ושטח הגינה יהיו: 216:2=108 מ"ר. שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר 108 - 80 = 28 מ"ר משטח הבנייה לשטח הגינה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח הגינה כולה הוא 216 מ"ר. אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים. לכן, שטח הבנייה ושטח הגינה יהיו: 216:2=108 מ"ר. שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר 108 - 80 = 28 מ"ר משטח הבנייה לשטח הגינה.' },
  onDone: function () {
    practiceProgress.questions[3].state = (viqState.s2p5 && viqState.s2p5.outcome === 'fail') ? 'incorrect' : 'correct';
    syncPracticeProgressNav(document.getElementById('s2'));
    document.getElementById('s2-continue').disabled = false;
  }
});
function s2P5OnInput() { viqOnInput('s2p5'); }
function s2P5Check() { viqCheck('s2p5'); }
function s2P5HintOpen() { document.getElementById('s2-p5-hint-overlay').hidden = false; }
function s2P5HintClose() { document.getElementById('s2-p5-hint-overlay').hidden = true; }

/* מסתיר/משחזר את דיאגרמת-המגרש הקבועה, ומרחיב/מצמצם בהתאם את עמודת-
   הגלילה (כדי שתמונת חלק-הביניים תוכל להיראות רחבה יותר בלי ה"חור"
   הריק שדיאגרמת-המגרש הייתה תופסת) — ראו ARCHITECTURE.md § "מסך 3"
   לתיעוד המלא של השיקול (למה visibility ולא display, ולמה הרחבת-
   העמודה השלמה ולא bleed עם margin שלילי). */
function s2HideDiagramForInterlude() {
  const wrap = document.getElementById('s2-fixed-images');
  if (wrap) wrap.style.visibility = 'hidden';
  const scrollArea = document.getElementById('s2-scroll-area');
  if (scrollArea) scrollArea.classList.add('s2-full-width');
}
function s2RestoreDiagram() {
  const wrap = document.getElementById('s2-fixed-images');
  if (wrap) wrap.style.visibility = 'visible';
  const scrollArea = document.getElementById('s2-scroll-area');
  if (scrollArea) scrollArea.classList.remove('s2-full-width');
}

/* ⚠️ הוסרה s2ShowPart (20.08.2026, לפי בקשה מפורשת) — כל 5 החלקים
   גלויים תמיד (index.html, hidden הוסר). resetScreenState2 כבר קורא
   ל-s2MaybeShowScrollGesture ישירות. s2HideDiagramForInterlude/
   s2RestoreDiagram נשארו (תוכן, לא גלילה) — עדיין מופעלות מאותן
   נקודות בדיוק (סיום-בדיקת-סעיף-ב', לחיצה על "המשך" בחלק-הביניים). */
let s2ProgrammaticScroll = false;

let s2GestureShown = false;
function s2HideGestureOnScroll() {
  const scrollArea = document.getElementById('s2-scroll-area');
  const gesture = document.getElementById('s2-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s2ProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s2HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}
/* QA 19.08.2026: לא מוצג עוד ללא-תנאי — רק אם יש בפועל מה לגלול
   (scrollHeight>clientHeight) באותו רגע. נקראת שוב מתוך s2ShowPart
   בכל חשיפת-חלק חדש. */
function s2MaybeShowScrollGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
  requestAnimationFrame(function () {
  if (s2GestureShown) return;
  const gesture = document.getElementById('s2-scroll-gesture');
  const scrollArea = document.getElementById('s2-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s2GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s2HideGestureOnScroll, { once: true });

  });}

/* resetScreenState2 — מחשב איזו שאלה (0-3) צריכה להיות "נוכחית" בעת
   חזרה למסך (למשל דרך "חזרה" ממסך 2), על סמך אילו שאלות כבר נפתרו —
   הכללה של הדפוס החד-תנאי ב-resetScreenState5 של סיין 3 (שם היה רק
   "שאלה 1 נפתרה? כן/לא") ל-4 שאלות ברצף. אין צורך "לאפס" חשיפת-חלקים
   (hidden) או state של viqState/scqState בכלל — ה-DOM (data-attributes/
   disabled/hidden) וה-JS state נשארים כפי שהם לאורך כל חיי העמוד, לפי
   אותה מוסכמה בדיוק כמו כל מסכי-הגלילה מרובי-החלקים בפרויקט הזה. */
function resetScreenState2() {
  let idx = 0;
  for (let i = 0; i < practiceProgress.questions.length; i++) {
    const st = practiceProgress.questions[i].state;
    if (st === 'correct' || st === 'incorrect') {
      idx = Math.min(i + 1, practiceProgress.questions.length - 1);
    } else {
      break;
    }
  }
  setCurrentQuestion(practiceProgress, idx);
  syncPracticeProgressNav(document.getElementById('s2'));
  s2MaybeShowScrollGesture();
  s2WireDiagramScroll();
  /* ⚠️ נדחה ל-requestAnimationFrame — בשלב הזה המסך עדיין display:none
     (goTo קוראת ל-resetScreenState *לפני* target.classList.add('active')),
     אז getBoundingClientRect היה מחזיר הכל 0. אותה גותצ'ה כמו
     s5UpdatePhotoByScroll ב-methodica-math-ratio-01-05-03. */
  requestAnimationFrame(s2MaybeRestoreDiagram);
}

/* אתחול */
scaleApp();
/* QA 19.08.2026: s2-p1/p2/p4/p5-feedbox הפכו ל-.is-static — מסך s2
   (היחיד עם שאלות בסיין הזה) הוא מסך-גלילה. אין יותר קריאות
   scqFbMakeDraggable בקובץ הזה. */
(function () {
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
})();
