import { WaveformType } from './types.js';
import { CanvasPiano } from './piano.js';

let audioCtx: AudioContext | null = null;
let synthNode: AudioWorkletNode | null = null;
let isInitializing = false;
let piano: CanvasPiano | null = null;

async function initAudio(): Promise<void> {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        return;
    }
    if (isInitializing) return;
    isInitializing = true;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();

    const response = await fetch('dist/synthesizer.wasm');
    const wasmBytes = await response.arrayBuffer();

    await audioCtx.audioWorklet.addModule('dist/synth-processor.js');

    synthNode = new AudioWorkletNode(audioCtx, 'synth-processor');
    synthNode.connect(audioCtx.destination);

    synthNode.port.postMessage({ type: 'INIT', data: { wasmBytes } });

    const wfSelect = document.getElementById('waveformSelect') as HTMLSelectElement | null;
    if (wfSelect) {
        wfSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            if (synthNode) {
                synthNode.port.postMessage({
                    type: 'SET_WAVEFORM',
                    data: { waveformIndex: parseInt(target.value, 10) as WaveformType }
                });
            }
        });
    }

    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.innerText = 'Status: AudioWorklet Ready!';
    }

    const pianoContainer = document.getElementById('pianoContainer');
    if (pianoContainer && !piano) {
        piano = new CanvasPiano(
            pianoContainer,
            async (note) => {
                await initAudio();
                const freq = midiNoteToFreq(note);
                if (synthNode) {
                    synthNode.port.postMessage({ type: 'NOTE_ON', data: { freq } });
                }
            },
            (note) => {
                const freq = midiNoteToFreq(note);
                if (synthNode) {
                    synthNode.port.postMessage({ type: 'NOTE_OFF', data: { freq } });
                }
            },
            48, // C3
            36  // 3 octaves
        );
    }
}

function midiNoteToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}

async function handleMIDIMessage(event: MIDIMessageEvent): Promise<void> {
    if (!event.data) return;
    const [status, note, velocity] = event.data;
    const command = status >> 4;

    await initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    if (!synthNode) return;

    const freq = midiNoteToFreq(note);
    if (command === 9 && velocity > 0) {
        if (piano) piano.noteOn(note);
        synthNode.port.postMessage({ type: 'NOTE_ON', data: { freq } });
    } else if (command === 8 || (command === 9 && velocity === 0)) {
        if (piano) piano.noteOff(note);
        synthNode.port.postMessage({ type: 'NOTE_OFF', data: { freq } });
    }
}

async function initMIDI(): Promise<void> {
    if (!navigator.requestMIDIAccess) return;

    try {
        const midiAccess = await navigator.requestMIDIAccess();
        for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = handleMIDIMessage;
        }
        midiAccess.onstatechange = (e) => {
            const port = e.port;
            if (port && port.type === 'input' && port.state === 'connected') {
                (port as MIDIInput).onmidimessage = handleMIDIMessage;
            }
        };
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.innerText += ' | MIDI Connected!';
        }
    } catch (err) {
        console.error("MIDI failed:", err);
    }
}

initAudio();
// Initialize MIDI listener on load
initMIDI();
