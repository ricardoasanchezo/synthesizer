export type WaveformType = 0 | 1 | 2 | 3;

export interface InitMessage {
    type: 'INIT';
    data: {
        wasmBytes: ArrayBuffer;
    };
}

export interface NoteOnMessage {
    type: 'NOTE_ON';
    data: {
        freq: number;
    };
}

export interface NoteOffMessage {
    type: 'NOTE_OFF';
    data: {
        freq: number;
    };
}

export interface SetWaveformMessage {
    type: 'SET_WAVEFORM';
    data: {
        waveformIndex: WaveformType;
    };
}

export type SynthMessage = InitMessage | NoteOnMessage | NoteOffMessage | SetWaveformMessage;

export interface WasmExports {
    synth_create(sampleRate: number): number;
    synth_destroy(ptr: number): void;
    synth_note_on(ptr: number, freq: number): void;
    synth_note_off(ptr: number, freq: number): void;
    synth_set_waveform(ptr: number, waveform: number): void;
    synth_next_sample(ptr: number): number;
}
