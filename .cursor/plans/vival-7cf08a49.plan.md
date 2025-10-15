<!-- 7cf08a49-9ea1-4727-b3f9-074f9d0b4320 8b77293f-1a41-44cf-85e3-1b222c085687 -->
# Vivaldi NLP/ML Tab Organizer — MV3 Extension + Go WASM + Vivaldi Mod (Updated)

## Current status (implemented)

- Extension scaffolded with Vite+CRX and MV3 `manifest.json`.
- Popup and Options pages created (`extension/src/popup/*`, `extension/src/options/*`).
- Background organizer implemented with baseline Jaccard grouping + sleep and options read (`extension/src/background.ts`).
- Shared utils (`tokenize`, `extractDomain`, `pickGroupName`, `isVivaldi`) in `extension/src/shared/utils.ts`.
- WASM pipeline added:
- Go module + clusterer (`wasm/pkg/clusterer`), WASM entry (`wasm/cmd/wasm/main.go`).
- Makefile builds to `extension/assets/tab_grouper.wasm` and copies `wasm_exec.js`.
- Loader in `extension/src/shared/wasm.ts` and web_accessible_resources wired in `manifest.json`.
- Background prefers WASM when tab count ≥ 120, falls back to Jaccard.

## What’s next (prioritized)

### 1) Build wiring & developer ergonomics

- Add NPM scripts in `extension/package.json`:
- `build:wasm` → `make -C ../wasm build`
- `build:ext` → `vite build`
- `build` → `npm run build:wasm && npm run build:ext`
- `dev` → `vite`
- Ensure assets ship in `dist/` (keep under `extension/assets/` so CRX bundles them).

### 2) Options UX and config propagation

- Options page: add controls for stopwords edit and domain-weight boost.
- Background: read `tabOrganizerOptions` and apply:
- Threshold (already wired).
- Sleep toggle (already wired).
- Optional: domain boost (multiply TF component for domain tokens when WASM path is used later).
- Persist round-trip tested via `chrome.storage.local`.

### 3) Harden WASM path (compute & contract)

- Go unit tests (table-driven) for:
- `tokenize`, `TFIDF`, `cosine`.
- `ClusterTexts()` threshold behavior and stability.
- `NameCluster()` determinism with ties.
- Optionally extend JS→WASM contract:
- Add `GroupTabsV2(jsonTabs, threshold)` to accept dynamic threshold.
- Loader calls V2 when present; falls back to V1.
- Consider computing names in TS for consistency (current approach) while keeping Go focus on clustering.

### 4) Resilience & performance

- Add simple timing logs (console) with total ms and chosen path (WASM/Jaccard).
- Service worker longevity: if you observe SW teardown mid-run, add `offscreen` doc fallback and move compute there.
- Heuristics: keep WASM cutoff at n≥120, revisit after perf tests; maintain Jaccard fast path always available.

### 5) Testing

- TS unit tests (Vitest) for `utils.ts` (`tokenize`, `extractDomain`, `pickGroupName`, `isVivaldi`).
- Integration tests with `sinon-chrome` to assert calls to `chrome.tabs.group`, `chrome.tabGroups.update`, `chrome.tabs.discard` and storage writes.
- E2E (Playwright):
- Launch Vivaldi/Chrome with `--load-extension`.
- Open fixture tabs (30–100) from a curated URL list.
- Trigger command; assert group count, titles non-empty, inactive tabs discarded.
- Performance checks: benchmark 50/100/200 tabs targeting approx <250 ms / <500 ms / <1200 ms.

### 6) Vivaldi Mod (optional, guarded)

- `mod/custom.js`:
- Read `tabOrganizerClusters` from storage and attempt stacks via `window.vivaldi?.tabsPrivate?.stackTabs` if present; otherwise noop.
- Inject Quick Commands/Palette item that triggers the extension (via keyboard shortcut or message).
- `mod/install.sh`: backup `window.html`, inject `<script src="custom.js"></script>` (and `wasm_exec.js` if needed). Guard all access with feature checks.

### 7) CI/CD and packaging

- GitHub Actions workflow:
- `setup-go` → `make -C wasm build`.
- `setup-node` → lint, TS unit tests, Go unit tests, integration tests.
- `vite build` and upload `dist/` artifact.
- Conventional Commits and changelog; zip `dist/` for release.

## Acceptance & validation

- Functionality: One-click/shortcut produces sensible groups; titles non-empty; inactive tabs in groups are discarded; storage contains `tabOrganizerClusters`.
- Performance: Meets target budgets; WASM path activates at high tab counts; no SW teardown; fallback works.
- Portability: Chrome/Edge grouping works; Vivaldi adds stacks/palette when API present.
- Security: Only declared permissions; no content scripts.

## Notes/assumptions

- Continue naming in TS for consistent heuristics; WASM focuses on clustering.
- Threshold defaults to 0.5 (Jaccard) and 0.4 (TF‑IDF/cosine) unless overridden in Options.
- WASM cutoff (n≥120) is provisional; will be tuned post-benchmarks.

### To-dos

- [ ] Scaffold MV3 extension with Vite + crxjs and TypeScript
- [ ] Create Go clusterer package and WASM build pipeline
- [ ] Implement TF-IDF and cosine similarity in Go with tests
- [ ] Implement agglomerative clustering + threshold cut with tests
- [ ] Wire background.ts to load wasm_exec.js and call GroupTabs
- [ ] Define manifest.json (permissions, commands, action)
- [ ] Build minimal popup UI: Organize button + status
- [ ] Build options page for thresholds, sleep policy, stopwords
- [ ] Implement grouping, naming, and discard logic in background
- [ ] Add Vivaldi detection and feature flags (stacks/palette)
- [ ] Author optional Vivaldi mod custom.js + installer
- [ ] Write TS unit tests for utils, naming, detection
- [ ] Write Go unit tests for clusterer package
- [ ] Mock chrome.* to test end-to-end grouping flow
- [ ] Automate Vivaldi/Chrome run, open fixtures, assert groups
- [ ] Add benchmarks for 50/100/200 tabs; set budgets
- [ ] Configure GitHub Actions for lint, test, build, artifact
- [ ] Zip dist/ and prepare release notes