import { useEffect, useLayoutEffect, useRef, useState, useCallback, type MouseEvent } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useApp } from '../../store/AppContext';
import { useTdlib } from '../../hooks/useTdlib';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ContextMenu } from './ContextMenu';
import { TypingIndicator } from './TypingIndicator';
import { ForwardModal } from './ForwardModal';
import { UserProfile } from '../profile/UserProfile';
import { ChatInfo } from '../profile/ChatInfo';
import { InChatSearch } from '../search/InChatSearch';
import { Avatar } from '../ui/Avatar';
import type { Message } from '../../store/types';
import styles from './ChatView.module.css';

function isSameDay(a: number, b: number) {
  const da = new Date(a * 1000);
  const db = new Date(b * 1000);
  return da.toDateString() === db.toDateString();
}

export function ChatView() {
  const { state, dispatch } = useApp();
  const tdlib = useTdlib();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; message: Message;
  } | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Edit state
  const [editMessage, setEditMessage] = useState<Message | null>(null);

  // Forward modal
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);

  // Profile/info panels
  const [showProfile, setShowProfile] = useState(false);

  // In-chat search
  const [showSearch, setShowSearch] = useState(false);

  // Typing indicators
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination refs
  const loadingOlderRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);
  const wasAtBottomRef = useRef(true);

  const activeChat = state.chats.find(c => c.id === state.activeChatId);
  const messages: Message[] = state.activeChatId
    ? (state.messages[state.activeChatId] ?? [])
    : [];

  // Merge deleted messages
  const deletedForChat = state.deletedMessages.filter(
    m => m.chatId === state.activeChatId
  );
  const allMessages = [...messages];
  for (const dm of deletedForChat) {
    if (!allMessages.find(m => m.id === dm.id)) allMessages.push(dm);
  }
  allMessages.sort((a, b) => a.date - b.date);

  // Preserve scroll position after prepend (runs synchronously before paint)
  useLayoutEffect(() => {
    if (isPrependingRef.current && messagesRef.current) {
      const diff = messagesRef.current.scrollHeight - prevScrollHeightRef.current;
      messagesRef.current.scrollTop = diff;
      isPrependingRef.current = false;
      loadingOlderRef.current = false;
    }
  }, [allMessages.length]);

  // Auto-scroll to bottom only when user is already near the bottom
  useEffect(() => {
    if (wasAtBottomRef.current && !isPrependingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  // Reset scroll tracking on chat change
  useEffect(() => {
    wasAtBottomRef.current = true;
    loadingOlderRef.current = false;
    isPrependingRef.current = false;
  }, [state.activeChatId]);

  // Mark messages as read (respects ghost mode)
  useEffect(() => {
    if (!state.activeChatId || allMessages.length === 0) return;
    const ids = allMessages
      .filter(m => !m.isOutgoing && !m.isDeleted)
      .map(m => m.id);
    if (ids.length) tdlib.viewMessages(state.activeChatId, ids);
  }, [state.activeChatId, allMessages.length]);

  // Ctrl+F keyboard shortcut to toggle in-chat search
  useEffect(() => {
    function onToggleSearch() { setShowSearch(v => !v); }
    window.addEventListener('axiom:toggle-search', onToggleSearch);
    return () => window.removeEventListener('axiom:toggle-search', onToggleSearch);
  }, []);

  // Typing indicator listener
  useEffect(() => {
    if (!state.activeChatId) return;
    const unlisten = listen<any>('td:typing', ({ payload }) => {
      if (payload.chat_id !== state.activeChatId) return;
      const action = payload.action?.['@type'] ?? '';
      if (action === 'chatActionCancel') {
        setTypingNames([]);
        return;
      }
      // Show typing for 5 seconds
      setTypingNames(['Пользователь']); // TODO: resolve user name from cache
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingNames([]), 5000);
    });
    return () => { unlisten.then(fn => fn()); };
  }, [state.activeChatId]);

  // Send typing action when user types
  const handleTyping = useCallback(() => {
    if (state.activeChatId) tdlib.sendChatAction(state.activeChatId);
  }, [state.activeChatId]);

  function handleSend(text: string) {
    if (!state.activeChatId) return;
    if (editMessage) {
      tdlib.editMessage(state.activeChatId, editMessage.id, text);
      dispatch({
        type: 'UPDATE_MESSAGE',
        chatId: state.activeChatId,
        message: { id: editMessage.id, text, editDate: Math.floor(Date.now() / 1000) },
      });
      setEditMessage(null);
    } else {
      tdlib.sendMessage(state.activeChatId, text, replyTo?.id);
      setReplyTo(null);
    }
  }

  async function handleSendPhoto(localPath: string) {
    if (!state.activeChatId) return;
    await tdlib.sendPhoto(state.activeChatId, localPath, '', replyTo?.id);
    setReplyTo(null);
  }

  async function handleSendDocument(localPath: string) {
    if (!state.activeChatId) return;
    await tdlib.sendDocument(state.activeChatId, localPath, '', replyTo?.id);
    setReplyTo(null);
  }

  async function handleSendVideo(localPath: string) {
    if (!state.activeChatId) return;
    await tdlib.sendVideo(state.activeChatId, localPath, '', 0, replyTo?.id);
    setReplyTo(null);
  }

  async function handleSendVideoNote(blob: Blob, duration: number) {
    if (!state.activeChatId) return;
    // Convert blob to a temp file path — in Tauri we'd use writeFile to tmp
    // For now log intent; real implementation needs Tauri fs plugin
    console.log('Video note ready:', blob.size, 'bytes,', duration, 'sec');
    // TODO: write blob to temp file using Tauri fs plugin, then invoke send_video_note
  }

  function handleScroll() {
    const el = messagesRef.current;
    if (!el || !state.activeChatId) return;
    // Track whether user is at bottom (within 100px)
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    // Load older messages when within 80px of the top
    if (
      el.scrollTop < 80 &&
      !loadingOlderRef.current &&
      allMessages.length > 0
    ) {
      loadingOlderRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
      tdlib.getHistory(state.activeChatId, allMessages[0].id, 50);
    }
  }

  function handleReact(messageId: number, emoji: string) {
    if (!state.activeChatId) return;
    const msg = allMessages.find(m => m.id === messageId);
    const existing = msg?.reactions?.find(r => r.emoji === emoji);
    if (existing?.isMe) {
      tdlib.removeMessageReaction(state.activeChatId, messageId, emoji);
    } else {
      tdlib.addMessageReaction(state.activeChatId, messageId, emoji);
    }
  }

  function handleContextMenu(e: MouseEvent, message: Message) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  }

  function handleCopy(message: Message) {
    if (message.text) navigator.clipboard.writeText(message.text);
  }

  function handleDelete(message: Message) {
    if (!state.activeChatId) return;
    tdlib.deleteMessages(state.activeChatId, [message.id], true);
  }

  if (!activeChat) {
    return (
      <div className={styles.empty}>
        <EmptyIcon />
        <p>Выбери чат, чтобы начать общение</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Chat header */}
      <header className={styles.header}>
        <button
          className={styles.avatarBtn}
          onClick={() => setShowProfile(true)}
          aria-label="Профиль"
        >
          <Avatar
            title={activeChat.title}
            photoUrl={activeChat.photoUrl}
            size="sm"
            isOnline={activeChat.isOnline}
          />
        </button>
        <div className={styles.chatInfo}>
          <button className={styles.chatNameBtn} onClick={() => setShowProfile(true)}>
            {activeChat.title}
          </button>
          <span className={styles.chatStatus}>
            {typingNames.length > 0
              ? (typingNames.length === 1 ? `${typingNames[0]} печатает…` : 'печатают…')
              : activeChat.isOnline
                ? 'онлайн'
                : activeChat.unreadCount > 0
                  ? `${activeChat.unreadCount} непрочитанных`
                  : ''}
          </span>
        </div>
        {activeChat.isPinned && (
          <span className={styles.pinnedBadge} title="Закреплён">📌</span>
        )}
        {state.ghostMode && (
          <div className={styles.ghostPill}>
            <GhostEyeIcon />
            Ghost mode
          </div>
        )}
        <button
          className={styles.headerBtn}
          onClick={() => setShowSearch(v => !v)}
          aria-label="Поиск в чате"
          title="Поиск в чате"
        >
          <SearchIconSm />
        </button>
      </header>

      {/* In-chat search bar */}
      {showSearch && state.activeChatId && (
        <InChatSearch
          chatId={state.activeChatId}
          onClose={() => setShowSearch(false)}
          onJumpTo={msgId => {
            const el = document.getElementById(`msg-${msgId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      )}

      {/* Messages */}
      <div
        ref={messagesRef}
        className={styles.messages}
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
        onScroll={handleScroll}
      >
        {state.messagesLoading && allMessages.length === 0 && (
          <div className={styles.loadingMsgs}>Загрузка…</div>
        )}

        {/* Loading indicator while fetching older messages */}
        {loadingOlderRef.current && allMessages.length > 0 && (
          <div className={styles.loadingOlder}>↑ Загрузка…</div>
        )}

        {allMessages.map((msg, i) => {
          const prevMsg = allMessages[i - 1];
          const showDate = !prevMsg || !isSameDay(prevMsg.date, msg.date);
          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              onContextMenu={e => handleContextMenu(e, msg)}
            >
              {showDate && <DateSeparator date={msg.date} />}
              <MessageBubble
                message={msg}
                showSender={activeChat.type !== 'private'}
                onReact={handleReact}
              />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <TypingIndicator names={typingNames} />
      )}

      {/* Input */}
      <MessageInput
        chatId={state.activeChatId}
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editMessage={editMessage}
        onCancelEdit={() => setEditMessage(null)}
        onSendPhoto={handleSendPhoto}
        onSendVideo={handleSendVideo}
        onSendDocument={handleSendDocument}
        onSendVideoNote={handleSendVideoNote}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onClose={() => setContextMenu(null)}
          onReply={() => { setReplyTo(contextMenu.message); setEditMessage(null); }}
          onEdit={contextMenu.message.isOutgoing ? () => setEditMessage(contextMenu.message) : undefined}
          onForward={() => setForwardMsg(contextMenu.message)}
          onDelete={() => handleDelete(contextMenu.message)}
          onCopy={() => handleCopy(contextMenu.message)}
        />
      )}

      {/* Forward Modal */}
      {forwardMsg && state.activeChatId && (
        <ForwardModal
          messageIds={[forwardMsg.id]}
          fromChatId={state.activeChatId}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {/* Profile / ChatInfo panel */}
      {showProfile && activeChat.type === 'private' && activeChat.senderId && (
        <UserProfile
          userId={activeChat.senderId}
          chatId={activeChat.id}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showProfile && (activeChat.type === 'group' || activeChat.type === 'supergroup' || activeChat.type === 'channel') && (
        <ChatInfo
          chat={activeChat}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

function SearchIconSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function GhostEyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
