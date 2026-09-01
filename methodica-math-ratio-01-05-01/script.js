'use strict';

/* =========================================================
   לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 1
   מנוע גלובלי — canvas scaling, ניווט מסכים, סטייט גלובלי.
   TOTAL_SCREENS יעודכן ל-1+ עם הוספת כל מסך תוכן אמיתי (Prompt 2+).

   מקור: הועתק/הותאם מהמנוע הגלובלי של
   methodica-science-mass-measure-03-01 (720 מדעים, יעד 3, סיין 1),
   עם תיקון closeAllPopupsAndHints() (ראו למטה) לפי החלטת הפרויקט
   (סיכום-תהליך-בניית-הלומדה.md §0.3) — ראו ARCHITECTURE.md לפירוט מלא.
   ========================================================= */

const TOTAL_SCREENS = 7;
let currentScreen = 0;

/* ⚠️ נוסף (30.08.2026) — ניווט בין-סיינים: כפתור "המשך" במסך האחרון
   של סיין קודם מוביל הנה בלי פרמטר, ופותח כרגיל במסך הראשון (ברירת-
   המחדל הקיימת ב-HTML, "class active" על data-screen="0"). כפתור
   "חזרה" מהסיין הבא (methodica-math-ratio-01-02) מוביל הנה עם
   ?screen=last — נפתח ישר במסך האחרון במקום. script.js נטען בסוף
   ה-body (אחרי כל ה-.screen sections), אז אפשר לקרוא ל-goTo באופן
   סינכררוני כאן, בלי לחכות ל-DOMContentLoaded/load. */
if (new URLSearchParams(location.search).get('screen') === 'last') {
  goTo(TOTAL_SCREENS - 1);
}

/* ---------- Companion character system — state + storage key ----------
   ID לוגי (character-1/character-2), לא צבע/שם, לפי Companion character
   system (720-templates skill, _global-components.md) + החלטת הפרויקט
   (§0.4). מפתח האחסון מתויג ללומדה זו כדי שלא ידרוס/יידרס ע"י לומדה 720
   אחרת שנטענת מאותו origin. */
const CHARACTER_STORAGE_KEY = 'math-ratio-01_selectedCharacter';
const KNOWN_CHARACTER_IDS = ['character-1', 'character-2'];

/* כל סיין הוא מסמך HTML נפרד לחלוטין — window.lomdaState לא "עובר" בין
   הסינים בטעינת עמוד מלאה, לכן הבחירה נשמרת גם ב-localStorage, ונקראת
   בחזרה כאן כדי לשחזר גם רענון של מסך 1 עצמו אחרי שכבר נבחרה דמות (לא
   רק בסינים מאוחרים יותר) — לפי החוזה המומלץ ב-_global-components.md.
   ערך שמור שאינו אחד משני ה-ID-ים הידועים (למשל שארית מסכמה ישנה/
   שונה) נופל בחזרה ל-null במקום להיחשב תקף, לפי אותו חוזה מומלץ.
   try/catch: בפתיחה מ-file:// חלק מהדפדפנים (ולמשל jsdom) חוסמים גישה
   ל-localStorage עם SecurityError — בלי ה-try/catch, חריגה כאן הייתה
   עוצרת את טעינת כל script.js. */
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

/* ---------- closeAllPopupsAndHints() — bug-fixed version ----------
   לפי סיכום-תהליך-בניית-הלומדה.md §0.3: קורא לפעולת-הסגירה האמיתית
   שכל רכיב-רכיב עצמו משתמש בה כדי להסתיר את עצמו —
   - פופ-אפ משוב (id מסתיים ב-"-feedbox", class .scq-fb-box): נסגר
     בפועל ע"י classList.remove('visible') (ראו .scq-fb-box.visible
     ב-styles.css) — לא class גנרי "hidden".
   - הצצת-רמז (id מסתיים ב-"-hint-overlay", class .scq-hint-overlay):
     נסגרת בפועל ע"י הגדרת התכונה הילידית hidden=true (ראו
     .scq-hint-overlay[hidden] ב-styles.css) — גם כאן לא class "hidden".
   זו בדיוק אותה מנגנון-סגירה שכל מסך-תוכן ישתמש בו בעצמו (ראו למשל
   viqCheck/s8CloseHint וכו' בפרויקטי המדעים) — הפונקציה הזו רק מריצה
   אותו גורף, לכל הרכיבים הגלויים, לפני מעבר מסך. גנרית מספיק כדי
   להמשיך לעבוד ברגע שמסכי תוכן אמיתיים (עם feedbox/hint-overlay
   בפועל) יתווספו בהמשך. */
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
     המסך — לפי אותה מוסכמה בדיוק כמו בפרויקטי המדעים. */
  if (n === 0) resetScreenState0();
  if (n === 1) resetScreenState1();
  if (n === 2) resetScreenState2();
  if (n === 3) resetScreenState3();
  if (n === 4) resetScreenState4();
  if (n === 5) resetScreenState5();
  if (n === 6) resetScreenState6();
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
   מסך 1 — בחירת דמות מלווה (TwoOptionSelection), data-screen="0", id="s0"
   הועתק ממסך 1 (s0) של methodica-science-mass-measure-03-01. שומר את
   הבחירה ב-window.lomdaState.selectedCharacter + localStorage
   (CHARACTER_STORAGE_KEY, מוגדר למעלה) — לפי Companion character system
   (720-templates skill). "המשך" (advanceFromS0) קורא ל-goTo(1): no-op
   בטוח כרגע (TOTAL_SCREENS=1, אין עדיין מסך 2) — יתחבר בפועל כשמסך
   התוכן הבא ייבנה ו-TOTAL_SCREENS יעודכן.
   ========================================================= */
function resetScreenState0() {
  // תמיד מסנכרן את ה-UI מ-window.lomdaState.selectedCharacter (לא "פעם
  // אחת בלבד") — כך חזרה למסך זה אחרי בחירה משקפת נכון את המצב הקיים.
  const chosen = window.lomdaState.selectedCharacter;
  document.querySelectorAll('#s0 .option-card').forEach(function (c) {
    const isChosen = c.dataset.value === chosen;
    c.classList.toggle('selected', isChosen);
    c.setAttribute('aria-checked', isChosen ? 'true' : 'false');
  });
  const btn = document.getElementById('s0-continue');
  if (btn) btn.disabled = !chosen;
}

function selectOption(cardEl) {
  document.querySelectorAll('#s0 .option-card').forEach(function (c) {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');
  window.lomdaState.selectedCharacter = cardEl.dataset.value;
  // try/catch: ראו הערה למעלה על SecurityError/opaque origin — שמירת
  // ההעדפה בין הסינים היא nice-to-have, אין להפיל את המסך אם היא נכשלת.
  try { localStorage.setItem(CHARACTER_STORAGE_KEY, cardEl.dataset.value); } catch (e) {}
  const btn = document.getElementById('s0-continue');
  if (btn) btn.disabled = false;
}

function handleCardKey(event, cardEl) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectOption(cardEl);
  }
}

function advanceFromS0() {
  if (!window.lomdaState.selectedCharacter) return;
  goTo(1);
}

/* =========================================================
   מסך 2 — אולימפיאדת המדעים (מסך גלילה מותאם), data-screen="1", id="s1"
   "מסך לא בתבנית" (הערת מפיקה בתסריט, שקפים 4-6). שלוש שאלות חד-ברירה
   עצמאיות (q1: 2 מסיחים, q2: 3 מסיחים, q3: 2 מסיחים עם נימוק) בתוך
   אזור גלילה יחיד — כל שאלה מוסתרת עד שהקודמת לה נענתה ("עולות בזו אחר
   זו"). משוב מוטבע (לא הפופ-אפ הצף הגלובלי — ראו הערה ב-styles.css §
   "מסך 2"), נשאר על המסך לצמיתות (בלי כפתור סגירה, לפי "No manual
   close") — לא מוסתר בניווט כמו הפופ-אפ הצף, כי הוא חלק מ-state המסך
   עצמו (resume-state), לא שכבה שצריכה להיסגר לפני מעבר מסך. ראו
   ARCHITECTURE.md § "מסך 2" לפירוט מלא + הנחות שדורשות אישור (טקסט
   המשוב ל-q2, לא מופיע מילולית בתסריט).
   ========================================================= */
const s1State = {
  q1: { selected: null, done: false },
  q2: { selected: null, done: false },
  q3: { selected: null, done: false }
};

let s1Jumping = false;
let s1CurrentPage = 0;

/* קפיצת-עמוד בהשראת s16GoToPage/s16InitScrollJump (mass-measure-03,
   מסך 17) — מותאם: "עמודים" הם רק ה-.oly-question שגלויים בפועל כרגע
   (q2 עדיין hidden בהתחלה), לא כל ה-.oly-question שקיימים ב-DOM. */
function s1VisiblePages() {
  return Array.from(document.querySelectorAll('#s1-scroll-area .oly-question')).filter(function (el) {
    return !el.hidden;
  });
}

function s1GoToPage(index) {
  const pages = s1VisiblePages();
  if (index < 0 || index >= pages.length || s1Jumping || index === s1CurrentPage) return;
  s1Jumping = true;
  s1CurrentPage = index;
  const scrollArea = document.getElementById('s1-scroll-area');
  if (scrollArea) {
    /* QA 20.08.2026: ראו ההערה המלאה ליד s1MaybeShowScrollGesture —
       הדגל הזה מבדיל את הגלילה-היזומה-הזו מגלילה אמיתית של הלומד/ת. */
    s1GestureProgrammaticScroll = true;
    setTimeout(function () { s1GestureProgrammaticScroll = false; }, 700);
    scrollArea.scrollTo({ top: pages[index].offsetTop, behavior: 'smooth' });
  }
  setTimeout(function () { s1Jumping = false; }, 500);
}

/* ⚠️ תוקן (16.08.2026) — הוסר ה-wheel listener שהוסיף e.preventDefault()
   ללא-תנאי על כל טיק-גלגלת (גם כשלא בוצעה קפיצת-עמוד בפועל). זה חסם
   לחלוטין גלילה טבעית בתוך שאלה שגבוהה מהחלון הגלוי (בדיוק המצב שדווח:
   "הגלילה לא עובדת בכלל"). אזור הגלילה גולל עכשיו באופן טבעי (עכבר/
   מגע/פס-גלילה) דרך overflow-y:auto רגיל בלבד. קפיצת-העמוד
   (s1GoToPage) נשארת ככלי-נוחות: מקלדת (למטה) + קריאה יזומה מה-JS
   ברגע ששאלה חדשה נחשפת (olyQ1Check/olyQ2Check), לא עוד hijack של
   הגלגלת. */
function s1InitScrollJump() {
  const scrollArea = document.getElementById('s1-scroll-area');
  if (!scrollArea || scrollArea.dataset.jumpInit) return;
  scrollArea.dataset.jumpInit = 'true';
  scrollArea.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); s1GoToPage(s1CurrentPage + 1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); s1GoToPage(s1CurrentPage - 1); }
  });
}

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7). מוצג פעם אחת בכל
   כניסה למסך (s1GestureShown הוא flag ברמת-מודול, לא resume-state
   מתמשך — טעינה מחדש של הדף מציגה שוב, תואם את שאר מנגנוני ה-resume
   בפרויקט). נעלם ברגע גלילה אמיתית — כאן זה אירוע ה-`scroll` הנייטיבי
   (לא רק wheel/keydown כמו במקור ב-mass-measure-03-01): מכסה גם גלילת
   מגע וגם גרירת פס-הגלילה בעכבר, לא רק שני הטריגרים שהמקור בדק. */
