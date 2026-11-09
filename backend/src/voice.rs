use crate::envelope::Envelope;
use crate::oscillator::{Oscillator, Waveform};

pub struct Voice {
    osc: Oscillator,
    env: Envelope,
}

impl Voice {
    pub fn new(waveform: Waveform, sample_rate: f32) -> Self {
        Self {
            osc: Oscillator::new(440.0, sample_rate, waveform),
            env: Envelope::new(0.01, 0.2, 0.6, 0.3, sample_rate),
        }
    }

    pub fn note_on(&mut self, freq: f32) {
        self.osc.set_freq(freq);
        self.env.note_on();
    }

    pub fn note_off(&mut self) {
        self.env.note_off();
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        self.osc.set_waveform(waveform);
    }

    pub fn next_sample(&mut self) -> f32 {
        self.osc.next_sample() * self.env.next_sample()
    }
}
