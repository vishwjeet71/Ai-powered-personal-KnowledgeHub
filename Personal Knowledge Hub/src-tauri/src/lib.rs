use std::process::Command;

#[tauri::command]
async fn send_backend_shutdown(port: String) -> Result<String, String> {
    println!("Requesting backend shutdown on dynamic port: {}", port);

    // Endpoint Url
    let url = format!("http://localhost:{}/shutdown", port);

    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("powershell")
            .args(&[
                "-Command",
                &format!("Invoke-WebRequest -Uri {} -UseBasicParsing", url),
            ])
            .output();
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = Command::new("curl").args(&["-s", &url]).output();
    }

    Ok("Shutdown signal dispatched successfully".into())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_backend_shutdown]) 
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
