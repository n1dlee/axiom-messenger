use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};

#[tauri::command]
pub fn get_user(user_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_user(user_id));
}

#[tauri::command]
pub fn get_user_full_info(user_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_user_full_info(user_id));
}

#[tauri::command]
pub fn get_supergroup_full_info(supergroup_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_supergroup_full_info(supergroup_id));
}

#[tauri::command]
pub fn get_basic_group_full_info(basic_group_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_basic_group_full_info(basic_group_id));
}

#[tauri::command]
pub fn get_user_profile_photos(
    user_id: i64,
    offset: Option<i32>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::get_user_profile_photos(user_id, offset.unwrap_or(0), limit.unwrap_or(20)),
    );
}

#[tauri::command]
pub fn get_supergroup_members(
    supergroup_id: i64,
    offset: Option<i32>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::get_supergroup_members(supergroup_id, offset.unwrap_or(0), limit.unwrap_or(50)),
    );
}

#[tauri::command]
pub fn search_contacts(query: String, limit: Option<i32>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::search_contacts(&query, limit.unwrap_or(50)),
    );
}

#[tauri::command]
pub fn get_contacts(state: State<AppState>) {
    client::send(state.client_id, types::get_contacts());
}

#[tauri::command]
pub fn block_message_sender(user_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::block_message_sender(user_id));
}

#[tauri::command]
pub fn unblock_message_sender(user_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::unblock_message_sender(user_id));
}

#[tauri::command]
pub fn get_blocked_message_senders(
    offset: Option<i32>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::get_blocked_message_senders(offset.unwrap_or(0), limit.unwrap_or(50)),
    );
}

#[tauri::command]
pub fn search_chats(query: String, state: State<AppState>) {
    client::send(state.client_id, types::search_chats(&query));
}

#[tauri::command]
pub fn search_chats_public(query: String, state: State<AppState>) {
    client::send(state.client_id, types::search_chats_public(&query));
}
