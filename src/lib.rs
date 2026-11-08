use std::f32::consts::TAU;

#[derive(Clone, Copy, Debug)]
pub enum Waveform {
    Sine,
    Square,
    Saw,
    Triangle,
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
            waveform: Waveform::Sine
        }
    }
}

impl Oscillator {
    pub fn new(freq: f32, sample_rate: f32, waveform: Waveform) -> Self {
        Self { phase: 0.0, freq, sample_rate, waveform }
    }

    pub fn next_sample(&mut self) -> f32 {
        let out = match self.waveform {
            Waveform::Sine => (self.phase * TAU).sin(),
            Waveform::Square => {
                if self.phase < 0.5 { 1.0 } else { -1.0 }
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
}

#[derive(Clone, Copy, Debug)]
enum Stage {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

pub struct Envelope {
    attack: f32,   // seconds
    decay: f32,    // seconds
    sustain: f32,  // level, 0.0..1.0
    release: f32,  // seconds
    sample_rate: f32,
    stage: Stage,
    level: f32,
    release_step: f32,
}

impl Envelope {
    pub fn new(attack: f32, decay: f32, sustain: f32, release: f32, sample_rate: f32) -> Self {
        Self {
            attack,
            decay,
            sustain,
            release,
            sample_rate,
            stage: Stage::Idle,
            level: 0.0,
            release_step: 0.0,
        }
    }

    pub fn note_on(&mut self) {
        self.stage = Stage::Attack;
    }

    pub fn note_off(&mut self) {
        if !matches!(self.stage, Stage::Idle) {
            // Fall from wherever we are now to 0 in `release` seconds.
            self.release_step = self.level / (self.release * self.sample_rate).max(1.0);
            self.stage = Stage::Release;
        }
    }

    pub fn next_sample(&mut self) -> f32 {
        match self.stage {
            Stage::Idle => {}
            Stage::Attack => {
                self.level += 1.0 / (self.attack * self.sample_rate).max(1.0);
                if self.level >= 1.0 {
                    self.level = 1.0;
                    self.stage = Stage::Decay;
                }
            }
            Stage::Decay => {
                self.level -= (1.0 - self.sustain) / (self.decay * self.sample_rate).max(1.0);
                if self.level <= self.sustain {
                    self.level = self.sustain;
                    self.stage = Stage::Sustain;
                }
            }
            Stage::Sustain => {
                self.level = self.sustain;
            }
            Stage::Release => {
                self.level -= self.release_step;
                if self.level <= 0.0 {
                    self.level = 0.0;
                    self.stage = Stage::Idle;
                }
            }
        }
        self.level
    }
}

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

    pub fn next_sample(&mut self) -> f32 {
        self.osc.next_sample() * self.env.next_sample()
    }
}