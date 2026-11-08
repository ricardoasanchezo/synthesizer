class SynthProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.synthPtr = 0;
        this.exports = null;
        this.isInitialized = false;

        this.port.onmessage = async (event) => {
            const { type, data } = event.data;

            if (type === 'INIT') {
                try {
                    const { instance } = await WebAssembly.instantiate(data.wasmBytes, {});
                    this.exports = instance.exports;
                    this.synthPtr = this.exports.synth_create(sampleRate);
                    this.isInitialized = true;
                } catch (err) {
                    console.error("WASM init error in AudioWorklet:", err);
                }
            } else if (this.isInitialized && this.synthPtr !== 0) {
                if (type === 'NOTE_ON') {
                    this.exports.synth_note_on(this.synthPtr, data.freq);
                } else if (type === 'NOTE_OFF') {
                    this.exports.synth_note_off(this.synthPtr);
                } else if (type === 'SET_WAVEFORM') {
                    this.exports.synth_set_waveform(this.synthPtr, data.waveformIndex);
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelData = output[0];

        if (!this.isInitialized || this.synthPtr === 0) {
            return true;
        }

        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = this.exports.synth_next_sample(this.synthPtr);
        }

        return true;
    }
}

registerProcessor('synth-processor', SynthProcessor);
