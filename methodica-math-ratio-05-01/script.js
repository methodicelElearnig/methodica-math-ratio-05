'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 1
   Shared engine: ../unit-js/ (loaded before this file). */

const TOTAL_SCREENS = 7;

function s2EAlignCheckBtn() {
  alignBtnToLeftmost(document.getElementById('s2-e-check'),
    [document.getElementById('s2-eq-diagram')].filter(Boolean), document.getElementById('s2-sec-e'));
}

/* s6 (juice-store ValueInputQuestion) intentionally keeps its own engine
   (S6_Q/s6Check...): unlike the shared VIQ it enables a hint button after
   the first wrong try, resets unfinished inputs on every entry and drives
   the older qnav bar markup. */

/* Called by the shared closeAllPopupsAndHints() on every screen change:
   collapses the expanded simulation (s2) and applet (s6). */
function partClosePopups() {
  s2SimExpandToggle(false);
  s6AppletExpandToggle(false);
}

/* מסך 1 — בחירת דמות מלווה (TwoOptionSelection), data-screen="0", id="s0" */
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
    S1_GESTURE.programmatic = true;
    setTimeout(function () { S1_GESTURE.programmatic = false; }, 700);
    scrollArea.scrollTo({ top: pages[index].offsetTop, behavior: 'smooth' });
  }
  setTimeout(function () { s1Jumping = false; }, 500);
}

function s1InitScrollJump() {
  const scrollArea = document.getElementById('s1-scroll-area');
  if (!scrollArea || scrollArea.dataset.jumpInit) return;
  scrollArea.dataset.jumpInit = 'true';
  scrollArea.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); s1GoToPage(s1CurrentPage + 1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); s1GoToPage(s1CurrentPage - 1); }
  });
}

const S1_GESTURE = makeScrollGestureHint('s1-scroll-gesture', 's1-scroll-area');

function olyOptKey(event, el) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    el.click();
  }
}


function olySetFeedback(feedboxEl, isCorrect, text) {
  scqFbResetPosition(feedboxEl.id);
  feedboxEl.querySelector('.scq-fb-title-text').textContent = (!isCorrect && text !== S2_E_WRONG_ONCE) ? fbCorrectShown(text.title) : text.title;
  feedboxEl.querySelector('.scq-fb-body').innerHTML = text.body;
  feedboxEl.classList.add('visible');
  feedboxEl.classList.toggle('is-correct', isCorrect);
  feedboxEl.classList.toggle('is-wrong', !isCorrect);
}

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
  reportQ(['002', 'q1'], isCorrect, true, xapiAnswerText(document.querySelector('#s1-q1 .scq-opt.selected')));   /* one attempt */

  document.getElementById('s1-q2').hidden = false;
  S1_GESTURE.maybeShow();
  s1GoToPage(1);
}