let s1GestureShown = false;
/* QA 20.08.2026: הרמז היה נעלם כמעט-מיד אחרי שהוצג, בפועל "חסר"
   ללומד/ת — שורש-הבאג: המאזין החד-פעמי ({once:true}) לא הבחין בין
   גלילה אמיתית של הלומד/ת לגלילה **פרוגרמטית** שנגרמת מ-`s1GoToPage`
   (נקראת מיד אחרי olyQ1Check/olyQ2Check כדי לגלול לשאלה הבאה) —
   `scrollTo({behavior:'smooth'})` מפיק אירוע `scroll` נייטיבי, בדיוק
   כמו גלילה אמיתית, אז המאזין הסתיר את הרמז לפני שהלומד/ת בכלל גלל/ה
   בעצמו/ה. תוקן באותו דפוס בדיוק כמו s2/s3/s5-MaybeShowScrollGesture
   בשאר הסינים: דגל `s1GestureProgrammaticScroll` מודלק לפני כל
   `scrollTo` יזום-קוד (ראו s1GoToPage), ומאופס אוטומטית אחרי 700ms. */
let s1GestureProgrammaticScroll = false;
function s1MaybeShowScrollGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
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
function s1HideGestureOnScroll() {
  const scrollArea = document.getElementById('s1-scroll-area');
  const gesture = document.getElementById('s1-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s1GestureProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s1HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}

function olyOptKey(event, el) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    el.click();
  }
}

/* ⚠️ תוקן (16.08.2026) — משתמש עכשיו במופע .scq-fb-box אמיתי (גריר),
   לא בתיבה סטטית מוטבעת. scqFbResetPosition נקרא בכל פתיחה (גם
   פתיחה-מחדש בחזרה למסך) כדי לממש "resets to default position on
   every open", לפי _global-components.md → Feedback popup system. */
function olySetFeedback(feedboxEl, isCorrect, text) {
  scqFbResetPosition(feedboxEl.id);
  feedboxEl.querySelector('.scq-fb-title-text').textContent = text.title;
  /* QA 20.08.2026: הוחלף מ-textContent ל-innerHTML — לפי בקשה מפורשת
     לתקן הדגשות-בולד חסרות "גם במשובים". התסריט (שקף 6) כולל הדגשה-
     חלקית אמיתית בתוך גוף-משוב אחד (S1_Q3_FEEDBACK.wrong: "משלחת א'"
     בבולד, שאר המשפט רגיל) — טקסט קבוע-מראש בקוד (לא קלט-משתמש), אין
     סיכון-XSS. שינוי מקומי לפונקציה הזו בלבד (הספציפית למסך הזה) —
     לא נוגע ב-viqCheck/scqCheck הגנריים המשותפים לשאר הפרויקט. */
  feedboxEl.querySelector('.scq-fb-body').innerHTML = text.body;
  feedboxEl.classList.add('visible');
  feedboxEl.classList.toggle('is-correct', isCorrect);
  feedboxEl.classList.toggle('is-wrong', !isCorrect);
}

/* ⚠️ olyHideFeedback הוסרה (19.08.2026, לפי בקשה מפורשת שהופכת החלטה
   קודמת מ-17.08.2026): המדיניות הייתה "משוב-סעיף-קודם מוסתר ברגע
   שמתחילים לבחור בסעיף הבא" — עכשיו ההפך: משוב חייב להישאר מוצג על
   המסך (מתחת לשאלה שלו) גם אחרי מעבר לשאלה הבאה, זהה למדיניות
   שיושמה באותו יום בכל שאר מסכי-הגלילה-עם-שאלות בפרויקט. */

/* ⚠️ תוקן (19.08.2026, לפי בקשה מפורשת) — בתסריט המקורי (שקפים 4-5)
   שני הפידבקים (נכון/שגוי) הכילו פסקת-הסבר אחת משותפת לשני חלקי
   א'+ב' (מסומנת "א. .../ב. ..."), כי במקור הייתה תיבת-משוב אחת
   משותפת לשתי השאלות. אבל בפועל כל שאלה (א'/ב') מקבלת כאן תיבת-משוב
   עצמאית משלה (s1-q1-feedbox/s1-q2-feedbox) — הטקסט המשותף-במקור
   הועתק בטעות *במלואו* לתוך שתיהן (ראו S1_Q2_FEEDBACK למטה, שכבר
   נכתב-מחדש נכון), מה שגרם לשני באגים: (1) חשיפת תשובת שאלה ב' ("40
   משתתפות ומשתתפים") בתוך המשוב של שאלה א', לפני שהלומד/ת בכלל ניגש/ה
   אליה; (2) תוויות-אות מיותרות ("א."/"ב.") שאין בהן צורך כשלכל שאלה
   כבר יש תיבת-משוב נפרדת משלה. הושאר רק חלק א' (הרלוונטי לשאלה הזו
   בלבד), בלי תווית-אות. */
const S1_Q1_FEEDBACK = {
  correct: {
    title: 'נכון!',
    body: 'במשלחת ב\' ישנם יותר אנשים – כי על כל מדליה יש בה פי 2 יותר אנשים.'
  },
  wrong: {
    title: 'אופס, לא בדיוק, בואו נסביר',
    body: 'במשלחת ב\' ישנם יותר אנשים – כי על כל מדליה יש בה פי 2 יותר אנשים.'
  }
};

