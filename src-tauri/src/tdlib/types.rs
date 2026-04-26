use serde_json::{json, Value};

pub fn set_tdlib_parameters(api_id: i32, api_hash: &str, db_dir: &str) -> Value {
    json!({
        "@type": "setTdlibParameters",
        "database_directory": db_dir,
        "use_message_database": true,
        "use_secret_chats": false,
        "api_id": api_id,
        "api_hash": api_hash,
        "system_language_code": "en",
        "device_model": "Desktop",
        "application_version": env!("CARGO_PKG_VERSION"),
        "enable_storage_optimizer": true
    })
}

pub fn set_phone_number(phone: &str) -> Value {
    json!({
        "@type": "setAuthenticationPhoneNumber",
        "phone_number": phone
    })
}

pub fn check_code(code: &str) -> Value {
    json!({ "@type": "checkAuthenticationCode", "code": code })
}

pub fn check_password(password: &str) -> Value {
    json!({ "@type": "checkAuthenticationPassword", "password": password })
}

pub fn log_out() -> Value {
    json!({ "@type": "logOut" })
}

pub fn load_chats(limit: i32) -> Value {
    json!({
        "@type": "loadChats",
        "chat_list": { "@type": "chatListMain" },
        "limit": limit
    })
}

pub fn get_chat(chat_id: i64) -> Value {
    json!({ "@type": "getChat", "chat_id": chat_id })
}

pub fn get_chat_history(chat_id: i64, from_message_id: i64, limit: i32) -> Value {
    // @extra is echoed back in the "messages" response.
    // We encode both chat_id and from_message_id so the frontend can distinguish
    // initial loads (from_message_id == 0) from pagination (from_message_id > 0).
    json!({
        "@type": "getChatHistory",
        "@extra": { "chat_id": chat_id, "from_message_id": from_message_id },
        "chat_id": chat_id,
        "from_message_id": from_message_id,
        "offset": 0,
        "limit": limit
    })
}

pub fn send_text_message(chat_id: i64, text: &str, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageText",
            "text": { "@type": "formattedText", "text": text }
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({
            "@type": "inputMessageReplyToMessage",
            "message_id": id
        });
    }
    req
}

pub fn view_messages(chat_id: i64, message_ids: &[i64]) -> Value {
    json!({
        "@type": "viewMessages",
        "chat_id": chat_id,
        "message_ids": message_ids,
        "force_read": false
    })
}

pub fn set_log_verbosity(level: i32) -> Value {
    json!({ "@type": "setLogVerbosityLevel", "new_verbosity_level": level })
}

// ── Message actions ───────────────────────────────────────────────────────

pub fn edit_message_text(chat_id: i64, message_id: i64, text: &str) -> Value {
    json!({
        "@type": "editMessageText",
        "chat_id": chat_id,
        "message_id": message_id,
        "input_message_content": {
            "@type": "inputMessageText",
            "text": { "@type": "formattedText", "text": text }
        }
    })
}

pub fn delete_messages(chat_id: i64, message_ids: &[i64], revoke: bool) -> Value {
    json!({
        "@type": "deleteMessages",
        "chat_id": chat_id,
        "message_ids": message_ids,
        "revoke": revoke
    })
}

pub fn forward_messages(from_chat_id: i64, to_chat_id: i64, message_ids: &[i64]) -> Value {
    json!({
        "@type": "forwardMessages",
        "chat_id": to_chat_id,
        "from_chat_id": from_chat_id,
        "message_ids": message_ids,
        "send_copy": false,
        "remove_caption": false
    })
}

pub fn send_chat_action(chat_id: i64) -> Value {
    json!({
        "@type": "sendChatAction",
        "chat_id": chat_id,
        "action": { "@type": "chatActionTyping" }
    })
}

pub fn add_message_reaction(chat_id: i64, message_id: i64, emoji: &str) -> Value {
    json!({
        "@type": "addMessageReaction",
        "chat_id": chat_id,
        "message_id": message_id,
        "reaction_type": { "@type": "reactionTypeEmoji", "emoji": emoji },
        "is_big": false,
        "update_recent_reactions": true
    })
}

