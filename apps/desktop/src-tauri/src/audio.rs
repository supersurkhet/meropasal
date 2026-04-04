use base64::{engine::general_purpose::STANDARD as B64, Engine};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use serde::Serialize;
use std::collections::VecDeque;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use tauri::{AppHandle, Emitter, State};

const TARGET_SAMPLE_RATE: u32 = 16_000;
const CHUNK_SAMPLES: usize = 512; // ~32ms at 16kHz

// ── Types ──────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct AudioDevice {
	name: String,
	is_default: bool,
}

#[derive(Serialize, Clone)]
struct AudioChunkPayload {
	data: String, // base64-encoded Int16 PCM
}

pub struct AudioCaptureState {
	is_capturing: Arc<AtomicBool>,
	capture_thread: Option<JoinHandle<()>>,
}

impl Default for AudioCaptureState {
	fn default() -> Self {
		Self {
			is_capturing: Arc::new(AtomicBool::new(false)),
			capture_thread: None,
		}
	}
}

// ── Commands ───────────────────────────────────────────

#[tauri::command]
pub fn list_audio_devices() -> Result<Vec<AudioDevice>, String> {
	let host = cpal::default_host();
	let default_name = host
		.default_input_device()
		.and_then(|d| d.name().ok())
		.unwrap_or_default();

	let devices = host
		.input_devices()
		.map_err(|e| format!("Failed to enumerate audio devices: {e}"))?
		.filter_map(|d| {
			d.name().ok().map(|name| AudioDevice {
				is_default: name == default_name,
				name,
			})
		})
		.collect();

	Ok(devices)
}

#[tauri::command]
pub fn start_audio_capture(
	app: AppHandle,
	state: State<'_, Mutex<AudioCaptureState>>,
	device_name: Option<String>,
) -> Result<(), String> {
	let mut capture = state.lock().map_err(|e| format!("Lock error: {e}"))?;

	if capture.is_capturing.load(Ordering::Relaxed) {
		return Err("Already capturing".into());
	}

	capture.is_capturing.store(true, Ordering::Relaxed);
	let stop_flag = capture.is_capturing.clone();

	let handle = thread::spawn(move || {
		if let Err(e) = run_capture(app, stop_flag.clone(), device_name) {
			eprintln!("[audio] capture error: {e}");
		}
		stop_flag.store(false, Ordering::Relaxed);
	});

	capture.capture_thread = Some(handle);
	Ok(())
}

#[tauri::command]
pub fn stop_audio_capture(
	state: State<'_, Mutex<AudioCaptureState>>,
) -> Result<(), String> {
	let mut capture = state.lock().map_err(|e| format!("Lock error: {e}"))?;
	capture.is_capturing.store(false, Ordering::Relaxed);

	if let Some(handle) = capture.capture_thread.take() {
		// Give the thread a moment to stop, don't block forever
		let _ = handle.join();
	}

	Ok(())
}

// ── Capture loop ───────────────────────────────────────