function olyQ1Select(cardEl) {
  if (s1State.q1.done) return;
  document.querySelectorAll('#s1-q1 .scq-opt').forEach(function (c) {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');
  s1State.q1.selected = cardEl.dataset.id;
  document.getElementById('s1-q1-check').disabled = false;
}

function olyQ1Check() {
  if (!s1State.q1.selected || s1State.q1.done) return;
  const isCorrect = s1State.q1.selected === 'b';
  document.querySelectorAll('#s1-q1 .scq-opt').forEach(function (c) {
    c.classList.add('disabled');
    if (c.dataset.id === 'b') c.classList.add('correct');
    else if (c.classList.contains('selected') && !isCorrect) c.classList.add('wrong');
  });
  olySetFeedback(document.getElementById('s1-q1-feedbox'), isCorrect, isCorrect ? S1_Q1_FEEDBACK.correct : S1_Q1_FEEDBACK.wrong);
  document.getElementById('s1-q1-check').disabled = true;
  s1State.q1.done = true;

  document.getElementById('s1-q2').hidden = false;
  s1MaybeShowScrollGesture();
  s1GoToPage(1);
}

/* ⚠️ הנחה — לא טקסט מילולי מהתסריט. התסריט לא כלל תיבת-משוב נפרדת
   לשאלה ב' (רק את הפידבק המשותף למעלה, שכבר חושף "40"). הטקסט כאן נגזר
   מאותו הסבר-יחס שכבר נמסר (פי 2 לכל מדליה: 5 מדליות זהב → 40), לא
   עובדה חדשה שהומצאה — לאשר מול המשתמשת לפני שהמסך נחשב סופי. */
const S1_Q2_FEEDBACK = {
  correct: {
    title: 'נכון!',
    body: 'במשלחת ב\' יש 40 משתתפות ומשתתפים — כי על כל מדליה יש בה פי 2 יותר אנשים: 5 מדליות זהב פי 2 שווה 40.'
  },
  wrong: {
    title: 'אופס, לא בדיוק, בואו נסביר',
    body: 'במשלחת ב\' יש 40 משתתפות ומשתתפים — כי על כל מדליה יש בה פי 2 יותר אנשים: 5 מדליות זהב פי 2 שווה 40.'
  }
};

function olyQ2Select(cardEl) {
  if (s1State.q2.done) return;
  document.querySelectorAll('#s1-q2 .scq-opt').forEach(function (c) {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');
  s1State.q2.selected = cardEl.dataset.id;
  document.getElementById('s1-q2-check').disabled = false;
}

function olyQ2Check() {
  if (!s1State.q2.selected || s1State.q2.done) return;
  const isCorrect = s1State.q2.selected === '40';
  document.querySelectorAll('#s1-q2 .scq-opt').forEach(function (c) {
    c.classList.add('disabled');
    if (c.dataset.id === '40') c.classList.add('correct');
    else if (c.classList.contains('selected') && !isCorrect) c.classList.add('wrong');
  });
  olySetFeedback(document.getElementById('s1-q2-feedbox'), isCorrect, isCorrect ? S1_Q2_FEEDBACK.correct : S1_Q2_FEEDBACK.wrong);
  document.getElementById('s1-q2-check').disabled = true;
  s1State.q2.done = true;

  document.getElementById('s1-q3').hidden = false;
  s1MaybeShowScrollGesture();
  s1GoToPage(2);
}

/* ⚠️ טקסט מוצג מדויק מהתסריט (שקף 6) — שני הפידבקים (נכון/שגוי) מכילים
   במקור את אותה פסקת הסבר, רק שורת הפתיחה שונה. הועתק כפי-שהוא. */
/* ⚠️ תוקן (20.08.2026, לפי בקשה מפורשת — בולד חסר מול התסריט) — נבדק
   ישירות מול ריצות-הבולד בפועל בשקף 6: גוף-המשוב "נכון" כולו רגיל
   (בלי שום בולד), אבל גוף-המשוב "שגוי" מדגיש חלקית רק את "משלחת א'"
   — לא אותו טקסט מוכפל-סתם, הבדל אמיתי בין שתי הגרסאות. */
const S1_Q3_FEEDBACK = {
  correct: {
    title: 'נכון!',
    body: 'משלחת א\' הציגה אחוז הצלחה גבוה יותר (יותר מדליות ביחס לגודל משלחת) כי אצלה כל 4 ספורטאים כבר זוכים במדליה (לעומת 8 במשלחת ב\').'
  },
  wrong: {
    title: 'אופס, לא בדיוק, בואו נסביר',
    body: '<strong>משלחת א\'</strong> הציגה אחוז הצלחה גבוה יותר (יותר מדליות ביחס לגודל משלחת) כי אצלה כל 4 ספורטאים כבר זוכים במדליה (לעומת 8 במשלחת ב\').'
  }
};

function olyQ3Select(cardEl) {
  if (s1State.q3.done) return;
  document.querySelectorAll('#s1-q3 .scq-opt').forEach(function (c) {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');
  s1State.q3.selected = cardEl.dataset.id;
  document.getElementById('s1-q3-check').disabled = false;
}

/* שקף 7 — דמות מלווה+בועית, נחשף אחרי שאלה ג'. תמונת/וידאו הדמות
   תלוי-בחירה (Companion character system, 720-templates skill) —
   character-1 = "boy" (עקבי עם מסך 1: boy-avatar-v-fingers.mp4),
   character-2 = "yellow" (yellow-avatar-eats-popcorn.mp4). */
const S1_OUTRO_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-muscle.mp4',
  'character-2': 'assets/videos/yellow-avatar-muscle.mp4'
};

function s1ShowOutro() {
  document.getElementById('s1-outro').hidden = false;
  s1MaybeShowScrollGesture();
  resolveCharBubbleVideo('s1-outro-avatar', S1_OUTRO_AVATAR_ASSETS);
}

function olyQ3Check() {
  if (!s1State.q3.selected || s1State.q3.done) return;
  const isCorrect = s1State.q3.selected === 'a';
  document.querySelectorAll('#s1-q3 .scq-opt').forEach(function (c) {
    c.classList.add('disabled');
    if (c.dataset.id === 'a') c.classList.add('correct');
    else if (c.classList.contains('selected') && !isCorrect) c.classList.add('wrong');
  });
  olySetFeedback(document.getElementById('s1-q3-feedbox'), isCorrect, isCorrect ? S1_Q3_FEEDBACK.correct : S1_Q3_FEEDBACK.wrong);
  document.getElementById('s1-q3-check').disabled = true;
  s1State.q3.done = true;
  s1ShowOutro();

  const continueBtn = document.getElementById('s1-continue');
  if (continueBtn) continueBtn.disabled = false;
}

function advanceFromS1() {
  if (!s1State.q3.done) return;
  goTo(2);
}

function resetScreenState1() {
  s1InitScrollJump();
  s1MaybeShowScrollGesture();

  document.querySelectorAll('#s1-q1 .scq-opt').forEach(function (c) {
    const isSelected = c.dataset.id === s1State.q1.selected;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    c.classList.toggle('disabled', s1State.q1.done);
    c.classList.remove('correct', 'wrong');
    if (s1State.q1.done) {
      if (c.dataset.id === 'b') c.classList.add('correct');
      else if (isSelected) c.classList.add('wrong');
    }
  });
  document.getElementById('s1-q1-check').disabled = !s1State.q1.selected || s1State.q1.done;
  const fb1 = document.getElementById('s1-q1-feedbox');
  /* QA 19.08.2026: תוקן — לשעבר "&& !s1State.q2.selected" הסתיר את
     משוב א' ברגע שהתחילו לבחור בשאלה ב' (החלטה מ-17.08.2026, הפוכה
     עכשיו לפי בקשה מפורשת). משוב מוצג כל עוד השאלה שלו עצמה נענתה —
     בלי תלות במצב השאלות הבאות. */
  if (s1State.q1.done) {
    const isCorrect1 = s1State.q1.selected === 'b';
    olySetFeedback(fb1, isCorrect1, isCorrect1 ? S1_Q1_FEEDBACK.correct : S1_Q1_FEEDBACK.wrong);
  } else {
    fb1.classList.remove('visible', 'is-correct', 'is-wrong');
  }

  document.getElementById('s1-q2').hidden = !s1State.q1.done;
  document.querySelectorAll('#s1-q2 .scq-opt').forEach(function (c) {
    const isSelected = c.dataset.id === s1State.q2.selected;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    c.classList.toggle('disabled', s1State.q2.done);
    c.classList.remove('correct', 'wrong');
    if (s1State.q2.done) {
      if (c.dataset.id === '40') c.classList.add('correct');
      else if (isSelected) c.classList.add('wrong');
    }
  });
  document.getElementById('s1-q2-check').disabled = !s1State.q2.selected || s1State.q2.done;
  const fb2 = document.getElementById('s1-q2-feedbox');
  /* QA 19.08.2026: אותו תיקון בדיוק כמו fb1 למעלה. */
  if (s1State.q2.done) {
    const isCorrect2 = s1State.q2.selected === '40';
    olySetFeedback(fb2, isCorrect2, isCorrect2 ? S1_Q2_FEEDBACK.correct : S1_Q2_FEEDBACK.wrong);
  } else {
    fb2.classList.remove('visible', 'is-correct', 'is-wrong');
  }

  document.getElementById('s1-q3').hidden = !s1State.q2.done;
  document.querySelectorAll('#s1-q3 .scq-opt').forEach(function (c) {
    const isSelected = c.dataset.id === s1State.q3.selected;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    c.classList.toggle('disabled', s1State.q3.done);
    c.classList.remove('correct', 'wrong');
    if (s1State.q3.done) {
      if (c.dataset.id === 'a') c.classList.add('correct');
      else if (isSelected) c.classList.add('wrong');
    }
  });
  document.getElementById('s1-q3-check').disabled = !s1State.q3.selected || s1State.q3.done;
  const fb3 = document.getElementById('s1-q3-feedbox');
  if (s1State.q3.done) {
    const isCorrect3 = s1State.q3.selected === 'a';
    olySetFeedback(fb3, isCorrect3, isCorrect3 ? S1_Q3_FEEDBACK.correct : S1_Q3_FEEDBACK.wrong);
  } else {
    fb3.classList.remove('visible', 'is-correct', 'is-wrong');
  }

  document.getElementById('s1-outro').hidden = !s1State.q3.done;
  if (s1State.q3.done) resolveCharBubbleVideo('s1-outro-avatar', S1_OUTRO_AVATAR_ASSETS);

  const continueBtn = document.getElementById('s1-continue');
  if (continueBtn) continueBtn.disabled = !s1State.q3.done;

  s1CurrentPage = 0;
  const scrollArea = document.getElementById('s1-scroll-area');
  if (scrollArea) {
    /* QA 20.08.2026: הגנה זהה ל-s1GoToPage — אם חוזרים למסך הזה אחרי
       שכבר גללו בו (scrollTop>0), האיפוס-ל-0 הזה מפיק גם הוא אירוע
       scroll נייטיבי, שעלול להסתיר בטעות רמז שרק הוצג. */
    s1GestureProgrammaticScroll = true;
    setTimeout(function () { s1GestureProgrammaticScroll = false; }, 700);
    scrollArea.scrollTop = 0;
  }
}

/* =========================================================
   מסך 3 — יהב ויעל שותלים גינה (מסך גלילה מותאם), data-screen="2", id="s2"
   "מסך לא בתבנית" (הערת מפיקה, שקפים 8-9,11-14 — שקף 10 דולג, מסומן
   בתסריט עצמו "מסך לא להפקה"). סעיף ג' (שאלת שורות, SCQ) שער
   לסעיפים ד'+ה' (הסבר יעל + שאלת-גרירה-למשוואה). ראו ARCHITECTURE.md
   § "מסך 3" לפירוט מלא + כל ההנחות שדורשות אישור (דמויות-בועה עדיין
   placeholder — אין נכסי וידאו לתוכן הזה).
   ========================================================= */
const s2State = { c: { selected: null, done: false } };

let s2GestureShown = false;
let s2GestureProgrammaticScroll = false;
/* QA 19.08.2026: אותו תיקון בדיוק כמו s1MaybeShowScrollGesture — נבדק
   בפועל אם יש מה לגלול לפני הצגת הרמז.
   ⚠️ תוקן (20.08.2026, לפי דיווח "אין כף יד ליד הסקרול בר במסך 3") —
   resetScreenState2 מאפס scrollTop=0 בסופה (למטה); אם המסך נכנס-
   מחדש בזמן ש-scrollTop>0 (למשל אחרי גלילה קודמת), האיפוס הזה מפיק
   אירוע scroll נייטיבי שהמאזין הישן (naive, {once:true}) לא הבחין
   בינו לבין גלילה אמיתית של הלומד/ת — מסתיר את הרמז לפני שהוא נראה
   בכלל. אותו דפוס-דגל בדיוק כמו s1/s6MaybeShowScrollGesture. */
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
function s2HideGestureOnScroll() {
  const scrollArea = document.getElementById('s2-scroll-area');
  const gesture = document.getElementById('s2-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s2GestureProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s2HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}

/* ⚠️ נוסף (18.08.2026) — Gesture Hint: Cursor Drag (SELF-QA-lomda.md §7).
   סעיף ה (דיאגרמת-המשוואה, s2E*) הוא אינטראקציית-גרירה אמיתית שלא
   קיבלה עד כה שום gesture hint. מוצג פעם אחת ברגע שסעיף ה נחשף
   (לא ברגע שהמסך כולו הופך active — הווידג'ט עצמו hidden עד שסעיף ג'
   נענה, ראו s2CCheck/resetScreenState2), מוסתר בניסיון-הגרירה-
   המוצלח הראשון (s2EDrop), לא בגלילה — אותו מנגנון show-once כמו
   s1/s2/s6MaybeShowScrollGesture, רק שה-trigger-להסתרה הוא גרירה. */
let s2DragGestureShown = false;
function s2MaybeShowDragGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
  requestAnimationFrame(function () {
  if (s2DragGestureShown) return;
  s2DragGestureShown = true;
  const gesture = document.getElementById('s2-drag-gesture');
  if (!gesture) return;
  gesture.hidden = false;

  });}
function s2HideDragGesture() {
  const gesture = document.getElementById('s2-drag-gesture');
  if (gesture) gesture.hidden = true;
}

/* ⚠️ טקסט מדויק מהתסריט (שקף 12 — כולל ה-m:t של החישוב שהיה מוטמע
   כאובייקט-נוסחה, לא טקסט רגיל: 3∙10=30, 4∙10=40). */
const S2_C_FEEDBACK = {
  correct: {
    title: 'כל הכבוד!',
    body: 'קיבלנו 10 שורות, אם בכל שורה יש 3 צנוניות ו-4 ראשי חסה אז נקבל: 3∙10=30 צנוניות, 4∙10=40 ראשי חסה.'
  },
  wrong: {
    title: 'זה לא מדויק',
    body: 'קיבלנו 10 שורות, אם בכל שורה יש 3 צנוניות ו-4 ראשי חסה אז נקבל: 3∙10=30 צנוניות, 4∙10=40 ראשי חסה.'
  }
};

function s2CSelect(cardEl) {
  if (s2State.c.done) return;
  document.querySelectorAll('#s2-sec-c .scq-opt').forEach(function (c) {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');
  s2State.c.selected = cardEl.dataset.id;
  document.getElementById('s2-c-check').disabled = false;
}

function s2CCheck() {
  if (!s2State.c.selected || s2State.c.done) return;
  const isCorrect = s2State.c.selected === '10';
  document.querySelectorAll('#s2-sec-c .scq-opt').forEach(function (c) {
    c.classList.add('disabled');
    if (c.dataset.id === '10') c.classList.add('correct');
    else if (c.classList.contains('selected') && !isCorrect) c.classList.add('wrong');
  });
  olySetFeedback(document.getElementById('s2-c-feedbox'), isCorrect, isCorrect ? S2_C_FEEDBACK.correct : S2_C_FEEDBACK.wrong);
  document.getElementById('s2-c-check').disabled = true;
  s2State.c.done = true;
  // תמונת-המשוב (שקף 12: "התמונה עולה יחד עם המשוב") מחליפה את
  // הדמות+בועית באותו מקום פיזי בדיוק — לא מופיעה לצידה.
  document.getElementById('s2-c-char').hidden = true;
  document.getElementById('s2-c-fb-img').hidden = false;
  /* QA 20.08.2026: הוסרו שני שורות ה-hidden=false לסעיפים ד'/ה' —
     שניהם גלויים תמיד עכשיו (לפי בקשה מפורשת), אין יותר חשיפה-
     הדרגתית. s2MaybeShowDragGesture() הועברה ל-resetScreenState2 (רצה
     עם כניסה למסך, לא תלוית-מענה-על-סעיף-ג'). */
}

/* =========================================================
   סעיף ה — DragAndDropQuestion, וריאנט מקומי "דיאגרמת-משוואה"
   (720-templates skill). מנגנון native HTML5 drag&drop, בהשראת
   ה-Classic layout contract (ddqDragStart/ddqDragOver/ddqDrop/
   ddqPlacedDragStart) — מרחב-שמות s2E* כי זו שאלת-גרירה שנייה
   בפרויקט (אחרי שתיבנה עוד אחת, לפי הנחיית ה-skill על namespacing).
   שני ניסיונות (לפי הערת המפיקה בתסריט, שקף 14): ניסיון ראשון שגוי —
   מסומן באדום, נשאר פתוח לתיקון (לא ננעל); ניסיון שני שגוי — נחשפת
   התשובה הנכונה + ננעל.
   ========================================================= */
const S2_DDQ_CORRECT = {
  's2-target-known':      's2-drag-known',
  's2-target-total':      's2-drag-total',
  's2-target-groupsize':  's2-drag-groupsize',
  's2-target-knownsize':  's2-drag-knownsize'
};
let s2EPlacement = {
  's2-drag-groupsize': 'source',
  's2-drag-knownsize': 'source',
  's2-drag-known':     'source',
  's2-drag-total':     'source'
};
let s2EChecked = false;
let s2EDone = false;
let s2EAttempts = 0;
let s2EDragActive = null;
let s2EDropHandled = false;

/* ⚠️ הוסר (18.08.2026) — הייתה כאן s2ERenderLines(), פונקציה שציירה
   קווי-חיבור SVG בין כל משבצת למספר שלה (getBoundingClientRect-based).
   הקווים עצמם כבר לא קיימים ב-HTML מזמן (הוסרו ב-17.08.2026 לפי בקשה
   מפורשת: "לא צריך חיצים... פשוט שאיזורי הגרירה קרובים למספרים"), אז
   הפונקציה הפכה לקוד-מת ששותק בלי לעשות כלום (setLine עם line===null
   פשוט return-ה). ההערה שהייתה כאן טענה בטעות ש"כל משבצת ממוקמת
   דינמית ב-JS (s2EPositionTargets)" — אבל הפונקציה הזו מעולם לא
   נכתבה, וזה שורש-הבאג החוזר (המשבצות מעולם לא היו קרובות בפועל
   למספרים שלהן). תוקן ביסודו ב-styles.css/index.html: פריסת flex-
   column סטטית (.s2-eq-num-col) — כל משבצת מקוננת ישירות ליד המספר
   שלה ב-HTML, בלי שום מדידת-runtime. */

function s2ERender() {
  Object.keys(S2_DDQ_CORRECT).forEach(function (targetId) {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;
    const placedId = Object.keys(s2EPlacement).find(function (k) { return s2EPlacement[k] === targetId; });
    targetEl.innerHTML = '';
    targetEl.classList.remove('occupied', 'correct', 'wrong');
    if (placedId) {
      targetEl.classList.add('occupied');
      const card = document.createElement('div');
      card.className = 's2-eq-placed-card';
      const sourceEl = document.getElementById(placedId);
      card.textContent = sourceEl ? sourceEl.textContent : '';
      if (!s2EChecked) {
        card.draggable = true;
        card.addEventListener('dragstart', function (ev) { s2EPlacedDragStart(ev, placedId); });
        card.addEventListener('dragend', function (ev) { s2EDragEnd(ev); });
      }
      targetEl.appendChild(card);
    }
  });
  Object.keys(s2EPlacement).forEach(function (dragId) {
    const el = document.getElementById(dragId);
    if (!el) return;
    el.classList.toggle('ghost', s2EPlacement[dragId] !== 'source');
    el.classList.toggle('locked', s2EChecked);
  });
}

function s2ECheckEnable() {
  const allFilled = Object.keys(S2_DDQ_CORRECT).every(function (t) {
    return Object.keys(s2EPlacement).some(function (k) { return s2EPlacement[k] === t; });
  });
  const btn = document.getElementById('s2-e-check');
  if (btn) btn.disabled = !allFilled || s2EChecked;
}

function s2EDragStart(e, dragId) {
  if (s2EChecked) { e.preventDefault(); return; }
  s2EDragActive = dragId;
  s2EDropHandled = false;
  e.dataTransfer.setData('text/plain', dragId);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function s2EPlacedDragStart(e, dragId) {
  if (s2EChecked) { e.preventDefault(); return; }
  s2EDragActive = dragId;
  s2EDropHandled = false;
  e.dataTransfer.setData('text/plain', dragId);
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(function () {
    s2EPlacement[dragId] = 'source';
    s2ERender();
  }, 0);
}

function s2EDragEnd() {
  document.querySelectorAll('.s2-ddq-card.dragging').forEach(function (el) { el.classList.remove('dragging'); });
  if (!s2EDropHandled && s2EDragActive) {
    s2EPlacement[s2EDragActive] = 'source';
    s2ERender();
  }
  s2EDragActive = null;
}

function s2EDragOver(e, targetId) {
  if (s2EChecked) return;
  e.preventDefault();
  const el = document.getElementById(targetId);
  if (el) el.classList.add('drag-over');
}
function s2EDragLeave(e, targetId) {
  const el = document.getElementById(targetId);
  if (el) el.classList.remove('drag-over');
}
function s2EDrop(e, targetId) {
  e.preventDefault();
  const el = document.getElementById(targetId);
  if (el) el.classList.remove('drag-over');
  if (s2EChecked) return;
  const dragId = e.dataTransfer.getData('text/plain') || s2EDragActive;
  if (!dragId) return;
  // "Dropping onto an occupied target evicts the existing item back to source" — 720-templates DragAndDropQuestion.md
  Object.keys(s2EPlacement).forEach(function (k) { if (s2EPlacement[k] === targetId) s2EPlacement[k] = 'source'; });
  s2EPlacement[dragId] = targetId;
  s2EDropHandled = true;
  s2ERender();
  s2ECheckEnable();
  s2HideDragGesture(); // ניסיון-גרירה-מוצלח ראשון — מסתיר את ה-gesture hint (לא תלוי-הצלחה/דיוק)
}

/* ⚠️ טקסט מדויק מהתסריט (שקף 14, AlternateContent). "כל הכבוד! / זה
   לא מדויק, התשובה הנכונה מוצגת" — אותה פסקת-הסבר לשני המצבים, רק
   שורת הפתיחה שונה, כמו כל משוב אחר בפרויקט הזה. */
const S2_E_FEEDBACK = {
  correct: { title: 'כל הכבוד!', body: 'כשגודל הקבוצה והיחס בין החלקים בה ידועים לנו, זוהי הדרך בה נחשב את גדלי חלקים השונים.' },
  wrong:   { title: 'זה לא מדויק, התשובה הנכונה מוצגת', body: 'כשגודל הקבוצה והיחס בין החלקים בה ידועים לנו, זוהי הדרך בה נחשב את גדלי חלקים השונים.' }
};
/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md) — עד כה
   הניסיון-האחרון-השגוי קרא ל-s2ERevealCorrect() אוטומטית וזהו (בדיוק
   התיאור "ההתנהגות השגויה הנפוצה" בקובץ-ההנחיות) — הלומד/ת לא יכלו
   לראות את הסידור שהם עצמם ביצעו. עכשיו: כפתור-טוגל, כמו ב-s6. */
const S2_E_PENDING_FEEDBACK = { title: 'התשובה אינה נכונה.', body: 'רוצים לראות את הפתרון הנכון?' };
let s2EPlacementSnapshot = null;
let s2ERevealed = false;

function s2EMarkResult() {
  Object.keys(S2_DDQ_CORRECT).forEach(function (t) {
    const el = document.getElementById(t);
    if (!el) return;
    el.classList.remove('correct', 'wrong');
    const placed = Object.keys(s2EPlacement).find(function (k) { return s2EPlacement[k] === t; });
    if (placed === S2_DDQ_CORRECT[t]) el.classList.add('correct');
    else if (placed) el.classList.add('wrong');
  });
}

function s2ERevealCorrect() {
  s2EPlacement = {};
  Object.keys(S2_DDQ_CORRECT).forEach(function (t) { s2EPlacement[S2_DDQ_CORRECT[t]] = t; });
}

function s2EIsAllCorrect() {
  return Object.keys(S2_DDQ_CORRECT).every(function (t) {
    const placed = Object.keys(s2EPlacement).find(function (k) { return s2EPlacement[k] === t; });
    return placed === S2_DDQ_CORRECT[t];
  });
}

function s2ECheck() {
  if (s2EChecked) return;
  s2EAttempts++;
  const isCorrect = s2EIsAllCorrect();
  if (isCorrect) {
    s2EChecked = true;
    s2EDone = true;
    olySetFeedback(document.getElementById('s2-e-feedbox'), true, S2_E_FEEDBACK.correct);
  } else if (s2EAttempts < 2) {
    s2EMarkResult(); // מסמן אדום זמנית — הגרירה עדיין פתוחה לתיקון (לא ננעל)
  } else {
    /* ⚠️ תוקן (31.08.2026) — לא עוד reveal אוטומטי. הסידור של הלומד/ת
       עצמם נשמר (snapshot) ומוצג עם סימון-נכון/שגוי ביחס-אליו; כפתור
       "התשובה הנכונה" נחשף לטוגל עצמאי — ראו s2EToggleReveal. */
    s2EChecked = true;
    s2EDone = true;
    s2EPlacementSnapshot = Object.assign({}, s2EPlacement);
    s2ERevealed = false;
    olySetFeedback(document.getElementById('s2-e-feedbox'), false, S2_E_PENDING_FEEDBACK);
    const revealBtn = document.getElementById('s2-e-reveal-btn');
    if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
  }
  if (s2EChecked) {
    document.getElementById('s2-e-check').disabled = true;
    /* ⚠️ תוקן (31.08.2026, דיווח: "לא מקבלים חיווי אלא רק משוב") —
       s2ERender() עושה targetEl.classList.remove('occupied','correct',
       'wrong') על כל יעד (כדי לבנות-מחדש את ה-innerHTML נקי), בלי
       להחזיר correct/wrong בחזרה. כשה-s2EMarkResult() שסימן את
       החיווי נקרא *לפני* s2ERender() (כמו שהיה כאן קודם), ה-render
       שרץ אחריו מוחק את הסימון מיד — התוצאה: הטקסט/משוב מוצג אבל שום
       חיווי-צבע/אייקון על היעדים עצמם. סדר נכון: render קודם (בונה את
       הכרטיסים-המונחים מחדש), markResult אחריו (מסמן את היעדים
       הקיימים בפועל). */
    s2ERender();
    s2EMarkResult();
    const continueBtn = document.getElementById('s2-continue');
    if (continueBtn) continueBtn.disabled = false;
  }
}

/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md, וריאנט 2) —
   טוגל: לחיצה ראשונה חושפת את הסידור הנכון בפועל (s2ERevealCorrect
   הקיימת, בלי שינוי), מציגה את S2_E_FEEDBACK.wrong הקיים ללא שינוי;
   לחיצה שנייה משחזרת בדיוק את הסידור שהלומד/ת עצמם ביצעו (מ-snapshot). */
function s2EToggleReveal() {
  const revealBtn = document.getElementById('s2-e-reveal-btn');
  if (!s2ERevealed) {
    s2ERevealCorrect();
    s2ERender();
    s2EMarkResult();
    olySetFeedback(document.getElementById('s2-e-feedbox'), false, S2_E_FEEDBACK.wrong);
    s2ERevealed = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    s2EPlacement = Object.assign({}, s2EPlacementSnapshot);
    s2ERender();
    s2EMarkResult();
    olySetFeedback(document.getElementById('s2-e-feedbox'), false, S2_E_PENDING_FEEDBACK);
    s2ERevealed = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

/* ⚠️ s2InitFeedbackAutoHide הוסרה (19.08.2026) — נבנתה (17.08.2026)
   כי #s2-c-feedbox היה אז פופ-אפ קנבס-קבוע (position:absolute יחסית
   לקנבס, לא לתוכן-הגלילה), ולכן היה נשאר גלוי-קבוע על גבי סעיפים
   ד'/ה' גם אחרי שגוללים הרחק מסעיף ג', בלי טיפול-נפרד. אבל מאז
   #s2-c-feedbox הפך ל-.is-static (זורם *בתוך* סעיף ג' עצמו, לא עוד
   קבוע-לקנבס) — כשגוללים הרחק ממנו הוא כבר גולל-איתו החוצה מהתצוגה
   כמו כל תוכן רגיל, בלי צורך ב-IntersectionObserver שיחביא אותו
   בכוח. השארת המנגנון הישן הייתה מוחקת בפועל את ה-.visible ברגע
   שסעיף ג' יוצא מהתצוגה — בדיוק ההפך מהמדיניות הנוכחית ("המשוב נשאר
   מוצג גם אחרי מעבר לשאלה הבאה"). */

/* דמות-מלווה ליד שאלת סעיף ג' (מסך 3) — הוחלף מ-placeholder לנכסים
   אמיתיים, לפי בחירה מפורשת של שני קבצי-וידאו (לא תלוי-בחירה סתמי —
   שני נכסים ספציפיים סופקו). שם-הקובץ "yellow-avatr-asking.mp4" הוא
   ככתבו-וכלשונו על הדיסק (שגיאת-כתיב בפועל בשם הקובץ) — לא לתקן. */
const S2_C_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-thinking.mp4',
  'character-2': 'assets/videos/yellow-avatr-asking.mp4'
};

function resetScreenState2() {
  s2MaybeShowScrollGesture();
  resolveCharBubbleVideo('s2-c-avatar', S2_C_AVATAR_ASSETS);

  document.querySelectorAll('#s2-sec-c .scq-opt').forEach(function (c) {
    const isSelected = c.dataset.id === s2State.c.selected;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    c.classList.toggle('disabled', s2State.c.done);
    c.classList.remove('correct', 'wrong');
    if (s2State.c.done) {
      if (c.dataset.id === '10') c.classList.add('correct');
      else if (isSelected) c.classList.add('wrong');
    }
  });
  document.getElementById('s2-c-check').disabled = !s2State.c.selected || s2State.c.done;
  const fbc = document.getElementById('s2-c-feedbox');
  if (s2State.c.done) {
    const isCorrectC = s2State.c.selected === '10';
    olySetFeedback(fbc, isCorrectC, isCorrectC ? S2_C_FEEDBACK.correct : S2_C_FEEDBACK.wrong);
  } else {
    fbc.classList.remove('visible', 'is-correct', 'is-wrong');
  }
  document.getElementById('s2-c-char').hidden = s2State.c.done;
  document.getElementById('s2-c-fb-img').hidden = !s2State.c.done;

  /* QA 20.08.2026: סעיפים ד'/ה' גלויים תמיד (לא עוד hidden=!s2State.c.done)
     — לפי בקשה מפורשת לבטל חשיפה-הדרגתית במסך הזה. רמז-הגרירה נבדק
     תמיד בכניסה למסך (לא רק אם ג' כבר נענתה), כמו שאר רמזי-הגלילה
     בפרויקט. */
  if (!s2EChecked) s2MaybeShowDragGesture();

  s2ERender();
  s2ECheckEnable();
  const fbe = document.getElementById('s2-e-feedbox');
  if (s2EChecked) {
    document.getElementById('s2-e-check').disabled = true;
    /* ⚠️ נוסף (31.08.2026, אותו דיווח בדיוק כמו s2ECheck: "לא מקבלים
       חיווי אלא רק משוב") — s2ERender() שלמעלה מוחק correct/wrong מכל
       יעד (ראו ההערה המלאה ב-s2ECheck); בחזרה למסך הזה (resume) לא
       היה כאן שום s2EMarkResult() שמחזיר את הסימון, אז החיווי נעלם
       גם כשחוזרים למסך אחרי שכבר נבדק, לא רק בזמן-אמת. */
    s2EMarkResult();
    const isAllCorrectE = s2EIsAllCorrect();
    olySetFeedback(fbe, isAllCorrectE, isAllCorrectE ? S2_E_FEEDBACK.correct : S2_E_FEEDBACK.wrong);
    /* ⚠️ נוסף (31.08.2026, דיווח: "אין את הכפתור של הצגת התשובה
       הנכונה") — כפתור-החשיפה גם הוא לא שוחזר ב-resume: נשאר hidden
       (ברירת-המחדל ב-HTML) גם כשהניסיונות נגמרו-בטעות במצב-שגוי לפני
       המעבר-מהמסך. גלוי רק כשנבדק וטרם נפתר נכון (עקבי עם s2ECheck —
       שם הכפתור נחשף רק בענף הניסיון-האחרון-שגוי, לא בענף isCorrect). */
    const revealBtnE = document.getElementById('s2-e-reveal-btn');
    if (revealBtnE) {
      revealBtnE.hidden = isAllCorrectE;
      revealBtnE.textContent = s2ERevealed ? 'התשובה שלי' : 'התשובה הנכונה';
    }
  } else {
    fbe.classList.remove('visible', 'is-correct', 'is-wrong');
  }

  const continueBtn = document.getElementById('s2-continue');
  if (continueBtn) continueBtn.disabled = !s2EDone;

  const scrollArea = document.getElementById('s2-scroll-area');
  if (scrollArea) {
    s2GestureProgrammaticScroll = true;
    scrollArea.scrollTop = 0;
    setTimeout(function () { s2GestureProgrammaticScroll = false; }, 700);
  }
}

function advanceFromS2() {
  if (!s2EDone) return;
  goTo(3);
}

/* =========================================================
   מסך 4 — מסך מעבר (TransitionScreen), data-screen="3", id="s3"
   תוכן משקף 15. הערת מפיקה מבקשת "שתי הדמויות אוחזות יד ביד".
   ⚠️ עודכן (20.08.2026) — נכס-זוג-דמויות אמיתי סופק (לא עוד הנחה
   "אין נכס כזה"): yellow-avatar-and-turquise-avatar.mp4. מוצג תמיד,
   לפי בקשה מפורשת ("לא משנה מה נבחר במסך הבחירה") — לא עוד תלוי-
   בחירה. ראו ARCHITECTURE.md § "מסך 4" לעדכון-ההנחה. */
function resetScreenState3() {
  setFixedCharVideo('s3-avatar', 'assets/videos/yellow-avatar-and-turquise-avatar.mp4');
}

function advanceFromS3() {
  goTo(4);
}

/* =========================================================
   מסך 5 (מאוחד, מסכים 5-11 בדוקס/פיגמה) — תרגול מונחה, data-screen="4",
   id="s4". תוכן משקפים 16-22 (שקף 16 = מסך-פתיחה, "שלב 0"; שקפים 17-22
   = 6 שלבים רציפים, תואם מונה "X מתוך 6" שנצפה ב-Figma). כל שלב מוצג
   כ-<div class="s4-step-block"> סטטי עם hidden, לא re-render דינמי —
   עקבי עם דפוס .oly-question[hidden]/.s2-section[hidden] הקיים כבר
   בפרויקט. ראו ARCHITECTURE.md § "מסך 5 (מאוחד)" לפירוט מלא + כל
   ההנחות (bulb icon חסר-נכס, פירוק משפט-הבינארי בשלב 1 מתוך 2 משפטי-
   תסריט נפרדים, "דיאגרמת-הגולות" של שלב 6 בנויה HTML/CSS טהור ולא
   asset-תמונה כי אין כזה בפרויקט).
   ========================================================= */
const S4_STEPS = {
  /* ⚠️ תוקן (31.08.2026, לפי דיווח: "כשעניתי על סעיף א הופיע לי
     באינפוט TRUE, צריך שיהיה הערך של התשובה הנכונה") — שלב 1 הוא
     שאלת נכון/לא-נכון, אז ה-id של הבחירה הנכונה הוא המחרוזת הבוליאנית
     'true' — אבל תיבת-התצוגה המקדימה (.s4-preview-box, s4RefreshPreviewRows
     למטה) צריכה להציג את *הערך* שהתשובה מייצגת (2/7, בדיוק כמו שלב 2
     מציג 5/7), לא את ה-id הטכני. display אופציונלי — כשלא קיים,
     נופל-חזרה ל-correct (שלבים 2-4, שם ה-id כבר זהה לערך התצוגה). */
  1: { correct: 'true', display: '2/7' },
  2: { correct: '5/7' },
  3: { correct: '16' },
  4: { correct: '40' }
};

/* ⚠️ טקסט מדויק מהתסריט (שקפים 17-22, AlternateContent) — כל שורת
   סיכום היא ציטוט/גזירה ישירה של המסקנה שכל שקף עצמו קובע במפורש. */
const S4_RECAP = {
  1: 'אורי קיבל 2/7 מהגולות.',
  2: 'דן קיבל 5/7 מהגולות.',
  3: 'אורי קיבל 16 גולות.',
  4: 'דן קיבל 40 גולות.',
  5: 'דן קיבל 40 גולות.',
  6: 'דן קיבל 40 גולות.'
};

/* דמות-מלווה לשלב הפתיחה (שקף 16) — אותם נכסים כמו בשאר המסכים
   (Companion character system), לא נכסי-וידאו חדשים. */
const S4_INTRO_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-muscle.mp4',
  'character-2': 'assets/videos/yellow-avatar-muscle.mp4'
};

let s4State = {
  step: 0,       // 0=פתיחה, 1-6=שלבים
  answers: {},   // {1:'true', 2:'5/7', ...} — הבחירה שנבחרה בכל שלב שנענה
  done: false
};

/* ⚠️ שונה (31.08.2026, לפי בקשה מפורשת) — קודם לחיצה על פיל העריכה
   מיידית (בחירה=הערכה, בלי כפתור-אישור נפרד). עכשיו: בחירה בפיל רק
   מסמנת אותה (s4Choose) ומדליקה כפתור "צדקתי?"; לחיצה על הכפתור עצמו
   (s4CheckStep) היא זו שמעריכה, חושפת הסבר, ומחליפה את טקסט הכפתור
   ל"המשך" — אותה סמנטיקה כמו שאר שאלות-הבחירה בפרויקט (olyQ1Select/
   olyQ1Check וכו'), רק עם כפתור-יחיד שמתחלף במקום שני כפתורים נפרדים. */
function s4Choose(stepNum, id, btnEl) {
  if (s4State.answers[stepNum]) return; // כבר נענה — לא ניתן לשנות (guided, לא נבחן)
  document.querySelectorAll('#s4-pills-' + stepNum + ' .s4-pill').forEach(function (b) {
    b.classList.toggle('selected', b === btnEl);
  });
  s4State.selected = s4State.selected || {};
  s4State.selected[stepNum] = id;
  const checkBtn = document.getElementById('s4-next-' + stepNum);
  if (checkBtn) checkBtn.disabled = false;
}

function s4CheckStep(stepNum) {
  if (s4State.answers[stepNum]) { s4Next(stepNum); return; } // כבר נבדק — הכפתור עצמו הפך ל"המשך"
  const id = s4State.selected && s4State.selected[stepNum];
  if (!id) return;
  const stepDef = S4_STEPS[stepNum];
  const isCorrect = id === stepDef.correct;
  s4State.answers[stepNum] = id;
  document.querySelectorAll('#s4-pills-' + stepNum + ' .s4-pill').forEach(function (b) {
    b.disabled = true;
    b.classList.remove('selected');
    if (b.dataset.id === stepDef.correct) b.classList.add('correct');
    else if (b.dataset.id === id && !isCorrect) b.classList.add('wrong');
  });
  const explainEl = document.getElementById('s4-explain-' + stepNum);
  if (explainEl) explainEl.hidden = false;
  document.getElementById('s4-recap').hidden = false;
  document.getElementById('s4-recap').textContent = S4_RECAP[stepNum];
  s4RefreshPreviewRows(stepNum);
  const btn = document.getElementById('s4-next-' + stepNum);
  if (btn) btn.textContent = 'המשך';
}

/* דיאגרמת-הגולות (שקף 22) — 8 שורות × 7 גולות (2 אדומות + 5 כחולות
   בכל שורה), נבנית כ-HTML טהור (56 <span> קטנים) ולא כ-asset תמונה —
   אין נכס כזה בפרויקט, וזה בהחלט ניתן-לבנייה נקייה ב-HTML/CSS בלבד. */
function s4RenderMarbles() {
  const container = document.getElementById('s4-marbles');
  if (!container || container.dataset.rendered) return;
  container.dataset.rendered = 'true';
  for (let r = 0; r < 8; r++) {
    const row = document.createElement('div');
    row.className = 's4-marble-row';
    for (let c = 0; c < 2; c++) {
      const dot = document.createElement('span');
      dot.className = 's4-marble s4-marble--red';
      row.appendChild(dot);
    }
    for (let c = 0; c < 5; c++) {
      const dot = document.createElement('span');
      dot.className = 's4-marble s4-marble--blue';
      row.appendChild(dot);
    }
    container.appendChild(row);
  }
}

/* ⚠️ נוסף (20.08.2026, לפי בקשה מפורשת) — #s4-preview-rows נשארת
   גלויה לכל אורך התרגול (1-6), לא נעלמת אחרי s4Start(). שורת השלב-
   הנוכחי מקבלת .current (בולד); כל שורה ששלבה נענה (s4State.answers)
   מציגה בפועל את S4_STEPS[i].correct בתוך התיבה, וגבול-התיבה עובר
   מ-pending (subject-350) ל-answered (subject-500). נקראת גם
   מ-s4ShowStep (מעבר-שלב) וגם מ-s4Select (מיד כשנענו, לא רק כש-
   "המשך" נלחץ) — לפי "בכל פעם שעונים על סעיף" במפורש. */
function s4RefreshPreviewRows(currentStep) {
  for (let i = 1; i <= 4; i++) {
    const label = document.getElementById('s4-preview-label-' + i);
    const box = document.getElementById('s4-preview-box-' + i);
    if (!label || !box) continue;
    label.classList.toggle('current', i === currentStep);
    if (s4State.answers[i]) {
      box.textContent = S4_STEPS[i].display || S4_STEPS[i].correct;
      box.classList.add('answered');
    } else {
      box.textContent = '';
      box.classList.remove('answered');
    }
  }
}

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7). נוסף (31.08.2026,
   בדיקה מקיפה של כל מסכי-הגלילה) — שני כרטיסי-מסך 4 (.s4-notebook/
   .s4-step-card) גללו כבר אבל בלי יד-רמז מעולם. אין כאן שום scrollTo/
   scrollIntoView יזום-קוד, אז אין צורך בדגל "ProgrammaticScroll" —
   אותו מנגנון show-once-if-scrollable הפשוט, נבדק מחדש בכל קריאה
   ל-s4ShowStep (התוכן משתנה בכל שלב, אז יכול להפוך לגלילה-אמיתית רק
   בשלב מאוחר יותר). */
let s4NotebookGestureShown = false;
function s4MaybeShowNotebookGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
  requestAnimationFrame(function () {
  if (s4NotebookGestureShown) return;
  const gesture = document.getElementById('s4-notebook-gesture');
  // ⚠️ תוקן (31.08.2026) — הגלילה עצמה עברה מ-#s4-notebook (המסגרת
  // החיצונית, עכשיו overflow:hidden בלבד) ל-.s4-notebook-scroll הפנימי
  // — ראו ההערה המלאה ב-styles.css § .s4-notebook. מיקום-היד עצמו
  // (gesture wrap) נשאר מעוגן ל-#s4-notebook, לא השתנה.
  const scrollArea = document.querySelector('#s4-notebook .s4-notebook-scroll');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s4NotebookGestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', function () { gesture.hidden = true; }, { once: true });

  });}
let s4StepCardGestureShown = false;
function s4MaybeShowStepCardGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
  requestAnimationFrame(function () {
  if (s4StepCardGestureShown) return;
  const gesture = document.getElementById('s4-step-card-gesture');
  const scrollArea = document.getElementById('s4-step-card');
  if (!gesture || !scrollArea || scrollArea.hidden) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s4StepCardGestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', function () { gesture.hidden = true; }, { once: true });

  });}

/* ⚠️ נוסף (31.08.2026, לפי דיווח: "אורך המלבן של המסיחים צריך להיות
   לפי אורך המסיח הארוך ביותר בכל שאלה") — .s4-pill היה min-width:85px
   בלבד, כל פיל מתרווח לפי הטקסט שלו-עצמו (אין מנגנון-רוחב-משותף), אז
   "לא נכון" יצא רחב מ"נכון". פותר ב-JS (לא CSS-בלבד, כי הפילים
   בשורת-flex-wrap עם 2-3 פילים משתנה, לא עמודה יחידה): מודד את הרוחב
   הטבעי (offsetWidth) של כל פיל בקבוצת השלב-הנוכחי, ומיישם את הרחב
   ביותר כ-width מפורש על כולם. נקרא מ-s4ShowStep בכל מעבר-שלב (לא רק
   פעם אחת) כי הפילים חייבים להיות גלויים (לא [hidden]) כדי שהמדידה
   תהיה נכונה. */
function s4EqualizePillWidths(stepNum) {
  const group = document.getElementById('s4-pills-' + stepNum);
  if (!group) return;
  const pills = Array.prototype.slice.call(group.querySelectorAll('.s4-pill'));
  if (!pills.length) return;
  pills.forEach(function (p) { p.style.width = ''; });
  const maxWidth = Math.max.apply(null, pills.map(function (p) { return p.offsetWidth; }));
  pills.forEach(function (p) { p.style.width = maxWidth + 'px'; });
}

function s4ShowStep(n) {
  // ⚠️ תוקן (17.08.2026, לפי get_design_context בפועל) — במצב-הפתיחה
  // (n===0) אין כרטיס סגול בכלל ברפרנס האמיתי; מוצגת דמות-מלווה
  // (Companion character, לפי התסריט) באותו מקום-פיזי במקום.
  document.getElementById('s4-intro-char').hidden = (n !== 0);
  document.getElementById('s4-step-card').hidden = (n === 0);

  for (let i = 1; i <= 6; i++) {
    const block = document.getElementById('s4-step-' + i);
    if (block) block.hidden = (i !== n);
  }
  /* ⚠️ תוקן (31.08.2026, דיווח: "גדלים והתנהגויות השתבשו במסך 5") —
     s4ShowStep נקראת גם מ-resetScreenState4, שנקראת מ-resetScreenState
     *לפני* target.classList.add('active') (ראו goTo) — באותו רגע
     המסך עדיין display:none, אז offsetWidth של כל פיל נמדד כ-0, וכל
     הפילים קיבלו width:0px מפורש בפועל. נדחה ל-requestAnimationFrame,
     בדיוק כמו equalizeTfBtnWidths ב-methodica-math-ratio-01-05-02/-03. */
  requestAnimationFrame(function () { s4EqualizePillWidths(n); });

  s4RefreshPreviewRows(n);

  // "הבעיה המקורית" מלאה-צבע בפתיחה (תואם State-01 ברפרנס), מעומעמת
  // מרגע שהאינטראקציה מתחילה (תואם State-03+ ברפרנס).
  document.getElementById('s4-problem').classList.toggle('s4-problem--dimmed', n >= 1);

  const recapEl = document.getElementById('s4-recap');
  if (n === 0) {
    recapEl.hidden = true;
  } else if (s4State.answers[n] || n === 5 || n === 6) {
    // השלב הנוכחי כבר נענה, או שהוא לא-אינטראקטיבי (5/6) — מציגים את הסיכום שלו עצמו
    recapEl.hidden = false;
    recapEl.textContent = S4_RECAP[n];
  } else if (S4_RECAP[n - 1]) {
    // השלב הנוכחי עדיין לא נענה — מציגים את הסיכום של השלב הקודם שהושלם
    // (עקבי עם התסריט: תיבת א' נשארת מלאה כשעונים על ב', וכו')
    recapEl.hidden = false;
    recapEl.textContent = S4_RECAP[n - 1];
  } else {
    recapEl.hidden = true;
  }

  document.getElementById('s4-marbles').hidden = (n !== 6);
  if (n === 6) {
    s4RenderMarbles();
    /* ⚠️ נוסף (31.08.2026, לפי בקשה מפורשת: "לא צריך את כפתור 'סיימתי',
       רק שכפתור ההמשך למטה יהיה דלוק") — שלב 6 אינו אינטראקטיבי (טקסט-
       הסבר בלבד), אז אין צורך בלחיצת-אישור נפרדת בתוך הכרטיס — ברגע
       שהשלב מוצג, ה"סיום" קורה אוטומטית וכפתור ה-#s4-continue הכללי
       (בסרגל התחתון) נדלק ישירות. */
    s4Finish();
  }

  s4State.step = n;
  s4MaybeShowNotebookGesture();
  s4MaybeShowStepCardGesture();
}

function s4Start() {
  s4ShowStep(1);
}

function s4Next(fromStep) {
  const n = fromStep + 1;
  if (n > 6) { s4Finish(); return; }
  s4ShowStep(n);
}

function s4Finish() {
  s4State.done = true;
  s4State.step = 6;
  const continueBtn = document.getElementById('s4-continue');
  if (continueBtn) continueBtn.disabled = false;
}

function resetScreenState4() {
  resolveCharBubbleVideo('s4-intro-avatar', S4_INTRO_AVATAR_ASSETS);
  // שחזור-מצב (resume): מסמן מחדש כל שלב שכבר נענה בעבר, לפני ש-
  // s4ShowStep חושף את השלב הנוכחי — כך חזרה למסך זה לא נותנת ניסיון
  // חדש (עקבי עם כלל ה-resume-state הכללי של הפרויקט).
  Object.keys(s4State.answers).forEach(function (stepNumStr) {
    const stepNum = parseInt(stepNumStr, 10);
    const stepDef = S4_STEPS[stepNum];
    const chosen = s4State.answers[stepNum];
    document.querySelectorAll('#s4-pills-' + stepNum + ' .s4-pill').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('correct', 'wrong', 'selected');
      if (b.dataset.id === stepDef.correct) b.classList.add('correct');
      else if (b.dataset.id === chosen) b.classList.add('wrong');
    });
    const explainEl = document.getElementById('s4-explain-' + stepNum);
    if (explainEl) explainEl.hidden = false;
    const nextBtn = document.getElementById('s4-next-' + stepNum);
    if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = 'המשך'; }
  });
  s4ShowStep(s4State.step);
  const continueBtn = document.getElementById('s4-continue');
  if (continueBtn) continueBtn.disabled = !s4State.done;
}

function advanceFromS4() {
  if (!s4State.done) return;
  goTo(5);
}

/* =========================================================
   Companion character system — helper functions (ready for use)
   הועתק כפי-שהוא (גנרי, לא ספציפי-מסך) מהמנוע של
   methodica-science-mass-measure-03-01 — resolveCharBubbleImg עובד גם
   על <img> וגם על <video> (לפי tagName בפועל). מסך בחירת הדמות (s0)
   כבר קיים וכותב ל-window.lomdaState.selectedCharacter, אבל עדיין אין
   מסך אחר ביחידה זו שמציג "בועת דיבור"/וידאו-דמות תלוי-בחירה — לכן אין
   עדיין קריאה בפועל לפונקציות האלה. מוכנות לשימוש כשמסך כזה ייבנה (ראו
   Companion character system, 720-templates skill).
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

/* ⚠️ נוסף (20.08.2026) — נכס-זוג-דמויות אמיתי הפך זמין
   (yellow-avatar-and-turquise-avatar.mp4), לפי בקשה מפורשת: "מסך 4
   ...לא משנה מה נבחר במסך הבחירה". מציג את הווידאו הקבוע הזה תמיד,
   בלי תלות ב-selectedCharacter — לא עוד resolveCharBubbleVideo/
   S3_AVATAR_ASSETS (החלפה-לפי-דמות) למסכים האלה. */
function setFixedCharVideo(videoId, src) {
  const el = document.getElementById(videoId);
  if (!el) return;
  if (el.getAttribute('src') !== src) {
    el.setAttribute('src', src);
    el.load();
  }
  el.play().catch(function () {});
}

/* =========================================================
   מסך 6 — מסך מעבר, data-screen="5", id="s5". שקף 23.
   ⚠️ תוקן (31.08.2026, לפי בקשה מפורשת: "התמונה צריכה להיות אחת מ:
   yellow-avatar-muscle.mp4 / boy-avatar-muscle.mp4, כמובן לפי הבחירה
   במסך 1") — דורס את ההחלטה הקודמת (20.08.2026, נכס-זוג-דמויות קבוע,
   בלי תלות בבחירה). חזרה ל-resolveCharBubbleVideo/מפת-נכסים-לפי-דמות,
   אותה מפה בדיוק כמו S4_INTRO_AVATAR_ASSETS (מסך 5, אותם שני קבצים).
   ⚠️ שים לב: מסך 4 (resetScreenState3, S3-avatar) עדיין משתמש בנכס
   הקבוע הזוגי (setFixedCharVideo) — התוקן כאן רק במסך 6, לפי הבקשה
   הספציפית; שני המסכים היו מתועדים כ"זהים בדיוק" קודם, ועכשיו סוטים
   זה מזה במכוון-לפי-בקשה, לא בטעות. אם גם מסך 4 צריך את אותו שינוי —
   לא בוצע כאן, יש לבקש במפורש. */
const S5_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-muscle.mp4',
  'character-2': 'assets/videos/yellow-avatar-muscle.mp4'
};
function resetScreenState5() {
  resolveCharBubbleVideo('s5-avatar', S5_AVATAR_ASSETS);
}

