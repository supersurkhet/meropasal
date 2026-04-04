use std::sync::Mutex;
use tauri::Manager;

mod audio;
mod camera;
mod files;
mod permissions;
mod updater;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(Mutex::new(audio::AudioCaptureState::default()))
        .invoke_handler(tauri::generate_handler![
            audio::list_audio_devices,
            audio::start_audio_capture,
            audio::stop_audio_capture,
            files::read_file_base64,
            files::parse_spreadsheet,
            files::parse_word_doc,
            camera::list_cameras,
            camera::capture_frame,
            permissions::request_microphone_permission,
            permissions::request_camera_permission,
        ])
        .setup(|app| {
            // Check for --tenant CLI arg or MEROPASAL_TENANT env var (desktop only)
            #[cfg(desktop)]
            {
                let tenant = std::env::args()
                    .skip_while(|a| a != "--tenant")
                    .nth(1)
                    .or_else(|| std::env::var("MEROPASAL_TENANT").ok());

                if let Some(tenant_slug) = tenant {
                    let url = format!("https://{}.meropasal.com", tenant_slug);
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.eval(&format!("window.location.replace('{}')", url));
                    }
                }
            }

            // Auto-updater (release builds only)
            #[cfg(all(desktop, not(debug_assertions)))]
            updater::spawn_update_checker(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MeroPasal");
}
