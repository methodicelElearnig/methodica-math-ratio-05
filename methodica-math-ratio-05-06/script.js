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

/* ⚠️ עודכן (07.09.2026, לפי בקשה מפורשת) — 3→6: מסך 3 (הישן) פוצל
   ל-3 מסכים (א+ב, תמונה, ג+ד), ונוסף מסך-סיום ריק בסוף. */
const TOTAL_SCREENS = 6;
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
   _global-components.md → "Progress Question"). מועתק כפי-שהוא מסיין 3.
   שימוש יחיד כאן: 4 פריטים (סעיפים א/ב/ג/ד), כולם על אותו מסך פיזי
   יחיד (data-screen="2") — לא כמו בסיינים 1/3, ששם כל שאלה חיה על מסך
   נפרד משלה. ראו resetScreenState2()/setCurrentQuestion() למטה לאופן
   שבו זה מוכלל לתרחיש "כמה שאלות על מסך-גלילה אחד".
   ========================================================= */
/* ⚠️ עודכן (07.09.2026, לפי בקשה מפורשת: "יש 4 סעיפים של שאלה, צריך
   שיהיו 4 שאלות על סרגל ההתקדמות, לא משנה שיש שבירה במסך 4") —
   4 השאלות (א/ב/ג/ד) חזרו למונה-גלובלי-משותף אחד, בדיוק כמו לפני
   הפיצול למסכים — רק שעכשיו יש **שני** מופעי-nav (#s2-progress במסך
   3, #s4-progress במסך 5) שמסונכרנים לאותו state יחיד, לא שני
   state-ים נפרדים. ראו syncBothProgressNavs() למטה. */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 2 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 4 },
    { number: 4, visited: false, state: 'not-answered', screen: 4 }
  ]
};
/* מסנכרן את שני מופעי ה-progress-nav (מסך 3 + מסך 5) לאותו
   practiceProgress גלובלי בבת-אחת — נקרא במקום syncPracticeProgressNav
   בודד בכל נקודה שבה שאלה כלשהי (א/ב/ג/ד) משנה state, כדי ששני
   המסכים תמיד עקביים זה עם זה גם אם המבקר עדיין לא ביקר באחד מהם. */
function syncBothProgressNavs() {
  syncPracticeProgressNav(document.getElementById('s2'));
  syncPracticeProgressNav(document.getElementById('s4'));
}

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
    titleEl.innerHTML = VIQ_PENDING_FEEDBACK.title;
    bodyEl.innerHTML = VIQ_PENDING_FEEDBACK.body;
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
    titleEl.innerHTML = cfg.wrongFinal.title;
    bodyEl.innerHTML = cfg.wrongFinal.body;
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
    titleEl.innerHTML = VIQ_PENDING_FEEDBACK.title;
    bodyEl.innerHTML = VIQ_PENDING_FEEDBACK.body;
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
   מסך 3 — מסך גלילה, "שאלת השיא" סעיפים א+ב (שקפים 64/65), data-screen="2",
   id="s2". דיאגרמת המגרש (land-plot-diagram.png) קבועה וזהה בשני
   הסעיפים.
   ⚠️ עודכן (07.09.2026, לפי בקשה מפורשת) — הפוצל ל-3 מסכים (ראו
   ARCHITECTURE.md § "מסך 3", עדכון 07.09.2026): חלק-הביניים התמונתי
   (שקף 66) עבר למסך 4 (id="s3") משלו, וסעיפים ג/ד (שקפים 67/68) עברו
   למסך 5 (id="s4"). s2HideDiagramForInterlude/s2RestoreDiagram/
   s2MaybeRestoreDiagram/s2WireDiagramScroll הוסרו כליל — היו קיימים
   רק כי חלק-הביניים חי באותה עמודת-גלילה כמו הדיאגרמה; זה כבר לא
   המצב.
   ========================================================= */
