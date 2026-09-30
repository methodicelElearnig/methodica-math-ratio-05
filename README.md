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
  25-report.js        issue-report dialogs → shared 720 Google Form               (ratio-01, verbatim)
  40-resume.js        state document, 'completed' ledger, boot cover, ?resetState  (ratio-01)
  45-resume-part.js   this unit's payload: answer variables + DOM diff; applyExecutionState()
  50-loader.js        loads the 720 library from the CDN, bootXAPI()               (ratio-01, verbatim)
  60-devbridge.js     index_dev.html bridge, Ctrl+←/→
  90-boot.js          ?resetState hatch, bootNav(), bootXAPI() — always the last script
unit-css/common.css shared rules, linked before each component's styles.css
unit-css/25-report.css  issue-report dialogs (ratio-01's .report-* rules)
unit-assets/  assets used by more than one component (fonts/, img/, video/)
metadata/     Kata catalogue JSON (component + unit ids)
docs/         per-component design notes (historical: written before the shared engine)
_test/        local library stub (xapi-720-k.js) + flow.js statement-flow test — never shipped
```

Script order in every component's `index.html`:
`10-identity → 15-ui → 20-xapi → 22-scoring → 25-report → 28-feedback-drag → 30-nav → 32-progress
→ 35-questions → 40-resume → 45-resume-part → 50-loader → 60-devbridge → script.js → 90-boot`.
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
  `https://lomdot.education.gov.il/metodica/720active/common/xapi-720-k.js` (resume on).
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
  `__stmts() __state() __dupes() __reset()`; see `_test/README.md`.

## Issue reporting
The flag button ("מצאתם בעיה?") opens the shared 720 dialog; the report goes to the one Google Form
all 720 units use (`REPORT_FIELDS` must not change) with unit / component / item / page taken from
`METADATA` and `SCREEN_TO_SUBCONTENT`. The thank-you shows whatever the network does.

## Resume (Kata State API)
- One state document per {learner, component}, addressed by `?registration`; outside Kata the
  library falls back to `localStorage` (key `lomda_state::methodica-math-ratio-05::local::…`).
- Saved on every screen change and edit (debounced 800 ms), synchronously after every committed
  answer, on each `completed`/hint (ledger) and on leaving the page.
- Payload (`45-resume-part.js`): the answer variables (`XAPI_Q_RESULTS`, `scqState`, `viqState`,
  `practiceProgress`, plus each component's own via `partCaptureVars`/`partApplyVars`) and a diff
  of the page's DOM against its pristine markup. The restore replays both, so every screen shows
  what the learner left, an unfinished question keeps its attempt count, and a finished
  component's last button stays disabled. Nothing is re-reported (the sender is stubbed during the
  restore; `completed` and hints go through the `done` / `doneItems` / `hints` ledgers).
- The companion character lives in the document (`ui.character`), cached in `localStorage` so the
  next component can read it before its own document arrives.
- A white boot cover hides the first screen until the restore has decided where to land.
- `?resetState` wipes the document and the caches (QA).

## Packaging and deployment
- `pwsh -File docs-and-tools/build-package.ps1 -DryRun` lists what ships and what does not;
  without `-DryRun` it cuts `../../deployments/<yyyy-mm-dd>/` from a **clean, committed** tree and
  verifies itself. `docs-and-tools/verify-package.ps1` re-checks a package (FORWARD / REVERSE /
  HYGIENE / COMMIT). What ships is defined only in `docs-and-tools/package-allowlist.ps1` (an
  allowlist): `metadata/`, `unit-js/`, `unit-css/`, `unit-assets/`, and per component `index.html`,
  `script.js`, `styles.css`, `assets/` and its iframe-app folders. Never: `_test/`, `docs*/`,
  `index_dev.html`, `*.md`, a root `index.html`.
- Before a package: `node _test/verify-static.js`, `_test/flow.js`, `_test/resume.js` (see `_test/README.md`).
- Every change to shipped code bumps the one `?v=` in all six `index.html`; a changed media file gets
  a new name. The MOE CDN answers **200 with 0 bytes** for a missing path — verify an upload by size.
- `docs-and-tools/reset-state.html` (from ratio-01): GET / DELETE one learner's state document on Kata
  by `?registration` (QA). Kata's CORS was verified only from `lomdot.education.gov.il`.
- Not ported from ratio-01: `save-restore-state.html` (still written for the older v5 document
  shape) and the Kata metadata scripts (`send-metadata.ps1` / `retrieve-metadata.ps1`, which need the
  API key) — pushing metadata to Kata was out of scope for this branch.

## Open items
- `methodica-math-ratio-05-06/assets/videos/boy-avatar-climbing.mp4` is missing (06 screen 1,
  character-1 shows no avatar). Asset to be supplied.
- 06: section ג is `s2-part-5` / `s2p5` and ד is `s2-part-4` / `s2p4` (ג is above ד on screen 4). The
  mapping to `practiceProgress` and to metadata q3/q4 is correct; only the ids are confusing.
- 06: the last screen says "השלמת את היחידה בהצלחה!" even when the component is reported as failed
  (below 2 of 4). Content call for the learning developer.
- 01 screen 6: re-entering the screen no longer wipes an unfinished question (it used to reset
  inputs and the attempt counter, i.e. hand out fresh attempts). Intended change, 2026-09-30.
- The iframe apps (01 geogebra / juice-store, 03 chocolate) are not part of the saved state; they
  reopen in their initial state.
- 01 screen 1: the scroll-gesture hint can hide after a programmatic page jump (smooth scroll vs.
  the 700 ms flag timer race). Pre-existing.
