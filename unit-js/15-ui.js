'use strict';

/* =========================================================
   Shared UI layer — loaded by every component before its script.js.
   Canvas scaling, companion-character state, character media,
   image zoom, popup/hint closing, scroll-gesture hint, inline-button
   alignment. Declarations only, except the listeners at the bottom.
   ========================================================= */

/* ---------- Companion character (character-1 / character-2) ----------
   One key for the whole unit, so a choice made in component 01 applies
   in every later component (each component is a separate page load).
   The key carries this unit's slug (guide D-6) — the pre-2026-09-30 key
   'math-ratio-01_selectedCharacter' was shared with other units and is
   read only as a fallback. localStorage may throw (file://, privacy modes).
   Since resume, the state document is the authority and this is a cache
   (40-resume.js: getUnitCharacter / setUnitCharacter / adoptUnitCharacter). */
const CHARACTER_STORAGE_KEY = 'methodica_math_ratio_05_selectedCharacter';
const LEGACY_CHARACTER_STORAGE_KEY = 'math-ratio-01_selectedCharacter';
const KNOWN_CHARACTER_IDS = ['character-1', 'character-2'];

let savedCharacter = null;
try {
  savedCharacter = localStorage.getItem(CHARACTER_STORAGE_KEY);
  if (KNOWN_CHARACTER_IDS.indexOf(savedCharacter) === -1) {
    savedCharacter = localStorage.getItem(LEGACY_CHARACTER_STORAGE_KEY);
    if (KNOWN_CHARACTER_IDS.indexOf(savedCharacter) !== -1) localStorage.setItem(CHARACTER_STORAGE_KEY, savedCharacter);
  }
} catch (e) { /* storage blocked — continue without persistence */ }
if (KNOWN_CHARACTER_IDS.indexOf(savedCharacter) === -1) savedCharacter = null;
window.lomdaState = {
  selectedCharacter: savedCharacter
};

/* ---------- Canvas: 1280×710 design size, stretched to fill the viewport ----------
   #app is resized so that, after scale(), it covers the viewport exactly
   (no dead margins). getCanvasSize() is the source of truth for the
   current canvas size; currentCanvasScale() for the current zoom factor. */
const CANVAS_W = 1280, CANVAS_H = 710;

function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  const canvasW = window.innerWidth / scale;
  const canvasH = window.innerHeight / scale;
  app.style.width = canvasW + 'px';
  app.style.height = canvasH + 'px';
  app.style.transform = 'scale(' + scale + ')';
  app.style.left = '0px';
  app.style.top = '0px';
}

function getCanvasSize() {
  const app = document.getElementById('app');
  return {
    w: parseFloat(app.style.width) || CANVAS_W,
    h: parseFloat(app.style.height) || CANVAS_H
  };
}

function currentCanvasScale() {
  const appEl = document.getElementById('app');
  return appEl ? (appEl.getBoundingClientRect().width / getCanvasSize().w) : 1;
}

/* ---------- Close every feedback popup (…-feedbox) and hint overlay (…-hint-overlay).
   A component with extra overlays (e.g. expanded applets) defines
   partClosePopups(), called last. */
function closeAllPopupsAndHints() {
  document.querySelectorAll('[id$="-feedbox"]').forEach(function (el) {
    el.classList.remove('visible');
  });
  document.querySelectorAll('[id$="-hint-overlay"]').forEach(function (el) {
    el.hidden = true;
  });
  if (typeof partClosePopups === 'function') partClosePopups();
}

/* ---------- Character media: each screen passes its own {characterId: src} map ---------- */
function resolveCharBubbleImg(imgId, assetMap) {
  const el = document.getElementById(imgId);
  if (!el) return;
  const char = window.lomdaState.selectedCharacter;
  const src = (char && assetMap[char]) ? assetMap[char] : '';
  if (el.tagName === 'VIDEO') {
    if (el.getAttribute('src') !== src) {
      if (src) el.setAttribute('src', src); else el.removeAttribute('src');
      el.load();
    }
    el.play().catch(function () {});
  } else {
    el.src = src;
  }
}

/* MOE monday 06.10.26 ("הדמות במסך הראשון לא נטענת"): a component launched without component 01's
   choice in this browser (Kata launches each component on its own; another device; cleared storage)
   showed an EMPTY character. Display falls back to the default character — percent-02's
   precedent; the choice itself is not written, so 01's picker still asks. */
