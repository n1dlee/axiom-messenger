use tauri::State;
use crate::state::AppState;
use crate::tdlib::{client, types};

#[tauri::command]
pub fn get_chat_history(
    chat_id: i64,
    from_message_id: Option<i64>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::get_chat_history(chat_id, from_message_id.unwrap_or(0), limit.unwrap_or(50)),
    );
}

#[tauri::command]
pub fn send_message(
    chat_id: i64,
    text: String,
    reply_to_id: Option<i64>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::send_text_message(chat_id, &text, reply_to_id),
    );
}

/// Marks messages as read. Skipped entirely when ghost mode is active.
#[tauri::command]
pub fn view_messages(chat_id: i64, message_ids: Vec<i64>, state: State<AppState>) {
    if state.ghost_mode() {
        return;
    }
    client::send(state.client_id, types::view_messages(chat_id, &message_ids));
}

#[tauri::command]
pub fn edit_message(chat_id: i64, message_id: i64, text: String, state: State<AppState>) {
    client::send(state.client_id, types::edit_message_text(chat_id, message_id, &text));
}

#[tauri::command]
pub fn delete_messages(chat_id: i64, message_ids: Vec<i64>, revoke: Option<bool>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::delete_messages(chat_id, &message_ids, revoke.unwrap_or(true)),
    );
}

#[tauri::command]
pub fn forward_messages(from_chat_id: i64, to_chat_id: i64, message_ids: Vec<i64>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::forward_messages(from_chat_id, to_chat_id, &message_ids),
    );
}

#[tauri::command]
pub fn send_chat_action(chat_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::send_chat_action(chat_id));
}

#[tauri::command]
pub fn add_message_reaction(chat_id: i64, message_id: i64, emoji: String, state: State<AppState>) {
    client::send(state.client_id, types::add_message_reaction(chat_id, message_id, &emoji));
}

#[tauri::command]
pub fn remove_message_reaction(chat_id: i64, message_id: i64, emoji: String, state: State<AppState>) {
    client::send(state.client_id, types::remove_message_reaction(chat_id, message_id, &emoji));
}

#[tauri::command]
pub fn pin_chat_message(chat_id: i64, message_id: i64, silent: Option<bool>, state: State<AppState>) {
    client::send(
        state.client_id,
        types::pin_chat_message(chat_id, message_id, silent.unwrap_or(false)),
    );
}

#[tauri::command]
pub fn unpin_chat_message(chat_id: i64, message_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::unpin_chat_message(chat_id, message_id));
}

#[tauri::command]
pub fn get_message(chat_id: i64, message_id: i64, state: State<AppState>) {
    client::send(state.client_id, types::get_message(chat_id, message_id));
}

#[tauri::command]
pub fn search_chat_messages(
    chat_id: i64,
    query: String,
    from_message_id: Option<i64>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::search_chat_messages(
            chat_id,
            &query,
            from_message_id.unwrap_or(0),
            limit.unwrap_or(50),
        ),
    );
}

#[tauri::command]
pub fn search_messages_global(
    query: String,
    from_message_id: Option<i64>,
    limit: Option<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::search_messages(&query, from_message_id.unwrap_or(0), limit.unwrap_or(50)),
    );
}

#[tauri::command]
pub fn set_poll_answer(
    chat_id: i64,
    message_id: i64,
    option_ids: Vec<i32>,
    state: State<AppState>,
) {
    client::send(
        state.client_id,
        types::set_poll_answer(chat_id, message_id, &option_ids),
    );
}
