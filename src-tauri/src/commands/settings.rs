use serde_json::Value;
use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};

#[tauri::command]
pub fn toggle_ghost_mode(enabled: bool, state: State<AppState>) -> bool {
    state.set_ghost_mode(enabled);
    enabled
}

#[tauri::command]
pub fn get_ghost_mode(state: State<AppState>) -> bool {
    state.ghost_mode()
}

#[tauri::command]
pub fn get_deleted_messages(state: State<AppState>) -> Vec<Value> {
    state.deleted_messages.lock().unwrap().clone()
}

#[tauri::command]
pub fn clear_deleted_messages(state: State<AppState>) {
    state.deleted_messages.lock().unwrap().clear();
}

// ── Account settings ──────────────────────────────────────────────────────

#[tauri::command]
pub fn get_me(state: State<AppState>) {
    client::send(state.client_id, types::get_me());
}

#[tauri::command]
pub fn set_name(first_name: String, last_name: Option<String>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::set_name(&first_name, &last_name.unwrap_or_default()),
    );
}

#[tauri::command]
pub fn set_bio(bio: String, state: State<AppState>) {
    client::send(state.client_id, types::set_bio(&bio));
}

#[tauri::command]
pub fn set_username(username: String, state: State<AppState>) {
    client::send(state.client_id, types::set_username(&username));
}

#[tauri::command]
pub fn get_privacy_setting_rules(setting: String, state: State<AppState>) {
    client::send(state.client_id, types::get_privacy_setting_rules(&setting));
}

#[tauri::command]
pub fn set_privacy_setting_rules(setting: String, rules: Value, state: State<AppState>) {
    client::send(state.client_id, types::set_privacy_setting_rules(&setting, rules));
}

#[tauri::command]
pub fn get_scope_notification_settings(scope: String, state: State<AppState>) {
    client::send(state.client_id, types::get_scope_notification_settings(&scope));
}

#[tauri::command]
pub fn get_active_sessions(state: State<AppState>) {
    client::send(state.client_id, types::get_active_sessions());
}

#[tauri::command]
pub fn terminate_session(session_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::terminate_session(session_id));
}

#[tauri::command]
pub fn terminate_all_other_sessions(state: State<AppState>) {
    client::send(state.client_id, types::terminate_all_other_sessions());
}

#[tauri::command]
pub fn get_account_ttl(state: State<AppState>) {
    client::send(state.client_id, types::get_account_ttl());
}

#[tauri::command]
pub fn set_account_ttl(days: i32, state: State<AppState>) {
    client::send(state.client_id, types::set_account_ttl(days));
}

#[tauri::command]
pub fn delete_account(reason: Option<String>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::delete_account(&reason.unwrap_or_default()),
    );
}
