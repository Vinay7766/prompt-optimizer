use arboard::Clipboard;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
mod windows_input {
    use std::mem;
    use std::thread;
    use std::time::Duration;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
        VK_CONTROL, VK_SHIFT, VK_C, VK_V,
    };

    fn send_key(vk: u16, keyup: bool) {
        let flags = if keyup { KEYEVENTF_KEYUP } else { 0 };
        let mut input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    wScan: 0,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        unsafe {
            SendInput(1, &mut input, mem::size_of::<INPUT>() as i32);
        }
    }

    pub fn send_copy_keystroke() {
        thread::sleep(Duration::from_millis(100));
        // Release Shift so hotkey Ctrl+Shift+O doesn't turn Ctrl+C into Ctrl+Shift+C (Inspect Element)
        send_key(VK_SHIFT, true);
        send_key(VK_CONTROL, false);
        thread::sleep(Duration::from_millis(20));
        send_key(VK_C, false);
        thread::sleep(Duration::from_millis(30));
        send_key(VK_C, true);
        send_key(VK_CONTROL, true);
    }

    pub fn send_paste_keystroke() {
        thread::sleep(Duration::from_millis(100));
        send_key(VK_SHIFT, true);
        send_key(VK_CONTROL, false);
        thread::sleep(Duration::from_millis(20));
        send_key(VK_V, false);
        thread::sleep(Duration::from_millis(30));
        send_key(VK_V, true);
        send_key(VK_CONTROL, true);
    }
}

pub fn get_clipboard_text() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    clipboard.get_text().map_err(|e| format!("Clipboard read error: {}", e))
}

pub fn set_clipboard_text(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    clipboard.set_text(text.to_string()).map_err(|e| format!("Clipboard write error: {}", e))
}

/// Captures selected text from the active application:
/// 1. Saves clipboard
/// 2. If the Prompt Optimizer window currently has focus, briefly yields focus
/// 3. Sends native Win32 Ctrl+C
/// 4. Reads clipboard and returns the captured text
pub fn capture_selected_text(app: &AppHandle) -> Result<String, String> {
    let original_clipboard = get_clipboard_text().unwrap_or_default();
    let _ = set_clipboard_text("");

    if let Some(window) = app.get_webview_window("main") {
        if window.is_focused().unwrap_or(false) {
            let _ = window.hide();
            thread::sleep(Duration::from_millis(150));
            #[cfg(target_os = "windows")]
            windows_input::send_copy_keystroke();
            thread::sleep(Duration::from_millis(100));
            let _ = window.show();
            let _ = window.set_focus();
        } else {
            #[cfg(target_os = "windows")]
            windows_input::send_copy_keystroke();
            thread::sleep(Duration::from_millis(100));
        }
    } else {
        #[cfg(target_os = "windows")]
        windows_input::send_copy_keystroke();
        thread::sleep(Duration::from_millis(100));
    }

    let selected_text = get_clipboard_text().unwrap_or_default();

    if selected_text.is_empty() {
        if !original_clipboard.is_empty() {
            let _ = set_clipboard_text(&original_clipboard);
        }
        return Err("No active text selection found in current window".to_string());
    }

    Ok(selected_text)
}

/// Replaces the currently selected text in the active application
pub fn replace_selected_text(new_text: &str) -> Result<(), String> {
    set_clipboard_text(new_text)?;

    #[cfg(target_os = "windows")]
    windows_input::send_paste_keystroke();

    Ok(())
}
