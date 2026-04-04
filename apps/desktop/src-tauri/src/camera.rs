use base64::{engine::general_purpose::STANDARD as B64, Engine};
use image::codecs::jpeg::JpegEncoder;
use nokhwa::pixel_format::RgbFormat;
use nokhwa::utils::{
	CameraFormat, CameraIndex, FrameFormat, RequestedFormat, RequestedFormatType, Resolution,
};
use nokhwa::Camera;
use serde::Serialize;
use std::io::Cursor;
use std::thread;

// ── Types ──────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct CameraDevice {
	pub index: u32,
	pub name: String,
}

#[derive(Serialize, Clone)]
pub struct CaptureResult {
	pub data: String, // base64 JPEG
	pub width: u32,
	pub height: u32,
}

// ── Helpers ───────────────────────────────────────────

/// Open camera for permission check only (640x480).
pub fn open_camera_for_permission() -> Result<Camera, String> {
	open_camera(0, 640, 480)
}

/// Fallback: try multiple format strategies until one works.
fn open_camera(index: u32, w: u32, h: u32) -> Result<Camera, String> {
	// 1. Try MJPEG (most compatible on macOS)
	let mjpeg_fmt = RequestedFormat::new::<RgbFormat>(RequestedFormatType::Closest(
		CameraFormat::new(Resolution::new(w, h), FrameFormat::MJPEG, 30),
	));
	if let Ok(cam) = Camera::new(CameraIndex::Index(index), mjpeg_fmt) {
		return Ok(cam);
	}

	// 2. Try YUYV (common on Linux/Windows webcams)
	let yuyv_fmt = RequestedFormat::new::<RgbFormat>(RequestedFormatType::Closest(
		CameraFormat::new(Resolution::new(w, h), FrameFormat::YUYV, 30),
	));
	if let Ok(cam) = Camera::new(CameraIndex::Index(index), yuyv_fmt) {
		return Ok(cam);
	}

	// 3. Last resort: let nokhwa pick anything
	let any_fmt = RequestedFormat::new::<RgbFormat>(RequestedFormatType::None);
	Camera::new(CameraIndex::Index(index), any_fmt)
		.map_err(|e| format!("Failed to open camera: {e}"))
}

fn encode_jpeg_rgb(
	img: &image::ImageBuffer<image::Rgb<u8>, Vec<u8>>,
	quality: u8,
) -> Result<Vec<u8>, String> {
	let mut buf = Cursor::new(Vec::new());
	let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
	encoder
		.encode(
			img.as_raw(),
			img.width(),
			img.height(),
			image::ExtendedColorType::Rgb8,
		)
		.map_err(|e| format!("JPEG encode error: {e}"))?;
	Ok(buf.into_inner())
}

// ── Commands ───────────────────────────────────────────

#[tauri::command]
pub fn list_cameras() -> Result<Vec<CameraDevice>, String> {
	let mut devices = Vec::new();

	for idx in 0..8 {
		match open_camera(idx, 640, 480) {
			Ok(cam) => {
				let info = cam.info();
				devices.push(CameraDevice {
					index: idx,
					name: info.human_name().to_string(),
				});
			}
			Err(_) => break,
		}
	}

	if devices.is_empty() {
		Err("No cameras found".into())
	} else {
		Ok(devices)
	}
}

#[tauri::command]
pub fn capture_frame(camera_index: u32) -> Result<CaptureResult, String> {
	let mut camera = open_camera(camera_index, 1920, 1080)?;

	camera
		.open_stream()
		.map_err(|e| format!("Failed to open stream: {e}"))?;

	// Grab a few frames to let auto-exposure settle
	for _ in 0..5 {
		let _ = camera.frame();
		thread::sleep(std::time::Duration::from_millis(50));
	}

	let frame = camera
		.frame()
		.map_err(|e| format!("Failed to capture frame: {e}"))?;

	let res = frame.resolution();
	let width = res.width_x;
	let height = res.height_y;

	let data = if frame.source_frame_format() == FrameFormat::MJPEG {
		B64.encode(frame.buffer())
	} else {
		let decoded = frame
			.decode_image::<RgbFormat>()
			.map_err(|e| format!("Failed to decode frame: {e}"))?;
		let jpeg = encode_jpeg_rgb(&decoded, 90)?;
		B64.encode(&jpeg)
	};

	camera.stop_stream().ok();

	Ok(CaptureResult {
		data,
		width,
		height,
	})
}
