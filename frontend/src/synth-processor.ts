import { SynthMessage, WasmExports } from './types.js';

declare class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor();
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare function registerProcessor(name: string, processorCtor: new () => AudioWorkletProcessor): void;
declare const sampleRate: number;

class SynthProcessor extends AudioWorkletProcessor {
    private synthPtr: number = 0;
    private exports: WasmExports | null = null;
    private isInitialized: boolean = false;

    constructor() {
        super();

        this.port.onmessage = async (event: MessageEvent<SynthMessage>) => {
            const { type } = event.data;

            if (type === 'INIT') {
                try {
                    const { wasmBytes } = event.data.data;
                    const { instance } = await WebAssembly.instantiate(wasmBytes, {});
                    this.exports = instance.exports as unknown as WasmExports;
                    this.synthPtr = this.exports.synth_create(sampleRate);
                    this.isInitialized = true;
                } catch (err) {
                    console.error("WASM init error in AudioWorklet:", err);
                }
            } else if (this.isInitialized && this.synthPtr !== 0 && this.exports) {
                if (type === 'NOTE_ON') {
                    this.exports.synth_note_on(this.synthPtr, event.data.data.freq);
                } else if (type === 'NOTE_OFF') {
                    this.exports.synth_note_off(this.synthPtr, event.data.data.freq);
                } else if (type === 'SET_WAVEFORM') {
                    this.exports.synth_set_waveform(this.synthPtr, event.data.data.waveformIndex);
                }
            }
        };
    }

    process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
        const output = outputs[0];
        if (!output) return true;
        const channelData = output[0];
        if (!channelData) return true;

        if (!this.isInitialized || this.synthPtr === 0 || !this.exports) {
            return true;
        }

        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = this.exports.synth_next_sample(this.synthPtr);
        }

        return true;
    }
}

registerProcessor('synth-processor', SynthProcessor);