pub fn remove_message_reaction(chat_id: i64, message_id: i64, emoji: &str) -> Value {
    json!({
        "@type": "removeMessageReaction",
        "chat_id": chat_id,
        "message_id": message_id,
        "reaction_type": { "@type": "reactionTypeEmoji", "emoji": emoji }
    })
}

pub fn pin_chat_message(chat_id: i64, message_id: i64, silent: bool) -> Value {
    json!({
        "@type": "pinChatMessage",
        "chat_id": chat_id,
        "message_id": message_id,
        "disable_notification": silent,
        "only_for_self": false
    })
}

pub fn unpin_chat_message(chat_id: i64, message_id: i64) -> Value {
    json!({
        "@type": "unpinChatMessage",
        "chat_id": chat_id,
        "message_id": message_id
    })
}

pub fn get_message(chat_id: i64, message_id: i64) -> Value {
    json!({
        "@type": "getMessage",
        "chat_id": chat_id,
        "message_id": message_id
    })
}

// ── Media ─────────────────────────────────────────────────────────────────

pub fn download_file(file_id: i32, priority: i32) -> Value {
    json!({
        "@type": "downloadFile",
        "file_id": file_id,
        "priority": priority,
        "offset": 0,
        "limit": 0,
        "synchronous": false
    })
}

