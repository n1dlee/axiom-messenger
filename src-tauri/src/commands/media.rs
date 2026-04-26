use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};
use std::io::Write;

#[tauri::command]
pub fn download_file(file_id: i32, priority: Option<i32>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::download_file(file_id, priority.unwrap_or(1)),
    );
}

#[tauri::command]
pub fn send_photo(
    chat_id: i64,
    local_path: String,
    caption: Option<String>,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_photo(chat_id, &local_path, &caption.unwrap_or_default(), reply_to_id),
    );
}

#[tauri::command]
pub fn send_document(
    chat_id: i64,
    local_path: String,
    caption: Option<String>,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_document(chat_id, &local_path, &caption.unwrap_or_default(), reply_to_id),
    );
}

#[tauri::command]
pub fn send_voice_note(
    chat_id: i64,
    local_path: String,
    duration: Option<i32>,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_voice_note(chat_id, &local_path, duration.unwrap_or(0), reply_to_id),
    );
}

#[tauri::command]
pub fn send_video_note(
    chat_id: i64,
    local_path: String,
    duration: Option<i32>,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_video_note(chat_id, &local_path, duration.unwrap_or(0), reply_to_id),
    );
}

#[tauri::command]
pub fn send_video(
    chat_id: i64,
    local_path: String,
    caption: Option<String>,
    duration: Option<i32>,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_video(
            chat_id,
            &local_path,
            &caption.unwrap_or_default(),
            duration.unwrap_or(0),
            reply_to_id,
        ),
    );
}

#[tauri::command]
pub fn send_sticker(
    chat_id: i64,
    sticker_file_id: i32,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_sticker(chat_id, sticker_file_id, reply_to_id),
    );
}

#[tauri::command]
pub fn send_animation(
    chat_id: i64,
    animation_file_id: i32,
    caption: Option<String>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_animation(chat_id, animation_file_id, &caption.unwrap_or_default()),
    );
}

#[tauri::command]
pub fn get_installed_sticker_sets(state: State<AppState>) {
    client::send(
        state.client_id,
        types::get_installed_sticker_sets("stickerTypeRegular"),
    );
}

#[tauri::command]
pub fn get_sticker_set(set_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_sticker_set(set_id));
}

#[tauri::command]
pub fn search_sticker_sets(query: String, state: State<AppState>) {
    client::send(state.client_id, types::search_sticker_sets(&query));
}

#[tauri::command]
pub fn get_trending_sticker_sets(offset: Option<i32>, limit: Option<i32>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::get_trending_sticker_sets(offset.unwrap_or(0), limit.unwrap_or(20)),
    );
}

#[tauri::command]
pub fn get_saved_animations(state: State<AppState>) {
    client::send(state.client_id, types::get_saved_animations());
}

#[tauri::command]
pub fn search_animations(query: String, state: State<AppState>) {
    client::send(state.client_id, types::search_animations(&query));
}

#[tauri::command]
pub fn get_recent_stickers(state: State<AppState>) {
    client::send(state.client_id, types::get_recent_stickers());
}

/// Write raw bytes (base64-encoded) to a temp file and return the absolute path.
/// Used by the frontend to persist MediaRecorder blobs before sending to TDLib.
#[tauri::command]
pub fn write_temp_file(data_b64: String, extension: String) -> Result<String, String> {
    let bytes = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        &data_b64,
    )
    .map_err(|e| e.to_string())?;

    let ext = extension.trim_start_matches('.');
    let file_name = format!("axiom_{}.{}", uuid_v4(), ext);
    let path = std::env::temp_dir().join(&file_name);

    let mut file = std::fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    format!("{:x}", nanos)
}
