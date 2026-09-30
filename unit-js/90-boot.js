'use strict';

/* Loaded last, after the component's script.js: everything is declared.
   Order: the ?resetState hatch first (it rewrites the URL before anything reads it), then the
   landing screen, then the xAPI layer (its landing-screen item 'initialized' needs currentScreen). */
(function boot() {
  try { initResumeResetHatch(); } catch (e) { console.error('[boot] initResumeResetHatch', e); }
  try { snapshotPristineDom(); } catch (e) { console.error('[boot] snapshotPristineDom', e); }   // before any paint
  window.PART_LAST = TOTAL_SCREENS - 1;   // read by 20-xapi.js restoreEndedButton()
  try { initReportModal(); } catch (e) { console.error('[boot] initReportModal', e); }
  try { buildItemResults(); } catch (e) { console.error('[boot] buildItemResults', e); }
  try { initResumeLeaveHandlers(); } catch (e) { console.error('[boot] initResumeLeaveHandlers', e); }
  try { initResumeEditSaves(); } catch (e) { console.error('[boot] initResumeEditSaves', e); }
  bootNav();
  bootXAPI();
})();
