use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};

#[tauri::command]
pub fn load_chats(limit: Option<i32>, state: State<AppState>) {
    client::send(state.client_id, types::load_chats(limit.unwrap_or(50)));
}

#[tauri::command]
pub fn get_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_chat(chat_id));
}

#[tauri::command]
pub fn archive_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::archive_chat(chat_id));
}

#[tauri::command]
pub fn unarchive_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::unarchive_chat(chat_id));
}

#[tauri::command]
pub fn toggle_chat_is_pinned(chat_id: i64, is_pinned: bool, state: State<AppState>) {
    client::send(state.client_id, types::toggle_chat_is_pinned(chat_id, is_pinned));
}

#[tauri::command]
pub fn mute_chat(chat_id: i64, mute_for: Option<i32>, state: State<AppState>) {
    // mute_for = 0 means unmute; positive value = seconds to mute
    // For "mute forever" use i32::MAX (about 2 billion seconds)
    client::send(
        state.client_id,
        types::set_chat_mute(chat_id, mute_for.unwrap_or(i32::MAX)),
    );
}

#[tauri::command]
pub fn unmute_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::set_chat_mute(chat_id, 0));
}

#[tauri::command]
pub fn create_private_chat(user_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::create_private_chat(user_id));
}

#[tauri::command]
pub fn create_new_group(title: String, user_ids: Vec<i64>, state: State<AppState>) {
    client::send(state.client_id, types::create_new_group(&title, &user_ids));
}

#[tauri::command]
pub fn create_new_supergroup(
    title: String,
    is_channel: Option<bool>,
    description: Option<String>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::create_new_supergroup(
            &title,
            is_channel.unwrap_or(false),
            &description.unwrap_or_default(),
        ),
    );
}

#[tauri::command]
pub fn get_chat_folders(state: State<AppState>) {
    client::send(state.client_id, types::get_chat_folders());
}

#[tauri::command]
pub fn leave_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::leave_chat(chat_id));
}

#[tauri::command]
pub fn delete_chat(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::delete_chat(chat_id));
}