const S1_Q2_FEEDBACK = {
  correct: {
    title: 'נכון!',
    body: 'מכיוון ששתי המשלחות זכו באותו מספר מדליות - משפחת ב\' זכתה ב 5 מדליות ולפי היחס הנתון 1:8 יש בה פי 8 אנשים ממדליות, כלומר<span dir="rtl"> 40 = 5 * 8 </span></span></span>.'
  },
  wrong: {
    title: 'אופס, לא בדיוק, בואו נסביר',
    body: 'מכיוון ששתי המשלחות זכו באותו מספר מדליות - משפחת ב\' זכתה ב 5 מדליות ולפי היחס הנתון 1:8 יש בה פי 8 אנשים ממדליות, כלומר<span dir="rtl"> 40 = 5 * 8 </span></span></span>.'
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
  reportQ(['002', 'q2'], isCorrect, true, xapiAnswerText(document.querySelector('#s1-q2 .scq-opt.selected')));   /* one attempt */

  document.getElementById('s1-q3').hidden = false;
  S1_GESTURE.maybeShow();
  s1GoToPage(2);
}

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
  S1_GESTURE.maybeShow();
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
  reportQ(['002', 'q3'], isCorrect, true, xapiAnswerText(document.querySelector('#s1-q3 .scq-opt.selected')));   /* one attempt */
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
  S1_GESTURE.maybeShow();

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
    S1_GESTURE.programmatic = true;
    setTimeout(function () { S1_GESTURE.programmatic = false; }, 700);
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

const S2_GESTURE = makeScrollGestureHint('s2-scroll-gesture', 's2-scroll-area');

let s2DragGestureShown = false;
function s2MaybeShowDragGesture() {
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

const S2_C_FEEDBACK = {
  correct: {
    title: 'כל הכבוד!',
    body: 'קיבלנו 10 שורות, אם בכל שורה יש 3 צנוניות ו-4 ראשי חסה אז נקבל:<br><span dir="ltr">3 · 10 = 30 צנוניות </span> <br><span dir="ltr">4 · 10 = 40  ראשי חסה</span>'
  },
  wrong: {
    title: 'זה לא מדויק',
    body: 'קיבלנו 10 שורות, אם בכל שורה יש 3 צנוניות ו-4 ראשי חסה אז נקבל:<br><span dir="ltr">3 · 10 = 30 צנוניות </span> <br><span dir="ltr">4 · 10 = 40  ראשי חסה</span>'
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
  reportQ(['003', 'q1'], isCorrect, true, xapiAnswerText(document.querySelector('#s2-sec-c .scq-opt.selected')));   /* one attempt */
  // תמונת-המשוב (שקף 12: "התמונה עולה יחד עם המשוב") מחליפה את
  // הדמות+בועית באותו מקום פיזי בדיוק — לא מופיעה לצידה.
  document.getElementById('s2-c-char').hidden = true;
  document.getElementById('s2-c-fb-img').hidden = false;
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
let s2ERevealed = false;
let s2EPlacementSnapshot = {};

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
  document.getElementById('s2-e-feedbox').classList.remove('visible');
  s2HideDragGesture(); // ניסיון-גרירה-מוצלח ראשון — מסתיר את ה-gesture hint (לא תלוי-הצלחה/דיוק)
}

const S2_E_FEEDBACK = {
  correct: { title: 'כל הכבוד!', body: 'כשגודל הקבוצה והיחס בין החלקים בה ידועים לנו, זוהי הדרך בה נחשב את גדלי החלקים השונים.' },
  wrong:   { title: 'זה לא מדויק', body: 'כשגודל הקבוצה והיחס בין החלקים בה ידועים לנו, זוהי הדרך בה נחשב את גדלי החלקים השונים.' }
};
const S2_E_WRONG_ONCE = { title: 'התשובה אינה נכונה.', body: 'נסו שוב.' };

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

/* The learner's placements, target by target: 'targetLabel: card | …' */
function s2EAnswerText() {
  return Object.keys(S2_DDQ_CORRECT).map(function (t) {
    const placed = Object.keys(s2EPlacement).find(function (k) { return s2EPlacement[k] === t; });
    return t.replace(/^s2-target-/, '') + ': ' + (placed ? xapiAnswerText(document.getElementById(placed)) : '—');
  }).join(' | ');
}

function s2ECheck() {
  if (s2EChecked) return;
  s2EAttempts++;
  const isCorrect = s2EIsAllCorrect();
  reportQ(['003', 'q2'], isCorrect, isCorrect || s2EAttempts >= 2, s2EAnswerText());
  if (isCorrect) {
    s2EChecked = true;
    s2EDone = true;
    olySetFeedback(document.getElementById('s2-e-feedbox'), true, S2_E_FEEDBACK.correct);
  } else if (s2EAttempts < 2) {
    s2EMarkResult(); // מסמן אדום זמנית — הגרירה עדיין פתוחה לתיקון (לא ננעל)
    olySetFeedback(document.getElementById('s2-e-feedbox'), false, S2_E_WRONG_ONCE);
    document.getElementById('s2-e-check').disabled = true; // נעול עד לסידור-מחדש (s2EDrop קורא ל-s2ECheckEnable מחדש)
  } else {
    s2EChecked = true;
    s2EDone = true;
    s2EPlacementSnapshot = Object.assign({}, s2EPlacement);
    s2ERevealed = false;
    olySetFeedback(document.getElementById('s2-e-feedbox'), false, S2_E_FEEDBACK.wrong);
    const revealBtn = document.getElementById('s2-e-reveal-btn');
    if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
    s2EToggleReveal();
  }
  if (s2EChecked) {
    document.getElementById('s2-e-check').disabled = true;
    s2ERender();
    s2EMarkResult();
    const continueBtn = document.getElementById('s2-continue');
    if (continueBtn) continueBtn.disabled = false;
  }
}

/* טוגל: לחיצה ראשונה חושפת את הסידור הנכון בפועל (s2ERevealCorrect),
   מציגה את S2_E_FEEDBACK.wrong הקיים ללא שינוי; לחיצה שנייה משחזרת
   בדיוק את הסידור שהלומד/ת עצמם ביצעו (מ-snapshot). המשוב המלא נשאר
   קבוע על המסך לאורך כל הטוגל — רק סידור-היעדים וטקסט הכפתור מתחלפים. */
function s2EToggleReveal() {
  const revealBtn = document.getElementById('s2-e-reveal-btn');
  if (!s2ERevealed) {
    s2ERevealCorrect();
    s2ERender();
    s2EMarkResult();
    s2ERevealed = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    s2EPlacement = Object.assign({}, s2EPlacementSnapshot);
    s2ERender();
    s2EMarkResult();
    s2ERevealed = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

const S2_C_AVATAR_ASSETS = {
  'character-1': '../unit-assets/video/boy-avatar-thinking.mp4',
  'character-2': '../unit-assets/video/yellow-avatr-asking.mp4'
};

let s2SimHomeParent = null;
let s2SimHomeNext = null;
function s2SimExpandToggle(expand) {
  const wrap = document.getElementById('s2-sim-wrap');
  const screen = document.getElementById('s2');
  if (!wrap || !screen) return;
  if (expand) {
    if (wrap.classList.contains('is-expanded')) return;
    s2SimHomeParent = wrap.parentElement;
    s2SimHomeNext = wrap.nextSibling;
    screen.appendChild(wrap);
    wrap.classList.add('is-expanded');
  } else {
    if (!wrap.classList.contains('is-expanded')) return;
    wrap.classList.remove('is-expanded');
    if (s2SimHomeParent) s2SimHomeParent.insertBefore(wrap, s2SimHomeNext);
    s2SimHomeParent = null;
    s2SimHomeNext = null;
  }
}

function s6AppletExpandToggle(expand) {
  const wrap = document.getElementById('s6-applet-wrap');
  if (!wrap) return;
  wrap.classList.toggle('is-expanded', !!expand);
}

function resetScreenState2() {
  S2_GESTURE.maybeShow();
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

  if (!s2EChecked) s2MaybeShowDragGesture();

  s2ERender();
  s2ECheckEnable();
  const fbe = document.getElementById('s2-e-feedbox');
  if (s2EChecked) {
    document.getElementById('s2-e-check').disabled = true;
    s2EMarkResult();
    const isAllCorrectE = s2EIsAllCorrect();
    olySetFeedback(fbe, isAllCorrectE, isAllCorrectE ? S2_E_FEEDBACK.correct : S2_E_FEEDBACK.wrong);
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
    S2_GESTURE.programmatic = true;
    scrollArea.scrollTop = 0;
    setTimeout(function () { S2_GESTURE.programmatic = false; }, 700);
  }

  requestAnimationFrame(s2EAlignCheckBtn);
}

function advanceFromS2() {
  if (!s2EDone) return;
  goTo(3);
}

/* מסך 4 — מסך מעבר (TransitionScreen), data-screen="3", id="s3" */
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
  1: { correct: 'true', display: '<span class="frac"><span class="frac-num">2</span><span class="frac-den">7</span></span>' },
  2: { correct: '5/7', display: '<span class="frac"><span class="frac-num">5</span><span class="frac-den">7</span></span>' },
  3: { correct: '16' },
  4: { correct: '40' }
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

function s4Choose(stepNum, id, btnEl) {
  if (s4State.answers[stepNum]) return; // כבר נענה — לא ניתן לשנות (guided, לא נבחן)
  document.querySelectorAll('#s4-pills-' + stepNum + ' .s4-pill').forEach(function (b) {
    b.classList.toggle('selected', b === btnEl);
  });
  s4State.selected = s4State.selected || {};
  s4State.selected[stepNum] = id;
  const continueBtn = document.getElementById('s4-continue');
  if (continueBtn) continueBtn.disabled = false;
}

function s4CheckStep(stepNum) {
  const id = s4State.selected && s4State.selected[stepNum];
  if (!id) return;
  const stepDef = S4_STEPS[stepNum];
  s4State.answers[stepNum] = id;
  reportQ(['004', 'q' + stepNum], id === stepDef.correct, true,   /* guided: one attempt per step */
    xapiAnswerText(document.querySelector('#s4-pills-' + stepNum + ' .s4-pill[data-id="' + id + '"]')));
  document.querySelectorAll('#s4-pills-' + stepNum + ' .s4-pill').forEach(function (b) {
    b.disabled = true;
    b.classList.remove('selected');
    const isChosen = b.dataset.id === id;
    const isPillCorrect = b.dataset.id === stepDef.correct;
    if (isPillCorrect) {
      b.classList.add('correct');
      if (isChosen) b.classList.add('chosen');
    } else if (isChosen) {
      b.classList.add('wrong');
    }
  });
  const explainEl = document.getElementById('s4-explain-' + stepNum);
  if (explainEl) explainEl.hidden = false;
  s4RefreshPreviewRows(stepNum);
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

function s4RefreshPreviewRows(currentStep) {
  for (let i = 1; i <= 4; i++) {
    const label = document.getElementById('s4-preview-label-' + i);
    const box = document.getElementById('s4-preview-box-' + i);
    if (!label || !box) continue;
    label.classList.toggle('current', i === currentStep);
    if (s4State.answers[i]) {
      box.innerHTML = S4_STEPS[i].display || S4_STEPS[i].correct;
      box.classList.add('answered');
    } else {
      box.textContent = '';
      box.classList.remove('answered');
    }
  }
}

let s4NotebookGestureShown = false;
function s4MaybeShowNotebookGesture() {
  requestAnimationFrame(function () {
  if (s4NotebookGestureShown) return;
  const gesture = document.getElementById('s4-notebook-gesture');
  const scrollArea = document.querySelector('#s4-notebook .s4-notebook-scroll');
  if (!gesture || !scrollArea) return;
  if (scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  s4NotebookGestureShown = true;
  gesture.hidden = false;
  scrollArea.addEventListener('scroll', function () { gesture.hidden = true; }, { once: true });

  });}
function s4EqualizePillWidths(stepNum) {
  const group = document.getElementById('s4-pills-' + stepNum);
  if (!group) return;
  const pills = Array.prototype.slice.call(group.querySelectorAll('.s4-pill'));
  if (!pills.length) return;
  pills.forEach(function (p) { p.style.width = ''; p.style.fontWeight = '600'; });
  const maxWidth = Math.max.apply(null, pills.map(function (p) { return p.offsetWidth; }));
  pills.forEach(function (p) { p.style.fontWeight = ''; p.style.width = maxWidth + 'px'; });
}

function s4ShowStep(n) {
  document.getElementById('s4-intro-char').hidden = (n !== 0);
  document.getElementById('s4-step-card').hidden = (n === 0);

  for (let i = 1; i <= 6; i++) {
    const block = document.getElementById('s4-step-' + i);
    if (block) block.hidden = (i !== n);
  }
  requestAnimationFrame(function () { s4EqualizePillWidths(n); });

  s4RefreshPreviewRows(n);

  // "הבעיה המקורית" מלאה-צבע בפתיחה (תואם State-01 ברפרנס), מעומעמת
  // מרגע שהאינטראקציה מתחילה (תואם State-03+ ברפרנס).
  document.getElementById('s4-problem').classList.toggle('s4-problem--dimmed', n >= 1);

  document.getElementById('s4-marbles').hidden = (n !== 6);
  if (n === 6) {
    s4RenderMarbles();
    s4Finish();
  }

  s4State.step = n;
  s4MaybeShowNotebookGesture();

  if (n >= 0 && n <= 5) {
    const continueBtn = document.getElementById('s4-continue');
    if (continueBtn) continueBtn.disabled = (n >= 1 && n <= 4) && !s4State.answers[n];
  }
}

function s4Start() {
  s4ShowStep(1);
}

function s4Next(fromStep) {
  const n = fromStep + 1;
  if (n > 6) { s4Finish(); return; }
  s4ShowStep(n);
}

function s4ContinueClick() {
  const n = s4State.step;
  if (n === 0) { s4Start(); return; }
  if (n === 6) { advanceFromS4(); return; }
  if (n === 5) { s4Next(5); return; }
  if (n >= 1 && n <= 4) {
    if (s4State.answers[n]) s4Next(n);
    else s4CheckStep(n);
  }
}

function s4BackOrPrevScreen() {
  if (s4State.step > 0) {
    s4ShowStep(s4State.step - 1);
  } else {
    goTo(3);
  }
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
      b.classList.remove('correct', 'wrong', 'selected', 'chosen');
      const isChosen = b.dataset.id === chosen;
      const isPillCorrect = b.dataset.id === stepDef.correct;
      if (isPillCorrect) {
        b.classList.add('correct');
        if (isChosen) b.classList.add('chosen');
      } else if (isChosen) {
        b.classList.add('wrong');
      }
    });
    const explainEl = document.getElementById('s4-explain-' + stepNum);
    if (explainEl) explainEl.hidden = false;
  });
  // s4ShowStep (למטה) כבר קובעת מחדש את מצב-ה-disabled של #s4-continue
  // לפי s4State.step/answers/done (ר' סוף s4ShowStep + s4Finish) — אין
  // צורך בקביעה נוספת כאן.
  s4ShowStep(s4State.step);
}

function advanceFromS4() {
  if (!s4State.done) return;
  goTo(5);
}

/* Companion character system — helper functions (ready for use) */


function setFixedCharVideo(videoId, src) {
  const el = document.getElementById(videoId);
  if (!el) return;
  if (el.getAttribute('src') !== src) {
    el.setAttribute('src', src);
    el.load();
  }
  el.play().catch(function () {});
}

/* מסך 6 — מסך מעבר, data-screen="5", id="s5". שקף 23. */
const S5_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-muscle.mp4',
  'character-2': 'assets/videos/yellow-avatar-muscle.mp4'
};
function resetScreenState5() {
  resolveCharBubbleVideo('s5-avatar', S5_AVATAR_ASSETS);
}

/* מסך 7 — ValueInputQuestion כפול, מסך גלילה, data-screen="6", id="s6". */
const S6_Q = {
  1: {
    inputs: ['s6-q1-a', 's6-q1-b', 's6-q1-c'],
    xapi: [['005', 'q1'], ['005', 'q2'], ['005', 'q3']],
    correct: [12, 24, 36],
    checkBtn: 's6-q1-check',
    feedbox: 's6-q1-feedbox',
    revealBtn: 's6-q1-reveal-btn',
    next: 2,
    wrongOnce: { title: 'התשובה אינה נכונה.', body: 'נסו שוב.' },
    correctMsg: {
      title: 'כל הכבוד, צדקתם!',
      body: 'א. בכל מדף נסדר 2 בקבוקי תות ו-3 בקבוקי מנגו, כלומר 5 בקבוקים בסך הכול. נחלק את סך כל הבקבוקים במספר הבקבוקים בכל מדף \n ונקבל:\n <span dir="ltr">60 : 5 = 12</span>.\nב. סידרנו את הבקבוקים ב-12 מדפים, ובכל מדף יש 2 בקבוקי תות.\nלכן מספר הבקבוקים בטעם תות הוא:\n<span dir="ltr">12 ⋅ 2 = 24</span>.\nג. בכל מדף יש 3 בקבוקים בטעם מנגו, לכן: <span dir="ltr">12 ⋅ 3 = 36</span>.'
    },
    wrongFinal: {
      title: 'טעיתם. לא נורא, מטעויות לומדים',
      body: 'א. בכל מדף נסדר 2 בקבוקי תות ו-3 בקבוקי מנגו, כלומר 5 בקבוקים בסך הכול. נחלק את סך כל הבקבוקים במספר הבקבוקים בכל מדף \n ונקבל: <span dir="ltr">60 : 5 = 12</span>.\nב. סידרנו את הבקבוקים ב-12 מדפים, ובכל מדף יש 2 בקבוקי תות.\nלכן מספר הבקבוקים בטעם תות הוא:\n<span dir="ltr">12 ⋅ 2 = 24</span>.\nג. בכל מדף יש 3 בקבוקים בטעם מנגו, לכן: <span dir="ltr">12 ⋅ 3 = 36</span>.'
    }
  },
  2: {
    inputs: ['s6-q2-a', 's6-q2-b'],
    xapi: [['005', 'q4'], ['005', 'q5']],
    correct: [18, 72],
    checkBtn: 's6-q2-check',
    feedbox: 's6-q2-feedbox',
    revealBtn: 's6-q2-reveal-btn',
    hintBtn: 's6-q2-hint-btn',
    next: null,
    wrongOnce: { title: 'התשובה אינה נכונה.', body: 'נסו שוב.' },
    correctMsg: {
      title: 'כל הכבוד, צדקתם!',
      body: 'ידוע כי זווית <span dir="ltr">∢∢ABC = 90°</span>, והיחס בין זווית α לזווית β הוא 1:4.<br>ה"שלם" שלנו הוא <span dir="ltr">1 + 4 = 5</span> חלקים, לכן:<br>גודלה של α הוא <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">5</span></span> ⋅ 90° = 18°</span>,<br>וגודלה של β הוא <span dir="ltr"><span class="frac"><span class="frac-num">4</span><span class="frac-den">5</span></span> ⋅ 90° = 72°</span>.'
    },
    wrongFinal: {
      title: 'טעיתם. לא נורא, מטעויות לומדים',
      body: 'ידוע כי זווית <span dir="ltr">∢ABC = 90°</span>, והיחס בין זווית α לזווית β הוא 1:4.<br>ה"שלם" שלנו הוא <span dir="ltr">1 + 4 = 5</span> חלקים, לכן:<br>גודלה של α הוא <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">5</span></span> ⋅ 90° = 18°</span>,<br>וגודלה של β הוא <span dir="ltr"><span class="frac"><span class="frac-num">4</span><span class="frac-den">5</span></span> ⋅ 90° = 72°</span>.'
    }
  }
};
const s6Attempts = {};
const s6Outcome = { 1: null, 2: null }; // 'success' | 'fail' | null — resume-state + qnav מקור-אמת
const s6AnswerSnapshot = {};
const s6Revealed = {};

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

function s6Check(n) {
  const cfg = S6_Q[n];
  if (s6Outcome[n] !== null) return; // resume/re-click guard — כבר ננעל

  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) { el.hidden = true; });

  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const isCorrect = inputs.every(function (input, i) { return Number(input.value) === cfg.correct[i]; });
  s6Attempts[n] = (s6Attempts[n] || 0) + 1;
  inputs.forEach(function (input, i) {   /* item 005: one question per input (q1..q3, q4..q5) */
    reportQ(cfg.xapi[i], Number(input.value) === cfg.correct[i], isCorrect || s6Attempts[n] >= 2, input.value);
  });

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
    s6Outcome[n] = 'success';
    s6Finish(n);
  } else if (s6Attempts[n] < 2) {
    inputs.forEach(function (input, i) {
      input.classList.toggle('wrong', Number(input.value) !== cfg.correct[i]);
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = cfg.wrongOnce.title;
    bodyEl.innerHTML = cfg.wrongOnce.body;
    document.getElementById(cfg.checkBtn).disabled = true; // נעול עד ש-s6OnInput יופעל מחדש ע"י שינוי ערך
    if (cfg.hintBtn) document.getElementById(cfg.hintBtn).disabled = false;
  } else {
    inputs.forEach(function (input, i) {
      input.classList.toggle('correct', Number(input.value) === cfg.correct[i]);
      input.classList.toggle('wrong', Number(input.value) !== cfg.correct[i]);
      input.disabled = true;
    });
    fb.classList.remove('is-correct'); fb.classList.add('is-wrong');
    titleEl.innerHTML = fbCorrectShown(cfg.wrongFinal.title);
    bodyEl.innerHTML = cfg.wrongFinal.body;
    s6AnswerSnapshot[n] = inputs.map(function (input) { return input.value; });
    s6Revealed[n] = false;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = false; revealBtn.textContent = 'התשובה הנכונה'; }
      s6ToggleReveal(n);
    }
    s6Outcome[n] = 'fail';
    s6Finish(n);
  }
}

