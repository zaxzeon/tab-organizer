# Tab Organizer — Chrome/Chromium MV3 Extension

## Purpose

Organize, group, and optionally sleep tabs using lightweight NLP/ML.
For large windows, a Go WASM module accelerates clustering; for smaller sets, a JS fallback is used.

## Repository Layout

- `extension/` — MV3 extension (Vite + CRX).
- `wasm/` — Go code compiled to WASM; exposes `GroupTabs`.
- `Makefile` — One‑shot release pipeline.
- `Dockerfile` — Reproducible builder that runs the same pipeline.

## Quickstart (One‑liner)

Build, test, and package with a single command:

```bash
make release
```

The packaged zip is written to `artifacts/tab-organizer-<version>.zip`.

## Install from Release Package

If you used `make release` or the Docker image, you'll have a zip in `artifacts/`.

1. Unzip `artifacts/tab-organizer-<version>.zip` to a folder (e.g. `./dist-unzipped`).
2. Open `chrome://extensions` and enable “Developer mode”.
3. Click “Load unpacked” and select the unzipped folder.

Notes:

- Chrome typically doesn't install directly from a zip; you must extract and load the folder.
- For publishing, upload the zip to the Chrome Web Store.

## Load the Extension

1. Open `chrome://extensions`.
2. Enable “Developer mode”.
3. Click “Load unpacked” and select `extension/dist`.

## Developer Commands

- Install deps: `make deps`
- Run tests: `make test` (`npm run test`, `go test ./...`)
- Build only: `make build`
- Package only: `make package` (requires `zip`)

## Reproducible Builds (Docker)

Build the image and run the pipeline inside a container:

```bash
docker build -t tab-organizer:release .
docker run --rm -v "$PWD/out:/out" tab-organizer:release \
  sh -lc 'cp -r artifacts/* /out/'
```

Artifacts will be copied to `./out` on the host.

Advanced:

- Override Go toolchain version: `docker build --build-arg GO_VERSION=1.25.2 -t tab-organizer:release .`
- Export directly to the host without a bind mount:
  `docker create --name torg tab-organizer:release && docker cp torg:/app/artifacts ./out && docker rm torg`

## Requirements (non‑Docker)

- Node.js 20+
- Go 1.25+
- Optional: `zip` CLI for packaging

## Notes

- The build auto-fetches `wasm_exec.js` if missing.
- The extension limits `web_accessible_resources` to extension pages.
- Options include threshold, stopwords, domain boost, and sleep inactive tabs.
