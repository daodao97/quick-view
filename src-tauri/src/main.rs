// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::{menu::{Menu, MenuEvent, MenuItem}, AppHandle, Manager, Runtime, Wry, tray::{ClickType, TrayIconBuilder} };
use tauri_plugin_clipboard_manager::ClipboardExt;
use std::{sync::{Arc, Mutex}, thread::spawn, time::Duration};
use tokio::time::sleep;

async fn on_clipboard_change<R: Runtime, F>(app: tauri::AppHandle<R>, callback: F)
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


fn is_json(input: &str) -> bool {
    serde_json::from_str::<serde_json::Value>(input).is_ok()
}

use regex::Regex;

fn remove_comments(input: &str) -> String {
    let mut result = input.to_string();
    
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

pub fn json_window(app: &AppHandle) {
    tauri::WebviewWindowBuilder::new(app, "json", tauri::WebviewUrl::App("/".into()))
        .title("json-view")
        .inner_size(800.0, 600.0)
        .visible(false)
        .build()
        .expect("Failed to create panel window");
}


use anyhow::Result;

fn menu(handle: &AppHandle) -> Result<Menu<Wry>> {
    let show = MenuItem::with_id(handle, "show", "Show", true, None::<&str>)?;
    let exit = MenuItem::with_id(handle, "exit", "Exit", true, None::<&str>)?;
    Menu::with_items(handle, &[&show, &exit])
        .map_err(|_| anyhow::anyhow!("Failed to create menu"))
}

fn handler(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() {
        "show" => {
            let panel = app.get_webview_window("json").unwrap();
            let _ = panel.show();
            let _ = panel.set_focus();
        }
        "exit" => {
            let panel = app.get_webview_window("json").unwrap();
            let _ = panel.hide();
            app.exit(0)
        }
        _ => {}
    }
}

fn main() {

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE history (id INTEGER PRIMARY KEY, content TEXT);",
            kind: MigrationKind::Up,
        }
    ];

    let mut app = tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let app_handle = app.handle().clone();

            json_window(&app_handle);

            let json_win = app.get_webview_window("json").unwrap();

            spawn(move || {
                let win = json_win.clone();
                win.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::CloseRequested { api, .. } => {
                            // fixme win.hide().unwrap();
                            app_handle.get_webview_window("json").unwrap().hide().unwrap();
                            api.prevent_close();
                            // win.close().unwrap();
                        }
                        _ => {}
                    }
                });
            });

            let app_handle = app.handle().clone();
            let json_win = app.get_webview_window("json").unwrap();

           let win = json_win.clone();

            tauri::async_runtime::spawn(async move {
                println!("Starting on_clipboard_change");
                on_clipboard_change(app_handle, move |content| {
                    let content = remove_comments(&content);

                    println!("Is JSON: {}", is_json(&content));
                    if is_json(&content) {
                        println!("json content: {}", content);
                        let res = win.emit("get_json", content).unwrap();
                        win.show().unwrap();
                        win.set_focus().unwrap();
                        println!("Result: {:?}", res);
                    }
                    // send_event_to_frontend(app_handle, "clipboard_changed", &content);
                }).await
            });

            let menu = menu(app.handle())?;
            let _ = TrayIconBuilder::with_id("menu")
            .tooltip("Tran")
            .icon(app.handle().default_window_icon().unwrap().clone())
            .menu(&menu)
            .on_menu_event(handler)
            .build(app.handle())?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    app.run(|_app_handle, _event| {});
}
