use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use synthesizer::{Voice, Waveform};
use std::time::Duration;

fn main() {
    // 1. Find the speakers and ask what format they want.
    let host = cpal::default_host();
    let device = host.default_output_device().expect("no output device");
    let config = device.default_output_config().unwrap();

    if config.sample_format() != cpal::SampleFormat::F32 {
        panic!("this example expects an f32 output device");
    }

    let sample_rate = config.sample_rate().0 as f32;
    let channels = config.channels() as usize;
    let stream_config: cpal::StreamConfig = config.into();

    // 2. Build the voice using the device's REAL sample rate.
    let mut voice = Voice::new(Waveform::Sine, sample_rate);
    voice.note_on(490.0);

    let release_at = sample_rate as u64; // release after 1 second
    let mut counter: u64 = 0;

    // 3. Build the stream. This closure is the audio callback.
    let stream = device
        .build_output_stream(
            &stream_config,
            move |data: &mut [f32], _| {
                for frame in data.chunks_mut(channels) {
                    if counter == release_at {
                        voice.note_off();
                    }
                    counter += 1;

                    let s = voice.next_sample() * 0.2;
                    for out in frame.iter_mut() {
                        *out = s;
                    }
                }
            },
            |err| eprintln!("stream error: {err}"),
            None,
        )
        .unwrap();

    // 4. Start playback and keep the program alive.
    stream.play().unwrap();
    std::thread::sleep(Duration::from_secs(2));
}