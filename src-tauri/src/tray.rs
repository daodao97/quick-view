use anyhow::Result;
use tauri::{
    menu::{Menu, MenuEvent, MenuItem, Submenu},
    tray::TrayIconBuilder,
    AppHandle, Wry,
};

fn menu(handle: &AppHandle) -> Result<Menu<Wry>> {
    let json = MenuItem::with_id(handle, "json", "Copyed Json", true, None::<&str>)?;
    let sql = MenuItem::with_id(handle, "sql", "Copyed SQL", true, None::<&str>)?;
    let xml = MenuItem::with_id(handle, "xml", "Copyed XML", false, None::<&str>)?;
    let curl = MenuItem::with_id(handle, "curl", "Copyed Curl", false, None::<&str>)?;
    let clip = MenuItem::with_id(handle, "clip", "Copyed Text", false, None::<&str>)?;
    let show = Submenu::with_items(handle, "View", true, &[&json, &sql, &xml, &curl, &clip])?;
    let exit = MenuItem::with_id(handle, "exit", "Exit", true, None::<&str>)?;
    Menu::with_items(handle, &[&show, &exit])
        .map_err(|_| anyhow::anyhow!("Failed to create menu"))
}


fn handler(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() {
        "json" => crate::util::show_win(app, "json"),
        "sql" => crate::util::show_win(app, "sql"),
        "exit" => {
            app.exit(0)
        }
        _ => {}
    }
}

pub fn init(app: &AppHandle) -> Result<()> {
    let menu = menu(app)?;
    let _ = TrayIconBuilder::with_id("menu")
        .tooltip("Quick View")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(handler)
        .build(app);
    Ok(())
}