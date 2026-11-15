// Talenta cho máy tính: một cửa sổ riêng mở sổ Talenta, không cần trình duyệt.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Không mở được Talenta");
}