/* ⚠️ תוקן (07.09.2026, דיווח: "מסך 3 סעיף א' צריך לתקן את המסומן")
   — "מ"ר" ישב כטקסט-רגיל *מחוץ* ל-dir="ltr" שעוטף את המשוואה
   ("200 + 16 = 216"). תבנית א' ב-"ניסוח מתמטי.md" (השורש-של-היחידה):
   dir="rtl" מקונן סביב "216 מ"ר" (סדר-מקור מספר-ואז-יחידה), בתוך
   ה-dir="ltr" החיצוני שנשאר כמו שהוא. "שטח החלקה כולה הוא" (הטקסט-
   המוביל) לא נגעתי בו — לא סומן בדיווח. */
VIQ_CFG_REGISTER('s2p1', {
  inputs: ['s2-p1-input'], correct: [216], checkBtn: 's2-p1-check', feedbox: 's2-p1-feedbox', revealBtn: 's2-p1-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'היחס בין AB ל-AE הוא 2 : 1, לכן <span dir="ltr">AE = 10</span>.<br>נחשב את שטח המלבן AEDB:<br><span dir="ltr"> 20 ⋅ 10 = 200</span>.<br>נחשב את שטח הריבוע GHCD:<br><span dir="ltr"> 4 ⋅ 4 = 16</span>.<br>שטח החלקה כולה הוא <span dir="ltr">200 + 16 = <span dir="rtl">216 מ"ר</span></span>.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'היחס בין AB ל-AE הוא 2 : 1, לכן <span dir="ltr">AE = 10</span>.<br>נחשב את שטח המלבן AEDB:<br><span dir="ltr"> 20  ⋅10 = 200</span>.<br>נחשב את שטח הריבוע GHCD:<br><span dir="ltr"> 4 ⋅ 4 = 16</span>.<br>שטח החלקה כולה הוא <span dir="ltr">200 + 16 = <span dir="rtl">216 מ"ר</span></span>.' },
  onDone: function () {
    practiceProgress.questions[0].state = (viqState.s2p1 && viqState.s2p1.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 1);
    syncBothProgressNavs();
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
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'ידוע כי מ\' <span dir="ltr">AB = 20</span>. היחס בין AT ל-TB הוא 3 : 2.<br>נחשב את AT: <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">5</span></span> ⋅ 20 = 8</span>,<br>לכן שטח הגינה הוא <span dir="ltr"> 10 ⋅ 8 = 80</span>.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'ידוע כי מ\' <span dir="ltr">AB = 20</span>. היחס בין AT ל-TB הוא 3 : 2.<br>נחשב את AT: <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">5</span></span> ⋅ 20 = 8</span>,<br>לכן שטח הגינה הוא <span dir="ltr"> 10 ⋅ 8 = 80</span>.' },
  onDone: function () {
    practiceProgress.questions[1].state = (viqState.s2p2 && viqState.s2p2.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 2);
    syncBothProgressNavs();
    /* ⚠️ נוסף (07.09.2026) — ב' הוא הסעיף האחרון על מסך 3 (ג/ד עברו
       למסך 5), אז כפתור "המשך" נדלק כאן. */
    document.getElementById('s2-continue').disabled = false;
  }
});
function s2P2OnInput() { viqOnInput('s2p2'); }
function s2P2Check() { viqCheck('s2p2'); }
function s2P2HintOpen() { document.getElementById('s2-p2-hint-overlay').hidden = false; }
function s2P2HintClose() { document.getElementById('s2-p2-hint-overlay').hidden = true; }

/* =========================================================
   מסך 5 — מסך גלילה, "שאלת השיא" סעיפים ג+ד (שקפים 67/68), data-screen="4",
   id="s4". דיאגרמת המגרש (land-plot-diagram.png) — מופע-עצמאי-משלה
   (לא משותפת עם מסך 3), קבועה וזהה בשני הסעיפים. ⚠️ נוסף (07.09.2026,
   לפי בקשה מפורשת) — הועבר ממסך 3 (s2) הישן, ראו ההערה שם. */
