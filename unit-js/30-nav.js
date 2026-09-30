'use strict';

/* =========================================================
   Screen navigation inside one component (single page, one
   <section class="screen" data-screen="N"> per screen), and the
   component's edges.
   The component defines TOTAL_SCREENS and resetScreenStateN() for
   every N; resetScreenStateN runs on each entry, before .active.
   ========================================================= */
let currentScreen = 0;

function goTo(n) {
  if (n < 0 || n >= TOTAL_SCREENS) return;
  closeAllPopupsAndHints();
  document.querySelectorAll('.screen').forEach(function (el) {
    el.classList.remove('active');
  });
  const target = document.querySelector('.screen[data-screen="' + n + '"]');
  if (!target) return;
  currentScreen = n;
  try { xapiOnScreen(n); } catch (e) {}   // item initialized / completed (20-xapi.js)
  resetScreenState(n);
  target.classList.add('active');
}

function resetScreenState(n) {
  const fn = window['resetScreenState' + n];
  if (typeof fn === 'function') fn();
}

/* ── Component edges ── The platform owns routing (10-identity.js, DEV_NAV).
   finishComponent — the last screen's "המשך": reports the component 'completed' (always, pass
   or fail) and disables the button; only in a ?dev=1 walkthrough does it move on.
   backToPart — the first screen's "חזרה": dev walkthrough only (hidden otherwise). */
function lastScreenButton() {
  const last = document.querySelector('.screen[data-screen="' + (TOTAL_SCREENS - 1) + '"]');
  return last && last.querySelector('[onclick^="finishComponent("]');
}

function _devHref(slug, screen) {
  const q = new URLSearchParams(location.search);
  if (screen) q.set('screen', screen); else q.delete('screen');
  const s = q.toString();
  return '../' + slug + '/index.html' + (s ? '?' + s : '');
}

function finishComponent(nextSlug) {
  try { xapiEndComponent(partResult(), lastScreenButton()); } catch (e) { console.error('[xAPI] finish', e); }
  try { flushResumeSave(); } catch (e) {}
  if (DEV_NAV && nextSlug) location.href = _devHref(nextSlug, null);
}

function backToPart(prevSlug) {
  if (!DEV_NAV || !prevSlug) return;
  try { flushResumeSave(); } catch (e) {}
  location.href = _devHref(prevSlug, 'last');
}

function hideCrossPartBack() {
  if (DEV_NAV) return;
  document.querySelectorAll('[onclick^="backToPart("]').forEach(function (b) {
    b.hidden = true; b.style.display = 'none'; b.setAttribute('aria-hidden', 'true');
  });
}

/* Landing screen: ?screen=last (the next component's "חזרה" in a dev walkthrough),
   #screen=N (dev deep link), otherwise screen 0. */
function bootNav() {
  scaleApp();
  hideCrossPartBack();
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (new URLSearchParams(location.search).get('screen') === 'last') goTo(TOTAL_SCREENS - 1);
  else if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
}
