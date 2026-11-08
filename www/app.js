/** @type {AudioContext | null} */
let audioCtx = null;
/** @type {AudioWorkletNode | null} */
let synthNode = null;

async function initAudio() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    await audioCtx.audioWorklet.addModule('synth-processor.js');

    // Fetch pure WASM binary built by cargo
    const response = await fetch('../target/wasm32-unknown-unknown/debug/synthesizer.wasm');
    const wasmBytes = await response.arrayBuffer();

    synthNode = new AudioWorkletNode(audioCtx, 'synth-processor');
    synthNode.connect(audioCtx.destination);

    synthNode.port.postMessage({ type: 'INIT', data: { wasmBytes } });

    const wfSelect = /** @type {HTMLSelectElement} */ (document.getElementById('waveformSelect'));
    wfSelect.addEventListener('change', (e) => {
        const target = /** @type {HTMLSelectElement} */ (e.target);
        if (synthNode) {
            synthNode.port.postMessage({
                type: 'SET_WAVEFORM',
                data: { waveformIndex: parseInt(target.value, 10) }
            });
        }
    });

    document.getElementById('status').innerText = 'Status: AudioWorklet + Pure WASM Ready!';
}

const btn = document.getElementById('noteBtn');

btn.addEventListener('mousedown', async () => {
    await initAudio();
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    if (synthNode) {
        synthNode.port.postMessage({ type: 'NOTE_ON', data: { freq: 440.0 } });
    }
    btn.classList.add('active');
    btn.innerText = 'Playing (440Hz)...';
});

btn.addEventListener('mouseup', () => {
    if (synthNode) {
        synthNode.port.postMessage({ type: 'NOTE_OFF' });
    }
    btn.classList.remove('active');
    btn.innerText = 'Hold to Play Note';
});

btn.addEventListener('mouseleave', () => {
    if (synthNode) {
        synthNode.port.postMessage({ type: 'NOTE_OFF' });
    }
    btn.classList.remove('active');
    btn.innerText = 'Hold to Play Note';
});
