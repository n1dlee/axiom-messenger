import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useApp } from '../store/AppContext';

export function useTdlib() {
  const { dispatch } = useApp();

  // ── Auth ─────────────────────────────────────────────────────────────────
  const sendPhone = useCallback((phone: string) =>
    invoke('set_phone_number', { phone }), []);

  const sendCode = useCallback((code: string) =>
    invoke('check_authentication_code', { code }), []);

  const sendPassword = useCallback((password: string) =>
    invoke('check_authentication_password', { password }), []);

  const logOut = useCallback(() => invoke('log_out'), []);

  // ── Chats ────────────────────────────────────────────────────────────────
  const loadChats = useCallback((limit = 50) =>
    invoke('load_chats', { limit }), []);

  /**
   * Loads ALL chats from TDLib in batches of 50 until the server says there are no more.
   * TDLib's loadChats is NOT "give me N chats" — it's "load the next batch from cloud".
   * Must be called repeatedly until it throws (meaning all chats are loaded).
   */
  const loadAllChats = useCallback(async () => {
    dispatch({ type: 'SET_CHATS_LOADING', loading: true });
    for (let i = 0; i < 10; i++) {
      try {
        await invoke('load_chats', { limit: 50 });
      } catch {
        break;
      }
    }
    dispatch({ type: 'SET_CHATS_LOADING', loading: false });
  }, [dispatch]);

  const getChat = useCallback((chatId: number) =>
    invoke('get_chat', { chatId }), []);

  const archiveChat = useCallback((chatId: number) =>
    invoke('archive_chat', { chatId }), []);

  const unarchiveChat = useCallback((chatId: number) =>
    invoke('unarchive_chat', { chatId }), []);

  const toggleChatPin = useCallback((chatId: number, isPinned: boolean) =>
    invoke('toggle_chat_is_pinned', { chatId, isPinned }), []);

  const muteChat = useCallback((chatId: number, muteFor?: number) =>
    invoke('mute_chat', { chatId, muteFor }), []);

  const unmuteChat = useCallback((chatId: number) =>
    invoke('unmute_chat', { chatId }), []);

  const createPrivateChat = useCallback((userId: number) =>
    invoke('create_private_chat', { userId }), []);

  const createNewGroup = useCallback((title: string, userIds: number[]) =>
    invoke('create_new_group', { title, userIds }), []);

  const createNewSupergroup = useCallback((title: string, isChannel = false, description = '') =>
    invoke('create_new_supergroup', { title, isChannel, description }), []);

  const getChatFolders = useCallback(() =>
    invoke('get_chat_folders'), []);

  const getFolderChats = useCallback((folderId: number, limit = 200) =>
    invoke('get_chats_in_folder', { folderId, limit }), []);

  const leaveChat = useCallback((chatId: number) =>
    invoke('leave_chat', { chatId }), []);

  const deleteChat = useCallback((chatId: number) =>
    invoke('delete_chat', { chatId }), []);

  // ── Messages ─────────────────────────────────────────────────────────────
  const getHistory = useCallback(
    (chatId: number, fromMessageId = 0, limit = 50) => {
      dispatch({ type: 'SET_MESSAGES_LOADING', loading: true });
      return invoke('get_chat_history', { chatId, fromMessageId, limit });
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (chatId: number, text: string, replyToId?: number) =>
      invoke('send_message', { chatId, text, replyToId: replyToId ?? null }),
    []
  );

  const editMessage = useCallback(
    (chatId: number, messageId: number, text: string) =>
      invoke('edit_message', { chatId, messageId, text }),
    []
  );

  const deleteMessages = useCallback(
    (chatId: number, messageIds: number[], revoke = true) =>
      invoke('delete_messages', { chatId, messageIds, revoke }),
    []
  );

  const forwardMessages = useCallback(
    (fromChatId: number, toChatId: number, messageIds: number[]) =>
      invoke('forward_messages', { fromChatId, toChatId, messageIds }),
    []
  );

  const sendChatAction = useCallback((chatId: number) =>
    invoke('send_chat_action', { chatId }), []);

  const viewMessages = useCallback(
    (chatId: number, messageIds: number[]) =>
      invoke('view_messages', { chatId, messageIds }),
    []
  );

  const addMessageReaction = useCallback(
    (chatId: number, messageId: number, emoji: string) =>
      invoke('add_message_reaction', { chatId, messageId, emoji }),
    []
  );

  const removeMessageReaction = useCallback(
    (chatId: number, messageId: number, emoji: string) =>
      invoke('remove_message_reaction', { chatId, messageId, emoji }),
    []
  );

  const pinMessage = useCallback(
    (chatId: number, messageId: number, silent = false) =>
      invoke('pin_chat_message', { chatId, messageId, silent }),
    []
  );

  const unpinMessage = useCallback(
    (chatId: number, messageId: number) =>
      invoke('unpin_chat_message', { chatId, messageId }),
    []
  );

  const searchChatMessages = useCallback(
    (chatId: number, query: string, fromMessageId = 0, limit = 50) =>
      invoke('search_chat_messages', { chatId, query, fromMessageId, limit }),
    []
  );

  const searchMessagesGlobal = useCallback(
    (query: string, fromMessageId = 0, limit = 50) =>
      invoke('search_messages_global', { query, fromMessageId, limit }),
    []
  );

  // ── Media ────────────────────────────────────────────────────────────────
  const downloadFile = useCallback((fileId: number, priority = 1) =>
    invoke('download_file', { fileId, priority }), []);

  const sendPhoto = useCallback(
    (chatId: number, localPath: string, caption = '', replyToId?: number) =>
      invoke('send_photo', { chatId, localPath, caption, replyToId }),
    []
  );

  const sendDocument = useCallback(
    (chatId: number, localPath: string, caption = '', replyToId?: number) =>
      invoke('send_document', { chatId, localPath, caption, replyToId }),
    []
  );

  const sendVoiceNote = useCallback(
    (chatId: number, localPath: string, duration = 0, replyToId?: number) =>
      invoke('send_voice_note', { chatId, localPath, duration, replyToId }),
    []
  );

  const sendVideoNote = useCallback(
    (chatId: number, localPath: string, duration = 0, replyToId?: number) =>
      invoke('send_video_note', { chatId, localPath, duration, replyToId }),
    []
  );

  const sendVideo = useCallback(
    (chatId: number, localPath: string, caption = '', duration = 0, replyToId?: number) =>
      invoke('send_video', { chatId, localPath, caption, duration, replyToId }),
    []
  );

  const sendSticker = useCallback(
    (chatId: number, stickerFileId: number, replyToId?: number) =>
      invoke('send_sticker', { chatId, stickerFileId, replyToId }),
    []
  );

  const sendAnimation = useCallback(
    (chatId: number, animationFileId: number, caption = '') =>
      invoke('send_animation', { chatId, animationFileId, caption }),
    []
  );

  const writeTempFile = useCallback(
    (dataB64: string, extension: string) =>
      invoke<string>('write_temp_file', { dataB64, extension }),
    []
  );

  const getInstalledStickerSets = useCallback(() =>
    invoke('get_installed_sticker_sets'), []);

  const getStickerSet = useCallback((setId: number) =>
    invoke('get_sticker_set', { setId }), []);

  const searchStickerSets = useCallback((query: string) =>
    invoke('search_sticker_sets', { query }), []);

  const getTrendingStickerSets = useCallback((offset = 0, limit = 20) =>
    invoke('get_trending_sticker_sets', { offset, limit }), []);

  const getSavedAnimations = useCallback(() =>
    invoke('get_saved_animations'), []);

  const searchAnimations = useCallback((query: string) =>
    invoke('search_animations', { query }), []);

  const getRecentStickers = useCallback(() =>
    invoke('get_recent_stickers'), []);

  // ── Users & Profiles ─────────────────────────────────────────────────────
  const getMe = useCallback(() => invoke('get_me'), []);

  const getUser = useCallback((userId: number) =>
    invoke('get_user', { userId }), []);

  const getUserFullInfo = useCallback((userId: number) =>
    invoke('get_user_full_info', { userId }), []);

  const getSupergroupFullInfo = useCallback((supergroupId: number) =>
    invoke('get_supergroup_full_info', { supergroupId }), []);

  const getBasicGroupFullInfo = useCallback((basicGroupId: number) =>
    invoke('get_basic_group_full_info', { basicGroupId }), []);

  const getUserProfilePhotos = useCallback(
    (userId: number, offset = 0, limit = 20) =>
      invoke('get_user_profile_photos', { userId, offset, limit }),
    []
  );

  const getSupergroupMembers = useCallback(
    (supergroupId: number, offset = 0, limit = 50) =>
      invoke('get_supergroup_members', { supergroupId, offset, limit }),
    []
  );

  const searchContacts = useCallback((query: string, limit = 50) =>
    invoke('search_contacts', { query, limit }), []);

  const getContacts = useCallback(() => invoke('get_contacts'), []);

  const blockSender = useCallback((userId: number) =>
    invoke('block_message_sender', { userId }), []);

  const unblockSender = useCallback((userId: number) =>
    invoke('unblock_message_sender', { userId }), []);

  const searchChats = useCallback((query: string) =>
    invoke('search_chats', { query }), []);

  const searchChatsPublic = useCallback((query: string) =>
    invoke('search_chats_public', { query }), []);

  // ── Settings ─────────────────────────────────────────────────────────────
  const toggleGhostMode = useCallback(async (enabled: boolean) => {
    await invoke('toggle_ghost_mode', { enabled });
    dispatch({ type: 'SET_GHOST_MODE', enabled });
  }, [dispatch]);

  const getDeletedMessages = useCallback(() =>
    invoke<any[]>('get_deleted_messages'), []);

  const setName = useCallback((firstName: string, lastName = '') =>
    invoke('set_name', { firstName, lastName }), []);

  const setBio = useCallback((bio: string) =>
    invoke('set_bio', { bio }), []);

  const setUsername = useCallback((username: string) =>
    invoke('set_username', { username }), []);

  const getPrivacyRules = useCallback((setting: string) =>
    invoke('get_privacy_setting_rules', { setting }), []);

  const setPrivacyRules = useCallback((setting: string, rules: unknown) =>
    invoke('set_privacy_setting_rules', { setting, rules }), []);

  const getNotificationSettings = useCallback((scope: string) =>
    invoke('get_scope_notification_settings', { scope }), []);

  const setNotificationSettings = useCallback(
    (scope: string, muteFor = 0, showPreview = true) =>
      invoke('set_scope_notification_settings', { scope, muteFor, showPreview }),
    []
  );

  const getActiveSessions = useCallback(() =>
    invoke('get_active_sessions'), []);

  const terminateSession = useCallback((sessionId: number) =>
    invoke('terminate_session', { sessionId }), []);

  const terminateAllOtherSessions = useCallback(() =>
    invoke('terminate_all_other_sessions'), []);

  const getAccountTtl = useCallback(() => invoke('get_account_ttl'), []);

  const setAccountTtl = useCallback((days: number) =>
    invoke('set_account_ttl', { days }), []);

  const deleteAccount = useCallback((reason = '') =>
    invoke('delete_account', { reason }), []);

  return {
    // Auth
    sendPhone, sendCode, sendPassword, logOut,
    // Chats
    loadChats, loadAllChats, getChat,
    archiveChat, unarchiveChat, toggleChatPin,
    muteChat, unmuteChat,
    createPrivateChat, createNewGroup, createNewSupergroup,
    getChatFolders, getFolderChats, leaveChat, deleteChat,
    // Messages
    getHistory, sendMessage, editMessage, deleteMessages,
    forwardMessages, sendChatAction, viewMessages,
    addMessageReaction, removeMessageReaction,
    pinMessage, unpinMessage,
    searchChatMessages, searchMessagesGlobal,
    // Media
    downloadFile, writeTempFile,
    sendPhoto, sendDocument, sendVoiceNote, sendVideoNote, sendVideo,
    sendSticker, sendAnimation,
    getInstalledStickerSets, getStickerSet, searchStickerSets,
    getTrendingStickerSets, getSavedAnimations, searchAnimations, getRecentStickers,
    // Users
    getMe, getUser, getUserFullInfo, getSupergroupFullInfo, getBasicGroupFullInfo,
    getUserProfilePhotos, getSupergroupMembers,
    searchContacts, getContacts, blockSender, unblockSender,
    searchChats, searchChatsPublic,
    // Settings
    toggleGhostMode, getDeletedMessages,
    setName, setBio, setUsername,
    getPrivacyRules, setPrivacyRules, getNotificationSettings, setNotificationSettings,
    getActiveSessions, terminateSession, terminateAllOtherSessions,
    getAccountTtl, setAccountTtl, deleteAccount,
  };
}
