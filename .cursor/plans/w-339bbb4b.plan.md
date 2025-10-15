<!-- 339bbb4b-be85-4445-94ea-1dd3fcfba980 cad85c49-1934-49f8-8544-b666b3289e68 -->
# Vivaldi Mod — Option B (Advanced, Gated)

### Scope

Provide a power-user path for Vivaldi tab stacking via a mod that consumes a JSON snapshot exported by the extension. Gated behind an advanced setting. No dependency on runtime messaging.

### Changes by Area

#### 1) Extension settings and snapshot generation

- Add an Advanced setting in `extension/src/options/index.html` + `extension/src/options/options.ts`:
  - Toggle: "Enable Vivaldi Mod integration (advanced)"
  - When enabled, show a read-only JSON snapshot and actions: "Copy" and "Download".
- Build snapshot on each organize run in `extension/src/background.ts` and store to `chrome.storage.local` as `tabOrganizerModSnapshot`:
  - Structure:
    ```json
    {
      "ts": 1730000000000,
      "version": "0.1.0",
      "clusters": [
        {
          "name": "Foo Group",
          "members": [{ "url": "https://example.com/x", "title": "Example X" }]
        }
      ]
    }
    ```

  - Derive members from actual tabs used for grouping: prefer URL equality; include title as fallback.

#### 2) Options page: Advanced section

- Render `tabOrganizerModSnapshot` in a `<textarea>` with monospace font.
- Buttons:
  - Copy to clipboard.
  - Download JSON (Blob + `URL.createObjectURL`).
- Small note linking to Vivaldi Mod setup docs.

#### 3) Vivaldi Mod documentation and template

- Create `docs/vivaldi-mod/README.md` describing:
  - Enabling Vivaldi Mods.
  - Installing a custom JS mod file.
  - Workflow: run Organize → copy/download snapshot → paste/import in the mod → apply stacks.
  - Matching policy (URL exact match; fallback title contains; user review UI before apply).
- Add `docs/vivaldi-mod/mod.template.js`:
  - UI button "Apply Tab Organizer Snapshot" in Vivaldi UI.
  - Prompt to paste JSON (or file input).
  - Parse snapshot and compute per-cluster matches against open tabs by URL/title.
  - Provide a simple checklist UI to confirm.
  - Call a `stackTabs(tabs)` function per cluster.
  - Leave `stackTabs` as a small abstraction the user can wire to their preferred Vivaldi internal hook (documented placeholders + notes).

### Files to Change / Add

- Change: `extension/src/background.ts` — generate and store `tabOrganizerModSnapshot` after grouping.
- Change: `extension/src/options/index.html`, `extension/src/options/options.ts` — advanced toggle, snapshot display/actions.
- Add: `docs/vivaldi-mod/README.md` — install + usage guide.
- Add: `docs/vivaldi-mod/mod.template.js` — mod UI and apply logic scaffold.

### Acceptance Criteria

- Advanced toggle defaults off; when on, the Options page displays snapshot and Copy/Download work.
- After organize, `tabOrganizerModSnapshot` exists with correct structure and content for current window.
- Docs guide lets a user install the mod and apply clusters by pasting the snapshot.
- No change in default UX; normal users unaffected.

### Risks & Mitigations

- Vivaldi internal APIs differ by version: mitigate by keeping `stackTabs` as a user-wired function with comments and alternatives (UI automation vs internal API if available).
- Matching tabs by URL/title can mis-map: display a confirmation checklist in the mod template before applying.

### To-dos

- [ ] Add advanced toggle in Options to expose Vivaldi Mod snapshot
- [ ] Generate tabOrganizerModSnapshot after grouping in background.ts
- [ ] Render JSON snapshot with Copy/Download actions in Options UI
- [ ] Write docs/vivaldi-mod/README.md with install and usage
- [ ] Add docs/vivaldi-mod/mod.template.js scaffold with UI and apply flow