/* =========================================================
   מסך 7 — ValueInputQuestion כפול, מסך גלילה, data-screen="6", id="s6".
   שקפים 24-26. שאלה 1 (בקבוקים, 3 סעיפים) נבדקת כיחידה אחת בכפתור
   "צדקתי?" אחד (התסריט נותן משוב-אחד משותף לשלושת הסעיפים, לא שלושה
   נפרדים). שאלה 2 (זוויות, 2 סעיפים) כנ"ל, עם כפתור "אפשר רמז?"
   נוסף (מוסתר-עד-ניסיון-שגוי, לפי המוסכמה הגלובלית). שני ניסיונות
   לכל שאלה — ניסיון ראשון שגוי: גבול-אדום בלבד, נשאר פתוח לתיקון;
   ניסיון שני שגוי: חושף את הערכים הנכונים ונועל (אין reveal-button
   נפרד, לפי אותה מוסכמה "תיבת-משוב חושפת את התשובה בעצמה" שכבר
   קיימת במסכים 2/3/5 של הפרויקט הזה). ראו ARCHITECTURE.md § "מסך 7".
   ========================================================= */
/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md) — הודעת-
   ביניים משותפת לשני השאלות, לשימוש חוזר גם בניסיון-אחרון-שגוי וגם
   בכל טוגל חזרה אליה. אין לשנות טקסטי-משוב קיימים (wrongOnce/
   correctMsg/wrongFinal) כדי לממש את זה — רק הודעת-הביניים הזו חדשה. */
