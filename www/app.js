import init, { WebSynth } from './../pkg/synthesizer.js';

/** @type {AudioContext | null} */
let audioCtx = null;

/** @type {WebSynth | null} */
let synth = null;

let isPlaying = false;

async function initSynth() {
    try {
        // 1. Initialize the WASM module
        await init();

        // 2. Create audio context
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });

        // 3. Create our Rust synth object instance directly using JS 'new'!
        synth = new WebSynth(audioCtx.sampleRate);

        // 4. Set up ScriptProcessor to pull samples
        const bufferSize = 4096;
        const scriptNode = audioCtx.createScriptProcessor(bufferSize, 0, 1);

        scriptNode.onaudioprocess = (e) => {
            const channelData = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < channelData.length; i++) {
                if (isPlaying && synth !== null) {
                    channelData[i] = synth.next_sample();
                } else {
                    channelData[i] = 0;
                }
            }
        };

        scriptNode.connect(audioCtx.destination);
        document.getElementById('status').innerText = 'Status: Ready & Running!';
    } catch (err) {
        console.error(err);
        document.getElementById('status').innerText = 'Status: Failed to initialize WASM';
    }
}

const btn = document.getElementById('noteBtn');

btn.addEventListener('mousedown', async () => {
    if (!audioCtx) {
        await initSynth();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    isPlaying = true;
    if (synth !== null) {
        synth.note_on(440.0); // A4
    }
    btn.classList.add('active');
    btn.innerText = 'Playing (440Hz)...';
});

btn.addEventListener('mouseup', () => {
    if (synth !== null) {
        isPlaying = false;
        synth.note_off();
    }
    btn.classList.remove('active');
    btn.innerText = 'Hold to Play Note';
});

btn.addEventListener('mouseleave', () => {
    if (isPlaying) {
        if (synth !== null) {
            isPlaying = false;
            synth.note_off();
        }
        btn.classList.remove('active');
        btn.innerText = 'Hold to Play Note';
    }
});

// Initialize on load
initSynth();
