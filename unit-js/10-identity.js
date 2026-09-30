'use strict';
/* ═══════════════════ xAPI (720) — identity ═══════════════════
   Shared by all six components of methodica-math-ratio-05. Loaded first.
   Ported from methodica-math-ratio-01 (see Documentation/reporting-and-resume/
   ADDING-REPORTING-AND-RESUME.md).

   Canonical id prefix for this unit. Every component / item / question id the lomda reports is
   built from it and must match metadata/*.json byte-for-byte, INCLUDING the trailing slashes. */
var XAPI_ID_PREFIX = 'https://lomdot.education.gov.il/metodica/720active/math/ratio/05/';

/* The unit id must equal metadata/methodica-math-ratio-05_unit.json `id` — here a bare slug
   (MOE v2.5 §2.7 allows it for the content unit; components and items stay IRIs). */
window.XAPI_UNIT_ID = 'methodica-math-ratio-05';

/* Last path segment of a canonical id — the short slug the issue-report form records. */
function shortId(u){ return String(u || '').replace(/\/+$/, '').split('/').pop(); }

/* Resume (Kata State API). While false the loader uses xapi-720-i.js (reporting only) and no
   state document is read or written. Switching it on also switches the library to -k — see
   50-loader.js. */
var RESUME_ENABLED = false;

/* ── The platform owns routing ──
   Kata launches each component on its own URL with its own ?registration and routes on our
   'completed' statements. The last screen's "המשך" therefore reports and stops, and the first
   screen's "חזרה" is hidden. Moving between components is kept only for a local walkthrough
   (?dev=1), and never when the page was launched by the platform (?registration present). */
var DEV_NAV = false;
try {
  var _devQ = new URLSearchParams(location.search);
  DEV_NAV = _devQ.get('dev') === '1' && !_devQ.has('registration');
} catch (e) {}