VIQ_CFG_REGISTER('s2p4', {
  inputs: ['s2-p4-input'], correct: [26], checkBtn: 's2-p4-check', feedbox: 's2-p4-feedbox', revealBtn: 's2-p4-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1.<br>נחשב את השטח המיועד לבנייה לפי היחס המבוקש:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> ⋅ 216 = 162</span><br>ואת השטח המיועד לגינה: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span>  ⋅216 = 54</span>.<br>שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר.<br>לכן, עלינו להעביר <span dir="ltr">80 - 54 = 26</span> מ"ר לשטח המיועד לבנייה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1.<br>נחשב את השטח המיועד לבנייה לפי היחס המבוקש:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> ⋅ 216 = 162</span><br>ואת השטח המיועד לגינה: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span> ⋅ 216 = 54</span>.<br>שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר.<br>לכן, עלינו להעביר <span dir="ltr">80 - 54 = 26</span> מ"ר לשטח המיועד לבנייה.' },
  onDone: function () {
    practiceProgress.questions[2].state = (viqState.s2p4 && viqState.s2p4.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 3);
    syncBothProgressNavs();
  }
});
function s2P4OnInput() { viqOnInput('s2p4'); }
function s2P4Check() { viqCheck('s2p4'); }
function s2P4HintOpen() { document.getElementById('s2-p4-hint-overlay').hidden = false; }
function s2P4HintClose() { document.getElementById('s2-p4-hint-overlay').hidden = true; }

/* ⚠️ תוקן (07.09.2026, דיווח: "אותה טעות חוזרת על עצמה במשוב", סעיף ד')
   — "מ"ר" ישב כטקסט-רגיל *מחוץ* ל-dir="ltr" שעוטף את המשוואה
   ("216 : 2 = 108"/"108 - 80 = 28"), אותה סיבה בדיוק שתועדה כבר
   ב-methodica-math-ratio-05-03/script.js § s5p2 ו-methodica-math-
   ratio-05-05/script.js § VIQ_CFG_S2_BODY (עדכון-מקביל, אותו יום):
   נוסף dir="rtl" מקונן סביב "108 מ"ר"/"28 מ"ר" (סדר-מקור מספר-ואז-
   יחידה), בתוך ה-dir="ltr" החיצוני שנשאר כמו שהוא. */
VIQ_CFG_REGISTER('s2p5', {
  inputs: ['s2-p5-input'], correct: [28], checkBtn: 's2-p5-check', feedbox: 's2-p5-feedbox', revealBtn: 's2-p5-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח הגינה כולה הוא 216 מ"ר.<br>אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים.<br>לכן, שטח הבנייה ושטח הגינה יהיו:<br><span dir="ltr">216 : 2 = <span dir="rtl">108 מ"ר</span></span>.<br>שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר <span dir="ltr">108 - 80 = <span dir="rtl">28 מ"ר</span></span> משטח הבנייה לשטח הגינה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח הגינה כולה הוא 216 מ"ר.<br>אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים.<br>לכן, שטח הבנייה ושטח הגינה יהיו:<br><span dir="ltr">216 : 2 = <span dir="rtl">108 מ"ר</span></span>.<br>שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר <span dir="ltr">108 - 80 = <span dir="rtl">28 מ"ר</span></span> משטח הבנייה לשטח הגינה.' },
  onDone: function () {
    practiceProgress.questions[3].state = (viqState.s2p5 && viqState.s2p5.outcome === 'fail') ? 'incorrect' : 'correct';
    syncBothProgressNavs();
    document.getElementById('s4-continue').disabled = false;
  }
});
function s2P5OnInput() { viqOnInput('s2p5'); }
function s2P5Check() { viqCheck('s2p5'); }
function s2P5HintOpen() { document.getElementById('s2-p5-hint-overlay').hidden = false; }
function s2P5HintClose() { document.getElementById('s2-p5-hint-overlay').hidden = true; }

