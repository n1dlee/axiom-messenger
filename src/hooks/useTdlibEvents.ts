import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { useApp } from '../store/AppContext';
import type { AuthStep, Chat, Message, MediaType, Poll } from '../store/types';

// ── Parsers ────────────────────────────────────────────────────────────────

function parseAuthStep(update: unknown): AuthStep {
  const state = (update as any)?.authorization_state?.['@type'] ?? '';
  switch (state) {
    case 'authorizationStateWaitPhoneNumber': return 'phoneNumber';
    case 'authorizationStateWaitCode':        return 'code';
    case 'authorizationStateWaitPassword':    return 'password';
    case 'authorizationStateReady':           return 'ready';
    default:                                  return 'loading';
  }
}

export function parseChat(raw: any): Chat {
  const rawType: string = raw.type?.['@type']?.replace('chatType', '').toLowerCase() ?? 'private';
  const validTypes = ['private', 'group', 'supergroup', 'channel'] as const;
  const type: Chat['type'] = validTypes.includes(rawType as Chat['type'])
    ? (rawType as Chat['type'])
    : 'private';

  // Find position in chatListMain for correct sorting order
  const positions: any[] = raw.positions ?? [];
  const mainPos = positions.find(
    (p: any) => p.chat_list?.['@type'] === 'chatListMain'
  );

  // Chat photo — use local path if already downloaded, else store fileId for lazy download
  let photoUrl: string | undefined;
  let photoFileId: number | undefined;
  const smallPhoto = raw.photo?.small;
  if (smallPhoto) {
    if (smallPhoto.local?.is_downloading_complete && smallPhoto.local?.path) {
      photoUrl = convertFileSrc(smallPhoto.local.path as string);
    } else if (smallPhoto.id) {
      photoFileId = smallPhoto.id;
    }
  }

  return {
    id: raw.id,
    title: raw.title ?? 'Unknown',
    type,
    lastMessage: raw.last_message?.content?.text?.text
      ?? raw.last_message?.content?.caption?.text
      ?? getMediaLabel(raw.last_message?.content?.['@type']),
    lastMessageDate: raw.last_message?.date,
    unreadCount: raw.unread_count ?? 0,
    photoUrl,
    photoFileId,
    isOnline: false,
    isMuted: (raw.notification_settings?.mute_for ?? 0) > 0,
    // TDLib order — higher value = displayed first in list
    order: mainPos ? Number(mainPos.order) : 0,
    isPinned: mainPos?.is_pinned ?? false,
    // For private chats: the user_id of the other participant
    senderId: raw.type?.user_id ?? undefined,
  };
}

/** Returns a human-readable label for non-text last messages */
function getMediaLabel(type?: string): string {
  if (!type) return '';
  const labels: Record<string, string> = {
    messagePhoto: '🖼 Фото',
    messageVideo: '🎬 Видео',
    messageVideoNote: '⭕ Видеосообщение',
    messageVoiceNote: '🎤 Голосовое',
    messageDocument: '📎 Файл',
    messageSticker: '😊 Стикер',
    messageAnimation: 'GIF',
    messageAudio: '🎵 Аудио',
    messagePoll: '📊 Опрос',
    messageCall: '📞 Звонок',
  };
  return labels[type] ?? '';
}

function parseEntities(formattedText: any): import('../store/types').TextEntity[] | undefined {
  if (!formattedText?.entities?.length) return undefined;
  return formattedText.entities.map((e: any) => ({
    offset: e.offset ?? 0,
    length: e.length ?? 0,
    type: e.type?.['@type'] ?? '',
    url: e.type?.url,
  }));
}

