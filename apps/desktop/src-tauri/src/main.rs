// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Check for --tenant CLI arg or MEROPASAL_TENANT env var
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MeroPasal desktop app");
}
