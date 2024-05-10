use tauri::{AppHandle, Manager, WebviewWindow};
use anyhow::Result;

pub fn init(app_handle: &AppHandle) -> Result<()> {
    let result = crate::util::gen_window(&app_handle, "json").unwrap_or_else(|e| {
        panic!("Error occurred: {:?}", e); // 或其他错误处理方式
    });

    // result.show()?;
    // result.set_focus()?;

    let _ = crate::util::gen_window(&app_handle, "sql");
    let _ = crate::util::gen_window(&app_handle, "clip");

    let handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        println!("Starting on_clipboard_change");
        let json_win = crate::win::get_window(&handle, "json").unwrap();
        let sql_win = crate::win::get_window(&handle, "sql").unwrap();
        crate::util::on_clipboard_change(handle, move |content| {
            let content = content.trim(); 
            if crate::util::is_json(&content) {
                println!("json content: {}", content);
                json_win.show().unwrap();
                json_win.set_focus().unwrap();
                json_win.emit("get_json", content).unwrap();
            }
            // is sql
            if crate::util::is_sql(&content) {
                println!("sql content: {}", content);
                sql_win.show().unwrap();
                sql_win.set_focus().unwrap();
                sql_win.emit("get_sql", content).unwrap();
            }
            // is xml
            // is curl
            // default
        }).await
    });

    Ok(())
}

pub fn get_window(app_handle: &AppHandle, name: &str) -> Option<WebviewWindow> {
    app_handle.get_webview_window(name)
}

pub fn json_window(app_handle: &AppHandle) -> Result<()> {
    let handle = app_handle.clone();

    let win = crate::win::get_window(&handle, "json").unwrap();
    win.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                get_window(&handle, "json").unwrap().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        }
    });

    Ok(())
}
