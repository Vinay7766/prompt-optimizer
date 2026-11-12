pub mod engine;
pub mod ai;
pub mod clipboard;
pub mod keyring_vault;

use engine::OptimizationResult;
use ai::{SharpenRequest, SharpenResult};

// Mode 1: Local Token Compression
#[tauri::command]
pub fn compress_prompt(text: String) -> OptimizationResult {
    engine::compress_text(&text)
}

// Mode 2: AI Prompt Sharpening
#[tauri::command]
pub async fn sharpen_prompt_cmd(req: SharpenRequest) -> Result<SharpenResult, String> {
    ai::sharpen_prompt(req).await
}

// Clipboard reading and writing
#[tauri::command]
pub fn get_clipboard() -> Result<String, String> {
    clipboard::get_clipboard_text()
}

#[tauri::command]
pub fn set_clipboard(text: String) -> Result<(), String> {
    clipboard::set_clipboard_text(&text)
}

// Keyring vault operations
#[tauri::command]
pub fn save_key(provider: String, key: String) -> Result<(), String> {
    keyring_vault::store_api_key(&provider, &key)
}

#[tauri::command]
pub fn load_key(provider: String) -> Result<String, String> {
    keyring_vault::get_api_key(&provider)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            compress_prompt,
            sharpen_prompt_cmd,
            get_clipboard,
            set_clipboard,
            save_key,
            load_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
