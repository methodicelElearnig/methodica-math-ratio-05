'use strict';

/* =========================================================
   Progress Question bar (.progress-question). A component keeps one or
   more progress states: { questions: [{number, visited, state, screen}] }
   where state is 'not-answered' | 'current' | 'correct' | 'incorrect'.
   The default state object is the component's `practiceProgress`.
   ========================================================= */
function updateProgressQuestion(container, state) {
  state.questions.forEach((q, i) => {
    const n    = i + 1;
    const item = container.querySelector('[data-question="' + n + '"]');
    if (!item) return;
    const icon  = item.querySelector('.progress-question__icon');
    const label = item.querySelector('.progress-question__label');
    icon.classList.remove(
      'progress-question__icon--current',
      'progress-question__icon--correct',
      'progress-question__icon--incorrect'
    );
    if (q.state !== 'not-answered') icon.classList.add('progress-question__icon--' + q.state);
    label.classList.toggle('progress-question__label--visited', q.visited);
    const navigable = q.visited && q.screen != null && q.screen !== currentScreen;
    item.style.cursor = navigable ? 'pointer' : '';
    item.onclick = navigable ? (() => goTo(q.screen)) : null;
  });
  for (let n = 1; n < state.questions.length; n++) {
    const conn = container.querySelector('[data-connector="' + n + '"]');
    if (!conn) continue;
    const qState = state.questions[n - 1].state;
    conn.classList.toggle('progress-question__connector--visited', qState === 'correct' || qState === 'incorrect');
  }
}

function syncPracticeProgressNav(sectionEl, state) {
  state = state || practiceProgress;
  const nav = sectionEl && sectionEl.querySelector('.progress-question');
  if (nav) updateProgressQuestion(nav, state);
}

/* Marks question idx (0-based) as current unless already answered, and
   clears any previous "current" — exactly one current ring at a time. */
function setCurrentQuestion(state, idx) {
  state.questions.forEach(function (q) {
    if (q.state === 'current') q.state = 'not-answered';
  });
  const q = state.questions[idx];
  if (q.state !== 'correct' && q.state !== 'incorrect') q.state = 'current';
  q.visited = true;
}
