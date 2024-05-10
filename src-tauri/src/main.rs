// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::Runtime;
use tauri_plugin_clipboard_manager::ClipboardExt;
use std::{sync::{Arc, Mutex}, time::Duration};
use tokio::time::sleep;

async fn on_clipboard_change<R: Runtime, F>(app: tauri::AppHandle<R>, mut callback: F)
where
    F: FnMut(String) + Send + 'static,
{
    println!("on_clipboard_change start");
    let last_content = Arc::new(Mutex::new(String::new()));
    loop {
    let current_content = match app.clipboard().read_text() {
        Ok(content) => content,
        Err(_) => String::new(),
        
    };
    let mut last_content_lock = last_content.lock().unwrap();
        if *last_content_lock != current_content {
            callback(current_content.clone());
            *last_content_lock = current_content;
        }
        drop(last_content_lock);

        let _ = sleep(Duration::from_secs(1));
    }

   
}

fn is_json(input: &str) -> bool {
    serde_json::from_str::<serde_json::Value>(input).is_ok()
}

// fn send_event_to_frontend<R: Runtime>(app: tauri::AppHandle<R>, event_name: &str, payload: &str) {
// }


fn main() {

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE history (id INTEGER PRIMARY KEY, content TEXT);",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
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
            tauri::async_runtime::spawn(async move {
                println!("Starting on_clipboard_change");
                on_clipboard_change(app_handle, |content| {
                    println!("Received content: {}", content);

                    println!("Is JSON: {}", is_json(&content));

                    // send_event_to_frontend(app_handle, "clipboard_changed", &content);
                }).await
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