/* טוגל: לחיצה ראשונה מציגה את הערכים הנכונים בפועל בשדות, לחיצה שנייה
   משחזרת בדיוק את מה שהלומד/ת הקלידו (מ-snapshot). המשוב המלא
   (wrongFinal) נשאר קבוע על המסך לאורך כל הטוגל — רק ערכי השדות
   וטקסט הכפתור מתחלפים. */
function s6ToggleReveal(n) {
  const cfg = S6_Q[n];
  const inputs = cfg.inputs.map(function (id) { return document.getElementById(id); });
  const revealBtn = document.getElementById(cfg.revealBtn);
  if (!s6Revealed[n]) {
    inputs.forEach(function (input, i) {
      input.value = cfg.correct[i];
      input.classList.remove('wrong');
      input.classList.add('correct');
    });
    s6Revealed[n] = true;
    if (revealBtn) revealBtn.textContent = 'התשובה שלי';
  } else {
    const snapshot = s6AnswerSnapshot[n];
    inputs.forEach(function (input, i) {
      input.value = snapshot[i];
      input.classList.toggle('correct', Number(snapshot[i]) === cfg.correct[i]);
      input.classList.toggle('wrong', Number(snapshot[i]) !== cfg.correct[i]);
    });
    s6Revealed[n] = false;
    if (revealBtn) revealBtn.textContent = 'התשובה הנכונה';
  }
}

