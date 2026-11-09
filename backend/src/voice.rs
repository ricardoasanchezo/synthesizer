use crate::envelope::Envelope;
use crate::oscillator::{Oscillator, Waveform};

pub struct Voice {
    pub osc: Oscillator,
    pub env: Envelope,
    pub note_freq: f32,
    pub active: bool,
}

impl Voice {
    pub fn new(waveform: Waveform, sample_rate: f32) -> Self {
        Self {
            osc: Oscillator::new(440.0, sample_rate, waveform),
            env: Envelope::new(0.01, 0.2, 0.6, 0.3, sample_rate),
            note_freq: 0.0,
            active: false,
        }
    }

    pub fn note_on(&mut self, freq: f32) {
        self.note_freq = freq;
        self.osc.set_freq(freq);
        self.env.note_on();
        self.active = true;
    }

    pub fn note_off(&mut self) {
        self.env.note_off();
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        self.osc.set_waveform(waveform);
    }

    pub fn next_sample(&mut self) -> f32 {
        let env_sample = self.env.next_sample();
        if env_sample <= 0.0001 && self.active && !self.env.is_active() {
            self.active = false;
        }
        self.osc.next_sample() * env_sample
    }
}

pub struct PolySynth {
    voices: Vec<Voice>,
    waveform: Waveform,
}

impl PolySynth {
    pub fn new(max_voices: usize, sample_rate: f32) -> Self {
        let waveform = Waveform::Sine;
        let mut voices = Vec::with_capacity(max_voices);
        for _ in 0..max_voices {
            voices.push(Voice::new(waveform, sample_rate));
        }
        Self {
            voices,
            waveform,
        }
    }

    pub fn note_on(&mut self, freq: f32) {
        // 1. Re-use existing voice with same frequency if playing
        for voice in self.voices.iter_mut() {
            if voice.active && (voice.note_freq - freq).abs() < 0.1 {
                voice.note_on(freq);
                return;
            }
        }

        // 2. Or pick an inactive voice
        for voice in self.voices.iter_mut() {
            if !voice.active {
                voice.note_on(freq);
                return;
            }
        }

        // 3. Fallback: steal the first voice
        if let Some(voice) = self.voices.first_mut() {
            voice.note_on(freq);
        }
    }

    pub fn note_off(&mut self, freq: f32) {
        for voice in self.voices.iter_mut() {
            if voice.active && (voice.note_freq - freq).abs() < 0.1 {
                voice.note_off();
            }
        }
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        this_waveform_change(self, waveform);
    }

    pub fn next_sample(&mut self) -> f32 {
        let mut sum = 0.0;
        for voice in self.voices.iter_mut() {
            if voice.active {
                sum += voice.next_sample();
            }
        }
        sum * 0.2 // Volume scaling for polyphony headroom
    }
}

fn this_waveform_change(synth: &mut PolySynth, waveform: Waveform) {
    synth.waveform = waveform;
    for voice in synth.voices.iter_mut() {
        voice.set_waveform(waveform);
    }
}
