'use strict';

/* =========================================================
   לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 4
   מנוע גלובלי — canvas scaling, ניווט מסכים, סטייט גלובלי.
   TOTAL_SCREENS יעודכן ל-1+ עם הוספת כל מסך תוכן אמיתי (Prompt 2+).

   מקור: הועתק/הותאם מהמנוע הגלובלי של סיין 2 (methodica-math-ratio-01-02)
   של הפרויקט הזה עצמו — סיין 2 הוא כרגע מקור-האמת המתודולוגי המאומת/
   מתוקן ביותר בפרויקט. ראו ARCHITECTURE.md לפירוט מלא.
   ========================================================= */

const TOTAL_SCREENS = 3;
let currentScreen = 0;

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md). מפתח האחסון
   זהה בכוונה לזה של סיינים 1+2 ('math-ratio-01_selectedCharacter', לא
   'math-ratio-01-04_...') — הוא מתויג ברמת ה-**יעד/יחידה**, לא ברמת
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
  /* כל מסך תוכן אמיתי שנוסף מקבל כאן שורת if (n === X) resetScreenStateX();
     משלו, ומגדיר את הפונקציה resetScreenStateX() ליד קטע ה-HTML/JS של
     המסך — לפי אותה מוסכמה בדיוק כמו סיינים 1+2. */
  if (n === 0) resetScreenState0();
  if (n === 1) resetScreenState1();
  if (n === 2) resetScreenState2();
}

/* =========================================================
   מסך 1 — מסך מעבר, data-screen="0", id="s0". שקף 51. דמות-נלווית
   לפי הדמות שנבחרה בסיין 1 — אין וידאו ייעודי-לתוכן ("סיימנו
   תרגול, זמן ללמוד אחרת") בנכסים, נבחרו אותן שתי פוזות שכבר שימשו
   למסכי-מעבר קודמים בפרויקט הזה (חשיבה/שאילה) — לא אושר מול המפיקה.
   ========================================================= */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-thinking.mp4',
  'character-2': 'assets/videos/yellow-avatr-asking.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסך 2 — משימת כיתה, הוראות בלבד (data-screen="1", id="s1"). אין
   בדיקת נכון/שגוי — מסך מידע/הנחיות בלבד, כפתור ההמשך תמיד פעיל
   (מאומת מול methodica-science-mass-measure-03-03, הערת-קוד מקורית
   שם: "בלי בדיקת נכון/שגוי... כפתור ההמשך תמיד פעיל"). אותה מערכת-
   דמות-נלווית, נכסים זהים לאלה של מסך 1 (אין פוזה ייעודית "מתבונן/ת
   בסביבה" בנכסים הקיימים).
   ========================================================= */
const S1_CHAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-thinking.mp4',
  'character-2': 'assets/videos/yellow-avatr-asking.mp4'
};
function resetScreenState1() {
  resolveCharBubbleVideo('s1-char-img', S1_CHAR_ASSETS);
}
function s1Continue() { goTo(2); }

/* =========================================================
   מסך 3 — המשך משימת הכיתה: קלט פתוח בלי תשובה-נכונה (data-screen="2",
   id="s2"). ⚠️ אין תקדים לרכיב הזה בפרויקט-אחות (נבדק ולא נמצא) —
   שער-ההפעלה היחיד לכפתור "המשך" הוא "כל 6 השדות מלאים" — אין שום
   בדיקת-נכונות, אין משוב, אין .correct/.wrong. זו בכוונה: אלה נתוני-
   אמת אישיים של הלומד/ת (מה שספרו בפועל בכיתה/בית-הספר), לא תרגיל עם
   תשובה יחידה נכונה.
   ========================================================= */
const S2_OPEN_INPUT_IDS = ['s2-obj-1', 's2-obj-2', 's2-ratio1-a', 's2-ratio1-b', 's2-ratio2-a', 's2-ratio2-b'];
function s2OnInput() {
  const allFilled = S2_OPEN_INPUT_IDS.every(function (id) {
    return document.getElementById(id).value.trim() !== '';
  });
  document.getElementById('s2-continue').disabled = !allFilled;
}
const S2_CHAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-thinking.mp4',
  'character-2': 'assets/videos/yellow-avatr-asking.mp4'
};
function resetScreenState2() {
  resolveCharBubbleVideo('s2-char-img', S2_CHAR_ASSETS);
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
   GLOBAL — Feedback popup: drag + clamp (_global-components.md).
   CSS ready (.scq-fb-box), JS ready — no instance yet (no question
   screen exists). scqFbMakeDraggable(boxId) no-ops safely if the id
   doesn't exist yet (getElementById guard), so it's safe to keep here
   unused until the first real question screen calls it.
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
resetScreenState(0);
