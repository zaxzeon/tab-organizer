EXT_DIR=extension
WASM_DIR=wasm
DIST_DIR=$(EXT_DIR)/dist
ARTIFACTS_DIR=artifacts
VERSION:=$(shell node -e "console.log(require('./$(EXT_DIR)/manifest.json').version)")

.PHONY: release deps test test-ts test-go build package clean

release: deps test build package
	@echo "\nRelease ready: $(ARTIFACTS_DIR)/tab-organizer-$(VERSION).zip"

deps:
	@echo "==> Installing JS dependencies"
	@cd $(EXT_DIR) && (npm ci >/dev/null 2>&1 || npm install)
	@echo "==> Downloading Go modules"
	@cd $(WASM_DIR) && go mod download

test: test-ts test-go

test-ts:
	@echo "==> Running TypeScript tests"
	@cd $(EXT_DIR) && npm run test --silent

test-go:
	@echo "==> Running Go tests"
	@cd $(WASM_DIR) && go test ./...

build:
	@echo "==> Building WASM and extension"
	@cd $(EXT_DIR) && npm run build --silent

package:
	@echo "==> Packaging extension dist into zip"
	@mkdir -p $(ARTIFACTS_DIR)
	@sh -c 'if command -v zip >/dev/null 2>&1; then cd $(DIST_DIR) && zip -qr ../../$(ARTIFACTS_DIR)/tab-organizer-$(VERSION).zip .; else echo "zip not found; skipping packaging. Install zip to produce artifact."; fi'

clean:
	@echo "==> Cleaning build artifacts"
	@rm -rf $(DIST_DIR) $(ARTIFACTS_DIR)

