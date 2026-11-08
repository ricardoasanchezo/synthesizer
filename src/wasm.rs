use crate::oscillator::Waveform;
use crate::voice::Voice;

#[unsafe(no_mangle)]
pub extern "C" fn synth_create(sample_rate: f32) -> *mut Voice {
    let voice = Voice::new(Waveform::Sine, sample_rate);
    Box::into_raw(Box::new(voice))
}

#[unsafe(no_mangle)]
pub extern "C" fn synth_destroy(ptr: *mut Voice) {
    if !ptr.is_null() {
        unsafe {
            let _ = Box::from_raw(ptr);
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn synth_note_on(ptr: *mut Voice, freq: f32) {
    if !ptr.is_null() {
        unsafe {
            (*ptr).note_on(freq);
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn synth_note_off(ptr: *mut Voice) {
    if !ptr.is_null() {
        unsafe {
            (*ptr).note_off();
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn synth_set_waveform(ptr: *mut Voice, type_id: u32) {
    if !ptr.is_null() {
        let wf = match type_id {
            0 => Waveform::Sine,
            1 => Waveform::Square,
            2 => Waveform::Saw,
            3 => Waveform::Triangle,
            _ => Waveform::Sine,
        };
        unsafe {
            (*ptr).set_waveform(wf);
        }
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn synth_next_sample(ptr: *mut Voice) -> f32 {
    if ptr.is_null() {
        return 0.0;
    }
    unsafe { (*ptr).next_sample() * 0.2 }
}
