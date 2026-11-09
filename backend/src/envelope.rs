#[derive(Clone, Copy, Debug)]
pub enum Stage {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

pub struct Envelope {
    attack: f32,  // seconds
    decay: f32,   // seconds
    sustain: f32, // level, 0.0..1.0
    release: f32, // seconds
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

    pub fn is_active(&self) -> bool {
        !matches!(self.stage, Stage::Idle)
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
