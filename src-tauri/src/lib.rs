mod commands;
mod state;
mod tdlib;
mod db;

use tauri::Manager;
use state::AppState;
use tdlib::{client, types};

// ─── Telegram API credentials ────────────────────────────────────────────────
// Register your app at https://my.telegram.org → "API development tools"
// to get your own api_id / api_hash, then fill them in here.
const TG_API_ID: i32 = 29203711;               // ← replace with your API ID
const TG_API_HASH: &str = "b50e74418eb9f9a57b05536cd248aec7";           // ← replace with your API hash
// ─────────────────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Silence TDLib internal logs (level 1 = errors only)
            client::execute(types::set_log_verbosity(1));

            let client_id = client::create_client();

            let db_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./td_data"))
                .to_string_lossy()
                .to_string();

            client::send(
                client_id,
                types::set_tdlib_parameters(TG_API_ID, TG_API_HASH, &db_dir),
            );

            app.manage(AppState::new(client_id));

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                client::receive_loop(app_handle);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::set_phone_number,
            commands::auth::check_authentication_code,
            commands::auth::check_authentication_password,
            commands::auth::log_out,
            commands::auth::get_auth_state,
            // Chats
            commands::chats::load_chats,
            commands::chats::get_chat,
            commands::chats::archive_chat,
            commands::chats::unarchive_chat,
            commands::chats::toggle_chat_is_pinned,
            commands::chats::mute_chat,
            commands::chats::unmute_chat,
            commands::chats::create_private_chat,
            commands::chats::create_new_group,
            commands::chats::create_new_supergroup,
            commands::chats::get_chat_folders,
            commands::chats::leave_chat,
            commands::chats::delete_chat,
            commands::chats::get_chats_in_folder,
            // Messages
            commands::messages::get_chat_history,
            commands::messages::send_message,
            commands::messages::view_messages,
            commands::messages::edit_message,
            commands::messages::delete_messages,
            commands::messages::forward_messages,
            commands::messages::send_chat_action,
            commands::messages::add_message_reaction,
            commands::messages::remove_message_reaction,
            commands::messages::pin_chat_message,
            commands::messages::unpin_chat_message,
            commands::messages::get_message,
            commands::messages::search_chat_messages,
            commands::messages::search_messages_global,
            commands::messages::set_poll_answer,
            // Media
            commands::media::download_file,
            commands::media::send_photo,
            commands::media::send_document,
            commands::media::send_voice_note,
            commands::media::send_video_note,
            commands::media::send_video,
            commands::media::send_sticker,
            commands::media::send_animation,
            commands::media::get_installed_sticker_sets,
            commands::media::get_sticker_set,
            commands::media::search_sticker_sets,
            commands::media::get_trending_sticker_sets,
            commands::media::get_saved_animations,
            commands::media::search_animations,
            commands::media::get_recent_stickers,
            commands::media::write_temp_file,
            // Users & Profiles
            commands::users::get_user,
            commands::users::get_user_full_info,
            commands::users::get_supergroup_full_info,
            commands::users::get_basic_group_full_info,
            commands::users::get_user_profile_photos,
            commands::users::get_supergroup_members,
            commands::users::search_contacts,
            commands::users::get_contacts,
            commands::users::block_message_sender,
            commands::users::unblock_message_sender,
            commands::users::get_blocked_message_senders,
            commands::users::search_chats,
            commands::users::search_chats_public,
            // Settings
            commands::settings::toggle_ghost_mode,
            commands::settings::get_ghost_mode,
            commands::settings::get_deleted_messages,
            commands::settings::clear_deleted_messages,
            commands::settings::get_me,
            commands::settings::set_name,
            commands::settings::set_bio,
            commands::settings::set_username,
            commands::settings::get_privacy_setting_rules,
            commands::settings::set_privacy_setting_rules,
            commands::settings::get_scope_notification_settings,
            commands::settings::set_scope_notification_settings,
            commands::settings::get_active_sessions,
            commands::settings::terminate_session,
            commands::settings::terminate_all_other_sessions,
            commands::settings::get_account_ttl,
            commands::settings::set_account_ttl,
            commands::settings::delete_account,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
