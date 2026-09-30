'use strict';

/* לומדה 720 — מתמטיקה יעד 1.5 | יחס | סיין 4
   Shared engine: ../unit-js/ (loaded before this file). */

const TOTAL_SCREENS = 3;

/* מסך 1 — מסך מעבר, data-screen="0", id="s0". שקף 51. דמות-נלווית */
const S0_AVATAR_ASSETS = {
  'character-1': 'assets/videos/boy-avatar-i-beat-you.mp4',
  'character-2': 'assets/videos/yellow-avatar-i-beat-you.mp4'
};
function resetScreenState0() {
  resolveCharBubbleVideo('s0-avatar', S0_AVATAR_ASSETS);
}

/* מסך 2 — משימת כיתה, הוראות בלבד (data-screen="1", id="s1"). אין
   בדיקת נכון/שגוי — כפתור ההמשך תמיד פעיל. */
const S1_CHAR_ASSETS = {
  'character-1': '../unit-assets/video/boy-avatar-thinking.mp4',
  'character-2': '../unit-assets/video/yellow-avatr-asking.mp4'
};
const S1_GESTURE = makeScrollGestureHint('s1-scroll-gesture', 's1-scroll-area');

function resetScreenState1() {
  resolveCharBubbleVideo('s1-char-img', S1_CHAR_ASSETS);
  S1_GESTURE.maybeShow();
}
function s1Continue() { goTo(2); }

/* מסך 3 — המשך משימת הכיתה: קלט פתוח בלי תשובה-נכונה (data-screen="2",
   id="s2"). "המשך" פעיל רק כשכל 6 השדות מלאים; אין בדיקת-נכונות — אלה
   נתונים אישיים של הלומד/ת. */
const S2_OPEN_INPUT_IDS = ['s2-obj-1', 's2-obj-2', 's2-ratio1-a', 's2-ratio1-b', 's2-ratio2-a', 's2-ratio2-b'];
function s2OnInput() {
  const allFilled = S2_OPEN_INPUT_IDS.every(function (id) {
    return document.getElementById(id).value.trim() !== '';
  });
  document.getElementById('s2-continue').disabled = !allFilled;
}
const S2_CHAR_ASSETS = {
  'character-1': '../unit-assets/video/boy-avatar-thinking.mp4',
  'character-2': '../unit-assets/video/yellow-avatr-asking.mp4'
};
const S2_GESTURE = makeScrollGestureHint('s2-scroll-gesture', 's2-scroll-area');

function resetScreenState2() {
  resolveCharBubbleVideo('s2-char-img', S2_CHAR_ASSETS);
  S2_GESTURE.maybeShow();
}

/* ═══════════════ xAPI — this component's reporting seam ═══════════════
   Ids come from ../metadata/methodica-math-ratio-05-04.json (checked on every load by 50-loader.js).
   SCREEN_TO_SUBCONTENT: screen → [item suffix, page-in-item]; exactly TOTAL_SCREENS keys. */
var XAPI_COMP_SLUG = 'methodica-math-ratio-05-04';
var XAPI_COMP_ID   = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-ratio-05-04.json';
var SCREEN_TO_SUBCONTENT = { 0: ['001', 1], 1: ['001', 2], 2: ['002', 1] };
var XAPI_EVAL_ITEMS = {  };   /* items with code-graded questions */
