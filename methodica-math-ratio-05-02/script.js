'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 2
   Shared engine: ../unit-js/ (loaded before this file). */

const TOTAL_SCREENS = 5;

const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 1 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 3 },
    { number: 4, visited: false, state: 'not-answered', screen: 4 }
  ]
};

Object.assign(SCQ_CFG, {
  s3p2: {
    containerSel: '#s3-part-2',
    correctId: 'b',
    checkBtnId: 's3-p2-check',
    feedboxId: 's3-p2-feedbox',
    correctMsg: { title: 'נכון!', body: 'ידוע כי <span dir="ltr">∢BAC=60°</span> .<br>סכום הזוויות במשולש הוא <span dir="ltr">180°</span><br>לכן גודל שתי הזוויות האחרות של המשולש הוא<br><span dir="ltr">180° − 60° = 120°</span><br>היחס בין שתי הזוויות הוא 5 : 3 .<br>נחשב כל אחת מהזוויות: <br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · 120 = 45°</span><br><span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">8</span></span> · 120 = 75°</span><br>גודלן של שתי הזוויות האחרות במשולש הוא <span dir="">45°, 75°</span>.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'ידוע כי <span dir="ltr">∢BAC=60°</span> .<br>סכום הזוויות במשולש הוא <span dir="ltr">180°</span><br>לכן גודל שתי הזוויות האחרות של המשולש הוא<br><span dir="ltr">180° − 60° = 120°</span><br>היחס בין שתי הזוויות הוא 5 : 3 .<br>נחשב כל אחת מהזוויות: <br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · 120 = 45°</span><br><span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">8</span></span> · 120 = 75°</span><br>גודלן של שתי הזוויות האחרות במשולש הוא <span dir="">45°, 75°</span>.' }
  },
  s4p1: {
    containerSel: '#s4-part-1',
    correctId: 'b',
    checkBtnId: 's4-p1-check',
    feedboxId: 's4-p1-feedbox',
    correctMsg: { title: 'נכון מאוד!', body: '<strong>נופר השתתפה ביותר מישחים - </strong>לשניהם אותו מספר ניצחונות, אך נופר נדרשה ל-8 מישחים על כל 3 ניצחונות (לעומת 5 בלבד אצל דניאל), ולכן עשתה יותר מישחים בסך הכל.' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם, בואו נסביר:', body: '<strong>נופר השתתפה ביותר מישחים - </strong>לשניהם אותו מספר ניצחונות, אך נופר נדרשה ל-8 מישחים על כל 3 ניצחונות (לעומת 5 בלבד אצל דניאל), ולכן עשתה יותר מישחים בסך הכל.' }
  },
  s4p2: {
    containerSel: '#s4-part-2',
    correctId: 'a',
    checkBtnId: 's4-p2-check',
    feedboxId: 's4-p2-feedbox',
    correctMsg: { title: 'נכון מאוד!', body: '<strong>דניאל</strong> <strong>ניצח ביותר מישחים</strong> – דניאל מנצח ב-3 מתוך 5 מישחים (יותר ממחצית מסך המישחים שלו), לעומת נופר שמנצחת ב-3 מתוך 8 (פחות מחצי).' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'טעיתם, בואו נסביר:', body: '<strong>דניאל</strong> <strong>ניצח ביותר מישחים</strong> – דניאל מנצח ב-3 מתוך 5 מישחים (יותר ממחצית מסך המישחים שלו), לעומת נופר שמנצחת ב-3 מתוך 8 (פחות מחצי).' }
  }
});

function s3P2Select(id) { scqSelect('s3p2', id); }
function s3P2Check() { scqCheck('s3p2'); }
function s4P1Select(id) { scqSelect('s4p1', id); }
function s4P1Check() { scqCheck('s4p1'); }
function s4P2Select(id) { scqSelect('s4p2', id); }
function s4P2Check() { scqCheck('s4p2'); }

Object.assign(VIQ_CFG, {
  s1: {
    inputs: ['s1-a', 's1-b'], correct: [21, 9], checkBtn: 's1-check', feedbox: 's1-feedbox', revealBtn: 's1-reveal-btn', nextScreen: 2,
    correctMsg: { title: 'נכון!', body: 'א. היחס בין מספר העורכים למספר השחקנים בערוץ הוא 7 : 3 .<br>מספר החלקים ה"שלם" הוא: <span dir="">10 = 3 + 7</span>.<br>נחשב את מספר השחקנים : <span dir="ltr"><span class="frac"><span class="frac-num">7</span><span class="frac-den">10</span></span> · 30 = 21</span><br><br>ב. נחשב את מספר העורכים : <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">10</span></span> · 30 = 9</span>' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'א. היחס בין מספר העורכים למספר השחקנים בערוץ הוא 7 : 3 .<br>מספר החלקים ה"שלם" הוא: <span dir="">10 = 3 + 7</span>.<br>נחשב את מספר השחקנים : <span dir="ltr"><span class="frac"><span class="frac-num">7</span><span class="frac-den">10</span></span> · 30 = 21</span><br><br>ב. נחשב את מספר העורכים : <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">10</span></span> · 30 = 9</span>' },
    onDone: function () {
      practiceProgress.questions[0].state = viqState.s1.outcome === 'success' ? 'correct' : 'incorrect';
      syncPracticeProgressNav(document.getElementById('s1'));
    }
  },
  s2: {
    inputs: ['s2-a-x', 's2-a-y', 's2-b-x', 's2-b-y'], correct: [5, 25, 25, 25], checkBtn: 's2-check', feedbox: 's2-feedbox', revealBtn: 's2-reveal-btn', nextScreen: 3,
    correctMsg: { title: 'נכון!', body: 'א. היחס בין מספר הבנים למספר הבנות הוא 5 : 1.<br>נחשב את מספר הבנים: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">6</span></span> · 30 = 5</span><br>נחשב את מספר הבנות: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">6</span></span> · 30 = 25</span><br>שיעורי נקודה A הם (5,25).<br><br>ב. בחצי השעה השנייה התווספו רק בנים, והיחס החדש הוא 1 : 1. מספר הבנות לא השתנה, לכן מספר הבנים החדש הוא 25.<br>שיעורי נקודה B הם (25,25).' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'א. היחס בין מספר הבנים למספר הבנות הוא 5 : 1.<br>נחשב את מספר הבנים: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">6</span></span> · 30 = 5</span><br>נחשב את מספר הבנות: <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">6</span></span> · 30 = 25</span><br>שיעורי נקודה A הם (5,25).<br><br>ב. בחצי השעה השנייה התווספו רק בנים, והיחס החדש הוא 1 : 1. מספר הבנות לא השתנה, לכן מספר הבנים החדש הוא 25.<br>שיעורי נקודה B הם (25,25).' },
    onDone: function () {
      practiceProgress.questions[1].state = viqState.s2.outcome === 'success' ? 'correct' : 'incorrect';
      syncPracticeProgressNav(document.getElementById('s2'));
    }
  },
  s4p3: {
    inputs: ['s4-p3-a', 's4-p3-b'], correct: [20, 32], checkBtn: 's4-p3-check', feedbox: 's4-p3-feedbox', revealBtn: 's4-p3-reveal-btn', nextScreen: null,
    correctMsg: { title: 'נכון!', body: 'ג. נתון כי דניאל ניצח ב-12 מישחים שהם <span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> מכלל המישחים שהוא השתתף בהם.<br>נסמן את כלל המישחים ב-x ונבנה את המשוואה: <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> · x = 12</span><br>נחלק ב-<span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> ונקבל: <span dir="ltr">x = 20</span>.<br><strong>לכן, דניאל שחה 20 מישחים בכל העונה.</strong><br>נתון כי נופר ודניאל השיגו את אותו מספר ניצחונות לכן נופר ניצחה ב-12 מישחים שהם <span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> מכלל המישחים בהם השתתפה.<br>נסמן את כלל המישחים ששחתה נופר ב-y ונבנה את המשוואה:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · y = 12</span><br>נחלק ב-<span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> ונקבל: <span dir="ltr">y = 32</span>.<br><strong>לכן, נופר שחתה 32 מישחים בכל העונה.</strong>' },
    wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
    wrongFinal: { title: 'לא נכון.', body: 'ג. נתון כי דניאל ניצח ב-12 מישחים שהם <span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> מכלל המישחים שהוא השתתף בהם.<br>נסמן את כלל המישחים ב-x ונבנה את המשוואה: <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> · x = 12</span><br>נחלק ב-<span class="frac"><span class="frac-num">3</span><span class="frac-den">5</span></span> ונקבל: <span dir="ltr">x = 20</span>.<br><strong>לכן, דניאל שחה 20 מישחים בכל העונה.</strong><br>נתון כי נופר ודניאל השיגו את אותו מספר ניצחונות לכן נופר ניצחה ב-12 מישחים שהם <span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> מכלל המישחים בהם השתתפה.<br>נסמן את כלל המישחים ששחתה נופר ב-y ונבנה את המשוואה:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · y = 12</span><br>נחלק ב-<span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> ונקבל: <span dir="ltr">y = 32</span>.<br><strong>לכן, נופר שחתה 32 מישחים בכל העונה.</strong>' },
    onDone: function () { s4UpdateAggregate(); }
  }
});

function s1OnInput() { viqOnInput('s1'); }
function s1Check() { viqCheck('s1'); }
function s2OnInput() { viqOnInput('s2'); }
function s2Check() { viqCheck('s2'); }
function s4P3OnInput() { viqOnInput('s4p3'); }
function s4P3Check() { viqCheck('s4p3'); }

/* מסך 1 — מסך מעבר, data-screen="0", id="s0". שקף 28. דמות-נלווית */
const S0_AVATAR_ASSETS = {
  'character-1': '../unit-assets/video/boy-avatar-work-out.mp4',
  'character-2': '../unit-assets/video/yellow-avatar-work-out.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* =========================================================
   מסכים 2/3 — ValueInputQuestion + פלייסהולדר-תמונה, data-screen 1/2,
   id s1/s2. שאלה 1/2 מתוך 4.
   ========================================================= */
function resetScreenState1() {
  setCurrentQuestion(practiceProgress, 0);
  syncPracticeProgressNav(document.getElementById('s1'));
}
function resetScreenState2() {
  setCurrentQuestion(practiceProgress, 1);
  syncPracticeProgressNav(document.getElementById('s2'));
}

/* =========================================================
   מסך 4 — מסך גלילה, שאלה 3 מתוך 4, data-screen="3", id="s3". שקפים
   31-33: חלק 1 מידע בלבד, חלק 2 שאלה חד-ברירה, חלק 3 נכון/לא נכון
   (3 טענות). ה"שאלה" הכוללת (question 3 בסרגל ההתקדמות) נפתרת רק
   בסיום חלק 3 — 'incorrect' אם חלק 2 או חלק 3 דרשו גילוי-תשובה, אחרת
   'correct'.
   ========================================================= */

const s3TfCorrect = { 1: 'true', 2: 'true', 3: 'false' };
const s3TfState = { selected: { 1: null, 2: null, 3: null }, attempts: 0, outcome: null };

function s3P3Select(row, val) {
  if (s3TfState.outcome !== null) return;
  s3TfState.selected[row] = val;
  document.getElementById('s3-p3-r' + row + '-true').classList.remove('correct', 'wrong');
  document.getElementById('s3-p3-r' + row + '-false').classList.remove('correct', 'wrong');
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
  const explain = '1. אם זווית <span dir="ltr">∢BAC</span> תהיה בת 100°, אז סכום שתי האחרות יהיה <span dir="ltr">180° − 100° = 80°</span>.<br>אם היחס הוא 3 : 5, אז גודל הזווית הקטנה מבין השתיים הוא : <span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · 80 = 30°</span>.<br><br>2. מאחר והיחס הוא 3 : 5, כדי לקבל זוויות שלמות עלינו לקבל שסכום שתי הזוויות האחרות מתחלק ב-8 (8 = 3 + 5).<br><br>3. אם <span dir="ltr">∢BAC</span> תהיה בת 20°, אז גודלן של שתי האחרות הוא <span dir="">160° = 20 - 180</span>. מכיוון שהיחס הוא 5 : 3, אז נקבל:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">8</span></span> · 160 = 60°</span> או <span dir="ltr"><span class="frac"><span class="frac-num">5</span><span class="frac-den">8</span></span> · 160 = 100°</span><br>ולא זווית ישרה (90°).';

  if (allCorrect) {
    [1, 2, 3].forEach(function (r) {
      document.getElementById('s3-p3-r' + r + '-' + s3TfCorrect[r]).classList.add('correct');
      s3P3Lock(r);
    });
    fb.classList.remove('is-wrong'); fb.classList.add('is-correct');
    titleEl.textContent = 'נכון!';
    bodyEl.innerHTML = explain;
    s3TfState.outcome = 'success';
    s3P3Finish();
  } else if (s3TfState.attempts < 2) {
    [1, 2, 3].forEach(function (r) {
      const correctVal = s3TfCorrect[r];
      document.getElementById('s3-p3-r' + r + '-' + correctVal).classList.toggle('correct', s3TfState.selected[r] === correctVal);
      document.getElementById('s3-p3-r' + r + '-' + (correctVal === 'true' ? 'false' : 'true')).classList.toggle('wrong', s3TfState.selected[r] !== correctVal);
    });
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
    bodyEl.innerHTML = explain;
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

const S3_GESTURE = makeScrollGestureHint('s3-scroll-gesture', 's3-scroll-area');

/* The check button after the true/false rows lines up with the rows' left edge. */
function s3AlignTfCheckBtn() {
  document.querySelectorAll('.tf-rows').forEach(function (rows) {
    const checkBtn = rows.nextElementSibling;
    if (!checkBtn || !checkBtn.classList.contains('s3-inline-btn')) return;
    alignBtnToLeftmost(checkBtn, [rows], rows.parentElement);
  });
}

function resetScreenState3() {
  setCurrentQuestion(practiceProgress, 2);
  syncPracticeProgressNav(document.getElementById('s3'));
  S3_GESTURE.maybeShow();
  requestAnimationFrame(function () { equalizeTfBtnWidths(); s3AlignTfCheckBtn(); });
  requestAnimationFrame(equalizeScqOptWidths);
}

/* =========================================================
   מסך 5 — מסך גלילה, שאלה 4 מתוך 4, data-screen="4", id="s4". שקפים
   34-36: חלק 1+2 שאלה חד-ברירה בלי תמונה, חלק 3 שאלת-קלט כפולה.
   ========================================================= */

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

const S4_GESTURE = makeScrollGestureHint('s4-scroll-gesture', 's4-scroll-area');


function alignViqInlineCheckBtn() {
  document.querySelectorAll('.viq-answers').forEach(function (group) {
    const checkBtn = group.nextElementSibling;
    if (!checkBtn || !checkBtn.classList.contains('s3-inline-btn')) return;
    alignBtnToLeftmost(checkBtn, group.querySelectorAll('.viq-input, .viq-coord'), group.parentElement);
  });
}

function resetScreenState4() {
  setCurrentQuestion(practiceProgress, 3);
  syncPracticeProgressNav(document.getElementById('s4'));
  S4_GESTURE.maybeShow();
  requestAnimationFrame(equalizeScqOptWidths);
  requestAnimationFrame(alignViqInlineCheckBtn);
}

['s1-feedbox', 's2-feedbox'].forEach(scqFbMakeDraggable);
