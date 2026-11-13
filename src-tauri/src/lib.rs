pub mod engine;
pub mod ai;
pub mod clipboard;
pub mod keyring_vault;
pub mod commands;

pub use commands::*;
use tauri::{Manager, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let shortcut_str = shortcut.to_string();
                        // Triggered by Ctrl+Shift+O
                        if shortcut_str.contains("Ctrl") && shortcut_str.contains("Shift") && shortcut_str.contains("KeyO") {
                            // 1. Capture selected text from the currently active external application
                            let captured = clipboard::capture_selected_text(app).unwrap_or_default();

                            // 2. Bring Prompt Optimizer window to foreground and emit capture event to UI
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                                let _ = window.emit("global-selection-captured", captured);
                            }
                        }
                    }
                })
                .build()
        )
        .setup(|app| {
            // Register system-wide shortcut Ctrl+Shift+O on application startup
            let shortcut = "Ctrl+Shift+O".parse::<Shortcut>().map_err(|e| e.to_string())?;
            app.global_shortcut().register(shortcut).map_err(|e| e.to_string())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::compress_prompt,
            commands::sharpen_prompt_cmd,
            commands::get_clipboard,
            commands::set_clipboard,
            commands::capture_selection,
            commands::replace_selection,
            commands::save_key,
            commands::load_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