export function parseMessage(raw: any, chatId: number): Message {
  const c = raw.content ?? {};
  const contentType: string = c['@type'] ?? 'messageText';

  let text = '';
  let mediaType: MediaType | undefined;
  let fileId: number | undefined;
  let duration: number | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let caption: string | undefined;
  let entities: import('../store/types').TextEntity[] | undefined;
  let poll: Poll | undefined;

  switch (contentType) {
    case 'messageText':
      text = c.text?.text ?? '';
      entities = parseEntities(c.text);
      break;

    case 'messagePhoto':
      caption = c.caption?.text ?? '';
      text = caption ?? '';
      mediaType = 'photo';
      // Pick largest photo size
      if (c.photo?.sizes?.length) {
        const largest = c.photo.sizes[c.photo.sizes.length - 1];
        fileId = largest?.photo?.id;
      }
      break;

    case 'messageVideo':
      caption = c.caption?.text ?? '';
      text = caption ?? '';
      mediaType = 'video';
      fileId = c.video?.video?.id;
      duration = c.video?.duration;
      fileName = c.video?.file_name;
      fileSize = c.video?.video?.size;
      break;

    case 'messageVideoNote':
      mediaType = 'videoNote';
      fileId = c.video_note?.video?.id;
      duration = c.video_note?.duration;
      break;

    case 'messageVoiceNote':
      mediaType = 'voice';
      fileId = c.voice_note?.voice?.id;
      duration = c.voice_note?.duration;
      break;

    case 'messageAudio':
      caption = c.caption?.text ?? '';
      text = caption || (c.audio?.title ?? c.audio?.file_name ?? '🎵 Аудио');
      mediaType = 'audio';
      fileId = c.audio?.audio?.id;
      duration = c.audio?.duration;
      fileName = c.audio?.file_name;
      fileSize = c.audio?.audio?.size;
      break;

    case 'messageDocument':
      caption = c.caption?.text ?? '';
      text = caption ?? '';
      mediaType = 'document';
      fileId = c.document?.document?.id;
      fileName = c.document?.file_name;
      fileSize = c.document?.document?.size;
      break;

    case 'messageSticker':
      mediaType = 'sticker';
      fileId = c.sticker?.sticker?.id;
      text = c.sticker?.emoji ?? '😊';
      break;

    case 'messageAnimation':
      caption = c.caption?.text ?? '';
      text = caption ?? '';
      mediaType = 'gif';
      fileId = c.animation?.animation?.id;
      duration = c.animation?.duration;
      break;

    case 'messagePoll': {
      const p = c.poll;
      text = `📊 ${p?.question?.text ?? p?.question ?? 'Опрос'}`;
      mediaType = 'poll';
      if (p) {
        poll = {
          id: String(p.id ?? raw.id),
          question: p.question?.text ?? p.question ?? '',
          options: (p.options ?? []).map((o: any) => ({
            text: o.text?.text ?? o.text ?? '',
            voterCount: o.voter_count ?? 0,
            isChosen: o.is_chosen ?? false,
          })),
          totalVoterCount: p.total_voter_count ?? 0,
          isClosed: p.is_closed ?? false,
          isAnonymous: p.is_anonymous ?? true,
          isQuiz: p.type?.['@type'] === 'pollTypeQuiz',
          correctOptionId: p.type?.correct_option_id,
          userSelectedOptions: (p.options ?? [])
            .map((o: any, i: number) => o.is_chosen ? i : -1)
            .filter((i: number) => i >= 0),
        };
      }
      break;
    }

    case 'messageCall':
      text = `📞 ${c.is_video ? 'Видеозвонок' : 'Звонок'}`;
      break;

    case 'messageLocation':
      text = '📍 Местоположение';
      break;

    case 'messageContact':
      text = `👤 ${c.contact?.first_name ?? 'Контакт'}`;
      break;

    case 'messageDice':
      text = `🎲 ${c.emoji ?? 'Кубик'}`;
      break;

    case 'messageGame':
      text = `🎮 ${c.game?.title ?? 'Игра'}`;
      break;

    case 'messageInvoice':
      text = `💳 ${c.title ?? 'Счёт'}`;
      break;

    case 'messageChatAddMembers':
      text = 'Добавлен участник';
      break;

    case 'messageChatDeleteMember':
      text = 'Участник вышел';
      break;

    case 'messageChatChangeTitle':
      text = `Название изменено на "${c.title ?? ''}"`;
      break;

    case 'messageChatChangePhoto':
      text = 'Фото группы изменено';
      break;

    case 'messagePinMessage':
      text = '📌 Сообщение закреплено';
      break;

    case 'messageContactRegistered':
      text = 'Присоединился к Telegram';
      break;

    case 'messageCustomServiceAction':
      text = c.text ?? '';
      break;

    default:
      text = getMediaLabel(contentType) || `[${contentType.replace('message', '')}]`;
  }

  // Sender name: for group/channel messages from users
  let senderName: string | undefined;
  if (!raw.is_outgoing && raw.sender_id) {
    if (raw.sender_id['@type'] === 'messageSenderUser') {
      const uid: number = raw.sender_id.user_id;
      senderName = userNameCache.get(uid);
    }
    // channel sender — leave undefined
  }

  return {
    id: raw.id,
    chatId,
    text,
    caption,
    mediaType,
    fileId,
    duration,
    fileName,
    fileSize,
    entities,
    poll,
    date: raw.date,
    isOutgoing: raw.is_outgoing,
    isDeleted: false,
    senderId: raw.sender_id?.user_id,
    senderName,
    replyToId: raw.reply_to?.message_id,
    editDate: raw.edit_date || undefined,
  };
}

// ── Module-level user name cache (avoids re-render overhead) ──────────────
export const userNameCache = new Map<number, string>();

// ── Hook — call ONCE at the app root ──────────────────────────────────────

