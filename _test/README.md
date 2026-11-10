# _test — local verification (never shipped)

| File | What |
|---|---|
| `xapi-720-l.js` | Since 2026-11-10 the stub every suite loads (`?xapiLib=../_test/xapi-720-l.js`): `xapi-720-k.js` plus `saveState720OnLeave`, which writes like `saveState720` and logs its calls (`__leaveWrites()`). |
| `xapi-720-k.js` | Local stand-in for the CDN library (from ratio-01); kept for `leave-save.js`'s check that the unit still runs on `-k`. Loaded only on localhost with `?xapiLib=../_test/xapi-720-k.js`. Statement log + state document in `sessionStorage`; console helpers `__stmts() __state() __dupes() __reset() __failWrites()`. |
| `scenarios.js` | One scripted walk per component (right, or wrong × `window.__TIMES`). |
| `flow.js` | Every component × {all right, all wrong twice}: every declared `questionId` gets exactly one `answered.last`, every graded item one scored `completed`, the component result is right, no duplicate `completed`, no page error. |
| `verify-static.js` | No browser: every referenced file exists (exact case) and ships; one `?v=` everywhere; `XAPI_COMP_ID`, `SCREEN_TO_SUBCONTENT`, `XAPI_EVAL_ITEMS` and every `['NNN','qN']` ref agree with `metadata/`; loader letter vs its regex. `node _test/verify-static.js` |
| `gates.js` | MOE monday 05-06.10.26: 02 passes on 2 of its 4 questions fully right (`XAPI_STATION_PASS`), and since 2026-11-09 (MOE sheet 08.11) its `scaled` is that same count / 4 and 03's is group A's count / 3, at the stop and past it with group B wrong (8 of these checks fail on the code before); 03 under 2 of group A's 3 ends the component on s3 (`XAPI_STOP`: completed success false, button ended, stays ended after a reload, live if reloaded before the click, fails open); with no character chosen the first screen of 02 / 03 / 06 still shows and loads one. Every answer through the real handlers. |
| `true-false.js` | Guide §6.3b (09.11.26, found on the live Kata rounds): the 9 true/false questions of the metadata (01-004 q1, 02-003 q2-q4, 03-002 q1-q4, 03-004 q3), answered all right and all wrong, report `true` / `false` (what Kata's `correctXapiResponsesPattern` holds), never the label on the button (נכון / לא נכון / כן / לא); the value equals the correct answer exactly when `success`. 35 of its checks fail on the code before. Every answer through the real handlers. |
| `leave-save.js` | Leave save (hardening doc §2.10, 2026-11-10): in every component, a screen change and a reload inside the 800 ms debounce lands on the new screen; on `-l` the leave write goes through `saveState720OnLeave`, on `-k` (rollback) the unit still lands there and nothing throws. The Chrome refusal itself is checked live. |
| `write-guard.js` | No write before the restore (2026-11-03 Kata bug, `Documentation/reporting-and-resume/BOOT-AND-RESUME-HARDENING-2026-11-03.md`): the replayed pick-during-the-wait leaves the saved payload intact; `markSent` before phase B writes nothing; a failed read (500 / 401 / network, stub `__failReads`) keeps every write closed and a later good read restores; a 404 is a fresh document. Fails on the code before 2026-11-04. |
| `touch-dnd.js` | Drag on a tablet (2026-11-04): 01 s2E by real touch input (CDP touch events, touch viewport) — drag, tap-to-place, move between targets, evict, drop outside → bank, tap a placed card → bank, check locks, the answer is reported — and by mouse; the draggable feedback popup (02 s1) moves under a finger. Fails on the code before 2026-11-04. |
| `resume.js` | Every component: one wrong attempt everywhere → reload → lands on the saved screen, the restore sends only `initialized`, every screen is pixel-identical, the second attempts are final; after finishing, a reload keeps the last button disabled and does not re-send `completed`. |

Run (static server on the repo root, e.g. `python -m http.server 8795`; puppeteer-core, pngjs and
pixelmatch@5 installed **outside OneDrive**, local Chrome):

```
NODE_PATH=<tools>/node_modules node _test/flow.js   http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/resume.js http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/gates.js  http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/true-false.js http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/write-guard.js http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/leave-save.js  http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/touch-dnd.js   http://127.0.0.1:8795/
```
