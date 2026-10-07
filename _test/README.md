# _test — local verification (never shipped)

| File | What |
|---|---|
| `xapi-720-k.js` | Local stand-in for the CDN library (from ratio-01). Loaded only on localhost with `?xapiLib=../_test/xapi-720-k.js`. Statement log + state document in `sessionStorage`; console helpers `__stmts() __state() __dupes() __reset() __failWrites()`. |
| `scenarios.js` | One scripted walk per component (right, or wrong × `window.__TIMES`). |
| `flow.js` | Every component × {all right, all wrong twice}: every declared `questionId` gets exactly one `answered.last`, every graded item one scored `completed`, the component result is right, no duplicate `completed`, no page error. |
| `verify-static.js` | No browser: every referenced file exists (exact case) and ships; one `?v=` everywhere; `XAPI_COMP_ID`, `SCREEN_TO_SUBCONTENT`, `XAPI_EVAL_ITEMS` and every `['NNN','qN']` ref agree with `metadata/`; loader letter vs its regex. `node _test/verify-static.js` |
| `resume.js` | Every component: one wrong attempt everywhere → reload → lands on the saved screen, the restore sends only `initialized`, every screen is pixel-identical, the second attempts are final; after finishing, a reload keeps the last button disabled and does not re-send `completed`. |

Run (static server on the repo root, e.g. `python -m http.server 8795`; puppeteer-core, pngjs and
pixelmatch@5 installed **outside OneDrive**, local Chrome):

```
NODE_PATH=<tools>/node_modules node _test/flow.js   http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/resume.js http://127.0.0.1:8795/
NODE_PATH=<tools>/node_modules node _test/gates.js  http://127.0.0.1:8795/
```
