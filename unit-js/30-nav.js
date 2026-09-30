'use strict';

/* =========================================================
   Screen navigation inside one component (single page, one
   <section class="screen" data-screen="N"> per screen).
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
  resetScreenState(n);
  target.classList.add('active');
}

function resetScreenState(n) {
  const fn = window['resetScreenState' + n];
  if (typeof fn === 'function') fn();
}

/* Landing screen: ?screen=last (from the next component's "חזרה"),
   #screen=N (dev deep link), otherwise screen 0. */
function bootNav() {
  scaleApp();
  const m = /^#screen=(\d+)$/.exec(location.hash);
  if (new URLSearchParams(location.search).get('screen') === 'last') goTo(TOTAL_SCREENS - 1);
  else if (m) goTo(parseInt(m[1], 10));
  else resetScreenState(0);
}
