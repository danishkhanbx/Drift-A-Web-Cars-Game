// check for wasm module support
function wasmSupported() {
    try {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
        }
    } catch (e) { }
    return false;
}