export function useTdlibEvents() {
  const { dispatch } = useApp();

  useEffect(() => {
    let cancelled = false;
    const unlisten: Array<() => void> = [];

    async function setup() {
      const fns = await Promise.all([
        // Auth state changes
        listen<any>('td:auth_state', ({ payload }) => {
          dispatch({ type: 'SET_AUTH_STEP', step: parseAuthStep(payload) });
        }),

        // New chat discovered via loadChats
        listen<any>('td:new_chat', ({ payload }) => {
          const chat = payload.chat ?? payload;
          if (chat?.id) dispatch({ type: 'UPSERT_CHAT', chat: parseChat(chat) });
        }),

        // Various chat updates — handle updateChatPosition separately
        listen<any>('td:chat_updated', ({ payload }) => {
          const updateType: string = payload?.['@type'] ?? '';

          if (updateType === 'updateChatPosition') {
            // updateChatPosition contains chat_id + position (single position obj)
            const pos = payload.position;
            if (pos?.chat_list?.['@type'] === 'chatListMain') {
              dispatch({
                type: 'UPDATE_CHAT_POSITION',
                chatId: payload.chat_id,
                order: Number(pos.order ?? 0),
                isPinned: pos.is_pinned ?? false,
              });
            }
            return;
          }

          if (updateType === 'updateChatLastMessage') {
            const lm = payload.last_message;
            if (lm && payload.chat_id) {
              const text = lm.content?.text?.text
                ?? lm.content?.caption?.text
                ?? getMediaLabel(lm.content?.['@type'])
                ?? '';
              dispatch({
                type: 'UPSERT_LAST_MESSAGE',
                chatId: payload.chat_id,
                lastMessage: text,
                lastMessageDate: lm.date,
              });
            }
            // Also update positions if present
            if (payload.positions) {
              const mainPos = (payload.positions as any[]).find(
                (p: any) => p.chat_list?.['@type'] === 'chatListMain'
              );
              if (mainPos) {
                dispatch({
                  type: 'UPDATE_CHAT_POSITION',
                  chatId: payload.chat_id,
                  order: Number(mainPos.order ?? 0),
                  isPinned: mainPos.is_pinned ?? false,
                });
              }
            }
            return;
          }

          if (updateType === 'updateChatReadInbox') {
            dispatch({
              type: 'UPDATE_UNREAD_COUNT',
              chatId: payload.chat_id,
              unreadCount: payload.unread_count ?? 0,
            });
            return;
          }

          // Fallback: full chat object upsert
          const raw = payload.chat ?? payload;
          if (raw?.id) dispatch({ type: 'UPSERT_CHAT', chat: parseChat(raw) });
        }),

        // Response to getChatHistory
        // @extra is { chat_id, from_message_id } — use from_message_id to distinguish
        // initial load (0) from pagination requests (>0)
        listen<any>('td:messages', ({ payload }) => {
          const extra = payload['@extra'];
          const chatId: number = typeof extra === 'object' && extra !== null
            ? (extra.chat_id ?? extra)
            : (extra ?? payload.chat_id);
          const fromMessageId: number = typeof extra === 'object' && extra !== null
            ? (extra.from_message_id ?? 0)
            : 0;
          const msgs: Message[] = (payload.messages ?? []).map((m: any) =>
            parseMessage(m, chatId)
          );
          // TDLib returns messages newest-first; reverse to oldest-first
          msgs.reverse();
          if (fromMessageId > 0) {
            // Pagination: prepend older messages at top
            dispatch({ type: 'PREPEND_MESSAGES', chatId, messages: msgs });
          } else {
            // Initial load: replace
            dispatch({ type: 'SET_MESSAGES', chatId, messages: msgs });
          }
          dispatch({ type: 'SET_MESSAGES_LOADING', loading: false });
        }),

        // Real-time new message
        listen<any>('td:new_message', ({ payload }) => {
          const msg = parseMessage(payload.message, payload.message.chat_id);
          dispatch({ type: 'APPEND_MESSAGE', chatId: msg.chatId, message: msg });
          // Proactively fetch sender info if not cached
          if (msg.senderId && !userNameCache.has(msg.senderId)) {
            invoke('get_user', { userId: msg.senderId }).catch(() => {});
          }
        }),

        // Message content edited
        listen<any>('td:message_updated', ({ payload }) => {
          if (payload.chat_id && payload.message_id) {
            const text = payload.new_content?.text?.text
              ?? payload.new_content?.caption?.text
              ?? getMediaLabel(payload.new_content?.['@type'])
              ?? '';
            dispatch({
              type: 'UPDATE_MESSAGE',
              chatId: payload.chat_id,
              message: {
                id: payload.message_id,
                text,
                editDate: payload.edit_date || undefined,
              },
            });
          }
        }),

        // Deleted messages (Ayugram-style recovery)
        listen<any>('td:deleted_messages', ({ payload }) => {
          const msgs: Message[] = (payload.messages ?? []).map((m: any) => ({
            ...parseMessage(m, payload.chat_id),
            isDeleted: true,
            deletedAt: Date.now(),
          }));
          dispatch({ type: 'ADD_DELETED_MESSAGES', messages: msgs });
        }),

        // Connection state
        listen<any>('td:connection_state', ({ payload }) => {
          const s = payload?.state?.['@type'] ?? '';
          const mapped =
            s === 'connectionStateReady' ? 'connected' :
            s === 'connectionStateConnecting' || s === 'connectionStateConnectingToProxy'
              ? 'connecting' : 'offline';
          dispatch({ type: 'SET_CONNECTION', state: mapped });
        }),

        // File download progress / completion
        listen<any>('td:file', ({ payload }) => {
          const file = payload.file ?? payload;
          if (file?.local?.is_downloading_complete && file.local.path) {
            const localPath = file.local.path as string;
            dispatch({ type: 'UPDATE_MESSAGE_FILE', fileId: file.id, localPath });
            // Also update chat avatars that were waiting on this file
            dispatch({
              type: 'UPDATE_CHAT_PHOTO',
              fileId: file.id,
              photoUrl: convertFileSrc(localPath),
            });
          }
        }),

        // Message send success — replace temp id with real id
        listen<any>('td:message_sent', ({ payload }) => {
          if (payload.old_message_id && payload.message) {
            const msg = parseMessage(payload.message, payload.message.chat_id);
            dispatch({
              type: 'UPDATE_MESSAGE',
              chatId: msg.chatId,
              message: { ...msg, id: msg.id },
            });
          }
        }),

        // Message send failure
        listen<any>('td:message_failed', ({ payload }) => {
          if (payload.old_message_id && payload.chat_id) {
            dispatch({
              type: 'UPDATE_MESSAGE',
              chatId: payload.chat_id,
              message: { id: payload.old_message_id, sendState: 'failed' },
            });
          }
        }),

        // Chat photo updated at runtime
        listen<any>('td:chat_photo_updated', ({ payload }) => {
          const smallPhoto = payload.photo?.small;
          if (!smallPhoto || !payload.chat_id) return;
          if (smallPhoto.local?.is_downloading_complete && smallPhoto.local?.path) {
            dispatch({
              type: 'UPSERT_CHAT',
              chat: { id: payload.chat_id, photoUrl: convertFileSrc(smallPhoto.local.path) } as any,
            });
          } else if (smallPhoto.id) {
            // Store fileId so download pipeline picks it up
            dispatch({
              type: 'UPSERT_CHAT',
              chat: { id: payload.chat_id, photoFileId: smallPhoto.id } as any,
            });
          }
        }),

        // User info updates — cache display names + track online status
        listen<any>('td:user_updated', ({ payload }) => {
          const u = payload.user ?? payload;
          if (!u?.id) return;
          const userId: number = u.id;
          const name = [u.first_name ?? '', u.last_name ?? ''].filter(Boolean).join(' ') || `User ${userId}`;
          userNameCache.set(userId, name);

          // Online/offline status change
          if (payload['@type'] === 'updateUserStatus') {
            const isOnline = payload.status?.['@type'] === 'userStatusOnline';
            dispatch({ type: 'UPDATE_CHAT_ONLINE', userId, isOnline });
          }

          // Resolve senderName in existing messages (for group chats)
          // We don't know which chatId, so we dispatch a name update with the userId
          if (name) {
            dispatch({ type: 'UPDATE_MESSAGE_SENDER_NAME', chatId: -1, senderId: userId, name });
          }
        }),

        // Message reactions updated
        listen<any>('td:message_reactions', ({ payload }) => {
          if (payload.chat_id && payload.message_id) {
            const reactions = (payload.reactions ?? []).map((r: any) => ({
              emoji: r.reaction_type?.emoji ?? r.type?.emoji ?? '',
              count: r.total_count ?? 0,
              isMe: r.is_chosen ?? false,
            }));
            dispatch({
              type: 'UPDATE_MESSAGE_REACTIONS',
              chatId: payload.chat_id,
              messageId: payload.message_id,
              reactions,
            });
          }
        }),
      ]);

      if (cancelled) {
        fns.forEach(fn => fn());
        return;
      }
      unlisten.push(...fns);

      // Ask TDLib for current auth state in case the event fired before listeners were ready
      try {
        await invoke('get_auth_state');
      } catch {
        // Safe to ignore
      }
    }

    setup();
    return () => {
      cancelled = true;
      unlisten.forEach(fn => fn());
    };
  }, [dispatch]);
}
