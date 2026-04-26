use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager};
use crate::state::AppState;

pub fn dispatch(update: Value, app: &AppHandle) {
    let update_type = match update.get("@type").and_then(|t| t.as_str()) {
        Some(t) => t.to_owned(),
        None => return,
    };

    match update_type.as_str() {
        "updateAuthorizationState" => {
            let _ = app.emit("td:auth_state", &update);
        }
        "updateNewMessage" => {
            cache_message(&update, app);
            let _ = app.emit("td:new_message", &update);
        }
        // Response to getChatHistory — @extra carries the chatId we set in types.rs
        "messages" => {
            let _ = app.emit("td:messages", &update);
        }
        "updateMessageContent" => {
            update_cached_message(&update, app);
            let _ = app.emit("td:message_updated", &update);
        }
        "updateDeleteMessages" => {
            handle_deleted_messages(&update, app);
        }
        // Each of these carries structured data the frontend handles individually
        "updateChatLastMessage"
        | "updateChatPosition"
        | "updateChatReadInbox"
        | "updateChatReadOutbox"
        | "updateChatUnreadMentionCount"
        | "updateChatNotificationSettings"
        | "updateChatIsMarkedAsUnread"
        | "updateChatIsBlocked"
        | "updateChatHasScheduledMessages"
        | "updateChatPinnedMessage" => {
            let _ = app.emit("td:chat_updated", &update);
        }
        // Direct response to getAuthorizationState — wrap it so the frontend
        // handler can treat it identically to updateAuthorizationState.
        t if t.starts_with("authorizationState") => {
            let wrapped = serde_json::json!({
                "@type": "updateAuthorizationState",
                "authorization_state": &update,
            });
            let _ = app.emit("td:auth_state", &wrapped);
        }
        // TDLib sends updateNewChat for each chat discovered via loadChats
        "updateNewChat" => {
            let _ = app.emit("td:new_chat", &update);
        }
        "updateConnectionState" => {
            let _ = app.emit("td:connection_state", &update);
        }
        "updateUser" | "updateUserStatus" => {
            let _ = app.emit("td:user_updated", &update);
        }
        "updateFile" => {
            let _ = app.emit("td:file", &update);
        }
        "updateMessageSendSucceeded" => {
            let _ = app.emit("td:message_sent", &update);
        }
        "updateMessageSendFailed" => {
            let _ = app.emit("td:message_failed", &update);
        }
        "updateChatPhoto" => {
            let _ = app.emit("td:chat_photo_updated", &update);
        }
        // Typing indicators
        "updateChatAction" => {
            let _ = app.emit("td:typing", &update);
        }
        // Message reactions
        "updateMessageReactions" => {
            let _ = app.emit("td:message_reactions", &update);
        }
        // Sticker sets / animations responses
        "stickerSets" | "stickerSet" | "animations" | "stickers" => {
            let _ = app.emit("td:media_response", &update);
        }
        // User/profile responses
        "user" | "userFullInfo" | "users" | "chatMembers" => {
            let _ = app.emit("td:user_response", &update);
        }
        // Profile photos
        "chatPhotos" | "profilePhotos" => {
            let _ = app.emit("td:profile_photos", &update);
        }
        // Sessions
        "sessions" => {
            let _ = app.emit("td:sessions", &update);
        }
        // Privacy settings
        "userPrivacySettingRules" => {
            let _ = app.emit("td:privacy_rules", &update);
        }
        // Notification settings
        "scopeNotificationSettings" => {
            let _ = app.emit("td:notification_settings", &update);
        }
        // Account TTL
        "accountTtl" => {
            let _ = app.emit("td:account_ttl", &update);
        }
        // Chat search results — or folder chats (distinguished by @extra.folder_id)
        "chats" | "foundChats" => {
            let is_folder = update
                .get("@extra")
                .and_then(|e| e.get("folder_id"))
                .is_some();
            if is_folder {
                let _ = app.emit("td:folder_chats", &update);
            } else {
                let _ = app.emit("td:chats_found", &update);
            }
        }
        // Message search results
        "foundMessages" | "foundChatMessages" => {
            let _ = app.emit("td:messages_found", &update);
        }
        // Chat folders
        "chatFolders" => {
            let _ = app.emit("td:chat_folders", &update);
        }
        // Error from TDLib (display to user)
        "error" => {
            let _ = app.emit("td:error", &update);
        }
        _ => {
            let _ = app.emit(&format!("td:{}", update_type), &update);
        }
    }
}

fn cache_message(update: &Value, app: &AppHandle) {
    let state = app.state::<AppState>();
    if let Some(message) = update.get("message") {
        let chat_id = message.get("chat_id").and_then(|v| v.as_i64());
        let msg_id = message.get("id").and_then(|v| v.as_i64());
        if let (Some(chat_id), Some(msg_id)) = (chat_id, msg_id) {
            let mut cache = state.message_cache.lock().unwrap();
            cache.entry(chat_id).or_default().insert(msg_id, message.clone());
        }
    }
}

fn update_cached_message(update: &Value, app: &AppHandle) {
    let state = app.state::<AppState>();
    let chat_id = update.get("chat_id").and_then(|v| v.as_i64());
    let msg_id = update.get("message_id").and_then(|v| v.as_i64());
    let new_content = update.get("new_content");
    if let (Some(chat_id), Some(msg_id), Some(content)) = (chat_id, msg_id, new_content) {
        let mut cache = state.message_cache.lock().unwrap();
        if let Some(msg) = cache.entry(chat_id).or_default().get_mut(&msg_id) {
            if let Some(obj) = msg.as_object_mut() {
                obj.insert("content".to_string(), content.clone());
            }
        }
    }
}

fn handle_deleted_messages(update: &Value, app: &AppHandle) {
    let state = app.state::<AppState>();
    let chat_id = match update.get("chat_id").and_then(|v| v.as_i64()) {
        Some(id) => id,
        None => return,
    };
    let is_permanent = update
        .get("is_permanent")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    if !is_permanent {
        return;
    }

    let message_ids: Vec<i64> = update
        .get("message_ids")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_i64()).collect())
        .unwrap_or_default();

    let mut saved: Vec<Value> = Vec::new();
    {
        let cache = state.message_cache.lock().unwrap();
        if let Some(chat_msgs) = cache.get(&chat_id) {
            for msg_id in &message_ids {
                if let Some(msg) = chat_msgs.get(msg_id) {
                    saved.push(msg.clone());
                }
            }
        }
    }

    if !saved.is_empty() {
        let mut deleted = state.deleted_messages.lock().unwrap();
        deleted.extend(saved.clone());
        drop(deleted);
        let _ = app.emit("td:deleted_messages", &serde_json::json!({
            "chat_id": chat_id,
            "messages": saved
        }));
    }
}