const S6_PENDING_FEEDBACK = { title: 'התשובה אינה נכונה.', body: 'רוצים לראות את הפתרון הנכון?' };

const S6_Q = {
  1: {
    inputs: ['s6-q1-a', 's6-q1-b', 's6-q1-c'],
    correct: [12, 24, 36],
    checkBtn: 's6-q1-check',
    feedbox: 's6-q1-feedbox',
    revealBtn: 's6-q1-reveal-btn',
    next: 2,
    wrongOnce: { title: 'התשובה אינה נכונה.', body: 'נסו שוב.' },
    correctMsg: {
      title: 'כל הכבוד, צדקתם!',
      body: 'א. בכל מדף נסדר 2 בקבוקי תות ו-3 בקבוקי מנגו, כלומר 5 בקבוקים בסך הכול. נחלק את סך כל הבקבוקים במספר הבקבוקים בכל מדף ונקבל: 60 : 5 = 12.\nב. סידרנו את הבקבוקים ב-12 מדפים, ובכל מדף יש 2 בקבוקי תות. לכן מספר הבקבוקים בטעם תות הוא: 12⋅2=24.\nג. בכל מדף יש 3 בקבוקים בטעם מנגו, לכן: 12⋅3=36.'
    },
    wrongFinal: {
      title: 'טעיתם. לא נורא, מטעויות לומדים',
      body: 'א. בכל מדף נסדר 2 בקבוקי תות ו-3 בקבוקי מנגו, כלומר 5 בקבוקים בסך הכול. נחלק את סך כל הבקבוקים במספר הבקבוקים בכל מדף ונקבל: 60 : 5 = 12.\nב. סידרנו את הבקבוקים ב-12 מדפים, ובכל מדף יש 2 בקבוקי תות. לכן מספר הבקבוקים בטעם תות הוא: 12⋅2=24.\nג. בכל מדף יש 3 בקבוקים בטעם מנגו, לכן: 12⋅3=36.'
    }
  },
  2: {
    inputs: ['s6-q2-a', 's6-q2-b'],
    correct: [18, 72],
    checkBtn: 's6-q2-check',
    feedbox: 's6-q2-feedbox',
    revealBtn: 's6-q2-reveal-btn',
    hintBtn: 's6-q2-hint-btn',
    next: null,
    wrongOnce: { title: 'התשובה אינה נכונה.', body: 'נסו שוב.' },
    correctMsg: {
      title: 'כל הכבוד, צדקתם!',
      body: 'ידוע כי זווית ABC=90°, והיחס בין זווית α לזווית β הוא 1:4. ה"שלם" שלנו הוא 1+4=5 חלקים, לכן: גודלה של α הוא 1/5⋅90°=18°, וגודלה של β הוא 4/5⋅90°=72°.'
    },
    wrongFinal: {
      title: 'טעיתם. לא נורא, מטעויות לומדים',
      body: 'ידוע כי זווית ABC=90°, והיחס בין זווית α לזווית β הוא 1:4. ה"שלם" שלנו הוא 1+4=5 חלקים, לכן: גודלה של α הוא 1/5⋅90°=18°, וגודלה של β הוא 4/5⋅90°=72°.'
    }
  }
};
const s6Attempts = {};
const s6Outcome = { 1: null, 2: null }; // 'success' | 'fail' | null — resume-state + qnav מקור-אמת
/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md) — snapshot
   של הערכים שהלומד/ת עצמם הקלידו ברגע הניסיון-האחרון-השגוי (לפני כל
   reveal), כדי שכפתור "התשובה שלי" יוכל לשחזר אותם. revealed עוקב
   אחרי מצב-הטוגל הנוכחי לכל שאלה בנפרד. */
