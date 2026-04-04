use serde::Serialize;

#[derive(Serialize)]
pub struct PermissionResult {
    pub granted: bool,
    pub error: Option<String>,
}

/// Try to access the microphone to trigger OS permission prompt.
/// Works cross-platform: macOS shows the system dialog, Windows/Linux grant by default.
#[tauri::command]
pub fn request_microphone_permission() -> PermissionResult {
    use cpal::traits::{DeviceTrait, HostTrait};

    let host = cpal::default_host();
    match host.default_input_device() {
        Some(device) => {
            // Try to get supported configs — this actually accesses the device
            match device.supported_input_configs() {
                Ok(_) => PermissionResult { granted: true, error: None },
                Err(e) => PermissionResult {
                    granted: false,
                    error: Some(format!("Microphone access failed: {e}")),
                },
            }
        }
        None => PermissionResult {
            granted: false,
            error: Some("No microphone found".to_string()),
        },
    }
}

/// Try to open the camera to trigger OS permission prompt.
/// On macOS, merely querying devices doesn't trigger the dialog —
/// we need to actually open a camera stream.
#[tauri::command]
pub fn request_camera_permission() -> PermissionResult {
    // Reuse the cross-platform camera opener from camera module
    match crate::camera::open_camera_for_permission() {
        Ok(mut cam) => {
            match cam.open_stream() {
                Ok(_) => {
                    cam.stop_stream().ok();
                    PermissionResult { granted: true, error: None }
                }
                Err(e) => {
                    let msg = format!("{e}");
                    if msg.contains("denied") || msg.contains("authorized") || msg.contains("permission") {
                        PermissionResult {
                            granted: false,
                            error: Some("Camera permission denied. Please grant access in System Settings > Privacy & Security > Camera.".to_string()),
                        }
                    } else {
                        PermissionResult {
                            granted: false,
                            error: Some(format!("Camera access failed: {e}")),
                        }
                    }
                }
            }
        }
        Err(e) => PermissionResult {
            granted: false,
            error: Some(e),
        },
    }
}