fn run_capture(
	app: AppHandle,
	stop_flag: Arc<AtomicBool>,
	device_name: Option<String>,
) -> Result<(), String> {
	let host = cpal::default_host();

	let device = match &device_name {
		Some(name) => host
			.input_devices()
			.map_err(|e| format!("Failed to enumerate devices: {e}"))?
			.find(|d| d.name().ok().as_deref() == Some(name.as_str()))
			.ok_or_else(|| format!("Device not found: {name}"))?,
		None => host
			.default_input_device()
			.ok_or("No default input device")?,
	};

	let supported_configs = device
		.supported_input_configs()
		.map_err(|e| format!("Failed to get supported configs: {e}"))?;

	// Try to find a config that supports 16kHz mono I16 directly,
	// otherwise fall back to the device default and resample.
	let (config, needs_resample) = find_best_config(supported_configs)?;
	let device_rate = config.sample_rate().0;
	let device_channels = config.channels() as usize;

	let buffer: Arc<Mutex<VecDeque<i16>>> =
		Arc::new(Mutex::new(VecDeque::with_capacity(CHUNK_SAMPLES * 4)));

	let buf_clone = buffer.clone();
	let app_clone = app.clone();
	let stop_clone = stop_flag.clone();

	let resample_ratio = if needs_resample {
		device_rate as f64 / TARGET_SAMPLE_RATE as f64
	} else {
		1.0
	};

	let stream = device
		.build_input_stream(
			&config.into(),
			move |data: &[i16], _: &cpal::InputCallbackInfo| {
				if !stop_clone.load(Ordering::Relaxed) {
					return;
				}

				let mono_samples: Vec<i16> = if device_channels > 1 {
					// Downmix to mono by averaging channels
					data.chunks(device_channels)
						.map(|frame| {
							let sum: i32 = frame.iter().map(|&s| s as i32).sum();
							(sum / device_channels as i32) as i16
						})
						.collect()
				} else {
					data.to_vec()
				};

				let samples = if needs_resample {
					downsample(&mono_samples, resample_ratio)
				} else {
					mono_samples
				};

				let mut buf = buf_clone.lock().unwrap();
				buf.extend(samples);

				while buf.len() >= CHUNK_SAMPLES {
					let chunk: Vec<i16> = buf.drain(..CHUNK_SAMPLES).collect();
					let bytes: Vec<u8> = chunk
						.iter()
						.flat_map(|&s| s.to_le_bytes())
						.collect();
					let b64 = B64.encode(&bytes);
					let _ = app_clone.emit("audio-chunk", AudioChunkPayload { data: b64 });
				}
			},
			move |err| {
				eprintln!("[audio] stream error: {err}");
			},
			None,
		)
		.map_err(|e| format!("Failed to build input stream: {e}"))?;

	stream
		.play()
		.map_err(|e| format!("Failed to start stream: {e}"))?;

	// Park the thread, keeping the stream alive until stop is signaled
	while stop_flag.load(Ordering::Relaxed) {
		thread::sleep(std::time::Duration::from_millis(50));
	}

	// Stream is dropped here, stopping capture
	Ok(())
}

// ── Helpers ────────────────────────────────────────────

fn find_best_config(
	configs: cpal::SupportedInputConfigs,
) -> Result<(cpal::SupportedStreamConfig, bool), String> {
	let configs: Vec<_> = configs.collect();

	// First: try to find exact 16kHz mono I16
	for cfg in &configs {
		if cfg.channels() == 1
			&& cfg.min_sample_rate().0 <= TARGET_SAMPLE_RATE
			&& cfg.max_sample_rate().0 >= TARGET_SAMPLE_RATE
			&& cfg.sample_format() == cpal::SampleFormat::I16
		{
			return Ok((
				cfg.clone()
					.with_sample_rate(cpal::SampleRate(TARGET_SAMPLE_RATE)),
				false,
			));
		}
	}

	// Second: any config that supports 16kHz (any channel count, I16)
	for cfg in &configs {
		if cfg.min_sample_rate().0 <= TARGET_SAMPLE_RATE
			&& cfg.max_sample_rate().0 >= TARGET_SAMPLE_RATE
			&& cfg.sample_format() == cpal::SampleFormat::I16
		{
			return Ok((
				cfg.clone()
					.with_sample_rate(cpal::SampleRate(TARGET_SAMPLE_RATE)),
				false,
			));
		}
	}

	// Third: any I16 config, we'll resample
	for cfg in &configs {
		if cfg.sample_format() == cpal::SampleFormat::I16 {
			let rate = cfg.max_sample_rate(); // Use max for best quality
			return Ok((cfg.clone().with_sample_rate(rate), true));
		}
	}

	// Last resort: first available config
	let cfg = configs
		.into_iter()
		.next()
		.ok_or("No supported input configs")?;
	let rate = cfg.max_sample_rate();
	Ok((cfg.with_sample_rate(rate), true))
}

/// Simple linear interpolation downsampler
fn downsample(samples: &[i16], ratio: f64) -> Vec<i16> {
	let output_len = (samples.len() as f64 / ratio).floor() as usize;
	let mut output = Vec::with_capacity(output_len);

	for i in 0..output_len {
		let src_pos = i as f64 * ratio;
		let idx = src_pos.floor() as usize;
		let frac = src_pos - idx as f64;

		let sample = if idx + 1 < samples.len() {
			let a = samples[idx] as f64;
			let b = samples[idx + 1] as f64;
			(a + frac * (b - a)) as i16
		} else if idx < samples.len() {
			samples[idx]
		} else {
			0
		};

		output.push(sample);
	}

	output
}
