use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};

#[tauri::command]
pub fn set_phone_number(phone: String, state: State<AppState>) {
    client::send(state.client_id, types::set_phone_number(&phone));
}

#[tauri::command]
pub fn check_authentication_code(code: String, state: State<AppState>) {
    client::send(state.client_id, types::check_code(&code));
}

#[tauri::command]
pub fn check_authentication_password(password: String, state: State<AppState>) {
    client::send(state.client_id, types::check_password(&password));
}

#[tauri::command]
pub fn log_out(state: State<AppState>) {
    client::send(state.client_id, types::log_out());
}

/// Asks TDLib to re-emit the current authorization state.
/// Call this after frontend listeners are registered to avoid missing the
/// initial waitPhoneNumber event that fires during app startup.
#[tauri::command]
pub fn get_auth_state(state: State<AppState>) {
    client::send(state.client_id, serde_json::json!({ "@type": "getAuthorizationState" }));
}
