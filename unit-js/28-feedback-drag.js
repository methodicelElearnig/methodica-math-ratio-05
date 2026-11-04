'use strict';

/* =========================================================
   Feedback popup (.scq-fb-box): position reset, optional drag,
   and the "correct answer shown" title suffix.
   Drag bounds: the whole canvas except the bottom bar.
   ========================================================= */
const BOTTOM_BAR_H = 74;

function clampPopupPosition(x, y, popupEl) {
  const w = popupEl.offsetWidth, h = popupEl.offsetHeight;
  const canvas = getCanvasSize();
  const minX = 0, maxX = canvas.w - w;
  const minY = 0, maxY = (canvas.h - BOTTOM_BAR_H) - h; // top edge of the bottom bar
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY)
  };
}

function scqFbResetPosition(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.style.left = '';
  box.style.top = '';
  box.style.bottom = '';
}

/* Pointer drag (mouse + touch) for a feedback box. A press on the reveal-answer button
   inside the box must stay a click, so it never starts a drag. Pointer events rather than mouse
   events since 2026-11-04: on a tablet a finger produced no mousemove, so the box could not be moved
   off the content it covers (the touch side of Tools/touch-dnd-survey). touch-action:none keeps the
   page from panning under the finger. */
function scqFbMakeDraggable(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  let dragging = false;
  let pointerId = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  box.style.touchAction = 'none';

  box.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.scq-fb-reveal-btn')) return;
    pointerId = e.pointerId;
    const parent = box.offsetParent || box.parentElement;
    const boxRect = box.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    startLeft = boxRect.left - parentRect.left;
    startTop = boxRect.top - parentRect.top;
    box.style.left = startLeft + 'px';
    box.style.top = startTop + 'px';
    box.style.bottom = 'auto';
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    box.classList.add('is-dragging');
    e.preventDefault();
  });

  document.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const parent = box.offsetParent || box.parentElement;
    const parentRect = parent.getBoundingClientRect();
    // pointer delta is in viewport px — convert to canvas px before clamping
    const scale = parentRect.width / getCanvasSize().w;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    const clamped = clampPopupPosition(startLeft + dx, startTop + dy, box);
    box.style.left = clamped.x + 'px';
    box.style.top = clamped.y + 'px';
  });

  function end(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    box.classList.remove('is-dragging');
  }
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
}

/* Final-wrong feedback title: "<title>. התשובה הנכונה מוצגת." */
function fbCorrectShown(title) {
  let t = String(title).replace(/\s+$/, '').replace(/[:,;]$/, '');
  if (!/[.!?]$/.test(t)) t += '.';
  return t + ' התשובה הנכונה מוצגת.';
}
