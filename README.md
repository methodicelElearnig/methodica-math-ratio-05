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
  10-identity.js      xAPI id prefix, unit id, RESUME_ENABLED, DEV_NAV            (from ratio-01)
  15-ui.js            canvas scaling, companion character, character media, image zoom,
                      popup/hint closing, makeScrollGestureHint(), alignBtnToLeftmost()
  20-xapi.js          item scope, answered / requested / completed helpers        (ratio-01, verbatim)
  22-scoring.js       item + component results from XAPI_Q_RESULTS and metadata, reportQ()
  28-feedback-drag.js feedback popup clamp/reset/drag, fbCorrectShown()
  30-nav.js           goTo() (+ xapiOnScreen), resetScreenState(n) → resetScreenStateN(),
                      finishComponent() / backToPart() — the component's edges, bootNav()
  32-progress.js      Progress Question bar
  35-questions.js     SingleChoice (scq*) + ValueInput (viq*) engines, SCQ_CFG / VIQ_CFG
  40-resume.js        state document, 'completed' ledger, boot cover, ?resetState  (ratio-01)
  50-loader.js        loads the 720 library from the CDN, bootXAPI()               (ratio-01, verbatim)
  60-devbridge.js     index_dev.html bridge, Ctrl+←/→
  90-boot.js          ?resetState hatch, bootNav(), bootXAPI() — always the last script
unit-css/common.css shared rules, linked before each component's styles.css
unit-assets/  assets used by more than one component (fonts/, img/, video/)
metadata/     Kata catalogue JSON (component + unit ids)
docs/         per-component design notes (historical: written before the shared engine)
_test/        local library stub (xapi-720-k.js) + flow.js statement-flow test — never shipped
```

Script order in every component's `index.html`:
`10-identity → 15-ui → 20-xapi → 22-scoring → 28-feedback-drag → 30-nav → 32-progress → 35-questions
→ 40-resume → 50-loader → 60-devbridge → script.js → 90-boot`.
All code references carry the same `?v=`; bump it everywhere together.

## Rules
- **Assets:** anything used by more than one component lives in `unit-assets/` and is referenced as
  `../unit-assets/…` (`../../unit-assets/…` from iframe apps). A changed media file gets a new name.
- **Component `script.js`** defines `TOTAL_SCREENS`, `resetScreenStateN()` for every screen, its
  question configs (`SCQ_CFG_REGISTER` / `VIQ_CFG_REGISTER` / `Object.assign(SCQ_CFG, …)`) and
  screen-specific logic only. Optional hook: `partClosePopups()` (called on every screen change).
- Deep links: `?screen=last` (used by the next component's "חזרה"), `#screen=N` (dev).

## Reporting (xAPI → Kata)
Spec: `Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`; the shared layer is ratio-01's.
- Launched by Kata with `?slxapi=…&registration=…`; without them the library disables itself and
  nothing is sent. The library is loaded at runtime from
  `https://lomdot.education.gov.il/metodica/720active/common/` (`xapi-720-i.js`; `-k` once resume is on).
- Each `script.js` ends with its seam: `XAPI_COMP_SLUG`, `XAPI_METADATA_FILE`, `SCREEN_TO_SUBCONTENT`
  (screen → `[item, page]`), `XAPI_EVAL_ITEMS`, optional `XAPI_PASS_SCALED`.
- Answers: question configs carry `xapi: ['<item>', 'q<n>']` (SCQ / MCQ / mixed) or one ref per input
  (VIQ; inputs sharing a ref form one question). Custom checks call `reportQ()` directly. Every
  question declared in `metadata/` is reported; `isLast` = correct or 2nd attempt (olympiad, 01-003 q1
  and the guided 01-004 steps have one attempt).
- Hints: `xapiRequestedHint(item, qKey)` in each `…HintOpen()`.
- **Pass rule:** component and item `success` = score ≥ 0.6; 06 uses 0.5 ("2 of 4", its screen 0).
  04 (class task) reports `{success: true}`. The component result is sent on fail too.
- **The platform owns routing:** the last "המשך" sends `completed` and disables itself (06: arriving on
  its last screen). The first-screen "חזרה" is hidden. Both move between components only with `?dev=1`.
- Local test: `…/index.html?xapiLib=../_test/xapi-720-k.js` (localhost only), console helpers
  `__stmts() __state() __dupes() __reset()`; `node _test/flow.js` runs every component twice
  (all right / all wrong twice) and checks the statements against `metadata/`.

## Open items
- `methodica-math-ratio-05-06/assets/videos/boy-avatar-climbing.mp4` is missing (06 screen 1,
  character-1 shows no avatar). Asset to be supplied.
- 06: section ג is `s2-part-5` / `s2p5` and ד is `s2-part-4` / `s2p4` (ג is above ד on screen 4). The
  mapping to `practiceProgress` and to metadata q3/q4 is correct; only the ids are confusing.
- 06: the last screen says "השלמת את היחידה בהצלחה!" even when the component is reported as failed
  (below 2 of 4). Content call for the learning developer.
- 01 screen 6: leaving and re-entering the screen resets an unfinished question's attempt counter
  (pre-existing `resetScreenState6`). Resume will persist the attempts.
- 01 screen 1: the scroll-gesture hint can hide after a programmatic page jump (smooth scroll vs.
  the 700 ms flag timer race). Pre-existing.
