use arboard::Clipboard;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
#[allow(non_snake_case)]
mod windows_input {
    use std::mem;
    use std::thread;
    use std::time::Duration;

    #[repr(C)]
    struct KEYBDINPUT {
        wVk: u16,
        wScan: u16,
        dwFlags: u32,
        time: u32,
        dwExtraInfo: usize,
    }

    #[repr(C)]
    struct INPUT {
        r#type: u32,
        ki: KEYBDINPUT,
        padding: [u8; 24],
    }

    const INPUT_KEYBOARD: u32 = 1;
    const KEYEVENTF_KEYUP: u32 = 0x0002;
    const VK_CONTROL: u16 = 0x11;
    const VK_C: u16 = 0x43;
    const VK_V: u16 = 0x56;

    extern "system" {
        fn SendInput(cInputs: u32, pInputs: *const INPUT, cbSize: i32) -> u32;
    }

    fn send_key_event(vk: u16, keyup: bool) {
        let mut input: INPUT = unsafe { mem::zeroed() };
        input.r#type = INPUT_KEYBOARD;
        input.ki.wVk = vk;
        input.ki.dwFlags = if keyup { KEYEVENTF_KEYUP } else { 0 };

        unsafe {
            SendInput(1, &input, mem::size_of::<INPUT>() as i32);
        }
    }

    pub fn send_copy_keystroke() {
        send_key_event(VK_CONTROL, false);
        send_key_event(VK_C, false);
        thread::sleep(Duration::from_millis(25));
        send_key_event(VK_C, true);
        send_key_event(VK_CONTROL, true);
    }

    pub fn send_paste_keystroke() {
        send_key_event(VK_CONTROL, false);
        send_key_event(VK_V, false);
        thread::sleep(Duration::from_millis(25));
        send_key_event(VK_V, true);
        send_key_event(VK_CONTROL, true);
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

/// Captures selected text from the currently active background application:
/// 1. Saves clipboard
/// 2. Briefly yields window focus to the active target app
/// 3. Emulates synthetic Ctrl+C
/// 4. Reads selected text and restores window focus
pub fn capture_selected_text(app: &AppHandle) -> Result<String, String> {
    let original_clipboard = get_clipboard_text().unwrap_or_default();

    // 1. If clipboard already contains text from a user copy, read it
    // 2. Otherwise trigger synthetic copy from focused app
    if let Some(window) = app.get_webview_window("main") {
        // Temporarily minimize/hide to yield OS focus to the user's active window (browser, IDE, etc.)
        let _ = window.hide();
        thread::sleep(Duration::from_millis(150));

        #[cfg(target_os = "windows")]
        windows_input::send_copy_keystroke();

        thread::sleep(Duration::from_millis(120));
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        #[cfg(target_os = "windows")]
        windows_input::send_copy_keystroke();
        thread::sleep(Duration::from_millis(100));
    }

    let selected_text = get_clipboard_text().unwrap_or_default();

    if selected_text.is_empty() {
        let _ = set_clipboard_text(&original_clipboard);
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
