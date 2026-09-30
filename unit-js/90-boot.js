'use strict';

/* Loaded last, after the component's script.js: everything is declared.
   Order: the ?resetState hatch first (it rewrites the URL before anything reads it), then the
   landing screen, then the xAPI layer (its landing-screen item 'initialized' needs currentScreen). */
(function boot() {
  try { initResumeResetHatch(); } catch (e) { console.error('[boot] initResumeResetHatch', e); }
  try { initReportModal(); } catch (e) { console.error('[boot] initReportModal', e); }
  try { buildItemResults(); } catch (e) { console.error('[boot] buildItemResults', e); }
  bootNav();
  bootXAPI();
})();