const s6AnswerSnapshot = { 1: null, 2: null };
const s6Revealed = { 1: false, 2: false };

function s6OnInput(n) {
  const cfg = S6_Q[n];
  if (s6Outcome[n] !== null) return;
  const allFilled = cfg.inputs.every(function (id) { return document.getElementById(id).value.trim() !== ''; });
  const btn = document.getElementById(cfg.checkBtn);
  if (btn) btn.disabled = !allFilled;
  cfg.inputs.forEach(function (id) {
    document.getElementById(id).classList.remove('correct', 'wrong');
  });
  const fb = document.getElementById(cfg.feedbox);
  if (fb) fb.classList.remove('visible');
}

/* ⚠️ תוקן (18.08.2026) — SELF-QA-lomda.md §1: תג-ה-X השגוי הופיע עד כה
   רק בניסיון-האחרון-שנחסם (הענף else למטה), לא בניסיון הראשון השגוי —
   בניגוד לדפוס viqCheck() ב-methodica-math-ratio-01-02, ששם כל ניסיון
   שגוי (כולל הראשון) מסמן .wrong באופן מיידי. תוקן: ענף "ניסיון ראשון
   שגוי" עכשיו מוסיף .wrong לכל input שגוי, בדיוק כמו הענף הסופי.
   גם עבר מ-.error ל-.correct/.wrong (ישירות על ה-<input>, לא על
   .viq-input-wrap) — תואם לדפוס-ה-CSS שנבנה-מחדש (background-image
   ישירות על ה-input, לא badge/span נפרד). */
