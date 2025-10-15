GOOS=js
GOARCH=wasm
OUT=../extension/assets/tab_grouper.wasm
DEST=../extension/assets/wasm_exec.js

.PHONY: build
build:
	@mkdir -p ../extension/assets
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o $(OUT) ./cmd/wasm
	@SRC=""; \
	# Try provided env var first
	if [ -n "$$WASM_EXEC_JS" ] && [ -f "$$WASM_EXEC_JS" ]; then SRC="$$WASM_EXEC_JS"; fi; \
	# Try GOROOT
	if [ -z "$$SRC" ]; then CAND=$$(go env GOROOT)/misc/wasm/wasm_exec.js; if [ -f "$$CAND" ]; then SRC="$$CAND"; fi; fi; \
	# Try common distro paths
	if [ -z "$$SRC" ]; then \
		for p in \
			/usr/lib/go/misc/wasm/wasm_exec.js \
			/usr/lib/go/src/misc/wasm/wasm_exec.js \
			/usr/local/go/misc/wasm/wasm_exec.js; do \
			if [ -f "$$p" ]; then SRC="$$p"; break; fi; \
		done; \
	fi; \
	# As a last resort, fetch from the matching Go tag
	if [ -z "$$SRC" ] && [ ! -f "$(DEST)" ]; then \
		GV=$$(go env GOVERSION); \
		URL="https://raw.githubusercontent.com/golang/go/$$GV/misc/wasm/wasm_exec.js"; \
		echo "Fetching $$URL"; \
		( curl -fsSL "$$URL" -o "$(DEST)" || wget -qO "$(DEST)" "$$URL" ) || true; \
	fi; \
	if [ -n "$$SRC" ]; then cp "$$SRC" "$(DEST)"; elif [ ! -f "$(DEST)" ]; then \
		echo "wasm_exec.js not found; install Go sources, set WASM_EXEC_JS, or ensure network access" >&2; exit 1; \
	fi

