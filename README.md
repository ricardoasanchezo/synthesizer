# Rust WASM Synthesizer

A modular software synthesizer written in Rust, compiled to WebAssembly, and running in the browser via Web Audio API (`AudioWorklet`).

## Features
- **Rust DSP Engine**: Oscillator (Sine, Square, Saw, Triangle) and ADSR Envelope.
- **WebAssembly**: Compiled to WebAssembly with zero dependencies for the audio engine.
- **AudioWorklet**: Real-time audio rendering thread for zero UI stuttering.
- **Web MIDI**: Plug in any hardware MIDI keyboard to play.

---

## Prerequisites
- [Rust](https://rustup.rs/) (edition 2024)
- Python 3 (for local static server)

---

## Build & Run Steps

1. **Compile to WebAssembly**:
   ```bash
   cargo build --target wasm32-unknown-unknown --lib
   ```

2. **Start Local Static Server**:
   ```bash
   python3 -m http.server 8000
   ```

3. **Open in Browser**:
   Navigate to:
   `http://localhost:8000/www/`

---

## Usage
- Click **"Hold to Play Note"** to test audio.
- Change the waveform using the dropdown selector.
- Connect a MIDI controller via USB to play notes directly.
