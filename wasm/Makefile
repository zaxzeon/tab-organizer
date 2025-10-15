GOOS=js
GOARCH=wasm
OUT=../extension/assets/tab_grouper.wasm

.PHONY: build
build:
	@mkdir -p ../extension/assets
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o $(OUT) ./cmd/wasm
	@cp $$(go env GOROOT)/misc/wasm/wasm_exec.js ../extension/assets/wasm_exec.js

