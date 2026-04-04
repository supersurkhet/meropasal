use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_updater::UpdaterExt;
use std::time::Duration;
use tokio::time::sleep;

async fn check_and_prompt(app: AppHandle) {
	let updater = match app.updater() {
		Ok(u) => u,
		Err(e) => {
			eprintln!("[updater] failed to get updater: {e}");
			return;
		}
	};
	let update = match updater.check().await {
		Ok(Some(update)) => update,
		Ok(None) => return,
		Err(e) => {
			eprintln!("[updater] check failed: {e}");
			return;
		}
	};

	let version = update.version.clone();
	let body = update.body.clone().unwrap_or_default();

	// Download and install in background
	let mut downloaded = 0;
	if let Err(e) = update
		.download_and_install(
			|chunk_len, content_len| {
				downloaded += chunk_len;
				if let Some(total) = content_len {
					eprintln!("[updater] downloading {downloaded}/{total}");
				}
			},
			|| {
				eprintln!("[updater] download complete, installing...");
			},
		)
		.await
	{
		eprintln!("[updater] download/install failed: {e}");
		return;
	}

	eprintln!("[updater] v{version} ready — prompting user");

	let notes = if body.is_empty() {
		"A new update is ready.".to_string()
	} else {
		body
	};

	let message = format!(
		"MeroPasal v{version} has been downloaded.\n\n{notes}\n\nRestart now to apply the update?"
	);

	let handle = app.clone();
	app.dialog()
		.message(message)
		.title("Update Available")
		.buttons(MessageDialogButtons::OkCancelCustom(
			"Restart".into(),
			"Later".into(),
		))
		.show(move |restart| {
			if restart {
				handle.restart();
			}
		});
}

pub fn spawn_update_checker(app: AppHandle) {
	// Initial check after 5 seconds
	let handle = app.clone();
	tauri::async_runtime::spawn(async move {
		sleep(Duration::from_secs(5)).await;
		check_and_prompt(handle).await;
	});

	// Periodic check every 4 hours
	tauri::async_runtime::spawn(async move {
		let interval = Duration::from_secs(4 * 60 * 60);
		loop {
			sleep(interval).await;
			check_and_prompt(app.clone()).await;
		}
	});
}
