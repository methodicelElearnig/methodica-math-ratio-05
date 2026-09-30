# methodica-math-ratio-05

A 720 math unit (יחס, יעד 1.5) with six components, each a single-page HTML module:

| Component | Screens | Folder |
|---|---|---|
| 01 | 7 | `methodica-math-ratio-05-01/` (+ iframe apps `geogbra-app/`, `juice-store-app/`) |
| 02 | 5 | `methodica-math-ratio-05-02/` |
| 03 | 6 | `methodica-math-ratio-05-03/` (+ iframe app `chocolate-ratio-app/`) |
| 04 | 3 | `methodica-math-ratio-05-04/` |
| 05 | 4 | `methodica-math-ratio-05-05/` |
| 06 | 6 | `methodica-math-ratio-05-06/` |

## Layout

```
unit-js/      shared engine, loaded by every component (declarations only, except listeners)
  15-ui.js            canvas scaling, companion character, character media, image zoom,
                      popup/hint closing, makeScrollGestureHint(), alignBtnToLeftmost()
  28-feedback-drag.js feedback popup clamp/reset/drag, fbCorrectShown()
  30-nav.js           goTo(), resetScreenState(n) → resetScreenStateN(), bootNav()
  32-progress.js      Progress Question bar
  35-questions.js     SingleChoice (scq*) + ValueInput (viq*) engines, SCQ_CFG / VIQ_CFG
  60-devbridge.js     index_dev.html bridge, Ctrl+←/→
  90-boot.js          bootNav() — always the last script
unit-css/common.css shared rules, linked before each component's styles.css
unit-assets/  assets used by more than one component (fonts/, img/, video/)
metadata/     Kata catalogue JSON (component + unit ids)
docs/         per-component design notes (historical: written before the shared engine)
```

Script order in every component's `index.html`:
`15-ui → 28-feedback-drag → 30-nav → 32-progress → 35-questions → 60-devbridge → script.js → 90-boot`.
All code references carry the same `?v=`; bump it everywhere together.

## Rules
- **Assets:** anything used by more than one component lives in `unit-assets/` and is referenced as
  `../unit-assets/…` (`../../unit-assets/…` from iframe apps). A changed media file gets a new name.
- **Component `script.js`** defines `TOTAL_SCREENS`, `resetScreenStateN()` for every screen, its
  question configs (`SCQ_CFG_REGISTER` / `VIQ_CFG_REGISTER` / `Object.assign(SCQ_CFG, …)`) and
  screen-specific logic only. Optional hook: `partClosePopups()` (called on every screen change).
- Deep links: `?screen=last` (used by the next component's "חזרה"), `#screen=N` (dev).

## Open items
- `methodica-math-ratio-05-06/assets/videos/boy-avatar-climbing.mp4` is missing (06 screen 1,
  character-1 shows no avatar). Asset to be supplied.
- 06: sections ג/ד update `practiceProgress.questions[3]`/`[2]` crosswise (`s2p4` / `s2p5`); the
  "2 of 4" pass threshold shown on screen is not enforced in code. Both to be fixed with reporting.
- 01 screen 1: the scroll-gesture hint can hide after a programmatic page jump (smooth scroll vs.
  the 700 ms flag timer race). Pre-existing.
