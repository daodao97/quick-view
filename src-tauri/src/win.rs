use tauri::{AppHandle, Manager};
use anyhow::Result;

pub fn init(app_handle: &AppHandle) -> Result<()> {
    // 初始化窗口一个隐藏窗口, 防止所有窗口关闭, 程序退出
    let _ = crate::util::gen_window(&app_handle, "hide")?;

    // 异步监听剪贴板变化
    let handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        println!("Starting on_clipboard_change");
        let json_win = crate::util::gen_or_get_window(&handle, "json").unwrap();
        let sql_win = crate::util::gen_or_get_window(&handle, "sql").unwrap();
        let _handle = handle.clone();
        crate::util::on_clipboard_change(handle, move |content| {
            let content = content.trim();
            if crate::util::is_json(&content) {
                println!("json content: {}", content);
                crate::util::show_win(&_handle, "json");
                json_win.emit("get_json", content).unwrap();
            }
            // is sql
            if crate::util::is_sql(&content) {
                println!("sql content: {}", content);
                crate::util::show_win(&_handle, "sql");
                sql_win.emit("get_sql", content).unwrap();
            }
            // is xml
            // is curl
            // default
        }).await
    });

    Ok(())
}

pub fn json_window(app_handle: &AppHandle) -> Result<()> {
    let _ = app_handle.clone();

    // 阻止窗口关闭
    // let win = crate::util::gen_or_get_window(&handle, "json").unwrap();
    // win.on_window_event(move |event| {
    //     match event {
    //         tauri::WindowEvent::CloseRequested { api, .. } => {
    //             crate::util::get_window(&handle, "json").unwrap().hide().unwrap();
    //             api.prevent_close();
    //         }
    //         _ => {}
    //     }
    // });

    Ok(())
}
