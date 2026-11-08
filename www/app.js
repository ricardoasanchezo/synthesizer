let audioCtx = null;
let synthPtr = 0;
let wasmExports = null;
let isPlaying = false;

async function initWasm() {
    try {
        const response = await fetch('../target/wasm32-unknown-unknown/debug/synthesizer.wasm');
        const bytes = await response.arrayBuffer();

        const { instance } = await WebAssembly.instantiate(bytes, {});
        wasmExports = instance.exports;

        document.getElementById('status').innerText = 'Status: WASM Loaded. Click button to start audio!';
    } catch (err) {
        console.error(err);
        document.getElementById('status').innerText = 'Status: Failed to load WASM';
    }
}

async function startAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
        synthPtr = wasmExports.synth_create(audioCtx.sampleRate);

        // ScriptProcessorNode to pull samples from Rust
        const bufferSize = 4096;
        const scriptNode = audioCtx.createScriptProcessor(bufferSize, 0, 1);

        scriptNode.onaudioprocess = (e) => {
            const channelData = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < channelData.length; i++) {
                if (isPlaying && synthPtr !== 0) {
                    channelData[i] = wasmExports.synth_next_sample(synthPtr);
                } else {
                    channelData[i] = 0;
                }
            }
        };

        scriptNode.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
}

const btn = document.getElementById('noteBtn');

btn.addEventListener('mousedown', async () => {
    await startAudio();
    isPlaying = true;
    wasmExports.synth_note_on(synthPtr, 440.0); // A4
    btn.classList.add('active');
    btn.innerText = 'Playing (440Hz)...';
});

btn.addEventListener('mouseup', () => {
    if (synthPtr !== 0) {
        isPlaying = false;
        wasmExports.synth_note_off(synthPtr);
    }
    btn.classList.remove('active');
    btn.innerText = 'Hold to Play Note';
});

btn.addEventListener('mouseleave', () => {
    if (isPlaying) {
        if (synthPtr !== 0) {
            isPlaying = false;
            wasmExports.synth_note_off(synthPtr);
        }
        btn.classList.remove('active');
        btn.innerText = 'Hold to Play Note';
    }
});

initWasm();