function s6Finish(n) {
  const cfg = S6_Q[n];
  document.getElementById(cfg.checkBtn).disabled = true;
  if (cfg.hintBtn) document.getElementById(cfg.hintBtn).disabled = true;
  updateS6Qnav();
  if (!cfg.next) {
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

function s6HintOpen() { document.getElementById('s6-q2-hint-overlay').hidden = false; xapiRequestedHint('005', 'q4'); }
function s6HintClose() { document.getElementById('s6-q2-hint-overlay').hidden = true; }

const S6_GESTURE = makeScrollGestureHint('s6-scroll-gesture', 's6-scroll-area');

function resetScreenState6() {
  [1, 2].forEach(function (n) {
    const cfg = S6_Q[n];
    if (s6Outcome[n] !== null) return;
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
    s6AnswerSnapshot[n] = null;
    s6Revealed[n] = false;
    if (cfg.revealBtn) {
      const revealBtn = document.getElementById(cfg.revealBtn);
      if (revealBtn) { revealBtn.hidden = true; revealBtn.textContent = 'התשובה הנכונה'; }
    }
  });
  document.getElementById('s6-continue').disabled = (s6Outcome[2] === null);
  updateS6Qnav();
  S6_GESTURE.maybeShow();
}

document.addEventListener('click', function (e) {
  const wrap = document.getElementById('s2-sim-wrap');
  if (wrap && wrap.classList.contains('is-expanded') && e.target === wrap) {
    s2SimExpandToggle(false);
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const simWrap = document.getElementById('s2-sim-wrap');
  if (simWrap && simWrap.classList.contains('is-expanded')) s2SimExpandToggle(false);
});

/* ═══════════════ xAPI — this component's reporting seam ═══════════════
   Ids come from ../metadata/methodica-math-ratio-05-01.json (checked on every load by 50-loader.js).
   SCREEN_TO_SUBCONTENT: screen → [item suffix, page-in-item]; exactly TOTAL_SCREENS keys. */
var XAPI_COMP_SLUG = 'methodica-math-ratio-05-01';
var XAPI_COMP_ID   = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-ratio-05-01.json';
var SCREEN_TO_SUBCONTENT = { 0: ['001', 1], 1: ['002', 1], 2: ['003', 1], 3: ['004', 1], 4: ['004', 2], 5: ['005', 1], 6: ['005', 2] };
var XAPI_EVAL_ITEMS = { '002': 1, '003': 1, '004': 1, '005': 1 };   /* items with code-graded questions */