function s6Check(n) {
  const cfg = S6_Q[n];
  if (s6Outcome[n] !== null) return; // resume/re-click guard — כבר ננעל

  /* ⚠️ נוסף (31.08.2026, דיווח: "המשוב עולה על הפופ-אפ של הרמז") —
     סוגר רמז פתוח (s6-q2-hint-overlay) לפני שמציגים משוב. */
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) { el.hidden = true; });

  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const isCorrect = inputs.every(function (input, i) { return Number(input.value) === cfg.correct[i]; });
  s6Attempts[n] = (s6Attempts[n] || 0) + 1;

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
    s6Outcome[n] = 'success';
    s6Finish(n);
  } else if (s6Attempts[n] < 2) {
    inputs.forEach(function (input, i) {
      input.classList.toggle('wrong', Number(input.value) !== cfg.correct[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongOnce.title;
    bodyEl.textContent = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true; // נעול עד ש-s6OnInput יופעל מחדש ע"י שינוי ערך
    if (cfg.hintBtn) document.getElementById(cfg.hintBtn).disabled = false;
  } else {
    /* ⚠️ תוקן (31.08.2026, לפי דיווח: "כשמוצגת התשובה הנכונה עדיין יש
       את האייקון של X", ולפי הנחיות-כפתור-התשובה-הנכונה.md) — קודם:
       ניסיון-אחרון-שגוי דרס את הערכים בתשובה-הנכונה מיד (input.value=
       cfg.correct[i]) אבל השאיר .wrong (מהערכת-הניסיון-הכושל) — התשובה
       הנכונה הוצגה עם אייקון-שגיאה. עכשיו: הערכים של הלומד/ת עצמם
       נשארים (עם .correct/.wrong ביחס-אליהם), נלקח snapshot, מוצגת
       הודעת-ביניים, וכפתור "התשובה הנכונה" נחשף — הלומד/ת בוחרים אם
       לראות את הפתרון (s6ToggleReveal), לא נכפה עליהם אוטומטית. */
    inputs.forEach(function (input, i) {
      input.classList.toggle('wrong', Number(input.value) !== cfg.correct[i]);
      input.classList.toggle('correct', Number(input.value) === cfg.correct[i]);
      input.disabled = true;
    });
    s6AnswerSnapshot[n] = inputs.map(function (input) { return input.value; });
    s6Revealed[n] = false;
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = S6_PENDING_FEEDBACK.title;
    bodyEl.textContent = S6_PENDING_FEEDBACK.body;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
    }
    s6Outcome[n] = 'fail';
    s6Finish(n);
  }
}

/* ⚠️ נוסף (31.08.2026, לפי הנחיות-כפתור-התשובה-הנכונה.md, וריאנט 2 —
   מסך כתוב-ידני) — טוגל: לחיצה ראשונה חושפת את התשובה הנכונה בפועל
   (מעדכנת את הערכים, מסמנת .correct, מציגה את wrongFinal הקיים ללא
   שינוי), לחיצה שנייה משחזרת בדיוק את מה שהלומד/ת עצמם הקלידו
   (מ-snapshot) עם .correct/.wrong ביחס-אליו, וחוזרת להודעת-הביניים. */
function s6ToggleReveal(n) {
  const cfg = S6_Q[n];
  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const fb = document.getElementById(cfg.feedbox);
  const titleEl = fb.querySelector('.scq-fb-title-text');
  const bodyEl = fb.querySelector('.scq-fb-body');
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!s6Revealed[n]) {
    inputs.forEach(function (input, i) {
      input.value = cfg.correct[i];
      input.classList.remove('wrong');
      input.classList.add('correct');
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = cfg.wrongFinal.title;
    bodyEl.textContent = cfg.wrongFinal.body;
    s6Revealed[n] = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    const snapshot = s6AnswerSnapshot[n];
    inputs.forEach(function (input, i) {
      input.value = snapshot[i];
      input.classList.toggle('correct', Number(snapshot[i]) === cfg.correct[i]);
      input.classList.toggle('wrong', Number(snapshot[i]) !== cfg.correct[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.textContent = S6_PENDING_FEEDBACK.title;
    bodyEl.textContent = S6_PENDING_FEEDBACK.body;
    s6Revealed[n] = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

function s6Finish(n) {
  const cfg = S6_Q[n];
  document.getElementById(cfg.checkBtn).disabled = true;
  if (cfg.hintBtn) document.getElementById(cfg.hintBtn).disabled = true;
  updateS6Qnav();
  if (cfg.next) {
    const nextEl = document.getElementById('s6-q' + cfg.next);
    if (nextEl && nextEl.hidden) {
      nextEl.hidden = false;
      s6MaybeShowScrollGesture();
      /* QA 19.08.2026: גוללים אל תיבת-המשוב-הגלויה של השאלה הקודמת
         (אם קיימת), לא אל השאלה החדשה עצמה — אחרת תיבת-המשוב הסטטית
         (יושבת בתחתית השאלה הקודמת) נדחפת מעל שולי-אזור-הראייה.
         QA 20.08.2026: הדגל למטה מבדיל את הגלילה-היזומה-הזו מגלילה
         אמיתית של הלומד/ת — ראו ההערה המלאה ליד s6MaybeShowScrollGesture. */
      s6GestureProgrammaticScroll = true;
      setTimeout(function () { s6GestureProgrammaticScroll = false; }, 700);
      requestAnimationFrame(function () {
        const prevFb = nextEl.previousElementSibling && nextEl.previousElementSibling.querySelector('.scq-fb-box.visible');
        (prevFb || nextEl).scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
  } else {
    document.getElementById('s6-continue').disabled = false;
  }
}

function updateS6Qnav() {
  const currentIdx = s6Outcome[1] === null ? 1 : (s6Outcome[2] === null ? 2 : null);
  [1, 2].forEach(function (n) {
    const icon = document.getElementById('s6-qnav-icon-' + n);
    const label = document.getElementById('s6-qnav-label-' + n);
    if (!icon) return;
    icon.className = 'qnav-icon';
    if (label) label.className = 'qnav-label';
    if (s6Outcome[n] === 'success') { icon.classList.add('qnav-success'); if (label) label.classList.add('qnav-label-active'); }
    else if (s6Outcome[n] === 'fail') { icon.classList.add('qnav-fail'); if (label) label.classList.add('qnav-label-active'); }
    else if (n === currentIdx) { icon.classList.add('qnav-current'); if (label) label.classList.add('qnav-label-active'); }
    else { icon.classList.add('qnav-future'); }
  });
  const line = document.getElementById('s6-qnav-line-1');
  if (line) { line.className = 'qnav-line'; if (s6Outcome[1] !== null) line.classList.add('line-done'); }
}

function s6HintOpen() { document.getElementById('s6-q2-hint-overlay').hidden = false; }
function s6HintClose() { document.getElementById('s6-q2-hint-overlay').hidden = true; }

/* Gesture Hint — Cursor Scroll (SELF-QA-lomda.md §7), אותו מנגנון
   בדיוק כמו s1MaybeShowScrollGesture/s2MaybeShowScrollGesture. */
let s6GestureShown = false;
/* QA 19.08.2026: אותו תיקון בדיוק כמו s1MaybeShowScrollGesture — נבדק
   בפועל אם יש מה לגלול לפני הצגת הרמז. נקראת שוב מתוך s6Finish בזמן
   חשיפת שאלה 2.
   QA 20.08.2026: תוקן שוב — המאזין החד-פעמי לא הבחין בין גלילה
   אמיתית לגלילה **פרוגרמטית** שנגרמת מה-scrollIntoView שנוסף
   ב-s6Finish (19.08.2026, לגלילה אל תיבת-המשוב הקודמת) — בדיוק אותו
   באג ואותו תיקון כמו s1MaybeShowScrollGesture. */
let s6GestureProgrammaticScroll = false;
function s6MaybeShowScrollGesture() {
  /* ⚠️ rAF-wrapped (01.09.2026, דיווח: "חסרה כף יד") — נקראת מתוך resetScreenState*, לפני שה-.active נוסף למסך (display:none עדיין), אז scrollHeight/clientHeight נמדדים כ-0 ו-0<=0 גורם ל-return מוקדם לצמיתות. עוטף את כל גוף-הפונקציה ב-requestAnimationFrame כדי שהמדידה תרוץ אחרי שהמסך כבר גלוי. */
  requestAnimationFrame(function () {
  if (s6GestureShown) return;
  const gesture = document.getElementById('s6-scroll-gesture');
  const scrollArea = document.getElementById('s6-scroll-area');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s6GestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', s6HideGestureOnScroll, { once: true });

  });}
function s6HideGestureOnScroll() {
  const scrollArea = document.getElementById('s6-scroll-area');
  const gesture = document.getElementById('s6-scroll-gesture');
  if (!scrollArea || !gesture) return;
  if (s6GestureProgrammaticScroll) {
    scrollArea.addEventListener('scroll', s6HideGestureOnScroll, { once: true });
    return;
  }
  gesture.hidden = true;
}

function resetScreenState6() {
  [1, 2].forEach(function (n) {
    const cfg = S6_Q[n];
    if (s6Outcome[n] !== null) return; // resume-state guard — אין ניסיון נוסף בחזרה למסך שכבר הושלם
    cfg.inputs.forEach(function (id) {
      const input = document.getElementById(id);
      input.value = '';
      input.disabled = false;
      input.classList.remove('correct', 'wrong');
    });
    document.getElementById(cfg.checkBtn).disabled = true;
    if (cfg.hintBtn) document.getElementById(cfg.hintBtn).disabled = true;
    const fb = document.getElementById(cfg.feedbox);
    if (fb) fb.classList.remove('visible', 'is-correct', 'is-wrong');
    s6Attempts[n] = 0;
    /* ⚠️ נוסף (31.08.2026) — איפוס snapshot/טוגל+כפתור-חשיפה, לפי
       הנחיות-כפתור-התשובה-הנכונה.md § "רשימת בדיקה". אין isOutcome!==null
       guard נוסף כאן — כבר בתוך התנאי הזה (למעלה), שרץ רק על שאלות
       שעדיין לא נענו. */
    s6AnswerSnapshot[n] = null;
    s6Revealed[n] = false;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = true; revealBtn.textContent = 'התשובה הנכונה'; }
    }
  });
  document.getElementById('s6-q2').hidden = (s6Outcome[1] === null);
  document.getElementById('s6-continue').disabled = (s6Outcome[2] === null);
  updateS6Qnav();
  s6MaybeShowScrollGesture();
}

/* =========================================================
   GLOBAL — Feedback popup drag/reset helpers (ready, not yet
   instantiated — no question screen exists yet in this scene).
   לפי _global-components.md → "Feedback popup system" → "Drag bounds":
   הפופ-אפ יכול לזוז בכל הקנבס חוץ מהפס התחתון (74px) ומעבר לגבולות
   הקנבס (1280×710) — הנוסחה clampPopupPosition למטה ממומשת בדיוק לפי
   המפרט, כולל המרת דלתא-הסמן ממרחב-viewport למרחב-קנבס-לוגי (חלוקה
   בגורם ה-scale הנוכחי של scaleApp()) לפני ההרצה.
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
/* QA 19.08.2026: כל שבעת תיבות-המשוב בפרויקט הזה (s1-q1/q2/q3,
   s2-c/e, s6-q1/q2) הפכו ל-.is-static (זורמות בתוך השאלה עצמה, מיד
   אחרי כפתור-הבדיקה — ראו styles.css + index.html) — משום ששלושת
   המסכים היחידים בסיין הזה עם שאלות-אמיתיות (s1/s2/s6) הם כולם
   מסכי-גלילה, ופופאפ-משוב במיקום קבוע-לקנבס מתנתק חזותית מהשאלה
   ברגע שגוללים לחלק אחר. לכן אין יותר קריאות scqFbMakeDraggable
   בקובץ הזה בכלל — כל שבעת ה-id-ים הוסרו. */
(function () {
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
})();
