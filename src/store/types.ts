export type AuthStep =
  | 'loading'
  | 'phoneNumber'
  | 'code'
  | 'password'
  | 'ready'
  | 'error';

export interface Chat {
  id: number;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  lastMessage?: string;
  lastMessageDate?: number;
  unreadCount: number;
  photoUrl?: string;
  isOnline?: boolean;
  isMuted?: boolean;
  /** TDLib position.order — used for sorting (higher = higher in list) */
  order: number;
  isPinned: boolean;
  /** For private chats: the other user's TDLib user ID */
  senderId?: number;
}

export type MediaType =
  | 'photo' | 'video' | 'videoNote' | 'voice'
  | 'document' | 'sticker' | 'gif' | 'audio';

export interface Message {
  id: number;
  chatId: number;
  text: string;
  date: number;
  isOutgoing: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  senderName?: string;
  senderId?: number;
  replyToId?: number;
  /** Set for non-text messages */
  mediaType?: MediaType;
  /** TDLib file id for downloading */
  fileId?: number;
  /** Local path after download */
  localPath?: string;
  /** Duration in seconds (voice/video/videoNote) */
  duration?: number;
  /** File name for documents */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Caption for media messages */
  caption?: string;
  /** Whether message was edited */
  editDate?: number;
}

export interface AppState {
  authStep: AuthStep;
  authError?: string;
  chats: Chat[];
  chatsLoading: boolean;
  activeChatId: number | null;
  messages: Record<number, Message[]>;
  messagesLoading: boolean;
  ghostMode: boolean;
  deletedMessages: Message[];
  connectionState: 'connected' | 'connecting' | 'offline';
}

export type AppAction =
  | { type: 'SET_AUTH_STEP'; step: AuthStep; error?: string }
  | { type: 'SET_CHATS'; chats: Chat[] }
  | { type: 'UPSERT_CHAT'; chat: Chat }
  | { type: 'UPDATE_CHAT_POSITION'; chatId: number; order: number; isPinned: boolean }
  | { type: 'UPSERT_LAST_MESSAGE'; chatId: number; lastMessage: string; lastMessageDate: number }
  | { type: 'UPDATE_UNREAD_COUNT'; chatId: number; unreadCount: number }
  | { type: 'SET_CHATS_LOADING'; loading: boolean }
  | { type: 'SET_ACTIVE_CHAT'; chatId: number | null }
  | { type: 'SET_MESSAGES'; chatId: number; messages: Message[] }
  | { type: 'PREPEND_MESSAGES'; chatId: number; messages: Message[] }
  | { type: 'APPEND_MESSAGE'; chatId: number; message: Message }
  | { type: 'UPDATE_MESSAGE'; chatId: number; message: Partial<Message> & { id: number } }
  | { type: 'SET_MESSAGES_LOADING'; loading: boolean }
  | { type: 'TOGGLE_GHOST_MODE' }
  | { type: 'SET_GHOST_MODE'; enabled: boolean }
  | { type: 'ADD_DELETED_MESSAGES'; messages: Message[] }
  | { type: 'SET_CONNECTION'; state: AppState['connectionState'] };
