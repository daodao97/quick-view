use tauri::AppHandle;

pub fn gen_window(app: &AppHandle, name: &str) -> Result<tauri::WebviewWindow, tauri::Error> {
    tauri::WebviewWindowBuilder::new(app, name, tauri::WebviewUrl::App(format!("/{}", name).into()))
        .title(format!("{}-view", name))
        .inner_size(800.0, 600.0)
        .visible(false)
        .build()
}

pub fn get_window(app_handle: &AppHandle, name: &str) -> Option<WebviewWindow> {
    app_handle.get_webview_window(name)
}

pub fn gen_or_get_window(app_handle: &AppHandle, name: &str) -> Option<WebviewWindow> {
    if let Some(window) = app_handle.get_webview_window(name) {
        Some(window)  // 如果窗口已存在，则直接返回
    } else {
        // 尝试创建一个新的窗口，如果出现错误，则返回 None
        match gen_window(app_handle, name) {
            Ok(window) => Some(window),  // 如果创建成功，返回新的窗口
            Err(_) => None,  // 如果创建失败，返回 None
        }
    }
}

pub fn show_win(app: &AppHandle, name: &str) {
    let panel = crate::util::gen_or_get_window(&app, name).unwrap();
    panel.show().unwrap();
    panel.set_focus().unwrap();
}

use tauri::Manager;
use tauri::Runtime;
use tauri::WebviewWindow;
use tauri_plugin_clipboard_manager::ClipboardExt;
use std::{sync::{Arc, Mutex}, time::Duration};
use tokio::time::sleep;

pub async fn on_clipboard_change<R: Runtime, F>(app: tauri::AppHandle<R>, callback: F)
    where
        F: FnMut(String) + Send + 'static,
{
    println!("on_clipboard_change start");
    let last_content = Arc::new(Mutex::new(String::new()));
    let callback = Arc::new(Mutex::new(callback)); // Wrap the callback in Arc and Mutex for thread safety and reusability

    loop {
        let app_clone = app.clone();
        let last_content_clone = last_content.clone();
        let callback_clone = callback.clone(); // Clone the Arc to use in the async block

        // Use async block to handle clipboard changes
        {
            let current_content = match app_clone.clipboard().read_text() {
                Ok(content) => content,
                Err(_) => String::new(),
            };

            let mut last_content_lock = last_content_clone.lock().unwrap();
            if *last_content_lock != current_content {
                {
                    let mut callback_lock = callback_clone.lock().unwrap();
                    (*callback_lock)(current_content.clone());  // Call the callback under its lock
                }
                *last_content_lock = current_content;
            }
        }  // MutexGuard is dropped here

        // Sleep at the end of the loop to prevent CPU saturation
        sleep(Duration::from_secs(1)).await;
    }
}

pub fn is_json(input: &str) -> bool {
    let input = input.trim().to_string();
    let input = remove_comments(&input);
    // if not start with { or [ then not json
    if !input.starts_with('{') && !input.starts_with('[') {
        return false;
    }
    // if not end with } or ] then not json
    if !input.ends_with('}') && !input.ends_with(']') {
        return false;
    }
    serde_json::from_str::<serde_json::Value>(&input).is_ok()
}


pub fn is_sql(query: &str) -> bool {
    let re = Regex::new(r"^(?i)(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|SHOW)\b").unwrap();
    re.is_match(query)
}


use regex::Regex;

pub fn remove_comments(input: &str) -> String {
    let result = input.trim().to_string();

    // Regex to find string literals and replace them temporarily
    let re_string = Regex::new(r#""[^"\\]*(\\.[^"\\]*)*""#).unwrap();
    let mut temp_result = re_string.replace_all(&result, "STR_LIT").to_string();

    // Remove single line comments
    let re_single = Regex::new(r"//.*").unwrap();
    temp_result = re_single.replace_all(&temp_result, "").to_string();

    // Remove multi-line comments
    let re_multi = Regex::new(r"/\*[\s\S]*?\*/").unwrap();
    temp_result = re_multi.replace_all(&temp_result, "").to_string();

    // Restore string literals
    let mut final_result = temp_result;
    for mat in re_string.find_iter(&result) {
        final_result = final_result.replacen("STR_LIT", mat.as_str(), 1);
    }

    final_result.trim().to_string()
}
