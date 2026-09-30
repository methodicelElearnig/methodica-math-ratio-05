'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 6
   Shared engine: ../unit-js/ (loaded before this file). */

const TOTAL_SCREENS = 6;

/* Progress Question: 4 סעיפים (א/ב/ג/ד) על שני מסכי-גלילה (מסך 3 = א+ב,
   מסך 5 = ג+ד); שני מופעי ה-progress-nav מסונכרנים יחד. */
const practiceProgress = {
  questions: [
    { number: 1, visited: false, state: 'not-answered', screen: 2 },
    { number: 2, visited: false, state: 'not-answered', screen: 2 },
    { number: 3, visited: false, state: 'not-answered', screen: 4 },
    { number: 4, visited: false, state: 'not-answered', screen: 4 }
  ]
};
function syncBothProgressNavs() {
  syncPracticeProgressNav(document.getElementById('s2'));
  syncPracticeProgressNav(document.getElementById('s4'));
}

/* מסך 1 — מסך מעבר (TransitionScreen), data-screen="0", id="s0". */
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

/* מסך 3 — מסך גלילה, "שאלת השיא" סעיפים א+ב (שקפים 64/65), data-screen="2", */
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

VIQ_CFG_REGISTER('s2p2', {
  inputs: ['s2-p2-input'], correct: [80], checkBtn: 's2-p2-check', feedbox: 's2-p2-feedbox', revealBtn: 's2-p2-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'ידוע כי מ\' <span dir="ltr">AB = 20</span>. היחס בין AT ל-TB הוא 3 : 2.<br>נחשב את AT: <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">5</span></span> ⋅ 20 = 8</span>,<br>לכן שטח הגינה הוא <span dir="ltr"> 10 ⋅ 8 = <span dir="rtl">80 מ"ר</span></span>.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'ידוע כי מ\' <span dir="ltr">AB = 20</span>. היחס בין AT ל-TB הוא 3 : 2.<br>נחשב את AT: <span dir="ltr"><span class="frac"><span class="frac-num">2</span><span class="frac-den">5</span></span> ⋅ 20 = 8</span>,<br>לכן שטח הגינה הוא <span dir="ltr"> 10 ⋅ 8 = <span dir="rtl">80 מ"ר</span></span>.' },
  onDone: function () {
    practiceProgress.questions[1].state = (viqState.s2p2 && viqState.s2p2.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 2);
    syncBothProgressNavs();
    document.getElementById('s2-continue').disabled = false;
  }
});
function s2P2OnInput() { viqOnInput('s2p2'); }
function s2P2Check() { viqCheck('s2p2'); }
function s2P2HintOpen() { document.getElementById('s2-p2-hint-overlay').hidden = false; }
function s2P2HintClose() { document.getElementById('s2-p2-hint-overlay').hidden = true; }

/* מסך 5 — מסך גלילה, "שאלת השיא" סעיפים ג+ד (שקפים 67/68), data-screen="4", */
VIQ_CFG_REGISTER('s2p4', {
  inputs: ['s2-p4-input'], correct: [26], checkBtn: 's2-p4-check', feedbox: 's2-p4-feedbox', revealBtn: 's2-p4-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1.<br>נחשב את השטח המיועד לבנייה לפי היחס המבוקש:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> ⋅ 216 = 162</span><br>ואת השטח המיועד לגינה: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span>  ⋅216 = 54</span>.<br>שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר.<br>לכן, עלינו להעביר <span dir="ltr">80 - 54 = <span dir="rtl">26 מ"ר</span></span> לשטח המיועד לבנייה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח המגרש הוא 216 מ"ר. היחס המבוקש הוא 3 : 1.<br>נחשב את השטח המיועד לבנייה לפי היחס המבוקש:<br><span dir="ltr"><span class="frac"><span class="frac-num">3</span><span class="frac-den">4</span></span> ⋅ 216 = 162</span><br>ואת השטח המיועד לגינה: <span dir="ltr"><span class="frac"><span class="frac-num">1</span><span class="frac-den">4</span></span> ⋅ 216 = 54</span>.<br>שטח הגינה שמצאנו בסעיף ב\' הוא 80 מ"ר.<br>לכן, עלינו להעביר <span dir="ltr">80 - 54 = <span dir="rtl">26 מ"ר</span></span> לשטח המיועד לבנייה.' },
  onDone: function () {
    practiceProgress.questions[3].state = (viqState.s2p4 && viqState.s2p4.outcome === 'fail') ? 'incorrect' : 'correct';
    syncBothProgressNavs();
    document.getElementById('s4-continue').disabled = false;
  }
});
function s2P4OnInput() { viqOnInput('s2p4'); }
function s2P4Check() { viqCheck('s2p4'); }
function s2P4HintOpen() { document.getElementById('s2-p4-hint-overlay').hidden = false; }
function s2P4HintClose() { document.getElementById('s2-p4-hint-overlay').hidden = true; }

