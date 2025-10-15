export type WasmAPI = {
    GroupTabs: (input: string, threshold: number, optionsJson: string) => string;
};

let wasmReady: Promise<WasmAPI> | null = null;

export function loadWasm(): Promise<WasmAPI> {
    if (wasmReady) return wasmReady;
    wasmReady = (async () => {
        const wasmUrl = chrome.runtime.getURL('assets/tab_grouper.wasm');
        const execUrl = chrome.runtime.getURL('assets/wasm_exec.js');
        // Ensure Go runtime is available before constructing it
        await import(/* @vite-ignore */ execUrl);
        // @ts-ignore
        const go = new (globalThis as any).Go();
        let instance: WebAssembly.Instance | null = null;
        try {
            const mod = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject);
            instance = mod.instance;
        } catch {
            // Fallback for servers that don't serve with correct MIME type
            const resp = await fetch(wasmUrl);
            const bytes = await resp.arrayBuffer();
            const mod = await WebAssembly.instantiate(bytes, go.importObject);
            instance = mod.instance;
        }
        go.run(instance);
        if (typeof (globalThis as any).GroupTabs !== 'function') {
            throw new Error('WASM GroupTabs unavailable');
        }
        return globalThis as unknown as WasmAPI;
    })();
    return wasmReady;
}

