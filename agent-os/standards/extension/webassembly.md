## WebAssembly integration in browser extensions

- **Use Cases**: Use WASM for CPU-intensive operations (image processing, cryptography, data parsing, compression)
- **Loading WASM**: Load .wasm files using WebAssembly.instantiateStreaming() or WebAssembly.instantiate()
- **CSP Compatibility**: WASM is CSP-compatible; no unsafe-eval needed unlike asm.js
- **Module Loading**: Bundle WASM modules as extension resources; load from extension:// URLs
- **Memory Management**: WASM has linear memory; manage memory carefully to avoid leaks
- **Shared Memory**: Use SharedArrayBuffer with WASM for multi-threading; requires COOP/COEP headers
- **Workers**: Run WASM in Web Workers to avoid blocking UI thread
- **Rust to WASM**: Use wasm-pack to compile Rust to WASM; excellent for performance-critical code
- **C/C++ to WASM**: Use Emscripten to compile C/C++ to WASM; leverage existing libraries
- **AssemblyScript**: Write TypeScript-like code that compiles to WASM; lower learning curve
- **Size Optimization**: Optimize WASM binary size; use wasm-opt from binaryen toolkit
- **Streaming Compilation**: Use streaming APIs for faster compilation of large WASM modules
- **JavaScript Interop**: Design efficient JS-WASM boundary; minimize data copying and function calls
- **Error Handling**: Handle WASM errors gracefully; WASM traps become JS exceptions
- **Debugging**: Use browser DevTools for WASM debugging; set breakpoints in WASM code
- **Browser Support**: WASM supported in all modern browsers; check browser compatibility for advanced features
- **Performance**: Profile to ensure WASM provides benefit; overhead of JS-WASM boundary can negate gains for small operations
- **Security**: Validate inputs before passing to WASM; WASM code can't escape sandbox but bugs can cause crashes