VIQ_CFG_REGISTER('s2p5', {
  inputs: ['s2-p5-input'], correct: [28], checkBtn: 's2-p5-check', feedbox: 's2-p5-feedbox', revealBtn: 's2-p5-reveal-btn', nextScreen: null,
  correctMsg: { title: 'כל הכבוד, צדקתם!', body: 'שטח הגינה כולה הוא 216 מ"ר.<br>אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים.<br>לכן, שטח הבנייה ושטח הגינה יהיו:<br><span dir="ltr">216 : 2 = <span dir="rtl">108 מ"ר</span></span>.<br>שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר <span dir="ltr">108 - 80 = <span dir="rtl">28 מ"ר</span></span> משטח הבנייה לשטח הגינה.' },
  wrongOnce: { title: 'לא בדיוק.', body: 'נסו שוב.' },
  wrongFinal: { title: 'טעיתם. לא נורא, מטעויות לומדים', body: 'שטח הגינה כולה הוא 216 מ"ר.<br>אם נרצה לחלק את השטחים ביחס של 1:1, בעצם נרצה ששני השטחים יהיו שווים.<br>לכן, שטח הבנייה ושטח הגינה יהיו:<br><span dir="ltr">216 : 2 = <span dir="rtl">108 מ"ר</span></span>.<br>שטח הגינה הוא 80 מ"ר, לכן נרצה להעביר <span dir="ltr">108 - 80 = <span dir="rtl">28 מ"ר</span></span> משטח הבנייה לשטח הגינה.' },
  onDone: function () {
    practiceProgress.questions[2].state = (viqState.s2p5 && viqState.s2p5.outcome === 'fail') ? 'incorrect' : 'correct';
    setCurrentQuestion(practiceProgress, 3);
    syncBothProgressNavs();
  }
});
function s2P5OnInput() { viqOnInput('s2p5'); }
function s2P5Check() { viqCheck('s2p5'); }
function s2P5HintOpen() { document.getElementById('s2-p5-hint-overlay').hidden = false; }
function s2P5HintClose() { document.getElementById('s2-p5-hint-overlay').hidden = true; }

const S2_GESTURE = makeScrollGestureHint('s2-scroll-gesture', 's2-scroll-area');

/* resetScreenState2 — מחשב איזו שאלה (0-3) צריכה להיות "נוכחית" בעת
   חזרה למסך (למשל דרך "חזרה" ממסך 2), על סמך אילו שאלות כבר נפתרו —
   הכללה של הדפוס החד-תנאי ב-resetScreenState5 של סיין 3 (שם היה רק
   "שאלה 1 נפתרה? כן/לא") ל-4 שאלות ברצף. אין צורך "לאפס" חשיפת-חלקים
   (hidden) או state של viqState/scqState בכלל — ה-DOM (data-attributes/
   disabled/hidden) וה-JS state נשארים כפי שהם לאורך כל חיי העמוד, לפי
   אותה מוסכמה בדיוק כמו כל מסכי-הגלילה מרובי-החלקים בפרויקט הזה. */
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
  S2_GESTURE.maybeShow();
}

/* מסך 4 — תמונה ממלאת-מסך + תגית-מידע, data-screen="3", id="s3". מסך */
function resetScreenState3() {
  /* אין state לאפס — מסך תמונה+כרטיס-מידע סטטי בלבד. */
}

const S4_GESTURE = makeScrollGestureHint('s4-scroll-gesture', 's4-scroll-area');

/* resetScreenState4 — אותו דפוס בדיוק כמו resetScreenState2 (למעלה),
   כנגד אותו practiceProgress משותף (לא מערך-נפרד). */
function resetScreenState4() {
  syncPracticeProgressCurrent();
  S4_GESTURE.maybeShow();
}

/* מסך 6 — מסך-סיום, מסך מעבר (TransitionScreen), data-screen="5", */
const S5_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-jumping-happily.mp4',
  'character-2': 'assets/videos/yellow-avatar-jumping (1).mp4'
};
function resetScreenState5() {
  resolveCharBubbleVideo('s5-avatar', S5_AVATAR_ASSETS);
}
