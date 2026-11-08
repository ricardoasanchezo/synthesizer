/** @type {AudioContext | null} */
let audioCtx = null;
/** @type {AudioWorkletNode | null} */
let synthNode = null;
let isInitializing = false;

async function initAudio() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        return;
    }
    if (isInitializing) return;
    isInitializing = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const response = await fetch('../target/wasm32-unknown-unknown/debug/synthesizer.wasm');
    const wasmBytes = await response.arrayBuffer();

    await audioCtx.audioWorklet.addModule('synth-processor.js');

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

    document.getElementById('status').innerText = 'Status: AudioWorklet Ready!';
}

function midiNoteToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

async function initMIDI() {
    if (!navigator.requestMIDIAccess) return;

    try {
        const midiAccess = await navigator.requestMIDIAccess();
        for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = handleMIDIMessage;
        }
        midiAccess.onstatechange = (e) => {
            if (e.port.type === 'input' && e.port.state === 'connected') {
                e.port.onmidimessage = handleMIDIMessage;
            }
        };
        document.getElementById('status').innerText += ' | MIDI Connected!';
    } catch (err) {
        console.error("MIDI failed:", err);
    }
}

async function handleMIDIMessage(event) {
    const [status, note, velocity] = event.data;
    const command = status >> 4;

    await initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    if (!synthNode) return;

    if (command === 9 && velocity > 0) {
        const freq = midiNoteToFreq(note);
        synthNode.port.postMessage({ type: 'NOTE_ON', data: { freq } });
    } else if (command === 8 || (command === 9 && velocity === 0)) {
        synthNode.port.postMessage({ type: 'NOTE_OFF' });
    }
}

const btn = document.getElementById('noteBtn');

btn.addEventListener('mousedown', async () => {
    await initAudio();
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

// Initialize MIDI listener on load (AudioContext initializes on first gesture or MIDI note)
initMIDI();
