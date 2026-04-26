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
  /** TDLib file id for the chat's small photo — set until download completes */
  photoFileId?: number;
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
  | 'document' | 'sticker' | 'gif' | 'audio' | 'poll';

export interface PollOption {
  text: string;
  voterCount: number;
  isChosen: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVoterCount: number;
  isClosed: boolean;
  isAnonymous: boolean;
  isQuiz: boolean;
  correctOptionId?: number;
  userSelectedOptions: number[];
}

export interface Reaction {
  emoji: string;
  count: number;
  /** True if the current user has added this reaction */
  isMe: boolean;
}

export interface TextEntity {
  offset: number;
  length: number;
  type: string;   // e.g. 'textEntityTypeUrl', 'textEntityTypeBold', etc.
  url?: string;   // for textEntityTypeTextUrl
}

export interface Message {
  id: number;
  chatId: number;
  text: string;
  /** TDLib formattedText entities for rich text rendering */
  entities?: TextEntity[];
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
  /** Local path after download completes */
  localPath?: string;
  /** True while TDLib is downloading this file */
  isDownloading?: boolean;
  /** Duration in seconds (voice/video/videoNote) */
  duration?: number;
  /** File name for documents */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Caption for media messages */
  caption?: string;
  /** Poll data when mediaType === 'poll' */
  poll?: Poll;
  /** Whether message was edited */
  editDate?: number;
  /** Send state: undefined = sent, 'pending' = sending, 'failed' = failed */
  sendState?: 'pending' | 'failed';
  /** Emoji reactions on this message */
  reactions?: Reaction[];
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
  /** Fired when a TDLib file finishes downloading — updates localPath across all chats */
  | { type: 'UPDATE_MESSAGE_FILE'; fileId: number; localPath: string }
  /** Fired when a chat's photo file finishes downloading */
  | { type: 'UPDATE_CHAT_PHOTO'; fileId: number; photoUrl: string }
  /** Fired when a user's online status changes */
  | { type: 'UPDATE_CHAT_ONLINE'; userId: number; isOnline: boolean }
  /** Update a message's senderName once user info is available */
  | { type: 'UPDATE_MESSAGE_SENDER_NAME'; chatId: number; senderId: number; name: string }
  /** Fired when TDLib sends updateMessageReactions */
  | { type: 'UPDATE_MESSAGE_REACTIONS'; chatId: number; messageId: number; reactions: Reaction[] }
  | { type: 'SET_MESSAGES_LOADING'; loading: boolean }
  | { type: 'TOGGLE_GHOST_MODE' }
  | { type: 'SET_GHOST_MODE'; enabled: boolean }
  | { type: 'ADD_DELETED_MESSAGES'; messages: Message[] }
  | { type: 'SET_CONNECTION'; state: AppState['connectionState'] };
