# Rust WASM Synthesizer

A modular software synthesizer written in Rust, compiled to WebAssembly, and running in the browser via Web Audio API (`AudioWorklet`).

## Project Structure
- `backend/`: Rust DSP engine and WASM bindings (`Cargo.toml`).
- `frontend/`: TypeScript frontend, HTML, and audio worklet processor (`package.json`, `tsconfig.json`).
- `scripts/`: Build and utility scripts.

---

## Prerequisites
- [Rust](https://rustup.rs/) (edition 2024)
- Node.js & npm (for TypeScript)
- Python 3 (for local static server)

---

## Build & Run Steps

1. **Build the Application (Backend & Frontend)**:
   ```bash
   ./scripts/build.sh
   ```

2. **Start Local Static Server**:
   ```bash
   python3 -m http.server 8000
   ```

3. **Open in Browser**:
   Navigate to:
   `http://localhost:8000/frontend/`

---

## Usage & Controls
- **On-Screen Canvas Piano**: Click or touch keys to play.
- **Computer Keyboard**: Use keys `A` through `K` (white keys) and `W`, `E`, `T`, `Y`, `U` (black keys).
- **Web MIDI**: Connect any USB MIDI controller to play notes directly.
- **Waveform Selector**: Change synth waveform dynamically.
