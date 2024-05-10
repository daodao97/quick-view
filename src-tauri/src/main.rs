#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

mod tray;
mod util;
mod win;


#[tauri::command]
fn remove_comments(input: &str) -> String {
    crate::util::remove_comments(input)
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
        .invoke_handler(tauri::generate_handler![remove_comments])
        .setup(|app| {
            let app_handle = app.handle().clone();
            crate::tray::init(&app_handle).unwrap();
            crate::win::init(&app_handle).unwrap();
            crate::win::json_window(&app_handle).unwrap();

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    app.run(|_app_handle, _event| {});
}
