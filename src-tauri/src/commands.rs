use crate::engine::{self, OptimizationResult};
use crate::ai::{self, SharpenRequest, SharpenResult};
use crate::clipboard;
use crate::keyring_vault;

#[tauri::command]
pub fn compress_prompt(text: String) -> OptimizationResult {
    engine::compress_text(&text)
}

#[tauri::command]
pub async fn sharpen_prompt_cmd(req: SharpenRequest) -> Result<SharpenResult, String> {
    ai::sharpen_prompt(req).await
}

#[tauri::command]
pub fn get_clipboard() -> Result<String, String> {
    clipboard::get_clipboard_text()
}

#[tauri::command]
pub fn set_clipboard(text: String) -> Result<(), String> {
    clipboard::set_clipboard_text(&text)
}

#[tauri::command]
pub fn capture_selection() -> Result<String, String> {
    clipboard::capture_selected_text()
}

#[tauri::command]
pub fn replace_selection(text: String) -> Result<(), String> {
    clipboard::replace_selected_text(&text)
}

#[tauri::command]
pub fn save_key(provider: String, key: String) -> Result<(), String> {
    keyring_vault::store_api_key(&provider, &key)
}

#[tauri::command]
pub fn load_key(provider: String) -> Result<String, String> {
    keyring_vault::get_api_key(&provider)
}