/* ⚠️ הוסרה s2ShowPart (20.08.2026, לפי בקשה מפורשת) — כל החלקים
   גלויים תמיד (index.html, hidden הוסר). resetScreenState2 כבר קורא
   ל-s2MaybeShowScrollGesture ישירות. */
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
/* ⚠️ עודכן (07.09.2026) — מחושב עכשיו כנגד ה-practiceProgress המשותף
   המלא (4 שאלות), לא מערך-נפרד-לכל-מסך, ומסנכרן את שני ה-nav-ים
   (syncBothProgressNavs) — כדי ששני המסכים (3+5) תמיד יראו את אותו
   מצב-אמת, גם אם המבקר טרם ביקר באחד מהם. */
function syncPracticeProgressCurrent() {
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
  syncBothProgressNavs();
}

function resetScreenState2() {
  syncPracticeProgressCurrent();
  s2MaybeShowScrollGesture();
}

/* =========================================================
   מסך 4 — תמונה ממלאת-מסך + תגית-מידע, data-screen="3", id="s3". מסך
   סטטי לחלוטין — בלי שאלה, בלי state לאפס. ⚠️ נוסף (07.09.2026), אותו
   דפוס בדיוק כמו resetScreenState1 (מסך 2, id="s1").
   ========================================================= */
function resetScreenState3() {
  /* אין state לאפס — מסך תמונה+כרטיס-מידע סטטי בלבד. */
}

/* ⚠️ נוסף (07.09.2026) — Gesture Hint (Cursor Scroll) למסך 5 (id="s4"),
   אותו מנגנון בדיוק כמו s2MaybeShowScrollGesture/s2HideGestureOnScroll
   למעלה, רק ממוקד ל-#s4-scroll-area/#s4-scroll-gesture. */
let s4ProgrammaticScroll = false;
let s4GestureShown = false;
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
function s4MaybeShowScrollGesture() {
  requestAnimationFrame(function () {
  if (s4GestureShown) return;
  const gesture = document.getElementById('s4-scroll-gesture');
  const scrollArea = document.getElementById('s4-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s4GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s4HideGestureOnScroll, { once: true });

  });}

/* resetScreenState4 — אותו דפוס בדיוק כמו resetScreenState2 (למעלה),
   כנגד אותו practiceProgress משותף (לא מערך-נפרד). */
function resetScreenState4() {
  syncPracticeProgressCurrent();
  s4MaybeShowScrollGesture();
}

/* =========================================================
   מסך 6 — מסך-סיום, מסך מעבר (TransitionScreen), data-screen="5",
   id="s5". ⚠️ תוקן (07.09.2026, לפי בקשה מפורשת: "מסך אחרון בסיין 6
   צריך להיות מסך מעבר, אפשר להעתיק ממסך ראשון באותו סיין") — הוחלף
   הפלייסהולדר-הריק (מ-07.09.2026 המוקדם יותר, ראו למעלה) במבנה זהה
   ל-מסך 1 (`s0`, `.transition-content`/`.transition-title-block`/
   `.transition-avatar-wrap`) — בלי `.transition-bubble` (לא סופק
   טקסט-בועית בבקשה). `.transition-sub`/`.transition-title` הגלובליים
   כבר בדיוק 28px-רגיל/40px-בולד, לפי הבקשה — לא נדרשה שום דריסת-CSS.
   ⚠️ תוקן שוב (07.09.2026, המשך) — הנכס הראשון שסופק לדמות הצהובה
   היה בטעות תמונה סטטית (Yellow_happy.png, לא וידאו), מה שחייב מנגנון
   video+img כפול חריג; סופק וידאו אמיתי חלופי (yellow-avatar-jumping
   (1).mp4) — חזרה למנגנון הסטנדרטי-והפשוט של הפרויקט: אלמנט `<video>`
   יחיד + `resolveCharBubbleVideo()` הגלובלי, אותו דפוס בדיוק כמו
   S0_AVATAR_ASSETS/resetScreenState0 למעלה. */
const S5_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-jumping-happily.mp4',
  'character-2': 'assets/videos/yellow-avatar-jumping (1).mp4'
};
function resetScreenState5() {
  resolveCharBubbleVideo('s5-avatar', S5_AVATAR_ASSETS);
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
