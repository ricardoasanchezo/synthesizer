use crate::oscillator::Waveform;
use crate::voice::Voice;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WebSynth {
    voice: Voice,
}

#[wasm_bindgen]
impl WebSynth {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            voice: Voice::new(Waveform::Sine, sample_rate),
        }
    }

    pub fn note_on(&mut self, freq: f32) {
        self.voice.note_on(freq);
    }

    pub fn note_off(&mut self) {
        self.voice.note_off();
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        self.voice.set_waveform(waveform);
    }

    pub fn next_sample(&mut self) -> f32 {
        self.voice.next_sample() * 0.2
    }
}