pub fn send_photo(chat_id: i64, local_path: &str, caption: &str, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessagePhoto",
            "photo": { "@type": "inputFileLocal", "path": local_path },
            "caption": { "@type": "formattedText", "text": caption }
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_document(chat_id: i64, local_path: &str, caption: &str, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageDocument",
            "document": { "@type": "inputFileLocal", "path": local_path },
            "caption": { "@type": "formattedText", "text": caption }
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_voice_note(chat_id: i64, local_path: &str, duration: i32, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageVoiceNote",
            "voice_note": { "@type": "inputFileLocal", "path": local_path },
            "duration": duration,
            "waveform": ""
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_video_note(chat_id: i64, local_path: &str, duration: i32, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageVideoNote",
            "video_note": { "@type": "inputFileLocal", "path": local_path },
            "duration": duration
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_video(chat_id: i64, local_path: &str, caption: &str, duration: i32, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageVideo",
            "video": { "@type": "inputFileLocal", "path": local_path },
            "caption": { "@type": "formattedText", "text": caption },
            "duration": duration,
            "supports_streaming": true
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_sticker(chat_id: i64, sticker_file_id: i32, reply_to_id: Option<i64>) -> Value {
    let mut req = json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageSticker",
            "sticker": { "@type": "inputFileId", "id": sticker_file_id }
        }
    });
    if let Some(id) = reply_to_id {
        req["reply_to"] = json!({ "@type": "inputMessageReplyToMessage", "message_id": id });
    }
    req
}

pub fn send_animation(chat_id: i64, animation_file_id: i32, caption: &str) -> Value {
    json!({
        "@type": "sendMessage",
        "chat_id": chat_id,
        "input_message_content": {
            "@type": "inputMessageAnimation",
            "animation": { "@type": "inputFileId", "id": animation_file_id },
            "caption": { "@type": "formattedText", "text": caption }
        }
    })
}

pub fn get_installed_sticker_sets(sticker_type: &str) -> Value {
    json!({
        "@type": "getInstalledStickerSets",
        "sticker_type": { "@type": sticker_type }
    })
}

pub fn get_sticker_set(set_id: i64) -> Value {
    json!({ "@type": "getStickerSet", "set_id": set_id })
}

pub fn search_sticker_sets(query: &str) -> Value {
    json!({
        "@type": "searchInstalledStickerSets",
        "query": query,
        "limit": 20,
        "sticker_type": { "@type": "stickerTypeRegular" }
    })
}

pub fn get_trending_sticker_sets(offset: i32, limit: i32) -> Value {
    json!({
        "@type": "getTrendingStickerSets",
        "sticker_type": { "@type": "stickerTypeRegular" },
        "offset": offset,
        "limit": limit
    })
}

pub fn get_saved_animations() -> Value {
    json!({ "@type": "getSavedAnimations" })
}

pub fn search_animations(query: &str) -> Value {
    json!({
        "@type": "searchAnimations",
        "query": query,
        "offset": "",
        "limit": 50
    })
}

pub fn get_recent_stickers() -> Value {
    json!({ "@type": "getRecentStickers", "is_attached": false })
}

// ── Users & Profiles ──────────────────────────────────────────────────────

pub fn get_me() -> Value {
    json!({ "@type": "getMe" })
}

pub fn get_user(user_id: i64) -> Value {
    json!({ "@type": "getUser", "user_id": user_id })
}

pub fn get_user_full_info(user_id: i64) -> Value {
    json!({ "@type": "getUserFullInfo", "user_id": user_id })
}

pub fn get_supergroup_full_info(supergroup_id: i64) -> Value {
    json!({ "@type": "getSupergroupFullInfo", "supergroup_id": supergroup_id })
}

pub fn get_basic_group_full_info(basic_group_id: i64) -> Value {
    json!({ "@type": "getBasicGroupFullInfo", "basic_group_id": basic_group_id })
}

pub fn get_user_profile_photos(user_id: i64, offset: i32, limit: i32) -> Value {
    json!({
        "@type": "getUserProfilePhotos",
        "user_id": user_id,
        "offset": offset,
        "limit": limit
    })
}

pub fn get_supergroup_members(supergroup_id: i64, offset: i32, limit: i32) -> Value {
    json!({
        "@type": "getSupergroupMembers",
        "supergroup_id": supergroup_id,
        "filter": { "@type": "supergroupMembersFilterRecent" },
        "offset": offset,
        "limit": limit
    })
}

pub fn search_contacts(query: &str, limit: i32) -> Value {
    json!({ "@type": "searchContacts", "query": query, "limit": limit })
}

pub fn get_contacts() -> Value {
    json!({ "@type": "getContacts" })
}

pub fn block_message_sender(user_id: i64) -> Value {
    json!({
        "@type": "blockMessageSender",
        "sender_id": { "@type": "messageSenderUser", "user_id": user_id }
    })
}

pub fn unblock_message_sender(user_id: i64) -> Value {
    json!({
        "@type": "unblockMessageSender",
        "sender_id": { "@type": "messageSenderUser", "user_id": user_id }
    })
}

pub fn get_blocked_message_senders(offset: i32, limit: i32) -> Value {
    json!({ "@type": "getBlockedMessageSenders", "block_list": {"@type": "blockListDefault"}, "offset": offset, "limit": limit })
}

pub fn search_chats_public(query: &str) -> Value {
    json!({ "@type": "searchPublicChats", "query": query })
}

pub fn search_chats(query: &str) -> Value {
    json!({ "@type": "searchChats", "query": query, "limit": 50 })
}

pub fn search_chat_messages(chat_id: i64, query: &str, from_message_id: i64, limit: i32) -> Value {
    json!({
        "@type": "searchChatMessages",
        "chat_id": chat_id,
        "query": query,
        "from_message_id": from_message_id,
        "offset": 0,
        "limit": limit
    })
}

// ── Settings ──────────────────────────────────────────────────────────────

pub fn set_name(first_name: &str, last_name: &str) -> Value {
    json!({ "@type": "setName", "first_name": first_name, "last_name": last_name })
}

pub fn set_bio(bio: &str) -> Value {
    json!({ "@type": "setBio", "bio": bio })
}

pub fn set_username(username: &str) -> Value {
    json!({ "@type": "setUsername", "username": username })
}

pub fn get_privacy_setting_rules(setting: &str) -> Value {
    json!({
        "@type": "getUserPrivacySettingRules",
        "setting": { "@type": setting }
    })
}

pub fn set_privacy_setting_rules(setting: &str, rules: serde_json::Value) -> Value {
    json!({
        "@type": "setUserPrivacySettingRules",
        "setting": { "@type": setting },
        "rules": rules
    })
}

pub fn get_scope_notification_settings(scope: &str) -> Value {
    json!({
        "@type": "getScopeNotificationSettings",
        "scope": { "@type": scope }
    })
}

pub fn get_active_sessions() -> Value {
    json!({ "@type": "getActiveSessions" })
}

pub fn terminate_session(session_id: i64) -> Value {
    json!({ "@type": "terminateSession", "session_id": session_id })
}

pub fn terminate_all_other_sessions() -> Value {
    json!({ "@type": "terminateAllOtherSessions" })
}

pub fn get_account_ttl() -> Value {
    json!({ "@type": "getAccountTtl" })
}

pub fn set_account_ttl(days: i32) -> Value {
    json!({ "@type": "setAccountTtl", "ttl": { "days": days } })
}

pub fn delete_account(reason: &str) -> Value {
    json!({ "@type": "deleteAccount", "reason": reason, "password": "" })
}

// ── Chat management ───────────────────────────────────────────────────────

pub fn archive_chat(chat_id: i64) -> Value {
    json!({
        "@type": "addChatToList",
        "chat_id": chat_id,
        "chat_list": { "@type": "chatListArchive" }
    })
}

pub fn unarchive_chat(chat_id: i64) -> Value {
    json!({
        "@type": "addChatToList",
        "chat_id": chat_id,
        "chat_list": { "@type": "chatListMain" }
    })
}

pub fn toggle_chat_is_pinned(chat_id: i64, is_pinned: bool) -> Value {
    json!({
        "@type": "toggleChatIsPinned",
        "chat_list": { "@type": "chatListMain" },
        "chat_id": chat_id,
        "is_pinned": is_pinned
    })
}

pub fn set_chat_mute(chat_id: i64, mute_for: i32) -> Value {
    json!({
        "@type": "setChatNotificationSettings",
        "chat_id": chat_id,
        "notification_settings": {
            "@type": "chatNotificationSettings",
            "use_default_mute_for": false,
            "mute_for": mute_for
        }
    })
}

pub fn create_private_chat(user_id: i64) -> Value {
    json!({ "@type": "createPrivateChat", "user_id": user_id, "force": false })
}

pub fn create_new_supergroup(title: &str, is_channel: bool, description: &str) -> Value {
    json!({
        "@type": "createNewSupergroupChat",
        "title": title,
        "is_forum": false,
        "is_channel": is_channel,
        "description": description,
        "location": null,
        "for_import": false
    })
}

pub fn create_new_group(title: &str, user_ids: &[i64]) -> Value {
    json!({
        "@type": "createNewBasicGroupChat",
        "title": title,
        "user_ids": user_ids,
        "message_auto_delete_time": 0
    })
}

pub fn get_chat_folders() -> Value {
    json!({ "@type": "getChatFolders" })
}

pub fn get_chats_in_folder(folder_id: i32, limit: i32) -> Value {
    // Use @extra.folder_id so events.rs can route to td:folder_chats instead of td:chats_found
    json!({
        "@type": "getChats",
        "@extra": { "folder_id": folder_id },
        "chat_list": { "@type": "chatListFolder", "chat_folder_id": folder_id },
        "limit": limit
    })
}

pub fn set_scope_notification_settings(scope: &str, mute_for: i32, show_preview: bool) -> Value {
    json!({
        "@type": "setScopeNotificationSettings",
        "scope": { "@type": scope },
        "notification_settings": {
            "@type": "scopeNotificationSettings",
            "mute_for": mute_for,
            "sound_id": 0,
            "show_preview": show_preview,
            "use_default_mute_for": false,
            "use_default_show_preview": false
        }
    })
}

pub fn leave_chat(chat_id: i64) -> Value {
    json!({ "@type": "leaveChat", "chat_id": chat_id })
}

pub fn delete_chat(chat_id: i64) -> Value {
    json!({ "@type": "deleteChat", "chat_id": chat_id })
}

pub fn search_messages(query: &str, from_message_id: i64, limit: i32) -> Value {
    json!({
        "@type": "searchMessages",
        "query": query,
        "from_message_id": from_message_id,
        "offset": 0,
        "limit": limit,
        "filter": { "@type": "searchMessagesFilterEmpty" }
    })
}
pub fn set_poll_answer(chat_id: i64, message_id: i64, option_ids: &[i32]) -> serde_json::Value {
    serde_json::json!({
        "@type": "setPollAnswer",
        "chat_id": chat_id,
        "message_id": message_id,
        "option_ids": option_ids
    })
}
