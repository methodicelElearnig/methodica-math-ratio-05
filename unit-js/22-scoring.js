'use strict';
/* ═══════════════════ xAPI — item and component results ═══════════════════
   Results are derived from XAPI_Q_RESULTS (20-xapi.js: '<item>/<qKey>' → correct, written by
   every answered call) and from the metadata, which is the source of truth for how many
   questions an item declares. So a result can never disagree with the answers already reported,
   and an unanswered question counts as not correct.

   Per-part seams (script.js):
     XAPI_EVAL_ITEMS       items that carry a code-graded question, e.g. { '002': 1, '003': 1 }
     XAPI_PASS_SCALED      optional pass threshold for the component and its items (default 0.6,
                           the threshold MOE's own example uses; 06: 0.5 = "2 of 4" on screen) */
var XAPI_DEFAULT_PASS = 0.6;

function xapiPassScaled() {
  return (typeof XAPI_PASS_SCALED === 'number') ? XAPI_PASS_SCALED : XAPI_DEFAULT_PASS;
}

/* Number of questions the metadata declares for an item; falls back to the answers seen so far
   when the metadata is not loaded (reporting off) so the call never throws. */
function itemQuestionCount(item) {
  try {
    var sc = (window.METADATA && window.METADATA.subContent) || [];
    for (var i = 0; i < sc.length; i++) {
      if (String(sc[i].id).replace(/\/+$/, '').slice(-(item.length + 1)) === '-' + item) {
        return (sc[i].questions || []).length;
      }
    }
  } catch (e) {}
  return Object.keys(XAPI_Q_RESULTS).filter(function (k) { return k.split('/')[0] === item; }).length;
}

function itemCorrectCount(item) {
  return Object.keys(XAPI_Q_RESULTS).filter(function (k) {
    return k.split('/')[0] === item && XAPI_Q_RESULTS[k] === true;
  }).length;
}

/* Item 'completed' result: MOE v2.4 requires success + score on any item carrying answered
   interactions; the library's own aggregate is an all-correct AND. */
function itemResultFor(item) {
  var n = itemQuestionCount(item);
  if (!n) return null;
  var scaled = itemCorrectCount(item) / n;
  return { success: scaled >= xapiPassScaled(), score: { scaled: scaled } };
}

/* The component result — sent on EVERY exit, failing ones included. A component without graded
   items (04, the class task) reports success with no score. */
function partResult() {
  var items = (typeof XAPI_EVAL_ITEMS !== 'undefined') ? Object.keys(XAPI_EVAL_ITEMS) : [];
  var total = 0, ok = 0;
  items.forEach(function (it) { total += itemQuestionCount(it); ok += itemCorrectCount(it); });
  if (!total) return { success: true };
  var scaled = ok / total;
  return { success: scaled >= xapiPassScaled(), score: { scaled: scaled } };
}

/* Read by 20-xapi.js xapiItemResult(). Built at boot (90-boot.js), after the part has declared
   XAPI_EVAL_ITEMS. */
var XAPI_ITEM_RESULT = {};
function buildItemResults() {
  if (typeof XAPI_EVAL_ITEMS === 'undefined') return;
  Object.keys(XAPI_EVAL_ITEMS).forEach(function (it) {
    XAPI_ITEM_RESULT[it] = function () { return itemResultFor(it); };
  });
}

/* One graded answer, from a question engine. ref = [itemSuffix, qKey] or null (not reported). */
function reportQ(ref, correct, isLast, answer) {
  if (!ref) return;
  xapiAnswered(ref[0], ref[1], correct, isLast, answer);
}