const DEFAULT_CHARACTER = 'character-1';

function resolveCharBubbleVideo(videoId, assetMap) {
  const el = document.getElementById(videoId);
  if (!el) return;
  const char = window.lomdaState.selectedCharacter;
  const src = (char && assetMap[char]) ? assetMap[char] : (assetMap[DEFAULT_CHARACTER] || '');
  if (el.getAttribute('src') !== src) {
    if (src) el.setAttribute('src', src); else el.removeAttribute('src');
    el.load();
  }
  el.play().catch(function () {});
}

/* ---------- Scroll gesture hint (animated hand over a scrollable area) ----------
   Shown once per page load, only if the area actually scrolls; hidden on
   the learner's first scroll. Set `.programmatic = true` around a
   scrollTo()/scrollIntoView() made by code so that scroll doesn't hide it.
   Measured inside rAF because resetScreenStateN() runs before the
   screen gets .active (display:none → scrollHeight 0). */
function makeScrollGestureHint(gestureId, scrollArea) {
  const hint = { shown: false, programmatic: false };
  function areaEl() {
    return typeof scrollArea === 'string' && scrollArea.charAt(0) !== '#' && scrollArea.charAt(0) !== '.'
      ? document.getElementById(scrollArea) : document.querySelector(scrollArea);
  }
  hint.hide = function () {
    const area = areaEl();
    const gesture = document.getElementById(gestureId);
    if (!area || !gesture) return;
    if (hint.programmatic) {
      area.addEventListener('scroll', hint.hide, { once: true });
      return;
    }
    gesture.hidden = true;
  };
  hint.maybeShow = function () {
    requestAnimationFrame(function () {
      if (hint.shown) return;
      const gesture = document.getElementById(gestureId);
      const area = areaEl();
      if (!gesture || !area) return;
      if (area.scrollHeight <= area.clientHeight) return;
      hint.shown = true;
      gesture.hidden = false;
      area.addEventListener('scroll', hint.hide, { once: true });
    });
  };
  return hint;
}

/* ---------- Align an inline button's left edge with the leftmost of `anchors` ----------
   Canvas is RTL; the button sits in `container` and gets margin-left so
   its left edge lines up with the anchors' left edge (in canvas px). */
function alignBtnToLeftmost(btn, anchors, container) {
  if (!btn || !container || !anchors || !anchors.length) return;
  const scale = currentCanvasScale();
  const leftmost = Math.min.apply(null, Array.prototype.map.call(anchors, function (el) {
    return el.getBoundingClientRect().left;
  }));
  const containerRect = container.getBoundingClientRect();
  btn.style.marginLeft = Math.max(0, (leftmost - containerRect.left) / scale) + 'px';
}

/* ---------- Screen-reader announcement through #a11y-announcer (polite live region) ---------- */
function announce(msg) {
  var el = document.getElementById('a11y-announcer');
  if (!el || !msg) return;
  el.textContent = '';
  setTimeout(function () { el.textContent = msg; }, 50);
}

/* ---------- Image zoom: any element with data-zoom-src opens its parent frame
   in the global #img-zoom-modal (outside every .screen). ---------- */
function imgZoomOpen(trigger) {
  const modal = document.getElementById('img-zoom-modal');
  const stage = modal && modal.querySelector('.img-zoom-modal__stage');
  const frame = trigger.parentElement;
  if (!modal || !stage || !frame) return;
  const clone = frame.cloneNode(true);
  const btnInClone = clone.querySelector('.img-zoom-btn');
  if (btnInClone) btnInClone.remove();
  stage.innerHTML = '';
  stage.appendChild(clone);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function imgZoomClose() {
  const modal = document.getElementById('img-zoom-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  const stage = modal.querySelector('.img-zoom-modal__stage');
  if (stage) stage.innerHTML = '';
}

window.addEventListener('resize', scaleApp);

document.addEventListener('click', function (e) {
  const trigger = e.target.closest('[data-zoom-src]');
  if (trigger) { imgZoomOpen(trigger); return; }
  const closeTarget = e.target.closest('[data-zoom-close="true"]');
  if (!closeTarget) return;
  if (closeTarget.id === 'img-zoom-modal' && e.target.closest('.img-zoom-modal__panel')) return;
  imgZoomClose();
});

document.addEventListener('keydown', function (e) {
  const modal = document.getElementById('img-zoom-modal');
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) imgZoomClose();
});
