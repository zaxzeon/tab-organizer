# Vivaldi Mod Integration (Advanced)

This guide describes how power users can apply Tab Organizer clusters to Vivaldi using a mod that consumes a snapshot produced by the extension.

## Workflow Overview

1. In the extension Options, enable "Vivaldi Mod integration (advanced)".
2. Run Organize in the popup or via the command.
3. Go back to Options → Advanced → copy/download the snapshot JSON.
4. In Vivaldi, install the mod template and paste/import the snapshot.
5. Review matches and apply stacks.

## Enable Vivaldi Mods

Follow the official Vivaldi docs for enabling mods (the procedure may change across versions). Typically:

- Enable mods in Settings → Appearance.
- Open the Application folder and place your custom JS under the appropriate mod folder.
- Restart Vivaldi.

## Install the Mod Template

- Copy `docs/vivaldi-mod/mod.template.js` to your Vivaldi mods directory.
- Optionally rename it.
- Restart Vivaldi to load the script.

## Apply a Snapshot

- After organizing tabs, open the extension Options page.
- Under Advanced, copy the snapshot or download the JSON file.
- In Vivaldi, use the mod’s button/menu to paste the snapshot, or import the file.
- Verify the tab matches; then click Apply.

## Matching Policy

- Primary: exact URL match against open tabs.
- Fallback: title contains (case-insensitive).
- The mod template presents a simple checklist for confirmation.

## Notes

- Vivaldi internal APIs change over time. The template exposes a small `stackTabs(ids)` function you can wire to your preferred method:
  - Official API if/when available.
  - UI automation hooks (advanced).
- The JSON snapshot is stored as `tabOrganizerModSnapshot` in `chrome.storage.local`.
- Snapshot structure:
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
