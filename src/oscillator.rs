use std::f32::consts::TAU;

#[derive(Clone, Copy, Debug)]
pub enum Waveform {
    Sine = 0,
    Square = 1,
    Saw = 2,
    Triangle = 3,
}

pub struct Oscillator {
    phase: f32, // 0.0..1.0
    freq: f32,
    sample_rate: f32,
    waveform: Waveform,
}

impl Default for Oscillator {
    fn default() -> Self {
        Oscillator {
            phase: 0.0,
            freq: 440.0,
            sample_rate: 44_100.0,
            waveform: Waveform::Sine,
        }
    }
}

impl Oscillator {
    pub fn new(freq: f32, sample_rate: f32, waveform: Waveform) -> Self {
        Self {
            phase: 0.0,
            freq,
            sample_rate,
            waveform,
        }
    }

    pub fn next_sample(&mut self) -> f32 {
        let out = match self.waveform {
            Waveform::Sine => (self.phase * TAU).sin(),
            Waveform::Square => {
                if self.phase < 0.5 {
                    1.0
                } else {
                    -1.0
                }
            }
            Waveform::Saw => self.phase * 2.0 - 1.0,
            Waveform::Triangle => 4.0 * (self.phase - 0.5).abs() - 1.0,
        };

        self.phase += self.freq / self.sample_rate;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }
        out
    }

    pub fn set_freq(&mut self, freq: f32) {
        self.freq = freq;
    }

    pub fn set_waveform(&mut self, waveform: Waveform) {
        self.waveform = waveform;
    }
}
