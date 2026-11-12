pub mod engine;

use engine::OptimizationResult;

// Tauri IPC Command for Mode 1 Compression
#[tauri::command]
pub fn compress_prompt(text: String) -> OptimizationResult {
    engine::compress_text(&text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![compress_prompt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
